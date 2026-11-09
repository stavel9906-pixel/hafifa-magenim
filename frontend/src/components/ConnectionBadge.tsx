import { Badge } from '@mantine/core';
import type { ConnectionStatus } from '../realtime/types/connection-status';

const APPEARANCE: Record<ConnectionStatus, { color: string; label: string }> = {
  connecting: { color: 'gray', label: 'Connecting…' },
  connected: { color: 'green', label: 'Live' },
  reconnecting: { color: 'yellow', label: 'Reconnecting…' },
};

interface ConnectionBadgeProps {
  status: ConnectionStatus;
}

export function ConnectionBadge({ status }: ConnectionBadgeProps) {
  const { color, label } = APPEARANCE[status];
  return (
    <Badge size="lg" variant="dot" color={color}>
      {label}
    </Badge>
  );
}
