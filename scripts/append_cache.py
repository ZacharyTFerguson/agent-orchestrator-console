#!/usr/bin/env python3
"""Build drive_b64_cache.json entries from MCP download responses passed on stdin."""
import json
import sys

# stdin: JSON array of {"path": "...", "content": "base64..."}
entries = json.load(sys.stdin)
cache_path = "/workspace/scripts/drive_b64_cache.json"
try:
    cache = json.loads(open(cache_path).read())
except FileNotFoundError:
    cache = {}
for e in entries:
    cache[e["path"]] = e["content"]
open(cache_path, "w").write(json.dumps(cache, indent=2))
print(f"Cache now has {len(cache)} entries")
