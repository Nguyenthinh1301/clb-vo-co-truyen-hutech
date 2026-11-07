# Simple Backend Starter
$BACKEND_DIR = "d:\Code\ThongTin-VCT\backend"
$LOG_FILE = "d:\Code\ThongTin-VCT\backend\server.log"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Starting Backend Server" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend directory exists
if (-not (Test-Path $BACKEND_DIR)) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Kill any existing node processes
Write-Host "🧹 Cleaning up old processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Start backend
Write-Host "🚀 Starting backend on port 3001..." -ForegroundColor Green
Write-Host "📁 Directory: $BACKEND_DIR" -ForegroundColor Gray
Write-Host "📝 Log file: $LOG_FILE" -ForegroundColor Gray
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
