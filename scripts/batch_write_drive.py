#!/usr/bin/env python3
"""Write multiple Drive read_file_content results from JSON manifest."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from decode_drive_content import unescape_drive_markdown, decode_base64_file


def main() -> None:
    manifest = json.load(sys.stdin)
    for entry in manifest:
        path = Path(entry["path"])
        path.parent.mkdir(parents=True, exist_ok=True)
        if entry.get("mode") == "download":
            path.write_bytes(decode_base64_file(entry["content"]))
        else:
            path.write_text(unescape_drive_markdown(entry["fileContent"]), encoding="utf-8")
        print(path)


if __name__ == "__main__":
    main()
