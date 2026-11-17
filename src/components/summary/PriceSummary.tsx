'use client';

import type { ReactNode } from 'react';
import { ContinueButton } from '@/components/summary/ContinueButton';
import { useContinueStep } from '@/components/summary/useContinueStep';
import { AnimatedAmount } from '@/components/ui/AnimatedAmount';
import { Button } from '@/components/ui/Button';
import { useBooking } from '@/context/BookingContext';
import { useMainView } from '@/context/ViewContext';
import { FLIGHT } from '@/data/flight';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  getGrandTotal,
  getMealSummaryLines,
  getPassengerSeatLines,
} from '@/state/selectors';

interface PriceSummaryProps {
  /** Called after any successful continue (the mobile sheet closes itself). */
  onProceed?: () => void;
}

function SummarySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold text-ink-secondary">{title}</h3>
      {children}
    </div>
  );
}

function SummaryLine({
  name,
  detail,
  value,
  isMuted = false,
}: {
  name: string;
  /** Muted text after the name, e.g. the seat code. */
  detail?: string;
  value: string;
  isMuted?: boolean;
}) {
  return (
    <li
      className={`flex items-baseline justify-between gap-3 text-sm ${
        isMuted ? 'text-ink-muted' : ''
      }`}
    >
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {name}
        {detail && <span className="text-ink-muted"> · {detail}</span>}
      </span>
      <span className={`shrink-0 tabular-nums ${isMuted ? '' : 'font-bold'}`}>
        {value}
      </span>
    </li>
  );
}

/**
 * The booking summary card: route, seat and meal lines per passenger, the live
 * total and the Continue button with the reason it may be blocked. Everything
 * is derived from selectors on every render, so it can never go stale.
 */
export function PriceSummary({ onProceed }: PriceSummaryProps) {
  const state = useBooking();
  const step = useContinueStep({ onProceed });
  const { view, setView } = useMainView();
  const seatLines = getPassengerSeatLines(state);
  const mealLines = getMealSummaryLines(state);

  return (
    <section aria-label="Booking summary">
      <div className="border-b border-line px-[18px] pt-[18px] pb-3.5">
        <h2 className="text-base leading-tight font-bold">Booking summary</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          {FLIGHT.origin} → {FLIGHT.destination} · {FLIGHT.date}
        </p>
      </div>

      <div className="flex flex-col gap-4 px-[18px] py-4">
        <SummarySection title="Seats">
          <ul aria-label="Seats" className="flex flex-col gap-2">
            {seatLines.map(({ passengerId, passengerName, seat }) =>
              seat ? (
                <SummaryLine
                  key={passengerId}
                  name={passengerName}
                  detail={seat.id}
                  value={formatCurrency(seat.price)}
                />
              ) : (
                <SummaryLine
                  key={passengerId}
                  name={passengerName}
                  value="Not selected"
                  isMuted
                />
              ),
            )}
          </ul>
        </SummarySection>

        <SummarySection title="Meals">
          {mealLines.length > 0 ? (
            <ul aria-label="Meals" className="flex flex-col gap-2">
              {mealLines.map(({ passengerId, passengerName, meal }) => (
                <SummaryLine
                  key={passengerId}
                  name={passengerName}
                  detail={meal.name}
                  value={formatCurrency(meal.price)}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">None selected</p>
          )}
        </SummarySection>
      </div>

      <div className="rounded-b-[14px] border-t border-line bg-surface-footer px-[18px] pt-4 pb-[18px]">
        <div className="mb-3.5 flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-ink-secondary">Total</span>
          <span className="text-[28px] leading-none font-extrabold tracking-tight tabular-nums">
            <AnimatedAmount amount={getGrandTotal(state)} />
          </span>
        </div>
        <ContinueButton step={step} className="w-full" />
        {step.reason && (
          <p
            id={step.reasonId}
            className="mt-2.5 text-center text-xs text-ink-muted [overflow-wrap:anywhere]"
          >
            {step.reason}
          </p>
        )}
        {view === 'meals' && (
          <Button
            variant="secondary"
            size="lg"
            className="mt-2.5 w-full"
            onClick={() => {
              setView('seats');
              onProceed?.();
            }}
          >
            Back to seats
          </Button>
        )}
      </div>
    </section>
  );
}
