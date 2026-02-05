# Verify Google Takeout JSON Files Have GPS Data
# Checks which JSON files contain location information

$folder = "C:\Users\Acer\Desktop\renovation-platform\test_photos_batch2"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CHECKING JSON FILES FOR GPS DATA" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Folder: $folder`n" -ForegroundColor White

$jsonFiles = Get-ChildItem -Path $folder -Filter "*.json"

if ($jsonFiles.Count -eq 0) {
    Write-Host "❌ No JSON files found in folder!" -ForegroundColor Red
    Write-Host "Make sure you've run the flatten script first." -ForegroundColor Yellow
    exit
}

$withGPS = 0
$withoutGPS = 0
$errors = 0

# Check first 5 in detail
Write-Host "DETAILED CHECK (First 5 files):" -ForegroundColor Yellow
Write-Host "----------------------------------------`n" -ForegroundColor Gray

$first5 = $jsonFiles | Select-Object -First 5

foreach ($file in $first5) {
    Write-Host "File: $($file.Name)" -ForegroundColor Cyan
    
    try {
        $content = Get-Content $file.FullName -Raw | ConvertFrom-Json
        
        # Check for GPS in different formats
        $hasGPS = $false
        $lat = 0
        $lng = 0
        
        if ($content.geoData) {
            $lat = $content.geoData.latitude
            $lng = $content.geoData.longitude
            
            if ($lat -ne 0 -and $lng -ne 0) {
                $hasGPS = $true
                Write-Host "  ✓ GPS Found (geoData)" -ForegroundColor Green
                Write-Host "    Lat: $lat" -ForegroundColor Green
                Write-Host "    Lng: $lng" -ForegroundColor Green
            }
        }
        
        if (!$hasGPS -and $content.latitude -and $content.longitude) {
            $lat = $content.latitude
            $lng = $content.longitude
            
            if ($lat -ne 0 -and $lng -ne 0) {
                $hasGPS = $true
                Write-Host "  ✓ GPS Found (root level)" -ForegroundColor Green
                Write-Host "    Lat: $lat" -ForegroundColor Green
                Write-Host "    Lng: $lng" -ForegroundColor Green
            }
        }
        
        if (!$hasGPS) {
            Write-Host "  ✗ No GPS data (lat/lng = 0 or missing)" -ForegroundColor Red
            Write-Host "  Full content:" -ForegroundColor Yellow
            Write-Host ($content | ConvertTo-Json -Depth 2) -ForegroundColor Gray
        }
        
        Write-Host ""
        
    } catch {
        Write-Host "  ✗ Error reading JSON: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Quick check all files
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SUMMARY (All $($jsonFiles.Count) files):" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($file in $jsonFiles) {
    try {
        $content = Get-Content $file.FullName -Raw | ConvertFrom-Json
        
        $hasGPS = $false
        
        # Check geoData format
        if ($content.geoData -and $content.geoData.latitude -ne 0 -and $content.geoData.longitude -ne 0) {
            $hasGPS = $true
        }
        
        # Check root level
        if (!$hasGPS -and $content.latitude -ne 0 -and $content.longitude -ne 0) {
            $hasGPS = $true
        }
        
        if ($hasGPS) {
            $withGPS++
        } else {
            $withoutGPS++
        }
        
    } catch {
        $errors++
    }
}

Write-Host "JSON files WITH GPS: $withGPS" -ForegroundColor Green
Write-Host "JSON files WITHOUT GPS: $withoutGPS" -ForegroundColor $(if ($withoutGPS -gt 0) { "Yellow" } else { "Green" })
Write-Host "JSON files with errors: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })

# Calculate percentage
if ($jsonFiles.Count -gt 0) {
    $percentage = [math]::Round(($withGPS / $jsonFiles.Count) * 100, 1)
    Write-Host "`n$percentage% of JSON files have GPS data" -ForegroundColor $(if ($percentage -gt 50) { "Green" } else { "Yellow" })
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RECOMMENDATIONS:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

if ($withGPS -eq 0) {
    Write-Host "❌ NO JSON files have GPS data!" -ForegroundColor Red
    Write-Host "`nPossible reasons:" -ForegroundColor Yellow
    Write-Host "1. Photos were taken without location services enabled" -ForegroundColor White
    Write-Host "2. Location was removed when exporting from Google Photos" -ForegroundColor White
    Write-Host "3. These are the wrong JSON files (metadata.json instead of photo JSON)" -ForegroundColor White
    Write-Host "`nTry:" -ForegroundColor Yellow
    Write-Host "- Check if photos have EXIF GPS (use exiftool or photo properties)" -ForegroundColor White
    Write-Host "- Re-download from Google Takeout with location data enabled" -ForegroundColor White
} elseif ($withGPS -lt $jsonFiles.Count) {
    Write-Host "⚠ Only some photos have GPS" -ForegroundColor Yellow
    Write-Host "`nYou can upload the $withGPS photos that have GPS." -ForegroundColor White
    Write-Host "Photos without GPS will be rejected during upload." -ForegroundColor White
} else {
    Write-Host "✓ All JSON files have GPS data!" -ForegroundColor Green
    Write-Host "`nYou're ready to upload!" -ForegroundColor White
    Write-Host "Go to: http://localhost:3000/admin/upload" -ForegroundColor Cyan
}

Write-Host ""
