#!/usr/bin/env python3
"""Split, normalize, and QA the four-panel skater sprite sheet."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


NAMES = ("ped-6", "ped-6-b", "ped-6-r", "ped-6-rainbow")


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("image has no opaque content")
    return bbox


def clear_near_magenta(image: Image.Image) -> Image.Image:
    """Remove only pixels inside a narrow +/-15% RGB key-color cube."""
    cleaned = image.convert("RGBA")
    pixels = []
    for red, green, blue, alpha in cleaned.getdata():
        if alpha and red >= 217 and green <= 38 and blue >= 217:
            pixels.append((red, green, blue, 0))
        else:
            pixels.append((red, green, blue, alpha))
    cleaned.putdata(pixels)
    return cleaned


def empty_column_runs(image: Image.Image) -> list[tuple[int, int]]:
    alpha = image.getchannel("A")
    occupied = [alpha.crop((x, 0, x + 1, image.height)).getbbox() is not None for x in range(image.width)]
    runs: list[tuple[int, int]] = []
    start = None
    for x, present in enumerate(occupied + [True]):
        if not present and start is None:
            start = x
        elif present and start is not None:
            runs.append((start, x))
            start = None
    return runs


def choose_splits(image: Image.Image) -> list[int]:
    runs = empty_column_runs(image)
    splits: list[int] = []
    for quarter in (1, 2, 3):
        target = image.width * quarter / 4
        candidates = [run for run in runs if run[0] <= target <= run[1]]
        if not candidates:
            candidates = sorted(runs, key=lambda run: min(abs(run[0] - target), abs(run[1] - target)))[:1]
        start, end = candidates[0]
        if min(abs(start - target), abs(end - target)) > image.width * 0.08:
            raise ValueError(f"no content-safe alpha gap near quarter boundary {target:.1f}")
        splits.append((start + end) // 2)
    return splits


def process(keyed: Path, output_dir: Path, scale: float, padding: int) -> dict:
    sheet = clear_near_magenta(Image.open(keyed))
    splits = choose_splits(sheet)
    edges = [0, *splits, sheet.width]
    output_dir.mkdir(parents=True, exist_ok=True)
    panels = []
    for index, name in enumerate(NAMES):
        panel = sheet.crop((edges[index], 0, edges[index + 1], sheet.height))
        source_bbox = alpha_bbox(panel)
        trimmed = panel.crop(source_bbox)
        resized = trimmed.resize(
            (max(1, round(trimmed.width * scale)), max(1, round(trimmed.height * scale))),
            Image.Resampling.LANCZOS,
        )
        framed = Image.new("RGBA", (resized.width + 2 * padding, resized.height + 2 * padding))
        framed.alpha_composite(resized, (padding, padding))
        output = output_dir / f"{name}-big.png"
        framed.save(output)
        panels.append(
            {
                "name": name,
                "source_bbox_within_slice": source_bbox,
                "source_trim_size": trimmed.size,
                "big_size": framed.size,
                "big_path": str(output),
            }
        )
    result = {
        "sheet_size": sheet.size,
        "split_x": splits,
        "scale": scale,
        "padding": padding,
        "panels": panels,
    }
    print(json.dumps(result, indent=2))
    return result


def near_magenta_nonzero(image: Image.Image) -> int:
    # "Within 10% per-channel" means +/- 25.5 from RGB(255, 0, 255).
    count = 0
    for red, green, blue, alpha in image.convert("RGBA").getdata():
        if alpha and red >= 230 and green <= 25 and blue >= 230:
            count += 1
    return count


def qa(paths: list[Path]) -> dict:
    result = {}
    for path in paths:
        image = Image.open(path).convert("RGBA")
        alpha = image.getchannel("A")
        bbox = alpha.getbbox()
        if bbox is None:
            raise ValueError(f"{path} has no opaque content")
        corners = [
            alpha.getpixel((0, 0)),
            alpha.getpixel((image.width - 1, 0)),
            alpha.getpixel((0, image.height - 1)),
            alpha.getpixel((image.width - 1, image.height - 1)),
        ]
        result[path.name] = {
            "size": image.size,
            "content_bbox": bbox,
            "corner_alpha_TL_TR_BL_BR": corners,
            "near_magenta_nonzero_alpha": near_magenta_nonzero(image),
            "head_top_y": bbox[1],
            "lowest_opaque_y": bbox[3] - 1,
        }
    print(json.dumps(result, indent=2))
    return result


def sanitize(source: Path, output: Path) -> None:
    """Clear quantizer-created key-color fringe before a final pngquant pass."""
    image = Image.open(source).convert("RGBA")
    pixels = []
    for red, green, blue, alpha in image.getdata():
        if alpha and red >= 230 and green <= 25 and blue >= 230:
            pixels.append((red, green, blue, 0))
        else:
            pixels.append((red, green, blue, alpha))
    image.putdata(pixels)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output)


def main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    process_parser = subparsers.add_parser("process")
    process_parser.add_argument("keyed", type=Path)
    process_parser.add_argument("output_dir", type=Path)
    process_parser.add_argument("--scale", type=float, required=True)
    process_parser.add_argument("--padding", type=int, default=2)

    qa_parser = subparsers.add_parser("qa")
    qa_parser.add_argument("paths", nargs="+", type=Path)

    sanitize_parser = subparsers.add_parser("sanitize")
    sanitize_parser.add_argument("source", type=Path)
    sanitize_parser.add_argument("output", type=Path)

    args = parser.parse_args()
    if args.command == "process":
        process(args.keyed, args.output_dir, args.scale, args.padding)
    elif args.command == "qa":
        qa(args.paths)
    else:
        sanitize(args.source, args.output)


if __name__ == "__main__":
    main()
