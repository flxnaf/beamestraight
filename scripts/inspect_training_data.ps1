# Beame Training Data Inspector
# Run this script to extract and analyze Label Studio exports

param(
    [string]$DataFolder = "..\Training Data"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Beame Training Data Inspector" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script's directory and resolve data folder path
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataPath = Join-Path $scriptDir $DataFolder
$dataPath = Resolve-Path $dataPath -ErrorAction SilentlyContinue

if (-not $dataPath) {
    $dataPath = Join-Path (Get-Location) "Training Data"
}

Write-Host "Looking for training data in: $dataPath" -ForegroundColor Yellow
Write-Host ""

# Find all zip files
$zipFiles = Get-ChildItem -Path $dataPath -Filter "*.zip" -ErrorAction SilentlyContinue

if ($zipFiles.Count -eq 0) {
    Write-Host "ERROR: No zip files found in $dataPath" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($zipFiles.Count) zip file(s):" -ForegroundColor Green
$zipFiles | ForEach-Object { Write-Host "  - $($_.Name)" }
Write-Host ""

# Create extraction folder
$extractPath = Join-Path $dataPath "extracted_preview"
if (Test-Path $extractPath) {
    Remove-Item $extractPath -Recurse -Force
}
New-Item -ItemType Directory -Path $extractPath | Out-Null

# Extract first zip for inspection
$firstZip = $zipFiles[0]
Write-Host "Extracting first file for inspection: $($firstZip.Name)" -ForegroundColor Yellow

try {
    Expand-Archive -Path $firstZip.FullName -DestinationPath $extractPath -Force
    Write-Host "Extraction successful!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to extract zip file: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Folder Structure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Show folder structure
Get-ChildItem -Path $extractPath -Recurse | ForEach-Object {
    $indent = "  " * ($_.FullName.Split('\').Count - $extractPath.Split('\').Count)
    if ($_.PSIsContainer) {
        Write-Host "$indent[DIR] $($_.Name)" -ForegroundColor Blue
    } else {
        Write-Host "$indent$($_.Name) ($([math]::Round($_.Length/1KB, 1)) KB)"
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Annotation Files Analysis" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Find annotation files (JSON, XML, TXT)
$annotationFiles = Get-ChildItem -Path $extractPath -Recurse -Include "*.json", "*.xml", "*.txt", "*.yaml" -ErrorAction SilentlyContinue

if ($annotationFiles.Count -eq 0) {
    Write-Host "No annotation files found. Checking for Label Studio format..." -ForegroundColor Yellow
} else {
    Write-Host "Found $($annotationFiles.Count) potential annotation file(s):" -ForegroundColor Green
    
    foreach ($file in $annotationFiles) {
        Write-Host ""
        Write-Host "--- $($file.Name) ---" -ForegroundColor Magenta
        
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        
        if ($file.Extension -eq ".json") {
            try {
                $json = $content | ConvertFrom-Json
                
                # Check if it's Label Studio format
                if ($json -is [array] -and $json[0].annotations) {
                    Write-Host "Format: Label Studio JSON Export" -ForegroundColor Green
                    Write-Host "Total items: $($json.Count)"
                    
                    # Analyze first annotation
                    $firstItem = $json[0]
                    Write-Host "First item has $($firstItem.annotations.Count) annotation(s)"
                    
                    if ($firstItem.annotations[0].result) {
                        $results = $firstItem.annotations[0].result
                        Write-Host "Annotation types found:"
                        $results | ForEach-Object {
                            Write-Host "  - Type: $($_.type), Label: $($_.value.polygonlabels -join ', ')" -ForegroundColor Cyan
                            if ($_.value.points) {
                                Write-Host "    Points: $($_.value.points.Count) vertices (POLYGON - Good for OBB!)" -ForegroundColor Green
                            }
                            if ($_.value.x -and $_.value.width) {
                                Write-Host "    Rectangle: x=$($_.value.x), y=$($_.value.y), w=$($_.value.width), h=$($_.value.height)"
                            }
                        }
                    }
                } elseif ($json.images -and $json.annotations) {
                    Write-Host "Format: COCO JSON" -ForegroundColor Green
                    Write-Host "Images: $($json.images.Count), Annotations: $($json.annotations.Count)"
                } else {
                    Write-Host "Format: Generic JSON"
                    Write-Host "Keys: $($json.PSObject.Properties.Name -join ', ')"
                }
            } catch {
                Write-Host "Could not parse JSON: $_" -ForegroundColor Red
            }
        } elseif ($file.Extension -eq ".txt") {
            $lines = $content -split "`n" | Where-Object { $_.Trim() }
            Write-Host "Lines: $($lines.Count)"
            if ($lines.Count -gt 0) {
                $firstLine = $lines[0].Trim()
                $parts = $firstLine -split '\s+'
                Write-Host "First line parts: $($parts.Count)"
                if ($parts.Count -eq 5) {
                    Write-Host "Format: YOLO Detection (class x y w h)" -ForegroundColor Green
                } elseif ($parts.Count -eq 9) {
                    Write-Host "Format: YOLO OBB (class x1 y1 x2 y2 x3 y3 x4 y4) - PERFECT!" -ForegroundColor Green
                } elseif ($parts.Count -gt 5) {
                    Write-Host "Format: YOLO Segmentation/Polygon" -ForegroundColor Yellow
                }
                Write-Host "Sample: $firstLine"
            }
        } elseif ($file.Extension -eq ".yaml") {
            Write-Host "Content preview:"
            Write-Host ($content.Substring(0, [Math]::Min(500, $content.Length)))
        }
    }
}

# Find images
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Image Files" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$imageFiles = Get-ChildItem -Path $extractPath -Recurse -Include "*.jpg", "*.jpeg", "*.png", "*.webp" -ErrorAction SilentlyContinue
Write-Host "Found $($imageFiles.Count) image(s)" -ForegroundColor Green
if ($imageFiles.Count -gt 0) {
    Write-Host "Sample images:"
    $imageFiles | Select-Object -First 5 | ForEach-Object {
        Write-Host "  - $($_.Name) ($([math]::Round($_.Length/1KB, 1)) KB)"
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Recommendation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run the Python conversion script next:" -ForegroundColor Yellow
Write-Host "  python scripts/convert_labelstudio_to_yolo_obb.py" -ForegroundColor White
Write-Host ""
