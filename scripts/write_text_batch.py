#!/usr/bin/env python3
"""Write archive files from MCP read_file_content entries (path + fileContent)."""
import json
import sys
from pathlib import Path

ROOT = Path("/workspace")
sys.path.insert(0, str(ROOT / "scripts"))
from decode_drive_content import unescape_drive_markdown

TEXT_MANIFEST = ROOT / "scripts" / "drive_text_manifest.json"


def main() -> None:
    entries = json.load(sys.stdin)
    manifest = json.loads(TEXT_MANIFEST.read_text()) if TEXT_MANIFEST.exists() else []
    existing = {e["path"] for e in manifest}
    for e in entries:
        path = e["path"]
        dest = ROOT / path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(unescape_drive_markdown(e["fileContent"]), encoding="utf-8")
        if dest.read_bytes()[:15].startswith(b"<!doctype"):
            raise SystemExit(f"HTML written for {path}")
        print(f"OK {path} ({dest.stat().st_size} bytes)")
        if path not in existing:
            manifest.append({"path": path, "fileContent": e["fileContent"]})
            existing.add(path)
    TEXT_MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
