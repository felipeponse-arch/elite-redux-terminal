# 03 — Checkpoint do trabalho parado e lista de encalhados (melhoria C)

Status: parcial (código pronto; depende da melhoria A para o nível leve)
Bloqueado por: A (gancho por nível) só para o `ER_WIP` ficar leve; o resto funciona já

## O que entrega
- `npm run encalhados` (`scripts/encalhados.mjs`): somente leitura. Uma linha por worktree de `.claude/worktrees` (e a pasta principal): branch, modificados, novos, em staging, commits que o master não tem e idade da última mudança. Detalhes (alertas e 5 primeiros arquivos) só dos que têm ALERTA: staging na pasta principal, sujo há mais de 24 h, branch com commits que o master não tem. Ignora o worktree do master e pastas fora de `.claude/worktrees`. Sai sempre com 0.
- `npm run checkpoint -- "motivo"` (`scripts/checkpoint.mjs`): num worktree de ticket, `git add -A` + commit `WIP: <motivo>` com `ER_WIP=1` no ambiente. Sem `--no-verify`. Recusa no master e na pasta principal; sem mudança, avisa e sai com 0.
- Testes em `tests/unit/encalhados_e_checkpoint.test.mjs`, em repositório git de tmpdir (não tocam nos worktrees reais).

## Depende da melhoria A
`scripts/verificar.mjs` ainda IGNORA `ER_WIP`: hoje o checkpoint passa pelo gate completo (pode falhar por "Outra sessão já está verificando"; esperar e repetir). Quando a melhoria A entrar, o gancho roda só o nível leve com `ER_WIP=1` e o checkpoint fica barato. Nada a mudar nos scripts deste ticket.

## Pendente de combinar
Incluir no prompt de todo agente de nível 1: "antes de parar, rode `npm run checkpoint -- \"motivo\"`" (texto em `agent-factory.md`, fora deste ticket).

## Critérios de aceite
- [x] `encalhados` lista contagens certas e marca os três alertas.
- [x] `checkpoint` commita, deixa limpo, recusa master/pasta principal, não commita sem mudança.
- [x] Gancho roda no checkpoint (teste prova `ER_WIP=1` visto pelo gancho).
- [ ] Nível leve do gancho com `ER_WIP` (melhoria A).

## Comentários
- Alerta "à frente do master" dispara em todo ticket em andamento, por pedido; serve de lembrete para juntar ou descartar.
