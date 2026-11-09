import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CameraStreamResult } from '../../../src/hooks/types/camera-stream-result';
import { useCameraEnabled } from '../../../src/hooks/useCameraEnabled';
import { useCameraStream } from '../../../src/hooks/useCameraStream';
import { renderWithMantine } from '../../support/render';
import { CameraPanel } from '../../../src/camera/components/CameraPanel';

vi.mock('../../../src/hooks/useCameraEnabled', () => ({ useCameraEnabled: vi.fn() }));
vi.mock('../../../src/hooks/useCameraStream', () => ({ useCameraStream: vi.fn() }));
const useCameraEnabledMock = vi.mocked(useCameraEnabled);
const useCameraStreamMock = vi.mocked(useCameraStream);

function givenStream(result: CameraStreamResult) {
  useCameraStreamMock.mockReturnValue(result);
}

describe('CameraPanel', () => {
  beforeEach(() => {
    useCameraEnabledMock.mockReturnValue(true);
    useCameraStreamMock.mockReset();
    givenStream({ stream: null, status: 'loading' });
  });

  it('renders nothing and opens no stream when the camera is disabled', () => {
    useCameraEnabledMock.mockReturnValue(false);

    renderWithMantine(<CameraPanel />);

    expect(screen.queryByText('Camera')).not.toBeInTheDocument();
    expect(useCameraStreamMock).toHaveBeenLastCalledWith(false, 0);
  });

  it('shows a video and no Live badge while connecting', () => {
    renderWithMantine(<CameraPanel />);

    expect(screen.getByLabelText('Live camera feed')).toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Move camera left')).not.toBeInTheDocument();
    expect(useCameraStreamMock).toHaveBeenLastCalledWith(true, 0);
  });

  it('shows the Live badge and the arrows once connected', () => {
    givenStream({ stream: null, status: 'live' });

    renderWithMantine(<CameraPanel />);

    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByLabelText('Move camera left')).toBeInTheDocument();
    expect(screen.getByLabelText('Move camera right')).toBeInTheDocument();
  });

  it('shows an error and reconnects on Try again', () => {
    givenStream({ stream: null, status: 'error' });

    renderWithMantine(<CameraPanel />);
    expect(screen.getByText('Camera unavailable')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(useCameraStreamMock).toHaveBeenLastCalledWith(true, 1);
  });

  it('closes the stream when hidden and reconnects when shown again', () => {
    renderWithMantine(<CameraPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    expect(screen.queryByLabelText('Live camera feed')).not.toBeInTheDocument();
    expect(useCameraStreamMock).toHaveBeenLastCalledWith(false, 0);

    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(useCameraStreamMock).toHaveBeenLastCalledWith(true, 1);
  });
});
