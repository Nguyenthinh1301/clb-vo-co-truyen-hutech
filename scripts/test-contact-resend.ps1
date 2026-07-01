# ============================================================
# TEST CONTACT FORM WITH RESEND API
# ============================================================

$ErrorActionPreference = "Continue"
$BACKEND_URL = "https://clb-vo-co-truyen-hutech.onrender.com"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST CONTACT + RESEND EMAIL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Wait for backend to restart after env var change
Write-Host "[0/4] Waiting for backend restart..." -ForegroundColor Yellow
Write-Host "  (After adding RESEND_API_KEY, backend needs ~30s to restart)" -ForegroundColor Gray
Write-Host ""

$maxRetries = 6
$retryCount = 0
$backendReady = $false

while ($retryCount -lt $maxRetries -and -not $backendReady) {
    try {
        $health = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method GET -TimeoutSec 5
        if ($health.success) {
            $backendReady = $true
            Write-Host "  ✅ Backend is ready!" -ForegroundColor Green
        }
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "  ⏳ Retry $retryCount/$maxRetries... (waiting 5s)" -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
}

if (-not $backendReady) {
    Write-Host "  ❌ Backend not responding after retries" -ForegroundColor Red
    Write-Host "     Please wait a bit longer and run this script again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[1/4] Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method GET -TimeoutSec 10
    if ($health.success) {
        Write-Host "  ✅ Backend ONLINE" -ForegroundColor Green
        Write-Host "     Database: $($health.database.message)" -ForegroundColor Gray
        Write-Host "     Uptime: $([math]::Round($health.uptime/60, 1)) min" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ Backend OFFLINE" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/4] Submitting Contact Form..." -ForegroundColor Yellow

$timestamp = Get-Date -Format "HH:mm:ss dd/MM/yyyy"
$testData = @{
    name = "QA Tester (Resend Test)"
    email = "qa.resend@example.com"
    phone = "0987654321"
    subject = "Test Email với Resend API"
    message = "Test tin nhắn lúc $timestamp. Email này phải được gửi qua Resend API (không phải SMTP). Vui lòng check inbox: vctht2026@gmail.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/contact" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $testData `
        -TimeoutSec 15
    
    if ($response.success) {
        Write-Host "  ✅ Contact Form Submitted!" -ForegroundColor Green
        Write-Host "     Message ID: $($response.data.message_id)" -ForegroundColor Gray
        $messageId = $response.data.message_id
    }
} catch {
    Write-Host "  ❌ Submission Failed" -ForegroundColor Red
    Write-Host "     $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/4] Email Notification Status..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  📧 Email being sent via Resend API (HTTP)" -ForegroundColor Cyan
Write-Host "     Method: Resend HTTP API (not SMTP)" -ForegroundColor Gray
Write-Host "     To: vctht2026@gmail.com" -ForegroundColor Gray
Write-Host "     Subject: [Liên hệ mới] QA Tester (Resend Test)" -ForegroundColor Gray
Write-Host ""
Write-Host "  ⏳ Email delivery: 5-15 seconds" -ForegroundColor Yellow
Write-Host ""
Write-Host "  🔍 To verify Resend is working:" -ForegroundColor Cyan
Write-Host "     1. Check Gmail: vctht2026@gmail.com" -ForegroundColor White
Write-Host "     2. Look for email from: CLB Võ Cổ Truyền HUTECH" -ForegroundColor White
Write-Host "     3. Subject: [Liên hệ mới] QA Tester (Resend Test)" -ForegroundColor White
Write-Host "     4. Check Resend Dashboard → Logs to see delivery status" -ForegroundColor White
Write-Host ""

Write-Host "[4/4] Checking Render Logs..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  To check if Resend is working:" -ForegroundColor Cyan
Write-Host "     1. Go to Render Dashboard" -ForegroundColor White
Write-Host "     2. Open service: clb-vo-co-truyen-hutech" -ForegroundColor White
Write-Host "     3. Click 'Logs' tab" -ForegroundColor White
Write-Host "     4. Look for:" -ForegroundColor White
Write-Host "        ✅ 'Email service initialized (Resend HTTP API)'" -ForegroundColor Green
Write-Host "        ✅ 'Admin notification email sent'" -ForegroundColor Green
Write-Host "        OR" -ForegroundColor Yellow
Write-Host "        ❌ 'Admin notification email failed'" -ForegroundColor Red
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION STEPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Check Gmail Inbox (vctht2026@gmail.com)" -ForegroundColor Cyan
Write-Host "   - Email should arrive within 15 seconds" -ForegroundColor White
Write-Host "   - From: CLB Võ Cổ Truyền HUTECH" -ForegroundColor White
Write-Host "   - Subject: [Liên hệ mới] QA Tester (Resend Test)" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Check Resend Dashboard" -ForegroundColor Cyan
Write-Host "   - Go to: https://resend.com/emails" -ForegroundColor White
Write-Host "   - Check latest email delivery status" -ForegroundColor White
Write-Host "   - Status should be: 'Delivered' ✅" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Check Render Logs" -ForegroundColor Cyan
Write-Host "   - Verify: 'Email service initialized (Resend HTTP API)'" -ForegroundColor White
Write-Host "   - No SMTP errors" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ TEST COMPLETED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Message ID: $messageId" -ForegroundColor White
Write-Host "Timestamp: $timestamp" -ForegroundColor White
Write-Host ""
Write-Host "⏰ Please check Gmail inbox within 1 minute!" -ForegroundColor Yellow
Write-Host ""
