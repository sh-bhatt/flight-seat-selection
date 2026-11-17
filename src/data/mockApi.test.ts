import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SEAT_MAP_DELAY_MS, SeatMapFetchError, fetchSeatMap } from '@/data/mockApi';
import { generateSeatMap } from '@/lib/generateSeatMap';

function stubSearch(search: string) {
  vi.stubGlobal('window', { location: { search } });
}

describe('fetchSeatMap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('resolves with the layout seats after 600ms, not before', async () => {
    const onSettled = vi.fn();
    const request = fetchSeatMap('2-3-2').then(onSettled);

    await vi.advanceTimersByTimeAsync(SEAT_MAP_DELAY_MS - 1);
    expect(onSettled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await request;
    expect(onSettled).toHaveBeenCalledWith(generateSeatMap('2-3-2'));
  });

  it('rejects when the URL has ?simulateError=1', async () => {
    stubSearch('?simulateError=1');
    const request = fetchSeatMap('3-2');
    const assertion = expect(request).rejects.toBeInstanceOf(SeatMapFetchError);
    await vi.advanceTimersByTimeAsync(SEAT_MAP_DELAY_MS);
    await assertion;
  });

  it('ignores other values and unrelated params', async () => {
    stubSearch('?simulateError=0&debug=1');
    const request = fetchSeatMap('3-2');
    await vi.advanceTimersByTimeAsync(SEAT_MAP_DELAY_MS);
    await expect(request).resolves.toEqual(generateSeatMap('3-2'));
  });
});
