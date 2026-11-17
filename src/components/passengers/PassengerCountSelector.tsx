'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { MinusIcon, PlusIcon } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { MAX_PASSENGERS, MIN_PASSENGERS } from '@/state/bookingReducer';
import { getSeatedPassengersRemovedBy } from '@/state/selectors';

function getHelperText(count: number): string {
  if (count >= MAX_PASSENGERS) return `Maximum of ${MAX_PASSENGERS} passengers`;
  if (count <= MIN_PASSENGERS) return 'At least 1 passenger is required';
  return `Choose ${MIN_PASSENGERS}–${MAX_PASSENGERS} passengers`;
}

export function PassengerCountSelector() {
  const state = useBooking();
  const { setPassengerCount } = useBookingActions();
  const { showToast } = useToast();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  const count = state.passengers.length;
  const seatsLost =
    pendingCount === null ? 0 : getSeatedPassengersRemovedBy(state, pendingCount);

  function requestCount(next: number) {
    if (getSeatedPassengersRemovedBy(state, next) > 0) setPendingCount(next);
    else setPassengerCount(next);
  }

  function confirmShrink() {
    if (pendingCount !== null) {
      setPassengerCount(pendingCount);
      showToast(
        `Removed ${seatsLost} seated ${seatsLost === 1 ? 'passenger' : 'passengers'}`,
        'info',
      );
    }
    setPendingCount(null);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span id="passenger-count-label" className="text-sm font-semibold">
          Passengers
        </span>
        <div
          role="group"
          aria-labelledby="passenger-count-label"
          className="flex items-center rounded-xl border border-line bg-surface-sunken p-0.5"
        >
          <IconButton
            label="Remove a passenger"
            disabled={count <= MIN_PASSENGERS}
            onClick={() => requestCount(count - 1)}
          >
            <MinusIcon />
          </IconButton>
          <output
            aria-live="polite"
            className="w-8 text-center text-base font-semibold tabular-nums"
          >
            {count}
          </output>
          <IconButton
            label="Add a passenger"
            disabled={count >= MAX_PASSENGERS}
            onClick={() => requestCount(count + 1)}
          >
            <PlusIcon />
          </IconButton>
        </div>
      </div>
      <p className="text-xs text-ink-muted">{getHelperText(count)}</p>

      <ConfirmDialog
        open={pendingCount !== null}
        title="Remove passenger?"
        confirmLabel="Remove"
        onConfirm={confirmShrink}
        onCancel={() => setPendingCount(null)}
      >
        This will remove {seatsLost} seated{' '}
        {seatsLost === 1 ? 'passenger' : 'passengers'} and free{' '}
        {seatsLost === 1 ? 'their seat' : 'their seats'}.
      </ConfirmDialog>
    </div>
  );
}
