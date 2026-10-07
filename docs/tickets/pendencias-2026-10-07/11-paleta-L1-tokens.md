# 11 — Paleta L1: só tokens.css

Status: pronto-para-agente
Bloqueado por: 09
Agentes: engenheira-frontend, ux-acessibilidade

## O que entrega
Os valores `sh_claro` e `sh_escuro` de `teste/estudo_paleta/paletas.mjs` nos 3 blocos de `src/css/tokens.css` (claro,
escuro pela mídia e escuro forçado; alto contraste continua o dele). Só `tokens.css` tem hex em `src/css`, então o resto
do app muda sozinho. Reescrever os 14 baselines visuais (mudam só de cor).

## Como verificar
`checar_css` verde (cores iguais nos 3 temas); contraste AA em todos os pares (`paletas.mjs` tem a conferência);
capturas antes/depois no celular e no computador.
