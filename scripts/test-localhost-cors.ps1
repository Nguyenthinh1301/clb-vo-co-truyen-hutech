# ============================================================
# Test Localhost CORS với các port khác nhau
# ============================================================
# Kiểm tra backend có chấp nhận localhost:5500, 5501, 5502... không
# ============================================================

$BACKEND_LOCAL = "http://localhost:3001"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LOCALHOST CORS TEST (Live Server)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing if backend accepts localhost with various ports..." -ForegroundColor Yellow
Write-Host "(Simulating VS Code Live Server behavior)" -ForegroundColor Gray
Write-Host ""

# Check if backend is running
Write-Host "[0/5] Checking if backend is running..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BACKEND_LOCAL/health" -Method GET -ErrorAction Stop
    if ($health.success) {
        Write-Host "  ✅ Backend is ONLINE" -ForegroundColor Green
        Write-Host "     Environment: $($health.environment)" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ Backend health check failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ❌ Backend is NOT running at $BACKEND_LOCAL" -ForegroundColor Red
    Write-Host "     Please start backend first:" -ForegroundColor Yellow
    Write-Host "     cd backend" -ForegroundColor White
    Write-Host "     npm run dev" -ForegroundColor White
    exit 1
}

Write-Host ""

# Test different localhost ports (simulating Live Server)
$ports = @(5500, 5501, 5502, 8080, 3000)
$successCount = 0
$failCount = 0

for ($i = 0; $i -lt $ports.Length; $i++) {
    $port = $ports[$i]
    $testNum = $i + 1
    $origin = "http://localhost:$port"
    
    Write-Host "[$testNum/5] Testing: $origin" -ForegroundColor Yellow
    
    try {
        # Use curl for OPTIONS request (preflight)
        $response = curl.exe -s -w "%{http_code}" `
            -H "Origin: $origin" `
            -H "Access-Control-Request-Method: POST" `
            -H "Access-Control-Request-Headers: Content-Type,Authorization" `
            -X OPTIONS "$BACKEND_LOCAL/api/auth/login" `
            -o nul 2>&1
        
        $statusCode = $response | Select-Object -Last 1
        
        if ($statusCode -eq "204" -or $statusCode -eq "200") {
            Write-Host "  ✅ ALLOWED (HTTP $statusCode)" -ForegroundColor Green
            $successCount++
        } elseif ($statusCode -eq "500") {
            Write-Host "  ❌ BLOCKED (HTTP 500 - CORS error)" -ForegroundColor Red
            $failCount++
        } else {
            Write-Host "  ⚠️  Unexpected status: HTTP $statusCode" -ForegroundColor Yellow
            $failCount++
        }
    } catch {
        Write-Host "  ❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""

# Test with 127.0.0.1 (another common Live Server format)
Write-Host "[BONUS] Testing: http://127.0.0.1:5500" -ForegroundColor Yellow
try {
    $response = curl.exe -s -w "%{http_code}" `
        -H "Origin: http://127.0.0.1:5500" `
        -H "Access-Control-Request-Method: POST" `
        -H "Access-Control-Request-Headers: Content-Type,Authorization" `
        -X OPTIONS "$BACKEND_LOCAL/api/auth/login" `
        -o nul 2>&1
    
    $statusCode = $response | Select-Object -Last 1
    
    if ($statusCode -eq "204" -or $statusCode -eq "200") {
        Write-Host "  ✅ ALLOWED (HTTP $statusCode)" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ❌ BLOCKED (HTTP $statusCode)" -ForegroundColor Red
        $failCount++
    }
} catch {
    Write-Host "  ❌ Test failed" -ForegroundColor Red
    $failCount++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Summary
$totalTests = $successCount + $failCount
$successRate = [math]::Round(($successCount / $totalTests) * 100)

Write-Host "RESULTS:" -ForegroundColor Cyan
Write-Host "  Total tests: $totalTests" -ForegroundColor White
Write-Host "  Passed: $successCount" -ForegroundColor Green
Write-Host "  Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Gray" } else { "Red" })
Write-Host "  Success rate: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })
Write-Host ""

# Verdict
if ($successCount -eq $totalTests) {
    Write-Host "VERDICT: ALL TESTS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend accepts localhost with ANY port!" -ForegroundColor Green
    Write-Host "VS Code Live Server will work without CORS issues." -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor Yellow
    Write-Host "  1. Open website/admin/index.html in VS Code" -ForegroundColor White
    Write-Host "  2. Click 'Go Live' button" -ForegroundColor White
    Write-Host "  3. Login should work regardless of port" -ForegroundColor White
    exit 0
} else {
    Write-Host "VERDICT: SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Backend is NOT accepting all localhost ports." -ForegroundColor Red
    Write-Host ""
    Write-Host "TO FIX:" -ForegroundColor Yellow
    Write-Host "  1. Check backend/server.js CORS configuration" -ForegroundColor White
    Write-Host "  2. Ensure localhost regex is correct:" -ForegroundColor White
    Write-Host "     /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/" -ForegroundColor Cyan
    Write-Host "  3. Restart backend: npm run dev" -ForegroundColor White
    Write-Host "  4. Run this test again" -ForegroundColor White
    exit 1
}
