import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchDrones } from '../api/drones.api';
import { DRONE_CREATED_EVENT } from '../realtime/drone-events';
import { createDroneSocket } from '../realtime/drone-socket';
import { FakeSocket } from '../test/fake-socket';
import type { Drone } from '../types/drone';
import { useDrones } from './useDrones';

vi.mock('../api/drones.api', () => ({ fetchDrones: vi.fn() }));
vi.mock('../realtime/drone-socket', () => ({ createDroneSocket: vi.fn() }));
const fetchDronesMock = vi.mocked(fetchDrones);

const drone = (id: string): Drone => ({
  id,
  latitude: 31.5,
  longitude: 34.9,
  createdAt: '2026-11-08T12:00:00.000Z',
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const ids = (drones: Drone[]) => drones.map((d) => d.id).sort();

describe('useDrones', () => {
  let socket: FakeSocket;

  beforeEach(() => {
    fetchDronesMock.mockReset();
    socket = new FakeSocket();
    vi.mocked(createDroneSocket).mockReturnValue(
      socket as unknown as ReturnType<typeof createDroneSocket>,
    );
  });

  it('loads history over REST once the socket is connected', async () => {
    fetchDronesMock.mockResolvedValue([drone('a'), drone('b')]);
    const { result } = renderHook(() => useDrones());

    expect(result.current.state.status).toBe('loading');
    expect(fetchDronesMock).not.toHaveBeenCalled();

    act(() => socket.emit('connect'));

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(ids(result.current.state.drones)).toEqual(['a', 'b']);
    expect(result.current.connection).toBe('connected');
  });

  it('keeps a drone that arrives by socket while history is loading, without duplicating it', async () => {
    const history = deferred<Drone[]>();
    fetchDronesMock.mockReturnValue(history.promise);
    const { result } = renderHook(() => useDrones());

    act(() => socket.emit('connect'));
    act(() => socket.emit(DRONE_CREATED_EVENT, drone('race')));
    await act(async () => history.resolve([drone('old'), drone('race')]));

    expect(ids(result.current.state.drones)).toEqual(['old', 'race']);
  });

  it('adds new drones from the socket and ignores duplicate events', async () => {
    fetchDronesMock.mockResolvedValue([drone('a')]);
    const { result } = renderHook(() => useDrones());
    act(() => socket.emit('connect'));
    await waitFor(() => expect(result.current.state.status).toBe('success'));

    act(() => {
      socket.emit(DRONE_CREATED_EVENT, drone('b'));
      socket.emit(DRONE_CREATED_EVENT, drone('b'));
      socket.emit(DRONE_CREATED_EVENT, drone('a'));
    });

    expect(ids(result.current.state.drones)).toEqual(['a', 'b']);
  });

  it('reloads history after a reconnect to recover drones missed while offline', async () => {
    fetchDronesMock.mockResolvedValueOnce([drone('a')]);
    const { result } = renderHook(() => useDrones());
    act(() => socket.emit('connect'));
    await waitFor(() => expect(result.current.state.status).toBe('success'));

    act(() => socket.emit('disconnect', 'transport close'));
    expect(result.current.connection).toBe('reconnecting');

    fetchDronesMock.mockResolvedValueOnce([
      drone('a'),
      drone('missed-1'),
      drone('missed-2'),
    ]);
    act(() => socket.emit('connect'));

    expect(result.current.state.status).toBe('success');
    await waitFor(() =>
      expect(ids(result.current.state.drones)).toEqual([
        'a',
        'missed-1',
        'missed-2',
      ]),
    );
    expect(fetchDronesMock).toHaveBeenCalledTimes(2);
  });

  it('still loads history over REST if the socket cannot connect', async () => {
    fetchDronesMock.mockResolvedValue([drone('a')]);
    const { result } = renderHook(() => useDrones());

    act(() => {
      socket.emit('connect_error', new Error('refused'));
      socket.emit('connect_error', new Error('refused'));
    });

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(fetchDronesMock).toHaveBeenCalledTimes(1);
    expect(result.current.connection).toBe('reconnecting');
  });

  it('shows the load error and reload() tries again', async () => {
    fetchDronesMock
      .mockRejectedValueOnce(new Error('Server responded with 500'))
      .mockResolvedValueOnce([drone('a')]);
    const { result } = renderHook(() => useDrones());
    act(() => socket.emit('connect'));
    await waitFor(() =>
      expect(result.current.state).toMatchObject({
        status: 'error',
        error: 'Server responded with 500',
      }),
    );

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(ids(result.current.state.drones)).toEqual(['a']);
  });

  it('cancels a superseded load so its result is ignored', async () => {
    const first = deferred<Drone[]>();
    const signals: (AbortSignal | undefined)[] = [];
    fetchDronesMock
      .mockImplementationOnce((signal) => {
        signals.push(signal);
        return first.promise;
      })
      .mockResolvedValueOnce([drone('fresh')]);
    const { result } = renderHook(() => useDrones());

    act(() => socket.emit('connect'));
    act(() => socket.emit('connect'));

    expect(signals[0]?.aborted).toBe(true);
    await waitFor(() =>
      expect(ids(result.current.state.drones)).toEqual(['fresh']),
    );
  });

  it('aborts the in-flight load and closes the socket on unmount', () => {
    const signals: (AbortSignal | undefined)[] = [];
    fetchDronesMock.mockImplementation((signal) => {
      signals.push(signal);
      return new Promise(() => undefined);
    });
    const { unmount } = renderHook(() => useDrones());
    act(() => socket.emit('connect'));

    unmount();

    expect(signals[0]?.aborted).toBe(true);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });
});
