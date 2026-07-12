#!/usr/bin/env python3
"""Render the promoted campaign enemy strips into one mechanical QA contact sheet."""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
REGULAR = ["flatearth", "phlogiston", "spontaneous", "maggot", "alchemy", "perpetual",
           "geocentric", "miasma", "caloric", "aether", "vitalism", "humours",
           "creationist", "homunculus", "homunculus_core", "golem", "golem_molten"]
BOSSES = ["boss_geo", "boss_phlog", "boss_aether", "boss_miasma", "boss_entropy"]
KEYS = REGULAR + BOSSES
COLS, CARD_W, CARD_H = 4, 400, 100
ROWS = (len(KEYS) + COLS - 1) // COLS
sheet = Image.new("RGBA", (COLS * CARD_W, ROWS * CARD_H), (15, 24, 21, 255))
draw = ImageDraw.Draw(sheet)

for index, key in enumerate(KEYS):
    x = (index % COLS) * CARD_W
    y = (index // COLS) * CARD_H
    path = ROOT / "assets/enemies/candidates" / f"{key}_walk_v2.png"
    strip = Image.open(path).convert("RGBA")
    if strip.size == (768, 128):
        strip = strip.resize((384, 64), Image.Resampling.LANCZOS)
    draw.rounded_rectangle((x + 4, y + 4, x + CARD_W - 4, y + CARD_H - 4),
                           radius=10, fill=(25, 42, 36, 255), outline=(184, 147, 78, 255), width=2)
    draw.text((x + 12, y + 9), key.replace("_", " ").title(), fill=(238, 226, 194, 255))
    sheet.alpha_composite(strip, (x + 8, y + 30))

out = ROOT / "docs/evidence/enemy-campaign-contact-sheet.png"
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out, optimize=True)
print(out)
