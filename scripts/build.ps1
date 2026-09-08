<#
Elite Redux Terminal - single build entrypoint.

Regenerates data/dex_compact.json and data/bosses.json from the raw game data
snapshot, then splices template + all data files into artifact_final.html,
with validation.

Usage:
  powershell -File build.ps1                # full rebuild
  powershell -File build.ps1 -SkipExtract    # reuse existing dex_compact.json / bosses.json
                                              # (fast path when only editing the template,
                                              # builds.json or levelcaps.json)
#>
param(
    [switch]$SkipExtract
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$root = Split-Path $PSScriptRoot -Parent
$dataDir = Join-Path $root "data"
$templatePath = Join-Path $root "artifact_template.html"
$outPath = Join-Path $root "artifact_final.html"

if (-not $SkipExtract) {
    Write-Output "--- regenerating dex_compact.json and bosses.json from raw source ---"
    & (Join-Path $PSScriptRoot "transform.ps1")
    & (Join-Path $PSScriptRoot "extract_bosses.ps1")
    # These used to be manual, run-by-hand steps, which meant a fresh
    # transform.ps1 run silently reverted slim_dex.ps1's size cuts and
    # expand_combo_abilities.ps1's "A + B" expansions back to their raw
    # state (see AUDITORIA-DOSSIE.md 1.3). Both edit their target file
    # in place and are idempotent, so they're safe to always run here.
    Write-Output "--- slimming dex_compact.json ---"
    & (Join-Path $PSScriptRoot "slim_dex.ps1")
    Write-Output "--- expanding combo abilities ---"
    & (Join-Path $PSScriptRoot "expand_combo_abilities.ps1")
} else {
    Write-Output "--- skipping extraction, reusing existing data/dex_compact.json and data/bosses.json ---"
}

if (-not (Test-Path (Join-Path $dataDir "sprite_atlas.png"))) {
    Write-Output "--- sprite atlas missing, building it (downloads ~1900 sprites on first run) ---"
    & (Join-Path $PSScriptRoot "build_sprite_atlas.ps1")
} else {
    Write-Output "--- reusing existing sprite atlas (run build_sprite_atlas.ps1 to refresh) ---"
}

$dataFiles = @{
    "__DEX_DATA_JSON__"  = Join-Path $dataDir "dex_compact.json"
    "__BUILDS_JSON__"    = Join-Path $dataDir "builds.json"
    "__BOSSES_JSON__"    = Join-Path $dataDir "bosses.json"
    "__LEVELCAPS_JSON__" = Join-Path $dataDir "levelcaps.json"
    "__SAVEDTEAMS_JSON__" = Join-Path $dataDir "saved_teams_seed.json"
    "__ABILITY_PT_JSON__" = Join-Path $dataDir "ability_translations_pt.json"
    "__SPRITE_INDEX_JSON__" = Join-Path $dataDir "sprite_index.json"
    "__MOVE_PT_JSON__" = Join-Path $dataDir "move_translations_pt.json"
    "__BUILD_HISTORY_JSON__" = Join-Path $dataDir "build_history.json"
}

foreach ($path in $dataFiles.Values) {
    if (-not (Test-Path $path)) { throw "Missing required data file: $path" }
}

Write-Output "--- splicing ---"
$final = Get-Content $templatePath -Raw -Encoding UTF8
$ser = New-GameDataParser

foreach ($placeholder in $dataFiles.Keys) {
    $path = $dataFiles[$placeholder]
    $json = Get-Content $path -Raw -Encoding UTF8

    # Validate each data file is actually parseable JSON before splicing it in -
    # a bad hand-edit to builds.json/levelcaps.json should fail loudly here,
    # not silently ship a broken artifact.
    try {
        [void]$ser.DeserializeObject($json)
    } catch {
        throw "Data file $path is not valid JSON: $($_.Exception.Message)"
    }

    if ($final -notmatch [regex]::Escape($placeholder)) {
        throw "Placeholder $placeholder not found in template - did the template change?"
    }

    $safeJson = $json.Replace("</script", "<\/script")
    $final = $final.Replace($placeholder, $safeJson)
}

# The sprite atlas is a binary PNG, not JSON, so it gets its own step: embedded
# as a base64 data URI the CSS points at.
$atlasPath = Join-Path $dataDir "sprite_atlas.png"
if (-not (Test-Path $atlasPath)) { throw "Missing sprite atlas: $atlasPath (run build_sprite_atlas.ps1)" }
$atlasUri = "data:image/png;base64," + [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes($atlasPath))
if ($final -notmatch [regex]::Escape("__SPRITE_ATLAS_DATAURI__")) { throw "Placeholder __SPRITE_ATLAS_DATAURI__ not found in template." }
$final = $final.Replace("__SPRITE_ATLAS_DATAURI__", $atlasUri)

foreach ($placeholder in $dataFiles.Keys) {
    if ($final.Contains($placeholder)) { throw "Placeholder $placeholder still present after splice - build is broken." }
}
if ($final.Contains("__SPRITE_ATLAS_DATAURI__")) { throw "Sprite atlas placeholder still present after splice." }

[System.IO.File]::WriteAllText($outPath, $final, (New-Object System.Text.UTF8Encoding($false)))

$bytes = (Get-Item $outPath).Length
if ($bytes -lt 500000) { throw "Output file is suspiciously small ($bytes bytes) - something likely failed silently." }
# Artifact hard limit is 16MB; warn well before we get near it.
if ($bytes -gt 14000000) { throw "Output is ${bytes} bytes, too close to the 16MB artifact limit." }

Write-Output "--- done ---"
Write-Output "artifact_final.html: $bytes bytes ($([math]::Round($bytes/1MB,2)) MB)"
Write-Output "Publish it with the Artifact tool (file_path=$outPath, keep the same artifact url to update in place)."
