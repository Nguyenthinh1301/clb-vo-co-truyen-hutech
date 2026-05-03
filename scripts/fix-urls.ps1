# Fix URLs from localhost:3001 to localhost:3000

Write-Host "Fixing URLs from localhost:3001 to localhost:3000..."

$files = Get-ChildItem -Path "website" -Filter "*.html" -Recurse
$count = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match "localhost:3001") {
        $newContent = $content -replace "localhost:3001", "localhost:3000"
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Fixed: $($file.Name)"
        $count++
    }
}

Write-Host "Total files fixed: $count"