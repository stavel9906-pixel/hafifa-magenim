# Session handoff — Drone Simulation System

Repo: `C:\Users\matan\OneDrive\Desktop\stav\hafifa\hafifa-magenim` · branch `develop` · remote
`https://github.com/stavel9906-pixel/hafifa-magenim.git` (latest pushed commit `8d0f69c`, tree clean).
Full docs: `README.md` (setup, architecture, sync design, decisions) and `PROGRESS.md` (phase log).

## What exists (Phases 0–9 done, ~97%)
- **Backend** (`backend/`, NestJS 12 + TypeORM 1.1 + PostgreSQL 17 + Socket.IO 4.8, port 3001):
  creates a drone every 5 s at a random point on Israeli land (polygon with holes for Gaza, West Bank,
  Sea of Galilee; rejection sampling), saves it, then emits `drone:created`. `GET /api/drones`,
  `GET /api/health`. Explicit migrations, Zod-validated env, separate e2e DB `drone_simulation_test`.
- **Frontend** (`frontend/`, React 19 + Vite 8 + Mantine 9 + MapLibre 6, port 5173 strict):
  map of Israel, all drones in one GeoJSON source. Sync: socket listener first → REST fetch on every
  connect/reconnect → merge by id in a Map → REST fallback if the socket can't connect.
- **Tests (all green):** backend 83 unit + 12 e2e; frontend 53. Typecheck, lint, builds clean.

## Run
```
cd backend  && npm run start:dev     # needs backend/.env (copy .env.example; DB password set by the user)
cd frontend && npm run dev           # http://localhost:5173
```
Install with `npm ci`. If `npm install` crashes on npm 10 (`edgesOut`), use `npx npm@11 install`.
Port 3000 is used by another app of the user (RefuaDataApi) — don't touch it.

## Still open
1. **Visual map check** never done: confirm the map is framed on Israel and icons sit on land.
2. **New feature in progress — camera video stream.** Nothing built yet. Findings:
   - `10.0.10.72` is an ONVIF IP camera (model 800S5AFNETZ250_AF). Port 80 = web login page,
     554 = RTSP, 8000 open.
   - Profiles: `MainStream` H.264 2560×1440 25fps; `SubStream` H.264 720×480 25fps.
   - RTSP paths: `rtsp://10.0.10.72:554/stream0` (main), `/stream1` (sub); needs credentials.
   - Snapshot without login: `http://10.0.10.72/cgi-bin/snapshot.cgi?stream=0|1` (JPEG, CORS `*`).
   - Browsers can't play RTSP. Recommended plan: backend runs ffmpeg (installed via winget,
     Gyan.FFmpeg 8.0.1) on the sub-stream and serves MJPEG; frontend shows it in an `<img>`.
     Credentials go in `backend/.env` as `CAMERA_HOST`, `CAMERA_USERNAME`, `CAMERA_PASSWORD`
     (placeholders in `.env.example`; the user types the password themselves).
   - Waiting on the user: approve that approach, and choose placement — panel over the map
     (default), side panel, or separate tab.

## User preferences / working rules
- Work one step at a time; report, then wait for explicit approval before the next phase/feature.
- Commit only when asked. **No Claude / AI attribution** in commits or PRs (history was rewritten to
  remove it). Never force-push without explicit approval.
- Keep code comments minimal (only short data labels; the user removes doc comments).
- File layout mirrors the backend: separate `types/`, `utils/`, `constants/`, `mappers/` folders.
- Never commit secrets; `.env` files are git-ignored. Don't type passwords for the user.
- At the end of a feature, offer `/vault` documentation (don't run it unasked).
