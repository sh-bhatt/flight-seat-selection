'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import {
  bookingReducer,
  createLoadingState,
  getSeatClickOutcome,
  type BookingAction,
  type BookingState,
  type SeatClickOutcome,
} from '@/state/bookingReducer';
import type { LayoutId, Seat } from '@/types';

const BookingStateContext = createContext<BookingState | null>(null);
const BookingDispatchContext = createContext<Dispatch<BookingAction> | null>(
  null,
);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, undefined, () =>
    createLoadingState(),
  );
  return (
    <BookingDispatchContext.Provider value={dispatch}>
      <BookingStateContext.Provider value={state}>
        {children}
      </BookingStateContext.Provider>
    </BookingDispatchContext.Provider>
  );
}

export function useBooking(): BookingState {
  const state = useContext(BookingStateContext);
  if (!state) throw new Error('useBooking must be used inside BookingProvider');
  return state;
}

function useBookingDispatch(): Dispatch<BookingAction> {
  const dispatch = useContext(BookingDispatchContext);
  if (!dispatch) {
    throw new Error('Booking hooks must be used inside BookingProvider');
  }
  return dispatch;
}

export interface BookingActions {
  setPassengerCount: (count: number) => void;
  setActivePassenger: (passengerId: string) => void;
  renamePassenger: (passengerId: string, name: string) => void;
  setLayout: (layoutId: LayoutId) => void;
  seatsLoaded: (layoutId: LayoutId, seats: Seat[]) => void;
  seatsFailed: (layoutId: LayoutId) => void;
  retrySeats: () => void;
  removeSeat: (passengerId: string) => void;
  selectMeal: (passengerId: string, mealId: string | null) => void;
  reset: () => void;
}

/** Stable action creators (identity never changes, safe in effect/memo deps). */
export function useBookingActions(): BookingActions {
  const dispatch = useBookingDispatch();
  return useMemo(
    () => ({
      setPassengerCount: (count: number) =>
        dispatch({ type: 'SET_PASSENGER_COUNT', count }),
      setActivePassenger: (passengerId: string) =>
        dispatch({ type: 'SET_ACTIVE_PASSENGER', passengerId }),
      renamePassenger: (passengerId: string, name: string) =>
        dispatch({ type: 'RENAME_PASSENGER', passengerId, name }),
      setLayout: (layoutId: LayoutId) =>
        dispatch({ type: 'SET_LAYOUT', layoutId }),
      seatsLoaded: (layoutId: LayoutId, seats: Seat[]) =>
        dispatch({ type: 'SEATS_LOADED', layoutId, seats }),
      seatsFailed: (layoutId: LayoutId) =>
        dispatch({ type: 'SEATS_FAILED', layoutId }),
      retrySeats: () => dispatch({ type: 'RETRY_SEATS' }),
      removeSeat: (passengerId: string) =>
        dispatch({ type: 'REMOVE_SEAT', passengerId }),
      selectMeal: (passengerId: string, mealId: string | null) =>
        dispatch({ type: 'SELECT_MEAL', passengerId, mealId }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [dispatch],
  );
}

/**
 * Seat click handler: dispatches SEAT_CLICKED and returns what happened so the
 * caller can show a toast. The outcome comes from the same function the
 * reducer uses, so the rules are never duplicated.
 */
export function useSeatClick(): (seatId: string) => SeatClickOutcome {
  const state = useBooking();
  const dispatch = useBookingDispatch();
  return useCallback(
    (seatId: string) => {
      const outcome = getSeatClickOutcome(state, seatId);
      dispatch({ type: 'SEAT_CLICKED', seatId });
      return outcome;
    },
    [state, dispatch],
  );
}
