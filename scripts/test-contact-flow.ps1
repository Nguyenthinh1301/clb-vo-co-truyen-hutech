# Test end-to-end contact flow on production
Write-Host "=== Test Contact Flow ===" -ForegroundColor Cyan

# 1. Wake up server
Write-Host "1. Waking up Render server..."
try {
    $health = Invoke-RestMethod "https://clb-vo-co-truyen-hutech.onrender.com/health" -TimeoutSec 50
    Write-Host "   OK: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Login admin
Write-Host "2. Admin login..."
$loginBody = '{"email":"admin@vocotruyenhutech.edu.vn","password":"Admin@Hutech2026!"}'
$login = Invoke-RestMethod "https://clb-vo-co-truyen-hutech.onrender.com/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 20
$token = $login.data.token
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
Write-Host "   OK: role=$($login.data.user.role)" -ForegroundColor Green

# 3. Submit contact (như người dùng)
Write-Host "3. Submitting contact message..."
$contactBody = '{"name":"Nguyen Van Test","email":"aquin15121301@gmail.com","phone":"0901234567","subject":"Hoi ve lich tap CLB","message":"Cho toi hoi lich tap cua CLB Vo Co Truyen HUTECH nhu the nao? Cam on!"}'
$contact = Invoke-RestMethod "https://clb-vo-co-truyen-hutech.onrender.com/api/contact" -Method POST -Body $contactBody -ContentType "application/json" -TimeoutSec 15
$msgId = $contact.data.message_id
Write-Host "   OK: message_id=$msgId" -ForegroundColor Green

# 4. Admin xem tin nhắn
Write-Host "4. Admin reading message..."
$msg = Invoke-RestMethod "https://clb-vo-co-truyen-hutech.onrender.com/api/contact/$msgId" -Headers $headers -TimeoutSec 15
$m = $msg.data.message
Write-Host "   From: $($m.name) <$($m.email)>" -ForegroundColor Green
Write-Host "   Subject: $($m.subject)" -ForegroundColor Green
Write-Host "   Status: $($m.status)" -ForegroundColor Green

# 5. Admin reply (email gửi đến người dùng)
Write-Host "5. Admin replying (email to user)..."
$replyBody = '{"reply_message":"Xin chao! Cam on ban da lien he voi CLB Vo Co Truyen HUTECH. Lich tap cua CLB: Thu 3, Thu 5, Thu 7 luc 17h30 tai san HUTECH. Rat mong gap ban!"}'
$reply = Invoke-RestMethod "https://clb-vo-co-truyen-hutech.onrender.com/api/contact/$msgId/reply" -Method POST -Body $replyBody -Headers $headers -TimeoutSec 15
Write-Host "   Reply success: $($reply.success)" -ForegroundColor Green
Write-Host "   Email sent: $($reply.data.email_sent)" -ForegroundColor Green
Write-Host "   Email to: $($reply.data.email_message)" -ForegroundColor Green

# 6. Verify status updated
Write-Host "6. Verifying message status..."
$updated = Invoke-RestMethod "https://clb-vo-co-truyen-hutech.onrender.com/api/contact/$msgId" -Headers $headers -TimeoutSec 15
Write-Host "   Status: $($updated.data.message.status)" -ForegroundColor Green

Write-Host ""
Write-Host "=== RESULT ===" -ForegroundColor Cyan
if ($reply.success -and $reply.data.email_sent) {
    Write-Host "PASS: Contact flow working correctly!" -ForegroundColor Green
    Write-Host "Email sent to: aquin15121301@gmail.com" -ForegroundColor Green
    Write-Host "Check inbox/spam for reply email." -ForegroundColor Yellow
} else {
    Write-Host "FAIL: Something went wrong" -ForegroundColor Red
}
