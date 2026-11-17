import type { ReactNode } from 'react';
import { SeatFace } from '@/components/seat-map/SeatFace';
import { CATEGORY_LABEL } from '@/components/seat-map/seatDisplay';
import { CATEGORY_PRICE } from '@/data/seatPricing';
import { formatCurrency } from '@/lib/formatCurrency';
import type { SeatCategory, SeatStatus } from '@/types';

const STATUS_ENTRIES: readonly {
  status: SeatStatus;
  label: string;
  initial?: string;
}[] = [
  { status: 'available', label: 'Available' },
  { status: 'selected-current', label: 'Selected (active passenger)', initial: 'P1' },
  { status: 'selected-other', label: 'Selected (other passenger)', initial: 'P2' },
  { status: 'occupied', label: 'Occupied' },
];

const CATEGORIES = Object.keys(CATEGORY_PRICE) as SeatCategory[];

function LegendGroup({
  title,
  hint,
  hintArrow = false,
  children,
}: {
  title: string;
  hint?: string;
  /** Adds a → pointing at the next column; hidden when columns stack. */
  hintArrow?: boolean;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {title}
      </h3>
      <p className="mt-1 mb-2 min-h-4 text-xs text-ink-muted">
        {hint}
        {hint && hintArrow && (
          <span aria-hidden="true" className="hidden sm:inline">
            {' '}
            →
          </span>
        )}
      </p>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

export function SeatLegend() {
  return (
    <div className="grid gap-5 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2">
      <LegendGroup
        title="Seat status"
        hint="Available seats are tinted by seat type"
        hintArrow
      >
        {STATUS_ENTRIES.map(({ status, label, initial }) => (
          <li key={status} className="flex items-center gap-3 text-sm">
            <SeatFace
              status={status}
              category="standard"
              initial={initial}
              neutral
            />
            {label}
          </li>
        ))}
      </LegendGroup>
      <LegendGroup title="Seat type">
        {CATEGORIES.map((category) => (
          <li key={category} className="flex items-center gap-3 text-sm">
            <SeatFace
              status="available"
              category={category}
              isFree={CATEGORY_PRICE[category] === 0}
            />
            <span className="flex-1">
              {CATEGORY_LABEL[category]}
              {CATEGORY_PRICE[category] === 0 && ' · no extra charge'}
            </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(CATEGORY_PRICE[category])}
            </span>
          </li>
        ))}
      </LegendGroup>
    </div>
  );
}
