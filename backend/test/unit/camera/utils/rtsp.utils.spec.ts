import type { CameraConfig } from '../../../../src/camera/types/camera-config.js';
import {
  buildRtspUrl,
  redactSecrets,
} from '../../../../src/camera/utils/rtsp.utils.js';

const config: CameraConfig = {
  host: '10.0.10.72',
  rtspPort: 554,
  streamPath: 'stream1',
  username: 'admin',
  password: 'p@ss:word',
  mediamtxPath: 'mediamtx',
  webrtcPort: 8889,
};

describe('buildRtspUrl', () => {
  it('builds the URL with encoded credentials', () => {
    expect(buildRtspUrl(config)).toBe(
      'rtsp://admin:p%40ss%3Aword@10.0.10.72:554/stream1',
    );
  });

  it('omits credentials when there is no username', () => {
    expect(buildRtspUrl({ ...config, username: '' })).toBe(
      'rtsp://10.0.10.72:554/stream1',
    );
  });

  it('accepts a stream path with a leading slash', () => {
    expect(
      buildRtspUrl({ ...config, username: '', streamPath: '/stream0' }),
    ).toBe('rtsp://10.0.10.72:554/stream0');
  });
});

describe('redactSecrets', () => {
  it('hides the raw and URL-encoded password', () => {
    expect(
      redactSecrets(
        'rtsp://admin:p%40ss%3Aword@host failed (p@ss:word)',
        config,
      ),
    ).toBe('rtsp://admin:***@host failed (***)');
  });

  it('leaves text unchanged when there is no password', () => {
    expect(redactSecrets('some error', { ...config, password: '' })).toBe(
      'some error',
    );
  });
});
