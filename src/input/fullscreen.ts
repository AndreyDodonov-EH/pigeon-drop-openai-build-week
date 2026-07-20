import Phaser from 'phaser';

/**
 * Request fullscreen from within a user-gesture handler (pointerdown only —
 * browsers reject it outside a real gesture). Safe to call repeatedly: no-op
 * if already fullscreen or unsupported (iOS Safari has no fullscreen API).
 * Returns whether a real request was actually issued, so callers who need
 * to react to an upcoming fullscreen transition don't have to re-derive the
 * same guards themselves (and risk disagreeing with this function's own).
 */
export function requestFullscreen(scene: Phaser.Scene): boolean {
  const scale = scene.scale;
  if (!scale.fullscreen.available) return false; // iOS Safari: unavailable, no-op
  // rotation can drop browser fullscreen behind Phaser's back — trust the
  // DOM, and resync Phaser's flag if it went stale, so this tap re-enters
  const fsEl = document.fullscreenElement ?? (document as any).webkitFullscreenElement;
  if (fsEl) return false;
  try {
    if (scale.isFullscreen) scale.stopFullscreen();
    scale.startFullscreen();
    return true;
  } catch {
    /* user gesture expired or browser refused — try again next tap */
    return false;
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
