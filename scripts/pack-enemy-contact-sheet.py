#!/usr/bin/env python3
"""Mechanically pack a 3x2 generated enemy contact sheet into a 384x64 strip.

This script does not draw artwork. It crops the six alpha-isolated illustrated
poses, scales each uniformly, aligns them to a shared output baseline, and packs
them left-to-right.
"""

import argparse
from pathlib import Path
from PIL import Image


def alpha_bbox(frame: Image.Image):
    alpha = frame.getchannel("A")
    return alpha.point(lambda value: 255 if value > 32 else 0).getbbox()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--occupancy", type=float, default=0.78)
    parser.add_argument("--baseline", type=int, default=58)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    output = Image.new("RGBA", (384, 64), (0, 0, 0, 0))
    target_extent = round(64 * args.occupancy)

    for index in range(6):
        col, row = index % 3, index // 3
        left = round(col * source.width / 3)
        right = round((col + 1) * source.width / 3)
        top = round(row * source.height / 2)
        bottom = round((row + 1) * source.height / 2)
        frame = source.crop((left, top, right, bottom))
        # Remove low-alpha chroma remnants before measuring and scaling. These
        # are background-removal artifacts, not generated illustration detail.
        alpha = frame.getchannel("A").point(lambda value: 0 if value <= 32 else value)
        frame.putalpha(alpha)
        bbox = alpha_bbox(frame)
        if not bbox:
            raise SystemExit(f"pose {index + 1} is empty")
        pose = frame.crop(bbox)
        scale = target_extent / max(pose.width, pose.height)
        size = (max(1, round(pose.width * scale)), max(1, round(pose.height * scale)))
        pose = pose.resize(size, Image.Resampling.LANCZOS)
        x = index * 64 + (64 - pose.width) // 2
        y = args.baseline + 1 - pose.height
        output.alpha_composite(pose, (x, y))

    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    output.save(path, optimize=True)


if __name__ == "__main__":
    main()
