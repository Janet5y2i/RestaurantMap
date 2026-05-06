#!/usr/bin/env python3
"""Scrape restaurant data embedded in the map site's JS bundle.

Usage:
  python3 scrape_restaurants.py
  python3 scrape_restaurants.py --base-url https://service-964114547699.us-west1.run.app
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import ssl
import sys
from pathlib import Path
from urllib.parse import quote, urljoin
from urllib.error import URLError
from urllib.request import Request, urlopen

DEFAULT_BASE_URL = "https://service-964114547699.us-west1.run.app"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


def fetch_text(url: str, timeout: int = 30) -> str:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except (ssl.SSLCertVerificationError, URLError) as exc:
        reason = getattr(exc, "reason", None)
        ssl_error = isinstance(exc, ssl.SSLCertVerificationError) or isinstance(
            reason, ssl.SSLCertVerificationError
        )
        if not ssl_error:
            raise

        # Fallback for local environments missing CA bundle.
        insecure_ctx = ssl._create_unverified_context()
        with urlopen(req, timeout=timeout, context=insecure_ctx) as resp:
            return resp.read().decode("utf-8", errors="replace")


def find_bundle_url(index_html: str, base_url: str) -> str:
    m = re.search(r'<script\s+type="module"[^>]*src="([^"]+)"', index_html)
    if not m:
        raise RuntimeError("Cannot find module JS bundle URL in index HTML.")
    return urljoin(base_url, m.group(1))


def extract_array_source(bundle_js: str) -> str:
    start_token = "Og=["
    end_token = "];function ev"

    start = bundle_js.find(start_token)
    if start < 0:
        raise RuntimeError("Cannot find restaurant array start token (Og=[).")

    end = bundle_js.find(end_token, start)
    if end < 0:
        raise RuntimeError("Cannot find restaurant array end token (];function ev).")

    return bundle_js[start + len("Og=") : end + 1]


def encode_google_maps_query(place: str) -> str:
    # Mirror encodeURIComponent behavior as much as possible.
    return quote(f"{place} Sydney", safe="~()*!.'")


def convert_js_array_to_json_text(js_array: str) -> str:
    # Replace li("...") helper calls used in some googleMapsLink entries.
    def _replace_li(match: re.Match[str]) -> str:
        place = match.group(1)
        url = f"https://www.google.com/maps/search/?api=1&query={encode_google_maps_query(place)}"
        return json.dumps(url, ensure_ascii=False)

    s = re.sub(r'li\("((?:[^"\\]|\\.)*)"\)', _replace_li, js_array)

    # Quote object keys: {id:"..."} -> {"id":"..."}
    s = re.sub(r'([\{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', s)

    return s


def parse_restaurants(bundle_js: str) -> list[dict]:
    js_array = extract_array_source(bundle_js)
    json_text = convert_js_array_to_json_text(js_array)

    try:
        data = json.loads(json_text)
    except json.JSONDecodeError as exc:
        snippet_start = max(0, exc.pos - 120)
        snippet_end = min(len(json_text), exc.pos + 120)
        snippet = json_text[snippet_start:snippet_end]
        raise RuntimeError(
            f"Failed to parse JSON-converted data at pos {exc.pos}: {exc.msg}\n"
            f"Nearby content:\n{snippet}"
        ) from exc

    if not isinstance(data, list):
        raise RuntimeError("Parsed restaurant data is not a list.")

    for row in data:
        type_tag = row.get("type")
        dish_tags = row.get("recommendedDishes") or []
        area_tag = row.get("area")
        tags = []
        if isinstance(type_tag, str) and type_tag:
            tags.append(type_tag)
        if isinstance(area_tag, str) and area_tag:
            tags.append(area_tag)
        if isinstance(dish_tags, list):
            tags.extend([x for x in dish_tags if isinstance(x, str) and x])
        row["tags"] = tags

    return data


def write_json(path: Path, data: list[dict]) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def write_csv(path: Path, data: list[dict]) -> None:
    fields = [
        "id",
        "name",
        "type",
        "area",
        "latitude",
        "longitude",
        "priceRange",
        "summary",
        "description",
        "googleMapsLink",
        "photoUrl",
        "notionLink",
        "recommendedDishes",
        "tags",
    ]

    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()

        for row in data:
            coords = row.get("coordinates") or [None, None]
            lat = coords[0] if isinstance(coords, list) and len(coords) > 0 else None
            lng = coords[1] if isinstance(coords, list) and len(coords) > 1 else None
            writer.writerow(
                {
                    "id": row.get("id", ""),
                    "name": row.get("name", ""),
                    "type": row.get("type", ""),
                    "area": row.get("area", ""),
                    "latitude": lat,
                    "longitude": lng,
                    "priceRange": row.get("priceRange", ""),
                    "summary": row.get("summary", ""),
                    "description": row.get("description", ""),
                    "googleMapsLink": row.get("googleMapsLink", ""),
                    "photoUrl": row.get("photoUrl", ""),
                    "notionLink": row.get("notionLink", ""),
                    "recommendedDishes": " | ".join(row.get("recommendedDishes", []) or []),
                    "tags": " | ".join(row.get("tags", []) or []),
                }
            )


def main() -> int:
    parser = argparse.ArgumentParser(description="Scrape restaurant data from map site JS bundle")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Site base URL")
    parser.add_argument("--json-out", default="restaurants.json", help="Output JSON path")
    parser.add_argument("--csv-out", default="restaurants.csv", help="Output CSV path")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/") + "/"

    index_html = fetch_text(base_url)
    bundle_url = find_bundle_url(index_html, base_url)
    bundle_js = fetch_text(bundle_url)

    data = parse_restaurants(bundle_js)

    json_path = Path(args.json_out)
    csv_path = Path(args.csv_out)

    write_json(json_path, data)
    write_csv(csv_path, data)

    print(f"Bundle URL: {bundle_url}")
    print(f"Records: {len(data)}")
    print(f"JSON: {json_path.resolve()}")
    print(f"CSV: {csv_path.resolve()}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        raise SystemExit(1)
