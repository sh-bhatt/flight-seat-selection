'use client';

import { useEffect } from 'react';
import { useBooking, useBookingActions } from '@/context/BookingContext';
import { fetchSeatMap } from '@/data/mockApi';
import type { SeatMapStatus } from '@/types';

interface UseSeatMapResult {
  status: SeatMapStatus;
  /** Starts a new request after a failure. */
  retry: () => void;
}

/**
 * Loads the seat map for the current layout through `fetchSeatMap` and feeds
 * the result into the reducer (SEATS_LOADED / SEATS_FAILED). A request starts
 * whenever the status is `loading`: on first render, after a layout switch,
 * after Retry. Answers for a request that was replaced meanwhile are dropped
 * here (cleanup) and again in the reducer (layout check).
 */
export function useSeatMap(): UseSeatMapResult {
  const { layoutId, seatMapStatus } = useBooking();
  const { seatsLoaded, seatsFailed, retrySeats } = useBookingActions();

  useEffect(() => {
    if (seatMapStatus !== 'loading') return;
    let isCurrent = true;
    fetchSeatMap(layoutId).then(
      (seats) => {
        if (isCurrent) seatsLoaded(layoutId, seats);
      },
      () => {
        if (isCurrent) seatsFailed(layoutId);
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [layoutId, seatMapStatus, seatsLoaded, seatsFailed]);

  return { status: seatMapStatus, retry: retrySeats };
}
