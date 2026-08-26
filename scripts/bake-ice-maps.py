#!/usr/bin/env python3
"""
Bake the Arctic sea-ice time machine: one map for each year's minimum and each
year's maximum, 1979 to present.

Source: NSIDC Sea Ice Index v4 daily concentration images, rendered over NASA
Blue Marble. This is deliberately the SAME product that produces the extent
numbers in public/data/sea-ice-extent.json, so the map and the chart can never
disagree with each other.

Why bake rather than hotlink:
  - NSIDC sends no CORS headers. An <img> tag would still load, but baking
    means dragging the timeline is instant and a demo cannot be broken by
    someone else's server being slow.
  - The published images carry NSIDC's own chrome — title, colour bar, credit
    text, all black on transparent, which is illegible on a dark interface.
    We crop to the globe disc and render our own labelling and attribution.

Cropping is geometric, not hardcoded: the widest fully-opaque row of the image
is the globe's equator, which gives centre and radius directly. That holds for
both the standard and hi-res renderings without per-size tuning.

Attribution is mandatory and is rendered in the UI:
  Fetterer, F., K. Knowles, W. N. Meier, M. Savoie and A. K. Windnagel.
  Sea Ice Index, Version 4. NSIDC, Boulder, Colorado USA.
"""

from __future__ import annotations

import io
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
EXTENT_JSON = ROOT / "public" / "data" / "sea-ice-extent.json"
OUT_DIR = ROOT / "public" / "ice"

BASE = "https://noaadata.apps.nsidc.org/NOAA/G02135"
MONTHS = ["01_Jan", "02_Feb", "03_Mar", "04_Apr", "05_May", "06_Jun",
          "07_Jul", "08_Aug", "09_Sep", "10_Oct", "11_Nov", "12_Dec"]

# Output size. 640 px keeps each frame around 40 kB while still looking sharp
# at the size the interface displays it, which keeps 90-odd frames to a few
# megabytes rather than a repository nobody wants to clone.
OUTPUT_PX = 640
WEBP_QUALITY = 76

USER_AGENT = "PlanetaryPulse/0.1 (Ocean Warrior prototype)"


def image_url(hemisphere: str, date: str, hires: bool = True) -> str:
    """NSIDC daily concentration image over Blue Marble."""
    year, month, day = date.split("-")
    h = "north" if hemisphere == "north" else "south"
    prefix = "N" if hemisphere == "north" else "S"
    variant = "conc_blmrbl_hires" if hires else "conc_blmrbl"
    name = f"{prefix}_{year}{month}{day}_{variant}_v4.0.png"
    return f"{BASE}/{h}/daily/images/{year}/{MONTHS[int(month) - 1]}/{name}"


def fetch(url: str, attempts: int = 3) -> bytes | None:
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=90) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None  # No image for this date; caller decides.
            time.sleep(1.5 * (attempt + 1))
        except Exception:
            time.sleep(1.5 * (attempt + 1))
    return None


def crop_to_globe(raw: bytes) -> Image.Image:
    """
    Crop NSIDC's rendering down to just the globe.

    The globe is the only wide opaque region in the image; its widest scanline
    is the equator, giving centre-x and radius. Everything else — title, colour
    bar, vertical credit — is narrow text and is excluded by requiring a run of
    at least 30 px.
    """
    image = Image.open(io.BytesIO(raw)).convert("RGBA")
    width, height = image.size
    alpha = image.getchannel("A").load()

    widest_run = (0, 0, 0)  # (length, y, x_start)
    for y in range(height):
        start = None
        for x in range(width):
            opaque = alpha[x, y] > 200
            if opaque and start is None:
                start = x
            elif not opaque and start is not None:
                if x - start > 30 and x - start > widest_run[0]:
                    widest_run = (x - start, y, start)
                start = None
        if start is not None and width - start > 30 and width - start > widest_run[0]:
            widest_run = (width - start, y, start)

    length, cy, x0 = widest_run
    if length == 0:
        raise ValueError("could not locate globe disc")

    radius = length / 2
    cx = x0 + radius

    box = (
        int(round(cx - radius)),
        int(round(cy - radius)),
        int(round(cx + radius)),
        int(round(cy + radius)),
    )
    # The globe can sit slightly outside the canvas; pad rather than shift, so
    # the disc stays centred in the output.
    cropped = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    source_box = (
        max(0, box[0]), max(0, box[1]),
        min(width, box[2]), min(height, box[3]),
    )
    cropped.paste(
        image.crop(source_box),
        (max(0, -box[0]), max(0, -box[1])),
    )
    return cropped.resize((OUTPUT_PX, OUTPUT_PX), Image.LANCZOS)


def main() -> int:
    if not EXTENT_JSON.exists():
        print(f"Missing {EXTENT_JSON}. Run `npm run bake` first.", file=sys.stderr)
        return 1

    extent = json.loads(EXTENT_JSON.read_text())
    hemisphere = sys.argv[1] if len(sys.argv) > 1 else "north"
    data = extent[hemisphere]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    prefix = "n" if hemisphere == "north" else "s"

    frames = []
    for kind, records in (("min", data["annualMinima"]), ("max", data["annualMaxima"])):
        for record in records:
            frames.append((kind, record["year"], record["date"], record["extent"]))

    # Also include the most recent day available, so the timeline ends on now
    # rather than on the last completed year.
    latest = data["latest"]
    frames.append(("latest", int(latest["date"][:4]), latest["date"], latest["extent"]))

    manifest = []
    skipped = []

    for index, (kind, year, date, value) in enumerate(sorted(frames, key=lambda f: f[2]), 1):
        name = f"{prefix}_{kind}_{year}.webp"
        target = OUT_DIR / name

        if not target.exists():
            raw = fetch(image_url(hemisphere, date, hires=True))
            if raw is None:
                raw = fetch(image_url(hemisphere, date, hires=False))
            if raw is None:
                skipped.append((kind, year, date))
                print(f"  [{index}/{len(frames)}] {date} {kind} — no image, skipped")
                continue
            try:
                crop_to_globe(raw).save(target, "WEBP", quality=WEBP_QUALITY, method=6)
            except Exception as error:
                skipped.append((kind, year, date))
                print(f"  [{index}/{len(frames)}] {date} {kind} — {error}")
                continue

        manifest.append({
            "kind": kind,
            "year": year,
            "date": date,
            "extent": value,
            "file": name,
            "sizeKb": round(target.stat().st_size / 1024, 1),
        })
        print(f"  [{index}/{len(frames)}] {date} {kind} {value} M km² → {name}")

    manifest.sort(key=lambda f: (f["date"]))
    (OUT_DIR / f"manifest-{hemisphere}.json").write_text(
        json.dumps(
            {
                "hemisphere": hemisphere,
                "source": extent["source"],
                "imageSource": {
                    "product": "NSIDC Sea Ice Index v4 daily concentration over NASA Blue Marble",
                    "url": "https://nsidc.org/data/g02135/versions/4",
                    "note": (
                        "Images cropped to the globe from NSIDC's published rendering. "
                        "The orange line is the 1981–2010 median ice edge. The grey disc "
                        "at the pole is the area the satellite orbit never observes."
                    ),
                },
                "projection": "NSIDC north polar stereographic (EPSG:3413), rendered orthographically by NSIDC",
                "frames": manifest,
                "skipped": [{"kind": k, "year": y, "date": d} for k, y, d in skipped],
            },
            indent=2,
        )
        + "\n"
    )

    total_kb = sum(f["sizeKb"] for f in manifest)
    print(f"\n{len(manifest)} frames, {total_kb / 1024:.1f} MB total, {len(skipped)} skipped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
