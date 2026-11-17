import { describe, expect, it } from 'vitest';
import { getPassengerInitial } from '@/lib/passengerInitial';

describe('getPassengerInitial', () => {
  it('uses the first letter, uppercased', () => {
    expect(getPassengerInitial('rahul')).toBe('R');
  });

  it('keeps the trailing number of default names', () => {
    expect(getPassengerInitial('Passenger 2')).toBe('P2');
  });

  it('falls back for blank names', () => {
    expect(getPassengerInitial('  ')).toBe('?');
  });

  it('keeps an emoji whole instead of splitting the surrogate pair', () => {
    expect(getPassengerInitial('\u{1F600} Sam')).toBe('\u{1F600}');
  });
});
