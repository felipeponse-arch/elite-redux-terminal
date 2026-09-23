<#
Cruzamento final: habilidades condicionais (catálogo verificado à mão contra
o texto real de cada uma - a mesma disciplina de FLAG_PHRASES em
compute_ability_movepool_synergy.ps1) x golpes reais que a PRÓPRIA espécie
aprende e que ATIVAM a condição sozinha - sem depender de outro membro do
time pro clima, sem depender de item pra se machucar. Pedido do usuário,
2026-09-20/21: "entender a sinergia e eficiência de cada habilidade com cada
move" + "juntamos isso com as habilidades".

Diferente de compute_ability_movepool_synergy.ps1 (que cruza habilidade x
CATEGORIA de golpe - Transistor + golpes Electric, por exemplo), isto cruza
habilidade CONDICIONAL x golpe que CRIA a própria condição - uma classe de
sinergia inteira que aquele script não cobre (ele só olha "a espécie tem
golpe da categoria que a habilidade bonifica", nunca "a espécie consegue
sozinha satisfazer a condição que ativa a habilidade").

Catálogo de habilidades abaixo é um SUBCONJUNTO pequeno e deliberado das ~69
habilidades que multiplicam o próprio stat (achadas por regex numa pesquisa
anterior, nunca persistidas por não serem o produto final) - só as que têm
uma condição CLARAMENTE mapeável pra um efeito de golpe real (clima, HP
baixo) entraram aqui. Cada entrada foi conferida à mão contra
data/ability_translations_pt.json antes de entrar nesta lista - nunca
gerada por regex cego.

Requer data/move_effects.json (compute_move_effects.ps1) já gerado - roda
depois dele no pipeline.
#>

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))
$moveEffects = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "move_effects.json") -Raw -Encoding UTF8))

# tipo: clima_sol|clima_areia|clima_granizo|clima_neblina|clima_chuva|hp_baixo
# (dispara com o próprio HP baixo - ver Berserk/Berserk DNA na descrição real).
$CATALOGO_ABI = [ordered]@{
    "Solar Power" = "clima_sol"; "Sand Force" = "clima_areia"
    "Whiteout" = "clima_granizo"; "Ectoplasm" = "clima_neblina"
    "Raging Storm" = "clima_chuva"; "Sun Worship" = "clima_sol"
    "Sea Guardian" = "clima_chuva"; "Greater Spirit" = "clima_neblina"
    "Protosynthesis" = "clima_sol"
    "Berserk" = "hp_baixo"; "Berserk DNA" = "hp_baixo"
}
$CLIMA_POR_TIPO = @{ clima_sol = "sol"; clima_areia = "areia"; clima_granizo = "granizo"; clima_neblina = "neblina"; clima_chuva = "chuva" }

$abilityIdByName = @{}
for ($i = 0; $i -lt $dex.abilities.Count; $i++) { if ($dex.abilities[$i]) { $abilityIdByName[$dex.abilities[$i][0]] = $i } }
$moveNameById = @{}
for ($i = 0; $i -lt $dex.moves.Count; $i++) { if ($dex.moves[$i]) { $moveNameById[$i] = $dex.moves[$i][0] } }

# --- Combo 1: habilidade de clima + a própria espécie aprende o golpe que
# invoca esse mesmo clima (autossuficiente, não depende de suporte de time) ---
$comboClima = New-Object System.Collections.ArrayList
# --- Combo 2: habilidade que dispara com HP baixo + a própria espécie
# aprende um golpe com recuo (autossuficiente pra se machucar sozinha) ---
$comboRecuo = New-Object System.Collections.ArrayList

foreach ($s in $dex.species) {
    if (-not $s) { continue }
    $slotIds = @($s["ab"]) + @($s["inn"])
    $moveIds = @(@($s["lm"]) | ForEach-Object { $_[1] }) + @($s["tu"])
    $moveIds = @($moveIds | Select-Object -Unique)

    foreach ($aid in $slotIds) {
        if (-not $dex.abilities[$aid]) { continue }
        $nome = $dex.abilities[$aid][0]
        if (-not $CATALOGO_ABI.Contains($nome)) { continue }
        $tipo = $CATALOGO_ABI[$nome]

        if ($tipo -eq "hp_baixo") {
            $golpesRecuo = New-Object System.Collections.ArrayList
            foreach ($mid in $moveIds) {
                $eff = $moveEffects["$mid"]
                if (-not $eff) { continue }
                if (@($eff.efeitos) | Where-Object { $_.tipo -eq "recuo" }) { [void]$golpesRecuo.Add($moveNameById[$mid]) }
            }
            if ($golpesRecuo.Count -gt 0) {
                [void]$comboRecuo.Add([ordered]@{ sname = $s["sname"]; nome = $s["n"]; habilidade = $nome; golpesRecuo = $golpesRecuo.ToArray() })
            }
            continue
        }

        $climaNecessario = $CLIMA_POR_TIPO[$tipo]
        if (-not $climaNecessario) { continue }
        foreach ($mid in $moveIds) {
            $eff = $moveEffects["$mid"]
            if (-not $eff) { continue }
            $bate = @($eff.efeitos) | Where-Object { $_.tipo -eq "clima" -and $_.qual -eq $climaNecessario }
            if ($bate) {
                [void]$comboClima.Add([ordered]@{ sname = $s["sname"]; nome = $s["n"]; habilidade = $nome; clima = $climaNecessario; golpe = $moveNameById[$mid] })
                break
            }
        }
    }
}

$out = [ordered]@{
    comboClimaAutossuficiente = $comboClima.ToArray()
    comboHpBaixoComRecuo = $comboRecuo.ToArray()
}
$outPath = Join-Path $dataDir "condition_move_synergy.json"
[System.IO.File]::WriteAllText($outPath, (ConvertTo-JsonManual $out), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "compute_condition_move_synergy.ps1: OK ($($comboClima.Count) combo(s) de clima autossuficiente, $($comboRecuo.Count) combo(s) de HP baixo + recuo) -> $outPath"
