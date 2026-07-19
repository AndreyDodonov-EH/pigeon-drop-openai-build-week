#!/usr/bin/env python3
"""Build the additive night-light pass for bg-building-2 from its actual palette."""
from datetime import date
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/sprites/bg-building-2.png"
MASTER = ROOT / "assets/masters/bg-building-2-lit.png"
SHIP = ROOT / "public/assets/sprites/bg-building-2-lit.png"
QA = ROOT / "assets/masters/bg-building-2-lit-qa.png"
SOLO_QA = ROOT / "assets/masters/bg-building-2-lit-solo-qa.png"
TRACE_QA = ROOT / "assets/masters/bg-building-2-lit-upper-trace-qa.png"

W, H = 281, 359


def roi_mask(boxes):
    mask = Image.new("L", (W, H))
    draw = ImageDraw.Draw(mask)
    for box in boxes:
        draw.rectangle(box, fill=255)
    return mask


def tint_layer(alpha, rgb):
    out = Image.new("RGBA", (W, H), rgb + (0,))
    out.putalpha(alpha)
    return out


UPPER_PANE_POLYGONS = [
    [(74, 151), (74, 112), (77, 107), (82, 104),
     (87, 105), (92, 109), (92, 113), (92, 151)],
    [(124, 148), (124, 108), (127, 103), (133, 99),
     (139, 98), (145, 103), (145, 108), (145, 148)],
    [(185, 149), (186, 106), (187, 102), (191, 100),
     (197, 101), (200, 106), (201, 110), (200, 150)],
    [(229, 153), (230, 115), (231, 111), (234, 109),
     (238, 110), (241, 114), (241, 117), (240, 153)],
]


def arched_panes():
    """One-pixel-inset pane polygons hand-traced from the upper-window glass."""
    panes = []
    for polygon in UPPER_PANE_POLYGONS:
        pane = Image.new("L", (W, H))
        draw = ImageDraw.Draw(pane)
        draw.polygon(polygon, fill=255)
        panes.append(pane)
    return UPPER_PANE_POLYGONS, panes


def rectangular_panes(boxes):
    """One-pixel-inset glass rectangles, kept separate for QA/counting."""
    return [roi_mask([box]) for box in boxes]


def add_rgba(dst, src):
    """ADD blend src over dst, honoring source alpha (as Phaser ADD does)."""
    d = dst.load(); s = src.load()
    for y in range(H):
        for x in range(W):
            sr, sg, sb, sa = s[x, y]
            if sa:
                dr, dg, db, da = d[x, y]
                a = sa / 255.0
                d[x, y] = (min(255, round(dr + sr*a)), min(255, round(dg + sg*a)),
                            min(255, round(db + sb*a)), max(da, sa))
    return dst


def main():
    base = Image.open(SOURCE).convert("RGBA")
    assert base.size == (W, H), base.size
    px = base.load()

    # Upper panes are hand-traced one pixel inside the painted stone/wood frames.
    upper_polygons, upper_panes = arched_panes()
    # Full interiors of the three ground-floor glass regions. The first encompasses
    # both subpanes of the left display, including the third pendant's glass behind it.
    store_rois = [(53, 261, 143, 320), (178, 264, 199, 320), (220, 264, 251, 320)]
    store_panes = rectangular_panes(store_rois)
    upper_roi = ImageChops.lighter(ImageChops.lighter(upper_panes[0], upper_panes[1]),
                                   ImageChops.lighter(upper_panes[2], upper_panes[3]))
    store_roi = ImageChops.lighter(ImageChops.lighter(store_panes[0], store_panes[1]), store_panes[2])
    interior_dark = Image.new("L", (W, H))
    detail = interior_dark.load(); sr = store_roi.load()

    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if not a:
                continue
            # Dark shelves/pastries/counter items receive less glow, never no glow.
            # The full pane below remains continuous and this is blurred before use.
            if sr[x, y] and max(r, g, b) < 72:
                detail[x, y] = 255

    # Whole, inset panes have no threshold holes/notches. Their only variation is a
    # soft 2px detail attenuation: 100% glow normally, 60% over the darkest interiors.
    ground = store_roi
    interior_dark = ImageChops.multiply(interior_dark.filter(ImageFilter.GaussianBlur(2)), store_roi)
    detail_modulation = interior_dark.point(lambda v: 255 - round(v * .40))
    # Storefront is intentionally 43% below the first pass.  Upper panes are now a
    # clearly readable 75--80% of that reduced reference, varied window by window.
    upper_levels = [78, 82, 76, 80]
    upper_core = Image.new("L", (W, H))
    for pane, level in zip(upper_panes, upper_levels):
        upper_core = ImageChops.lighter(upper_core, pane.point(lambda v, k=level: v * k // 255))
    ground_core = ImageChops.multiply(ground.point(lambda v: v * 102 // 255), detail_modulation)
    core = ImageChops.lighter(upper_core, ground_core)

    # Preserve the storefront's established 2 px / 7 px bloom. Upper-window bloom is
    # faint and clipped to a strict two-pixel expansion of the hand-traced panes.
    ground_tight = ground_core.filter(ImageFilter.GaussianBlur(2)).point(lambda v: v * 115 // 255)
    ground_wide = ground_core.filter(ImageFilter.GaussianBlur(7)).point(lambda v: v * 38 // 255)
    upper_allowed = upper_roi.filter(ImageFilter.MaxFilter(5))
    upper_tight = ImageChops.multiply(
        upper_core.filter(ImageFilter.GaussianBlur(2)).point(lambda v: v * 115 // 255),
        upper_allowed,
    )
    tight = ImageChops.lighter(ground_tight, upper_tight)
    wide = ground_wide
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    overlay = Image.alpha_composite(overlay, tint_layer(wide, (255, 154, 69)))
    overlay = Image.alpha_composite(overlay, tint_layer(tight, (255, 154, 69)))
    # Saturated amber tints the underlying interior rather than washing it to white.
    overlay = Image.alpha_composite(overlay, tint_layer(core, (255, 200, 120)))

    # Lamp positions are found in the storefront's brightest warm-dot band (y 270--282).
    # Their soft radial bulbs make the three hanging pendants read through the awning.
    lamps = [(71, 276), (98, 277), (133, 276)]
    lamp_alpha = Image.new("L", (W, H))
    lpx = lamp_alpha.load()
    for cx, cy in lamps:
        for y in range(max(0, cy-9), min(H, cy+10)):
            for x in range(max(0, cx-9), min(W, cx+10)):
                d2 = (x-cx)**2 + (y-cy)**2
                if d2 <= 81:
                    lpx[x, y] = max(lpx[x, y], round(180 * (1 - d2/81) ** 1.7))
    overlay = Image.alpha_composite(overlay, tint_layer(lamp_alpha.filter(ImageFilter.GaussianBlur(2)), (255, 160, 68)))
    overlay = Image.alpha_composite(overlay, tint_layer(lamp_alpha, (255, 221, 142)))

    # Retain all light inside the building, apart from the deliberately soft <=3 px halo.
    silhouette = base.getchannel("A")
    allowed = silhouette.filter(ImageFilter.MaxFilter(7))
    overlay.putalpha(ImageChops.multiply(overlay.getchannel("A"), allowed))
    MASTER.parent.mkdir(parents=True, exist_ok=True)
    overlay.save(MASTER, format="PNG", compress_level=0)

    # QA: darkened sprite, ADD overlay, all over a slate night background.
    night = Image.new("RGBA", (W, H), (42, 47, 69, 255))
    dark = base.copy(); dp = dark.load()
    for y in range(H):
        for x in range(W):
            r, g, b, a = dp[x, y]
            dp[x, y] = (round(r*.45), round(g*.50), round(b*.75), a)
    night.alpha_composite(dark)
    add_rgba(night, overlay)
    night.save(QA, format="PNG", compress_level=0)

    # Coverage QA: the overlay alone, over the same dark slate used for the night test.
    solo = Image.new("RGBA", (W, H), (42, 47, 69, 255))
    add_rgba(solo, overlay)
    solo.save(SOLO_QA, format="PNG", compress_level=0)

    # Geometry QA: one-pixel magenta outlines must remain on glass, just inside frames.
    trace = base.copy()
    trace_draw = ImageDraw.Draw(trace)
    for polygon in upper_polygons:
        trace_draw.line(polygon + [polygon[0]], fill=(255, 0, 255, 255), width=1)
    trace.save(TRACE_QA, format="PNG", compress_level=0)

    alpha = overlay.getchannel("A")
    print(f"canvas={overlay.size} mode={overlay.mode} alpha_bbox={alpha.getbbox()}")
    print("upper_pane_polygons=" + repr(upper_polygons))
    print("upper_pane_pixel_counts=" + ",".join(str(sum(v > 0 for v in p.getdata())) for p in upper_panes))
    print("store_pane_pixel_counts=" + ",".join(str(sum(v > 0 for v in p.getdata())) for p in store_panes))
    print(MASTER.resolve()); print(SHIP.resolve()); print(QA.resolve())
    print(SOLO_QA.resolve()); print(TRACE_QA.resolve())


if __name__ == "__main__":
    main()
