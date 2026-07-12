#!/usr/bin/env python3
"""Extract a generated spawn/core pair into deterministic alpha sprites."""

import argparse
from pathlib import Path
from PIL import Image


def alpha_bbox(image):
    return image.getchannel("A").point(lambda value: 255 if value > 12 else 0).getbbox()


def dominant_cutout(image):
    mask = image.getchannel("A").point(lambda value: 255 if value > 12 else 0)
    active_columns = [bool(mask.crop((x, 0, x + 1, mask.height)).getbbox()) for x in range(mask.width)]
    runs, start = [], None
    for x, active in enumerate(active_columns + [False]):
        if active and start is None:
            start = x
        elif not active and start is not None:
            runs.append((start, x))
            start = None
    if not runs:
        raise SystemExit("generated endpoint half is empty")
    left, right = max(runs, key=lambda run: run[1] - run[0])
    isolated = image.crop((left, 0, right, image.height))
    bounds = alpha_bbox(isolated)
    if not bounds:
        raise SystemExit("generated endpoint half is empty")
    return isolated.crop(bounds)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--size", type=int, default=256)
    parser.add_argument("--content-size", type=int, default=236)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    names = ("spawn_rift", "empirical_core")

    for index, name in enumerate(names):
        left = round(index * source.width / 2)
        right = round((index + 1) * source.width / 2)
        cutout = dominant_cutout(source.crop((left, 0, right, source.height)))
        scale = min(args.content_size / cutout.width, args.content_size / cutout.height)
        cutout = cutout.resize(
            (round(cutout.width * scale), round(cutout.height * scale)),
            Image.Resampling.LANCZOS,
        )
        canvas = Image.new("RGBA", (args.size, args.size), (0, 0, 0, 0))
        x = (args.size - cutout.width) // 2
        y = args.size - 6 - cutout.height
        canvas.alpha_composite(cutout, (x, y))
        output = out_dir / f"{name}.png"
        canvas.save(output, optimize=True)
        print(output)


if __name__ == "__main__":
    main()
