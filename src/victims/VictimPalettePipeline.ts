import Phaser from 'phaser';

export const VICTIM_PALETTE_PIPELINE = 'VictimPalette';

const SOURCE_CONTROLS = [0, 128, 255];
const CAR_CONTROL = 255;

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
  // source variant (0, 0.5, 1), and B selects clothing or car paint.
  vec3 control = outTint.bgr;
  vec3 sourceColor;
  float maxLuminance;
  float matchStart;
  float matchEnd;
  float targetSaturation;
  float targetValue;

  if (control.b < 0.5) {
    if (control.g < 0.25) {
      sourceColor = vec3(0.314, 0.318, 0.310);
      maxLuminance = 0.50;
    } else if (control.g < 0.75) {
      sourceColor = vec3(0.149, 0.455, 0.404);
      maxLuminance = 0.54;
    } else {
      sourceColor = vec3(0.435, 0.282, 0.122);
      maxLuminance = 0.38;
    }
    matchStart = 0.08;
    matchEnd = 0.18;
    targetSaturation = 0.66;
    targetValue = 0.74;
  } else {
    // Faded-red sedan, yellow taxi, and pale-blue van body palettes. Neutral
    // doors/panels, glass, chrome, tires, lights, and drivers do not match.
    if (control.g < 0.25) {
      sourceColor = vec3(0.690, 0.145, 0.145);
    } else if (control.g < 0.75) {
      sourceColor = vec3(0.925, 0.620, 0.075);
    } else {
      sourceColor = vec3(0.315, 0.525, 0.655);
    }
    maxLuminance = 1.0;
    matchStart = 0.10;
    matchEnd = 0.28;
    targetSaturation = 0.72;
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

  // Keep the source luminance so highlights, folds, rust, and dents survive.
  float targetLuminance = max(dot(targetColor, LUMA), 0.025);
  vec3 recolored = clamp(targetColor * (luminance / targetLuminance), 0.0, 1.0);
  vec3 color = mix(texture.rgb, recolored, material * 0.92);

  // Phaser's sprite renderer uses premultiplied alpha.
  gl_FragColor = vec4(color * outTint.a, texture.a * outTint.a);
}
`;

/**
 * Selectively recolors pedestrian clothing and car paint without extra art.
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

export function victimPaletteTint(hue: number, variant: number, kind: 'ped' | 'car'): number {
  const hueControl = Phaser.Math.Clamp(Math.round(hue * 255), 0, 255);
  const sourceControl = SOURCE_CONTROLS[variant] ?? SOURCE_CONTROLS[0];
  const kindControl = kind === 'car' ? CAR_CONTROL : 0;
  return (hueControl << 16) | (sourceControl << 8) | kindControl;
}

export function ensureVictimPalettePipeline(scene: Phaser.Scene): void {
  const renderer = scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
  if (!renderer.pipelines.get(VICTIM_PALETTE_PIPELINE)) {
    renderer.pipelines.add(VICTIM_PALETTE_PIPELINE, new VictimPalettePipeline(scene.game));
  }
}
