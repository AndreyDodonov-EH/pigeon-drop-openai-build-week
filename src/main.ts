import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { W, H } from './world/textures';

const game = new Phaser.Game({
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

// mobile browsers fire the rotation resize while the old viewport numbers
// are still live, so FIT keeps the previous orientation's size; re-measure
// once the viewport settles (twice — some devices report late)
const remeasure = (): void => {
  setTimeout(() => game.scale.refresh(), 300);
  setTimeout(() => game.scale.refresh(), 900);
};
screen.orientation?.addEventListener('change', remeasure);
window.addEventListener('orientationchange', remeasure);
