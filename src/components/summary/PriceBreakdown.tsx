'use client';

import { AnimatedAmount } from '@/components/ui/AnimatedAmount';
import { useBooking } from '@/context/BookingContext';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  getGrandTotal,
  getMealsTotal,
  getPriceBreakdown,
  getSeatsTotal,
  type PriceLineItem,
} from '@/state/selectors';

function LineItem({ item }: { item: PriceLineItem }) {
  return (
    <li className="flex items-baseline justify-between gap-3 text-sm text-ink-secondary">
      <span className="min-w-0 [overflow-wrap:anywhere]">{item.label}</span>
      <span className="shrink-0 tabular-nums">{formatCurrency(item.amount)}</span>
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
        <AnimatedAmount amount={amount} />
      </dd>
    </div>
  );
}

/**
 * Per passenger: seat and meal line items with their subtotal, then the seat,
 * meal and grand totals. Everything comes from selectors on every render, so
 * the numbers can never go stale.
 */
export function PriceBreakdown() {
  const state = useBooking();
  const breakdown = getPriceBreakdown(state);

  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="Passengers" className="flex flex-col gap-3">
        {breakdown.map(({ passengerId, passengerName, seatItem, mealItem, subtotal }) => (
          <li key={passengerId} className="flex flex-col gap-1">
            <p className="flex items-baseline justify-between gap-3 text-sm font-semibold">
              <span className="min-w-0 [overflow-wrap:anywhere]">{passengerName}</span>
              <span className="shrink-0 tabular-nums">
                {formatCurrency(subtotal, { forceZero: true })}
              </span>
            </p>
            <ul className="flex flex-col gap-1 pl-3">
              {seatItem && <LineItem item={seatItem} />}
              {mealItem && <LineItem item={mealItem} />}
            </ul>
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-2">
        <TotalRow label="Seats subtotal" amount={getSeatsTotal(state)} />
        <TotalRow label="Meals subtotal" amount={getMealsTotal(state)} />
        <TotalRow label="Grand total" amount={getGrandTotal(state)} isGrand />
      </dl>
    </div>
  );
}
