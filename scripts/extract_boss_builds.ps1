<#
For every species that appears in a boss trainer's party (data/bosses.json),
finds that species' OWN highest difficulty tier reached anywhere in the game
(hell > insane > party) and keeps every boss appearance at that tier as a
reference build - data/boss_reference_builds.json, keyed by sname.

This is reference/inspiration data shown in the Dex ("Builds vistas em
chefoes"), NOT a replacement for the hand-curated data/builds.json: a boss's
moveset is tuned for that one fight (sometimes a double battle, sometimes a
support/stall set), not necessarily a generically good build for the
player's own team. Framed that way in the UI on purpose.

Run AFTER extract_bosses.ps1 and transform.ps1 (needs both data/bosses.json
and data/dex_compact.json - the latter only to resolve x -> sname, since
bosses.json itself is keyed by the unstable per-build x, same as everything
else species-index-based - see the x vs sname note in artifact_template.html).
#>

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser

$bosses = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "bosses.json") -Raw -Encoding UTF8))
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))

$snameByX = @{}
foreach ($s in $dex.species) { if ($s) { $snameByX[[string]$s["x"]] = $s["sname"] } }

$tierRank = @{ party = 0; insane = 1; hell = 2 }

# Pass 1: find each species' own best (highest) tier reached across ALL boss
# appearances anywhere - "highest tier" is per-species, not per-fight, since
# the same Pokemon can show up as a throwaway party-tier member in one fight
# and a hell-tier showcase in another.
$bestTier = @{}
$occurrences = New-Object System.Collections.ArrayList
foreach ($b in $bosses) {
    foreach ($tier in @("party", "insane", "hell")) {
        foreach ($m in @($b[$tier])) {
            if (-not $m -or -not $m["n"] -or $m["n"] -eq "?") { continue }
            $x = [string]$m["x"]
            $rank = $tierRank[$tier]
            if (-not $bestTier.ContainsKey($x) -or $rank -gt $bestTier[$x]) { $bestTier[$x] = $rank }
            [void]$occurrences.Add(@{ x = $x; rank = $rank; tier = $tier; boss = $b["name"]; cat = $b["cat"]; db = $b["db"]; m = $m })
        }
    }
}

# Pass 2: keep only the occurrences that match each species' own best tier.
$out = [ordered]@{}
foreach ($occ in $occurrences) {
    if ($occ.rank -ne $bestTier[$occ.x]) { continue }
    $sname = $snameByX[$occ.x]
    if (-not $sname) { continue }
    if (-not $out.Contains($sname)) { $out[$sname] = New-Object System.Collections.ArrayList }
    [void]$out[$sname].Add([ordered]@{
        boss    = $occ.boss
        cat     = $occ.cat
        db      = [bool]$occ.db
        tier    = $occ.tier
        ability = $occ.m["abi"]
        nature  = $occ.m["nat"]
        evs     = $occ.m["evs"]
        item    = $occ.m["item"]
        moves   = $occ.m["mv"]
    })
}

$outPath = Join-Path $dataDir "boss_reference_builds.json"
[System.IO.File]::WriteAllText($outPath, (ConvertTo-JsonManual $out), (New-Object System.Text.UTF8Encoding($false)))

$speciesCount = $out.Keys.Count
$entryCount = 0
foreach ($k in $out.Keys) { $entryCount += $out[$k].Count }
Write-Output "extract_boss_builds.ps1: OK ($speciesCount especies, $entryCount builds de referencia) -> $outPath ($((Get-Item $outPath).Length) bytes)"
