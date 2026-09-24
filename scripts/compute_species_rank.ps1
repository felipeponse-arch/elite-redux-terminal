<#
Rank robusto por simulação (vigésima-quarta passagem, 2026-09-12) - reunião
completa da equipe pedida pelo usuário depois de feedback pesado ("algo no
rank não faz sentido"). A versão anterior deste script pesava só atributos
ESTÁTICOS da espécie (BST/uso-em-chefão/habilidade/velocidade), sem nunca
simular um confronto de verdade - exatamente o problema que a Especialista
em Meta Pokémon levantou depois de pesquisar (WebSearch) o método real da
PvPoke: em vez de somar atributos com pesos fixos, simular cada Pokémon
contra o CAMPO REAL de oponentes. A vantagem de Elite Redux sobre PvPoke/
Smogon: aqui o campo NÃO é hipotético - são os 107 chefões reais de
`data/bosses.json`, com movesets/habilidades/EVs extraídos direto do jogo.

Sinal PRINCIPAL (peso 0.70 do composto final): `bossDefenseScore` -
simula, pra cada espécie, o quão bem ela resistiria aos tipos de ataque
REAIS de cada chefão (todas as 3 dificuldades/tiers de cada um dos 107,
como "encontros" separados - 289 encontros reais no total, cada chefão
contando as vezes que tiver party/insane/hell populados). Usa só a
tipagem PRÓPRIA da espécie contra o TYPE_CHART puro (common.ps1,
Get-TypeMultiplier) - NÃO tenta simular habilidade (isso é por build/
contexto de time, não da espécie no vácuo - ver TYPE_MOD_ABILITIES em
artifact_template.html, que já cobre isso em tempo de execução) nem dano
ofensivo (dependeria de golpe/nature/EV escolhidos, que não existem pra
uma espécie ainda não montada). Limitação real, documentada aqui e na
memória do projeto: isto mede "sobrevive bem ao que vai enfrentar", não
"vence a luta" - metade da equação de combate, a metade que dá pra medir
sem inventar um golpeset que a espécie ainda não tem.

Sinal de DESEMPATE (peso 0.30 do composto final) - fórmula de pesos fixos
decidida pelo usuário depois de ver o material real que ele trouxe sobre
como Smogon/VGC calculam viabilidade (usage rate + 4 pilares: Base Stats/
Movepool/Ability/Type):
  - BST (0.50 do desempate) - absorveu o peso que "uso em chefões" tinha
    antes (pedido explícito do usuário: "trocar o peso do uso em chefões
    pelo BST"). Uso-em-chefão (frequência, não desempenho) SAIU do rank -
    o `bossDefenseScore` acima já mede desempenho de verdade contra os
    mesmos 107 chefões, então frequência de aparição virou redundante/
    pior sinal do que já temos.
  - Ability (0.25) - Score-AbilityText, sem mudança da versão anterior.
  - Movepool (0.15, NOVO) - cobertura real de tipo de ataque (golpe de
    nível/tutor, NÃO TM/HM - mesmo critério de species_role.json, pra não
    creditar golpe que a build por IA nem deixaria escolher), acesso a
    STAB real, hazard/tela/prioridade.
  - Tipagem (0.10, NOVO) - qualidade da tipagem própria: resistências
    menos fraquezas (defensivo) + quantos dos 18 tipos ela acerta STAB
    super efetivo (ofensivo). Mesmo TYPE_CHART do sinal principal.
  - Velocidade SAIU do peso fixo (era 0.25 antes) - o usuário pediu pra
    virar "contextual ao arquétipo do time" (Fase 3 do roadmap, arquétipo
    ainda não implementado nesta passagem) - até isso existir, velocidade
    simplesmente não entra no rank, documentado como lacuna conhecida e
    temporária, não escondida.

Composto final = percentil(bossDefenseScore)*0.70 + percentil(desempate)*0.30,
depois RE-percentil-ranqueado antes de virar tier - mesma correção já
aplicada desde a sexta passagem (uma média ponderada de percentis não é
ela mesma uniforme, senão o primeiro rank desta série toda deu ZERO SS).

Produz DOIS ranks por espécie, mesmo composto, populações diferentes:
  - tier/score: percentil contra TODAS as 1906 espécies.
  - stageTier/stageScore: percentil só contra outras espécies do MESMO
    estágio evolutivo (ver Get-Stage abaixo - inalterado desde a sétima
    passagem).

Output: data/species_rank.json, chaveado por sname, guardando o
detalhamento completo (não só as letras) pra UI mostrar o trabalho.

Rodar depois de transform.ps1, extract_bosses.ps1 e
expand_combo_abilities.ps1 (precisa de dex_compact.json, bosses.json e
ability_translations_pt.json presentes e atuais).

Ajuste de META (item 15 da auditoria de 2026-09-18, decisão do usuário
2026-09-19): a Especialista em Meta Pokémon (ver charter na memória do
projeto, project_elite_redux_team_roster.md) precisava de um lugar pra um
achado de meta virar efeito real no app - decidido "modificador no rank
score", sem nota explicativa separada na UI. `data/meta_rank_adjustments.json`
(sname -> lista de {delta, source, version, confidence}) é onde esses
achados entram; hoje está vazio (`{}`) porque nenhum achado real foi
produzido ainda - a regra não-negociável do charter ("nunca inventar,
nunca ter devaneios") vale aqui igual a qualquer outra saída dela, então
este script SÓ aplica ajuste quando o arquivo tiver uma entrada de verdade,
nunca fabrica uma. Cada delta é limitado a +-8 pontos percentuais (uma
mudança de tier inteira é ~15-25 pontos, então um achado sozinho nunca pula
mais de meio tier) e a soma por espécie a +-15; confidence só aceita "alta"
ou "media" - um achado de baixa confiança (fonte única não confirmada) não
vira número, fica de fora até confirmar, exatamente a regra 3 do charter
("sem fonte confiável, dizer isso, não preencher com um achado plausível").
#>

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser

$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))
$bosses = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "bosses.json") -Raw -Encoding UTF8))
$pt = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "ability_translations_pt.json") -Raw -Encoding UTF8))
$metaAdjRaw = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "meta_rank_adjustments.json") -Raw -Encoding UTF8))

# --- ajustes de meta (Especialista em Meta Pokémon) - validados alto contra
# o próprio charter, não só contra JSON valido: toda entrada precisa de
# fonte + versão do jogo (regra 1), confiança dentro do permitido (regra 2/3,
# "media"/"alta" só - achado fraco fica de fora, nunca vira número), e o
# sname citado precisa existir de verdade nesta versão do dex. ---
$snameSet = New-Object System.Collections.Generic.HashSet[string]
foreach ($s in $dex.species) { if ($s -and $s["sname"]) { [void]$snameSet.Add($s["sname"]) } }
$VALID_META_CONFIDENCE = @("alta", "media")
$MAX_META_DELTA_PER_ENTRY = 8.0
$MAX_META_DELTA_TOTAL = 15.0
$metaDeltaBySname = @{}
foreach ($sname in $metaAdjRaw.Keys) {
    if (-not $snameSet.Contains($sname)) {
        throw "meta_rank_adjustments.json: cita $sname, que nao existe em dex_compact.json"
    }
    $total = 0.0
    foreach ($e in @($metaAdjRaw[$sname])) {
        if ($null -eq $e["delta"]) { throw "meta_rank_adjustments.json: entrada de $sname sem campo 'delta'" }
        $d = [double]$e["delta"]
        if ([math]::Abs($d) -gt $MAX_META_DELTA_PER_ENTRY) {
            throw "meta_rank_adjustments.json: delta de $sname ($d) excede o limite de +-$MAX_META_DELTA_PER_ENTRY pontos percentuais por achado"
        }
        if (-not $e["source"]) { throw "meta_rank_adjustments.json: entrada de $sname sem campo 'source' (charter do Especialista em Meta: toda alegacao carrega a fonte)" }
        if (-not $e["version"]) { throw "meta_rank_adjustments.json: entrada de $sname sem campo 'version' (charter: toda alegacao carrega a versao do jogo em que foi confirmada)" }
        if ($VALID_META_CONFIDENCE -notcontains $e["confidence"]) {
            throw "meta_rank_adjustments.json: entrada de $sname tem 'confidence' invalido ('$($e["confidence"])') - so 'alta' ou 'media' (achado de baixa confianca nao vira numero, fica pendente)"
        }
        $total += $d
    }
    if ([math]::Abs($total) -gt $MAX_META_DELTA_TOTAL) {
        throw "meta_rank_adjustments.json: soma dos ajustes de $sname ($total) excede o limite de +-$MAX_META_DELTA_TOTAL pontos percentuais"
    }
    if ($total -ne 0) { $metaDeltaBySname[$sname] = $total }
}
Write-Output "compute_species_rank.ps1: $($metaDeltaBySname.Keys.Count) especie(s) com ajuste de meta aplicado"

# Order guard (architecture review, 2026-09-09): this script must run AFTER
# expand_combo_abilities.ps1, because Score-AbilityText reads the EXPANDED
# text - a raw "A + B" combo description matches none of its patterns and
# silently scores 0. Nothing enforced that ordering except a comment in
# build.ps1, so a reordering mistake would miscore all 151 combo abilities
# quietly. Detect it the same way expand_combo_abilities.ps1 detects a combo
# (name matches "X + Y" against known ability names) and fail loud if the
# translated text hasn't actually been expanded (no "`n- " marker).
$byName = @{}
for ($i = 0; $i -lt $dex.abilities.Count; $i++) {
    $n = $dex.abilities[$i][0]
    if ($n -and -not $byName.ContainsKey($n)) { $byName[$n] = $i }
}
$unexpanded = New-Object System.Collections.ArrayList
for ($i = 0; $i -lt $dex.abilities.Count; $i++) {
    $rawDesc = $dex.abilities[$i][1]
    if (-not $rawDesc -or $rawDesc -notmatch '\+') { continue }
    $parts = ($rawDesc.TrimEnd('.').Trim()) -split '\s*\+\s*'
    if ($parts.Count -lt 2) { continue }
    $isCombo = $true
    foreach ($p in $parts) { if (-not $byName.ContainsKey($p.Trim())) { $isCombo = $false; break } }
    if (-not $isCombo) { continue }
    $translated = $pt["$i"]
    if (-not $translated -or $translated -notmatch "`n-") { [void]$unexpanded.Add($dex.abilities[$i][0]) }
}
if ($unexpanded.Count -gt 0) {
    throw "compute_species_rank.ps1: $($unexpanded.Count) combo abilities are not expanded in ability_translations_pt.json ($($unexpanded -join ', ')) - run expand_combo_abilities.ps1 before this script (build.ps1 already orders this correctly; if you're running compute_species_rank.ps1 standalone, run expand_combo_abilities.ps1 first)."
}

$abilityScoreCache = @{}
function Get-AbilityScore([int]$id) {
    $key = [string]$id
    if (-not $abilityScoreCache.ContainsKey($key)) {
        $abilityScoreCache[$key] = Score-AbilityText $pt[$key]
    }
    return $abilityScoreCache[$key]
}

# --- move lookup: nome -> {typeName, splitName, prio} - bosses.json guarda
# golpe por NOME (já resolvido por extract_bosses.ps1), então basta indexar
# dex.moves (que guarda [nome, tipoIdx, splitIdx, pwr, acc, pp, desc, prio,
# flags]) por nome uma vez. ---
$moveInfoByName = @{}
foreach ($m in $dex.moves) {
    $n = $m[0]
    if ($n -and -not $moveInfoByName.ContainsKey($n)) {
        $moveInfoByName[$n] = @{ type = $dex.types[$m[1]]; split = $dex.splits[$m[2]]; prio = $m[7] }
    }
}
$HAZARD_MOVES = @{ "Stealth Rock" = $true; "Spikes" = $true; "Toxic Spikes" = $true; "Sticky Web" = $true }
$SCREEN_MOVES = @{ "Reflect" = $true; "Light Screen" = $true; "Aurora Veil" = $true }

# --- bossDefenseScore: simula cada espécie contra os tipos de ataque REAIS
# de cada "encontro" (chefão x tier). Um encontro = os tipos de ataque não-
# Status distintos entre os golpes reais do time daquele tier - mesma lógica
# de computeBossAttackTypes() em artifact_template.html, portada aqui pro
# pipeline porque agora vira o SINAL PRINCIPAL do rank (precisa estar
# pré-calculado, não recalculado a cada troca de time). ---
$encounterAttackTypes = New-Object System.Collections.ArrayList
foreach ($b in $bosses) {
    foreach ($tier in "party", "insane", "hell") {
        $party = @($b[$tier])
        if (-not $party -or $party.Count -eq 0) { continue }
        $types = @{}
        foreach ($mon in $party) {
            foreach ($moveName in @($mon["mv"])) {
                if (-not $moveName -or -not $moveInfoByName.ContainsKey($moveName)) { continue }
                $info = $moveInfoByName[$moveName]
                if ($info.split -eq "Status") { continue }
                $types[$info.type] = $true
            }
        }
        if ($types.Keys.Count -gt 0) { [void]$encounterAttackTypes.Add(@($types.Keys)) }
    }
}
Write-Output "compute_species_rank.ps1: $($encounterAttackTypes.Count) encontros reais (chefao x tier) pra simular defesa"

function Get-BossDefenseScore($alwaysActiveIds, [string[]]$ownTypes) {
    if ($encounterAttackTypes.Count -eq 0) { return 0 }
    # Achado real na primeira rodada desta passagem (2026-09-12): usar só a
    # tipagem CRUA aqui derrubava Probopass (SS estabelecido em várias
    # passagens anteriores) pra C, porque a tipagem crua Rock/Steel é FRACA
    # 4x a Ground - a defesa real dele vem inteira da Levitate (habilidade),
    # não da tipagem em si. Get-AbilityAdjustedTypeMultiplier (mesma tabela
    # TYPE_MOD_ABILITIES que o app já usa em tempo de execução) corrige isso.
    $total = 0.0
    foreach ($atkTypes in $encounterAttackTypes) {
        $sumMult = 0.0
        foreach ($t in $atkTypes) { $sumMult += (Get-AbilityAdjustedTypeMultiplier $t $ownTypes $alwaysActiveIds) }
        $avgMult = $sumMult / $atkTypes.Count
        # Multiplicador BAIXO (resiste/imune) é bom pra defesa - negativo aqui
        # pra "maior é melhor" bater com o resto do pipeline (Get-PercentileRanks
        # não assume direção, só ordena; a inversão é o que faz "sobrevive bem"
        # virar percentil alto em vez de baixo).
        $total += (-$avgMult)
    }
    return $total / $encounterAttackTypes.Count
}

# --- movepoolScore: cobertura real de golpe de ataque (nível + tutor, NÃO
# TM/HM - mesmo critério de compute_species_role.ps1, pra não creditar golpe
# que a build por IA nem deixaria a espécie escolher), STAB real, e acesso a
# hazard/tela/prioridade. ---
function Get-MovepoolScore($s, [string[]]$ownTypes) {
    $realMoveNames = New-Object System.Collections.Generic.HashSet[string]
    foreach ($mv in @($s["lm"])) {
        $mid = $mv[1]
        if ($mid -and $dex.moves[$mid]) { [void]$realMoveNames.Add($dex.moves[$mid][0]) }
    }
    foreach ($id in @($s["tu"])) {
        if ($id -and $dex.moves[$id]) { [void]$realMoveNames.Add($dex.moves[$id][0]) }
    }
    $atkTypesCovered = @{}
    $hasStab = $false
    $hasHazard = $false
    $hasScreen = $false
    $hasPriority = $false
    foreach ($name in $realMoveNames) {
        if (-not $moveInfoByName.ContainsKey($name)) { continue }
        $info = $moveInfoByName[$name]
        if ($info.split -ne "Status") {
            $atkTypesCovered[$info.type] = $true
            if ($ownTypes -contains $info.type) { $hasStab = $true }
        }
        if ($HAZARD_MOVES.ContainsKey($name)) { $hasHazard = $true }
        if ($SCREEN_MOVES.ContainsKey($name)) { $hasScreen = $true }
        if ($info.prio -and [int]$info.prio -gt 0) { $hasPriority = $true }
    }
    $score = $atkTypesCovered.Keys.Count
    if ($hasStab) { $score += 2 }
    if ($hasHazard) { $score += 1 }
    if ($hasScreen) { $score += 1 }
    if ($hasPriority) { $score += 1 }
    return $score
}

# --- typeScore: qualidade da tipagem própria - defensivo (resistências +
# imunidades - fraquezas contra os 18 tipos reais) + ofensivo (quantos
# desses 18 a própria tipagem acerta STAB super efetivo, >=2x). ---
$ALL_REAL_TYPES = @($dex.types | Where-Object { $_ -and $_ -ne "Mystery" -and $_ -ne "None" -and $_ -ne "Stellar" })
function Get-TypeScore($alwaysActiveIds, [string[]]$ownTypes) {
    # Mesmo ajuste por habilidade do Get-BossDefenseScore acima (ver o
    # comentário lá) - "qualidade da tipagem" tem que enxergar a mesma
    # Levitate/Solid Rock/etc que já conta na defesa simulada, senão os
    # dois pilares se contradizem (um diz "tipagem ruim", outro "defende
    # bem") sobre a MESMA espécie.
    $defScore = 0
    foreach ($atk in $ALL_REAL_TYPES) {
        $m = Get-AbilityAdjustedTypeMultiplier $atk $ownTypes $alwaysActiveIds
        if ($m -eq 0) { $defScore += 2 }
        elseif ($m -lt 1) { $defScore += 1 }
        elseif ($m -gt 1) { $defScore -= 1 }
    }
    $offScore = 0
    foreach ($own in $ownTypes) {
        foreach ($def in $ALL_REAL_TYPES) {
            if ((Get-TypeMultiplier $own @($def)) -ge 2) { $offScore += 1 }
        }
    }
    # Tipo duplo compartilha o mesmo golpe ofensivo (Fire/Flying só precisa de
    # 1 STAB de cada, não 2x a cobertura) - conta tipos ofensivos distintos
    # que pelo menos UM dos tipos próprios acerta forte, não a soma dupla.
    $offTypesHit = @{}
    foreach ($own in $ownTypes) {
        foreach ($def in $ALL_REAL_TYPES) {
            if ((Get-TypeMultiplier $own @($def)) -ge 2) { $offTypesHit[$def] = $true }
        }
    }
    return $defScore + $offTypesHit.Keys.Count
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
    $ownTypes = @(@($s["t"]) | ForEach-Object { $dex.types[$_] } | Select-Object -Unique)

    $innIds = @($s["inn"]) | Where-Object { $_ -and $_ -ne 0 } | Select-Object -Unique
    $innScore = 0
    foreach ($id in $innIds) { $innScore += (Get-AbilityScore $id) }
    $abIds = @($s["ab"]) | Where-Object { $_ -and $_ -ne 0 } | Select-Object -Unique
    $abBest = 0
    foreach ($id in $abIds) { $sc = Get-AbilityScore $id; if ($sc -gt $abBest) { $abBest = $sc } }
    $abilityScore = $innScore + $abBest

    $alwaysActiveIds = Get-AlwaysActiveAbilityIds $s
    $bossDefense = Get-BossDefenseScore $alwaysActiveIds $ownTypes
    $movepoolScore = Get-MovepoolScore $s $ownTypes
    $typeScore = Get-TypeScore $alwaysActiveIds $ownTypes

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
        sname = $s["sname"]; bst = $bst; abilityScore = $abilityScore
        bossDefense = $bossDefense; movepoolScore = $movepoolScore; typeScore = $typeScore
        stage = $stage; hasEvolutionLine = $hasEvolutionLine; ownTypes = $ownTypes
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

# Pesos do DESEMPATE (não o sinal principal - ver bossDefense abaixo).
# BST absorveu o peso que "uso em chefão" tinha (pedido do usuário,
# 2026-09-12: "trocar o peso do uso em chefões pelo BST"). Movepool/Tipagem
# são novos - decisão do usuário depois do material real que trouxe sobre os
# 4 pilares (Base Stats/Movepool/Ability/Type) usados por Smogon/VGC.
$TIEBREAK_WEIGHTS = @{ bst = 0.50; ability = 0.25; movepool = 0.15; type = 0.10 }
# Peso do sinal PRINCIPAL (simulação) vs o desempate, no composto final.
$PRIMARY_WEIGHT = 0.70

function Get-Tier([double]$pct) {
    if ($pct -ge 97) { return "SS" }
    if ($pct -ge 90) { return "S" }
    if ($pct -ge 75) { return "A" }
    if ($pct -ge 50) { return "B" }
    if ($pct -ge 20) { return "C" }
    return "D"
}

# Computes tier+score+os percentis de cada sinal para UMA população (todas as
# espécies pro rank global, ou as de um estágio só pro rank por estágio).
# Percentile-ranks the composite ITSELF before bucketing (not the raw
# weighted average) - a weighted average of percentiles is not itself
# uniformly distributed (species rarely top every signal at once, so raw
# composites regress toward the middle); medido desde a sexta passagem
# (primeira versão deste script deu ZERO SS por aplicar os cortes direto no
# composto cru). Corrigido percentile-rankeando o composto antes de balde-ar,
# reaplicado aqui pro composto de dois níveis (principal + desempate).
function Compute-Tiers($subsetRows) {
    $bstRanks = Get-PercentileRanks ($subsetRows | ForEach-Object { $_.bst })
    $abilityRanks = Get-PercentileRanks ($subsetRows | ForEach-Object { $_.abilityScore })
    $movepoolRanks = Get-PercentileRanks ($subsetRows | ForEach-Object { $_.movepoolScore })
    $typeRanks = Get-PercentileRanks ($subsetRows | ForEach-Object { $_.typeScore })
    $bossDefRanks = Get-PercentileRanks ($subsetRows | ForEach-Object { $_.bossDefense })

    $composites = @{}
    foreach ($r in $subsetRows) {
        $bstPct = $bstRanks[[string]$r.bst]
        $abilityPct = $abilityRanks[[string]$r.abilityScore]
        $movepoolPct = $movepoolRanks[[string]$r.movepoolScore]
        $typePct = $typeRanks[[string]$r.typeScore]
        $bossDefPct = $bossDefRanks[[string]$r.bossDefense]
        $tiebreak = $bstPct * $TIEBREAK_WEIGHTS.bst + $abilityPct * $TIEBREAK_WEIGHTS.ability + $movepoolPct * $TIEBREAK_WEIGHTS.movepool + $typePct * $TIEBREAK_WEIGHTS.type
        $composites[$r.sname] = @{
            composite = $bossDefPct * $PRIMARY_WEIGHT + $tiebreak * (1 - $PRIMARY_WEIGHT)
            bstPct = $bstPct; abilityPct = $abilityPct; movepoolPct = $movepoolPct; typePct = $typePct; bossDefPct = $bossDefPct
        }
    }
    $compositeRanks = Get-PercentileRanks ($composites.Values | ForEach-Object { $_.composite })

    $result = @{}
    foreach ($r in $subsetRows) {
        $c = $composites[$r.sname]
        $basePct = $compositeRanks[[string]$c.composite]
        $metaDelta = if ($metaDeltaBySname.ContainsKey($r.sname)) { $metaDeltaBySname[$r.sname] } else { 0.0 }
        # Ajuste de meta aplicado DEPOIS do percentile-rank do composto, não
        # antes - ele representa um achado sobre a espécie em si (não um
        # sinal a mais pra recalcular a distribuição da população toda).
        # Clampado em [0,100] pra não estourar a escala de score/tier.
        $finalPct = [math]::Max(0, [math]::Min(100, $basePct + $metaDelta))
        $result[$r.sname] = @{
            tier = Get-Tier $finalPct
            score = [math]::Round($finalPct, 1)
            metaAdjustment = $metaDelta
            bstPct = $c.bstPct; abilityPct = $c.abilityPct; movepoolPct = $c.movepoolPct; typePct = $c.typePct; bossDefPct = $c.bossDefPct
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

# Rank relativo por TIPO (item 15b da pesquisa de 2026-09-21, achado real na
# pesquisa Smogon Monotype: "Pokemon are ranked separately for each type" -
# Toedscruel e bom pra time de Grass mas so mediano pra time de Ground, e o
# formato Monotype do Smogon ranqueia cada especie separadamente por tipo por
# causa disso). Mesma ideia do rank por estagio acima (nao comparar um basico
# contra um lendario so porque os dois "existem", ver comentario de $megaKindIdx),
# so que o agrupamento e por MEMBRO do tipo (Same Type Clause: um Pokemon dual-
# type serve pra QUALQUER time cujo tipo ele tenha, nao so um) em vez de por
# estagio - por isso, ao contrario de $byStage, uma especie de tipo duplo entra
# em ATE DOIS grupos aqui, um por tipo, cada um com seu proprio percentil.
$byType = @{}
foreach ($r in $rows) {
    foreach ($t in $r.ownTypes) {
        if (-not $byType.ContainsKey($t)) { $byType[$t] = New-Object System.Collections.ArrayList }
        [void]$byType[$t].Add($r)
    }
}
# monoResults[sname] = @{ TypeName = @{tier=...; score=...}; ... } - uma
# entrada por tipo que a especie realmente tem, nunca os 18 tipos pra todo
# mundo (economiza espaco e deixa claro que so os tipos reais da especie
# geram rank Monotype).
$monoResults = @{}
foreach ($t in $byType.Keys) {
    $tiers = Compute-Tiers $byType[$t]
    foreach ($sname in $tiers.Keys) {
        if (-not $monoResults.ContainsKey($sname)) { $monoResults[$sname] = [ordered]@{} }
        $monoResults[$sname][$t] = @{ tier = $tiers[$sname].tier; score = $tiers[$sname].score }
    }
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
        abilityScore = $r.abilityScore; abilityPct = $g.abilityPct
        movepoolScore = $r.movepoolScore; movepoolPct = $g.movepoolPct
        typeScore = $r.typeScore; typePct = $g.typePct
        bossDefense = [math]::Round($r.bossDefense, 3); bossDefPct = $g.bossDefPct
        metaAdjustment = $g.metaAdjustment
        monoRanks = if ($monoResults.ContainsKey($r.sname)) { $monoResults[$r.sname] } else { [ordered]@{} }
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
Write-Output "-- rank Monotype (especies por tipo, dual-type conta nos dois) --"
foreach ($t in ($byType.Keys | Sort-Object)) { Write-Output ("  ${t}: $($byType[$t].Count)") }
