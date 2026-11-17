import type { ReactNode } from 'react';

interface CabinRowProps {
  /** Printed on both sides of the row; empty for the header row. */
  label: string;
  columnGroups: string[][];
  renderCell: (column: string) => ReactNode;
  /** Header rows are visual only and hidden from assistive tech. */
  decorative?: boolean;
}

const LABEL_CLASSES =
  'w-6 shrink-0 text-center text-[11px] font-medium tabular-nums text-ink-muted';

/**
 * One line of the cabin: label, seat groups separated by aisle gaps, label.
 * Used for both the column-letter header and the seat rows so they always align.
 */
export function CabinRow({
  label,
  columnGroups,
  renderCell,
  decorative = false,
}: CabinRowProps) {
  return (
    <div
      role={decorative ? undefined : 'row'}
      aria-hidden={decorative || undefined}
      className="flex items-center justify-center"
    >
      <span className={LABEL_CLASSES}>{label}</span>
      {columnGroups.map((group, groupIndex) => (
        <div key={group.join('')} className="flex items-center">
          {groupIndex > 0 && <div className="w-4 shrink-0 sm:w-8" />}
          <div className="flex gap-1">
            {group.map((column) => (
              <div
                key={column}
                role={decorative ? undefined : 'gridcell'}
                className="flex shrink-0 justify-center"
              >
                {renderCell(column)}
              </div>
            ))}
          </div>
        </div>
      ))}
      <span className={LABEL_CLASSES}>{label}</span>
    </div>
  );
}
