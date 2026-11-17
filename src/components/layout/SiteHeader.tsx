'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LogoIcon } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { useMainView } from '@/context/ViewContext';
import { FLIGHT } from '@/data/flight';
import { formatCount } from '@/lib/formatCount';
import {
  getAssignedCount,
  getMealCount,
  hasBookingProgress,
} from '@/state/selectors';

const NAV_ITEM_CLASSES =
  'rounded-md text-sm font-medium text-nav-ink transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

/** Brand bar: wordmark, mock links, currency and "Start over". */
export function SiteHeader() {
  const state = useBooking();
  const { reset } = useBookingActions();
  const { setView } = useMainView();
  const { showToast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);

  const lostItems = [
    formatCount(state.passengers.length, 'passenger'),
    formatCount(getAssignedCount(state), 'seat'),
    formatCount(getMealCount(state), 'meal'),
  ].join(', ');

  function performReset() {
    reset();
    setView('seats');
    setIsConfirming(false);
    showToast('Booking reset', 'info');
  }

  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex min-h-14 max-w-[1360px] items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <LogoIcon className="size-7" />
          <span className="text-[19px] font-extrabold tracking-[-0.02em]">
            {FLIGHT.brand}
          </span>
        </div>

        <nav aria-label="Site" className="flex items-center gap-5">
          <a href="#" className={`${NAV_ITEM_CLASSES} hidden md:inline`}>
            Manage booking
          </a>
          <a href="#" className={NAV_ITEM_CLASSES}>
            Help
          </a>
          <button
            type="button"
            onClick={() =>
              hasBookingProgress(state) ? setIsConfirming(true) : performReset()
            }
            className={NAV_ITEM_CLASSES}
          >
            Start over
          </button>
          <span className="hidden border-l border-nav-line pl-5 text-sm font-medium text-nav-ink md:inline">
            INR ₹
          </span>
        </nav>
      </div>

      <ConfirmDialog
        open={isConfirming}
        title="Reset booking?"
        confirmLabel="Reset"
        onConfirm={performReset}
        onCancel={() => setIsConfirming(false)}
      >
        This clears everything you have chosen ({lostItems}) and starts again
        with a single passenger.
      </ConfirmDialog>
    </header>
  );
}
