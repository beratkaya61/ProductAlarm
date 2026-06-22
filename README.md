# Product Alarm

React dashboard and NestJS Fastify backend for product price alarms with WhatsApp Web notifications.

## Structure

- `frontend`: React + Vite dashboard.
- `backend`: NestJS + Fastify API, scraper, alarm scheduler, WhatsApp Web client.
- `docker-compose.yml`: Development deployment with PostgreSQL. Dockerfiles still include production targets.

## Local Docker Run

1. Manage local settings from `backend/.env`.
2. `WHATSAPP_ENABLED=true` starts the WhatsApp client and prints a QR code in backend logs.
3. Run:

```bash
docker compose up --build
```

Frontend: `http://localhost:3000`

Backend: `http://localhost:5000`

PostgreSQL: `localhost:5432`

When WhatsApp is enabled, scan the QR code printed in backend logs.

## Scraper Configuration

- `SCRAPER_ENABLED_PROVIDERS`: comma-separated provider ids from `src/modules/scraper/providers/provider-list.ts`.
- `PRICE_CHECK_INTERVAL_MS`: background price checker interval.
- `SCRAPER_REQUEST_DELAY_MIN_MS` / `SCRAPER_REQUEST_DELAY_MAX_MS`: jittered delay between provider requests.
- `SCRAPER_MAX_RESULTS_PER_PROVIDER` / `SCRAPER_MAX_TOTAL_RESULTS`: result limits.
