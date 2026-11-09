import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Drone } from '../types/drone';
import { ApiError } from './api-error';
import { fetchDrones } from './drones.api';

const drone: Drone = {
  id: 'd1',
  latitude: 31.5,
  longitude: 34.9,
  createdAt: '2026-11-08T12:00:00.000Z',
};

function mockFetch(response: Partial<Response>) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, status: 200, ...response });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function mockFetchFailure(error: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchDrones', () => {
  it('GETs /drones from the configured API URL and returns the drones', async () => {
    const fetchMock = mockFetch({ json: () => Promise.resolve([drone]) });

    await expect(fetchDrones()).resolves.toEqual([drone]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/drones',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('throws an ApiError with the status on a non-2xx response', async () => {
    mockFetch({ ok: false, status: 503, statusText: 'Service Unavailable' });

    await expect(fetchDrones()).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      message: 'Server responded with 503 Service Unavailable',
    });
  });

  it('throws a readable ApiError when the server is unreachable', async () => {
    mockFetchFailure(new TypeError('Failed to fetch'));

    await expect(fetchDrones()).rejects.toThrow(
      `Could not reach http://api.test/api/drones. Check that the backend is running and that its CORS_ORIGINS includes ${window.location.origin}.`,
    );
  });

  it('rethrows the original error when the request was aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException('Aborted', 'AbortError');
    mockFetchFailure(abort);

    await expect(fetchDrones(controller.signal)).rejects.toBe(abort);
  });

  it('rejects a response that is not a list of drones', async () => {
    mockFetch({ json: () => Promise.resolve([{ id: 1 }]) });

    await expect(fetchDrones()).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects invalid JSON', async () => {
    mockFetch({ json: () => Promise.reject(new SyntaxError('bad json')) });

    await expect(fetchDrones()).rejects.toThrow('Server returned invalid JSON');
  });
});
