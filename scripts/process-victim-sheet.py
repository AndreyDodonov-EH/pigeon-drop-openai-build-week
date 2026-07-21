#!/usr/bin/env python3
"""Key, split, resize, compress, and QA a three-panel victim sheet."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image


def empty_column_runs(image: Image.Image) -> list[tuple[int, int]]:
    alpha = image.getchannel("A")
    occupied = [alpha.crop((x, 0, x + 1, image.height)).getbbox() is not None for x in range(image.width)]
    runs: list[tuple[int, int]] = []
    start: int | None = None
    for x, present in enumerate([*occupied, True]):
        if not present and start is None:
            start = x
        elif present and start is not None:
            runs.append((start, x))
            start = None
    return runs


def choose_splits(image: Image.Image) -> list[int]:
    runs = empty_column_runs(image)
    splits: list[int] = []
    for third in (1, 2):
        target = image.width * third / 3
        candidates = sorted(runs, key=lambda run: min(abs(run[0] - target), abs(run[1] - target)))
        if not candidates:
            raise ValueError("keyed sheet has no transparent content gaps")
        start, end = candidates[0]
        if min(abs(start - target), abs(end - target)) > image.width * 0.09:
            raise ValueError(f"no safe gap near third boundary {target:.1f}; nearest is {start}..{end}")
        splits.append((start + end) // 2)
    return splits


def sanitize_magenta(image: Image.Image) -> Image.Image:
    cleaned = image.convert("RGBA")
    pixels = []
    for red, green, blue, alpha in cleaned.getdata():
        if alpha and red >= 230 and green <= 25 and blue >= 230:
            pixels.append((0, 0, 0, 0))
        elif alpha == 0:
            pixels.append((0, 0, 0, 0))
        else:
            pixels.append((red, green, blue, alpha))
    cleaned.putdata(pixels)
    return cleaned


def near_magenta_count(image: Image.Image) -> int:
    return sum(
        1
        for red, green, blue, alpha in image.convert("RGBA").getdata()
        if alpha and red >= 230 and green <= 25 and blue >= 230
    )


def pngquant(source: Path, destination: Path) -> None:
    executable = shutil.which("pngquant")
    if executable is None:
        shutil.copy2(source, destination)
        return
    subprocess.run(
        [executable, "--force", "--skip-if-larger", "--output", str(destination), "256", str(source)],
        check=True,
    )


def make_qa(image: Image.Image, destination: Path, kind: str) -> None:
    canvas_size = (150, 170) if kind == "ped" else (340, 190)
    canvas = Image.new("RGBA", canvas_size, (58, 64, 90, 255))
    x = (canvas.width - image.width) // 2
    y = canvas.height - image.height - 8
    canvas.alpha_composite(image, (x, y))
    canvas.convert("RGB").save(destination)


def process(args: argparse.Namespace) -> dict:
    args.output_dir.mkdir(parents=True, exist_ok=True)
    args.qa_dir.mkdir(parents=True, exist_ok=True)
    names = args.names.split(",")
    if len(names) != 3:
        raise ValueError("--names must contain exactly three comma-separated texture names")

    with tempfile.TemporaryDirectory(prefix="victim-sheet-") as temp_dir:
        temp = Path(temp_dir)
        keyed_path = temp / "keyed.png"
        subprocess.run(
            [
                "convert",
                str(args.master),
                "-fuzz",
                f"{args.fuzz}%",
                "-transparent",
                "#ff00ff",
                "-channel",
                "A",
                "-morphology",
                "Erode",
                "Disk:1",
                "+channel",
                str(keyed_path),
            ],
            check=True,
        )
        sheet = sanitize_magenta(Image.open(keyed_path))
        splits = [int(value) for value in args.splits.split(",")] if args.splits else choose_splits(sheet)
        if len(splits) != 2 or not (0 < splits[0] < splits[1] < sheet.width):
            raise ValueError("--splits must contain two increasing x coordinates inside the sheet")
        edges = [0, *splits, sheet.width]
        panels = []

        for index, name in enumerate(names):
            panel = sheet.crop((edges[index], 0, edges[index + 1], sheet.height))
            bbox = panel.getchannel("A").getbbox()
            if bbox is None:
                raise ValueError(f"{name} panel has no visible content")
            trimmed = panel.crop(bbox)
            resized = trimmed.resize(
                (
                    max(1, round(trimmed.width * args.scale)),
                    max(1, round(trimmed.height * args.scale)),
                ),
                Image.Resampling.LANCZOS,
            )
            framed = Image.new(
                "RGBA",
                (resized.width + args.padding * 2, resized.height + args.padding * 2),
            )
            framed.alpha_composite(resized, (args.padding, args.padding))
            framed = sanitize_magenta(framed)

            unquantized = temp / f"{name}-rgba.png"
            framed.save(unquantized)
            output = args.output_dir / f"{name}.png"
            pngquant(unquantized, output)
            shipped = sanitize_magenta(Image.open(output))
            sanitized = temp / f"{name}-sanitized.png"
            shipped.save(sanitized)
            pngquant(sanitized, output)
            shipped = Image.open(output).convert("RGBA")

            qa_path = args.qa_dir / f"{name}-qa.png"
            make_qa(shipped, qa_path, args.kind)
            alpha = shipped.getchannel("A")
            shipped_bbox = alpha.getbbox()
            corners = [
                alpha.getpixel((0, 0)),
                alpha.getpixel((shipped.width - 1, 0)),
                alpha.getpixel((0, shipped.height - 1)),
                alpha.getpixel((shipped.width - 1, shipped.height - 1)),
            ]
            panels.append(
                {
                    "name": name,
                    "source_bbox_within_slice": bbox,
                    "source_trim_size": trimmed.size,
                    "shipped_size": shipped.size,
                    "content_bbox": shipped_bbox,
                    "corner_alpha_TL_TR_BL_BR": corners,
                    "near_magenta_nonzero_alpha": near_magenta_count(shipped),
                    "lowest_opaque_y": shipped_bbox[3] - 1 if shipped_bbox else None,
                    "output": str(output),
                    "qa": str(qa_path),
                }
            )

    result = {
        "master": str(args.master),
        "master_size": sheet.size,
        "split_x": splits,
        "fuzz_percent": args.fuzz,
        "scale": args.scale,
        "padding": args.padding,
        "panels": panels,
    }
    print(json.dumps(result, indent=2))
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("master", type=Path)
    parser.add_argument("--names", required=True)
    parser.add_argument("--kind", choices=("ped", "car"), required=True)
    parser.add_argument("--scale", type=float, required=True)
    parser.add_argument("--fuzz", type=float, default=12)
    parser.add_argument("--padding", type=int, default=2)
    parser.add_argument("--splits", help="optional two comma-separated manual split x coordinates")
    parser.add_argument("--output-dir", type=Path, default=Path("public/assets/sprites"))
    parser.add_argument("--qa-dir", type=Path, default=Path("assets/masters"))
    process(parser.parse_args())


if __name__ == "__main__":
    main()
