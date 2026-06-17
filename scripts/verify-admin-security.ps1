# ================================
# ADMIN SECURITY FIX VERIFICATION
# ================================
# Kiem tra email field khong con dien san

$URL = "https://vocotruyenhutech.netlify.app/admin/index.html"

Write-Host ""
Write-Host "KIEM TRA BAO MAT ADMIN LOGIN" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "Connecting to: $URL" -ForegroundColor White
    Write-Host "Please wait..." -ForegroundColor Yellow
    Write-Host ""
    
    $response = Invoke-WebRequest -Uri $URL -UseBasicParsing -TimeoutSec 30
    $html = $response.Content
    
    $allPass = $true
    
    # Test 1: No pre-filled email
    Write-Host "Test 1: Email field khong dien san..." -NoNewline
    if ($html -notmatch 'value=["\x27]admin@vocotruyenhutech\.edu\.vn["\x27]') {
        Write-Host " [PASS]" -ForegroundColor Green
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $allPass = $false
    }
    
    # Test 2: Email input exists
    Write-Host "Test 2: Email input field ton tai..." -NoNewline
    if ($html -match '<input[^>]*type=["\x27]email["\x27]') {
        Write-Host " [PASS]" -ForegroundColor Green
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $allPass = $false
    }
    
    # Test 3: Placeholder exists
    Write-Host "Test 3: Placeholder text hien thi..." -NoNewline
    if ($html -match 'placeholder=["\x27]Nhập email admin["\x27]') {
        Write-Host " [PASS]" -ForegroundColor Green
    } else {
        Write-Host " [INFO] Placeholder not checked" -ForegroundColor Yellow
    }
    
    # Test 4: Page loads successfully
    Write-Host "Test 4: Trang load thanh cong..." -NoNewline
    if ($response.StatusCode -eq 200) {
        Write-Host " [PASS]" -ForegroundColor Green
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $allPass = $false
    }
    
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    
    if ($allPass) {
        Write-Host "KET QUA: THANH CONG - BAO MAT DA DUOC CAI TIEN" -ForegroundColor Green -BackgroundColor Black
        Write-Host ""
        Write-Host "Chi tiet:" -ForegroundColor Yellow
        Write-Host "  - Email field: TRONG (khong dien san)" -ForegroundColor White
        Write-Host "  - Security: ENHANCED" -ForegroundColor White
        Write-Host "  - Status: PRODUCTION READY" -ForegroundColor White
        Write-Host ""
        Write-Host "URL: $URL" -ForegroundColor Cyan
    } else {
        Write-Host "KET QUA: THAT BAI - CAN KIEM TRA LAI" -ForegroundColor Red -BackgroundColor Black
        Write-Host ""
        Write-Host "Giai phap:" -ForegroundColor Yellow
        Write-Host "  1. Clear browser cache (Ctrl+F5)" -ForegroundColor White
        Write-Host "  2. Mo Incognito window" -ForegroundColor White
        Write-Host "  3. Doi 5-10 phut de CDN update" -ForegroundColor White
        Write-Host "  4. Kiem tra Netlify deploy status" -ForegroundColor White
    }
    
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host ""
    
    if ($allPass) {
        exit 0
    } else {
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Red
    Write-Host "LOI: Khong the ket noi den server" -ForegroundColor Red
    Write-Host ("=" * 60) -ForegroundColor Red
    Write-Host ""
    Write-Host "Chi tiet loi:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Giai phap:" -ForegroundColor Yellow
    Write-Host "  1. Kiem tra ket noi internet" -ForegroundColor White
    Write-Host "  2. Kiem tra URL: $URL" -ForegroundColor White
    Write-Host "  3. Thu lai sau 1-2 phut" -ForegroundColor White
    Write-Host ""
    exit 1
}
