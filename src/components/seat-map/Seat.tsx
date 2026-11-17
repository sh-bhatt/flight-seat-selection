import { useRef } from 'react';
import { SeatFace } from '@/components/seat-map/SeatFace';
import { SeatHoverCard } from '@/components/seat-map/SeatHoverCard';
import { getSeatAriaLabel } from '@/components/seat-map/seatDisplay';
import { getPassengerInitial } from '@/lib/passengerInitial';
import type { Passenger, Seat as SeatModel, SeatStatus } from '@/types';

interface SeatProps {
  seat: SeatModel;
  status: SeatStatus;
  /** Passenger holding this seat, if any. */
  owner?: Passenger;
  /** Name of the passenger the next click is for (used by the hover card). */
  activeName: string;
  /** Another passenger seated right beside this seat; only looked up while the card shows. */
  companionName?: string;
  /** Roving tabindex: only one seat in the grid is tabbable at a time. */
  tabIndex: 0 | -1;
  showCard: boolean;
  onSelect: (seatId: string) => void;
  onHover: (seatId: string | null) => void;
}

export function Seat({
  seat,
  status,
  owner,
  activeName,
  companionName,
  tabIndex,
  showCard,
  onSelect,
  onHover,
}: SeatProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const isOccupied = status === 'occupied';
  const cardId = `seat-tip-${seat.id}`;
  return (
    <div ref={anchorRef} className="relative">
      {/* aria-disabled (not disabled) keeps occupied seats focusable and clickable for feedback. */}
      <button
        type="button"
        data-seat-id={seat.id}
        tabIndex={tabIndex}
        aria-label={getSeatAriaLabel(seat, status, owner?.name)}
        aria-disabled={isOccupied}
        aria-pressed={status === 'selected-current'}
        aria-describedby={showCard ? cardId : undefined}
        onClick={(event) => {
          // A double-click would assign then immediately release the seat.
          // `detail` is the click count (0 for keyboard activation).
          if (event.detail > 1) return;
          onSelect(seat.id);
        }}
        onKeyDown={(event) => {
          // Holding Enter fires click repeatedly, which would toggle the seat.
          if (event.key === 'Enter' && event.repeat) event.preventDefault();
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') onHover(seat.id);
        }}
        onPointerLeave={() => onHover(null)}
        // The focus ring is drawn on the seat face (3px navy), not as an outline.
        className={`group/seat block rounded-[10px] outline-none ${isOccupied ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <SeatFace
          status={status}
          category={seat.category}
          initial={owner ? getPassengerInitial(owner.name) : undefined}
        />
      </button>
      {showCard && (
        <SeatHoverCard
          id={cardId}
          anchorRef={anchorRef}
          seat={seat}
          status={status}
          activeName={activeName}
          ownerName={owner?.name}
          companionName={companionName}
        />
      )}
    </div>
  );
}
