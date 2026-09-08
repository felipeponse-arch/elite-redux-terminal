<#
Standalone research/calibration script - NOT part of build.ps1.

Scores every translated ability description (data/ability_translations_pt.json)
0-3 for personal combat impact (survivability/damage relevance to the ONE
Pokemon that has it - not team-wide utility like weather-setting), using
regex rules over the already-translated, style-guide-consistent Portuguese
text. This is the research pass behind the species-rank feature: run it,
eyeball the distribution and the per-tier samples below, adjust the rules,
re-run - BEFORE scores.compute_species_rank.ps1 consumes the same function
for real.

Usage: powershell -File scripts\score_abilities.ps1
#>

. (Join-Path $PSScriptRoot "common.ps1")
# Score-AbilityText lives in common.ps1 now, shared with
# scripts/compute_species_rank.ps1 so calibration and real use never drift.

$ser = New-GameDataParser
$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$pt = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "ability_translations_pt.json") -Raw -Encoding UTF8))
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))

$scores = @{}
foreach ($id in $pt.Keys) { $scores[$id] = Score-AbilityText $pt[$id] }

$byTier = @{0=0;1=0;2=0;3=0}
foreach ($v in $scores.Values) { $byTier[$v]++ }
Write-Output "--- distribuicao de scores entre $($scores.Count) habilidades traduzidas ---"
foreach ($t in 0,1,2,3) { Write-Output ("tier $t : $($byTier[$t])") }

Write-Output "`n--- amostra tier 3 (ate 15) ---"
$n = 0
foreach ($id in $scores.Keys) {
    if ($scores[$id] -eq 3 -and $n -lt 15) {
        $name = $null
        foreach ($i in 0..($dex.abilities.Count-1)) { if ($i -eq [int]$id) { $name = $dex.abilities[$i][0]; break } }
        Write-Output ("$id`t$name`t$($pt[$id])")
        $n++
    }
}

Write-Output "`n--- amostra tier 2 (ate 15) ---"
$n = 0
foreach ($id in $scores.Keys) {
    if ($scores[$id] -eq 2 -and $n -lt 15) {
        $name = $null
        foreach ($i in 0..($dex.abilities.Count-1)) { if ($i -eq [int]$id) { $name = $dex.abilities[$i][0]; break } }
        Write-Output ("$id`t$name`t$($pt[$id])")
        $n++
    }
}
