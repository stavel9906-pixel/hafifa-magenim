# Drone Simulation — Progress

Status legend:
- `[x]` done and verified · `[~]` implemented, not yet tested · `[ ]` pending · `[!]` blocked

**Overall completion: ~12%** (Phase 0 complete; Phase 1 in progress)

---

## Phase 0 — Inspection and Planning ✅

### Environment inspection (2026-11-08)

| Tool | Found | Notes |
|---|---|---|
| Node.js | v22.17.1 | LTS, OK for NestJS 11 / Vite 6 / React 19 |
| npm | 10.8.2 | OK |
| pnpm | 10.33.0 | Available, not needed — npm is used |
| Git | 2.50.1 | Repo on `main`, 1 commit (`.gitignore`), no remote |
| Docker | 28.5.2 | Installed, **daemon not running** |
| PostgreSQL | 17.11 (installed during Phase 0) | Windows service `postgresql-x64-17`, port 5432 |

Existing files: only `.gitignore`. No conflicts.

### Open decisions

1. **[x] How to run PostgreSQL** — resolved.
   - pgAdmin 4 is installed with two saved servers (checked 2026-11-08):
     - `localhost:5434` (user `postgres`) — **not reachable**. No PostgreSQL server exists on this
       machine: no Windows service, no `pg_ctl.exe` on disk, no WSL distribution.
     - `devDb` at `51.84.169.201:5434` — **not reachable** from this machine (VPN/firewall?).
       A shared remote server.
   - Docker is ruled out (user decision).
   - **Decision (user):** install PostgreSQL 17 natively on Windows
     (`winget install --id PostgreSQL.PostgreSQL.17 --interactive`, port 5432). The user runs the
     installer and chooses the `postgres` password; it lives only in the local `backend/.env`.
     The project uses its own `drone_simulation` database.
   - **Status: [x] installed and verified (2026-11-08)** — service `postgresql-x64-17` running
     (automatic start), `psql (PostgreSQL) 17.11`, `pg_isready`: `localhost:5432 - accepting
     connections`. Binaries in `C:\Program Files\PostgreSQL\17\bin` (not on `PATH`).
     The `drone_simulation` database is created in Phase 1.
2. **Generation area** — default: a simplified land polygon of Israel
   (Mediterranean, Dead Sea, Sea of Galilee and Gulf of Eilat excluded). Can be swapped for a
   different polygon by replacing one GeoJSON file.

### Key technical decisions

**WebSocket: Socket.IO (recommended) vs native WebSocket**

| | Native `ws` | Socket.IO |
|---|---|---|
| NestJS integration | `@nestjs/platform-ws`, works but fewer conveniences | `@nestjs/platform-socket.io` is Nest's default gateway adapter |
| Reconnection | Write it yourself (backoff, timers) | Built in, with backoff |
| Heartbeat / dead connection detection | Write ping/pong yourself | Built in |
| Named events | Hand-rolled message envelope | `emit('drone:created', drone)` |
| Overhead | Minimal | Small extra protocol + ~45 KB client lib |
| Interop with raw WS clients | Yes | No — needs a Socket.IO client |

**Decision: Socket.IO.** The requirements (reconnection, unexpected disconnects, broadcast to all
clients) are exactly what Socket.IO gives for free; with `ws` we would re-implement them by hand.
The cost — a client library and no raw-WS interop — doesn't matter here because we own both ends.

**Initial load vs. real-time race condition**

Frontend state is a `Map<id, Drone>`. Merging into it by `id` is idempotent and order-independent,
so REST results and socket events can arrive in any order without duplicates.

1. Open the socket and start listening for `drone:created` **first**; merge each event into the map.
2. Once connected, `GET /api/drones` and merge the result into the map.
3. A drone created between steps 1 and 2 arrives through the socket, the REST call, or both:
   never lost, never duplicated.
4. On **reconnect**, refetch `GET /api/drones` and merge again, to fill any gap while offline.

**Drone generation loop**
- A dedicated `DroneGeneratorService` (pure: produces coordinates, knows nothing about DB/socket)
  and a `DroneSimulationService` that runs the loop: generate → save → broadcast.
- Self-scheduling `setTimeout` chain (next tick scheduled only after the previous save finishes), so
  ticks never overlap. A `running` guard prevents a second loop; stopped in `onModuleDestroy`.
  No `@nestjs/schedule` dependency needed.
- Broadcast happens **only after** the save succeeds. A failed save is logged and the loop continues.
- Coordinates: rejection sampling — random point in the polygon's bounding box, kept only if it's
  inside the polygon (small ray-casting function, unit tested; no geo library needed).

**Database**
- `drones` table: `id uuid PK`, `latitude double precision`, `longitude double precision`,
  `created_at timestamptz default now()`.
- `CHECK` constraints on lat ∈ [-90, 90], lng ∈ [-180, 180].
- Index on `created_at` (used for `ORDER BY` when loading history).
- `synchronize: false`; schema created only through TypeORM migrations.

**Map rendering**
- `maplibre-gl` used directly (no React wrapper library).
- Drones drawn as a **GeoJSON source + symbol layer** with a drone icon, not one DOM `Marker` per
  drone: at one drone per 5 s that's ~17,000 per day, which DOM markers can't handle smoothly.
- Base map style URL from env (default: OpenFreeMap, free and keyless).
- Coordinates are `[longitude, latitude]` in GeoJSON — handled in a single mapping function.

**Config & secrets:** `@nestjs/config` with validated env vars; `.env.example` in each app.

### Proposed structure

```
hafifa-magenim/
  docker-compose.yml          # PostgreSQL (if option 1 is chosen)
  README.md
  PROGRESS.md
  backend/                    # NestJS
    src/
      main.ts
      app.module.ts
      config/                 # env validation, typeorm data source
      database/migrations/
      drones/
        drone.entity.ts
        dto/drone-response.dto.ts
        drones.controller.ts  # GET /api/drones
        drones.service.ts     # persistence (TypeORM repository)
        drones.gateway.ts     # Socket.IO broadcast + connection handling
        drones.module.ts
      simulation/
        israel-land.geojson
        point-in-polygon.ts
        drone-generator.service.ts
        drone-simulation.service.ts
        simulation.module.ts
    test/                     # e2e tests
  frontend/                   # Vite + React + TypeScript + Mantine
    src/
      main.tsx, App.tsx
      api/drones.api.ts
      realtime/socket.ts
      hooks/useDrones.ts      # load + subscribe + dedupe
      map/DroneMap.tsx, droneLayer.ts, drone-icon.svg
      components/             # StatusBanner, DroneCounter, ...
      pages/MapPage.tsx
      types/drone.ts
```

No root `package.json` / workspace tooling: the two apps are independent and the extra tooling
isn't worth it for this size.

### Git workflow
- `main` = stable, phase-approved work. Work happens on `develop`, merged into `main` after each
  approved phase. Commits at each milestone. No remote yet; see README for `git remote add`.

---

## Implementation checklist

### Phase 1 — Project Setup (in progress)
- [x] Create `develop` branch
- [x] PostgreSQL running (native install, verified in Phase 0)
- [x] Scaffold NestJS 12 backend (ESM, strict TS, oxlint, Prettier, Vitest) — typecheck/lint/build pass
- [x] Scaffold Vite 8 + React 19 frontend (strict TS, oxlint) — typecheck/lint/build pass,
      dev server renders in the browser with no console errors
- [x] Env validation: backend Zod schema via `@nestjs/config` (6 unit tests),
      frontend validated `VITE_API_URL`; `.env.example` in both apps
- [~] TypeORM connection to PostgreSQL + `GET /api/health` (unit tested with a mocked
      DataSource; not yet run against the real database)
- [~] `npm run db:create` script — written, not yet run
- [!] Create `drone_simulation` database — **blocked: needs `DB_PASSWORD` in `backend/.env`**
- [ ] Verify backend starts and the DB connects (`/api/health`, e2e test)

Phase 1 notes:
- **npm 10.8.2 bug:** `npm install` crashes (`Cannot read properties of null (reading 'edgesOut')`)
  while resolving Vite 8 peer deps. Lockfiles were generated with `npx npm@11 install`;
  plain `npm ci` with npm 10 works from them. Recommended: upgrade to npm 11 (`npm i -g npm@11`).
- **Node version:** Nest CLI tooling (`@angular-devkit/*`) requires Node ≥ 22.22.3; installed
  is 22.17.1. Only an engine warning so far; upgrading Node 22 LTS is recommended.
- NestJS CLI now generates ESM + Vitest + oxlint (not CommonJS + Jest + ESLint);
  kept the modern defaults. `@nestjs/mau` (paid cloud deploy) and generated `AGENTS.md` removed.
- Added `tsx` (dev) to run TypeScript scripts in ESM; Phase 2's migration CLI uses it too.
- Root `.gitattributes` (`eol=lf`) to stop CRLF/LF churn on Windows.

### Phase 2 — Backend Architecture and Database
- [ ] `Drone` entity with constraints and index
- [ ] TypeORM data source + migration scripts; initial migration
- [ ] `DronesService` (repository access)
- [ ] `GET /api/drones` + response DTO
- [ ] Unit tests; verify persistence

### Phase 3 — Drone Generation
- [ ] Israel land polygon + point-in-polygon (unit tested)
- [ ] `DroneGeneratorService`
- [ ] `DroneSimulationService` loop (no overlap, single-start guard, graceful stop)
- [ ] Verify a drone every ~5 s, persisted, survives restart

### Phase 4 — WebSocket
- [ ] Socket.IO gateway, CORS from env
- [ ] Broadcast `drone:created` after successful save
- [ ] Connection/disconnection logging, error handling
- [ ] Test with a Socket.IO client script / e2e test

### Phase 5 — Frontend and Mantine
- [ ] Mantine provider, theme, app layout
- [ ] Typed API client for `GET /api/drones`
- [ ] Loading / empty / error states

### Phase 6 — MapLibre
- [ ] Map centered on Israel at a suitable zoom
- [ ] Drone icon, GeoJSON source + symbol layer
- [ ] Render loaded drones; verify positions and lng/lat order

### Phase 7 — Real-Time Integration
- [ ] Socket client with reconnection; listener cleanup
- [ ] `useDrones`: Map-based dedupe, refetch on reconnect
- [ ] Connection status indicator
- [ ] Verify refresh/multi-tab: nothing missing or duplicated

### Phase 8 — Testing and QA
- [ ] Backend unit + e2e tests (Jest)
- [ ] Frontend tests (Vitest + Testing Library) for dedupe/merge logic
- [ ] Lint + type-check both apps
- [ ] Manual QA of every scenario in the spec

### Phase 9 — Documentation
- [ ] README (setup, env, migrations, run, architecture, decisions, tests)
- [ ] Final review
