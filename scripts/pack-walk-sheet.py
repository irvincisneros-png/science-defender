#!/usr/bin/env python3
"""Mechanically pack a six-pose chroma-key source into a 384x64 RGBA walk strip."""

import argparse
from pathlib import Path
from PIL import Image


def alpha_bbox(image, threshold=12):
    alpha = image.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    return alpha.getbbox()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--target", type=int, default=52, help="maximum opaque width/height in each 64px cell")
    parser.add_argument("--baseline", type=int, default=58)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    sheet = Image.new("RGBA", (384, 64), (0, 0, 0, 0))
    measurements = []
    for index in range(6):
        left = round(index * source.width / 6)
        right = round((index + 1) * source.width / 6)
        frame = source.crop((left, 0, right, source.height))
        bbox = alpha_bbox(frame)
        if not bbox:
            raise SystemExit(f"frame {index + 1} has no visible subject")
        frame = frame.crop(bbox)
        scale = min(args.target / frame.width, args.target / frame.height)
        size = (max(1, round(frame.width * scale)), max(1, round(frame.height * scale)))
        frame = frame.resize(size, Image.Resampling.LANCZOS)
        x = index * 64 + (64 - frame.width) // 2
        y = args.baseline - frame.height
        sheet.alpha_composite(frame, (x, y))
        measurements.append((frame.width, frame.height, y + frame.height))

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, optimize=True)
    print(f"Wrote {out} (384x64 RGBA)")
    print("frames:", ", ".join(f"{w}x{h}@{baseline}" for w, h, baseline in measurements))


if __name__ == "__main__":
    main()
