#!/usr/bin/env pwsh
# Simple cleanup verification script

Write-Host "`nVERIFYING PROJECT CLEANUP`n" -ForegroundColor Cyan

$passed = 0
$failed = 0
$tests = @()

# Test 1: Duplicate removed
$test = @{Name="Duplicate directory removed"; Pass=(!(Test-Path "ThongTin-VCT\ThongTin-VCT"))}
$tests += $test
if($test.Pass){$passed++}else{$failed++}

# Test 2: Docs structure
$test = @{Name="Docs structure created"; Pass=((Test-Path "docs") -and (Test-Path "docs\deployment"))}
$tests += $test
if($test.Pass){$passed++}else{$failed++}

# Test 3: Docs README
$test = @{Name="Docs README exists"; Pass=(Test-Path "docs\README.md")}
$tests += $test
if($test.Pass){$passed++}else{$failed++}

# Test 4: Quick Start
$test = @{Name="Quick Start exists"; Pass=(Test-Path "QUICK_START.md")}
$tests += $test
if($test.Pass){$passed++}else{$failed++}

# Test 5: Obsolete files removed
$obsolete = @("start-backend-local.ps1", "start.ps1", "check-backend.html")
$allRemoved = $true
foreach($f in $obsolete){ if(Test-Path $f){$allRemoved=$false; break}}
$test = @{Name="Obsolete files removed"; Pass=$allRemoved}
$tests += $test
if($test.Pass){$passed++}else{$failed++}

# Test 6: .gitignore updated
$content = Get-Content ".gitignore" -Raw
$test = @{Name=".gitignore updated"; Pass=($content -match ".env.production")}
$tests += $test
if($test.Pass){$passed++}else{$failed++}

# Test 7: .history not tracked
$tracked = git ls-files ".history" 2>$null
$test = @{Name=".history not in Git"; Pass=([string]::IsNullOrEmpty($tracked))}
$tests += $test
if($test.Pass){$passed++}else{$failed++}

# Test 8: .env.production not tracked
$tracked = git ls-files "backend/.env.production" 2>$null
$test = @{Name=".env.production not in Git"; Pass=([string]::IsNullOrEmpty($tracked))}
$tests += $test
if($test.Pass){$passed++}else{$failed++}

# Test 9: Backend intact
$test = @{Name="Backend intact"; Pass=((Test-Path "backend\server.js") -and (Test-Path "backend\package.json"))}
$tests += $test
if($test.Pass){$passed++}else{$failed++}

# Test 10: Website intact
$test = @{Name="Website intact"; Pass=((Test-Path "website\index.html") -and (Test-Path "website\styles.css"))}
$tests += $test
if($test.Pass){$passed++}else{$failed++}

# Display results
Write-Host "TEST RESULTS:" -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor Gray
foreach($t in $tests){
    $status = if($t.Pass){"PASS"}else{"FAIL"}
    $color = if($t.Pass){"Green"}else{"Red"}
    $symbol = if($t.Pass){"[OK]"}else{"[X]"}
    Write-Host "  $symbol $($t.Name)... $status" -ForegroundColor $color
}

Write-Host "`nSUMMARY:" -ForegroundColor Cyan
Write-Host "---------------------------------------------" -ForegroundColor Gray
$total = $passed + $failed
$pct = [math]::Round(($passed / $total) * 100)
Write-Host "  Passed: $passed / $total ($pct percent)" -ForegroundColor $(if($failed -eq 0){"Green"}else{"Yellow"})
Write-Host "  Failed: $failed / $total" -ForegroundColor $(if($failed -eq 0){"Gray"}else{"Red"})

if($failed -eq 0){
    Write-Host "`n[OK] ALL CHECKS PASSED - Cleanup successful!`n" -ForegroundColor Green
    exit 0
}else{
    Write-Host "`n[!] Some checks failed - Review above`n" -ForegroundColor Yellow
    exit 1
}
