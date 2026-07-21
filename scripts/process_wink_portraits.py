#!/usr/bin/env python3
"""Build aligned transparent wink portrait frames and QA composites."""

from __future__ import annotations

import json
import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "closed": ROOT / "assets/masters/portrait_wink_closed.png",
    "open": ROOT / "images/normal.png",
}
SHIPPING = {
    "closed": ROOT / "presentation/assets/pigeon_wink_closed.png",
    "open": ROOT / "presentation/assets/pigeon_wink_open.png",
}
QA = {
    "closed": ROOT / "presentation/assets/qa_wink_closed.png",
    "open": ROOT / "presentation/assets/qa_wink_open.png",
}

# Threshold-15 center scans find the same rim extents in both 1254px sources:
# horizontal x=25..1226 and vertical y=14..1231. The source artwork is a
# subtly tall ellipse, so retain both measured semi-axes instead of clipping
# the top/bottom rim with a strictly circular mask.
CENTER = (625.5, 622.5)
RADII = (601.0, 609.0)
FEATHER_PX = 2.0
TARGET_SIZE = (512, 512)
QA_BACKGROUND = (0xF6, 0xF4, 0xEE, 255)


def center_scan(im: Image.Image, threshold: int = 15) -> dict[str, float | list[int]]:
    rgb = im.convert("RGB")
    cx_probe = round(CENTER[0])
    cy_probe = round(CENTER[1])
    xs = [
        x
        for x in range(rgb.width)
        if max(rgb.getpixel((x, cy_probe))) > threshold
    ]
    ys = [
        y
        for y in range(rgb.height)
        if max(rgb.getpixel((cx_probe, y))) > threshold
    ]
    return {
        "horizontal_extent": [xs[0], xs[-1]],
        "vertical_extent": [ys[0], ys[-1]],
        "center_x": (xs[0] + xs[-1]) / 2,
        "center_y": (ys[0] + ys[-1]) / 2,
        "horizontal_radius": (xs[-1] - xs[0] + 1) / 2,
        "vertical_radius": (ys[-1] - ys[0] + 1) / 2,
    }


def medallion_alpha(size: tuple[int, int]) -> Image.Image:
    width, height = size
    cx, cy = CENTER
    rx, ry = RADII
    alpha = Image.new("L", size)
    pixels = alpha.load()
    for y in range(height):
        dy = (y - cy) / ry
        for x in range(width):
            dx = (x - cx) / rx
            normalized_radius = math.sqrt(dx * dx + dy * dy)
            signed_distance = (normalized_radius - 1.0) * min(rx, ry)
            coverage = (FEATHER_PX / 2 - signed_distance) / FEATHER_PX
            pixels[x, y] = round(255 * max(0.0, min(1.0, coverage)))
    return alpha


def quantize(resized_path: Path, output_path: Path) -> None:
    result = subprocess.run(
        [
            "pngquant",
            "--force",
            "--skip-if-larger",
            "--output",
            str(output_path),
            "256",
            str(resized_path),
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode == 98:
        shutil.copyfile(resized_path, output_path)
    elif result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"pngquant exited {result.returncode}")


def main() -> None:
    for path in [*SHIPPING.values(), *QA.values()]:
        path.parent.mkdir(parents=True, exist_ok=True)

    measurements = {}
    mask = None
    target_mask = None
    resized_paths = {}
    for name, source_path in SOURCES.items():
        with Image.open(source_path) as source:
            rgba = source.convert("RGBA")
            measurements[name] = center_scan(rgba)
            if mask is None:
                mask = medallion_alpha(rgba.size)
                target_mask = mask.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
            if rgba.size != mask.size:
                raise ValueError(f"{source_path} size {rgba.size} does not match shared mask {mask.size}")
            rgba.putalpha(mask)
            resized = rgba.resize(TARGET_SIZE, Image.Resampling.LANCZOS)

        # Normalize every non-opaque edge pixel to the same charcoal rim RGB.
        # This makes the two alpha ramps identical inputs to one shared-palette
        # pngquant pass and prevents frame-to-frame edge sparkle.
        pixels = resized.load()
        scale_x = TARGET_SIZE[0] / rgba.width
        scale_y = TARGET_SIZE[1] / rgba.height
        edge_cx = CENTER[0] * scale_x
        edge_cy = CENTER[1] * scale_y
        edge_rx = RADII[0] * scale_x
        edge_ry = RADII[1] * scale_y
        for y in range(resized.height):
            for x in range(resized.width):
                red, green, blue, alpha = pixels[x, y]
                if alpha == 0:
                    pixels[x, y] = (0, 0, 0, 0)
                    continue
                normalized_radius = math.sqrt(
                    ((x - edge_cx) / edge_rx) ** 2
                    + ((y - edge_cy) / edge_ry) ** 2
                )
                edge_distance = (normalized_radius - 1.0) * min(edge_rx, edge_ry)
                if alpha < 255 or edge_distance > -4.0:
                    pixels[x, y] = (32, 31, 33, alpha)

        temp_path = SHIPPING[name].with_name(f".{SHIPPING[name].stem}-resized.png")
        resized.save(temp_path, format="PNG", optimize=False)
        resized_paths[name] = temp_path

    pair_path = SHIPPING["closed"].with_name(".pigeon-wink-pair-resized.png")
    quantized_pair_path = SHIPPING["closed"].with_name(".pigeon-wink-pair-quantized.png")
    pair = Image.new("RGBA", (TARGET_SIZE[0] * 2, TARGET_SIZE[1]))
    for index, name in enumerate(SOURCES):
        with Image.open(resized_paths[name]) as resized:
            pair.paste(resized, (index * TARGET_SIZE[0], 0))
    pair.save(pair_path, format="PNG", optimize=False)
    quantize(pair_path, quantized_pair_path)

    with Image.open(quantized_pair_path) as quantized_pair:
        transparency = quantized_pair.info.get("transparency")
        for index, name in enumerate(SOURCES):
            frame = quantized_pair.crop(
                (
                    index * TARGET_SIZE[0],
                    0,
                    (index + 1) * TARGET_SIZE[0],
                    TARGET_SIZE[1],
                )
            )
            save_options = {"format": "PNG", "optimize": True}
            if transparency is not None:
                save_options["transparency"] = transparency
            frame.save(SHIPPING[name], **save_options)

    for path in [*resized_paths.values(), pair_path, quantized_pair_path]:
        path.unlink()

    for name in SOURCES:
        with Image.open(SHIPPING[name]) as shipped:
            shipped_rgba = shipped.convert("RGBA")
            background = Image.new("RGBA", TARGET_SIZE, QA_BACKGROUND)
            qa = Image.alpha_composite(background, shipped_rgba).convert("RGB")
            qa.save(QA[name], format="PNG", optimize=True)
            measurements[name]["ship_size"] = list(shipped_rgba.size)
            measurements[name]["corner_alphas"] = {
                "top_left": shipped_rgba.getpixel((0, 0))[3],
                "top_right": shipped_rgba.getpixel((shipped_rgba.width - 1, 0))[3],
                "bottom_left": shipped_rgba.getpixel((0, shipped_rgba.height - 1))[3],
                "bottom_right": shipped_rgba.getpixel(
                    (shipped_rgba.width - 1, shipped_rgba.height - 1)
                )[3],
            }

    closed = measurements["closed"]
    opened = measurements["open"]
    measurements["closed_minus_open_offset"] = {
        "x": closed["center_x"] - opened["center_x"],
        "y": closed["center_y"] - opened["center_y"],
        "horizontal_radius": closed["horizontal_radius"]
        - opened["horizontal_radius"],
        "vertical_radius": closed["vertical_radius"] - opened["vertical_radius"],
    }
    measurements["shared_mask"] = {
        "center": list(CENTER),
        "radii": list(RADII),
        "edge_feather_px_at_master_size": FEATHER_PX,
    }
    print(json.dumps(measurements, indent=2))


if __name__ == "__main__":
    main()
