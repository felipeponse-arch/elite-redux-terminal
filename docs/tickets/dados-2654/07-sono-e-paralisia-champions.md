# 07 — Sono e paralisia no estilo Champions

Status: resolvido (substituído por versao-nova/05-08, no master; marcado em 21/10)
Bloqueado por: 01

## O que entrega
O duelo simulado usa o sono e a paralisia que o jogo novo ativou: sono de 2 a 3 turnos; paralisia que corta a Velocidade pela metade e dá 12,5% de chance de perder a vez (números a confirmar no código).

## Contexto
`docs/pesquisa_2654_changelog.md`: o código do jogo liga `B_USE_CHAMPIONS_SLEEP` e `B_USE_CHAMPIONS_PARALYSIS`. Não aparece no Dado do jogo; só no código. Também citados lá: Normal-type contra resistências e Mist; conferir se mudam o motor e, se sim, listar ao usuário (não implementar sem pedir).

## Critérios de aceite
- [ ] Números e regras confirmados no código oficial, com a fonte em `docs/decisoes_mecanicas.md`.
- [ ] Testes e sabotagens para sono e paralisia.
- [ ] Rank NÃO recalculado. Sem publicar.

## Comentários
