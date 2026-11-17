import type { ReactNode } from 'react';
import { CabinRow } from '@/components/seat-map/CabinRow';
import { ExitMarker } from '@/components/seat-map/ExitMarker';
import { EXIT_ROWS } from '@/data/cabin';
import type { LayoutConfig } from '@/types';

/**
 * The fuselage: nose, "FRONT" label and the column-letter header. Shared by the
 * live seat map and its loading skeleton so both have exactly the same size.
 */
export function CabinShell({
  layout,
  children,
}: {
  layout: LayoutConfig;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-fit rounded-t-[6rem] rounded-b-3xl border-2 border-line bg-surface px-3 pb-8 pt-4 shadow-sm sm:px-6">
      <div aria-hidden="true" className="flex flex-col items-center gap-1 pb-5">
        <span className="h-3 w-20 rounded-full bg-accent-soft" />
        <span className="text-[10px] font-semibold tracking-[0.3em] text-ink-muted">
          FRONT
        </span>
      </div>

      <CabinRow
        decorative
        label=""
        columnGroups={layout.columnGroups}
        renderCell={(column) => (
          <span className="w-9 text-center text-xs font-semibold text-ink-muted">
            {column}
          </span>
        )}
      />

      {children}
    </div>
  );
}

/** Every row of the layout, with an EXIT strip above exit rows. */
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
            {EXIT_ROWS.includes(rowNumber) && <ExitMarker />}
            {renderRow(rowNumber)}
          </div>
        );
      })}
    </>
  );
}
