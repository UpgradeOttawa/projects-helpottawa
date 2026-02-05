# Separate Photos: WITH GPS vs WITHOUT GPS
# Organizes your Google Takeout photos for easier batch uploading

$sourceFolder = "C:\Users\Acer\Desktop\renovation-platform\test_photos_batch2"
$withGPSFolder = "$sourceFolder\has_gps"
$withoutGPSFolder = "$sourceFolder\no_gps"

# Create output folders
New-Item -ItemType Directory -Path $withGPSFolder -Force | Out-Null
New-Item -ItemType Directory -Path $withoutGPSFolder -Force | Out-Null

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SEPARATING PHOTOS BY GPS STATUS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$jsonFiles = Get-ChildItem -Path $sourceFolder -Filter "*.json" -File

$withGPS = 0
$withoutGPS = 0

foreach ($jsonFile in $jsonFiles) {
    try {
        $json = Get-Content $jsonFile.FullName -Raw | ConvertFrom-Json
        
        # Get corresponding photo
        $photoName = $jsonFile.Name -replace '\.json$', ''
        $photoFile = Get-ChildItem -Path $sourceFolder -Filter $photoName -File | Select-Object -First 1
        
        if (!$photoFile) {
            Write-Host "⚠ No photo found for: $($jsonFile.Name)" -ForegroundColor Yellow
            continue
        }
        
        # Check GPS
        if ($json.geoData.latitude -ne 0 -and $json.geoData.longitude -ne 0) {
            # HAS GPS
            Move-Item $photoFile.FullName $withGPSFolder -Force
            Move-Item $jsonFile.FullName $withGPSFolder -Force
            
            Write-Host "✓ HAS GPS: $($photoFile.Name) - Lat: $($json.geoData.latitude), Lng: $($json.geoData.longitude)" -ForegroundColor Green
            $withGPS++
        } else {
            # NO GPS
            Move-Item $photoFile.FullName $withoutGPSFolder -Force
            Move-Item $jsonFile.FullName $withoutGPSFolder -Force
            
            Write-Host "✗ NO GPS: $($photoFile.Name)" -ForegroundColor Red
            $withoutGPS++
        }
        
    } catch {
        Write-Host "✗ Error processing: $($jsonFile.Name)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Photos WITH GPS: $withGPS" -ForegroundColor Green
Write-Host "Photos WITHOUT GPS: $withoutGPS" -ForegroundColor Red

Write-Host "`nFiles organized into:" -ForegroundColor White
Write-Host "  WITH GPS: $withGPSFolder" -ForegroundColor Green
Write-Host "  WITHOUT GPS: $withoutGPSFolder" -ForegroundColor Red

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

if ($withGPS -gt 0) {
    Write-Host "`n✓ You can upload $withGPS photos right now!" -ForegroundColor Green
    Write-Host "1. Go to: http://localhost:3000/admin/upload" -ForegroundColor White
    Write-Host "2. Select all files from: $withGPSFolder" -ForegroundColor White
    Write-Host "3. Upload and watch them appear on the map!" -ForegroundColor White
}

if ($withoutGPS -gt 0) {
    Write-Host "`n⚠ $withoutGPS photos need GPS assigned" -ForegroundColor Yellow
    Write-Host "Options:" -ForegroundColor White
    Write-Host "A. Use batch_assign_gps.ps1 to assign location manually" -ForegroundColor White
    Write-Host "B. Skip these photos for now (old jobs without GPS)" -ForegroundColor White
    Write-Host "C. Wait for manual upload interface (coming soon)" -ForegroundColor White
}

Write-Host ""
