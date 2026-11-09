import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { Mock } from 'vitest';
import { MEDIAMTX_RESTART_DELAY_MS } from '../../../src/camera/constants/camera.constants.js';
import { MediaMtxService } from '../../../src/camera/mediamtx.service.js';
import type { CameraConfig } from '../../../src/camera/types/camera-config.js';
import type {
  MediaMtxProcess,
  MediaMtxSpawn,
} from '../../../src/camera/types/mediamtx-spawn.js';

const config: CameraConfig = {
  host: '10.0.10.72',
  rtspPort: 554,
  streamPath: 'stream1',
  username: 'admin',
  password: 'secret',
  mediamtxPath: 'mediamtx',
  webrtcPort: 8889,
};

function fakeProcess() {
  return Object.assign(new EventEmitter(), {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    kill: vi.fn(),
  });
}

describe('MediaMtxService', () => {
  let processes: ReturnType<typeof fakeProcess>[];
  let spawn: Mock<MediaMtxSpawn>;
  let service: MediaMtxService;

  beforeEach(() => {
    vi.useFakeTimers();
    processes = [];
    spawn = vi.fn<MediaMtxSpawn>(() => {
      const child = fakeProcess();
      processes.push(child);
      return child as unknown as MediaMtxProcess;
    });
    service = new MediaMtxService(config, spawn);
  });

  afterEach(() => {
    service.onModuleDestroy();
    vi.useRealTimers();
  });

  it('does not start when no camera is configured', () => {
    const disabled = new MediaMtxService({ ...config, host: undefined }, spawn);

    disabled.onApplicationBootstrap();

    expect(disabled.isConfigured).toBe(false);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('starts MediaMTX with the repo config and the camera source', () => {
    service.onApplicationBootstrap();

    expect(service.isRunning).toBe(true);
    const [command, args, env] = spawn.mock.calls[0];
    expect(command).toBe('mediamtx');
    expect(args).toEqual(['mediamtx/mediamtx.yml']);
    expect(env).toMatchObject({
      MTX_WEBRTCADDRESS: '127.0.0.1:8889',
      MTX_PATHS_CAMERA_SOURCE: 'rtsp://admin:secret@10.0.10.72:554/stream1',
    });
  });

  it('restarts MediaMTX after it exits unexpectedly', () => {
    service.onApplicationBootstrap();

    processes[0].emit('close', 1);
    expect(service.isRunning).toBe(false);

    vi.advanceTimersByTime(MEDIAMTX_RESTART_DELAY_MS);
    expect(spawn).toHaveBeenCalledTimes(2);
    expect(service.isRunning).toBe(true);
  });

  it('restarts after a spawn error other than a missing executable', () => {
    service.onApplicationBootstrap();

    processes[0].emit('error', new Error('spawn mediamtx EACCES'));
    processes[0].emit('close', -4092);
    vi.advanceTimersByTime(MEDIAMTX_RESTART_DELAY_MS);

    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it('does not retry when the executable is missing', () => {
    service.onApplicationBootstrap();

    processes[0].emit(
      'error',
      Object.assign(new Error('spawn mediamtx ENOENT'), { code: 'ENOENT' }),
    );
    processes[0].emit('close', -4058);
    vi.advanceTimersByTime(MEDIAMTX_RESTART_DELAY_MS * 3);

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(service.isRunning).toBe(false);
  });

  it('kills MediaMTX on shutdown and does not restart it', () => {
    service.onApplicationBootstrap();

    service.onModuleDestroy();
    processes[0].emit('close', null);
    vi.advanceTimersByTime(MEDIAMTX_RESTART_DELAY_MS);

    expect(processes[0].kill).toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledTimes(1);
  });
});
