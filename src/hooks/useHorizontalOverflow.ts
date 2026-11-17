'use client';

import { useEffect, useState, type RefObject } from 'react';

/** True while the element's content is wider than the element (so it scrolls sideways). */
export function useHorizontalOverflow(ref: RefObject<HTMLElement | null>): boolean {
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () =>
      setIsOverflowing(element.scrollWidth > element.clientWidth + 1);
    // Observing both the box and its content catches window resizes and content changes.
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [ref]);

  return isOverflowing;
}
