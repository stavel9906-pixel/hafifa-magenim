import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UseDronesResult } from '../hooks/types/use-drones-result';
import { useDrones } from '../hooks/useDrones';
import { renderWithMantine } from '../test/render';
import type { Drone } from '../types/drone';
import { DronesPage } from './DronesPage';

vi.mock('../hooks/useDrones', () => ({ useDrones: vi.fn() }));
vi.mock('../map/components/DroneMap', () => ({
  DroneMap: ({ drones }: { drones: readonly Drone[] }) => (
    <div data-testid="map">{drones.map((d) => d.id).join(',')}</div>
  ),
}));
const useDronesMock = vi.mocked(useDrones);
const reload = vi.fn();

function givenState(state: UseDronesResult['state']) {
  useDronesMock.mockReturnValue({ state, connection: 'connected', reload });
}

const drone = (id: string): Drone => ({
  id,
  latitude: 31.5,
  longitude: 34.9,
  createdAt: '2026-11-08T12:00:00.000Z',
});

describe('DronesPage', () => {
  beforeEach(() => {
    reload.mockReset();
  });

  it('shows the map with a loading overlay while drones load', () => {
    givenState({ status: 'loading', drones: [] });

    renderWithMantine(<DronesPage />);

    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.getByText('Loading drones…')).toBeInTheDocument();
  });

  it('shows the error over the map and retries on click', () => {
    givenState({ status: 'error', drones: [], error: 'Server is down' });

    renderWithMantine(<DronesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Could not load drones')).toBeInTheDocument();
    expect(screen.getByText('Server is down')).toBeInTheDocument();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('shows an empty-state overlay when there are no drones', () => {
    givenState({ status: 'success', drones: [] });

    renderWithMantine(<DronesPage />);

    expect(screen.getByText('No drones yet')).toBeInTheDocument();
    expect(screen.getByText('0 drones')).toBeInTheDocument();
  });

  it('passes the drones to the map, shows the count and no overlay', () => {
    givenState({ status: 'success', drones: [drone('a'), drone('b')] });

    renderWithMantine(<DronesPage />);

    expect(screen.getByTestId('map')).toHaveTextContent('a,b');
    expect(screen.getByText('2 drones')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.queryByText('Loading drones…')).not.toBeInTheDocument();
    expect(screen.queryByText('No drones yet')).not.toBeInTheDocument();
  });
});
