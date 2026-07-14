import Phaser from 'phaser';

/**
 * Metaball post-processing for the goo layer.
 *
 * The goo RenderTexture holds soft radial-falloff stamps, one per particle;
 * their summed alpha is a scalar field. This shader thresholds that field into
 * a hard liquid silhouette, shades a darker rim near the surface, and fakes a
 * wet specular highlight from the field's gradient (a cheap surface normal).
 */
const FRAG = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uTexel;
varying vec2 outTexCoord;

const float EDGE0 = 0.30;
const float EDGE1 = 0.40;

void main() {
  vec4 s = texture2D(uMainSampler, outTexCoord);
  float a = s.a;

  float body = smoothstep(EDGE0, EDGE1, a);
  if (body <= 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // average particle colour under the field (stamps are premultiplied)
  vec3 base = s.rgb / max(a, 0.001);

  // darker, denser-looking rim near the surface
  float interior = smoothstep(EDGE1, EDGE1 + 0.22, a);
  vec3 col = mix(base * 0.52, base, interior);

  // gradient of the field ~ surface normal; light from upper-left
  float aR = texture2D(uMainSampler, outTexCoord + vec2(uTexel.x * 2.0, 0.0)).a;
  float aD = texture2D(uMainSampler, outTexCoord + vec2(0.0, uTexel.y * 2.0)).a;
  vec2 grad = vec2(aR - a, aD - a);
  float gl = length(grad);
  vec2 n = grad / max(gl, 0.0001);
  float spec = clamp(dot(n, normalize(vec2(-0.55, -0.84))), 0.0, 1.0);
  spec = pow(spec, 4.0) * smoothstep(0.0, 0.06, gl) * interior;
  col += spec * 0.10;

  // premultiplied output
  gl_FragColor = vec4(col * body, body * 0.96);
}
`;

export class GooPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, name: 'GooPipeline', fragShader: FRAG });
  }

  onPreRender(): void {
    this.set2f('uTexel', 1 / this.renderer.width, 1 / this.renderer.height);
  }
}
