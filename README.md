# H.A.R.M DAILY NEEDS

Public storefront and owner dashboard for the H.A.R.M DAILY NEEDS retail store. The app combines a React, TypeScript, and Vite frontend with a FastAPI backend and MongoDB.

## Features

- Public storefront with product catalog, dairy and cool drinks, school kits, store information, reviews, and print/Xerox services.
- Owner dashboard with inventory, products, POS, reports, purchases, milk subscriptions, money transfers, and store settings.
- Seed catalog with 55 products, including school and office supplies, dairy, flavored milk, soft drinks, juices, energy drinks, and water.
- Cookie-based owner authentication and server-side authorization for admin APIs.

## Requirements

- Python 3.13 or newer
- Node.js 22.12 or newer
- MongoDB connection

## Configure and seed

Create `backend/.env` from the example and set a unique owner username and password:

```powershell
Copy-Item backend\env.example backend\.env
```

Set `MONGO_URL`, `DB_NAME=harm_daily_needs`, `HARM_ADMIN_USERNAME`, and `HARM_ADMIN_PASSWORD` in `backend/.env`. To use the same MongoDB data locally and on Render, set the same MongoDB cluster URI in both environments. Keep this file local; it is ignored by Git.

Install backend dependencies and seed the catalog and owner account:

```powershell
py -m pip install -r backend\requirements.txt
Set-Location backend
py seed.py
```

The seed command is idempotent: it creates missing catalog records and does not overwrite existing product edits. It requires the owner credentials from `backend/.env`; credentials are never stored in source code.

## Run the whole site on port 3000

Install frontend dependencies, build the static frontend, then run FastAPI as the single local web server:

```powershell
Set-Location frontend
npm install
npm run build
Set-Location ..\backend
py serve_local.py
```

Open [http://localhost:3000](http://localhost:3000). Public pages, the admin login, static assets, and `/api` requests share the same port.

For frontend development with Vite hot reload, run `uvicorn server:app --host 127.0.0.1 --port 8001 --reload` from `backend` and `npm run dev` from `frontend`; Vite proxies `/api` to port 8001.

## Optional AI and storage integrations

The storefront and admin work without the Emergent AI SDK. AI assistant and AI product-description endpoints respond with HTTP 503 until the optional `emergentintegrations` SDK and `EMERGENT_LLM_KEY` are configured. Product uploads also need the configured object-storage integration. These optional services do not block the rest of the site.

## Validation

```powershell
Set-Location frontend
npm run typecheck
npm run build
Set-Location ..\backend
py -m compileall -q .
```
