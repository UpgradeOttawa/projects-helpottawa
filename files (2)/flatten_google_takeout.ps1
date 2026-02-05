# Flatten Google Takeout Folder Structure
# Moves all photos and JSON files from subfolders into one directory

$sourceFolder = "C:\Users\Acer\Desktop\renovation-platform\test_photos_batch2"
$targetFolder = "C:\Users\Acer\Desktop\renovation-platform\test_photos_batch2"

# Create target folder if it doesn't exist
if (!(Test-Path $targetFolder)) {
    New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
    Write-Host "✓ Created target folder: $targetFolder" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FLATTENING GOOGLE TAKEOUT STRUCTURE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Source: $sourceFolder" -ForegroundColor White
Write-Host "Target: $targetFolder" -ForegroundColor White
Write-Host ""

# Get all files from all subfolders
$allFiles = Get-ChildItem -Path $sourceFolder -Recurse -File

$photoCount = 0
$jsonCount = 0
$otherCount = 0
$skipped = 0

foreach ($file in $allFiles) {
    $extension = $file.Extension.ToLower()
    
    # Skip metadata files we don't need
    if ($extension -eq ".html" -or $file.Name -eq "metadata.json") {
        $skipped++
        continue
    }
    
    $targetPath = Join-Path $targetFolder $file.Name
    
    # Handle duplicate filenames
    if (Test-Path $targetPath) {
        # If file already exists, add timestamp
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        $extension = $file.Extension
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $newName = "${baseName}_${timestamp}${extension}"
        $targetPath = Join-Path $targetFolder $newName
        
        Write-Host "⚠ Duplicate found, renaming: $($file.Name) → $newName" -ForegroundColor Yellow
    }
    
    # Copy file
    try {
        Copy-Item -Path $file.FullName -Destination $targetPath -Force
        
        # Count by type
        if ($extension -eq ".jpg" -or $extension -eq ".jpeg" -or $extension -eq ".png") {
            $photoCount++
            Write-Host "✓ Photo: $($file.Name)" -ForegroundColor Green
        } elseif ($extension -eq ".json") {
            $jsonCount++
            Write-Host "✓ JSON:  $($file.Name)" -ForegroundColor Cyan
        } else {
            $otherCount++
            Write-Host "✓ Other: $($file.Name)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "✗ Error copying: $($file.Name)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Photos copied: $photoCount" -ForegroundColor Green
Write-Host "JSON files copied: $jsonCount" -ForegroundColor Cyan
Write-Host "Other files copied: $otherCount" -ForegroundColor Gray
Write-Host "Skipped (metadata): $skipped" -ForegroundColor Yellow
Write-Host "`nTotal files: $($photoCount + $jsonCount + $otherCount)" -ForegroundColor White
Write-Host "Target folder: $targetFolder" -ForegroundColor White

# Verify pairing
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CHECKING PHOTO-JSON PAIRING" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$photos = Get-ChildItem -Path $targetFolder -Filter "*.jpg"
$photos += Get-ChildItem -Path $targetFolder -Filter "*.jpeg"
$photos += Get-ChildItem -Path $targetFolder -Filter "*.png"

$paired = 0
$unpaired = 0

foreach ($photo in $photos) {
    $jsonName = "$($photo.Name).json"
    $jsonPath = Join-Path $targetFolder $jsonName
    
    if (Test-Path $jsonPath) {
        $paired++
    } else {
        $unpaired++
        Write-Host "⚠ No JSON for: $($photo.Name)" -ForegroundColor Yellow
    }
}

Write-Host "`nPhotos with JSON: $paired" -ForegroundColor Green
Write-Host "Photos without JSON: $unpaired" -ForegroundColor $(if ($unpaired -gt 0) { "Yellow" } else { "Green" })

if ($unpaired -gt 0) {
    Write-Host "`n⚠ Some photos don't have GPS data (no JSON file)" -ForegroundColor Yellow
    Write-Host "These photos won't be able to be uploaded unless they have EXIF GPS." -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✓ COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Go to: http://localhost:3000/admin/upload" -ForegroundColor White
Write-Host "2. Select all files from: $targetFolder" -ForegroundColor White
Write-Host "3. Upload and watch for GPS detection!" -ForegroundColor White
