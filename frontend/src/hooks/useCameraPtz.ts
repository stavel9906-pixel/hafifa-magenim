import { useCallback, useEffect, useRef } from 'react';
import { moveCamera, stopCamera } from '../api/camera.api';
import { PTZ_KEEPALIVE_MS } from '../camera/constants/camera.constants';
import type { PtzDirection } from '../types/ptz-direction';

const ignore = () => {};

export function useCameraPtz() {
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const moving = useRef(false);

  const stop = useCallback(() => {
    if (!moving.current) return;
    moving.current = false;
    clearInterval(timer.current);
    stopCamera().catch(ignore);
  }, []);

  const start = useCallback(
    (direction: PtzDirection) => {
      stop();
      moving.current = true;
      moveCamera(direction).catch(ignore);
      timer.current = setInterval(
        () => moveCamera(direction).catch(ignore),
        PTZ_KEEPALIVE_MS,
      );
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return { start, stop };
}
