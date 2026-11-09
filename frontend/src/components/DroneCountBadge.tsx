import { Badge } from '@mantine/core';

interface DroneCountBadgeProps {
  count: number;
}

export function DroneCountBadge({ count }: DroneCountBadgeProps) {
  return (
    <Badge size="lg" variant="light">
      {count} drones
    </Badge>
  );
}
