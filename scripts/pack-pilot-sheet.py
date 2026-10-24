#!/usr/bin/env python3
"""Pack a magenta-keyed generated sheet (R rows x C poses) into runtime strips.

Style-bible v3 pipeline (docs/style-bible.md):
  * keys flat #FF00FF to alpha and removes magenta fringe;
  * finds each pose by its connected silhouette instead of slicing equal widths;
  * uses ONE scale for every frame of the sheet and one footline/centre per row,
    so a cycle cannot pulse in size (the main defect in the v2 enemy sheets).

Usage:
  pack-pilot-sheet.py --input sheet.png --cols 6 --rows idle,attack --name physics --out-dir assets/pilot
  -> assets/pilot/physics_idle.png, assets/pilot/physics_attack.png  (cols*cell x cell)
"""

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


def key_magenta(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            # Distance from pure magenta: high R and B, low G.
            magenta = min(r, b) - g
            if magenta > 90:
                px[x, y] = (0, 0, 0, 0)
            elif magenta > 35:
                # Fringe: fade out and pull the magenta cast back to neutral.
                alpha = int(255 * (90 - magenta) / 55)
                grey = g
                px[x, y] = (min(r, grey + 40), g, min(b, grey + 40), min(a, alpha))
    return img


def components(alpha: Image.Image, threshold: int = 40):
    w, h = alpha.size
    pix = alpha.load()
    seen = bytearray(w * h)
    found = []
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if seen[i] or pix[x, y] < threshold:
                continue
            seen[i] = 1
            queue = deque([(x, y)])
            pts = []
            while queue:
                px_, py_ = queue.pop()
                pts.append((px_, py_))
                for nx, ny in ((px_ - 1, py_), (px_ + 1, py_), (px_, py_ - 1), (px_, py_ + 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if not seen[j] and pix[nx, ny] >= threshold:
                            seen[j] = 1
                            queue.append((nx, ny))
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            found.append({"n": len(pts), "box": (min(xs), min(ys), max(xs) + 1, max(ys) + 1),
                          "cx": sum(xs) / len(xs)})
    return found


def drop_edge_slivers(frame: Image.Image) -> Image.Image:
    """Clear small parts touching the left/right crop edge (neighbouring-pose spill)."""
    alpha = frame.getchannel("A")
    parts = components(alpha, threshold=8)
    if len(parts) < 2:
        return frame
    biggest = max(p["n"] for p in parts)
    mask = alpha.copy()
    draw = mask.load()
    for p in parts:
        x0, _, x1, _ = p["box"]
        if p["n"] < biggest * 0.08 and (x0 <= 1 or x1 >= frame.width - 1):
            for y in range(p["box"][1], p["box"][3]):
                for x in range(x0, x1):
                    draw[x, y] = 0
    out = frame.copy()
    out.putalpha(mask)
    return out


def pose_boxes(row_img: Image.Image, cols: int):
    """Group connected parts into `cols` poses around the `cols` largest bodies."""
    parts = [c for c in components(row_img.getchannel("A")) if c["n"] >= 12]
    if len(parts) < cols:
        raise SystemExit(f"found {len(parts)} silhouettes, expected {cols}")
    bodies = sorted(sorted(parts, key=lambda c: -c["n"])[:cols], key=lambda c: c["cx"])
    centres = [b["cx"] for b in bodies]
    groups = [[] for _ in range(cols)]
    for part in parts:
        nearest = min(range(cols), key=lambda k: abs(centres[k] - part["cx"]))
        groups[nearest].append(part["box"])
    boxes = []
    for group in groups:
        boxes.append((min(b[0] for b in group), min(b[1] for b in group),
                      max(b[2] for b in group), max(b[3] for b in group)))
    return boxes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--cols", type=int, required=True)
    ap.add_argument("--rows", required=True, help="comma-separated state names, one per sheet row")
    ap.add_argument("--name", required=True)
    ap.add_argument("--out-dir", default="assets/pilot")
    ap.add_argument("--cell", type=int, default=128)
    ap.add_argument("--fill", type=float, default=0.86, help="largest pose fills this share of the cell")
    ap.add_argument("--foot", type=int, default=6, help="px between footline and cell bottom")
    ap.add_argument("--anchor", choices=["mass", "box", "base", "grid"], default="mass")
    ap.add_argument("--split", choices=["auto", "equal"], default="auto",
                    help="equal: slice each row into equal columns (for sheets with detached effects)")
    ap.add_argument("--scale-row", help="size the whole sheet from this row only (effects may clip)")
    ap.add_argument("--map", action="append", default=[],
                    help="state:i,j,... reorder/repeat source columns for one state")
    args = ap.parse_args()

    sheet = key_magenta(Image.open(args.input))
    states = args.rows.split(",")
    row_h = sheet.height / len(states)
    remap = {m.split(":")[0]: [int(v) for v in m.split(":")[1].split(",")] for m in args.map}
    rows = []
    for r, state in enumerate(states):
        row = sheet.crop((0, round(r * row_h), sheet.width, round((r + 1) * row_h)))
        if args.split == "equal":
            col_w = row.width / args.cols
            boxes = []
            for c in range(args.cols):
                cell = row.crop((round(c * col_w), 0, round((c + 1) * col_w), row.height))
                bb = cell.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
                boxes.append((bb[0] + round(c * col_w), bb[1], bb[2] + round(c * col_w), bb[3], (c + 0.5) * col_w) if bb else None)
        else:
            boxes = pose_boxes(row, args.cols)
        if state in remap:
            boxes = [boxes[i] for i in remap[state]]
        rows.append((state, row, boxes))

    sized = [b for state, _, boxes in rows if not args.scale_row or state == args.scale_row for b in boxes if b]
    biggest = max(max(b[2] - b[0], b[3] - b[1]) for b in sized)
    scale = args.cell * args.fill / biggest
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    for state, row, boxes in rows:
        strip = Image.new("RGBA", (args.cell * args.cols, args.cell), (0, 0, 0, 0))
        for i, box in enumerate(boxes):
            frame = drop_edge_slivers(row.crop(box[:4]))
            frame = frame.resize((max(1, round(frame.width * scale)), max(1, round(frame.height * scale))),
                                 Image.Resampling.LANCZOS)
            if args.anchor == "base":
                # Centre on the plinth/feet: the median centre of the widest opaque
                # run in each of the bottom rows. A bolt, swing or stray sliver
                # never moves the body.
                a = frame.getchannel("A").load()
                centres = []
                for y in range(int(frame.height * 0.78), frame.height):
                    best, run_start = (0, 0, 0), None
                    for x in range(frame.width + 1):
                        solid = x < frame.width and a[x, y] > 40
                        if solid and run_start is None:
                            run_start = x
                        elif not solid and run_start is not None:
                            if x - run_start > best[0]:
                                best = (x - run_start, run_start, x)
                            run_start = None
                    if best[0]:
                        centres.append((best[1] + best[2]) / 2)
                cx = sorted(centres)[len(centres) // 2] if centres else frame.width / 2
            elif args.anchor == "mass":
                a = frame.getchannel("A").load()
                tot = wx = 0
                for y in range(frame.height):
                    for x in range(frame.width):
                        if a[x, y] > 40:
                            tot += 1
                            wx += x
                cx = wx / tot if tot else frame.width / 2
            elif args.anchor == "grid" and len(box) > 4:
                # Static props (towers): keep the source column's centre fixed.
                cx = (box[4] - box[0]) * scale
            else:
                cx = frame.width / 2
            # Compose inside the frame's own cell so nothing can spill into a neighbour.
            cell = Image.new("RGBA", (args.cell, args.cell), (0, 0, 0, 0))
            cell.paste(frame, (round(args.cell / 2 - cx), args.cell - args.foot - frame.height), frame)
            strip.alpha_composite(cell, (i * args.cell, 0))
        path = out / f"{args.name}_{state}.png"
        strip.save(path, optimize=True)
        print(f"{path}: {strip.width}x{strip.height} scale={scale:.3f}")


if __name__ == "__main__":
    main()
