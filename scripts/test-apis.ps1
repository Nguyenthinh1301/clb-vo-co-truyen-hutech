$body = '{"email":"admin@vocotruyenhutech.edu.vn","password":"Admin@123456"}'
$login = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $login.data.token
$h = @{ Authorization = "Bearer $token" }

Write-Host "=== Kiem tra tat ca APIs ===" -ForegroundColor Cyan

function Test-API($name, $url) {
    try {
        $r = Invoke-RestMethod $url -Headers $h -TimeoutSec 8
        if ($r.success) {
            Write-Host "  OK $name" -ForegroundColor Green
        } else {
            Write-Host "  FAIL $name - success=false" -ForegroundColor Red
        }
    } catch {
        Write-Host "  FAIL $name - $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($login.success) {
    Write-Host "  OK Login" -ForegroundColor Green
} else {
    Write-Host "  FAIL Login" -ForegroundColor Red
}

Test-API "News"          "http://localhost:3001/api/cms/news?page=1&limit=5"
Test-API "Events"        "http://localhost:3001/api/cms/events?page=1&limit=5"
Test-API "Announcements" "http://localhost:3001/api/cms/announcements?all=1"
Test-API "Reviews"       "http://localhost:3001/api/cms/reviews?all=1"
Test-API "Gallery"       "http://localhost:3001/api/gallery/albums?all=1"
Test-API "Users"         "http://localhost:3001/api/users?page=1&limit=5"
Test-API "Contact"       "http://localhost:3001/api/contact?page=1&limit=5"

$hasPw = $login.data.user.PSObject.Properties.Name | Where-Object { $_ -match "^password" }
if ($hasPw) {
    Write-Host "  WARN Password EXPOSED: $hasPw" -ForegroundColor Red
} else {
    Write-Host "  OK Password NOT exposed" -ForegroundColor Green
}
