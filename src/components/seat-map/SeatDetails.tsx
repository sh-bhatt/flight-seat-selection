import {
  CATEGORY_LABEL,
  POSITION_LABEL,
  getStatusLabel,
} from '@/components/seat-map/seatDisplay';
import { formatCurrency } from '@/lib/formatCurrency';
import type { Seat, SeatStatus } from '@/types';

interface SeatDetailsProps {
  seat: Seat;
  status: SeatStatus;
  ownerName?: string;
}

function SeatDetails({ seat, status, ownerName }: SeatDetailsProps) {
  const statusLabel = getStatusLabel(status, ownerName);
  return (
    <div className="flex flex-col gap-0.5 text-left">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">Seat {seat.id}</span>
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(seat.price)}
        </span>
      </div>
      <p className="text-xs text-ink-muted">
        {CATEGORY_LABEL[seat.category]} · {POSITION_LABEL[seat.position]}
      </p>
      <p className="text-xs font-medium capitalize">{statusLabel}</p>
    </div>
  );
}

/** Desktop hover/focus popover, anchored above its seat. */
export function SeatTooltip({
  id,
  ...details
}: SeatDetailsProps & { id: string }) {
  return (
    <div
      id={id}
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-44 -translate-x-1/2 rounded-xl border border-line bg-surface px-3 py-2 shadow-xl shadow-black/15 md:block"
    >
      <SeatDetails {...details} />
    </div>
  );
}

/** Mobile bottom bar for the last tapped seat (there is no hover on touch). */
export function SeatDetailsBar(props: SeatDetailsProps) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 bottom-[var(--summary-bar-height)] z-40 border-t border-line bg-surface px-5 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] md:hidden"
    >
      <SeatDetails {...props} />
    </div>
  );
}
