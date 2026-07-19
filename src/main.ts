import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { W, H } from './world/textures';

new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#14161f',
  scale: {
    mode: Phaser.Scale.FIT,
    // the #game flex container centers the canvas; CENTER_BOTH would add its
    // own margins on top and double-shift it off-center
    autoCenter: Phaser.Scale.NO_CENTER,
    // fullscreen the flex container, not Phaser's injected wrapper div,
    // so the canvas stays centered in fullscreen too
    fullscreenTarget: 'game',
  },
  input: {
    activePointers: 3, // mouse + two simultaneous thumbs
    touch: { target: window }, // thumbs rest in the FIT letterbox bars, outside the canvas
  },
  render: {
    antialias: true,
    roundPixels: false,
  },
  scene: [GameScene],
});
