<#
Prepara artifact_final.html pra publicação - único caminho aceito pra
publicar (item I3 da pauta técnica, 2026-09-16).

Recusa publicar quando:
  1. a pasta tem mudança não commitada (o que vai ao ar tem que ser um commit);
  2. o commit atual não está no GitHub (origin/master) - o que vai ao ar
     precisa ter cópia fora da máquina e ter passado pelo CI;
  3. o build ou a suíte de testes falham;
  4. a versão gravada no cabeçalho do app não é o commit atual.

Não publica sozinho: a publicação é feita pela ferramenta Artifact, com o
caminho que este script imprime no final. Motivo histórico: o projeto já
publicou o arquivo errado uma vez (template no lugar do final).

Uso: powershell -File scripts/prepare_publish.ps1
#>
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Fail($msg) {
    Write-Output ""
    Write-Output "PUBLICACAO RECUSADA: $msg"
    exit 1
}

Write-Output "--- 1/4 pasta sem mudancas pendentes ---"
$dirty = & git status --porcelain
if ($dirty) { Fail "ha mudancas nao commitadas:`n$($dirty -join "`n")" }

Write-Output "--- 2/4 commit atual esta no GitHub ---"
& git fetch origin --quiet
if ($LASTEXITCODE -ne 0) { Fail "nao consegui falar com o GitHub (git fetch falhou)." }
$head = (& git rev-parse HEAD).Trim()
$remote = (& git rev-parse origin/master).Trim()
if ($head -ne $remote) {
    $ahead = (& git rev-list --count "origin/master..HEAD").Trim()
    Fail "o commit atual ($($head.Substring(0,7))) nao e o do GitHub ($($remote.Substring(0,7))); $ahead commit(s) local(is) sem push. Faca git push e espere o CI."
}

Write-Output "--- 3/4 build + suite completa ---"
# Quem decide e o codigo de saida. Com "Stop", qualquer linha no stderr do
# processo filho (ex: aviso do Node no servidor que o Playwright sobe, fase 6)
# virava erro fatal aqui no PowerShell 5.1 - mesmo com todos os testes passando.
$ErrorActionPreference = "Continue"
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "run_pre_commit_checks.ps1") 2>&1 | ForEach-Object { "$_" }
$saidaTestes = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($saidaTestes -ne 0) { Fail "build ou testes falharam (saida acima)." }

Write-Output "--- 4/4 versao gravada no app ---"
$short = (& git rev-parse --short HEAD).Trim()
$outPath = Join-Path $root "artifact_final.html"
$html = [System.IO.File]::ReadAllText($outPath, [System.Text.Encoding]::UTF8)
# Regex so com ASCII: PowerShell 5.1 le .ps1 sem BOM na codepage do sistema,
# entao um literal acentuado aqui nunca bateria com o HTML em UTF-8.
if ($html -notmatch ('id="app-version"[^>]*>' + [regex]::Escape($short) + '</span>')) {
    Fail "o cabecalho do app nao mostra a versao $short (build de outro estado?)."
}

Write-Output ""
Write-Output "PRONTO PARA PUBLICAR: versao $short"
Write-Output "Arquivo: $outPath"
