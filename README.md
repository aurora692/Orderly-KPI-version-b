# Orderly KPI Dashboard (PRD v3 Scaffold)

This project is a Next.js dashboard starter based on `Orderly_KPI_Dashboard_PRD_v3` with:

- Four KPI sections (DeFi, Token, Business, Ecosystem)
- KPI cards with WoW deltas
- Trend charts (Recharts)
- `/admin` page with password-protected write endpoints
- API route scaffolding for dashboard data, daily refresh, and Telegram weekly summary
- Vercel cron configuration for daily refresh + Tuesday 9:00 UTC Telegram report

## 1. Local setup

1. Install Node.js 20 LTS.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
4. Update `.env.local` values for your credentials.
5. Start development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000).

## 2. Current data behavior

- The UI starts from `lib/mock-data.ts`, then applies live overrides where configured.
- Live integrations currently active:
  - CoinMarketCap: `$ORDER Price` and `CMC Rank`
  - Metabase: `Market Share` KPI and `Market Share Trend`
- Remaining sections still use mock values until next integration steps.
- `/api/admin/entries` validates payload and invalidates cache tag.
- Market Share manual fallback in `/admin` persists to Google Sheets when:
  - `GOOGLE_SHEETS_ID` is configured
  - `GOOGLE_SERVICE_ACCOUNT_KEY` is configured
  - Service account has Editor access to the sheet
- If Google Sheets is unavailable, app falls back to local file storage.
- Replace route internals with real integrations:
  - DefiLlama scrape/XHR fetch
  - CoinMarketCap API fetch (partially implemented)
  - Metabase card API fetch (partially implemented)
  - Google Sheets writes/reads

## 3. Step-by-step deployment on Vercel

1. Push this project to GitHub.
2. Create a new Vercel project and import the repository.
3. In Vercel project settings, add all environment variables from `.env.example`.
4. Ensure `DASHBOARD_BASIC_AUTH_ENABLED=true` in production for internal-only access.
5. Deploy the `main` branch.
6. After deployment, verify:
   - `/` dashboard loads
   - `/admin` accepts `ADMIN_PASSWORD`
   - `/api/telegram/weekly-summary` returns success (or preview if Telegram vars missing)
7. Confirm cron jobs in Vercel:
   - Daily refresh: `0 1 * * *`
   - Weekly Telegram summary: `0 9 * * 2` (Tuesday 9:00 UTC)

## 4. Suggested next implementation tasks

1. Add real data provider adapters in `lib/providers/*`.
2. Persist daily snapshots to Google Sheets or Postgres.
3. Compute WoW deltas from persisted history.
4. Add robust scraping fallback and alerting.
5. Add auth provider (NextAuth/SSO) for internal access.

## 6. Google Sheets manual fallback format

Set `GOOGLE_SHEETS_MANUAL_TAB=manual_fallback` (or your preferred tab name).  
The app will create this tab automatically if it does not exist.

Columns written by the app:

1. `updated_at` (ISO timestamp)
2. `market_share_current` (number)
3. `market_share_delta` (number)
4. `market_share_trend_csv` (comma-separated numbers)
5. `source` (`manual` or `auto`)

After saving from `/admin`, refresh `/` and verify:

- `Market Share` KPI value and WoW delta match your submitted values
- `Market Share Trend` chart matches your CSV series

## 5. Useful routes

- Dashboard JSON: `/api/dashboard`
- Manual scrape trigger: `POST /api/admin/scrape`
- Manual entry write: `POST /api/admin/entries`
- Daily refresh trigger: `/api/cron/daily-refresh`
- Weekly Telegram summary: `/api/telegram/weekly-summary`
