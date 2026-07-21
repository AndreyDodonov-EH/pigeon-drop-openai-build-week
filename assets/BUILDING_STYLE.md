# Building sprite style guide

Use `assets/masters/bg-buildings-sheet.png` and
`assets/masters/bg-buildings-sheet-2.png` as the primary visual references.

## Art direction

- Front or restrained three-quarter facade, isolated on a flat baseline.
- Thick, clean dark-brown/near-black contour; aim for a 2–3 px outer outline
  in the shipping sprite.
- Painterly cel shading with warm upper-left highlights, cooler lower-right
  planes, restrained wear, and details that survive at roughly 360–470 px tall.
- A readable architectural hook per silhouette: gable, cornice, awning, fire
  escape, shop sign, rooftop equipment, or similarly strong feature.
- No ground plane, cast shadow, people, vehicles, readable brand text, or
  content touching the frame.

## Palette-shader contract

`BuildingPalettePipeline` varies hue and value per building instance. Give the
facade at least one broad, contiguous painted or masonry region with saturation
above roughly 0.34. Keep outlines, stone trim, metal, and most glass neutral so
they remain stable while the painted material shifts. Avoid tiny multicolored
patterns as the main facade color: they turn the repaint into noise.

The master cutout field should be uniform `#ff00ff`, with no legitimate magenta
inside the silhouette. Preserve the untouched master, key and trim a separate
working copy, add a small transparent safety border, and verify transparent
corners plus zero surviving near-magenta pixels before shipping.
