import { Alert, Button, Stack, Text } from '@mantine/core';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <Alert color="red" title={title} variant="light">
      <Stack gap="sm" align="flex-start">
        <Text size="sm">{message}</Text>
        <Button color="red" variant="outline" size="xs" onClick={onRetry}>
          Try again
        </Button>
      </Stack>
    </Alert>
  );
}
