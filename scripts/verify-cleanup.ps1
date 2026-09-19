#!/usr/bin/env pwsh
# Script to verify cleanup was successful

Write-Host "`n🔍 VERIFYING PROJECT CLEANUP`n" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------`n" -ForegroundColor Gray

$passed = 0
$failed = 0

function Test-Check {
    param($name, $condition, $successMsg, $failMsg)
    
    Write-Host "Testing: $name..." -ForegroundColor Yellow -NoNewline
    
    if ($condition) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "   → $successMsg" -ForegroundColor Gray
        return $true
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        Write-Host "   → $failMsg" -ForegroundColor Gray
        return $false
    }
}

Write-Host "`n1️⃣  STRUCTURE CHECKS" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------`n" -ForegroundColor Gray

# Check duplicate removed
if (Test-Check "Duplicate directory removed" `
    (!(Test-Path "ThongTin-VCT\ThongTin-VCT")) `
    "ThongTin-VCT/ThongTin-VCT/ không tồn tại" `
    "Thư mục duplicate vẫn còn!") { $passed++ } else { $failed++ }

# Check docs structure
if (Test-Check "Docs structure created" `
    ((Test-Path "docs") -and (Test-Path "docs\deployment") -and (Test-Path "docs\development")) `
    "Cấu trúc docs/ được tạo đầy đủ" `
    "Thiếu thư mục docs/!") { $passed++ } else { $failed++ }

# Check docs README
if (Test-Check "Docs README exists" `
    (Test-Path "docs\README.md") `
    "docs/README.md tồn tại" `
    "Thiếu docs/README.md!") { $passed++ } else { $failed++ }

# Check QUICK_START
if (Test-Check "Quick Start guide exists" `
    (Test-Path "QUICK_START.md") `
    "QUICK_START.md tồn tại" `
    "Thiếu QUICK_START.md!") { $passed++ } else { $failed++ }

Write-Host "`n2️⃣  CLEANUP CHECKS" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------`n" -ForegroundColor Gray

# Check obsolete files removed
$obsoleteFiles = @("start-backend-local.ps1", "start-backend.bat", "start.ps1", "check-backend.html", "serve.js")
$allRemoved = $true
foreach ($file in $obsoleteFiles) {
    if (Test-Path $file) {
        $allRemoved = $false
        break
    }
}

if (Test-Check "Obsolete files removed" `
    $allRemoved `
    "Tất cả files obsolete đã bị xóa" `
    "Vẫn còn files obsolete!") { $passed++ } else { $failed++ }

# Check root has fewer files
$rootFiles = (Get-ChildItem -Path "." -File).Count
if (Test-Check "Root directory cleaned" `
    ($rootFiles -lt 15) `
    "Root chỉ còn $rootFiles files (tốt!)" `
    "Root vẫn có quá nhiều files ($rootFiles)") { $passed++ } else { $failed++ }

Write-Host "`n3️⃣  SECURITY CHECKS" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------`n" -ForegroundColor Gray

# Check .gitignore updated
$gitignoreContent = Get-Content ".gitignore" -Raw
if (Test-Check ".gitignore updated" `
    ($gitignoreContent -match ".env.production" -and $gitignoreContent -match ".history") `
    ".gitignore có rules mới" `
    ".gitignore chưa được cập nhật!") { $passed++ } else { $failed++ }

# Check .history not tracked
$historyTracked = git ls-files ".history" 2>$null
if (Test-Check ".history not in Git" `
    ([string]::IsNullOrEmpty($historyTracked)) `
    ".history/ không còn trong Git tracking" `
    ".history/ vẫn được track!") { $passed++ } else { $failed++ }

# Check .env.production not tracked  
$envTracked = git ls-files "backend/.env.production" 2>$null
if (Test-Check ".env.production not in Git" `
    ([string]::IsNullOrEmpty($envTracked)) `
    "backend/.env.production không còn trong Git" `
    "backend/.env.production vẫn được track!") { $passed++ } else { $failed++ }

Write-Host "`n4️⃣  DOCUMENTATION CHECKS" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------`n" -ForegroundColor Gray

# Check deployment docs moved
if (Test-Check "Deployment docs organized" `
    (Test-Path "docs\deployment\README.md") `
    "Deployment docs đã được organize" `
    "Thiếu deployment docs!") { $passed++ } else { $failed++ }

# Check development docs moved
if (Test-Check "Development docs organized" `
    (Test-Path "docs\development\quick-start.md") `
    "Development docs đã được organize" `
    "Thiếu development docs!") { $passed++ } else { $failed++ }

# Check admin docs moved
if (Test-Check "Admin docs organized" `
    (Test-Path "docs\admin\login-guide.md") `
    "Admin docs đã được organize" `
    "Thiếu admin docs!") { $passed++ } else { $failed++ }

# Check reports moved
if (Test-Check "Reports organized" `
    (Test-Path "docs\reports") `
    "Reports đã được organize" `
    "Thiếu reports folder!") { $passed++ } else { $failed++ }

Write-Host "`n5️⃣  PROJECT INTEGRITY CHECKS" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------`n" -ForegroundColor Gray

# Check backend still exists
if (Test-Check "Backend intact" `
    ((Test-Path "backend\server.js") -and (Test-Path "backend\package.json")) `
    "Backend không bị ảnh hưởng" `
    "Backend bị mất files!") { $passed++ } else { $failed++ }

# Check website still exists
if (Test-Check "Website intact" `
    ((Test-Path "website\index.html") -and (Test-Path "website\styles.css")) `
    "Website không bị ảnh hưởng" `
    "Website bị mất files!") { $passed++ } else { $failed++ }

# Check scripts still exist
if (Test-Check "Scripts intact" `
    (Test-Path "scripts") `
    "Scripts folder còn nguyên" `
    "Scripts bị mất!") { $passed++ } else { $failed++ }

Write-Host "`n-------------------------------------------------------------`n" -ForegroundColor Gray

# Summary
$total = $passed + $failed
$percentage = [math]::Round(($passed / $total) * 100, 1)

Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
Write-Host "   Passed:  $passed / $total tests ($percentage percent)" -ForegroundColor $(if($passed -eq $total){"Green"}else{"Yellow"})
Write-Host "   Failed:  $failed / $total tests" -ForegroundColor $(if($failed -eq 0){"Gray"}else{"Red"})

if ($failed -eq 0) {
    Write-Host "`n✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "   Project cleanup was successful!" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "`n⚠️  SOME CHECKS FAILED" -ForegroundColor Yellow
    Write-Host "   Please review the failed tests above." -ForegroundColor Gray
    exit 1
}
