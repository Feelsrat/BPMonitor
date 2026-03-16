import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Import API handlers
import authHandler from './api/auth.js';
import healthHandler from './api/health.js';
import entriesHandler from './api/entries.js';
import entriesIdHandler from './api/entries/[id].js';
import exportHandler from './api/entries/export.js';
import importHandler from './api/entries/import.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create mock request/response for handlers
const createMockReq = (req) => ({
  ...req,
  query: req.query || {},
  body: req.body || {},
  headers: req.headers || {},
  method: req.method,
  path: req.path
});

// Routes
app.get('/api/health/', (req, res) => {
  healthHandler(createMockReq(req), res);
});

app.post('/api/auth/', (req, res) => {
  authHandler(createMockReq(req), res);
});

app.get('/api/entries/', (req, res) => {
  entriesHandler(createMockReq(req), res);
});

app.post('/api/entries/', (req, res) => {
  entriesHandler(createMockReq(req), res);
});

app.get('/api/entries/export/', (req, res) => {
  exportHandler(createMockReq(req), res);
});

app.post('/api/entries/import/', (req, res) => {
  importHandler(createMockReq(req), res);
});

app.patch('/api/entries/:id/', (req, res) => {
  req.query = req.query || {};
  req.query.id = req.params.id;
  entriesIdHandler(createMockReq(req), res);
});

app.delete('/api/entries/:id/', (req, res) => {
  req.query = req.query || {};
  req.query.id = req.params.id;
  entriesIdHandler(createMockReq(req), res);
});

// Health check
app.listen(PORT, () => {
  const password = process.env.PWORD || 'changeme';
  const storageMode = process.env.KV_REST_API_URL ? 'Vercel KV' : 'Local File (bp-data.json)';
  
  console.log(`
✅ BP Monitor Dev Server Running!

🌐 Frontend:  http://localhost:5173/
⚙️  API:      http://localhost:${PORT}/api/
🔐 Password:  ${password}
💾 Storage:   ${storageMode}

📝 API Endpoints:
   POST   /api/auth/
   GET    /api/health/
   GET    /api/entries/
   POST   /api/entries/
   PATCH  /api/entries/:id/
   DELETE /api/entries/:id/
   GET    /api/entries/export/
   POST   /api/entries/import/

💡 Tip: Run tests with curl or Postman
   Example: curl http://localhost:${PORT}/api/health/
  `);
});
