# Test Suite - CLB Vo Co Truyen HUTECH
# Simple version without emojis

$passed = 0
$failed = 0
$warning = 0

function Test-Item {
    param([string]$Name, [bool]$Result, [string]$Message = "")
    if ($Result) {
        Write-Host "[PASS] $Name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "[FAIL] $Name" -ForegroundColor Red
        if ($Message) { Write-Host "       $Message" -ForegroundColor Gray }
        $script:failed++
    }
}

function Test-Warn {
    param([string]$Name, [string]$Message = "")
    Write-Host "[WARN] $Name" -ForegroundColor Yellow
    if ($Message) { Write-Host "       $Message" -ForegroundColor Gray }
    $script:warning++
}

Write-Host "`n=== BACKEND API TESTS ===" -ForegroundColor Cyan

# Health Check
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
    Test-Item "Health endpoint" $health.success
    Test-Item "Database connected" $health.database.success
} catch {
    Test-Item "Health endpoint" $false $_.Exception.Message
    Test-Item "Database connected" $false
}

# Admin Login
try {
    $body = @{email='admin@vocotruyenhutech.edu.vn';password='Admin@123'} | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5
    Test-Item "Admin login" $login.success
    Test-Item "JWT token returned" ($null -ne $login.data.token)
    Test-Item "Admin role correct" ($login.data.user.role -eq "admin")
    $token = $login.data.token
} catch {
    Test-Item "Admin login" $false $_.Exception.Message
    Test-Item "JWT token returned" $false
    Test-Item "Admin role correct" $false
}

# Contact Form
try {
    $body = @{name='Test';email='test@example.com';phone='0901234567';subject='Test';message='Test'} | ConvertTo-Json
    $contact = Invoke-RestMethod -Uri "http://localhost:3001/api/contact" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5
    Test-Item "Contact form submission" $contact.success
} catch {
    Test-Item "Contact form submission" $false $_.Exception.Message
}

# Events API
try {
    $events = Invoke-RestMethod -Uri "http://localhost:3001/api/cms/events?limit=5" -TimeoutSec 5
    Test-Item "Get events list" $events.success
} catch {
    Test-Item "Get events list" $false $_.Exception.Message
}

# News API
try {
    $news = Invoke-RestMethod -Uri "http://localhost:3001/api/cms/news?limit=5" -TimeoutSec 5
    Test-Item "Get news list" $news.success
} catch {
    Test-Item "Get news list" $false $_.Exception.Message
}

# Gallery API
try {
    $gallery = Invoke-RestMethod -Uri "http://localhost:3001/api/cms/gallery?limit=5" -TimeoutSec 5
    Test-Item "Get gallery albums" $gallery.success
} catch {
    Test-Item "Get gallery albums" $false $_.Exception.Message
}

# Announcements API
try {
    $announcements = Invoke-RestMethod -Uri "http://localhost:3001/api/cms/announcements?limit=5" -TimeoutSec 5
    Test-Item "Get announcements" $announcements.success
} catch {
    Test-Item "Get announcements" $false $_.Exception.Message
}

Write-Host "`n=== FRONTEND FILE CHECKS ===" -ForegroundColor Cyan

$files = @(
    "website/index.html",
    "website/admin/index.html",
    "website/admin/dashboard.html",
    "website/components/header.html",
    "website/components/footer.html",
    "website/components/contact-section.html",
    "website/components/gallery-section.html",
    "website/assets/js/config.js",
    "website/styles.css"
)

foreach ($file in $files) {
    Test-Item "File: $file" (Test-Path $file)
}

Write-Host "`n=== CONFIGURATION CHECKS ===" -ForegroundColor Cyan

Test-Item "backend/.env exists" (Test-Path "backend/.env")
Test-Item "backend/.env.production exists" (Test-Path "backend/.env.production")
Test-Item "netlify.toml exists" (Test-Path "netlify.toml")

if (Test-Path "backend/.env") {
    $env = Get-Content "backend/.env" -Raw
    Test-Item ".env has NODE_ENV" ($env -match "NODE_ENV=")
    Test-Item ".env has DB config" ($env -match "MSSQL_|DATABASE_URL")
    Test-Item ".env has JWT secrets" ($env -match "JWT_SECRET=")
    Test-Item ".env has SMTP config" ($env -match "SMTP_")
    Test-Item ".env has CORS_ORIGIN" ($env -match "CORS_ORIGIN=")
}

Write-Host "`n=== SECURITY TESTS ===" -ForegroundColor Cyan

# Unauthorized access
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3001/api/contact" -Method Get -TimeoutSec 5
    Test-Item "Admin endpoint blocks unauthorized" $false
} catch {
    if ($_.Exception.Message -match "401") {
        Test-Item "Admin endpoint blocks unauthorized" $true
    } else {
        Test-Warn "Admin endpoint auth check" $_.Exception.Message
    }
}

# Invalid JWT
try {
    $headers = @{Authorization="Bearer invalid_token"}
    $result = Invoke-RestMethod -Uri "http://localhost:3001/api/contact" -Method Get -Headers $headers -TimeoutSec 5
    Test-Item "Invalid JWT rejected" $false
} catch {
    if ($_.Exception.Message -match "401|403") {
        Test-Item "Invalid JWT rejected" $true
    } else {
        Test-Warn "Invalid JWT check" $_.Exception.Message
    }
}

Write-Host "`n=== PRODUCTION CHECKS ===" -ForegroundColor Cyan

# Production Backend
try {
    $prod = Invoke-RestMethod -Uri "https://clb-vo-co-truyen-hutech.onrender.com/health" -TimeoutSec 10
    Test-Item "Production backend online" $prod.success
    Test-Item "Production database connected" $prod.database.success
} catch {
    Test-Warn "Production backend" $_.Exception.Message
}

# Production Frontend
try {
    $prod = Invoke-WebRequest -Uri "https://vocotruyenhutech.netlify.app" -Method Head -UseBasicParsing -TimeoutSec 10
    Test-Item "Production frontend online" ($prod.StatusCode -eq 200)
} catch {
    Test-Warn "Production frontend" $_.Exception.Message
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
$total = $passed + $failed + $warning
Write-Host "Total:    $total" -ForegroundColor White
Write-Host "Passed:   $passed" -ForegroundColor Green
Write-Host "Failed:   $failed" -ForegroundColor Red
Write-Host "Warnings: $warning" -ForegroundColor Yellow

$passRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }
Write-Host "`nPass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })

if ($failed -gt 0) {
    Write-Host "`nResult: SOME TESTS FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nResult: ALL TESTS PASSED" -ForegroundColor Green
    exit 0
}
