// Local stand-in for Vercel: serves the functions in api/ on port 3001.
import 'dotenv/config';
import express from 'express';
import { isLocal } from './api/lib/kv.js';
import auth from './api/auth.js';
import health from './api/health.js';
import publicEntries from './api/public.js';
import entries from './api/entries.js';
import entryById from './api/entries/[id].js';
import exportEntries from './api/entries/export.js';
import importEntries from './api/entries/import.js';

const PORT = 3001;

const routes = {
  '/api/auth': auth,
  '/api/health': health,
  '/api/public': publicEntries,
  '/api/entries': entries,
  '/api/entries/export': exportEntries,
  '/api/entries/import': importEntries,
  '/api/entries/:id': entryById,
};

const app = express();
app.use(express.json({ limit: '10mb' }));
app.set('strict routing', false);

for (const [path, handler] of Object.entries(routes)) {
  app.all(path, (req, res) => {
    // Vercel exposes dynamic path segments through req.query
    req.query = { ...req.query, ...req.params };
    return handler(req, res);
  });
}

app.listen(PORT, () => {
  console.log(`BP Monitor API running at http://localhost:${PORT}/api/`);
  console.log(`Storage: ${isLocal ? 'local file (bp-data.json)' : 'Upstash Redis'}`);
  if (!process.env.PWORD) {
    console.warn('Warning: PWORD is not set, login will fail. Copy .env.example to .env.');
  }
});
