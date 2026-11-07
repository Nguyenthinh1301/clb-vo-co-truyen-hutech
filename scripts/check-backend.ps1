# ============================================
# Script kiểm tra và khởi động Backend
# ============================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Backend Health Check & Start" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Cấu hình
$BACKEND_URL = "http://localhost:3001"
$HEALTH_ENDPOINT = "$BACKEND_URL/health"
$BACKEND_DIR = Join-Path $PSScriptRoot "..\backend"
$MAX_WAIT_TIME = 30  # seconds

# Function kiểm tra backend có đang chạy không
function Test-BackendRunning {
    try {
        $response = Invoke-WebRequest -Uri $HEALTH_ENDPOINT -Method GET -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# Function đợi backend khởi động
function Wait-BackendStart {
    param([int]$MaxSeconds = 30)
    
    Write-Host "⏳ Đang đợi backend khởi động..." -ForegroundColor Yellow
    $elapsed = 0
    while ($elapsed -lt $MaxSeconds) {
        if (Test-BackendRunning) {
            return $true
        }
        Start-Sleep -Seconds 1
        $elapsed++
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    Write-Host ""
    return $false
}

# Bước 1: Kiểm tra backend có đang chạy không
Write-Host "🔍 Kiểm tra backend tại: $BACKEND_URL" -ForegroundColor White
if (Test-BackendRunning) {
    Write-Host "✅ Backend đang chạy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Thông tin:" -ForegroundColor Cyan
    Write-Host "   URL: $BACKEND_URL" -ForegroundColor White
    Write-Host "   Health: $HEALTH_ENDPOINT" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host "❌ Backend chưa chạy!" -ForegroundColor Red
Write-Host ""

# Bước 2: Hỏi người dùng có muốn khởi động không
Write-Host "💡 Bạn có muốn khởi động backend không? (Y/N)" -ForegroundColor Yellow
$response = Read-Host "Nhập lựa chọn"

if ($response -ne "Y" -and $response -ne "y") {
    Write-Host "⏸️  Đã hủy. Backend không được khởi động." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Để khởi động thủ công, chạy lệnh:" -ForegroundColor Cyan
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Bước 3: Kiểm tra thư mục backend
if (-not (Test-Path $BACKEND_DIR)) {
    Write-Host "❌ Không tìm thấy thư mục backend: $BACKEND_DIR" -ForegroundColor Red
    exit 1
}

# Bước 4: Kiểm tra node_modules
$nodeModulesPath = Join-Path $BACKEND_DIR "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "⚠️  Chưa cài đặt dependencies!" -ForegroundColor Yellow
    Write-Host "📦 Đang cài đặt npm packages..." -ForegroundColor Cyan
    
    Push-Location $BACKEND_DIR
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Lỗi khi cài đặt npm packages!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "✅ Đã cài đặt dependencies!" -ForegroundColor Green
}

# Bước 5: Kiểm tra file .env
$envPath = Join-Path $BACKEND_DIR ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "⚠️  Không tìm thấy file .env!" -ForegroundColor Yellow
    Write-Host "📝 Hãy tạo file .env trong thư mục backend" -ForegroundColor Cyan
    exit 1
}

# Bước 6: Khởi động backend trong terminal mới
Write-Host ""
Write-Host "🚀 Đang khởi động backend..." -ForegroundColor Cyan

# Tạo script tạm để chạy trong terminal mới
$tempScript = Join-Path $env:TEMP "start-backend-temp.ps1"
$scriptContent = @"
Set-Location '$BACKEND_DIR'
Write-Host '=====================================' -ForegroundColor Cyan
Write-Host '   Backend Server Starting...' -ForegroundColor Cyan
Write-Host '=====================================' -ForegroundColor Cyan
Write-Host ''
Write-Host '📍 Directory: $BACKEND_DIR' -ForegroundColor White
Write-Host '🌐 URL: http://localhost:3001' -ForegroundColor White
Write-Host ''
Write-Host '⚠️  QUAN TRỌNG: Không đóng cửa sổ này!' -ForegroundColor Yellow
Write-Host ''
npm run dev
"@

$scriptContent | Out-File -FilePath $tempScript -Encoding UTF8

# Khởi động trong terminal mới
Start-Process powershell -ArgumentList "-NoExit", "-File", $tempScript

# Bước 7: Đợi backend khởi động
if (Wait-BackendStart -MaxSeconds $MAX_WAIT_TIME) {
    Write-Host ""
    Write-Host "✅ Backend đã khởi động thành công!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Thông tin:" -ForegroundColor Cyan
    Write-Host "   URL: $BACKEND_URL" -ForegroundColor White
    Write-Host "   Health: $HEALTH_ENDPOINT" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Bạn có thể mở trình duyệt và test admin login ngay!" -ForegroundColor Yellow
    Write-Host ""
    
    # Hỏi có muốn mở browser không
    Write-Host "🌐 Mở trang admin login? (Y/N)" -ForegroundColor Yellow
    $openBrowser = Read-Host "Nhập lựa chọn"
    if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
        Start-Process "http://localhost:5500/website/admin/index.html"
    }
    
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ Backend không khởi động được sau $MAX_WAIT_TIME giây!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Các bước khắc phục:" -ForegroundColor Yellow
    Write-Host "   1. Kiểm tra terminal backend có lỗi gì không" -ForegroundColor White
    Write-Host "   2. Kiểm tra port 3001 có bị chiếm dụng không" -ForegroundColor White
    Write-Host "   3. Kiểm tra file .env có đúng không" -ForegroundColor White
    Write-Host "   4. Kiểm tra database connection" -ForegroundColor White
    Write-Host ""
    exit 1
}
