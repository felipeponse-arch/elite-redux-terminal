# 13 — Paleta L3: ficha da Dex

Status: resolvido
Bloqueado por: 12
Agentes: engenheira-frontend, ux-acessibilidade

## O que entrega
Topo da ficha com arte (webp de `teste/estudo_paleta/web/`, embutida pelo `scripts/build.mjs`), card de Estatísticas com
pílula TOTAL e barra arredondada, faixas Fraco/Resiste/Imune e anterior/próximo na ficha. `dex.css`, `sprites.css`.
Baselines da ficha (5) e alto-contraste-ficha.

## Como verificar
Peso do build sobe no máximo ~210 KB no total dos lotes 13-15; leitor de tela lê as faixas como lista.

## Comentários

07/10: card de stats com TOTAL no título; card novo "Efetividade de tipos" (Fraco/Resiste/Imune, com innates - perfilDefensivoDaEspecie em tipos.js); anterior/próximo na ordem da lista da tela (atualiza quando a lista muda); arte do Rayquaza shiny (data/arte/rayquaza_shiny.webp, 36 KB, embutida pelo build) na Dex vazia - a arte não vai para o topo de cada ficha (só existe arte do Rayquaza; as outras espécies têm só sprite). 4 imagens de referência regravadas.
