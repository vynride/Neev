"""Tools the mentor agent can call, and the record of what each call actually returned.

`ToolContext.seen` collects every ref a tool produced. After the model answers, citations and
resource links that are not in `seen` are dropped, so the model cannot cite what it did not read.
"""

import json
from dataclasses import dataclass, field
from datetime import date

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.search import search_chunks, search_kb
from app.config import get_settings
from app.db.mongo import REPO_MAPS, SESSION_SUMMARIES, get_mongo
from app.ingest import repo
from app.models import StudentScore, Task


@dataclass
class ToolContext:
    db: AsyncSession
    project_id: str
    student_id: str
    seen_code_paths: set[str] = field(default_factory=set)
    seen_refs: set[str] = field(default_factory=set)  # doc, meeting, task and kb refs
    seen_urls: set[str] = field(default_factory=set)
    excerpts: list[dict] = field(default_factory=list)  # kept for mentor tickets
    calls: list[dict] = field(default_factory=list)  # kept for the session log


def _schema(properties: dict) -> dict:
    return {
        "type": "object",
        "properties": properties,
        "required": list(properties),
        "additionalProperties": False,
    }


PROJECT_TOOLS = [
    {
        "name": "search_docs",
        "description": (
            "Search this project's brief, statement of work and client meeting transcripts. "
            "Use for anything about requirements, decisions, deadlines or what the client said."
        ),
        "parameters": _schema({"query": {"type": "string"}}),
    },
    {
        "name": "repo_overview",
        "description": "Architecture summary and file list (with one-line purposes) of the repo.",
        "parameters": _schema({}),
    },
    {
        "name": "list_files",
        "description": "List file paths under a directory of the project's repo. '' for the root.",
        "parameters": _schema({"directory": {"type": "string"}}),
    },
    {
        "name": "read_file",
        "description": "Read a file from the project's repo with line numbers (max 250 lines).",
        "parameters": _schema(
            {
                "path": {"type": "string"},
                "start_line": {"type": "integer"},
                "end_line": {"type": ["integer", "null"]},
            }
        ),
    },
    {
        "name": "grep",
        "description": (
            "Regex search across the project's repo. glob filters files, e.g. '*.jsx'. "
            "Use '*' for all files."
        ),
        "parameters": _schema({"pattern": {"type": "string"}, "glob": {"type": "string"}}),
    },
    {
        "name": "get_tasks",
        "description": "Project tasks with status, assignee, due date and priority.",
        "parameters": _schema({"only_open": {"type": "boolean"}}),
    },
    {
        "name": "search_history",
        "description": "Search summaries of this student's earlier sessions on this project.",
        "parameters": _schema({"query": {"type": "string"}}),
    },
]

GENERAL_TOOLS = [
    {
        "name": "get_student_profile",
        "description": "The student's CodeGuru and Samvad Saathi scores.",
        "parameters": _schema({}),
    },
    {
        "name": "search_knowledge_base",
        "description": "Search answers that mentors have already approved for similar questions.",
        "parameters": _schema({"query": {"type": "string"}}),
    },
    {
        "name": "web_search",
        "description": (
            "Find learning resources (docs, tutorials) on the web. "
            "The only allowed source of URLs in your answer."
        ),
        "parameters": _schema({"query": {"type": "string"}}),
    },
]


def tools_for(scope: str) -> list[dict]:
    return GENERAL_TOOLS + PROJECT_TOOLS if scope == "project_specific" else GENERAL_TOOLS


async def _search_docs(ctx: ToolContext, query: str) -> str:
    chunks = await search_chunks(ctx.db, ctx.project_id, query)
    if not chunks:
        return "No matching passages in the project documents or meetings."
    out = []
    for c in chunks:
        ctx.seen_refs.add(c.ref)
        ctx.excerpts.append({"type": c.source_type, "ref": c.ref, "text": c.text[:600]})
        out.append(f"[ref: {c.ref}] ({c.source_type})\n{c.text}")
    return "\n\n---\n\n".join(out)


async def _repo_overview(ctx: ToolContext) -> str:
    doc = await get_mongo()[REPO_MAPS].find_one({"_id": ctx.project_id})
    if not doc:
        return "The repository has not been mapped yet. Use list_files and read_file."
    listing = "\n".join(f"{f['path']} ({f['lines']} lines): {f['purpose']}" for f in doc["files"])
    return f"{doc['architecture']}\n\n## Files\n{listing}"


def _list_files(ctx: ToolContext, directory: str) -> str:
    paths = repo.list_files(ctx.project_id, directory)
    return "\n".join(paths[:400]) or "No files under that directory."


def _read_file(ctx: ToolContext, path: str, start_line: int = 1, end_line: int | None = None):
    text = repo.read_file(ctx.project_id, path, start_line or 1, end_line)
    clean = path.lstrip("/")
    ctx.seen_code_paths.add(clean)
    ctx.excerpts.append({"type": "code", "ref": f"{clean}:{start_line or 1}", "text": text[:600]})
    return text


def _grep(ctx: ToolContext, pattern: str, glob: str = "*") -> str:
    matches = repo.grep(ctx.project_id, pattern, glob or "*")
    if not matches:
        return "No matches."
    for m in matches:
        ctx.seen_code_paths.add(m["path"])
    return "\n".join(f"{m['path']}:{m['line']}: {m['text']}" for m in matches)


async def _get_tasks(ctx: ToolContext, only_open: bool) -> str:
    stmt = select(Task).where(Task.project_id == ctx.project_id).order_by(Task.due_date)
    tasks = (await ctx.db.execute(stmt)).scalars().all()
    if only_open:
        tasks = [t for t in tasks if t.status != "done"]
    lines = [f"Today is {date.today().isoformat()}."]
    for t in tasks:
        ctx.seen_refs.add(t.id)
        lines.append(
            f"[ref: {t.id}] {t.name} | status: {t.status} | assignee: {t.assignee_id} | "
            f"due: {t.due_date} | priority: {t.priority}\n  {t.description}"
        )
    return "\n".join(lines)


async def _get_student_profile(ctx: ToolContext) -> str:
    score = await ctx.db.get(StudentScore, ctx.student_id)
    if score is None:
        return "No scores on record."
    return json.dumps({"codeguru": score.codeguru, "samvad_saathi": score.samvad_saathi})


async def _search_history(ctx: ToolContext, query: str) -> str:
    cursor = (
        get_mongo()[SESSION_SUMMARIES]
        .find({"student_id": ctx.student_id, "project_id": ctx.project_id})
        .sort("created_at", -1)
        .limit(20)
    )
    words = {w.lower() for w in query.split() if len(w) > 2}
    hits = []
    async for s in cursor:
        text = s.get("summary", "")
        if not words or any(w in text.lower() for w in words):
            hits.append(f"{s['created_at']:%Y-%m-%d}: {text}")
    return "\n\n".join(hits[:5]) or "No earlier sessions match."


async def _search_kb(ctx: ToolContext, query: str) -> str:
    results = await search_kb(ctx.db, query)
    if not results:
        return "No mentor-approved answers match."
    out = []
    for entry, similarity in results:
        ctx.seen_refs.add(entry.id)
        out.append(
            f"[ref: {entry.id}] similarity {similarity:.2f} | {entry.category}\n"
            f"Q: {entry.question}\nMentor's answer: {entry.answer}"
        )
    return "\n\n---\n\n".join(out)


async def _web_search(ctx: ToolContext, query: str) -> str:
    key = get_settings().exa_api_key
    if not key:
        return "Web search is not configured. Do not include any links."
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.exa.ai/search",
            headers={"x-api-key": key},
            json={
                "query": query,
                "numResults": 5,
                "type": "auto",
                "contents": {"highlights": True, "text": {"maxCharacters": 500}},
            },
        )
    if resp.status_code != 200:
        return f"Web search failed ({resp.status_code}). Do not include any links."
    out = []
    for r in resp.json().get("results", []):
        ctx.seen_urls.add(r["url"])
        snippet = " ".join(r.get("highlights") or [])[:300] or (r.get("text") or "")[:300]
        out.append(f"{r.get('title') or r['url']}\n{r['url']}\n{snippet}")
    return "\n\n".join(out) or "No results."


async def run_tool(ctx: ToolContext, name: str, args: dict) -> str:
    try:
        match name:
            case "search_docs":
                result = await _search_docs(ctx, args.get("query", ""))
            case "repo_overview":
                result = await _repo_overview(ctx)
            case "list_files":
                result = _list_files(ctx, args.get("directory", ""))
            case "read_file":
                result = _read_file(
                    ctx, args.get("path", ""), args.get("start_line") or 1, args.get("end_line")
                )
            case "grep":
                result = _grep(ctx, args.get("pattern", ""), args.get("glob") or "*")
            case "get_tasks":
                result = await _get_tasks(ctx, bool(args.get("only_open")))
            case "get_student_profile":
                result = await _get_student_profile(ctx)
            case "search_history":
                result = await _search_history(ctx, args.get("query", ""))
            case "search_knowledge_base":
                result = await _search_kb(ctx, args.get("query", ""))
            case "web_search":
                result = await _web_search(ctx, args.get("query", ""))
            case _:
                result = f"Unknown tool: {name}"
    except (repo.RepoError, OSError, httpx.HTTPError) as exc:
        result = f"Tool error: {exc}"
    ctx.calls.append({"name": name, "args": args, "result_preview": result[:300]})
    return result[:12000]
