<#
Invariantes dos dados derivados - roda em todo build e aborta se alguma
quebrar (item Q2 da pauta tecnica, 2026-09-16).

Motivo: bug de dado nao aparece em teste de tela. A tela renderiza feliz um
rotulo que nunca bate ("Status" x "STATUS" passou meses distorcendo 91 times de
chefao) ou um nome que nao existe. Mesma ideia de validate_builds.ps1, pros
outros arquivos que o app le.

Checa:
  1. rotulos que o app compara (artifact_template.html, dataLabel) existem;
  2. data/move_roles.json cobre exatamente os golpes de STATUS;
  3. data/mega_forms.json: toda pedra e item real, toda forma e especie real
     e alcancavel por Mega/Primal a partir de alguma base;
  4. evolucao por nivel tem nivel numerico e destino real;
  5. data/species_ability_synergy.json so cita especie, habilidade e golpe
     reais;
  6. nenhuma descricao de fonte externa (golpe, habilidade, item) tem < ou >
     - o app manda essas descricoes pra IA dentro de <dados_do_jogo>, e um
     texto com esses caracteres poderia imitar o delimitador (item S3).
     Nomes ficam de fora: existe habilidade chamada "3 > 1".

Literais em ASCII (PowerShell 5.1 le .ps1 sem BOM na codepage do sistema).
#>
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser
function Load($name) { return $ser.DeserializeObject((Get-Content (Join-Path $dataDir $name) -Raw -Encoding UTF8)) }

$dex = Load "dex_compact.json"
$roles = Load "move_roles.json"
$megaForms = Load "mega_forms.json"
$synergy = Load "species_ability_synergy.json"

$erros = New-Object System.Collections.ArrayList
function Erro($msg) { [void]$erros.Add($msg) }

$splits = @($dex["splits"])
$evoKinds = @($dex["evoKinds"])
$items = @{}; foreach ($i in $dex["items"]) { if ($i) { $items[[string]$i] = $true } }
$moveNames = @{}; foreach ($m in $dex["moves"]) { if ($m) { $moveNames[[string]$m[0]] = $true } }
$abilityNames = @{}; foreach ($a in $dex["abilities"]) { if ($a) { $abilityNames[[string]$a[0]] = $true } }
$speciesBySname = @{}; $speciesByX = @{}
foreach ($s in $dex["species"]) {
    if (-not $s) { continue }
    $speciesBySname[[string]$s["sname"]] = $s
    $speciesByX[[int]$s["x"]] = $s
}

# 1. rotulos usados pelo app
foreach ($lbl in @("STATUS")) { if ($splits -notcontains $lbl) { Erro "splits nao tem o rotulo $lbl" } }
foreach ($lbl in @("EVO_LEVEL", "EVO_LEVEL_MALE", "EVO_LEVEL_FEMALE", "EVO_MEGA_EVOLUTION", "EVO_MOVE_MEGA_EVOLUTION", "EVO_PRIMAL_REVERSION")) {
    if ($evoKinds -notcontains $lbl) { Erro "evoKinds nao tem o rotulo $lbl" }
}

# 2. move_roles cobre exatamente os golpes de status
$statusIdx = [array]::IndexOf($splits, "STATUS")
$statusIds = @{}
for ($id = 0; $id -lt $dex["moves"].Count; $id++) {
    $m = $dex["moves"][$id]
    if ($m -and $m[2] -eq $statusIdx -and $m[0] -and $m[0] -ne "-") { $statusIds[[string]$id] = $m[0] }
}
foreach ($id in $statusIds.Keys) { if (-not $roles.ContainsKey($id)) { Erro "move_roles.json sem papel pro golpe de status $($statusIds[$id]) (id $id)" } }
foreach ($id in $roles.Keys) { if (-not $statusIds.ContainsKey($id)) { Erro "move_roles.json tem o id $id, que nao e golpe de status" } }

# 3. mega_forms
$megaKindIdx = @()
foreach ($lbl in @("EVO_MEGA_EVOLUTION", "EVO_MOVE_MEGA_EVOLUTION", "EVO_PRIMAL_REVERSION")) { $megaKindIdx += [array]::IndexOf($evoKinds, $lbl) }
$megaTargets = @{}
foreach ($s in $speciesBySname.Values) {
    foreach ($ev in @($s["ev"])) { if ($ev -and ($megaKindIdx -contains $ev[0])) { $megaTargets[[int]$ev[2]] = $true } }
}
foreach ($stone in $megaForms.Keys) {
    $sn = [string]$megaForms[$stone]
    if (-not $items.ContainsKey([string]$stone)) { Erro "mega_forms.json: pedra '$stone' nao existe nos itens" }
    if (-not $speciesBySname.ContainsKey($sn)) { Erro "mega_forms.json: forma '$sn' (pedra $stone) nao existe" }
    elseif (-not $megaTargets.ContainsKey([int]$speciesBySname[$sn]["x"])) { Erro "mega_forms.json: '$sn' (pedra $stone) nao e alvo de Mega/Primal de nenhuma base" }
}
$megaSemPedra = 0
$snamesComPedra = @{}; foreach ($v in $megaForms.Values) { $snamesComPedra[[string]$v] = $true }
foreach ($x in $megaTargets.Keys) { if ($speciesByX.ContainsKey($x) -and -not $snamesComPedra.ContainsKey([string]$speciesByX[$x]["sname"])) { $megaSemPedra++ } }

# 4. evolucao por nivel
$destinoAusenteNaFonte = 0
$levelKinds = @()
foreach ($lbl in @("EVO_LEVEL", "EVO_LEVEL_MALE", "EVO_LEVEL_FEMALE")) { $levelKinds += [array]::IndexOf($evoKinds, $lbl) }
foreach ($s in $speciesBySname.Values) {
    foreach ($ev in @($s["ev"])) {
        if (-not $ev) { continue }
        if ($levelKinds -contains $ev[0]) {
            $n = 0
            if (-not [int]::TryParse([string]$ev[1], [ref]$n) -or $n -lt 1 -or $n -gt 100) { Erro "$($s["sname"]): evolucao por nivel com nivel invalido '$($ev[1])'" }
        }
        # -1 = a propria fonte (NextDex) nao inclui a forma de destino - lacuna
        # conhecida do dado de origem (hoje: megas de Bruxish, Duraludon e
        # Jellicent), nao erro nosso. Qualquer outro destino ausente e erro.
        if ([int]$ev[2] -eq -1) { $destinoAusenteNaFonte++; continue }
        if (-not $speciesByX.ContainsKey([int]$ev[2])) { Erro "$($s["sname"]): evolucao aponta pra especie inexistente (x=$($ev[2]))" }
    }
}

# 5. sinergia habilidade x golpe
foreach ($sn in $synergy.Keys) {
    if (-not $speciesBySname.ContainsKey($sn)) { Erro "species_ability_synergy.json: especie $sn nao existe"; continue }
    foreach ($h in @($synergy[$sn])) {
        if (-not $abilityNames.ContainsKey([string]$h["name"])) { Erro "species_ability_synergy.json: $sn cita habilidade inexistente '$($h["name"])'" }
        foreach ($g in @($h["golpes"])) { if (-not $moveNames.ContainsKey([string]$g)) { Erro "species_ability_synergy.json: $sn cita golpe inexistente '$g'" } }
    }
}

# 6. descricoes externas sem < ou >
$descricoes = New-Object System.Collections.ArrayList
foreach ($m in $dex["moves"]) { if ($m) { [void]$descricoes.Add(@("golpe " + $m[0], [string]$m[6])) } }
foreach ($a in $dex["abilities"]) { if ($a) { [void]$descricoes.Add(@("habilidade " + $a[0], [string]$a[1])) } }
foreach ($f in @("move_translations_pt.json", "ability_translations_pt.json", "item_descriptions.json", "item_translations_pt.json")) {
    $obj = Load $f
    foreach ($k in $obj.Keys) { [void]$descricoes.Add(@("$f/$k", [string]$obj[$k])) }
}
foreach ($d in $descricoes) { if ($d[1] -match "[<>]") { Erro "descricao externa com < ou > ($($d[0])) - poderia imitar o delimitador do prompt da IA" } }

if ($erros.Count) {
    Write-Output "validate_data_invariants.ps1: $($erros.Count) problema(s):"
    $erros | Select-Object -First 30 | ForEach-Object { Write-Output "  - $_" }
    throw "Invariantes de dados quebradas - build abortado."
}
Write-Output ("validate_data_invariants.ps1: OK (" + $descricoes.Count + " descricoes externas sem < ou >, " + $statusIds.Count + " golpes de status com papel, " + $megaForms.Count + " pedras mega validas, " + $synergy.Count + " especies com sinergia; " + $megaSemPedra + " formas mega/primal sem pedra conhecida - regra de pedra nao se aplica a elas; " + $destinoAusenteNaFonte + " evolucoes cuja forma de destino nao existe na fonte)")
