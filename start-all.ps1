# Script khởi động toàn bộ hệ thống
# CLB Võ Cổ Truyền HUTECH - Full Stack

Write-Host "🚀 KHỞI ĐỘNG HỆ THỐNG CLB VÕ CỔ TRUYỀN HUTECH" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js không được tìm thấy!" -ForegroundColor Red
    Write-Host "📥 Hãy cài đặt Node.js từ: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Nhấn Enter để thoát"
    exit 1
}

Write-Host "✅ Node.js version: $(node --version)" -ForegroundColor Green

# Function để kill process trên port
function Kill-ProcessOnPort {
    param([int]$Port)
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($processes) {
            foreach ($process in $processes) {
                $pid = $process.OwningProcess
                if ($pid -ne 0) {
                    Write-Host "🔄 Killing process PID $pid on port $Port" -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            }
            Start-Sleep -Seconds 2
        }
    } catch {
        # Ignore errors
    }
}

# Kill existing processes
Write-Host "🔄 Dọn dẹp processes cũ..." -ForegroundColor Yellow
Kill-ProcessOnPort 3001  # Backend
Kill-ProcessOnPort 8000  # Frontend

Write-Host ""

# Khởi động Backend
Write-Host "🔧 KHỞI ĐỘNG BACKEND..." -ForegroundColor Cyan
Write-Host "📍 URL: http://localhost:3001" -ForegroundColor White
Write-Host "📚 API Docs: http://localhost:3001/api-docs" -ForegroundColor White

try {
    # Kiểm tra backend folder
    if (-not (Test-Path "backend")) {
        Write-Host "❌ Thư mục backend không tồn tại!" -ForegroundColor Red
        exit 1
    }
    
    # Khởi động backend trong background
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\backend
        npm run dev
    }
    
    Write-Host "✅ Backend đang khởi động... (Job ID: $($backendJob.Id))" -ForegroundColor Green
    
    # Đợi backend khởi động
    Write-Host "⏳ Đợi backend khởi động (10 giây)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Test backend
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Backend đã sẵn sàng!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Backend chưa sẵn sàng, nhưng tiếp tục..." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Lỗi khởi động backend: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Khởi động Frontend
Write-Host "🌐 KHỞI ĐỘNG FRONTEND..." -ForegroundColor Cyan
Write-Host "📍 URL: http://localhost:8000" -ForegroundColor White
Write-Host "🔐 Login: http://localhost:8000/views/account/dang-nhap.html" -ForegroundColor White
Write-Host "🧪 Debug: http://localhost:8000/debug-login.html" -ForegroundColor White

try {
    # Kiểm tra website folder
    if (-not (Test-Path "website")) {
        Write-Host "❌ Thư mục website không tồn tại!" -ForegroundColor Red
        exit 1
    }
    
    # Khởi động frontend trong background
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\website
        node server.js
    }
    
    Write-Host "✅ Frontend đang khởi động... (Job ID: $($frontendJob.Id))" -ForegroundColor Green
    
    # Đợi frontend khởi động
    Start-Sleep -Seconds 3
    
    # Test frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Frontend đã sẵn sàng!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Frontend chưa sẵn sàng, nhưng tiếp tục..." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Lỗi khởi động frontend: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 HỆ THỐNG ĐÃ KHỞI ĐỘNG!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 BACKEND (API Server):" -ForegroundColor Cyan
Write-Host "   🌐 URL: http://localhost:3001" -ForegroundColor White
Write-Host "   📚 API Docs: http://localhost:3001/api-docs" -ForegroundColor White
Write-Host "   ❤️ Health: http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "🌐 FRONTEND (Web Server):" -ForegroundColor Cyan
Write-Host "   🏠 Home: http://localhost:8000" -ForegroundColor White
Write-Host "   🔐 Login: http://localhost:8000/views/account/dang-nhap.html" -ForegroundColor White
Write-Host "   🧪 Debug: http://localhost:8000/debug-login.html" -ForegroundColor White
Write-Host "   📝 Test: http://localhost:8000/test-login-simple.html" -ForegroundColor White
Write-Host ""
Write-Host "🔐 THÔNG TIN ĐĂNG NHẬP:" -ForegroundColor Cyan
Write-Host "   📧 Email: admin@vocotruyenhutech.edu.vn" -ForegroundColor White
Write-Host "   🔑 Password: admin123456" -ForegroundColor White
Write-Host "   👤 Role: admin" -ForegroundColor White
Write-Host ""
Write-Host "🛑 ĐỂ DỪNG HỆ THỐNG:" -ForegroundColor Red
Write-Host "   Nhấn Ctrl+C hoặc đóng cửa sổ này" -ForegroundColor White
Write-Host ""

# Mở trình duyệt
Write-Host "🌐 Đang mở trình duyệt..." -ForegroundColor Yellow
try {
    Start-Process "http://localhost:8000/debug-login.html"
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:8000/views/account/dang-nhap.html"
} catch {
    Write-Host "⚠️ Không thể mở trình duyệt tự động" -ForegroundColor Yellow
    Write-Host "📱 Hãy mở thủ công: http://localhost:8000/views/account/dang-nhap.html" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ HỆ THỐNG ĐANG CHẠY - NHẤN CTRL+C ĐỂ DỪNG ✨" -ForegroundColor Green

# Đợi user dừng
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Kiểm tra jobs còn chạy không
        $runningJobs = Get-Job | Where-Object { $_.State -eq "Running" }
        if ($runningJobs.Count -eq 0) {
            Write-Host "⚠️ Tất cả services đã dừng" -ForegroundColor Yellow
            break
        }
    }
} catch {
    Write-Host "`n🛑 Đang dừng hệ thống..." -ForegroundColor Yellow
} finally {
    # Cleanup
    Write-Host "🧹 Dọn dẹp..." -ForegroundColor Yellow
    Get-Job | Stop-Job -ErrorAction SilentlyContinue
    Get-Job | Remove-Job -ErrorAction SilentlyContinue
    
    # Kill processes
    Kill-ProcessOnPort 3001
    Kill-ProcessOnPort 8000
    
    Write-Host "✅ Hệ thống đã dừng hoàn toàn!" -ForegroundColor Green
}