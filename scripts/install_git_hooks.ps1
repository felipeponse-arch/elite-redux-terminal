<#
Instala o hook local de pre-commit (build + suite de smoke test completa
antes de qualquer commit entrar no histórico). .git/hooks/ NUNCA é
versionado pelo git - por isso o hook em si (scripts/run_pre_commit_checks.ps1)
fica versionado aqui, e este script só copia um shim fino de 3 linhas pra
dentro de .git/hooks/pre-commit. Rode isto uma vez depois de clonar o
repositório (ou de novo se .git/hooks/pre-commit sumir por qualquer motivo).
#>
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$hookPath = Join-Path $root ".git\hooks\pre-commit"

$shim = @"
#!/bin/sh
# Shim fino - a logica real mora em scripts/run_pre_commit_checks.ps1
# (versionado; .git/hooks/ nunca e rastreado pelo git, por isso este
# arquivo so existe localmente - reinstale com scripts/install_git_hooks.ps1
# se precisar).
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run_pre_commit_checks.ps1
exit `$?
"@

[System.IO.File]::WriteAllText($hookPath, $shim.Replace("`r`n", "`n"), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Hook instalado em $hookPath"
Write-Output "A partir de agora, todo 'git commit' roda build.ps1 -SkipExtract + a suite completa antes de aceitar o commit."
Write-Output "Pra pular de proposito (nao recomendado): git commit --no-verify"
