import { env } from '../config/env';
import type { CameraStatus } from '../types/camera-status';
import type { PtzDirection } from '../types/ptz-direction';
import type { WhepSession } from '../types/whep-session';
import { ApiError } from './api-error';
import { getJson } from './http-client';
import { parseCameraStatus } from './validators/camera-status.validator';

const cameraUrl = `${env.apiUrl}/camera`;

export function fetchCameraStatus(signal?: AbortSignal): Promise<CameraStatus> {
  return getJson('/camera', parseCameraStatus, signal);
}

export async function createWhepSession(
  offerSdp: string,
  signal?: AbortSignal,
): Promise<WhepSession> {
  const response = await fetch(`${cameraUrl}/whep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: offerSdp,
    signal,
  });
  if (response.status !== 201) {
    throw new ApiError(
      `Camera stream unavailable (${response.status})`,
      response.status,
    );
  }
  const location = response.headers.get('Location');
  return {
    answerSdp: await response.text(),
    sessionUrl: location ? new URL(location, `${cameraUrl}/`).href : undefined,
  };
}

export async function closeWhepSession(sessionUrl: string): Promise<void> {
  await fetch(sessionUrl, { method: 'DELETE', keepalive: true });
}

export async function moveCamera(direction: PtzDirection): Promise<void> {
  await sendPtz(`move/${direction}`);
}

export async function stopCamera(): Promise<void> {
  await sendPtz('stop');
}

async function sendPtz(action: string): Promise<void> {
  const response = await fetch(`${cameraUrl}/ptz/${action}`, { method: 'POST' });
  if (!response.ok) {
    throw new ApiError(
      `Camera control failed (${response.status})`,
      response.status,
    );
  }
}
