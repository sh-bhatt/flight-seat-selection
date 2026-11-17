import { toSeatId } from '@/lib/generateSeatMap';
import type { LayoutConfig } from '@/types';

export type NavigationKey =
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'Home'
  | 'End';

export type SeatGrid = readonly (readonly string[])[];

const NAVIGATION_KEYS: readonly string[] = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
];

export function isNavigationKey(key: string): key is NavigationKey {
  return NAVIGATION_KEYS.includes(key);
}

/** Seat ids per row in visual left-to-right order; aisles are skipped. */
export function buildSeatGrid(layout: LayoutConfig): SeatGrid {
  const columns = layout.columnGroups.flat();
  return Array.from({ length: layout.rows }, (_, i) =>
    columns.map((column) => toSeatId(i + 1, column)),
  );
}

/** Where an arrow/Home/End key moves focus from `currentId`; null at an edge. */
export function getNextSeatId(
  grid: SeatGrid,
  currentId: string,
  key: NavigationKey,
): string | null {
  const rowIndex = grid.findIndex((row) => row.includes(currentId));
  if (rowIndex === -1) return null;
  const columnIndex = grid[rowIndex].indexOf(currentId);
  const lastColumn = grid[rowIndex].length - 1;

  switch (key) {
    case 'ArrowLeft':
      return columnIndex > 0 ? grid[rowIndex][columnIndex - 1] : null;
    case 'ArrowRight':
      return columnIndex < lastColumn ? grid[rowIndex][columnIndex + 1] : null;
    case 'ArrowUp':
      return rowIndex > 0 ? grid[rowIndex - 1][columnIndex] : null;
    case 'ArrowDown':
      return rowIndex < grid.length - 1 ? grid[rowIndex + 1][columnIndex] : null;
    case 'Home':
      return grid[rowIndex][0];
    case 'End':
      return grid[rowIndex][lastColumn];
  }
}
