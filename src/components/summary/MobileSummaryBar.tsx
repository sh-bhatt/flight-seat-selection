'use client';

import { useState } from 'react';
import { ContinueButton } from '@/components/summary/ContinueButton';
import { PriceSummary } from '@/components/summary/PriceSummary';
import { useContinueStep } from '@/components/summary/useContinueStep';
import { AnimatedAmount } from '@/components/ui/AnimatedAmount';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ArrowLeftIcon } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';
import { useBooking } from '@/context/BookingContext';
import { useMainView } from '@/context/ViewContext';
import { getGrandTotal } from '@/state/selectors';

/** Phones: fixed bottom bar with the total, Details (opens the summary sheet) and Continue. */
export function MobileSummaryBar() {
  const state = useBooking();
  const { view, setView } = useMainView();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const step = useContinueStep();

  return (
    <>
      <section
        aria-label="Booking total"
        className="fixed inset-x-0 bottom-0 z-40 flex h-[var(--summary-bar-height)] items-center gap-2 border-t border-line bg-surface px-4 shadow-[0_-8px_24px_-12px_rgba(10,37,64,0.2)] md:hidden"
      >
        {view === 'meals' && (
          <IconButton
            size="xl"
            label="Back to seats"
            className="border border-line"
            onClick={() => setView('seats')}
          >
            <ArrowLeftIcon className="size-5" />
          </IconButton>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-none text-ink-muted">Total</p>
          <p className="mt-1 text-xl leading-none font-extrabold tracking-tight tabular-nums">
            <AnimatedAmount amount={getGrandTotal(state)} />
          </p>
          {step.reason && (
            <p
              id={step.reasonId}
              className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-ink-muted [overflow-wrap:anywhere]"
            >
              {step.reason}
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          aria-expanded={isSheetOpen}
          onClick={() => setIsSheetOpen(true)}
        >
          Details
        </Button>
        <ContinueButton
          step={step}
          size="md"
          label="Continue"
          className="whitespace-nowrap"
        />
      </section>

      <Modal
        variant="sheet"
        open={isSheetOpen}
        title="Your booking"
        onClose={() => setIsSheetOpen(false)}
      >
        <PriceSummary
          onProceed={() => setIsSheetOpen(false)}
        />
      </Modal>
    </>
  );
}
