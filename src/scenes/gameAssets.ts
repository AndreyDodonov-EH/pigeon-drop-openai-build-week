import Phaser from 'phaser';
import { preloadGuanoEffects } from '../effects/GuanoEffects';
import { BUILDING_SPRITES, CONNECTOR_SPRITES } from '../world/NearBuildings';

export const PED_VARIANT_COUNT = 10;
export const CAR_VARIANT_COUNT = 6;
// The inline skater outruns the world scroll: high-value, high-lead target.
export const SKATER_VARIANT = 6;
/** texture-key suffixes in cycle order: push -> lift -> glide -> lean-in */
export const SKATER_STRIDE_POSES = ['', '-c', '-b', '-d'];
export const ITEM_PICKUP_KINDS = ['bread', 'fries', 'kebab', 'chilli', 'coffee', 'pea'] as const;
export type ItemPickupKind = (typeof ITEM_PICKUP_KINDS)[number];
/** ped variants that ship grumble/delight voice lines (GameScene owns the
 * chance/cooldown logic that keeps them a garnish, not a soundtrack) */
export const VOCAL_PED_VARIANTS = new Set([0, 2, 3, 5, 7, 8, 9]);

/**
 * The complete GameScene download manifest — every sprite and audio file the
 * game needs. Lives outside GameScene so TitleScene can queue the same files
 * as a background load while the player looks at the key art; Phaser's loader
 * skips any key that already sits in a cache, so queueing twice is free and
 * GameScene's preload only downloads whatever the title screen didn't finish.
 */
export function queueGameAssets(scene: Phaser.Scene): void {
  const load = scene.load;
  preloadGuanoEffects(scene);
  load.audio('music-sneaky', ['assets/audio/music-sneaky.ogg', 'assets/audio/music-sneaky.mp3']);
  load.audio('music-klezmer', ['assets/audio/music-klezmer.ogg', 'assets/audio/music-klezmer.mp3']);
  load.audio('sfx-splat-ped', ['assets/audio/splat.ogg', 'assets/audio/splat.mp3']);
  load.audio('sfx-splat-car', ['assets/audio/splat-car.ogg', 'assets/audio/splat-car.mp3']);
  load.audio('sfx-splat-asphalt', [
    'assets/audio/splat-asphalt.ogg',
    'assets/audio/splat-asphalt.mp3',
  ]);
  load.audio('sfx-hydrant-clank', [
    'assets/audio/hydrant-clank.ogg',
    'assets/audio/hydrant-clank.mp3',
  ]);
  load.audio('sfx-hydrant-jet-loop', [
    'assets/audio/hydrant-jet-loop.ogg',
    'assets/audio/hydrant-jet-loop.mp3',
  ]);
  load.audio('sfx-splash-hydrant', [
    'assets/audio/splash-hydrant.ogg',
    'assets/audio/splash-hydrant.mp3',
  ]);
  load.audio('sfx-koo-irritated', [
    'assets/audio/koo-irritated.ogg',
    'assets/audio/koo-irritated.mp3',
  ]);
  load.audio('sfx-belly-rumble', [
    'assets/audio/belly-rumble.ogg',
    'assets/audio/belly-rumble.mp3',
  ]);
  for (const i of VOCAL_PED_VARIANTS) {
    load.audio(`sfx-ped-grumble-${i}`, [
      `assets/audio/ped-grumble-${i}.ogg`,
      `assets/audio/ped-grumble-${i}.mp3`,
    ]);
    load.audio(`sfx-ped-delight-${i}`, [
      `assets/audio/ped-delight-${i}.ogg`,
      `assets/audio/ped-delight-${i}.mp3`,
    ]);
  }
  load.audio('sfx-car-honk-angry', [
    'assets/audio/car-honk-angry.ogg',
    'assets/audio/car-honk-angry.mp3',
  ]);
  load.audio('sfx-car-honk-happy', [
    'assets/audio/car-honk-happy.ogg',
    'assets/audio/car-honk-happy.mp3',
  ]);
  load.image('portrait-ready', 'assets/portraits/ready.png');
  load.image('portrait-damage', 'assets/portraits/damage.png');
  load.image('portrait-strain', 'assets/portraits/strain.png');
  load.image('portrait-pleased', 'assets/portraits/pleased.png');
  load.image('portrait-panic', 'assets/portraits/panic.png');
  load.image('portrait-hungry', 'assets/portraits/hungry.png');
  load.image('tap-hand', 'assets/ui/tap-hand.png');
  load.image('drag-hand', 'assets/ui/drag-hand.png');
  load.image('pigeon-f0', 'assets/sprites/pigeon-f0.png');
  load.image('pigeon-f1', 'assets/sprites/pigeon-f1.png');
  load.image('pigeon-f2', 'assets/sprites/pigeon-f2.png');
  load.image('pigeon-look-f0', 'assets/sprites/pigeon-look-f0.png');
  load.image('pigeon-look-f1', 'assets/sprites/pigeon-look-f1.png');
  load.image('pigeon-look-f2', 'assets/sprites/pigeon-look-f2.png');
  for (let i = 0; i < CAR_VARIANT_COUNT; i++) {
    load.image(`car-${i}`, `assets/sprites/car-${i}.png`);
    load.image(`car-${i}-r`, `assets/sprites/car-${i}-r.png`);
    load.image(`car-${i}-rainbow`, `assets/sprites/car-${i}-rainbow.png`);
  }
  for (let i = 0; i < PED_VARIANT_COUNT; i++) {
    load.image(`ped-${i}`, `assets/sprites/ped-${i}.png`);
    load.image(`ped-${i}-r`, `assets/sprites/ped-${i}-r.png`);
    load.image(`ped-${i}-rainbow`, `assets/sprites/ped-${i}-rainbow.png`);
  }
  // extra stride poses; the skater runs a 4-frame leg cycle instead of bobbing
  for (const suffix of SKATER_STRIDE_POSES.slice(1)) {
    load.image(
      `ped-${SKATER_VARIANT}${suffix}`,
      `assets/sprites/ped-${SKATER_VARIANT}${suffix}.png`,
    );
  }
  for (const key of [...BUILDING_SPRITES, ...CONNECTOR_SPRITES]) {
    load.image(key, `assets/sprites/${key}.png`);
  }
  // emissive café windows, ADD-blended over the facade after dark
  load.image('bg-building-2-lit', 'assets/sprites/bg-building-2-lit.png');
  for (let i = 0; i < 3; i++) {
    load.image(`bg-cloud-${i}`, `assets/sprites/bg-cloud-${i}.png`);
  }
  load.image('bg-lamp', 'assets/sprites/bg-lamp.png');
  load.image('bg-tree', 'assets/sprites/bg-tree.png');
  load.image('bg-mailbox', 'assets/sprites/bg-mailbox.png');
  load.image('hydrant-0', 'assets/sprites/hydrant-0.png');
  load.image('hydrant-1', 'assets/sprites/hydrant-1.png');
  load.image('prop-fan-f0', 'assets/sprites/prop-fan-f0.png');
  load.image('prop-fan-f1', 'assets/sprites/prop-fan-f1.png');
  load.image('water-col', 'assets/sprites/water-col.png');
  load.image('water-crown', 'assets/sprites/water-crown.png');
  load.image('pickup-rainbow', 'assets/sprites/pickup-rainbow.png');
  for (const kind of ITEM_PICKUP_KINDS) {
    if (kind === 'pea') {
      load.image('pickup-pea-0', 'assets/sprites/pickup-pea-0.png');
      load.image('pickup-pea-1', 'assets/sprites/pickup-pea-1.png');
    } else {
      load.image(`pickup-${kind}`, `assets/sprites/pickup-${kind}.png`);
    }
  }
}
