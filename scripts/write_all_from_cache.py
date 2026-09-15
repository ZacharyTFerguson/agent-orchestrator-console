#!/usr/bin/env python3
"""Write all files from drive_b64_cache.json (path -> base64) and text manifest."""
import base64
import json
import sys
from pathlib import Path

ROOT = Path("/workspace")
sys.path.insert(0, str(ROOT / "scripts"))
from decode_drive_content import unescape_drive_markdown, decode_base64_file

B64_CACHE = ROOT / "scripts" / "drive_b64_cache.json"
TEXT_MANIFEST = ROOT / "scripts" / "drive_text_manifest.json"


def main() -> None:
    if B64_CACHE.exists():
        cache = json.loads(B64_CACHE.read_text())
        for rel, b64 in cache.items():
            path = ROOT / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(decode_base64_file(b64))
            print(f"b64: {path}")

    if TEXT_MANIFEST.exists():
        manifest = json.loads(TEXT_MANIFEST.read_text())
        for entry in manifest:
            path = ROOT / entry["path"]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(unescape_drive_markdown(entry["fileContent"]), encoding="utf-8")
            print(f"text: {path}")


if __name__ == "__main__":
    main()
