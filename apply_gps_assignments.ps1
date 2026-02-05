# Apply GPS Assignments from CSV
# Batch assigns GPS coordinates to date-grouped photos

param(
    [string]$CSVPath = "C:\Users\Acer\Desktop\renovation-platform\processed_photos\grouped_by_date\GPS_ASSIGNMENTS.csv",
    [string]$GroupedPhotosRoot = "C:\Users\Acer\Desktop\renovation-platform\processed_photos\grouped_by_date",
    [string]$OutputFolder = "C:\Users\Acer\Desktop\renovation-platform\processed_photos\ready_to_upload"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "BATCH GPS ASSIGNMENT" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Read CSV
if (!(Test-Path $CSVPath)) {
    Write-Host "✗ CSV file not found: $CSVPath" -ForegroundColor Red
    Write-Host "Run industrial_processor.ps1 first to generate the CSV template." -ForegroundColor Yellow
    exit
}

$assignments = Import-Csv $CSVPath

Write-Host "Loaded $($assignments.Count) date groups from CSV`n" -ForegroundColor Green

$stats = @{
    processed = 0
    updated = 0
    skipped = 0
    errors = 0
}

foreach ($assignment in $assignments) {
    # Skip if no GPS provided
    if ([string]::IsNullOrWhiteSpace($assignment.Latitude) -or 
        [string]::IsNullOrWhiteSpace($assignment.Longitude)) {
        Write-Host "⊖ Skipped: $($assignment.DateFolder) - No GPS coordinates provided" -ForegroundColor Gray
        $stats.skipped++
        continue
    }
    
    $folderPath = "$GroupedPhotosRoot\$($assignment.DateFolder)"
    
    if (!(Test-Path $folderPath)) {
        Write-Host "⚠ Folder not found: $($assignment.DateFolder)" -ForegroundColor Yellow
        $stats.errors++
        continue
    }
    
    # Get all JSON files in this date folder
    $jsonFiles = Get-ChildItem -Path $folderPath -Filter "*.json"
    
    Write-Host "Processing: $($assignment.DateFolder) - $($assignment.JobSite)" -ForegroundColor Cyan
    Write-Host "  Location: $($assignment.Latitude), $($assignment.Longitude)" -ForegroundColor White
    Write-Host "  Photos: $($jsonFiles.Count)" -ForegroundColor White
    
    foreach ($jsonFile in $jsonFiles) {
        try {
            # Read JSON
            $json = Get-Content $jsonFile.FullName -Raw | ConvertFrom-Json
            
            # Update GPS
            $json.geoData.latitude = [double]$assignment.Latitude
            $json.geoData.longitude = [double]$assignment.Longitude
            $json.geoData.altitude = 0.0
            
            # Save updated JSON
            $json | ConvertTo-Json -Depth 10 | Set-Content $jsonFile.FullName
            
            # Copy to ready_to_upload folder
            $photoName = $jsonFile.Name -replace '\.json$', ''
            $photoPath = "$folderPath\$photoName"
            
            if (Test-Path $photoPath) {
                Copy-Item $photoPath $OutputFolder -Force
                Copy-Item $jsonFile.FullName "$OutputFolder\$($jsonFile.Name)" -Force
                $stats.updated++
            }
            
        } catch {
            Write-Host "  ✗ Error updating: $($jsonFile.Name)" -ForegroundColor Red
            $stats.errors++
        }
    }
    
    Write-Host "  ✓ Updated $($jsonFiles.Count) photos`n" -ForegroundColor Green
    $stats.processed++
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Date groups processed: $($stats.processed)" -ForegroundColor Green
Write-Host "Photos updated with GPS: $($stats.updated)" -ForegroundColor Green
Write-Host "Date groups skipped (no GPS): $($stats.skipped)" -ForegroundColor Yellow
Write-Host "Errors: $($stats.errors)" -ForegroundColor Red

Write-Host "`n✓ Photos ready to upload: $OutputFolder`n" -ForegroundColor Green

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEP:" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Go to: http://localhost:3000/admin/upload" -ForegroundColor White
Write-Host "Select files from: $OutputFolder" -ForegroundColor White
Write-Host "Upload in batches of 500 at a time`n" -ForegroundColor White
