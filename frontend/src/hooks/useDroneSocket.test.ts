import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DRONE_CREATED_EVENT } from '../realtime/drone-events';
import { createDroneSocket } from '../realtime/drone-socket';
import { FakeSocket } from '../test/fake-socket';
import type { DroneSocketHandlers } from './types/drone-socket-handlers';
import { useDroneSocket } from './useDroneSocket';

vi.mock('../realtime/drone-socket', () => ({ createDroneSocket: vi.fn() }));

const drone = {
  id: 'd1',
  latitude: 31.5,
  longitude: 34.9,
  createdAt: '2026-11-08T12:00:00.000Z',
};

describe('useDroneSocket', () => {
  let socket: FakeSocket;
  let handlers: DroneSocketHandlers;

  beforeEach(() => {
    socket = new FakeSocket();
    vi.mocked(createDroneSocket).mockReturnValue(
      socket as unknown as ReturnType<typeof createDroneSocket>,
    );
    handlers = {
      onConnect: vi.fn(),
      onConnectError: vi.fn(),
      onDrone: vi.fn(),
    };
  });

  it('reports connecting, then connected, and notifies onConnect', () => {
    const { result } = renderHook(() => useDroneSocket(handlers));
    expect(result.current).toBe('connecting');

    act(() => socket.emit('connect'));

    expect(result.current).toBe('connected');
    expect(handlers.onConnect).toHaveBeenCalledTimes(1);
  });

  it('reports reconnecting after an unexpected disconnect', () => {
    const { result } = renderHook(() => useDroneSocket(handlers));
    act(() => socket.emit('connect'));

    act(() => socket.emit('disconnect', 'transport close'));

    expect(result.current).toBe('reconnecting');
    expect(socket.connect).not.toHaveBeenCalled();
  });

  it('reconnects manually when the server closed the connection', () => {
    renderHook(() => useDroneSocket(handlers));

    act(() => socket.emit('disconnect', 'io server disconnect'));

    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('notifies onConnectError when the connection fails', () => {
    const { result } = renderHook(() => useDroneSocket(handlers));

    act(() => socket.emit('connect_error', new Error('refused')));

    expect(result.current).toBe('reconnecting');
    expect(handlers.onConnectError).toHaveBeenCalledTimes(1);
  });

  it('passes valid drones to onDrone and ignores malformed payloads', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderHook(() => useDroneSocket(handlers));

    act(() => {
      socket.emit(DRONE_CREATED_EVENT, drone);
      socket.emit(DRONE_CREATED_EVENT, { id: 42 });
    });

    expect(handlers.onDrone).toHaveBeenCalledTimes(1);
    expect(handlers.onDrone).toHaveBeenCalledWith(drone);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('uses the latest handlers without reconnecting', () => {
    const { rerender } = renderHook((h) => useDroneSocket(h), {
      initialProps: handlers,
    });
    const newer = { ...handlers, onDrone: vi.fn() };

    rerender(newer);
    act(() => socket.emit(DRONE_CREATED_EVENT, drone));

    expect(newer.onDrone).toHaveBeenCalledWith(drone);
    expect(handlers.onDrone).not.toHaveBeenCalled();
    expect(createDroneSocket).toHaveBeenCalledTimes(1);
  });

  it('removes its listeners and disconnects on unmount', () => {
    const { unmount } = renderHook(() => useDroneSocket(handlers));

    unmount();

    expect(socket.removeAllListeners).toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(socket.listenerCount()).toBe(0);
  });
});
