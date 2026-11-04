<#
Cruzamento final: habilidades condicionais (catálogo verificado à mão contra
o texto real de cada uma - a mesma disciplina de FLAG_PHRASES em
compute_ability_movepool_synergy.ps1) x golpes reais que a PRÓPRIA espécie
aprende e que ATIVAM a condição sozinha - sem depender de outro membro do
time pro clima, sem depender de item pra se machucar. Pedido do usuário,
2026-09-20/21: "entender a sinergia e eficiência de cada habilidade com cada
move" + "juntamos isso com as habilidades".

Diferente de compute_ability_movepool_synergy.ps1 (que cruza habilidade x
CATEGORIA de golpe - Transistor + golpes Electric, por exemplo), isto cruza
habilidade CONDICIONAL x golpe que CRIA a própria condição - uma classe de
sinergia inteira que aquele script não cobre (ele só olha "a espécie tem
golpe da categoria que a habilidade bonifica", nunca "a espécie consegue
sozinha satisfazer a condição que ativa a habilidade").

Catálogo de habilidades abaixo é um SUBCONJUNTO pequeno e deliberado das ~69
habilidades que multiplicam o próprio stat (achadas por regex numa pesquisa
anterior, nunca persistidas por não serem o produto final) - só as que têm
uma condição CLARAMENTE mapeável pra um efeito de golpe real (clima, HP
baixo) entraram aqui. Cada entrada foi conferida à mão contra
data/ability_translations_pt.json antes de entrar nesta lista - nunca
gerada por regex cego.

Calcula sozinho o efeito real de cada golpe (texto de data/move_translations_pt.json);
não depende de arquivo intermediário.
#>

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))
$pt = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "move_translations_pt.json") -Raw -Encoding UTF8))

# --- Efeito real de cada golpe, calculado aqui (TK-15 D3.1, 29/10: antes era um JSON intermediário,
# gerado por compute_move_effects.ps1; fundido porque este era o único leitor e o app em execução não o usa).
# Lógica e histórico de correções: ver git log de scripts/compute_move_effects.ps1. ---
# Canonicaliza a palavra achada pro nome oficial do status (várias flexões
# apontam pro mesmo canônico - "queima"/"queimadura"/"queimar" -> "queimadura").
# Achado real ao rodar isto pela primeira vez (comparado contra a saída do
# protótipo em Node, que já tinha sido verificada linha a linha): o número
# de golpes com efeito batia errado (415 aqui contra 482 no protótipo) -
# causa raiz é o mesmo aviso já documentado em scripts/validar_dados.mjs
# ("PowerShell 5.1 lê .ps1 sem BOM na codepage do sistema") - toda letra
# acentuada escrita DIRETO no código deste arquivo (não vinda do JSON lido
# com -Encoding UTF8) corrompe ao rodar via `-File` (confirmado: "confusão"
# saiu "confusÃ£o" no JSON de teste - mojibake). Testada primeiro a classe de caractere
# [áa]/[ãa] (mesmo estilo já usado em Score-AbilityText, common.ps1), mas
# não é suficiente aqui: se o PRÓPRIO acento no arquivo corrompe pra 2
# bytes/caracteres errados, nem o "á" nem o "a" dentro do "[áa]" batem com o
# "á" de verdade vindo do JSON. Correção real: todo PADRÃO DE REGEX troca a
# letra acentuada por `.` (curinga, casa qualquer caractere naquela posição -
# imune a qual for a corrupção), e todo valor de SAÍDA acentuado (a chave
# "confusão" do dicionário abaixo) é construído por código de caractere
# ([char]0x00E3), nunca digitado como literal. A captura de texto real do
# JSON (o que vira `stat`/`valor` na saída pros golpes com stat citado) não
# depende de nada disto - vem sempre correta do arquivo de dado, só os
# LITERAIS deste .ps1 dependiam.
$CONFUSAO = "confus" + [char]0x00E3 + "o"
$STATUS_WORDS = [ordered]@{
    "paralisar" = "paralisia"; "paralisia" = "paralisia"
    "queima" = "queimadura"; "queimadura" = "queimadura"; "queimar" = "queimadura"
    "envenena" = "veneno"; "veneno" = "veneno"; "envenenar" = "veneno"
    "confus" = $CONFUSAO
    "dormir" = "sono"; "sono" = "sono"; "adormece" = "sono"
    "congela" = "congelamento"; "congelamento" = "congelamento"
    "flinch" = "flinch"
}
$STAT_ALVO_PATTERN = "Ataque Especial|SpAtk|Defesa Especial|SpDef|Ataque|Atk|Defesa|Def|Velocidade|Spe|Evas[ãa]o|Precis[ãa]o|status"

function Get-MoveEffects([string]$d, [string]$split) {
    # `,$efeitos` (não só `$efeitos`) em TODO return deste bloco - gotcha
    # real do PowerShell achado ao rodar isto pela primeira vez: `return
    # $colecao` desenrola a coleção pro pipeline (um item por vez); se ela
    # estiver VAZIA (a maioria dos golpes - dano puro, sem efeito
    # secundário), zero itens são emitidos e quem chama recebe $null em vez
    # de uma coleção vazia, quebrando `.ToArray()` mais adiante com "não é
    # possível chamar um método em valor nulo". A vírgula força a coleção
    # inteira a viajar como UM valor só, não N valores desenrolados.
    $efeitos = New-Object System.Collections.ArrayList
    if (-not $d) { return ,$efeitos }

    $temCuraVerbo = $d -imatch '\bcura(m|r|do|da)?\b|\brecupera(m)?\b|\brestaura(m)?\b'
    $temNegacao = $d -imatch '\bimpede\b|\bbloqueia\b|\bevita\b|\bprevine\b'

    $canonicaisVistos = New-Object System.Collections.Generic.HashSet[string]
    foreach ($w in $STATUS_WORDS.Keys) {
        $canon = $STATUS_WORDS[$w]
        if ($canonicaisVistos.Contains($canon)) { continue }
        $m = [regex]::Match($d, $w, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if (-not $m.Success) { continue }
        [void]$canonicaisVistos.Add($canon)
        $janelaIni = [Math]::Max(0, $m.Index - 40)
        $janela = $d.Substring($janelaIni, [Math]::Min(80, $d.Length - $janelaIni))
        if ($temCuraVerbo -and $canon -ne "flinch") {
            # "Cura queimaduras/veneno/etc" - remove o status, não causa.
            [void]$efeitos.Add([ordered]@{ tipo = "remove_status"; valor = $canon })
            continue
        }
        $pctMatch = [regex]::Match($janela, '(\d+)\s*%')
        $pct = $null
        if ($pctMatch.Success) { $pct = [int]$pctMatch.Groups[1].Value }
        $condicional = if ($null -ne $pct) { $pct -lt 100 } else { ($janela -imatch '\bpode\b') -or ($janela -imatch '\bchance\b') }
        [void]$efeitos.Add([ordered]@{ tipo = "status"; valor = $canon; condicional = $condicional; percentualExato = $pct })
    }
    if ($temNegacao -and $temCuraVerbo) {
        # "Impede...de recuperar HP" - bloqueia a cura ALHEIA, não é cura própria.
        [void]$efeitos.Add([ordered]@{ tipo = "bloqueia_cura_do_oponente" })
    }

    # Mudança de stat - o alvo (usuário/oponente) é procurado na descrição
    # INTEIRA (não numa janela de caracteres - achado real: o alvo às vezes
    # fica numa frase anterior, ou mais de 20 caracteres antes/depois do
    # verbo, e essas descrições são curtas o bastante pra isso não confundir
    # golpes que citam os dois papéis em cláusulas diferentes).
    $boostMatches = [regex]::Matches($d, "(aumenta|eleva|reduz|diminui)[^.]*?($STAT_ALVO_PATTERN)", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    foreach ($m in $boostMatches) {
        $verbo = $m.Groups[1].Value.ToLower()
        $direcao = if ($verbo -eq "aumenta" -or $verbo -eq "eleva") { "sobe" } else { "desce" }
        $janelaIni = [Math]::Max(0, $m.Index - 20)
        $janelaFim = [Math]::Min($d.Length, $m.Index + $m.Length + 20)
        $janelaBrusc = $d.Substring($janelaIni, $janelaFim - $janelaIni)
        $bruscamente = $janelaBrusc -imatch 'bruscamente|drasticamente'
        $alvo = "ambiguo (sem alvo explicito no texto)"
        if ($d -imatch '\boponente(s)?\b') { $alvo = "oponente" }
        elseif ($d -imatch '\busu.rio\b|\bpr.prio\b|\bpr.pria\b') { $alvo = "usuario" }
        [void]$efeitos.Add([ordered]@{
            tipo = "stat"; stat = $m.Groups[2].Value; direcao = $direcao
            intensidade = if ($bruscamente) { "2+ estagios (bruscamente)" } else { "nao especificado" }
            alvo = $alvo
        })
    }

    if ($d -imatch 'golpeia.*(duas vezes|dois golpes)') { [void]$efeitos.Add([ordered]@{ tipo = "multi_hit"; vezes = 2 }) }
    if ($d -imatch '\b(2 a 5 vezes|duas a cinco vezes)\b') { [void]$efeitos.Add([ordered]@{ tipo = "multi_hit"; vezes = "2-5" }) }
    if ($d -imatch 'fere (tamb.m )?o usu.rio|recuo|tamb.m fere') { [void]$efeitos.Add([ordered]@{ tipo = "recuo" }) }
    if ((-not $temNegacao) -and ($d -imatch 'cura|recupera.*HP|restaura.*HP')) { [void]$efeitos.Add([ordered]@{ tipo = "cura_propria" }) }
    if ($d -imatch 'rouba.*(HP|dano)|absorve') { [void]$efeitos.Add([ordered]@{ tipo = "dreno" }) }
    $climaMatch = [regex]::Match($d, 'invoca (chuva|sol|areia|granizo|neblina)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($climaMatch.Success) { [void]$efeitos.Add([ordered]@{ tipo = "clima"; qual = $climaMatch.Groups[1].Value.ToLower() }) }
    if ($d -imatch 'invoca.*terrain|Terrain\b') { [void]$efeitos.Add([ordered]@{ tipo = "terrain" }) }
    if ($d -imatch 'im.vel no turno seguinte|precisa recarregar|recarrega') { [void]$efeitos.Add([ordered]@{ tipo = "recarga" }) }
    if ($d -imatch 'n.o pode ser evitado|nunca erra') { [void]$efeitos.Add([ordered]@{ tipo = "nunca_erra" }) }
    if ($d -imatch 'acerto cr.tico|cr.tico') { [void]$efeitos.Add([ordered]@{ tipo = "critico_alto" }) }
    if ($d -imatch 'quanto maior o HP|quanto menor o HP') { [void]$efeitos.Add([ordered]@{ tipo = "dano_por_hp" }) }

    return ,$efeitos
}

$moveEffects = [ordered]@{}
$comEfeito = 0; $semEfeito = 0; $semDesc = 0
for ($id = 0; $id -lt $dex.moves.Count; $id++) {
    $m = $dex.moves[$id]
    if (-not $m -or -not $m[0] -or $m[0] -eq "-") { continue }
    $desc = $pt["$id"]
    $efeitos = Get-MoveEffects $desc $dex.splits[$m[2]]
    $moveEffects["$id"] = [ordered]@{
        name = $m[0]; type = $dex.types[$m[1]]; split = $dex.splits[$m[2]]
        power = $m[3]; acc = $m[4]; pp = $m[5]; prio = $m[7]
        efeitos = $efeitos.ToArray()
    }
    if (-not $desc) { $semDesc++ }
    elseif ($efeitos.Count -eq 0) { $semEfeito++ }
    else { $comEfeito++ }
}


# tipo: clima_sol|clima_areia|clima_granizo|clima_neblina|clima_chuva|hp_baixo
# (dispara com o próprio HP baixo - ver Berserk/Berserk DNA na descrição real).
$CATALOGO_ABI = [ordered]@{
    "Solar Power" = "clima_sol"; "Sand Force" = "clima_areia"
    "Whiteout" = "clima_granizo"; "Ectoplasm" = "clima_neblina"
    "Raging Storm" = "clima_chuva"; "Sun Worship" = "clima_sol"
    "Sea Guardian" = "clima_chuva"; "Greater Spirit" = "clima_neblina"
    "Protosynthesis" = "clima_sol"
    "Berserk" = "hp_baixo"; "Berserk DNA" = "hp_baixo"
}
$CLIMA_POR_TIPO = @{ clima_sol = "sol"; clima_areia = "areia"; clima_granizo = "granizo"; clima_neblina = "neblina"; clima_chuva = "chuva" }

$abilityIdByName = @{}
for ($i = 0; $i -lt $dex.abilities.Count; $i++) { if ($dex.abilities[$i]) { $abilityIdByName[$dex.abilities[$i][0]] = $i } }
$moveNameById = @{}
for ($i = 0; $i -lt $dex.moves.Count; $i++) { if ($dex.moves[$i]) { $moveNameById[$i] = $dex.moves[$i][0] } }

# --- Combo 1: habilidade de clima + a própria espécie aprende o golpe que
# invoca esse mesmo clima (autossuficiente, não depende de suporte de time) ---
$comboClima = New-Object System.Collections.ArrayList
# --- Combo 2: habilidade que dispara com HP baixo + a própria espécie
# aprende um golpe com recuo (autossuficiente pra se machucar sozinha) ---
$comboRecuo = New-Object System.Collections.ArrayList

foreach ($s in $dex.species) {
    if (-not $s) { continue }
    # Dedupe por id (nao por slot): o "ab" desta hack guarda 3 CANDIDATOS pro
    # mesmo slot escolhivel, e uma mesma habilidade pode ocupar mais de um
    # candidato (mesma licao real da analise de stat-stacking desta sessao,
    # onde "3 slots" foi confundido com "3 habilidades simultaneas") - sem
    # este Select-Object -Unique, uma habilidade repetida nos candidatos
    # gerava a mesma entrada de combo 2-3x (achado real: Kyogre Primal saiu
    # triplicado antes deste fix).
    $abIds = @($s["ab"] | Select-Object -Unique)
    $innIds = @($s["inn"] | Select-Object -Unique)
    $moveIds = @(@($s["lm"]) | ForEach-Object { $_[1] }) + @($s["tu"])
    $moveIds = @($moveIds | Select-Object -Unique)

    foreach ($slot in @(@{ ids = $abIds; kind = "ab" }, @{ ids = $innIds; kind = "inn" })) {
        foreach ($aid in $slot.ids) {
            if (-not $dex.abilities[$aid]) { continue }
            $nome = $dex.abilities[$aid][0]
            if (-not $CATALOGO_ABI.Contains($nome)) { continue }
            $tipo = $CATALOGO_ABI[$nome]

            if ($tipo -eq "hp_baixo") {
                $golpesRecuo = New-Object System.Collections.ArrayList
                foreach ($mid in $moveIds) {
                    $eff = $moveEffects["$mid"]
                    if (-not $eff) { continue }
                    if (@($eff.efeitos) | Where-Object { $_.tipo -eq "recuo" }) { [void]$golpesRecuo.Add($moveNameById[$mid]) }
                }
                if ($golpesRecuo.Count -gt 0) {
                    [void]$comboRecuo.Add([ordered]@{ sname = $s["sname"]; nome = $s["n"]; habilidade = $nome; kind = $slot.kind; golpesRecuo = $golpesRecuo.ToArray() })
                }
                continue
            }

            $climaNecessario = $CLIMA_POR_TIPO[$tipo]
            if (-not $climaNecessario) { continue }
            foreach ($mid in $moveIds) {
                $eff = $moveEffects["$mid"]
                if (-not $eff) { continue }
                $bate = @($eff.efeitos) | Where-Object { $_.tipo -eq "clima" -and $_.qual -eq $climaNecessario }
                if ($bate) {
                    [void]$comboClima.Add([ordered]@{ sname = $s["sname"]; nome = $s["n"]; habilidade = $nome; kind = $slot.kind; clima = $climaNecessario; golpe = $moveNameById[$mid] })
                    break
                }
            }
        }
    }
}

$out = [ordered]@{
    comboClimaAutossuficiente = $comboClima.ToArray()
    comboHpBaixoComRecuo = $comboRecuo.ToArray()
}
$outPath = Join-Path $dataDir "condition_move_synergy.json"
[System.IO.File]::WriteAllText($outPath, (ConvertTo-JsonManual $out), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "compute_condition_move_synergy.ps1: OK ($($comboClima.Count) combo(s) de clima autossuficiente, $($comboRecuo.Count) combo(s) de HP baixo + recuo) -> $outPath"
