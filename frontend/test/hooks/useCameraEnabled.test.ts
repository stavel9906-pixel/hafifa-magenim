import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { fetchCameraStatus } from '../../src/api/camera.api';
import { useCameraEnabled } from '../../src/hooks/useCameraEnabled';

vi.mock('../../src/api/camera.api', () => ({ fetchCameraStatus: vi.fn() }));
const fetchCameraStatusMock = vi.mocked(fetchCameraStatus);

describe('useCameraEnabled', () => {
  it('is false until the backend says the camera is enabled', async () => {
    fetchCameraStatusMock.mockResolvedValue({ enabled: true });

    const { result } = renderHook(() => useCameraEnabled());

    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('stays false when the status request fails', async () => {
    fetchCameraStatusMock.mockRejectedValue(new Error('down'));

    const { result } = renderHook(() => useCameraEnabled());

    await waitFor(() => expect(fetchCameraStatusMock).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });
});
