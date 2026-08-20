#!/usr/bin/env python3
"""Download all missing archive files from file_id_map via base64 cache and write to disk."""
import base64
import json
from pathlib import Path

ROOT = Path("/workspace")
MAP = ROOT / "scripts/file_id_map.json"
CACHE = ROOT / "scripts/drive_b64_cache.json"

# Populated by merge_b64_cache.py during MCP download batches
# Also includes pdi-active-allowlist.txt (not in file_id_map)

EXTRA = {
    "grokbot-archive/Memory & rules/pdi-active-allowlist.txt": "1Y2rkC-5_KNYi5CnGKu6HCCpkpKG0IVud",
}


def main() -> None:
    mapping = json.loads(MAP.read_text())
    mapping.update(EXTRA)
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}

    missing = []
    for rel, _fid in mapping.items():
        p = ROOT / rel
        if p.exists() and p.stat().st_size > 0:
            continue
        b64 = cache.get(rel)
        if not b64:
            missing.append(rel)
            continue
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(base64.b64decode(b64))
        print(f"Wrote {p}")

    if missing:
        print(f"\nStill missing {len(missing)} entries in cache:", file=__import__("sys").stderr)
        for m in missing:
            print(f"  {m}", file=__import__("sys").stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
