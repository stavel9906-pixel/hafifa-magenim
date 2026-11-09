import { Group, Loader, Text } from '@mantine/core';

interface LoadingStateProps {
  message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <Group gap="sm">
      <Loader size="sm" />
      <Text size="sm">{message}</Text>
    </Group>
  );
}
