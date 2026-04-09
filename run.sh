#!/bin/bash
set -e

echo "Starting Forecast Studio..."
echo ""

# Get the directory of this script
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Backend ──────────────────────────────────────────────────────────────────
echo "[backend] Setting up Python environment..."

cd "$DIR/backend"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  echo "[backend] Virtual environment created."
fi

source .venv/bin/activate

echo "[backend] Installing dependencies..."
pip install -r requirements.txt -q

echo "[backend] Starting uvicorn on port 8000..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd "$DIR"

# ── Frontend ─────────────────────────────────────────────────────────────────
echo ""
echo "[frontend] Installing npm dependencies..."

cd "$DIR/frontend"
npm install --silent

echo "[frontend] Starting Vite dev server on port 3000..."
npm run dev &
FRONTEND_PID=$!

cd "$DIR"

# ── Ready ─────────────────────────────────────────────────────────────────────
echo ""
echo "Forecast Studio is starting up..."
echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Wait a moment then open browser
sleep 3
if command -v open &>/dev/null; then
  open "http://localhost:3000"
elif command -v xdg-open &>/dev/null; then
  xdg-open "http://localhost:3000"
fi

trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
