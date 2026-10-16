# Estudo todas-as-lutas/02 (16/10/2026): roda à noite a simulação completa (~2h20, todos os núcleos, prioridade baixa) e já
# compara as divisões de peso (igual, 50/50, 60/40, 70/30) com o rank só de chefões. Não muda nada no app nem em data/.
# Resultado: <pasta acima do projeto>\fatias\comparacao.txt
# Uso (na pasta do projeto): powershell -ExecutionPolicy Bypass -File scripts\estudo\rodar_fatias_a_noite.ps1
$ErrorActionPreference = "Stop"
$raiz = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $raiz
$fora = Split-Path $raiz -Parent
$pasta = Join-Path $fora "fatias"
if (-not (Test-Path $pasta)) { New-Item -ItemType Directory -Path $pasta | Out-Null }
$inicio = Get-Date
Write-Output "Início: $($inicio.ToString('HH:mm')). Leva umas 2h20; pode deixar o PC ligado."
node scripts\estudo\lutas_comuns.mjs (Join-Path $fora "lutas_comuns.json")
if ($LASTEXITCODE -ne 0) { throw "lutas_comuns.mjs falhou" }
node scripts\calcular_rank_v2.mjs "--lutas-extra=$(Join-Path $fora 'lutas_comuns.json')" "--saida=$(Join-Path $pasta 'todas.json')" "--por-luta=$(Join-Path $pasta 'por_luta.json')" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "calcular_rank_v2.mjs falhou" }
node scripts\estudo\fatias_de_peso.mjs (Join-Path $pasta "por_luta.json") $pasta "igual,0.5,0.6,0.7"
if ($LASTEXITCODE -ne 0) { throw "fatias_de_peso.mjs falhou" }
$saida = Join-Path $pasta "comparacao.txt"
"Comparação das divisões de peso (chefões x lutas comuns) contra o rank só de chefões - $(Get-Date -Format 'dd/MM HH:mm')" | Out-File $saida -Encoding utf8
foreach ($f in "igual", "0.5", "0.6", "0.7") {
    "`n######## fatia dos chefões: $f ########" | Out-File $saida -Append -Encoding utf8
    node scripts\estudo\comparar_ranks.mjs (Join-Path $fora "estudo_base.json") (Join-Path $pasta "fatia_$f.json") (Join-Path $pasta "fatia_$($f)_pesos.json") | Out-File $saida -Append -Encoding utf8
}
$min = [int]((Get-Date) - $inicio).TotalMinutes
Write-Output "PRONTO em $min min: $saida"
