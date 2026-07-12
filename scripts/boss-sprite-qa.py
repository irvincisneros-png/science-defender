#!/usr/bin/env python3
"""Validate six-frame 128px boss walk strips."""

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
        if image.size != (768, 128):
            failures.append(f"{path}: expected 768x128")
        previous = None
        for index in range(6):
            frame = image.crop((index * 128, 0, (index + 1) * 128, 128))
            alpha = frame.getchannel("A")
            bbox = alpha.point(lambda value: 255 if value > 12 else 0).getbbox()
            if not bbox:
                failures.append(f"{path}: frame {index + 1} is empty")
                continue
            width, height = bbox[2] - bbox[0], bbox[3] - bbox[1]
            occupancy = max(width, height) / 128
            baseline = bbox[3] - 1
            corners = [
                alpha.getpixel((0, 0)), alpha.getpixel((127, 0)),
                alpha.getpixel((0, 127)), alpha.getpixel((127, 127)),
            ]
            if not 0.70 <= occupancy <= 0.85:
                failures.append(f"{path}: frame {index + 1} occupancy {occupancy:.1%}")
            if max(corners) > 8:
                failures.append(f"{path}: frame {index + 1} corner is not transparent")
            if not 114 <= baseline <= 118:
                failures.append(f"{path}: frame {index + 1} baseline {baseline}")
            delta = None
            if previous is not None:
                diff = ImageChops.difference(previous, frame).convert("RGB")
                delta = sum(ImageStat.Stat(diff).mean) / 3
                if delta < 1:
                    failures.append(f"{path}: frames {index} and {index + 1} barely change ({delta:.2f})")
            report["frames"].append({
                "bbox": list(bbox), "occupancy": round(occupancy, 4),
                "baseline": baseline, "delta": None if delta is None else round(delta, 2),
            })
            previous = frame
        if len(report["frames"]) == 6:
            loop = ImageChops.difference(
                image.crop((0, 0, 128, 128)), image.crop((640, 0, 768, 128))
            ).convert("RGB")
            report["loopDelta"] = round(sum(ImageStat.Stat(loop).mean) / 3, 2)
        reports.append(report)

    if args.json:
        print(json.dumps({"reports": reports, "failures": failures}, indent=2))
    else:
        for report in reports:
            print(f"PASS {report['path']}: {len(report['frames'])}/6 frames; "
                  f"loop delta {report.get('loopDelta', 'n/a')}")
        for failure in failures:
            print(f"FAIL {failure}")
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__":
    main()
