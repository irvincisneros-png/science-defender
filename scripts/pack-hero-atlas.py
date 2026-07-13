#!/usr/bin/env python3
"""Extract a chroma-keyed hero master atlas into runtime animation strips."""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path
from statistics import median

from PIL import Image


STATES = ("idle", "walk", "attack", "skill")


def alpha_bbox(image: Image.Image, threshold: int = 8):
    alpha = image.getchannel("A")
    return alpha.point(lambda value: 255 if value > threshold else 0).getbbox()


def visual_centroid_x(image: Image.Image, threshold: int = 24) -> float:
    alpha = image.getchannel("A")
    total = weighted = 0
    for y in range(alpha.height):
        for x in range(alpha.width):
            if alpha.getpixel((x, y)) >= threshold:
                total += 1
                weighted += x
    return weighted / total if total else image.width / 2


def find_idle_centres(atlas: Image.Image, expected: int) -> list[float]:
    """Use the clean idle row to recover the atlas's real pose columns.

    Image generation keeps the requested pose count but may leave unequal outer
    margins, so slicing the full canvas into equal widths can cut a neighbour in
    half. Large connected idle silhouettes are stable column anchors for every
    action row in the same master atlas.
    """
    row_h = round(atlas.height / len(STATES))
    alpha = atlas.crop((0, 0, atlas.width, row_h)).getchannel("A")
    width, height = alpha.size
    pixels = alpha.load()
    seen = bytearray(width * height)
    components: list[tuple[int, float]] = []
    for y in range(height):
        for x in range(width):
            index = y * width + x
            if seen[index] or pixels[x, y] < 64:
                continue
            seen[index] = 1
            queue = deque([(x, y)])
            area = sum_x = 0
            while queue:
                px, py = queue.pop()
                area += 1
                sum_x += px
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if 0 <= nx < width and 0 <= ny < height:
                        neighbour = ny * width + nx
                        if not seen[neighbour] and pixels[nx, ny] >= 64:
                            seen[neighbour] = 1
                            queue.append((nx, ny))
            if area >= width * height * 0.015:
                components.append((area, sum_x / area))
    if len(components) < expected:
        raise SystemExit(f"found only {len(components)} idle pose anchors; expected {expected}")
    return sorted(centre for _, centre in sorted(components, reverse=True)[:expected])


def remove_edge_fragments(frame: Image.Image, threshold: int = 24) -> Image.Image:
    """Drop disconnected spill from the neighbouring generated pose.

    Expanding spell effects sometimes cross the midpoint between atlas poses.
    A clipped neighbour component always touches the crop edge; the hero body
    is the tall central component and is preserved even when its boots touch the
    bottom edge.
    """
    alpha = frame.getchannel("A")
    width, height = alpha.size
    pixels = alpha.load()
    seen = bytearray(width * height)
    components: list[dict] = []
    for y in range(height):
        for x in range(width):
            index = y * width + x
            if seen[index] or pixels[x, y] < threshold:
                continue
            seen[index] = 1
            queue = deque([(x, y)])
            points = []
            min_x = max_x = x
            min_y = max_y = y
            while queue:
                px, py = queue.pop()
                points.append((px, py))
                min_x, max_x = min(min_x, px), max(max_x, px)
                min_y, max_y = min(min_y, py), max(max_y, py)
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if 0 <= nx < width and 0 <= ny < height:
                        neighbour = ny * width + nx
                        if not seen[neighbour] and pixels[nx, ny] >= threshold:
                            seen[neighbour] = 1
                            queue.append((nx, ny))
            components.append({"points": points, "bbox": (min_x, min_y, max_x, max_y)})

    tall = [c for c in components if c["bbox"][3] - c["bbox"][1] >= height * 0.45]
    main = max(tall or components, key=lambda c: len(c["points"]), default=None)
    if not main:
        return frame
    cleaned_alpha = alpha.copy()
    cleaned = cleaned_alpha.load()
    for component in components:
        if component is main:
            continue
        min_x, min_y, max_x, max_y = component["bbox"]
        # Only horizontal edges separate neighbouring atlas poses. Top/bottom
        # components may be boots, raised hands or intentional ground energy.
        touches_edge = min_x <= 1 or max_x >= width - 2
        if touches_edge or len(component["points"]) < 10:
            for px, py in component["points"]:
                cleaned[px, py] = 0
    result = frame.copy()
    result.putalpha(cleaned_alpha)
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--hero", required=True)
    parser.add_argument("--source-cols", required=True, type=int)
    parser.add_argument("--take-cols", type=int, default=8)
    parser.add_argument("--skill-map", help="comma-separated source columns for the skill strip")
    parser.add_argument("--output-dir", type=Path, default=Path("assets/heroes"))
    parser.add_argument("--cell-size", type=int, default=128)
    args = parser.parse_args()

    atlas = Image.open(args.input).convert("RGBA")
    if args.source_cols < args.take_cols:
        raise SystemExit("source atlas has fewer columns than requested output")

    centres = find_idle_centres(atlas, args.source_cols)
    gaps = [b - a for a, b in zip(centres, centres[1:])]
    nominal_w = median(gaps)
    cell_h = atlas.height / len(STATES)
    scale = min((args.cell_size - 4) / nominal_w, (args.cell_size - 4) / cell_h)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    skill_map = [int(value) for value in args.skill_map.split(",")] if args.skill_map else list(range(args.take_cols))
    if len(skill_map) != args.take_cols or any(col < 0 or col >= len(centres) for col in skill_map):
        raise SystemExit("--skill-map must provide one valid source column per output frame")

    for row, state in enumerate(STATES):
        strip = Image.new("RGBA", (args.cell_size * args.take_cols, args.cell_size), (0, 0, 0, 0))
        for output_col in range(args.take_cols):
            col = skill_map[output_col] if state == "skill" else output_col
            left = round((centres[col - 1] + centres[col]) / 2) if col else round(max(0, centres[0] - gaps[0] / 2))
            if col + 1 < len(centres):
                right = round((centres[col] + centres[col + 1]) / 2)
            else:
                right = round(min(atlas.width, centres[col] + gaps[-1] / 2))
            top = round(row * cell_h)
            bottom = round((row + 1) * cell_h)
            frame = atlas.crop((left, top, right, bottom))
            frame = remove_edge_fragments(frame)
            frame = frame.resize(
                (max(1, round(frame.width * scale)), max(1, round(frame.height * scale))),
                Image.Resampling.LANCZOS,
            )
            bbox = alpha_bbox(frame)
            if not bbox:
                raise SystemExit(f"{args.hero} {state} frame {col + 1} is empty")
            # Keep the atlas-authored scale, but normalize the visual footline
            # and horizontal centre so state changes never make the hero jump.
            # Looping locomotion benefits from mass-centred frames. For attack
            # and skill, keep the hero silhouette centred instead so a moving
            # projectile/effect does not pull the body backwards on screen.
            visual_cx = visual_centroid_x(frame) if state in ("idle", "walk") else (bbox[0] + bbox[2]) / 2
            visual_foot = bbox[3]
            x = round(output_col * args.cell_size + args.cell_size / 2 - visual_cx)
            y = round(args.cell_size - 5 - visual_foot)
            strip.alpha_composite(frame, (x, y))

        output = args.output_dir / f"{args.hero}_{state}.png"
        strip.save(output, optimize=True)
        print(f"{output}: {strip.width}x{strip.height}")


if __name__ == "__main__":
    main()
