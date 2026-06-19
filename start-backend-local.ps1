# ============================================================
# Khởi động Backend Local cho Development
# ============================================================
# Script này khởi động backend trên localhost:3001
# Dùng khi test admin panel với Live Server (Go Live)
# ============================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KHỞI ĐỘNG BACKEND LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "[1/5] Kiểm tra Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  Node.js KHÔNG được cài đặt!" -ForegroundColor Red
    Write-Host "  Tải tại: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if backend directory exists
Write-Host "[2/5] Kiểm tra thư mục backend..." -ForegroundColor Yellow
$backendPath = "d:\Code\ThongTin-VCT\backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "  Không tìm thấy thư mục backend!" -ForegroundColor Red
    exit 1
}
Write-Host "  Thư mục backend: OK" -ForegroundColor Green

Write-Host ""

# Check if node_modules exists
Write-Host "[3/5] Kiểm tra dependencies..." -ForegroundColor Yellow
$nodeModules = Join-Path $backendPath "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "  node_modules chưa có, đang cài đặt..." -ForegroundColor Yellow
    Push-Location $backendPath
    npm install
    Pop-Location
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Cài đặt thất bại!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Cài đặt thành công!" -ForegroundColor Green
} else {
    Write-Host "  Dependencies: OK" -ForegroundColor Green
}

Write-Host ""

# Check if port 3001 is already in use
Write-Host "[4/5] Kiểm tra port 3001..." -ForegroundColor Yellow
$portInUse = Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($portInUse) {
    Write-Host "  Port 3001 đang được sử dụng!" -ForegroundColor Yellow
    Write-Host "  Backend có thể đã chạy rồi." -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Kiểm tra: http://localhost:3001/health" -ForegroundColor Cyan
    
    $choice = Read-Host "  Bạn có muốn kill process và restart không? (y/n)"
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        Write-Host "  Đang tìm và kill process..." -ForegroundColor Yellow
        $processes = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $processes) {
            Stop-Process -Id $pid -Force
            Write-Host "  Đã kill process PID: $pid" -ForegroundColor Green
        }
        Start-Sleep -Seconds 2
    } else {
        Write-Host "  Thoát script. Backend có thể đã chạy." -ForegroundColor Gray
        exit 0
    }
} else {
    Write-Host "  Port 3001: Available" -ForegroundColor Green
}

Write-Host ""

# Start backend
Write-Host "[5/5] Khởi động backend..." -ForegroundColor Yellow
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  BACKEND ĐANG KHỞI ĐỘNG..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "  API URL:      http://localhost:3001/api" -ForegroundColor Cyan
Write-Host "  Health check: http://localhost:3001/health" -ForegroundColor Cyan
Write-Host "  Environment:  development" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Để DỪNG backend: Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Change to backend directory and start
Push-Location $backendPath

# Chạy npm run dev (với nodemon - auto reload)
npm run dev

Pop-Location
