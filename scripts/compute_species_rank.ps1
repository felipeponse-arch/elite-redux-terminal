<#
Computes a fully automatic SS/S/A/B/C/D rank for every species, from three
signals that need no per-Pokemon human review and no user interaction:

  1. BST (base stat total) - percentile rank.
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

Produces TWO ranks per species, both from the same three signals and the
same $WEIGHTS:

  - tier/score: percentile against ALL 1906 species. Answers "how strong is
    this RIGHT NOW" - a first-stage Pokemon will almost always rank low here,
    which is expected (it structurally has less BST than something fully
    evolved), not a bug.
  - stageTier/stageScore: percentile against only OTHER species at the same
    evolution stage (see Get-Stage below - 1 = no predecessor, otherwise
    predecessor's stage + 1; Mega/regional evolutions count as a further
    stage same as a normal one). Answers "is this a GOOD example of a
    Pokemon at this stage" - a first-stage mon that's simply strong for a
    first-stage mon can show SS here even while showing D/C globally. This
    is what a 2026-09-08 user request specifically asked for: rank each
    evolution stage against its own peers, not against fully-evolved forms.

Output: data/species_rank.json, keyed by sname, keeping the full breakdown
(not just the letters) so the UI can show its work.

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

# --- evolution stage: 1 = nothing REAL evolves into this species, otherwise
# predecessor's stage + 1. A Mega/Primal transition does NOT count as a real
# stage and does not increment - it's a power-up, not growth, and box
# legendaries (already sitting on legendary-tier BST in their BASE form)
# disproportionately have a Mega/Primal-only path. Measured: treating Mega
# as a real stage let 28 of 529 "stage 1, has some evolution" species be
# legendary-tier (BST >= 580) - only ~16 species fit the top-3% SS cutoff,
# so that small group could occupy the ENTIRE SS/S band on its own and a
# real basic Pokemon like Bulbasaur would never be able to show
# stage-relative SS/S, defeating the point of the feature (comparing basics
# against other basics, not against legendaries that happen to share the
# same predecessor-count). ---
$megaKindIdx = @()
for ($ki = 0; $ki -lt $dex.evoKinds.Count; $ki++) {
    if ($dex.evoKinds[$ki] -match "MEGA_EVOLUTION|PRIMAL_REVERSION") { $megaKindIdx += $ki }
}

$predecessorOfX = @{}      # targetX -> sourceX, REAL (non-Mega/Primal) edges only
foreach ($s in $dex.species) {
    if (-not $s) { continue }
    foreach ($ev in @($s["ev"])) {
        if ($megaKindIdx -contains $ev[0]) { continue }
        $targetX = [string]$ev[2]
        # A handful of species (~30/1906) have more than one apparent
        # predecessor in the raw data (duplicate evolution-method entries
        # pointing at the same target, or a genuine branch). First one found
        # wins - stage is meant as a coarse bucket, not exact lineage, and
        # this affects too few species to be worth resolving more precisely.
        if (-not $predecessorOfX.ContainsKey($targetX)) { $predecessorOfX[$targetX] = [string]$s["x"] }
    }
}
$stageCache = @{}
function Get-Stage([string]$x, [int]$depth) {
    if ($stageCache.ContainsKey($x)) { return $stageCache[$x] }
    if ($depth -gt 10) { return 1 }  # cycle guard, shouldn't trigger on real data
    if (-not $predecessorOfX.ContainsKey($x)) { $stageCache[$x] = 1; return 1 }
    $s = (Get-Stage $predecessorOfX[$x] ($depth + 1)) + 1
    $stageCache[$x] = $s
    return $s
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

    $stage = Get-Stage $x 0
    # Real evolution line = a real (non-Mega/Primal) edge on at least one
    # side. stage > 1 already proves a real predecessor (Get-Stage only
    # follows $predecessorOfX, which holds real edges only); otherwise check
    # for a real edge ahead. Species with neither (standalones, and
    # Mega/Primal-only lineages like most box legendaries) get no stageTier
    # at all - see the doc-comment above $megaKindIdx for why.
    $hasRealNextStage = $false
    foreach ($ev in @($s["ev"])) { if ($megaKindIdx -notcontains $ev[0]) { $hasRealNextStage = $true; break } }
    $hasEvolutionLine = ($stage -gt 1) -or $hasRealNextStage

    [void]$rows.Add([ordered]@{
        sname = $s["sname"]; bst = $bst; bossCount = $bossCount; abilityScore = $abilityScore
        stage = $stage; hasEvolutionLine = $hasEvolutionLine
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
        $avgPos = (($i + 1) + ($j + 1)) / 2.0
        $pct = ($avgPos / $n) * 100
        $rankOf[[string]$sorted[$i]] = [math]::Round($pct, 2)
        $i = $j + 1
    }
    return $rankOf
}

# Ability gets real weight because it's now systematically computed for all
# 1906 species (not a sparse hand-picked subset) - but BST still leads since
# it's the most universally reliable signal, and boss usage is real but
# noisier (see the doc-comment above). Same weights for the global rank and
# every per-stage rank, so the two numbers stay comparable in spirit.
$WEIGHTS = @{ bst = 0.40; boss = 0.25; ability = 0.35 }

function Get-Tier([double]$pct) {
    if ($pct -ge 97) { return "SS" }
    if ($pct -ge 90) { return "S" }
    if ($pct -ge 75) { return "A" }
    if ($pct -ge 50) { return "B" }
    if ($pct -ge 20) { return "C" }
    return "D"
}

# Computes tier+score+the three percentiles for one population of rows
# (either ALL species for the global rank, or one stage's worth for the
# stage-relative rank). Returns sname -> breakdown. Percentile-ranks the
# composite ITSELF before bucketing (not the raw weighted average) - a
# weighted average of percentiles is not itself uniformly distributed
# (species rarely top all three signals at once, so raw composites regress
# toward the middle); measured on the first version of this script, which
# applied Get-Tier's cutoffs directly to the raw composite and produced
# ZERO SS-tier species. Fixed by percentile-ranking the composite before
# bucketing, done here and reused for every group.
function Compute-Tiers($subsetRows) {
    $bstRanks = Get-PercentileRanks ($subsetRows | ForEach-Object { $_.bst })
    $bossRanks = Get-PercentileRanks ($subsetRows | ForEach-Object { $_.bossCount })
    $abilityRanks = Get-PercentileRanks ($subsetRows | ForEach-Object { $_.abilityScore })

    $composites = @{}
    foreach ($r in $subsetRows) {
        $bstPct = $bstRanks[[string]$r.bst]
        $bossPct = $bossRanks[[string]$r.bossCount]
        $abilityPct = $abilityRanks[[string]$r.abilityScore]
        $composites[$r.sname] = @{
            composite = $bstPct * $WEIGHTS.bst + $bossPct * $WEIGHTS.boss + $abilityPct * $WEIGHTS.ability
            bstPct = $bstPct; bossPct = $bossPct; abilityPct = $abilityPct
        }
    }
    $compositeRanks = Get-PercentileRanks ($composites.Values | ForEach-Object { $_.composite })

    $result = @{}
    foreach ($r in $subsetRows) {
        $c = $composites[$r.sname]
        $finalPct = $compositeRanks[[string]$c.composite]
        $result[$r.sname] = @{
            tier = Get-Tier $finalPct
            score = [math]::Round($finalPct, 1)
            bstPct = $c.bstPct; bossPct = $c.bossPct; abilityPct = $c.abilityPct
        }
    }
    return $result
}

$global = Compute-Tiers $rows

$byStage = @{}
foreach ($r in $rows) {
    if (-not $r.hasEvolutionLine) { continue }
    if (-not $byStage.ContainsKey($r.stage)) { $byStage[$r.stage] = New-Object System.Collections.ArrayList }
    [void]$byStage[$r.stage].Add($r)
}
$stageResults = @{}
foreach ($stageNum in $byStage.Keys) {
    $tiers = Compute-Tiers $byStage[$stageNum]
    foreach ($sname in $tiers.Keys) { $stageResults[$sname] = $tiers[$sname] }
}

$out = [ordered]@{}
foreach ($r in $rows) {
    $g = $global[$r.sname]
    $sg = if ($stageResults.ContainsKey($r.sname)) { $stageResults[$r.sname] } else { $null }
    $out[$r.sname] = [ordered]@{
        tier = $g.tier; score = $g.score
        stage = $r.stage
        stageTier = if ($sg) { $sg.tier } else { $null }
        stageScore = if ($sg) { $sg.score } else { $null }
        bst = $r.bst; bstPct = $g.bstPct
        bossCount = $r.bossCount; bossPct = $g.bossPct
        abilityScore = $r.abilityScore; abilityPct = $g.abilityPct
    }
}

$outPath = Join-Path $dataDir "species_rank.json"
[System.IO.File]::WriteAllText($outPath, (ConvertTo-JsonManual $out), (New-Object System.Text.UTF8Encoding($false)))

$tierCounts = @{}
$stageTierCounts = @{}
$standaloneCount = 0
foreach ($v in $out.Values) {
    if (-not $tierCounts.ContainsKey($v.tier)) { $tierCounts[$v.tier] = 0 }
    $tierCounts[$v.tier]++
    if ($null -eq $v.stageTier) { $standaloneCount++; continue }
    if (-not $stageTierCounts.ContainsKey($v.stageTier)) { $stageTierCounts[$v.stageTier] = 0 }
    $stageTierCounts[$v.stageTier]++
}
Write-Output "compute_species_rank.ps1: OK ($($out.Keys.Count) especies) -> $outPath ($((Get-Item $outPath).Length) bytes)"
Write-Output "-- rank global --"
foreach ($t in "SS", "S", "A", "B", "C", "D") {
    $c = if ($tierCounts.ContainsKey($t)) { $tierCounts[$t] } else { 0 }
    Write-Output ("  $t : $c")
}
Write-Output "-- rank por estagio (agregado, todas as populacoes somadas; standalone sem stageTier) --"
foreach ($t in "SS", "S", "A", "B", "C", "D") {
    $c = if ($stageTierCounts.ContainsKey($t)) { $stageTierCounts[$t] } else { 0 }
    Write-Output ("  $t : $c")
}
Write-Output "  standalone (sem linha evolutiva, sem stageTier): $standaloneCount"
Write-Output "-- especies por estagio (so quem tem linha evolutiva) --"
foreach ($k in ($byStage.Keys | Sort-Object)) { Write-Output ("  estagio ${k}: $($byStage[$k].Count)") }
