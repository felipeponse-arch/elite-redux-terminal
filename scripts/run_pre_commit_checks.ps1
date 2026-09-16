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
Write-Output "--- testes unitarios das regras ---"
npm run test:unit --silent
if ($LASTEXITCODE -ne 0) {
  Write-Output ""
  Write-Output "Testes unitarios falharam - commit bloqueado."
  exit 1
}

Write-Output "--- build (SkipExtract - so testa o template/dados ja commitados) ---"
& powershell -NoProfile -File scripts/build.ps1 -SkipExtract
if ($LASTEXITCODE -ne 0) {
  Write-Output ""
  Write-Output "Build falhou - commit bloqueado."
  exit 1
}

# Reusa um dev server que já esteja de pé (ex: sessão interativa de dev)
# em vez de sempre subir um novo - evita acumular processos órfãos se um
# hook anterior não conseguiu derrubar o dele por algum motivo.
$serverAlreadyUp = $false
try {
  Invoke-WebRequest -Uri "http://localhost:8100/artifact_final.html" -UseBasicParsing -TimeoutSec 2 | Out-Null
  $serverAlreadyUp = $true
  Write-Output "--- dev server ja estava rodando na 8100, reusando ---"
} catch {}

$serverProc = $null
if (-not $serverAlreadyUp) {
  Write-Output "--- subindo dev server em segundo plano ---"
  $serverProc = Start-Process powershell -ArgumentList "-NoProfile", "-File", "scripts/dev_server.ps1" -WindowStyle Hidden -PassThru
  # da um tempo pro HttpListener subir antes do teste tentar conectar -
  # o driver Playwright (tests/run_ci_smoke.mjs) já faz polling por conta
  # própria, isto e só uma folga extra pra não gastar esse polling à toa.
  Start-Sleep -Milliseconds 500
}

$testExit = 1
try {
  # localiza o Node portátil desta sessão se `node` não estiver no PATH
  # do usuário (ver feedback_dev_server_launch_json.md - este projeto já
  # teve mais de um problema de "ferramenta não está onde eu esperava").
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  if (-not $nodeCmd) {
    $portableRoot = Join-Path $env:LOCALAPPDATA "node-portable"
    $found = Get-ChildItem $portableRoot -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $env:PATH = "$($found.FullName);$env:PATH" }
  }
  Write-Output "--- rodando scripts/smoke_test_suite.js (Parte A) headless ---"
  npm run test:ci
  $testExit = $LASTEXITCODE
} finally {
  if ($serverProc) {
    Write-Output "--- parando o dev server que este hook subiu ---"
    try { Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue } catch {}
  }
}

if ($testExit -ne 0) {
  Write-Output ""
  Write-Output "Smoke test falhou - commit bloqueado."
  Write-Output "Pra pular isto de propósito (não recomendado): git commit --no-verify"
  exit 1
}

Write-Output ""
Write-Output "Build + suite completa passaram - commit liberado."
exit 0
