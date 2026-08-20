#!/usr/bin/env python3
"""Download corrupt archive files via Google Drive MCP and write to disk."""
import base64
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path("/workspace")
CORRUPT = ROOT / "scripts" / "corrupt_files.json"
CACHE = ROOT / "scripts" / "drive_b64_cache.json"


def mcp_download(file_id: str) -> str:
    """Call Google Drive MCP download_file_content via cursor mcp bridge."""
    cmd = [
        "cursor-agent",
        "mcp",
        "call",
        "Google-drive",
        "download_file_content",
        json.dumps({"fileId": file_id}),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(result.stderr or result.stdout)
    data = json.loads(result.stdout)
    return data["content"]


def main() -> None:
    entries = json.loads(CORRUPT.read_text(encoding="utf-8"))
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    ok = fail = 0
    for entry in entries:
        path = entry["path"]
        fid = entry["fileId"]
        dest = ROOT / path
        try:
            if path in cache:
                b64 = cache[path]
            else:
                b64 = mcp_download(fid)
                cache[path] = b64
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(base64.b64decode(b64))
            if dest.read_bytes()[:15].startswith(b"<!doctype"):
                raise RuntimeError("still HTML")
            print(f"OK {path} ({dest.stat().st_size} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {path}: {e}", file=sys.stderr)
            fail += 1
    CACHE.write_text(json.dumps(cache, indent=2) + "\n", encoding="utf-8")
    print(f"Done: {ok} ok, {fail} fail")


if __name__ == "__main__":
    main()
