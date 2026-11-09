import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_API_URL: 'http://api.test/api',
      VITE_MAP_STYLE_URL: 'http://tiles.test/style.json',
      VITE_SOCKET_URL: 'http://socket.test',
    },
  },
});
