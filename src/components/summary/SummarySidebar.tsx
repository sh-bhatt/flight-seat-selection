'use client';

import { useState } from 'react';
import { BookingSuccessDialog } from '@/components/summary/BookingSuccessDialog';
import { PriceSummary } from '@/components/summary/PriceSummary';

/** Summary card for md and up (sticky on lg when it has its own column). */
export function SummarySidebar({ className = '' }: { className?: string }) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <>
      <aside
        className={`hidden rounded-2xl border border-line bg-surface p-4 md:block ${className}`}
      >
        <PriceSummary onContinue={() => setIsConfirmed(true)} />
      </aside>
      <BookingSuccessDialog
        open={isConfirmed}
        onClose={() => setIsConfirmed(false)}
      />
    </>
  );
}
