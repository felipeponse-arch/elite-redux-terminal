# Agent Factory: Estrutura, Orquestração e Auto-Aprendizado

Decisão de arquitetura (13/10/2026): padronização da **Agent Factory** para o Elite Redux Terminal. Os agentes não são estáticos; possuem especialidades estritas, são recomendados pelo Gerente (Orquestrador) e delegados pela sessão principal (coordenador) e aprendem continuamente com as correções e regras descobertas no projeto.

Práticas de trabalho que valem para todos (16/10/2026): [praticas-de-trabalho.md](praticas-de-trabalho.md) (alternativas lado a lado em decisão, ler antes de propor, entrega com evidência, aprofundar em vez de aumentar).

---

## 1. Papéis na Factory

1. **Orquestrador (Gerente):**
   - Ponto de contato e triagem inicial de qualquer demanda do usuário.
   - Classifica o domínio e recomenda o agente executor; a sessão principal (coordenador) delega e leva o resultado ao supervisor.
   - Recomenda a esteira (Fluxo Direto vs Gauntlet Loop).
   - Faz a ponte com o Obsidian (Second Brain) usando busca em duas camadas para economia de tokens.

2. **Especialistas de Domínio (Trabalhadores da Factory):**
   - Cada um atua estritamente em sua fronteira:
     - `arquiteta-de-dados`: pipeline, `data/*.json`, saves e integridade de dados.
     - `engenheira-frontend`: CSS, interface, tokens, renderização e layout.
     - `meta-pokemon`: metagame de Elite Redux, Smogon AAA, tiers e validação de estratégias.
     - `playtester-de-build`: aferição de viabilidade prática em runs 1x1 e level caps.
     - `construtor-de-builds-haiku`: geração de builds em lote com economia de tokens (com suporte a fallback).
     - `qa-processo`: testes unitários, testes de mutação/sabotagem e esteiras de verificação.
     - `seguranca`: dependências, sanitização e fronteiras locais/artifacts.
     - `ux-acessibilidade`: WCAG, clareza de textos e mensagens em PT-BR.

3. **Validador de Entrega (`supervisor`, juiz único do Gauntlet Loop):**
   - Nada vai ao usuário sem validação prévia.
   - Avalia conformidade com o pedido original, integridade mecânica, testes e padrão do projeto.
   - Se o supervisor não puder rodar (cota, erro), a entrega para e o usuário decide com opções. O autor nunca se auto-aprova.
   - Fonte do fluxo: `.claude/agents/supervisor.md` e a memória `feedback_gauntlet_loop` (espelho no cofre: `memoria-interna/feedback/gauntlet_loop.md`).

---

## 2. Ciclo de Vida da Demanda

```
[Usuário]
   │
   ▼
[Sessão principal / Coordenador] ──► consulta o [Gerente]: classifica domínio e esteira e RECOMENDA
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
