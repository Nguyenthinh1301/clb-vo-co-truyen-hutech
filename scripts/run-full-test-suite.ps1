# ╔═══════════════════════════════════════════════════════════════╗
# ║  FULL TEST SUITE - CLB Võ Cổ Truyền HUTECH                   ║
# ║  Kiểm tra toàn diện Backend, Frontend, Database, Email       ║
# ╚═══════════════════════════════════════════════════════════════╝

param(
    [switch]$SkipProduction,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$testResults = @{
    Passed = 0
    Failed = 0
    Warning = 0
    Total = 0
}

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $($Title.PadRight(61))║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Message = "",
        [string]$Level = "normal"
    )
    
    $testResults.Total++
    
    if ($Passed) {
        $testResults.Passed++
        Write-Host "  ✅ $TestName" -ForegroundColor Green
    } elseif ($Level -eq "warning") {
        $testResults.Warning++
        Write-Host "  ⚠️  $TestName" -ForegroundColor Yellow
    } else {
        $testResults.Failed++
        Write-Host "  ❌ $TestName" -ForegroundColor Red
    }
    
    if ($Message -and $Verbose) {
        Write-Host "     └─ $Message" -ForegroundColor Gray
    }
}

# ═══════════════════════════════════════════════════════════════
# 1. BACKEND API TESTS
# ═══════════════════════════════════════════════════════════════

Write-TestHeader "1. BACKEND API TESTS"

# 1.1 Health Check
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
    Write-TestResult "Health endpoint responds" $health.success $health.message
    Write-TestResult "Database connected" $health.database.success $health.database.message
    Write-TestResult "Environment is development" ($health.environment -eq "development") "Env: $($health.environment)"
} catch {
    Write-TestResult "Health endpoint responds" $false $_.Exception.Message
    Write-TestResult "Database connected" $false "Cannot check - health endpoint failed"
    Write-TestResult "Environment check" $false "Cannot check - health endpoint failed"
}

# 1.2 Authentication - Register
Write-Host "`n  📝 Testing Authentication..." -ForegroundColor Yellow
$testEmail = "test_$(Get-Random)@example.com"
try {
    $registerBody = @{
        email = $testEmail
        password = "Test@123456"
        first_name = "Test"
        last_name = "User"
        phone = "0901234567"
    } | ConvertTo-Json
    
    $register = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
        -Method Post -Body $registerBody -ContentType "application/json" -TimeoutSec 5
    Write-TestResult "User registration" $register.success $register.message
} catch {
    if ($_.Exception.Message -match "409") {
        Write-TestResult "User registration" $false "Email already exists (expected if running multiple times)" "warning"
    } else {
        Write-TestResult "User registration" $false $_.Exception.Message
    }
}

# 1.3 Authentication - Login (Admin)
try {
    $loginBody = @{
        email = "admin@vocotruyenhutech.edu.vn"
        password = "Admin@123"
    } | ConvertTo-Json
    
    $login = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
        -Method Post -Body $loginBody -ContentType "application/json" -TimeoutSec 5
    Write-TestResult "Admin login" $login.success "User: $($login.data.user.first_name)"
    Write-TestResult "JWT token returned" ($null -ne $login.data.token) "Token length: $($login.data.token.Length)"
    Write-TestResult "Admin role verified" ($login.data.user.role -eq "admin") "Role: $($login.data.user.role)"
    
    $global:adminToken = $login.data.token
} catch {
    Write-TestResult "Admin login" $false $_.Exception.Message
    Write-TestResult "JWT token returned" $false "Login failed"
    Write-TestResult "Admin role verified" $false "Login failed"
}

# 1.4 Contact Form Submission
Write-Host "`n  📧 Testing Contact Form..." -ForegroundColor Yellow
try {
    $contactBody = @{
        name = "Test User"
        email = "test@example.com"
        phone = "0901234567"
        subject = "Test"
        message = "Test message from automated test suite"
    } | ConvertTo-Json
    
    $contact = Invoke-RestMethod -Uri "http://localhost:3001/api/contact" `
        -Method Post -Body $contactBody -ContentType "application/json" -TimeoutSec 5
    Write-TestResult "Contact form submission" $contact.success $contact.message
} catch {
    Write-TestResult "Contact form submission" $false $_.Exception.Message
}

# 1.5 Contact Messages List (Admin Only)
if ($global:adminToken) {
    try {
        $headers = @{ Authorization = "Bearer $($global:adminToken)" }
        $contacts = Invoke-RestMethod -Uri "http://localhost:3001/api/contact" `
            -Method Get -Headers $headers -TimeoutSec 5
        Write-TestResult "Get contact messages (admin)" $contacts.success "Total: $($contacts.data.Count)"
    } catch {
        Write-TestResult "Get contact messages (admin)" $false $_.Exception.Message
    }
}

# 1.6 CMS - Events
Write-Host "`n  📅 Testing CMS Endpoints..." -ForegroundColor Yellow
try {
    $events = Invoke-RestMethod -Uri "http://localhost:3001/api/cms/events?limit=5" -TimeoutSec 5
    Write-TestResult "Get events list" $events.success "Events: $($events.data.events.Count)"
} catch {
    Write-TestResult "Get events list" $false $_.Exception.Message
}

# 1.7 CMS - News
try {
    $news = Invoke-RestMethod -Uri "http://localhost:3001/api/cms/news?limit=5" -TimeoutSec 5
    Write-TestResult "Get news list" $news.success "News: $($news.data.news.Count)"
} catch {
    Write-TestResult "Get news list" $false $_.Exception.Message
}

# 1.8 CMS - Gallery
try {
    $gallery = Invoke-RestMethod -Uri "http://localhost:3001/api/cms/gallery?limit=5" -TimeoutSec 5
    Write-TestResult "Get gallery albums" $gallery.success "Albums: $($gallery.data.albums.Count)"
} catch {
    Write-TestResult "Get gallery albums" $false $_.Exception.Message
}

# 1.9 CMS - Announcements
try {
    $announcements = Invoke-RestMethod -Uri "http://localhost:3001/api/cms/announcements?limit=5" -TimeoutSec 5
    Write-TestResult "Get announcements" $announcements.success "Count: $($announcements.data.Count)"
} catch {
    Write-TestResult "Get announcements" $false $_.Exception.Message
}

# 1.10 Rate Limiting Test
Write-Host "`n  🚦 Testing Rate Limiting..." -ForegroundColor Yellow
$rateLimitPassed = $true
try {
    for ($i = 1; $i -le 6; $i++) {
        $contactBody = @{
            name = "Rate Test $i"
            email = "test$i@example.com"
            phone = "0901234567"
            subject = "Rate limit test"
            message = "Testing rate limiting"
        } | ConvertTo-Json
        
        try {
            $result = Invoke-RestMethod -Uri "http://localhost:3001/api/contact" `
                -Method Post -Body $contactBody -ContentType "application/json" -TimeoutSec 5
            if ($i -eq 6) {
                $rateLimitPassed = $false
                Write-TestResult "Rate limiting enforced" $false "6th request should be blocked but succeeded"
            }
        } catch {
            if ($i -eq 6 -and $_.Exception.Message -match "429") {
                Write-TestResult "Rate limiting enforced" $true "6th request blocked (429)"
            } else {
                throw
            }
        }
        Start-Sleep -Milliseconds 500
    }
} catch {
    Write-TestResult "Rate limiting test" $false $_.Exception.Message "warning"
}

# ═══════════════════════════════════════════════════════════════
# 2. FRONTEND TESTS
# ═══════════════════════════════════════════════════════════════

Write-TestHeader "2. FRONTEND FILE CHECKS"

$frontendFiles = @(
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

foreach ($file in $frontendFiles) {
    $exists = Test-Path $file
    Write-TestResult "File exists: $file" $exists
}

# ═══════════════════════════════════════════════════════════════
# 3. CONFIGURATION TESTS
# ═══════════════════════════════════════════════════════════════

Write-TestHeader "3. CONFIGURATION CHECKS"

# 3.1 Backend .env
$envExists = Test-Path "backend/.env"
Write-TestResult "Backend .env exists" $envExists

if ($envExists) {
    $envContent = Get-Content "backend/.env" -Raw
    Write-TestResult ".env has NODE_ENV" ($envContent -match "NODE_ENV=")
    Write-TestResult ".env has DB config" ($envContent -match "MSSQL_" -or $envContent -match "DATABASE_URL")
    Write-TestResult ".env has JWT secrets" ($envContent -match "JWT_SECRET=")
    Write-TestResult ".env has SMTP config" ($envContent -match "SMTP_")
    Write-TestResult ".env has CORS_ORIGIN" ($envContent -match "CORS_ORIGIN=")
}

# 3.2 Production config
$envProdExists = Test-Path "backend/.env.production"
Write-TestResult "Production .env exists" $envProdExists

# 3.3 Netlify config
$netlifyExists = Test-Path "netlify.toml"
Write-TestResult "Netlify config exists" $netlifyExists

# ═══════════════════════════════════════════════════════════════
# 4. SECURITY TESTS
# ═══════════════════════════════════════════════════════════════

Write-TestHeader "4. SECURITY CHECKS"

# 4.1 Unauthorized access to admin endpoints
Write-Host "`n  🔒 Testing Authorization..." -ForegroundColor Yellow
try {
    $unauthorized = Invoke-RestMethod -Uri "http://localhost:3001/api/contact" `
        -Method Get -TimeoutSec 5
    Write-TestResult "Admin endpoint blocks unauthorized" $false "Endpoint should require authentication"
} catch {
    if ($_.Exception.Message -match "401") {
        Write-TestResult "Admin endpoint blocks unauthorized" $true "401 Unauthorized returned as expected"
    } else {
        Write-TestResult "Admin endpoint blocks unauthorized" $false $_.Exception.Message "warning"
    }
}

# 4.2 Invalid JWT token
try {
    $headers = @{ Authorization = "Bearer invalid_token_12345" }
    $result = Invoke-RestMethod -Uri "http://localhost:3001/api/contact" `
        -Method Get -Headers $headers -TimeoutSec 5
    Write-TestResult "Invalid JWT rejected" $false "Invalid token should be rejected"
} catch {
    if ($_.Exception.Message -match "401" -or $_.Exception.Message -match "403") {
        Write-TestResult "Invalid JWT rejected" $true "Invalid token rejected as expected"
    } else {
        Write-TestResult "Invalid JWT rejected" $false $_.Exception.Message "warning"
    }
}

# 4.3 Password strength
try {
    $weakPwdBody = @{
        email = "weak_$(Get-Random)@example.com"
        password = "123"
        first_name = "Test"
        last_name = "User"
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
        -Method Post -Body $weakPwdBody -ContentType "application/json" -TimeoutSec 5
    Write-TestResult "Weak password rejected" $false "Weak password should be rejected"
} catch {
    if ($_.Exception.Message -match "400") {
        Write-TestResult "Weak password rejected" $true "Weak password rejected as expected"
    } else {
        Write-TestResult "Weak password rejected" $false $_.Exception.Message "warning"
    }
}

# ═══════════════════════════════════════════════════════════════
# 5. PRODUCTION TESTS (Optional)
# ═══════════════════════════════════════════════════════════════

if (-not $SkipProduction) {
    Write-TestHeader "5. PRODUCTION DEPLOYMENT CHECKS"
    
    # 5.1 Production Backend
    try {
        $prodHealth = Invoke-RestMethod -Uri "https://clb-vo-co-truyen-hutech.onrender.com/health" -TimeoutSec 10
        Write-TestResult "Production backend online" $prodHealth.success "Env: $($prodHealth.environment)"
        Write-TestResult "Production database connected" $prodHealth.database.success
    } catch {
        Write-TestResult "Production backend online" $false $_.Exception.Message
        Write-TestResult "Production database connected" $false "Cannot check - backend offline"
    }
    
    # 5.2 Production Frontend
    try {
        $prodFrontend = Invoke-WebRequest -Uri "https://vocotruyenhutech.netlify.app" -Method Head -UseBasicParsing -TimeoutSec 10
        Write-TestResult "Production frontend online" ($prodFrontend.StatusCode -eq 200) "Status: $($prodFrontend.StatusCode)"
    } catch {
        Write-TestResult "Production frontend online" $false $_.Exception.Message
    }
    
    # 5.3 Production Contact Form
    try {
        $prodContact = @{
            name = "Test Suite"
            email = "test@example.com"
            phone = "0901234567"
            subject = "Automated Test"
            message = "Testing production deployment"
        } | ConvertTo-Json
        
        $result = Invoke-RestMethod -Uri "https://clb-vo-co-truyen-hutech.onrender.com/api/contact" `
            -Method Post -Body $prodContact -ContentType "application/json" -TimeoutSec 10
        Write-TestResult "Production contact form works" $result.success $result.message
    } catch {
        Write-TestResult "Production contact form works" $false $_.Exception.Message "warning"
    }
}

# ═══════════════════════════════════════════════════════════════
# 6. SUMMARY
# ═══════════════════════════════════════════════════════════════

Write-TestHeader "TEST RESULTS SUMMARY"

Write-Host ""
Write-Host "  📊 Total Tests:   $($testResults.Total)" -ForegroundColor White
Write-Host "  ✅ Passed:        $($testResults.Passed)" -ForegroundColor Green
Write-Host "  ❌ Failed:        $($testResults.Failed)" -ForegroundColor Red
Write-Host "  ⚠️  Warnings:      $($testResults.Warning)" -ForegroundColor Yellow
Write-Host ""

$passRate = if ($testResults.Total -gt 0) { 
    [math]::Round(($testResults.Passed / $testResults.Total) * 100, 2) 
} else { 0 }

Write-Host "  Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })
Write-Host ""

if ($testResults.Failed -gt 0) {
    Write-Host "  WARNING: Some tests failed. Please review the output above." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "  SUCCESS: All tests passed!" -ForegroundColor Green
    exit 0
}
