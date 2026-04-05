# Script khởi động web server cho frontend
# Sử dụng: .\start-server.ps1

Write-Host "🌐 Đang khởi động web server..." -ForegroundColor Cyan

# Kiểm tra Python có sẵn không
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
}

if ($pythonCmd) {
    Write-Host "✅ Sử dụng Python HTTP Server" -ForegroundColor Green
    Write-Host "📍 URL: http://localhost:8000" -ForegroundColor Yellow
    Write-Host "📁 Trang đăng nhập: http://localhost:8000/views/account/dang-nhap.html" -ForegroundColor Yellow
    Write-Host "🧪 Trang test: http://localhost:8000/test-login-simple.html" -ForegroundColor Yellow
    Write-Host "" 
    Write-Host "Nhấn Ctrl+C để dừng server" -ForegroundColor Gray
    Write-Host ""
    
    & $pythonCmd -m http.server 8000
} else {
    Write-Host "❌ Python không được tìm thấy" -ForegroundColor Red
    Write-Host "📥 Hãy cài đặt Python hoặc dùng Live Server extension trong VS Code" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Hoặc mở trực tiếp file HTML và enable CORS extension:" -ForegroundColor Yellow
    Write-Host "1. Cài Chrome extension: 'Allow CORS: Access-Control-Allow-Origin'" -ForegroundColor White
    Write-Host "2. Enable extension" -ForegroundColor White
    Write-Host "3. Mở file: website/test-login-simple.html" -ForegroundColor White
    
    Read-Host "Nhấn Enter để thoát"
}