# Shared helpers for the Elite Redux Terminal data pipeline.
# Dot-source this from other scripts: . (Join-Path $PSScriptRoot "common.ps1")

Add-Type -AssemblyName System.Web.Extensions

function New-GameDataParser {
    $ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
    $ser.MaxJsonLength = 200000000
    return $ser
}

# Manual JSON writer - JavaScriptSerializer.Serialize() throws a circular-reference
# error on values that came out of DeserializeObject(), so we write JSON by hand.
function Write-JsonString([System.Text.StringBuilder]$sb, [string]$s) {
    [void]$sb.Append('"')
    if ($s) {
        foreach ($ch in $s.ToCharArray()) {
            switch ($ch) {
                '"' { [void]$sb.Append('\"'); break }
                '\' { [void]$sb.Append('\\'); break }
                "`n" { [void]$sb.Append('\n'); break }
                "`r" { [void]$sb.Append('\r'); break }
                "`t" { [void]$sb.Append('\t'); break }
                default {
                    if ([int]$ch -lt 0x20) { [void]$sb.Append([string]::Format('\u{0:x4}', [int]$ch)) }
                    else { [void]$sb.Append($ch) }
                }
            }
        }
    }
    [void]$sb.Append('"')
}

function Write-JsonValue([System.Text.StringBuilder]$sb, $val) {
    if ($null -eq $val) { [void]$sb.Append('null'); return }
    if ($val -is [bool]) { [void]$sb.Append($(if ($val) { 'true' } else { 'false' })); return }
    if ($val -is [string]) { Write-JsonString $sb $val; return }
    if ($val -is [int] -or $val -is [long] -or $val -is [double] -or $val -is [float] -or $val -is [decimal]) {
        [void]$sb.Append([System.Convert]::ToString($val, [System.Globalization.CultureInfo]::InvariantCulture))
        return
    }
    if ($val -is [System.Collections.IDictionary]) {
        [void]$sb.Append('{')
        $first = $true
        foreach ($key in $val.Keys) {
            if (-not $first) { [void]$sb.Append(',') }
            $first = $false
            Write-JsonString $sb ([string]$key)
            [void]$sb.Append(':')
            Write-JsonValue $sb $val[$key]
        }
        [void]$sb.Append('}')
        return
    }
    if ($val -is [System.Collections.IEnumerable]) {
        [void]$sb.Append('[')
        $first = $true
        foreach ($item in $val) {
            if (-not $first) { [void]$sb.Append(',') }
            $first = $false
            Write-JsonValue $sb $item
        }
        [void]$sb.Append(']')
        return
    }
    Write-JsonString $sb ([string]$val)
}

function ConvertTo-JsonManual($val) {
    $sb = New-Object System.Text.StringBuilder
    Write-JsonValue $sb $val
    return $sb.ToString()
}

# Raw EVs are stored as a 6-int array [HP,Atk,Def,SpA,SpD,Spe] (same order as
# dex_compact.json species "b" base-stat arrays). Format as the same Showdown
# EV string style already used by hand in data/builds.json, e.g.
# "252 HP / 252 SpD / 4 Def" - zero values dropped, HP/Atk/Def/SpA/SpD/Spe order.
# Scores one ability's translated Portuguese description (from
# data/ability_translations_pt.json) 0-3 for PERSONAL combat impact - the
# survivability/damage relevance to the one Pokemon that has it, not
# team-wide utility like weather-setting (out of scope: the regex patterns
# below can't reliably judge that, so it's left neutral rather than guessed).
# This is the ability dimension of scripts/compute_species_rank.ps1 - it
# exists as a shared function (not copy-pasted) so scripts/score_abilities.ps1
# (the calibration/research tool) and the real computation always agree.
# Calibrated 2026-09-08 against all 1033 translated abilities - see
# score_abilities.ps1's distribution/sample output before changing these
# rules, a bug here silently reweights every species' rank.
function Score-AbilityText([string]$desc) {
    if (-not $desc) { return 0 }
    $d = $desc

    # A "NAO dobra X" clause is a disambiguation note (the style guide adds it
    # after a flat damage-halving ability, to clarify it's NOT ALSO a Fur-Coat
    # -style stat-doubling effect) - strip it before any "Dobra" check below,
    # otherwise the negation reads as a false positive for "doubles a stat".
    $dobraPositive = $d -replace '[Nn][ãa]o dobra[^.]*\.?', ''

    # Tier 3: full type immunity combined with a beneficial secondary effect
    # (heals HP, boosts a stat by >=1.2x, or a "no damage instead" clause), or
    # a Sturdy-like "cannot be OHKO'd" guarantee.
    if ($d -match 'Imune a (golpes d[oe] tipo|ataques d[oe] tipo)') {
        if ($d -match 'Cura \d+% do HP|Aumenta.*em \d+(\.\d+)?x|usa \w+ se atingido|maximiza a Velocidade') { return 3 }
    }
    if ($d -match 'N[ãa]o recebe dano.*se atingido por um golpe d[oe] tipo') { return 3 }
    if ($d -match 'n[ãa]o pode ser nocauteado em um golpe s[óo]') { return 3 }

    # Tier 2: solid unconditional mechanical advantage.
    if ($d -match 'Imune a (golpes d[oe] tipo|ataques d[oe] tipo)') { return 2 }
    if ($d -match 'Recebe (3[0-9]|[4-9][0-9]|100)% menos dano de golpes super efetivos') { return 2 }
    # Whole-category damage halving (all physical OR all special hits) is
    # broad enough to matter against roughly half of all possible attackers -
    # distinct from (and stronger than) halving just ONE type, see tier 1.
    if ($d -match 'Reduz pela metade o dano recebido de golpes (f[íi]sicos|especiais)') { return 2 }
    if ($d -match 'Cura \d\d+% do HP m[áa]ximo (ao|no fim)') { return 2 }
    if ($d -match 'Aumenta (a pr[óo]pria|o pr[óo]prio|os pr[óo]prios golpes).*em [1-9]\.[3-9]x') { return 2 }
    if ($d -match 'Aumenta.*em [2-9] est[áa]gios?') { return 2 }
    if ($dobraPositive -match 'Dobra ') { return 2 }

    # Tier 1: minor/situational bonus - single status immunity, small flat
    # bonus, small stage change, small/conditional healing, single-TYPE
    # (not whole-category) damage halving.
    if ($d -match 'Imune a (paralisia|envenenamento|queimadura|sono|confus[ãa]o|congelamento|atra[çc][ãa]o)') { return 1 }
    if ($d -match 'N[ãa]o pode ser (envenenado|paralisado|queimado|confuso|adormecido|congelado)') { return 1 }
    if ($d -match 'Recebe \d+% menos dano') { return 1 }
    if ($d -match 'Reduz pela metade o dano recebido') { return 1 }
    if ($d -match 'Aumenta.*em 1 est[áa]gio') { return 1 }
    if ($d -match 'Cura \d+% do HP') { return 1 }
    if ($d -match 'Aumenta.*em 1\.[1-2]x') { return 1 }
    # Achado real, 2026-09-11 (varredura completa do jogo): habilidades como
    # Mighty Horn ("Aumenta o poder de golpes de chifre e broca em 1.3x.")
    # pontuavam ZERO até agora - o padrão de tier 2 acima só reconhece "o
    # próprio/os próprios golpes" (bônus incondicional a TODOS os golpes),
    # não "golpes de uma categoria específica" (chifre/martelo/chute/asa/
    # arremesso etc. - ver data flagsT, 18 categorias reais). Tier 1, não 2,
    # de propósito: o bônus só vale se a espécie TIVER golpe daquela
    # categoria no movepool real, o que este rubric isolado não verifica -
    # a Fase 3 (cruzar habilidade x movepool real) é que vai dar a nota
    # precisa por espécie; isto aqui é só o piso, pra parar de pontuar zero
    # uma habilidade real de boost.
    if ($d -match 'Aumenta o poder de golpes.*em [1-9]\.[3-9]x') { return 1 }

    return 0
}

# Tabela de efetividade de tipo (atacante -> {defensor: multiplicador}) -
# porta EXATA do TYPE_CHART já usado em artifact_template.html (mesmos
# valores, nunca reconferidos contra outra fonte porque já é a fonte real
# usada pelo resto do app - qualquer divergência seria bug de digitação,
# não de dado). Usado pela décima-terceira/vigésima-quarta passagem
# (2026-09-12) pro rank robusto: simula cada espécie contra os tipos de
# ataque reais dos 107 chefões (compute_species_rank.ps1), em vez de só
# medir "quão grande é o BST" no vácuo.
$TYPE_CHART = @{
    Normal   = @{ Rock=0.5; Ghost=0; Steel=0.5 }
    Fighting = @{ Normal=2; Ice=2; Poison=0.5; Flying=0.5; Psychic=0.5; Bug=0.5; Rock=2; Ghost=0; Dark=2; Steel=2; Fairy=0.5 }
    Fire     = @{ Fire=0.5; Water=0.5; Grass=2; Ice=2; Bug=2; Rock=0.5; Dragon=0.5; Steel=2 }
    Water    = @{ Fire=2; Water=0.5; Grass=0.5; Ground=2; Rock=2; Dragon=0.5 }
    Electric = @{ Water=2; Electric=0.5; Grass=0.5; Ground=0; Flying=2; Dragon=0.5 }
    Grass    = @{ Fire=0.5; Water=2; Grass=0.5; Poison=0.5; Ground=2; Flying=0.5; Bug=0.5; Rock=2; Dragon=0.5; Steel=0.5 }
    Ice      = @{ Fire=0.5; Water=0.5; Grass=2; Ice=0.5; Ground=2; Flying=2; Dragon=2; Steel=0.5 }
    Poison   = @{ Grass=2; Poison=0.5; Ground=0.5; Rock=0.5; Ghost=0.5; Steel=0; Fairy=2 }
    Ground   = @{ Fire=2; Electric=2; Grass=0.5; Poison=2; Flying=0; Bug=0.5; Rock=2; Steel=2 }
    Flying   = @{ Electric=0.5; Grass=2; Fighting=2; Bug=2; Rock=0.5; Steel=0.5 }
    Psychic  = @{ Fighting=2; Poison=2; Psychic=0.5; Dark=0; Steel=0.5 }
    Bug      = @{ Fire=0.5; Grass=2; Fighting=0.5; Poison=0.5; Flying=0.5; Psychic=2; Ghost=0.5; Dark=2; Steel=0.5; Fairy=0.5 }
    Rock     = @{ Fire=2; Ice=2; Fighting=0.5; Ground=0.5; Flying=2; Bug=2; Steel=0.5 }
    Ghost    = @{ Normal=0; Psychic=2; Ghost=2; Dark=0.5 }
    Dragon   = @{ Dragon=2; Steel=0.5; Fairy=0 }
    Dark     = @{ Fighting=0.5; Psychic=2; Ghost=2; Dark=0.5; Fairy=0.5 }
    Steel    = @{ Fire=0.5; Water=0.5; Electric=0.5; Ice=2; Rock=2; Steel=0.5; Fairy=2 }
    Fairy    = @{ Fire=0.5; Fighting=2; Poison=0.5; Dragon=2; Dark=2; Steel=0.5 }
}

# Multiplicador de dano de $atkType contra uma espécie com 1-2 tipos
# ($defTypes, array de nomes). Multiplica cada tipo defensor separado -
# mesma lógica de typeMultiplier() em artifact_template.html.
function Get-TypeMultiplier([string]$atkType, [string[]]$defTypes) {
    $row = $TYPE_CHART[$atkType]
    $mult = 1.0
    foreach ($d in $defTypes) {
        if ($row -and $row.ContainsKey($d)) { $mult *= $row[$d] }
    }
    return $mult
}

# Porta EXATA de TYPE_MOD_ABILITIES em artifact_template.html (décima-oitava
# passagem, 2026-09-11 - 37 entradas curadas contra o texto real de cada
# habilidade, nunca inventadas). Usada pelo rank robusto (compute_species_
# rank.ps1, vigésima-quarta passagem, 2026-09-12): sem isto, a simulação de
# defesa julgava só a tipagem CRUA da espécie e derrubava Probopass de SS
# (rank estabelecido em várias passagens anteriores) pra C, porque a defesa
# real dele contra Ground vem inteira da Levitate (habilidade), não da
# tipagem Rock/Steel em si (que sozinha é uma FRAQUEZA 4x a Ground). Mesma
# tabela, nunca reconferida contra outra fonte porque já é a fonte real.
$TYPE_MOD_ABILITIES = @{
    26  = @{ immune = @("Ground") }                                   # Levitate
    444 = @{ immune = @("Water") }                                    # Evaporate
    450 = @{ immune = @("Ground") }                                   # Earth Eater
    314 = @{ immune = @("Rock") }                                     # Mountaineer
    116 = @{ seDamper = 0.65 }                                        # Solid Rock
    318 = @{ seDamper = 0.5 }                                         # Primal Armor
    303 = @{ resist = @{ Rock = 0.5 } }                               # Fossilized
    17  = @{ resist = @{ Poison = 0.5 } }                             # Immunity
    40  = @{ resist = @{ Water = 0.7; Ice = 0.7 } }                   # Magma Armor
    47  = @{ resist = @{ Fire = 0.5; Ice = 0.5 } }                    # Thick Fat
    85  = @{ resist = @{ Fire = 0.5 } }                                # Heatproof
    134 = @{ resist = @{ Ghost = 0.5; Dark = 0.5 } }                  # Heavy Metal
    195 = @{ resist = @{ Water = 0.5 } }                              # Water Compaction
    199 = @{ resist = @{ Fire = 0.5 } }                               # Water Bubble
    218 = @{ resist = @{ Fire = 2 } }                                 # Fluffy (fraqueza)
    306 = @{ resist = @{ Dark = 0.75; Fairy = 0.75 } }                # Nocturnal
    311 = @{ resist = @{ Water = 2 } }                                # Liquified (fraqueza)
    337 = @{ resist = @{ Grass = 0.5 } }                              # Raw Wood
    342 = @{ resist = @{ Fire = 0.5 } }                               # Seaweed
    442 = @{ resist = @{ Fairy = 0.5 } }                              # Fae Hunter
    445 = @{ resist = @{ Grass = 0.5 } }                              # Lumberjack
    526 = @{ resist = @{ Dark = 0.5 } }                               # Monster Hunter
    547 = @{ resist = @{ Ghost = 0.5 } }                              # Purifying Salt
    754 = @{ resist = @{ Fire = 2 } }                                 # Puffy (fraqueza)
    764 = @{ resist = @{ Fire = 0.5 } }                               # Deep Freeze
    804 = @{ resist = @{ Fire = 0.5 } }                               # Firefighter
    889 = @{ resist = @{ Fire = 0.25; Ice = 0.25 } }                  # Thick Blubber
    904 = @{ resist = @{ Water = 0.5; Ground = 0.5 } }                # Strong Foundation
    995 = @{ resist = @{ Fire = 0.5; Electric = 0.5; Water = 0.5 } }  # Elemental Aegis
    996 = @{ resist = @{ Dark = 0.5; Ghost = 0.5; Psychic = 0.5 } }   # Aegis Ward
    606 = @{ immune = @("Ground") }                                   # Aerialist
    688 = @{ immune = @("Ground") }                                   # Imposing Wings
    664 = @{ resist = @{ Fire = 0.5 } }                               # Flame Bubble
    682 = @{ resist = @{ Fire = 0.5 } }                               # Iron Giant
    936 = @{ resist = @{ Fire = 0.5; Ice = 0.5 } }                    # Sumo Guard
    946 = @{ resist = @{ Fire = 2 } }                                 # Massive Pelt (fraqueza)
    1010 = @{ resist = @{ Fire = 0.5 } }                              # Thermal Entropy
    1015 = @{ resist = @{ Fire = 0.5 } }                              # Droideka
}

# Porta de alwaysActiveAbilities() - quais ids de habilidade desta espécie
# são seguros de tratar como SEMPRE ativos sem saber a build escolhida:
# innates (sempre ligadas, regra do próprio jogo) + uma habilidade
# escolhível só quando os 3 slots são idênticos (sem alternativa real pra
# escolher, então travada de fato). $s é uma entrada de dex.species (["inn"]
# e ["ab"] já são arrays de ids, mesmo formato de dex_compact.json).
# CHAMAR UMA VEZ POR ESPÉCIE, não por par (encontro x tipo) - achado real de
# performance na vigésima-quarta passagem (2026-09-12): a primeira versão
# chamava isto (com `Select-Object -Unique`, que sozinho já é caro em
# PowerShell por invocar o pipeline inteiro) de dentro do loop mais interno
# da simulação de chefão, ~900 vezes por espécie x 1906 espécies - a rodada
# nem terminou em mais de 9 minutos. Resolvido calculando uma vez por
# espécie no loop principal e passando o resultado já pronto adiante.
function Get-AlwaysActiveAbilityIds($s) {
    $ids = New-Object System.Collections.ArrayList
    foreach ($id in @($s["inn"])) { [void]$ids.Add($id) }
    $ab = @($s["ab"])
    if ($ab.Count -gt 0) {
        $allSame = $true
        for ($i = 1; $i -lt $ab.Count; $i++) { if ($ab[$i] -ne $ab[0]) { $allSame = $false; break } }
        if ($allSame) { [void]$ids.Add($ab[0]) }
    }
    return $ids
}

# Porta de abilityTypeMod() - multiplicador de dano de $atkType contra uma
# espécie com tipos $defTypes, dado o array JÁ CALCULADO de ids sempre-ativos
# (ver Get-AlwaysActiveAbilityIds acima - calcular uma vez por espécie, não
# aqui dentro, que roda no loop mais quente da simulação).
function Get-AbilityAdjustedTypeMultiplier([string]$atkType, [string[]]$defTypes, $alwaysActiveIds) {
    $raw = Get-TypeMultiplier $atkType $defTypes
    foreach ($id in $alwaysActiveIds) {
        $mod = $TYPE_MOD_ABILITIES[$id]
        if ($mod -and $mod.immune -and ($mod.immune -contains $atkType)) { return 0.0 }
    }
    $mult = $raw
    foreach ($id in $alwaysActiveIds) {
        $mod = $TYPE_MOD_ABILITIES[$id]
        if (-not $mod) { continue }
        if ($mod.resist -and $mod.resist.ContainsKey($atkType)) { $mult *= $mod.resist[$atkType] }
        elseif ($mod.seDamper -and $raw -gt 1) { $mult *= $mod.seDamper }
    }
    return $mult
}

function Format-Evs($evsArr) {
    $labels = @("HP", "Atk", "Def", "SpA", "SpD", "Spe")
    $arr = @($evsArr)
    $parts = New-Object System.Collections.ArrayList
    for ($i = 0; $i -lt 6; $i++) {
        $v = if ($i -lt $arr.Count) { [int]$arr[$i] } else { 0 }
        if ($v -gt 0) { [void]$parts.Add("$v $($labels[$i])") }
    }
    return ($parts -join " / ")
}
