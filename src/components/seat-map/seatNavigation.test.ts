import { describe, expect, it } from 'vitest';
import { LAYOUTS } from '@/data/layouts';
import { buildSeatGrid, getNextSeatId } from '@/components/seat-map/seatNavigation';

describe('seat grid navigation', () => {
  const grid = buildSeatGrid(LAYOUTS['3-2']);

  it('builds one row per layout row, skipping aisles', () => {
    expect(grid).toHaveLength(20);
    expect(grid[0]).toEqual(['1A', '1B', '1C', '1D', '1E']);
  });

  it('moves across the aisle with left/right', () => {
    expect(getNextSeatId(grid, '5C', 'ArrowRight')).toBe('5D');
    expect(getNextSeatId(grid, '5D', 'ArrowLeft')).toBe('5C');
  });

  it('moves between rows with up/down', () => {
    expect(getNextSeatId(grid, '5C', 'ArrowDown')).toBe('6C');
    expect(getNextSeatId(grid, '5C', 'ArrowUp')).toBe('4C');
  });

  it('stops at the edges', () => {
    expect(getNextSeatId(grid, '1A', 'ArrowLeft')).toBeNull();
    expect(getNextSeatId(grid, '1A', 'ArrowUp')).toBeNull();
    expect(getNextSeatId(grid, '20E', 'ArrowDown')).toBeNull();
    expect(getNextSeatId(grid, '20E', 'ArrowRight')).toBeNull();
  });

  it('jumps to row ends with Home/End', () => {
    expect(getNextSeatId(grid, '7B', 'Home')).toBe('7A');
    expect(getNextSeatId(grid, '7B', 'End')).toBe('7E');
  });

  it('works for any layout', () => {
    const wide = buildSeatGrid(LAYOUTS['2-3-2']);
    expect(wide[0]).toHaveLength(7);
    expect(getNextSeatId(wide, '3B', 'ArrowRight')).toBe('3C');
  });
});
