'use client';

import { PassengerRow } from '@/components/passengers/PassengerRow';
import { useToast } from '@/components/ui/Toast';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { resolvePassengerName } from '@/state/bookingReducer';
import { getPassengerSeat } from '@/state/selectors';

export function PassengerList() {
  const state = useBooking();
  const { setActivePassenger, renamePassenger, removeSeat } =
    useBookingActions();
  const { showToast } = useToast();

  return (
    <ul aria-label="Passengers" className="flex flex-col gap-1.5">
      {state.passengers.map((passenger, index) => (
        <PassengerRow
          key={passenger.id}
          passenger={passenger}
          seat={getPassengerSeat(state, passenger.id)}
          isActive={passenger.id === state.activePassengerId}
          onSelect={setActivePassenger}
          onRename={(passengerId, rawName) => {
            const { notice } = resolvePassengerName(rawName, index);
            renamePassenger(passengerId, rawName);
            if (notice) showToast(notice, 'info');
          }}
          onRemoveSeat={(passengerId) => {
            const seatId = passenger.seatId;
            removeSeat(passengerId);
            showToast(`Seat ${seatId} removed from ${passenger.name}`, 'info');
          }}
        />
      ))}
    </ul>
  );
}
