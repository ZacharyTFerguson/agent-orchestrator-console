#!/usr/bin/env python3
"""Apply all MCP download_file_content base64 to fix corrupt archive files."""
import base64
import json
from pathlib import Path

ROOT = Path("/workspace")
CACHE = ROOT / "scripts" / "drive_b64_cache.json"

BATCH_FILES = [
    ROOT / "scripts" / "mcp_b64_memory.json",
    ROOT / "scripts" / "mcp_b64_other_agents.json",
    ROOT / "scripts" / "mcp_b64_routines.json",
    ROOT / "scripts" / "mcp_b64_skills.json",
    ROOT / "scripts" / "mcp_b64_work.json",
    ROOT / "scripts" / "drive_b64_cache.json",
    ROOT / "scripts" / "b64_batch_skills2.json",
]


def load_all() -> dict:
    entries = {}
    for bf in BATCH_FILES:
        if not bf.exists():
            continue
        data = json.loads(bf.read_text(encoding="utf-8"))
        if isinstance(data, list):
            for e in data:
                entries[e["path"]] = e["content"]
        elif isinstance(data, dict):
            for k, v in data.items():
                if k.startswith("grokbot-archive/"):
                    entries[k] = v
    return entries


def main() -> None:
    entries = load_all()
    cache = {}
    ok = fail = 0
    for path, b64 in sorted(entries.items()):
        dest = ROOT / path
        try:
            data = base64.b64decode(b64)
            if data[:15].startswith(b"<!doctype"):
                raise ValueError("HTML")
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            cache[path] = b64
            print(f"OK {path} ({len(data)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {path}: {e}")
            fail += 1
    CACHE.write_text(json.dumps(cache, indent=2) + "\n", encoding="utf-8")
    print(f"Done: {ok} ok, {fail} fail, {len(entries)} total")


if __name__ == "__main__":
    main()
