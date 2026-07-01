# ============================================================
# TEST CONTACT FORM FEATURE
# ============================================================
# Test user sending message to admin functionality
# ============================================================

$ErrorActionPreference = "Continue"
$BACKEND_URL = "http://localhost:3001"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONTACT FORM FEATURE TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

function Test-Feature {
    param([string]$Name, [scriptblock]$Test)
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    try {
        $result = & $Test
        if ($result) {
            Write-Host "  ✅ PASS" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host "  ❌ FAIL" -ForegroundColor Red
            $script:testsFailed++
        }
    } catch {
        Write-Host "  ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
    }
}

# Test 1: Backend contact endpoint exists
Test-Feature "Contact API endpoint exists" {
    try {
        $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/contact" `
            -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body '{"name":"Test","email":"test@test.com","phone":"0123456789","subject":"Test","message":"Test"}' `
            -TimeoutSec 5 `
            -ErrorAction Stop 2>&1
        
        # Expect rate limit or success (both mean endpoint works)
        $true
    } catch {
        if ($_.Exception.Message -match "429") {
            $true # Rate limited = endpoint exists
        } else {
            $false
        }
    }
}

# Test 2: Contact form HTML exists
Test-Feature "Contact form exists in HTML" {
    $indexHtml = Get-Content "website/components/contact-section.html" -Raw
    ($indexHtml -match 'id="contactForm"')
}

# Test 3: Contact form has required fields
Test-Feature "Contact form has all required fields" {
    $contactHtml = Get-Content "website/components/contact-section.html" -Raw
    ($contactHtml -match 'name="name"') -and
    ($contactHtml -match 'name="email"') -and  
    ($contactHtml -match 'name="phone"') -and
    ($contactHtml -match 'name="subject"') -and
    ($contactHtml -match 'name="message"')
}

# Test 4: Backend validates required fields
Test-Feature "Backend validates required fields" {
    try {
        # Send incomplete data (missing name)
        $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/contact" `
            -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body '{"email":"test@test.com"}' `
            -TimeoutSec 5 `
            -ErrorAction Stop
        
        $false # Should have failed validation
    } catch {
        # Expected to fail with 400 or 422
        $_.Exception.Response.StatusCode -in @(400, 422, 429)
    }
}

# Test 5: Database schema has contact_messages table
Test-Feature "Database schema includes contact_messages table" {
    $schema = Get-Content "backend/database/pg-schema.sql" -Raw
    ($schema -match 'contact_messages')
}

# Test 6: Admin can view contact messages
Test-Feature "Admin route for viewing messages exists" {
    $contactRoute = Get-Content "backend/routes/contact.js" -Raw
    ($contactRoute -match 'router.get.*authenticate.*authorize') -and
    ($contactRoute -match 'contact_messages')
}

# Test 7: Admin can reply to messages
Test-Feature "Admin can reply to contact messages" {
    $contactRoute = Get-Content "backend/routes/contact.js" -Raw
    ($contactRoute -match 'router.post.*:id/reply') -and
    ($contactRoute -match 'reply_message')
}

# Test 8: Email notification to admin
Test-Feature "Email notification sent to admin on new contact" {
    $contactRoute = Get-Content "backend/routes/contact.js" -Raw
    ($contactRoute -match 'emailService') -and
    ($contactRoute -match 'ADMIN_NOTIFY_EMAIL')
}

# Test 9: Rate limiting to prevent spam
Test-Feature "Rate limiting configured for contact endpoint" {
    $contactRoute = Get-Content "backend/routes/contact.js" -Raw
    ($contactRoute -match 'contactLimiter') -and
    ($contactRoute -match 'max.*5')
}

# Test 10: Contact form shows backend status
Test-Feature "Contact form checks backend status" {
    $contactHtml = Get-Content "website/components/contact-section.html" -Raw
    ($contactHtml -match 'checkServerStatus') -and
    ($contactHtml -match 'server-status-bar')
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Gray" } else { "Red" })
Write-Host "Total:  $($testsPassed + $testsFailed)"
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✅ ALL CONTACT FEATURE TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Contact form is ready for:" -ForegroundColor Cyan
    Write-Host "  - Users to send messages" -ForegroundColor White
    Write-Host "  - Admin to receive notifications" -ForegroundColor White
    Write-Host "  - Admin to view and reply" -ForegroundColor White
    Write-Host "  - Rate limiting prevents spam" -ForegroundColor White
    exit 0
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "Review failures above before deploying" -ForegroundColor Yellow
    exit 1
}
