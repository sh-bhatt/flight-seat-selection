import { describe, expect, it } from 'vitest';
import { formatCount } from '@/lib/formatCount';

describe('formatCount', () => {
  it('uses the singular only for exactly one', () => {
    expect(formatCount(1, 'seat')).toBe('1 seat');
    expect(formatCount(0, 'seat')).toBe('0 seats');
    expect(formatCount(3, 'seat selection')).toBe('3 seat selections');
  });

  it('accepts an irregular plural', () => {
    expect(formatCount(2, 'is', 'are')).toBe('2 are');
  });
});
