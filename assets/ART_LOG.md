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
