interface SeatBadgeProps {
  seatId: string | null;
}

/** Assigned seat as a pill, or a muted "No seat". */
export function SeatBadge({ seatId }: SeatBadgeProps) {
  if (seatId === null) {
    return <span className="text-xs text-ink-muted">No seat</span>;
  }
  return (
    <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-bold tabular-nums text-accent">
      {seatId}
    </span>
  );
}
