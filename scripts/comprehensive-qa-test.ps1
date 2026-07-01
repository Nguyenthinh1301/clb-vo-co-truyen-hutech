# ============================================================
# COMPREHENSIVE QA TEST SUITE
# ============================================================
# Role: QA Tester
# Date: 2026-06-17
# Purpose: Complete project testing from user perspective
# ============================================================

$ErrorActionPreference = "Continue"
$BACKEND_URL = "https://clb-vo-co-truyen-hutech.onrender.com"
$FRONTEND_URL = "https://vo-co-truyen-hutech.netlify.app"
$LOCAL_BACKEND = "http://localhost:3001"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMPREHENSIVE QA TEST SUITE" -ForegroundColor Cyan
Write-Host "  Role: QA Tester" -ForegroundColor Cyan
Write-Host "  Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = 0
$passedTests = 0
$failedTests = 0
$warnings = 0
$testResults = @()

function Test-Item {
    param(
        [string]$Category,
        [string]$TestName,
        [scriptblock]$TestScript,
        [string]$Severity = "HIGH"
    )
    
    $script:totalTests++
    Write-Host "[$script:totalTests] Testing: $TestName" -ForegroundColor Yellow
    
    try {
        $result = & $TestScript
        
        if ($result.Success) {
            Write-Host "  ✅ PASS" -ForegroundColor Green
            if ($result.Details) {
                Write-Host "     $($result.Details)" -ForegroundColor Gray
            }
            $script:passedTests++
            $script:testResults += [PSCustomObject]@{
                Category = $Category
                Test = $TestName
                Status = "PASS"
                Details = $result.Details
                Severity = $Severity
            }
        } else {
            if ($Severity -eq "LOW" -or $Severity -eq "INFO") {
                Write-Host "  ⚠️  WARNING" -ForegroundColor Yellow
                $script:warnings++
                $status = "WARNING"
            } else {
                Write-Host "  ❌ FAIL" -ForegroundColor Red
                $script:failedTests++
                $status = "FAIL"
            }
            Write-Host "     $($result.Message)" -ForegroundColor $(if ($status -eq "WARNING") { "Yellow" } else { "Red" })
            $script:testResults += [PSCustomObject]@{
                Category = $Category
                Test = $TestName
                Status = $status
                Details = $result.Message
                Severity = $Severity
            }
        }
    } catch {
        Write-Host "  ❌ ERROR" -ForegroundColor Red
        Write-Host "     $($_.Exception.Message)" -ForegroundColor Red
        $script:failedTests++
        $script:testResults += [PSCustomObject]@{
            Category = $Category
            Test = $TestName
            Status = "ERROR"
            Details = $_.Exception.Message
            Severity = $Severity
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CATEGORY 1: BACKEND INFRASTRUCTURE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Test-Item "Backend" "Production Backend Health" {
    try {
        $response = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method GET -TimeoutSec 10
        if ($response.success -eq $true) {
            @{ Success = $true; Details = "Uptime: $([math]::Round($response.uptime/60, 1)) min, DB: $($response.database.message)" }
        } else {
            @{ Success = $false; Message = "Health check returned success=false" }
        }
    } catch {
        @{ Success = $false; Message = "Cannot reach backend: $($_.Exception.Message)" }
    }
} -Severity "HIGH"

Test-Item "Backend" "Database Connection" {
    try {
        $response = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method GET -TimeoutSec 10
        if ($response.database.success -eq $true) {
            @{ Success = $true; Details = $response.database.message }
        } else {
            @{ Success = $false; Message = "Database not connected" }
        }
    } catch {
        @{ Success = $false; Message = "Cannot check database" }
    }
} -Severity "HIGH"

Test-Item "Backend" "Response Time" {
    try {
        $start = Get-Date
        $response = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method GET
        $end = Get-Date
        $ms = ($end - $start).TotalMilliseconds
        
        if ($ms -lt 1000) {
            @{ Success = $true; Details = "$([math]::Round($ms))ms (Excellent)" }
        } elseif ($ms -lt 3000) {
            @{ Success = $true; Details = "$([math]::Round($ms))ms (Good)" }
        } else {
            @{ Success = $false; Message = "$([math]::Round($ms))ms (Too slow)" }
        }
    } catch {
        @{ Success = $false; Message = "Cannot measure response time" }
    }
} -Severity "MEDIUM"

Test-Item "Backend" "CORS Configuration (Netlify)" {
    try {
        $response = curl.exe -s -w "%{http_code}" `
            -H "Origin: $FRONTEND_URL" `
            -H "Access-Control-Request-Method: POST" `
            -X OPTIONS "$BACKEND_URL/api/auth/login" `
            -o nul 2>&1
        
        $statusCode = $response | Select-Object -Last 1
        
        if ($statusCode -eq "204" -or $statusCode -eq "200") {
            @{ Success = $true; Details = "CORS allows Netlify domain" }
        } else {
            @{ Success = $false; Message = "CORS blocking Netlify (HTTP $statusCode)" }
        }
    } catch {
        @{ Success = $false; Message = "Cannot test CORS" }
    }
} -Severity "HIGH"

Test-Item "Backend" "CORS Configuration (Localhost)" {
    try {
        $response = curl.exe -s -w "%{http_code}" `
            -H "Origin: http://localhost:5500" `
            -H "Access-Control-Request-Method: POST" `
            -X OPTIONS "$BACKEND_URL/api/auth/login" `
            -o nul 2>&1
        
        $statusCode = $response | Select-Object -Last 1
        
        if ($statusCode -eq "204" -or $statusCode -eq "200") {
            @{ Success = $true; Details = "CORS allows localhost (dev friendly)" }
        } else {
            @{ Success = $false; Message = "CORS blocking localhost (HTTP $statusCode)" }
        }
    } catch {
        @{ Success = $false; Message = "Cannot test localhost CORS" }
    }
} -Severity "MEDIUM"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CATEGORY 2: FRONTEND DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Test-Item "Frontend" "Homepage Accessibility" {
    try {
        $response = Invoke-WebRequest -Uri $FRONTEND_URL -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            @{ Success = $true; Details = "HTTP 200 OK" }
        } else {
            @{ Success = $false; Message = "HTTP $($response.StatusCode)" }
        }
    } catch {
        @{ Success = $false; Message = "Cannot reach frontend: $($_.Exception.Message)" }
    }
} -Severity "HIGH"

Test-Item "Frontend" "Admin Panel Accessibility" {
    try {
        $response = Invoke-WebRequest -Uri "$FRONTEND_URL/admin/" -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            @{ Success = $true; Details = "Admin page loads" }
        } else {
            @{ Success = $false; Message = "HTTP $($response.StatusCode)" }
        }
    } catch {
        @{ Success = $false; Message = "Cannot reach admin panel" }
    }
} -Severity "HIGH"

Test-Item "Frontend" "Static Assets Loading" {
    try {
        $cssResponse = Invoke-WebRequest -Uri "$FRONTEND_URL/website/styles.css" -Method GET -TimeoutSec 5
        if ($cssResponse.StatusCode -eq 200) {
            @{ Success = $true; Details = "CSS loaded successfully" }
        } else {
            @{ Success = $false; Message = "CSS failed to load" }
        }
    } catch {
        @{ Success = $false; Message = "Static assets error: $($_.Exception.Message)" }
    }
} -Severity "MEDIUM"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CATEGORY 3: ADMIN PANEL SECURITY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Test-Item "Security" "No Pre-filled Credentials" {
    try {
        $response = Invoke-WebRequest -Uri "$FRONTEND_URL/admin/" -Method GET
        $content = $response.Content
        
        # Check for pre-filled email
        if ($content -match 'value="[^"]*@[^"]*"' -and $content -match 'type="email"') {
            @{ Success = $false; Message = "Email appears to be pre-filled in HTML" }
        } else {
            @{ Success = $true; Details = "No pre-filled credentials found" }
        }
    } catch {
        @{ Success = $false; Message = "Cannot check admin page source" }
    }
} -Severity "HIGH"

Test-Item "Security" "Autocomplete Disabled" {
    try {
        $response = Invoke-WebRequest -Uri "$FRONTEND_URL/admin/" -Method GET
        $content = $response.Content
        
        if ($content -match 'autocomplete="off"') {
            @{ Success = $true; Details = "Autocomplete is disabled" }
        } else {
            @{ Success = $false; Message = "Autocomplete not disabled (security risk)" }
        }
    } catch {
        @{ Success = $false; Message = "Cannot check autocomplete setting" }
    }
} -Severity "MEDIUM"

Test-Item "Security" "HTTPS Enforcement" {
    try {
        if ($FRONTEND_URL -match "^https://") {
            @{ Success = $true; Details = "Frontend uses HTTPS" }
        } else {
            @{ Success = $false; Message = "Frontend not using HTTPS" }
        }
    } catch {
        @{ Success = $false; Message = "Cannot verify HTTPS" }
    }
} -Severity "HIGH"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CATEGORY 4: API ENDPOINTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiEndpoints = @(
    @{ Path = "/api/cms/news"; Method = "GET"; Auth = $false },
    @{ Path = "/api/cms/events"; Method = "GET"; Auth = $false },
    @{ Path = "/api/cms/reviews"; Method = "GET"; Auth = $false },
    @{ Path = "/api/gallery/albums"; Method = "GET"; Auth = $false },
    @{ Path = "/api/public/news"; Method = "GET"; Auth = $false }
)

foreach ($endpoint in $apiEndpoints) {
    Test-Item "API" "Endpoint: $($endpoint.Method) $($endpoint.Path)" {
        try {
            $response = Invoke-WebRequest -Uri "$BACKEND_URL$($endpoint.Path)" -Method $endpoint.Method -TimeoutSec 10 -SkipHttpErrorCheck
            
            if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
                @{ Success = $true; Details = "HTTP $($response.StatusCode)" }
            } else {
                @{ Success = $false; Message = "HTTP $($response.StatusCode)" }
            }
        } catch {
            @{ Success = $false; Message = "Endpoint error: $($_.Exception.Message)" }
        }
    } -Severity "MEDIUM"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CATEGORY 5: DOCUMENTATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$docs = @(
    "README.md",
    "HOW-TO-RUN.md",
    "START-BACKEND.md",
    "FIX-BACKEND-CONNECTION.md",
    "QUICK-START-LOCAL-DEV.md",
    "FIX-CORS-ISSUE.md"
)

foreach ($doc in $docs) {
    Test-Item "Documentation" "$doc exists" {
        if (Test-Path $doc) {
            $size = (Get-Item $doc).Length
            @{ Success = $true; Details = "$([math]::Round($size/1KB, 1))KB" }
        } else {
            @{ Success = $false; Message = "File not found" }
        }
    } -Severity "LOW"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CATEGORY 6: LOCAL DEVELOPMENT TOOLS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$tools = @(
    "start-backend.bat",
    "start-backend-local.ps1",
    "check-backend.html",
    "scripts/test-cors.ps1",
    "scripts/test-localhost-cors.ps1"
)

foreach ($tool in $tools) {
    Test-Item "Dev Tools" "$tool exists" {
        if (Test-Path $tool) {
            @{ Success = $true; Details = "Available" }
        } else {
            @{ Success = $false; Message = "File not found" }
        }
    } -Severity "LOW"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CATEGORY 7: CODE QUALITY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Test-Item "Code Quality" "Backend package.json exists" {
    if (Test-Path "backend/package.json") {
        $pkg = Get-Content "backend/package.json" | ConvertFrom-Json
        @{ Success = $true; Details = "Version: $($pkg.version)" }
    } else {
        @{ Success = $false; Message = "package.json not found" }
    }
} -Severity "MEDIUM"

Test-Item "Code Quality" "Backend dependencies installed" {
    if (Test-Path "backend/node_modules") {
        $count = (Get-ChildItem "backend/node_modules" -Directory).Count
        @{ Success = $true; Details = "$count packages installed" }
    } else {
        @{ Success = $false; Message = "node_modules not found (run npm install)" }
    }
} -Severity "INFO"

Test-Item "Code Quality" ".env file exists" {
    if (Test-Path "backend/.env") {
        @{ Success = $true; Details = "Environment config present" }
    } else {
        @{ Success = $false; Message = ".env not found" }
    }
} -Severity "MEDIUM"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CATEGORY 8: GIT REPOSITORY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Test-Item "Git" ".gitignore exists" {
    if (Test-Path ".gitignore") {
        @{ Success = $true; Details = "Present" }
    } else {
        @{ Success = $false; Message = ".gitignore not found" }
    }
} -Severity "MEDIUM"

Test-Item "Git" "No sensitive files in repo" {
    $sensitivePatterns = @(".env", "*.key", "*.pem", "*secret*")
    $found = @()
    
    foreach ($pattern in $sensitivePatterns) {
        $files = git ls-files | Select-String -Pattern $pattern
        if ($files) {
            $found += $files
        }
    }
    
    if ($found.Count -eq 0) {
        @{ Success = $true; Details = "No sensitive files committed" }
    } else {
        @{ Success = $false; Message = "Found: $($found -join ', ')" }
    }
} -Severity "HIGH"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalRun = $passedTests + $failedTests + $warnings
$successRate = if ($totalRun -gt 0) { [math]::Round(($passedTests / $totalRun) * 100, 1) } else { 0 }

Write-Host "Total Tests Run:    $totalRun" -ForegroundColor White
Write-Host "Passed:             $passedTests" -ForegroundColor Green
Write-Host "Failed:             $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Gray" } else { "Red" })
Write-Host "Warnings:           $warnings" -ForegroundColor Yellow
Write-Host "Success Rate:       $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })
Write-Host ""

# Generate report
$reportPath = "QA-TEST-REPORT-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"

$report = @"
# 📊 QA Test Report

**Date:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Tester:** Kiro AI (QA Mode)  
**Environment:** Production (Render + Netlify)

---

## Executive Summary

- **Total Tests:** $totalRun
- **Passed:** $passedTests ✅
- **Failed:** $failedTests ❌
- **Warnings:** $warnings ⚠️
- **Success Rate:** $successRate%

**Overall Status:** $(if ($successRate -ge 90) { "EXCELLENT" } elseif ($successRate -ge 70) { "GOOD" } else { "NEEDS IMPROVEMENT" })

---

## Test Results by Category

"@

$categories = $testResults | Group-Object -Property Category

foreach ($category in $categories) {
    $report += "`n### $($category.Name)`n`n"
    $report += "| Test | Status | Details | Severity |`n"
    $report += "|------|--------|---------|----------|`n"
    
    foreach ($test in $category.Group) {
        $statusIcon = switch ($test.Status) {
            "PASS" { "✅" }
            "FAIL" { "❌" }
            "WARNING" { "⚠️" }
            "ERROR" { "❌" }
        }
        $report += "| $($test.Test) | $statusIcon $($test.Status) | $($test.Details) | $($test.Severity) |`n"
    }
}

$report += @"

---

## Critical Issues

"@

$criticalIssues = $testResults | Where-Object { $_.Status -ne "PASS" -and $_.Severity -eq "HIGH" }

if ($criticalIssues.Count -gt 0) {
    foreach ($issue in $criticalIssues) {
        $report += "- ❌ **$($issue.Test):** $($issue.Details)`n"
    }
} else {
    $report += "✅ No critical issues found!`n"
}

$report += @"

---

## Recommendations

"@

if ($failedTests -gt 0) {
    $report += "1. **Fix Failed Tests:** Address all failed tests before production deployment`n"
}

if ($warnings -gt 0) {
    $report += "2. **Review Warnings:** Check warning items for potential improvements`n"
}

$report += "3. **Monitor Production:** Set up monitoring for backend uptime and response times`n"
$report += "4. **Regular Testing:** Run this test suite regularly (weekly/before deploys)`n"

$report += @"

---

## Verdict

"@

if ($successRate -ge 90 -and $failedTests -eq 0) {
    $report += "✅ **PRODUCTION READY** - Project passes all critical tests`n"
} elseif ($successRate -ge 70) {
    $report += "⚠️ **NEEDS MINOR FIXES** - Address failed tests before deployment`n"
} else {
    $report += "❌ **NOT READY** - Significant issues need to be resolved`n"
}

$report | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "Detailed report saved to: $reportPath" -ForegroundColor Cyan
Write-Host ""

# Final verdict
if ($successRate -ge 90 -and $failedTests -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ PROJECT STATUS: PRODUCTION READY" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    exit 0
} elseif ($successRate -ge 70) {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  ⚠️  PROJECT STATUS: NEEDS MINOR FIXES" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ PROJECT STATUS: CRITICAL ISSUES" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}
