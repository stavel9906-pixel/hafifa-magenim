import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../src/api/api-error';
import {
  closeWhepSession,
  createWhepSession,
  fetchCameraStatus,
  moveCamera,
  stopCamera,
} from '../../src/api/camera.api';

function mockFetch(response: Partial<Response>) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, status: 200, ...response });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchCameraStatus', () => {
  it('GETs /camera and returns the status', async () => {
    const fetchMock = mockFetch({ json: () => Promise.resolve({ enabled: true }) });

    await expect(fetchCameraStatus()).resolves.toEqual({ enabled: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/camera',
      expect.anything(),
    );
  });

  it.each([null, {}, { enabled: 'yes' }])('rejects the body %j', async (body) => {
    mockFetch({ json: () => Promise.resolve(body) });

    await expect(fetchCameraStatus()).rejects.toBeInstanceOf(ApiError);
  });
});

describe('createWhepSession', () => {
  it('POSTs the SDP offer and resolves the session URL', async () => {
    const fetchMock = mockFetch({
      status: 201,
      headers: new Headers({ Location: 'whep/abc' }),
      text: () => Promise.resolve('answer-sdp'),
    });

    await expect(createWhepSession('offer-sdp')).resolves.toEqual({
      answerSdp: 'answer-sdp',
      sessionUrl: 'http://api.test/api/camera/whep/abc',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/camera/whep',
      expect.objectContaining({
        method: 'POST',
        body: 'offer-sdp',
        headers: { 'Content-Type': 'application/sdp' },
      }),
    );
  });

  it('throws an ApiError when the server does not create a session', async () => {
    mockFetch({ ok: false, status: 502, headers: new Headers() });

    await expect(createWhepSession('offer')).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
    });
  });
});

describe('PTZ', () => {
  it('POSTs a move in the given direction', async () => {
    const fetchMock = mockFetch({ status: 204 });

    await moveCamera('left');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/camera/ptz/move/left',
      { method: 'POST' },
    );
  });

  it('POSTs a stop', async () => {
    const fetchMock = mockFetch({ status: 204 });

    await stopCamera();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/camera/ptz/stop',
      { method: 'POST' },
    );
  });

  it('throws an ApiError when the server refuses', async () => {
    mockFetch({ ok: false, status: 502 });

    await expect(moveCamera('right')).rejects.toMatchObject({ status: 502 });
  });
});

describe('closeWhepSession', () => {
  it('DELETEs the session URL', async () => {
    const fetchMock = mockFetch({ status: 204 });

    await closeWhepSession('http://api.test/api/camera/whep/abc');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/camera/whep/abc',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
