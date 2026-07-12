#!/usr/bin/env python3
"""Mechanically normalize six equally spaced generated poses into a 384x64 strip.

This script performs no artwork generation: it only crops alpha bounds, scales,
centers, and packs already illustrated source poses.
"""

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("output")
    parser.add_argument("--occupancy", type=float, default=0.80)
    parser.add_argument("--baseline", type=int, default=58)
    parser.add_argument("--alpha-threshold", type=int, default=12)
    args = parser.parse_args()

    source = Image.open(args.source).convert("RGBA")
    strip = Image.new("RGBA", (384, 64), (0, 0, 0, 0))
    target_extent = round(64 * args.occupancy)

    for index in range(6):
        left = round(index * source.width / 6)
        right = round((index + 1) * source.width / 6)
        cell = source.crop((left, 0, right, source.height))
        alpha = cell.getchannel("A")
        bbox = alpha.point(lambda value: 255 if value > args.alpha_threshold else 0).getbbox()
        if not bbox:
            raise SystemExit(f"pose {index + 1} has no non-transparent pixels")
        pose = cell.crop(bbox)
        scale = target_extent / max(pose.width, pose.height)
        width = max(1, round(pose.width * scale))
        height = max(1, round(pose.height * scale))
        pose = pose.resize((width, height), Image.Resampling.LANCZOS)
        x = index * 64 + (64 - width) // 2
        y = args.baseline - height + 1
        strip.alpha_composite(pose, (x, y))

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    strip.save(output, optimize=True)


if __name__ == "__main__":
    main()
