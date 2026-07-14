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

## assets/masters/pedestrians-sheet.png → public/assets/sprites/ped-{0,1,2}.png — 2026-07-13

- **References attached:** `images/normal.png`, `images/pleased.png` (style only — no pigeon in the render)
- **Tool:** `codex exec` built-in image generation (master 1774×887, three 591×887 panels)
- **Post-processing:** crop thirds → `convert -fuzz 12% -transparent '#ff00ff' -channel A -morphology Erode Disk:1 +channel -trim +repage` → uniform `-resize 15.5%` (preserves relative heights; sprites rendered at setScale(0.5)) → pngquant
- **Panel semantics:** ped-0 = portly businessman with coffee, ped-1 = jogger woman with headphones, ped-2 = grumpy old man with cane; all face LEFT (flipX for rightward walkers)
- **Prompt:**
  > The attached images are HUD portraits from a cartoon game and define its ART STYLE: thick clean dark outlines, painterly cel shading, warm slightly desaturated palette, comic/absurdist tone.
  >
  > Generate a PEDESTRIAN CHARACTER SHEET for this game, in that SAME art style (same outline weight, same cel shading). These are city pedestrians who get splatted by a pigeon from above — they should look like everyday comic caricatures, mildly grumpy or oblivious.
  >
  > Composition: wide landscape image, divided into exactly THREE equal side-by-side panels. Each panel shows ONE full-body pedestrian in side view, FACING LEFT, mid-walk stride, feet near (but not touching) the bottom of the panel. Three DIFFERENT characters, one per panel:
  > - Panel 1 (left): a portly middle-aged businessman in a rumpled grey suit and loosened red tie, holding a paper coffee cup, balding with a comb-over, scowling slightly.
  > - Panel 2 (middle): a young jogger woman in a teal tracksuit, high ponytail, big headphones, oblivious cheerful expression.
  > - Panel 3 (right): a grumpy skinny old man with a flat cap, brown cardigan, walking cane, big nose, bushy white eyebrows.
  >
  > All three at the SAME scale (same head-to-body proportion, roughly 3.5 heads tall, chunky cartoon proportions) and the SAME vertical position in their panels.
  >
  > Background: the ENTIRE background must be solid flat pure magenta #ff00ff — no gradients, no shadows on the ground, no panel divider lines, no outlines touching the image edges. Just the three pedestrians evenly spaced on flat magenta, never touching the image edges.
  >
  > (For future pedestrian variants, reuse this exact layout and wording, changing only the three character descriptions.)

## assets/masters/pedestrians-react-sheet.png → public/assets/sprites/ped-{0,1,2}-r.png — 2026-07-13

- **References attached:** `assets/masters/pedestrians-sheet.png` (identity), `images/normal.png` (style)
- **Tool:** `codex exec` built-in image generation (master 1774×887); one-shot, no retries
- **Post-processing:** same as pedestrians-sheet (thirds → fuzz 12% key → erode → trim), resize
  normalized to sheet height: `15.5% × 887 / sheetH` so body scale matches the walk frames
- **Panel semantics:** same characters/order as pedestrians-sheet, post-splat outrage poses
  (coffee flying / headphones yanked off / cane overhead); shown for 90 frames on hit
- **Prompt pattern:** attach the original sheet first, then: "Generate a REACTION SHEET of the
  SAME THREE pedestrians — identical characters, clothing, colors, style, scale — each now
  REACTING the instant after being splatted from above by pigeon droppings. Do NOT paint any
  droppings on them — the game renders the goo separately. Only pose and expression change."
  + the standard three-panel/magenta boilerplate + per-panel pose descriptions.

## assets/masters/cars-react-sheet.png → public/assets/sprites/car-{0,1,2}-r.png — 2026-07-13

- **References attached:** `assets/masters/cars-sheet.png` (identity), `images/normal.png` (style)
- **Tool:** `codex exec` built-in image generation (master 1983×793); one-shot, no retries
- **Post-processing:** same recipe as cars-sheet (whole-sheet fuzz 22% key + erode + pink-killing
  alpha fx + crops at x=700/x=1305 + trim + resize 39.4%)
- **Panel semantics:** same vehicles/order as cars-sheet, drivers leaning out of the window
  furious (fist shake / arm flung yelling / exasperated palm); shown for 90 frames on hit
- **Prompt pattern:** as the pedestrian reaction sheet, plus: "The vehicles themselves must stay
  EXACTLY as in the reference; only the drivers change" and "Do not tint any window glass
  magenta — window openings show flat magenta only where there is no glass" (the anti-tint line
  helped but didn't fully prevent tinted glass; the fx pass still needed).

## assets/masters/cars-sheet.png → public/assets/sprites/car-{0,1,2}.png — 2026-07-13

- **References attached:** `images/normal.png`, `images/pleased.png` (style only)
- **Tool:** `codex exec` built-in image generation (master 1983×793); took TWO resumes:
  first run exited while "still rendering" (resume with "finish and save" fixed it), and
  the first render drew grumpy PIGEONS as drivers — resumed with "drivers must be human,
  pigeons are the protagonist" and it edited the sheet in place, vehicles untouched.
- **Post-processing:** cars aren't on exact third boundaries — key the WHOLE sheet first
  (`-fuzz 22% -transparent '#ff00ff' -channel A -morphology Erode Disk:1 +channel`), then
  crop at content gaps x=700 and x=1305, `-trim +repage`. Window glass is tinted magenta
  that survives the fuzz; clear it with an alpha fx pass before cropping:
  `-channel A -fx "(u.r>0.62 && u.b>0.62 && u.g<u.r*0.62 && u.g<u.b*0.62) ? 0 : u.a" +channel`
  (thresholds chosen to spare the taxi driver's purple blouse). Then uniform `-resize 39.4%`
  (preserves relative sizes; sprites rendered at setScale(0.5)) → pngquant.
- **Panel semantics:** car-0 = rusty red beater sedan, car-1 = yellow checker taxi,
  car-2 = pale-blue delivery van; all face LEFT (cars only drive left — no flip).
- **Prompt (first invocation; the driver correction above amends it):**
  > The attached images are HUD portraits from a cartoon game and define its ART STYLE: thick clean dark outlines, painterly cel shading, warm slightly desaturated palette, comic/absurdist tone.
  >
  > Generate a CAR SPRITE SHEET for this game, in that SAME art style (same outline weight, same cel shading). These are city cars that get splatted by a pigeon from above — chunky, slightly squashed comic proportions, a bit worn and characterful, NOT sleek or realistic.
  >
  > Composition: wide landscape image, divided into exactly THREE equal side-by-side panels. Each panel shows ONE complete car in flat side view, FACING LEFT (driving left), wheels near (but not touching) the bottom of the panel. Three DIFFERENT cars, one per panel:
  > - Panel 1 (left): a rusty faded-red beater sedan, slightly sagging, one mismatched grey door, dented bumper.
  > - Panel 2 (middle): a yellow city taxi with a black-and-white checker stripe along the side and a small TAXI roof sign.
  > - Panel 3 (right): a boxy pale-blue delivery van, a bit taller than the cars, with a plain white side panel.
  >
  > Each car has a simple grumpy cartoon HUMAN driver visible through the side window. All three at the SAME scale, sitting on the SAME implied ground line at the same vertical position in their panels.
  >
  > Background: the ENTIRE background must be solid flat pure magenta #ff00ff — no gradients, no ground shadows, no panel divider lines, no outlines touching the image edges. Just the three cars evenly spaced on flat magenta, never touching the image edges.
  >
  > After generating, save the PNG to assets/masters/cars-sheet.png in the workspace and reply with the absolute path of the saved file.

## public/assets/portraits/panic.png — 2026-07-14

- **References attached:** `images/normal.png`, `images/damage_taken.png`, `public/assets/portraits/strain.png`
- **Tool:** `codex exec` built-in image generation; one-shot, no retries; pngquant 256 after accept
- **Used for:** pre-blowout telegraph + blowout portrait state (meter ≥ 92 / dumping)
- **Prompt:**
  > The attached images are portraits of the same cartoon pigeon character (game HUD portraits, circular bust on warm tan circle over black background, thick clean outlines, orange eyes, purple eye patches, black scruffy brows, iridescent green-purple neck feathers). The third image is the 'straining mid-poop' state of this series. Generate a NEW portrait of the SAME character in the SAME style and composition: the 'PANIC — about to involuntarily burst' state. The pigeon has held it in far too long and is a split second from an uncontrollable blowout: beak wide OPEN in alarm, eyes bulging huge (small shrunken orange pupils), cheeks puffed out to bursting, two or three comic sweat drops flying off the head, faint trembling motion lines around the cheeks. Clearly MORE alarmed than the straining reference — this is panic, not effort; comic and absurd, not gross. Keep identical framing: circular warm-tan medallion, black background, head and neck only. Square image, 1024x1024.

## public/assets/portraits/strain.png — 2026-07-12

- **References attached:** `images/normal.png`, `images/damage_taken.png`
- **Tool:** `codex exec` built-in image generation
- **Prompt:**
  > The two attached images are portraits of the same cartoon pigeon character (game HUD portraits, circular bust on warm tan circle over black background, thick clean outlines, orange eyes, purple eye patches, black scruffy brows, iridescent green-purple neck feathers). Generate a NEW portrait of the SAME character in the SAME style and composition: the 'straining mid-poop' state — eyes crossed or squeezed, cheeks puffed, gritted beak, veins/effort lines on forehead, comically intense effort. Keep identical framing: circular tan medallion, black background, head and neck only. Square image, 1024x1024.
