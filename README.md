# BP Monitor - Blood Pressure Tracking Web App

A secure, single-user blood pressure tracking web application built with Vue 3 (frontend) and Vercel Functions (backend), with automated GitHub backups.

## ✨ Features

- 🔐 **Secure JWT-based authentication** - Password protected login
- 📊 **Interactive charts with BP reference zones** - Visual indicators for normal/elevated/high BP
- 📱 **Mobile-responsive design** - Works perfectly on phones, tablets, and desktops
- 📥 **CSV/JSON export & import** - Download and restore your health data
- 📈 **Statistics dashboard** - Track trends and patterns
- 🔄 **Automated backups** - Daily backups to private GitHub repository
- 🚀 **Serverless deployment** - Scales automatically on Vercel

## 🛠️ Tech Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS + Chart.js
- **Backend**: Vercel Functions (Node.js serverless)
- **Storage**: Upstash Redis (production) / Local file (development)
- **Backups**: GitHub API + Vercel Cron
- **Deployment**: Vercel + GitHub
- **Auth**: JWT tokens

---

## 🚀 Quick Start (2 minutes)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment
```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit `.env` and set your password:
```env
PWORD=your_password_here
JWT_SECRET=your_jwt_secret_here
```

### 3. Start Development Server
```bash
npm run dev
```

**Windows PowerShell Issues?** If you get an execution policy error:
```powershell
npm.cmd run dev
# OR
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. Access Your App

- **Frontend**: http://localhost:5173/
- **API**: http://localhost:3001/api/

Login with the password you set in `.env` ✅

---

## 📂 Project Structure

```
BPMonitor/
├── frontend/               # Vue 3 + Vite frontend
│   ├── src/
│   │   ├── components/    # Vue components (LogBP, Charts, Import)
│   │   ├── services/      # API client (axios)
│   │   └── App.vue        # Main app component
│   ├── package.json
│   └── vite.config.js
├── api/                    # Vercel Functions (serverless backend)
│   ├── lib/
│   │   ├── auth.js        # JWT authentication
│   │   └── kv.js          # Redis/local storage abstraction
│   ├── cron/
│   │   └── backup.js      # Automated GitHub backup
│   ├── entries/
│   │   ├── [id].js        # Update/delete entry
│   │   ├── export.js      # CSV export
│   │   └── import.js      # CSV/JSON import
│   ├── auth.js            # Login endpoint
│   ├── health.js          # Health check
│   ├── entries.js         # CRUD operations
│   └── package.json
├── dev-server.js          # Local development server
├── .env                   # Environment variables (local dev)
├── .env.example           # Environment template
├── vercel.json            # Vercel configuration
└── package.json           # Root package configuration
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/` | ❌ | Login (get JWT token) |
| GET | `/api/health/` | ❌ | Health check |
| GET | `/api/entries/` | ✅ | Get all BP entries |
| POST | `/api/entries/` | ✅ | Create new entry |
| PATCH | `/api/entries/:id/` | ✅ | Update entry |
| DELETE | `/api/entries/:id/` | ✅ | Delete entry |
| GET | `/api/entries/export/` | ✅ | Export as CSV |
| POST | `/api/entries/import/` | ✅ | Import CSV/JSON |
| GET | `/api/cron/backup` | 🔑 | Trigger backup (secret required) |

---

## 📦 Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Node.js 18+

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/bp-monitor.git
git push -u origin main
```

### Step 2: Deploy with Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel auto-detects settings ✅
5. Click "Deploy"

### Step 3: Add Environment Variables

In Vercel Dashboard → **Project Settings → Environment Variables**:

```
PWORD=your_secure_password
JWT_SECRET=your_jwt_secret
CRON_SECRET=your_cron_secret
GITHUB_TOKEN=your_github_token (for backups)
GITHUB_BACKUP_REPO=username/repo-name (for backups)
```

### Step 4: Connect Upstash Redis

1. Go to [Vercel Marketplace](https://vercel.com/integrations/upstash)
2. Install Upstash integration
3. Create Redis database
4. Environment variables are auto-added ✅

### Step 5: Done! 🎉

Your app is live at `https://your-project.vercel.app`

---

## 💾 Data Backup & Import

### Automated GitHub Backups

See [GITHUB_BACKUP.md](./GITHUB_BACKUP.md) for setup instructions.

**Features:**
- ✅ Automatic daily backups (midnight UTC)
- ✅ Change detection (only backs up if data changed)
- ✅ JSON format (directly importable)
- ✅ Version controlled in private GitHub repository

### Manual Export

1. Open app → **Charts** tab
2. Click **Export CSV**
3. Save file to your computer

**Export formats:**
- CSV (for spreadsheets)
- JSON (via API endpoint directly)

### Import Data

1. Go to **Import** tab
2. Select your CSV or JSON file
3. Choose mode:
   - **Merge**: Add to existing entries
   - **Replace**: Overwrite all data (⚠️ careful!)
4. Click **Import**

**Supported file formats:**

**CSV:**
```csv
Systolic,Diastolic,Pulse,Notes,Timestamp
120,80,72,Morning reading,2024-01-15T08:30:00Z
130,85,75,"After exercise, feeling good",2024-01-15T14:45:00Z
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

---

## 🔧 Development

### Quick Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers (frontend + API) |
| `npm run dev:api` | Start API server only |
| `npm run dev:frontend` | Start frontend only |
| `npm run build` | Build for production |
| `npm run install:all` | Install all dependencies |

### Local Data Storage

- **Development**: Uses `bp-data.json` file in project root
- **Production**: Uses Upstash Redis (configured in Vercel)
- Auto-switches based on environment ✅

### Environment Variables

**Local (.env):**
```env
PWORD=your_password
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

**Production (Vercel):**
- Same as above, plus:
- `UPSTASH_REDIS_REST_URL` (auto-configured)
- `UPSTASH_REDIS_REST_TOKEN` (auto-configured)
- `CRON_SECRET` (for backup endpoint)
- `GITHUB_TOKEN` (for backups)
- `GITHUB_BACKUP_REPO` (for backups)

---

## 🐛 Troubleshooting

### Can't Log In
1. Check `.env` file has correct `PWORD`
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser localStorage (DevTools → Application → Storage)

### PowerShell Execution Policy Error
```powershell
# Option 1: Use npm.cmd
npm.cmd run dev

# Option 2: Fix policy (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use
```powershell
# Windows: Kill process on port
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process

# Or close terminal and restart
```

### API Not Responding
1. Verify API is running: http://localhost:3001/api/health/
2. Check terminal for error messages
3. Ensure `.env` file exists

### Data Not Persisting on Vercel
1. Check Upstash Redis integration is installed
2. Verify environment variables are set
3. Check Vercel deployment logs

### Import Not Working
- Ensure CSV has correct headers: `Systolic,Diastolic,Pulse,Notes,Timestamp`
- Check that commas in notes are properly quoted
- Try JSON format instead if CSV fails

---

## 🔐 Security Notes

- ✅ All API routes require JWT authentication (except `/auth` and `/health`)
- ✅ JWT tokens expire after 7 days
- ✅ Password stored in environment variables only
- ✅ Data encrypted at rest (Upstash Redis)
- ✅ HTTPS enforced on Vercel
- ⚠️ Single password for all users (single-user app by design)
- ⚠️ Change `PWORD` to invalidate all existing tokens

---

## 📄 License

MIT

---

## 🆘 Support

Need help?
1. Check this README thoroughly
2. Review [GITHUB_BACKUP.md](./GITHUB_BACKUP.md) for backup setup
3. Check browser console for errors
4. Review Vercel deployment logs
