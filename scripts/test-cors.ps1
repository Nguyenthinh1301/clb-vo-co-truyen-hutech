# ============================================================
# Test CORS Configuration
# ============================================================
# Kiểm tra xem backend có cho phép requests từ Netlify không
# ============================================================

$BACKEND = "https://clb-vo-co-truyen-hutech.onrender.com"
$NETLIFY_ORIGIN = "https://vo-co-truyen-hutech.netlify.app"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CORS CONFIGURATION TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend health check
Write-Host "[1/4] Testing backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BACKEND/health" -Method GET
    if ($health.success) {
        Write-Host "  ✅ Backend is ONLINE" -ForegroundColor Green
        Write-Host "     Uptime: $([math]::Round($health.uptime/60, 1)) minutes" -ForegroundColor Gray
        Write-Host "     Database: $($health.database.message)" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ Backend is DOWN" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ❌ Cannot reach backend: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: OPTIONS preflight request
Write-Host "[2/4] Testing CORS preflight (OPTIONS)..." -ForegroundColor Yellow
try {
    $response = curl.exe -s -w "%{http_code}" `
        -H "Origin: $NETLIFY_ORIGIN" `
        -H "Access-Control-Request-Method: POST" `
        -H "Access-Control-Request-Headers: Content-Type,Authorization" `
        -X OPTIONS "$BACKEND/api/auth/login" `
        -o nul
    
    $statusCode = $response
    
    if ($statusCode -eq "204" -or $statusCode -eq "200") {
        Write-Host "  ✅ CORS preflight OK (HTTP $statusCode)" -ForegroundColor Green
    } elseif ($statusCode -eq "500") {
        Write-Host "  ❌ CORS BLOCKED (HTTP 500)" -ForegroundColor Red
        Write-Host "     Backend is rejecting requests from Netlify" -ForegroundColor Red
        Write-Host "     → Fix: Add Netlify domain to CORS_ORIGIN in Render" -ForegroundColor Yellow
        $needsFix = $true
    } else {
        Write-Host "  ⚠️  Unexpected status: HTTP $statusCode" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Preflight test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check CORS headers
Write-Host "[3/4] Checking CORS response headers..." -ForegroundColor Yellow
try {
    $headers = curl.exe -s -I `
        -H "Origin: $NETLIFY_ORIGIN" `
        -X OPTIONS "$BACKEND/api/auth/login" | Select-String -Pattern "access-control"
    
    if ($headers) {
        foreach ($header in $headers) {
            Write-Host "     $header" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚠️  No CORS headers found in response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Could not retrieve headers" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Test actual login endpoint
Write-Host "[4/4] Testing actual POST request..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@example.com"
        password = "test123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BACKEND/api/auth/login" `
        -Method POST `
        -Headers @{
            "Origin" = $NETLIFY_ORIGIN
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -SkipHttpErrorCheck
    
    # Check for CORS headers in response
    $allowOrigin = $response.Headers["Access-Control-Allow-Origin"]
    $allowCredentials = $response.Headers["Access-Control-Allow-Credentials"]
    
    if ($allowOrigin) {
        Write-Host "  ✅ POST request accepted" -ForegroundColor Green
        Write-Host "     Access-Control-Allow-Origin: $allowOrigin" -ForegroundColor Gray
        if ($allowCredentials) {
            Write-Host "     Access-Control-Allow-Credentials: $allowCredentials" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ CORS headers missing in POST response" -ForegroundColor Red
        $needsFix = $true
    }
} catch {
    Write-Host "  ⚠️  POST test error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Final verdict
if ($needsFix) {
    Write-Host "VERDICT: CORS NOT CONFIGURED CORRECTLY" -ForegroundColor Red
    Write-Host ""
    Write-Host "TO FIX:" -ForegroundColor Yellow
    Write-Host "   1. Go to Render Dashboard" -ForegroundColor White
    Write-Host "   2. Open backend project settings" -ForegroundColor White
    Write-Host "   3. Add to CORS_ORIGIN:" -ForegroundColor White
    Write-Host "      $NETLIFY_ORIGIN" -ForegroundColor Cyan
    Write-Host "   4. Save and wait for restart (~1 min)" -ForegroundColor White
    Write-Host "   5. Run this script again to verify" -ForegroundColor White
    Write-Host ""
    Write-Host "Full guide: FIX-CORS-ISSUE.md" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "VERDICT: CORS IS CONFIGURED CORRECTLY" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend accepts requests from Netlify!" -ForegroundColor Green
    Write-Host "Admin login should work now." -ForegroundColor Gray
    exit 0
}
