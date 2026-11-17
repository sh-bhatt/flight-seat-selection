'use client';

import type { KeyboardEvent } from 'react';
import { getOtherView } from '@/components/layout/stepModel';
import { useMainView } from '@/context/ViewContext';

/**
 * Left / Right arrows on a Seats or Meals step button switch to the other one
 * and move focus with it. The buttons find each other through the shared
 * `data-step-group` ancestor, so the desktop stepper and the mobile switch
 * (both in the DOM) never steal each other's focus.
 */
export function useStepKeyDown() {
  const { view, setView } = useMainView();
  return (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = getOtherView(view);
    setView(next);
    event.currentTarget
      .closest('[data-step-group]')
      ?.querySelector<HTMLButtonElement>(`[data-step-view="${next}"]`)
      ?.focus();
  };
}
