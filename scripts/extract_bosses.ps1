# Generates data/bosses.json (boss trainers + their difficulty variants) from
# data/gameData_265beta.json. Run via build.ps1, or standalone for debugging.

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$srcPath = Join-Path $dataDir "gameData_265beta.json"

$ser = New-GameDataParser
$json = Get-Content $srcPath -Raw -Encoding UTF8
$data = $ser.DeserializeObject($json)

# Trainer class ids -> display category. String keys because OrderedDictionary's
# and Hashtable's [int] indexer can resolve positionally instead of by key.
$bossCategories = @{
    "34" = "Lider de Ginasio"
    "33" = "Alto Comando"
    "38" = "Campeao"
    "11" = "Equipe Aqua"
    "9"  = "Equipe Aqua (Admin)"
    "57" = "Equipe Magma"
    "16" = "Equipe Magma (Admin)"
    "62" = "Superchefao (Monotype)"
    "49" = "Superchefao"
    "46" = "Superchefao"
    "26" = "Frontier Brain"
}

function ResolveAbility($sp, $abiIdx) {
    if (-not $sp -or -not $sp["stats"] -or -not $sp["stats"]["abis"]) { return "" }
    $abisArr = @($sp["stats"]["abis"])
    if ($abiIdx -ge 0 -and $abiIdx -lt $abisArr.Count) {
        $aid = $abisArr[$abiIdx]
        if ($data.abilities[$aid]) { return $data.abilities[$aid]["name"] }
    }
    return ""
}

function ResolveParty($rawParty) {
    $party = New-Object System.Collections.ArrayList
    foreach ($mon in @($rawParty)) {
        $spIdx = $mon["spc"]
        $sp = $data.species[$spIdx]
        $abiName = ResolveAbility $sp $mon["abi"]
        $itemName = if ($mon["item"] -and $data.items[$mon["item"]]) { $data.items[$mon["item"]]["name"] } else { "" }
        $natName = if ($data.natureT[$mon["nature"]]) { $data.natureT[$mon["nature"]] } else { "" }
        $moveNames = @(@($mon["moves"]) | Where-Object { $_ -ne 0 } | ForEach-Object { if ($data.moves[$_]) { $data.moves[$_]["name"] } })
        [void]$party.Add([ordered]@{
            x = $spIdx
            n = if ($sp) { $sp["name"] } else { "?" }
            abi = $abiName
            item = $itemName
            nat = $natName
            evs = Format-Evs $mon["evs"]
            mv = $moveNames
        })
    }
    return $party.ToArray()
}

$bosses = New-Object System.Collections.ArrayList
foreach ($t in $data.trainers) {
    $cid = [string]$t["tclass"]
    if (-not $bossCategories.ContainsKey($cid)) { continue }
    [void]$bosses.Add([ordered]@{
        name = $t["name"]
        cat = $bossCategories[$cid]
        db = [bool]$t["db"]
        party = ResolveParty $t["party"]
        insane = ResolveParty $t["insane"]
        hell = ResolveParty $t["hell"]
    })
}

$outJson = ConvertTo-JsonManual $bosses.ToArray()
$outPath = Join-Path $dataDir "bosses.json"
[System.IO.File]::WriteAllText($outPath, $outJson, (New-Object System.Text.UTF8Encoding($false)))

Write-Output "extract_bosses.ps1: OK ($($bosses.Count) bosses) -> $outPath ($((Get-Item $outPath).Length) bytes)"
