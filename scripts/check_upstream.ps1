<#
Compares our local game-data snapshot against the live NextDex, so a new Elite
Redux build does not go unnoticed. Checks two things:

  1. Is our version (VERSAO_DEX in scripts/alarme_upstream.mjs, the single source) still the version the official dex defaults to? (the dex picks
     the LAST entry of allVersions in static/js/data_version.js)
  2. Is our snapshot byte-identical to the remote file for that version?

Exit code 0 = in sync, 1 = drifted (so it can gate a build or a scheduled run).
Read-only: never overwrites the snapshot. To actually update, re-download
gameDataV<version>.json into data/ and re-run build.ps1 WITHOUT -SkipExtract,
then re-run expand_combo_abilities.ps1.
#>

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$localPath = Join-Path $dataDir "gameData.json"
# Version: single source is VERSAO_DEX in alarme_upstream.mjs (path relative to this script, not to the current directory).
$OUR_VERSION = (& node --input-type=module -e "import { pathToFileURL } from 'node:url'; const m = await import(pathToFileURL(process.argv[1]).href); console.log(m.VERSAO_DEX)" (Join-Path $PSScriptRoot "alarme_upstream.mjs") | Select-Object -First 1)
if ($LASTEXITCODE -ne 0 -or -not $OUR_VERSION) { throw "could not read VERSAO_DEX from scripts/alarme_upstream.mjs" }
$OUR_VERSION = "$OUR_VERSION".Trim()
$base = "https://raw.githubusercontent.com/ForwardFeed/ER-nextdex/main"

$drift = $false
$wc = New-Object System.Net.WebClient

Write-Output "--- versao padrao do dex oficial ---"
try {
    $verJs = $wc.DownloadString("$base/static/js/data_version.js")
    $m = [regex]::Match($verJs, 'allVersions\s*=\s*\[(.*?)\]', 'Singleline')
    if ($m.Success) {
        $versions = [regex]::Matches($m.Groups[1].Value, '"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
        $latest = $versions[-1]
        if ($latest -eq $OUR_VERSION) {
            Write-Output "  OK: continua '$latest'"
        } else {
            Write-Output "  MUDOU: dex agora usa '$latest', nosso snapshot e '$OUR_VERSION'"
            $drift = $true
        }
    } else {
        Write-Output "  AVISO: nao consegui ler allVersions (formato do arquivo mudou?)"
        $drift = $true
    }
} catch {
    Write-Output "  ERRO ao consultar: $($_.Exception.Message)"
    $drift = $true
}

Write-Output "--- conteudo do snapshot ---"
if (-not (Test-Path $localPath)) {
    Write-Output "  ERRO: snapshot local ausente ($localPath)"
    exit 1
}
$localBytes = (Get-Item $localPath).Length
try {
    $remote = $wc.DownloadData("$base/static/js/data/gameDataV$OUR_VERSION.json")
    Write-Output "  local:  $localBytes bytes"
    Write-Output "  remoto: $($remote.Length) bytes"
    if ($remote.Length -ne $localBytes) {
        Write-Output "  MUDOU: tamanhos diferentes - dados de $OUR_VERSION foram atualizados"
        $drift = $true
    } else {
        $localHash = (Get-FileHash $localPath -Algorithm SHA256).Hash
        $sha = [System.Security.Cryptography.SHA256]::Create()
        $remoteHash = ([System.BitConverter]::ToString($sha.ComputeHash($remote)) -replace '-', '')
        if ($localHash -eq $remoteHash) {
            Write-Output "  OK: identico (sha256 $($localHash.Substring(0,12))...)"
        } else {
            Write-Output "  MUDOU: mesmo tamanho, conteudo diferente"
            $drift = $true
        }
    }
} catch {
    Write-Output "  ERRO ao baixar: $($_.Exception.Message)"
    $drift = $true
}

Write-Output ""
if ($drift) {
    Write-Output "RESULTADO: dados DESATUALIZADOS ou inconclusivos - revisar antes de confiar na ferramenta."
    exit 1
} else {
    Write-Output "RESULTADO: em dia."
    exit 0
}
