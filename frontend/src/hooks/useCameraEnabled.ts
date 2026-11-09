import { useEffect, useState } from 'react';
import { fetchCameraStatus } from '../api/camera.api';

export function useCameraEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchCameraStatus(controller.signal)
      .then((status) => setEnabled(status.enabled))
      .catch(() => {
        if (!controller.signal.aborted) setEnabled(false);
      });
    return () => controller.abort();
  }, []);

  return enabled;
}
