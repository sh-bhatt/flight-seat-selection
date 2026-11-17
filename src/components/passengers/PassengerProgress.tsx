'use client';

import { useBooking } from '@/context/BookingContext';
import { getAssignedCount } from '@/state/selectors';

/** "2 of 3 passengers seated" with a thin progress bar. */
export function PassengerProgress() {
  const state = useBooking();
  const total = state.passengers.length;
  const seated = getAssignedCount(state);
  const percent = total === 0 ? 0 : (seated / total) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-ink-muted">
        <span className="font-semibold text-foreground tabular-nums">
          {seated} of {total}
        </span>{' '}
        {total === 1 ? 'passenger' : 'passengers'} seated
      </p>
      <div
        role="progressbar"
        aria-label="Passengers seated"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={seated}
        className="h-1.5 overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          className="h-full rounded-full bg-success transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
