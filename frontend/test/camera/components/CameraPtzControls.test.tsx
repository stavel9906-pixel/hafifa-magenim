import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCameraPtz } from '../../../src/hooks/useCameraPtz';
import { renderWithMantine } from '../../support/render';
import { CameraPtzControls } from '../../../src/camera/components/CameraPtzControls';

vi.mock('../../../src/hooks/useCameraPtz', () => ({ useCameraPtz: vi.fn() }));
const start = vi.fn();
const stop = vi.fn();

describe('CameraPtzControls', () => {
  beforeEach(() => {
    start.mockReset();
    stop.mockReset();
    vi.mocked(useCameraPtz).mockReturnValue({ start, stop });
  });

  it.each([
    ['Move camera left', 'left'],
    ['Move camera right', 'right'],
  ])('"%s" moves %s while pressed and stops on release', (label, direction) => {
    renderWithMantine(<CameraPtzControls />);
    const button = screen.getByRole('button', { name: label });

    fireEvent.pointerDown(button);
    expect(start).toHaveBeenCalledWith(direction);

    fireEvent.pointerUp(button);
    expect(stop).toHaveBeenCalled();
  });

  it('works with the keyboard', () => {
    renderWithMantine(<CameraPtzControls />);
    const button = screen.getByRole('button', { name: 'Move camera right' });

    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: 'Enter', repeat: true });
    fireEvent.keyUp(button, { key: 'Enter' });

    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('stops when the pointer is cancelled', () => {
    renderWithMantine(<CameraPtzControls />);
    const button = screen.getByRole('button', { name: 'Move camera left' });

    fireEvent.pointerDown(button);
    fireEvent.pointerCancel(button);

    expect(stop).toHaveBeenCalled();
  });
});
