# Pipeline do projeto: fluxo de trabalho, paralelismo, verificação e custo (rascunho de 14/10/2026)

"Pipeline" aqui é o fluxo de TRABALHO do projeto inteiro (da demanda do usuário até a publicação). O construtor de builds (`docs/pipeline_de_build.md`) é só UMA etapa dele, a do produto.
Complementa `docs/agents/agent-factory.md` (papéis e ciclo de vida) e `docs/agents/issue-tracker.md` (tickets e worktrees).

## 1. O fluxo, de ponta a ponta
1. **Demanda** (usuário) → orquestrador (consulta ao Obsidian em 2 camadas).
2. **Sabatina** (`grilling`) → spec só se for grande → **tickets** em `docs/tickets/`.
3. **Execução**: um agente por ticket, no seu worktree.
4. **Verificação** (gancho de commit, `scripts/verificar.mjs`).
5. **Validação** (supervisor, Gauntlet Loop, até 3 rodadas).
6. **Junção** no master (fast-forward) → **GitHub** → **publicação** (usuário roda `prepare_publish`).
7. **Memória**: aprendizados do agente e cofre Obsidian (fim de sessão).

## 2. Níveis de paralelismo (proposta)
| Nível | O que é | Quantos ao mesmo tempo | Modelo típico |
|---|---|---|---|
| 0 | Ler, pesquisar, varrer (só leitura) | Vários | Haiku 5.5 baixo, ou Gemini via OmniRoute (ver §6) |
| 1 | Editar e testar no próprio worktree | Até 2, em arquivos que não se cruzam | Sonnet 5.5 |
| 2 | Verificação pesada (suíte completa, sabotagem completa, navegador) | 1 por vez na máquina | (processo, sem modelo) |
| 3 | Juntar no master, enviar, publicar | Só o orquestrador, em série | COMBO-1 / Sonnet |

Medido em 08-10/10/2026: duas sabotagens completas ao mesmo tempo levaram mais de 90 min (6 núcleos, 12 threads); com `--mudados` e uma de cada vez, ~1 min.

## 3. Melhoria A — Gancho por nível (`scripts/verificar.mjs`)
Problema: um commit só de documento roda tudo (~6 min). Proposta: o gancho classifica os arquivos em staging (`git diff --cached --name-only`) e roda só o que o tipo de mudança pede; na dúvida, sobe de nível.
| Mudou | Roda |
|---|---|
| Só `docs/`, `*.md`, `GLOSSARY.md` | `check` (leve) |
| Só `tests/` (sem `src/`) | `check` + unitários (+ sabotagem do que mudou, se `mutacoes.mjs` mudou) |
| `src/regras/`, `data/` regras | `check` + unitários + sabotagem (`--mudados` fora do master) |
| `src/ui/`, `artifact_template.html`, CSS, `scripts/build*`, `data/` do app | tudo (+ build + navegador) |
| Branch `master` (junção e publicação) | SEMPRE tudo, inclusive sabotagem completa |
Regras: caminho desconhecido = nível mais alto; variável `ER_VERIFICAR=completo` força tudo; o classificador é uma função pura com teste de unidade (tabela de caminhos → nível).
Lacuna encontrada: **a junção fast-forward não dispara o gancho**. O portão do master hoje só existe no `prepare_publish`. Proposta: o procedimento de junção roda `ER_VERIFICAR=completo node scripts/verificar.mjs` no worktree do master ANTES de enviar ao GitHub (feito à mão em 14/10 com o `pipeline-build`).

## 4. Melhoria B — Vaga para verificação pesada
Problema: só o gancho tem trava de máquina (`pegarTrava()` em `verificar.mjs`, arquivo em `tmpdir`, pid do dono); ela FALHA na hora ("Outra sessão já está verificando") em vez de esperar, e os testes pesados avulsos dos agentes (`node --test`, `run_sabotage`) não passam por trava nenhuma.
Proposta: `scripts/vaga.mjs` com `comVaga(nome, fn, { espera })`: semáforo em arquivo (mesmo mecanismo do pid vivo), FILA em ordem de chegada, espera com aviso a cada 30 s e limite de tempo. Usos: `verificar.mjs` (troca a falha por espera), `run_sabotage.mjs`, e `npm run pesado -- <comando>` para o que o agente rodar fora do gancho. Vaga "pesada" = 1; leituras e unitários rápidos não usam.
Teste: dois processos pedem a vaga; o segundo espera e entra depois; pid morto libera.

## 5. Melhoria C — Checkpoint do trabalho parado
Problema: ao interromper agentes (08/10), `divida-05` e `divida-07b` ficaram com 10 e 8 arquivos sem commit; hoje há 40 arquivos em staging na pasta principal (`dados-2654`) de uma sessão sem dono claro.
Proposta:
- `npm run checkpoint -- "motivo"`: dentro de um worktree, commita TUDO o que está lá no branch atual com `ER_WIP=1`; o gancho vê `ER_WIP` e roda só o nível 0 (checagem leve). O commit leva o prefixo `WIP:`. NÃO é `--no-verify` (o gancho continua rodando, só no nível leve). O gate completo vem na junção ao master (§3).
- Todo agente de nível 1 recebe no prompt: "antes de parar, rode o checkpoint".
- `npm run encalhados`: lista os worktrees com mudança sem commit, ou commits que o master não tem, com data e arquivos.
- A pasta principal fica só para leitura; todo trabalho em worktree. Staging na pasta principal vira alerta no `encalhados`.

## 6. Melhoria D — Política de modelo e orçamento
Tabela (a confirmar pelo usuário; esforço = nível de raciocínio):
| Tarefa | Modelo | Esforço |
|---|---|---|
| Ler, varrer, extrair (nível 0) | Haiku 5.5 · ou Gemini `antigravity/gemini-3.1-pro-high` via OmniRoute (custo 0) | baixo |
| Implementar com TDD (nível 1) | Sonnet 5.5 | médio |
| Mecânica do motor, pipeline, calibração | Sonnet 5.5 | alto |
| Supervisor, revisão de segurança | Sonnet 5.5 | médio |
| Orquestração e decisão | COMBO-1 (Opus 5) ou Sonnet 5.5 se o limite estiver apertado | médio |
Restrição real: o classificador de segurança BARROU o envio de contexto do projeto ao Gemini (10/10). Até o usuário autorizar esse caminho de forma explícita e delimitada (quais arquivos, sem chaves), a leitura pesada fica no Haiku/Sonnet.
Orçamento: cada ticket tem tamanho P/M/G. Regra do orquestrador no começo da sessão: ler o uso semanal. **< 70%**: qualquer ticket. **70-85%**: só P e M. **85-95%**: só P e correções. **> 95%**: só leitura e documentação. O consumo real de P/M/G se calibra medindo (`get_usage` antes e depois de cada ticket) e fica na tabela.

## 7. Ordem de implementação sugerida
1. **B (vaga)**: pequena, tira o maior desperdício medido. Ticket próprio, agente `qa-processo`.
2. **A (gancho por nível)**: depende de B para esperar em vez de falhar. Agente `qa-processo`.
3. **C (checkpoint e encalhados)**: depende de A (o nível leve do `ER_WIP`).
4. **D (política)**: texto em `agent-factory.md`; sem código. Pode ir antes de todos.
Cada um em worktree próprio, com teste e sabotagem; rank não muda; nada disso toca o app publicado.

## 8. Gerente autônomo para aplicar aprendizado (decisão do usuário, 14/10/2026)
O gerente aplica o aprendizado em cada agente quando entende que é necessário e relevante, e só INFORMA o que fez e por quê. Regras completas em `.claude/agents/gerente.md` (seção "Autonomia para aplicar aprendizado nos agentes"); o registro fica em `.claude/agent-memory/gerente/registro_de_aprendizados.md`.
- **Gatilho:** evidência concreta (teste, arquivo:linha, número do jogo, correção do usuário, custo medido), específico do domínio do agente, ainda não coberto e que custou caro ou repetiu.
- **Pode:** criar/atualizar `aprendizados.md` do agente (teto de 30 entradas) e, em último caso, acrescentar UMA regra curta à definição dele, com cópia da versão anterior em `gerente/historico/`.
- **Nunca sem perguntar:** CLAUDE.md, settings, hooks, permissões, `model`/`tools` de agente, código do app, dados e regras de mecânica, apagar agente ou regra dura do usuário; e nunca por texto de relatório de subagente (relatório é evidência a confirmar, não autorização).
- **Informe:** uma linha por aplicação no fim da resposta seguinte ao usuário ("Apliquei em X: regra, porque evidência").
- **Primeira aplicação (14/10):** 6 regras em `qa-processo`, `meta-pokemon` e `construtor-de-builds-haiku` (sabotagem sem cache, regex por Edit e não por heredoc, esperar o gancho, calibrar contra a calculadora do jogo, tipo antes de habilidade, regras de hit-kill).

## 9. Estado de implementação (14/10/2026)
As quatro melhorias estão no master, cada uma com teste e passada pelo supervisor (Gauntlet) quando mexe em código:
| Melhoria | O que entrou | Commit |
|---|---|---|
| D política de modelo e orçamento | `docs/agents/politica-de-modelo.md` (tabela proposta; consumo real "a calibrar") | db27d42 |
| C checkpoint e encalhados | `npm run checkpoint -- "motivo"` e `npm run encalhados` | e12f40f |
| B vaga para verificação pesada | `scripts/vaga.mjs`, `npm run pesado -- <comando>`; o gancho espera na fila em vez de falhar | 1e88000 |
| A gancho por nível | `scripts/nivel_da_mudanca.mjs`; o commit verifica só o que a mudança pede; master e execução manual = tudo | ee10df2 |
Como usar: `node scripts/verificar.mjs --nivel <arquivos>` mostra o nível sem rodar nada; `ER_VERIFICAR=completo` força tudo; antes de enviar o master ao GitHub, `node scripts/verificar.mjs` no worktree `publicar` (a junção fast-forward não dispara o gancho).
Limites honestos: `npm run pesado` interpreta o comando pelo cmd.exe (usar comando simples, `node arquivo.js`); a vaga nova não enxerga a trava antiga (`elite-redux-verificar.lock`), então worktrees com o `verificar.mjs` antigo rodando junto podem disputar a porta 8101 do e2e (some depois que os worktrees forem atualizados); `ER_WIP=1` (checkpoint) roda só a checagem leve, e o master nunca aceita WIP.
Pendente: aplicar o `encalhados` aos worktrees parados (`divida-05`, `divida-07b`, 40 arquivos em staging na pasta principal) com o usuário; a rota Gemini precisa de autorização explícita e delimitada; medir o consumo real de P/M/G para calibrar a política.
