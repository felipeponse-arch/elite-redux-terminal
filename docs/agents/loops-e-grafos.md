# Loops e grafos: como a equipe entrega (decisão do usuário, 14/10/2026)

Meta do usuário: **entregas mais rápidas, mantendo a qualidade e economizando tokens.** O modelo de cada papel se
escolhe pelo custo POR ENTREGA PRONTA (voltas de revisão + tempo + tokens totais), não pelo preço de cada chamada.
Evidência: vídeo "1 Opus x 100 Haikus" (Maestros da IA, 14/10): um exército de Haikus em grafo saiu ~4x mais caro e
~7x mais lento que o Opus sozinho, e pior; o melhor foi um modelo forte COM grafo e loops. Aqui, em 14/10, o
revisor forte pegou 5 defeitos reais que os executores deixaram passar, e as horas perdidas vieram de portões
concorrentes e testes frágeis, não do modelo.

## 1. Modelo por papel
| Papel | Modelo | Por quê |
|---|---|---|
| Orquestrador (sessão principal) | Opus 5.5 | Monta o grafo, revisão final de G e mecânica, junção e GitHub |
| supervisor (revisor em contexto separado) | Sonnet 5.5 | É quem segura a qualidade |
| engenheira-do-motor, engenheira-frontend, engenheira-de-codigo (22/10/2026), arquiteta-de-software, designer-de-interface, analista-do-rank (os três últimos de 12/11/2026) | Sonnet 5.5 | Escrevem código ou decidem |
| gerente (triagem), verificador, pesquisador-de-mecanica, pesquisador-web (27/10/2026), engenheira-de-release e engenheira-de-desempenho (12/11/2026), varreduras | Haiku 5.5 | Ler, extrair, conferir, rodar portão: tarefa mecânica e verificável |
| arquiteta-de-dados, construtor-de-builds, meta-pokemon, playtester-de-build, qa-processo, revisor-de-codigo, seguranca, ux-acessibilidade, ponte-gpt (12/11/2026) | Haiku 5.5 (cabeçalho em 13/11/2026) | Ver a nota abaixo |

Equipe atual: 22 agentes em `teste/.claude/agents/` (13/11/2026). O modelo de cada um é o do cabeçalho `model:` do arquivo; esta tabela só o espelha.
Nota (13/11/2026): a regra do usuário de 12/11/2026 põe Sonnet para quem escreve código ou decide e Haiku para gerente, verificador, pesquisadores, release e desempenho. Os nove agentes da última linha estão em Haiku no cabeçalho; se algum deles deve voltar a Sonnet fica para o usuário decidir.
`supervisor-opus` foi aposentado em 20/10/2026 (cópia em `teste/salvaguarda/antes_ruflo_2026-10-20/`): G e mecânica têm revisão final do orquestrador.

## 2. O grafo (por demanda)
O orquestrador quebra a demanda em nós (DAG). Cada nó tem dono, entrada, **saída verificável** (commit, teste que
falha sem a mudança, relatório no formato do agente), arquivos que toca, tamanho (P/M/G) e dependências.
- Nós só de leitura (pesquisa, varredura, sonda): vários em paralelo.
- Nós que editam: até 2 ao mesmo tempo, em arquivos disjuntos.
- Nós pesados (suíte, sabotagem, navegador): 1 por vez na máquina, pela vaga (`npm run pesado`); quem roda é o `verificador`.
- Junção no master, GitHub e publicação: só o orquestrador, em série, com o portão completo PASSANDO antes do `push`.
- Informação que NÃO está no código do jogo (er-repo/er-config): nó `pesquisador-web` antes do executor (regra do usuário, 27/10/2026: código do jogo é a verdade; sem resposta nele, pesquisa na rede). Ele só pesquisa e relata, com fonte e data.
- Revisão de código: nó `revisor-de-codigo` (só leitura) entre o `verificador` e o `supervisor` quando o ticket mexe em código fora do motor ou em arquitetura; para texto de agente, doc, prompt ou ticket ele também é o revisor.
- Modo noturno (skill `modo-noturno`, 27/10/2026): com o usuário dormindo, decisão que iria a ele passa por comitê (especialista + supervisor + gerente, 2 de 3 aprovam); a permissão acaba quando ele volta.
- Mecânica: todo nó que mexe em golpe/habilidade/regra do motor depende de um nó `pesquisador-de-mecanica` antes.

```
pesquisador-de-mecanica (N em paralelo, só se for mecânica) / pesquisador-web (se o código do jogo não responde)
        ↓ pacote de evidência (arquivo:linha + caso de dado real)
executor (TDD, worktree do ticket) → verificador → [revisor-de-codigo] → supervisor   ← loop, até 3 voltas
        ↓ VERDE + APROVADO
orquestrador: revisão final (G e mecânica) → junção → portão completo → GitHub
```

## 3. O loop (por nó)
1. **Executar**: a menor mudança que cumpre o critério, com o teste antes.
2. **Verificar** (oráculo automático): o `verificador` roda o portão do nível certo e classifica a falha. Vermelho por
   defeito volta direto ao executor, SEM gastar o supervisor.
3. **Revisar**: com VERDE, o `supervisor` julga contra o pedido. REFAZER volta ao executor.
4. **Limite**: 3 voltas. Estourou → orquestrador julga ou leva ao usuário.
5. **Aprender**: erro que custou uma volta vira linha no `aprendizados.md` do agente; se o agente não escreveu, o orquestrador escreve (`agent-factory.md` §3, rede de segurança).
6. **Registrar**: o orquestrador grava o resultado do nó no Ruflo (§5).

## 4. Regras que economizam voltas e tokens
- **Portão pesado só na junção (usuário, 22/10/2026):** o executor commita no branch com `ER_WIP=1 git commit` (o gancho roda só o nível 0; nunca --no-verify) e o `verificador` roda sabotagem + navegador UMA vez antes da junção no master. Correção de REFAZER vai para um agente novo com resumo curto quando o contexto do executor estiver grande.
- Prompt de nó fechado: nó do grafo, entrada, critério de aceite, caso de dado real, arquivos permitidos, "relatório curto e pare".
- Executor não roda suíte nem sabotagem completas: só os testes do que mudou; o resto é do `verificador`.
- Agente da equipe: chamar pelo `subagent_type` SEM `model` (o cabeçalho manda); agente genérico: `model: "haiku"` ou `"sonnet"`.
- Atribuição de commit: executores `Claude Sonnet 5.5`; orquestrador `Claude Opus 5.5`.

- Cada nó declara a PRIORIDADE do critério quando houver conflito (ex.: estabilidade > velocidade; fidelidade à fonte > cobertura).
- Revisão com ferramenta, não só leitura: em mudança de tela (nível 3), o `verificador` abre o build no navegador
  (preview) e confere com captura/leitura da página; em mecânica, o supervisor confere o pacote do pesquisador.
- Supervisor em contexto separado do executor, sempre (sem o "viés de execução" de quem fez).
Fonte das duas últimas: vídeo "Grafos de IA" (Maestros da IA, 15/09/2026): loop = trabalhador + supervisor com
critério de verificação definido antes; grafo = loops em paralelo; teto de rodadas para não gastar tokens; base no
padrão ReAct (pensar, agir, observar).

## 5. Medir
Nos próximos tickets: uso (janela e semanal) antes e depois, voltas de revisão e tempo, numa tabela em
`docs/agents/politica-de-modelo.md`. A tabela da §1 muda só com esse dado.

**Registro por nó no Ruflo (usuário, 20/10/2026).** No fim de cada nó, o orquestrador chama `memory_store` com
`namespace: "medicao-nos"`, chave `<data>_<nó>_<executor>` e valor JSON
`{data, no, executor, modelo, tamanho, voltas, aprovado, revisor, motivo_refazer}`. A tabela sai de
`memory_list` (namespace `medicao-nos`). O % do limite semanal continua lido à mão (`get_usage`): o Ruflo não vê o
limite. Testado em 20/10: grava em `teste/.swarm/memory.db` e persiste. `hooks_model-outcome` NÃO serve: o
`hooks_model-stats` não conta esses registros e corta o texto da tarefa.

**Se as ferramentas MCP do Ruflo caírem (21/10):** grave pela linha de comando, no mesmo banco:
`node C:/Users/Ponse/Documents/Claude/teste/ferramentas/ruflo/node_modules/ruflo/bin/ruflo.js memory store --namespace medicao-nos --key <chave> --value <json>`
(e `memory list --namespace medicao-nos`). O servidor MCP usa essa instalação fixa (3.59.8, em `teste/ferramentas/ruflo`), não `npx ruflo@latest`: o Ruflo publica várias versões por dia e o `npx` baixava a nova a cada início, derrubando a conexão. Atualizar só de propósito: `npm install --save-exact ruflo@<versão>` nessa pasta.

## 6. Riscos aceitos (registrados em 27/10/2026, TK-31)
Não são defeitos a corrigir: são escolhas conscientes, anotadas para ninguém "descobrir" de novo.
- **qa-17.3a — texto de agente sem revisor.** O `gerente` pode acrescentar UMA regra curta à seção "Regras duras" de um agente (autonomia de 14/10). Essa mudança de texto não passa por revisor. Rede: cópia anterior em `agent-memory/gerente/historico/` e linha no registro. Alternativa para o comitê: o `revisor-de-codigo` olhar o registro no início de cada sessão.
- **qa-17.7 — teto de ~120 mil tokens / ~35 chamadas sem medição.** Regra do usuário (22/10/2026); ninguém mede o consumo real do agente. Vale como estimativa.
- **qa-17.8 — orquestrador revisa G e mecânica.** Sem `supervisor-opus` (aposentado em 20/10/2026), a revisão final desses casos é do próprio orquestrador, que também monta o grafo. Aceito pelo usuário; o contexto separado do `supervisor` Sonnet continua valendo nas demais voltas.
- **qa-17.10 — tabela de consumo vazia** (`politica-de-modelo.md` §3): sem medição, nada é preenchido.
