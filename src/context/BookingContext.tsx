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
  createInitialState,
  getSeatClickOutcome,
  type BookingAction,
  type BookingState,
  type SeatClickOutcome,
} from '@/state/bookingReducer';
import type { LayoutId } from '@/types';

const BookingStateContext = createContext<BookingState | null>(null);
const BookingDispatchContext = createContext<Dispatch<BookingAction> | null>(
  null,
);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, undefined, () =>
    createInitialState(),
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

/** Stable action creators (identity never changes, safe in effect/memo deps). */
export function useBookingActions() {
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
