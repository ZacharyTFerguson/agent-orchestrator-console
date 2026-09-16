#!/usr/bin/env python3
"""Download text files from Google Drive, handling confirm-token HTML pages."""
import json
import re
import sys
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar
from pathlib import Path

ROOT = Path("/workspace")
MAP = json.loads((ROOT / "scripts" / "file_id_map.json").read_text(encoding="utf-8"))


def download_text(file_id: str) -> str:
    cj = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    resp = opener.open(url, timeout=120)
    data = resp.read()

    if not data[:15].startswith(b"<!doctype"):
        return data.decode("utf-8")

    html = data.decode("utf-8", errors="replace")
    m = re.search(r"confirm=([0-9A-Za-z_-]+)", html)
    if not m:
        m = re.search(r'name="confirm"\s+value="([^"]+)"', html)
    if not m:
        m = re.search(r"download_warning[^\"']*confirm=([0-9A-Za-z_-]+)", html)
    if not m:
        raise RuntimeError("Could not find confirm token in Drive HTML")

    confirm = m.group(1)
    url2 = (
        "https://drive.google.com/uc?"
        + urllib.parse.urlencode({"export": "download", "confirm": confirm, "id": file_id})
    )
    resp2 = opener.open(url2, timeout=120)
    data2 = resp2.read()
    if data2[:15].startswith(b"<!doctype"):
        raise RuntimeError("Still got HTML after confirm")
    return data2.decode("utf-8")


def is_corrupt(path: Path) -> bool:
    if not path.exists():
        return True
    return path.read_bytes()[:15].startswith(b"<!doctype")


def main() -> None:
    corrupt = [(p, fid) for p, fid in MAP.items() if is_corrupt(ROOT / p)]
    print(f"Corrupt: {len(corrupt)}")
    ok = fail = 0
    for path, fid in corrupt:
        dest = ROOT / path
        try:
            text = download_text(fid)
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(text, encoding="utf-8")
            print(f"OK {path} ({len(text)} bytes)")
            ok += 1
        except Exception as e:
            print(f"FAIL {path} ({fid}): {e}", file=sys.stderr)
            fail += 1
    print(f"Done: {ok} ok, {fail} fail")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
