'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { MinusIcon, PlusIcon } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { formatCount } from '@/lib/formatCount';
import { MAX_PASSENGERS, MIN_PASSENGERS } from '@/state/bookingReducer';
import { getSeatedPassengersRemovedBy } from '@/state/selectors';

/** Compact − / count / + stepper (1–6). Dropping seated passengers asks first. */
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
      showToast(`Removed ${formatCount(seatsLost, 'seated passenger')}`, 'info');
    }
    setPendingCount(null);
  }

  return (
    <>
      <div
        role="group"
        aria-label="Number of passengers"
        className="flex items-center rounded-full bg-surface-sunken p-0.5"
      >
        <IconButton
          size="lg"
          label="Remove a passenger"
          disabled={count <= MIN_PASSENGERS}
          onClick={() => requestCount(count - 1)}
        >
          <MinusIcon />
        </IconButton>
        <output
          aria-live="polite"
          className="w-7 text-center text-sm font-bold tabular-nums"
        >
          {count}
        </output>
        <IconButton
          size="lg"
          label="Add a passenger"
          className="bg-surface shadow-[0_1px_2px_rgba(10,37,64,0.12)]"
          disabled={count >= MAX_PASSENGERS}
          onClick={() => requestCount(count + 1)}
        >
          <PlusIcon />
        </IconButton>
      </div>

      <ConfirmDialog
        open={pendingCount !== null}
        title="Remove passenger?"
        confirmLabel="Remove"
        onConfirm={confirmShrink}
        onCancel={() => setPendingCount(null)}
      >
        This will remove {formatCount(seatsLost, 'seated passenger')} and free{' '}
        {seatsLost === 1 ? 'their seat' : 'their seats'}.
      </ConfirmDialog>
    </>
  );
}
