import { useEffect, useState } from 'react';
import { closeWhepSession, createWhepSession } from '../api/camera.api';
import { ICE_GATHERING_TIMEOUT_MS } from '../camera/constants/camera.constants';
import { waitForIceGathering } from '../camera/utils/wait-for-ice-gathering';
import type { CameraStreamResult } from './types/camera-stream-result';

const LOADING: CameraStreamResult = { stream: null, status: 'loading' };

export function useCameraStream(
  active: boolean,
  attempt: number,
): CameraStreamResult {
  const [result, setResult] = useState<
    CameraStreamResult & { attempt: number }
  >({ ...LOADING, attempt });

  useEffect(() => {
    if (!active) return;

    const controller = new AbortController();
    const pc = new RTCPeerConnection();
    let sessionUrl: string | undefined;
    const update = (patch: Partial<CameraStreamResult>) => {
      if (controller.signal.aborted) return;
      setResult((current) =>
        current.attempt === attempt
          ? { ...current, ...patch }
          : { ...LOADING, ...patch, attempt },
      );
    };
    const fail = () => update({ stream: null, status: 'error' });

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.ontrack = (event) => {
      update({ stream: event.streams[0] ?? new MediaStream([event.track]) });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        update({ status: 'live' });
      } else if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'disconnected'
      ) {
        fail();
      }
    };

    const connect = async () => {
      await pc.setLocalDescription(await pc.createOffer());
      await waitForIceGathering(pc, ICE_GATHERING_TIMEOUT_MS);
      const session = await createWhepSession(
        pc.localDescription?.sdp ?? '',
        controller.signal,
      );
      sessionUrl = session.sessionUrl;
      if (controller.signal.aborted) {
        if (sessionUrl) void closeWhepSession(sessionUrl).catch(() => {});
        return;
      }
      await pc.setRemoteDescription({ type: 'answer', sdp: session.answerSdp });
    };
    connect().catch(fail);

    return () => {
      controller.abort();
      pc.close();
      if (sessionUrl) void closeWhepSession(sessionUrl).catch(() => {});
    };
  }, [active, attempt]);

  if (!active || result.attempt !== attempt) {
    return LOADING;
  }
  return { stream: result.stream, status: result.status };
}
