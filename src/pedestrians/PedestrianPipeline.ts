import Phaser from 'phaser';

export const PEDESTRIAN_PIPELINE = 'PedestrianPalette';

const FRAG = `
#define SHADER_NAME PEDESTRIAN_PALETTE_FS

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
  // lets every pedestrian remain in one draw batch. R stores the target hue;
  // G stores the source character (0, 0.5, 1); B is currently reserved.
  vec3 control = outTint.bgr;
  vec3 sourceColor;
  float maxLuminance;
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
  vec3 targetColor = hsvToRgb(vec3(control.r, 0.66, 0.74));

  // Pixel-art shading produces many values for one material. Comparing the
  // normalized RGB direction catches those shades while leaving skin, ink,
  // hair and props alone. Very dark pixels remain the shared outline color.
  float paletteDistance = length(chroma(texture.rgb) - chroma(sourceColor));
  float paletteMask = 1.0 - smoothstep(0.08, 0.18, paletteDistance);
  float visibleTone = smoothstep(0.07, 0.16, luminance);
  // Skin highlights are brighter than all three garment palettes. A source-
  // specific ceiling prevents warm coat colors from catching warm skin tones.
  float belowHighlight = 1.0 - smoothstep(maxLuminance - 0.05, maxLuminance + 0.05, luminance);
  float garment = paletteMask * visibleTone * belowHighlight * texture.a;

  // Keep the source luminance so highlights and folds survive the replacement.
  float targetLuminance = max(dot(targetColor, LUMA), 0.025);
  vec3 recolored = clamp(targetColor * (luminance / targetLuminance), 0.0, 1.0);
  vec3 color = mix(texture.rgb, recolored, garment * 0.92);

  // Phaser's sprite renderer uses premultiplied alpha.
  gl_FragColor = vec4(color * outTint.a, texture.a * outTint.a);
}
`;

/**
 * Selectively recolors a pedestrian's garment palette without additional art.
 *
 * Palette controls travel in Phaser's existing per-vertex tint attribute, so
 * differently colored pedestrians can stay in the same draw batch. They share
 * one shader and the existing textures: no extra texture memory, downloads,
 * atlas entries, or reaction-frame variants.
 */
export class PedestrianPipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
  constructor(game: Phaser.Game) {
    super({ game, fragShader: FRAG });
  }
}

export function ensurePedestrianPipeline(scene: Phaser.Scene): void {
  const renderer = scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
  if (!renderer.pipelines.get(PEDESTRIAN_PIPELINE)) {
    renderer.pipelines.add(PEDESTRIAN_PIPELINE, new PedestrianPipeline(scene.game));
  }
}
