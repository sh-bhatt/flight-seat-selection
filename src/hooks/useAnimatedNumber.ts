'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const DEFAULT_DURATION_MS = 350;

/**
 * Eases the returned number toward `target` whenever it changes. The first
 * render returns `target` itself (so server and client markup match), and with
 * reduced motion there is no animation at all.
 */
export function useAnimatedNumber(
  target: number,
  durationMs: number = DEFAULT_DURATION_MS,
): number {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayed, setDisplayed] = useState(target);
  // Where the last frame left off, so a change mid-animation continues from there.
  const lastValue = useRef(target);

  useEffect(() => {
    if (prefersReducedMotion || lastValue.current === target) return;
    const from = lastValue.current;
    let startTime: number | null = null;
    let frame = 0;

    function step(now: number) {
      startTime ??= now;
      const progress = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      const value =
        progress === 1 ? target : Math.round(from + (target - from) * eased);
      lastValue.current = value;
      setDisplayed(value);
      if (progress < 1) frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, prefersReducedMotion, durationMs]);

  return prefersReducedMotion ? target : displayed;
}
