#!/usr/bin/env python3
"""Download all files from file_id_map.json via Google Drive MCP and write to disk."""
import base64
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path("/workspace")
MAP = ROOT / "scripts/file_id_map.json"
CACHE = ROOT / "scripts/drive_b64_cache.json"


def load_cache() -> dict:
    if CACHE.exists():
        return json.loads(CACHE.read_text())
    return {}


def save_cache(cache: dict) -> None:
    CACHE.write_text(json.dumps(cache))


def mcp_download(file_id: str) -> str:
    payload = json.dumps({"server": "Google-drive", "toolName": "download_file_content", "arguments": {"fileId": file_id}})
    # Use cursor agent mcp if available; fallback expects pre-populated cache
    raise RuntimeError(f"Missing cached content for {file_id}")


def main() -> None:
    mapping = json.loads(MAP.read_text())
    cache = load_cache()
    missing = []
    for rel, fid in mapping.items():
        path = ROOT / rel
        if path.exists() and path.stat().st_size > 0:
            continue
        b64 = cache.get(rel)
        if not b64:
            missing.append((rel, fid))
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(base64.b64decode(b64))
        print(f"Wrote {path}")

    if missing:
        print(f"Missing {len(missing)} files in cache:", file=sys.stderr)
        for rel, fid in missing:
            print(f"  {rel} -> {fid}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
