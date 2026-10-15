# v08 — Sono e paralisia estilo Pokémon Champions (dados-2654/07)

Status: pronto-para-revisao (branch `versao-08-sono-paralisia`, empilhada em `versao-07-habilidades-novas`, sem merge, sem PR).
Tamanho: P
Autorização: Felipe, 15/10/2026 (fila v06–v09). Vale o código mais novo (`486026e`, upcoming).

## O que o código diz (conferido linha a linha)
- `battle_config.h:156-157`: `B_USE_CHAMPIONS_SLEEP` e `B_USE_CHAMPIONS_PARALYSIS` = TRUE; `B_SLEEP_TURNS = GEN_9` (a condição do sono Champions).
- **Paralisia**: `battle_util.c:3406` `mod = B_USE_CHAMPIONS_PARALYSIS ? 8 : 4` -> **1 chance em 8 (12,5%)** de não agir (era 25%). Velocidade pela metade (`battle_main.c:4196`, `B_PARALYSIS_SPEED = GEN_7`; Quick Feet isento). **Modo Hell**: `battle_util.c:3403` `disableParalysisCancel = isHellMode() && atacante fora do lado do jogador`: o Pokémon do chefão paralisado **sempre age** e só perde a Velocidade.
- **Sono**: `battle_script_commands.c:2558-2563` põe o contador em 2 (chance 1/3) ou 3 (chance 2/3). `battle_util.c:3210-3245`: cada tentativa de agir tira 1 (2 com Early Bird) e o Pokémon **age** no turno em que o contador zera. Contador 2: perde 1 turno; contador 3: perde 2. Média **5/3 de turno** (a série dava 2); **Early Bird** perde 0 (1/3) ou 1 (2/3): média **2/3** (o motor dava 1). Rest: contador fixo 3 (`:9463`) = 2 turnos, igual ao que o motor já tinha.

## No motor
- `CHANCE_DE_NAO_AGIR_PARALISIA_DUELO = 1/8` em `STATUS_DUELO.paralisar.corte`; `TURNOS_PERDIDOS_NO_SONO_DUELO = 5/3` e `..._EARLY_BIRD_DUELO = 2/3` nos golpes de sono (Spore, Hypnosis...) e no Yawn.
- Hell: `modoHellDuelo()` lê `state.settings.difficulty`; o Pokémon do chefão vem marcado (`foeDeDuelo` -> `chefao`), e a paralisia nele não corta o dano (nem na luta com status nem no plano de golpe de status). A Velocidade pela metade vale igual.
- Comentários do bloco `STATUS_DUELO` corrigidos (diziam "paralisia 25%").

## Os dois itens "citados" no changelog (conferidos; sem mudança de motor)
- "Fix Normal-type moves ignoring resistances and immunities" (`ec3f3b7`, 28/05): era um bug do jogo (tipo Normal = 0 caía no `if (moveType)`); o motor sempre aplicou resistência e imunidade ao Normal. Nada a mudar.
- Mist (`6a5a916`, `74e91f0`): conserto para o Mist bloquear queda de atributo como deveria; o motor não modela Mist além do texto das habilidades. Nada a mudar. **Nada a listar ao Felipe como decisão.**

## Ressalvas
- O `corte` 0,5 do sono por chance de golpe (Hypnotic Touch...) segue como estava: é uma média por turno de presença, não a contagem de turnos; só os golpes de sono planejados e o Yawn usam os 5/3.
- Quick Feet (isento da queda de Velocidade pela paralisia) não foi ligado: o motor só aplica a metade da Velocidade no plano do golpe de status.
- Rank NÃO recalculado.

## Testes e sabotagens
`tests/unit/sono_e_paralisia_champions.test.mjs` (5 testes) + 6 sabotagens `versao-paralisia-*`, `versao-sono-*`, `versao-chefao-sem-marca`, todas pegas. Suíte 982 testes; `npm run check` limpo.
