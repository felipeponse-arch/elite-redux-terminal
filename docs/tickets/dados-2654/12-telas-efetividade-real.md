# 12 — Telas mostram a efetividade real contra Solid Rock / Primal Armor

Status: pronto-para-agente
Bloqueado por: nenhum

## O que entrega
Contra Solid Rock, Filter, Prism Armor e Primal Armor, as telas de confronto, chefões e arquétipo mostram o golpe como super efetivo (ex.: "2x, super efetivo; Solid Rock reduz 35%"), igual ao duelo, que já usa a efetividade real desde a correção de 08/10 (commit dbb2a9d).

## Contexto
Decisão do usuário (08/10): alinhar as telas com o duelo. Hoje confronto.js, chefoes.js, formas_mega.js, mono_run.js e arquetipo.js leem `.mult` (amortecido, 1,3x em fraqueza 2x); o duelo usa `real`. Fonte da mecânica: docs/decisoes_mecanicas.md (Filter/Solid Rock/Prism Armor .65, Primal Armor .5, er-repo 217dd0f).

## Critérios de aceite
- [ ] Cada tela citada usa a efetividade real e mostra a redução da habilidade quando houver.
- [ ] Teste por tela (e2e ou unitário) com Tyranitar Solid Rock contra golpe Fighting 2x e 4x.
- [ ] Rank NÃO recalculado. Sem publicar.

## Comentários
