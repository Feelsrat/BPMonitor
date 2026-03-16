# BP Monitor - Blood Pressure Tracking Web App

A secure, single-user blood pressure tracking web application built with Vue 3 (frontend) and Vercel Functions (backend), designed to run on Vercel with Vercel KV storage.

> 🚀 **Quick Start**: See [QUICKSTART.md](./QUICKSTART.md) for a 2-minute setup guide!

## Features

- 🔐 **Secure JWT-based authentication** - Password protected login
- 📊 **Interactive charts with BP reference zones** - Visual indicators for normal/elevated/high BP
- 📱 **Mobile-responsive design** - Works perfectly on phones, tablets, and desktops
- 📥 **CSV/JSON export & import** - Download and restore your health data
- 📈 **Statistics dashboard** - Track trends and patterns
- 🚀 **Serverless deployment** - Scales automatically, pay only for what you use

## Tech Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS + Chart.js
- **Backend**: Vercel Functions (Node.js) + Vercel KV (Redis)
- **Deployment**: Vercel + GitHub
- **Auth**: JWT tokens

## Quick Start

### Local Development

1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Set environment variables**
   ```bash
   # Copy template
   cp .env.example .env
   
   # Edit .env with your password and JWT secret
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   
   This starts both:
   - Frontend: http://localhost:5173/
   - API: http://localhost:3001/api/

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy with Vercel**
   ```bash
   vercel --prod
   ```

3. **Link Vercel KV** (one-time setup)
   ```bash
   vercel env link KV
   ```

See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for detailed deployment instructions.

## Directory Structure

```
BPMonitor/
├── frontend/               # Vue 3 + Vite frontend
│   ├── src/
│   │   ├── components/    # Vue components
│   │   ├── services/      # API client
│   │   └── App.vue
│   ├── package.json
│   └── vite.config.js
├── api/                    # Vercel Functions (serverless backend)
│   ├── lib/               # Utilities (auth, KV storage)
│   ├── auth.js            # Auth endpoint
│   ├── health.js          # Health check
│   ├── entries.js         # BP entries CRUD
│   └── entries/           # Entry-specific endpoints
├── dev-server.js          # Local development server
├── .env                   # Environment variables (local dev)
├── .env.example           # Environment template
├── package.json           # Root package configuration
└── vercel.json            # Vercel configuration
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/` | Login (get JWT token) |
| GET | `/api/entries/` | Get all BP entries |
| POST | `/api/entries/` | Create new entry |
| PATCH | `/api/entries/:id/` | Update entry |
| DELETE | `/api/entries/:id/` | Delete entry |
| GET | `/api/entries/export/` | Export as CSV |
| POST | `/api/entries/import/` | Import CSV/JSON |

## Data Backup & Migration

### Export Your Data
1. Open the app and go to **Import** tab
2. Click export button to download CSV
3. Save file to your computer

### Import Data
1. Go to **Import** tab
2. Select your backup CSV or JSON file
3. Choose **Merge** (add to existing) or **Replace** (overwrite all)
4. Click Import

## Environment Variables

### Root .env file
```
PWORD=your_secure_password
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Vercel Deployment
- Set `PWORD` and `JWT_SECRET` in Vercel project settings
- Vercel KV connection details are auto-configured

## Troubleshooting

### Can't connect to API locally
```bash
# Make sure Vercel dev server is running
npm run dev

# Check that API routes are accessible
curl http://localhost:3000/api/health/
```

### Lost data / Need to restore backup
1. Make sure you have the backup CSV file
2. Go to Import tab
3. Select the file and choose "Replace" mode (⚠️ this will overwrite current data)
4. Click Import

### Login issues
- Make sure password matches the `PWORD` environment variable
- Tokens expire after 7 days - log out and back in if token is stale
- Check browser DevTools → Application → Storage → localStorage

## Security Notes

- ✅ All API routes (except `/auth` and `/health`) require valid JWT
- ✅ Password never sent to backend (only used to verify login)
- ✅ JWT tokens stored securely in localStorage
- ✅ Data stored in Vercel KV (managed encryption)
- ⚠️ Single password for all users (single-user app)
- ⚠️ Change password in environment variables to invalidate old tokens

## License

MIT
