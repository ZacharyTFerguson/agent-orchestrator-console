#!/usr/bin/env python3
"""Write archive files from MCP read_file_content or download_file_content payloads."""
import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from decode_drive_content import unescape_drive_markdown


def apply_read(path: str, file_content: str) -> None:
    dest = ROOT / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(unescape_drive_markdown(file_content), encoding="utf-8")
    print(f"OK read {path} ({dest.stat().st_size} bytes)")


def apply_download(path: str, content_b64: str) -> None:
    dest = ROOT / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(base64.b64decode(content_b64))
    print(f"OK download {path} ({dest.stat().st_size} bytes)")


def main() -> int:
    data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    for entry in data:
        path = entry["path"]
        if "fileContent" in entry:
            apply_read(path, entry["fileContent"])
        elif "content" in entry:
            apply_download(path, entry["content"])
        else:
            print(f"SKIP {path}: no content", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
