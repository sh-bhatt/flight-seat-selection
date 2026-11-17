import { LAYOUTS } from '@/data/layouts';
import { MEAL_OPTIONS, NO_MEAL_ID } from '@/data/meals';
import type { BookingState } from '@/state/bookingReducer';
import type { MealOption, Passenger, Seat, SeatStatus } from '@/types';

export interface PriceLineItem {
  label: string;
  amount: number;
}

export interface PassengerPriceBreakdown {
  passengerId: string;
  passengerName: string;
  seatItem: PriceLineItem | null;
  mealItem: PriceLineItem | null;
  subtotal: number;
}

type SeatOwnerMap = ReadonlyMap<string, string>;

// Caches keyed by array identity: the reducer returns a new array on every
// change, so a stale entry can never be read and old ones are garbage collected.
const ownerMapCache = new WeakMap<readonly Passenger[], SeatOwnerMap>();
const seatIndexCache = new WeakMap<readonly Seat[], ReadonlyMap<string, Seat>>();

/** seatId → passengerId, built once per `passengers` array. */
export function getSeatOwnerMap(passengers: readonly Passenger[]): SeatOwnerMap {
  const cached = ownerMapCache.get(passengers);
  if (cached) return cached;
  const map = new Map<string, string>();
  for (const passenger of passengers) {
    if (passenger.seatId !== null) map.set(passenger.seatId, passenger.id);
  }
  ownerMapCache.set(passengers, map);
  return map;
}

export function getSeatById(
  seats: readonly Seat[],
  seatId: string,
): Seat | undefined {
  let index = seatIndexCache.get(seats);
  if (!index) {
    index = new Map(seats.map((seat) => [seat.id, seat]));
    seatIndexCache.set(seats, index);
  }
  return index.get(seatId);
}

export function getSeatOwner(
  state: BookingState,
  seatId: string,
): Passenger | undefined {
  const ownerId = getSeatOwnerMap(state.passengers).get(seatId);
  return ownerId === undefined
    ? undefined
    : state.passengers.find((passenger) => passenger.id === ownerId);
}

export function getSeatStatus(state: BookingState, seat: Seat): SeatStatus {
  if (seat.isOccupied) return 'occupied';
  const ownerId = getSeatOwnerMap(state.passengers).get(seat.id);
  if (ownerId === undefined) return 'available';
  return ownerId === state.activePassengerId
    ? 'selected-current'
    : 'selected-other';
}

export function getPassengerSeat(
  state: BookingState,
  passengerId: string,
): Seat | undefined {
  const passenger = state.passengers.find((p) => p.id === passengerId);
  if (!passenger || passenger.seatId === null) return undefined;
  return getSeatById(state.seats, passenger.seatId);
}

function getMealById(
  meals: readonly MealOption[],
  mealId: string | null,
): MealOption | undefined {
  return mealId === null ? undefined : meals.find((m) => m.id === mealId);
}

export function getSeatsTotal(state: BookingState): number {
  return state.passengers.reduce(
    (sum, passenger) =>
      sum + (getPassengerSeat(state, passenger.id)?.price ?? 0),
    0,
  );
}

export function getMealsTotal(
  state: BookingState,
  meals: readonly MealOption[] = MEAL_OPTIONS,
): number {
  if (!state.mealsEnabled) return 0;
  return state.passengers.reduce(
    (sum, passenger) =>
      sum + (getMealById(meals, passenger.mealId)?.price ?? 0),
    0,
  );
}

export function getGrandTotal(
  state: BookingState,
  meals: readonly MealOption[] = MEAL_OPTIONS,
): number {
  return getSeatsTotal(state) + getMealsTotal(state, meals);
}

export function getPriceBreakdown(
  state: BookingState,
  meals: readonly MealOption[] = MEAL_OPTIONS,
): PassengerPriceBreakdown[] {
  return state.passengers.map((passenger) => {
    const seat = getPassengerSeat(state, passenger.id);
    const meal = state.mealsEnabled
      ? getMealById(meals, passenger.mealId)
      : undefined;
    const seatItem = seat
      ? { label: `Seat ${seat.id}`, amount: seat.price }
      : null;
    const mealItem = meal ? { label: meal.name, amount: meal.price } : null;
    return {
      passengerId: passenger.id,
      passengerName: passenger.name,
      seatItem,
      mealItem,
      subtotal: (seatItem?.amount ?? 0) + (mealItem?.amount ?? 0),
    };
  });
}

export function getUnassignedCount(state: BookingState): number {
  return state.passengers.filter((p) => p.seatId === null).length;
}

export function getAssignedCount(state: BookingState): number {
  return state.passengers.filter((p) => p.seatId !== null).length;
}

/** True once every passenger has a seat, i.e. the booking can be confirmed. */
export function isBookingComplete(state: BookingState): boolean {
  return state.passengers.length > 0 && getUnassignedCount(state) === 0;
}

/** How many seated passengers would be dropped by shrinking to `newCount`. */
export function getSeatedPassengersRemovedBy(
  state: BookingState,
  newCount: number,
): number {
  return state.passengers
    .slice(Math.max(0, newCount))
    .filter((passenger) => passenger.seatId !== null).length;
}

export function getPassengerMeal(
  state: BookingState,
  passengerId: string,
  meals: readonly MealOption[] = MEAL_OPTIONS,
): MealOption | undefined {
  if (!state.mealsEnabled) return undefined;
  const passenger = state.passengers.find((p) => p.id === passengerId);
  return passenger ? getMealById(meals, passenger.mealId) : undefined;
}

export interface SeatSummaryLine {
  passengerId: string;
  passengerName: string;
  seat: Seat;
}

export interface MealSummaryLine {
  passengerId: string;
  passengerName: string;
  meal: MealOption;
}

/** One line per seated passenger, in passenger order. */
export function getSeatSummaryLines(state: BookingState): SeatSummaryLine[] {
  return state.passengers.flatMap((passenger) => {
    const seat = getPassengerSeat(state, passenger.id);
    return seat
      ? [{ passengerId: passenger.id, passengerName: passenger.name, seat }]
      : [];
  });
}

/** One line per passenger with a meal; empty while meals are disabled. */
export function getMealSummaryLines(
  state: BookingState,
  meals: readonly MealOption[] = MEAL_OPTIONS,
): MealSummaryLine[] {
  return state.passengers.flatMap((passenger) => {
    const meal = getPassengerMeal(state, passenger.id, meals);
    return meal
      ? [{ passengerId: passenger.id, passengerName: passenger.name, meal }]
      : [];
  });
}

/** Option id highlighted in the picker; a passenger without a meal has "No meal". */
export function getSelectedMealOptionId(
  state: BookingState,
  passengerId: string,
): string {
  const passenger = state.passengers.find((p) => p.id === passengerId);
  return passenger?.mealId ?? NO_MEAL_ID;
}

/** True when there is anything to price: a seat or a meal. */
export function hasPricedSelections(state: BookingState): boolean {
  return getAssignedCount(state) > 0 || getMealSummaryLines(state).length > 0;
}

export function getActivePassenger(state: BookingState): Passenger | undefined {
  return state.passengers.find((p) => p.id === state.activePassengerId);
}

/** First passenger (in order) without a seat; drives the "Pick a seat for X" hint. */
export function getFirstUnseatedPassenger(
  state: BookingState,
): Passenger | undefined {
  return state.passengers.find((p) => p.seatId === null);
}

export interface PassengerSeatLine {
  passengerId: string;
  passengerName: string;
  /** Undefined while the passenger has no seat. */
  seat: Seat | undefined;
}

/** One line per passenger, seated or not, in passenger order. */
export function getPassengerSeatLines(state: BookingState): PassengerSeatLine[] {
  return state.passengers.map((passenger) => ({
    passengerId: passenger.id,
    passengerName: passenger.name,
    seat: getPassengerSeat(state, passenger.id),
  }));
}

/**
 * Who sits right beside `seat` in the same block (left neighbour first), other
 * than the person this seat is for: its owner, or the active passenger who
 * would take it. Seats across an aisle never count.
 */
export function getAdjacentCompanion(
  state: BookingState,
  seat: Seat,
): Passenger | undefined {
  const group = LAYOUTS[state.layoutId].columnGroups.find((columns) =>
    columns.includes(seat.column),
  );
  if (!group) return undefined;
  const index = group.indexOf(seat.column);
  const subject = getSeatOwner(state, seat.id) ?? getActivePassenger(state);
  for (const column of [group[index - 1], group[index + 1]]) {
    if (column === undefined) continue;
    const neighbour = getSeatOwner(state, `${seat.row}${column}`);
    if (neighbour && neighbour.id !== subject?.id) return neighbour;
  }
  return undefined;
}
