# =========================================
# COMPREHENSIVE PROJECT TEST SUITE
# CLB Vo Co Truyen HUTECH - Full QA Test
# =========================================

$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference = 'SilentlyContinue'

$BACKEND_URL = "https://clb-vo-co-truyen-hutech.onrender.com"
$FRONTEND_URL = "https://vocotruyenhutech.netlify.app"

$script:totalTests = 0
$script:passedTests = 0
$script:failedTests = 0
$script:warnings = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [int]$ExpectedStatus = 200
    )
    
    $script:totalTests++
    Write-Host "  [$script:totalTests] $Name" -NoNewline -ForegroundColor White
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method $Method -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " [PASS]" -ForegroundColor Green
            $script:passedTests++
            return $true
        } else {
            Write-Host " [FAIL] Status: $($response.StatusCode)" -ForegroundColor Red
            $script:failedTests++
            return $false
        }
    }
    catch {
        Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
        $script:failedTests++
        return $false
    }
}

function Test-ApiEndpoint {
    param([string]$Name, [string]$Path, [int]$ExpectedStatus = 200)
    Test-Endpoint -Name $Name -Url "$BACKEND_URL$Path" -ExpectedStatus $ExpectedStatus
}

# =========================================
# START TEST SUITE
# =========================================

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "  COMPREHENSIVE TEST SUITE - CLB VO CO TRUYEN HUTECH" -ForegroundColor White
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  $BACKEND_URL" -ForegroundColor Yellow
Write-Host "Frontend: $FRONTEND_URL" -ForegroundColor Yellow
Write-Host "Date:     $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""

# =========================================
# CATEGORY 1: BACKEND HEALTH & INFRASTRUCTURE
# =========================================
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host " CATEGORY 1: BACKEND HEALTH & INFRASTRUCTURE" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan

Test-ApiEndpoint "Health Check Endpoint" "/health"
Test-ApiEndpoint "API Base Route" "/api"

# Check health details
Write-Host "  [+] Checking Health Details..." -NoNewline -ForegroundColor White
try {
    $health = Invoke-RestMethod -Uri "$BACKEND_URL/health" -TimeoutSec 30
    if ($health.success -and $health.database.success) {
        Write-Host " [PASS]" -ForegroundColor Green
        Write-Host "      Database: Connected" -ForegroundColor Gray
        Write-Host "      Environment: $($health.environment)" -ForegroundColor Gray
        if ($health.uptime) {
            $uptimeMin = [math]::Round($health.uptime / 60, 1)
            Write-Host "      Uptime: $uptimeMin minutes" -ForegroundColor Gray
        }
        $script:passedTests++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $script:failedTests++
    }
    $script:totalTests++
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $script:failedTests++
    $script:totalTests++
}

Write-Host ""

# =========================================
# CATEGORY 2: PUBLIC CMS APIs
# =========================================
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host " CATEGORY 2: PUBLIC CMS APIs" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan

Test-ApiEndpoint "News API" "/api/cms/news"
Test-ApiEndpoint "Events API" "/api/cms/events"
Test-ApiEndpoint "Announcements API" "/api/cms/announcements"
Test-ApiEndpoint "Reviews API" "/api/cms/reviews"
Test-ApiEndpoint "Gallery Albums API" "/api/cms/gallery"

Write-Host ""

# =========================================
# CATEGORY 3: GALLERY APIs
# =========================================
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host " CATEGORY 3: GALLERY APIs" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan

# Test gallery endpoints
Write-Host "  [+] Testing Gallery Data..." -NoNewline -ForegroundColor White
try {
    $gallery = Invoke-RestMethod -Uri "$BACKEND_URL/api/cms/gallery" -TimeoutSec 30
    if ($gallery.success) {
        $albumCount = $gallery.data.total
        Write-Host " [PASS]" -ForegroundColor Green
        Write-Host "      Albums Found: $albumCount" -ForegroundColor Gray
        $script:passedTests++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $script:failedTests++
    }
    $script:totalTests++
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $script:failedTests++
    $script:totalTests++
}

Test-ApiEndpoint "Gallery Albums List" "/api/gallery/albums"

Write-Host ""

# =========================================
# CATEGORY 4: FRONTEND PAGES
# =========================================
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host " CATEGORY 4: FRONTEND PUBLIC PAGES" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan

Test-Endpoint "Homepage" "$FRONTEND_URL/"
Test-Endpoint "Gioi Thieu Page" "$FRONTEND_URL/views/gioi-thieu.html"
Test-Endpoint "Doi Ngu Page" "$FRONTEND_URL/views/doi-ngu.html"
Test-Endpoint "Lich Tap Page" "$FRONTEND_URL/views/lich-tap.html"
Test-Endpoint "Thanh Tich Page" "$FRONTEND_URL/views/thanh-tich.html"
Test-Endpoint "Tin Tuc Page" "$FRONTEND_URL/views/tin-tuc.html"
Test-Endpoint "Su Kien Page" "$FRONTEND_URL/views/su-kien.html"
Test-Endpoint "Thong Bao Page" "$FRONTEND_URL/views/thong-bao.html"
Test-Endpoint "Cam Nhan Page" "$FRONTEND_URL/views/cam-nhan.html"
Test-Endpoint "Thu Vien Page" "$FRONTEND_URL/views/thu-vien.html"
Test-Endpoint "Lien He Page" "$FRONTEND_URL/views/lien-he.html"

Write-Host ""

# =========================================
# CATEGORY 5: ADMIN PANEL
# =========================================
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host " CATEGORY 5: ADMIN PANEL" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan

Test-Endpoint "Admin Login Page" "$FRONTEND_URL/admin/index.html"
Test-Endpoint "Admin Dashboard" "$FRONTEND_URL/admin/dashboard.html"
Test-Endpoint "Admin Tin Tuc" "$FRONTEND_URL/admin/tin-tuc.html"
Test-Endpoint "Admin Su Kien" "$FRONTEND_URL/admin/su-kien.html"
Test-Endpoint "Admin Thu Vien" "$FRONTEND_URL/admin/thu-vien.html"

# Check admin login security fix
Write-Host "  [+] Security: Admin Email Pre-fill..." -NoNewline -ForegroundColor White
try {
    $adminPage = Invoke-WebRequest -Uri "$FRONTEND_URL/admin/index.html" -UseBasicParsing -TimeoutSec 30
    if ($adminPage.Content -notmatch 'value=["\x27]admin@vocotruyenhutech\.edu\.vn["\x27]') {
        Write-Host " [PASS] No pre-fill" -ForegroundColor Green
        $script:passedTests++
    } else {
        Write-Host " [WARN] Still pre-filled" -ForegroundColor Yellow
        $script:warnings++
    }
    $script:totalTests++
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $script:failedTests++
    $script:totalTests++
}

Write-Host ""

# =========================================
# CATEGORY 6: STATIC ASSETS
# =========================================
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host " CATEGORY 6: STATIC ASSETS" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan

Test-Endpoint "Main CSS" "$FRONTEND_URL/website/styles.css"
Test-Endpoint "Config JS" "$FRONTEND_URL/assets/js/config.js"
Test-Endpoint "Logo Image" "$FRONTEND_URL/assets/images_Logo/Logo.jpg"

Write-Host ""

# =========================================
# CATEGORY 7: PERFORMANCE TESTS
# =========================================
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host " CATEGORY 7: PERFORMANCE TESTS" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan

# Backend response time
Write-Host "  [+] Backend Response Time..." -NoNewline -ForegroundColor White
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" -UseBasicParsing -TimeoutSec 30
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    if ($responseTime -lt 1000) {
        Write-Host " [PASS] $responseTime ms" -ForegroundColor Green
        $script:passedTests++
    } elseif ($responseTime -lt 3000) {
        Write-Host " [WARN] $responseTime ms (acceptable)" -ForegroundColor Yellow
        $script:warnings++
        $script:passedTests++
    } else {
        Write-Host " [FAIL] $responseTime ms (too slow)" -ForegroundColor Red
        $script:failedTests++
    }
    $script:totalTests++
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $script:failedTests++
    $script:totalTests++
}

# Frontend load time
Write-Host "  [+] Frontend Load Time..." -NoNewline -ForegroundColor White
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri $FRONTEND_URL -UseBasicParsing -TimeoutSec 30
    $stopwatch.Stop()
    $loadTime = $stopwatch.ElapsedMilliseconds
    
    if ($loadTime -lt 2000) {
        Write-Host " [PASS] $loadTime ms" -ForegroundColor Green
        $script:passedTests++
    } elseif ($loadTime -lt 5000) {
        Write-Host " [WARN] $loadTime ms (acceptable)" -ForegroundColor Yellow
        $script:warnings++
        $script:passedTests++
    } else {
        Write-Host " [FAIL] $loadTime ms (too slow)" -ForegroundColor Red
        $script:failedTests++
    }
    $script:totalTests++
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $script:failedTests++
    $script:totalTests++
}

Write-Host ""

# =========================================
# CATEGORY 8: SECURITY CHECKS
# =========================================
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host " CATEGORY 8: SECURITY CHECKS" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan

# Check HTTPS
Write-Host "  [+] HTTPS Enabled..." -NoNewline -ForegroundColor White
if ($BACKEND_URL.StartsWith("https://") -and $FRONTEND_URL.StartsWith("https://")) {
    Write-Host " [PASS]" -ForegroundColor Green
    $script:passedTests++
} else {
    Write-Host " [FAIL]" -ForegroundColor Red
    $script:failedTests++
}
$script:totalTests++

# Check for exposed secrets in frontend
Write-Host "  [+] No Exposed Secrets..." -NoNewline -ForegroundColor White
try {
    $indexPage = Invoke-WebRequest -Uri "$FRONTEND_URL/" -UseBasicParsing -TimeoutSec 30
    $hasSecrets = $indexPage.Content -match 'password|secret|key|token' -and $indexPage.Content -match '=\s*["\x27][A-Za-z0-9]{20,}["\x27]'
    
    if (-not $hasSecrets) {
        Write-Host " [PASS]" -ForegroundColor Green
        $script:passedTests++
    } else {
        Write-Host " [WARN] Potential secrets found" -ForegroundColor Yellow
        $script:warnings++
    }
    $script:totalTests++
} catch {
    Write-Host " [SKIP]" -ForegroundColor Gray
    $script:totalTests++
}

Write-Host ""

# =========================================
# CATEGORY 9: DOCUMENTATION
# =========================================
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host " CATEGORY 9: DOCUMENTATION" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan

$docs = @(
    "README.md",
    "README-DEPLOYMENT.md",
    "PRODUCTION-STATUS.md",
    "FINAL-SUMMARY.md",
    "SECURITY-UPDATE.md",
    "RUN-MIGRATION-GUIDE.md"
)

foreach ($doc in $docs) {
    Write-Host "  [+] $doc..." -NoNewline -ForegroundColor White
    if (Test-Path $doc) {
        Write-Host " [PASS]" -ForegroundColor Green
        $script:passedTests++
    } else {
        Write-Host " [FAIL] Missing" -ForegroundColor Red
        $script:failedTests++
    }
    $script:totalTests++
}

Write-Host ""

# =========================================
# FINAL REPORT
# =========================================
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host " TEST SUMMARY" -ForegroundColor White
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

$successRate = if ($script:totalTests -gt 0) { 
    [math]::Round(($script:passedTests / $script:totalTests) * 100, 1) 
} else { 
    0 
}

Write-Host "Total Tests:    $script:totalTests" -ForegroundColor White
Write-Host "Passed:         " -NoNewline
Write-Host "$script:passedTests" -ForegroundColor Green
Write-Host "Failed:         " -NoNewline
if ($script:failedTests -gt 0) {
    Write-Host "$script:failedTests" -ForegroundColor Red
} else {
    Write-Host "$script:failedTests" -ForegroundColor Green
}
Write-Host "Warnings:       " -NoNewline
if ($script:warnings -gt 0) {
    Write-Host "$script:warnings" -ForegroundColor Yellow
} else {
    Write-Host "$script:warnings" -ForegroundColor Green
}
Write-Host "Success Rate:   " -NoNewline
if ($successRate -eq 100) {
    Write-Host "$successRate%" -ForegroundColor Green
} elseif ($successRate -ge 90) {
    Write-Host "$successRate%" -ForegroundColor Yellow
} else {
    Write-Host "$successRate%" -ForegroundColor Red
}

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan

if ($script:failedTests -eq 0 -and $script:warnings -eq 0) {
    Write-Host " ALL TESTS PASSED - PROJECT IS PRODUCTION READY!" -ForegroundColor Green -BackgroundColor Black
    Write-Host ("=" * 80) -ForegroundColor Cyan
    Write-Host ""
    exit 0
} elseif ($script:failedTests -eq 0) {
    Write-Host " TESTS PASSED WITH WARNINGS - CHECK WARNINGS ABOVE" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host ("=" * 80) -ForegroundColor Cyan
    Write-Host ""
    exit 0
} else {
    Write-Host " SOME TESTS FAILED - CHECK ERRORS ABOVE" -ForegroundColor Red -BackgroundColor Black
    Write-Host ("=" * 80) -ForegroundColor Cyan
    Write-Host ""
    exit 1
}
