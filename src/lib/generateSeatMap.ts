import { LAYOUTS } from '@/data/layouts';
import {
  getCategoryPrice,
  getSeatCategory,
  isSeatOccupied,
} from '@/data/seatPricing';
import type { LayoutConfig, LayoutId, Seat, SeatPosition } from '@/types';

/** Window = outermost seat of the cabin; aisle = next to a gap; otherwise middle. */
function getSeatPosition(
  columnGroups: string[][],
  groupIndex: number,
  indexInGroup: number,
): SeatPosition {
  const group = columnGroups[groupIndex];
  const isLastGroup = groupIndex === columnGroups.length - 1;
  const isFirstInGroup = indexInGroup === 0;
  const isLastInGroup = indexInGroup === group.length - 1;

  if ((groupIndex === 0 && isFirstInGroup) || (isLastGroup && isLastInGroup)) {
    return 'window';
  }
  const touchesAisle =
    (isFirstInGroup && groupIndex > 0) || (isLastInGroup && !isLastGroup);
  return touchesAisle ? 'aisle' : 'middle';
}

function buildSeats(layout: LayoutConfig): Seat[] {
  const seats: Seat[] = [];
  for (let row = 1; row <= layout.rows; row += 1) {
    layout.columnGroups.forEach((group, groupIndex) => {
      group.forEach((column, indexInGroup) => {
        const id = `${row}${column}`;
        const position = getSeatPosition(
          layout.columnGroups,
          groupIndex,
          indexInGroup,
        );
        const category = getSeatCategory(layout.id, id, row, position);
        seats.push({
          id,
          row,
          column,
          category,
          price: getCategoryPrice(category),
          isOccupied: isSeatOccupied(layout.id, id),
          position,
        });
      });
    });
  }
  return seats;
}

export function generateSeatMap(layoutId: LayoutId): Seat[] {
  return buildSeats(LAYOUTS[layoutId]);
}
