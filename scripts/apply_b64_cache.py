#!/usr/bin/env python3
"""Write corrupt archive files from MCP download_file_content base64 by file ID."""
import base64
import json
from pathlib import Path

ROOT = Path("/workspace")
MAP = json.loads((ROOT / "scripts" / "file_id_map.json").read_text(encoding="utf-8"))
B64_DIR = ROOT / "scripts" / "b64_cache"


def main() -> None:
    id_to_path = {fid: path for path, fid in MAP.items()}
    written = 0
    for b64_file in sorted(B64_DIR.glob("*.b64")):
        fid = b64_file.stem
        path = id_to_path.get(fid)
        if not path:
            print(f"SKIP unknown id {fid}")
            continue
        dest = ROOT / path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(base64.b64decode(b64_file.read_text(encoding="utf-8").strip()))
        print(f"OK {path} ({dest.stat().st_size} bytes)")
        written += 1
    print(f"Wrote {written} files")


if __name__ == "__main__":
    main()
