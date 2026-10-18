# Primeira vez no projeto

1. **Requisitos:** Node (o CI usa a versão do `.github/workflows/ci.yml`) e npm. No Windows, PowerShell 5.1 serve para os
   scripts `.ps1` (salvar `.ps1` com acento em UTF-8 com BOM; a checagem de codificação barra o contrário).
2. **Instalar:** `npm ci`. Para os testes de navegador: `npx playwright install chromium`.
3. **Montar:** `npm run build` gera `artifact_final.html` (abre direto no navegador). O dado vem de `data/` (versionado).
4. **Verificar:** `npm run check` (rápido) e, antes de commitar, `npm run verificar` (o gancho de pré-commit roda sozinho,
   pelo nível da mudança). Ver `docs/quality.md`.
5. **Dado novo do jogo:** skill `atualizar-dados-do-jogo` (ou `docs/pipeline_do_projeto.md`). Rank:
   `scripts/calcular_rank_duelo.mjs` + `scripts/calcular_rank_v2.mjs --gravar` (demora: ~40 min em todos os núcleos).
6. **Trabalho:** tickets em `docs/tickets/`; fluxo sabatina → tickets → um worktree por ticket → portão → merge → publicar.
7. **Publicar:** só pela skill `publicar-versao`.

Problemas conhecidos: `python`/`py` puros são bloqueados pelo gancho do projeto (o atalho da Microsoft Store travava); o
único uso de Python é o Graphify, num ambiente isolado em `teste/ferramentas/graphify` (ver `docs/setup.md`).
