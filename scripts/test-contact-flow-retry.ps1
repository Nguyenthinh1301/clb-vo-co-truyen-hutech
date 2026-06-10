# Retry wrapper for scripts/test-contact-flow.ps1
$ErrorActionPreference='Continue'
$p='d:\Code\ThongTin-VCT\scripts\test-contact-flow.ps1'

for($i=1;$i -le 3;$i++){
  Write-Host ("Run attempt {0}..." -f $i) -ForegroundColor Cyan
  & powershell -NoProfile -ExecutionPolicy Bypass -File $p
  $code=$LASTEXITCODE
  if($code -eq 0){
    Write-Host 'SUCCESS (exit code 0)' -ForegroundColor Green
    break
  } else {
    Write-Host ("FAILED (exit code {0})" -f $code) -ForegroundColor Red
  }
  Start-Sleep -Seconds 25
}

