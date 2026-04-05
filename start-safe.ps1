# Script khởi động an toàn với kiểm tra lỗi
# Safe startup script with error checking

Write-Host "🚀 Khởi động hệ thống CLB Võ Cổ Truyền HUTECH..." -ForegroundColor Green
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Function to wait for service
function Wait-ForService {
    param([string]$Name, [int]$Port, [int]$TimeoutSeconds = 30)
    
    Write-Host "⏳ Đang chờ $Name khởi động (port $Port)..." -ForegroundColor Yellow
    
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        if (Test-Port -Port $Port) {
            Write-Host "✅ $Name đã sẵn sàng!" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 1
        $elapsed++
    }
    
    Write-Host "❌ $Name không khởi động được sau $TimeoutSeconds giây" -ForegroundColor Red
    return $false
}

# Check if required ports are available
Write-Host "🔍 Kiểm tra ports..." -ForegroundColor Cyan

$requiredPorts = @(3000, 8080)
$portsInUse = @()

foreach ($port in $requiredPorts) {
    if (Test-Port -Port $port) {
        $portsInUse += $port
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "⚠️  Các port sau đang được sử dụng: $($portsInUse -join ', ')" -ForegroundColor Yellow
    Write-Host "Bạn có muốn tiếp tục? (y/N): " -NoNewline -ForegroundColor Yellow
    $continue = Read-Host
    
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        Write-Host "❌ Hủy khởi động" -ForegroundColor Red
        exit 1
    }
}

# Start Backend
Write-Host ""
Write-Host "🔧 Khởi động Backend..." -ForegroundColor Cyan

Set-Location "backend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Cài đặt dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Lỗi cài đặt dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check environment file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  File .env không tồn tại, sao chép từ .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

# Start backend in background
Write-Host "🚀 Khởi động server backend..." -ForegroundColor Green
Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden

# Wait for backend to start
if (-not (Wait-ForService -Name "Backend API" -Port 3000 -TimeoutSeconds 30)) {
    Write-Host "❌ Backend không khởi động được" -ForegroundColor Red
    exit 1
}

# Test backend health
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 10
    if ($healthCheck.success) {
        Write-Host "✅ Backend health check passed" -ForegroundColor Green
        if ($healthCheck.database -and $healthCheck.database.status -eq "connected") {
            Write-Host "✅ Database connection OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Database connection issue" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  Backend health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Start Frontend
Write-Host ""
Write-Host "🌐 Khởi động Frontend..." -ForegroundColor Cyan

Set-Location "../website"

# Check if we have a simple HTTP server
$hasHttpServer = $false
try {
    $null = Get-Command "http-server" -ErrorAction Stop
    $hasHttpServer = $true
} catch {
    try {
        $null = Get-Command "python" -ErrorAction Stop
        $hasHttpServer = $true
    } catch {
        Write-Host "⚠️  Không tìm thấy HTTP server, sử dụng Node.js server..." -ForegroundColor Yellow
    }
}

if ($hasHttpServer) {
    if (Get-Command "http-server" -ErrorAction SilentlyContinue) {
        Write-Host "🚀 Khởi động frontend với http-server..." -ForegroundColor Green
        Start-Process -FilePath "http-server" -ArgumentList "-p 8080 -c-1" -WindowStyle Hidden
    } else {
        Write-Host "🚀 Khởi động frontend với Python..." -ForegroundColor Green
        Start-Process -FilePath "python" -ArgumentList "-m http.server 8080" -WindowStyle Hidden
    }
} else {
    # Fallback to Node.js server if available
    if (Test-Path "server.js") {
        Write-Host "🚀 Khởi động frontend với Node.js server..." -ForegroundColor Green
        Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
    } else {
        Write-Host "❌ Không tìm thấy cách khởi động frontend" -ForegroundColor Red
        Write-Host "Vui lòng mở thư mục website trong trình duyệt hoặc cài đặt http-server:" -ForegroundColor Yellow
        Write-Host "npm install -g http-server" -ForegroundColor Cyan
    }
}

# Wait for frontend
if (-not (Wait-ForService -Name "Frontend" -Port 8080 -TimeoutSeconds 15)) {
    Write-Host "⚠️  Frontend có thể chưa sẵn sàng" -ForegroundColor Yellow
}

# Final status
Write-Host ""
Write-Host "🎉 Hệ thống đã khởi động!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Các địa chỉ truy cập:" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "   • Backend API: http://localhost:3000/api" -ForegroundColor White
Write-Host "   • API Health: http://localhost:3000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Để dừng hệ thống, nhấn Ctrl+C hoặc đóng cửa sổ này" -ForegroundColor Yellow
Write-Host ""

# Run tests
Write-Host "🧪 Chạy kiểm tra nhanh..." -ForegroundColor Cyan
Set-Location ".."
if (Test-Path "test-fixes.js") {
    try {
        node test-fixes.js
    } catch {
        Write-Host "⚠️  Không thể chạy tests: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✨ Hệ thống sẵn sàng sử dụng!" -ForegroundColor Green
Write-Host "Nhấn Enter để mở trình duyệt..." -NoNewline
Read-Host

# Open browser
Start-Process "http://localhost:8080"

# Keep script running
Write-Host "Nhấn Ctrl+C để dừng hệ thống..."
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host ""
    Write-Host "🛑 Đang dừng hệ thống..." -ForegroundColor Yellow
}