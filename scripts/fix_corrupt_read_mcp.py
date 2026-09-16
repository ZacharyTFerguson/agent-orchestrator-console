#!/usr/bin/env python3
"""Fix corrupt archive files using read_file_content MCP via cursor agent bridge."""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path("/workspace")
CORRUPT = json.loads((ROOT / "scripts" / "corrupt_files.json").read_text())
sys.path.insert(0, str(ROOT / "scripts"))
from decode_drive_content import unescape_drive_markdown


def is_corrupt(path: Path) -> bool:
    if not path.exists():
        return True
    return path.read_bytes()[:15].startswith(b"<!doctype")


def mcp_read(file_id: str) -> str:
    """Call Google Drive MCP read_file_content."""
    # Use cursor's mcp invoke if available
    for cmd in [
        ["cursor", "mcp", "call", "Google-drive", "read_file_content", json.dumps({"fileId": file_id})],
        ["npx", "-y", "@anthropic-ai/mcp-client", "call", "Google-drive", "read_file_content", json.dumps({"fileId": file_id})],
    ]:
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            if r.returncode == 0:
                data = json.loads(r.stdout)
                return data["fileContent"]
        except Exception:
            pass
    raise RuntimeError(f"MCP read failed for {file_id}")


def main() -> None:
    todo = [(e["path"], e["fileId"]) for e in CORRUPT if is_corrupt(ROOT / e["path"])]
    print(f"Corrupt remaining: {len(todo)}")
    ok = fail = 0
    for path, fid in todo:
        dest = ROOT / path
        try:
            content = mcp_read(fid)
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(unescape_drive_markdown(content), encoding="utf-8")
            print(f"OK {path} ({dest.stat().st_size} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {path}: {e}", file=sys.stderr)
            fail += 1
    print(f"Done: {ok} ok, {fail} fail")


if __name__ == "__main__":
    main()
