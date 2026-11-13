# Agent Factory: Estrutura, Orquestração e Auto-Aprendizado

Decisão de arquitetura (13/10/2026): padronização da **Agent Factory** para o Elite Redux Terminal. Os agentes não são estáticos; possuem especialidades estritas, são delegados pela sessão principal (orquestrador), com triagem do Gerente quando ajudar, e aprendem continuamente com as correções e regras descobertas no projeto.

Práticas de trabalho que valem para todos (16/10/2026): [praticas-de-trabalho.md](praticas-de-trabalho.md) (alternativas lado a lado em decisão, ler antes de propor, entrega com evidência, aprofundar em vez de aumentar).

---

## 1. Papéis na Factory

1. **Orquestrador (sessão principal, Opus 5.5)** (alinhado com `loops-e-grafos.md` em 20/10/2026):
   - Fala com o usuário, monta o grafo, delega, leva a entrega ao supervisor e faz a revisão final de G e mecânica.
   - Junção no master, GitHub e publicação.

2. **Gerente (triagem + guardião do aprendizado, Haiku 5.5):**
   - Classifica o domínio e recomenda o agente executor e a esteira (Fluxo Direto vs Gauntlet Loop).
   - Aplica o aprendizado nos agentes (autonomia de 14/10, `.claude/agents/gerente.md`).
   - Faz a ponte com o Obsidian (Second Brain) usando busca em duas camadas para economia de tokens.

3. **Especialistas de Domínio (Trabalhadores da Factory):**
   - Equipe atual (13/11/2026): 22 agentes em `teste/.claude/agents/`, contando gerente e supervisor. O modelo entre parênteses é o do cabeçalho `model:` de cada arquivo (a tabela completa está em `loops-e-grafos.md` §1).
   - Cada um atua em sua área, descrita no próprio arquivo do agente:
     - `arquiteta-de-dados` (Sonnet): pipeline, `data/*.json`, saves e integridade de dados.
     - `engenheira-frontend` (Sonnet): CSS, interface, tokens, renderização e layout.
     - `meta-pokemon` (Haiku): metagame de Elite Redux, Smogon AAA, tiers e validação de estratégias.
     - `playtester-de-build` (Haiku): aferição de viabilidade prática em runs 1x1 e level caps.
     - `construtor-de-builds` (Haiku): geração de builds (sinergia de habilidade + inata, prioridade, hit-kill).
     - `engenheira-do-motor` (Sonnet): motor de duelo (`src/regras/duelo.js`), rank pelo duelo, calibração com a calculadora e o simulador do jogo, time pelo motor (criada em 20/10/2026).
     - `qa-processo` (Sonnet): testes unitários, testes de mutação/sabotagem e esteiras de verificação.
     - `seguranca` (Haiku): dependências, sanitização e fronteiras locais/artifacts.
     - `ux-acessibilidade` (Haiku): WCAG, clareza de textos e mensagens em PT-BR.
     - `engenheira-de-codigo` (22/10/2026, Sonnet): refatoração e código novo fora do motor e dos dados, com TDD; passa pelo `revisor-de-codigo` e pelo `supervisor`.
     - `revisor-de-codigo` (22/10/2026, Haiku): revisão só de leitura do app inteiro, e de texto de agente, doc, prompt e ticket; não corrige.
     - `pesquisador-web` (27/10/2026, Haiku): pesquisa na rede quando o código do jogo não responde; só relata, com fonte e data.
     - `pesquisador-de-mecanica` e `verificador` (Haiku): ver `loops-e-grafos.md` §1-§2.
   - Agentes novos de 12/11/2026 (o que cada arquivo diz; a divisão de fronteiras entre eles ainda vai a reunião):
     - `engenheira-de-release` (Haiku): prepara publicação ou merge no master (checklist, nota de versão, conferência do Pages, plano de rollback); não publica nem faz merge.
     - `engenheira-de-desempenho` (Haiku): sob demanda, mede e aponta gargalo (hook de pré-commit, tamanho do artifact, FCP/CLS no celular, tempo do portão e do rank); não refatora.
     - `analista-do-rank` (Sonnet): valida o rank com estatística (sensibilidade aos pesos, divergência com a comunidade, regressão entre rodadas); não altera motor, peso nem dado.
     - `designer-de-interface` (Sonnet): direção visual, tokens e 2-3 alternativas antes da `engenheira-frontend` implementar; entrega proposta e mock, não o código final.
     - `arquiteta-de-software` (Sonnet): estrutura do app, fronteiras regras/UI, dívida técnica e decisões de arquitetura; não implementa nem decide regra de jogo.
     - `ponte-gpt` (Haiku): segunda opinião do GPT via Codex (`ferramentas/gpt/gpt.mjs`), confere cada achado contra o código; nunca decide merge nem altera código.

4. **Validador de Entrega (`supervisor`, Sonnet, juiz único do Gauntlet Loop):**
   - Nada vai ao usuário sem validação prévia.
   - Avalia conformidade com o pedido original, integridade mecânica, testes e padrão do projeto.
   - Se o supervisor não puder rodar (cota, erro), a entrega para e o usuário decide com opções. O autor nunca se auto-aprova.
   - Fonte do fluxo: `.claude/agents/supervisor.md` e a memória `feedback_gauntlet_loop` (espelho no cofre: `memoria-interna/feedback/gauntlet_loop.md`).

---

Regras da equipe (antes copiadas em cada agente): arquivo único `C:/Users/Ponse/Documents/Claude/teste/.claude/regras-da-equipe.md`, referenciado por todos os agentes em `.claude/agents/` (27/10/2026, TK-31).

## 2. Ciclo de Vida da Demanda

```
[Usuário]
   │
   ▼
[Sessão principal / Orquestrador] ──► consulta o [Gerente]: classifica domínio e esteira e RECOMENDA
   │                                  (Obsidian: Camada 1 = ESTADO ATUAL, se precisar de contexto)
   │ delega
   ▼
[Especialista Designado]
   │ 1. Lê sua memória e aprendizados.md
   │ 2. Executa em seu worktree isolado
   │ 3. Executa checagens locais (npm run check / testes focados)
   ▼
[Validador: supervisor (a sessão principal leva a entrega)]
   │ Aprovado?
   ├── NÃO ──► Retorna ao Especialista com evidências acionáveis (Máx. 3 rodadas)
   │           e registra causa da recusa
   └── SIM  ──► [Ciclo de Auto-Aprendizado]
                     │
                     ▼
             [Persistência de Memória]
             (Registra novas lições em aprendizados.md)
                     │
                     ▼
           [Retorno ao Usuário pela Sessão principal]
```

---

## 3. Protocolo de Auto-Aprendizado (Self-Refinement)

Para que os agentes evoluam sozinhos sem necessidade de reescrever constantemente seus prompts base:

1. **Localização:** Cada especialista mantém seu histórico em `.claude/agent-memory/<agente>/aprendizados.md`.
2. **Gatilho de Registro:** Toda vez que:
   - Uma entrega for rejeitada pelo Validador/Supervisor e depois corrigida.
   - Um teste de unidade ou sabotagem quebrar revelando uma regra oculta do jogo.
   - O usuário corrigir uma dedução ou preferência.
   - **Rede de segurança (usuário, 20/10/2026):** o agente continua escrevendo o próprio aprendizado; no fim do loop, se houve REFAZER e a volta seguinte passou, o orquestrador confere e escreve a linha que faltar. Uma cópia vai para a memória do Ruflo (`memory_store`, namespace `aprendizados`, chave `<data>_<agente>_<assunto>`) para busca por significado entre agentes; a fonte da verdade continua o `.md`.
3. **Formato Obrigatório do Aprendizado:**
   ```markdown
   ### [Data] - [Assunto / Mecânica / Componente]
   - **Sintoma / Erro:** O que falhou ou foi corrigido.
   - **Causa Raiz:** Por que o erro aconteceu (ex.: diferença entre mecânica vanilla e código oficial de Elite Redux).
   - **Regra Aprendida:** Instrução direta e prática para aplicar nas próximas execuções.
   - **Evidência:** Arquivo:linha ou teste que comprova a regra.
   ```
4. **Aplicação Automática:** Antes de qualquer tarefa, o agente obrigatoriamente lê as últimas entradas do seu `aprendizados.md` para carregar o contexto de erros passados.

---

## 4. Governança do Obsidian (Second Brain) e Economia de Tokens

Para consultar o cofre sem desperdício de tokens:

* **Camada 1 (Estado):** a seção "ESTADO ATUAL" de `resumo/pendencias.md` (medido em 13/10: ~26 linhas, ~2,6 KB), já injetada pelo hook de início. Detalhes em `docs/agents/rag-obsidian.md`.
* **Camada 2 (Leitura Cirúrgica):** Apenas se o tópico exigir aprofundamento, lê exclusivamente o arquivo ou cabeçalho relevante (ex.: `decisoes.md` para ADRs; `bugs-resolvidos.md` para regressões). Nunca ler arquivos múltiplos inteiros na mesma consulta. Teto: 2 leituras por demanda, contando o índice.
* **Escrita:** Exclusivamente quando o usuário encerrar a sessão (`fim-de-sessao-obsidian`); nunca no meio de uma tarefa nem no fim de lote.
