'use client';

import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { CabinRow } from '@/components/seat-map/CabinRow';
import { ExitMarker } from '@/components/seat-map/ExitMarker';
import { Seat } from '@/components/seat-map/Seat';
import { SeatDetailsBar } from '@/components/seat-map/SeatDetails';
import { SeatRow } from '@/components/seat-map/SeatRow';
import { getOutcomeToastVariant } from '@/components/seat-map/seatDisplay';
import {
  buildSeatGrid,
  getNextSeatId,
  isNavigationKey,
} from '@/components/seat-map/seatNavigation';
import { useToast } from '@/components/ui/Toast';
import { useBooking, useSeatClick } from '@/context/BookingContext';
import { EXIT_ROWS } from '@/data/cabin';
import { LAYOUTS } from '@/data/layouts';
import {
  getSeatById,
  getSeatOwner,
  getSeatStatus,
} from '@/state/selectors';
import type { Seat as SeatModel } from '@/types';

function groupSeatsByRow(
  seats: readonly SeatModel[],
): Map<number, Map<string, SeatModel>> {
  const rows = new Map<number, Map<string, SeatModel>>();
  for (const seat of seats) {
    const row = rows.get(seat.row) ?? new Map<string, SeatModel>();
    row.set(seat.column, seat);
    rows.set(seat.row, row);
  }
  return rows;
}

function readSeatId(target: EventTarget): string | undefined {
  return target instanceof HTMLElement ? target.dataset.seatId : undefined;
}

function SeatMapContent() {
  const state = useBooking();
  const handleSeatClick = useSeatClick();
  const { showToast } = useToast();
  const gridRef = useRef<HTMLDivElement>(null);

  const layout = LAYOUTS[state.layoutId];
  const seatsByRow = useMemo(() => groupSeatsByRow(state.seats), [state.seats]);
  const seatGrid = useMemo(() => buildSeatGrid(layout), [layout]);

  // Roving tabindex: exactly one seat is in the Tab order.
  const [focusedSeatId, setFocusedSeatId] = useState(seatGrid[0][0]);
  const [tooltipSeatId, setTooltipSeatId] = useState<string | null>(null);
  const [tappedSeatId, setTappedSeatId] = useState<string | null>(null);

  const tappedSeat = tappedSeatId
    ? getSeatById(state.seats, tappedSeatId)
    : undefined;

  function selectSeat(seatId: string) {
    const outcome = handleSeatClick(seatId);
    showToast(outcome.message, getOutcomeToastVariant(outcome));
    setTappedSeatId(seatId);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentId = readSeatId(event.target);
    if (!currentId || !isNavigationKey(event.key)) return;
    event.preventDefault();
    const nextId = getNextSeatId(seatGrid, currentId, event.key);
    if (!nextId) return;
    setFocusedSeatId(nextId);
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-seat-id="${nextId}"]`)
      ?.focus();
  }

  function renderSeat(seat: SeatModel) {
    return (
      <Seat
        seat={seat}
        status={getSeatStatus(state, seat)}
        owner={getSeatOwner(state, seat.id)}
        tabIndex={seat.id === focusedSeatId ? 0 : -1}
        showTooltip={seat.id === tooltipSeatId}
        onSelect={selectSeat}
        onHover={setTooltipSeatId}
      />
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
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

        <div
          ref={gridRef}
          role="grid"
          aria-label={`Seat map, ${layout.label}`}
          className="mt-2 flex flex-col gap-1.5"
          onKeyDown={handleKeyDown}
          onFocus={(event) => {
            const seatId = readSeatId(event.target);
            if (!seatId) return;
            setFocusedSeatId(seatId);
            setTooltipSeatId(seatId);
          }}
          onBlur={() => setTooltipSeatId(null)}
        >
          {Array.from({ length: layout.rows }, (_, index) => {
            const rowNumber = index + 1;
            return (
              <div key={rowNumber} className="contents">
                {EXIT_ROWS.includes(rowNumber) && <ExitMarker />}
                <SeatRow
                  rowNumber={rowNumber}
                  columnGroups={layout.columnGroups}
                  seatsByColumn={seatsByRow.get(rowNumber) ?? new Map()}
                  renderSeat={renderSeat}
                />
              </div>
            );
          })}
        </div>
      </div>

      {tappedSeat && (
        <SeatDetailsBar
          seat={tappedSeat}
          status={getSeatStatus(state, tappedSeat)}
          ownerName={getSeatOwner(state, tappedSeat.id)?.name}
        />
      )}
    </div>
  );
}

/** Remounts when the layout changes so focus/hover/tap state never points at a stale seat. */
export function SeatMap() {
  const { layoutId } = useBooking();
  return <SeatMapContent key={layoutId} />;
}
