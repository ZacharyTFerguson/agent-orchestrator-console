#!/usr/bin/env python3
"""Decode Google Drive MCP read_file_content output to raw markdown/text."""
import base64
import json
import re
import sys


def unescape_drive_markdown(text: str) -> str:
    """Convert Drive MCP escaped markdown to plain text."""
    # Normalize line endings from MCP format (\\n with optional trailing spaces)
    text = re.sub(r"\\n\s*", "\n", text)
    # Unescape markdown punctuation
    text = re.sub(r"\\([#*`_\[\](){}|\\>])", r"\1", text)
    # Remaining backslash escapes
    text = text.replace("\\<", "<").replace("\\>", ">")
    return text.rstrip() + "\n"


def decode_base64_file(b64: str) -> bytes:
    return base64.b64decode(b64)


def write_from_read_content(path: str, file_content: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(unescape_drive_markdown(file_content))


def write_from_download(path: str, b64: str) -> None:
    with open(path, "wb") as f:
        f.write(decode_base64_file(b64))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: decode_drive_content.py <mode> <path>  (reads JSON from stdin)")
        sys.exit(1)
    mode, path = sys.argv[1], sys.argv[2]
    data = json.load(sys.stdin)
    if mode == "read":
        write_from_read_content(path, data["fileContent"])
    elif mode == "download":
        write_from_download(path, data["content"])
    else:
        raise SystemExit(f"Unknown mode: {mode}")
