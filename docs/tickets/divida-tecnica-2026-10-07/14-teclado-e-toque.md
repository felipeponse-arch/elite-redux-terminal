# 14 — Teclado e toque

Status: resolvido
Bloqueado por: nenhum

## O que entrega
Todo elemento clicável que não é botão de verdade responde a Enter e Espaço; foco aparece só na navegação por teclado; toque não tem atraso de duplo toque; campos numéricos abrem teclado numérico no celular; a caixa de alto contraste tem alvo de toque do tamanho dos outros.

## Critérios de aceite
- [x] Teste e2e: Enter e Espaço abrem a espécie a partir da evolução, do card do chefão e do link de Estratégias.
- [x] Busca da Dex usa :focus-visible.
- [x] touch-action e destaque de toque definidos de propósito nos botões.
- [x] Campos de nível com inputmode numérico.
- [x] Contraste e alvos conferidos com o modo alto contraste.

## Comentários
Origem: revisão da interface pelas Web Interface Guidelines (Vercel) em 07/10, pontos quentes.

Feito (08/10, branch divida/14):
- Já existia: ouvinte global de Enter/Espaço para .goto-species e .goto-species-strategies (todos com tabindex 0 + role button). Faltava teste: tests/e2e/teclado_e_toque.spec.mjs (evolução, card do chefão e Estratégias, Enter e Espaço, mais o Espaço sem rolar a página) e tests/unit/atalhos_teclado.test.mjs (varredura que pega atalho novo sem tabindex).
- Elemento clicável sem teclado que faltava: a linha de golpe da tabela da ficha (tr). Agora o nome do golpe é um botão de verdade com aria-expanded e aria-controls; a linha inteira segue clicável.
- .campo-busca:focus virou :focus-visible. touch-action: manipulation e -webkit-tap-highlight-color (cor de destaque do app, suave) em botões, summary, select, label, links e role button/option (base.css).
- inputmode="numeric" nos dois campos de nível (Chefões e editor de Build). IV/EV do editor ficaram de fora (a frente do ticket 12 mexe ali).
- Caixa "Alto contraste": rótulo .opcao-caixa com altura mínima --alvo-min (24 px mouse, 44 px toque) e caixa de 20 px. Conferido no modo alto contraste com print (caixa e anel branco no card do chefão) e com teste a 390 px com toque.
- O link real "Ver Estratégias" só existe depois do gerador (IA): no Playwright entra o mesmo markup na aba Chefões; a seção 20 da suíte ganhou Enter e Espaço no link real.
