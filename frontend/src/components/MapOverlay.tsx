import { Paper } from '@mantine/core';
import type { ReactNode } from 'react';

interface MapOverlayProps {
  children: ReactNode;
}

export function MapOverlay({ children }: MapOverlayProps) {
  return (
    <Paper
      shadow="md"
      p="md"
      pos="absolute"
      top={16}
      left={16}
      maw="min(420px, calc(100% - 32px))"
      style={{ zIndex: 1 }}
    >
      {children}
    </Paper>
  );
}
