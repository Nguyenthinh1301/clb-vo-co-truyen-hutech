# Simple Backend Starter — mở backend (npm run dev) trong cửa sổ PowerShell riêng
# Đường dẫn tính theo vị trí script → chạy được trên mọi máy clone repo
$BACKEND_DIR = (Resolve-Path (Join-Path $PSScriptRoot "..\backend")).Path

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Starting Backend Server" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend directory exists
if (-not (Test-Path $BACKEND_DIR)) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Chỉ dừng tiến trình đang chiếm cổng 3001 (KHÔNG tắt mọi tiến trình node trên máy —
# việc đó sẽ tắt luôn Live Server, extension VS Code và các ứng dụng Node khác)
Write-Host "🧹 Cleaning up old backend on port 3001..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1

# Start backend
Write-Host "🚀 Starting backend on port 3001..." -ForegroundColor Green
Write-Host "📁 Directory: $BACKEND_DIR" -ForegroundColor Gray
Write-Host ""

Set-Location $BACKEND_DIR

# Start in new window
$process = Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Set-Location '$BACKEND_DIR'
Write-Host '=====================================' -ForegroundColor Cyan
Write-Host '   Backend Server' -ForegroundColor Cyan
Write-Host '=====================================' -ForegroundColor Cyan
Write-Host ''
Write-Host '🌐 URL: http://localhost:3001' -ForegroundColor White
Write-Host '📍 Directory: $BACKEND_DIR' -ForegroundColor Gray
Write-Host ''
Write-Host '⚠️  DO NOT CLOSE THIS WINDOW!' -ForegroundColor Yellow
Write-Host ''
npm run dev
"@ -PassThru

Write-Host "✅ Backend process started (PID: $($process.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Waiting for backend to be ready..." -ForegroundColor Yellow

# Wait and check
Start-Sleep -Seconds 3

for ($i = 1; $i -le 15; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Host ""
            Write-Host "✅ Backend is READY!" -ForegroundColor Green
            Write-Host "🌐 URL: http://localhost:3001" -ForegroundColor White
            Write-Host "❤️  Health: http://localhost:3001/health" -ForegroundColor White
            Write-Host ""
            Write-Host "💡 You can now use admin login!" -ForegroundColor Cyan
            exit 0
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

Write-Host ""
Write-Host "⚠️  Backend started but not responding yet" -ForegroundColor Yellow
Write-Host "   Check the backend window for errors" -ForegroundColor Gray
Write-Host ""
