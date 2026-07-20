import Phaser from 'phaser';

/**
 * Request fullscreen from within a user-gesture handler (pointerdown only —
 * browsers reject it outside a real gesture). Safe to call repeatedly: no-op
 * if already fullscreen or unsupported (iOS Safari has no fullscreen API).
 */
export function requestFullscreen(scene: Phaser.Scene): void {
  const scale = scene.scale;
  if (!scale.fullscreen.available) return; // iOS Safari: unavailable, no-op
  // rotation can drop browser fullscreen behind Phaser's back — trust the
  // DOM, and resync Phaser's flag if it went stale, so this tap re-enters
  const fsEl = document.fullscreenElement ?? (document as any).webkitFullscreenElement;
  if (fsEl) return;
  try {
    if (scale.isFullscreen) scale.stopFullscreen();
    scale.startFullscreen();
  } catch {
    /* user gesture expired or browser refused — try again next tap */
  }
}

function lockLandscape(): void {
  (screen.orientation as any)?.lock?.('landscape')?.catch(() => {});
}

/**
 * Wire the landscape lock to fire once fullscreen actually engages — locking
 * in the same tick as the request silently rejects, since fullscreen isn't
 * active yet. Cleans itself up on scene shutdown.
 */
export function lockLandscapeOnFullscreen(scene: Phaser.Scene): void {
  scene.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, lockLandscape);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, lockLandscape);
  });
}
