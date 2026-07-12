#!/usr/bin/env python3
"""Pack three tower progression cutouts into deterministic idle/attack strips."""

import argparse
from pathlib import Path
from PIL import Image


def bbox(image):
    return image.getchannel("A").point(lambda value: 255 if value > 12 else 0).getbbox()


def dominant_cutout(image):
    """Discard disconnected neighbour slivers before fitting a generated tier."""
    mask = image.getchannel("A").point(lambda value: 255 if value > 12 else 0)
    active_columns = [bool(mask.crop((x, 0, x + 1, mask.height)).getbbox()) for x in range(mask.width)]
    runs = []
    start = None
    for x, active in enumerate(active_columns + [False]):
        if active and start is None:
            start = x
        elif not active and start is not None:
            runs.append((start, x))
            start = None
    if not runs:
        raise SystemExit("generated tower tier is empty")
    left, right = max(runs, key=lambda run: run[1] - run[0])
    isolated = image.crop((left, 0, right, image.height))
    bounds = bbox(isolated)
    if not bounds:
        raise SystemExit("generated tower tier is empty")
    return isolated.crop(bounds)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--cell-size", type=int, default=64)
    parser.add_argument("--content-size", type=int, default=52)
    args = parser.parse_args()
    source = Image.open(args.input).convert("RGBA")
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    tiers = ["1", "3", "4"]

    for index, tier in enumerate(tiers):
        left, right = round(index * source.width / 3), round((index + 1) * source.width / 3)
        cutout = source.crop((left, 0, right, source.height))
        cutout = dominant_cutout(cutout)
        scale = min(args.content_size / cutout.width, args.content_size / cutout.height)
        cutout = cutout.resize((round(cutout.width * scale), round(cutout.height * scale)), Image.Resampling.LANCZOS)

        for state in ("idle", "attack"):
            sheet = Image.new("RGBA", (args.cell_size * 6, args.cell_size), (0, 0, 0, 0))
            for frame_index in range(6):
                if state == "idle":
                    scale_factor = [1.00, 1.01, 1.02, 1.01, 1.00, 0.99][frame_index]
                    shift_x = 0
                else:
                    scale_factor = [1.00, 1.04, 1.08, 1.05, 1.02, 1.00][frame_index]
                    shift_x = [0, -1, -2, -1, 0, 0][frame_index]
                frame = cutout.resize((round(cutout.width * scale_factor), round(cutout.height * scale_factor)), Image.Resampling.LANCZOS)
                x = frame_index * args.cell_size + (args.cell_size - frame.width) // 2 + shift_x
                y = args.cell_size - 4 - frame.height
                sheet.alpha_composite(frame, (x, y))
            output = out_dir / f"{args.name}_{tier}_{state}.png"
            sheet.save(output, optimize=True)
            print(output)


if __name__ == "__main__":
    main()
