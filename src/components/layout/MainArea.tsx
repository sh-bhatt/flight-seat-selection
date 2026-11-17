'use client';

import type { ReactNode } from 'react';
import { ArrowLeftIcon } from '@/components/ui/Icons';
import { MealSelector } from '@/components/meals/MealSelector';
import { LayoutToggle } from '@/components/seat-map/LayoutToggle';
import { SeatLegend } from '@/components/seat-map/SeatLegend';
import { SeatMap } from '@/components/seat-map/SeatMap';
import { useBooking } from '@/context/BookingContext';
import { useMainView } from '@/context/ViewContext';
import { useSeatMap } from '@/hooks/useSeatMap';
import { getActivePassenger } from '@/state/selectors';

function PageTitle({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.025em]">
        {title}
      </h1>
      <p className="mt-1 text-sm text-ink-muted [overflow-wrap:anywhere]">{children}</p>
    </div>
  );
}

/** Title row plus the active step's content (seat map or meal picker). */
export function MainArea({ className = '' }: { className?: string }) {
  const { view, setView } = useMainView();
  const state = useBooking();
  // Called here (not in SeatMap) so loading continues while the Meals step is open.
  const seatMap = useSeatMap();
  const activeName = getActivePassenger(state)?.name ?? 'a passenger';
  const activeLabel = <strong className="font-bold text-foreground">{activeName}</strong>;

  return (
    <section
      aria-label="Booking options"
      className={`flex min-w-0 flex-col gap-5 ${className}`}
    >
      {view === 'seats' ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <PageTitle title="Select your seats">
              Choosing a seat for {activeLabel}
            </PageTitle>
            <LayoutToggle />
          </div>
          <SeatLegend />
          <SeatMap status={seatMap.status} onRetry={seatMap.retry} />
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setView('seats')}
            className="-mb-3 -ml-2 inline-flex h-11 items-center gap-1.5 self-start rounded-lg px-2 text-sm font-semibold text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
          >
            <ArrowLeftIcon className="size-4" />
            Back to seats
          </button>
          <PageTitle title="Choose meals">For {activeLabel}</PageTitle>
          <MealSelector />
        </>
      )}
    </section>
  );
}
