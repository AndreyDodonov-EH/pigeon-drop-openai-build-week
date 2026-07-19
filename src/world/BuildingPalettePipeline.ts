import Phaser from 'phaser';

export const BUILDING_PALETTE_PIPELINE = 'BuildingPalette';

const FRAG = `
#define SHADER_NAME BUILDING_PALETTE_FS

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler[%count%];
uniform vec3 uAmbient;

varying vec2 outTexCoord;
varying float outTexId;
varying vec4 outTint;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

void main() {
  vec4 texture;
  %forloop%

  // Per-vertex tint carries the repaint controls (same trick as the victim
  // pipeline, so every building shares one batch): R = hue shift centered at
  // 0.5, G = brightness centered at 0.5.
  vec3 control = outTint.bgr;
  float shift = (control.r * 2.0 - 1.0) * 0.11;
  float valMul = 0.86 + control.g * 0.28;

  vec3 hsv = rgb2hsv(texture.rgb);
  // Only saturated pixels repaint: painted walls, awnings, doors. Outlines,
  // concrete, glass and other near-greys keep their color, so the shift reads
  // as different paint on the same building, not a full-image hue rotate.
  float satMask = smoothstep(0.14, 0.34, hsv.y);
  float darkMask = smoothstep(0.05, 0.13, hsv.z);
  // Repaint like weathered paint, not a color overlay: drop the saturation
  // of the shifted material and keep brightness jitter inside the repaint so
  // outlines and glass never carry the "tint layer" look.
  vec3 repaint = hsv2rgb(vec3(fract(hsv.x + shift), hsv.y * 0.72, clamp(hsv.z * valMul, 0.0, 1.0)));
  // Re-add the pixel's deviation from its flat-chroma reconstruction so the
  // painterly grain (brick speckle, shading drift) survives the recolor —
  // same trick the victim pipeline uses.
  float lum = dot(texture.rgb, LUMA);
  vec3 flat_ = hsv2rgb(vec3(hsv.x, hsv.y, 1.0)) * (lum / max(dot(hsv2rgb(vec3(hsv.x, hsv.y, 1.0)), LUMA), 0.025));
  vec3 detail = texture.rgb - flat_;
  repaint = clamp(repaint + detail * 0.55, 0.0, 1.0);
  vec3 color = mix(texture.rgb, repaint, satMask * darkMask * 0.8);

  // Uniform background grade: mildly desaturate and lift toward a pale,
  // neutral stone haze so the whole layer recedes and the pigeon/victims stay
  // the most saturated things on screen. Keep the target's channels close
  // together: a stronger ochre target makes the whole street read greenish.
  // (texture rgb is premultiplied — scale the haze target by alpha so fully
  // transparent pixels stay black instead of glowing as pale rectangles)
  float gradeLum = dot(color, LUMA);
  color = mix(color, vec3(gradeLum), 0.16);
  color = mix(color, vec3(0.91, 0.89, 0.86) * texture.a, 0.08);

  // Time-of-day ambient light (day = white, dusk warm, night cool-dark).
  color *= uAmbient;

  // Phaser's sprite renderer uses premultiplied alpha.
  gl_FragColor = vec4(color * outTint.a, texture.a * outTint.a);
}
`;

/**
 * Subtle whole-facade repaint for background buildings: hue-shifts saturated
 * paint while leaving outlines/glass/concrete alone, plus a brightness jitter,
 * so a handful of facade sprites reads as a whole street of different houses.
 */
export class BuildingPalettePipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
  private ambientR = 1;
  private ambientG = 1;
  private ambientB = 1;

  constructor(game: Phaser.Game) {
    super({ game, fragShader: FRAG });
  }

  /** DayNight pushes the current ambient light color here once per frame. */
  setAmbient(r: number, g: number, b: number): void {
    this.ambientR = r;
    this.ambientG = g;
    this.ambientB = b;
  }

  onPreRender(): void {
    this.set3f('uAmbient', this.ambientR, this.ambientG, this.ambientB);
  }
}

/**
 * @param hueShift -1..1 → about ±0.11 of a hue turn
 * @param brightness -1..1 → about ±14% value
 */
export function buildingPaletteTint(hueShift: number, brightness: number): number {
  const r = Phaser.Math.Clamp(Math.round((hueShift * 0.5 + 0.5) * 255), 0, 255);
  const g = Phaser.Math.Clamp(Math.round((brightness * 0.5 + 0.5) * 255), 0, 255);
  return (r << 16) | (g << 8);
}

export function ensureBuildingPalettePipeline(scene: Phaser.Scene): void {
  const renderer = scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
  if (!renderer.pipelines.get(BUILDING_PALETTE_PIPELINE)) {
    renderer.pipelines.add(BUILDING_PALETTE_PIPELINE, new BuildingPalettePipeline(scene.game));
  }
}
