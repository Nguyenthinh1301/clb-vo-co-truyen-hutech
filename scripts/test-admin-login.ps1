#!/usr/bin/env pwsh
# Test Admin Login System

Write-Host "`nTEST ADMIN LOGIN SYSTEM`n" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Gray

$passed = 0
$failed = 0
$warnings = 0

# Configuration
$LOCAL_API = "http://localhost:3001/api"
$PROD_API = "https://clb-vo-co-truyen-hutech.onrender.com/api"
$ADMIN_EMAIL = "admin@vocotruyenhutech.edu.vn"
# Không ghi mật khẩu vào file: lấy từ biến môi trường ADMIN_PASSWORD, nếu không có thì hỏi khi chạy
$ADMIN_PASS = $env:ADMIN_PASSWORD
if (-not $ADMIN_PASS) {
    $secure = Read-Host "Nhập mật khẩu admin" -AsSecureString
    $ADMIN_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

function Test-ApiEndpoint {
    param($url, $name)
    
    Write-Host "Testing: $name..." -ForegroundColor Yellow -NoNewline
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 5 -ErrorAction Stop
        if ($response.success) {
            Write-Host " [OK]" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
    return $false
}

function Test-Login {
    param($apiBase, $email, $password, $expectedSuccess)
    
    $url = "$apiBase/auth/login"
    $body = @{
        email = $email
        password = $password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post `
            -Body $body -ContentType "application/json" `
            -TimeoutSec 10 -ErrorAction Stop
        
        if ($expectedSuccess) {
            if ($response.success -and $response.data.token) {
                Write-Host " [OK]" -ForegroundColor Green
                return $true
            } else {
                Write-Host " [FAIL]" -ForegroundColor Red
                Write-Host "   Expected success but got: $($response.message)" -ForegroundColor Gray
            }
        } else {
            Write-Host " [UNEXPECTED SUCCESS]" -ForegroundColor Yellow
        }
    } catch {
        if (-not $expectedSuccess) {
            Write-Host " [OK] (Expected failure)" -ForegroundColor Green
            return $true
        } else {
            Write-Host " [FAIL]" -ForegroundColor Red
            $errorMsg = $_.ErrorDetails.Message
            if ($errorMsg) {
                $errorObj = $errorMsg | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($errorObj.message) {
                    Write-Host "   Error: $($errorObj.message)" -ForegroundColor Gray
                }
            }
        }
    }
    return $false
}

# Test 1: Backend Health Check (Local)
Write-Host "1. Backend Health (Local)" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------" -ForegroundColor Gray

if (Test-ApiEndpoint "$LOCAL_API/../health" "Local backend health") {
    $passed++
    $localAvailable = $true
} else {
    $failed++
    $localAvailable = $false
    Write-Host "   [!] Local backend not running. Start with: cd backend && npm run dev" -ForegroundColor Yellow
}

# Test 2: Backend Health Check (Production)
Write-Host "`n2. Backend Health (Production)" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------" -ForegroundColor Gray

if (Test-ApiEndpoint "$PROD_API/../health" "Production backend health") {
    $passed++
    $prodAvailable = $true
} else {
    $failed++
    $prodAvailable = $false
}

# Test 3: Admin Login (Local)
if ($localAvailable) {
    Write-Host "`n3. Admin Login (Local)" -ForegroundColor Cyan
    Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "Testing: Admin login with correct credentials..." -ForegroundColor Yellow -NoNewline
    
    if (Test-Login $LOCAL_API $ADMIN_EMAIL $ADMIN_PASS $true) {
        $passed++
    } else {
        $failed++
    }
} else {
    Write-Host "`n3. Admin Login (Local)" -ForegroundColor Cyan
    Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "   [SKIP] Local backend not available" -ForegroundColor Yellow
    $warnings++
}

# Test 4: Wrong Password (Local)
if ($localAvailable) {
    Write-Host "`n4. Wrong Password Rejection (Local)" -ForegroundColor Cyan
    Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "Testing: Login with wrong password..." -ForegroundColor Yellow -NoNewline
    
    if (Test-Login $LOCAL_API $ADMIN_EMAIL "WrongPassword123" $false) {
        $passed++
    } else {
        $failed++
    }
} else {
    Write-Host "`n4. Wrong Password Rejection (Local)" -ForegroundColor Cyan
    Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "   [SKIP] Local backend not available" -ForegroundColor Yellow
    $warnings++
}

# Test 5: Admin Login (Production)
if ($prodAvailable) {
    Write-Host "`n5. Admin Login (Production)" -ForegroundColor Cyan
    Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "Testing: Admin login on production..." -ForegroundColor Yellow -NoNewline
    
    if (Test-Login $PROD_API $ADMIN_EMAIL $ADMIN_PASS $true) {
        $passed++
    } else {
        $failed++
    }
} else {
    Write-Host "`n5. Admin Login (Production)" -ForegroundColor Cyan
    Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "   [SKIP] Production backend not available" -ForegroundColor Yellow
    $warnings++
}

# Test 6: Check Admin Files Exist
Write-Host "`n6. Admin Files Check" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------" -ForegroundColor Gray

$adminFiles = @(
    "website\admin\index.html",
    "website\admin\dashboard.html",
    "website\assets\js\config.js",
    "backend\routes\auth.js",
    "backend\middleware\auth.js"
)

$filesOk = $true
foreach ($file in $adminFiles) {
    Write-Host "Checking: $file..." -ForegroundColor Yellow -NoNewline
    if (Test-Path $file) {
        Write-Host " [OK]" -ForegroundColor Green
    } else {
        Write-Host " [MISSING]" -ForegroundColor Red
        $filesOk = $false
    }
}

if ($filesOk) {
    $passed++
} else {
    $failed++
}

# Test 7: API Configuration
Write-Host "`n7. API Configuration Check" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------" -ForegroundColor Gray

$configFile = "website\assets\js\config.js"
if (Test-Path $configFile) {
    $content = Get-Content $configFile -Raw
    
    Write-Host "Checking: Production API URL..." -ForegroundColor Yellow -NoNewline
    if ($content -match "PRODUCTION_API_BASE\s*=\s*'https://clb-vo-co-truyen-hutech.onrender.com/api'") {
        Write-Host " [OK]" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [WARNING]" -ForegroundColor Yellow
        Write-Host "   Production API URL may not be configured correctly" -ForegroundColor Gray
        $warnings++
    }
} else {
    Write-Host "   [FAIL] config.js not found" -ForegroundColor Red
    $failed++
}

# Summary
Write-Host "`n============================================================" -ForegroundColor Gray
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

$total = $passed + $failed + $warnings
Write-Host "  Passed:   $passed" -ForegroundColor Green
Write-Host "  Failed:   $failed" -ForegroundColor $(if($failed -eq 0){"Gray"}else{"Red"})
Write-Host "  Warnings: $warnings" -ForegroundColor $(if($warnings -eq 0){"Gray"}else{"Yellow"})
Write-Host "  Total:    $total`n" -ForegroundColor White

if ($failed -eq 0 -and $warnings -eq 0) {
    Write-Host "[OK] All tests passed!" -ForegroundColor Green
    Write-Host "`nAdmin login system is working correctly.`n" -ForegroundColor Green
    exit 0
} elseif ($failed -eq 0) {
    Write-Host "[!] Tests passed with warnings" -ForegroundColor Yellow
    Write-Host "`nSome components not available for testing.`n" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "[X] Some tests failed" -ForegroundColor Red
    Write-Host "`nPlease review the failures above.`n" -ForegroundColor Red
    exit 1
}
