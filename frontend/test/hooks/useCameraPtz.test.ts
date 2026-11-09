import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { moveCamera, stopCamera } from '../../src/api/camera.api';
import { PTZ_KEEPALIVE_MS } from '../../src/camera/constants/camera.constants';
import { useCameraPtz } from '../../src/hooks/useCameraPtz';

vi.mock('../../src/api/camera.api', () => ({
  moveCamera: vi.fn(),
  stopCamera: vi.fn(),
}));
const moveCameraMock = vi.mocked(moveCamera);
const stopCameraMock = vi.mocked(stopCamera);

describe('useCameraPtz', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    moveCameraMock.mockReset().mockResolvedValue();
    stopCameraMock.mockReset().mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('moves right away and repeats the move while held', () => {
    const { result } = renderHook(() => useCameraPtz());

    act(() => result.current.start('left'));
    expect(moveCameraMock).toHaveBeenCalledWith('left');

    act(() => vi.advanceTimersByTime(PTZ_KEEPALIVE_MS * 2));
    expect(moveCameraMock).toHaveBeenCalledTimes(3);
  });

  it('stops once and stops repeating on release', () => {
    const { result } = renderHook(() => useCameraPtz());
    act(() => result.current.start('right'));

    act(() => {
      result.current.stop();
      result.current.stop();
    });
    act(() => vi.advanceTimersByTime(PTZ_KEEPALIVE_MS * 3));

    expect(stopCameraMock).toHaveBeenCalledTimes(1);
    expect(moveCameraMock).toHaveBeenCalledTimes(1);
  });

  it('does not send stop when nothing is moving', () => {
    const { result } = renderHook(() => useCameraPtz());

    act(() => result.current.stop());

    expect(stopCameraMock).not.toHaveBeenCalled();
  });

  it('stops the camera when unmounted mid-move', () => {
    const { result, unmount } = renderHook(() => useCameraPtz());
    act(() => result.current.start('left'));

    unmount();

    expect(stopCameraMock).toHaveBeenCalledTimes(1);
  });

  it('ignores failed requests', async () => {
    moveCameraMock.mockRejectedValue(new Error('502'));
    const { result } = renderHook(() => useCameraPtz());

    act(() => result.current.start('left'));
    await act(() => Promise.resolve());

    expect(moveCameraMock).toHaveBeenCalled();
  });
});
