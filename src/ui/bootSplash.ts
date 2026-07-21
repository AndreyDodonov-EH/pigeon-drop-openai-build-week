/**
 * Removes the index.html #boot-splash overlay (the pure-CSS loader shown
 * while the JS bundle and first scene's assets download). Called by whichever
 * scene draws first — TitleScene normally, GameScene on ?notitle — and safe
 * to call more than once.
 */
export function hideBootSplash(): void {
  const el = document.getElementById('boot-splash');
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(() => el.remove(), 300);
}
