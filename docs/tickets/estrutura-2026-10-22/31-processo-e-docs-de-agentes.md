# TK-31 — Processo e docs de agentes: modelo conforme CLAUDE.md (14/10); grafo com os agentes novos; revisor definido; verificador sem contradição; aprendizados e memory: onde faltam; regras da equipe em um arquivo; ler o corpo dos quatro agentes; riscos aceitos registrados

Status: em-revisao
Bloqueado por: nenhum
Onda 4: campo final, UI, testes e processo
Dono executor: qa-processo · Revisor: supervisor
Origem: `C:/Users/Ponse/Documents/Claude/teste/relatorios/fase-a_inventario.md` (achados IDs: qa-17.1 a 17.10, qa-17.NV); relatórios `C:/Users/Ponse/Documents/Claude/teste/relatorios/fase-a_*.md`.

## Regras
- Código do jogo é a verdade (er-repo, branch upcoming). O que não estiver lá: pesquisa na rede (`pesquisador-web`) antes de mexer.
- Regra de jogo: `pesquisador-de-mecanica` entrega o pacote de evidência antes do executor.
- Decisões do usuário: `C:/Users/Ponse/Documents/Claude/teste/relatorios/fase-a_matriz.md`, seção "Decisões do usuário (27/10)".
- Um worktree por ticket (`docs/agents/issue-tracker.md`); TDD; verificador antes da junção; revisor no fim.

## Achados cobertos
| ID | Resumo | Arquivo:linha |
|---|---|---|
| qa-17.1 | politica-de-modelo §2b manda Sonnet para todos; Haiku em gerente, verificador, pesquisador | docs/agents/politica-de-modelo.md §2b |
| qa-17.2 | engenheira-de-codigo e revisor-de-codigo fora do grafo; pesquisador e verificador fora de §1 | docs/agents/loops-e-grafos.md §1; docs/agents/agent-factory.md §1 |
| qa-17.3a | Alteração de texto de agente sem revisor (gerente acrescenta regra dura): risco, registrar | .claude/agents/gerente.md:70-72; loops-e-grafos.md §3.3 |
| qa-17.3b | Revisor de engenheira-de-codigo não definido no próprio arquivo | .claude/agents/engenheira-de-codigo.md:41-50 |
| qa-17.4 | verificador.md proíbe commit (:9) e manda commitar o mapa (:38) | .claude/agents/verificador.md:9, :38 |
| qa-17.5 | supervisor cita ADR-004; regra do projeto usa "decisões" | .claude/agents/supervisor.md; docs/decisoes_arquitetura.md:108 |
| qa-17.6 | aprendizados.md ausente em 4 agentes; memory: ausente em 3 | .claude/agent-memory/ (arquiteta, pesquisador, playtester, verificador) |
| qa-17.7 | Teto de 35 chamadas sem medição | docs/agents/politica-de-modelo.md §3; loops-e-grafos.md §5 |
| qa-17.8 | Orquestrador revisa G e mecânica (risco aceito; registrar) | docs/agents/loops-e-grafos.md §2 |
| qa-17.9 | Bloco "Regras da equipe" copiado em cerca de 15 agentes | .claude/agents/*.md |
| qa-17.10 | Tabela de consumo de modelo vazia | docs/agents/politica-de-modelo.md §3 |
| qa-17.NV (nº meu) | Corpo de quatro agentes não lido (engenheira-de-codigo, playtester, seguranca, ux) | .claude/agents/ |

## Pronto quando
Todos os achados acima resolvidos (ou, nos de pesquisa, respondidos com fonte), cada correção com teste que falha sem
ela, e revisor aprovando.

## Comentários

### 28/10/2026 — qa-processo (executor, Sonnet 5.5)
Feito (docs no branch ticket/31; agentes fora do repo, originais em `teste/.claude/agents/_backup_2026-10-27/`):
- 17.1 politica-de-modelo §2b alinhada ao CLAUDE.md de 14/10 (inclui pesquisador-web Haiku).
- 17.2 engenheira-de-codigo, revisor-de-codigo, pesquisador-web no grafo (loops §1-§2, agent-factory §1); pesquisador/verificador listados.
- 17.3a risco aceito (loops §6 e nota no gerente.md). 17.3b revisor da engenheira definido no próprio arquivo. Revisor também para texto de agente/doc/prompt/ticket.
- 17.4 verificador: proibição de commit mantida, exceção explícita só para o commit do mapa regenerado.
- 17.5 supervisor cita `docs/decisoes_arquitetura.md` (ADR-004 existe); não era contradição, faltava o caminho.
- 17.6 aprendizados.md criado (vazio) para arquiteta, pesquisador-de-mecanica, playtester, verificador, engenheira-de-codigo, revisor-de-codigo, pesquisador-web. `memory:` no cabeçalho NÃO adicionado (ver comitê).
- 17.7, 17.8, 17.10 registrados como riscos aceitos (loops §6; nota em politica §3).
- 17.9 regras da equipe em `teste/.claude/regras-da-equipe.md`; 16 agentes apontam para ele.
- 17.NV corpo dos 4 agentes lido (playtester, seguranca, ux, engenheira-de-codigo): sem contradição com as regras vigentes.
Para o comitê: (a) `memory: project` ausente em construtor, engenheira-de-codigo, pesquisador-web, revisor-de-codigo (adicionar dá Write/Edit ao revisor, que é só leitura); (b) blocos "Orçamento de contexto" e "Mapa do código" ainda repetidos em ~12 agentes (candidatos a ir para regras-da-equipe.md); (c) arquivo único fica fora do repo (para valer já); mover para docs/agents é decisão do usuário; (d) CLAUDE.md/ganchos: nada a mudar.
