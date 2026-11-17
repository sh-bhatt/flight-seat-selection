import { AppHeader } from '@/components/layout/AppHeader';
import { PassengerPanel } from '@/components/passengers/PassengerPanel';
import { LayoutToggle } from '@/components/seat-map/LayoutToggle';
import { SeatLegend } from '@/components/seat-map/SeatLegend';
import { SeatMap } from '@/components/seat-map/SeatMap';
import { MobileSummaryBar } from '@/components/summary/MobileSummaryBar';
import { SummarySidebar } from '@/components/summary/SummarySidebar';
import { AppProviders } from '@/context/AppProviders';

/**
 * Grid placement per breakpoint:
 * - lg+: passengers | map | summary (3 columns, summary sticky)
 * - md:  passengers + summary stacked on the left, map on the right
 * - <md: single column; summary lives in the sticky bottom bar
 */
export default function Home() {
  return (
    <AppProviders>
      <main className="mx-auto flex w-full max-w-[90rem] flex-col gap-5 px-4 pt-5 pb-[calc(var(--summary-bar-height)+1.5rem)] md:pb-8 lg:px-6">
        <AppHeader />

        <div className="grid min-w-0 items-start gap-5 md:grid-cols-[17rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)_19rem]">
          <div className="md:col-start-1 md:row-start-1">
            <PassengerPanel />
          </div>

          <section
            aria-label="Seat map"
            className="flex min-w-0 flex-col gap-4 md:col-start-2 md:row-span-2 md:row-start-1 lg:row-span-1"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Choose your seats</h2>
              <LayoutToggle />
            </div>
            <SeatLegend />
            <SeatMap />
          </section>

          <SummarySidebar className="md:col-start-1 md:row-start-2 lg:sticky lg:top-4 lg:col-start-3 lg:row-start-1 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto" />
        </div>
      </main>
      <MobileSummaryBar />
    </AppProviders>
  );
}
