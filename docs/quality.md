# Qualidade

## Portão (scripts/verificar.mjs, gancho de pré-commit)
Escolhe o nível pelo que está em staging (`scripts/nivel_da_mudanca.mjs`); no master e no `prepare_publish` roda tudo.
| Nível | Mudou | Roda |
|---|---|---|
| 0 | só docs / .md | `npm run check` |
| 1 | só tests/unit | check + unitários (+ sabotagem se mexeu em mutacoes.mjs) |
| 2 | src/regras, scripts da lista branca | check + unitários + sabotagem |
| 3 | resto (UI, template, build, master) | check + unitários + sabotagem + build + navegador |

- `npm run check`: ESLint 10 (inclui o template), stylelint + `checar_css` (3 temas), `tsc` (checkJs), sintaxe, codificação
  (UTF-8, BOM em `.ps1` com acento), fronteira regras x UI.
- Unitários: `node --test tests/unit/*.test.mjs` (dado real; correção só com teste que falha sem ela).
- Sabotagens: `tests/unit/mutacoes.mjs` + `node tests/run_sabotage.mjs` (cada regra importante tem uma sabotagem que um teste
  pega; incremental no dia a dia, completa no `prepare_publish`).
- Navegador: Playwright (`tests/e2e`, `scripts/smoke_tests`), 0 erros de JavaScript.
- Nunca `--no-verify`; nunca afrouxar regra, teste ou sabotagem para passar.

## Regras em adoção
- `max-lines` 350 como **aviso** em `src/` (17/10/2026: 14 arquivos acima). Plano: `docs/tickets/arquivos-grandes/01`.

## Revisão
- Mudança não trivial: revisão independente (agente `supervisor`, Gauntlet Loop) antes de chegar ao usuário.
- Segurança: `docs/prompts/revisao-de-seguranca.md` (prompt do toolkit, só leitura, relatório privado), rodado pelo agente
  `seguranca`. Modo repositório ou intervalo de commits.
- Acessibilidade e UX: agente `ux-acessibilidade` (WCAG 2.2, eMAG 3.1).
