# Drone Simulation System

A full-stack app that simulates drones appearing over Israel. The backend creates a drone at a random
point on Israeli land every 5 seconds, saves it to PostgreSQL and broadcasts it over WebSocket. The
frontend shows every drone on a MapLibre map: it loads the history over REST and adds new drones live,
with no gaps and no duplicates.

---

## Technologies

| Layer | Stack |
|---|---|
| Backend | NestJS 12, TypeScript 6, TypeORM 1.1, PostgreSQL 17, Socket.IO 4.8, Zod 4 (env validation) |
| Frontend | React 19, TypeScript 7, Vite 8, Mantine 9, MapLibre GL JS 6, socket.io-client 4.8 |
| Map data | OpenFreeMap vector tiles (`liberty` style) — free, no API key |
| Tooling | Vitest (unit + e2e), Testing Library + jsdom, oxlint, Prettier (backend), tsx |

---

## Architecture

```
┌──────────────────────── backend (NestJS, :3001) ────────────────────────┐
│                                                                         │
│  DroneSimulationService ──every 5 s──► CoordinateGenerator              │
│          │                              (random point inside the        │
│          │                               Israel land polygon)           │
│          ▼                                                              │
│  DronesService.create() ──INSERT──► PostgreSQL  (drones table)          │
│          │                                                              │
│          ▼ (only after the save succeeds)                               │
│  DronesGateway.broadcastDroneCreated() ──► Socket.IO  "drone:created"   │
│                                                                         │
│  DronesController   GET /api/drones   (full history, oldest first)      │
│  HealthController   GET /api/health   (checks the DB with SELECT 1)     │
└─────────────────────────────────────────────────────────────────────────┘
             ▲ REST (history)                     ▲ WebSocket (live)
             │                                    │
┌──────────────────────── frontend (React, :5173) ────────────────────────┐
│  useDroneSocket ── connect ──► useDrones.load() ──► GET /api/drones      │
│        │                              │                                 │
│        └── drone:created ─────────────┴──► reducer: merge by id (Map)   │
│                                                    │                    │
│                                                    ▼                    │
│  DronesPage ── DroneMap (one GeoJSON source + symbol layer, setData)    │
│            └─ ConnectionBadge · DroneCountBadge · loading/error/empty   │
└─────────────────────────────────────────────────────────────────────────┘
```

Backend modules: `config` (env schema, DB options) · `database` (data source, migrations) · `drones`
(entity, service, REST) · `realtime` (Socket.IO gateway + adapter) · `simulation` (loop, polygon,
coordinate generator) · `health`.

---

## Folder structure

```
.
├── README.md, PROGRESS.md, .gitignore, .gitattributes
├── backend/
│   ├── .env.example
│   ├── scripts/create-database.ts          npm run db:create
│   ├── src/
│   │   ├── main.ts, app.module.ts, app.setup.ts   (shared by main and e2e tests)
│   │   ├── config/        env.schema.ts (Zod), database.config.ts
│   │   ├── database/      data-source.ts (CLI), ensure-database.ts, migrations/
│   │   ├── drones/        controller, service, module, dto/, types/ (entity, coordinates)
│   │   ├── realtime/      drones.gateway.ts, socket-io.adapter.ts, drone-events.ts
│   │   ├── simulation/    drone-simulation.service.ts, coordinate-generator.ts,
│   │   │                  geo/ (israel-land-area.ts, types/, utils/)
│   │   └── health/
│   └── test/              e2e specs + global setup (separate test database)
└── frontend/
    ├── .env.example
    └── src/
        ├── main.tsx, App.tsx, theme.ts
        ├── config/        env.ts (validated VITE_* vars)
        ├── api/           http-client, drones.api, api-error, validators/
        ├── realtime/      drone-socket.ts, drone-events.ts, types/
        ├── hooks/         useDroneSocket, useDrones, types/
        ├── state/         drones.reducer.ts, types/, constants/
        ├── map/           components/DroneMap, mappers/, constants/, config/, utils/, assets/
        ├── components/    layout, badges, loading/error/empty states
        ├── pages/         DronesPage
        ├── types/, utils/ (merge-drones)
        └── test/          setup, render helper, fake socket
```

Unit tests sit next to the file they test (`*.spec.ts` in the backend, `*.test.ts(x)` in the frontend).

---

## Prerequisites

- **Node.js 22** (developed on 22.17.1; the Nest CLI prints a harmless warning below 22.22).
- **npm 10 or 11**.
- **PostgreSQL 14+** running locally (developed on 17). No Docker is required.
- A modern browser with WebGL (for MapLibre).

---

## Installation

```bash
cd backend
npm ci
```

```bash
cd frontend
npm ci
```

> If `npm install` (not `npm ci`) crashes on npm 10 with `Cannot read properties of null (reading
> 'edgesOut')`, that is an npm 10 bug with Vite 8 peer dependencies. Use `npx npm@11 install`.

---

## Environment variables

Each app has a `.env.example`. Copy it to `.env` and fill in the values. `.env` files are git-ignored;
never commit real credentials.

### `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `PORT` | `3001` | HTTP + WebSocket port |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated frontend origins allowed for REST **and** WebSocket |
| `DB_HOST` | — | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | — | PostgreSQL user |
| `DB_PASSWORD` | — | PostgreSQL password |
| `DB_NAME` | — | Database name, e.g. `drone_simulation` |
| `SIMULATION_ENABLED` | `true` | Set `false` to serve the API without generating drones |
| `SIMULATION_INTERVAL_MS` | `5000` | Time between drones (minimum 100) |

The backend validates these at startup with Zod and refuses to start with a clear message if one is
missing or invalid.

### `frontend/.env`

| Variable | Example | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001/api` | REST base URL (includes `/api`) |
| `VITE_SOCKET_URL` | `http://localhost:3001` | Socket.IO server origin (no `/api`) |
| `VITE_MAP_STYLE_URL` | `https://tiles.openfreemap.org/styles/liberty` | MapLibre style JSON |

The frontend checks that all three are valid URLs at startup.

---

## PostgreSQL setup

1. Install PostgreSQL and make sure the service is running (Windows: service `postgresql-x64-17`).
2. Put the connection details in `backend/.env`.
3. Create the database (safe to run more than once):

   ```bash
   cd backend
   npm run db:create
   ```

   You can also create it yourself in pgAdmin or `psql` (`CREATE DATABASE drone_simulation;`).

The schema uses `gen_random_uuid()`, which is built into PostgreSQL 13+, so no extension is needed.

---

## Database migrations

The schema is managed only by migrations (`synchronize` is off). From `backend/`:

```bash
npm run migration:run       # apply pending migrations
npm run migration:show      # list applied / pending
npm run migration:revert    # undo the last one
npm run migration:generate -- src/database/migrations/<Name>   # after changing an entity
```

A newly generated migration must be added to `src/database/migrations/index.ts`.

The `drones` table:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key, `gen_random_uuid()` |
| `latitude` | `double precision` | check: −90…90 |
| `longitude` | `double precision` | check: −180…180 |
| `created_at` | `timestamptz` | default `now()`, indexed |

---

## Running

Start the backend first, then the frontend, in two terminals.

### Backend

```bash
cd backend
npm run start:dev      # watch mode
```

Other options: `npm run start` (no watch), or `npm run build` then `npm run start:prod`.

It listens on `http://localhost:3001/api`:

- `GET /api/drones` — all drones, oldest first: `[{ id, latitude, longitude, createdAt }]`
- `GET /api/health` — `{ "status": "ok", "database": "up" }`, or 503 when the DB is unreachable

### Frontend

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**. The port is fixed (`strictPort`): if 5173 is taken Vite fails instead
of moving to another port, because the backend only allows the origins in `CORS_ORIGINS`.

Production build: `npm run build`, then `npm run preview` (serves on 4173; add
`http://localhost:4173` to `CORS_ORIGINS` to use it).

---

## How drone generation works

1. **Land polygon.** `simulation/geo/israel-land-area.ts` holds a simplified outline of Israel's land
   area plus *holes* for Gaza, the West Bank and the Sea of Galilee.
2. **Random point.** `CoordinateGenerator` picks a random point in the polygon's bounding box and keeps
   it only if it is inside the outline and outside every hole (ray-casting test). This is *rejection
   sampling*: every land point is equally likely, and the sea is never chosen. It gives up after 1000
   tries, which never happens in practice (about 35% of tries hit land).
3. **Loop.** `DroneSimulationService` starts when the app boots. Each tick saves a drone, then
   broadcasts it, then schedules the next tick with `setTimeout`.
   - **No overlap:** the next tick is scheduled only after the current one finishes, so a slow
     database can never cause two inserts to run at once (unlike `setInterval`).
   - **Steady cadence:** the delay subtracts the time the tick took, so drones arrive every 5 s, not
     every 5 s + save time.
   - **Errors don't stop it:** a failed save is logged and the loop continues. A failed broadcast is
     logged separately; the drone is already saved, and clients get it on their next load.
   - **Clean shutdown:** on shutdown the loop stops and waits for the save in progress, so nothing is
     written after the app closes.

---

## How WebSocket communication works

- Socket.IO runs on the same port as the REST API. A small custom adapter (`SocketIoAdapter`) applies
  the same `CORS_ORIGINS` list to WebSocket connections.
- There is one event, **`drone:created`**, sent from the server to every connected client with the same
  shape as the REST items: `{ id, latitude, longitude, createdAt }`.
- The server emits it **only after** the drone is committed to the database. So any drone a client
  receives is already visible to `GET /api/drones`.
- The client validates every event payload and every REST response. A malformed event is ignored; a
  malformed REST response is shown as a load error.
- Reconnection is automatic (1 s, backing off to 10 s). The header badge shows **Live**,
  **Connecting…** or **Reconnecting…**.
- The gateway logs every connect and disconnect with the reason and the current client count.

---

## Initial loading and real-time synchronization

The hard part is the gap between "history loaded" and "socket listening". A drone created in that gap
would be missed, and a drone that is in both the REST response and a socket event would be shown twice.

The frontend avoids both:

1. **Listen first.** The `drone:created` listener is registered before the connection opens, so no
   event is lost while the history request is in flight.
2. **Fetch on every connect.** `GET /api/drones` runs on each `connect`, including every *re*connect.
   Drones created while the client was offline are recovered from the database.
3. **Merge by id.** Drones live in a `Map` keyed by `id`. The REST result and socket events are merged
   into it, so a drone that arrives both ways is stored once, and arrival order doesn't matter.
4. **Newer request wins.** A new load aborts the previous one (`AbortController`), so a slow old
   response can't overwrite a newer one.
5. **REST fallback.** If the socket can't connect at all, the history is still loaded once over REST so
   the map isn't empty.
6. **Keep what you have.** A failed reload keeps the drones already on screen. Duplicates and no-op
   merges return the same state object, so React doesn't re-render for nothing.

On the map, all drones are one GeoJSON source drawn by one symbol layer. Each update is a single
`setData` call, which stays smooth with thousands of drones (DOM markers would not).

---

## Testing

### Backend (`backend/`)

```bash
npm test             # unit tests (no database needed)
npm run test:e2e     # end-to-end tests (needs PostgreSQL)
npm run typecheck
npm run lint
```

- **Unit:** env validation, polygon math, coordinate generator (every generated point is on land),
  simulation loop with fake timers (cadence, no overlap, error handling, shutdown), service, controller,
  gateway, health.
- **E2E:** boots the real app against a **separate database, `drone_simulation_test`**, which the setup
  creates and migrates automatically; your dev data is never touched. Covers REST, health, real
  Socket.IO clients receiving broadcasts, and graceful shutdown during generation.

### Frontend (`frontend/`)

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Covers validators, the merge logic, the reducer, both hooks (with a fake socket: connect, reconnect,
fallback, duplicates, aborts), the GeoJSON mapper, the map component (with a fake MapLibre map) and
the page states.

---

## Key decisions

| Decision | Why |
|---|---|
| **Socket.IO** over raw WebSocket | Automatic reconnection, CORS handling and first-class NestJS support. |
| **Save, then broadcast** | A client can never see a drone that the database doesn't have, which keeps REST and WebSocket consistent. |
| **Fetch on every connect + merge by id** | Simple and correct: no sequence numbers or timestamps to compare, and reconnects heal themselves. |
| **`setTimeout` chain, not `setInterval`** | Guarantees one tick at a time and a clean shutdown. |
| **Land polygon in the backend** | The backend decides where drones are, so it must know what "land" is. The map tiles' city names are only for display. |
| **Polygon with holes + rejection sampling** | Uniform over land, tiny code, no geo library. |
| **Explicit migrations, `synchronize: false`** | Schema changes are reviewed and versioned; nothing changes the DB implicitly. |
| **`timestamptz` + index on `created_at`** | Unambiguous times across time zones; history is ordered by this column. |
| **Zod env validation** | Misconfiguration fails fast at startup with a readable error. |
| **One GeoJSON source, symbol layer** | Thousands of drones render on the GPU instead of as DOM nodes. |
| **OpenFreeMap tiles** | Free and keyless, so no secret is needed to run the app. |
| **Separate e2e database** | Tests can truncate tables freely without touching development data. |

### Known limitations

- Broadcasts reach only clients of the same backend instance. Running several instances would need a
  shared adapter (e.g. Redis).
- `GET /api/drones` returns the full history with no paging; fine for this project's scale.
- The frontend has no request timeout for a server that accepts the connection but never answers.
- The production bundle is ~389 KB gzipped, mostly MapLibre.
