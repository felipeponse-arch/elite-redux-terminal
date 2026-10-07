# 03 — IA do chefão: troca, itens e escolha de golpe pelo código oficial

Status: resolvido
Bloqueado por: 02
Agentes: meta-pokemon, playtester-de-build

## O que entrega
Leitura de `battle_ai_main.c`, `battle_ai_util.c`, `battle_ai_attack.c`, `battle_ai_switch_items.c`,
`battle_ai_ability.c` e `include/constants/battle_ai.h` (nunca lidos). Hoje a IA do chefão no simulador vem só da
observação do usuário (`escolherProximoDoChefao`). Quando trocar, quando usar item, como pontua golpe: comparar com o
simulador e corrigir o que divergir.

## Como verificar
Cada regra nova com teste que falha sem ela e sabotagem; plano contra um chefão conhecido (Tate & Liza, Wattson) muda
só onde o código manda.

## Comentários

07/10: escopo escolhido pelo usuário = escolha de golpe pela pontuação da IA + avisos das flags. Itens: não existem (gerador não grava). Troca voluntária: não modelada. Detalhe em docs/decisoes_mecanicas.md.
