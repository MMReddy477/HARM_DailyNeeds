FROM node:24.22.1-bookworm-slim AS frontend-build

WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM python:3.13.4-slim

WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend backend
COPY --from=frontend-build /app/frontend/dist frontend/dist

ENV HOST=0.0.0.0 DB_NAME=harm_daily_needs
CMD ["python", "backend/serve_local.py"]
