import type { CameraStatus } from '../../types/camera-status';
import { ApiError } from '../api-error';

export function parseCameraStatus(body: unknown): CameraStatus {
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).enabled !== 'boolean'
  ) {
    throw new ApiError('Server returned camera status in an unexpected format');
  }
  return { enabled: (body as CameraStatus).enabled };
}
