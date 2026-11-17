'use client';

import { SeatBadge } from '@/components/passengers/SeatBadge';
import { useBooking, useBookingActions } from '@/context/BookingContext';

/** Mobile passenger switcher: a horizontally scrollable row of chips. */
export function PassengerChips() {
  const { passengers, activePassengerId } = useBooking();
  const { setActivePassenger } = useBookingActions();

  return (
    <ul
      aria-label="Passengers"
      className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 py-1"
    >
      {passengers.map((passenger) => {
        const isActive = passenger.id === activePassengerId;
        return (
          <li key={passenger.id} className="shrink-0 snap-start">
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => setActivePassenger(passenger.id)}
              className={`flex h-11 items-center gap-2 rounded-full border-2 px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isActive
                  ? 'border-accent bg-accent-soft'
                  : 'border-line bg-surface'
              }`}
            >
              <span className="max-w-28 truncate">{passenger.name}</span>
              <SeatBadge seatId={passenger.seatId} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
