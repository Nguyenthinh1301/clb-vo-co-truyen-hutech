# Test Production Contact Form
# Kiểm tra form liên hệ trên production có gửi email đến admin không

Write-Host "=== TEST PRODUCTION CONTACT FORM ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend API
Write-Host "[1] Testing Backend API..." -ForegroundColor Yellow
$backendUrl = "https://clb-vo-co-truyen-hutech.onrender.com/api/contact"
$testData = @{
    name = "Test User - $(Get-Date -Format 'HH:mm:ss')"
    email = "testuser@example.com"
    phone = "0901234567"
    subject = "Test từ PowerShell Script"
    message = "Đây là tin nhắn test để kiểm tra email notification đến admin (vctht2026@gmail.com)"
} | ConvertTo-Json -Compress

try {
    $response = Invoke-RestMethod -Uri $backendUrl -Method Post -Body $testData -ContentType "application/json; charset=utf-8"
    if ($response.success) {
        Write-Host "✅ Backend API: OK" -ForegroundColor Green
        Write-Host "   Message: $($response.message)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Backend API: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend API: ERROR" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Frontend Site
Write-Host "[2] Testing Frontend Site..." -ForegroundColor Yellow
$frontendUrl = "https://vocotruyenhutech.netlify.app"
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -Method Head -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend Site: OK (Status: $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Frontend Site: Status $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Frontend Site: ERROR" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check Email Service Config
Write-Host "[3] Checking Email Service..." -ForegroundColor Yellow
Write-Host "   Admin Email: vctht2026@gmail.com" -ForegroundColor Gray
Write-Host "   SMTP: Gmail (port 587, STARTTLS)" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  LƯU Ý:" -ForegroundColor Yellow
Write-Host "   - Render free tier có thể block SMTP port 587" -ForegroundColor Gray
Write-Host "   - Nếu không nhận được email, cần dùng Resend API" -ForegroundColor Gray
Write-Host "   - Kiểm tra email vctht2026@gmail.com (cả Inbox và Spam)" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Backend:  https://clb-vo-co-truyen-hutech.onrender.com" -ForegroundColor White
Write-Host "Frontend: https://vocotruyenhutech.netlify.app" -ForegroundColor White
Write-Host "Admin Email: vctht2026@gmail.com" -ForegroundColor White
Write-Host ""
Write-Host "Vui lòng kiểm tra email vctht2026@gmail.com để xác nhận nhận được thông báo." -ForegroundColor Green
