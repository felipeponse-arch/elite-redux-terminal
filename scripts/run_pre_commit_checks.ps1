<#
Roda ANTES de cada commit (git hook local) - garante que o build e a
suite de smoke test inteira passam antes de qualquer commit entrar no
historico. Achado real da auditoria completa da equipe (2026-09-13):
"nada garante que os testes passem antes de publicar" foi a causa raiz
por tras do incidente antigo de publicar o artifact_final.html errado.

Isto e o equivalente LOCAL do workflow do GitHub Actions
(.github/workflows/ci.yml) - roda a mesma suite, do mesmo jeito, mas sem
precisar de nenhum remote configurado. Se um remote existir no futuro, os
dois convivem sem conflito (o Actions roda de novo no push/PR, como uma
segunda camada).

Instalado como .git/hooks/pre-commit (git nunca versiona .git/hooks - por
isso este arquivo fica aqui, versionado, e .git/hooks/pre-commit e só um
shim de 2 linhas que chama ele - ver o comentário no shim).
#>
$ErrorActionPreference = "Stop"
# Achado testando o hook ao vivo pela primeira vez: mensagens com acento
# saiam corrompidas no terminal do git-bash sem isto (encoding padrao do
# console do PowerShell não bate com o que o git-bash espera).
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

# Testes unitarios das regras (src/regras) primeiro: rodam em milissegundos e
# nao precisam de build nem de navegador (item Q3 da pauta tecnica).
$nodeCmdUnit = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmdUnit) {
  $portableRootUnit = Join-Path $env:LOCALAPPDATA "node-portable"
  $foundUnit = Get-ChildItem $portableRootUnit -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($foundUnit) { $env:PATH = "$($foundUnit.FullName);$env:PATH" }
}
# Travas estaticas (fase 1 da refatoracao, 2026-09-24): acento corrompido,
# .ps1 sem BOM, sintaxe, ESLint (correcao) e tipos das regras - ~3s, antes
# de qualquer teste.
Write-Output "--- travas: codificacao, sintaxe, lint e tipos ---"
npm run check --silent
if ($LASTEXITCODE -ne 0) {
  Write-Output ""
  Write-Output "Trava estatica falhou (codificacao, sintaxe, lint ou tipos) - commit bloqueado."
  exit 1
}
Write-Output "--- testes unitarios das regras ---"
npm run test:unit --silent
if ($LASTEXITCODE -ne 0) {
  Write-Output ""
  Write-Output "Testes unitarios falharam - commit bloqueado."
  exit 1
}
Write-Output "--- sabotagem das regras (todo defeito do catalogo tem que ser pego) ---"
npm run test:sabotage --silent
if ($LASTEXITCODE -ne 0) {
  Write-Output ""
  Write-Output "Alguma sabotagem sobreviveu (ou o catalogo esta desatualizado) - commit bloqueado."
  exit 1
}

Write-Output "--- build (SkipExtract - so testa o template/dados ja commitados) ---"
& powershell -NoProfile -File scripts/build.ps1 -SkipExtract
if ($LASTEXITCODE -ne 0) {
  Write-Output ""
  Write-Output "Build falhou - commit bloqueado."
  exit 1
}

# Testes de navegador (fase 6 da refatoracao, 2026-09-24): o Playwright sobe o
# proprio servidor de testes (scripts/servidor_estatico.mjs) e roda em paralelo
# a suite por secao + sequencia completa, os cenarios com recarga, o fuzz de
# saves e a sincronizacao. Falha deixa print + trace em test-results/ e o
# relatorio em playwright-report/ (npm run test:relatorio).
Write-Output "--- testes de navegador (Playwright, projeto funcional) ---"
npm run test:e2e --silent
$testExit = $LASTEXITCODE

if ($testExit -ne 0) {
  Write-Output ""
  Write-Output "Teste de navegador falhou - commit bloqueado. Detalhes: npm run test:relatorio"
  Write-Output "Pra pular isto de propósito (não recomendado): git commit --no-verify"
  exit 1
}

Write-Output ""
Write-Output "Build + suite completa passaram - commit liberado."
exit 0
