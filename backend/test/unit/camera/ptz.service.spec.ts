import { BadGatewayException } from '@nestjs/common';
import { PTZ_AUTO_STOP_MS } from '../../../src/camera/constants/camera.constants.js';
import { PtzService } from '../../../src/camera/ptz.service.js';
import type { CameraConfig } from '../../../src/camera/types/camera-config.js';

const config: CameraConfig = {
  host: '10.0.10.72',
  rtspPort: 554,
  streamPath: 'stream1',
  username: 'admin',
  password: 'secret',
  mediamtxPath: 'mediamtx',
  webrtcPort: 8889,
};

const sentBodies = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map(([, init]) => (init as RequestInit).body as string);

describe('PtzService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let service: PtzService;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    service = new PtzService(config);
  });

  afterEach(() => {
    service.onModuleDestroy();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('pans left with a negative speed on the camera PTZ service', async () => {
    await service.move('left');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://10.0.10.72/onvif/ptz',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(sentBodies(fetchMock)[0]).toContain('<tt:PanTilt x="-0.5" y="0"/>');
  });

  it('pans right with a positive speed', async () => {
    await service.move('right');

    expect(sentBodies(fetchMock)[0]).toContain('<tt:PanTilt x="0.5" y="0"/>');
  });

  it('sends Stop', async () => {
    await service.stop();

    expect(sentBodies(fetchMock)[0]).toContain('<tptz:Stop>');
  });

  it('stops the camera by itself when no command follows a move', async () => {
    await service.move('right');

    await vi.advanceTimersByTimeAsync(PTZ_AUTO_STOP_MS);

    expect(sentBodies(fetchMock)[1]).toContain('<tptz:Stop>');
  });

  it('keeps moving while moves keep arriving', async () => {
    await service.move('right');
    await vi.advanceTimersByTimeAsync(PTZ_AUTO_STOP_MS - 100);
    await service.move('right');
    await vi.advanceTimersByTimeAsync(PTZ_AUTO_STOP_MS - 100);

    expect(sentBodies(fetchMock).some((b) => b.includes('<tptz:Stop>'))).toBe(
      false,
    );
  });

  it('does not auto-stop again after an explicit stop', async () => {
    await service.move('left');
    await service.stop();
    await vi.advanceTimersByTimeAsync(PTZ_AUTO_STOP_MS * 2);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws 502 when the camera rejects the command', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 400 }));

    await expect(service.move('left')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('throws 502 when the camera is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(service.stop()).rejects.toBeInstanceOf(BadGatewayException);
  });
});
