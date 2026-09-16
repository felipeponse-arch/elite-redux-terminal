<#
Verificacao agendada da fonte oficial (item I4 da pauta tecnica, 2026-09-16).
Roda check_upstream.ps1 todo dia pelo Agendador do Windows e so INTERROMPE o
usuario quando o dado oficial realmente mudou.

Tres resultados:
  - em dia               -> so log;
  - sem rede / erro      -> so log (check_upstream.ps1 devolve o mesmo exit 1
                            pra "mudou" e pra "nao consegui consultar" - um
                            alerta diario por queda de internet seria ruido);
  - mudou de verdade     -> log + notificacao do Windows.

Registro da tarefa: scripts/scheduled_upstream_check.ps1 -Register
Teste da notificacao (sem consultar nada): -TestNotification
Literais em ASCII (PowerShell 5.1 le .ps1 sem BOM na codepage do sistema).
#>
param(
    [switch]$Register,
    [switch]$TestNotification
)

$LogFile = Join-Path $env:USERPROFILE ".claude\hooks\elite-redux-upstream.log"
$TaskName = "EliteRedux_ChecagemFonteOficial"

function Log($msg) {
    "$(Get-Date -Format o)  $msg" | Add-Content -Path $LogFile -Encoding UTF8
}

function Show-Notification($title, $text) {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $icon = New-Object System.Windows.Forms.NotifyIcon
    $icon.Icon = [System.Drawing.SystemIcons]::Information
    $icon.BalloonTipTitle = $title
    $icon.BalloonTipText = $text
    $icon.Visible = $true
    $icon.ShowBalloonTip(15000)
    Start-Sleep -Seconds 16
    $icon.Dispose()
}

if ($Register) {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PSCommandPath`""
    $trigger = New-ScheduledTaskTrigger -Daily -At "09:10"
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "Elite Redux Terminal: avisa quando o dado oficial do NextDex mudar (item I4 da pauta tecnica)." -Force | Out-Null
    Write-Output "Tarefa $TaskName registrada: todo dia 09:10 (roda depois, se o PC estiver desligado no horario)."
    exit 0
}

if ($TestNotification) {
    Show-Notification "Elite Redux Terminal (TESTE)" "Teste da notificacao da checagem da fonte oficial. Nada mudou."
    Log "teste de notificacao exibido"
    exit 0
}

$check = Join-Path $PSScriptRoot "check_upstream.ps1"
$output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $check 2>&1 | Out-String
$code = $LASTEXITCODE

if ($code -eq 0) {
    Log "em dia"
} elseif ($output -match "ERRO ao consultar|ERRO:") {
    $first = ($output -split "`n" | Where-Object { $_ -match "ERRO" } | Select-Object -First 1).Trim()
    Log "nao consegui consultar a fonte (sem alerta): $first"
} else {
    Log "DADO OFICIAL MUDOU - rodar scripts\check_upstream.ps1 pra ver o relatorio"
    Show-Notification "Elite Redux Terminal" "O dado oficial do NextDex mudou. Builds e sugestoes podem estar desatualizadas - peca ao Claude pra atualizar."
}
