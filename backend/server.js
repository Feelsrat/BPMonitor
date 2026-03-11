const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const PASSWORD = process.env.PWORD || 'defaultpassword';
// Use volume mount (/app/data) for persistent storage on Fly.io, or local app dir for local dev
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : __dirname;
const DATA_FILE = path.join(DATA_DIR, 'bp-data.json');

// Simple in-memory session store (valid tokens)
const validTokens = new Set();

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}



// Middleware to check authentication token
function checkAuth(req, res, next) {
  // Allow health check and auth endpoints without authentication
  // Note: When middleware is mounted at '/api/', req.path only has the route part (not /api)
  if (req.path === '/health/' || req.path === '/auth/') {
    return next();
  }
  
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token || !validTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (frontend) from public directory BEFORE auth checks
app.use(express.static(path.join(__dirname, 'public')));

// Apply auth check only to API routes (except health and auth endpoints)
app.use('/api/', checkAuth);

// Load data from JSON file
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading data file:', err);
  }
  return [];
}

// Save data to JSON file
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

// Health check endpoint
app.get('/api/health/', (req, res) => {
  res.json({ status: 'ok' });
});

// Authentication endpoint
app.post('/api/auth/', (req, res) => {
  const { password } = req.body;
  
  // Check password
  if (password !== PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  // Generate token (simple UUID-like)
  const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  validTokens.add(token);
  
  res.json({ success: true, token });
});

// Get all entries
app.get('/api/entries/', (req, res) => {
  const data = loadData();
  res.json(data);
});

// Create new entry
app.post('/api/entries/', (req, res) => {
  const { systolic, diastolic, pulse, notes } = req.body;
  
  if (!systolic || !diastolic || !pulse) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const data = loadData();
  const newEntry = {
    id: Date.now(),
    systolic: parseInt(systolic),
    diastolic: parseInt(diastolic),
    pulse: parseInt(pulse),
    notes: notes || '',
    timestamp: new Date().toISOString()
  };

  data.push(newEntry);
  data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  saveData(data);

  res.status(201).json(newEntry);
});

// Update entry
app.patch('/api/entries/:id/', (req, res) => {
  const { id } = req.params;
  const { systolic, diastolic, pulse, notes } = req.body;

  const data = loadData();
  const entryIndex = data.findIndex(e => e.id === parseInt(id));

  if (entryIndex === -1) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  data[entryIndex] = {
    ...data[entryIndex],
    ...(systolic && { systolic: parseInt(systolic) }),
    ...(diastolic && { diastolic: parseInt(diastolic) }),
    ...(pulse && { pulse: parseInt(pulse) }),
    ...(notes !== undefined && { notes })
  };

  saveData(data);
  res.json(data[entryIndex]);
});

// Delete entry
app.delete('/api/entries/:id/', (req, res) => {
  const { id } = req.params;

  let data = loadData();
  data = data.filter(e => e.id !== parseInt(id));
  saveData(data);

  res.json({ message: 'Entry deleted' });
});

// Export as CSV
app.get('/api/entries/export/csv/', (req, res) => {
  const data = loadData();
  
  let csv = 'Systolic,Diastolic,Pulse,Notes,Timestamp\n';
  data.forEach(entry => {
    csv += `${entry.systolic},${entry.diastolic},${entry.pulse},"${entry.notes}",${entry.timestamp}\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bp-data.csv"');
  res.send(csv);
});

// Serve SPA - catch all remaining routes and serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ BP Monitor server running on port ${PORT}`);
  console.log(`✓ Frontend: http://localhost:${PORT}/`);
  console.log(`✓ API: http://localhost:${PORT}/api/`);
  console.log(`✓ Data stored in: ${DATA_FILE}`);
});
