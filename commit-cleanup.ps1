#!/usr/bin/env pwsh
# Script to commit cleanup changes

Write-Host "🚀 COMMITTING CLEANUP CHANGES" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Check Git status
Write-Host "📊 Checking Git status..." -ForegroundColor Yellow
$status = git status --porcelain
$changedFiles = ($status | Measure-Object).Count

Write-Host "   Files changed: $changedFiles`n" -ForegroundColor White

if ($changedFiles -eq 0) {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
    exit 0
}

# Show summary
Write-Host "📝 Changes summary:" -ForegroundColor Yellow
git status --short

Write-Host "`n⚠️  About to commit $changedFiles files" -ForegroundColor Yellow
Write-Host "   Press Enter to continue or Ctrl+C to cancel..." -ForegroundColor Gray
Read-Host

# Stage all changes
Write-Host "`n📦 Staging changes..." -ForegroundColor Yellow
git add .

# Show what will be committed
Write-Host "`n📋 Files to be committed:" -ForegroundColor Yellow
git status --short

# Read commit message from file
$commitMessage = Get-Content "COMMIT_MESSAGE.txt" -Raw

# Commit with the message
Write-Host "`n💾 Creating commit..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ COMMIT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Review the commit: git log -1 --stat" -ForegroundColor White
    Write-Host "2. Push to remote: git push origin main" -ForegroundColor White
    Write-Host "3. Delete commit message file: Remove-Item COMMIT_MESSAGE.txt" -ForegroundColor White
    Write-Host "4. Delete this script: Remove-Item commit-cleanup.ps1" -ForegroundColor White
} else {
    Write-Host "`n❌ COMMIT FAILED!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    exit 1
}
