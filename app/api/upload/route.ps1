# GOOGLE TAKEOUT PHOTO PROCESSOR
# Processes Google Takeout photos with GPS data
# Output: Photos ready to upload with renamed JSON files

param(
    [string]$SourceFolder = "C:\Users\Acer\Desktop\renovation-platform\takeout\Takeout\Google_Photos",
    [string]$OutputFolder = "C:\Users\Acer\Desktop\renovation-platform\upload_ready"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "GOOGLE TAKEOUT PHOTO PROCESSOR" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Verify source folder exists
if (!(Test-Path $SourceFolder)) {
    Write-Host "ERROR: Source folder not found: $SourceFolder" -ForegroundColor Red
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# Create output folder
if (Test-Path $OutputFolder) {
    Write-Host "Cleaning output folder..." -ForegroundColor Yellow
    Remove-Item "$OutputFolder\*" -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $OutputFolder -Force | Out-Null

Write-Host "Source: $SourceFolder" -ForegroundColor White
Write-Host "Output: $OutputFolder`n" -ForegroundColor White

# Find all photos
Write-Host "Scanning for photos..." -ForegroundColor Cyan
$allPhotos = Get-ChildItem -Path $SourceFolder -Recurse -File | Where-Object {
    $_.Extension -match '\.(jpg|jpeg|png)$'
}

Write-Host "Found $($allPhotos.Count) photos`n" -ForegroundColor Green

# Process each photo
$withGPS = 0
$noGPS = 0
$invalidGPS = 0

foreach ($photo in $allPhotos) {
    # Look for companion JSON file
    $jsonFiles = @(
        "$($photo.FullName).json",
        "$($photo.FullName).supplemental-metadata.json"
    )
    
    $jsonFile = $null
    foreach ($path in $jsonFiles) {
        if (Test-Path $path) {
            $jsonFile = $path
            break
        }
    }
    
    if (!$jsonFile) {
        $noGPS++
        continue
    }
    
    # Read and parse JSON
    try {
        $jsonContent = Get-Content $jsonFile -Raw | ConvertFrom-Json
        
        # Check for GPS data
        if ($jsonContent.geoData -and 
            $jsonContent.geoData.latitude -ne 0 -and 
            $jsonContent.geoData.longitude -ne 0) {
            
            $lat = $jsonContent.geoData.latitude
            $lng = $jsonContent.geoData.longitude
            
            # Validate coordinates
            if ($lat -lt -90 -or $lat -gt 90 -or $lng -lt -180 -or $lng -gt 180) {
                $invalidGPS++
                continue
            }
            
            # Copy photo to output
            $newPhotoPath = Join-Path $OutputFolder $photo.Name
            Copy-Item $photo.FullName $newPhotoPath -Force
            
            # Create properly named JSON file for upload API
            $newJsonPath = "$newPhotoPath.json"
            Copy-Item $jsonFile $newJsonPath -Force
            
            $withGPS++
            
            if ($withGPS % 100 -eq 0) {
                Write-Host "  Processed $withGPS photos with GPS..." -ForegroundColor Gray
            }
        }
        else {
            $noGPS++
        }
    }
    catch {
        $invalidGPS++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESULTS" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Total photos scanned: $($allPhotos.Count)" -ForegroundColor White
Write-Host "  SUCCESS - With GPS: $withGPS" -ForegroundColor Green
Write-Host "  SKIPPED - No GPS: $noGPS" -ForegroundColor Yellow
Write-Host "  SKIPPED - Invalid GPS: $invalidGPS" -ForegroundColor Red

if ($withGPS -gt 0) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "READY TO UPLOAD" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "$withGPS photos are ready in:" -ForegroundColor Green
    Write-Host "$OutputFolder`n" -ForegroundColor White
    
    Write-Host "NEXT STEP:" -ForegroundColor Yellow
    Write-Host "1. Go to: http://localhost:3000/admin/upload" -ForegroundColor White
    Write-Host "2. Select ALL files from output folder (both .jpg and .json)" -ForegroundColor White
    Write-Host "3. Choose room type: general_renovation" -ForegroundColor White
    Write-Host "4. Click Upload" -ForegroundColor White
    Write-Host "5. Wait for upload to complete" -ForegroundColor White
    Write-Host "6. Check map: http://localhost:3000/map`n" -ForegroundColor White
}
else {
    Write-Host "`nWARNING: No photos with GPS found!" -ForegroundColor Red
    Write-Host "All photos have latitude/longitude = 0" -ForegroundColor Yellow
    Write-Host "This means location services were disabled when photos were taken.`n" -ForegroundColor Yellow
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
