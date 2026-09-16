<#
Trava de build: nenhuma entrada de data/builds.json pode citar habilidade ou
golpe que a espécie não tem de verdade em data/dex_compact.json.

Motivo real (2026-09-16): a expansão de 18 -> 221 builds vinda do Discord
shipou 29 entradas com dado inválido e foi publicada assim. Três causas, todas
do script de integração, não da fonte:
  1) build de mega validada contra a UNIÃO base+mega e gravada com o sname da
     MEGA e a habilidade da BASE;
  2) um mapa de "erros de digitação" que inventou nomes inexistentes
     ("Power-Up Punch", "U-Turn" - o dex escreve "U-turn");
  3) tolerância de 1 letra que aceitava o nome do post e gravava a grafia DO
     POST em vez da canônica do jogo (apóstrofo curvo incluso).
Nenhum teste pegava isso: a suíte exercita a UI, e a UI renderiza feliz uma
build com golpe inventado. Esta verificação é sobre o DADO, então mora aqui,
no build, do mesmo jeito que a trava de escaping de </script.
#>
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$root = Split-Path $PSScriptRoot -Parent
$dataDir = Join-Path $root "data"
$ser = New-GameDataParser

$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))
$builds = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "builds.json") -Raw -Encoding UTF8))

# Índices por sname: habilidades (escolhíveis + innate) e golpes (nível + tutor).
$habPorSname = @{}
$golpePorSname = @{}
foreach ($s in $dex["species"]) {
    if (-not $s) { continue }
    $sname = $s["sname"]
    if (-not $sname) { continue }

    $habs = New-Object System.Collections.Generic.HashSet[string]
    foreach ($aid in @($s["ab"]) + @($s["inn"])) {
        $nome = $dex["abilities"][[int]$aid][0]
        if ($nome) { [void]$habs.Add([string]$nome) }
    }
    $habPorSname[$sname] = $habs

    $golpes = New-Object System.Collections.Generic.HashSet[string]
    foreach ($par in @($s["lm"])) {
        $nome = $dex["moves"][[int]$par[1]][0]
        if ($nome) { [void]$golpes.Add([string]$nome) }
    }
    foreach ($mid in @($s["tu"])) {
        $nome = $dex["moves"][[int]$mid][0]
        if ($nome) { [void]$golpes.Add([string]$nome) }
    }
    $golpePorSname[$sname] = $golpes
}

$problemas = New-Object System.Collections.ArrayList
foreach ($sname in $builds.Keys) {
    $b = $builds[$sname]
    if (-not $habPorSname.ContainsKey($sname)) {
        [void]$problemas.Add("$sname : especie nao existe em dex_compact.json")
        continue
    }
    $hab = [string]$b["ability"]
    if ($hab -and -not $habPorSname[$sname].Contains($hab)) {
        [void]$problemas.Add("$sname : habilidade '$hab' nao pertence a esta especie")
    }
    $vistos = New-Object System.Collections.Generic.HashSet[string]
    foreach ($m in @($b["moves"])) {
        $mv = [string]$m
        if (-not $mv) { continue }
        if (-not $golpePorSname[$sname].Contains($mv)) {
            [void]$problemas.Add("$sname : golpe '$mv' nao e aprendido por esta especie")
        }
        if (-not $vistos.Add($mv)) {
            [void]$problemas.Add("$sname : golpe '$mv' repetido no mesmo set")
        }
    }
}

if ($problemas.Count -gt 0) {
    Write-Output ""
    foreach ($p in $problemas) { Write-Output "  !! $p" }
    throw "validate_builds.ps1: $($problemas.Count) problema(s) em data/builds.json - build abortado. Nenhuma build pode citar habilidade/golpe que a especie nao tem."
}

Write-Output ("validate_builds.ps1: OK ({0} builds, todas com habilidade e golpes reais da propria especie)" -f $builds.Count)
