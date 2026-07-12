#!/usr/bin/env python3
"""Render all campaign routes and valid build pads over their authored paintings."""

import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
report = json.loads(subprocess.check_output([
    "node", str(ROOT / "scripts/route-report.js"), "--json", "--include-samples"
], cwd=ROOT, text=True))
themes = [row["theme"] for row in report["levels"]]
thumb_w, thumb_h = 360, 220
sheet = Image.new("RGB", (thumb_w * 4, thumb_h * 5), "#07100e")
font = ImageFont.load_default()

for index, row in enumerate(report["levels"]):
    background = Image.open(ROOT / "assets/levels" / f"{themes[index]}.png").convert("RGB")
    background = background.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(background, "RGBA")
    sx, sy = thumb_w / 900, thumb_h / 550
    points = [(x * sx, y * sy) for x, y in row["samples"]]
    draw.line(points, fill=(20, 16, 12, 230), width=14, joint="curve")
    draw.line(points, fill=(234, 204, 139, 245), width=8, joint="curve")
    for x, y in row["pads"]:
        px, py = x * sx, y * sy
        draw.ellipse((px - 6, py - 6, px + 6, py + 6), fill=(31, 100, 73, 235), outline=(244, 222, 165, 255), width=2)
    draw.rectangle((0, 0, thumb_w, 18), fill=(5, 12, 10, 220))
    draw.text((5, 4), f"L{row['level']} {row['theme']}  pads {row['validPads']}  coverage {round(row['unionCoverage']*100)}%", fill="white", font=font)
    sheet.paste(background, ((index % 4) * thumb_w, (index // 4) * thumb_h))

out = ROOT / "docs/evidence/route-contact-sheet.png"
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out, optimize=True)
print(out)
