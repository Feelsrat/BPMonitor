# BP Monitor Automated Backup

This project supports two backup methods:

1. **Vercel Cron Jobs** (Recommended) - Automatic daily backups on Vercel's servers
2. **Local Script** - Manual or scheduled backups to your computer

---

## Method 1: Vercel Cron Jobs (Recommended) ⭐

Automatic daily backups that run on Vercel's servers - no local computer needed!

### Setup

1. **Add environment variable in Vercel Dashboard:**
   ```
   CRON_SECRET=your-secret-key-here
   ```
   (Generate a random secret, like a long password)

2. **Optional - Email backups:**
   ```
   BACKUP_EMAIL=your@email.com
   ```
   (Requires email service integration)

3. **Deploy:**
   ```bash
   git push origin main
   ```

### How it works

- Runs daily at midnight (UTC): `0 0 * * *`
- Creates CSV and JSON backup
- Accessible at: `https://your-app.vercel.app/api/cron/backup`
- Can send to email or webhook (if configured)

### Change schedule

Edit `vercel.json` cron schedule:
```json
"schedule": "0 */12 * * *"  // Every 12 hours
"schedule": "0 0 * * 0"     // Weekly (Sundays)
"schedule": "0 0 1 * *"     // Monthly
```

### Manual trigger

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/backup
```

---

## Method 2: Local Script Backup

This script automatically backs up your blood pressure data from Vercel to your local computer.

## Quick Setup

### 1. Get Your Auth Token

1. Open your BP Monitor in the browser (Vercel URL)
2. Log in with your password
3. Press `F12` to open DevTools
4. Go to **Application** tab → **Storage** → **Local Storage**
5. Find the key `authToken` and copy its value

### 2. Set Environment Variables

**Windows (PowerShell):**
```powershell
# Set your Vercel app URL (replace with your actual URL)
$env:BACKUP_API_URL = "https://your-app-name.vercel.app/api"

# Set your auth token (paste the token from step 1)
$env:BACKUP_AUTH_TOKEN = "your-token-here"
```

**Or create a `.env` file** in the project root:
```
BACKUP_API_URL=https://your-app-name.vercel.app/api
BACKUP_AUTH_TOKEN=your-token-here
```

### 3. Run Backup Manually

**Windows:**
```powershell
node backup.js
```

Or just double-click `backup.bat`

## Automatic Scheduled Backups

### Windows Task Scheduler

1. Open **Task Scheduler** (search in Start menu)
2. Click **Create Basic Task**
3. Name it "BP Monitor Backup"
4. Trigger: **Daily** (or your preference)
5. Action: **Start a program**
   - Program: `node.exe`
   - Arguments: `backup.js`
   - Start in: `C:\Users\jurir\BPMonitor` (your project path)
6. Finish and test it!

### Alternative: Simple Scheduled Task

Create a PowerShell script `run-backup.ps1`:
```powershell
cd C:\Users\jurir\BPMonitor
$env:BACKUP_API_URL = "https://your-app.vercel.app/api"
$env:BACKUP_AUTH_TOKEN = "your-token-here"
node backup.js
```

Then schedule it to run daily at 11:59 PM:
```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\Users\jurir\BPMonitor\run-backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At "11:59 PM"
Register-ScheduledTask -TaskName "BP Monitor Backup" -Action $action -Trigger $trigger
```

## Backup Files

Backups are saved to the `backups/` folder:
- `bp-backup-2026-03-16T12-30-00.csv` (CSV format)
- `bp-backup-2026-03-16T12-30-00.json` (JSON format)

**Retention:** Script keeps the last 30 backups and automatically deletes older ones.

## Manual Restore

If you need to restore:
1. Go to your BP Monitor app
2. Click **Import** tab
3. Select a backup CSV file from `backups/` folder
4. Choose **Merge** or **Replace**
5. Click Import

## Troubleshooting

### "No AUTH_TOKEN found"
- Make sure you set the environment variable
- Token expires after 7 days - get a new one from the browser

### "Failed to fetch data"
- Check your `BACKUP_API_URL` is correct
- Make sure you're logged in (token is valid)
- Check your internet connection

### "No data to backup"
- Your BP Monitor database might be empty
- Check the Vercel app to confirm there's data

## Security Note

⚠️ Your auth token is sensitive! Don't commit `.env` files to git (already in `.gitignore`)
