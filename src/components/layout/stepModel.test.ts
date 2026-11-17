import { describe, expect, it } from 'vitest';
import {
  getBookingSteps,
  getCurrentStep,
  getOtherView,
} from '@/components/layout/stepModel';

describe('getBookingSteps', () => {
  it('marks Travellers done and Seats current on the seats view', () => {
    expect(getBookingSteps('seats').map((s) => s.status)).toEqual([
      'done',
      'current',
      'upcoming',
      'upcoming',
    ]);
  });

  it('marks Seats done and Meals current on the meals view', () => {
    expect(getBookingSteps('meals').map((s) => s.status)).toEqual([
      'done',
      'done',
      'current',
      'upcoming',
    ]);
  });

  it('only Seats and Meals open a view', () => {
    expect(getBookingSteps('seats').map((s) => s.view)).toEqual([
      null,
      'seats',
      'meals',
      null,
    ]);
  });
});

describe('review stages', () => {
  it('makes Review current while the review modal is open', () => {
    expect(getBookingSteps('meals', 'review').map((s) => s.status)).toEqual([
      'done',
      'done',
      'done',
      'current',
    ]);
    expect(getCurrentStep('meals', 'review')).toMatchObject({ number: 4, label: 'Review' });
  });

  it('shows every step as done after Confirm', () => {
    expect(getBookingSteps('meals', 'confirmed').map((s) => s.status)).toEqual([
      'done',
      'done',
      'done',
      'done',
    ]);
    expect(getCurrentStep('meals', 'confirmed').label).toBe('Review');
  });
});

describe('isRevisitable', () => {
  it('nothing can be revisited on the first step', () => {
    expect(getBookingSteps('seats').map((s) => s.isRevisitable)).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it('only Seats can be revisited from Meals; Travellers stays fixed', () => {
    expect(getBookingSteps('meals').map((s) => s.isRevisitable)).toEqual([
      false,
      true,
      false,
      false,
    ]);
  });
});

describe('getCurrentStep / getOtherView', () => {
  it('describes the open step', () => {
    expect(getCurrentStep('seats')).toMatchObject({ number: 2, label: 'Seats' });
    expect(getCurrentStep('meals')).toMatchObject({ number: 3, label: 'Meals' });
  });

  it('flips between the two switchable views', () => {
    expect(getOtherView('seats')).toBe('meals');
    expect(getOtherView('meals')).toBe('seats');
  });
});
