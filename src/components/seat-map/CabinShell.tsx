import { useRef, type ReactNode, type RefObject } from 'react';
import { CabinRow } from '@/components/seat-map/CabinRow';
import { ExitRow } from '@/components/seat-map/ExitRow';
import { useHorizontalOverflow } from '@/hooks/useHorizontalOverflow';
import type { LayoutConfig } from '@/types';

/** Room reserved on each side of the fuselage for a wing (px). */
const WING_ROOM_PX = 96;

function ServiceTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-surface-sunken px-2 py-1 text-[10px] leading-none font-semibold text-ink-muted">
      {children}
    </span>
  );
}

/**
 * The aircraft drawing: a scroll box (room on both sides for the wings), the
 * fuselage with cockpit windows, front galley / WC, the column-letter header
 * and, after the rows, the rear galley / WC. Shared by the live seat map and
 * its loading skeleton so both have exactly the same size.
 */
export function CabinShell({
  layout,
  children,
  scrollRef,
}: {
  layout: LayoutConfig;
  children: ReactNode;
  /** Lets the seat map watch whether the cabin scrolls sideways. */
  scrollRef?: RefObject<HTMLDivElement | null>;
}) {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const boxRef = scrollRef ?? fallbackRef;
  // Wings (and the room they need) only appear when they fit beside the fuselage.
  const wingsFit = !useHorizontalOverflow(boxRef, WING_ROOM_PX * 2);
  return (
    <div
      ref={boxRef}
      data-wings={wingsFit ? 'on' : 'off'}
      className={`group/cabin overflow-x-auto pb-3 ${wingsFit ? 'sm:px-24' : ''}`}
    >
      <div className="relative mx-auto w-fit rounded-[190px_190px_44px_44px/260px_260px_44px_44px] border-[1.5px] border-fuselage-line bg-surface px-3 pt-[54px] pb-[26px] [--inset:12px] shadow-[0_4px_16px_-6px_rgba(10,37,64,0.12)] sm:px-[30px] sm:[--inset:30px]">
        <div
          aria-hidden="true"
          className="absolute top-5 left-1/2 flex -translate-x-1/2 gap-2"
        >
          <span className="h-1.5 w-8 rounded-full bg-cockpit" />
          <span className="h-1.5 w-8 rounded-full bg-cockpit" />
        </div>

        <div aria-hidden="true" className="mt-5 mb-4 flex justify-between px-5">
          <ServiceTag>Galley</ServiceTag>
          <ServiceTag>WC</ServiceTag>
        </div>

        <CabinRow
          decorative
          label=""
          columnGroups={layout.columnGroups}
          renderCell={(column) => (
            <span className="w-[38px] text-center text-xs font-bold text-ink-muted">
              {column}
            </span>
          )}
        />

        {children}

        <div aria-hidden="true" className="mt-5 flex justify-between px-1">
          <ServiceTag>WC</ServiceTag>
          <ServiceTag>Galley</ServiceTag>
          <ServiceTag>WC</ServiceTag>
        </div>
      </div>
    </div>
  );
}

/** Every row of the layout, with an exit marker above each of its exit rows. */
export function CabinRows({
  layout,
  renderRow,
}: {
  layout: LayoutConfig;
  renderRow: (rowNumber: number) => ReactNode;
}) {
  return (
    <>
      {Array.from({ length: layout.rows }, (_, index) => {
        const rowNumber = index + 1;
        return (
          <div key={rowNumber} className="contents">
            {layout.exitRows.includes(rowNumber) && (
              <ExitRow withWings={rowNumber === layout.exitRows[0]} />
            )}
            {renderRow(rowNumber)}
          </div>
        );
      })}
    </>
  );
}
