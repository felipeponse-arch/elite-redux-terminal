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

# Campos de procedencia (item M1 da pauta tecnica, 2026-09-16) - so fatos que
# NAO saem do proprio dado: de onde a build veio, contra qual versao do jogo
# foi validada, e o formato quando a fonte deixa explicito. Modo de mega e
# nivel-alvo ficaram de fora de proposito: saem do item e do movepool, e uma
# copia guardada so abriria espaco pra divergir.
$FONTES = @("discord-build-workshop-2.65", "discord-movesets", "curadoria-do-projeto", "ia-curada-playtester")
$FORMATOS = @("1x1", "dupla")
# Estilo (2026-09-24): uma espécie pode ter ate 3 curadas, uma por estilo. O
# valor de builds.json pode ser um objeto (1 build) ou uma lista - o app
# normaliza os dois em curadasDe() (src/regras/plano_build.js).
$ESTILOS = @("ofensivo", "equilibrado", "defensivo")
$versaoDoDado = [string]$dex["meta"]["version"]
$problemas = New-Object System.Collections.ArrayList
$totalBuilds = 0
$entradas = New-Object System.Collections.ArrayList
foreach ($snameChave in $builds.Keys) {
    $valor = $builds[$snameChave]
    # @() de um dicionario da 1 elemento; de uma lista, os elementos dela.
    $lista = @($valor)
    if ($lista.Count -gt 3) { [void]$problemas.Add("$snameChave : $($lista.Count) builds - maximo 3 (uma por estilo)") }
    $estilosVistos = @{}
    foreach ($b in $lista) {
        if ($b.ContainsKey("estilo")) {
            $e = [string]$b["estilo"]
            if ($ESTILOS -notcontains $e) { [void]$problemas.Add("$snameChave : estilo '$e' invalido (use: $($ESTILOS -join ', '))") }
            elseif ($estilosVistos.ContainsKey($e)) { [void]$problemas.Add("$snameChave : duas builds com estilo '$e'") }
            else { $estilosVistos[$e] = $true }
        }
        [void]$entradas.Add(@($snameChave, $b))
    }
}
foreach ($par in $entradas) {
    $sname = $par[0]
    $b = $par[1]
    $totalBuilds++
    if ($FONTES -notcontains [string]$b["fonte"]) {
        [void]$problemas.Add("$sname : fonte '$($b["fonte"])' invalida (use: $($FONTES -join ', '))")
    }
    if (-not $b["versao"]) {
        [void]$problemas.Add("$sname : sem campo versao (contra qual versao do jogo a build foi validada)")
    } elseif ([string]$b["versao"] -ne $versaoDoDado) {
        [void]$problemas.Add("$sname : validada contra $($b["versao"]), mas o dado atual e $versaoDoDado - revisar a build antes de atualizar o campo")
    }
    if ($b.ContainsKey("formato") -and ($FORMATOS -notcontains [string]$b["formato"])) {
        [void]$problemas.Add("$sname : formato '$($b["formato"])' invalido (use: $($FORMATOS -join ', '))")
    }
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
    # Plano de golpes (build promovida da IA): golpe de agora dentro do set,
    # destino aprendido de verdade pela especie.
    if ($b.ContainsKey("plano") -and $b["plano"]) {
        foreach ($de in $b["plano"].Keys) {
            $para = [string]$b["plano"][$de]
            if (-not $vistos.Contains([string]$de)) { [void]$problemas.Add("$sname : plano parte de '$de', que nao esta no set") }
            if (-not $golpePorSname[$sname].Contains($para)) { [void]$problemas.Add("$sname : plano leva a '$para', que esta especie nao aprende") }
        }
    }
}

if ($problemas.Count -gt 0) {
    Write-Output ""
    foreach ($p in $problemas) { Write-Output "  !! $p" }
    throw "validate_builds.ps1: $($problemas.Count) problema(s) em data/builds.json - build abortado. Nenhuma build pode citar habilidade/golpe que a especie nao tem."
}

Write-Output ("validate_builds.ps1: OK ({0} builds em {1} especies, todas com habilidade e golpes reais da propria especie, fonte e versao {2})" -f $totalBuilds, $builds.Count, $versaoDoDado)
