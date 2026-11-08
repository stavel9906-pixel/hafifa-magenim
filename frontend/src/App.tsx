import { env } from './config/env';

// Temporary shell for Phase 1; replaced by the Mantine layout and map page in Phases 5–6.
export default function App() {
  return (
    <main>
      <h1>Drone Simulation</h1>
      <p>Backend API: {env.apiUrl}</p>
    </main>
  );
}
