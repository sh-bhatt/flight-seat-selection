import { generateSeatMap } from '@/lib/generateSeatMap';
import type { LayoutId, Seat } from '@/types';

export const SEAT_MAP_DELAY_MS = 600;
/** Add `?simulateError=1` to the page URL to make every seat map request fail. */
export const SIMULATE_ERROR_PARAM = 'simulateError';

export class SeatMapFetchError extends Error {
  constructor(layoutId: LayoutId) {
    super(`Could not load the ${layoutId} seat map`);
    this.name = 'SeatMapFetchError';
  }
}

/** Read when the request settles, so it only ever runs in the browser. */
function isErrorSimulated(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    new URLSearchParams(window.location.search).get(SIMULATE_ERROR_PARAM) === '1'
  );
}

/**
 * Fake network call: resolves with the (deterministic) seat map after
 * `SEAT_MAP_DELAY_MS`, or rejects when `?simulateError=1` is in the URL.
 */
export function fetchSeatMap(layoutId: LayoutId): Promise<Seat[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isErrorSimulated()) reject(new SeatMapFetchError(layoutId));
      else resolve(generateSeatMap(layoutId));
    }, SEAT_MAP_DELAY_MS);
  });
}
