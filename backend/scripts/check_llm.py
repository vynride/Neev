"""Live check: does tool calling work on each API shape for both models?

Run once keys are in .env:  uv run python scripts/check_llm.py
Set LLM_API in .env to whichever shape passes.
"""

import asyncio

from app.config import get_settings
from app.llm.client import ChatCompletionsClient, ResponsesClient

TOOL = {
    "name": "get_deadline",
    "description": "Get the delivery deadline for a project.",
    "parameters": {
        "type": "object",
        "properties": {"project_id": {"type": "string"}},
        "required": ["project_id"],
        "additionalProperties": False,
    },
}


async def check(label: str, client, model: str) -> None:
    try:
        first = await client.complete(
            model=model,
            system="Use the tool to answer.",
            messages=[{"role": "user", "content": "When is project p1 due?"}],
            tools=[TOOL],
            effort="low",
        )
        if not first.tool_calls:
            print(f"FAIL {label} {model}: no tool call, text={first.text[:80]!r}")
            return
        call = first.tool_calls[0]
        second = await client.complete(
            model=model,
            system="Use the tool to answer.",
            messages=[
                {"role": "user", "content": "When is project p1 due?"},
                first.as_message(),
                {"role": "tool", "tool_call_id": call.id, "content": "2026-10-03"},
            ],
            tools=[TOOL],
            effort="low",
        )
        print(f"OK   {label} {model}: {second.text[:80]!r}")
    except Exception as exc:  # report every failure mode, this is a diagnostic
        print(f"FAIL {label} {model}: {type(exc).__name__}: {str(exc)[:200]}")


async def main() -> None:
    s = get_settings()
    for label, client in (("responses", ResponsesClient()), ("chat", ChatCompletionsClient())):
        for model in (s.model_fast, s.model_strong):
            await check(label, client, model)
    vecs = await ResponsesClient().embed(["hello"])
    print(f"OK   embeddings dim={len(vecs[0])}")


if __name__ == "__main__":
    asyncio.run(main())
