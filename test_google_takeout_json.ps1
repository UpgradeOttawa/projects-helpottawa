# Test Google Takeout JSON Files
# Run this in PowerShell to see what's in your JSON files

$jsonFiles = Get-ChildItem -Path "C:\path\to\your\google-takeout\folder" -Filter "*.json" | Select-Object -First 5

foreach ($file in $jsonFiles) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "File: $($file.Name)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw | ConvertFrom-Json
    
    # Check for GPS data in different formats
    if ($content.geoData) {
        Write-Host "✓ Found geoData:" -ForegroundColor Green
        Write-Host "  Latitude:  $($content.geoData.latitude)" -ForegroundColor Green
        Write-Host "  Longitude: $($content.geoData.longitude)" -ForegroundColor Green
    } else {
        Write-Host "✗ No geoData found" -ForegroundColor Red
    }
    
    if ($content.latitude) {
        Write-Host "✓ Found latitude/longitude at root:" -ForegroundColor Green
        Write-Host "  Latitude:  $($content.latitude)" -ForegroundColor Green
        Write-Host "  Longitude: $($content.longitude)" -ForegroundColor Green
    }
    
    if ($content.photoTakenTime) {
        Write-Host "✓ Photo taken time: $($content.photoTakenTime.timestamp)" -ForegroundColor Yellow
    }
    
    # Show full structure
    Write-Host "`nFull JSON structure:" -ForegroundColor Cyan
    $content | ConvertTo-Json -Depth 3
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "1. Update the path above to your Google Takeout folder"
Write-Host "2. Run this script in PowerShell"
Write-Host "3. Share the output with me"
Write-Host "========================================" -ForegroundColor Cyan
