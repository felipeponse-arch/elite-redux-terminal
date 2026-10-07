# 12 — Apagar Build com desfazer

Status: pronto-para-agente
Bloqueado por: nenhum

## O que entrega
"Apagar esta" no editor de Build deixa de perder a Build na hora: o jogador vê um aviso com Desfazer por alguns segundos e pode trazer a Build ativa de volta.

## Critérios de aceite
- [ ] Desfazer restaura a mesma Build, ativa de novo, com tudo igual.
- [ ] Funciona por teclado e o aviso é anunciado pelo leitor de tela.
- [ ] Teste e2e: apagar, desfazer, conferir a Build.
- [ ] Nada de confirm() nativo (proibido no iframe, ver template).

## Comentários
Origem: revisão da interface pelas Web Interface Guidelines (Vercel) em 07/10, pontos quentes.
