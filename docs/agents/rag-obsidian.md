# RAG Obsidian — Protocolo Operacional do Orquestrador

Protocolo de consulta ao cofre Obsidian (Second Brain) em duas camadas, com economia
máxima de tokens. Adotado em 13/10/2026; complementa `docs/agents/agent-factory.md §4`.

---

## Estrutura do cofre (referência rápida)

```
C:\Users\Ponse\Documents\Obisidian\ELITE REDUX MASTER\teste\
│
├── CELEBRO - ELITE REDUX.md          ← índice mestre (só se o hook e a tabela não bastarem)
│
├── resumo\                           ← notas curadas (ESTADO ATUAL = Camada 1)
│   ├── pendencias.md                 ← ESTADO ATUAL + histórico de sessões
│   ├── decisoes.md                   ← ADRs e escolhas técnicas
│   ├── convencoes.md                 ← regras de trabalho da equipe
│   └── bugs-resolvidos.md            ← bugs difíceis e como foram resolvidos
│
└── memoria-interna\                  ← espelho da memória Claude (Camada 2)
    ├── MEMORY.md                     ← índice do espelho (uma linha por nota)
    ├── project\*.md                  ← contexto de projeto
    ├── feedback\*.md                 ← aprendizados e correções do usuário
    ├── reference\*.md                ← referências técnicas permanentes
    └── user\felipe_perfil.md         ← perfil do usuário
```

---

## Camada 1 — Índice Leve (sempre primeiro)

**Custo:** 1 leitura, uma vez por demanda (a seção mede ~26 linhas / ~2,6 KB, medido em 13/10).

### Quando usar
Antes de qualquer tarefa que envolva contexto de projeto, decisão anterior, pendência
aberta, convenção ou perfil do usuário.

### O que ler
1. Apenas a seção **"ESTADO ATUAL"** de `resumo/pendencias.md`
   - Contém o snapshot mais recente do projeto (último commit, abertos, próximo passo).
   - Já foi injetado pelo hook `segundo-cerebro-start.ps1` no início da sessão — **não reler
     se a sessão acabou de começar** (economiza uma leitura).
   - **Atenção:** o hook injeta no máximo ~3 KB no total; o ESTADO ATUAL recebe só o que sobra depois do
     índice (3000 − tamanho do índice − 300; em 13/10 sobravam ~2 KB de ~2,6 KB, então hoje ele SAI CORTADO).
     Quando termina com "[...corte; ler pendencias.md]", o estado NÃO veio inteiro: ler só o resto da seção
     (comando abaixo); isso conta como 1 leitura.
2. Para localizar a nota-alvo, usar primeiro a tabela de Camada 2 e o índice que o hook injeta
   (linhas "- caminho - título", que cobrem só `resumo/*.md` e o `MEMORY.md` do espelho; as notas de
   `memoria-interna/` se localizam pela tabela ou pelo `MEMORY.md`). Só abrir `MEMORY.md` ou o CELEBRO se isso não bastar,
   e essa abertura **conta como uma das 2 leituras**.

### Como ler de forma cirúrgica
```powershell
# Lê só a seção ESTADO ATUAL de pendencias.md
$txt = Get-Content "...\resumo\pendencias.md" -Raw -Encoding UTF8
[regex]::Match($txt, '(?ms)^## ESTADO ATUAL.*?(?=^## |\z)').Value
```

---

## Camada 2 — Leitura Cirúrgica (sob demanda)

**Custo:** 1 leitura adicional, apenas do arquivo necessário.

### Regra de descida
Desça para a Camada 2 **somente se** a Camada 1 não resolver e a demanda se encaixar
em um dos casos abaixo:

| Tipo de demanda | Arquivo-alvo |
|-----------------|-------------|
| Decisão técnica anterior, ADR, "por que foi decidido X" | `resumo/decisoes.md` |
| Regra de processo, convenção da equipe, "como fazemos Y" | `resumo/convencoes.md` |
| Bug parecido com um já resolvido | `resumo/bugs-resolvidos.md` |
| Perfil/preferência do usuário | `memoria-interna/user/felipe_perfil.md` |
| Pipeline de build, OmniRoute, arquitetura de IA | `memoria-interna/project/pipeline_de_build.md` |
| Rank, divergência com a comunidade, calibração | `memoria-interna/project/rank_divergencia_comunidade.md` |
| Curadoria de dados, versão 2.65.4 | `memoria-interna/project/curadoria_2654.md` |
| Habilidades sem regra no motor | `memoria-interna/project/habilidades_sem_regra.md` |
| Estudos/fontes do Obsidian, pesquisas aprovadas | `memoria-interna/project/pesquisas_obsidian_2026_10_06.md` |
| Visão geral e barra de qualidade do projeto | `memoria-interna/project/visao_do_projeto.md` |
| Gauntlet Loop (quem julga, rodadas, quando usar) | `memoria-interna/feedback/gauntlet_loop.md` |
| Qualquer aprendizado/feedback do usuário | `memoria-interna/feedback/<nome>.md` |
| Referência técnica (git, ffmpeg, OmniRoute, iframe) | `memoria-interna/reference/<nome>.md` |

### Como ler de forma cirúrgica
- **Nunca leia o arquivo inteiro se precisar de uma seção específica.** Use grep de seção:
  ```powershell
  # Lê só a seção de uma decisão específica
  Select-String -Path "...\resumo\decisoes.md" -Pattern "Rank v2" -Context 0,20
  ```
- **Nunca leia mais de 1 arquivo por consulta.** Se a demanda tocar dois arquivos, priorize
  o mais específico e anote que o outro ficou pendente.

---

## Regras de Economia (inegociáveis)

1. **Nunca reler o ESTADO ATUAL** se o hook de início já o injetou nesta sessão.
2. **Nunca ler `memoria-interna/` inteiro** — é um espelho de 67 arquivos (medido em 13/10). Use o índice
   `MEMORY.md` para localizar e leia só o arquivo necessário.
3. **Máximo 2 leituras de Obsidian por demanda.** O contexto injetado pelo hook não conta;
   `MEMORY.md`, CELEBRO, ESTADO ATUAL (sem hook) e a nota-alvo contam. Se precisar de
   mais, resumir o que já foi lido e perguntar ao usuário se vale continuar.
4. **Escrita no cofre**: apenas quando o usuário sinalizar fim de sessão (`obsidian_only_at_session_end`).
   Nunca escrever no meio de uma tarefa.
5. **Não abrir o CELEBRO** se o hook já injetou o índice: as linhas "- caminho - título" bastam para
   achar as notas de `resumo/`; para `memoria-interna/`, usar a tabela de Camada 2 ou o `MEMORY.md`.
6. **Economia de tokens não medida:** este protocolo reduz leituras por regra, mas ainda não há
   medição de antes/depois. Não citar percentual de economia sem medir.

---

## Fluxo de decisão (pseudo-código)

```
receber_demanda(D):
  1. hook_injetou_contexto?
       SIM, completo → pular Camada 1; ir para passo 2
       SIM, com aviso "[...corte...]" → ler o resto da seção (1 leitura) se a demanda precisar dele
       NÃO → ler seção ESTADO ATUAL de pendencias.md (Camada 1)

  2. D já resolvida com o contexto?
       SIM → executar tarefa
       NÃO → continuar

  3. identificar arquivo-alvo na tabela de Camada 2
       encontrou → ler SOMENTE aquele arquivo (ou seção)
       não encontrou → abrir MEMORY.md para localizar (conta como leitura) → ler a nota
                       só se ainda couber no teto de 2; senão perguntar ao usuário

  4. contexto suficiente?
       SIM → executar tarefa
       NÃO → notificar orquestrador; nunca inferir sem fonte
```

---

## Exemplos de uso

### Exemplo 1 — "Qual o próximo passo do pipeline de build?"
- Hook injetou contexto → ESTADO ATUAL já disponível (mas hoje vem cortado; se o item não aparecer na parte injetada, ler o resto da seção).
- Camada 1 resolve: "Pipeline de build" está listado como item 1 dos abertos.
- Se precisar de detalhe técnico → Camada 2: `project/pipeline_de_build.md`.
- **Total: 0–2 leituras** (0 só se a resposta estiver na parte injetada).

### Exemplo 2 — "Como a equipe decide usar Gauntlet Loop?"
- Tabela de Camada 2 aponta `memoria-interna/feedback/gauntlet_loop.md` (o Gauntlet não tem seção em `convencoes.md`).
- Camada 2: ler só essa nota.
- **Total: 1 leitura.**

### Exemplo 3 — "Esse bug parece aquele do comentário CSS"
- Camada 2 direta: `resumo/bugs-resolvidos.md`.
- **Total: 1 leitura.**
