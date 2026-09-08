<#
Computes a fully automatic SS/S/A/B/C/D rank for every species, from three
signals that need no per-Pokemon human review and no user interaction:

  1. BST (base stat total) - percentile rank across all real species.
  2. Boss usage - how many DISTINCT boss trainers (data/bosses.json, any
     tier: party/insane/hell) use this species anywhere. Real signal (only
     22% of species appear in any boss fight at all, only ~1% appear in 5+),
     but a known limitation: this can't tell "genuinely weak" apart from
     "late-game/postgame exclusive that just hasn't had a chance to appear
     yet", or "used for type-theme flavor, not power". Documented, not
     silently hidden.
  3. Ability impact - Score-AbilityText (common.ps1) applied to every innate
     (always active - summed) and the BEST of the 3 choosable slots (species'
     ceiling with an ideal pick). Systematically computed for all 1033
     translated abilities, not a sparse hand-picked subset - see
     scripts/score_abilities.ps1 for the calibration pass this rubric came
     from. Known limitation: the rubric only catches PERSONAL
     damage/survivability impact from patterns common in this project's
     translation style guide - it does not (cannot, from regex alone) judge
     team-wide utility (weather-setting, hazard-setting) or movepool quality.

All three are combined as a weighted percentile average - see $WEIGHTS
below - then bucketed into a letter tier. Output: data/species_rank.json,
keyed by sname, each entry keeping the full breakdown so the UI can show
WHY a species got its rank, not just the letter.

Run after transform.ps1, extract_bosses.ps1 and expand_combo_abilities.ps1
(needs dex_compact.json, bosses.json, ability_translations_pt.json all
present and current).
#>

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser

$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))
$bosses = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "bosses.json") -Raw -Encoding UTF8))
$pt = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "ability_translations_pt.json") -Raw -Encoding UTF8))

$abilityScoreCache = @{}
function Get-AbilityScore([int]$id) {
    $key = [string]$id
    if (-not $abilityScoreCache.ContainsKey($key)) {
        $abilityScoreCache[$key] = Score-AbilityText $pt[$key]
    }
    return $abilityScoreCache[$key]
}

# --- boss usage: distinct boss names per species x, any tier ---
$bossCountByX = @{}
foreach ($b in $bosses) {
    $seen = @{}
    foreach ($tier in "party", "insane", "hell") {
        foreach ($m in @($b[$tier])) {
            if ($m -and $null -ne $m["x"]) { $seen[[string]$m["x"]] = 1 }
        }
    }
    foreach ($x in $seen.Keys) {
        if (-not $bossCountByX.ContainsKey($x)) { $bossCountByX[$x] = 0 }
        $bossCountByX[$x] = $bossCountByX[$x] + 1
    }
}

# --- per-species raw signals ---
$rows = New-Object System.Collections.ArrayList
foreach ($s in $dex.species) {
    if (-not $s) { continue }
    $x = [string]$s["x"]
    $bst = (@($s["b"]) | Measure-Object -Sum).Sum

    $innIds = @($s["inn"]) | Where-Object { $_ -and $_ -ne 0 } | Select-Object -Unique
    $innScore = 0
    foreach ($id in $innIds) { $innScore += (Get-AbilityScore $id) }
    $abIds = @($s["ab"]) | Where-Object { $_ -and $_ -ne 0 } | Select-Object -Unique
    $abBest = 0
    foreach ($id in $abIds) { $sc = Get-AbilityScore $id; if ($sc -gt $abBest) { $abBest = $sc } }
    $abilityScore = $innScore + $abBest

    $bossCount = if ($bossCountByX.ContainsKey($x)) { $bossCountByX[$x] } else { 0 }

    [void]$rows.Add([ordered]@{
        sname = $s["sname"]; bst = $bst; bossCount = $bossCount; abilityScore = $abilityScore
    })
}

# --- percentile rank helper: fraction of the population at or below this
# value, as 0-100. Ties share the same (average) percentile. ---
function Get-PercentileRanks($values) {
    $sorted = $values | Sort-Object
    $n = $sorted.Count
    $rankOf = @{}
    $i = 0
    while ($i -lt $n) {
        $j = $i
        while ($j + 1 -lt $n -and $sorted[$j + 1] -eq $sorted[$i]) { $j++ }
        # average rank position (1-based) across the tied block, as a percentile
        $avgPos = (($i + 1) + ($j + 1)) / 2.0
        $pct = ($avgPos / $n) * 100
        $rankOf[[string]$sorted[$i]] = [math]::Round($pct, 2)
        $i = $j + 1
    }
    return $rankOf
}

$bstRanks = Get-PercentileRanks ($rows | ForEach-Object { $_.bst })
$bossRanks = Get-PercentileRanks ($rows | ForEach-Object { $_.bossCount })
$abilityRanks = Get-PercentileRanks ($rows | ForEach-Object { $_.abilityScore })

# Ability gets real weight because it's now systematically computed for all
# 1906 species (not a sparse hand-picked subset) - but BST still leads since
# it's the most universally reliable signal, and boss usage is real but
# noisier (see the doc-comment above).
$WEIGHTS = @{ bst = 0.40; boss = 0.25; ability = 0.35 }

function Get-Tier([double]$pct) {
    if ($pct -ge 97) { return "SS" }
    if ($pct -ge 90) { return "S" }
    if ($pct -ge 75) { return "A" }
    if ($pct -ge 50) { return "B" }
    if ($pct -ge 20) { return "C" }
    return "D"
}

foreach ($r in $rows) {
    $r.bstPct = $bstRanks[[string]$r.bst]
    $r.bossPct = $bossRanks[[string]$r.bossCount]
    $r.abilityPct = $abilityRanks[[string]$r.abilityScore]
    $r.composite = $r.bstPct * $WEIGHTS.bst + $r.bossPct * $WEIGHTS.boss + $r.abilityPct * $WEIGHTS.ability
}

# A weighted AVERAGE of three percentiles is NOT itself uniformly
# distributed - species rarely rank in the top (or bottom) percentile of all
# three signals at once, so composite scores regress toward the middle
# (measured: applying the Get-Tier cutoffs directly to composite gave ZERO
# SS-tier species and a lopsided B/C split). Percentile-rank the composite
# itself before bucketing, so "top 3%" means the actual top 3% of species by
# composite score, not an arbitrary raw-score cutoff nothing reaches.
$compositeRanks = Get-PercentileRanks ($rows | ForEach-Object { $_.composite })

$out = [ordered]@{}
foreach ($r in $rows) {
    $finalPct = $compositeRanks[[string]$r.composite]
    $out[$r.sname] = [ordered]@{
        tier = Get-Tier $finalPct
        score = [math]::Round($finalPct, 1)
        bst = $r.bst; bstPct = $r.bstPct
        bossCount = $r.bossCount; bossPct = $r.bossPct
        abilityScore = $r.abilityScore; abilityPct = $r.abilityPct
    }
}

$outPath = Join-Path $dataDir "species_rank.json"
[System.IO.File]::WriteAllText($outPath, (ConvertTo-JsonManual $out), (New-Object System.Text.UTF8Encoding($false)))

$tierCounts = @{}
foreach ($v in $out.Values) { if (-not $tierCounts.ContainsKey($v.tier)) { $tierCounts[$v.tier] = 0 }; $tierCounts[$v.tier]++ }
Write-Output "compute_species_rank.ps1: OK ($($out.Keys.Count) especies) -> $outPath ($((Get-Item $outPath).Length) bytes)"
foreach ($t in "SS", "S", "A", "B", "C", "D") {
    $c = if ($tierCounts.ContainsKey($t)) { $tierCounts[$t] } else { 0 }
    Write-Output ("  $t : $c")
}
