# Restart Backend Script
# Script để restart backend và clear rate limit

Write-Host "🔄 Đang restart backend..." -ForegroundColor Cyan
Write-Host ""

# Kill all node processes
Write-Host "1️⃣ Dừng tất cả Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Check if port 3000 is free
Write-Host "2️⃣ Kiểm tra port 3000..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "   ⚠️  Port 3000 vẫn đang được sử dụng, đang giải phóng..." -ForegroundColor Red
    $pid = $port3000.OwningProcess
    Stop-Process -Id $pid -Force
    Start-Sleep -Seconds 2
}

Write-Host "   ✅ Port 3000 đã sẵn sàng" -ForegroundColor Green
Write-Host ""

# Start backend
Write-Host "3️⃣ Khởi động backend..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Backend sẽ chạy trong terminal này." -ForegroundColor Cyan
Write-Host "💡 Để dừng backend, nhấn Ctrl + C" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Backend URL: http://localhost:3000" -ForegroundColor Green
Write-Host "🔐 Login URL: http://localhost:3000/website/views/account/dang-nhap.html" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Change to backend directory and start
Set-Location -Path $PSScriptRoot
npm start
