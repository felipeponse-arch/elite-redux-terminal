<#
Strips fields from data/dex_compact.json that the UI never renders, to cut page
weight. Run AFTER transform.ps1 (which regenerates the full file from the raw
game data) and before build.ps1.

Removed (all invisible or redundant - nothing the UI shows today is lost):
  hw  - height/weight, never rendered
  tm  - TM/HM move list, empty for every species in this build and never rendered
  move descriptions - the English text, now fully superseded by
        data/move_translations_pt.json (only dropped when coverage is 1031/1031;
        otherwise kept as a fallback)

Deliberately KEPT:
  d   - the English Pokedex flavour text (~277KB). It is displayed, so removing
        it is a product decision, not a build optimisation. Set -DropFlavor to
        strip it as well.

Idempotent: re-running on an already-slimmed file is a no-op.
#>
param(
    [switch]$DropFlavor
)

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$dexPath = Join-Path $dataDir "dex_compact.json"
$ptPath = Join-Path $dataDir "move_translations_pt.json"

$ser = New-GameDataParser
$dex = $ser.DeserializeObject((Get-Content $dexPath -Raw -Encoding UTF8))
$before = (Get-Item $dexPath).Length

# Only drop English move text if every described move has a translation.
$dropMoveDesc = $false
if (Test-Path $ptPath) {
    $pt = $ser.DeserializeObject((Get-Content $ptPath -Raw -Encoding UTF8))
    $missing = 0
    for ($i = 1; $i -lt $dex.moves.Count; $i++) {
        if ($dex.moves[$i][6] -and -not $pt["$i"]) { $missing++ }
    }
    if ($missing -eq 0) { $dropMoveDesc = $true }
    else { Write-Output "  aviso: $missing golpes sem traducao - mantendo o texto em ingles como fallback" }
}

$speciesOut = New-Object System.Collections.ArrayList
foreach ($s in $dex.species) {
    if (-not $s) { [void]$speciesOut.Add($null); continue }
    $entry = [ordered]@{
        x = $s["x"]; i = $s["i"]; n = $s["n"]; sname = $s["sname"]
        t = $s["t"]; b = $s["b"]; ab = $s["ab"]; inn = $s["inn"]
        ev = $s["ev"]; lm = $s["lm"]; tu = $s["tu"]
        senc = $s["senc"]
    }
    if (-not $DropFlavor) { $entry["d"] = $s["d"] }
    [void]$speciesOut.Add($entry)
}

$movesOut = New-Object System.Collections.ArrayList
foreach ($m in $dex.moves) {
    $arr = @($m)
    # Bug real, achado 2026-09-11 ao adicionar o campo `prio` (índice 7,
    # transform.ps1): isto reconstruía a tupla como EXATAMENTE arr[0..5] +
    # desc-vazia, descartando silenciosamente qualquer campo além do índice
    # 6 (a descrição) - inclusive prio. Preserva agora qualquer campo extra
    # que já exista depois da descrição, não assume mais que 7 é o
    # tamanho final da tupla pra sempre.
    if ($dropMoveDesc -and $arr.Count -ge 7) {
        $extra = if ($arr.Count -gt 7) { $arr[7..($arr.Count - 1)] } else { @() }
        $arr = $arr[0..5] + @("") + $extra
    }
    [void]$movesOut.Add($arr)
}

$out = [ordered]@{
    meta = $dex.meta
    types = $dex.types
    splits = $dex.splits
    evoKinds = $dex.evoKinds
    flags = $dex.flags
    sencHow = $dex.sencHow
    maps = $dex.maps
    abilities = $dex.abilities
    moves = $movesOut.ToArray()
    items = $dex.items
    species = $speciesOut.ToArray()
}

[System.IO.File]::WriteAllText($dexPath, (ConvertTo-JsonManual $out), (New-Object System.Text.UTF8Encoding($false)))
$after = (Get-Item $dexPath).Length
Write-Output ("slim_dex.ps1: OK  {0:N0} -> {1:N0} bytes (-{2:N0} KB)" -f $before, $after, [math]::Round(($before-$after)/1024))
