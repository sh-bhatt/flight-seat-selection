'use client';

import { useToast } from '@/components/ui/Toast';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { getSeatRemovedMessage, resolvePassengerName } from '@/state/bookingReducer';

interface PassengerActions {
  /** Renames and, when the name had to change (empty / too long), says why. */
  rename: (passengerId: string, rawName: string) => void;
  /** Frees the passenger's seat and confirms it with a toast. */
  removeSeat: (passengerId: string) => void;
}

/** Rename / remove-seat with feedback, shared by the desktop list and the mobile chips. */
export function usePassengerActions(): PassengerActions {
  const { passengers } = useBooking();
  const { renamePassenger, removeSeat } = useBookingActions();
  const { showToast } = useToast();

  return {
    rename(passengerId, rawName) {
      const index = passengers.findIndex((p) => p.id === passengerId);
      if (index === -1) return;
      const { notice } = resolvePassengerName(rawName, index);
      renamePassenger(passengerId, rawName);
      if (notice) showToast(notice, 'info');
    },
    removeSeat(passengerId) {
      const passenger = passengers.find((p) => p.id === passengerId);
      if (!passenger || passenger.seatId === null) return;
      removeSeat(passengerId);
      showToast(getSeatRemovedMessage(passenger.seatId, passenger.name), 'info');
    },
  };
}
