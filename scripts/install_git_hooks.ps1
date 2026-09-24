<#
Instala o hook local de pre-commit (travas, build e suíte completa antes de
qualquer commit entrar no histórico). .git/hooks/ NUNCA é versionado pelo git -
por isso a lógica fica versionada em scripts/verificar.mjs (Node, fase 8 da
refatoração) e este script só grava um shim fino em .git/hooks/pre-commit.
Rode isto uma vez depois de clonar o repositório (ou de novo se o hook sumir).
#>
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$hookPath = Join-Path $root ".git\hooks\pre-commit"

$shim = @"
#!/bin/sh
# Shim fino - a logica real mora em scripts/verificar.mjs (versionado;
# .git/hooks/ nunca e rastreado pelo git). Reinstale com
# scripts/install_git_hooks.ps1 se precisar.
exec node scripts/verificar.mjs
"@

[System.IO.File]::WriteAllText($hookPath, $shim.Replace("`r`n", "`n"), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Hook instalado em $hookPath"
Write-Output "A partir de agora, todo 'git commit' roda as travas, o build (npm run build) e a suite completa antes de aceitar o commit."
Write-Output "Pra pular de proposito (nao recomendado): git commit --no-verify"
