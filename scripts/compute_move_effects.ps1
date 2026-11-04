<#
TK-15 D3.1: data/move_effects.json é INTERMEDIÁRIO do build, não dado do app em execução. Único consumidor: compute_condition_move_synergy.ps1
(gera species_ability_synergy.json, que o motor lê). Nada em src/ lê este arquivo; tests/unit/golpes_fonte_unica.test.mjs guarda isso.
Catálogo sistemático do efeito REAL de cada golpe (pedido do usuário,
2026-09-20/21: "mesma pesquisa que fez com as habilidades, agora nos golpes,
depois juntamos os dois"). Mesma disciplina de compute_ability_movepool_
synergy.ps1: texto real (data/move_translations_pt.json), nunca suposição.

Diferença estrutural real, achada ao comparar com o catálogo de habilidades:
a descrição de habilidade tem número exato (1.4x, 1.5x...); a de golpe é
texto de sabor tipo Pokédex ("pode paralisar", "aumenta bruscamente o Atk")
quase sempre SEM percentual/estágio exato. Não inventamos o valor vanilla
(ex: "Ember = 10% de queimar" da memória geral de Pokémon) - esta hack já
mudou valor em outros lugares (Light Ball, balanceamento geral, ver
AUDITORIA-DOSSIE.md), então um número não confirmado NESTE texto vira
"categoria confirmada, valor exato não informado" (percentualExato: null),
nunca um número calado como se fosse certeza.

Processo real de verificação (não só regex cego, rodado uma vez e aceito):
escrito, rodado contra amostras espalhadas do dado real, e CORRIGIDO 4 vezes
depois de achar erros reais comparando a saída contra o texto original:
  1. Fire Punch duplicava "queimadura" (dois padrões de regex batendo na
     mesma palavra sem marcar já-visto).
  2. Vine Whip ("Tem 30% de chance de flinchar") não achava o percentual
     nem marcava como condicional - o detector só reconhecia a palavra
     "pode", não "X% de chance".
  3. Alvo (usuário x oponente) só olhava o texto ANTES do verbo de boost -
     em português o alvo normalmente vem DEPOIS ("reduz a precisão DO
     OPONENTE"), então a maioria dos casos reais nunca era achada.
  4. O mais sério: "Cura queimaduras ao acertar" (Sparkling Aria) e "Impede
     o oponente de recuperar HP" (Heal Block) eram lidos como SE o golpe
     causasse queimadura/curasse o usuário - é o efeito OPOSTO (cura remove
     o status; impede bloqueia a cura ALHEIA). Precisou de detecção de
     negação antes de aceitar qualquer match de status/cura como válido.
Também removida uma heurística real que dava errado: "golpe de status sem
alvo citado = usuário" parecia razoável até achar Defog ("reduz a Evasão"
sem dizer de quem - a convenção real é do OPONENTE). Sem palavra explícita
no texto, o resultado fica "ambiguo" de propósito, nunca um chute.

Saída: data/move_effects.json, chaveado por id de golpe (string), cada
entrada com nome/tipo/split/power/acc/pp/prioridade + array `efeitos`
estruturado. Um golpe sem nenhum efeito extraível (a maioria - dano puro,
sem efeito secundário) tem `efeitos: []`, não uma entrada ausente.
#>

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))
$pt = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "move_translations_pt.json") -Raw -Encoding UTF8))

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

$out = [ordered]@{}
$comEfeito = 0; $semEfeito = 0; $semDesc = 0
for ($id = 0; $id -lt $dex.moves.Count; $id++) {
    $m = $dex.moves[$id]
    if (-not $m -or -not $m[0] -or $m[0] -eq "-") { continue }
    $desc = $pt["$id"]
    $efeitos = Get-MoveEffects $desc $dex.splits[$m[2]]
    $out["$id"] = [ordered]@{
        name = $m[0]; type = $dex.types[$m[1]]; split = $dex.splits[$m[2]]
        power = $m[3]; acc = $m[4]; pp = $m[5]; prio = $m[7]
        efeitos = $efeitos.ToArray()
    }
    if (-not $desc) { $semDesc++ }
    elseif ($efeitos.Count -eq 0) { $semEfeito++ }
    else { $comEfeito++ }
}

$outPath = Join-Path $dataDir "move_effects.json"
[System.IO.File]::WriteAllText($outPath, (ConvertTo-JsonManual $out), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "compute_move_effects.ps1: OK ($($out.Keys.Count) golpes processados: $comEfeito com efeito estruturado, $semEfeito sem efeito extraivel, $semDesc sem descricao) -> $outPath"
