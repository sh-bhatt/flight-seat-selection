'use client';

import { PriceBreakdown } from '@/components/summary/PriceBreakdown';
import { Button } from '@/components/ui/Button';
import { SeatIcon } from '@/components/ui/Icons';
import { Tooltip } from '@/components/ui/Tooltip';
import { useBooking } from '@/context/BookingContext';
import {
  getAssignedCount,
  getUnassignedCount,
  isBookingComplete,
} from '@/state/selectors';

interface PriceSummaryProps {
  onContinue: () => void;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
        <SeatIcon className="size-6" />
      </span>
      <p className="text-sm font-semibold">No seats selected yet</p>
      <p className="text-xs text-ink-muted">
        Pick a seat on the map to see your price.
      </p>
    </div>
  );
}

export function PriceSummary({ onContinue }: PriceSummaryProps) {
  const state = useBooking();
  const remaining = getUnassignedCount(state);
  const isComplete = isBookingComplete(state);
  const blockedHint = isComplete
    ? undefined
    : `${remaining} ${remaining === 1 ? 'passenger still needs' : 'passengers still need'} a seat`;

  return (
    <section aria-label="Price summary" className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">Price summary</h2>
      {getAssignedCount(state) === 0 ? <EmptyState /> : <PriceBreakdown />}

      <Tooltip content={blockedHint}>
        {(describedBy) => (
          <Button
            className="w-full"
            aria-disabled={!isComplete}
            aria-describedby={describedBy}
            onClick={() => {
              if (isComplete) onContinue();
            }}
          >
            Continue
          </Button>
        )}
      </Tooltip>
    </section>
  );
}
