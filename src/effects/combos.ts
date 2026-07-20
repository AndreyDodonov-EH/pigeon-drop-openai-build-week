/**
 * Pickup-combo announcements. Emission-side combining lives in the
 * GuanoStream flags (GuanoEffects/GasSim); this table only names the
 * moment the second half of a pair is collected.
 */
export interface ComboTimers {
  rainbow: number;
  gas: number;
  chilli: number;
}

export type ComboEffect = keyof ComboTimers;

export interface ComboAnnouncement {
  text: string;
  color: string;
  /**
   * Partner effects already running when the pair completed. Their timers get
   * refreshed to full so the combo runs its whole duration instead of dying
   * with the half that was picked up first.
   */
  refresh: ComboEffect[];
  /** Detonate: ignite the airborne gas cloud in a fireball at the pickup. */
  boom?: boolean;
}

export function comboOnPickup(kind: string, t: ComboTimers): ComboAnnouncement | null {
  const comboKind = kind === 'rainbow' || kind === 'chilli' || kind === 'pea';
  // The picked item's own timer is already running when this is called, so
  // "all three > 0" means this pickup just completed the full set.
  if (comboKind && t.rainbow > 0 && t.gas > 0 && t.chilli > 0)
    return {
      text: 'DISCO!',
      color: '#ff7ad9',
      refresh: ['rainbow', 'gas', 'chilli'],
      boom: true,
    };
  if (kind === 'rainbow' && t.gas > 0)
    return { text: 'RAINBOW GAS!', color: '#7be07b', refresh: ['gas'] };
  if (kind === 'pea' && t.rainbow > 0)
    return { text: 'RAINBOW GAS!', color: '#7be07b', refresh: ['rainbow'] };
  if (kind === 'chilli' && t.gas > 0)
    return { text: 'DRAGON BREATH!', color: '#ff9c42', refresh: ['gas'], boom: true };
  if (kind === 'pea' && t.chilli > 0)
    return { text: 'DRAGON BREATH!', color: '#ff9c42', refresh: ['chilli'], boom: true };
  if (kind === 'chilli' && t.rainbow > 0)
    return { text: 'FIREWORKS!', color: '#ffd75e', refresh: ['rainbow'] };
  if (kind === 'rainbow' && t.chilli > 0)
    return { text: 'FIREWORKS!', color: '#ffd75e', refresh: ['chilli'] };
  return null;
}
