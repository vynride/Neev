"""One interface over the two OpenAI API shapes.

Callers use a neutral message format, close to Chat Completions:

    {"role": "user" | "assistant", "content": str}
    {"role": "assistant", "content": str | None, "tool_calls": [ToolCall, ...]}
    {"role": "tool", "tool_call_id": str, "content": str}

Tools are passed as {"name", "description", "parameters"}. Parameter schemas must be
strict-compatible: additionalProperties false and every property listed in required.

`temperature` is never sent; the GPT-5.6 models reject or ignore it.
"""

import json
from dataclasses import dataclass, field
from typing import Any, Protocol

from openai import AsyncOpenAI

from app.config import get_settings


@dataclass
class ToolCall:
    id: str
    name: str
    arguments: dict[str, Any]


@dataclass
class LLMResult:
    text: str = ""
    tool_calls: list[ToolCall] = field(default_factory=list)

    def as_message(self) -> dict:
        msg: dict[str, Any] = {"role": "assistant", "content": self.text or None}
        if self.tool_calls:
            msg["tool_calls"] = self.tool_calls
        return msg


class LLMClient(Protocol):
    async def complete(
        self,
        *,
        model: str,
        system: str,
        messages: list[dict],
        tools: list[dict] | None = None,
        json_schema: dict | None = None,
        effort: str | None = None,
        max_output_tokens: int = 4000,
    ) -> LLMResult: ...

    async def embed(self, texts: list[str]) -> list[list[float]]: ...


def _parse_args(raw: str | None) -> dict:
    try:
        return json.loads(raw or "{}")
    except json.JSONDecodeError:
        return {}


class _Base:
    def __init__(self) -> None:
        s = get_settings()
        self._client = AsyncOpenAI(api_key=s.openai_api_key, base_url=s.openai_base_url)
        self._embedding_model = s.embedding_model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        out: list[list[float]] = []
        for i in range(0, len(texts), 96):
            resp = await self._client.embeddings.create(
                model=self._embedding_model, input=texts[i : i + 96]
            )
            out.extend(d.embedding for d in resp.data)
        return out


class ResponsesClient(_Base):
    async def complete(
        self,
        *,
        model,
        system,
        messages,
        tools=None,
        json_schema=None,
        effort=None,
        max_output_tokens=4000,
    ) -> LLMResult:
        items: list[dict] = []
        for m in messages:
            if m["role"] == "tool":
                items.append(
                    {
                        "type": "function_call_output",
                        "call_id": m["tool_call_id"],
                        "output": m["content"],
                    }
                )
                continue
            if m.get("content"):
                items.append({"role": m["role"], "content": m["content"]})
            for tc in m.get("tool_calls", []):
                items.append(
                    {
                        "type": "function_call",
                        "call_id": tc.id,
                        "name": tc.name,
                        "arguments": json.dumps(tc.arguments),
                    }
                )

        kwargs: dict[str, Any] = {
            "model": model,
            "instructions": system,
            "input": items,
            "max_output_tokens": max_output_tokens,
            "store": False,
        }
        if tools:
            kwargs["tools"] = [{"type": "function", "strict": True, **t} for t in tools]
        if json_schema:
            kwargs["text"] = {
                "format": {
                    "type": "json_schema",
                    "name": json_schema["name"],
                    "schema": json_schema["schema"],
                    "strict": True,
                }
            }
        if effort:
            kwargs["reasoning"] = {"effort": effort}

        resp = await self._client.responses.create(**kwargs)
        result = LLMResult(text=resp.output_text or "")
        for item in resp.output:
            if item.type == "function_call":
                result.tool_calls.append(
                    ToolCall(id=item.call_id, name=item.name, arguments=_parse_args(item.arguments))
                )
        return result


class ChatCompletionsClient(_Base):
    async def complete(
        self,
        *,
        model,
        system,
        messages,
        tools=None,
        json_schema=None,
        effort=None,
        max_output_tokens=4000,
    ) -> LLMResult:
        chat: list[dict] = [{"role": "system", "content": system}]
        for m in messages:
            if m.get("tool_calls"):
                chat.append(
                    {
                        "role": "assistant",
                        "content": m.get("content"),
                        "tool_calls": [
                            {
                                "id": tc.id,
                                "type": "function",
                                "function": {
                                    "name": tc.name,
                                    "arguments": json.dumps(tc.arguments),
                                },
                            }
                            for tc in m["tool_calls"]
                        ],
                    }
                )
            else:
                chat.append(m)

        kwargs: dict[str, Any] = {
            "model": model,
            "messages": chat,
            "max_completion_tokens": max_output_tokens,
        }
        if tools:
            kwargs["tools"] = [
                {"type": "function", "function": {"strict": True, **t}} for t in tools
            ]
        if json_schema:
            kwargs["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": json_schema["name"],
                    "schema": json_schema["schema"],
                    "strict": True,
                },
            }
        if effort:
            kwargs["reasoning_effort"] = effort

        resp = await self._client.chat.completions.create(**kwargs)
        msg = resp.choices[0].message
        result = LLMResult(text=msg.content or "")
        for tc in msg.tool_calls or []:
            result.tool_calls.append(
                ToolCall(
                    id=tc.id, name=tc.function.name, arguments=_parse_args(tc.function.arguments)
                )
            )
        return result


_llm: LLMClient | None = None


def get_llm() -> LLMClient:
    global _llm
    if _llm is None:
        _llm = ChatCompletionsClient() if get_settings().llm_api == "chat" else ResponsesClient()
    return _llm
