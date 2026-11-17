import type { ReactNode } from 'react';
import { CabinRow } from '@/components/seat-map/CabinRow';
import type { ColumnGroups, Seat } from '@/types';

interface SeatRowProps {
  rowNumber: number;
  columnGroups: ColumnGroups;
  seatsByColumn: ReadonlyMap<string, Seat>;
  renderSeat: (seat: Seat) => ReactNode;
}

export function SeatRow({
  rowNumber,
  columnGroups,
  seatsByColumn,
  renderSeat,
}: SeatRowProps) {
  return (
    <CabinRow
      label={String(rowNumber)}
      columnGroups={columnGroups}
      renderCell={(column) => {
        const seat = seatsByColumn.get(column);
        return seat ? renderSeat(seat) : null;
      }}
    />
  );
}
