#!/usr/bin/env bash
# ==============================================================================
# TRANSPORT COMPANY COMPUTERIZATION (TCC) - UNIX/LINUX/MACOS LAUNCHER
# ==============================================================================

set -e

echo "======================================================================"
echo "  TRANSPORT COMPANY COMPUTERIZATION (TCC) - LAUNCHER"
echo "======================================================================"

command -v node >/dev/null 2>&1 || { echo "[ERROR] Node.js is not installed. Visit https://nodejs.org"; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[1/3] Preparing Backend Server..."
cd "$ROOT_DIR/server"
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi
if [ ! -f ".env" ]; then
    cp .env.example .env
fi
echo "Seeding demo database..."
npm run seed

echo "[2/3] Preparing Frontend Client..."
cd "$ROOT_DIR/client"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "[3/3] Starting Servers in parallel..."
cd "$ROOT_DIR"
(cd server && npm run dev) &
BACKEND_PID=$!
sleep 3
(cd client && npm run dev) &
FRONTEND_PID=$!

echo "======================================================================"
echo "  TCC IS RUNNING!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo "  Manager:  manager@tcc.com / Manager@123"
echo "======================================================================"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
