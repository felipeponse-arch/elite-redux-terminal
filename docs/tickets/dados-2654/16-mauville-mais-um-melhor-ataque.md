# 16 — Mauville Game Corner: +1 no melhor ataque (só Hell, só esse treinador)

Status: resolvido
Bloqueado por: nenhum

## O que entrega
O treinador `Sinnoh Megas Mauville Game Corner` (TRAINER_SINNOH_MEGAS_MAUVILLE_GAME_CORNER) ganha, no modo Hell, +1 estágio no maior entre Atq e Atq. Esp. brutos de cada Pokémon que entra.

## Contexto
Fonte: er-config `TrainerBattleSkillList.textproto:1286-1301` (`SKILL_ON_ENTRY_HIGHEST_ATTACK_UP_1`, alvo `all`); er-repo `src/data/hell_trainer_skills.h:401-406` (TODO comentado, sem implementação no código público). O critério de "melhor ataque" NÃO está na fonte: DECISÃO DO USUÁRIO 05/11 (opção 1).
As outras 3 skills (imune a quedas, golpes nunca erram, imune a rooms) ficam FORA deste ticket e não foram mexidas.

## Critérios de aceite
- [x] Só no Hell e só nesse treinador (`buffsAtivosDoChefao`, chefoes.js); outros treinadores e dificuldades não recebem.
- [x] Maior entre Atq e Atq. Esp. brutos; empate = Atq físico (regra fixa, a mesma do Sharply ups highest attacking stat).
- [x] Teste `tests/unit/mauville_mais_um_melhor_ataque.test.mjs`; sabotagens `tk48-*` em `mutacoes.mjs`.
- [x] Decisão registrada em `docs/decisoes_mecanicas.md`.
