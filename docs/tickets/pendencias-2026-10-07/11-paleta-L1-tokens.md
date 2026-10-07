# 11 — Paleta L1: só tokens.css

Status: resolvido
Bloqueado por: 09
Agentes: engenheira-frontend, ux-acessibilidade

## O que entrega
Os valores `sh_claro` e `sh_escuro` de `teste/estudo_paleta/paletas.mjs` nos 3 blocos de `src/css/tokens.css` (claro,
escuro pela mídia e escuro forçado; alto contraste continua o dele). Só `tokens.css` tem hex em `src/css`, então o resto
do app muda sozinho. Reescrever os 14 baselines visuais (mudam só de cor).

## Como verificar
`checar_css` verde (cores iguais nos 3 temas); contraste AA em todos os pares (`paletas.mjs` tem a conferência);
capturas antes/depois no celular e no computador.

## Comentários

07/10: 62 valores de sh_claro/sh_escuro nos blocos claro e escuro (alto contraste intocado); sombras do claro em neutro quente. Conferência de paletas.mjs: AA em todos os pares de texto (só a borda decorativa abaixo de 3:1, como antes). Achado: --accent-2 (ouro) era usado como TEXTO em 2 botões e na etiqueta "Líder de Ginásio" (~3,4:1 no claro; o ciano antigo também falhava) - passaram para --badge-accent2/--badge-accent. 13 baselines regravados (alto contraste igual).
