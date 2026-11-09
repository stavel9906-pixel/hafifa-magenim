import type { CameraFeedStatus } from '../../camera/types/camera-feed-status';

export interface CameraStreamResult {
  stream: MediaStream | null;
  status: CameraFeedStatus;
}
