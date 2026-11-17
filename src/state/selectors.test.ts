import { describe, expect, it } from 'vitest';
import {
  bookingReducer,
  createInitialState,
  type BookingAction,
  type BookingState,
} from '@/state/bookingReducer';
import {
  getActivePassenger,
  hasBookingProgress,
  getAdjacentCompanion,
  getFirstUnseatedPassenger,
  getPassengerSeatLines,
  getSeatById,
} from '@/state/selectors';

function run(state: BookingState, ...actions: BookingAction[]): BookingState {
  return actions.reduce(bookingReducer, state);
}

const click = (seatId: string): BookingAction => ({
  type: 'SEAT_CLICKED',
  seatId,
});

function seatOf(state: BookingState, seatId: string) {
  const seat = getSeatById(state.seats, seatId);
  if (!seat) throw new Error(`missing seat ${seatId}`);
  return seat;
}

// 3-2 layout, rows 3+ are free of overrides: 3A/3B/3C | 3D/3E. Pick rows with no occupied seats.
const row = (() => {
  const { seats } = createInitialState();
  for (let r = 3; r <= 20; r += 1) {
    if (seats.filter((s) => s.row === r).every((s) => !s.isOccupied)) return r;
  }
  throw new Error('no fully free row');
})();

const threePassengers = run(createInitialState(), {
  type: 'SET_PASSENGER_COUNT',
  count: 3,
});

describe('getActivePassenger / getFirstUnseatedPassenger', () => {
  it('returns the active passenger', () => {
    expect(getActivePassenger(threePassengers)?.id).toBe('passenger-1');
  });

  it('returns the first passenger without a seat, in order', () => {
    const state = run(threePassengers, click(`${row}A`));
    // Passenger 1 is seated, so the first unseated one is Passenger 2.
    expect(getFirstUnseatedPassenger(state)?.id).toBe('passenger-2');
  });

  it('is undefined once everyone is seated', () => {
    const state = run(
      threePassengers,
      click(`${row}A`),
      click(`${row}B`),
      click(`${row}D`),
    );
    expect(getFirstUnseatedPassenger(state)).toBeUndefined();
  });
});

describe('getPassengerSeatLines', () => {
  it('lists every passenger, with the seat only when seated', () => {
    const state = run(threePassengers, click(`${row}A`));
    const lines = getPassengerSeatLines(state);
    expect(lines.map((l) => l.passengerId)).toEqual([
      'passenger-1',
      'passenger-2',
      'passenger-3',
    ]);
    expect(lines[0].seat?.id).toBe(`${row}A`);
    expect(lines[1].seat).toBeUndefined();
  });
});

describe('getAdjacentCompanion', () => {
  it('finds the passenger seated right beside a free seat (active passenger excluded)', () => {
    // Passenger 1 takes A; Passenger 2 is now active and hovers B.
    const state = run(threePassengers, click(`${row}A`));
    expect(getAdjacentCompanion(state, seatOf(state, `${row}B`))?.id).toBe(
      'passenger-1',
    );
  });

  it('checks both neighbours of a middle seat', () => {
    const state = run(threePassengers, click(`${row}C`));
    // 3B's right neighbour is C (Passenger 1); Passenger 2 is active.
    expect(getAdjacentCompanion(state, seatOf(state, `${row}B`))?.id).toBe(
      'passenger-1',
    );
  });

  it("ignores the seat's own owner and returns the other neighbour", () => {
    const state = run(threePassengers, click(`${row}A`), click(`${row}B`));
    expect(getAdjacentCompanion(state, seatOf(state, `${row}A`))?.id).toBe(
      'passenger-2',
    );
    expect(getAdjacentCompanion(state, seatOf(state, `${row}B`))?.id).toBe(
      'passenger-1',
    );
  });

  it('does not count a seat across the aisle', () => {
    // 3C and 3D are separated by the aisle in the 3-2 layout.
    const state = run(threePassengers, click(`${row}C`));
    expect(getAdjacentCompanion(state, seatOf(state, `${row}D`))).toBeUndefined();
  });

  it('does not count the active passenger as their own companion', () => {
    // Passenger 1 is seated at A and active again (all unseated -> moving).
    const state = run(
      createInitialState(),
      click(`${row}A`),
    );
    expect(getAdjacentCompanion(state, seatOf(state, `${row}B`))).toBeUndefined();
  });

  it('is undefined when the neighbours are empty', () => {
    expect(
      getAdjacentCompanion(threePassengers, seatOf(threePassengers, `${row}B`)),
    ).toBeUndefined();
  });
});

describe('hasBookingProgress', () => {
  const fresh = createInitialState();

  it('is false for an untouched booking', () => {
    expect(hasBookingProgress(fresh)).toBe(false);
  });

  it('is true for an extra passenger, a rename, a seat or a meal', () => {
    expect(hasBookingProgress(threePassengers)).toBe(true);
    expect(
      hasBookingProgress(
        run(fresh, { type: 'RENAME_PASSENGER', passengerId: 'passenger-1', name: 'Asha' }),
      ),
    ).toBe(true);
    expect(hasBookingProgress(run(fresh, click(`${row}A`)))).toBe(true);
    expect(
      hasBookingProgress(
        run(fresh, { type: 'SELECT_MEAL', passengerId: 'passenger-1', mealId: 'jain-meal' }),
      ),
    ).toBe(true);
  });
});
