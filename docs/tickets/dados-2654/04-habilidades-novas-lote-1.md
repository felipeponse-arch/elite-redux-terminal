# 04 — Habilidades novas, lote 1 (10)

Status: pronto-para-agente
Bloqueado por: 01

## O que entrega
As 10 primeiras das 29 habilidades novas da 2.65.4 funcionam no duelo simulado. Este lote começa pelas que têm portador no dado (Familia Bond, Mega Sol, Sand Titan e as demais com espécie que as usa).

## Contexto
Lista e efeito em `docs/pesquisa_versao_2654.md` §3 ("Novas") e `docs/pesquisa_2654_config.md` §1.6. Fonte do efeito: texto expandido da config `7285071` e código oficial do jogo. As 5 renomeadas (Absorbent, Phobia, Apple Cake, Frosty Presence, Malediction) NÃO são novas: são tratadas no ticket 01.
Decisão do usuário (07/10): implementar TODAS as 29, inclusive as sem portador. Entram na forma atual do motor; o registro de efeitos (dívida técnica 08-10) migra depois.

## Critérios de aceite
- [ ] Ao começar, escrever nos Comentários a divisão das 29 nos lotes 04, 05 e 06 (10 / 10 / 9).
- [ ] Cada habilidade com teste e sabotagem; decisões em `docs/decisoes_mecanicas.md`.
- [ ] Efeito que o motor não consegue simular fica registrado como "sem regra", com o porquê.
- [ ] Rank NÃO recalculado. Sem publicar.

## Comentários
