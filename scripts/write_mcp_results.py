#!/usr/bin/env python3
"""Write MCP read_file_content results: {path, fileContent} list from JSON file."""
import json
import sys
from pathlib import Path

ROOT = Path("/workspace")
sys.path.insert(0, str(ROOT / "scripts"))
from decode_drive_content import unescape_drive_markdown


def main() -> None:
    batch_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if batch_path:
        entries = json.loads(batch_path.read_text(encoding="utf-8"))
    else:
        entries = json.load(sys.stdin)
    for entry in entries:
        path = ROOT / entry["path"]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(unescape_drive_markdown(entry["fileContent"]), encoding="utf-8")
        print(f"OK {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
