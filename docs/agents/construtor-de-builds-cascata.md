# Construtor de Builds: proposta via OmniRoute e fallback local

> **OBSOLETO desde 17/10/2026.** O OmniRoute saiu do Claude Code e não há rota Gemini. O agente agora se chama `construtor-de-builds` e roda só no Claude (Sonnet 5.5). Texto mantido como histórico.

Decisão de arquitetura (13/10/2026): a proposta inicial de build pode usar um bridge OmniRoute opcional, mas o Artifact não recebe chave, endpoint privado ou credencial. Claude continua sendo o caminho oficial e o fallback seguro quando o bridge não existe ou falha. O objetivo é reduzir consumo da licença sem transferir a autoridade do motor.

---

## 1. Princípio Fundamental: Validação Local Desacoplada

O modelo de linguagem (LLM) apenas sugere o set (habilidade, golpes, item, natureza e EVs). A **autoridade sobre a legalidade e eficácia da build é 100% local**:
* Validação de movepool liberado no level cap (`availableMovesFor`).
* Validação de sinergias obrigatórias (`sinergiasDaEspecie`).
* Validação das regras do app e do formato (incluindo golpes permitidos no 1x1 e itens proibidos); item repetido no time é permitido pela decisão vigente.
* Aferição no motor de duelo contra chefão (`duelo.js`).

Isso significa que **a origem da sugestão (Claude ou Gemini) não afeta a segurança nem a qualidade do resultado**: qualquer resposta passa pelo mesmo crivo rigoroso.

---

## 2. A Cascata de Provedores

```
                 [Demanda de Geração de Build]
                               │
                               ▼
            ┌──────────────────────────────────────┐
            │  PROVEDOR 1 (Primário): CLAUDE      │
            │  • Claude Sonnet 5.5 ou Haiku 5.5    │
            │  • Via assinatura oficial / sample   │
            └──────────────────┬───────────────────┘
                               │
                Sucesso? ──────┴─────► Retorna resposta para validação
                               │
             Bridge disponível e autorizado?
                               │
                 SIM ──────────┴──────── NÃO
                  │                         │
                  ▼                         ▼
            ┌──────────────────┐   ┌──────────────────────┐
            │ BRIDGE OMNIROUTE │   │ Fallback ao Claude   │
            │ modelo explícito │   │ sample oficial      │
            │ gemini-3.1-pro   │   │ sem segredo externo  │
            └────────┬─────────┘   └──────────┬───────────┘
                     │                        │
                     └────────────┬───────────┘
                                  │
                                  ▼
            ┌──────────────────────────────────────┐
            │  VALIDAÇÃO LOCAL DO MOTOR            │
            │  • validateAiBuild()                 │
            │  • Rejeição/retentativa se inválido  │
            └──────────────────┬───────────────────┘
                               │
                               ▼
            ┌──────────────────────────────────────┐
            │  GAUNTLET LOOP                       │
            │  • Playtester de Build               │
            │  • Meta Pokémon                      │
            │  • Supervisor                        │
            └──────────────────────────────────────┘
```

---

## 3. Aplicação nos Ambientes

### A. No Pipeline de Desenvolvimento e Agentes (Claude Code / Antigravity)
* **Agente Executor:** `construtor-de-builds-haiku.md`.
* **Comportamento Padrão:** Executa tarefas mecânicas em Haiku 5.5 enquanto a assinatura permitir.
* **Gatilho de Cascata:** o agente pode usar o OmniRoute no ambiente de desenvolvimento quando a conexão estiver autorizada, mas o Artifact não presume localhost nem recebe a chave. O modelo aceito para a proposta é exatamente `antigravity/gemini-3.1-pro-high`; aliases `auto/*` e `COMBO-1` ficam proibidos.
* **Varreduras Pesadas:** conforme decisão de 10/10 ([[feedback-delegar-varredura-gemini]]), podem ser delegadas ao Gemini fora do Artifact, sem enviar contexto confidencial sem autorização explícita e sem registrar credenciais.

### B. No Aplicativo Web / Artifact (`src/ui/ia.js`)
* **Cliente Primário:** `claude.use("sample")` (nativo do Claude Artifact).
* **Bridge Opcional:** `window.__ER_OMNIROUTE_BRIDGE__` com modelo explícito `antigravity/gemini-3.1-pro-high`.
* **Fallback Controlado:** a geração individual e em lote marca `provedor: "omniroute"`. Se o bridge compatível existir, a proposta passa por ele; se não existir ou falhar com erro passageiro, `pedirIAAgora` volta ao `claude.use("sample")` com aviso. Erro de programação, prompt ou validação não é mascarado por troca de provedor.

---

## 4. Critérios de Aceite para Builds Geradas por Fallback
1. O bridge recebe apenas o prompt montado pelo app e o modelo explícito; nenhuma chave ou endpoint privado entra no Artifact.
2. A resposta do bridge ou do Claude é submetida à mesma validação local (`validateAiBuild`).
3. Nenhuma build vai para o save ou para a tela sem passar pelo fluxo local de validação e simulação aplicável ao alvo da Etapa.
4. A medição real do bridge fica registrada como bloqueada quando o runtime publicado não oferece uma capability segura; não se infere latência ou custo.
