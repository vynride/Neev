"""Clone a project's repo and expose safe, read-only access to its files.

Code is never embedded. The agent reads it through list_files, read_file and grep.
"""

import asyncio
import fnmatch
import hashlib
import re
from dataclasses import dataclass
from pathlib import Path

from app.config import get_settings

SKIP_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage",
    "__pycache__",
    ".venv",
    "venv",
    "vendor",
    ".turbo",
    ".cache",
    "out",
}
SKIP_NAMES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "bun.lockb",
    "poetry.lock",
    "uv.lock",
}
BINARY_EXTS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".svg",
    ".pdf",
    ".zip",
    ".gz",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".mp4",
    ".mp3",
    ".mov",
    ".webm",
    ".avif",
    ".lock",
    ".map",
}
MAX_FILE_BYTES = 200_000
MAX_READ_LINES = 250
MAX_GREP_MATCHES = 40

# SQL dumps can carry real rows between "COPY ... FROM stdin;" and "\."; drop them.
_COPY_BLOCK = re.compile(r"(^COPY .*? FROM stdin;\n).*?(^\\\.$)", re.DOTALL | re.MULTILINE)


@dataclass
class RepoFile:
    path: str  # posix, relative to the repo root
    lines: int
    sha: str


class RepoError(Exception):
    pass


def repo_root(project_id: str) -> Path:
    return (Path(get_settings().repos_dir) / project_id).resolve()


async def _git(*args: str, cwd: Path | None = None) -> str:
    proc = await asyncio.create_subprocess_exec(
        "git",
        *args,
        cwd=cwd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    out, err = await proc.communicate()
    if proc.returncode != 0:
        raise RepoError(err.decode(errors="replace").strip()[-400:])
    return out.decode(errors="replace").strip()


async def sync_repo(project_id: str, repo_url: str, branch: str) -> str:
    """Shallow clone, or fetch and reset if already cloned. Returns the commit sha."""
    root = repo_root(project_id)
    if (root / ".git").exists():
        await _git("fetch", "--depth", "1", "origin", branch, cwd=root)
        await _git("reset", "--hard", "FETCH_HEAD", cwd=root)
    else:
        root.parent.mkdir(parents=True, exist_ok=True)
        await _git("clone", "--depth", "1", "--branch", branch, repo_url, str(root))
    return await _git("rev-parse", "HEAD", cwd=root)


def _sanitize(path: str, text: str) -> str:
    if path.endswith(".sql"):
        return _COPY_BLOCK.sub(r"\1-- data rows removed\n\2", text)
    return text


def _read_text(root: Path, rel: str) -> str:
    return _sanitize(rel, (root / rel).read_text(errors="replace"))


def _resolve(project_id: str, rel: str) -> Path:
    """Resolve a path inside the repo, refusing anything that escapes it."""
    root = repo_root(project_id)
    target = (root / rel.lstrip("/")).resolve()
    if target != root and root not in target.parents:
        raise RepoError("Path is outside the repository")
    return target


def walk_files(project_id: str) -> list[RepoFile]:
    root = repo_root(project_id)
    if not root.exists():
        return []
    files: list[RepoFile] = []
    for path in sorted(root.rglob("*")):
        rel_parts = path.relative_to(root).parts
        if any(part in SKIP_DIRS for part in rel_parts):
            continue
        if not path.is_file() or path.is_symlink():
            continue
        if path.name in SKIP_NAMES or path.suffix.lower() in BINARY_EXTS:
            continue
        # .env.example is useful; a real .env that someone committed is not ours to read
        if path.name.startswith(".env") and not path.name.endswith(".example"):
            continue
        if path.stat().st_size > MAX_FILE_BYTES:
            continue
        rel = path.relative_to(root).as_posix()
        text = _read_text(root, rel)
        files.append(
            RepoFile(
                path=rel,
                lines=text.count("\n") + 1,
                sha=hashlib.sha1(text.encode()).hexdigest(),
            )
        )
    return files


def list_files(project_id: str, directory: str = "") -> list[str]:
    """Paths under a directory, relative to the repo root."""
    prefix = directory.strip("/")
    paths = [f.path for f in walk_files(project_id)]
    if prefix:
        paths = [p for p in paths if p == prefix or p.startswith(prefix + "/")]
    return paths


def read_file(project_id: str, path: str, start_line: int = 1, end_line: int | None = None) -> str:
    """File content with line numbers, capped at MAX_READ_LINES per call."""
    target = _resolve(project_id, path)
    root = repo_root(project_id)
    rel = target.relative_to(root).as_posix()
    if rel not in {f.path for f in walk_files(project_id)}:
        raise RepoError(f"No readable file at {path}")
    lines = _read_text(root, rel).splitlines()
    start = max(1, start_line)
    end = min(len(lines), end_line or start + MAX_READ_LINES - 1, start + MAX_READ_LINES - 1)
    body = "\n".join(f"{n}: {lines[n - 1]}" for n in range(start, end + 1))
    footer = f"\n[{rel}: lines {start}-{end} of {len(lines)}]"
    return body + footer


def grep(project_id: str, pattern: str, glob: str = "*") -> list[dict]:
    """Regex search across the repo. Falls back to a literal search if the regex is invalid."""
    try:
        rx = re.compile(pattern, re.IGNORECASE)
    except re.error:
        rx = re.compile(re.escape(pattern), re.IGNORECASE)
    root = repo_root(project_id)
    matches: list[dict] = []
    for f in walk_files(project_id):
        if not (fnmatch.fnmatch(f.path, glob) or fnmatch.fnmatch(Path(f.path).name, glob)):
            continue
        for n, line in enumerate(_read_text(root, f.path).splitlines(), start=1):
            if rx.search(line):
                matches.append({"path": f.path, "line": n, "text": line.strip()[:200]})
                if len(matches) >= MAX_GREP_MATCHES:
                    return matches
    return matches
