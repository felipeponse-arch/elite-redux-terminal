# 8º ginásio (Juan + Wallace): evidência (07/11/2026)
Fonte: `ferramentas/er-repo` (código oficial).
- `data/maps/SootopolisCity_Gym_1F/scripts.pory:272-281`: 1º encontro: CheckTrainers, `registerbattleevent(TENSE_BATTLE)`, `HealPlayerParty`, `setflag(FLAG_SYS_DISABLE_AUTOHEAL)`, `starttagbattle(TRAINER_JUAN_1, TRAINER_WALLACE, TAG_TEAM_WALLACE_JUAN, ..., Juan_Battle_2)`.
- `:286-290`: `Juan_Battle_2` = `starttagbattle(TRAINER_JUAN_5, TRAINER_WALLACE_5, TAG_TEAM_WALLACE_JUAN_2, ..., Juan_Defeated)`. Nenhuma cura/troca entre as duas.
- `src/battle_main.c:846` e `src/pokemon.c:2121`: `if (!FlagGet(FLAG_SYS_DISABLE_AUTOHEAL)) HealPlayerParty();` (flag só é limpa em `:279` e `overworld.c:1576`).
- Buffs na luta 2: NENHUM. `BATTLE_EVENT_TENSE_BATTLE` só troca a música (`src/battle_events.c:536-547`, `:408-410` só recalcula contagem). `CheckTrainers` (`:477-491`) é só a trava dos 10 treinadores. `gym_skills.json` já marca Juan/Wallace como gateOnly.
- `src/secret_base.c:1162-1175`: `TAG_TEAM_WALLACE_JUAN`/`_2` só escolhem os textos de derrota; não mudam IA/ordem.
- Revanches (`scripts.pory:345-366`): tag battle única (`TAG_TEAM_WALLACE_JUAN_REMATCH`), Juan 2..5 / Wallace 2..5.
- Dado: `data/bosses.json`: Juan 1 (2 mons), Wallace (2), Juan 5 (2, `db`), Wallace 5 (3).
Em aberto (não muda o resultado): quem entra primeiro na luta 2 (jogo: primeiro vivo da party; o motor escolhe o melhor contra os dois da frente).
