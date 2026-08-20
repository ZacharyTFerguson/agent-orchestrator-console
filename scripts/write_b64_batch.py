#!/usr/bin/env python3
"""Write archive files from MCP download_file_content base64 entries."""
import base64
import json
import sys
from pathlib import Path

ROOT = Path("/workspace")
CACHE = ROOT / "scripts" / "drive_b64_cache.json"


def write_entry(path: str, b64: str) -> None:
    dest = ROOT / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    data = base64.b64decode(b64)
    if data[:15].startswith(b"<!doctype"):
        raise ValueError(f"{path}: got HTML")
    dest.write_bytes(data)


def main() -> None:
    entries = json.load(sys.stdin)
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    for e in entries:
        write_entry(e["path"], e["content"])
        cache[e["path"]] = e["content"]
        print(f"OK {e['path']}")
    CACHE.write_text(json.dumps(cache, indent=2) + "\n", encoding="utf-8")
    print(f"Cache: {len(cache)} entries")


if __name__ == "__main__":
    main()
