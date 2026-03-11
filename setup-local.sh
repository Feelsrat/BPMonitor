#!/bin/bash
# Local development setup script for BP Monitor

set -e

echo "=========================================="
echo "BP Monitor - Local Development Setup"
echo "=========================================="
echo ""

# Check Python
echo "✓ Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 3 not found. Please install Python 3.11+"
    exit 1
fi
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "  Found Python $PYTHON_VERSION"

# Check Node
echo "✓ Checking Node..."
if ! command -v node &> /dev/null; then
    echo "✗ Node not found. Please install Node.js 18+"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "  Found $NODE_VERSION"

# Check uv
echo "✓ Checking uv..."
if ! command -v uv &> /dev/null; then
    echo "✗ uv not found. Installing..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

echo ""
echo "=========================================="
echo "Setting up Backend"
echo "=========================================="
echo ""

cd backend

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
DEBUG=true
BPAPP_PASSWORD=dev-password
SECRET_KEY=dev-secret-key-change-in-production
DATABASE_URL=postgres://postgres@localhost/bpmonitor
DB_NAME=bpmonitor
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8000
EOF
    echo "✓ Created .env"
fi

echo "Installing Python dependencies..."
uv sync
echo "✓ Dependencies installed"

echo ""
echo "Running database migrations..."
uv run python manage.py migrate
echo "✓ Migrations complete"

echo ""
echo "=========================================="
echo "Setting up Frontend"
echo "=========================================="
echo ""

cd ../frontend

echo "Installing Node dependencies..."
npm ci
echo "✓ Dependencies installed"

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "To start local development, run in separate terminals:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && uv run python manage.py runserver 0.0.0.0:8000"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo "Login with password: dev-password"
echo ""
