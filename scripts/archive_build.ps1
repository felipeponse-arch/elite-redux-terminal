<#
Archives the CURRENT data/builds.json entry for one species into
data/build_history.json before that entry gets overwritten with a new
recommendation, so past builds aren't lost - see AUDITORIA-DOSSIE.md and the
"historico de builds" feature discussion in project memory.

Run this BEFORE hand-editing builds.json with a new build for the same
species. It only reads/appends - it does not touch builds.json itself.

Usage:
  powershell -File archive_build.ps1 -Sname SPECIES_PROBOPASS -Context "Time inicial, build 2.65beta"

If builds.json has no entry for -Sname yet, this is a no-op (there is
nothing to archive) - a warning is printed, nothing is written.
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Sname,
    [Parameter(Mandatory = $true)]
    [string]$Context
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$buildsPath = Join-Path $dataDir "builds.json"
$historyPath = Join-Path $dataDir "build_history.json"

$ser = New-GameDataParser
$builds = $ser.DeserializeObject((Get-Content $buildsPath -Raw -Encoding UTF8))

if (-not $builds.ContainsKey($Sname)) {
    Write-Output "archive_build.ps1: nada a arquivar - $Sname nao tem entrada em builds.json ainda."
    exit 0
}

$current = $builds[$Sname]

$history = if (Test-Path $historyPath) {
    $raw = (Get-Content $historyPath -Raw -Encoding UTF8).Trim()
    if ($raw) { $ser.DeserializeObject($raw) } else { @{} }
} else { @{} }

if (-not $history.ContainsKey($Sname)) {
    $history[$Sname] = New-Object System.Collections.ArrayList
} elseif ($history[$Sname] -isnot [System.Collections.ArrayList]) {
    # DeserializeObject gives back an object[]/ArrayList for JSON arrays depending
    # on caller history - normalize so .Add always works below.
    $tmp = New-Object System.Collections.ArrayList
    foreach ($item in @($history[$Sname])) { [void]$tmp.Add($item) }
    $history[$Sname] = $tmp
}

# Desde 2026-09-24 o valor pode ser uma lista (ate 3 curadas, uma por estilo):
# cada build da lista vira uma entrada propria no historico.
foreach ($b in @($current)) {
    $entry = [ordered]@{
        savedAt = (Get-Date -Format "yyyy-MM-dd")
        context = $Context
    }
    foreach ($key in $b.Keys) { $entry[$key] = $b[$key] }
    [void]$history[$Sname].Add($entry)
}

[System.IO.File]::WriteAllText($historyPath, (ConvertTo-JsonManual $history), (New-Object System.Text.UTF8Encoding($false)))

Write-Output "archive_build.ps1: OK - build anterior de $Sname arquivada (contexto: `"$Context`")."
Write-Output "  $Sname agora tem $($history[$Sname].Count) build(s) no historico."
Write-Output "  Lembrete: agora edite builds.json com a NOVA build para $Sname, depois rode build.ps1."
