#!/usr/bin/env python3
"""Re-download corrupt archive files via Google Drive MCP read_file_content."""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path("/workspace")
MAP = json.loads((ROOT / "scripts" / "file_id_map.json").read_text(encoding="utf-8"))
sys.path.insert(0, str(ROOT / "scripts"))
from decode_drive_content import unescape_drive_markdown


def is_corrupt(path: Path) -> bool:
    if not path.exists():
        return True
    return path.read_bytes()[:15].startswith(b"<!doctype")


def mcp_read(file_id: str) -> str:
    """Invoke MCP read_file_content via cursor-agent MCP bridge if available."""
    # Fallback: use gdrive export with confirm token for small text files
    import urllib.parse
    import urllib.request

    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    with urllib.request.urlopen(url, timeout=120) as resp:
        data = resp.read()
    if data[:15].startswith(b"<!doctype"):
        raise RuntimeError(f"Got HTML for {file_id}, need MCP")
    return data.decode("utf-8")


def main() -> None:
    corrupt = [(p, fid) for p, fid in MAP.items() if is_corrupt(ROOT / p)]
    print(f"Corrupt files: {len(corrupt)}")
    ok = fail = 0
    for path, fid in corrupt:
        dest = ROOT / path
        try:
            content = mcp_read(fid)
        except Exception as e:
            print(f"FAIL {path}: {e}", file=sys.stderr)
            fail += 1
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(content, encoding="utf-8")
        print(f"OK {path} ({dest.stat().st_size} bytes)")
        ok += 1
    print(f"Done: {ok} ok, {fail} fail")


if __name__ == "__main__":
    main()
