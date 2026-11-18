# Build and deploy

## Project layout

- **Project type:** Full-stack React + Vite frontend with a FastAPI backend and MongoDB.
- **Root npm manifest:** `package.json` (npm workspace for `frontend/`).
- **Root npm lockfile:** `package-lock.json`.
- **Render Root Directory:** `.` (repository root).

## Local validation

Use Node.js `>=22.12.0 <25` and Python 3.13:

```powershell
npm ci
npm run build
python -m pip install -r backend/requirements.txt
python -m py_compile backend/serve_local.py
```

The Vite build output is `frontend/dist`. Start the combined FastAPI server with:

```powershell
npm start
```

It serves both the frontend and `/api` on the port provided by the environment (3000 locally).

## Render configuration

The checked-in `render.yaml` deploys a single Docker web service so the Node frontend build and Python API run in one app:

- **Root Directory:** `.`
- **Build:** Dockerfile multi-stage build (`npm ci && npm run build`, then install `backend/requirements.txt`).
- **Start:** `python backend/serve_local.py` (Dockerfile command).
- **Publish Directory:** Not applicable; this is a web service, not a static-site service. FastAPI serves `frontend/dist`.
- **Health check:** `/api/`.

In the Render service environment, provide `MONGO_URL`, `HARM_ADMIN_USERNAME`, and `HARM_ADMIN_PASSWORD`. The Blueprint sets `DB_NAME=harm_daily_needs` and `APP_TZ=Asia/Kolkata`. Configure a reachable MongoDB instance separately; the repository does not include one.

## Deployment diagnostics

The missing-root-`package.json` error is addressed by the root workspace manifest and lockfile. If a deploy reports that file missing again, verify the Render Root Directory is `.` and that the deployment is using the latest commit on the intended branch. Do not configure a Publish Directory for this Docker web service.
