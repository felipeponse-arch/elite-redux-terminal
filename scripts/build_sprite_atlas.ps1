<#
Downloads the front sprite for EVERY species in dex_compact.json and packs them
into a single atlas PNG + an index map, so the artifact can show a sprite for all
1906 species without embedding 1906 separate base64 images.

Why an atlas: the artifact CSP blocks remote images, so sprites must be embedded.
As individual data URIs that is ~7MB of base64; as one atlas PNG it compresses to
a fraction of that, and the browser decodes one image instead of ~1900.

Outputs:
  data/sprite_atlas.png   - the packed image (64px cells, ATLAS_COLS per row)
  data/sprite_index.json  - { "<species x>": <slot index> }
Raw downloads are cached in data/sprites_all/<x>.png so re-runs are incremental.
#>

. (Join-Path $PSScriptRoot "common.ps1")
Add-Type -AssemblyName System.Drawing

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$rawDir = Join-Path $dataDir "sprites_all"
if (-not (Test-Path $rawDir)) { New-Item -ItemType Directory -Path $rawDir | Out-Null }

# Source sprites are 64px and the atlas keeps that size: the Dex sheet shows a sprite at 192px,
# and at 48 it came out deformed (10/11/2026). Storing at 64 costs page weight but nothing is upscaled
# beyond what the UI needs.
# NearestNeighbor on purpose: smooth interpolation invents intermediate colours
# and partial alpha, which makes the PNG BIGGER, not smaller (measured).
$CELL = 64
$ATLAS_COLS = 44

$ser = New-GameDataParser
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))

$available = @{}
foreach ($line in (Get-Content (Join-Path $dataDir "sprite_filenames.txt"))) { $available[$line] = $true }

$targets = New-Object System.Collections.ArrayList
foreach ($sp in $dex.species) {
    if (-not $sp) { continue }
    $key = ($sp["sname"] -replace "^SPECIES_", "")
    if (-not $available.ContainsKey($key)) { continue }
    [void]$targets.Add([ordered]@{ x = $sp["x"]; file = $key })
}
Write-Output "targets: $($targets.Count)"

# ---- download (incremental) ----
$wc = New-Object System.Net.WebClient
$fetched = 0; $cached = 0; $failed = 0
foreach ($t in $targets) {
    $path = Join-Path $rawDir ("" + $t.x + ".png")
    if (Test-Path $path) { $cached++; continue }
    $url = "https://raw.githubusercontent.com/ForwardFeed/ER-nextdex/main/static/sprites/$($t.file).png"
    try {
        $wc.DownloadFile($url, $path)
        $fetched++
        if ($fetched % 200 -eq 0) { Write-Output "  ...$fetched downloaded" }
    } catch {
        $failed++
    }
}
Write-Output "download: $fetched new, $cached cached, $failed failed"

# ---- pack atlas ----
$usable = @($targets | Where-Object { Test-Path (Join-Path $rawDir ("" + $_.x + ".png")) })
$rows = [math]::Ceiling($usable.Count / $ATLAS_COLS)
$atlasW = $ATLAS_COLS * $CELL
$atlasH = $rows * $CELL
Write-Output "atlas: $($usable.Count) sprites, ${atlasW}x${atlasH}px ($ATLAS_COLS x $rows cells)"

$bmp = New-Object System.Drawing.Bitmap($atlasW, $atlasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

$index = [ordered]@{}
$slot = 0
foreach ($t in $usable) {
    $path = Join-Path $rawDir ("" + $t.x + ".png")
    try {
        $img = [System.Drawing.Image]::FromFile($path)
        $col = $slot % $ATLAS_COLS
        $row = [math]::Floor($slot / $ATLAS_COLS)
        $dst = New-Object System.Drawing.Rectangle(($col * $CELL), ($row * $CELL), $CELL, $CELL)
        $srcR = New-Object System.Drawing.Rectangle(0, 0, $img.Width, $img.Height)
        $g.DrawImage($img, $dst, $srcR, [System.Drawing.GraphicsUnit]::Pixel)
        $img.Dispose()
        $index[[string]$t.x] = $slot
        $slot++
    } catch {
        Write-Output "  skip (unreadable): $path"
    }
}
$g.Dispose()

$atlasPath = Join-Path $dataDir "sprite_atlas.png"
$bmp.Save($atlasPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

$meta = [ordered]@{
    cell = $CELL
    cols = $ATLAS_COLS
    rows = $rows
    index = $index
}
$outPath = Join-Path $dataDir "sprite_index.json"
[System.IO.File]::WriteAllText($outPath, (ConvertTo-JsonManual $meta), (New-Object System.Text.UTF8Encoding($false)))

Write-Output "build_sprite_atlas.ps1: OK ($slot sprites packed)"
Write-Output "  $atlasPath ($([math]::Round((Get-Item $atlasPath).Length/1MB,2)) MB)"
Write-Output "  $outPath ($((Get-Item $outPath).Length) bytes)"
