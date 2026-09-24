# Varredura sistemática de tipos no dado bruto do NextDex, 2026-09-10.
#
# Motivo: dois bugs reais encontrados na mesma sessão (evolveChainByX,
# evoConditionText) vieram do mesmo erro - `evolutions[].rs` (o requisito de
# uma evolução) é serializado como STRING no JSON de origem mesmo quando
# representa um número puro (nível), e o código assumia `typeof === "number"`
# silenciosamente sem nunca bater. A Arquiteta de Dados pediu uma varredura
# real, não uma suposição, por todos os outros campos numéricos usados pelo
# app, procurando o mesmo padrão antes que ele morda uma terceira vez.
#
# Não corrige nada - só relata, por campo, quais tipos .NET reais aparecem
# (String/Int32/Double/etc.) através de toda a base de 1906 espécies e 1032
# golpes, e sinaliza quando um campo usado numericamente no app aparece como
# string em qualquer ocorrência.

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$srcPath = Join-Path $dataDir "gameData_265beta.json"

$ser = New-GameDataParser
$json = Get-Content $srcPath -Raw -Encoding UTF8
$data = $ser.DeserializeObject($json)

function Get-TypeName($v) {
    if ($null -eq $v) { return "null" }
    return $v.GetType().Name
}

# campo -> conjunto de tipos observados -> contagem
$report = @{}
function Note([string]$field, $value) {
    $t = Get-TypeName $value
    if (-not $report.ContainsKey($field)) { $report[$field] = @{} }
    if (-not $report[$field].ContainsKey($t)) { $report[$field][$t] = 0 }
    $report[$field][$t]++
}

Write-Output "--- especies (stats, evolucoes, golpes por nivel) ---"
$speciesChecked = 0
foreach ($s in $data.species) {
    $name = $s["name"]
    if (-not $name -or $name -eq "??????????") { continue }
    $speciesChecked++
    $st = $s["stats"]
    Note "dex.id" $s["dex"]["id"]
    foreach ($b in @($st["base"])) { Note "stats.base[]" $b }
    foreach ($t in @($st["types"])) { Note "stats.types[]" $t }
    foreach ($a in @($st["abis"])) { Note "stats.abis[]" $a }
    foreach ($i in @($st["inns"])) { Note "stats.inns[]" $i }
    foreach ($e in @($s["evolutions"])) {
        Note "evolutions[].kd" $e["kd"]
        Note "evolutions[].rs" $e["rs"]
        Note "evolutions[].in" $e["in"]
    }
    foreach ($mv in @($s["levelUpMoves"])) {
        Note "levelUpMoves[].lv" $mv["lv"]
        Note "levelUpMoves[].id" $mv["id"]
    }
    foreach ($tu in @($s["tutor"])) { Note "tutor[]" $tu }
    foreach ($tm in @($s["TMHMMoves"])) { Note "TMHMMoves[]" $tm }
}
Write-Output "especies verificadas: $speciesChecked"

Write-Output "--- golpes ---"
$movesChecked = 0
foreach ($m in $data.moves) {
    $movesChecked++
    foreach ($t in @($m["types"])) { Note "moves.types[]" $t }
    Note "moves.split" $m["split"]
    Note "moves.pwr" $m["pwr"]
    Note "moves.acc" $m["acc"]
    Note "moves.pp" $m["pp"]
}
Write-Output "golpes verificados: $movesChecked"

Write-Output "--- habilidades ---"
$abisChecked = 0
foreach ($a in $data.abilities) {
    $abisChecked++
    Note "abilities.id" $a["id"]
}
Write-Output "habilidades verificadas: $abisChecked"

Write-Output ""
Write-Output "=== RELATORIO: tipos .NET observados por campo ==="
foreach ($field in ($report.Keys | Sort-Object)) {
    $types = $report[$field]
    $typeList = ($types.Keys | Sort-Object | ForEach-Object { "$_=$($types[$_])" }) -join ", "
    $flag = if ($types.Keys.Count -gt 1) { "  <<< TIPOS MISTOS" } elseif ($types.Keys -contains "String") { "  <<< SEMPRE STRING" } else { "" }
    Write-Output ("{0,-22} {1}{2}" -f $field, $typeList, $flag)
}
