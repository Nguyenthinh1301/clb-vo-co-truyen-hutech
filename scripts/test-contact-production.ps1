# ============================================================
# TEST CONTACT FORM ON PRODUCTION
# ============================================================
# Test gửi contact form và kiểm tra email notification
# ============================================================

$ErrorActionPreference = "Continue"
$BACKEND_URL = "https://clb-vo-co-truyen-hutech.onrender.com"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST CONTACT FORM - PRODUCTION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test data
$timestamp = Get-Date -Format "HH:mm:ss dd/MM/yyyy"
$testData = @{
    name = "QA Tester"
    email = "qa.test@example.com"
    phone = "0912345678"
    subject = "Test Form Liên Hệ"
    message = "Đây là tin nhắn test từ QA Tester lúc $timestamp. Vui lòng kiểm tra email notification đã được gửi đến vctht2026@gmail.com chưa."
} | ConvertTo-Json

Write-Host "[1/4] Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method GET -TimeoutSec 10
    if ($health.success) {
        Write-Host "  ✅ Backend ONLINE" -ForegroundColor Green
        Write-Host "     Database: $($health.database.message)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ Backend OFFLINE" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/4] Submitting Contact Form..." -ForegroundColor Yellow
Write-Host "  Data:" -ForegroundColor Gray
Write-Host "    Name: QA Tester" -ForegroundColor Gray
Write-Host "    Email: qa.test@example.com" -ForegroundColor Gray
Write-Host "    Subject: Test Form Liên Hệ" -ForegroundColor Gray
Write-Host "    Time: $timestamp" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/contact" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $testData `
        -TimeoutSec 15
    
    if ($response.success) {
        Write-Host "  ✅ Contact Form Submitted Successfully!" -ForegroundColor Green
        Write-Host "     Message: $($response.message)" -ForegroundColor Gray
        Write-Host "     Message ID: $($response.data.message_id)" -ForegroundColor Gray
        $messageId = $response.data.message_id
    } else {
        Write-Host "  ❌ Submission Failed" -ForegroundColor Red
        Write-Host "     $($response.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    $errorDetail = $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorDetail = $reader.ReadToEnd()
    }
    Write-Host "  ❌ Error: $errorDetail" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/4] Checking Email Notification..." -ForegroundColor Yellow
Write-Host "  Email notification is sent asynchronously (non-blocking)" -ForegroundColor Gray
Write-Host "  Expected:" -ForegroundColor Cyan
Write-Host "    To: vctht2026@gmail.com" -ForegroundColor White
Write-Host "    Subject: [Liên hệ mới] QA Tester - Test Form Liên Hệ" -ForegroundColor White
Write-Host "    Content: Tin nhắn test với timestamp: $timestamp" -ForegroundColor White
Write-Host ""
Write-Host "  ⏳ Email may take 10-30 seconds to arrive" -ForegroundColor Yellow
Write-Host ""

Write-Host "[4/4] Manual Verification Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1️⃣  Check Gmail: vctht2026@gmail.com" -ForegroundColor Cyan
Write-Host "     - Look for email with subject: [Liên hệ mới] QA Tester" -ForegroundColor White
Write-Host "     - Verify sender: CLB Võ Cổ Truyền HUTECH" -ForegroundColor White
Write-Host "     - Check timestamp: $timestamp" -ForegroundColor White
Write-Host ""
Write-Host "  2️⃣  Check Admin Panel:" -ForegroundColor Cyan
Write-Host "     - Login: https://vocotruyenhutech.netlify.app/admin/" -ForegroundColor White
Write-Host "     - Go to: Liên hệ (Contact Messages)" -ForegroundColor White
Write-Host "     - Find message from: QA Tester" -ForegroundColor White
Write-Host "     - Verify message ID: $messageId" -ForegroundColor White
Write-Host ""
Write-Host "  3️⃣  Check Database Notification:" -ForegroundColor Cyan
Write-Host "     - Should have notification: 'Tin nhắn liên hệ mới'" -ForegroundColor White
Write-Host "     - From: QA Tester (qa.test@example.com)" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Contact form submission: SUCCESS" -ForegroundColor Green
Write-Host "⏳ Email notification: PENDING VERIFICATION" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Check email inbox: vctht2026@gmail.com" -ForegroundColor White
Write-Host "  2. If no email within 1 minute:" -ForegroundColor White
Write-Host "     - Check spam/junk folder" -ForegroundColor White
Write-Host "     - Check Render logs for email errors" -ForegroundColor White
Write-Host "     - Verify SMTP credentials are correct" -ForegroundColor White
Write-Host ""
Write-Host "Email Configuration:" -ForegroundColor Cyan
Write-Host "  SMTP Host: smtp.gmail.com:587" -ForegroundColor White
Write-Host "  From: vctht2026@gmail.com" -ForegroundColor White
Write-Host "  To: vctht2026@gmail.com (ADMIN_NOTIFY_EMAIL)" -ForegroundColor White
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ CONTACT FORM TEST COMPLETED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Please verify email arrived in inbox!" -ForegroundColor Yellow
Write-Host ""
