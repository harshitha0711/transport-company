# ======================================================================
#   TRANSPORT COMPANY COMPUTERIZATION (TCC) - POWERSHELL LAUNCHER
# ======================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  TRANSPORT COMPANY COMPUTERIZATION (TCC) - LAUNCHER" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node
try {
    $nodeVer = node -v
    Write-Host "[1/4] Node.js detected: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH! Visit https://nodejs.org" -ForegroundColor Red
    pause
    exit 1
}

$root = $PSScriptRoot

# 2. Backend setup
Write-Host "`n[2/4] Ensuring Backend dependencies & MongoDB seeding..." -ForegroundColor Yellow
Set-Location "$root\server"
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend packages..."
    npm install
}
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..."
    Copy-Item ".env.example" ".env"
}
Write-Host "Seeding database..." -ForegroundColor Yellow
npm run seed

# 3. Frontend setup
Write-Host "`n[3/4] Ensuring Frontend dependencies..." -ForegroundColor Yellow
Set-Location "$root\client"
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing client packages..."
    npm install
}

# 4. Launch servers in parallel
Write-Host "`n[4/4] Starting Backend (port 5000) and Frontend (port 3000)..." -ForegroundColor Green
Set-Location "$root"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; npm run dev"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; npm run dev"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  TCC IS NOW RUNNING!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "  DEMO CREDENTIALS:" -ForegroundColor Yellow
Write-Host "  Manager: manager@tcc.com / Manager@123" -ForegroundColor White
Write-Host "  Staff:   staff@tcc.com   / Staff@123" -ForegroundColor White
Write-Host "  Admin:   admin@tcc.com   / Admin@123" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan
