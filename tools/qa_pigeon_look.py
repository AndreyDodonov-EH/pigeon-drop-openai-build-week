#!/usr/bin/env python3
"""Report alpha integrity, magenta residue, and bbox alignment for pigeon-look frames."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "public/assets/sprites"


def content_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").getbbox()


for frame in range(3):
    look_path = SPRITES / f"pigeon-look-f{frame}.png"
    base_path = SPRITES / f"pigeon-f{frame}.png"
    look = Image.open(look_path).convert("RGBA")
    base = Image.open(base_path).convert("RGBA")

    corners = [
        look.getpixel((0, 0))[3],
        look.getpixel((look.width - 1, 0))[3],
        look.getpixel((0, look.height - 1))[3],
        look.getpixel((look.width - 1, look.height - 1))[3],
    ]
    near_magenta = sum(
        1
        for r, g, b, a in look.getdata()
        if a > 0 and r >= 224 and g <= 40 and b >= 224
    )

    look_bbox = content_bbox(look)
    base_bbox = content_bbox(base)
    if look_bbox is None or base_bbox is None:
        raise RuntimeError(f"Missing opaque content in frame {frame}")

    offset = (
        look_bbox[0] - base_bbox[0],
        look_bbox[1] - base_bbox[1],
        look_bbox[2] - base_bbox[2],
        look_bbox[3] - base_bbox[3],
    )
    print(
        f"f{frame}: corners_alpha={corners}; near_magenta_nonzero={near_magenta}; "
        f"look_bbox={look_bbox}; base_bbox={base_bbox}; "
        f"bbox_edge_offset={offset}"
    )
