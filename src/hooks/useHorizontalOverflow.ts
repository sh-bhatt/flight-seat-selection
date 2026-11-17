'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * True while the element's content is wider than the element (so it scrolls
 * sideways). With `reservePx`, true when the first child plus that much extra
 * room would not fit: it measures the child, not the scroll width, so the
 * answer does not change when the caller drops the room it reserved.
 */
export function useHorizontalOverflow(
  ref: RefObject<HTMLElement | null>,
  reservePx = 0,
): boolean {
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const child = element.firstElementChild;
      setIsOverflowing(
        reservePx > 0 && child instanceof HTMLElement
          ? child.offsetWidth + reservePx > element.clientWidth + 1
          : element.scrollWidth > element.clientWidth + 1,
      );
    };
    // Observing both the box and its content catches window resizes and content changes.
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [ref, reservePx]);

  return isOverflowing;
}
