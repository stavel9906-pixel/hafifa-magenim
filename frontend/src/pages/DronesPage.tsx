import { Box, Group } from '@mantine/core';
import { AppLayout } from '../components/AppLayout';
import { ConnectionBadge } from '../components/ConnectionBadge';
import { DroneCountBadge } from '../components/DroneCountBadge';
import { DronesStatus } from '../components/DronesStatus';
import { useDrones } from '../hooks/useDrones';
import { DroneMap } from '../map/components/DroneMap';

export function DronesPage() {
  const { state, connection, reload } = useDrones();

  return (
    <AppLayout
      headerRight={
        <Group gap="xs">
          <ConnectionBadge status={connection} />
          {state.status === 'success' && (
            <DroneCountBadge count={state.drones.length} />
          )}
        </Group>
      }
    >
      <Box pos="relative" h="100%">
        <DroneMap drones={state.drones} />
        <DronesStatus state={state} onRetry={reload} />
      </Box>
    </AppLayout>
  );
}
