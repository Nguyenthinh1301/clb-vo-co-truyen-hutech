# ================================
# PRODUCTION VERIFICATION SCRIPT
# ================================
# Kiem tra tat ca endpoints production
# Author: Kiro AI
# Date: 10/06/2026

Write-Host ""
Write-Host "KIEM TRA PRODUCTION - CLB Vo Co Truyen HUTECH" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

$BACKEND_URL = "https://clb-vo-co-truyen-hutech.onrender.com"
$FRONTEND_URL = "https://vocotruyenhutech.netlify.app"

$script:passed = 0
$script:failed = 0
$script:total = 0

function Test-Url {
    param([string]$Name, [string]$Url)
    
    $script:total++
    Write-Host "Testing: $Name" -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host " [PASS]" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host " [FAIL] (Status: $($response.StatusCode))" -ForegroundColor Red
            $script:failed++
        }
    } catch {
        Write-Host " [FAIL] ($($_.Exception.Message))" -ForegroundColor Red
        $script:failed++
    }
}

# BACKEND TESTS
Write-Host "BACKEND TESTS" -ForegroundColor Yellow
Write-Host ("-" * 60)
Test-Url "Health Check" "$BACKEND_URL/health"
Test-Url "CMS News" "$BACKEND_URL/api/cms/news"
Test-Url "CMS Events" "$BACKEND_URL/api/cms/events"
Test-Url "CMS Gallery" "$BACKEND_URL/api/cms/gallery"
Test-Url "CMS Announcements" "$BACKEND_URL/api/cms/announcements"
Test-Url "CMS Reviews" "$BACKEND_URL/api/cms/reviews"

# FRONTEND TESTS
Write-Host ""
Write-Host "FRONTEND TESTS" -ForegroundColor Yellow
Write-Host ("-" * 60)
Test-Url "Homepage" "$FRONTEND_URL/"
Test-Url "Gioi thieu" "$FRONTEND_URL/views/gioi-thieu.html"
Test-Url "Doi ngu" "$FRONTEND_URL/views/doi-ngu.html"
Test-Url "Tin tuc" "$FRONTEND_URL/views/tin-tuc.html"
Test-Url "Su kien" "$FRONTEND_URL/views/su-kien.html"
Test-Url "Thu vien" "$FRONTEND_URL/views/thu-vien.html"
Test-Url "Lien he" "$FRONTEND_URL/views/lien-he.html"
Test-Url "Admin Login" "$FRONTEND_URL/admin/index.html"

# SUMMARY
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests:  $script:total"
Write-Host "Passed:       " -NoNewline
Write-Host "$script:passed" -ForegroundColor Green
Write-Host "Failed:       " -NoNewline
if ($script:failed -gt 0) {
    Write-Host "$script:failed" -ForegroundColor Red
} else {
    Write-Host "$script:failed" -ForegroundColor Green
}

$successRate = if ($script:total -gt 0) { 
    [math]::Round(($script:passed / $script:total) * 100, 1) 
} else { 
    0 
}
Write-Host "Success Rate: $successRate%"

Write-Host ""
if ($script:failed -eq 0) {
    Write-Host "ALL TESTS PASSED - PRODUCTION IS HEALTHY!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME TESTS FAILED - CHECK LOGS ABOVE" -ForegroundColor Red
    exit 1
}
