#!/usr/bin/env python3
"""Pack three tower progression cutouts into deterministic idle/attack strips."""

import argparse
from pathlib import Path
from PIL import Image


def bbox(image):
    return image.getchannel("A").point(lambda value: 255 if value > 12 else 0).getbbox()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--name", required=True)
    args = parser.parse_args()
    source = Image.open(args.input).convert("RGBA")
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    tiers = ["1", "3", "4"]

    for index, tier in enumerate(tiers):
        left, right = round(index * source.width / 3), round((index + 1) * source.width / 3)
        cutout = source.crop((left, 0, right, source.height))
        bounds = bbox(cutout)
        if not bounds: raise SystemExit(f"tier {tier} is empty")
        cutout = cutout.crop(bounds)
        scale = min(52 / cutout.width, 52 / cutout.height)
        cutout = cutout.resize((round(cutout.width * scale), round(cutout.height * scale)), Image.Resampling.LANCZOS)

        for state in ("idle", "attack"):
            sheet = Image.new("RGBA", (384, 64), (0, 0, 0, 0))
            for frame_index in range(6):
                if state == "idle":
                    scale_factor = [1.00, 1.01, 1.02, 1.01, 1.00, 0.99][frame_index]
                    shift_x = 0
                else:
                    scale_factor = [1.00, 1.04, 1.08, 1.05, 1.02, 1.00][frame_index]
                    shift_x = [0, -1, -2, -1, 0, 0][frame_index]
                frame = cutout.resize((round(cutout.width * scale_factor), round(cutout.height * scale_factor)), Image.Resampling.LANCZOS)
                x = frame_index * 64 + (64 - frame.width) // 2 + shift_x
                y = 58 - frame.height
                sheet.alpha_composite(frame, (x, y))
            output = out_dir / f"{args.name}_{tier}_{state}.png"
            sheet.save(output, optimize=True)
            print(output)


if __name__ == "__main__":
    main()
