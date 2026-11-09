import { BadGatewayException, HttpException } from '@nestjs/common';
import type { CameraConfig } from '../../../src/camera/types/camera-config.js';
import { WhepService } from '../../../src/camera/whep.service.js';

const config: CameraConfig = {
  host: '10.0.10.72',
  rtspPort: 554,
  streamPath: 'stream1',
  username: 'admin',
  password: 'secret',
  mediamtxPath: 'mediamtx',
  webrtcPort: 8889,
};

function mockFetch(response: Response | Error) {
  const fetchMock =
    response instanceof Error
      ? vi.fn().mockRejectedValue(response)
      : vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('WhepService', () => {
  const service = new WhepService(config);

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards the offer to MediaMTX and returns the answer and session id', async () => {
    const fetchMock = mockFetch(
      new Response('answer-sdp', {
        status: 201,
        headers: { Location: '/camera/whep/session-1' },
      }),
    );

    await expect(service.createSession('offer-sdp')).resolves.toEqual({
      sdp: 'answer-sdp',
      sessionId: 'session-1',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8889/camera/whep',
      expect.objectContaining({
        method: 'POST',
        body: 'offer-sdp',
        headers: { 'Content-Type': 'application/sdp' },
      }),
    );
  });

  it('maps a MediaMTX error to 502', async () => {
    mockFetch(new Response('no stream', { status: 400 }));

    await expect(service.createSession('offer')).rejects.toMatchObject({
      status: 502,
    });
  });

  it('keeps 404 when the camera path is not ready', async () => {
    mockFetch(new Response('not found', { status: 404 }));

    const error = await service.createSession('offer').catch((e) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(404);
  });

  it('throws 502 when MediaMTX is not reachable', async () => {
    mockFetch(new TypeError('fetch failed'));

    await expect(service.createSession('offer')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('deletes a session on MediaMTX', async () => {
    const fetchMock = mockFetch(new Response(null, { status: 200 }));

    await service.closeSession('session-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8889/camera/whep/session-1',
      { method: 'DELETE' },
    );
  });
});
