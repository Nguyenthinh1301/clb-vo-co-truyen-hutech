# ===================================================================
# 🥋 CLB VÕ CỔ TRUYỀN HUTECH - SYSTEM STARTUP SCRIPT
# ===================================================================
# Script tự động khởi động toàn bộ hệ thống
# Tác giả: Kiro AI Assistant
# Ngày tạo: $(Get-Date -Format "dd/MM/yyyy")
# ===================================================================

Write-Host "🥋 ===== CLB VÕ CỔ TRUYỀN HUTECH SYSTEM STARTUP =====" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Node.js
Write-Host "🔍 Kiểm tra Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js chưa được cài đặt!" -ForegroundColor Red
    Write-Host "   Vui lòng cài đặt Node.js từ: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Kiểm tra npm
Write-Host "🔍 Kiểm tra npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm không khả dụng!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📁 Chuẩn bị khởi động hệ thống..." -ForegroundColor Cyan

# Kiểm tra thư mục backend
if (-not (Test-Path "backend")) {
    Write-Host "❌ Không tìm thấy thư mục backend!" -ForegroundColor Red
    exit 1
}

# Kiểm tra thư mục website
if (-not (Test-Path "website")) {
    Write-Host "❌ Không tìm thấy thư mục website!" -ForegroundColor Red
    exit 1
}

# Cài đặt dependencies cho backend
Write-Host ""
Write-Host "📦 Cài đặt dependencies cho Backend..." -ForegroundColor Yellow
Set-Location backend
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Đang cài đặt npm packages..." -ForegroundColor Gray
        npm install --silent
        Write-Host "✅ Backend dependencies đã được cài đặt" -ForegroundColor Green
    } else {
        Write-Host "✅ Backend dependencies đã có sẵn" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Lỗi khi cài đặt backend dependencies!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Kiểm tra file .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Không tìm thấy file .env, sao chép từ .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Đã tạo file .env từ template" -ForegroundColor Green
    } else {
        Write-Host "❌ Không tìm thấy file .env.example!" -ForegroundColor Red
    }
}

Set-Location ..

Write-Host ""
Write-Host "🚀 Khởi động Backend Server..." -ForegroundColor Cyan

# Khởi động backend trong background
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    npm start
}

# Đợi một chút để backend khởi động
Start-Sleep -Seconds 3

# Kiểm tra backend có chạy không
Write-Host "🔍 Kiểm tra Backend Server..." -ForegroundColor Yellow
$maxRetries = 10
$retryCount = 0
$backendRunning = $false

while ($retryCount -lt $maxRetries -and -not $backendRunning) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $backendRunning = $true
            Write-Host "✅ Backend Server đang chạy tại: http://localhost:3001" -ForegroundColor Green
        }
    } catch {
        $retryCount++
        Write-Host "   Đang chờ backend khởi động... ($retryCount/$maxRetries)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $backendRunning) {
    Write-Host "❌ Backend Server không thể khởi động!" -ForegroundColor Red
    Stop-Job $backendJob
    Remove-Job $backendJob
    exit 1
}

Write-Host ""
Write-Host "🌐 Chuẩn bị Frontend..." -ForegroundColor Cyan

# Kiểm tra Live Server
$liveServerInstalled = $false
try {
    $liveServerCheck = npm list -g live-server 2>$null
    if ($liveServerCheck -match "live-server") {
        $liveServerInstalled = $true
    }
} catch {
    # Ignore error
}

if (-not $liveServerInstalled) {
    Write-Host "📦 Cài đặt Live Server..." -ForegroundColor Yellow
    try {
        npm install -g live-server --silent
        Write-Host "✅ Live Server đã được cài đặt" -ForegroundColor Green
        $liveServerInstalled = $true
    } catch {
        Write-Host "⚠️  Không thể cài đặt Live Server tự động" -ForegroundColor Yellow
        $liveServerInstalled = $false
    }
}

# Khởi động frontend
if ($liveServerInstalled) {
    Write-Host "🚀 Khởi động Frontend với Live Server..." -ForegroundColor Cyan
    
    # Khởi động live server trong background
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\website
        live-server --port=3000 --host=localhost --no-browser --quiet
    }
    
    Start-Sleep -Seconds 2
    Write-Host "✅ Frontend Server đang chạy tại: http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "⚠️  Vui lòng mở file website/index.html bằng web server" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 ===== HỆ THỐNG ĐÃ KHỞI ĐỘNG THÀNH CÔNG! =====" -ForegroundColor Green
Write-Host ""
Write-Host "📋 THÔNG TIN HỆ THỐNG:" -ForegroundColor Cyan
Write-Host "   🖥️  Backend API:     http://localhost:3001" -ForegroundColor White
Write-Host "   🌐 Frontend Web:    http://localhost:3000" -ForegroundColor White
Write-Host "   📚 API Docs:        http://localhost:3001/api-docs" -ForegroundColor White
Write-Host "   ❤️  Health Check:   http://localhost:3001/health" -ForegroundColor White
Write-Host "   🧪 Test Dashboard:  http://localhost:3000/test-integrated-dashboard.html" -ForegroundColor White
Write-Host ""
Write-Host "👥 TÀI KHOẢN MẶC ĐỊNH:" -ForegroundColor Cyan
Write-Host "   🛡️  Admin:    admin@hutech.edu.vn / Admin123456" -ForegroundColor White
Write-Host "   👤 User:     user@hutech.edu.vn / User123456" -ForegroundColor White
Write-Host "   👨‍🏫 Instructor: instructor@hutech.edu.vn / Instructor123456" -ForegroundColor White
Write-Host ""
Write-Host "🔧 QUẢN LÝ HỆ THỐNG:" -ForegroundColor Cyan
Write-Host "   • Nhấn Ctrl+C để dừng hệ thống" -ForegroundColor White
Write-Host "   • Xem logs trong terminal này" -ForegroundColor White
Write-Host "   • Kiểm tra trạng thái tại /health endpoint" -ForegroundColor White
Write-Host ""

# Mở browser tự động
Write-Host "🌐 Mở trình duyệt..." -ForegroundColor Yellow
try {
    Start-Process "http://localhost:3000"
    Write-Host "✅ Đã mở website trong trình duyệt" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Vui lòng mở http://localhost:3000 trong trình duyệt" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "⏳ Hệ thống đang chạy... Nhấn Ctrl+C để dừng" -ForegroundColor Yellow
Write-Host ""

# Theo dõi jobs và hiển thị logs
try {
    while ($true) {
        # Kiểm tra backend job
        if ($backendJob.State -eq "Failed") {
            Write-Host "❌ Backend job đã dừng!" -ForegroundColor Red
            break
        }
        
        # Kiểm tra frontend job (nếu có)
        if ($liveServerInstalled -and $frontendJob.State -eq "Failed") {
            Write-Host "❌ Frontend job đã dừng!" -ForegroundColor Red
            break
        }
        
        # Hiển thị backend logs
        $backendOutput = Receive-Job $backendJob -Keep
        if ($backendOutput) {
            Write-Host "🖥️  Backend: $backendOutput" -ForegroundColor Gray
        }
        
        # Hiển thị frontend logs (nếu có)
        if ($liveServerInstalled) {
            $frontendOutput = Receive-Job $frontendJob -Keep
            if ($frontendOutput) {
                Write-Host "🌐 Frontend: $frontendOutput" -ForegroundColor Gray
            }
        }
        
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host ""
    Write-Host "🛑 Đang dừng hệ thống..." -ForegroundColor Yellow
}

# Cleanup
Write-Host ""
Write-Host "🧹 Dọn dẹp processes..." -ForegroundColor Yellow

if ($backendJob) {
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Write-Host "✅ Đã dừng Backend Server" -ForegroundColor Green
}

if ($liveServerInstalled -and $frontendJob) {
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "✅ Đã dừng Frontend Server" -ForegroundColor Green
}

Write-Host ""
Write-Host "👋 Hệ thống đã được dừng. Cảm ơn bạn đã sử dụng!" -ForegroundColor Cyan
Write-Host "🥋 CLB Võ Cổ Truyền HUTECH" -ForegroundColor Cyan