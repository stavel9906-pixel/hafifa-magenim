import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeWhepSession, createWhepSession } from '../../src/api/camera.api';
import { useCameraStream } from '../../src/hooks/useCameraStream';

vi.mock('../../src/api/camera.api', () => ({
  createWhepSession: vi.fn(),
  closeWhepSession: vi.fn(),
}));
const createWhepSessionMock = vi.mocked(createWhepSession);
const closeWhepSessionMock = vi.mocked(closeWhepSession);

class FakePeerConnection extends EventTarget {
  static instances: FakePeerConnection[] = [];
  iceGatheringState: RTCIceGatheringState = 'complete';
  connectionState: RTCPeerConnectionState = 'new';
  localDescription: { sdp: string } | null = null;
  ontrack: ((event: { streams: unknown[]; track: unknown }) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  addTransceiver = vi.fn();
  createOffer = vi.fn(() => Promise.resolve({ type: 'offer', sdp: 'offer-sdp' }));
  setLocalDescription = vi.fn((description: { sdp: string }) => {
    this.localDescription = description;
    return Promise.resolve();
  });
  setRemoteDescription = vi.fn(() => Promise.resolve());
  close = vi.fn();

  constructor() {
    super();
    FakePeerConnection.instances.push(this);
  }

  setConnectionState(state: RTCPeerConnectionState) {
    this.connectionState = state;
    this.onconnectionstatechange?.();
  }
}

const lastPc = () => FakePeerConnection.instances.at(-1)!;

describe('useCameraStream', () => {
  beforeEach(() => {
    FakePeerConnection.instances = [];
    vi.stubGlobal('RTCPeerConnection', FakePeerConnection);
    createWhepSessionMock.mockReset();
    closeWhepSessionMock.mockReset().mockResolvedValue();
    createWhepSessionMock.mockResolvedValue({
      answerSdp: 'answer-sdp',
      sessionUrl: 'http://api.test/api/camera/whep/abc',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing while inactive', () => {
    const { result } = renderHook(() => useCameraStream(false, 0));

    expect(result.current.status).toBe('loading');
    expect(FakePeerConnection.instances).toHaveLength(0);
  });

  it('sends a receive-only video offer and applies the answer', async () => {
    renderHook(() => useCameraStream(true, 0));

    await waitFor(() =>
      expect(lastPc().setRemoteDescription).toHaveBeenCalledWith({
        type: 'answer',
        sdp: 'answer-sdp',
      }),
    );
    expect(lastPc().addTransceiver).toHaveBeenCalledWith('video', {
      direction: 'recvonly',
    });
    expect(createWhepSessionMock).toHaveBeenCalledWith(
      'offer-sdp',
      expect.any(AbortSignal),
    );
  });

  it('becomes live with the received stream once connected', async () => {
    const { result } = renderHook(() => useCameraStream(true, 0));
    await waitFor(() => expect(lastPc().setRemoteDescription).toHaveBeenCalled());
    const stream = { id: 'stream' };

    act(() => {
      lastPc().ontrack?.({ streams: [stream], track: {} });
      lastPc().setConnectionState('connected');
    });

    expect(result.current).toEqual({ stream, status: 'live' });
  });

  it('reports an error when the session cannot be created', async () => {
    createWhepSessionMock.mockRejectedValue(new Error('502'));

    const { result } = renderHook(() => useCameraStream(true, 0));

    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('reports an error when the connection fails', async () => {
    const { result } = renderHook(() => useCameraStream(true, 0));
    await waitFor(() => expect(lastPc().setRemoteDescription).toHaveBeenCalled());

    act(() => lastPc().setConnectionState('failed'));

    expect(result.current.status).toBe('error');
  });

  it('closes the connection and the session on unmount', async () => {
    const { unmount } = renderHook(() => useCameraStream(true, 0));
    await waitFor(() => expect(lastPc().setRemoteDescription).toHaveBeenCalled());

    unmount();

    expect(lastPc().close).toHaveBeenCalled();
    expect(closeWhepSessionMock).toHaveBeenCalledWith(
      'http://api.test/api/camera/whep/abc',
    );
  });

  it('starts a new connection with a fresh loading state on a new attempt', async () => {
    const { result, rerender } = renderHook(
      ({ attempt }) => useCameraStream(true, attempt),
      { initialProps: { attempt: 0 } },
    );
    await waitFor(() => expect(lastPc().setRemoteDescription).toHaveBeenCalled());
    act(() => lastPc().setConnectionState('failed'));

    rerender({ attempt: 1 });

    expect(result.current.status).toBe('loading');
    expect(FakePeerConnection.instances).toHaveLength(2);
    expect(FakePeerConnection.instances[0].close).toHaveBeenCalled();
  });
});
