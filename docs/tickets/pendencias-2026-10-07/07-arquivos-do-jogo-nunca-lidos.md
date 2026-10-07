# 07 — Partes do código do jogo nunca lidas

Status: resolvido
Bloqueado por: nenhum
Agentes: arquiteta-de-dados

## O que entrega
Ler `data/scripts/item_ball_scripts.inc` (itens no chão), `general_mart.inc` e as lojas, `trainer_spreads.h`,
`data/text/trainers.inc` e `pokemon_config.h` inteiro. Itens e pedras ganham "onde achar" com etapa (insígnia) certa;
spreads dos treinadores conferidos contra o `bosses.json`.

## Como verificar
Teste de que todo item com local no código aparece no "Como conseguir"; diferenças registradas.

## Comentários

07/10: item no chão, escondidos, presentes, Pokémon de presente com item, lojas (inclusive por insígnia) e troca por BP lidos; data/onde_achar_itens.json (450 itens) com etapa pelo resolvedor único (extraído para scripts/etapa_do_mapa.mjs). Na build: "Onde achar" e aviso de item tardio geral. trainer_spreads.h: irrelevante para os chefões (EVs explícitos). trainers.inc: só textos.
