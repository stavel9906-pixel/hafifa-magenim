import { MantineProvider } from '@mantine/core';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { theme } from '../../src/theme';

function Providers({ children }: { children: ReactNode }) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
}

export function renderWithMantine(ui: ReactElement): RenderResult {
  return render(ui, { wrapper: Providers });
}
