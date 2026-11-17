'use client';

import { PassengerRow } from '@/components/passengers/PassengerRow';
import { usePassengerActions } from '@/components/passengers/usePassengerActions';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { getPassengerSeat } from '@/state/selectors';

export function PassengerList() {
  const state = useBooking();
  const { setActivePassenger } = useBookingActions();
  const { rename, removeSeat } = usePassengerActions();

  return (
    <ul aria-label="Passengers" className="flex flex-col gap-1.5">
      {state.passengers.map((passenger) => (
        <PassengerRow
          key={passenger.id}
          passenger={passenger}
          seat={getPassengerSeat(state, passenger.id)}
          isActive={passenger.id === state.activePassengerId}
          onSelect={setActivePassenger}
          onRename={rename}
          onRemoveSeat={removeSeat}
        />
      ))}
    </ul>
  );
}
