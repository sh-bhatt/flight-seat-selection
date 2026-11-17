import { SeatFace } from '@/components/seat-map/SeatFace';
import { SeatTooltip } from '@/components/seat-map/SeatDetails';
import { getSeatAriaLabel } from '@/components/seat-map/seatDisplay';
import { getPassengerInitial } from '@/lib/passengerInitial';
import type { Passenger, Seat as SeatModel, SeatStatus } from '@/types';

interface SeatProps {
  seat: SeatModel;
  status: SeatStatus;
  /** Passenger holding this seat, if any. */
  owner?: Passenger;
  /** Roving tabindex: only one seat in the grid is tabbable at a time. */
  tabIndex: 0 | -1;
  showTooltip: boolean;
  onSelect: (seatId: string) => void;
  onHover: (seatId: string | null) => void;
}

export function Seat({
  seat,
  status,
  owner,
  tabIndex,
  showTooltip,
  onSelect,
  onHover,
}: SeatProps) {
  const isOccupied = status === 'occupied';
  const tooltipId = `seat-tip-${seat.id}`;
  return (
    <div className="relative">
      {/* aria-disabled (not disabled) keeps occupied seats focusable and clickable for feedback. */}
      <button
        type="button"
        data-seat-id={seat.id}
        tabIndex={tabIndex}
        aria-label={getSeatAriaLabel(seat, status, owner?.name)}
        aria-disabled={isOccupied}
        aria-pressed={status === 'selected-current'}
        aria-describedby={showTooltip ? tooltipId : undefined}
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
        className={`group/seat block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${isOccupied ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <SeatFace
          status={status}
          category={seat.category}
          initial={owner ? getPassengerInitial(owner.name) : undefined}
          isFree={seat.price === 0}
        />
      </button>
      {showTooltip && (
        <SeatTooltip
          id={tooltipId}
          seat={seat}
          status={status}
          ownerName={owner?.name}
        />
      )}
    </div>
  );
}
