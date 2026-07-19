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

export interface ComboAnnouncement {
  text: string;
  color: string;
}

export function comboOnPickup(kind: string, t: ComboTimers): ComboAnnouncement | null {
  if ((kind === 'rainbow' && t.gas > 0) || (kind === 'pea' && t.rainbow > 0))
    return { text: 'RAINBOW GAS!', color: '#7be07b' };
  return null; // pea+chilli "fiery explosion" slots in here next
}
