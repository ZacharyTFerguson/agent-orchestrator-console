#!/usr/bin/env python3
"""Write Drive MCP read/download results from JSON manifest on stdin."""
import json
import sys
from pathlib import Path

ROOT = Path("/workspace")
sys.path.insert(0, str(ROOT / "scripts"))
from decode_drive_content import unescape_drive_markdown, decode_base64_file


def main() -> None:
    entries = json.load(sys.stdin)
    for entry in entries:
        path = ROOT / entry["path"]
        path.parent.mkdir(parents=True, exist_ok=True)
        if entry.get("mode") == "download":
            path.write_bytes(decode_base64_file(entry["content"]))
        else:
            path.write_text(unescape_drive_markdown(entry["fileContent"]), encoding="utf-8")
        print(path)


if __name__ == "__main__":
    main()
