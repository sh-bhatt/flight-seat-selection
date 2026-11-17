'use client';

import { useState } from 'react';
import { BookingSuccessDialog } from '@/components/summary/BookingSuccessDialog';
import { PriceSummary } from '@/components/summary/PriceSummary';
import { Button } from '@/components/ui/Button';
import { ChevronUpIcon } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';
import { useBooking } from '@/context/BookingContext';
import { formatCurrency } from '@/lib/formatCurrency';
import { getAssignedCount, getGrandTotal } from '@/state/selectors';

/** Phones: sticky bottom bar with the live total; expands into a sheet. */
export function MobileSummaryBar() {
  const state = useBooking();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 flex h-[var(--summary-bar-height)] items-center justify-between gap-3 border-t border-line bg-surface px-4 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] md:hidden">
        <div className="flex flex-col">
          <span className="text-xs text-ink-muted">
            {getAssignedCount(state)} of {state.passengers.length} seated
          </span>
          <span className="text-lg font-bold tabular-nums">
            {formatCurrency(getGrandTotal(state), { forceZero: true })}
          </span>
        </div>
        <Button
          variant="secondary"
          aria-expanded={isSheetOpen}
          onClick={() => setIsSheetOpen(true)}
        >
          Summary
          <ChevronUpIcon className="ml-1 size-4" />
        </Button>
      </div>

      <Modal
        variant="sheet"
        open={isSheetOpen}
        title="Your booking"
        onClose={() => setIsSheetOpen(false)}
      >
        <PriceSummary
          onContinue={() => {
            setIsSheetOpen(false);
            setIsConfirmed(true);
          }}
        />
      </Modal>
      <BookingSuccessDialog
        open={isConfirmed}
        onClose={() => setIsConfirmed(false)}
      />
    </>
  );
}
