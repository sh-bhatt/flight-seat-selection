import { Fragment, type ReactNode } from 'react';
import type { ColumnGroups } from '@/types';

interface CabinRowProps {
  /** Row number, printed in the aisle(s); empty for the header row. */
  label: string;
  columnGroups: ColumnGroups;
  renderCell: (column: string) => ReactNode;
  /** Header rows are visual only and hidden from assistive tech. */
  decorative?: boolean;
}

/**
 * One line of the cabin: seat groups separated by 30px aisles that carry the
 * row number. Used for both the column-letter header and the seat rows so they
 * always align.
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
      aria-label={decorative ? undefined : `Row ${label}`}
      aria-hidden={decorative || undefined}
      className="flex items-center justify-center"
    >
      {columnGroups.map((group, groupIndex) => (
        <Fragment key={group.join('')}>
          {groupIndex > 0 && (
            <span
              aria-hidden="true"
              className="w-[30px] shrink-0 text-center text-[11px] font-semibold tabular-nums text-ink-muted"
            >
              {label}
            </span>
          )}
          <div className="flex gap-1.5">
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
        </Fragment>
      ))}
    </div>
  );
}
