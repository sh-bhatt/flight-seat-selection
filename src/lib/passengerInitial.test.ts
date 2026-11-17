import { describe, expect, it } from 'vitest';
import { getPassengerInitial } from '@/lib/passengerInitial';

describe('getPassengerInitial', () => {
  it('uses the first letter of a single word, uppercased', () => {
    expect(getPassengerInitial('rahul')).toBe('R');
  });

  it('uses the first letters of the first and last word', () => {
    expect(getPassengerInitial('Aarav Mehta')).toBe('AM');
    expect(getPassengerInitial('  kabir  singh  mehta ')).toBe('KM');
  });

  it('keeps the trailing number of default names', () => {
    expect(getPassengerInitial('Passenger 1')).toBe('P1');
    expect(getPassengerInitial('Passenger 2')).toBe('P2');
  });

  it('falls back for blank names', () => {
    expect(getPassengerInitial('  ')).toBe('?');
  });

  it('keeps an emoji whole instead of splitting the surrogate pair', () => {
    expect(getPassengerInitial('\u{1F600}')).toBe('\u{1F600}');
    expect(getPassengerInitial('\u{1F600} Sam')).toBe('\u{1F600}S');
  });
});
