import Phaser from 'phaser';

/** Source-art offsets from the car's lower-left corner to its headlamp. */
const LAMP_FROM_BOTTOM = [50, 55, 48, 50, 38, 51] as const;
const LAMP_INSET_X = [10, 9, 9, 9, 7, 10] as const;

/** Car sprite scale the beam/glow pixel sizes below were tuned at (GameScene's
 * desktop VICTIM_SCALE); the fx sizes track any other scale, e.g. the mobile
 * model bump, proportionally. */
const TUNED_AT_SCALE = 0.58;

/**
 * After-dark light attached to a side-on car: a soft forward beam, a bright
 * lamp bloom, and a low reflection on the asphalt. The sprite itself stays in
 * the victim-palette pipeline; these additive layers remain emissive at night.
 */
export class CarHeadlightFx {
  private beam: Phaser.GameObjects.Image;
  private roadGlow: Phaser.GameObjects.Image;
  private lampGlow: Phaser.GameObjects.Image;
  private phase = Math.random() * Math.PI * 2;

  constructor(
    scene: Phaser.Scene,
    private car: Phaser.GameObjects.Sprite,
    private variant: number,
  ) {
    const behindCar = car.depth - 0.002;
    this.beam = scene.add
      .image(0, 0, 'headlight-beam')
      .setOrigin(1, 0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(behindCar)
      .setAlpha(0);
    this.roadGlow = scene.add
      .image(0, 0, 'lamp-glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(behindCar + 0.001)
      .setAlpha(0);
    this.lampGlow = scene.add
      .image(0, 0, 'lamp-glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(car.depth + 0.001)
      .setAlpha(0);
  }

  update(f: number, glow: number): void {
    this.phase += 0.035 * f;

    const sx = Math.abs(this.car.scaleX);
    const sy = Math.abs(this.car.scaleY);
    const frontX = this.car.x - this.car.displayWidth / 2 + LAMP_INSET_X[this.variant] * sx;
    const lampY =
      this.car.y + this.car.displayHeight / 2 - LAMP_FROM_BOTTOM[this.variant] * sy;

    // Squaring the shared emissive level keeps headlights convincingly absent
    // in daylight while still letting them ease on during dusk and linger at dawn.
    const strength = glow * glow;
    const shimmer = 0.97 + Math.sin(this.phase) * 0.03;
    const modelScale = sx / TUNED_AT_SCALE;

    this.beam
      .setPosition(frontX + 1, lampY + 1)
      .setDisplaySize(170 * modelScale, 64 * modelScale)
      .setAngle(-3.5)
      .setAlpha(0.62 * strength * shimmer);

    // The long, low pool makes the beam feel like it is grazing asphalt rather
    // than floating in front of the bumper.
    this.roadGlow
      .setPosition(frontX - 52 * modelScale, lampY + 18 * modelScale)
      .setDisplaySize(148 * modelScale, 24 * modelScale)
      .setAlpha(0.28 * strength * shimmer);

    this.lampGlow
      .setPosition(frontX, lampY)
      .setDisplaySize(24 * modelScale, 24 * modelScale)
      .setAlpha(0.9 * strength * shimmer);
  }

  destroy(): void {
    this.beam.destroy();
    this.roadGlow.destroy();
    this.lampGlow.destroy();
  }
}
