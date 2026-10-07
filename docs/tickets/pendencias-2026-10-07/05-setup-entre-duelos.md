# 05 — Setup entre duelos na mesma luta

Status: resolvido
Bloqueado por: nenhum
Agentes: meta-pokemon, playtester-de-build

## O que entrega
Decidir pelo código do jogo se os estágios de atributo (Swords Dance, Dragon Dance...) do Pokémon do jogador continuam
quando o Pokémon do chefão cai e o próximo entra (no jogo de verdade continuam enquanto o seu não troca). Se sim, o
simulador passa a levar os boosts de um duelo 1x1 para o seguinte. Pesquisa primeiro, linha em
`docs/decisoes_mecanicas.md`, depois implementação.

## Como verificar
Teste: atacante com +2 vence o 2º Pokémon que antes perdia; sabotagem que zera os estágios é pega. Rank NÃO recalcula
aqui (fica no 08).

## Comentários

07/10: confirmado no código (estágios zeram só ao entrar ou desmaiar). Implementado nos dois lados da luta contra o chefão; quem entra começa sem estágios. Exemplo do teste: sem levar o +2 do Swords Dance o 2º duelo é derrota, levando é vitória.
