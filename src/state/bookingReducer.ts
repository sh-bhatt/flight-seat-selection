import { generateSeatMap } from '@/lib/generateSeatMap';
import { getSeatById, getSeatOwnerMap } from '@/state/selectors';
import type { LayoutId, Passenger, Seat } from '@/types';

export const MIN_PASSENGERS = 1;
export const MAX_PASSENGERS = 6;
export const MAX_NAME_LENGTH = 30;

export interface BookingState {
  layoutId: LayoutId;
  seats: Seat[];
  passengers: Passenger[];
  activePassengerId: string | null;
  mealsEnabled: boolean;
}

export type BookingAction =
  | { type: 'SET_PASSENGER_COUNT'; count: number }
  | { type: 'SET_ACTIVE_PASSENGER'; passengerId: string }
  | { type: 'RENAME_PASSENGER'; passengerId: string; name: string }
  | { type: 'SET_LAYOUT'; layoutId: LayoutId }
  | { type: 'SEAT_CLICKED'; seatId: string }
  | { type: 'REMOVE_SEAT'; passengerId: string }
  | { type: 'SELECT_MEAL'; passengerId: string; mealId: string | null }
  | { type: 'RESET' };

export type SeatClickOutcomeType = 'assigned' | 'changed' | 'removed' | 'blocked';
export type SeatClickBlockReason =
  | 'no-passenger'
  | 'occupied'
  | 'taken-by-other'
  | 'unknown-seat';

export interface SeatClickOutcome {
  type: SeatClickOutcomeType;
  reason?: SeatClickBlockReason;
  message: string;
}

const DEFAULT_LAYOUT: LayoutId = '3-2';

function defaultPassengerName(index: number): string {
  return `Passenger ${index + 1}`;
}

// Passengers are only added/removed at the end, so index-based ids stay unique.
function createPassenger(index: number): Passenger {
  return {
    id: `passenger-${index + 1}`,
    name: defaultPassengerName(index),
    seatId: null,
    mealId: null,
  };
}

export function createInitialState(
  layoutId: LayoutId = DEFAULT_LAYOUT,
  passengerCount: number = MIN_PASSENGERS,
): BookingState {
  const passengers = Array.from({ length: passengerCount }, (_, i) =>
    createPassenger(i),
  );
  return {
    layoutId,
    seats: generateSeatMap(layoutId),
    passengers,
    activePassengerId: passengers[0]?.id ?? null,
    mealsEnabled: true,
  };
}

/**
 * The single place that decides what a seat click means. The reducer applies
 * it; the UI reads it to show a toast. Pure: never mutates `state`.
 */
export function getSeatClickOutcome(
  state: BookingState,
  seatId: string,
): SeatClickOutcome {
  const active = state.passengers.find((p) => p.id === state.activePassengerId);
  if (!active) {
    return {
      type: 'blocked',
      reason: 'no-passenger',
      message: 'Select a passenger first.',
    };
  }
  const seat = getSeatById(state.seats, seatId);
  if (!seat) {
    return {
      type: 'blocked',
      reason: 'unknown-seat',
      message: `Seat ${seatId} does not exist.`,
    };
  }
  if (seat.isOccupied) {
    return {
      type: 'blocked',
      reason: 'occupied',
      message: `Seat ${seatId} is already occupied.`,
    };
  }
  const ownerId = getSeatOwnerMap(state.passengers).get(seatId);
  if (ownerId !== undefined && ownerId !== active.id) {
    const owner = state.passengers.find((p) => p.id === ownerId);
    return {
      type: 'blocked',
      reason: 'taken-by-other',
      message: `Seat ${seatId} is already selected by ${owner?.name ?? 'another passenger'}.`,
    };
  }
  if (ownerId === active.id) {
    return {
      type: 'removed',
      message: `Seat ${seatId} removed from ${active.name}.`,
    };
  }
  if (active.seatId !== null) {
    return {
      type: 'changed',
      message: `${active.name} moved from ${active.seatId} to ${seatId}.`,
    };
  }
  return {
    type: 'assigned',
    message: `Seat ${seatId} assigned to ${active.name}.`,
  };
}

function updatePassenger(
  passengers: Passenger[],
  passengerId: string,
  patch: Partial<Passenger>,
): Passenger[] {
  return passengers.map((p) => (p.id === passengerId ? { ...p, ...patch } : p));
}

/** Next passenger (in order, wrapping) without a seat; null when everyone has one. */
function findNextUnseatedId(
  passengers: Passenger[],
  fromId: string,
): string | null {
  const start = passengers.findIndex((p) => p.id === fromId);
  for (let step = 1; step <= passengers.length; step += 1) {
    const candidate = passengers[(start + step) % passengers.length];
    if (candidate.seatId === null) return candidate.id;
  }
  return null;
}

function applySeatClick(state: BookingState, seatId: string): BookingState {
  const outcome = getSeatClickOutcome(state, seatId);
  const activeId = state.activePassengerId;
  if (outcome.type === 'blocked' || activeId === null) return state;

  if (outcome.type === 'removed') {
    return {
      ...state,
      passengers: updatePassenger(state.passengers, activeId, { seatId: null }),
    };
  }
  // 'assigned' or 'changed': a single seatId per passenger, so assigning
  // implicitly releases the previous seat.
  const passengers = updatePassenger(state.passengers, activeId, { seatId });
  return {
    ...state,
    passengers,
    activePassengerId: findNextUnseatedId(passengers, activeId) ?? activeId,
  };
}

function setPassengerCount(state: BookingState, rawCount: number): BookingState {
  if (!Number.isFinite(rawCount)) return state;
  const count = Math.min(
    MAX_PASSENGERS,
    Math.max(MIN_PASSENGERS, Math.trunc(rawCount)),
  );
  if (count === state.passengers.length) return state;

  // Dropped passengers take their seat/meal with them: ownership lives on Passenger.
  const passengers =
    count > state.passengers.length
      ? [
          ...state.passengers,
          ...Array.from({ length: count - state.passengers.length }, (_, i) =>
            createPassenger(state.passengers.length + i),
          ),
        ]
      : state.passengers.slice(0, count);

  const activeStillExists = passengers.some(
    (p) => p.id === state.activePassengerId,
  );
  return {
    ...state,
    passengers,
    activePassengerId: activeStillExists
      ? state.activePassengerId
      : passengers[passengers.length - 1].id,
  };
}

function renamePassenger(
  state: BookingState,
  passengerId: string,
  rawName: string,
): BookingState {
  const index = state.passengers.findIndex((p) => p.id === passengerId);
  if (index === -1) return state;
  const name =
    rawName.trim().slice(0, MAX_NAME_LENGTH).trim() ||
    defaultPassengerName(index);
  return {
    ...state,
    passengers: updatePassenger(state.passengers, passengerId, { name }),
  };
}

function setLayout(state: BookingState, layoutId: LayoutId): BookingState {
  if (layoutId === state.layoutId) return state;
  return {
    ...state,
    layoutId,
    seats: generateSeatMap(layoutId),
    // Seat ids differ between layouts, so old assignments are meaningless.
    passengers: state.passengers.map((p) => ({ ...p, seatId: null })),
  };
}

/** Throws if a seat is shared, unknown, occupied, or a passenger is duplicated. */
export function assertBookingInvariants(state: BookingState): void {
  const seenSeats = new Set<string>();
  const passengerIds = new Set<string>();
  for (const passenger of state.passengers) {
    if (passengerIds.has(passenger.id)) {
      throw new Error(`Invariant violated: duplicate passenger ${passenger.id}`);
    }
    passengerIds.add(passenger.id);
    if (passenger.seatId === null) continue;
    if (seenSeats.has(passenger.seatId)) {
      throw new Error(
        `Invariant violated: seat ${passenger.seatId} assigned to multiple passengers`,
      );
    }
    seenSeats.add(passenger.seatId);
    const seat = getSeatById(state.seats, passenger.seatId);
    if (!seat || seat.isOccupied) {
      throw new Error(
        `Invariant violated: ${passenger.id} holds invalid seat ${passenger.seatId}`,
      );
    }
  }
  if (
    state.activePassengerId !== null &&
    !passengerIds.has(state.activePassengerId)
  ) {
    throw new Error('Invariant violated: active passenger does not exist');
  }
}

function reduce(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_PASSENGER_COUNT':
      return setPassengerCount(state, action.count);
    case 'SET_ACTIVE_PASSENGER':
      return state.passengers.some((p) => p.id === action.passengerId)
        ? { ...state, activePassengerId: action.passengerId }
        : state;
    case 'RENAME_PASSENGER':
      return renamePassenger(state, action.passengerId, action.name);
    case 'SET_LAYOUT':
      return setLayout(state, action.layoutId);
    case 'SEAT_CLICKED':
      return applySeatClick(state, action.seatId);
    case 'REMOVE_SEAT':
      return {
        ...state,
        passengers: updatePassenger(state.passengers, action.passengerId, {
          seatId: null,
        }),
      };
    case 'SELECT_MEAL':
      return {
        ...state,
        passengers: updatePassenger(state.passengers, action.passengerId, {
          mealId: action.mealId,
        }),
      };
    case 'RESET':
      return createInitialState();
  }
}

export function bookingReducer(
  state: BookingState,
  action: BookingAction,
): BookingState {
  const next = reduce(state, action);
  if (process.env.NODE_ENV !== 'production') assertBookingInvariants(next);
  return next;
}
