import { MEAL_OPTIONS, NO_MEAL_ID } from '@/data/meals';
import { formatCurrency } from '@/lib/formatCurrency';
import { generateSeatMap } from '@/lib/generateSeatMap';
import { defaultPassengerName } from '@/lib/passengerName';
import { getSeatById, getSeatOwnerMap } from '@/state/selectors';
import type { LayoutId, Passenger, Seat, SeatMapStatus } from '@/types';

export const MIN_PASSENGERS = 1;
export const MAX_PASSENGERS = 6;
export const MAX_NAME_LENGTH = 30;

export interface BookingState {
  layoutId: LayoutId;
  /** Empty until `seatMapStatus` is `ready`; filled by SEATS_LOADED. */
  seats: Seat[];
  seatMapStatus: SeatMapStatus;
  passengers: Passenger[];
  activePassengerId: string | null;
}

export type BookingAction =
  | { type: 'SET_PASSENGER_COUNT'; count: number }
  | { type: 'SET_ACTIVE_PASSENGER'; passengerId: string }
  | { type: 'RENAME_PASSENGER'; passengerId: string; name: string }
  | { type: 'SET_LAYOUT'; layoutId: LayoutId }
  | { type: 'SEATS_LOADED'; layoutId: LayoutId; seats: Seat[] }
  | { type: 'SEATS_FAILED'; layoutId: LayoutId }
  | { type: 'RETRY_SEATS' }
  | { type: 'SEAT_CLICKED'; seatId: string }
  | { type: 'REMOVE_SEAT'; passengerId: string }
  | { type: 'SELECT_MEAL'; passengerId: string; mealId: string | null }
  | { type: 'RESET' };

export type SeatClickOutcomeType = 'assigned' | 'changed' | 'removed' | 'blocked';
export type SeatClickBlockReason =
  | 'seats-not-ready'
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

/** Shared by seat clicks and the passenger row's remove button. */
export function getSeatRemovedMessage(seatId: string, passengerName: string): string {
  return `Seat ${seatId} removed from ${passengerName}`;
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

function createBaseState(
  layoutId: LayoutId,
  passengerCount: number,
): Omit<BookingState, 'seats' | 'seatMapStatus'> {
  const passengers = Array.from({ length: passengerCount }, (_, i) =>
    createPassenger(i),
  );
  return {
    layoutId,
    passengers,
    activePassengerId: passengers[0]?.id ?? null,
  };
}

/** What the app starts with: no seats yet, the seat map request is in flight. */
export function createLoadingState(
  layoutId: LayoutId = DEFAULT_LAYOUT,
  passengerCount: number = MIN_PASSENGERS,
): BookingState {
  return {
    ...createBaseState(layoutId, passengerCount),
    seats: [],
    seatMapStatus: 'loading',
  };
}

/** A state whose seat map has already arrived (tests, and RESET on a loaded layout). */
export function createInitialState(
  layoutId: LayoutId = DEFAULT_LAYOUT,
  passengerCount: number = MIN_PASSENGERS,
): BookingState {
  return {
    ...createBaseState(layoutId, passengerCount),
    seats: generateSeatMap(layoutId),
    seatMapStatus: 'ready',
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
  if (state.seatMapStatus !== 'ready') {
    return {
      type: 'blocked',
      reason: 'seats-not-ready',
      message: 'The seat map is not available yet',
    };
  }
  const active = state.passengers.find((p) => p.id === state.activePassengerId);
  if (!active) {
    return {
      type: 'blocked',
      reason: 'no-passenger',
      message: 'Select a passenger first',
    };
  }
  const seat = getSeatById(state.seats, seatId);
  if (!seat) {
    return {
      type: 'blocked',
      reason: 'unknown-seat',
      message: `Seat ${seatId} does not exist`,
    };
  }
  if (seat.isOccupied) {
    return {
      type: 'blocked',
      reason: 'occupied',
      message: `Seat ${seatId} is already occupied`,
    };
  }
  const ownerId = getSeatOwnerMap(state.passengers).get(seatId);
  if (ownerId !== undefined && ownerId !== active.id) {
    const owner = state.passengers.find((p) => p.id === ownerId);
    return {
      type: 'blocked',
      reason: 'taken-by-other',
      message: `Seat ${seatId} is taken by ${owner?.name ?? 'another passenger'}`,
    };
  }
  if (ownerId === active.id) {
    return {
      type: 'removed',
      message: getSeatRemovedMessage(seatId, active.name),
    };
  }
  if (active.seatId !== null) {
    return {
      type: 'changed',
      message: `${active.name} moved from ${active.seatId} to ${seatId} — ${formatCurrency(seat.price)}`,
    };
  }
  return {
    type: 'assigned',
    message: `Seat ${seatId} assigned to ${active.name} — ${formatCurrency(seat.price)}`,
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

  const activePassenger = passengers.find(
    (p) => p.id === state.activePassengerId,
  );
  let activePassengerId: string;
  if (!activePassenger) {
    activePassengerId = passengers[passengers.length - 1].id;
  } else if (count > state.passengers.length && activePassenger.seatId !== null) {
    // Growing while the active passenger is already seated: hand over to the
    // first new passenger so the next seat click seats them, not moves this one.
    activePassengerId = passengers[state.passengers.length].id;
  } else {
    activePassengerId = activePassenger.id;
  }
  return { ...state, passengers, activePassengerId };
}

export interface ResolvedPassengerName {
  name: string;
  /** Explains a change the user did not type (empty or too long), else null. */
  notice: string | null;
}

/**
 * The one place that decides what a typed name becomes: trimmed, capped at
 * `MAX_NAME_LENGTH`, and an empty name falls back to "Passenger N". The reducer
 * applies `name`; the UI shows `notice` so the change is never silent.
 */
export function resolvePassengerName(
  rawName: string,
  passengerIndex: number,
): ResolvedPassengerName {
  const trimmed = rawName.trim();
  if (trimmed === '') {
    const name = defaultPassengerName(passengerIndex);
    return { name, notice: `A name can't be empty, so it is now "${name}"` };
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return {
      name: trimmed.slice(0, MAX_NAME_LENGTH).trim(),
      notice: `Names are limited to ${MAX_NAME_LENGTH} characters, so it was shortened`,
    };
  }
  return { name: trimmed, notice: null };
}

function renamePassenger(
  state: BookingState,
  passengerId: string,
  rawName: string,
): BookingState {
  const index = state.passengers.findIndex((p) => p.id === passengerId);
  if (index === -1) return state;
  const { name } = resolvePassengerName(rawName, index);
  return {
    ...state,
    passengers: updatePassenger(state.passengers, passengerId, { name }),
  };
}

/**
 * One meal per passenger. Picking the meal they already have, `null` or the
 * "No meal" option clears it. Unknown passengers/meals are ignored.
 */
function selectMeal(
  state: BookingState,
  passengerId: string,
  mealId: string | null,
): BookingState {
  const passenger = state.passengers.find((p) => p.id === passengerId);
  if (!passenger) return state;
  if (mealId !== null && !MEAL_OPTIONS.some((meal) => meal.id === mealId)) {
    return state;
  }
  const isClearing =
    mealId === null || mealId === NO_MEAL_ID || mealId === passenger.mealId;
  const nextMealId = isClearing ? null : mealId;
  if (nextMealId === passenger.mealId) return state;
  return {
    ...state,
    passengers: updatePassenger(state.passengers, passengerId, {
      mealId: nextMealId,
    }),
  };
}

/**
 * The new layout's seats arrive asynchronously (SEATS_LOADED), so the old ones
 * are dropped right away and the map shows its loading state meanwhile.
 */
function setLayout(state: BookingState, layoutId: LayoutId): BookingState {
  if (layoutId === state.layoutId) return state;
  return {
    ...state,
    layoutId,
    seats: [],
    seatMapStatus: 'loading',
    // Seat ids differ between layouts, so old assignments are meaningless.
    passengers: state.passengers.map((p) => ({ ...p, seatId: null })),
  };
}

/**
 * Responses are matched to the current layout and to a pending request, so a
 * slow answer for a layout the user already left (or a duplicate) is ignored.
 */
function isAwaitingSeats(state: BookingState, layoutId: LayoutId): boolean {
  return state.seatMapStatus === 'loading' && state.layoutId === layoutId;
}

function seatsLoaded(
  state: BookingState,
  layoutId: LayoutId,
  seats: Seat[],
): BookingState {
  if (!isAwaitingSeats(state, layoutId)) return state;
  return { ...state, seats, seatMapStatus: 'ready' };
}

function seatsFailed(state: BookingState, layoutId: LayoutId): BookingState {
  if (!isAwaitingSeats(state, layoutId)) return state;
  return { ...state, seats: [], seatMapStatus: 'error' };
}

function retrySeats(state: BookingState): BookingState {
  if (state.seatMapStatus !== 'error') return state;
  return { ...state, seatMapStatus: 'loading' };
}

/** Frees a passenger's seat; a passenger without one (or unknown) is a no-op. */
function removeSeat(state: BookingState, passengerId: string): BookingState {
  const passenger = state.passengers.find((p) => p.id === passengerId);
  if (!passenger || passenger.seatId === null) return state;
  return {
    ...state,
    passengers: updatePassenger(state.passengers, passengerId, { seatId: null }),
  };
}

/** Back to the start. A seat map that is already loaded for the default layout is kept. */
function reset(state: BookingState): BookingState {
  const fresh = createLoadingState();
  const canReuseSeats =
    state.seatMapStatus === 'ready' && state.layoutId === fresh.layoutId;
  return canReuseSeats
    ? { ...fresh, seats: state.seats, seatMapStatus: 'ready' }
    : fresh;
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
    case 'SEATS_LOADED':
      return seatsLoaded(state, action.layoutId, action.seats);
    case 'SEATS_FAILED':
      return seatsFailed(state, action.layoutId);
    case 'RETRY_SEATS':
      return retrySeats(state);
    case 'SEAT_CLICKED':
      return applySeatClick(state, action.seatId);
    case 'REMOVE_SEAT':
      return removeSeat(state, action.passengerId);
    case 'SELECT_MEAL':
      return selectMeal(state, action.passengerId, action.mealId);
    case 'RESET':
      return reset(state);
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
