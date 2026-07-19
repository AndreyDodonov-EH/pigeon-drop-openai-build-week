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
}

export function comboOnPickup(kind: string, t: ComboTimers): ComboAnnouncement | null {
  if (kind === 'rainbow' && t.gas > 0)
    return { text: 'RAINBOW GAS!', color: '#7be07b', refresh: ['gas'] };
  if (kind === 'pea' && t.rainbow > 0)
    return { text: 'RAINBOW GAS!', color: '#7be07b', refresh: ['rainbow'] };
  return null; // pea+chilli "fiery explosion" slots in here next
}
