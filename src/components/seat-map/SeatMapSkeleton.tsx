import { CabinRow } from '@/components/seat-map/CabinRow';
import { CabinRows, CabinShell } from '@/components/seat-map/CabinShell';
import type { LayoutConfig } from '@/types';

/** Placeholder cabin shown while the seat map loads: same fuselage, grey seats. */
export function SeatMapSkeleton({ layout }: { layout: LayoutConfig }) {
  return (
    <div>
      <p role="status" className="sr-only">
        Loading the {layout.label} seat map…
      </p>
      <CabinShell layout={layout}>
        <div aria-hidden="true" className="mt-2 flex flex-col gap-1.5">
          <CabinRows
            layout={layout}
            renderRow={(rowNumber) => (
              <CabinRow
                decorative
                label={String(rowNumber)}
                columnGroups={layout.columnGroups}
                renderCell={() => (
                  <span className="skeleton block h-10 w-[38px] rounded-[10px_10px_6px_6px]" />
                )}
              />
            )}
          />
        </div>
      </CabinShell>
    </div>
  );
}
