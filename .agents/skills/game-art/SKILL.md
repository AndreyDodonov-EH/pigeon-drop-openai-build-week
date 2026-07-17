---
name: game-art
description: Generate or edit raster game art such as portraits, sprites, sprite sheets, skins, backgrounds, textures, and promo art. Use whenever the project needs a new image asset or a revision to generated art. Use the session's image-generation/editing capability directly, then preserve the master, produce the shipping asset, log provenance, and verify the result visually.
---

# Generating game art

Use the session's available image-generation or image-editing tool directly. You own art
direction, output inspection, post-processing, and acceptance. Do not treat the generator's
textual report as proof that the image, alpha, dimensions, or saved files are correct.

## Inspiration lane (agy MCP)

`mcp__agy__generate_image` (server: `scripts/agy-mcp.mjs`, via cliproxyapi) produces
*inspiration/reference* images only, saved to `images/inspiration/` with a `LOG.md`
provenance line. Never ship these in the game. When one is liked, regenerate the shipping
asset through this skill's normal workflow (identity invariants, magenta `#ff00ff` chroma
key, masters + `assets/ART_LOG.md`). `mcp__agy__ask` is available for creative
math/geometry brainstorming (curves, easing, procedural shapes).

## Character and style bible

Before generating, Read the relevant references. For pigeon assets, inspect at least the
closest matching states from:

- `images/normal.png` — smug wink; baseline identity
- `images/damage_taken.png` — battered and scuffed
- `images/pleased.png` — pleased state
- `public/assets/portraits/strain.png` — mid-poop strain
- existing masters or shipped assets for the same sprite/portrait family

Repeat the identity invariants explicitly: *cartoon; thick clean dark outlines; painterly
cel shading; slate-blue pigeon; orange eyes; purple eye patches; scruffy black brows;
iridescent green-to-purple neck feathers; raunchy/absurdist tone.*

Portrait standard: *head and neck only; circular warm-tan medallion on black; square
1024×1024 composition.*

When references are style-only, say so and explicitly forbid the pigeon or other reference
subjects from appearing in the render.

## Directing a generation

Generate one logical asset per request. A coherent multi-panel sheet of one subject or one
asset family counts as one asset; unrelated batching causes identity and style drift.

Structure the request in this order:

1. **References and role** — which files define identity, style, geometry, or an earlier
   state. Require them to be inspected before generation.
2. **Subject and state** — what is shown and the exact pose, emotion, action, or material.
3. **Composition** — framing, orientation, panel count/order, scale, implied ground line,
   edge clearance, and which properties may change between frames.
4. **Palette and rendering** — key colors, outline weight, shading, and tone.
5. **Invariants** — identity, clothing, body geometry, anchor points, or other details that
   must remain identical to references.
6. **Background/cutout** — transparency or a solid `#ff00ff` field, with no gradients,
   shadows, dividers, or content touching the frame edge.
7. **Outputs** — intended master and shipping paths and target dimensions.

For reaction or animation variants, begin from the original master whenever possible.
State that only the requested pose/expression may change. Keep panel order, subject scale,
body position, shared ground line, and gameplay anchor geometry fixed.

## Masters, shipping assets, and provenance

- Preserve the untouched generated source under `assets/masters/<name>.png` whenever the
  asset has a reusable high-resolution source.
- Never resize, key, crop, or compress the only master in place. Produce shipping copies
  separately under their runtime paths.
- Record the actual generation/editing tool and model when known—not an assumed provider.
- Append an entry to `assets/ART_LOG.md` containing the date, master and shipped paths,
  references inspected, exact final prompt, output dimensions, panel/frame semantics, and
  every post-processing step.
- Keep historical log entries factual. Do not rewrite old provider/tool provenance during
  unrelated art revisions.

`assets/ART_LOG.md` is also the source of truth for asset-specific crop boundaries,
normalization percentages, state order, anchor geometry, tiling repairs, and known failure
modes. Read the matching entry before regenerating an existing family.

## Cutout and shipping workflow

For sprites that need alpha, prefer generation on solid pure magenta `#ff00ff`; keep every
subject and outline away from the image edges. Start from the established ImageMagick 6
recipe, then tune fuzz only after inspecting the actual background and subject colors:

```bash
convert in.png -fuzz 10% -transparent '#ff00ff' \
  -channel A -morphology Erode Disk:1 +channel out.png
```

Key a whole sprite sheet before cropping when panel boundaries are imperfect or content
crosses nominal divisions. Use asset-specific corrective alpha expressions from
`assets/ART_LOG.md` when tinted glass or contaminated backgrounds survive chroma-keying.

After keying:

- crop/trim without changing relative scale accidentally;
- normalize animation/state frames onto a common padded canvas and preserve gameplay
  anchors so texture swaps do not jump;
- inspect alpha before and after erosion/closing to avoid clipped outlines or pinholes;
- resize to the exact runtime dimensions, including power-of-two dimensions where the
  WebGL/TileSprite use case requires them;
- compress only the shipping copy:

```bash
pngquant --force --skip-if-larger --output small.png 256 big.png
```

For scrolling/tiled textures, verify the required axis is genuinely seamless after all
crops and resizing. A generator's claim of seamlessness is not sufficient.

## Acceptance

Read every delivered image and inspect it at useful zoom levels. Reject or revise for:

- character identity, palette, outline, or shading drift;
- incorrect panel order, unequal subject scale, shifting ground line, or changed anchors;
- framing errors or content touching/cropped by the edge;
- wrong subjects introduced from style references;
- opaque corners, damaged alpha, pinholes, or residual magenta halos;
- visible repeat seams in tiled textures;
- incorrect dimensions or excessive compression damage.

After two unsuccessful revisions, start a fresh generation with a rewritten, more explicit
request instead of stacking more corrective instructions. For runtime-visible assets, use
`run-game` and inspect the image in the actual Phaser scene before accepting it.
