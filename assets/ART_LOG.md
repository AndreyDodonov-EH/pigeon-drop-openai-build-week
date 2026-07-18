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

## Car windshield magenta cleanup — 2026-07-17

- **Shipped paths:** `public/assets/sprites/car-{0,1,2}.png`,
  `public/assets/sprites/car-{0,1,2}-r.png`, and
  `public/assets/sprites/car-{0,1,2}-rainbow.png`
- **References inspected:** all nine shipped car states plus the original
  `assets/masters/cars-sheet.png` / `assets/masters/cars-react-sheet.png` provenance
  entries above. The reusable masters were not modified.
- **Tool:** deterministic local RGBA post-processing with Node.js + `pngjs`, followed by
  a lossless indexed-PNG repack with Pillow; no image generation or repainting.
- **Repair:** reapplied the logged magenta-alpha threshold, then isolated the sloped front
  windshield band for each vehicle/state and cleared the lower-saturation purple glass
  contamination that survived the original key. Finally set RGB to black wherever alpha
  is zero, preventing hidden magenta from bleeding back through WebGL texture filtering.
  Repacked each result to an indexed PNG only when its exact RGBA palette fit within 256
  entries, with a byte-for-byte decoded RGBA round-trip check.
- **Invariants:** source dimensions, visible non-windshield pixels, sprite framing, ground
  line, and texture-swap anchors remain unchanged. Normal, outraged, and rainbow-delight
  states retain their existing panel/vehicle identity.
- **Prompt:** none (deterministic corrective post-processing only).

## assets/masters/hydrant-sheet.png → public/assets/sprites/hydrant-{0,1}.png — 2026-07-15

- **References attached:** `images/normal.png`, `public/assets/portraits/strain.png` (style only — no pigeon in the render)
- **Tool:** `codex exec` built-in image generation (master 1774×887, two 887×887 panels); one-shot, no retries
- **Post-processing:** key whole sheet (`-fuzz 12% -transparent '#ff00ff' -channel A -morphology Erode Disk:1 +channel`) → crop halves → `-trim +repage` → uniform `-resize 16%` → pad BOTH frames to a common 96×125 canvas with `-background none -gravity south -extent 96x125` (base on the bottom edge, so the in-game texture swap never shifts the sprite; the burst frame's floating cap needs the extra headroom) → pngquant. Neck opening sits ≈46 px above the base at the rendered setScale(0.5) — `GameScene` hardcodes this as the water-jet anchor.
- **Panel semantics:** hydrant-0 = idle (cap on), hydrant-1 = burst (cap blown off, tumbling above, open neck; NO water — the jet is drawn in code)
- **Prompt:**
  > The attached images are HUD portraits from a cartoon game and define its ART STYLE: thick clean dark outlines, painterly cel shading, warm slightly desaturated palette, comic/absurdist tone. Do NOT draw the pigeon — these references are style only.
  >
  > Generate a FIRE HYDRANT HAZARD SPRITE SHEET for this game, in that SAME art style (same outline weight, same cel shading). It is a squat, chunky, slightly battered red city fire hydrant with a comic personality — worn paint, a couple of chipped scuffs, brass-yellow side caps and top cap. NOT sleek or realistic.
  >
  > Composition: wide landscape image, divided into exactly TWO equal side-by-side panels. Each panel shows the SAME hydrant in flat side/front view, base near (but not touching) the bottom of the panel. The hydrant's body, size, colors and position must be IDENTICAL in both panels — only the top differs:
  > - Panel 1 (left): intact idle hydrant, top cap firmly on.
  > - Panel 2 (right): the SAME hydrant the instant its top cap has BLOWN OFF — the little brass top cap tumbling in the air just above it, the open neck exposed, two or three small comic motion lines around the neck. Do NOT draw any water or spray — the game renders the water jet separately.
  >
  > Background: the ENTIRE background must be solid flat pure magenta #ff00ff — no gradients, no ground shadows, no panel divider lines, no outlines touching the image edges. Just the two hydrants evenly spaced on flat magenta, never touching the image edges.

## assets/masters/water-tile-sheet.png → public/assets/sprites/water-col.png — 2026-07-15

- **References attached:** `images/normal.png`, `public/assets/portraits/strain.png` (style only — no pigeon in the render)
- **Tool:** `codex exec` built-in image generation (master 1254×1254, full-bleed tile); one-shot, no retries
- **Post-processing:** crop a 350×900 portrait region out of the master → `-roll +0+450` to relocate the top/bottom wrap seam to the vertical center → blur a 350×40 band at the new seam (`-region ... -blur 0x6`) so the repeat reads clean when scrolled → non-uniform `-resize 40x108!` down to game size → pngquant. Opaque RGB, no alpha — `GameScene` applies alpha/scale in code.
- **Used for:** the hydrant water jet's shaft. Rendered as a `TileSprite` (`water-col`) anchored bottom-up at the hydrant's neck, height driven every frame by `jetH`, `tilePositionY` scrolled continuously for flow. Replaces the earlier code-only `fillRect` band loop.
- **Prompt:**
  > The attached images are HUD portraits from a cartoon game and define its ART STYLE: thick clean dark outlines, painterly cel shading, warm slightly desaturated palette, comic/absurdist tone. Do NOT draw the pigeon or any character — these references are for STYLE ONLY (line weight, shading technique).
  >
  > Generate a SEAMLESSLY TILEABLE water texture tile for a fire-hydrant water-jet effect in this same cartoon art style. Square image, texture fills the ENTIRE frame edge-to-edge (no background, no border, no vignette — the texture must bleed off all four sides since it will be tiled).
  >
  > Content: a vertical column of rushing water rendered in cel-shaded cartoon style — pale sky-blue base (#a8dcf2) with brighter near-white highlight streaks (#e6f6fd) running vertically, a few small cartoon bubble/foam ellipses with thick dark outlines, subtle horizontal banding suggesting turbulent flow. Keep the linework graphic/flat (2-3 shading tones per streak), not photoreal or gradient-heavy.
  >
  > CRITICAL: the pattern must tile seamlessly when repeated top-to-bottom and left-to-right — whatever appears at the very top edge must continue naturally from the very bottom edge, and the left edge must continue from the right edge, with no visible seam, no vignette darkening at edges, and no single centered focal element.
  >
  > Save the PNG to assets/masters/water-tile-sheet.png in the workspace and reply with the absolute path of the saved file.

## assets/masters/water-splash-sheet.png → public/assets/sprites/water-crown.png — 2026-07-15

- **References attached:** `images/normal.png`, `public/assets/portraits/strain.png` (style only — no pigeon in the render)
- **Tool:** `codex exec` built-in image generation (master 1254×1254); one-shot, no retries (Codex self-corrected an off-key magenta field with an `-fx` recolor pass before handing off)
- **Post-processing:** key (`-fuzz 10% -transparent '#ff00ff' -channel A -morphology Erode Disk:1 +channel`) → `-trim +repage` → `-resize 96x96` → pngquant. Verified transparent corners, no magenta fringe.
- **Whitened 2026-07-17:** the crown's blue droplets clashed with the foamy near-white
  column (`water-col` foamier revision below). Rebuilt the shipping copy from this master
  with `-modulate 108,55` (brightness up, saturation halved) inserted before the resize —
  same key/erode/trim recipe otherwise. Master untouched.
- **Used for:** the splash/crown sitting atop the water jet. Rendered as an `Image` (`water-crown`) positioned at the jet's current top, scaled 0.1→0.44 as `jetH` grows so it swells in with the burst and collapses back down with it, with a slight alpha/scale wobble for life.
- **Prompt:**
  > The attached images are HUD portraits from a cartoon game and define its ART STYLE: thick clean dark outlines, painterly cel shading, warm slightly desaturated palette, comic/absurdist tone. Do NOT draw the pigeon or any character — these references are for STYLE ONLY.
  >
  > Generate a WATER SPLASH/SPRAY CROWN sprite for a fire hydrant's water jet, in that same cartoon style. This is the fan of droplets and foam that bursts out the top of a vertical water column. Square image, the splash/spray shape centered and fully visible, NOT touching the image edges.
  >
  > Content: a cartoon burst of pale sky-blue (#a8dcf2) water droplets and a few brighter near-white (#e6f6fd) highlight droplets, radiating outward and slightly upward in an asymmetric spray, thick dark clean outlines around each droplet, 2-3 tone cel shading, comic energy lines optional. No column/stem below it — just the spray burst itself.
  >
  > Background: the ENTIRE background must be solid flat pure magenta #ff00ff — no gradients, no shadows, no other elements. Just the splash burst on flat magenta, never touching the image edges.
  >
  > Save the PNG to assets/masters/water-splash-sheet.png in the workspace and reply with the absolute path of the saved file.

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

## water-col.png — foamier revision (2026-07-15)

- **Asset:** `public/assets/sprites/water-col.png` (64×128) — fire-hydrant jet, vertically-scrolling tile
- **Reason:** previous column read too much like a smooth waterfall sheet; made it foamy/aerated white whitewater.
- **Master:** `assets/water-col-master.png` (240×648, magenta bg). Old sprite kept at `assets/water-col.prev-waterfall.png`.
- **Post:** crop central foam core (170px band, `+35+0`), chroma-key `#ff00ff` (fuzz 12%) + 1px erode, alpha `Close Disk:2` to seal pinholes, `-level 0,55%` to firm up the body, `-modulate 108,70` (brighter/whiter). Then made **vertically seamless** for the scrolling `tileSprite`: take the top half and append its vertical flip so the top row == bottom row (no repeat seam / "cut in half" break). Resized to the WebGL-native power-of-two 64×128 canvas so Phaser renders the full tile instead of clipping its NPOT padding, then pngquant. Verified live in-game via Playwright + the `window.SP` debug hook (forced hydrant burst).
- **References attached:** `public/assets/sprites/water-col.png` (prior version)
- **Tool:** `codex exec` built-in image generation
- **Prompt:**
  > tall vertical column of water blasting straight upward under high pressure out of a fire hydrant … FOAMY and AERATED: churning frothy whitewater packed with bubbles, air pockets and spray … dominantly WHITE / near-white foam, only thin light-blue (#a8dcf2) tint in recessed shadow gaps … cartoon, clean thin dark outlines, painterly cel shading … vertically-scrolling TILING texture, foam tiles seamlessly top→bottom, no cap/base … solid #ff00ff magenta background, ~240×648.

## assets/masters/rainbow-pickup.png → public/assets/sprites/pickup-rainbow.png — 2026-07-17

- **References inspected:** `assets/masters/hydrant-sheet.png`, `public/assets/sprites/hydrant-0.png`, `public/assets/sprites/water-crown.png` (style only — no reference subjects appear in the render)
- **Tool:** hand-authored SVG vector artwork rendered with ImageMagick 6; no generative model used
- **Master:** 1024×1024 PNG on solid `#ff00ff`; centered 652 px circular token with generous edge clearance
- **Shipping asset:** 96×96 RGBA PNG
- **Post-processing:** ImageMagick SVG render → `-fuzz 5% -transparent '#ff00ff' -channel A -morphology Erode Disk:1 +channel -trim +repage -resize 96x96` → pngquant 256. Verified transparent corner pixel and inspected both master and shipping render.
- **Used for:** the floating rainbow pickup. The scene supplies bob, spin, pulse, collection burst, and timed status feedback in code.
- **Art specification:**
  > Create one centered, circular rainbow collectible token for the game. Match the established cartoon prop style: thick clean dark outlines, flat painterly cel-shaded color blocks, warm slightly desaturated gold rim, chunky readable silhouette, playful absurdist tone. Inside the rim, show a six-band rainbow rising from two cream cloud puffs against a dark slate-blue enamel face, plus two bright comic sparkles. Keep the icon symmetrical enough to read while spinning, high-contrast at 48–64 px, with no pigeon, hydrant, character, text, ground shadow, or content touching the frame edge. Use a solid pure `#ff00ff` background for chroma keying. Master size 1024×1024; ship at 96×96 with transparency.
- **SUPERSEDED 2026-07-17** by the quarter-arc revision below (user direction: a literal
  quarter-circle rainbow in the sky, not a medallion token). Master kept for history.

## assets/masters/rainbow-arc.png → public/assets/sprites/pickup-rainbow.png — 2026-07-17 (v2, quarter arc)

- **Direction:** user asked for a literal one-quarter-circle rainbow — the pickup floats in
  the air, so it deliberately breaks the thick-dark-outline prop style (no outlines at all,
  soft airy rendering). Inspiration image generated first via the agy MCP server
  (`mcp__agy__generate_image`, gemini-3.1-flash-image →
  `images/inspiration/quarter-rainbow-pickup-idea-2026-07-16-22-46-41.jpg`, reference only,
  not shipped).
- **Tool:** hand-authored SVG rendered with ImageMagick 6; no generative model in the
  shipping asset.
- **Geometry:** six concentric 90° arcs around a common center at SVG (262,802), red outer
  (r=524) → violet inner (r=294), each sweeping exactly from its 12 o'clock point to its
  3 o'clock point (horizontal tangent at top, vertical at right). Band ends are hidden
  under two outline-free cloud puffs; a short white sheen arc rides the red band.
- **Master:** `assets/masters/rainbow-arc.png` 1024×1024 RGBA (SVG renders directly to
  alpha — no magenta keying needed for this vector workflow).
- **Post-processing:** `-trim +repage -resize 144x144` → pngquant 256 →
  `public/assets/sprites/pickup-rainbow.png` (144×127). Verified transparent corners and
  inspected composited over dark slate (#3a405a) for halo/pinhole issues.
- **Mirrored 2026-07-17** (user request): master and sprite flipped horizontally with
  `convert -flop` — arc now rises left-to-right (vertical tangent at left, horizontal at
  top-right), matching the rightward flight direction. Master updated in place; SVG source
  in scratchpad reflects the pre-flip orientation.
- **Scene changes:** pickup no longer coin-spins (a rainbow shouldn't); it sways ±7° with a
  gentle pulse, and the halo is a soft additive white glow (alpha 0.07 fill) instead of the
  gold ring.

## assets/masters/food-pickups-sheet.png → public/assets/sprites/pickup-{bread,fries,kebab}.png — 2026-07-18

- **References inspected:** `assets/masters/hydrant-sheet.png` (attached as a style-only
  reference; no hydrant or reference subject appears) and
  `public/assets/sprites/pickup-rainbow.png` (runtime footprint comparison only).
- **Tool:** Codex built-in `image_gen` (model name not surfaced); 1774×887 RGB master;
  one-shot, no retries.
- **Panel semantics:** left = torn rustic bread heel/crust (+15 pressure design intent),
  center = fries in an unbranded red carton (+25), right = loaded Berlin-style döner in
  pita (+40). The silhouettes become slightly fuller with value while sharing the same
  center anchor.
- **Post-processing:** keyed the whole master before splitting with ImageMagick 6
  (`-fuzz 10% -transparent '#ff00ff' -channel A -morphology Erode Disk:1 +channel`). The
  generated magenta field was visually uniform but its sampled corner RGB values were not
  exact `#ff00ff`; the 10% fuzz cleared it without eating the food palette. Cropped the
  three connected silhouettes at `424x387+76+292`, `466x606+577+127`, and
  `598x560+1105+163`; resized them within 116×116, 124×124, and 130×130 respectively;
  centered each on a common transparent 144×144 canvas; then ran pngquant 256 on the
  shipping copies. The reusable master was not modified.
- **Acceptance:** confirmed 144×144 sRGBA outputs and four fully transparent corner
  pixels per sprite; inspected the cutouts over dark slate at both native and 42% scale;
  then dynamically loaded all three into the live Phaser scene at `PICKUP_SCALE = 0.42`
  beside `pickup-rainbow`. All silhouettes remained readable against the real skyline,
  with no visible magenta fringe or anchor mismatch. No runtime code was changed.
- **Prompt:**
  > Use case: stylized-concept
  >
  > Asset type: three-panel pickup-item sprite sheet for a cartoon side-scrolling game
  >
  > References and role:
  > - Image 1 is a STYLE-ONLY reference for the established prop rendering: thick clean near-black outlines, painterly cel shading with 2–3 value groups, warm slightly desaturated colors, tiny worn texture accents, chunky comic proportions.
  > - Do NOT draw a fire hydrant, brass cap, water, pigeon, character, or any other subject from the reference.
  >
  > Primary request:
  > Create one coherent FOOD PICKUP SPRITE SHEET with exactly THREE equal side-by-side panels. One complete isolated food item per panel, in this fixed order:
  > 1. LEFT — BREAD: a small irregular torn heel/crust of rustic bread, golden-brown outer crust and clearly visible warm cream porous crumb on the torn face. One compact connected silhouette, appetizing but scrappy enough for a city pigeon.
  > 2. CENTER — FRIES: a generous bunch of golden french fries in a squat red paper carton with a cream folded rim, no logo and no text. Fries have varied heights but remain a compact connected pickup silhouette.
  > 3. RIGHT — KEBAB: a large overstuffed Berlin-style döner sandwich in a toasted triangular pita, visibly packed with browned sliced meat, green lettuce, tomato, purple cabbage, and a pale garlic-sauce stripe. It must read immediately as a handheld döner, not a taco, burger, burrito, pizza, or meat skewer.
  >
  > Composition:
  > - Wide landscape sheet, exactly three equal panels, no divider lines.
  > - Flat three-quarter icon view, not strict side view and not top-down.
  > - Each item centered in its panel, fully visible, generous clear margin from every frame edge.
  > - All three occupy comparable visual footprint and share a common implied center/anchor; bread may be slightly smaller, kebab slightly fuller, to communicate value progression without making any item unreadably tiny.
  > - No cast shadows, ground/contact shadows, plates, napkins, utensils, hands, faces, eyes, limbs, motion lines, badges, medallions, glows, sparkles, loose crumbs, or separate floating garnish.
  > - Strong clean silhouette that remains readable when reduced to about 60 screen pixels.
  >
  > Palette and rendering:
  > - Match Image 1's prop style only: thick clean dark outlines of consistent weight; warm painterly cel shading; 2–3 distinct tone blocks per material; subtle handmade texture; polished 2D game art; playful and slightly grubby/absurdist, never photorealistic.
  > - Keep all food colors natural and distinct. Do not use pure magenta anywhere in the food or outlines.
  >
  > Background/cutout:
  > - The ENTIRE sheet background must be perfectly uniform flat solid pure #ff00ff magenta for chroma-key removal.
  > - Absolutely no background gradients, texture, lighting variation, floor plane, reflection, vignette, shadow, panel border, panel divider, watermark, signature, logo, or text.
  > - Keep every food item and every dark outline well away from the image edges.
  >
  > Output intent:
  > - One reusable high-resolution master sheet for assets/masters/food-pickups-sheet.png.
  > - It will be chroma-keyed, split into three transparent sprites, normalized to common 144×144 canvases, and shipped as public/assets/sprites/pickup-bread.png, pickup-fries.png, and pickup-kebab.png.

## Special-effect pickups: chilli, coffee, and living pea pod — 2026-07-18

- **Masters:** `assets/masters/special-pickups-sheet.png` and
  `assets/masters/pea-pod-pickup-sheet.png`, both untouched 1774×887 RGB PNGs.
- **Shipping assets:** `public/assets/sprites/pickup-chilli.png`,
  `public/assets/sprites/pickup-coffee.png`, and animated
  `public/assets/sprites/pickup-pea-{0,1}.png`; all are 144×144 sRGBA PNGs.
- **References inspected/attached:** `assets/masters/food-pickups-sheet.png` defined the
  established pickup style, rendering, footprint, and magenta-sheet layout. The first
  `special-pickups-sheet.png` was also attached when generating the replacement pod, to
  retain its frightened face language while explicitly rejecting the round silhouette.
- **Tool:** Codex built-in `image_gen` (model name not surfaced), one generation for the
  four-panel special sheet plus one user-directed pea-pod replacement generation; no
  retries within either prompt.
- **Frame semantics:** chilli = ordinary curved red chilli with heat-blistered tip (future
  fire-poo intent); coffee = one oversized roasted bean (future accelerated meter-fill
  intent); pea-0 = living central pea inside a three-pea pod looking left; pea-1 = the same
  pod looking right (future gas-mode intent). The initial round pea in panels 3–4 of
  `special-pickups-sheet.png` is **SUPERSEDED** by the clearer pod direction and is not
  shipped; its master remains as factual generation history.
- **Post-processing:** keyed each whole master with ImageMagick 6
  (`-fuzz 10% -transparent '#ff00ff' -channel A -morphology Erode Disk:1 +channel`) before
  splitting. The generated magenta fields were visually uniform but not exact `#ff00ff`
  at sampled corners; 10% fuzz cleared them without harming the subjects. Chilli crop:
  `356x434+80+196`; coffee crop: `339x400+496+235`; each resized within 126×126 and
  centered on 144×144. Accepted pod crops: `687x529+119+160` and `686x529+960+160`;
  each resized within 132×132 and centered on the same 144×144 canvas. Shipping copies
  were compressed with pngquant 256; masters were not modified.
- **Acceptance:** confirmed sRGBA output, four fully transparent corners per sprite, no
  visible magenta fringe, and clear silhouettes over dark slate at native and 42% scale.
  Dynamically loaded chilli, coffee, both pod frames, and `pickup-rainbow` into the live
  Phaser scene at `PICKUP_SCALE = 0.42`; all matched the existing pickup footprint. The
  three peas and opened shell remained legible at runtime size, while the pupil direction
  read clearly and the pair kept a stable center/halo anchor. No runtime code was changed.
- **Prompt 1 — chilli, coffee, and superseded round-pea concept:**
  > Use case: stylized-concept
  >
  > Asset type: four-panel special pickup-item sprite sheet for a cartoon side-scrolling game
  >
  > References and role:
  > - Image 1 is a STYLE, RENDERING, SCALE, and LAYOUT reference for the existing pickup family: thick clean near-black outlines, warm painterly cel shading with 2–3 value groups, slightly worn handmade texture, chunky readable silhouettes, one centered isolated pickup per panel on magenta.
  > - This is a NEW sheet, not an edit. Do NOT repeat the bread, fries, döner, carton, pita, meat, or any other subject from Image 1.
  >
  > Primary request:
  > Create one coherent SPECIAL PICKUP SPRITE SHEET with exactly FOUR equal side-by-side panels. One complete isolated pickup per panel, in this fixed order:
  > 1. FAR LEFT — CHILLI: one whole curved hot red chilli pepper, diagonal and slightly curled, with a stout natural green stem. Deep scarlet body, warm orange-red highlight along the curve, a few subtle dark blistered speckles close to the pointed tip so it suggests intense heat and a future fire-poo effect. No literal flame, fire, smoke, face, eyes, mouth, arms, or legs.
  > 2. LEFT-CENTER — COFFEE: one single oversized roasted coffee bean, plump oval and tilted diagonally, rich espresso brown with a clearly readable deep S-shaped center groove, copper-gold cel-shaded highlight, and a few natural roast texture marks. It must unmistakably read as a coffee bean, not cocoa, a nut, seed, rock, cup, mug, or bag. No face, eyes, mouth, arms, or legs.
  > 3. RIGHT-CENTER — PEA FRAME 0 / LOOK LEFT: one single anthropomorphic bright-green garden pea, almost spherical with a tiny leafy nub at the top, huge white cartoon eye whites set close together, tiny worried downturned mouth, and a frightened tense expression. Both dark pupils are pushed clearly toward the LEFT edges of the eye whites, anxiously watching for the pigeon. The pea has no arms or legs and must still read first as a pea.
  > 4. FAR RIGHT — PEA FRAME 1 / LOOK RIGHT: the EXACT SAME pea as panel 3 at the exact same size, position, rotation, silhouette, leafy nub, outline, green shading, highlights, eye-white shapes, eyelids, brows, and worried mouth. Change ONLY both pupils: push them clearly toward the RIGHT edges of the eye whites. No body movement, squash, turn, pose change, lighting change, or expression change.
  >
  > Composition:
  > - Wide landscape sheet, exactly four equal side-by-side panels, no panel borders or divider lines.
  > - Flat three-quarter game-icon view matching Image 1, not photorealistic, not strict side view, not top-down.
  > - Each pickup centered in its panel, fully visible, with generous clear margin from all frame edges.
  > - Chilli, coffee bean, and pea should have comparable visual weight and fill roughly the same pickup footprint as Image 1's items.
  > - Pea panels 3 and 4 must share one pixel-stable implied center and identical body geometry so a later texture swap animates only the pupils without any wobble.
  > - Strong compact silhouettes readable at roughly 50–60 screen pixels.
  > - No cast/contact shadows, floor, plates, bowls, pods, loose peas, cups, packaging, badges, medallions, glows, sparkles, motion lines, sweat droplets, separate floating pieces, text, logos, signatures, or watermarks.
  > - ONLY the pea is alive or has a face. The chilli and coffee bean are ordinary food objects.
  >
  > Palette and rendering:
  > - Match Image 1's pickup style: thick clean dark outlines of consistent weight; warm painterly cel shading; 2–3 distinct tone blocks per material; subtle handmade texture; polished 2D game art; playful slightly grubby absurdist tone.
  > - Keep natural material colors distinct. Do not use pure magenta anywhere in any subject or outline.
  > - Pea: saturated garden green body, pale green highlight, deeper leaf-green shadow, clean cream-white eye whites, very dark charcoal pupils with one tiny white catchlight each.
  >
  > Background/cutout:
  > - The ENTIRE sheet background must be perfectly uniform flat solid pure #ff00ff magenta for chroma-key removal.
  > - Absolutely no background gradient, texture, lighting variation, floor plane, reflection, vignette, shadow, panel border, divider, or content touching the image edges.
  > - Keep every subject and every dark outline well separated from the background and away from all image edges.
  >
  > Output intent:
  > - One reusable high-resolution master sheet for assets/masters/special-pickups-sheet.png.
  > - It will be chroma-keyed, split, and normalized to transparent 144×144 sprites shipped as public/assets/sprites/pickup-chilli.png, pickup-coffee.png, pickup-pea-0.png, and pickup-pea-1.png.
- **Prompt 2 — accepted pea-pod replacement:**
  > Use case: stylized-concept
  >
  > Asset type: two-frame animated pea-pod pickup sprite sheet for a cartoon side-scrolling game
  >
  > References and role:
  > - Image 1 defines the new special-pickup rendering style and contains a round anthropomorphic pea that is now SUPERSEDED. Keep its frightened comic face language and rendering quality, but do NOT repeat its round loose-pea silhouette, chilli, or coffee bean.
  > - Image 2 defines the established pickup-family scale and rendering: thick clean near-black outlines, warm painterly cel shading with 2–3 value groups, slightly worn handmade texture, chunky silhouettes readable at small game size. Do NOT repeat its bread, fries, döner, carton, pita, or meat.
  > - This is a NEW two-frame pea-pod sheet, not an edit of either reference.
  >
  > Primary request:
  > Create an unmistakable living PEA POD pickup as exactly TWO animation frames:
  > 1. LEFT PANEL — LOOK LEFT.
  > 2. RIGHT PANEL — LOOK RIGHT.
  >
  > Subject:
  > - One plump bright-green garden pea pod, gently curved and tilted diagonally upward, shown in flat three-quarter game-icon view.
  > - The pod is slightly opened along its front seam so exactly THREE round green peas are clearly visible nestled inside a lighter green pod lining. It must instantly read as a pea pod, not a chilli, green bean, edamame, leaf, canoe, mouth, or generic green creature.
  > - The large CENTRAL pea inside the pod is alive: two oversized cream-white cartoon eye whites close together, tiny worried downturned mouth, subtly tense brows, frightened of the pigeon. The other two peas have no faces.
  > - No arms or legs. The pea pod remains food first, character second.
  >
  > Frame invariants:
  > - The pod shell, pointed stem and tip, opening, seam, all three pea bodies, central face position, eye-white shapes, brows, worried mouth, shading, texture, highlights, size, rotation, center anchor, and silhouette must be IDENTICAL in both panels.
  > - Change ONLY the two dark pupils:
  >   - left panel: both pupils pushed clearly toward the LEFT edges of the eye whites;
  >   - right panel: both pupils pushed clearly toward the RIGHT edges of the eye whites.
  > - No blink, squash, turn, bob, pose change, expression change, lighting change, or body movement between frames.
  >
  > Composition:
  > - Wide landscape sheet with exactly TWO equal side-by-side panels, no divider line.
  > - The complete pea pod is centered at the exact same position and scale in both panels, fully visible, with generous clear margin from every image edge.
  > - Both panels share one pixel-stable implied center/anchor so a later texture swap animates only the pupils without visual wobble.
  > - Strong compact silhouette and large readable eyes suitable for reduction to roughly 50–60 screen pixels.
  > - No cast/contact shadow, floor, plate, bowl, extra pods, loose peas, badges, medallion, glow, sparkles, motion lines, sweat drops, gas cloud, text, logo, signature, or watermark.
  >
  > Palette and rendering:
  > - Match the references' pickup style: thick clean dark outlines of consistent weight; warm painterly cel shading; 2–3 distinct tone blocks per material; subtle handmade texture; polished 2D game art; playful slightly grubby absurdist tone.
  > - Pod shell: saturated garden green, pale yellow-green highlight, deeper leaf-green shadow. Inner lining: lighter fresh green. Three peas: distinct round medium greens.
  > - Eye whites: warm cream-white. Pupils: very dark charcoal with one tiny white catchlight each.
  > - Do not use pure magenta anywhere in the subject or outline.
  >
  > Background/cutout:
  > - The ENTIRE sheet background must be perfectly uniform flat solid pure #ff00ff magenta for chroma-key removal.
  > - Absolutely no background gradient, texture, lighting variation, floor plane, reflection, vignette, shadow, border, divider, or content touching the image edges.
  > - Keep the full pod and every dark outline well away from all image edges.
  >
  > Output intent:
  > - One reusable high-resolution master sheet for assets/masters/pea-pod-pickup-sheet.png.
  > - It will be chroma-keyed, split, normalized, and replace the earlier round-pea shipping sprites as public/assets/sprites/pickup-pea-0.png and pickup-pea-1.png on identical transparent 144×144 canvases.

## assets/masters/portrait-pleased-relaxed.png → public/assets/portraits/pleased.png — 2026-07-18

- **References inspected:** `images/pleased.png` (edited state), `images/normal.png`, and `public/assets/portraits/strain.png`; the user-supplied serene-relief meme informed the emotion only. No hands, humans, or meme pose appear in the asset.
- **Tool:** Codex built-in `image_gen` (model name not surfaced); one-shot, no retries.
- **Master:** 1254×1254 RGB PNG at `assets/masters/portrait-pleased-relaxed.png`; original generated source is retained in Codex's generated-image store.
- **Shipping asset:** 1024×1024 indexed PNG at `public/assets/portraits/pleased.png`.
- **Post-processing:** separate runtime copy resized to 1024×1024, then `pngquant 256`; master untouched. Inspected the shipped PNG full-size and will validate it at the actual 88px circular HUD presentation.
- **Frame semantics:** replaces the post-dump `pleased` portrait: a quiet, deeply contented release rather than a smug grin.
- **Prompt:**
  > Edit the first attached portrait only. Keep this same cartoon pigeon and its square HUD composition: head and neck centered in a circular warm-tan medallion with a dark rim and black outside. It is post-dump and truly relaxed/content, evoking serene release without hands, humans, touching, or copying the reference meme pose. Both eyelids are gently lowered in calm, the brows are softened, cheeks are loose, and the closed beak has a tiny soft smile; the head tips very slightly upward after a long exhale. No strain lines, teeth, panic, wink, smugness, evil grin, or exaggerated expression. Preserve the slate-blue pigeon, orange eyes, purple eye patches, scruffy black brows, iridescent green-to-purple neck feathers, thick clean near-black outlines, painterly cel shading, and absurdist game tone. Output one 1024×1024 PNG.

## assets/masters/pedestrians-sheet-2.png → public/assets/sprites/ped-{3,4,5}.png — 2026-07-18

- **References inspected:** `assets/masters/pedestrians-sheet.png` (sprite-family style, scale, geometry, and layout) and `images/normal.png` (rendering style only; no pigeon rendered).
- **Tool:** Codex built-in `image_gen` (model name not surfaced); one-shot, no retries.
- **Master:** untouched 1774×887 RGB PNG.
- **Post-processing:** whole-sheet `-fuzz 12% -transparent '#ff00ff' -channel A -morphology Erode Disk:1 +channel`; content-safe x splits at 578 and 1127 (the generated subjects did not follow nominal thirds exactly); trim; uniform `-resize 15.5%`; `pngquant 256`. Final indexed RGBA sprites are 62×110, 74×105, and 78×107.
- **Panel semantics:** ped-3 = tasteless influencer with fake luxury bag; ped-4 = lost tourist dad; ped-5 = top-heavy gym bro. All face left and share the existing pedestrian ground-line convention.
- **Prompt:**
  > Inspect the first reference as the exact pedestrian sprite-family style, body scale, ground line, side-view geometry, and three-panel layout. Inspect the second reference for the game's rendering style only. The pigeon is the protagonist and MUST NOT appear in this render.
  >
  > Generate a SECOND PEDESTRIAN WALK CHARACTER SHEET for the same game: cartoon city pedestrians, thick clean near-black outlines, painterly cel shading, warm slightly desaturated palette, chunky roughly 3.5-head-tall comic caricatures, mildly oblivious, tacky, or self-important.
  >
  > Composition: one wide landscape image divided conceptually into exactly THREE equal side-by-side panels, with no visible dividers. Each panel contains ONE different full-body human pedestrian in strict side view, FACING LEFT, mid-walk stride. All three use the SAME apparent scale and SAME shared foot/ground line as the first reference. Keep generous clear space around each figure; nothing may touch any image edge or cross into another panel.
  >
  > Panel 1, left — RICH BUT TASTELESS INFLUENCER LADY: an ostentatious nouveau-riche adult woman with an exaggerated hourglass caricature, orange spray tan, overfilled lips, huge black gradient sunglasses, towering blonde blowout, gold hoop earrings, and impractical wedge heels. She wears a loud SOLID BUBBLEGUM-PINK velour tracksuit, jacket and trousers clearly the same pink material, intended as the large primary recolorable garment. She holds a smartphone upright on a tiny handheld selfie gimbal. On her other forearm hangs a tan bootleg luxury handbag covered in an obviously fake invented 'LV-ish' monogram pattern, with one crooked emblem and cheap gold hardware; it must read as tasteless counterfeit fashion rather than a real exact branded product. Smug duck-face expression.
  >
  > Panel 2, middle — TOURIST DAD: a stocky middle-aged man, pink sunburned face and nose, floppy white sun hat, camera on neck strap, bulging fanny pack, white calf socks and brown sandals. He wears a roomy SOLID CORNFLOWER-BLUE short-sleeve vacation shirt, intended as the large primary recolorable garment, with only a few sparse tiny pale palm-leaf motifs so most of the shirt remains clean blue material. Khaki cargo shorts. He walks while squinting down at an enormous badly folded city map held in both hands, cheerfully lost.
  >
  > Panel 3, right — GYM BRO: a comically top-heavy muscular adult man with absurd shoulders and arms, tiny skipped-leg-day calves, close-cropped dark hair, square jaw, fake tan, and a self-satisfied grimace. He wears a SOLID DEEP COBALT-BLUE stringer tank top and matching short gym shorts, both clearly the same large primary recolorable fabric. White crew socks, chunky trainers, wrist wraps. He carries a translucent shaker bottle in one hand while curling the other arm as he walks. No weights or gym equipment.
  >
  > Palette/shader requirements: preserve broad, contiguous regions of exactly one dominant base color in each character's named primary garment. Use folds and cel-shaded lighter/darker versions of that hue, not multicolored patterns. Keep skin, hair, props, handbag, map, camera, socks, shoes, outlines, and metal chromatically distinct from each primary garment so a hue-distance shader can recolor the garment without recoloring skin or props.
  >
  > Background/cutout: the ENTIRE background must be perfectly uniform flat pure magenta #ff00ff, with no gradient, texture, shadow, glow, floor, panel divider, text label, or scenery. All outlines must stay well clear of the outer edges. Do not draw droppings, pigeons, logos copied exactly from a real brand, or any fourth character.
  >
  > Output intent: preserve the untouched high-resolution image as assets/masters/pedestrians-sheet-2.png, then chroma-key and split it into public/assets/sprites/ped-3.png, ped-4.png, and ped-5.png at the same runtime scale and foot alignment as the existing ped-0..2 sprites.

## assets/masters/pedestrians-react-sheet-2.png → public/assets/sprites/ped-{3,4,5}-r.png — 2026-07-18

- **References inspected:** `assets/masters/pedestrians-sheet-2.png` (immutable identity) and `assets/masters/pedestrians-react-sheet.png` (reaction energy, layout, scale, and ground line only).
- **Tool:** Codex built-in `image_gen` (model name not surfaced); one-shot, no retries.
- **Master:** untouched 1774×887 RGB PNG.
- **Post-processing:** same 12% key and one-pixel alpha erosion; content-safe x splits at 591 and 1143; trim; uniform `-resize 15.5%`; `pngquant 256`. Final sprites are 78×117, 74×110, and 82×110.
- **Frame semantics:** post-splat outrage with no painted goo: handbag shield / map umbrella / double-biceps roar.
- **Prompt:**
  > Inspect the first reference as the immutable identity sheet for three new pedestrians. Inspect the second reference only for the existing game's post-splat reaction-sheet pose energy, rendering style, three-panel layout, scale, and ground-line convention. Do not copy or include any of the second reference's three people.
  >
  > Generate a POST-SPLAT OUTRAGE REACTION SHEET of the SAME THREE people from the first reference, in the SAME order, with identical faces, hair, body shapes, clothing, props, colors, thick clean near-black outlines, and painterly cel shading. The incident is pigeon droppings hitting from above, but DO NOT paint any droppings, goo, stains, splashes, pigeons, text, effects, or reaction lines; the game renders those separately. Only their poses and expressions change.
  >
  > Composition: wide landscape image divided conceptually into exactly THREE equal side-by-side panels, no visible dividers. One full-body character per panel, still oriented generally FACING LEFT. Keep the same apparent body scale as the identity sheet and the same shared foot/ground line. Dynamic limbs and props must remain entirely inside their own panel and clear of all image edges. Keep each named primary garment's broad source colors intact for shader recoloring: influencer bubblegum-pink velour, tourist cornflower-blue shirt, gym bro cobalt-blue tank and shorts.
  >
  > Panel 1, left — SAME influencer lady: she recoils in offended horror with her mouth open and sunglasses slipping crookedly. She desperately raises the fake tan monogram handbag over her head as a shield while her smartphone and tiny gimbal fly loose beside her, still safely inside the panel. One wedge heel stamps down; the bubblegum-pink tracksuit remains clearly visible and unchanged. Expression says 'not the outfit!'.
  >
  > Panel 2, middle — SAME tourist dad: startled and outraged, hunched under his huge unfolded map held above his hat like a useless emergency umbrella. Camera swings outward on its strap, knees buckle, and he peers out with an angry sunburned face. Keep his blue palm shirt, khaki shorts, fanny pack, socks, sandals, hat, camera, and map identical.
  >
  > Panel 3, right — SAME gym bro: furious and insulted, planting both feet and throwing an absurd aggressive double-biceps pose while roaring upward. His shaker bottle has popped open and tumbles beside him, entirely within the panel. Keep the same huge upper body, tiny calves, cobalt stringer and shorts, wrist wraps, socks, trainers, hair, and face.
  >
  > Identity invariants: these must unmistakably be the exact first-reference characters, not redesigns. Do not change wardrobe construction, pattern, color, handbag, camera, map, muscle geometry, proportions, or skin/hair tones. Match each character's height and body scale to their own walk frame so swapping textures in-game does not cause a size jump.
  >
  > Background: perfectly uniform flat pure magenta #ff00ff over the entire image, with no gradient, texture, shadow, glow, floor, panel divider, label, or scenery. Nothing touches an image edge.
  >
  > Output intent: preserve the untouched source as assets/masters/pedestrians-react-sheet-2.png, then chroma-key, split, normalize by the walk-sheet scale and foot anchor, and ship public/assets/sprites/ped-3-r.png, ped-4-r.png, and ped-5-r.png.

## assets/masters/pedestrians-rainbow-sheet-2.png → public/assets/sprites/ped-{3,4,5}-rainbow.png — 2026-07-18

- **References inspected:** `assets/masters/pedestrians-sheet-2.png` (immutable identity) and a temporary contact sheet of `ped-{0,1,2}-rainbow.png` (delighted tone and body language only).
- **Tool:** Codex built-in `image_gen` (model name not surfaced); one-shot, no retries.
- **Master:** untouched 1774×887 RGB PNG.
- **Post-processing:** same 12% key and one-pixel alpha erosion; content-safe x splits at 619 and 1131; trim; uniform `-resize 15.5%`; `pngquant 256`. Final sprites are 72×124, 72×122, and 75×130.
- **Frame semantics:** delighted rainbow-hit reactions with no painted goo/effects: triumphant selfie / tourist photo hop / shaker-trophy pose.
- **Prompt:**
  > Inspect the first reference as the immutable identity sheet for three new pedestrians. Inspect the second reference only for the existing game's delighted rainbow-hit reaction tone and energetic body language. Do not copy or include any people from the second reference.
  >
  > Generate a JOYFUL RAINBOW-HIT REACTION SHEET of the SAME THREE people from the first reference, in the SAME order, with identical faces, hair, body shapes, wardrobe, props, colors, thick clean near-black outlines, and painterly cel shading. The game has hit them with magical rainbow-colored pigeon goo, but DO NOT paint any goo, stains, rainbow, sparkles, hearts, pigeons, text, effects, or reaction lines; the game renders those separately. Show delight only through their poses and expressions.
  >
  > Composition: wide landscape image divided conceptually into exactly THREE equal side-by-side panels, with no visible dividers. One full-body character per panel, generally oriented FACING LEFT. Keep the same apparent body scale as the identity sheet and the same shared foot/ground line. Dynamic limbs and props must remain entirely inside their own panel and clear of all image edges. Preserve the named primary shader garment colors: influencer bubblegum-pink velour, tourist cornflower-blue shirt, gym bro cobalt-blue tank and shorts.
  >
  > Panel 1, left — SAME influencer lady: utterly thrilled because the magical color makes perfect content. She beams in an extravagant open-mouth smile, sunglasses tipped down, holding the smartphone and gimbal high for a triumphant selfie while presenting the fake monogram handbag proudly with the other arm. One knee lifts in a celebratory fashion pose; hair, hoops, handbag, wedge heels, and pink tracksuit remain identical.
  >
  > Panel 2, middle — SAME tourist dad: delighted as though he discovered the trip's best attraction. He throws one hand happily upward and raises the camera in the other to take a picture, with the folded map tucked messily under one arm. Huge cheerful grin, one sandal lifted in a jaunty hop. Hat, blue shirt, khaki shorts, fanny pack, socks, sandals, camera, and map remain identical.
  >
  > Panel 3, right — SAME gym bro: euphoric and vain, striking a victorious bodybuilder side-chest pose with an enormous grin, one foot lifted in a celebratory bounce. He raises the closed shaker bottle like a trophy in one hand while flexing the other arm. Keep the same huge upper body, tiny calves, cobalt stringer and shorts, wrist wraps, socks, trainers, hair, face, and shaker.
  >
  > Identity and runtime invariants: these are exact reaction poses of the first-reference characters, not redesigns. Do not change garment construction, patterns, source colors, props, muscle geometry, proportions, skin/hair tones, or character heights. Match each character's body scale to their walk frame so texture swaps do not jump. Keep all loose props attached or held; do not add extra objects.
  >
  > Background: perfectly uniform flat pure magenta #ff00ff over the entire image, with no gradient, texture, shadow, glow, floor, panel divider, label, or scenery. Nothing touches any image edge.
  >
  > Output intent: preserve the untouched source as assets/masters/pedestrians-rainbow-sheet-2.png, then chroma-key, split, normalize by walk-sheet scale and foot anchor, and ship public/assets/sprites/ped-3-rainbow.png, ped-4-rainbow.png, and ped-5-rainbow.png.

## assets/masters/bg-props-sheet.png → public/assets/sprites/bg-{lamp,tree,mailbox}.png — 2026-07-18

- **References inspected:** `assets/masters/pedestrians-sheet.png` and `public/assets/sprites/hydrant-0.png` for style only (cartoon proportions, thick clean dark outlines, painterly cel shading, warm slightly absurdist city palette); their people and hydrant were explicitly excluded from the render.
- **Tool:** Codex built-in `image_gen` (model name not surfaced); one-shot, no retries.
- **Master:** untouched 1536×1024 RGB PNG at `assets/masters/bg-props-sheet.png`.
- **Panel semantics:** left = ornate dark teal-green cast-iron lamppost; middle = dusty-green leafy tree in a square concrete planter; right = dented blue US curbside mailbox. The generated sheet uses a shared baseline and approximate height ratio 100% / 83% / 35%.
- **Post-processing:** sliced at the exact nominal thirds (`512×1024+0+0`, `+512+0`, `+1024+0`); each slice processed with `convert in.png -fuzz 10% -transparent '#ff00ff' -channel A -morphology Erode Disk:1 +channel out.png`; transparent trim; proportional resize to content heights 552/442/162 px; 4 px transparent border for final 94×560, 267×450, and 115×170 canvases; `pngquant --force --skip-if-larger --output small.png 256 big.png` on each shipping copy.
- **QA:** composited each shipped sprite over 400×600 `#3a405a` slate at `assets/masters/bg-prop-{1,2,3}-qa.png`. Corner alpha (top-left, top-right, bottom-left, bottom-right) is `0,0,0,0` for every sprite. Pixels within ImageMagick 10% fuzz of `#ff00ff` with nonzero alpha: lamp `0`, tree `0`, mailbox `0`.
- **Prompt:**
  > Study both supplied images first as STYLE-ONLY references. Do not include any people, pedestrians, pigeons, birds, fire hydrants, text, labels, panel borders, or extra objects from the references.
  >
  > Create ONE coherent landscape sprite sheet, approximately 1536x1024, containing exactly three pieces of slightly absurdist city street furniture arranged side by side in this exact left-to-right order:
  > 1) An old cast-iron street lamppost: dark teal-green painted metal with subtle worn highlights, ornate traditional base, slender tall shaft, and one ornate single lamp head. This is the tallest item.
  > 2) A small leafy city tree growing from a square concrete planter: lively but slightly dusty green foliage, a warm brown trunk, readable clusters of leaves, and a chunky square gray-beige concrete planter. Total height is about 80% of the lamppost height.
  > 3) A squat blue United States curbside collection mailbox: classic rounded-top postal mailbox silhouette, slightly dented and scuffed, no readable lettering or logos. Total height is about 30% of the lamppost height.
  >
  > Composition: all three objects shown in clean side/profile-friendly game-sprite views, fully visible, centered within generous separate zones, nothing touching the frame edges or another object. All stand on the same common invisible ground line at exactly the same baseline. Maintain the stated relative heights. No cast shadows and no visible ground surface.
  >
  > Rendering: match the references' cartoon game-art style—thick clean dark brown-black outlines, painterly cel shading, crisp silhouettes, warm city palette, hand-painted texture, charming exaggerated proportions, slightly absurdist urban character. Keep small details readable after downscaling.
  >
  > Background: a perfectly flat, uniform, solid pure #ff00ff magenta chroma-key field across the entire image, with no gradient, texture, glow, shadow, vignette, dividers, or stray marks. Preserve generous pure-magenta clearance around every silhouette.
  >
  > Output intent: untouched high-resolution master for assets/masters/bg-props-sheet.png; later separate shipping sprites will be bg-lamp.png at about 560 px tall, bg-tree.png at about 450 px tall, and bg-mailbox.png at about 170 px tall.

## assets/masters/bg-clouds-sheet.png → public/assets/sprites/bg-cloud-{0,1,2}.png — 2026-07-18

- **References inspected:** `assets/masters/cars-sheet.png` and `public/assets/sprites/hydrant-0.png`, both for rendering style only; their subjects were explicitly excluded.
- **Tool:** Codex built-in `image_gen` (model name not surfaced); one-shot, no retries.
- **Master:** untouched 2172×724 RGB PNG containing three left-to-right cloud panels: wide flat-bottomed cumulus / tall lumpy puff / small wispy cloud.
- **Post-processing:** content-safe x splits at 920 and 1595; each slice independently keyed with ImageMagick 6 using `-fuzz 10% -transparent '#ff00ff' -channel A -morphology Erode Disk:1 +channel`; transparent trim; proportional resize to 260 px width; `pngquant --force --skip-if-larger --output small.png 256 big.png`. Final sprites are 260×86, 260×175, and 260×88.
- **QA:** composited each sprite over `#3a405a` at 300×200 to `assets/masters/bg-cloud-{0,1,2}-qa.png`. Corner alphas (TL/TR/BL/BR, 0–255) are `0/0/0/0` for every sprite. Pixels within 10% per RGB channel of `#ff00ff` with nonzero alpha: `0`, `0`, `0`.
- **Prompt:**
  > References and role: Inspect both supplied references before generating. Use /home/aadod/_PROJECTS/pigeon_drop/assets/masters/cars-sheet.png and /home/aadod/_PROJECTS/pigeon_drop/public/assets/sprites/hydrant-0.png strictly as STYLE references for cartoon forms, clean outlines, painterly cel shading, and warm color handling. Do not include any reference subjects: no cars, drivers, people, taxi, van, hydrant, street props, text, logos, signatures, or watermark.
  >
  > Subject and state: Generate ONE coherent game-art sprite sheet containing exactly 3 distinct puffy daytime cartoon cumulus clouds.
  >
  > Composition: Landscape sheet, about 1536x512, with the three clouds arranged side by side in this exact left-to-right order. Cloud 1: a wide, broad, horizontally stretched cumulus with a clean flat bottom. Cloud 2: a taller, vertically lumpy multi-puff cumulus. Cloud 3: a smaller delicate wispy cloud, clearly less massive than the other two. Each cloud must be completely isolated, with generous empty space around it. Nothing touches the image frame edges. Clouds do not touch or overlap each other. No panel dividers, labels, ground, cast shadows, weather effects, scenery, sky, extra cloud fragments, or decorative elements.
  >
  > Palette and rendering: Soft cream-white cloud tops with warm tan and muted lavender underside shading. Painterly cel shading with readable clustered shape planes, soft warm daytime lighting, and a thin soft darker outline that is clearly lighter-weight and less dark than the reference outlines because these are distant background elements. Warm, friendly cartoon palette. Avoid photorealism, gradients in the background, heavy black outlines, neon contamination on the clouds, or harsh storm-cloud values.
  >
  > Invariants: Exactly three clouds; distinct silhouettes; order and proportions as specified; clouds only.
  >
  > Background/cutout: Fill the entire background with one perfectly uniform solid pure #ff00ff chroma-key field. No texture, gradient, vignette, shadows, halos, magenta reflections, or content touching the frame edge.
  >
  > Outputs: High-resolution reusable master intended for assets/masters/bg-clouds-sheet.png, later sliced into three transparent sprites and downscaled to about 260px width each for public/assets/sprites/bg-cloud-0.png, bg-cloud-1.png, and bg-cloud-2.png.

## assets/masters/bg-buildings-sheet.png → public/assets/sprites/bg-building-{0,1,2,3,4}.png — 2026-07-18

- **References inspected:** `assets/masters/cars-sheet.png`, `assets/masters/pedestrians-sheet.png`, and `public/assets/sprites/hydrant-0.png`, all for rendering style only. Cars, pedestrians, drivers, and hydrants were explicitly excluded from the render.
- **Tool:** Codex built-in `image_gen` (model name not surfaced); one-shot, no retries.
- **Master:** untouched generated 1774×887 RGB PNG at `assets/masters/bg-buildings-sheet.png`.
- **Panel semantics:** left to right: red-brick walk-up/fire escape; warm tan brownstone/stoop; corner café/striped awning; slate-blue office block/rooftop AC; narrow purple-grey apartment/water tower and pigeons. The five silhouettes share a generated baseline and remain independently separated.
- **Post-processing:** content-safe x slices `377×887+0+0`, `317×887+377+0`, `395×887+694+0`, `355×887+1089+0`, and `330×887+1444+0`; each slice processed with `convert in.png -fuzz 10% -transparent '#ff00ff' -channel A -morphology Erode Disk:1 +channel out.png`; transparent trim; uniform `-resize 77.3109%`; 4 px transparent border; cleanup re-key at 15% fuzz plus selective saturated-magenta despill to muted purple for generator-contaminated wire/sign edge colors; `pngquant --force --skip-if-larger --output small.png 256 big.png`. Final sprites are 252×461, 226×426, 281×359, 252×442, and 208×468.
- **QA:** composited each shipped sprite over a 400×500 `#3a405a` slate canvas at `assets/masters/bg-building-{0,1,2,3,4}-qa.png`. Corner alpha (top-left, top-right, bottom-left, bottom-right; 0–255) is `0,0,0,0` for every shipped sprite. Pixels within ImageMagick 10% fuzz of `#ff00ff` with nonzero alpha: `0`, `0`, `0`, `0`, `0`.
- **Prompt:**
  > Use case: stylized-concept
  > Asset type: high-resolution game-art sprite sheet master for a parallax city street layer
  > Input images: Reference 1 (cars-sheet.png) is style-only for thick clean dark outlines, painterly cel shading, texture, and warm palette; Reference 2 (pedestrians-sheet.png) is style-only for contour weight, warm upper-left lighting, expressive slightly absurdist character, and color handling; Reference 3 (hydrant-0.png) is style-only for the compact isolated game-sprite finish. Do not depict any cars, pedestrians, drivers, hydrants, or other subjects from the references.
  > Primary request: Create ONE landscape sprite sheet containing exactly five distinct city building facades, arranged side by side in this exact left-to-right order:
  > 1. A red-brick walk-up apartment with a clearly visible zigzag metal fire escape and mismatched curtains in its windows.
  > 2. A warm tan brownstone with a front stoop, ornate cornice, and window flower boxes.
  > 3. A corner shop/café with a striped awning, hanging sign, and large shopfront window.
  > 4. A slate-blue mid-rise office block with a grid of glass windows catching warm light and rooftop AC units.
  > 5. A narrow purple-grey apartment building with a wooden water tower on the roof and a few pigeons perched on wires.
  > Scene/backdrop: Every building is isolated against a perfectly flat, uniform, pure solid #ff00ff chroma-key field. The background must contain absolutely no gradient, texture, floor plane, horizon, skyline, street, pavement, shadow, glow, reflection, dividers, labels, or other marks.
  > Composition/framing: Wide landscape sheet, approximately 2048x1024 aspect ratio. Exactly five complete non-overlapping buildings side by side with generous visible magenta gaps between them. Nothing may touch the outer frame edges and no building or accessory may touch another building. All five buildings stand on one identical invisible ground line: their lowest flat bottom edges align to exactly the same horizontal baseline. Do not draw a visible ground line. Vary widths naturally and vary total heights from roughly 55% to 95% of the sheet height while preserving the common baseline. Keep rooftop details, awning, stoop, fire escape, signs, wires, pigeons, and water tower fully inside each building's own separated silhouette with ample frame clearance.
  > Style/medium: polished 2D cartoon game illustration matching the three references; thick clean near-black outlines; painterly cel shading; subtle hand-painted surface texture; warm, slightly absurdist city personality; readable silhouette at game-sprite scale.
  > Lighting/mood: warm afternoon light from the upper left, with soft painted highlights and cooler lower-right shadows.
  > Color palette: red brick, warm tan and brown, cream and muted awning accents, slate-blue glass, purple-grey masonry, warm gold highlights; coherent with the reference palette.
  > Constraints: exactly five buildings and no extra buildings; front/elevation facades suitable for a side-scrolling parallax layer; consistent perspective; identical flat baseline; strong separation; crisp chroma-key edges; no cast or contact shadows; no text except minimal unreadable decorative café sign marks if necessary.
  > Avoid: reference subjects, people, vehicles, hydrants, street furniture, trees, roads, sidewalks, visible ground, readable lettering, logos, watermarks, panel frames, gutters other than the magenta background, magenta in the building artwork, cropped content, edge contact, overlap, photorealism, isometric perspective, 3D rendering.
  > Intended outputs: untouched master at assets/masters/bg-buildings-sheet.png; five keyed, tightly cropped, uniformly downscaled shipped sprites at public/assets/sprites/bg-building-0.png through bg-building-4.png.
