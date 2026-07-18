import Phaser from 'phaser';

export const VICTIM_PALETTE_PIPELINE = 'VictimPalette';

// Six evenly spaced values identify the source art variant without adding a
// uniform or breaking the shared victim draw batch. Cars use the first three.
const SOURCE_CONTROLS = [0, 51, 102, 153, 204, 255];
const KIND_CAR_BIT = 128;
const ACCENT_HUE_MAX = 127;

const FRAG = `
#define SHADER_NAME VICTIM_PALETTE_FS

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler[%count%];

varying vec2 outTexCoord;
varying float outTexId;
varying vec4 outTint;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

vec3 chroma(vec3 color) {
  return color / max(max(color.r, color.g), max(color.b, 0.025));
}

vec3 hsvToRgb(vec3 hsv) {
  vec3 rgb = clamp(abs(mod(hsv.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return hsv.z * mix(vec3(1.0), rgb, hsv.y);
}

void main() {
  vec4 texture;
  %forloop%
  float luminance = dot(texture.rgb, LUMA);

  // Phaser supplies the sprite tint as an interpolated vertex attribute, which
  // lets every victim remain in one draw batch. R stores the target hue, G the
  // source variant (six evenly spaced values). B packs two controls: bit 7 selects clothing
  // or car paint, bits 0-6 carry the accent hue (tie, hair) in 128 steps.
  vec3 control = outTint.bgr;
  float kindByte = floor(control.b * 255.0 + 0.5);
  float isCar = step(128.0, kindByte);
  float accentHue = (kindByte - isCar * 128.0) / 127.0;
  vec3 sourceColor;
  float maxLuminance;
  float matchStart;
  float matchEnd;
  float targetSaturation;
  float targetValue;
  // Second recolorable material per pedestrian: the businessman's tie and the
  // runner's hair (with eyebrows). The old man has no chromatically separable
  // accent — his cap, coat, and trousers are all neighboring browns.
  vec3 accentSource = vec3(1.0);
  float accentMaxLuminance = 0.0;
  float accentMatchStart = 0.0;
  float accentMatchEnd = 0.01;
  float accentStrength = 0.0;

  if (isCar < 0.5) {
    if (control.g < 0.10) {
      sourceColor = vec3(0.314, 0.318, 0.310);
      maxLuminance = 0.50;
      accentSource = vec3(0.549, 0.157, 0.118);
      accentMatchStart = 0.10;
      accentMatchEnd = 0.22;
      accentMaxLuminance = 0.60;
      accentStrength = 1.0;
    } else if (control.g < 0.30) {
      sourceColor = vec3(0.149, 0.455, 0.404);
      maxLuminance = 0.54;
      // Hair brown sits near skin in chroma; the luminance ceiling does the
      // separating (hair tops out near 0.40, lit skin starts near 0.55).
      accentSource = vec3(0.424, 0.294, 0.169);
      accentMatchStart = 0.08;
      accentMatchEnd = 0.16;
      accentMaxLuminance = 0.47;
      accentStrength = 1.0;
    } else if (control.g < 0.50) {
      sourceColor = vec3(0.435, 0.282, 0.122);
      maxLuminance = 0.38;
    } else if (control.g < 0.70) {
      // Influencer's pink velour tracksuit (the matching phone may follow it).
      // The ceiling sits above the velour's specular sheen so the sheen
      // follows the recolor instead of staying pink; her skin is redder in
      // chroma than the suit, so the palette mask still excludes it.
      sourceColor = vec3(0.922, 0.274, 0.473);
      maxLuminance = 0.86;
    } else if (control.g < 0.90) {
      // Tourist's blue vacation shirt; pale palm motifs remain as highlights.
      sourceColor = vec3(0.149, 0.418, 0.589);
      maxLuminance = 0.70;
    } else {
      // Gym bro's cobalt stringer and shorts, plus coordinated blue gym gear.
      sourceColor = vec3(0.078, 0.334, 0.702);
      maxLuminance = 0.66;
    }
    matchStart = 0.08;
    matchEnd = control.g < 0.50 ? 0.18 : 0.22;
    // Keep variants lively without looking like a full neon recolor.
    targetSaturation = 0.50;
    targetValue = 0.72;
  } else {
    // Faded-red sedan, yellow taxi, and pale-blue van body palettes. Neutral
    // doors/panels, glass, chrome, tires, lights, and drivers do not match.
    if (control.g < 0.10) {
      sourceColor = vec3(0.690, 0.145, 0.145);
    } else if (control.g < 0.30) {
      sourceColor = vec3(0.925, 0.620, 0.075);
    } else {
      sourceColor = vec3(0.315, 0.525, 0.655);
    }
    maxLuminance = 1.0;
    matchStart = 0.10;
    matchEnd = 0.28;
    // Paint variants should feel like sun-faded city cars, not glossy neon.
    targetSaturation = 0.58;
    targetValue = 0.78;
  }

  vec3 targetColor = hsvToRgb(vec3(control.r, targetSaturation, targetValue));

  // Pixel-art shading produces many values for one material. Comparing their
  // normalized RGB direction catches shades while leaving unrelated materials
  // alone. Very dark pixels remain the shared outline color.
  float paletteDistance = length(chroma(texture.rgb) - chroma(sourceColor));
  float paletteMask = 1.0 - smoothstep(matchStart, matchEnd, paletteDistance);
  float visibleTone = smoothstep(0.07, 0.16, luminance);
  // Pedestrian skin highlights are brighter than the garment palettes. The
  // per-source ceiling protects them; cars use the full luminance range.
  float belowHighlight = 1.0 - smoothstep(maxLuminance - 0.05, maxLuminance + 0.05, luminance);
  float material = paletteMask * visibleTone * belowHighlight * texture.a;

  float accentDistance = length(chroma(texture.rgb) - chroma(accentSource));
  float accentMask = 1.0 - smoothstep(accentMatchStart, accentMatchEnd, accentDistance);
  float accentBelow = 1.0 - smoothstep(accentMaxLuminance - 0.05, accentMaxLuminance + 0.05, luminance);
  float accentMaterial = accentMask * visibleTone * accentBelow * texture.a * accentStrength;
  // The accent owns any pixel both masks claim.
  material *= 1.0 - accentMaterial;

  // Runner hue bands are deliberately reserved for natural-looking hair.
  // His source hair is dark, so retaining its luminance below still gives
  // blonde hair a shaded gold rather than a flat bright-yellow fill.
  float accentSaturation = 0.55;
  float accentValue = 0.62;
  float blondeLift = 0.0;
  if (isCar < 0.5 && control.g >= 0.10 && control.g < 0.30) {
    if (accentHue < 0.055) {
      accentSaturation = 0.68; // red
      accentValue = 0.70;
    } else if (accentHue < 0.105) {
      accentSaturation = 0.54; // brown
      accentValue = 0.50;
    } else {
      accentSaturation = 0.48; // blonde
      accentValue = 0.92;
      blondeLift = 0.42;
    }
  }
  vec3 accentTarget = hsvToRgb(vec3(accentHue, accentSaturation, accentValue));

  // Keep the source luminance so highlights, folds, rust, and dents survive.
  float targetLuminance = max(dot(targetColor, LUMA), 0.025);
  // The painted art is not a flat colorize of sourceColor: shadows drift
  // cool, highlights warm, sheen picks up its own tint. Re-adding each
  // pixel's deviation from a flat colorize keeps that hand-painted variation
  // on the new hue instead of collapsing the material to one chroma.
  float sourceLuminance = max(dot(sourceColor, LUMA), 0.025);
  vec3 paintDetail = texture.rgb - sourceColor * (luminance / sourceLuminance);
  vec3 recolored = clamp(targetColor * (luminance / targetLuminance) + paintDetail * 0.65, 0.0, 1.0);
  // Preserve more of the original palette so pedestrian variants stay subtle.
  vec3 color = mix(texture.rgb, recolored, material * (isCar < 0.5 ? 0.82 : 0.80));
  float accentTargetLuminance = max(dot(accentTarget, LUMA), 0.025);
  float accentSourceLuminance = max(dot(accentSource, LUMA), 0.025);
  vec3 accentDetail = texture.rgb - accentSource * (luminance / accentSourceLuminance);
  vec3 accentRecolored = clamp(accentTarget * (luminance / accentTargetLuminance) + accentDetail * 0.5, 0.0, 1.0);
  // The original runner hair has no light blonde pixels to preserve. Give the
  // blonde band a small lift while retaining its source-derived shading.
  accentRecolored = mix(accentRecolored, accentTarget, blondeLift);
  color = mix(color, accentRecolored, accentMaterial * 0.82);

  // Phaser's sprite renderer uses premultiplied alpha.
  gl_FragColor = vec4(color * outTint.a, texture.a * outTint.a);
}
`;

/**
 * Selectively recolors pedestrian clothing, per-pedestrian accents (tie,
 * hair), and car paint without extra art.
 *
 * Palette controls travel in Phaser's existing per-vertex tint attribute, so
 * differently colored victims share one shader, the existing textures, and a
 * single draw batch without extra texture memory or reaction-frame variants.
 */
export class VictimPalettePipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
  constructor(game: Phaser.Game) {
    super({ game, fragShader: FRAG });
  }
}

export function victimPaletteTint(
  hue: number,
  variant: number,
  kind: 'ped' | 'car',
  accentHue = 0,
): number {
  const hueControl = Phaser.Math.Clamp(Math.round(hue * 255), 0, 255);
  const sourceControl = SOURCE_CONTROLS[variant] ?? SOURCE_CONTROLS[0];
  const accentControl = Phaser.Math.Clamp(Math.round(accentHue * ACCENT_HUE_MAX), 0, ACCENT_HUE_MAX);
  const kindControl = (kind === 'car' ? KIND_CAR_BIT : 0) | accentControl;
  return (hueControl << 16) | (sourceControl << 8) | kindControl;
}

export function ensureVictimPalettePipeline(scene: Phaser.Scene): void {
  const renderer = scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
  if (!renderer.pipelines.get(VICTIM_PALETTE_PIPELINE)) {
    renderer.pipelines.add(VICTIM_PALETTE_PIPELINE, new VictimPalettePipeline(scene.game));
  }
}
