import type { LayoutId, SeatCategory, SeatPosition } from '@/types';

export const CATEGORY_PRICE: Record<SeatCategory, number> = {
  standard: 0,
  premium: 250,
  'extra-legroom': 350,
};

export const EXTRA_LEGROOM_ROWS: readonly number[] = [1, 10];
export const PREMIUM_ROW_RANGE = { from: 2, to: 5 } as const;

/** Share of seats marked occupied (approximate, hash-driven). */
export const OCCUPANCY_RATE = 0.2;

/**
 * Explicit category overrides so the 3-2 layout matches the sample design exactly.
 * Takes precedence over the row/position rules.
 */
export const CATEGORY_OVERRIDES: Partial<
  Record<LayoutId, Record<string, SeatCategory>>
> = {
  '3-2': {
    '1A': 'standard',
    '1B': 'standard',
    '1C': 'extra-legroom',
    '1D': 'standard',
    '1E': 'premium',
    '2A': 'extra-legroom',
    '2B': 'standard',
  },
};

export function getSeatCategory(
  layoutId: LayoutId,
  seatId: string,
  row: number,
  position: SeatPosition,
): SeatCategory {
  const override = CATEGORY_OVERRIDES[layoutId]?.[seatId];
  if (override) return override;
  if (EXTRA_LEGROOM_ROWS.includes(row)) return 'extra-legroom';
  const inPremiumRows =
    row >= PREMIUM_ROW_RANGE.from && row <= PREMIUM_ROW_RANGE.to;
  if (inPremiumRows && position !== 'middle') return 'premium';
  return 'standard';
}

export function getCategoryPrice(category: SeatCategory): number {
  return CATEGORY_PRICE[category];
}

/** Sample-design seats are pinned as available so the hash never hides them. */
function isOverriddenSeat(layoutId: LayoutId, seatId: string): boolean {
  return CATEGORY_OVERRIDES[layoutId]?.[seatId] !== undefined;
}

/** FNV-1a 32-bit hash: stable across server and client. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function isSeatOccupied(layoutId: LayoutId, seatId: string): boolean {
  if (isOverriddenSeat(layoutId, seatId)) return false;
  const bucket = hashString(`${layoutId}:${seatId}`) % 100;
  return bucket < OCCUPANCY_RATE * 100;
}
