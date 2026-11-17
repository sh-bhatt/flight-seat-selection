'use client';

import type { ReactNode } from 'react';
import { CATEGORY_LABEL } from '@/components/seat-map/seatDisplay';
import { useBooking } from '@/context/BookingContext';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  getGrandTotal,
  getMealsTotal,
  getMealSummaryLines,
  getSeatsTotal,
  getSeatSummaryLines,
} from '@/state/selectors';

function PriceRow({
  label,
  amount,
  forceZero = false,
}: {
  label: ReactNode;
  amount: number;
  forceZero?: boolean;
}) {
  return (
    <li className="flex items-baseline justify-between gap-3 text-sm">
      <span className="min-w-0">{label}</span>
      <span className="shrink-0 font-medium tabular-nums">
        {formatCurrency(amount, { forceZero })}
      </span>
    </li>
  );
}

function TotalRow({
  label,
  amount,
  isGrand = false,
}: {
  label: string;
  amount: number;
  isGrand?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${
        isGrand ? 'border-t border-line pt-3 text-base font-bold' : 'text-sm'
      }`}
    >
      <dt className={isGrand ? '' : 'text-ink-muted'}>{label}</dt>
      <dd className="font-semibold tabular-nums">
        {formatCurrency(amount, { forceZero: true })}
      </dd>
    </div>
  );
}

/**
 * Seat and meal line items plus totals. Everything is derived from selectors
 * on every render, so the numbers can never go stale.
 */
export function PriceBreakdown() {
  const state = useBooking();
  const seatLines = getSeatSummaryLines(state);
  const mealLines = getMealSummaryLines(state);

  return (
    <div className="flex flex-col gap-4">
      {seatLines.length > 0 && (
        <ul aria-label="Seats" className="flex flex-col gap-2">
          {seatLines.map(({ passengerId, passengerName, seat }) => (
            <PriceRow
              key={passengerId}
              label={`${passengerName} · ${seat.id} (${CATEGORY_LABEL[seat.category]})`}
              amount={seat.price}
            />
          ))}
        </ul>
      )}

      {mealLines.length > 0 && (
        <ul aria-label="Meals" className="flex flex-col gap-2">
          {mealLines.map(({ passengerId, passengerName, meal }) => (
            <PriceRow
              key={passengerId}
              label={`${passengerName} · ${meal.name}`}
              amount={meal.price}
            />
          ))}
        </ul>
      )}

      <dl className="flex flex-col gap-2">
        <TotalRow label="Seats subtotal" amount={getSeatsTotal(state)} />
        <TotalRow label="Meals subtotal" amount={getMealsTotal(state)} />
        <TotalRow label="Grand total" amount={getGrandTotal(state)} isGrand />
      </dl>
    </div>
  );
}
