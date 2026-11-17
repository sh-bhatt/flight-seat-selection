'use client';

import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { CabinRows, CabinShell } from '@/components/seat-map/CabinShell';
import { Seat } from '@/components/seat-map/Seat';
import { SeatDetailsBar } from '@/components/seat-map/SeatDetails';
import { SeatMapError } from '@/components/seat-map/SeatMapError';
import { SeatMapSkeleton } from '@/components/seat-map/SeatMapSkeleton';
import { SeatRow } from '@/components/seat-map/SeatRow';
import { getOutcomeToastVariant } from '@/components/seat-map/seatDisplay';
import {
  buildSeatGrid,
  getNextSeatId,
  isNavigationKey,
} from '@/components/seat-map/seatNavigation';
import { useToast } from '@/components/ui/Toast';
import { useBooking, useSeatClick } from '@/context/BookingContext';
import { LAYOUTS } from '@/data/layouts';
import { useHorizontalOverflow } from '@/hooks/useHorizontalOverflow';
import {
  getActivePassenger,
  getAdjacentCompanion,
  getSeatById,
  getSeatOwner,
  getSeatStatus,
} from '@/state/selectors';
import type { Seat as SeatModel, SeatMapStatus } from '@/types';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollable = useHorizontalOverflow(scrollRef);

  const layout = LAYOUTS[state.layoutId];
  const seatsByRow = useMemo(() => groupSeatsByRow(state.seats), [state.seats]);
  const seatGrid = useMemo(() => buildSeatGrid(layout), [layout]);

  // Roving tabindex: exactly one seat is in the Tab order.
  const [focusedSeatId, setFocusedSeatId] = useState(seatGrid[0][0]);
  const [cardSeatId, setCardSeatId] = useState<string | null>(null);
  const [tappedSeatId, setTappedSeatId] = useState<string | null>(null);

  const activeName = getActivePassenger(state)?.name ?? 'a passenger';
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
    const showCard = seat.id === cardSeatId;
    return (
      <Seat
        seat={seat}
        status={getSeatStatus(state, seat)}
        owner={getSeatOwner(state, seat.id)}
        activeName={activeName}
        companionName={showCard ? getAdjacentCompanion(state, seat)?.name : undefined}
        tabIndex={seat.id === focusedSeatId ? 0 : -1}
        showCard={showCard}
        onSelect={selectSeat}
        onHover={setCardSeatId}
      />
    );
  }

  return (
    <div>
      <CabinShell layout={layout} scrollRef={scrollRef}>
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
            setCardSeatId(seatId);
          }}
          onBlur={() => setCardSeatId(null)}
        >
          <CabinRows
            layout={layout}
            renderRow={(rowNumber) => (
              <SeatRow
                rowNumber={rowNumber}
                columnGroups={layout.columnGroups}
                seatsByColumn={seatsByRow.get(rowNumber) ?? new Map()}
                renderSeat={renderSeat}
              />
            )}
          />
        </div>
      </CabinShell>
      {isScrollable && (
        <p className="pt-1 text-center text-xs text-ink-muted">
          Swipe or scroll sideways to see every column
        </p>
      )}

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

interface SeatMapProps {
  status: SeatMapStatus;
  onRetry: () => void;
}

/**
 * Skeleton while loading, error + Retry on failure, the cabin once ready. The
 * wrapper stays mounted across all three so focus survives a Retry click, and
 * the cabin remounts per layout so focus/hover/tap state never points at a
 * stale seat.
 */
export function SeatMap({ status, onRetry }: SeatMapProps) {
  const { layoutId } = useBooking();
  const regionRef = useRef<HTMLDivElement>(null);

  function retry() {
    onRetry();
    regionRef.current?.focus({ preventScroll: true });
  }

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label="Seat map"
      aria-busy={status === 'loading'}
      tabIndex={-1}
      className="min-w-0 outline-none"
    >
      {status === 'loading' && <SeatMapSkeleton layout={LAYOUTS[layoutId]} />}
      {status === 'error' && <SeatMapError onRetry={retry} />}
      {status === 'ready' && <SeatMapContent key={layoutId} />}
    </div>
  );
}
