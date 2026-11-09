import 'maplibre-gl/dist/maplibre-gl.css';
import '../config/maplibre-worker';
import { Alert, Box } from '@mantine/core';
import {
  MapLibreMap,
  NavigationControl,
  type GeoJSONSource,
} from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { env } from '../../config/env';
import type { Drone } from '../../types/drone';
import droneIconUrl from '../assets/drone-icon.svg';
import {
  DRONE_ICON_ID,
  DRONE_ICON_SIZE_PX,
  DRONE_LAYER,
  DRONE_SOURCE_ID,
  ISRAEL_BOUNDS,
} from '../constants/map.constants';
import { toDroneFeatureCollection } from '../mappers/drone-feature.mapper';
import { loadImage } from '../utils/load-image';

interface DroneMapProps {
  drones: readonly Drone[];
}

export function DroneMap({ drones }: DroneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const dronesRef = useRef(drones);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const map = new MapLibreMap({
      container: containerRef.current,
      style: env.mapStyleUrl,
      bounds: ISRAEL_BOUNDS,
      fitBoundsOptions: { padding: 24 },
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      loadImage(droneIconUrl, DRONE_ICON_SIZE_PX)
        .then((icon) => {
          if (mapRef.current !== map) {
            return;
          }
          map.addImage(DRONE_ICON_ID, icon, { pixelRatio: 2 });
          map.addSource(DRONE_SOURCE_ID, {
            type: 'geojson',
            data: toDroneFeatureCollection(dronesRef.current),
          });
          map.addLayer(DRONE_LAYER);
          setReady(true);
        })
        .catch((error: unknown) =>
          setMapError(error instanceof Error ? error.message : String(error)),
        );
    });

    map.on('error', ({ error }) => {
      if (!map.loaded()) {
        setMapError(`The map could not be loaded: ${error.message}`);
      }
    });

    return () => {
      mapRef.current = null;
      setReady(false);
      map.remove();
    };
  }, []);

  useEffect(() => {
    dronesRef.current = drones;
    if (!ready) {
      return;
    }
    mapRef.current
      ?.getSource<GeoJSONSource>(DRONE_SOURCE_ID)
      ?.setData(toDroneFeatureCollection(drones));
  }, [drones, ready]);

  return (
    <Box pos="relative" h="100%">
      <Box ref={containerRef} h="100%" data-testid="drone-map" />
      {mapError && (
        <Alert
          color="red"
          title="Map error"
          pos="absolute"
          bottom={16}
          left={16}
          maw={420}
        >
          {mapError}
        </Alert>
      )}
    </Box>
  );
}
