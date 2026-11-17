'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PlaneIcon } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { FLIGHT } from '@/data/flight';
import { getAssignedCount } from '@/state/selectors';

export function AppHeader() {
  const state = useBooking();
  const { reset } = useBookingActions();
  const { showToast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);

  const assignedCount = getAssignedCount(state);

  function performReset() {
    reset();
    setIsConfirming(false);
    showToast('Booking reset', 'info');
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-ink">
          <PlaneIcon className="size-5" />
        </span>
        <div>
          <h1 className="text-lg leading-tight font-semibold tracking-tight">
            Seat selection
          </h1>
          <p className="text-xs text-ink-muted">
            <span className="font-semibold text-foreground">
              {FLIGHT.origin} → {FLIGHT.destination}
            </span>{' '}
            · {FLIGHT.number} · {FLIGHT.date}
          </p>
        </div>
      </div>

      <Button
        variant="secondary"
        onClick={() => (assignedCount > 0 ? setIsConfirming(true) : performReset())}
      >
        Reset
      </Button>

      <ConfirmDialog
        open={isConfirming}
        title="Reset booking?"
        confirmLabel="Reset"
        onConfirm={performReset}
        onCancel={() => setIsConfirming(false)}
      >
        This clears {assignedCount} seat{' '}
        {assignedCount === 1 ? 'selection' : 'selections'} and returns to a single
        passenger.
      </ConfirmDialog>
    </header>
  );
}
