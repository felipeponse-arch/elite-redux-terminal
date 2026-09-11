<#
Fase 3 do roadmap "sinergia habilidade x movepool" (reuniao 2026-09-11): cruza cada
habilidade real que aumenta o poder de golpes de uma CATEGORIA especifica (flag) ou de
um TIPO especifico com o movepool REAL (nivel + tutor) de cada especie, produzindo o
"verdadeiro potencial" verificado - nao uma lista generica de "habilidades boas", mas
o combo que so existe porque a especie realmente aprende o golpe certo.

So conta como sinergia real quando a especie tem PELO MENOS UM golpe (nivel ou tutor)
cuja flag/tipo bate com o que a habilidade bonifica. Golpes acima do level cap contam
(o jogador pode planejar em torno deles), golpes de nivel 1 tambem.

Limitacao real, documentada e nao contornada: golpes marcados aqui como "de soco"
(Punch), "de mordida/presa" (Bite) ou "cortantes" (Slicing) NAO tem flag correspondente
em flagsT (a lista real de 18 categorias desta hack nao inclui essas tres) - portanto
Iron Fist, Strong Jaw, Keen Edge e as combos que os incluem (Devourer, Flaming Maw,
Blade's Essence, Blademaster, Hungry Maws) ficam de fora da verificacao por movepool
real; sao listados no relatorio como "sem flag verificavel", nunca silenciosamente
tratados como combo confirmado.
#>

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))
$abiPt = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "ability_translations_pt.json") -Raw -Encoding UTF8))

$flagNames = @($dex.flags)
$typeNames = @($dex.types)
$abilities = $dex.abilities
$moves = $dex.moves

# Frase real (como aparece no texto ja traduzido/combo-expandido) -> categoria(s) real(is)
# de flagsT. Ordem importa: frases mais especificas primeiro, senao um match parcial
# ("golpes de chute" dentro de "golpes de soco e chute") rouba o match da frase maior.
# Cada entrada verificada a mao contra scripts/research_ability_synergy.ps1.
$FLAG_PHRASES = [ordered]@{
    'golpes de chifre e broca'                                  = @('Horn Based', 'Drill Based')
    'golpes de asa, vento ou baseados em ar'                    = @('Air/Wing Based')
    'golpes de martelo e investida'                             = @('Hammer Based')
    'golpes de soco e chute'                                    = @('Kick Based')
    'golpes de soco e martelo'                                  = @('Hammer Based')
    'golpes de campo \(Cut, Surf, Strength'                     = @('Field Based')
    'golpes de contato'                                         = @('Makes Contact')
    'golpes de chute'                                           = @('Kick Based')
    'golpes de flecha'                                          = @('Arrow Based')
    'golpes sonoros'                                             = @('Sound Based')
    'do tipo Beam/Pump/Cannon/Shot/Gun/Pulse'                   = @('Bullet Move')
    'e de arremesso'                                             = @('Throw Based')
}

# Frases reais que citam categoria de golpe SEM flag correspondente nesta hack -
# reportadas no relatorio, nunca contadas como sinergia verificavel.
$UNMAPPED_PHRASES = @('golpes de soco', 'mordida/presa', 'golpes cortantes')

function Get-FlagMatches([string]$desc) {
    $found = New-Object System.Collections.ArrayList
    foreach ($phrase in $FLAG_PHRASES.Keys) {
        if ($desc -match $phrase) {
            foreach ($cat in $FLAG_PHRASES[$phrase]) { [void]$found.Add($cat) }
        }
    }
    return @($found | Select-Object -Unique)
}

function Get-UnmappedHit([string]$desc) {
    foreach ($phrase in $UNMAPPED_PHRASES) {
        if ($desc -match $phrase) { return $true }
    }
    return $false
}

function Get-TypeMatches([string]$desc) {
    $found = New-Object System.Collections.ArrayList
    foreach ($t in $typeNames) {
        if ($t -in @('Mystery', 'None', 'Stellar')) { continue }
        if ($desc -match "\b$t\b") { [void]$found.Add($t) }
    }
    return @($found | Select-Object -Unique)
}

# --- Passo 1: mapear cada habilidade que bonifica golpes (flag e/ou tipo) ---
$abilityBoosts = @{}
$unmappedReport = New-Object System.Collections.ArrayList
for ($id = 0; $id -lt $abilities.Count; $id++) {
    $desc = $abiPt["$id"]
    if (-not $desc) { continue }
    if ($desc -notmatch '[Aa]umenta[^\n]*(golpes|do tipo)') { continue }

    $flagCats = Get-FlagMatches $desc
    $typeCats = Get-TypeMatches $desc
    $hasUnmapped = Get-UnmappedHit $desc

    if ($flagCats.Count -eq 0 -and $typeCats.Count -eq 0 -and -not $hasUnmapped) { continue }

    $abilityBoosts[$id] = @{
        name  = $abilities[$id][0]
        flags = $flagCats
        types = $typeCats
    }
    if ($hasUnmapped -and $flagCats.Count -eq 0 -and $typeCats.Count -eq 0) {
        [void]$unmappedReport.Add($abilities[$id][0])
    }
}

Write-Output ("compute_ability_movepool_synergy.ps1: {0} habilidades com bonus de golpe mapeado (flag ou tipo)" -f $abilityBoosts.Count)
if ($unmappedReport.Count -gt 0) {
    Write-Output ("  aviso: {0} habilidades citam categoria SEM flag nesta hack (soco/mordida/cortante) - fora da verificacao: {1}" -f $unmappedReport.Count, ($unmappedReport -join ", "))
}

# --- Passo 2: indexar golpes por id (flags resolvidos pra nome, tipo resolvido pra nome) ---
$moveIndex = @{}
for ($mid = 0; $mid -lt $moves.Count; $mid++) {
    $m = $moves[$mid]
    if (-not $m) { continue }
    $mFlagIds = @($m[8])
    $mFlagNames = @($mFlagIds | ForEach-Object { $flagNames[$_] })
    $mTypeName = $typeNames[[int]$m[1]]
    $moveIndex[$mid] = @{ name = $m[0]; flags = $mFlagNames; type = $mTypeName }
}

# --- Passo 3: cruzar cada especie com suas habilidades reais (escolhiveis + innate) ---
$result = [ordered]@{}
foreach ($s in $dex.species) {
    if (-not $s) { continue }
    $sname = $s["sname"]
    if (-not $sname) { continue }

    # golpes reais desta especie: nivel (lm = [nivel, id]) + tutor (tu = [id])
    $speciesMoveIds = New-Object System.Collections.ArrayList
    foreach ($pair in @($s["lm"])) { [void]$speciesMoveIds.Add([int]$pair[1]) }
    foreach ($mid in @($s["tu"])) { [void]$speciesMoveIds.Add([int]$mid) }
    $speciesMoveIds = @($speciesMoveIds | Select-Object -Unique)

    $hits = New-Object System.Collections.ArrayList
    $abilitySlots = New-Object System.Collections.ArrayList
    foreach ($aid in @($s["ab"])) { [void]$abilitySlots.Add(@{ id = [int]$aid; kind = "abi" }) }
    foreach ($aid in @($s["inn"])) { [void]$abilitySlots.Add(@{ id = [int]$aid; kind = "inn" }) }

    foreach ($slot in $abilitySlots) {
        $boost = $abilityBoosts[$slot.id]
        if (-not $boost) { continue }

        $matchedMoves = New-Object System.Collections.ArrayList
        $matchedCats = New-Object System.Collections.ArrayList
        foreach ($mid in $speciesMoveIds) {
            $mv = $moveIndex[$mid]
            if (-not $mv) { continue }
            $movHitCats = New-Object System.Collections.ArrayList
            foreach ($cat in $boost.flags) {
                if ($mv.flags -contains $cat) { [void]$movHitCats.Add($cat) }
            }
            if ($boost.types -contains $mv.type) { [void]$movHitCats.Add($mv.type) }
            if ($movHitCats.Count -gt 0) {
                [void]$matchedMoves.Add($mv.name)
                foreach ($c in $movHitCats) { [void]$matchedCats.Add($c) }
            }
        }

        if ($matchedMoves.Count -gt 0) {
            [void]$hits.Add([ordered]@{
                id       = $slot.id
                name     = $boost.name
                kind     = $slot.kind
                categoria = (@($matchedCats | Select-Object -Unique) -join ", ")
                golpes   = @($matchedMoves | Select-Object -Unique)
            })
        }
    }

    if ($hits.Count -gt 0) {
        $result[$sname] = $hits.ToArray()
    }
}

$outPath = Join-Path $dataDir "species_ability_synergy.json"
[System.IO.File]::WriteAllText($outPath, (ConvertTo-JsonManual $result), (New-Object System.Text.UTF8Encoding($false)))
Write-Output ("compute_ability_movepool_synergy.ps1: OK ({0} especies com sinergia real habilidade x movepool confirmada) -> {1}" -f $result.Count, $outPath)
