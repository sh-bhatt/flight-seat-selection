'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Keeps keyboard focus from falling back to <body> when the focused control
 * disappears (a remove button whose seat is gone, an input that closes).
 * Call `requestFocus()` in the handler; after the next render the element in
 * `targetRef` is focused.
 */
export function useFocusAfterRender<T extends HTMLElement>() {
  const targetRef = useRef<T>(null);
  const isPending = useRef(false);

  useEffect(() => {
    if (!isPending.current) return;
    isPending.current = false;
    targetRef.current?.focus();
  });

  const requestFocus = useCallback(() => {
    isPending.current = true;
  }, []);

  return { targetRef, requestFocus };
}
