'use client';

import { useId } from 'react';
import { useBooking } from '@/context/BookingContext';
import { useMainView } from '@/context/ViewContext';
import { getFirstUnseatedPassenger, isBookingComplete } from '@/state/selectors';

interface UseContinueStepOptions {
  /** Called after any successful continue, e.g. to close the mobile sheet. */
  onProceed?: () => void;
}

export interface ContinueStep {
  label: string;
  isEnabled: boolean;
  /** Why Continue is blocked, shown as text under the button; null when enabled. */
  reason: string | null;
  /** Id of the reason text, for `aria-describedby`. */
  reasonId: string;
  proceed: () => void;
}

/**
 * What the primary button does for the open step: Seats -> Meals, Meals ->
 * the review modal. Both are gated by `isBookingComplete`; the reason names the first
 * passenger still without a seat.
 */
export function useContinueStep({
  onProceed,
}: UseContinueStepOptions = {}): ContinueStep {
  const state = useBooking();
  const { view, setView, setReviewStage } = useMainView();
  const reasonId = useId();

  const isEnabled = isBookingComplete(state);
  const unseated = getFirstUnseatedPassenger(state);
  const reason =
    !isEnabled && unseated ? `Pick a seat for ${unseated.name} to continue` : null;

  function proceed() {
    if (!isEnabled) return;
    if (view === 'seats') setView('meals');
    else setReviewStage('review');
    onProceed?.();
  }

  return {
    label: view === 'seats' ? 'Continue to meals' : 'Review & confirm',
    isEnabled,
    reason,
    reasonId,
    proceed,
  };
}
