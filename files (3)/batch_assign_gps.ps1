# Batch Assign GPS to Photos from Known Locations
# For renovation photos where you know the job site but photos don't have GPS

$targetFolder = "C:\Users\Acer\Desktop\renovation-platform\test_photos_batch2"

# Define your job sites
$jobSites = @{
    "pembroke_city_hall_2012" = @{
        name = "Pembroke City Hall"
        lat = 45.8267
        lng = -77.1113
        city = "Pembroke"
        roomType = "general_renovation"
    }
    # Add more job sites as needed:
    # "orleans_bathroom_2023" = @{
    #     name = "Orleans Residential"
    #     lat = 45.4694
    #     lng = -75.5164
    #     city = "Ottawa"
    #     roomType = "bathroom"
    # }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "BATCH ASSIGN GPS TO PHOTOS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# List available job sites
Write-Host "`nAvailable job sites:" -ForegroundColor Yellow
$i = 1
$jobSites.GetEnumerator() | ForEach-Object {
    Write-Host "$i. $($_.Value.name) - Lat: $($_.Value.lat), Lng: $($_.Value.lng)" -ForegroundColor White
    $i++
}

# Select job site
Write-Host "`nWhich job site are these photos from?" -ForegroundColor Yellow
Write-Host "Enter the number (or press Enter for Pembroke City Hall): " -ForegroundColor White -NoNewline
$selection = Read-Host

if ([string]::IsNullOrWhiteSpace($selection)) {
    $selection = "1"
}

$selectedKey = @($jobSites.Keys)[$selection - 1]
$site = $jobSites[$selectedKey]

Write-Host "`n✓ Selected: $($site.name)" -ForegroundColor Green
Write-Host "  GPS: $($site.lat), $($site.lng)" -ForegroundColor Cyan

# Get all JSON files without GPS
$jsonFiles = Get-ChildItem -Path $targetFolder -Filter "*.json"
$updated = 0
$skipped = 0

foreach ($file in $jsonFiles) {
    try {
        $json = Get-Content $file.FullName -Raw | ConvertFrom-Json
        
        # Check if already has GPS
        if ($json.geoData.latitude -ne 0 -and $json.geoData.longitude -ne 0) {
            Write-Host "  ⊖ Skipped (already has GPS): $($file.Name)" -ForegroundColor Yellow
            $skipped++
            continue
        }
        
        # Update GPS data
        $json.geoData.latitude = $site.lat
        $json.geoData.longitude = $site.lng
        $json.geoData.altitude = 0.0
        
        # Save updated JSON
        $json | ConvertTo-Json -Depth 10 | Set-Content $file.FullName
        
        Write-Host "  ✓ Updated: $($file.Name)" -ForegroundColor Green
        $updated++
        
    } catch {
        Write-Host "  ✗ Error: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Files updated with GPS: $updated" -ForegroundColor Green
Write-Host "Files skipped (already had GPS): $skipped" -ForegroundColor Yellow
Write-Host "`nLocation: $($site.name)" -ForegroundColor White
Write-Host "Coordinates: $($site.lat), $($site.lng)" -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Go to: http://localhost:3000/admin/upload" -ForegroundColor White
Write-Host "2. Select all files from: $targetFolder" -ForegroundColor White
Write-Host "3. Upload - GPS will now be detected!" -ForegroundColor White
Write-Host "`n✓ Photos will appear at: $($site.name)" -ForegroundColor Green
