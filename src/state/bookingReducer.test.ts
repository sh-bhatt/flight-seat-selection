import { describe, expect, it } from 'vitest';
import {
  bookingReducer,
  createInitialState,
  getSeatClickOutcome,
  type BookingAction,
  type BookingState,
} from '@/state/bookingReducer';
import {
  getGrandTotal,
  getMealsTotal,
  getPriceBreakdown,
  getSelectedMealOptionId,
  getSeatOwner,
  getSeatsTotal,
  getSeatStatus,
  getUnassignedCount,
} from '@/state/selectors';
import { MEAL_OPTIONS as MEALS, NO_MEAL_ID } from '@/data/meals';

function run(state: BookingState, ...actions: BookingAction[]): BookingState {
  return actions.reduce(bookingReducer, state);
}

function withPassengers(count: number): BookingState {
  return run(createInitialState(), { type: 'SET_PASSENGER_COUNT', count });
}

const click = (seatId: string): BookingAction => ({
  type: 'SEAT_CLICKED',
  seatId,
});

// Seats are deterministic, so these are stable per layout.
const base = createInitialState();
const freeSeats = base.seats.filter((s) => !s.isOccupied).map((s) => s.id);
const occupiedSeat = base.seats.find((s) => s.isOccupied)!.id;
const [seatA, seatB, seatC] = freeSeats;

describe('SEAT_CLICKED rules', () => {
  it('a) does nothing without an active passenger', () => {
    const state: BookingState = { ...base, activePassengerId: null };
    expect(getSeatClickOutcome(state, seatA)).toMatchObject({
      type: 'blocked',
      reason: 'no-passenger',
    });
    expect(bookingReducer(state, click(seatA))).toBe(state);
  });

  it('b) does nothing on an occupied seat', () => {
    expect(getSeatClickOutcome(base, occupiedSeat)).toMatchObject({
      type: 'blocked',
      reason: 'occupied',
    });
    expect(bookingReducer(base, click(occupiedSeat))).toBe(base);
  });

  it('c) does nothing on a seat held by another passenger', () => {
    const state = run(withPassengers(2), click(seatA)); // P1 takes A, P2 active
    expect(state.activePassengerId).toBe('passenger-2');
    expect(getSeatClickOutcome(state, seatA)).toMatchObject({
      type: 'blocked',
      reason: 'taken-by-other',
    });
    expect(bookingReducer(state, click(seatA))).toBe(state);
  });

  it('d) toggles off the active passenger\'s own seat', () => {
    const assigned = run(base, click(seatA));
    const state = run(assigned, {
      type: 'SET_ACTIVE_PASSENGER',
      passengerId: 'passenger-1',
    });
    expect(getSeatClickOutcome(state, seatA).type).toBe('removed');
    const next = bookingReducer(state, click(seatA));
    expect(next.passengers[0].seatId).toBeNull();
  });

  it('e) assigns an available seat', () => {
    expect(getSeatClickOutcome(base, seatA).type).toBe('assigned');
    expect(run(base, click(seatA)).passengers[0].seatId).toBe(seatA);
  });

  it('e) changing seat releases the old one', () => {
    const state = run(base, click(seatA)); // single passenger stays active
    expect(getSeatClickOutcome(state, seatB).type).toBe('changed');
    const next = bookingReducer(state, click(seatB));
    expect(next.passengers[0].seatId).toBe(seatB);
    expect(getSeatOwner(next, seatA)).toBeUndefined();
  });

  it('f) auto-advances to the next passenger without a seat', () => {
    const state = run(withPassengers(3), click(seatA));
    expect(state.activePassengerId).toBe('passenger-2');
    const next = run(state, click(seatB));
    expect(next.activePassengerId).toBe('passenger-3');
  });

  it('f) skips passengers who already have a seat and wraps around', () => {
    let state = withPassengers(3);
    state = run(
      state,
      { type: 'SET_ACTIVE_PASSENGER', passengerId: 'passenger-3' },
      click(seatC), // P3 seated → next unseated is P1
    );
    expect(state.activePassengerId).toBe('passenger-1');
    state = run(state, click(seatA)); // P1 seated → P2 is the only one left
    expect(state.activePassengerId).toBe('passenger-2');
  });

  it('f) stays on the same passenger when everyone is seated', () => {
    const state = run(withPassengers(2), click(seatA), click(seatB));
    expect(state.activePassengerId).toBe('passenger-2');
    expect(getUnassignedCount(state)).toBe(0);
  });

  it('never advances after removing a seat', () => {
    const state = run(withPassengers(2), click(seatA));
    const back = run(
      state,
      { type: 'SET_ACTIVE_PASSENGER', passengerId: 'passenger-1' },
      click(seatA),
    );
    expect(back.activePassengerId).toBe('passenger-1');
  });
});

describe('SET_PASSENGER_COUNT', () => {
  it('grows with default names and clamps to 1–6', () => {
    const state = withPassengers(3);
    expect(state.passengers.map((p) => p.name)).toEqual([
      'Passenger 1',
      'Passenger 2',
      'Passenger 3',
    ]);
    expect(run(state, { type: 'SET_PASSENGER_COUNT', count: 99 }).passengers)
      .toHaveLength(6);
    expect(run(state, { type: 'SET_PASSENGER_COUNT', count: 0 }).passengers)
      .toHaveLength(1);
  });

  it('shrinking frees seats and meals of removed passengers', () => {
    const full = run(
      withPassengers(3),
      click(seatA),
      click(seatB),
      click(seatC),
      { type: 'SELECT_MEAL', passengerId: 'passenger-3', mealId: 'paneer-wrap' },
    );
    const shrunk = run(full, { type: 'SET_PASSENGER_COUNT', count: 2 });
    expect(shrunk.passengers).toHaveLength(2);
    expect(getSeatOwner(shrunk, seatC)).toBeUndefined();
    expect(getMealsTotal(shrunk, MEALS)).toBe(0);
    expect(getSeatsTotal(shrunk)).toBe(
      shrunk.seats
        .filter((s) => s.id === seatA || s.id === seatB)
        .reduce((sum, s) => sum + s.price, 0),
    );
  });

  it('activates the last remaining passenger if the active one is removed', () => {
    const state = run(
      withPassengers(3),
      { type: 'SET_ACTIVE_PASSENGER', passengerId: 'passenger-3' },
      { type: 'SET_PASSENGER_COUNT', count: 2 },
    );
    expect(state.activePassengerId).toBe('passenger-2');
  });
});

describe('RENAME_PASSENGER', () => {
  it('trims, falls back to default when empty, and caps at 30 chars', () => {
    const rename = (name: string) =>
      run(base, { type: 'RENAME_PASSENGER', passengerId: 'passenger-1', name })
        .passengers[0].name;
    expect(rename('  Asha  ')).toBe('Asha');
    expect(rename('   ')).toBe('Passenger 1');
    expect(rename('x'.repeat(50))).toHaveLength(30);
  });
});

describe('SELECT_MEAL', () => {
  const pick = (mealId: string | null): BookingAction => ({
    type: 'SELECT_MEAL',
    passengerId: 'passenger-1',
    mealId,
  });

  it('assigns one meal and replaces it when another is picked', () => {
    const first = run(base, pick('paneer-wrap'));
    expect(first.passengers[0].mealId).toBe('paneer-wrap');
    expect(run(first, pick('jain-meal')).passengers[0].mealId).toBe('jain-meal');
  });

  it('deselects when the same meal is picked again, or on null / No meal', () => {
    const picked = run(base, pick('paneer-wrap'));
    expect(run(picked, pick('paneer-wrap')).passengers[0].mealId).toBeNull();
    expect(run(picked, pick(null)).passengers[0].mealId).toBeNull();
    expect(run(picked, pick(NO_MEAL_ID)).passengers[0].mealId).toBeNull();
  });

  it('ignores unknown meals and passengers (same state object)', () => {
    expect(bookingReducer(base, pick('pizza'))).toBe(base);
    expect(
      bookingReducer(base, {
        type: 'SELECT_MEAL',
        passengerId: 'nobody',
        mealId: 'paneer-wrap',
      }),
    ).toBe(base);
  });

  it('only affects the chosen passenger and leaves the seat alone', () => {
    const state = run(withPassengers(2), click(seatA), {
      type: 'SELECT_MEAL',
      passengerId: 'passenger-2',
      mealId: 'fruit-yogurt',
    });
    expect(state.passengers[0].mealId).toBeNull();
    expect(state.passengers[1].mealId).toBe('fruit-yogurt');
    expect(state.passengers[0].seatId).toBe(seatA);
  });

  it('free meals add nothing; paid meals add to meals subtotal and grand total', () => {
    const state = run(
      withPassengers(3),
      { type: 'SELECT_MEAL', passengerId: 'passenger-1', mealId: 'veg-sandwich' },
      { type: 'SELECT_MEAL', passengerId: 'passenger-2', mealId: 'jain-meal' },
    );
    expect(getMealsTotal(state)).toBe(250);
    expect(getGrandTotal(state)).toBe(250);
    expect(getPriceBreakdown(state)[0].mealItem).toEqual({
      label: 'Standard Veg Sandwich',
      amount: 0,
    });
    expect(getPriceBreakdown(state)[2].mealItem).toBeNull();
  });

  it('removing a meal lowers the totals', () => {
    const state = run(base, pick('chicken-biryani'), pick('chicken-biryani'));
    expect(getMealsTotal(state)).toBe(0);
    expect(getGrandTotal(state)).toBe(0);
  });

  it('getSelectedMealOptionId falls back to No meal', () => {
    expect(getSelectedMealOptionId(base, 'passenger-1')).toBe(NO_MEAL_ID);
    expect(
      getSelectedMealOptionId(run(base, pick('jain-meal')), 'passenger-1'),
    ).toBe('jain-meal');
  });
});

describe('SET_LAYOUT', () => {
  it('regenerates seats, clears assignments and keeps meals', () => {
    const state = run(
      withPassengers(2),
      click(seatA),
      click(seatB),
      { type: 'SELECT_MEAL', passengerId: 'passenger-1', mealId: 'paneer-wrap' },
      { type: 'SET_LAYOUT', layoutId: '2-3-2' },
    );
    expect(state.layoutId).toBe('2-3-2');
    expect(state.seats).not.toBe(base.seats);
    expect(state.passengers.every((p) => p.seatId === null)).toBe(true);
    expect(state.passengers[0].mealId).toBe('paneer-wrap');
  });
});

describe('totals and selectors', () => {
  it('sums seat and meal prices per passenger', () => {
    const priced = base.seats.filter((s) => !s.isOccupied && s.price > 0);
    const free = base.seats.find((s) => !s.isOccupied && s.price === 0)!;
    const state = run(
      withPassengers(2),
      click(priced[0].id),
      click(free.id),
      { type: 'SELECT_MEAL', passengerId: 'passenger-1', mealId: 'paneer-wrap' },
      { type: 'SELECT_MEAL', passengerId: 'passenger-2', mealId: 'chicken-biryani' },
    );
    expect(getSeatsTotal(state)).toBe(priced[0].price);
    expect(getMealsTotal(state, MEALS)).toBe(700);
    expect(getGrandTotal(state, MEALS)).toBe(priced[0].price + 700);
    const [first, second] = getPriceBreakdown(state, MEALS);
    expect(first.subtotal).toBe(priced[0].price + 300);
    expect(second.seatItem?.amount).toBe(0);
    expect(second.subtotal).toBe(400);
  });

  it('derives seat status from passengers', () => {
    const state = run(withPassengers(2), click(seatA));
    const seat = (id: string) => state.seats.find((s) => s.id === id)!;
    expect(getSeatStatus(state, seat(seatA))).toBe('selected-other');
    expect(getSeatStatus(state, seat(seatB))).toBe('available');
    expect(getSeatStatus(state, seat(occupiedSeat))).toBe('occupied');
  });

  it('REMOVE_SEAT and RESET', () => {
    const seated = run(base, click(seatA));
    expect(
      run(seated, { type: 'REMOVE_SEAT', passengerId: 'passenger-1' })
        .passengers[0].seatId,
    ).toBeNull();
    expect(run(seated, { type: 'RESET' })).toEqual(createInitialState());
  });
});

describe('invariants', () => {
  it('throws (dev only) when a seat is shared by two passengers', () => {
    const state = withPassengers(2);
    const corrupt: BookingState = {
      ...state,
      passengers: state.passengers.map((p) => ({ ...p, seatId: seatA })),
    };
    expect(() =>
      bookingReducer(corrupt, { type: 'SET_ACTIVE_PASSENGER', passengerId: 'passenger-1' }),
    ).toThrow(/multiple passengers/);
  });
});
