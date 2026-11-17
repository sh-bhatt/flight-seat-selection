import {
  getSeatDescription,
  getStatusLabel,
} from '@/components/seat-map/seatDisplay';
import { formatCurrency } from '@/lib/formatCurrency';
import type { Seat, SeatStatus } from '@/types';

interface SeatDetailsBarProps {
  seat: Seat;
  status: SeatStatus;
  ownerName?: string;
}

/** Mobile bottom bar for the last tapped seat (there is no hover on touch). */
export function SeatDetailsBar({ seat, status, ownerName }: SeatDetailsBarProps) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 bottom-[var(--summary-bar-height)] z-40 border-t border-line bg-surface px-5 py-3 shadow-[0_-8px_24px_-12px_rgba(10,37,64,0.2)] md:hidden"
    >
      <div className="flex flex-col gap-0.5 text-left">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-base font-extrabold">Seat {seat.id}</span>
          <span className="text-sm font-bold tabular-nums">
            {formatCurrency(seat.price)}
          </span>
        </div>
        <p className="text-xs text-ink-muted">{getSeatDescription(seat)}</p>
        <p className="text-xs font-semibold first-letter:uppercase [overflow-wrap:anywhere]">
          {getStatusLabel(status, ownerName)}
        </p>
      </div>
    </div>
  );
}
