'use client';

import { PassengerChips } from '@/components/passengers/PassengerChips';
import { PassengerCountSelector } from '@/components/passengers/PassengerCountSelector';
import { PassengerList } from '@/components/passengers/PassengerList';
import { useBooking } from '@/context/BookingContext';
import { getAssignedCount } from '@/state/selectors';

/** Travellers card: title with seated count, count stepper, rows (md+) or chips (mobile). */
export function PassengerPanel({ className = '' }: { className?: string }) {
  const state = useBooking();

  return (
    <section
      aria-label="Travellers"
      className={`flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-[18px] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base leading-tight font-bold">Travellers</h2>
          <p className="mt-0.5 text-xs text-ink-muted tabular-nums">
            {getAssignedCount(state)} of {state.passengers.length} seated
          </p>
        </div>
        <PassengerCountSelector />
      </div>
      <div className="hidden md:block">
        <PassengerList />
      </div>
      <div className="md:hidden">
        <PassengerChips />
      </div>
    </section>
  );
}
