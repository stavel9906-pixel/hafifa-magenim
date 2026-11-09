import { AppShell, Group, Title } from '@mantine/core';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  headerRight?: ReactNode;
  children: ReactNode;
}

const HEADER_HEIGHT = 56;

export function AppLayout({ headerRight, children }: AppLayoutProps) {
  return (
    <AppShell header={{ height: HEADER_HEIGHT }}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>Drone Simulation</Title>
          {headerRight}
        </Group>
      </AppShell.Header>
      <AppShell.Main h="100dvh">{children}</AppShell.Main>
    </AppShell>
  );
}
