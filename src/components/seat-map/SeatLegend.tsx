import type { ReactNode } from 'react';
import { SeatFace } from '@/components/seat-map/SeatFace';
import { CATEGORY_LABEL } from '@/components/seat-map/seatDisplay';
import { CATEGORY_PRICE } from '@/data/seatPricing';
import { formatCurrency } from '@/lib/formatCurrency';
import type { SeatCategory } from '@/types';

const CATEGORIES = Object.keys(CATEGORY_PRICE) as SeatCategory[];

function LegendItem({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-[13px] text-ink-secondary">
      {swatch}
      <span>{children}</span>
    </li>
  );
}

/** One bar: the three seat types with prices, then "Your group" and "Taken". */
export function SeatLegend() {
  return (
    <ul
      aria-label="Seat legend"
      className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3"
    >
      {CATEGORIES.map((category) => (
        <LegendItem
          key={category}
          swatch={<SeatFace size="swatch" status="available" category={category} />}
        >
          {CATEGORY_LABEL[category]}{' '}
          <span className="font-bold text-foreground tabular-nums">
            {formatCurrency(CATEGORY_PRICE[category])}
          </span>
        </LegendItem>
      ))}
      <li aria-hidden="true" className="h-5 w-px bg-line" />
      <LegendItem
        swatch={<SeatFace size="swatch" status="selected-other" category="standard" />}
      >
        Your group
      </LegendItem>
      <LegendItem
        swatch={<SeatFace size="swatch" status="occupied" category="standard" />}
      >
        Taken
      </LegendItem>
    </ul>
  );
}
