# 15 — Template: cor do tema, pular para o conteúdo e bordas do celular

Status: resolvido
Bloqueado por: nenhum

## O que entrega
A barra do navegador no celular acompanha o fundo do tema (claro, escuro, alto contraste); quem navega por teclado pode pular direto para o conteúdo; em celular com entalhe nada fica escondido atrás das bordas.

## Critérios de aceite
- [x] meta theme-color segue o tema ativo.
- [x] Link 'Pular para o conteúdo' visível ao receber foco.
- [x] Bordas seguras aplicadas no cabeçalho e no rodapé.
- [x] Fotos de referência do celular conferidas.

## Comentários
Origem: revisão da interface pelas Web Interface Guidelines (Vercel) em 07/10, pontos quentes.

2026-10-08 (branch divida/15): cor do tema via `corDoTema` em src/ui/nucleo.js (lê o --bg ativo; ouve prefers-color-scheme, data-theme e data-high-contrast); link `.pular-conteudo` + `<main id="conteudo-principal" tabindex="-1">`; bordas seguras por tokens `--safe-*` (cabeçalho, rodapé, aviso fixo e aviso passageiro). Testes: tests/e2e/tema_e_celular.spec.mjs (14) e 6 fotos novas em tests/visual_baselines (celular escuro, alto contraste, entalhe, pular com foco). Nenhuma foto antiga mudou.
