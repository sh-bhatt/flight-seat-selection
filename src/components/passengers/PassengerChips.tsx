'use client';

import { PassengerAvatar } from '@/components/passengers/PassengerAvatar';
import { SeatBadge } from '@/components/passengers/SeatBadge';
import { useBooking, useBookingActions } from '@/context/BookingContext';

/** Mobile passenger switcher: a horizontally scrollable row of chips. */
export function PassengerChips() {
  const { passengers, activePassengerId } = useBooking();
  const { setActivePassenger } = useBookingActions();

  return (
    <ul
      aria-label="Passengers"
      className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 py-1"
    >
      {passengers.map((passenger) => {
        const isActive = passenger.id === activePassengerId;
        return (
          <li key={passenger.id} className="shrink-0 snap-start">
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => setActivePassenger(passenger.id)}
              className={`flex h-11 items-center gap-2 rounded-full border-[1.5px] py-1 pr-3 pl-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                isActive
                  ? 'border-navy bg-selected'
                  : 'border-line bg-surface'
              }`}
            >
              <PassengerAvatar name={passenger.name} isActive={isActive} size="sm" />
              <span className="max-w-28 truncate">{passenger.name}</span>
              {passenger.seatId !== null && <SeatBadge seatId={passenger.seatId} />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
