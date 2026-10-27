# 01 — 8º ginásio: Juan + Wallace são duas lutas em dupla seguidas, sem cura

Status: a-avaliar (aguarda pacote de evidência do pesquisador-de-mecanica)
Bloqueado por: pesquisa de mecânica (abaixo)
Agentes: pesquisador-de-mecanica, executor (Sonnet), qa-processo, verificador

## Origem
Relato do usuário (19/10): "Wallace e Juan lutam contra o usuário em dupla e são duas lutas seguidas sem poder trocar
de poke e sem recuperar a vida entre uma luta e outra." Decisão do usuário: correção completa.

## O que o código do jogo diz (já conferido)
`ferramentas/er-repo/data/maps/SootopolisCity_Gym_1F/scripts.pory:268-291`, 1º encontro (sem FLAG_BADGE08_GET):
1. `CheckTrainers` + `registerbattleevent(BATTLE_EVENT_TENSE_BATTLE)` + `special(HealPlayerParty)`.
2. `setflag(FLAG_SYS_DISABLE_AUTOHEAL)`.
3. `starttagbattle(TRAINER_JUAN_1, TRAINER_WALLACE, TAG_TEAM_WALLACE_JUAN, ...)` → ao vencer, segue para
   `Juan_Battle_2`.
4. `starttagbattle(TRAINER_JUAN_5, TRAINER_WALLACE_5, TAG_TEAM_WALLACE_JUAN_2, ...)` → insígnia.
Sem cura e sem troca de time entre 3 e 4. Revanches (linhas 353-366) também são tag battle, uma luta só.

## O que o app faz hoje (errado)
- `src/regras/chefoes.js`: Juan e Wallace como chefões separados, em luta 1x1; dedup só pela insígnia.
- `ehRevancheDeLider("Juan 5")` = true: no 1º encontro, Juan 5/Wallace 5 são a 2ª parte do ginásio, não uma revanche.

## O que entrega
- Uma entrada só para o 8º ginásio: luta 1 (Juan 1 + Wallace, dupla) e depois luta 2 (Juan 5 + Wallace 5, dupla).
- Simulador leva HP, status e Pokémon desmaiados da luta 1 para a luta 2. Não cura e não troca o time.
- Juan 5/Wallace 5 deixam de contar como revanche no contexto do 1º encontro.
- Buffs do ginásio na luta 2: conforme a pesquisa (não assumir).
- Registro em `docs/decisoes_mecanicas.md`.

## Perguntas para a pesquisa
1. `registerbattleevent` vale para as duas tag battles ou só para a 1ª? Onde o evento é limpo?
2. O que `TAG_TEAM_WALLACE_JUAN` / `_2` muda (`src/secret_base.c:1162-1175`)? IA, ordem, dupla?
3. A luta 2 começa com os Pokémon que estavam em campo ou com os primeiros da party?
4. Há outro chefão com luta encadeada no mesmo padrão (`starttagbattle` com script de continuação)?

## Como verificar
Teste unitário que falha sem a correção: HP perdido na luta 1 chega à luta 2; Juan 5 não é revanche no 1º encontro.
Portão: `npm run check --silent && node --test tests/unit/*.test.mjs && node tests/run_sabotage.mjs`.

## Comentários

19/10: pesquisa interrompida (limite semanal em 99%). Retomar depois do reset: começar pelo pesquisador-de-mecanica.
