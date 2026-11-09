import type { CameraConfig } from '../types/camera-config.js';

export function buildRtspUrl(config: CameraConfig): string {
  const credentials = config.username
    ? `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@`
    : '';
  const path = config.streamPath.replace(/^\/+/, '');
  return `rtsp://${credentials}${config.host}:${config.rtspPort}/${path}`;
}

export function redactSecrets(text: string, config: CameraConfig): string {
  const secrets = [config.password, encodeURIComponent(config.password)];
  return secrets
    .filter(Boolean)
    .reduce((result, secret) => result.split(secret).join('***'), text);
}
