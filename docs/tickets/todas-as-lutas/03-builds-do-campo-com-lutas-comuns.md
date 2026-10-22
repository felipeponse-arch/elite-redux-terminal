# 03 — Builds para o campo da run contam as lutas comuns (mesma régua do rank)

Status: resolvido (aprovado r2; portão verde; master, 22/10/2026)
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

## Decisões (usuário, 22/10/2026)
1. **3 comuns por etapa** (`PIPELINE_COMUNS_POR_ETAPA = 3`, as 3 mais perigosas pelo peso de ameaça de `data/lutas_comuns_run.json`).
   Não é a mesma régua do rank (o rank mede todas, ~30 por etapa, com o time inteiro): é uma APROXIMAÇÃO declarada (também no comentário do código).
2. **A parte dos chefões continua o PIOR chefão**, não a média ponderada do rank.

## Medições (3 comuns, elenco de motor_item.test.mjs, "Montar meu melhor time")
- Antes: sem comuns 12,0-12,4 s (etapa 5) e 8,5-9,1 s (etapa 8); com 1 comum 13,5 s e 10,5 s.
- Com 3 comuns: etapa 5 = 17,9 s; etapa 8 = 15,7 s (teste isolado; 22,4 s e 19,0 s com outros testes em paralelo). Acima da meta de 10 s: pendente de decisão.
- Excadrill, etapa 8: com 3 comuns a build top-1 volta a ser igual à sem comuns (Mold Breaker, Headlong Rush/Return/Megahorn/Strength). Com 1 comum era Tough Claws.
