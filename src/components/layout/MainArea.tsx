'use client';

import { MainTabs, panelId, tabId } from '@/components/layout/MainTabs';
import { MealSelector } from '@/components/meals/MealSelector';
import { LayoutToggle } from '@/components/seat-map/LayoutToggle';
import { SeatLegend } from '@/components/seat-map/SeatLegend';
import { SeatMap } from '@/components/seat-map/SeatMap';
import { useMainView } from '@/context/ViewContext';
import { useSeatMap } from '@/hooks/useSeatMap';

/** Tab switcher plus the active panel (seat map or meal picker). */
export function MainArea({ className = '' }: { className?: string }) {
  const { view } = useMainView();
  // Called here (not in SeatMap) so loading continues while the Meals tab is open.
  const seatMap = useSeatMap();

  return (
    <section
      aria-label="Booking options"
      className={`flex min-w-0 flex-col gap-4 ${className}`}
    >
      <MainTabs />
      <div
        role="tabpanel"
        id={panelId(view)}
        aria-labelledby={tabId(view)}
        className="flex min-w-0 flex-col gap-4"
      >
        {view === 'seats' ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Choose your seats</h2>
              <LayoutToggle />
            </div>
            <SeatLegend />
            <SeatMap status={seatMap.status} onRetry={seatMap.retry} />
          </>
        ) : (
          <MealSelector />
        )}
      </div>
    </section>
  );
}
