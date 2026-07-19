/**
 * Combo rank tiers — the visual half of the phase system. Thresholds mirror
 * the music layers in MusicManager.mixForCombo (echo at 2, klezmer at 4,
 * klezmer-max at 8) so every rank-up lands on an audible change; tier 4 is the
 * prestige tier beyond the music's range. Keep in sync if either side moves.
 */
export interface ComboRank {
  tier: number; // 0 = unranked
  name: string; // one-shot announcement word ('' for tier 0)
  minCombo: number;
  color: string; // comboText fill; white at the rainbow tier so tint carries hue
  fontSize: number;
  rainbow: boolean; // hue-cycling tint on the counter and announcement
  shakeOnEnter: boolean;
}

export const COMBO_RANKS: ComboRank[] = [
  { tier: 0, name: '', minCombo: 0, color: '#ffd34e', fontSize: 20, rainbow: false, shakeOnEnter: false },
  { tier: 1, name: 'SPLAT!', minCombo: 2, color: '#ffd34e', fontSize: 20, rainbow: false, shakeOnEnter: false },
  { tier: 2, name: 'DIRTY!', minCombo: 4, color: '#ff8a5c', fontSize: 24, rainbow: false, shakeOnEnter: false },
  { tier: 3, name: 'CRAPTACULAR!', minCombo: 8, color: '#ff5b57', fontSize: 28, rainbow: false, shakeOnEnter: false },
  { tier: 4, name: 'SHITSTORM!!', minCombo: 13, color: '#ffffff', fontSize: 33, rainbow: true, shakeOnEnter: true },
];

export function rankForCombo(combo: number): ComboRank {
  for (let i = COMBO_RANKS.length - 1; i > 0; i--) {
    if (combo >= COMBO_RANKS[i].minCombo) return COMBO_RANKS[i];
  }
  return COMBO_RANKS[0];
}
