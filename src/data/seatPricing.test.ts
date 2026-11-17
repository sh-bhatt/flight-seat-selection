import { describe, expect, it } from 'vitest';
import { LAYOUTS } from '@/data/layouts';
import { BULKHEAD_ROW, getSeatCategory } from '@/data/seatPricing';
import { generateSeatMap } from '@/lib/generateSeatMap';
import type { LayoutConfig } from '@/types';

describe('seat categories from the layout config', () => {
  it("prices every seat of each layout's exit rows as extra legroom", () => {
    for (const layout of Object.values(LAYOUTS)) {
      const exitSeats = generateSeatMap(layout.id).filter((s) =>
        layout.exitRows.includes(s.row),
      );
      expect(exitSeats.length).toBeGreaterThan(0);
      expect(exitSeats.every((s) => s.category === 'extra-legroom')).toBe(true);
    }
  });

  it('follows exitRows when a layout moves its exit', () => {
    const moved: LayoutConfig = { ...LAYOUTS['2-3-2'], exitRows: [14] };
    expect(getSeatCategory(moved, '14D', 14, 'middle')).toBe('extra-legroom');
    expect(getSeatCategory(moved, '10D', 10, 'middle')).toBe('standard');
    expect(getSeatCategory(moved, `${BULKHEAD_ROW}D`, BULKHEAD_ROW, 'middle')).toBe(
      'extra-legroom',
    );
  });
});
