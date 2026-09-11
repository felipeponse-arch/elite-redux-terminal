# Generates data/dex_compact.json from data/gameData_265beta.json (the raw
# Elite Redux NextDex export). Run via build.ps1, or standalone for debugging.

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$srcPath = Join-Path $dataDir "gameData_265beta.json"

$ser = New-GameDataParser
$json = Get-Content $srcPath -Raw -Encoding UTF8
$data = $ser.DeserializeObject($json)

# --- mapas de encontro selvagem por especie (locations.maps), 2026-09-11 ---
# Achado na varredura completa do jogo (2026-09-11): $data.locations.maps
# (176 mapas com dado de encontro selvagem real) nunca tinha sido puxado pro
# pipeline - "onde encontrar" na Dex so cobria SEnc (encontros roteirizados:
# iniciais, lendarios, presentes de NPC), nunca captura selvagem comum.
# Cada mapa tem ate 6 metodos (land/water/fish/rock/hidden/honey), cada um
# uma lista de [nivelMin, nivelMax, especieIdx]. Aqui so guarda MAPA (nao
# metodo nem faixa de nivel - "onde", nao "como exatamente") por especie,
# dedup - o mesmo padrao de simplicidade ja usado pro SEnc (howToObtainText).
$wildMapsBySpecies = @{}
$wildMethods = @("land", "water", "fish", "rock", "hidden", "honey")
foreach ($lm in @($data.locations.maps)) {
    if (-not $lm) { continue }
    $mapId = $lm["id"]
    if ($mapId -eq $null) { continue }
    foreach ($method in $wildMethods) {
        if (-not $lm.ContainsKey($method)) { continue }
        foreach ($e in @($lm[$method])) {
            if (-not $e -or @($e).Count -lt 3) { continue }
            $spIdx = [int]$e[2]
            if (-not $wildMapsBySpecies.ContainsKey($spIdx)) { $wildMapsBySpecies[$spIdx] = New-Object System.Collections.ArrayList }
            if (-not $wildMapsBySpecies[$spIdx].Contains($mapId)) { [void]$wildMapsBySpecies[$spIdx].Add($mapId) }
        }
    }
}

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
    # prio (índice 7, acrescentado no fim de propósito, 2026-09-11): campo real
    # do jogo, não estava extraído até agora. Verificado contra golpes
    # conhecidos antes de confiar - Protect=+4, Counter/Mirror Coat=-5, Trick
    # Room=-7, Teleport=-6 batem exatos com o Pokémon real, então o campo é
    # confiável. Achado ao verificar: Quick Attack tem prio=2 NESTE hack (igual
    # Extreme Speed) - na série oficial Quick Attack é só +1, então é uma
    # mudança real do Elite Redux, não erro de leitura.
    #
    # flags (índice 8, 2026-09-11): categorias reais do golpe (Faz Contato,
    # Baseado em Som, Baseado em Chifre, etc. - ver $data.flagsT, 18 no
    # total), pré-requisito pra cruzar habilidades que aumentam o poder de
    # uma categoria específica (ex: Mighty Horn = chifre/broca) com o
    # movepool real de cada espécie - hoje essas habilidades pontuam ZERO no
    # rubric de habilidade (Score-AbilityText) porque nada nunca cruzou os
    # dois lados. Array de ids (índices em flagsT), igual `types`/`ab`/`inn`.
    [void]$movesOut.Add(@($m["name"], $t0, $m["split"], $m["pwr"], $m["acc"], $m["pp"], $m["desc"], $m["prio"], @($m["flags"])))
}

# --- items lookup: flat, sorted list of real item names (no ids needed -
# a custom build just stores the chosen name as a string, same as
# bosses.json/builds.json already do). Placeholder entries filtered out.
$itemsOut = @($data.items | ForEach-Object { $_["name"] } | Where-Object { $_ -and $_ -ne "????????" } | Sort-Object -Unique)

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

    # SEnc ("scripted encounter") - 2026-09-11, achado na varredura completa
    # do jogo: como conseguir esta espécie fora de captura selvagem comum
    # (iniciais, lendários, fósseis, presentes de NPC, recompensas
    # exclusivas do hack). Campo nunca extraído até agora. `how` é índice em
    # scriptedEncoutersHowT (0=scripted wild, 1=scripted not wild, 2=given
    # with custom moves, 3=given), `map` é índice em mapsT (569 mapas reais,
    # também nunca extraído até agora). Dedup por par (how,map) EXATO -
    # várias entradas idênticas existem no dado bruto (ex: Deoxys repete o
    # mesmo par 3x, provavelmente por múltiplos gatilhos de jogo que levam
    # ao mesmo fato prático) - sem isso a Dex mostraria a mesma frase
    # repetida.
    $sencSeen = @{}
    $senc = New-Object System.Collections.ArrayList
    foreach ($e in @($s["SEnc"])) {
        if (-not $e) { continue }
        $how = $e["how"]; $map = $e["map"]
        if ($how -eq $null -or $map -eq $null) { continue }
        $key = "$how|$map"
        if ($sencSeen.ContainsKey($key)) { continue }
        $sencSeen[$key] = $true
        [void]$senc.Add(@($how, $map))
    }

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
        senc = $senc.ToArray()
        wenc = if ($wildMapsBySpecies.ContainsKey($idx)) { $wildMapsBySpecies[$idx].ToArray() } else { @() }
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
    flags = @($data.flagsT)
    sencHow = @($data.scriptedEncoutersHowT)
    maps = @($data.mapsT)
    abilities = $abilitiesOut.ToArray()
    moves = $movesOut.ToArray()
    items = $itemsOut
    species = $speciesOut.ToArray()
}

$outJson = ConvertTo-JsonManual $out
$outPath = Join-Path $dataDir "dex_compact.json"
[System.IO.File]::WriteAllText($outPath, $outJson, (New-Object System.Text.UTF8Encoding($false)))

Write-Output "transform.ps1: OK ($($speciesOut.Count) species, $($abilitiesOut.Count) abilities, $($movesOut.Count) moves) -> $outPath ($((Get-Item $outPath).Length) bytes)"
