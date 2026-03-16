# Quick Start Guide

Get your BP Monitor running locally in under 2 minutes!

## First Time Setup

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
JWT_SECRET=your_secret_key_here
```

### 3. Start Development Server
```bash
npm run dev
```

**Windows PowerShell Issues?** If you get an execution policy error, use:
```powershell
npm.cmd run dev
# OR run the batch file
dev.bat
```

That's it! 🎉

## Access Your App

- **Frontend**: http://localhost:5173/
- **API**: http://localhost:3001/api/

Login with the password you set in `.env`

## What Happens on Startup?

The `npm run dev` command:
1. ✅ Starts the API server (Node.js/Express on port 3001)
2. ✅ Starts the frontend dev server (Vite on port 5173)
3. ✅ Uses local file storage (`bp-data.json`) for data
4. ✅ Hot-reloads both frontend and backend on changes

## Quick Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers |
| `npm run dev:api` | Start API only |
| `npm run dev:frontend` | Start frontend only |
| `npm run build` | Build for production |
| `npm run install:all` | Install all dependencies |

## Data Storage

### Local Development
- Uses `bp-data.json` file in project root
- Automatically created on first entry
- Safe to delete for fresh start

### Production (Vercel)
- Uses Vercel KV (Redis)
- Automatically switches when deployed

## Troubleshooting

### PowerShell Execution Policy Error
If you see "scripts is disabled on this system":

**Option 1 - Use npm.cmd:**
```powershell
npm.cmd run dev
```

**Option 2 - Fix permanently (run as Administrator):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use
If you see EADDRINUSE error:

**Kill the process:**
```powershell
# Windows
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process

# Or just close the terminal and restart
```

### Can't Log In
1. Check `.env` file has your password
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser localStorage (DevTools → Application → Storage)

### Frontend Not Loading
1. Make sure both servers are running (you should see colorful output)
2. Check http://localhost:5173/ is accessible
3. Check browser console for errors

### API Errors
1. Verify API is running: http://localhost:3001/api/health/
2. Check terminal output for error messages
3. Ensure `.env` file exists

## Next Steps

- **Export your data**: Charts tab → Export CSV
- **Import backup**: Import tab → Upload CSV/JSON
- **Deploy to Vercel**: See [VERCEL_SETUP.md](./VERCEL_SETUP.md)

## Support

If you encounter issues:
1. Check the terminal output for errors
2. Read [README.md](./README.md) for detailed documentation
3. Review [VERCEL_SETUP.md](./VERCEL_SETUP.md) for deployment help
