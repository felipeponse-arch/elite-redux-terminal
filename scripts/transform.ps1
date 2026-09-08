# Generates data/dex_compact.json from data/gameData_265beta.json (the raw
# Elite Redux NextDex export). Run via build.ps1, or standalone for debugging.

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$srcPath = Join-Path $dataDir "gameData_265beta.json"

$ser = New-GameDataParser
$json = Get-Content $srcPath -Raw -Encoding UTF8
$data = $ser.DeserializeObject($json)

# --- abilities lookup (array indexed by id) ---
$abilitiesOut = New-Object System.Collections.ArrayList
foreach ($a in $data.abilities) {
    [void]$abilitiesOut.Add(@($a["name"], $a["desc"]))
}

# --- moves lookup (array indexed by id) ---
$movesOut = New-Object System.Collections.ArrayList
foreach ($m in $data.moves) {
    $types = @($m["types"])
    $t0 = if ($types.Count -gt 0) { $types[0] } else { 0 }
    [void]$movesOut.Add(@($m["name"], $t0, $m["split"], $m["pwr"], $m["acc"], $m["pp"], $m["desc"]))
}

# --- species ---
$speciesOut = New-Object System.Collections.ArrayList
for ($idx = 0; $idx -lt $data.species.Count; $idx++) {
    $s = $data.species[$idx]
    $name = $s["name"]
    if (-not $name -or $name -eq "??????????") {
        [void]$speciesOut.Add($null)
        continue
    }
    $st = $s["stats"]
    $base = @($st["base"])
    $types = @($st["types"])
    $abis = @(@($st["abis"]) | Where-Object { $_ -ne 0 })
    $inns = @(@($st["inns"]) | Where-Object { $_ -ne 0 })

    $evos = New-Object System.Collections.ArrayList
    foreach ($e in @($s["evolutions"])) {
        [void]$evos.Add(@($e["kd"], $e["rs"], $e["in"]))
    }

    $lm = New-Object System.Collections.ArrayList
    foreach ($mv in @($s["levelUpMoves"])) {
        if ($mv["id"] -ne 0) {
            [void]$lm.Add(@($mv["lv"], $mv["id"]))
        }
    }

    $tu = @(@($s["tutor"]) | Where-Object { $_ -ne 0 })
    $tm = @(@($s["TMHMMoves"]) | Where-Object { $_ -ne 0 })

    $dexInfo = $s["dex"]
    $desc = if ($dexInfo) { $dexInfo["desc"] } else { "" }
    $hw = if ($dexInfo -and $dexInfo["hw"]) { @($dexInfo["hw"]) } else { @() }
    $dexId = if ($dexInfo) { $dexInfo["id"] } else { 0 }

    $entry = [ordered]@{
        x = $idx
        i = $dexId
        n = $name
        sname = $s["NAME"]
        t = $types
        b = $base
        ab = $abis
        inn = $inns
        ev = $evos.ToArray()
        lm = $lm.ToArray()
        tu = $tu
        tm = $tm
        d = $desc
        hw = $hw
    }
    [void]$speciesOut.Add($entry)
}

$out = [ordered]@{
    meta = [ordered]@{
        source = "Elite Redux NextDex (https://forwardfeed.github.io/ER-nextdex/static/)"
        repo = "https://github.com/ForwardFeed/ER-nextdex"
        version = "2.65beta"
        generated = (Get-Date -Format "yyyy-MM-dd")
    }
    types = @($data.typeT)
    splits = @($data.splitT)
    evoKinds = @($data.evoKindT)
    abilities = $abilitiesOut.ToArray()
    moves = $movesOut.ToArray()
    species = $speciesOut.ToArray()
}

$outJson = ConvertTo-JsonManual $out
$outPath = Join-Path $dataDir "dex_compact.json"
[System.IO.File]::WriteAllText($outPath, $outJson, (New-Object System.Text.UTF8Encoding($false)))

Write-Output "transform.ps1: OK ($($speciesOut.Count) species, $($abilitiesOut.Count) abilities, $($movesOut.Count) moves) -> $outPath ($((Get-Item $outPath).Length) bytes)"
