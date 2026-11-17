'use client';

import { PassengerCard } from '@/components/passengers/PassengerCard';
import { useToast } from '@/components/ui/Toast';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { useMainView } from '@/context/ViewContext';
import { getPassengerMeal, getPassengerSeat } from '@/state/selectors';

export function PassengerList() {
  const state = useBooking();
  const { setActivePassenger, renamePassenger, removeSeat } =
    useBookingActions();
  const { showToast } = useToast();
  const { setView } = useMainView();

  return (
    <ul aria-label="Passengers" className="flex flex-col gap-2">
      {state.passengers.map((passenger) => (
        <PassengerCard
          key={passenger.id}
          passenger={passenger}
          seat={getPassengerSeat(state, passenger.id)}
          meal={getPassengerMeal(state, passenger.id)}
          isActive={passenger.id === state.activePassengerId}
          onSelect={setActivePassenger}
          onRename={renamePassenger}
          onEditMeal={(passengerId) => {
            setActivePassenger(passengerId);
            setView('meals');
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
