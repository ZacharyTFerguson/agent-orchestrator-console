#!/usr/bin/env python3
"""Write Drive files from base64 map: {relative_path: base64_content}."""
import base64
import json
import sys
from pathlib import Path

ROOT = Path("/workspace")


def main() -> None:
    data = json.load(sys.stdin)
    for rel, b64 in data.items():
        path = ROOT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(base64.b64decode(b64))
        print(path)


if __name__ == "__main__":
    main()
