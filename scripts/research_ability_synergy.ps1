# Script de pesquisa/calibracao (NAO faz parte do build.ps1) - lista toda habilidade
# cujo texto real (data/ability_translations_pt.json) contem um bonus de poder por
# categoria de golpe (flag) ou por tipo, pra revisar manualmente antes de codificar o
# mapeamento definitivo em compute_ability_movepool_synergy.ps1 (Fase 3).

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))
$abiPt = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "ability_translations_pt.json") -Raw -Encoding UTF8))

$abilities = $dex.abilities

Write-Output "=== habilidades com padrao 'Aumenta...golpes/tipo...em N.Nx ou N%' ==="
for ($id = 0; $id -lt $abilities.Count; $id++) {
    $desc = $abiPt["$id"]
    if (-not $desc) { continue }
    if ($desc -match '[Aa]umenta[^\n]*(golpes|do tipo|dos tipos)[^\n]*(\d\.\d+x|\d+%)') {
        $name = $abilities[$id][0]
        Write-Output "[$id] $name :: $desc"
        Write-Output "---"
    }
}
