import { useEffect, useRef, useState } from 'react';
import { isDrone } from '../api/validators/drone.validator';
import { DRONE_CREATED_EVENT } from '../realtime/drone-events';
import { createDroneSocket } from '../realtime/drone-socket';
import type { ConnectionStatus } from '../realtime/types/connection-status';
import type { DroneSocketHandlers } from './types/drone-socket-handlers';

export function useDroneSocket(handlers: DroneSocketHandlers): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const socket = createDroneSocket();

    socket.on('connect', () => {
      setStatus('connected');
      handlersRef.current.onConnect();
    });

    socket.on('disconnect', (reason) => {
      setStatus('reconnecting');
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', () => {
      setStatus('reconnecting');
      handlersRef.current.onConnectError();
    });

    socket.on(DRONE_CREATED_EVENT, (payload: unknown) => {
      if (isDrone(payload)) {
        handlersRef.current.onDrone(payload);
      } else {
        console.warn('Ignoring malformed drone event', payload);
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  return status;
}
