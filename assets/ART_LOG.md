# Generated art provenance log

Reuse these exact prompts (with the listed reference attachments) when regenerating or
extending a set — consistency depends on it.

## assets/masters/pigeon-flight-sheet.png → public/assets/sprites/pigeon-f{0,1,2}.png — 2026-07-13

- **References attached:** `images/normal.png`, `images/pleased.png`
- **Tool:** `codex exec` built-in image generation (master 1773×887, three 591×887 panels)
- **Post-processing:** crop thirds → `convert -fuzz 12% -transparent '#ff00ff' -channel A -morphology Erode Disk:1 +channel -resize 296x444` → pngquant
- **Frame semantics:** f0 = wings up, f1 = wings mid, f2 = wings down; flap cycle f0→f1→f2→f1
- **Prompt:**
  > The attached images are HUD portraits of a cartoon pigeon game character: slate-blue pigeon, orange eyes, purple eye patches, scruffy black brows, iridescent green-to-purple neck feathers, thick clean dark outlines, painterly cel shading.
  >
  > Generate a FLIGHT ANIMATION SPRITE SHEET of this SAME character as a FULL-BODY pigeon, in the SAME art style (thick clean outlines, cel shading, same colors and same facial features including the purple eye patch, orange eye and scruffy black brow).
  >
  > Composition: wide landscape image, divided into exactly THREE equal side-by-side panels. Each panel shows the SAME plump comic pigeon in side view, FLYING and FACING RIGHT, with a slightly smug expression, small dangling feet, fanned tail. The body, head, size and position must be IDENTICAL in all three panels — ONLY the wing pose changes:
  > - Panel 1 (left): wings raised high above the back, at the top of the upstroke.
  > - Panel 2 (middle): wings level, straight out to the side, mid-flap.
  > - Panel 3 (right): wings swept fully downward below the body, bottom of the downstroke.
  >
  > Background: the ENTIRE background must be solid flat pure magenta #ff00ff, no gradients, no shadows, no outlines touching the image edges, and no panel divider lines — just the three pigeons evenly spaced on flat magenta. The pigeon must never touch the image edges.
  >
  > (For future variants — e.g. the turbo/rocket pose set — keep this exact three-panel layout and wording, changing only the pose description.)

## public/assets/portraits/strain.png — 2026-07-12

- **References attached:** `images/normal.png`, `images/damage_taken.png`
- **Tool:** `codex exec` built-in image generation
- **Prompt:**
  > The two attached images are portraits of the same cartoon pigeon character (game HUD portraits, circular bust on warm tan circle over black background, thick clean outlines, orange eyes, purple eye patches, black scruffy brows, iridescent green-purple neck feathers). Generate a NEW portrait of the SAME character in the SAME style and composition: the 'straining mid-poop' state — eyes crossed or squeezed, cheeks puffed, gritted beak, veins/effort lines on forehead, comically intense effort. Keep identical framing: circular tan medallion, black background, head and neck only. Square image, 1024x1024.
