import { act, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithMantine } from '../../support/render';
import type { Drone } from '../../../src/types/drone';
import { DroneMap } from '../../../src/map/components/DroneMap';
import {
  DRONE_ICON_ID,
  DRONE_LAYER,
  DRONE_SOURCE_ID,
  ISRAEL_BOUNDS,
} from '../../../src/map/constants/map.constants';
import { toDroneFeatureCollection } from '../../../src/map/mappers/drone-feature.mapper';

const fakeMap = vi.hoisted(() => {
  type Handler = (event?: unknown) => void;
  const state = {
    options: undefined as unknown,
    handlers: {} as Record<string, Handler>,
    loaded: false,
    setData: vi.fn(),
    addImage: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    addControl: vi.fn(),
    remove: vi.fn(),
  };
  class FakeMapLibreMap {
    constructor(options: unknown) {
      state.options = options;
    }
    on(event: string, handler: Handler) {
      state.handlers[event] = handler;
    }
    loaded() {
      return state.loaded;
    }
    getSource() {
      return { setData: state.setData };
    }
    addImage = state.addImage;
    addSource = state.addSource;
    addLayer = state.addLayer;
    addControl = state.addControl;
    remove = state.remove;
  }
  return { state, FakeMapLibreMap };
});

vi.mock('maplibre-gl', () => ({
  MapLibreMap: fakeMap.FakeMapLibreMap,
  NavigationControl: class {},
}));

vi.mock('../../../src/map/config/maplibre-worker', () => ({}));

vi.mock('../../../src/map/utils/load-image', () => ({
  loadImage: vi.fn().mockResolvedValue({ width: 64, height: 64 }),
}));

const drone = (id: string, latitude: number, longitude: number): Drone => ({
  id,
  latitude,
  longitude,
  createdAt: '2026-11-08T12:00:00.000Z',
});

async function fireLoad() {
  await act(async () => {
    fakeMap.state.handlers.load?.();
  });
}

describe('DroneMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakeMap.state.handlers = {};
    fakeMap.state.loaded = false;
  });

  it('opens on Israel with the configured style', () => {
    renderWithMantine(<DroneMap drones={[]} />);

    expect(fakeMap.state.options).toMatchObject({
      style: 'http://tiles.test/style.json',
      bounds: ISRAEL_BOUNDS,
      container: screen.getByTestId('drone-map'),
    });
  });

  it('adds the drone icon, source and layer once the map has loaded', async () => {
    const drones = [drone('a', 32.08, 34.78)];
    renderWithMantine(<DroneMap drones={drones} />);

    await fireLoad();

    expect(fakeMap.state.addImage).toHaveBeenCalledWith(
      DRONE_ICON_ID,
      expect.anything(),
      { pixelRatio: 2 },
    );
    expect(fakeMap.state.addSource).toHaveBeenCalledWith(DRONE_SOURCE_ID, {
      type: 'geojson',
      data: toDroneFeatureCollection(drones),
    });
    expect(fakeMap.state.addLayer).toHaveBeenCalledWith(DRONE_LAYER);
  });

  it('uses drones that arrived before the map finished loading', async () => {
    const { rerender } = renderWithMantine(<DroneMap drones={[]} />);
    const later = [drone('a', 31, 35)];
    rerender(<DroneMap drones={later} />);

    await fireLoad();

    expect(fakeMap.state.addSource).toHaveBeenCalledWith(
      DRONE_SOURCE_ID,
      expect.objectContaining({ data: toDroneFeatureCollection(later) }),
    );
  });

  it('updates the existing source when drones change, without a new map', async () => {
    const { rerender } = renderWithMantine(
      <DroneMap drones={[drone('a', 31, 35)]} />,
    );
    await fireLoad();
    const updated = [drone('a', 31, 35), drone('b', 30, 34.8)];

    rerender(<DroneMap drones={updated} />);

    await waitFor(() =>
      expect(fakeMap.state.setData).toHaveBeenLastCalledWith(
        toDroneFeatureCollection(updated),
      ),
    );
    expect(fakeMap.state.addSource).toHaveBeenCalledTimes(1);
  });

  it('removes the map on unmount', () => {
    const { unmount } = renderWithMantine(<DroneMap drones={[]} />);

    unmount();

    expect(fakeMap.state.remove).toHaveBeenCalledTimes(1);
  });

  it('shows an error if the map style fails to load', async () => {
    renderWithMantine(<DroneMap drones={[]} />);

    await act(async () => {
      fakeMap.state.handlers.error?.({ error: new Error('style 404') });
    });

    expect(
      screen.getByText('The map could not be loaded: style 404'),
    ).toBeInTheDocument();
  });

  it('ignores tile errors after the map has loaded', async () => {
    renderWithMantine(<DroneMap drones={[]} />);
    fakeMap.state.loaded = true;

    await act(async () => {
      fakeMap.state.handlers.error?.({ error: new Error('tile timeout') });
    });

    expect(screen.queryByText(/tile timeout/)).not.toBeInTheDocument();
  });
});
