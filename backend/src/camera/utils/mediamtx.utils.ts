import { MEDIAMTX_PATH_NAME } from '../constants/camera.constants.js';
import type { CameraConfig } from '../types/camera-config.js';
import { buildRtspUrl } from './rtsp.utils.js';

export function buildMediaMtxEnv(config: CameraConfig): NodeJS.ProcessEnv {
  const path = MEDIAMTX_PATH_NAME.toUpperCase();
  return {
    MTX_WEBRTCADDRESS: `127.0.0.1:${config.webrtcPort}`,
    [`MTX_PATHS_${path}_SOURCE`]: buildRtspUrl(config),
  };
}

export function whepUrl(config: CameraConfig, sessionId?: string): string {
  const base = `http://127.0.0.1:${config.webrtcPort}/${MEDIAMTX_PATH_NAME}/whep`;
  return sessionId ? `${base}/${encodeURIComponent(sessionId)}` : base;
}

export function sessionIdFromLocation(
  location: string | null,
): string | undefined {
  if (!location) return undefined;
  const id = location.split('?')[0].split('/').filter(Boolean).at(-1);
  return id && id !== 'whep' ? decodeURIComponent(id) : undefined;
}
