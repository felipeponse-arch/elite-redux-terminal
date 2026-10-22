# 03 — Builds para o campo da run contam as lutas comuns (mesma régua do rank)

Status: resolvido-no-branch
Tamanho: P.
Dono sugerido: engenheira-do-motor (depois do motor-item/01, mesma área).

## Decisão do usuário (22/10/2026)
As builds com `alvo.campo` (Meu Time / Modo Motor) passam a medir também as lutas comuns, com a mesma fatia 60/40 do
rank (todas-as-lutas/02: `scripts/rank_fatia.mjs`, `data/lutas_comuns_run.json`). Hoje elas medem só as lutas de chefão.

## Critério de aceite
- `candidatosDeBuild` com alvo campo usa chefões + comuns pela fatia 60/40, igual ao rank.
- Teste com dado real: uma espécie em que a build do campo muda (ou prova de que não muda) com as comuns.
- Tempo do "Montar meu melhor time" segue < 10 s com pool 12.
- `lutas_comuns_run.json` provisório (amostra 80) só é trocado pelo rank final; a guarda de publicação segue valendo.
