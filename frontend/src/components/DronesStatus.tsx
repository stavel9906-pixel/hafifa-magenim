import { EmptyState } from '@mantine/core';
import type { DronesState } from '../hooks/types/drones-state';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import { MapOverlay } from './MapOverlay';

interface DronesStatusProps {
  state: DronesState;
  onRetry: () => void;
}

export function DronesStatus({ state, onRetry }: DronesStatusProps) {
  switch (state.status) {
    case 'loading':
      return (
        <MapOverlay>
          <LoadingState message="Loading drones…" />
        </MapOverlay>
      );
    case 'error':
      return (
        <MapOverlay>
          <ErrorState
            title="Could not load drones"
            message={state.error}
            onRetry={onRetry}
          />
        </MapOverlay>
      );
    case 'success':
      return state.drones.length === 0 ? (
        <MapOverlay>
          <EmptyState
            size="sm"
            title="No drones yet"
            description="New drones appear every few seconds while the backend simulation is running."
          />
        </MapOverlay>
      ) : null;
  }
}
