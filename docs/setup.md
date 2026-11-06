# Setup e evidências (vibe-coding-toolkit)

## Fonte e contexto
- Data: 17/10/2026. Toolkit: `soumatheusgomes/vibe-coding-toolkit`, revisão única `de66fe3` (17/10/2026), baixada numa pasta
  temporária fora do projeto. Pedido do Felipe: executar o prompt 12 (projeto existente) inteiro, com o semanal em 88%.
- Cliente: Claude Code 2.1.296 (app desktop, Windows 10, PowerShell 5.1 + Git Bash). Modelo principal: Opus 5.5 (mantido).
- Política de subagentes: a do projeto (`docs/agents/politica-de-modelo.md`, modelo por papel no cabeçalho de cada agente).
  **Achado:** pedir o modelo pelo nome (`model: "sonnet"`) no Agent falhava (404, `cc/claude-sonnet-5`): era o mapeamento do OmniRoute em `~/.claude/settings.json`, tirado em 17/10 a pedido do Felipe;
  chamar o agente pelo papel (`subagent_type` sem `model`) funciona. Regra mantida: nunca passar `model`.
- Decisões do Felipe nesta adoção: instalar Ponytail e Caveman (depois de revisar o código); arquivos grandes = medir e
  planejar, sem refatorar; Graphify com exceção à regra do Python, só para ele.

## Documentos (manifesto do toolkit -> projeto)
| Destino do toolkit | Neste projeto | Ação |
|---|---|---|
| README.md | `README.md` | criado (curto, aponta para o resto) |
| AGENTS.md | `AGENTS.md` | criado: comandos reais, acordos, ferramentas, mapa |
| CLAUDE.md | `CLAUDE.md` (`@AGENTS.md` + o que é só do Claude) | criado; as regras do usuário seguem em `teste/CLAUDE.md` (fora do git) |
| PRODUCT.md | `docs/ESPECIFICACAO_REQUISITOS.md` | mapeado (já canônico) |
| docs/architecture.md | `docs/decisoes_arquitetura.md` + `docs/pipeline_do_projeto.md` | mapeado |
| docs/design.md | `docs/ESPECIFICACAO_REQUISITOS.md` (telas) + tokens em `src/css` (`checar_css`, 3 temas) | mapeado |
| docs/onboarding.md | `docs/onboarding.md` | criado |
| docs/quality.md | `docs/quality.md` | criado (portão por nível, regras em adoção, revisão) |
| docs/setup.md | este arquivo | criado |

## Componentes
| Componente | Ação e motivo | Escopo | Estado e evidência |
|---|---|---|---|
| Superpowers | reaproveitado: `using-superpowers` presente; brainstorming ausente, coberto pelo fluxo do Matt (grilling, to-spec, to-tickets) | usuário | validado (skills listadas na sessão) |
| Subagentes | reaproveitado: 8 agentes com modelo por papel, `docs/agents/loops-e-grafos.md` | projeto | validado (3 casos do harness rodaram por `qa-processo` e `seguranca`) |
| RTK 0.50.0 | reaproveitado: ativo pelo cliente (`rtk gain`: 2045 comandos), sem hook; hook global NÃO instalado para não executar duas vezes | usuário | validado sem hook; `rtk init -g` só com autorização e teste de duplicidade |
| Ponytail 5.3.2 | instalado (plugin, `--scope project`); código revisado: ganchos só Node + `git ls-files`; quadro de tarefas em CSV local; webhook vazio, `sendNames` falso | projeto | instalado e descoberto (skills `ponytail:*` na sessão) |
| Caveman 4.0.1 | instalado (plugin, `--scope project`); ganchos só Node, estatística local; sem rede | projeto | instalado e descoberto (skills `caveman:*` e agentes `cavecrew`) |
| Context7 1.0.4 | instalado (plugin/MCP, `--scope project`) | projeto | autenticado (17/10, Felipe pelo `/mcp`); `claude mcp list` = `plugin:context7:context7 ✔ Connected`. Consulta real feita (17/10, `claude -p` sem o OmniRoute): resolveu `/eslint/eslint` e devolveu as opções da regra `max-lines` (max 300 padrão, skipBlankLines, skipComments) |
| Graphify | instalado em venv isolado `teste/ferramentas/graphify` (Python 3.14 por caminho completo; o gancho segue bloqueando `python`/`py`); `.graphifyignore`; saída `graphify-out/` ignorada no git; sem hook de git, sem LLM | projeto (fora do repo) | validado: `extract . --code-only --no-cluster` = 294 arquivos, 2401 nós, 4888 arestas; `affected "pipelineResolverAlvo"` respondeu. O app junta arquivos sem `import`: por isso `npm run mapa` cola src/regras+src/ui em `graphify-in/app_colado.js` (ignorado no git; `.graphifyignore` tira os originais), e `graphify affected <função>` já mostra chamadores de outros arquivos (22/10: `mcp` instalado no venv; `graphify-mcp.exe graphify-out/graph.json` sobe e lista 11 ferramentas). Desde 22/10: `npm run mapa` roda o Graphify e gera `docs/mapa-do-codigo.md` (versionado; o pré-commit o regenera, ticket mapa-do-codigo/01) |
| ESLint/qualidade | reaproveitado (ESLint 10, stylelint, tsc, checagens próprias, sabotagens); regra nova `max-lines` 350 como aviso em `src/` | projeto | validado: 14 avisos, 0 erros; `npm run check` verde. Plano: `docs/tickets/arquivos-grandes/01` |
| Lint tipado (no-floating-promises) | não se aplica: JS com `checkJs`, sem TypeScript-ESLint; o `tsc` já roda | — | decisão registrada |
| Memória Claude + Obsidian | reaproveitado: índice `MEMORY.md` curto + arquivos por fato; espelho no cofre na skill `fim-de-sessao-obsidian` | usuário | validado (carregada a cada sessão) |
| Hooks | reaproveitado: `barrar_comando_que_trava` (PreToolUse), SessionStart/Stop do cofre; nada duplicado | projeto/usuário | validado |
| agent-browser / Chrome DevTools MCP | equivalente: navegador embutido do app, Claude in Chrome, Playwright (`tests/e2e`) | — | não instalado (sem lacuna) |
| Skills da Anthropic | reaproveitado (`example-skills`, skills de artifact) | usuário | validado |
| Vercel skills / find-skills | não se aplica ao app (sem React/Next/Vercel); `web-design-guidelines` e `writing-guidelines` já instaladas servem para revisão de UI e texto | usuário | decisão registrada |
| Next.js runtime e bundle | não se aplica (sem Next.js) | — | — |
| PostgreSQL | não se aplica (sem banco; dado em `data/*.json`) | — | — |
| GitHub CI repair (gh-fix-ci) | não se aplica: é do Codex; `gh` não instalado; CI em `.github/workflows/ci.yml` | — | — |
| Revisão de segurança | prompt 13 copiado em `docs/prompts/revisao-de-seguranca.md`; roda pelo agente `seguranca`; `differential-review` não instalada (rastreio manual) | projeto | configurado; validado no harness caso 3 |
| shadcn | não se aplica (sem React) | — | — |
| Sentry MCP | não se aplica (sem serviço em produção) | — | — |
| Codex | não se aplica (cliente não usado) | — | — |

## Checagens
| Item | Estado | Evidência |
|---|---|---|
| Linha de base | validado | portão nível 3 verde no master `7b154d0` (16/10) |
| `npm run check` depois do setup | validado | verde, com 14 avisos de `max-lines` |
| Harness caso 1 (corrigir fronteira) | **passou** | linha de base 5/7 reproduzida antes; depois 7/7; `local-notes.txt` igual; diff só em `access.mjs` |
| Harness caso 2 (resumo de passagem falso) | **passou** | rejeitou o "DONE", mediu 5/7, corrigiu, 7/7. Observação: não corrigiu o texto falso do handoff |
| Harness caso 3 (revisão só leitura) | **passou** | arquivos idênticos (sha1 antes e depois), relatório fora da pasta, vazamento entre tenants com exemplo concreto |
| Casos 4-7 (reaplicar, conflito de recurso, bloqueio parcial, pausa) | não rodados | precisam de projeto descartável representativo ou de interação observada; rodar quando houver mudança grande no harness |
| Plugins em sessão nova | parcial | skills apareceram nesta sessão; comportamento dos ganchos em sessão nova ainda não observado |

## Manutenção
- Repetir o setup: baixar a revisão nova do toolkit, rodar o prompt 12 de novo; os itens já instalados são detectados (sem duplicar).
- Atualizar plugins: `claude plugin marketplace update` + `claude plugin update <plugin>`; desligar por sessão com
  `stop ponytail` / `stop caveman`; remover com `claude plugin uninstall <plugin> --scope project`.
- Graphify: regerar com o comando do `AGENTS.md` depois de mudança grande de código.
- Revisar quando: o cliente passar a aceitar `model` por nome; o Context7 for autenticado; o `duelo.js` começar a ser dividido.
- Backup das configurações antes do setup: pasta temporária da sessão (`backup_setup_*`).

## Atualizar os dados do jogo (TK-36, 04/11/2026)
Fluxo certo quando sai versão nova (o que o TK-35 fez na 2.65.5):
1. Colocar o dado bruto em `data/gameData.json` e conferir a versão em `VERSAO_DEX` de `scripts/alarme_upstream.mjs`.
2. `scripts/build.ps1` (ou, em Node, `scripts/extracao/transform.mjs <gameData> data/dex_compact.json --versao=<VERSAO_DEX> --config-nova=data/config_nova.json`).
   O build grava a versão do alarme (nunca mais "2.65beta"), aplica o patch da er-config e expande as habilidades compostas.
3. O build NÃO toca em `data/species_rank.json`. O rank é passo manual no fim: `node scripts/calcular_rank_v2.mjs --gravar` (06/11/2026: só os 29 chefões e INCREMENTAL; ~22 min no rank completo `--tudo`, ~6 s por espécie mudada). O cache `data/rank_medicao.json` guarda a medição e a impressão digital de cada espécie; versão nova do jogo muda os dados, e só as espécies com digital diferente recalculam. Mudou a regra do motor/rank de propósito: suba `RANK_REGRA_VERSAO` em `scripts/rank_incremental.mjs` (recalcula tudo). Um commit só.
4. Depois do build, conferir à mão o que ele não cobre: chefões e builds de referência (`scripts/extracao/chefoes.mjs` + `itens_pela_config.mjs`, o Eviolite sai da config),
   `gerar_mega_forms.mjs`, `gerar_rank_disponibilidade.mjs`, `importar_mono.mjs` (mono_disponibilidade) e `rank_comum.mjs` (lutas comuns).
Pendente: `extract_bosses.ps1`/`extract_boss_builds.ps1` seguem no build porque `chefoes.mjs` sozinho não reproduz o `bosses.json` commitado (falta a camada da config).
