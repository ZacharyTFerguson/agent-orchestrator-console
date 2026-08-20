#!/usr/bin/env python3
"""Merge path->base64 entries into drive_b64_cache.json from stdin JSON object."""
import json
import sys
from pathlib import Path

CACHE = Path("/workspace/scripts/drive_b64_cache.json")
cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
new = json.load(sys.stdin)
cache.update(new)
CACHE.write_text(json.dumps(cache, indent=2))
print(f"Cache has {len(cache)} entries")
