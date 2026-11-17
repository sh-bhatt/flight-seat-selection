import { MEAL_OPTIONS } from '@/data/meals';
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
