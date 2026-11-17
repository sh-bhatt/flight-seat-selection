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
});
