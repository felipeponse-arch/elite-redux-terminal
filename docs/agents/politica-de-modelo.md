# Política de modelo e orçamento (Melhoria D do fluxo, rascunho de 14/10/2026)

Define qual modelo, com qual esforço, faz cada tipo de tarefa, e quanto do limite semanal cada tamanho de ticket pode gastar. É só política: não muda código, dados nem regras de mecânica. Origem: seção 6 de `docs/pipeline_do_projeto.md` (rascunho em outro branch).

## 1. Tabela tarefa -> modelo -> esforço -> quem decide
Esforço = nível de raciocínio. A tabela é proposta; o usuário confirma e pode sobrescrever.

| Tarefa | Modelo | Esforço | Quem decide |
|---|---|---|---|
| Nível 0: ler, varrer, extrair (só leitura) | Haiku 5.5 | baixo | Orquestrador |
| Nível 1: implementar com TDD no worktree | Sonnet 5.5 | médio | Orquestrador |
| Mecânica do motor, pipeline, calibração | Sonnet 5.5 | alto | Orquestrador; mecânica nova segue `docs/decisoes_mecanicas.md` |
| Supervisor (Gauntlet) e revisão de segurança | Sonnet 5.5 | médio | Orquestrador |
| Orquestração e decisão | Opus 5.5 (direto na assinatura); Sonnet 5.5 se o limite estiver apertado | médio | Usuário, pela escolha do modelo da sessão |

## 2. Restrições reais já vividas
a) **Gemini e o classificador de segurança (histórico; a rota pelo OmniRoute foi desligada em 17/10/2026).** Em 10/10/2026 o classificador barrou o envio de contexto do projeto ao Gemini. Essa rota só vale com autorização explícita e delimitada do usuário: quais arquivos, nunca chaves nem saves. Sem isso, a leitura pesada fica no Haiku ou no Sonnet.
b) **Modelo de subagente.** Por regra do usuário, todo subagente roda no Sonnet 5.5. NÃO passar o parâmetro `model: "sonnet"` na chamada de `Agent`: o apelido apontava para um modelo que dava 404 (era o mapeamento do OmniRoute, tirado em 17/10/2026). Os agentes de `.claude/agents/` já trazem o modelo certo no cabeçalho; chamar sem o parâmetro.
c) **OmniRoute fora (17/10/2026).** O Claude Code não passa mais pelo OmniRoute (decisão do Felipe): sem COMBO-1 e sem a rota Gemini/antigravity.

## 3. Orçamento por limite semanal
Tamanhos de ticket: **P** (pequeno), **M** (médio), **G** (grande), como marcados no ticket em `docs/tickets/`. No começo da sessão, o orquestrador lê o uso semanal (`get_usage`) e aplica:

| Uso do limite semanal | O que pode entrar |
|---|---|
| < 70% | Qualquer ticket |
| 70% a 85% | Só P e M |
| 85% a 95% | Só P e correções |
| > 95% | Só leitura e documentação |

Acima de 100% o gasto sai de créditos pagos: avisar o usuário antes de qualquer passo.

### Consumo real (a calibrar)
Método: ler o uso semanal antes e depois de cada ticket e anotar a diferença em % do limite. Só entram medições reais; sem medição fica "?".

| Tamanho | Consumo médio (% do limite semanal) | Amostras |
|---|---|---|
| P | ? | 0 |
| M | ? | 0 |
| G | ? | 0 |

## 4. Quem aplica
O orquestrador (gerente) lê o limite, escolhe o modelo conforme as tabelas e avisa o usuário em uma linha (por exemplo: "Uso em 78%: só tickets P e M; Sonnet 5.5 nos agentes"). O usuário pode sobrescrever a qualquer momento, e a palavra dele vale mais que a tabela.

## 5. Como isso se liga ao resto
Esta política complementa `docs/agents/agent-factory.md` (papéis, ciclo de vida e auto-aprendizado dos agentes). A cascata para Gemini (`construtor-de-builds-cascata.md`) está obsoleta desde 17/10/2026 (OmniRoute fora; ver 2c). A decisão de ordem de implementação das melhorias A a D está em `docs/pipeline_do_projeto.md` §7. Este documento não altera nenhuma regra dura do usuário: elas continuam no `CLAUDE.md` do projeto.
