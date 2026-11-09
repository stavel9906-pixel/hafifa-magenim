import { io, type Socket } from 'socket.io-client';
import { env } from '../config/env';

export function createDroneSocket(): Socket {
  return io(env.socketUrl, {
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
}
