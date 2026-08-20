#!/usr/bin/env python3
"""Write all 36 corrupt archive files from MCP download_file_content base64."""
import base64
import json
from pathlib import Path

ROOT = Path("/workspace")
CACHE = ROOT / "scripts" / "drive_b64_cache.json"

# path -> base64 from Google Drive MCP download_file_content
ENTRIES = {}

def load_from_json(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        for e in data:
            ENTRIES[e["path"]] = e["content"]
    elif isinstance(data, dict):
        for k, v in data.items():
            if k.startswith("grokbot-archive/"):
                ENTRIES[k] = v
            elif isinstance(v, str) and len(v) > 100:
                ENTRIES[k] = v

# Load existing partial caches
for p in [
    ROOT / "scripts" / "drive_b64_cache.json",
    ROOT / "scripts" / "b64_batch_skills2.json",
    ROOT / "scripts" / "b64_batch1.json",
    ROOT / "scripts" / "mcp_download_batch1.json",
    ROOT / "scripts" / "mcp_download_batch2.json",
    ROOT / "scripts" / "mcp_download_batch3.json",
    ROOT / "scripts" / "mcp_download_batch4.json",
]:
    if p.exists():
        load_from_json(p)

def write_all() -> tuple[int, int]:
    ok = fail = 0
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    for path, b64 in ENTRIES.items():
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
    return ok, fail

if __name__ == "__main__":
    ok, fail = write_all()
    print(f"Done: {ok} ok, {fail} fail, {len(ENTRIES)} in batch")
