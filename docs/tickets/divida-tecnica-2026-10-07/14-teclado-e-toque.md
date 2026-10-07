# 14 — Teclado e toque

Status: pronto-para-agente
Bloqueado por: nenhum

## O que entrega
Todo elemento clicável que não é botão de verdade responde a Enter e Espaço; foco aparece só na navegação por teclado; toque não tem atraso de duplo toque; campos numéricos abrem teclado numérico no celular; a caixa de alto contraste tem alvo de toque do tamanho dos outros.

## Critérios de aceite
- [ ] Teste e2e: Enter e Espaço abrem a espécie a partir da evolução, do card do chefão e do link de Estratégias.
- [ ] Busca da Dex usa :focus-visible.
- [ ] touch-action e destaque de toque definidos de propósito nos botões.
- [ ] Campos de nível com inputmode numérico.
- [ ] Contraste e alvos conferidos com o modo alto contraste.

## Comentários
Origem: revisão da interface pelas Web Interface Guidelines (Vercel) em 07/10, pontos quentes.
