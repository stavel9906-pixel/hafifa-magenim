import type { CameraConfig } from '../../../../src/camera/types/camera-config.js';
import {
  buildMediaMtxEnv,
  sessionIdFromLocation,
  whepUrl,
} from '../../../../src/camera/utils/mediamtx.utils.js';

const config: CameraConfig = {
  host: '10.0.10.72',
  rtspPort: 554,
  streamPath: 'stream1',
  username: 'admin',
  password: 'secret',
  mediamtxPath: 'mediamtx',
  webrtcPort: 8889,
};

describe('buildMediaMtxEnv', () => {
  it('binds WebRTC to localhost and sets the camera source', () => {
    expect(buildMediaMtxEnv(config)).toEqual({
      MTX_WEBRTCADDRESS: '127.0.0.1:8889',
      MTX_PATHS_CAMERA_SOURCE: 'rtsp://admin:secret@10.0.10.72:554/stream1',
    });
  });
});

describe('whepUrl', () => {
  it('points at the camera path on the local MediaMTX', () => {
    expect(whepUrl(config)).toBe('http://127.0.0.1:8889/camera/whep');
  });

  it('adds an encoded session id', () => {
    expect(whepUrl(config, 'a/b')).toBe(
      'http://127.0.0.1:8889/camera/whep/a%2Fb',
    );
  });
});

describe('sessionIdFromLocation', () => {
  it.each([
    ['/camera/whep/abc-123', 'abc-123'],
    ['http://127.0.0.1:8889/camera/whep/abc?x=1', 'abc'],
  ])('reads the id from "%s"', (location, id) => {
    expect(sessionIdFromLocation(location)).toBe(id);
  });

  it.each([null, '', '/camera/whep'])(
    'returns undefined for %j',
    (location) => {
      expect(sessionIdFromLocation(location)).toBeUndefined();
    },
  );
});
