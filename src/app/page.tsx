import { FlightStrip } from '@/components/layout/FlightStrip';
import { MainArea } from '@/components/layout/MainArea';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { PassengerPanel } from '@/components/passengers/PassengerPanel';
import { ReviewDialog } from '@/components/summary/ReviewDialog';
import { MobileSummaryBar } from '@/components/summary/MobileSummaryBar';
import { SummarySidebar } from '@/components/summary/SummarySidebar';
import { AppProviders } from '@/context/AppProviders';

/** From 1200px the side panels stick while the seat map scrolls past. */
const STICKY_PANEL =
  'min-[1200px]:sticky min-[1200px]:top-6 min-[1200px]:max-h-[calc(100vh-48px)] min-[1200px]:overflow-y-auto';

/**
 * One wrapping flex row: travellers | seat area (takes the spare width) |
 * booking summary. When it no longer fits the panels wrap under each other.
 * The summary is replaced by a fixed bottom bar below `md`.
 */
export default function Home() {
  return (
    <AppProviders>
      <SiteHeader />
      <FlightStrip />
      <main className="mx-auto flex w-full max-w-[1360px] flex-wrap items-start gap-7 px-4 pt-5 pb-[calc(var(--summary-bar-height)+1.5rem)] md:px-8 md:pt-7 md:pb-14">
        <PassengerPanel
          className={`flex-[1_1_260px] md:max-w-[300px] ${STICKY_PANEL}`}
        />
        <MainArea className="flex-[999_1_520px]" />
        <SummarySidebar
          className={`flex-[1_1_280px] md:max-w-[330px] ${STICKY_PANEL}`}
        />
      </main>
      <MobileSummaryBar />
      <ReviewDialog />
    </AppProviders>
  );
}
