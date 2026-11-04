<#
Some abilities are defined in the game data only as a sum of other abilities -
e.g. Brute Force's whole description is "Rock Head + Reckless". That tells you
nothing unless you already know both, so this script rewrites those entries in
data/ability_translations_pt.json to also spell out what each component does,
in Portuguese.

Combos can nest (a component may itself be a combo), so components are flattened
recursively down to abilities that have a real description.

Run after ability_translations_pt.json exists; it edits that file in place and is
idempotent (already-expanded entries are rebuilt from scratch each run).
#>

# GUARDA (TK-41): script antigo, fora do fluxo. Substituto: scripts/extracao/expandir_compostas.mjs (build.ps1 chama).
if ($args -notcontains "-Forcar") { Write-Error "expand_combo_abilities.ps1 esta aposentado. Use scripts/extracao/expandir_compostas.mjs via build.ps1. Para rodar mesmo assim, passe -Forcar."; exit 1 }

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))
$ptPath = Join-Path $dataDir "ability_translations_pt.json"
$pt = $ser.DeserializeObject((Get-Content $ptPath -Raw -Encoding UTF8))

# ability name -> id
$byName = @{}
for ($i = 0; $i -lt $dex.abilities.Count; $i++) {
    $n = $dex.abilities[$i][0]
    if ($n -and -not $byName.ContainsKey($n)) { $byName[$n] = $i }
}

function Get-ComboParts($id) {
    $desc = $dex.abilities[$id][1]
    if (-not $desc -or $desc -notmatch '\+') { return $null }
    $parts = ($desc.TrimEnd('.').Trim()) -split '\s*\+\s*'
    if ($parts.Count -lt 2) { return $null }
    $ids = New-Object System.Collections.ArrayList
    foreach ($p in $parts) {
        $key = $p.Trim()
        if (-not $byName.ContainsKey($key)) { return $null }
        [void]$ids.Add($byName[$key])
    }
    return $ids.ToArray()
}

# Flatten nested combos into atomic component ids, guarding against cycles.
function Flatten-Combo($id, $seen) {
    $out = New-Object System.Collections.ArrayList
    $parts = Get-ComboParts $id
    if (-not $parts) { [void]$out.Add($id); return $out.ToArray() }
    foreach ($p in $parts) {
        if ($seen -contains $p) { continue }
        $nextSeen = $seen + @($p)
        foreach ($f in (Flatten-Combo $p $nextSeen)) {
            if ($out -notcontains $f) { [void]$out.Add($f) }
        }
    }
    return $out.ToArray()
}

$expanded = 0
$skipped = New-Object System.Collections.ArrayList

for ($i = 1; $i -lt $dex.abilities.Count; $i++) {
    $parts = Get-ComboParts $i
    if (-not $parts) { continue }

    $atoms = Flatten-Combo $i @($i)
    if ($atoms.Count -eq 0) { [void]$skipped.Add($dex.abilities[$i][0]); continue }

    $headNames = @($parts | ForEach-Object { $dex.abilities[$_][0] })
    $lines = New-Object System.Collections.ArrayList
    [void]$lines.Add(($headNames -join " + "))
    foreach ($a in $atoms) {
        $name = $dex.abilities[$a][0]
        $desc = $pt["$a"]
        if (-not $desc) { $desc = $dex.abilities[$a][1] }   # fall back to English if untranslated
        if (-not $desc) { continue }
        [void]$lines.Add("- " + $name + ": " + $desc)
    }
    if ($lines.Count -lt 2) { [void]$skipped.Add($dex.abilities[$i][0]); continue }
    $pt["$i"] = ($lines -join "`n")
    $expanded++
}

[System.IO.File]::WriteAllText($ptPath, (ConvertTo-JsonManual $pt), (New-Object System.Text.UTF8Encoding($false)))

Write-Output "expand_combo_abilities.ps1: OK ($expanded combo abilities expanded)"
if ($skipped.Count -gt 0) {
    Write-Output "  could not expand $($skipped.Count): $($skipped -join ', ')"
}
Write-Output "  -> $ptPath ($((Get-Item $ptPath).Length) bytes)"
