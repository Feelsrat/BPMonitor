# BP Monitor

A single-user blood pressure tracker: Vue 3 frontend, Vercel Functions backend, Upstash Redis storage and optional daily backups to a private GitHub repository.

## Features

- **Log**: quick entry with note templates; readings can be backdated
- **History**: averages, blood pressure and pulse charts, time-of-day breakdown and a day-by-day list; tap a reading to edit or delete it
- **Export**: a PDF report for your doctor (summary, charts, averages, every reading) and CSV
- **Settings**: CSV/JSON import, the share link, logout
- Shareable read-only page at `/public` (notes are never shown there)
- Daily GitHub backups via Vercel Cron
- Password-protected (JWT, valid for 7 days)

Charts show individual readings for ranges up to ~6 weeks, and daily or weekly averages (with a min-max band) for longer ones. The PDF renders the same charts.

## Local development

```bash
npm run install:all
cp .env.example .env    # then set PWORD and JWT_SECRET
npm run seed            # optional: generate ~2 years of test data
npm run dev
```

- Frontend: http://localhost:5173/
- API: http://localhost:3001/api/

Without Redis credentials the API stores data in `bp-data.json` in the project root.

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API and frontend |
| `npm run dev:api` / `npm run dev:frontend` | Start one of them |
| `npm run build` | Build the frontend |
| `npm run seed` | Overwrite `bp-data.json` with test data |

## Project structure

```
api/                    Vercel Functions
  lib/                  auth, storage (Redis / local file), validation, handler wrapper
  entries/              [id] (PATCH/DELETE), export (CSV), import
  cron/backup.js        daily GitHub backup
  auth.js entries.js public.js health.js
frontend/src/
  views/                Log, History (also the public page), Export, Settings
  components/           shared pieces; base/ holds the auto-registered Base* components
  composables/          useEntries: cached readings shared between views
  services/api.js       axios client and auth token handling
  utils/                bp.js (stats, ranges), chart.js (Chart.js config), report.js (PDF), importFile.js
dev-server.js           runs the api/ functions locally with Express
```

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/` | – | Log in with `{ password }`, returns `{ token }` |
| GET | `/api/health/` | – | Health check |
| GET | `/api/public/` | – | Readings without notes, for the public page |
| GET | `/api/entries/` | ✓ | All readings, newest first |
| POST | `/api/entries/` | ✓ | Create `{ systolic, diastolic, pulse, notes?, timestamp? }` |
| PATCH | `/api/entries/:id/` | ✓ | Update fields of a reading |
| DELETE | `/api/entries/:id/` | ✓ | Delete a reading |
| GET | `/api/entries/export/` | ✓ | All readings as CSV |
| POST | `/api/entries/import/` | ✓ | Import `{ entries, mode: 'merge' \| 'replace' }` |
| GET | `/api/cron/backup` | `CRON_SECRET` | Run the GitHub backup |

## Deploying to Vercel

1. Import the repository in Vercel; `vercel.json` sets the build and install commands.
2. Add the Upstash Redis integration from the Vercel Marketplace. It sets `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (or the `BP_KV_REST_API_*` equivalents).
3. Set environment variables:
   - `PWORD`: login password (required; login is refused when unset)
   - `JWT_SECRET`: token signing secret (falls back to `PWORD`)
   - `CRON_SECRET`, `GITHUB_TOKEN`, `GITHUB_BACKUP_REPO`: for backups

### GitHub backups

Vercel Cron calls `/api/cron/backup` daily at midnight UTC. It writes the readings as `YYYY-MM-DD.json` to `GITHUB_BACKUP_REPO` (`owner/repo`), and skips the commit when nothing changed since the last backup. The JSON files can be imported from Settings.

1. Create a private repository for the backups.
2. Create a fine-grained GitHub token with **Contents: read and write** on that repository only.
3. Set `GITHUB_TOKEN`, `GITHUB_BACKUP_REPO` and a random `CRON_SECRET` in Vercel. Vercel sends the secret with cron requests automatically.

## Import formats

CSV needs a header row; columns are matched by name and `Notes` is optional:

```csv
Systolic,Diastolic,Pulse,Notes,Timestamp
120,80,72,Morning reading,2024-01-15T08:30:00Z
130,85,75,"After exercise, feeling good",2024-01-15T14:45:00Z
```

JSON is an array of `{ systolic, diastolic, pulse, notes, timestamp }` objects. Readings outside plausible ranges or with invalid timestamps are skipped, and merging skips readings that already exist.

## Security notes

- Every route except `/auth`, `/health` and `/public` requires a token.
- The `/public` page shows all readings (without notes) to anyone with the link.
- Changing `JWT_SECRET` (or `PWORD`, if `JWT_SECRET` is unset) invalidates all existing tokens.

## License

MIT
