# INDUSTRIAL PHOTO PROCESSOR
# Handles 20,000+ images from multiple job sites automatically
# Flattens folders, scans GPS, groups by date for batch assignment

param(
    [string]$SourceRoot = "C:\Users\Acer\Desktop\Takeout",
    [string]$OutputRoot = "C:\Users\Acer\Desktop\renovation-platform\processed_photos"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "INDUSTRIAL PHOTO PROCESSOR" -ForegroundColor Yellow
Write-Host "Processing 20,000+ renovation photos" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Create output structure
$withGPSFolder = "$OutputRoot\ready_to_upload"
$needGPSFolder = "$OutputRoot\needs_gps"
$byDateFolder = "$OutputRoot\grouped_by_date"

New-Item -ItemType Directory -Path $withGPSFolder -Force | Out-Null
New-Item -ItemType Directory -Path $needGPSFolder -Force | Out-Null
New-Item -ItemType Directory -Path $byDateFolder -Force | Out-Null

Write-Host "Output structure created:" -ForegroundColor Green
Write-Host "  $withGPSFolder" -ForegroundColor White
Write-Host "  $needGPSFolder" -ForegroundColor White
Write-Host "  $byDateFolder`n" -ForegroundColor White

# STEP 1: Find all photos and JSON files recursively
Write-Host "STEP 1: Scanning all folders..." -ForegroundColor Yellow
$allPhotos = Get-ChildItem -Path $SourceRoot -Recurse -File | Where-Object {
    $_.Extension -match '\.(jpg|jpeg|png)$' -and $_.Name -notmatch '^\..*'
}

$allJSON = Get-ChildItem -Path $SourceRoot -Recurse -File -Filter "*.json" | Where-Object {
    $_.Name -notmatch 'metadata\.json$'
}

Write-Host "✓ Found $($allPhotos.Count) photos" -ForegroundColor Green
Write-Host "✓ Found $($allJSON.Count) JSON files`n" -ForegroundColor Green

# Create lookup table for JSON files
$jsonLookup = @{}
foreach ($json in $allJSON) {
    $photoName = $json.Name -replace '\.json$', ''
    $jsonLookup[$photoName] = $json.FullName
}

# STEP 2: Process each photo
Write-Host "STEP 2: Processing photos..." -ForegroundColor Yellow

$stats = @{
    withGPS = 0
    withoutGPS = 0
    noJSON = 0
    errors = 0
}

$dateGroups = @{}

$counter = 0
$total = $allPhotos.Count

foreach ($photo in $allPhotos) {
    $counter++
    
    # Progress indicator
    if ($counter % 100 -eq 0) {
        $percent = [math]::Round(($counter / $total) * 100, 1)
        Write-Host "  Processing: $counter / $total ($percent%)" -ForegroundColor Cyan
    }
    
    try {
        # Find matching JSON
        $jsonPath = $jsonLookup[$photo.Name]
        
        if (!$jsonPath) {
            # No JSON - try EXIF (will implement in upload API)
            Copy-Item $photo.FullName $needGPSFolder -Force
            $stats.noJSON++
            continue
        }
        
        # Read JSON
        $json = Get-Content $jsonPath -Raw | ConvertFrom-Json
        
        # Check GPS
        $hasGPS = $false
        $lat = 0
        $lng = 0
        $dateTaken = $null
        
        if ($json.geoData -and $json.geoData.latitude -ne 0 -and $json.geoData.longitude -ne 0) {
            $hasGPS = $true
            $lat = $json.geoData.latitude
            $lng = $json.geoData.longitude
        }
        
        # Get date taken
        if ($json.photoTakenTime -and $json.photoTakenTime.timestamp) {
            $dateTaken = [DateTimeOffset]::FromUnixTimeSeconds($json.photoTakenTime.timestamp).DateTime
        }
        
        if ($hasGPS) {
            # HAS GPS - Ready to upload
            Copy-Item $photo.FullName $withGPSFolder -Force
            Copy-Item $jsonPath "$withGPSFolder\$($photo.Name).json" -Force
            $stats.withGPS++
        } else {
            # NO GPS - Group by date for batch assignment
            if ($dateTaken) {
                $dateKey = $dateTaken.ToString("yyyy-MM")
                
                if (!$dateGroups.ContainsKey($dateKey)) {
                    $dateGroups[$dateKey] = @()
                }
                
                $dateGroups[$dateKey] += @{
                    Photo = $photo.FullName
                    JSON = $jsonPath
                    Date = $dateTaken
                }
            }
            
            Copy-Item $photo.FullName $needGPSFolder -Force
            Copy-Item $jsonPath "$needGPSFolder\$($photo.Name).json" -Force
            $stats.withoutGPS++
        }
        
    } catch {
        Write-Host "✗ Error: $($photo.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $stats.errors++
    }
}

Write-Host "`n✓ Processing complete!`n" -ForegroundColor Green

# STEP 3: Create date-grouped folders
Write-Host "STEP 3: Creating date-grouped folders..." -ForegroundColor Yellow

foreach ($dateKey in $dateGroups.Keys | Sort-Object) {
    $photos = $dateGroups[$dateKey]
    $folderPath = "$byDateFolder\$dateKey"
    
    New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
    
    foreach ($item in $photos) {
        $photoName = Split-Path $item.Photo -Leaf
        Copy-Item $item.Photo "$folderPath\$photoName" -Force
        Copy-Item $item.JSON "$folderPath\$photoName.json" -Force
    }
    
    Write-Host "  ✓ $dateKey - $($photos.Count) photos" -ForegroundColor Cyan
}

Write-Host "`n✓ Date grouping complete!`n" -ForegroundColor Green

# STEP 4: Create GPS assignment template
$templatePath = "$byDateFolder\GPS_ASSIGNMENTS.csv"
$csvData = @()

foreach ($dateKey in $dateGroups.Keys | Sort-Object) {
    $csvData += [PSCustomObject]@{
        DateFolder = $dateKey
        PhotoCount = $dateGroups[$dateKey].Count
        SamplePhoto = (Split-Path $dateGroups[$dateKey][0].Photo -Leaf)
        JobSite = ""
        Address = ""
        Latitude = ""
        Longitude = ""
        RoomType = ""
        Notes = ""
    }
}

$csvData | Export-Csv -Path $templatePath -NoTypeInformation

Write-Host "✓ GPS assignment template created: $templatePath`n" -ForegroundColor Green

# STEP 5: Generate summary report
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROCESSING COMPLETE" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "STATISTICS:" -ForegroundColor Yellow
Write-Host "  Total photos processed: $total" -ForegroundColor White
Write-Host "  ✓ Ready to upload (has GPS): $($stats.withGPS)" -ForegroundColor Green
Write-Host "  ⚠ Needs GPS assignment: $($stats.withoutGPS)" -ForegroundColor Yellow
Write-Host "  ⚠ No JSON file: $($stats.noJSON)" -ForegroundColor Yellow
Write-Host "  ✗ Errors: $($stats.errors)" -ForegroundColor Red

Write-Host "`nDATE GROUPS CREATED: $($dateGroups.Count)" -ForegroundColor Yellow
Write-Host "  Example: 2012-05, 2015-08, 2023-11, etc.`n" -ForegroundColor White

Write-Host "OUTPUT FOLDERS:" -ForegroundColor Yellow
Write-Host "  1. READY TO UPLOAD ($($stats.withGPS) photos):" -ForegroundColor Green
Write-Host "     $withGPSFolder" -ForegroundColor White
Write-Host "     → Upload these immediately!`n" -ForegroundColor Green

Write-Host "  2. GROUPED BY DATE ($($stats.withoutGPS) photos):" -ForegroundColor Yellow
Write-Host "     $byDateFolder" -ForegroundColor White
Write-Host "     → Edit GPS_ASSIGNMENTS.csv to assign locations`n" -ForegroundColor Yellow

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "IMMEDIATE (Upload photos with GPS):" -ForegroundColor Green
Write-Host "  1. Go to: http://localhost:3000/admin/upload" -ForegroundColor White
Write-Host "  2. Select ALL files from: $withGPSFolder" -ForegroundColor White
Write-Host "  3. Upload in batches (500 at a time)" -ForegroundColor White
Write-Host "  4. Watch them appear on map!`n" -ForegroundColor White

Write-Host "BATCH GPS ASSIGNMENT:" -ForegroundColor Yellow
Write-Host "  1. Open: $templatePath" -ForegroundColor White
Write-Host "  2. Fill in job site, address, GPS for each date folder" -ForegroundColor White
Write-Host "  3. Run: apply_gps_assignments.ps1" -ForegroundColor White
Write-Host "  4. Upload newly GPS-tagged photos`n" -ForegroundColor White

Write-Host "TIP: Group by month helps identify job sites" -ForegroundColor Cyan
Write-Host "  - 2012-05 = Pembroke City Hall job" -ForegroundColor White
Write-Host "  - 2023-11 = Orleans bathroom project" -ForegroundColor White
Write-Host "  - Check your project calendar/invoices!`n" -ForegroundColor White

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ PROCESSING COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
