# 01 — Integrar o commit de Arquitetura de 02/10

Status: pronto-para-agente
Bloqueado por: nenhum
Agentes: qa-processo, seguranca

## O que entrega
O commit `0baba76` (branch `worktree-arquitetura-adr`, base `1e0dca9`) entra no master: `docs/decisoes_arquitetura.md`
(4 decisões: worktree por sessão, dado derivado, rank lido por uma função, fronteira regras/tela), trava de máquina
em `scripts/verificar.mjs` (duas verificações não rodam juntas) e `scripts/checar_fronteira.mjs` no `npm run check`.

## Como verificar
Rebase sobre o master atual sem conflito perdido; `npm run check` com a trava de fronteira passando (ou as violações
novas desde 02/10 corrigidas); segunda verificação simultânea para na hora; hook de primeira. Atualizar a ADR 001 com o
fluxo de tickets de 07/10 (`docs/agents/issue-tracker.md`). Depois, apagar o worktree `.claude/worktrees/arquitetura-adr`
e a branch.
