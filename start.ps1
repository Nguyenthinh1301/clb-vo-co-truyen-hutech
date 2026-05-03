# ╔══════════════════════════════════════════╗
# ║   CLB Võ Cổ Truyền HUTECH - Start All   ║
# ╚══════════════════════════════════════════╝

Write-Host ""
Write-Host "🚀 Đang khởi động hệ thống..." -ForegroundColor Cyan

# Kiểm tra Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Không tìm thấy Node.js. Vui lòng cài đặt Node.js trước." -ForegroundColor Red
    exit 1
}

# Khởi động Backend (port 3001)
Write-Host ""
Write-Host "⚙️  Khởi động Backend API (port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 2

# Khởi động Web Server (port 8080)
Write-Host "🌐 Khởi động Web Server (port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; node serve.js" -WindowStyle Normal

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅ Hệ thống đã khởi động thành công!  ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  🌐 Website  : http://localhost:8080     ║" -ForegroundColor Green
Write-Host "║  🔐 Admin    : http://localhost:8080/admin/ ║" -ForegroundColor Green
Write-Host "║  ⚙️  Backend  : http://localhost:3001    ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  📧 Email    : admin@vocotruyenhutech... ║" -ForegroundColor Green
Write-Host "║  🔑 Password : Admin@123456              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
