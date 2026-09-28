@echo off
title Transport Company Computerization (TCC) Launcher
echo ======================================================================
echo   TRANSPORT COMPANY COMPUTERIZATION (TCC) - ONE-CLICK LAUNCHER
echo ======================================================================
echo.

echo [1/4] Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH! Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/4] Ensuring Backend dependencies and database seeding...
cd /d "%~dp0server"
if not exist node_modules (
    echo Installing server packages...
    call npm install
)
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
)
echo Seeding initial demo data into MongoDB...
call npm run seed

echo.
echo [3/4] Ensuring Frontend dependencies...
cd /d "%~dp0client"
if not exist node_modules (
    echo Installing client packages...
    call npm install
)

echo.
echo [4/4] Starting Backend and Frontend Servers...
cd /d "%~dp0"
start "TCC Backend Server (Port 5000)" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
start "TCC Frontend Client (Port 3000)" cmd /k "cd client && npm run dev"

echo.
echo ======================================================================
echo   TCC IS RUNNING!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo.
echo   DEMO CREDENTIALS:
echo   Manager: manager@tcc.com / Manager@123
echo   Staff:   staff@tcc.com   / Staff@123
echo   Admin:   admin@tcc.com   / Admin@123
echo ======================================================================
echo.
pause
