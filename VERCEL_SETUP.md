# Vercel Migration Guide

This BP Monitor app has been migrated from Express.js to Vercel Functions with Vercel KV for storage.

## 📋 What Changed

### Stack Updates
- **Backend**: Express.js → Vercel Functions (serverless)
- **Storage**: Local file system (`bp-data.json`) → Vercel KV (Redis)
- **Frontend**: Vue 3 + Vite (unchanged, but optimized for Vercel)
- **New Feature**: CSV/JSON import functionality

### New Directory Structure
```
/api                     # Vercel Functions (serverless endpoints)
  ├── lib/
  │   ├── auth.js       # Authentication utilities
  │   └── kv.js         # KV storage utilities
  ├── auth.js           # POST /api/auth
  ├── health.js         # GET /api/health
  ├── entries.js        # GET/POST /api/entries
  ├── entries/
  │   ├── [id].js       # PATCH/DELETE /api/entries/:id
  │   ├── export.js     # GET /api/entries/export
  │   └── import.js     # POST /api/entries/import (NEW)
  └── package.json
/frontend                # Vue 3 + Vite frontend
  ├── src/              # Source code
  └── package.json
/.env                    # Environment variables (local dev)
/.env.example           # Environment template
/dev-server.js          # Local development server
/package.json           # Root dependencies
/vercel.json            # Vercel configuration
```

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Vercel CLI: `npm install -g vercel`

### Step 1: Install Dependencies

```bash
npm run install:all
```

Or manually:
```bash
npm install
cd frontend && npm install && cd ..
cd api && npm install && cd ..
```

### Step 2: Set Environment Variables

**Root .env file**
```bash
cp .env.example .env
```

Edit `.env`:
```
PWORD=your_secure_password
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Step 3: Run Locally with Vercel CLI

```bash
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

## 📦 Deploy to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Migrate to Vercel"
git push origin main
```

### Step 2: Connect to Vercel

```bash
vercel
```

Follow the prompts to:
1. Create/select project
2. Link git repository
3. Configure build settings (should auto-detect)

### Step 3: Set Environment Variables in Vercel

Go to **Project Settings → Environment Variables** and add:
```
PWORD=your_secure_password
JWT_SECRET=your_jwt_secret
```

### Step 4: Link Vercel KV

```bash
vercel env pull  # Add KV env vars from project
```

Or manually in Vercel Dashboard:
1. Go to **Storage → KV Database**
2. Create new KV database
3. Add the suggested environment variables

### Step 5: Deploy

```bash
vercel --prod
```

Your app will be live at `https://your-project.vercel.app`

## 💾 Data Management

### Exporting Data
1. Go to **Import** tab
2. Look for the export button in Charts tab (or API: GET `/api/entries/export/`)
3. Download CSV file

### Importing Data
1. Go to **Import** tab
2. Select CSV or JSON file
3. Choose import mode:
   - **Merge**: Add to existing entries
   - **Replace**: Replace all entries (⚠️ cannot be undone)
4. Click Import

#### Supported File Formats

**CSV:**
```
Systolic,Diastolic,Pulse,Notes,Timestamp
120,80,72,Morning reading,2024-01-15T08:30:00Z
130,85,75,After exercise,2024-01-15T14:45:00Z
```

**JSON:**
```json
[
  {
    "systolic": 120,
    "diastolic": 80,
    "pulse": 72,
    "notes": "Morning reading",
    "timestamp": "2024-01-15T08:30:00Z"
  }
]
```

## 🔐 Authentication & Security

- Password-protected login
- JWT tokens (7-day expiration)
- Token stored in localStorage
- All API routes require authentication (except `/auth` and `/health`)

**Tokens expire after 7 days** - user will need to log in again.

## 📊 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/` | ❌ | Login with password |
| GET | `/api/health/` | ❌ | Health check |
| GET | `/api/entries/` | ✅ | Get all entries |
| POST | `/api/entries/` | ✅ | Create entry |
| PATCH | `/api/entries/:id/` | ✅ | Update entry |
| DELETE | `/api/entries/:id/` | ✅ | Delete entry |
| GET | `/api/entries/export/` | ✅ | Export as CSV |
| POST | `/api/entries/import/` | ✅ | Import data |

## 🛠️ Troubleshooting

### KV Database Connection Issues
```bash
vercel env pull
vercel dev
```

### Frontend Not Loading
- Check browser console for CORS errors
- Verify API baseURL in `frontend/src/services/api.js`
- Ensure backend is running

### Storage Issues
- Verify Vercel KV is linked: `vercel env` should show `KV_*` variables
- Clear localStorage: DevTools → Application → Storage → Clear

### Build Failures
```bash
# Get logs
vercel logs

# Rebuild
vercel --prod --force
```

## 📝 Notes

- **Environment variables**: Store in root `.env` for local dev, set in Vercel dashboard for production
- **First deployment**: May take 2-3 minutes for initial build
- **Cold starts**: First request after idle period may take 5-10 seconds
- **Data persistence**: Vercel KV data persists indefinitely
- **API caching**: Consider adding caching headers if needed

## 🔄 Migration Checklist

- [ ] Install dependencies
- [ ] Create Vercel account
- [ ] Push code to GitHub
- [ ] Link Vercel project
- [ ] Configure environment variables
- [ ] Link Vercel KV database
- [ ] Test import/export
- [ ] Deploy to production
- [ ] Update bookmarks/shortcuts to new URL

## 📞 Support

For issues:
1. Check deployment logs: `vercel logs`
2. Check KV status: `vercel env list`
3. Test API endpoints: Use Postman or curl
4. Review browser console errors
