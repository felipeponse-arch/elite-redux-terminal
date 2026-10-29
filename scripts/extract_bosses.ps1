# Generates data/bosses.json (boss trainers + their difficulty variants) from
# data/gameData.json. Run via build.ps1, or standalone for debugging.

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$srcPath = Join-Path $dataDir "gameData.json"

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

function ResolveAbilityId($sp, $abiIdx) {
    if (-not $sp -or -not $sp["stats"] -or -not $sp["stats"]["abis"]) { return -1 }
    $abisArr = @($sp["stats"]["abis"])
    if ($abiIdx -ge 0 -and $abiIdx -lt $abisArr.Count) { return [int]$abisArr[$abiIdx] }
    return -1
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
            # Raw 6-int arrays alongside the formatted "evs" string above -
            # the string is for display (existing boss card / showdown-style
            # exports), these are for the final-stat calculator (2026-09-09
            # field research + approved next step) to compute with, without
            # re-parsing a formatted string back into numbers. Real IVs, not
            # assumed 31s - the raw game data has them per trainer (flawless
            # in every sample checked so far, but extracted for real in case
            # some trainer isn't).
            evsRaw = @($mon["evs"])
            ivsRaw = @($mon["ivs"])
            mv = $moveNames
            # abiId (2026-10-02): o id da habilidade, não só o nome - "As One"
            # e "Embody Aspect" têm vários ids com o mesmo nome (cada um com um
            # efeito), e o nome resolvia sempre pro primeiro.
            abiId = ResolveAbilityId $sp $mon["abi"]
            # hpt: tipo do Hidden Power/Secret Power/Techno Blast deste
            # Pokémon (hpType do dado bruto); vazio quando não usa esses golpes.
            hpt = if (@(@($mon["moves"]) | Where-Object { $_ -ne 0 -and $data.moves[$_] -and $data.moves[$_]["usesHpType"] }).Count -gt 0) { $data.typeT[$mon["hpType"]] } else { "" }
        })
    }
    return $party.ToArray()
}

# Treinadores especiais (ticket 04, decisão do usuário em 07/10/2026): lutas opcionais que não são de
# classe de chefão - dão pedra Mega, ficam escondidas na Liga ou são revanches do Calvin. Entram pelo
# NOME (a classe deles é comum: Expert, Youngster, Lady...) e ficam FORA do rank (o rank só usa as
# lutas da run, calcular_rank_v2.mjs). "Steven Mossdeep" NÃO entra: é o parceiro do jogador na dupla
# de Mossdeep, não um adversário.
$treinadoresOpcionais = @(
    "Dragonitenite Sage 1", "Dragonitenite Sage 2", "Dragonitenite Sage 3",
    "Steven Granite Cave", "Steven Route118",
    "Calvin 1", "Calvin 2", "Calvin 3", "Calvin 4", "Calvin E4",
    "Mega Fidough", "Blunder",
    "Shedinjite Abandoned Ship", "Crobatite Dewford Manor", "Granbullite Route123", "Sinnoh Megas Mauville Game Corner"
)

$bosses = New-Object System.Collections.ArrayList
foreach ($t in $data.trainers) {
    $cid = [string]$t["tclass"]
    $opcional = $treinadoresOpcionais -contains $t["name"]
    if (-not $opcional -and -not $bossCategories.ContainsKey($cid)) { continue }
    [void]$bosses.Add([ordered]@{
        name = $t["name"]
        cat = if ($opcional) { "Treinador opcional" } else { $bossCategories[$cid] }
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
