# Script sửa tất cả URL từ localhost:3001 thành localhost:3000

Write-Host "🔧 Đang sửa tất cả URL từ localhost:3001 thành localhost:3000..." -ForegroundColor Green

# Lấy tất cả file HTML trong website
$htmlFiles = Get-ChildItem -Path "website" -Filter "*.html" -Recurse

$totalFiles = 0
$updatedFiles = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    if ($content -match "localhost:3001") {
        $totalFiles++
        Write-Host "📝 Đang sửa: $($file.Name)" -ForegroundColor Yellow
        
        # Thay thế tất cả localhost:3001 thành localhost:3000
        $newContent = $content -replace "localhost:3001", "localhost:3000"
        
        # Ghi lại file
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        
        $updatedFiles++
        Write-Host "   ✅ Đã sửa" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📊 Kết quả:" -ForegroundColor Cyan
Write-Host "   - Tổng file cần sửa: $totalFiles" -ForegroundColor White
Write-Host "   - File đã sửa: $updatedFiles" -ForegroundColor Green

if ($updatedFiles -gt 0) {
    Write-Host ""
    Write-Host "✅ Hoàn thành! Tất cả URL đã được cập nhật từ localhost:3001 → localhost:3000" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ℹ️  Không có file nào cần sửa" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🔍 Kiểm tra lại..." -ForegroundColor Cyan

# Kiểm tra xem còn localhost:3001 nào không
$remainingFiles = @()
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content -match "localhost:3001") {
        $remainingFiles += $file.Name
    }
}

if ($remainingFiles.Count -eq 0) {
    Write-Host "✅ Tất cả URL đã được sửa thành công!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Vẫn còn $($remainingFiles.Count) file chưa được sửa:" -ForegroundColor Yellow
    foreach ($file in $remainingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
}