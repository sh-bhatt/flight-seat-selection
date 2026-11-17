/** Assigned seat code as a pill, e.g. "12A". */
export function SeatBadge({ seatId }: { seatId: string }) {
  return (
    <span className="rounded-md bg-surface-sunken px-2.5 py-1 text-[13px] leading-none font-bold tabular-nums">
      {seatId}
    </span>
  );
}

/** Marks the passenger who gets the next seat click. */
export function NowBadge() {
  return (
    <span className="rounded-md bg-navy px-2 py-1 text-xs leading-none font-bold text-white">
      Now
    </span>
  );
}
