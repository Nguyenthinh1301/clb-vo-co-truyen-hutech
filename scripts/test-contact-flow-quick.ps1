# Quick reproduction for contact reply 404/NotFound
$ErrorActionPreference='Stop'
$base='https://clb-vo-co-truyen-hutech.onrender.com'

Write-Host "Health:" -ForegroundColor Cyan
$health = Invoke-RestMethod "$base/health" -TimeoutSec 50
Write-Host "OK: $($health.message)" -ForegroundColor Green

Write-Host "Login admin..." -ForegroundColor Cyan
$loginBody = '{"email":"admin@vocotruyenhutech.edu.vn","password":"Admin@Hutech2026!"}'
$login = Invoke-RestMethod "$base/api/auth/login" -Method POST -Body $loginBody -ContentType 'application/json' -TimeoutSec 20
$token = $login.data.token
$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
Write-Host "OK: role=$($login.data.user.role)" -ForegroundColor Green

Write-Host "Create contact..." -ForegroundColor Cyan
$contactBody = '{"name":"BBContact2","email":"aquin15121301@gmail.com","phone":"0901234567","subject":"Test contact","message":"Hello"}'
$contact = Invoke-RestMethod "$base/api/contact" -Method POST -Body $contactBody -ContentType 'application/json' -TimeoutSec 20
$msgId = $contact.data.message_id
Write-Host "OK: message_id=$msgId" -ForegroundColor Green

Write-Host "Reply to contact..." -ForegroundColor Cyan
$replyBody = '{"reply_message":"reply test quick"}'
try {
    $reply = Invoke-RestMethod "$base/api/contact/$msgId/reply" -Method POST -Body $replyBody -Headers $headers -TimeoutSec 20
    Write-Host "reply.success=$($reply.success)" -ForegroundColor Green
    Write-Host "email_sent=$($reply.data.email_sent)" -ForegroundColor Green
    Write-Host "email_message=$($reply.data.email_message)" -ForegroundColor Green
} catch {
    Write-Host "Reply request failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response -ne $null) {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream -ne $null) {
            $reader = [System.IO.StreamReader]::new($stream)
            $body = $reader.ReadToEnd()
            Write-Host "Response body:" -ForegroundColor Yellow
            Write-Host $body
        }
    }
    exit 1
}

Write-Host "Verify status..." -ForegroundColor Cyan
$updated = Invoke-RestMethod "$base/api/contact/$msgId" -Headers $headers -TimeoutSec 20
Write-Host "status=$($updated.data.message.status)" -ForegroundColor Green

Write-Host "DONE" -ForegroundColor Cyan

