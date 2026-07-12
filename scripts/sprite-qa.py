#!/usr/bin/env python3
"""Validate six-frame enemy walk strips against the Level 1 art-bible mechanics."""

import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageStat


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="+")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    reports = []
    failures = []

    for raw in args.paths:
        path = Path(raw)
        image = Image.open(path).convert("RGBA")
        report = {"path": str(path), "size": list(image.size), "frames": []}
        if image.size != (384, 64): failures.append(f"{path}: expected 384x64")
        previous = None
        for index in range(6):
            frame = image.crop((index * 64, 0, (index + 1) * 64, 64))
            alpha = frame.getchannel("A")
            bbox = alpha.point(lambda value: 255 if value > 12 else 0).getbbox()
            if not bbox:
                failures.append(f"{path}: frame {index + 1} is empty")
                continue
            width, height = bbox[2] - bbox[0], bbox[3] - bbox[1]
            occupancy = max(width, height) / 64
            baseline = bbox[3] - 1
            corners = [alpha.getpixel((0, 0)), alpha.getpixel((63, 0)), alpha.getpixel((0, 63)), alpha.getpixel((63, 63))]
            if not 0.70 <= occupancy <= 0.85: failures.append(f"{path}: frame {index + 1} occupancy {occupancy:.1%}")
            if max(corners) > 8: failures.append(f"{path}: frame {index + 1} corner is not transparent")
            if not 56 <= baseline <= 59: failures.append(f"{path}: frame {index + 1} baseline {baseline}")
            delta = None
            if previous is not None:
                diff = ImageChops.difference(previous, frame).convert("RGB")
                delta = sum(ImageStat.Stat(diff).mean) / 3
            report["frames"].append({"bbox": list(bbox), "occupancy": round(occupancy, 4), "baseline": baseline, "delta": None if delta is None else round(delta, 2)})
            previous = frame
        if len(report["frames"]) == 6:
            loop = ImageChops.difference(image.crop((0, 0, 64, 64)), image.crop((320, 0, 384, 64))).convert("RGB")
            report["loopDelta"] = round(sum(ImageStat.Stat(loop).mean) / 3, 2)
        reports.append(report)

    if args.json: print(json.dumps({"reports": reports, "failures": failures}, indent=2))
    else:
        for report in reports: print(f"PASS {report['path']}: {len(report['frames'])}/6 frames; loop delta {report.get('loopDelta', 'n/a')}")
        for failure in failures: print(f"FAIL {failure}")
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__":
    main()
