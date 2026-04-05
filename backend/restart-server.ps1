# Script tự động restart server và kill port conflict
# Sử dụng: .\restart-server.ps1

Write-Host "🔄 Đang restart server..." -ForegroundColor Cyan

# Kill process đang dùng port 3001
Write-Host "🔍 Tìm process đang dùng port 3001..." -ForegroundColor Yellow
$port = 3001
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($processes) {
    foreach ($process in $processes) {
        $pid = $process.OwningProcess
        if ($pid -ne 0) {
            Write-Host "❌ Đang kill process PID: $pid" -ForegroundColor Red
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        }
    }
} else {
    Write-Host "✅ Port $port đang trống" -ForegroundColor Green
}

# Đợi port được giải phóng
Write-Host "⏳ Đợi port được giải phóng..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Khởi động server
Write-Host "🚀 Đang khởi động server..." -ForegroundColor Green
npm run dev
