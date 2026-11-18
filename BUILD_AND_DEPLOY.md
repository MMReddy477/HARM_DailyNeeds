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

At startup, the backend accepts `MONGO_URL` or `MONGODB_URI` and logs which variable it selected, plus the MongoDB host and database name. It runs a MongoDB ping before starting the service; connection failures include a traceback in the Render logs, but never log the connection URI.

If Atlas connectivity fails, verify that the URI uses a MongoDB **database user's** username/password (not Atlas website credentials), URL-encode special characters in the password, and allow the Render service's outbound IP address or addresses in Atlas **Network Access**. Use Render's static outbound IPs when available; avoid leaving Atlas open to all IPs.

On the first startup, if the configured `HARM_ADMIN_USERNAME` does not already exist, the service creates its owner account using `HARM_ADMIN_PASSWORD`. It never uses a built-in default password and never resets an existing account's password at startup. Set both variables in Render before deploying; if an account already exists and its password is unknown, reset it using the backend's trusted seed process.

Signed-in owners can change their password under **Admin → Settings → Change Admin Password**. The change requires the current password and a new password of at least 12 characters. If locked out, set the desired `HARM_ADMIN_USERNAME` and `HARM_ADMIN_PASSWORD` in Render, then run `cd /app/backend && python seed.py` from the Render Shell; run it against the same `DB_NAME` that contains the existing store data.

Uploads use local filesystem storage instead of Emergent object storage. Render mounts a persistent disk at `/var/data`, and `UPLOADS_DIR` points to `/var/data/uploads`; local development defaults to `backend/uploads`. Storage initialization errors are logged without preventing the web service from starting. Existing files in the old Emergent storage are not migrated automatically.

## Deployment diagnostics

The missing-root-`package.json` error is addressed by the root workspace manifest and lockfile. If a deploy reports that file missing again, verify the Render Root Directory is `.` and that the deployment is using the latest commit on the intended branch. Do not configure a Publish Directory for this Docker web service.
