<#
Classifica o PAPEL/arquétipo de cada espécie (Pivô/Tanque/Wallbreaker/Sweeper)
e a divisão física/especial do seu ataque - pedido do usuário, 2026-09-11:
o rank (compute_species_rank.ps1) mede "quão forte", isso mede "que TIPO de
forte", e fica como tag SEPARADA (decisão do usuário: não fundir na letra de
rank, mesmo padrão que já existe entre tier/stageTier - dois sinais
paralelos, nenhum apagando o outro).

Definições usadas (pesquisadas, não inventadas - ver fontes no commit):
  - Wall: bulk alto (física ou especial). Sem recuperação, se desgasta em
    poucos turnos - por isso "Tanque" aqui exige bulk alto E golpe de
    recuperação, não bulk sozinho.
  - Wallbreaker: ataque muito alto, quebra walls - diferente de sweeper
    porque NÃO depende de golpe de setup pra fazer o trabalho.
  - Pivô: resiste ataques comuns e troca com U-turn/Volt Switch/Teleport/
    Flip Turn/Parting Shot/Baton Pass pra manter controle de quem entra em
    campo - por isso exige bulk real, não só ter o golpe.
  - Sweeper: velocidade alta + ataque alto + acesso a golpe de setup
    (Swords Dance, Dragon Dance, etc.) pra virar avalanche no fim de jogo.
  - Bulk (fórmula real, usada em cálculo de dano competitivo):
    bulk físico = HP * Defesa / 100, bulk especial = HP * Sp.Def / 100.

Uma espécie pode acumular mais de uma tag (ex: Pivô + Tanque) - papéis reais
de Pokémon não são mutuamente exclusivos. Golpes de pivô/setup/recuperação
verificados contra o dado real desta hack antes de codificar a lista (todos
existem com o mesmo nome e mecânica - ver commit).

Movepool considerado = nível + tutor (mesmo conjunto que validateAiBuild()
aceita pra build por IA, artifact_template.html) - NÃO inclui TM/HM, pra não
classificar uma espécie como Pivô/Sweeper por um golpe que a build por IA
nem deixaria ela escolher.

Calibrado manualmente contra espécies reconhecíveis desta hack antes de
confiar no resultado amplo (ver saída do script).

Output: data/species_role.json, keyed by sname.
Run depois de transform.ps1 (precisa de dex_compact.json com "b"/"lm"/"tu").
#>

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))

# --- nome de golpe -> id (uma passada) ---
$moveIdByName = @{}
for ($i = 0; $i -lt $dex.moves.Count; $i++) {
    $n = $dex.moves[$i][0]
    if ($n -and -not $moveIdByName.ContainsKey($n)) { $moveIdByName[$n] = $i }
}
function Get-MoveIdSet([string[]]$names) {
    $set = @{}
    foreach ($n in $names) {
        if ($moveIdByName.ContainsKey($n)) { $set[$moveIdByName[$n]] = $true }
    }
    return $set
}
$PIVOT_IDS = Get-MoveIdSet @("U-turn", "Volt Switch", "Flip Turn", "Teleport", "Parting Shot", "Baton Pass")
$RECOVERY_IDS = Get-MoveIdSet @("Recover", "Roost", "Slack Off", "Wish", "Synthesis", "Moonlight", "Morning Sun", "Soft-Boiled", "Milk Drink", "Shore Up", "Strength Sap", "Rest")
$SETUP_IDS = Get-MoveIdSet @("Swords Dance", "Dragon Dance", "Nasty Plot", "Calm Mind", "Quiver Dance", "Shell Smash", "Bulk Up", "Iron Defense", "Amnesia", "Agility", "Rock Polish", "Curse", "Coil", "Shift Gear")

# --- percentile rank helper (mesmo algoritmo de compute_species_rank.ps1,
# duplicado de propósito - scripts deste pipeline são standalone por
# convenção, cada um computa o que precisa). ---
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

$rows = New-Object System.Collections.ArrayList
foreach ($s in $dex.species) {
    if (-not $s) { continue }
    $b = @($s["b"])
    if ($b.Count -lt 6) { continue }
    $hp = $b[0]; $atk = $b[1]; $def = $b[2]; $spa = $b[3]; $spd = $b[4]; $spe = $b[5]
    $offense = [math]::Max($atk, $spa)
    $physBulk = $hp * $def / 100.0
    $specBulk = $hp * $spd / 100.0
    $bulk = [math]::Max($physBulk, $specBulk)

    $movepool = @{}
    foreach ($mv in @($s["lm"])) { $movepool[$mv[1]] = $true }
    foreach ($id in @($s["tu"])) { $movepool[$id] = $true }

    $hasPivot = $false
    foreach ($id in $PIVOT_IDS.Keys) { if ($movepool.ContainsKey($id)) { $hasPivot = $true; break } }
    $hasRecovery = $false
    foreach ($id in $RECOVERY_IDS.Keys) { if ($movepool.ContainsKey($id)) { $hasRecovery = $true; break } }
    $hasSetup = $false
    foreach ($id in $SETUP_IDS.Keys) { if ($movepool.ContainsKey($id)) { $hasSetup = $true; break } }

    [void]$rows.Add([ordered]@{
        sname = $s["sname"]; atk = $atk; spa = $spa; offense = $offense; bulk = $bulk; spe = $spe
        hasPivot = $hasPivot; hasRecovery = $hasRecovery; hasSetup = $hasSetup
    })
}

$offenseRanks = Get-PercentileRanks ($rows | ForEach-Object { $_.offense })
$bulkRanks = Get-PercentileRanks ($rows | ForEach-Object { $_.bulk })
$speRanks = Get-PercentileRanks ($rows | ForEach-Object { $_.spe })

$out = [ordered]@{}
$roleCounts = @{}
$splitCounts = @{}
foreach ($r in $rows) {
    $offensePct = $offenseRanks[[string]$r.offense]
    $bulkPct = $bulkRanks[[string]$r.bulk]
    $spePct = $speRanks[[string]$r.spe]

    # Corte de bulk pro Pivo calibrado em 25 (nao 50), achado real ao testar
    # contra Rotom-Wash - o proprio exemplo classico de pivo usado na
    # pesquisa (Volt Switch + Will-O-Wisp + bulk). Rotom-Wash tem HP baixo
    # (50) que derruba a formula HP*Def/100 mesmo com Def/SpDef altos
    # (107/107), caindo no percentil 36 - abaixo de um corte de 50%. A
    # pesquisa nao exige "entre os mais bulky do jogo", so "aguenta um hit
    # antes de trocar" - por isso o corte e "fora do quartil mais fragil",
    # nao "acima da mediana".
    #
    # Chaves em ASCII de proposito (Pivo/Fisico, sem acento) - achado real
    # ao rodar pela primeira vez: PowerShell 5.1 le um .ps1 sem BOM usando a
    # codepage padrao do sistema, nao UTF-8, entao um literal acentuado
    # direto no fonte ("Pivô") virava mojibake ("PivÃ´") no JSON de saida,
    # mesmo com o escritor de arquivo forçando UTF-8 - o problema era a
    # LEITURA do .ps1, nao a escrita do .json. Mesmo padrao ja usado no
    # resto do pipeline (tier = "SS"/"S"/"A"... sem acento) - o rotulo
    # acentuado final e responsabilidade da camada JS (ROLE_LABEL_PT/
    # SPLIT_LABEL_PT em artifact_template.html), nunca de um literal de
    # script PowerShell.
    $roles = New-Object System.Collections.ArrayList
    if ($r.hasPivot -and $bulkPct -ge 25) { [void]$roles.Add("Pivo") }
    if ($bulkPct -ge 75 -and $r.hasRecovery) { [void]$roles.Add("Tanque") }
    if ($offensePct -ge 75 -and $bulkPct -lt 60) { [void]$roles.Add("Wallbreaker") }
    if ($spePct -ge 75 -and $offensePct -ge 60 -and $r.hasSetup) { [void]$roles.Add("Sweeper") }

    $split = "Misto"
    if ($r.atk -ge ($r.spa + 5)) { $split = "Fisico" }
    elseif ($r.spa -ge ($r.atk + 5)) { $split = "Especial" }

    foreach ($role in $roles) {
        if (-not $roleCounts.ContainsKey($role)) { $roleCounts[$role] = 0 }
        $roleCounts[$role]++
    }
    if (-not $splitCounts.ContainsKey($split)) { $splitCounts[$split] = 0 }
    $splitCounts[$split]++

    $out[$r.sname] = [ordered]@{
        roles = $roles.ToArray()
        split = $split
        offensePct = [math]::Round($offensePct, 1)
        bulkPct = [math]::Round($bulkPct, 1)
        spePct = [math]::Round($spePct, 1)
    }
}

$outPath = Join-Path $dataDir "species_role.json"
[System.IO.File]::WriteAllText($outPath, (ConvertTo-JsonManual $out), (New-Object System.Text.UTF8Encoding($false)))

Write-Output "compute_species_role.ps1: OK ($($out.Keys.Count) especies) -> $outPath ($((Get-Item $outPath).Length) bytes)"
Write-Output "-- papeis (uma especie pode ter mais de um) --"
foreach ($role in $roleCounts.Keys | Sort-Object) { Write-Output ("  $role : $($roleCounts[$role])") }
Write-Output "-- divisao fisico/especial --"
foreach ($split in $splitCounts.Keys | Sort-Object) { Write-Output ("  $split : $($splitCounts[$split])") }
