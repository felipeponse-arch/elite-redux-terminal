<#
Classifica o PAPEL de cada golpe de status (cura / setup / pivo / hazard /
protecao / suporte) a partir do EFEITO real do jogo, nao do nome.

Pedido do usuario, 2026-09-16: "verificar se estamos considerando o que um
move faz - notei que esta sugerindo Roost em uma build super ofensiva". Ate
aqui a build por IA recebia so o NOME do golpe e tinha que lembrar de
memoria o que ele faz - e neste hack golpes podem mudar. O dado bruto tem o
efeito de cada golpe (campo `eff`, indice em `effT`, ex: Roost -> "Roost",
Swords Dance -> "Attack Up 2"), entao a classificacao sai dele.

Ordem de decisao:
  1. Lista explicita por nome de efeito (cobre os efeitos classicos).
  2. Fallback por descricao + alvo, pra efeitos proprios deste hack que nao
     estao na lista (ex: "Shelter", "Showtime"): alvo = USER e a
     descricao fala em aumentar stat -> setup; descricao fala em restaurar
     HP do usuario -> cura; fala em sair de campo -> pivo. Golpe em que o
     usuario DESMAIA (Healing Wish, Lunar Dance) nunca e cura - cura quem entra.
     Achado ao auditar a saida: neste hack Heal Bell/Aromatherapy/Refresh curam
     HP do usuario de verdade (30%/25%), entao contam como cura - justamente o
     tipo de diferenca que decorar golpe de memoria erraria.
  3. O resto vira "suporte" (status no alvo, clima, terreno, telas...).

So golpes de STATUS entram. Golpe de dano que cura (Drain Punch) continua
sendo golpe de dano - o que importa pra regra de coerencia e se o slot causa
dano ou nao.

Literais em ASCII de proposito (mesma licao de compute_species_role.ps1:
PowerShell 5.1 le .ps1 sem BOM na codepage do sistema). O rotulo acentuado
e responsabilidade da camada JS (MOVE_ROLE_LABEL_PT).

Output: data/move_roles.json, { "<id do golpe>": "cura" | "setup" | ... }.
#>

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser
$raw = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "gameData_265beta.json") -Raw -Encoding UTF8))

$effT = @($raw["effT"])
$targetT = @($raw["targetT"])
$splitT = @($raw["splitT"])
$statusSplit = [array]::IndexOf($splitT, "STATUS")
if ($statusSplit -lt 0) { $statusSplit = 2 }

$CURA = @("Restore Hp", "Softboiled", "Roost", "Moonlight", "Morning Sun", "Synthesis", "Shore Up",
    "Rest", "Wish", "Strength Sap", "Jungle Healing", "Swallow", "Aqua Ring", "Ingrain", "Pain Split")
$SETUP = @("Attack Up 2", "Attack Accuracy Up", "Attack Spatk Up", "Bulk Up", "Calm Mind", "Coil",
    "Dragon Dance", "Quiver Dance", "Shell Smash", "Shift Gear", "Victory Dance", "Belly Drum", "Geomancy",
    "Growth", "Howl", "No Retreat", "Clangorous Soul", "Fillet Away", "Tidy Up", "Take Heart", "Charge",
    "Focus Energy", "Laser Focus", "Cosmic Power", "Stockpile", "Curse", "Autotomize", "Meditate", "Sharpen",
    "Defense Up", "Defense Up 2", "Defense Up 3", "Special Attack Up 2", "Special Attack Up 3",
    "Special Defense Up 2", "Speed Up 2", "Evasion Up", "Minimize", "Defense Curl", "Barrier",
    "Acupressure", "Stuff Cheeks", "Gear Up", "Magnetic Flux")
$PIVO = @("Switch Argument", "Parting Shot", "Baton Pass", "Shed Tail", "Chilly Reception", "Septic Switch")
$HAZARD = @("Spikes", "Toxic Spikes", "Stealth Rock", "Sticky Web", "Caltrops")
$PROTECAO = @("Protect", "Endure", "Substitute")
# So tem efeito em batalha DUPLA (item P3 da pauta tecnica, 2026-09-16) - o
# alvo e um aliado, ou a funcao e redirecionar/reordenar entre 4 Pokemon.
# Conferido pela descricao real de cada golpe neste hack: Protect, Wide Guard,
# Quick Guard, Aromatic Mist e Gear Up ficaram FORA porque aqui tambem afetam
# o proprio usuario e funcionam no 1x1.
$DUPLA = @("Follow Me", "Helping Hand", "Ally Switch", "After You", "Instruct", "Quash", "Coaching", "Heal Pulse")

# Chave = POSICAO do golpe na lista, nao o campo `id`. E a posicao que as
# especies usam pra referenciar golpes (e o que o NextDex oficial faz:
# gameData.moves[moveID]); o `id` bruto diverge em 3 golpes (Jetstream Burst,
# Sky Quake, Toxic Terrain). A primeira versao deste script usou `id` - achado
# por scripts/validate_data_invariants.ps1 no mesmo dia.
$out = [ordered]@{}
$counts = @{}
$moves = @($raw["moves"])
for ($idx = 0; $idx -lt $moves.Count; $idx++) {
    $m = $moves[$idx]
    if (-not $m) { continue }
    if ($m["split"] -ne $statusSplit) { continue }
    $name = [string]$m["name"]
    if (-not $name -or $name -eq "-") { continue }
    $eff = if ($m["eff"] -ge 0 -and $m["eff"] -lt $effT.Count) { [string]$effT[$m["eff"]] } else { "" }
    $target = if ($m["target"] -ge 0 -and $m["target"] -lt $targetT.Count) { [string]$targetT[$m["target"]] } else { "" }
    $desc = ([string]$m["desc"] + " " + [string]$m["lDesc"])

    $role = $null
    if ($DUPLA -contains $eff) { $role = "dupla" }
    elseif ($CURA -contains $eff) { $role = "cura" }
    elseif ($SETUP -contains $eff) { $role = "setup" }
    elseif ($PIVO -contains $eff) { $role = "pivo" }
    elseif ($HAZARD -contains $eff) { $role = "hazard" }
    elseif ($PROTECAO -contains $eff) { $role = "protecao" }
    elseif ($desc -match "(?i)\bfaints?\b") { $role = "suporte" }
    elseif ($target -eq "USER" -and $desc -match "(?i)\b(switch(es)?|bows out)\b") { $role = "pivo" }
    elseif ($target -eq "USER" -and $desc -match "(?i)\b(restores?|heals?)\b.*\bHP\b") { $role = "cura" }
    elseif ($target -eq "USER" -and $desc -match "(?i)\b(raises?|boosts?|increases?)\b") { $role = "setup" }
    else { $role = "suporte" }

    $out[[string]$idx] = $role
    $counts[$role] = 1 + [int]$counts[$role]
}

$sb = New-Object System.Text.StringBuilder
Write-JsonValue $sb $out
[System.IO.File]::WriteAllText((Join-Path $dataDir "move_roles.json"), $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))

Write-Output ("compute_move_roles.ps1: " + $out.Count + " golpes de status classificados")
foreach ($k in ($counts.Keys | Sort-Object)) { Write-Output ("  " + $k + ": " + $counts[$k]) }
