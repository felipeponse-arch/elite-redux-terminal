# 12 — Apagar Build com desfazer

Status: resolvido
Bloqueado por: nenhum

## O que entrega
"Apagar esta" no editor de Build deixa de perder a Build na hora: o jogador vê um aviso com Desfazer por alguns segundos e pode trazer a Build ativa de volta.

## Critérios de aceite
- [x] Desfazer restaura a mesma Build, ativa de novo, com tudo igual.
- [x] Funciona por teclado e o aviso é anunciado pelo leitor de tela.
- [x] Teste e2e: apagar, desfazer, conferir a Build.
- [x] Nada de confirm() nativo (proibido no iframe, ver template).

## Comentários
Origem: revisão da interface pelas Web Interface Guidelines (Vercel) em 07/10, pontos quentes.

2026-10-08 (agente, branch divida/12): implementado. O aviso passageiro (`flashToast`) ganhou um segundo argumento
opcional com botão de ação (8 s, pausa com mouse/foco, foco vai pro botão, Esc dispensa, foco volta ao editor).
"Apagar esta" -> `apagarBuildComDesfazer` (editor_build.js); `reinserirBuild` (nucleo.js) devolve a mesma build ativa no
mesmo lugar e recusa se a lista já tem 3. Teste e2e: `tests/e2e/desfazer_build.spec.mjs` (5 cenários).
