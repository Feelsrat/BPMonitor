# BP Monitor - Blood Pressure Tracking Web App

A secure, single-user blood pressure tracking web application built with Vue 3 (frontend) and Django (backend), designed to run on Fly.io.

## Features

- 🔐 **Secure JWT-based authentication** - Password stored only as environment variable
- 📊 **Interactive charts with BP reference zones** - Visual indicators for normal/elevated/high BP
- 📱 **Mobile-responsive design** - Works perfectly on phones, tablets, and desktops
- 📥 **CSV export** - Download all your health data
- 📈 **Statistics dashboard** - 7-day averages and trends
- ✅ **Cost-effective** - Runs on single Fly.io machine (shared CPU)

## Tech Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS + Chart.js
- **Backend**: Django + Django REST Framework + PostgreSQL
- **Deployment**: Docker + Fly.io
- **Auth**: JWT tokens (djangorestframework-simplejwt)

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+ (for frontend development)
- uv (Python package manager) - install with: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- PostgreSQL (local database for development)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a .env file from the example
cp ../.env.example .env

# Edit .env with local settings (at minimum set BPAPP_PASSWORD)
# For local dev, you can set:
# - BPAPP_PASSWORD=dev-password
# - DATABASE_URL or DB_* variables pointing to your local PostgreSQL
# - DEBUG=true

# Install dependencies with uv
uv sync

# Run migrations
uv run python manage.py migrate

# Create a superuser (optional, for admin panel)
uv run python manage.py createsuperuser

# Run development server
uv run python manage.py runserver 0.0.0.0:8000
```

The backend will be available at `http://localhost:8000` and the API at `http://localhost:8000/api/`

### Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm ci

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Testing Locally

1. Open your browser to `http://localhost:5173`
2. The frontend is configured to proxy API calls to `http://localhost:8000`
3. Login with the password you set in `.env` (e.g., `dev-password`)
4. Add some blood pressure entries
5. View charts and export data

## Deployment to Fly.io

### Prerequisites

- Fly.io account (sign up at https://fly.io)
- Fly CLI installed: `curl -L https://fly.io/install.sh | sh`
- Docker installed (for building locally) or rely on Fly.io's builder

### Step-by-Step Deployment

1. **Install and authenticate with Fly.io**:
   ```bash
   flyctl auth login
   ```

2. **Create a Fly.io app** (first time only):
   ```bash
   flyctl launch --no-deploy
   ```
   - App name: Choose `bpmonitor` or similar
   - Region: Choose closest to you (default is fine)
   - PostgreSQL: When asked, choose "Yes, create a PostgreSQL database"

3. **Set environment secrets**:
   ```bash
   # Generate strong random values
   BPAPP_PASSWORD=$(openssl rand -base64 32)
   SECRET_KEY=$(openssl rand -base64 64)
   
   # Set them in Fly.io
   flyctl secrets set BPAPP_PASSWORD="$BPAPP_PASSWORD"
   flyctl secrets set SECRET_KEY="$SECRET_KEY"
   
   # Save these somewhere safe if you need to login again
   echo "PASSWORD: $BPAPP_PASSWORD"
   echo "SECRET_KEY: $SECRET_KEY"
   ```

4. **Update fly.toml** (if needed):
   - The included `fly.toml` is pre-configured for single machine
   - Ensure `machines.count = 1` for cost savings
   - Set your app name in the `app` field

5. **Deploy**:
   ```bash
   flyctl deploy
   ```

6. **Run migrations** (first time or after schema changes):
   ```bash
   flyctl ssh console -c "uv run python manage.py migrate"
   ```

7. **Get your app URL**:
   ```bash
   flyctl info
   ```
   Your app is now live at `https://your-app-name.fly.dev`

### After Deployment

- Update `CORS_ALLOWED_ORIGINS` if needed: `flyctl secrets set CORS_ALLOWED_ORIGINS="https://your-app-name.fly.dev"`
- Login to your live app with the password you set
- Add blood pressure entries and verify charts work

## Data Persistence

Your blood pressure data is stored in PostgreSQL on Fly.io:

- **Persistent**: Data survives app restarts and redeployments
- **Managed**: Fly.io handles backups and maintenance
- **Secure**: Database is only accessible from your app

### Backing Up Data

To download all your data as CSV:

1. Login to your app
2. Navigate to the "Charts" tab
3. Click "📥 Export CSV"
4. Your data will download as `bp_export_YYYY-MM-DD.csv`

### Manual Database Backup

```bash
# Connect to database
flyctl postgres connect -a your-app-name-db

# Then run PostgreSQL backup commands as needed
```

## Security Notes

- ⚠️ **Never commit `.env` to git** - Fly.io secrets are stored separately
- ⚠️ **BPAPP_PASSWORD is for this app only** - Don't reuse passwords from other services
- ⚠️ **JWT tokens expire in 24 hours** - You'll need to login again after that
- ⚠️ **CORS is locked to your domain** - No unauthorized access from other domains
- ✅ **All data transmitted over HTTPS** on Fly.io (auto-configured)

## Troubleshooting

### Local Dev Issues

**"ModuleNotFoundError: No module named 'django'"**
- Make sure you ran `uv sync` in the `backend/` directory

**"Connection refused" from frontend to backend**
- Ensure Docker isn't interfering; check ports 8000 and 5173 are free
- Verify the proxy in `vite.config.js` points to the backend

**PostgreSQL connection errors**
- Ensure PostgreSQL is running: `brew services start postgresql` (macOS)
- Check your DB_* settings in `.env`
- Reset DB: `dropdb bpmonitor && createdb bpmonitor` (will clear all data)

### Fly.io Deployment Issues

**"Error: Build failed"**
- Check build logs: `flyctl logs --instance=current`
- Ensure Docker build succeeds locally: `docker build -t bpmonitor .`

**"Database connection timeout"**
- Ensure PostgreSQL addon was created during `flyctl launch`
- Check addon status: `flyctl postgres list`
- Verify database is running: `flyctl postgres status`

**"LoginTab shows 401 Unauthorized"**
- Verify `BPAPP_PASSWORD` secret is set: `flyctl secrets list`
- Check you're using the correct password
- Remember to set secrets before deploying

**"Charts don't show data"**
- Make sure migrations ran: `flyctl ssh console -c "uv run python manage.py migrate"`
- Check recent logs: `flyctl logs`

## Development Notes

### Adding New Fields to Blood Pressure Entries

1. Edit `backend/tracker/models.py` - add field to `BPEntry`
2. Create and run migrations:
   ```bash
   cd backend
   uv run python manage.py makemigrations
   uv run python manage.py migrate
   ```
3. Update `backend/tracker/serializers.py` if needed
4. Update frontend components in `frontend/src/components/`

### Customizing Chart Colors

Edit `frontend/src/components/ChartsTab.vue` - look for `borderColor` and `backgroundColor` in the `datasets` array.

### Adjusting BP Reference Zones

To change what counts as "normal" vs "elevated" vs "high":
- Edit the legend in `ChartsTab.vue` (currently: <120/<80 normal, 120-139/80-89 elevated, ≥140/≥90 high)
- This is educational information; consult with a healthcare provider for personalized recommendations

## License

Personal use only. Built for tracking your own health. ❤️

---

## Support & Questions

If you run into issues:

1. Check the troubleshooting section above
2. Review Fly.io docs: https://fly.io/docs
3. Django REST Framework docs: https://www.django-rest-framework.org
4. Vue 3 docs: https://vuejs.org
