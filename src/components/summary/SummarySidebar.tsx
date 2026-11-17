import { PriceSummary } from '@/components/summary/PriceSummary';

/** Booking summary card for md and up (sticky from 1200px). */
export function SummarySidebar({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`hidden rounded-[14px] border border-line bg-surface md:block ${className}`}
    >
      <PriceSummary />
    </aside>
  );
}
