# Dossiê de Auditoria — Elite Redux Terminal

**Gerado em:** 08/09/2026
**Para:** auditoria externa independente (Gemini)
**Autor do projeto:** Claude (Opus 5), em sessão de pair-programming com o usuário
**Idioma:** português (identificadores, código e nomes de API permanecem em inglês)

---

## 0. Instruções para o auditor

Este documento é autocontido. Ele traz o **código-fonte real e completo** do projeto (seção 10),
não apenas uma descrição — de propósito: uma auditoria feita só sobre o meu resumo auditaria a
minha descrição, não o sistema.

Você **não tem acesso ao sistema de arquivos, à internet, nem consegue executar nada**. Portanto:

- Trate os números da seção 8 como **afirmações minhas a serem checadas por raciocínio**, não como
  fatos verificados por você. Onde puder derivar uma contradição a partir do código, aponte.
- Onde precisar de execução para concluir, **diga exatamente qual comando/verificação o usuário
  deve rodar** em vez de assumir.
- A seção 9 lista os pontos onde eu tenho menos confiança. Priorize-os, mas **não se limite a
  eles** — o valor de uma auditoria externa está justamente no que o autor não enxergou.
- Aponte discordâncias diretamente. Se uma decisão minha estiver errada, diga que está errada e
  por quê. Não preciso de validação.

**Formato de resposta sugerido:** achados numerados, cada um com severidade
(crítico / alto / médio / baixo), evidência (arquivo + trecho), impacto concreto e correção
proposta. Separe "bug real" de "questão de estilo/preferência".

---

## 1. O que é o projeto

**Elite Redux Terminal** é uma ferramenta pessoal de consulta e planejamento para um único
usuário que joga **Pokémon Elite Redux**, um ROM hack de Pokémon Emerald.

Características do jogo que importam para o software:

- Cada Pokémon tem até **3 habilidades escolhíveis + 3 "innates"** (passivas sempre ativas)
  simultâneas — diferente do jogo original, onde há 1 habilidade.
- Tipos, stats, movepools e evoluções foram **totalmente rebalanceados**; existem ~40 Mega
  Evoluções customizadas e linhas "Redux" que não existem no jogo original.
- É uma **beta em desenvolvimento ativo** (versão atual: `2.65beta`). Os dados mudam entre versões.
- Tem 3 modos de dificuldade (Easy / Ace / Elite) que alteram os times dos treinadores.
- Tem sistema de level cap por badge.
- Tem opção de "Mega Evolução permanente".

**O usuário é brasileiro e não lê inglês.** Isso é um requisito funcional, não uma preferência
estética: toda descrição de mecânica precisa estar em português.

**O que a ferramenta faz:**

| Aba | Função |
|---|---|
| Dex | Busca/filtro das 1.906 espécies; ficha com stats, habilidades+innates, evolução, movepool |
| Meu Time | Até 6 Pokémon, com build completa em formato Smogon/Showdown; troca com a caixa |
| Caixa | Registro de tudo que o jogador capturou |
| Chefões | 107 treinadores-chefe reais extraídos do jogo, com time completo e variantes de dificuldade |
| Progresso | Dificuldade + badge atual, que alimenta avisos de level cap |
| Tipos | Matriz de efetividade 18×18 + tabela de level caps |

**Fluxo de uso principal (importante para julgar decisões de UX):** o usuário perde para um
chefão → abre a aba Chefões → copia um texto que junta o time do chefão + seu time + sua caixa →
cola numa conversa com o Claude → recebe análise e builds → as builds voltam para a ferramenta na
próxima publicação. A ferramenta é o **repositório de dados**; a análise estratégica acontece na
conversa.

---

## 2. Restrições da plataforma (origem de muitas decisões)

O projeto é publicado como um **Artifact do Claude** — uma página HTML única hospedada em
claude.ai. As restrições abaixo não são escolhas minhas; são o ambiente:

1. **CSP estrita.** A página publicada **não pode fazer nenhuma requisição externa**: sem CDN,
   sem imagem remota, sem `fetch`. Única exceção: folha de estilo do Google Fonts. Consequência
   direta: **todo asset precisa estar embutido** (data URI / inline).
2. **Limite de 16 MB** por artifact.
3. **Arquivo único.** Não há build/bundler em runtime; tudo é inlined no momento da publicação.
4. **Capacidades de runtime disponíveis nesta conta:** `artifact` (a página republicar a si
   mesma), `downloads` (oferecer arquivo ao usuário), `mcp`, `self`.
   **NÃO disponíveis:** banco de dados compartilhado (`db`) e loja de assets (`assets`).
   Consequência: **sincronização real entre dispositivos via servidor é impossível** hoje — daí a
   solução de exportar/importar save por texto.
5. **`localStorage` é por navegador** e nunca chega ao Claude. Celular e PC são silos separados.
   Isso é uma barreira de privacidade da plataforma, não uma limitação contornável por código.
6. **Eu (Claude) não consigo ler o estado do usuário.** Todo fluxo de "mandar dados para o Claude"
   é necessariamente copiar/colar iniciado pelo usuário.

> **Peça ao auditor:** se você propuser algo que viole 1, 4 ou 6, a proposta é inválida no
> ambiente. Verifique contra esta lista antes de sugerir.

---

## 3. Arquitetura e pipeline

### 3.1 Fluxo de dados

```
NextDex (GitHub, oficial do jogo)
  └── gameDataV2.65beta.json  (3,8 MB, snapshot manual)
        │
        ├── transform.ps1        → data/dex_compact.json     (espécies/moves/abilities enxutos)
        ├── extract_bosses.ps1   → data/bosses.json          (107 chefes + variantes)
        └── build_sprite_atlas.ps1
              ├── baixa 1.906 PNGs → data/sprites_all/       (cache, 64px)
              └── empacota          → data/sprite_atlas.png  (atlas 48px) + sprite_index.json

  Arquivos curados à mão (não gerados):
        data/builds.json                 builds por Pokémon (chave = sname)
        data/levelcaps.json              tabela de level cap (transcrita de site — ver §9)
        data/saved_teams_seed.json       time recomendado pré-carregado
        data/ability_translations_pt.json  1.033 traduções (geradas por LLM, curadas)
        data/move_translations_pt.json     1.031 traduções (geradas por LLM, curadas)

  Pós-processamento:
        slim_dex.ps1               remove campos nunca exibidos de dex_compact.json (in-place)
        expand_combo_abilities.ps1 expande 151 habilidades "A + B" (in-place)

  Montagem:
        build.ps1 = artifact_template.html + todos os JSONs + atlas em base64
                  → artifact_final.html (3,82 MB)  → publicado como Artifact

  Verificação:
        check_upstream.ps1  compara o snapshot local com o NextDex ao vivo (exit 1 se divergir)
```

### 3.2 Mecanismo de montagem

`artifact_template.html` contém placeholders literais (`__DEX_DATA_JSON__`, `__BUILDS_JSON__`,
`__SPRITE_ATLAS_DATAURI__`, etc.). `build.ps1` substitui cada um pelo conteúdo do arquivo
correspondente, validando antes que:

- cada arquivo de dados é JSON parseável;
- cada placeholder existe no template;
- nenhum placeholder sobrou após a substituição;
- o resultado não é pequeno demais (>500 KB) nem perto do limite (<14 MB).

`</script` dentro dos JSONs é escapado para `<\/script` para não fechar a tag prematuramente.

### 3.3 Por que PowerShell

O ambiente não tem Node nem Python. Além disso, `ConvertFrom-Json` do PowerShell **falha** neste
dataset (o JSON do jogo tem chaves duplicadas que diferem só em caixa: `name` e `NAME`), então
todo o pipeline usa `System.Web.Script.Serialization.JavaScriptSerializer`. A serialização de
volta é feita por um escritor de JSON manual (`common.ps1`), porque
`JavaScriptSerializer.Serialize()` lança erro de referência circular em objetos vindos de
`DeserializeObject()`.

---

## 4. Modelo de dados

### 4.1 Os dois identificadores — ponto central da arquitetura

| Id | O que é | Estável? | Onde pode aparecer |
|---|---|---|---|
| `x` | índice do Pokémon no array `species` do build atual | **NÃO** | apenas em memória e em arquivos gerados junto com o dex |
| `sname` | `SPECIES_AERODACTYL_MEGA` | **SIM** (único nas 1.906) | tudo que é persistido ou escrito à mão |

**Evidência de que `x` é instável:** comparei o snapshot `2.65beta` com outro build do mesmo jogo
("Latest"). Das 1.665 posições comparáveis, **1.661 apontavam para espécies diferentes**; a
divergência começa no índice 4. Simulação com o time real do usuário, se os dados fossem trocados:

```
x=1131  Aerodactyl Mega       →  Hattrem
x=476   Probopass             →  Relicanth
x=1602  Coalossal Mega        →  IronCrown
x=639   Terrakion             →  Arceus Bug
x=1439  Avalugg Hisuian       →  Unown Y
x=1771  Tyranitar Mega Redux  →  (fora do range, sumiria)
```

Este era o achado crítico de uma auditoria interna anterior; foi corrigido migrando toda a
persistência para `sname`.

### 4.2 `dex_compact.json`

```jsonc
{
  "meta":   { "source": "...", "repo": "...", "version": "2.65beta", "generated": "2026-08-29" },
  "types":  ["Normal","Fighting","Fire", ...],        // 21; índice = id de tipo
  "splits": ["PHYSICAL","SPECIAL","STATUS", ...],
  "evoKinds": ["EVO_LEVEL","EVO_MEGA_EVOLUTION", ...],
  "abilities": [ ["nome","descrição em inglês"], ... ],  // 1034; índice = id; 0 = placeholder
  "moves":     [ ["nome", tipo, split, pwr, acc, pp, "desc"], ... ], // 1032; índice = id
  "species":   [ null | { ... }, ... ]                  // 1907 posições, 1906 válidas
}
```

Uma espécie (exemplo real, Charizard):

```jsonc
{
  "x": 6, "i": 6, "n": "Charizard", "sname": "SPECIES_CHARIZARD",
  "t": [2, 6],                        // índices em types → Fire, Flying
  "b": [79,84,78,109,85,100],         // HP, Atk, Def, SpA, SpD, Spe
  "ab": [357,371,181],                // habilidades escolhíveis (ids)
  "inn": [66,413,555],                // innates, sempre ativas (ids)
  "ev": [[kind, requisito, xDestino], ...],
  "lm": [[nível, moveId], ...],       // golpes por nível
  "tu": [moveId, ...],                // golpes de tutor
  "d": "texto de Pokédex em inglês"   // ÚNICO texto em inglês que ainda aparece na UI
}
```

Após `slim_dex.ps1`, os campos `hw` (altura/peso) e `tm` (lista de TMs, vazia para todas as
espécies neste build) são removidos, e a descrição em inglês dos moves vira `""` — porque
`move_translations_pt.json` cobre 1031/1031. O script só faz esse último corte se a cobertura for
total; caso contrário mantém o inglês como fallback.

### 4.3 `bosses.json`

```jsonc
[{
  "name": "Archie Slateport",
  "cat":  "Equipe Aqua",
  "db":   false,                       // batalha em dupla
  "party":  [ { "x":169, "n":"Crobat", "abi":"Tinted Lens", "item":"Black Sludge",
                "nat":"Jolly", "mv":["Dual Wingbeat","Cross Poison","Bite","U-turn"] }, ... ],
  "insane": [ ... ],                   // variante de dificuldade (vazio na maioria)
  "hell":   [ ... ]                    // idem
}]
```

Os campos `insane`/`hell` vêm crus dos dados do jogo. **O mapeamento deles para os nomes
Easy/Ace/Elite do menu do jogo é uma suposição não confirmada** — ver §9.

### 4.4 Save do usuário (`localStorage`, chave `er_terminal_save`)

```jsonc
{
  "v": 2,                              // versão do schema
  "dataVersion": "2.65beta",
  "savedAt": "2026-09-05T...",
  "team": ["SPECIES_AERODACTYL_MEGA", ...],       // máx. 6
  "box":  ["SPECIES_TYRANITAR", ...],
  "savedTeams": [{ "name": "...", "team": ["SPECIES_...", ...] }],  // máx. 3
  "settings": { "difficulty": "ace", "milestone": 0 }
}
```

O schema v1 usava 4 chaves separadas com arrays de `x`. `migrateLegacy()` converte para `sname`
na primeira carga e apaga as chaves antigas.

---

## 5. Decisões técnicas e o porquê

| # | Decisão | Motivo |
|---|---|---|
| D1 | Persistir `sname`, nunca `x` | `x` muda entre versões do jogo (§4.1) — corrupção silenciosa |
| D2 | Save único versionado + migração | Permite migrar/exportar/importar como unidade |
| D3 | Sprites num **atlas** único, não 1.906 imagens | CSP obriga embutir; 1.906 data URIs = ~7 MB e 1.906 decodificações |
| D4 | Atlas com células de **48px** | É o maior tamanho que a UI exibe; nada é ampliado. 64px custava +1,1 MB |
| D5 | `NearestNeighbor` ao reduzir sprites | Interpolação suave inventa cores e alpha parcial e **aumenta** o PNG |
| D6 | Atlas embutido na regra CSS, não via custom property | Valor de vários MB é rejeitado como CSS custom property, mas funciona em `url()` |
| D7 | Traduzir descrições, manter nomes em inglês | Pedido explícito do usuário; nomes são identificadores usados na comunidade |
| D8 | Expandir 151 habilidades "A + B" | A descrição original só nomeia as partes; sem expandir, não informa nada |
| D9 | Uma única função `rosterMove()` | Havia 3 caminhos de troca com regras divergentes |
| D10 | Transferência por texto entre aparelhos | `db` não está disponível nesta conta (§2.4) |
| D11 | Builds exibidas em formato Showdown | Pedido do usuário; é o formato usado pela comunidade Smogon |
| D12 | Manter o texto de Pokédex em inglês | É conteúdo **visível**; removê-lo é decisão de produto, não otimização |

---

## 6. Becos sem saída já medidos (não recomendar)

Foram testados empiricamente e **falharam**. Se a auditoria sugerir algum destes, já foi tentado:

| Tentativa | Resultado medido |
|---|---|
| Reescrever o PNG do atlas com filtragem adaptativa própria | **3,79 MB** vs 2,53 MB do encoder do sistema — o `DeflateStream` do .NET é mais fraco que o do GDI+ |
| PNG-8 (paleta de 256 cores) sem perda | Impossível: o atlas tem **11.354 cores únicas** |
| Reduzir sprites com interpolação bicúbica | **Aumenta** o arquivo (48px ficou 7,1 MB) — cria cores intermediárias e alpha parcial |
| Hospedar sprites/itens externamente | CSP bloqueia toda requisição externa |
| Sincronizar via banco de dados compartilhado | Capacidade `db` não disponível nesta conta |
| Ícones de item | **Não existem em lugar nenhum**: os dados do jogo guardam só `{name, id}`, o repositório do NextDex não tem imagens de item, o `items_icons.ts` é um stub vazio, e a dex oficial renderiza item como texto puro. Vários itens são customizados do hack (`Arcanite H`, `Tyranitarite R`) e não existem em nenhum conjunto padrão |

---

## 7. Histórico de correções já aplicadas

Uma auditoria interna anterior gerou estas correções (todas já em produção):

1. **Ids instáveis** (crítico) → migração para `sname` + schema versionado + migração automática.
2. **Sem detecção de dados desatualizados** → `check_upstream.ps1` + data do snapshot na interface.
3. **Peso da página** → atlas 48px + remoção de campos nunca exibidos: 4,91 → 3,82 MB.
4. **ARIA inconsistente** → `role="tab"`/`aria-selected` nas abas; `aria-label` em 7 campos.
5. **Três caminhos de troca divergentes** → unificados em `rosterMove()`.
6. **Clipboard duplicado / CSS morto** → unificados e removidos.
7. **Busca linear O(n)** → índices `SPECIES_BY_X` / `SPECIES_BY_SNAME`.
8. **Viewport mobile ausente** → `<meta name="viewport">`; as abas Progresso e Tipos eram
   inacessíveis no celular.
9. **Tipo duplicado em Pokémon mono-tipo** → os dados repetem o tipo (`[0,0]`), o que **dobrava
   o multiplicador** nos cálculos de fraqueza. Corrigido em `speciesTypeNames()`.

---

## 8. Métricas medidas (afirmações a verificar)

Medidas em `localhost`, Chromium, viewport desktop:

| Métrica | Valor |
|---|---|
| Página final | 3,82 MB (era 4,91 MB) |
| Atlas de sprites | 1,60 MB binário → ~2,25 MB em base64 (~59% da página) |
| `dex_compact.json` | 1,33 MB |
| Nós no DOM | ~14.700 |
| DOM interativo | ~104 ms |
| Heap JS | ~15 MB |
| Render da lista completa (1.906 linhas) | 19–27 ms |
| Busca (1 caractere) | ~13 ms |
| Contraste (WCAG AA) | passa em tudo; mínimo medido 6,65:1 |
| Erros de console | 0, em todas as abas, desktop e mobile |
| Cobertura de sprites | 1.906 / 1.906 |
| Cobertura de tradução | habilidades 1.033/1.033; golpes 1.031/1.031 |

---

## 9. Pontos onde eu tenho menos confiança (priorize)

1. **Mapeamento `insane`/`hell` → Ace/Elite.** Os dados do jogo têm campos com esses nomes; o
   menu do jogo oferece Easy/Ace/Elite. Assumi `party`=Easy, `insane`=Ace, `hell`=Elite, e a
   interface **avisa o usuário que isso não é confirmado**. Pode estar errado. Como confirmar sem
   acesso ao jogo?

2. **`levelcaps.json` veio de scraping de um site**, não dos arquivos do jogo — nível de confiança
   menor que o resto dos dados. Não achei os level caps na database. Existe forma melhor?

3. **Fidelidade das traduções.** 2.064 descrições foram traduzidas por LLM com um guia de estilo.
   Fiz amostragem, não revisão integral. Riscos: termo de mecânica traduzido errado mudando o
   sentido; inconsistência entre os dois arquivos. **44 golpes** têm como fonte literal
   `"Not done yet."` (não implementados no hack) e viraram "Ainda não implementado."

4. **A matriz de tipos é a padrão da franquia, hardcoded.** Mas no Elite Redux **habilidades
   alteram efetividade** (ex.: `Molten Down` faz Fire ser super efetivo contra Rock; `Levitate` dá
   imunidade a Ground). A análise de "fraquezas compartilhadas do time" ignora isso e mostra um
   aviso. **Isso pode induzir o usuário a uma decisão errada?** Vale mais remover a análise do que
   mostrá-la incompleta?

5. **Importação de save.** O texto colado passa por `JSON.parse` e `applySave()`. Valido forma
   (`Array.isArray`, `typeof`) e resolvo `sname` contra o dex (desconhecidos são descartados).
   **Faltou alguma validação?** Considere: protótipo poluído, `savedTeams` gigante, strings
   enormes, `settings.milestone` fora do range (usado como índice em `LEVELCAPS.rows`).

6. **Superfície de XSS.** Todo dado que vai para `innerHTML` deveria passar por `escapeHtml()`.
   Os dados vêm dos arquivos do jogo (não do usuário), mas **o nome do time salvo é digitado pelo
   usuário**. Confirme se há algum caminho não escapado.

7. **Invariantes de `rosterMove()`.** Deveria garantir: time ≤ 6, sem duplicatas, quem sai vai
   para a caixa, quem entra sai da caixa. Existe sequência de ações que quebre isso?

8. **Formato Showdown.** `showdownName()` só troca espaço por hífen (`Aerodactyl Mega` →
   `Aerodactyl-Mega`). Isso é suficiente para o teambuilder do Showdown aceitar? Formas customizadas
   do hack não existem no Showdown de qualquer forma — o valor é o formato, não a importação real.

9. **`expand_combo_abilities.ps1` edita `ability_translations_pt.json` in-place** e **não** faz
   parte do `build.ps1`. Se as traduções forem regeradas, as 151 habilidades combo voltam a ser
   "A + B" silenciosamente. Isso é uma armadilha de manutenção — como estruturar melhor?

10. **Decisão de 48px nos sprites.** O usuário pediu sprites justamente para identificar Pokémon.
    Reduzi de 64px para 48px para economizar 1,1 MB. É a troca certa, dado que a UI nunca exibe
    acima de 48px?

---

## 10. Código-fonte completo

O que segue é o conteúdo **literal** dos arquivos, extraído automaticamente (sem transcrição
manual, para evitar divergência entre o que auditei e o que está em produção).


### 10.1 Template da aplicacao

Este e o arquivo onde vive toda a logica: HTML, CSS e JavaScript. Os placeholders
no formato __NOME__ sao substituidos pelos JSONs no momento do build.

### artifact_template.html

_2289 linhas, 105.086 bytes._

```html
<title>Elite Redux Terminal</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #f4f2ec;
    --surface: #ffffff;
    --surface-2: #ece7da;
    --surface-3: #e2dbc9;
    --border: #ddd4bd;
    --text: #201d16;
    --text-dim: #6f6754;
    --accent: #d9491f;
    --accent-strong: #b93c18;
    --accent-ink: #fff9f2;
    --accent-2: #12867a;
    --sem-weak: #c23b3b;
    --sem-resist: #1f8f5f;
    --sem-immune: #6b3fa0;
    --focus: #1f9e93;
    --shadow: 0 8px 24px -12px rgb(32 29 22 / 0.35);
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #14181a;
      --surface: #1b2124;
      --surface-2: #212a2d;
      --surface-3: #2a3336;
      --border: #33403f;
      --text: #eef1ee;
      --text-dim: #93a19c;
      --accent: #ff7a45;
      --accent-strong: #ff9466;
      --accent-ink: #1a120c;
      --accent-2: #3fd8c8;
      --sem-weak: #e5686a;
      --sem-resist: #4fce93;
      --sem-immune: #b28ce0;
      --focus: #3fd8c8;
      --shadow: 0 8px 28px -12px rgb(0 0 0 / 0.55);
      color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg: #14181a;
    --surface: #1b2124;
    --surface-2: #212a2d;
    --surface-3: #2a3336;
    --border: #33403f;
    --text: #eef1ee;
    --text-dim: #93a19c;
    --accent: #ff7a45;
    --accent-strong: #ff9466;
    --accent-ink: #1a120c;
    --accent-2: #3fd8c8;
    --sem-weak: #e5686a;
    --sem-resist: #4fce93;
    --sem-immune: #b28ce0;
    --focus: #3fd8c8;
    --shadow: 0 8px 28px -12px rgb(0 0 0 / 0.55);
    color-scheme: dark;
  }

  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: "Figtree", ui-sans-serif, system-ui, sans-serif;
    font-size: 15px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, .display {
    font-family: "Chakra Petch", ui-sans-serif, system-ui, sans-serif;
    text-wrap: balance;
    margin: 0;
  }
  .mono, .tabular {
    font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
    font-variant-numeric: tabular-nums;
  }
  a { color: var(--accent-2); }
  button { font-family: inherit; }
  ::selection { background: var(--accent); color: var(--accent-ink); }

  #app {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* ---------- top bar ---------- */
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    position: sticky;
    top: 0;
    z-index: 20;
  }
  .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .brand-mark {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(155deg, var(--accent), var(--accent-strong));
    color: var(--accent-ink);
    font-size: 20px;
    flex: none;
    box-shadow: var(--shadow);
  }
  .brand-text h1 { font-size: 19px; font-weight: 700; letter-spacing: 0.01em; }
  .brand-sub { margin: 2px 0 0; font-size: 12.5px; color: var(--text-dim); }
  .brand-sub .mono { color: var(--accent-2); }

  .tabs { display: flex; gap: 4px; background: var(--surface-2); padding: 4px; border-radius: 10px; }
  .tab-btn {
    border: none;
    background: transparent;
    color: var(--text-dim);
    padding: 8px 14px;
    border-radius: 7px;
    font-weight: 600;
    font-size: 13.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background .15s, color .15s;
  }
  .tab-btn:hover { color: var(--text); }
  .tab-btn.active { background: var(--surface); color: var(--accent); box-shadow: var(--shadow); }
  .count-badge {
    background: var(--accent);
    color: var(--accent-ink);
    border-radius: 999px;
    font-size: 11px;
    padding: 1px 7px;
    font-family: "IBM Plex Mono", monospace;
  }
  .tab-btn:not(.active) .count-badge { background: var(--surface-3); color: var(--text-dim); }

  /* min-width:0 on every flex item in this chain: without it a wide child (the
     type matrix) stretches its ancestors instead of scrolling inside .scroll-x,
     which pushed the whole page sideways on a phone. */
  main { flex: 1; min-height: 0; min-width: 0; display: flex; }
  .view { display: none; flex: 1; min-height: 0; min-width: 0; }
  .view.active { display: flex; }

  /* ---------- Dex view ---------- */
  .dex-shell { flex: 1; min-height: 0; display: grid; grid-template-columns: 340px 1fr; }
  .dex-sidebar {
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--surface);
  }
  .search-row { padding: 14px 14px 8px; }
  #search-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    font-size: 14px;
  }
  #search-input:focus { outline: 2px solid var(--focus); outline-offset: 1px; }
  .filter-row { display: flex; gap: 8px; padding: 0 14px 10px; }
  .chip-btn {
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    padding: 7px 10px;
    border-radius: 7px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .chip-btn.active { border-color: var(--accent); color: var(--accent); }
  #sort-select {
    flex: 1;
    min-width: 0;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    border-radius: 7px;
    padding: 7px 8px;
    font-size: 12.5px;
  }
  .type-filter-panel {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .type-filter-panel.hidden { display: none; }
  .type-check {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 9px 4px 6px;
    border-radius: 999px;
    border: 1px solid var(--border);
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    background: var(--surface-2);
    user-select: none;
  }
  .type-check input { accent-color: var(--accent); }
  .type-check.checked { color: var(--accent-ink); }

  .species-list { list-style: none; margin: 0; padding: 4px 0; overflow-y: auto; flex: 1; }
  .species-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    cursor: pointer;
    border-left: 3px solid transparent;
    content-visibility: auto;
    contain-intrinsic-size: 46px;
  }
  .species-row:hover { background: var(--surface-2); }
  .species-row.selected { background: var(--surface-2); border-left-color: var(--accent); }
  .species-row .dexno { color: var(--text-dim); font-size: 11.5px; width: 34px; flex: none; }
  .species-row .sname { font-weight: 600; font-size: 13.5px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .species-row .pips { display: flex; gap: 3px; flex: none; }
  .no-results { padding: 20px 16px; color: var(--text-dim); font-size: 13px; }

  .type-pip { width: 9px; height: 9px; border-radius: 3px; flex: none; }
  .type-pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .02em;
  }

  .species-detail { flex: 1; min-height: 0; overflow-y: auto; padding: 24px 28px 60px; }
  .empty-state { color: var(--text-dim); padding: 40px; text-align: center; font-size: 14px; }
  .back-btn { display: none; }

  .detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 6px; }
  .detail-titles h2 { font-size: 26px; font-weight: 700; }
  .detail-dexno { color: var(--text-dim); font-size: 13px; }
  .detail-sname { color: var(--text-dim); font-size: 11.5px; margin-top: 2px; }
  .detail-types { display: flex; gap: 6px; margin: 10px 0 14px; }
  .add-team-btn {
    background: var(--accent);
    color: var(--accent-ink);
    border: none;
    padding: 9px 16px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }
  .add-team-btn:disabled { background: var(--surface-3); color: var(--text-dim); cursor: default; }
  .flavor { color: var(--text-dim); font-size: 13.5px; font-style: italic; max-width: 65ch; margin-bottom: 20px; }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 18px;
    margin-bottom: 16px;
  }
  .card h3 { font-size: 12.5px; text-transform: uppercase; letter-spacing: .07em; color: var(--text-dim); margin-bottom: 12px; }

  .stat-row { display: grid; grid-template-columns: 90px 40px 1fr; align-items: center; gap: 10px; margin-bottom: 7px; }
  .stat-row:last-child { margin-bottom: 0; }
  .stat-row .stat-label { font-size: 12px; color: var(--text-dim); font-weight: 600; }
  .stat-row .stat-val { font-size: 13px; text-align: right; }
  .stat-bar-track { height: 8px; background: var(--surface-2); border-radius: 999px; overflow: hidden; }
  .stat-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--accent-2), var(--accent)); }
  .stat-total { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border); font-size: 12.5px; color: var(--text-dim); }
  .stat-total b { color: var(--text); }

  .abi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
  .abi-card { background: var(--surface-2); border-radius: 9px; padding: 10px 12px; }
  .abi-card .abi-name { font-weight: 700; font-size: 13.5px; }
  /* pre-line so combo abilities ("Rock Head + Reckless") can list what each
     component does on its own line instead of running together. */
  .abi-card .abi-desc { font-size: 12.5px; color: var(--text-dim); margin-top: 3px; white-space: pre-line; }
  .abi-kind {
    display: inline-block;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: .06em;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
    margin-bottom: 5px;
  }
  .abi-kind.choosable { background: color-mix(in srgb, var(--accent-2) 22%, transparent); color: var(--accent-2); }
  .abi-kind.innate { background: color-mix(in srgb, var(--accent) 20%, transparent); color: var(--accent); }

  .evo-chain { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .evo-node { background: var(--surface-2); border-radius: 8px; padding: 8px 12px; font-size: 13px; font-weight: 600; }
  .evo-arrow { color: var(--text-dim); font-size: 13px; display: flex; flex-direction: column; align-items: center; }
  .evo-arrow small { font-size: 10.5px; color: var(--text-dim); font-weight: 600; }

  .moves-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .moves-table th { text-align: left; color: var(--text-dim); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; padding: 5px 8px; border-bottom: 1px solid var(--border); }
  .moves-table td { padding: 6px 8px; border-bottom: 1px solid var(--border); }
  .moves-table tr.move-row { cursor: pointer; }
  .moves-table tr.move-row:hover { background: var(--surface-2); }
  .moves-table tr.move-row.above-cap { opacity: .5; }
  .cap-tag {
    display: inline-block;
    font-size: 8.5px;
    text-transform: uppercase;
    letter-spacing: .03em;
    font-weight: 700;
    color: var(--sem-weak);
    border: 1px solid var(--sem-weak);
    border-radius: 999px;
    padding: 0 5px;
    margin-left: 3px;
    vertical-align: middle;
  }
  .move-detail-row td { background: var(--surface-2); color: var(--text-dim); font-size: 12px; padding: 8px 12px; }
  .move-detail-row.hidden { display: none; }
  .move-type-tag { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
  .scroll-x { overflow-x: auto; }
  .tutor-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .tutor-chip { background: var(--surface-2); border-radius: 999px; padding: 4px 10px; font-size: 12px; cursor: default; }

  /* ---------- Team view ---------- */
  .team-shell { flex: 1; min-width: 0; overflow-y: auto; padding: 24px 28px 60px; display: flex; flex-direction: column; gap: 20px; }
  .team-slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }

  .box-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .box-grid .empty-note { color: var(--text-dim); font-size: 13px; }
  .box-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 5px 6px 5px 12px;
    font-size: 12.5px;
    font-weight: 600;
  }
  .box-chip .box-chip-pips { display: flex; gap: 3px; }
  .box-chip .remove-btn { font-size: 15px; line-height: 1; padding: 2px 4px; }

  .saved-teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
  .saved-team-card { border: 1px solid var(--border); border-radius: 12px; padding: 12px; background: var(--surface-2); }
  .saved-team-card.empty { display: flex; align-items: center; justify-content: center; min-height: 90px; color: var(--text-dim); font-size: 12.5px; border-style: dashed; }
  .saved-team-card .stc-name { font-weight: 700; font-size: 13.5px; margin-bottom: 8px; }
  .saved-team-card .stc-sprites { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 10px; }
  .saved-team-card .stc-actions { display: flex; gap: 8px; }
  .saved-team-card .stc-actions button { flex: 1; padding: 6px 8px; border-radius: 7px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 11.5px; font-weight: 700; cursor: pointer; }
  .saved-team-card .stc-actions button.stc-load { border-color: var(--accent); color: var(--accent); }
  .saved-team-card .stc-actions button.stc-delete { color: var(--sem-weak); }
  .stc-active-badge { font-size: 10px; font-weight: 700; color: var(--sem-resist); letter-spacing: .02em; }
  .stc-rename-input {
    width: 100%;
    margin-bottom: 8px;
    padding: 6px 8px;
    border-radius: 7px;
    border: 1px solid var(--accent);
    background: var(--surface);
    color: var(--text);
    font-size: 13px;
    font-weight: 700;
  }

  .boss-cat-tag {
    flex: none;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .03em;
    color: var(--text-dim);
    background: var(--surface-2);
    border-radius: 999px;
    padding: 2px 8px;
    white-space: nowrap;
  }
  .boss-mon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
  .boss-mon-card { background: var(--surface-2); border-radius: 9px; padding: 10px 12px; }
  .boss-mon-card .bm-head { display: flex; align-items: center; gap: 9px; margin-bottom: 7px; }
  .boss-mon-card .bm-name { font-weight: 700; font-size: 13.5px; margin-bottom: 4px; }
  .boss-mon-card .bm-types { display: flex; gap: 5px; }
  .boss-mon-card .bm-row { font-size: 11.5px; color: var(--text-dim); line-height: 1.5; }
  .boss-mon-card .bm-row b { color: var(--text); font-weight: 600; }
  .team-slot {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
    background: var(--surface);
    min-height: 96px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .team-slot.empty {
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
    font-size: 13px;
    border-style: dashed;
    text-align: center;
  }
  /* The whole sprite sheet lives in this one rule (build.ps1 inlines it as a
     base64 PNG). Kept in CSS rather than a JS-set custom property: a multi-MB
     value is rejected as a custom property but fine as a stylesheet url(). */
  .spr {
    display: inline-block;
    flex: none;
    border-radius: 8px;
    background-color: var(--surface-2);
    background-image: url("__SPRITE_ATLAS_DATAURI__");
    background-repeat: no-repeat;
    image-rendering: pixelated;
  }
  .sprite-fallback {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: var(--surface-3);
    color: var(--text-dim);
    font-weight: 700;
  }
  .ts-head { display: flex; align-items: center; gap: 10px; }
  .team-slot .ts-name { font-weight: 700; font-size: 15px; }
  .team-slot.swapping { border-color: var(--accent); }
  .ts-actions { display: flex; gap: 8px; align-items: center; justify-content: flex-end; margin-top: 10px; }
  .ts-swap-btn {
    background: var(--surface-2);
    border: 1px solid var(--border);
    color: var(--accent-2);
    font-size: 11.5px;
    font-weight: 700;
    padding: 5px 10px;
    border-radius: 7px;
    cursor: pointer;
  }
  .ts-swap-btn:hover { border-color: var(--accent-2); }
  .ts-goto-dex {
    background: var(--surface-2);
    border: 1px solid var(--border);
    color: var(--accent);
    font-size: 12px;
    font-weight: 700;
    padding: 7px 12px;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 8px;
  }
  .ts-goto-dex + .ts-goto-dex { margin-left: 6px; }
  .ts-goto-dex:hover { border-color: var(--accent); }

  .swap-panel { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--accent); }
  .swap-title { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--accent); font-weight: 700; margin-bottom: 8px; }
  .swap-empty { font-size: 11.5px; color: var(--text-dim); }
  .swap-list { display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; }
  .swap-pick {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    text-align: left;
    background: var(--surface-2);
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 4px 8px;
    cursor: pointer;
    color: var(--text);
  }
  .swap-pick:hover { border-color: var(--accent); background: var(--surface-3); }
  .swap-pick-name { font-size: 12.5px; font-weight: 600; }

  .box-chip .box-to-team {
    background: none;
    border: none;
    color: var(--accent-2);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    padding: 2px 4px;
  }
  .box-chip .box-to-team:disabled { color: var(--text-dim); cursor: default; }

  .row-add-btn {
    flex: none;
    background: none;
    border: 1px solid var(--border);
    color: var(--text-dim);
    width: 24px;
    height: 24px;
    border-radius: 6px;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
  }
  .row-add-btn:hover { border-color: var(--accent); color: var(--accent); }
  .row-add-btn:disabled { opacity: .35; cursor: default; }
  .row-add-btn.is-swap { color: var(--accent-2); border-color: color-mix(in srgb, var(--accent-2) 45%, transparent); }

  #toast {
    position: fixed;
    left: 50%;
    bottom: 22px;
    transform: translateX(-50%) translateY(12px);
    background: var(--accent);
    color: var(--accent-ink);
    font-size: 13px;
    font-weight: 700;
    padding: 10px 18px;
    border-radius: 999px;
    box-shadow: var(--shadow);
    opacity: 0;
    pointer-events: none;
    transition: opacity .18s, transform .18s;
    z-index: 100;
    max-width: 90vw;
    text-align: center;
  }
  #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

  .showdown-block {
    font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
    font-size: 11.5px;
    line-height: 1.55;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
    margin: 0;
    white-space: pre;
    overflow-x: auto;
    color: var(--text);
  }
  .ts-build-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .ts-build-copy {
    background: none;
    border: none;
    color: var(--accent-2);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    padding: 2px 4px;
  }
  .ts-build-note { font-size: 11px; color: var(--text-dim); margin-top: 6px; font-style: italic; }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 200;
  }
  .modal-backdrop[hidden] { display: none; }
  .modal-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 18px;
    width: 100%;
    max-width: 420px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: var(--shadow);
  }
  .modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .modal-title { font-family: "Chakra Petch", sans-serif; font-weight: 700; font-size: 16px; }
  .modal-sub { color: var(--text-dim); font-size: 12.5px; margin: 4px 0 12px; }
  .modal-close {
    background: none;
    border: none;
    color: var(--text-dim);
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    padding: 0 4px;
  }
  .modal-close:hover { color: var(--text); }

  .transfer-label {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .06em;
    font-weight: 700;
    color: var(--text-dim);
    margin-bottom: 5px;
  }
  #transfer-import {
    width: 100%;
    padding: 9px 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    font-size: 11.5px;
    resize: vertical;
  }
  .sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
  .team-slot .ts-types { display: flex; gap: 5px; margin: 6px 0; }
  .team-slot .ts-abis { font-size: 11.5px; color: var(--text-dim); line-height: 1.4; }
  .ts-build {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed var(--border);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ts-build-label {
    text-transform: uppercase;
    letter-spacing: .04em;
    font-size: 9.5px;
    font-weight: 700;
    color: var(--accent-2);
  }
  .ts-build-empty { color: var(--text-dim); font-style: italic; font-size: 11.5px; }
  .remove-btn {
    align-self: flex-end;
    background: none;
    border: none;
    color: var(--sem-weak);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    padding: 2px 0;
  }

  .team-analysis h3 { font-size: 13px; margin-bottom: 10px; }
  .cov-table { border-collapse: collapse; font-size: 12px; }
  .cov-table th, .cov-table td { padding: 6px 7px; text-align: center; border-bottom: 1px solid var(--border); }
  .cov-table th.rowhead, .cov-table td.rowhead { text-align: left; font-weight: 600; }
  .cov-cell { border-radius: 5px; padding: 3px 0; font-weight: 700; font-family: "IBM Plex Mono", monospace; }
  .cov-weak { background: color-mix(in srgb, var(--sem-weak) 24%, transparent); color: var(--sem-weak); }
  .cov-resist { background: color-mix(in srgb, var(--sem-resist) 22%, transparent); color: var(--sem-resist); }
  .cov-immune { background: color-mix(in srgb, var(--sem-immune) 26%, transparent); color: var(--sem-immune); }
  .cov-neutral { color: var(--text-dim); }

  .risk-list { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; }
  .risk-item { display: flex; align-items: center; gap: 10px; font-size: 13px; }
  .risk-item .risk-bar-track { flex: 1; height: 7px; background: var(--surface-2); border-radius: 999px; overflow: hidden; max-width: 240px; }
  .risk-item .risk-bar-fill { height: 100%; background: var(--sem-weak); }

  /* ---------- Types view ---------- */
  .types-shell { flex: 1; min-width: 0; overflow-y: auto; padding: 24px 28px 60px; }
  .hint { color: var(--text-dim); font-size: 13px; max-width: 70ch; margin-bottom: 16px; }
  #type-matrix { border-collapse: collapse; font-size: 11.5px; }
  #type-matrix th, #type-matrix td { padding: 5px 7px; text-align: center; border: 1px solid var(--border); white-space: nowrap; }
  #type-matrix th { font-weight: 700; font-size: 10px; }
  #type-matrix td.mult-2 { background: color-mix(in srgb, var(--sem-resist) 30%, transparent); font-weight: 700; }
  #type-matrix td.mult-05 { background: color-mix(in srgb, var(--sem-weak) 16%, transparent); }
  #type-matrix td.mult-0 { background: color-mix(in srgb, var(--sem-immune) 30%, transparent); font-weight: 700; }

  .footer {
    border-top: 1px solid var(--border);
    padding: 14px 24px;
    font-size: 12px;
    color: var(--text-dim);
    background: var(--surface);
  }
  .footer a { color: var(--accent-2); text-decoration: none; }
  .footer a:hover { text-decoration: underline; }

  @media (max-width: 860px) {
    .dex-shell { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    .dex-sidebar { display: flex; }
    /* With a detail open, keep the search box on screen and step only the
       results list aside — otherwise looking up a second Pokemon means going
       back to the list first. Typing brings the list right back (see JS). */
    .dex-shell.show-detail .dex-sidebar {
      display: flex;
      flex: none;
      min-height: 0;
      border-right: none;
      border-bottom: 1px solid var(--border);
    }
    .dex-shell.show-detail .species-list,
    .dex-shell.show-detail .filter-row,
    .dex-shell.show-detail .type-filter-panel { display: none; }
    .dex-shell.show-detail .search-row { padding: 10px 14px; }
    .dex-shell:not(.show-detail) .species-detail { display: none; }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: none;
      border: none;
      color: var(--accent-2);
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      margin-bottom: 10px;
      padding: 0;
    }
    .topbar { padding: 10px 12px; gap: 10px; }
    .species-detail { padding: 16px 16px 50px; }
    .team-shell, .types-shell { padding: 16px 16px 50px; }
  }

  /* Phone layout: the header must not eat the screen, and every tab has to stay
     reachable — at 375px all six no longer fit on one row. */
  @media (max-width: 620px) {
    .brand-sub { display: none; }
    .brand-mark { width: 32px; height: 32px; font-size: 16px; border-radius: 8px; }
    .brand-text h1 { font-size: 16px; }
    .topbar { padding: 8px 10px; gap: 8px; }
    .tabs {
      width: 100%;
      overflow-x: auto;
      flex-wrap: nowrap;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }
    .tabs::-webkit-scrollbar { display: none; }
    .tab-btn { white-space: nowrap; padding: 7px 11px; font-size: 13px; }
    .species-row { padding: 6px 10px; gap: 8px; }
    .species-row .dexno { display: none; }
    .team-slots { grid-template-columns: 1fr; }
    .saved-teams-grid { grid-template-columns: 1fr; }
  }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
</style>

<div id="app">
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark">⌁</div>
      <div class="brand-text">
        <h1>Elite Redux Terminal</h1>
        <p class="brand-sub">Dex offline &middot; build <span class="mono">2.65beta</span> &middot; <span id="species-count" class="mono"></span> espécies &middot; dados de <span id="data-stamp" class="mono"></span></p>
      </div>
    </div>
    <nav class="tabs" role="tablist" aria-label="Seções">
      <button class="tab-btn active" data-tab="dex" type="button" role="tab" aria-selected="true" aria-controls="view-dex">Dex</button>
      <button class="tab-btn" data-tab="team" type="button" role="tab" aria-selected="false" aria-controls="view-team">Meu Time <span id="team-count-badge" class="count-badge mono">0/6</span></button>
      <button class="tab-btn" data-tab="box" type="button" role="tab" aria-selected="false" aria-controls="view-box">Caixa <span id="box-count-badge" class="count-badge mono">0</span></button>
      <button class="tab-btn" data-tab="bosses" type="button" role="tab" aria-selected="false" aria-controls="view-bosses">Chefões <span id="boss-count-badge" class="count-badge mono"></span></button>
      <button class="tab-btn" data-tab="progress" type="button" role="tab" aria-selected="false" aria-controls="view-progress">Progresso <span id="cap-badge" class="count-badge mono"></span></button>
      <button class="tab-btn" data-tab="types" type="button" role="tab" aria-selected="false" aria-controls="view-types">Tipos</button>
    </nav>
  </header>

  <main>
    <section id="view-dex" class="view active">
      <div class="dex-shell" id="dex-shell">
        <aside class="dex-sidebar">
          <div class="search-row">
            <input id="search-input" type="search" placeholder="Buscar por nome..." autocomplete="off" aria-label="Buscar Pokémon por nome">
          </div>
          <div class="filter-row">
            <button id="type-filter-toggle" class="chip-btn" type="button">Filtrar por tipo</button>
            <select id="sort-select" aria-label="Ordenar a lista">
              <option value="dex">Nº Dex</option>
              <option value="name">Nome A-Z</option>
              <option value="bst">BST total</option>
              <option value="hp">HP</option>
              <option value="atk">Ataque</option>
              <option value="def">Defesa</option>
              <option value="spa">Sp. Ataque</option>
              <option value="spd">Sp. Defesa</option>
              <option value="spe">Velocidade</option>
            </select>
          </div>
          <div id="type-filter-panel" class="type-filter-panel hidden"></div>
          <ul id="species-list" class="species-list"></ul>
        </aside>
        <div id="species-detail" class="species-detail">
          <div class="empty-state">Selecione um Pokémon na lista para ver a ficha completa: stats, as 3 habilidades, as 3 innates, evolução e movepool.</div>
        </div>
      </div>
    </section>

    <section id="view-team" class="view">
      <div class="team-shell">
        <div>
          <h3 style="margin-bottom:10px;font-size:13px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-dim);">Meu time (máx. 6)</h3>
          <div class="team-slots" id="team-slots"></div>
        </div>

        <div class="card" id="showdown-card">
          <h3>Time completo em formato Showdown</h3>
          <p style="color:var(--text-dim);font-size:12.5px;margin:0 0 10px;max-width:65ch;">O mesmo formato usado no Smogon / Pokémon Showdown — dá pra colar direto no teambuilder ou em qualquer análise.</p>
          <pre class="showdown-block" id="showdown-team"></pre>
          <div style="display:flex;gap:8px;align-items:center;margin-top:10px;">
            <button id="showdown-copy" class="add-team-btn" type="button">Copiar time inteiro</button>
            <span id="showdown-status" style="font-size:11.5px;color:var(--accent-2);"></span>
          </div>
        </div>

        <div class="card" id="saved-teams-card">
          <h3>Times salvos (máx. 3)</h3>
          <p style="color:var(--text-dim);font-size:12.5px;margin:0 0 10px;max-width:65ch;">Guarde até 3 composições completas — inclusive as que eu recomendar depois de analisar um chefão — e carregue de volta quando quiser sem remontar tudo na mão.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">
            <input id="save-team-name" type="text" placeholder="Nome do time (opcional)" aria-label="Nome do time a salvar" style="flex:1;min-width:180px;padding:9px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:12.5px;">
            <button id="save-team-btn" class="add-team-btn" type="button">Salvar time atual</button>
          </div>
          <div id="saved-teams-status" style="font-size:11.5px;color:var(--accent-2);margin:0 0 10px;min-height:14px;"></div>
          <div class="saved-teams-grid" id="saved-teams-grid"></div>
        </div>

        <div class="card" id="claude-export-card">
          <h3>Enviar para o Claude</h3>
          <p style="color:var(--text-dim);font-size:12.5px;margin:0 0 10px;max-width:65ch;">O time fica salvo só neste navegador — o Claude não consegue ler isso sozinho. Copie o resumo abaixo e cole na conversa para pedir builds, sinergia e alertas de dificuldade.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <input id="claude-export-text" class="mono" type="text" readonly aria-label="Resumo do time para copiar" style="flex:1;min-width:220px;padding:9px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:12.5px;">
            <button id="claude-export-copy" class="add-team-btn" type="button">Copiar</button>
          </div>
          <div id="claude-export-status" style="font-size:11.5px;color:var(--accent-2);margin-top:6px;min-height:14px;"></div>
        </div>

        <div class="card" id="transfer-card">
          <h3>Levar para outro aparelho</h3>
          <p style="color:var(--text-dim);font-size:12.5px;margin:0 0 12px;max-width:65ch;">Time, caixa, times salvos e progresso ficam guardados por navegador — o celular e o PC não se enxergam. Este código carrega tudo de um para o outro.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
            <button id="transfer-copy" class="add-team-btn" type="button">Copiar código do save</button>
            <button id="transfer-download" class="add-team-btn" type="button" style="background:var(--surface-3);color:var(--text);" hidden>Baixar arquivo</button>
          </div>
          <label for="transfer-import" class="transfer-label">Colar código vindo do outro aparelho</label>
          <textarea id="transfer-import" class="mono" rows="3" placeholder="Cole aqui o código copiado no outro aparelho..."></textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px;">
            <button id="transfer-apply" class="add-team-btn" type="button">Carregar este save</button>
            <span id="transfer-status" style="font-size:11.5px;color:var(--accent-2);"></span>
          </div>
        </div>

        <div class="team-analysis" id="team-analysis"></div>
      </div>
    </section>

    <section id="view-box" class="view">
      <div class="team-shell">
        <div>
          <h3 style="margin-bottom:6px;font-size:13px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-dim);">Minha caixa (PC Box)</h3>
          <p style="color:var(--text-dim);font-size:12.5px;margin:0 0 12px;max-width:70ch;">Todo Pokémon que você já capturou, sem limite de 6. Use isso pra guardar o panorama geral: quanto mais completo, melhor eu consigo sugerir trocas quando um treinador específico estiver dando trabalho.</p>
          <div class="box-grid" id="box-grid"></div>
        </div>
        <div class="card" id="claude-export-box-card">
          <h3>Enviar caixa para o Claude</h3>
          <p style="color:var(--text-dim);font-size:12.5px;margin:0 0 10px;max-width:65ch;">Mesma ideia do time: isso fica só neste navegador. Copie e cole na conversa quando quiser perguntar "o que eu tenho na caixa que resolve X".</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start;">
            <textarea id="claude-export-box-text" class="mono" readonly rows="3" aria-label="Resumo da caixa para copiar" style="flex:1;min-width:220px;padding:9px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:12.5px;resize:vertical;"></textarea>
            <button id="claude-export-box-copy" class="add-team-btn" type="button">Copiar</button>
          </div>
          <div id="claude-export-box-status" style="font-size:11.5px;color:var(--accent-2);margin-top:6px;min-height:14px;"></div>
        </div>
      </div>
    </section>

    <section id="view-bosses" class="view">
      <div class="dex-shell" id="boss-shell">
        <aside class="dex-sidebar">
          <div class="search-row">
            <input id="boss-search-input" type="search" placeholder="Buscar treinador..." autocomplete="off" aria-label="Buscar chefão por nome">
          </div>
          <div class="filter-row">
            <select id="boss-cat-select" aria-label="Filtrar chefões por categoria" style="flex:1;border:1px solid var(--border);background:var(--surface-2);color:var(--text);border-radius:7px;padding:7px 8px;font-size:12.5px;">
              <option value="">Todas as categorias</option>
            </select>
          </div>
          <ul id="boss-list" class="species-list"></ul>
        </aside>
        <div id="boss-detail" class="species-detail">
          <div class="empty-state">Perdeu pra algum chefão? Escolha ele na lista — eu monto o time completo dele, e você exporta pra mim junto com seu time e sua caixa pra eu bolar a estratégia de vitória.</div>
        </div>
      </div>
    </section>

    <section id="view-progress" class="view">
      <div class="types-shell">
        <p class="hint">Isso define o que a ferramenta assume em toda a run: qual variante de time (Padrão/Insane/Hell) aparece por padrão na aba Chefões, qual coluna de level cap conta, e o que entra automaticamente nos textos de "Enviar para o Claude".</p>
        <div class="card" style="max-width:460px;">
          <h3>Dificuldade e progresso atual</h3>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <label style="display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:600;">Dificuldade
              <select id="settings-difficulty" style="border:1px solid var(--border);background:var(--surface-2);color:var(--text);border-radius:7px;padding:8px 9px;font-size:13px;">
                <option value="easy">Easy</option>
                <option value="ace">Ace</option>
                <option value="elite">Elite</option>
              </select>
            </label>
            <label style="display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:600;">Último badge conquistado
              <select id="settings-milestone" style="border:1px solid var(--border);background:var(--surface-2);color:var(--text);border-radius:7px;padding:8px 9px;font-size:13px;"></select>
            </label>
          </div>
          <div class="stat-total" style="margin-top:16px;">Level cap atual <b class="mono" id="cap-display" style="font-size:16px;"></b></div>
          <p style="color:var(--text-dim);font-size:11px;margin-top:10px;" id="settings-note"></p>
        </div>
      </div>
    </section>

    <section id="view-types" class="view">
      <div class="types-shell">
        <p class="hint">Multiplicador de dano do tipo atacante (linhas) contra o tipo defensor (colunas). Tabela padrão da franquia — no Elite Redux, habilidades individuais podem alterar matchups específicos; o texto de cada habilidade aparece na ficha do Pokémon na aba Dex.</p>
        <div class="scroll-x"><table id="type-matrix"></table></div>

        <h3 style="margin-top:26px;margin-bottom:8px;font-size:13px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-dim);">Level caps</h3>
        <p class="hint" id="levelcap-note"></p>
        <div class="scroll-x"><table id="levelcap-table" class="cov-table"></table></div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <p>Dados extraídos do <a href="https://forwardfeed.github.io/ER-nextdex/static/" target="_blank" rel="noopener">Elite Redux NextDex</a> oficial (build 2.65beta), mantido por ForwardFeed. Para encontros selvagens, times de treinadores e rotas de mono run, veja a <a href="https://eliteredux.net/full-documentation/" target="_blank" rel="noopener">documentação completa</a> e a <a href="https://wiki.elite-redux.com" target="_blank" rel="noopener">wiki oficial</a>.</p>
  </footer>
  <div id="toast" role="status" aria-live="polite"></div>

  <div id="swap-modal" class="modal-backdrop" hidden>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="swap-modal-title">
      <div class="modal-head">
        <div id="swap-modal-title" class="modal-title"></div>
        <button id="swap-modal-close" class="modal-close" type="button" aria-label="Fechar">&times;</button>
      </div>
      <p class="modal-sub">Escolha quem sai do time — ele vai direto para a caixa.</p>
      <div id="swap-modal-list" class="swap-list"></div>
    </div>
  </div>
</div>

<script id="dexdata" type="application/json">__DEX_DATA_JSON__</script>
<script id="builds" type="application/json">__BUILDS_JSON__</script>
<script id="bossdata" type="application/json">__BOSSES_JSON__</script>
<script id="levelcapdata" type="application/json">__LEVELCAPS_JSON__</script>
<script id="savedteamsseed" type="application/json">__SAVEDTEAMS_JSON__</script>
<script id="abilitypt" type="application/json">__ABILITY_PT_JSON__</script>
<script id="movept" type="application/json">__MOVE_PT_JSON__</script>
<script id="spriteindex" type="application/json">__SPRITE_INDEX_JSON__</script>
<script>
(function () {
  "use strict";
  var DATA = JSON.parse(document.getElementById("dexdata").textContent);
  var BUILDS = JSON.parse(document.getElementById("builds").textContent || "{}");
  var BOSSES = JSON.parse(document.getElementById("bossdata").textContent || "[]");
  var LEVELCAPS = JSON.parse(document.getElementById("levelcapdata").textContent || "null");
  var SAVEDTEAMS_SEED = JSON.parse(document.getElementById("savedteamsseed").textContent || "[]");
  var ABILITY_PT = JSON.parse(document.getElementById("abilitypt").textContent || "{}");
  var MOVE_PT = JSON.parse(document.getElementById("movept").textContent || "{}");
  var SPRITE_INDEX = JSON.parse(document.getElementById("spriteindex").textContent || "{}");
  var TYPES = DATA.types;
  var ABILITIES = DATA.abilities;
  var MOVES = DATA.moves;
  var EVOKINDS = DATA.evoKinds;
  var SPECIES = DATA.species.filter(function (s) { return s; });

  // Two identifiers, on purpose:
  //   x     - the species' index in this build's data array. Fast, but it is
  //           NOT stable across game versions (comparing two builds, 1661 of
  //           1665 positions pointed at different species), so it may only
  //           ever live in memory.
  //   sname - "SPECIES_AERODACTYL_MEGA". Unique across all 1906 species and
  //           stable across versions, so everything persisted or authored by
  //           hand (localStorage, builds.json, the saved-team seed) uses it.
  var SPECIES_BY_X = Object.create(null);
  var SPECIES_BY_SNAME = Object.create(null);
  SPECIES.forEach(function (s) {
    SPECIES_BY_X[s.x] = s;
    SPECIES_BY_SNAME[s.sname] = s;
  });

  function getSpeciesByX(x) { return SPECIES_BY_X[x] || null; }
  function getSpeciesBySname(sn) { return SPECIES_BY_SNAME[sn] || null; }
  function snameOf(x) { var s = SPECIES_BY_X[x]; return s ? s.sname : null; }

  // sname list (persisted form) -> x list (runtime form), dropping anything
  // this data build no longer knows about.
  function snamesToXs(list) {
    if (!Array.isArray(list)) return [];
    return list.map(function (sn) {
      var s = (typeof sn === "string") ? SPECIES_BY_SNAME[sn] : null;
      return s ? s.x : null;
    }).filter(function (x) { return x !== null; });
  }
  function xsToSnames(list) {
    return (list || []).map(snameOf).filter(Boolean);
  }

  var USABLE_TYPES = TYPES.filter(function (t) { return t !== "Mystery" && t !== "None" && t !== "Stellar"; });

  var TYPE_META = {
    Normal:  { hex: "#8e8873", dark: false },
    Fighting:{ hex: "#c1432e", dark: false },
    Fire:    { hex: "#e8632c", dark: false },
    Water:   { hex: "#3d7dc9", dark: false },
    Electric:{ hex: "#d6a819", dark: true  },
    Grass:   { hex: "#5a9e42", dark: false },
    Ice:     { hex: "#5cc3ce", dark: true  },
    Poison:  { hex: "#8e4ea6", dark: false },
    Ground:  { hex: "#b5904a", dark: true  },
    Flying:  { hex: "#7f9fd6", dark: true  },
    Psychic: { hex: "#d9527e", dark: false },
    Bug:     { hex: "#8fa832", dark: true  },
    Rock:    { hex: "#a68a4a", dark: true  },
    Ghost:   { hex: "#5c5a94", dark: false },
    Dragon:  { hex: "#5b4fc4", dark: false },
    Dark:    { hex: "#4a4640", dark: false },
    Steel:   { hex: "#7c8a94", dark: true  },
    Fairy:   { hex: "#d982ad", dark: true  }
  };

  var TYPE_CHART = {
    Normal:   { Rock:0.5, Ghost:0, Steel:0.5 },
    Fighting: { Normal:2, Ice:2, Poison:0.5, Flying:0.5, Psychic:0.5, Bug:0.5, Rock:2, Ghost:0, Dark:2, Steel:2, Fairy:0.5 },
    Fire:     { Fire:0.5, Water:0.5, Grass:2, Ice:2, Bug:2, Rock:0.5, Dragon:0.5, Steel:2 },
    Water:    { Fire:2, Water:0.5, Grass:0.5, Ground:2, Rock:2, Dragon:0.5 },
    Electric: { Water:2, Electric:0.5, Grass:0.5, Ground:0, Flying:2, Dragon:0.5 },
    Grass:    { Fire:0.5, Water:2, Grass:0.5, Poison:0.5, Ground:2, Flying:0.5, Bug:0.5, Rock:2, Dragon:0.5, Steel:0.5 },
    Ice:      { Fire:0.5, Water:0.5, Grass:2, Ice:0.5, Ground:2, Flying:2, Dragon:2, Steel:0.5 },
    Poison:   { Grass:2, Poison:0.5, Ground:0.5, Rock:0.5, Ghost:0.5, Steel:0, Fairy:2 },
    Ground:   { Fire:2, Electric:2, Grass:0.5, Poison:2, Flying:0, Bug:0.5, Rock:2, Steel:2 },
    Flying:   { Electric:0.5, Grass:2, Fighting:2, Bug:2, Rock:0.5, Steel:0.5 },
    Psychic:  { Fighting:2, Poison:2, Psychic:0.5, Dark:0, Steel:0.5 },
    Bug:      { Fire:0.5, Grass:2, Fighting:0.5, Poison:0.5, Flying:0.5, Psychic:2, Ghost:0.5, Dark:2, Steel:0.5, Fairy:0.5 },
    Rock:     { Fire:2, Ice:2, Fighting:0.5, Ground:0.5, Flying:2, Bug:2, Steel:0.5 },
    Ghost:    { Normal:0, Psychic:2, Ghost:2, Dark:0.5 },
    Dragon:   { Dragon:2, Steel:0.5, Fairy:0 },
    Dark:     { Fighting:0.5, Psychic:2, Ghost:2, Dark:0.5, Fairy:0.5 },
    Steel:    { Fire:0.5, Water:0.5, Electric:0.5, Ice:2, Rock:2, Steel:0.5, Fairy:2 },
    Fairy:    { Fire:0.5, Fighting:2, Poison:0.5, Dragon:2, Dark:2, Steel:0.5 }
  };

  function typeMultiplier(atk, defTypes) {
    var m = 1;
    for (var i = 0; i < defTypes.length; i++) {
      var row = TYPE_CHART[atk];
      var v = row && (defTypes[i] in row) ? row[defTypes[i]] : 1;
      m *= v;
    }
    return m;
  }

  function speciesTypeNames(sp) {
    var names = sp.t.map(function (i) { return TYPES[i]; });
    if (names.length === 2 && names[0] === names[1]) names = [names[0]];
    return names;
  }

  function typePill(name, small) {
    var meta = TYPE_META[name] || { hex: "#777", dark: false };
    var color = meta.dark ? "#1c1b17" : "#fff9f2";
    return '<span class="type-pill" style="background:' + meta.hex + ';color:' + color + (small ? ';padding:2px 8px;font-size:10.5px' : '') + '">' + escapeHtml(name) + '</span>';
  }

  function typePip(name) {
    var meta = TYPE_META[name] || { hex: "#777" };
    return '<span class="type-pip" style="background:' + meta.hex + '" title="' + escapeHtml(name) + '"></span>';
  }

  // Sprites come from one packed atlas image (see scripts/build_sprite_atlas.ps1):
  // the artifact CSP blocks remote images, and ~1900 separate base64 images would
  // both bloat the page and cost ~1900 image decodes. One atlas + CSS positioning
  // keeps it to a single decode.
  function spriteImgHtml(x, speciesName, sizePx) {
    sizePx = sizePx || 40;
    var slot = SPRITE_INDEX.index ? SPRITE_INDEX.index[String(x)] : undefined;
    if (slot !== undefined) {
      var col = slot % SPRITE_INDEX.cols;
      var row = Math.floor(slot / SPRITE_INDEX.cols);
      return '<span class="spr" style="width:' + sizePx + 'px;height:' + sizePx + 'px;' +
        'background-size:' + (SPRITE_INDEX.cols * sizePx) + 'px ' + (SPRITE_INDEX.rows * sizePx) + 'px;' +
        'background-position:' + (-col * sizePx) + 'px ' + (-row * sizePx) + 'px;" ' +
        'role="img" aria-label="' + escapeHtml(speciesName || "") + '"></span>';
    }
    var letter = (speciesName || "?").charAt(0).toUpperCase();
    return '<span class="sprite-fallback" style="width:' + sizePx + 'px;height:' + sizePx + 'px;font-size:' + Math.round(sizePx * 0.45) + 'px;">' + escapeHtml(letter) + '</span>';
  }

  function prettify(str) {
    if (str === undefined || str === null) return "";
    if (typeof str === "number") return String(str);
    var s = String(str).replace(/^(ITEM_|MOVE_|SPECIES_|MON_)/, "");
    s = s.replace(/_/g, " ").toLowerCase();
    return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------------- state ----------------
  var state = {
    query: "",
    typeFilter: new Set(),
    sort: "dex",
    selected: null,
    team: [],
    box: [],
    settings: { difficulty: "ace", milestone: 0 },
    savedTeams: []
  };

  // ---------------- persistence ----------------
  // Everything is stored under ONE versioned key so the whole save can be
  // migrated, exported and imported as a unit. Schema:
  //   { v: 2, team: [sname], box: [sname], savedTeams: [{name, team:[sname]}],
  //     settings: {difficulty, milestone}, dataVersion, savedAt }
  var STORE_KEY = "er_terminal_save";
  var SCHEMA_VERSION = 2;
  var LEGACY_KEYS = {
    team: "er_terminal_team",
    box: "er_terminal_box",
    savedTeams: "er_terminal_saved_teams",
    settings: "er_terminal_settings"
  };

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function applySave(save) {
    if (!save || typeof save !== "object") return;
    state.team = snamesToXs(save.team).slice(0, 6);
    state.box = snamesToXs(save.box);
    if (Array.isArray(save.savedTeams)) {
      state.savedTeams = save.savedTeams.filter(function (t) {
        return t && Array.isArray(t.team);
      }).slice(0, 3).map(function (t) {
        return { name: String(t.name || ""), team: t.team.filter(function (s) { return typeof s === "string"; }) };
      });
    }
    if (save.settings && typeof save.settings === "object") {
      if (save.settings.difficulty) state.settings.difficulty = save.settings.difficulty;
      if (typeof save.settings.milestone === "number") state.settings.milestone = save.settings.milestone;
    }
  }

  function buildSave() {
    return {
      v: SCHEMA_VERSION,
      dataVersion: DATA.meta ? DATA.meta.version : null,
      savedAt: new Date().toISOString(),
      team: xsToSnames(state.team),
      box: xsToSnames(state.box),
      savedTeams: state.savedTeams,
      settings: state.settings
    };
  }

  function persist() { lsSet(STORE_KEY, JSON.stringify(buildSave())); }
  // Kept as separate names so call sites still read clearly; all write the
  // one versioned blob.
  function saveTeam() { persist(); }
  function saveBox() { persist(); }
  function saveSettings() { persist(); }
  function saveSavedTeams() { persist(); }

  // v1 stored raw array indices (`x`). Those are only meaningful against the
  // data build that wrote them, so translate them to snames NOW, while this
  // build still matches, and drop the old keys.
  function migrateLegacy() {
    var hadAny = false;
    var legacy = { team: [], box: [], savedTeams: [], settings: null };
    try {
      var t = JSON.parse(lsGet(LEGACY_KEYS.team) || "null");
      if (Array.isArray(t)) { legacy.team = xsToSnames(t); hadAny = true; }
      var b = JSON.parse(lsGet(LEGACY_KEYS.box) || "null");
      if (Array.isArray(b)) { legacy.box = xsToSnames(b); hadAny = true; }
      var st = JSON.parse(lsGet(LEGACY_KEYS.savedTeams) || "null");
      if (Array.isArray(st)) {
        legacy.savedTeams = st.filter(function (x) { return x && Array.isArray(x.team); })
          .map(function (x) { return { name: x.name, team: xsToSnames(x.team) }; });
        hadAny = true;
      }
      var se = JSON.parse(lsGet(LEGACY_KEYS.settings) || "null");
      if (se && typeof se === "object") { legacy.settings = se; hadAny = true; }
    } catch (e) { /* corrupt legacy data: fall through to a clean start */ }
    if (!hadAny) return null;
    return { v: SCHEMA_VERSION, team: legacy.team, box: legacy.box, savedTeams: legacy.savedTeams, settings: legacy.settings };
  }

  (function loadSave() {
    var raw = lsGet(STORE_KEY);
    if (raw) {
      try { applySave(JSON.parse(raw)); return; } catch (e) { /* fall through */ }
    }
    var migrated = migrateLegacy();
    if (migrated) {
      applySave(migrated);
      persist();
      Object.keys(LEGACY_KEYS).forEach(function (k) { lsDel(LEGACY_KEYS[k]); });
      return;
    }
    // First visit on this browser: seed with Claude's latest recommendation
    // instead of starting empty, and persist so it only happens once.
    applySave({ savedTeams: SAVEDTEAMS_SEED.slice(0, 3) });
    persist();
  })();

  var DIFF_TO_BOSSKEY = { easy: "party", ace: "insane", elite: "hell" };

  function getCurrentCap() {
    if (!LEVELCAPS || !LEVELCAPS.rows[state.settings.milestone]) return null;
    return LEVELCAPS.rows[state.settings.milestone][state.settings.difficulty];
  }

  // ---------------- tabs ----------------
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      document.getElementById("view-" + btn.dataset.tab).classList.add("active");
      if (btn.dataset.tab === "team") renderTeam();
      if (btn.dataset.tab === "box") renderBox();
      if (btn.dataset.tab === "bosses") initBosses();
      if (btn.dataset.tab === "progress") initProgress();
      if (btn.dataset.tab === "types") renderTypeMatrix();
    });
  });

  // ---------------- type filter panel ----------------
  var typeFilterPanel = document.getElementById("type-filter-panel");
  USABLE_TYPES.forEach(function (t) {
    var label = document.createElement("label");
    label.className = "type-check";
    label.innerHTML = '<input type="checkbox" value="' + escapeHtml(t) + '">' + escapeHtml(t);
    var meta = TYPE_META[t];
    label.querySelector("input").addEventListener("change", function (e) {
      if (e.target.checked) { state.typeFilter.add(t); label.classList.add("checked"); label.style.background = meta.hex; label.style.color = meta.dark ? "#1c1b17" : "#fff9f2"; label.style.borderColor = meta.hex; }
      else { state.typeFilter.delete(t); label.classList.remove("checked"); label.style.background = ""; label.style.color = ""; label.style.borderColor = ""; }
      renderList();
    });
    typeFilterPanel.appendChild(label);
  });
  document.getElementById("type-filter-toggle").addEventListener("click", function () {
    typeFilterPanel.classList.toggle("hidden");
    this.classList.toggle("active");
  });

  document.getElementById("search-input").addEventListener("input", function (e) {
    state.query = e.target.value.trim().toLowerCase();
    // Typing means "find me something else": surface the results again. On
    // desktop both panes are visible anyway, so this is a no-op there.
    document.getElementById("dex-shell").classList.remove("show-detail");
    renderList();
  });
  document.getElementById("sort-select").addEventListener("change", function (e) {
    state.sort = e.target.value;
    renderList();
  });

  // ---------------- list rendering ----------------
  var STAT_IDX = { hp: 0, atk: 1, def: 2, spa: 3, spd: 4, spe: 5 };

  function bst(sp) { return sp.b.reduce(function (a, b) { return a + b; }, 0); }

  function getFiltered() {
    var list = SPECIES.filter(function (sp) {
      if (state.query && sp.n.toLowerCase().indexOf(state.query) === -1) return false;
      if (state.typeFilter.size > 0) {
        var names = speciesTypeNames(sp);
        var ok = false;
        state.typeFilter.forEach(function (t) { if (names.indexOf(t) !== -1) ok = true; });
        if (!ok) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      if (state.sort === "name") return a.n.localeCompare(b.n);
      if (state.sort === "bst") return bst(b) - bst(a);
      if (state.sort in STAT_IDX) return b.b[STAT_IDX[state.sort]] - a.b[STAT_IDX[state.sort]];
      return (a.i || 9999) - (b.i || 9999) || a.x - b.x;
    });
    return list;
  }

  function renderList() {
    var list = getFiltered();
    var ul = document.getElementById("species-list");
    if (list.length === 0) {
      ul.innerHTML = '<li class="no-results">Nenhum Pokémon encontrado.</li>';
      return;
    }
    var teamFull = state.team.length >= 6;
    var html = list.map(function (sp) {
      var names = speciesTypeNames(sp);
      var pips = names.map(typePip).join("");
      var sel = state.selected === sp.x ? " selected" : "";
      var inTeam = state.team.indexOf(sp.x) !== -1;
      // Same three states syncRowAddButtons() maintains: in team / team full (swap) / free slot.
      var addTitle = inTeam ? "Já está no time" : teamFull ? "Trocar por um do time" : "Adicionar ao time";
      var addLabel = inTeam ? "✓" : teamFull ? "⇄" : "+";
      return '<li class="species-row' + sel + '" data-x="' + sp.x + '">' +
        '<span class="dexno mono">#' + String(sp.i || 0).padStart(3, "0") + '</span>' +
        spriteImgHtml(sp.x, sp.n, 28) +
        '<span class="sname">' + escapeHtml(sp.n) + '</span>' +
        '<span class="pips">' + pips + '</span>' +
        '<button class="row-add-btn' + (!inTeam && teamFull ? ' is-swap' : '') + '" data-add="' + sp.x + '" type="button" title="' + addTitle + '" aria-label="' + addTitle + '"' +
          (inTeam ? ' disabled' : '') + '>' + addLabel + '</button></li>';
    }).join("");
    ul.innerHTML = html;
    ul.querySelectorAll(".species-row").forEach(function (row) {
      row.addEventListener("click", function (e) {
        // the quick-add button lives inside the row; don't also open the detail
        if (e.target.closest(".row-add-btn")) return;
        selectSpecies(parseInt(row.dataset.x, 10));
      });
    });
    ul.querySelectorAll(".row-add-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var x = parseInt(btn.dataset.add, 10);
        if (state.team.indexOf(x) !== -1) return;
        if (state.team.length >= 6) { openSwapModal(x); return; }
        if (rosterMove(x, null)) { // updateTeamBadge inside re-syncs the + / ✓ buttons
          flashToast(getSpeciesByX(x).n + " adicionado ao time (" + state.team.length + "/6)");
        }
      });
    });
  }

  // Keeps the Dex list's quick-add buttons truthful after the team changes
  // somewhere else (detail view, box, swap) without re-rendering 1900 rows.
  // With a full team the button turns into a swap affordance rather than going dead.
  function syncRowAddButtons() {
    var teamFull = state.team.length >= 6;
    document.querySelectorAll(".row-add-btn").forEach(function (btn) {
      var x = parseInt(btn.dataset.add, 10);
      var inTeam = state.team.indexOf(x) !== -1;
      btn.textContent = inTeam ? "✓" : teamFull ? "⇄" : "+";
      btn.disabled = inTeam;
      btn.classList.toggle("is-swap", !inTeam && teamFull);
      btn.title = inTeam ? "Já está no time" : teamFull ? "Trocar por um do time" : "Adicionar ao time";
    });
  }

  // ---- Dex -> team swap modal ----
  var swapModalX = null;

  function openSwapModal(x) {
    var sp = getSpeciesByX(x);
    if (!sp) return;
    swapModalX = x;
    document.getElementById("swap-modal-title").textContent = "Colocar " + sp.n + " no time";
    var list = document.getElementById("swap-modal-list");
    list.innerHTML = state.team.map(getSpeciesByX).filter(Boolean).map(function (m) {
      return '<button class="swap-pick" data-out="' + m.x + '" type="button">' +
        spriteImgHtml(m.x, m.n, 30) +
        '<span class="swap-pick-name">' + escapeHtml(m.n) + '</span></button>';
    }).join("");
    list.querySelectorAll(".swap-pick").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var outX = parseInt(btn.dataset.out, 10);
        var outSp = getSpeciesByX(outX);
        if (!rosterMove(swapModalX, outX)) return;
        closeSwapModal();
        // keep an open detail view in sync with what just happened
        if (state.selected === sp.x) selectSpecies(sp.x);
        flashToast(sp.n + " entrou; " + outSp.n + " foi para a caixa");
      });
    });
    document.getElementById("swap-modal").hidden = false;
  }

  function closeSwapModal() {
    document.getElementById("swap-modal").hidden = true;
    swapModalX = null;
  }

  document.getElementById("swap-modal-close").addEventListener("click", closeSwapModal);
  document.getElementById("swap-modal").addEventListener("click", function (e) {
    if (e.target.id === "swap-modal") closeSwapModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !document.getElementById("swap-modal").hidden) closeSwapModal();
  });

  var toastTimer = null;
  function flashToast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  // ---------------- detail rendering ----------------
  function abilityCard(id, kindLabel, kindClass) {
    var a = ABILITIES[id];
    if (!a) return "";
    var desc = ABILITY_PT[String(id)] || a[1];
    return '<div class="abi-card"><span class="abi-kind ' + kindClass + '">' + kindLabel + '</span>' +
      '<div class="abi-name">' + escapeHtml(a[0]) + '</div>' +
      '<div class="abi-desc">' + escapeHtml(desc) + '</div></div>';
  }

  function evoConditionText(ev) {
    var kind = EVOKINDS[ev[0]] || "";
    var rs = ev[1];
    if (kind.indexOf("MEGA") !== -1) return "Mega Evolução &middot; " + prettify(rs);
    if (kind.indexOf("PRIMAL") !== -1) return "Reversão Primal &middot; " + prettify(rs);
    if (typeof rs === "number") {
      var suffix = kind.indexOf("MALE") !== -1 ? " (♂)" : kind.indexOf("FEMALE") !== -1 ? " (♀)" : "";
      return "Nível " + rs + suffix;
    }
    return prettify(rs);
  }

  function renderMovesTable(pairs, title, emptyMsg) {
    if (!pairs.length) return '<div class="card"><h3>' + title + '</h3><p style="color:var(--text-dim);font-size:12.5px;">' + emptyMsg + '</p></div>';
    var cap = title.indexOf("Nível") !== -1 ? getCurrentCap() : null;
    var rows = pairs.map(function (row, idx) {
      var lv = row[0], moveId = row[1];
      var mv = MOVES[moveId];
      if (!mv) return "";
      var typeName = TYPES[mv[1]];
      var meta = TYPE_META[typeName] || { hex: "#777", dark: false };
      var splitName = DATA.splits[mv[2]] || "";
      var id = "mv_" + title.replace(/\s/g, "") + "_" + idx;
      var aboveCap = cap !== null && cap !== undefined && lv > cap;
      var main = '<tr class="move-row' + (aboveCap ? " above-cap" : "") + '" data-target="' + id + '">' +
        '<td class="mono">' + (lv !== undefined && lv !== null && title.indexOf("Nível") !== -1 ? lv + (aboveCap ? ' <span class="cap-tag" title="Acima do level cap atual (' + cap + ')">acima</span>' : "") : "&mdash;") + '</td>' +
        '<td>' + escapeHtml(mv[0]) + '</td>' +
        '<td><span class="move-type-tag" style="background:' + meta.hex + ';color:' + (meta.dark ? "#1c1b17" : "#fff9f2") + '">' + typeName + '</span></td>' +
        '<td class="mono">' + (mv[3] || "&mdash;") + '</td>' +
        '<td class="mono">' + (mv[4] ? mv[4] + "%" : "&mdash;") + '</td>' +
        '<td class="mono">' + (mv[5] || "&mdash;") + '</td></tr>';
      var mvDesc = MOVE_PT[String(moveId)] || mv[6] || "Sem descrição.";
      var detail = '<tr class="move-detail-row hidden" id="' + id + '"><td colspan="6">' + escapeHtml(mvDesc) + '</td></tr>';
      return main + detail;
    }).join("");
    var showLv = title.indexOf("Nível") !== -1;
    return '<div class="card"><h3>' + title + '</h3><div class="scroll-x"><table class="moves-table"><thead><tr>' +
      '<th>' + (showLv ? "Nv." : "&nbsp;") + '</th><th>Golpe</th><th>Tipo</th><th>Pwr</th><th>Acc</th><th>PP</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function selectSpecies(x) {
    state.selected = x;
    var sp = getSpeciesByX(x);
    if (!sp) return;
    document.getElementById("dex-shell").classList.add("show-detail");
    document.querySelectorAll(".species-row").forEach(function (r) {
      r.classList.toggle("selected", parseInt(r.dataset.x, 10) === x);
    });

    var names = speciesTypeNames(sp);
    var statLabels = ["HP", "Ataque", "Defesa", "Sp. Atq", "Sp. Def", "Velocidade"];
    var statsHtml = sp.b.map(function (v, i) {
      var pct = Math.max(2, Math.min(100, (v / 255) * 100));
      return '<div class="stat-row"><span class="stat-label">' + statLabels[i] + '</span><span class="stat-val mono">' + v + '</span>' +
        '<div class="stat-bar-track"><div class="stat-bar-fill" style="width:' + pct + '%"></div></div></div>';
    }).join("");

    var abiHtml = sp.ab.map(function (id) { return abilityCard(id, "Escolhível", "choosable"); }).join("");
    var innHtml = sp.inn.map(function (id) { return abilityCard(id, "Innate", "innate"); }).join("");

    var evoHtml = "";
    if (sp.ev.length) {
      var nodes = ['<div class="evo-node">' + escapeHtml(sp.n) + '</div>'];
      sp.ev.forEach(function (ev) {
        var target = getSpeciesByX(ev[2]);
        nodes.push('<span class="evo-arrow">&rarr;<small>' + evoConditionText(ev) + '</small></span>');
        nodes.push('<div class="evo-node">' + escapeHtml(target ? target.n : "?") + '</div>');
      });
      evoHtml = '<div class="card"><h3>Linha evolutiva</h3><div class="evo-chain">' + nodes.join("") + '</div></div>';
    }

    var lm = sp.lm.slice().sort(function (a, b) { return a[0] - b[0]; });
    var lmHtml = renderMovesTable(lm, "Golpes por Nível", "Sem golpes por nível registrados.");

    var tuPairs = sp.tu.map(function (id) { return [null, id]; });
    var tuHtml = tuPairs.length ? renderMovesTable(tuPairs, "Golpes de Tutor / TM", "Sem golpes de tutor registrados.") : "";

    var inTeam = state.team.indexOf(x) !== -1;
    var teamFull = state.team.length >= 6;
    var inBox = state.box.indexOf(x) !== -1;

    document.getElementById("species-detail").innerHTML =
      '<button class="back-btn" id="back-to-list">&larr; Voltar para a lista</button>' +
      // 48 matches the atlas cell size, so the largest sprite in the UI is shown
      // 1:1 and never upscaled.
      '<div class="detail-head"><div class="ts-head">' + spriteImgHtml(sp.x, sp.n, 48) + '<div class="detail-titles">' +
        '<h2>' + escapeHtml(sp.n) + '</h2>' +
        '<div class="detail-dexno mono">#' + String(sp.i || 0).padStart(3, "0") + '</div>' +
        '<div class="detail-sname mono">' + escapeHtml(sp.sname) + '</div>' +
      '</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="add-team-btn" id="add-team-btn" ' + (inTeam ? "disabled" : "") + '>' +
          (inTeam ? "No time" : teamFull ? "⇄ Trocar com o time" : "+ Adicionar ao time") + '</button>' +
        '<button class="add-team-btn" id="add-box-btn" style="background:var(--surface-3);color:var(--text);" ' + (inBox ? "disabled" : "") + '>' +
          (inBox ? "Na caixa" : "+ Adicionar à caixa") + '</button>' +
      '</div></div>' +
      '<div class="detail-types">' + names.map(function (n) { return typePill(n); }).join("") + '</div>' +
      (sp.d ? '<p class="flavor">' + escapeHtml(sp.d) + '</p>' : "") +
      '<div class="card"><h3>Stats base</h3>' + statsHtml +
        '<div class="stat-total">Total (BST) <b class="mono">' + bst(sp) + '</b></div></div>' +
      '<div class="card"><h3>Habilidades &amp; Innates</h3><div class="abi-grid">' + abiHtml + innHtml + '</div>' +
        '<p style="color:var(--text-dim);font-size:11.5px;margin-top:10px;">1 habilidade escolhível fica ativa por vez, como na série principal. As innates ficam sempre ativas, além da habilidade escolhida.</p></div>' +
      evoHtml + lmHtml + tuHtml;

    var backBtn = document.getElementById("back-to-list");
    if (backBtn) backBtn.addEventListener("click", function () {
      document.getElementById("dex-shell").classList.remove("show-detail");
    });

    var addBtn = document.getElementById("add-team-btn");
    if (addBtn && !inTeam) {
      addBtn.addEventListener("click", function () {
        if (state.team.length >= 6) { openSwapModal(x); return; }
        if (rosterMove(x, null)) selectSpecies(x);
      });
    }

    var addBoxBtn = document.getElementById("add-box-btn");
    if (addBoxBtn && !inBox) {
      addBoxBtn.addEventListener("click", function () {
        state.box.push(x);
        saveBox();
        updateBoxBadge();
        selectSpecies(x);
      });
    }

    document.querySelectorAll(".move-row").forEach(function (row) {
      row.addEventListener("click", function () {
        var target = document.getElementById(row.dataset.target);
        if (target) target.classList.toggle("hidden");
      });
    });
  }

  // ---------------- team view ----------------
  function updateTeamBadge() {
    document.getElementById("team-count-badge").textContent = state.team.length + "/6";
    syncRowAddButtons();
  }

  // ---------------- box view ----------------
  function updateBoxBadge() {
    document.getElementById("box-count-badge").textContent = state.box.length;
  }

  function renderBox() {
    var grid = document.getElementById("box-grid");
    var members = state.box.map(getSpeciesByX).filter(Boolean);
    if (!members.length) {
      grid.innerHTML = '<p class="empty-note">Caixa vazia — abra um Pokémon na aba Dex e clique em "+ Adicionar à caixa".</p>';
    } else {
      var teamFull = state.team.length >= 6;
      grid.innerHTML = members.map(function (sp) {
        var names = speciesTypeNames(sp);
        var title = teamFull ? "Time cheio — use ⇄ Trocar na aba Meu Time" : "Mandar para o time";
        return '<div class="box-chip">' + spriteImgHtml(sp.x, sp.n, 26) +
          '<span>' + escapeHtml(sp.n) + '</span>' +
          '<span class="box-chip-pips">' + names.map(typePip).join("") + '</span>' +
          '<button class="box-to-team" data-x="' + sp.x + '" type="button" title="' + title + '" aria-label="' + title + '"' +
            (teamFull ? ' disabled' : '') + '>&rarr;&nbsp;time</button>' +
          '<button class="remove-btn" data-x="' + sp.x + '" title="remover da caixa">&times;</button></div>';
      }).join("");
      grid.querySelectorAll(".remove-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var x = parseInt(btn.dataset.x, 10);
          state.box = state.box.filter(function (v) { return v !== x; });
          saveBox();
          updateBoxBadge();
          renderBox();
        });
      });
      grid.querySelectorAll(".box-to-team").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var x = parseInt(btn.dataset.x, 10);
          var sp = getSpeciesByX(x);
          if (rosterMove(x, null)) {
            flashToast(sp.n + " foi para o time (" + state.team.length + "/6)");
            renderBox();
          }
        });
      });
    }
    updateBoxBadge();
    renderClaudeExportBox(members);
  }

  function settingsSummaryText() {
    var cap = getCurrentCap();
    var milestone = LEVELCAPS && LEVELCAPS.rows[state.settings.milestone] ? LEVELCAPS.rows[state.settings.milestone].milestone : "?";
    var diffLabel = { easy: "Easy", ace: "Ace", elite: "Elite" }[state.settings.difficulty] || state.settings.difficulty;
    return "Dificuldade " + diffLabel + ", progresso " + milestone + ", level cap atual " + (cap === null ? "sem limite" : cap) + ".";
  }

  function renderClaudeExportBox(members) {
    var input = document.getElementById("claude-export-box-text");
    if (!members.length) {
      input.value = "Minha caixa no Elite Redux (build 2.65beta) ainda esta vazia. " + settingsSummaryText();
    } else {
      var names = members.map(function (sp) { return sp.n; }).join(", ");
      input.value = "Minha caixa no Elite Redux (build 2.65beta) (" + members.length + "): " + names + ". " + settingsSummaryText();
    }
    document.getElementById("claude-export-box-status").textContent = "";
  }

  function renderClaudeExport(members) {
    var input = document.getElementById("claude-export-text");
    var status = document.getElementById("claude-export-status");
    if (!members.length) {
      input.value = "Meu time no Elite Redux (build 2.65beta) ainda esta vazio. " + settingsSummaryText();
    } else {
      var names = members.map(function (sp) { return sp.n; }).join(", ");
      input.value = "Meu time no Elite Redux (build 2.65beta): " + names + ". " + settingsSummaryText();
    }
    status.textContent = "";
  }

  // Single clipboard path for the whole app. `srcEl` may be a field (its value
  // is copied and left selected, so the manual Ctrl+C fallback works) or null
  // when copying a plain string.
  function copyText(text, statusEl, okMsg, srcEl) {
    var done = function (msg) { if (statusEl) statusEl.textContent = msg; };
    var fallbackEl = srcEl;
    if (!fallbackEl) {
      fallbackEl = document.createElement("textarea");
      fallbackEl.value = text;
      fallbackEl.style.position = "fixed";
      fallbackEl.style.opacity = "0";
      document.body.appendChild(fallbackEl);
    }
    fallbackEl.focus();
    fallbackEl.select();
    if (fallbackEl.setSelectionRange) fallbackEl.setSelectionRange(0, String(text).length);

    var cleanup = function () { if (!srcEl && fallbackEl.parentNode) document.body.removeChild(fallbackEl); };
    var fallback = function () {
      try { document.execCommand("copy"); done(okMsg); }
      catch (e) { done("Não consegui copiar automaticamente — o texto já está selecionado, use Ctrl+C."); }
      cleanup();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(okMsg); cleanup(); }).catch(fallback);
    } else {
      fallback();
    }
  }

  function wireCopyButton(btnId, inputId, statusId) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var input = document.getElementById(inputId);
      copyText(input.value, document.getElementById(statusId), "Copiado! Cole na conversa com o Claude.", input);
    });
  }

  wireCopyButton("claude-export-copy", "claude-export-text", "claude-export-status");
  wireCopyButton("claude-export-box-copy", "claude-export-box-text", "claude-export-box-status");

  // ---- Smogon / Pokemon Showdown set format ----
  // builds.json keeps human-readable notes in parentheses ("Tough Claws (única
  // opção)"); Showdown wants the bare value, so strip them here rather than
  // duplicating every field in the data file.
  function stripNote(s) {
    return String(s || "").replace(/\s*\(.*?\)\s*$/, "").trim();
  }

  // Showdown writes alternate forms hyphenated: "Charizard-Mega-X".
  function showdownName(name) {
    return String(name || "").trim().replace(/\s+/g, "-");
  }

  function showdownSet(sp, build) {
    if (!build) return "";
    var lines = [];
    var item = stripNote(build.item);
    lines.push(showdownName(sp.n) + (item ? " @ " + item : ""));
    var ability = stripNote(build.ability);
    if (ability) lines.push("Ability: " + ability);
    if (build.evs) lines.push("EVs: " + build.evs);
    var nature = stripNote(build.nature);
    if (nature) lines.push(nature + " Nature");
    (build.moves || []).forEach(function (mv) { lines.push("- " + mv); });
    return lines.join("\n");
  }

  function showdownTeam() {
    return state.team.map(getSpeciesByX).filter(Boolean).map(function (sp) {
      var b = BUILDS[sp.sname];
      return b ? showdownSet(sp, b) : showdownName(sp.n) + "\n(sem build definida)";
    }).join("\n\n");
  }

  function renderTeam() {
    var slotsEl = document.getElementById("team-slots");
    var members = state.team.map(getSpeciesByX).filter(Boolean);
    var slots = [];
    for (var i = 0; i < 6; i++) {
      if (members[i]) {
        var sp = members[i];
        var names = speciesTypeNames(sp);
        var abiNames = sp.ab.map(function (id) { return ABILITIES[id][0]; }).join(", ");
        var innNames = sp.inn.map(function (id) { return ABILITIES[id][0]; }).join(", ");
        var build = BUILDS[sp.sname];
        var buildHtml = build ? (
          '<div class="ts-build">' +
            '<div class="ts-build-head"><span class="ts-build-label">Build (formato Showdown)</span>' +
              '<button class="ts-build-copy" data-x="' + sp.x + '" type="button" title="Copiar este set">copiar</button></div>' +
            '<pre class="showdown-block">' + escapeHtml(showdownSet(sp, build)) + '</pre>' +
            (build.note ? '<div class="ts-build-note">' + escapeHtml(build.note) + '</div>' : '') +
          '</div>'
        ) : (
          '<div class="ts-build ts-build-empty">Sem build salva ainda — peça uma ao Claude na conversa.</div>'
        );
        var swapOpen = teamSwapIdx === i;
        slots.push('<div class="team-slot' + (swapOpen ? ' swapping' : '') + '"><div>' +
          '<div class="ts-head">' + spriteImgHtml(sp.x, sp.n, 40) +
          '<div><div class="ts-name">' + escapeHtml(sp.n) + '</div>' +
          '<div class="ts-types">' + names.map(function (n) { return typePill(n, true); }).join("") + '</div></div></div>' +
          '<div class="ts-abis"><b>Hab.:</b> ' + escapeHtml(abiNames) + '<br><b>Innate:</b> ' + escapeHtml(innNames) + '</div>' +
          buildHtml +
          (swapOpen ? swapPanelHtml(i, sp) : "") +
          '</div><div class="ts-actions">' +
            '<button class="ts-swap-btn" data-idx="' + i + '" type="button">' + (swapOpen ? 'Cancelar' : '⇄ Trocar') + '</button>' +
            '<button class="remove-btn" data-x="' + sp.x + '">remover</button>' +
          '</div></div>');
      }
    }
    // One compact call-to-action instead of up to six identical empty boxes —
    // on a phone those pushed everything useful ~1300px down the page.
    if (members.length < 6) {
      var free = 6 - members.length;
      slots.push('<div class="team-slot empty">' +
        '<div>' + free + ' ' + (free === 1 ? 'vaga livre' : 'vagas livres') + '</div>' +
        '<button class="ts-goto-dex" id="ts-goto-dex" type="button">+ Adicionar da Dex</button>' +
        (state.box.length ? '<button class="ts-goto-dex" id="ts-goto-box" type="button">+ Puxar da Caixa</button>' : '') +
        '</div>');
    }
    slotsEl.innerHTML = slots.join("");

    slotsEl.querySelectorAll(".remove-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var x = parseInt(btn.dataset.x, 10);
        state.team = state.team.filter(function (v) { return v !== x; });
        teamSwapIdx = null;
        saveTeam();
        updateTeamBadge();
        renderTeam();
      });
    });
    slotsEl.querySelectorAll(".ts-swap-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.dataset.idx, 10);
        teamSwapIdx = (teamSwapIdx === idx) ? null : idx;
        renderTeam();
      });
    });
    slotsEl.querySelectorAll(".ts-build-copy").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var sp = getSpeciesByX(parseInt(btn.dataset.x, 10));
        copyText(showdownSet(sp, BUILDS[sp.sname]), null, "");
        flashToast("Set do " + sp.n + " copiado (formato Showdown)");
      });
    });
    slotsEl.querySelectorAll(".swap-pick").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var slotIdx = parseInt(btn.dataset.idx, 10);
        var outX = state.team[slotIdx];
        if (rosterMove(parseInt(btn.dataset.x, 10), outX)) renderTeam();
      });
    });
    var gotoDex = document.getElementById("ts-goto-dex");
    if (gotoDex) gotoDex.addEventListener("click", function () {
      document.querySelector('.tab-btn[data-tab="dex"]').click();
      document.getElementById("search-input").focus();
    });
    var gotoBox = document.getElementById("ts-goto-box");
    if (gotoBox) gotoBox.addEventListener("click", function () {
      document.querySelector('.tab-btn[data-tab="box"]').click();
    });

    var sdBlock = document.getElementById("showdown-team");
    var sdText = showdownTeam();
    sdBlock.textContent = sdText || "Time vazio — adicione Pokémon na aba Dex.";
    document.getElementById("showdown-copy").disabled = !sdText;
    document.getElementById("showdown-status").textContent = "";

    updateTeamBadge();
    renderClaudeExport(members);
    renderTeamAnalysis(members);
    renderSavedTeams();
  }

  document.getElementById("showdown-copy").addEventListener("click", function () {
    copyText(showdownTeam(), document.getElementById("showdown-status"), "Copiado! Cole no teambuilder do Showdown.");
  });

  // ---- moving a save between devices ----
  // Storage is per-browser, so phone and desktop are separate. The save is
  // small and sname-keyed, so a plain text blob transfers cleanly.
  var transferStatus = document.getElementById("transfer-status");

  document.getElementById("transfer-copy").addEventListener("click", function () {
    copyText(JSON.stringify(buildSave()), transferStatus, "Código copiado. Cole no outro aparelho e toque em Carregar.");
  });

  document.getElementById("transfer-apply").addEventListener("click", function () {
    var raw = document.getElementById("transfer-import").value.trim();
    if (!raw) { transferStatus.textContent = "Cole o código primeiro."; return; }
    var parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) { transferStatus.textContent = "Código inválido — copie de novo no outro aparelho."; return; }
    if (!parsed || typeof parsed !== "object" || !("team" in parsed || "box" in parsed)) {
      transferStatus.textContent = "Esse código não parece um save do Terminal.";
      return;
    }
    applySave(parsed);
    persist();
    document.getElementById("transfer-import").value = "";
    renderList();
    renderTeam();
    renderBox();
    renderCapBadge();
    if (progressInited) initProgress();
    var n = state.team.length;
    transferStatus.textContent = "Save carregado: " + n + " no time, " + state.box.length + " na caixa.";
    flashToast("Save carregado deste código");
  });

  // The download half needs the host's save capability; hide the button where
  // it isn't available instead of offering a control that silently does nothing.
  if (window.claude && typeof window.claude.use === "function") {
    window.claude.use("downloads").then(function (downloads) {
      if (!downloads) return;
      var btn = document.getElementById("transfer-download");
      btn.hidden = false;
      btn.addEventListener("click", function () {
        downloads.save({
          filename: "elite-redux-terminal-save.json",
          data: JSON.stringify(buildSave(), null, 2)
        }).then(function () {
          transferStatus.textContent = "Arquivo salvo.";
        }).catch(function (err) {
          if (err && err.code === "declined") return;
          transferStatus.textContent = "Não consegui salvar o arquivo — use o código de texto.";
        });
      });
    }).catch(function () { /* capability unavailable: text transfer still works */ });
  }

  // ---- team <-> box swapping ----
  var teamSwapIdx = null;

  function swapPanelHtml(slotIdx, currentSp) {
    var boxMembers = state.box.map(getSpeciesByX).filter(Boolean).filter(function (sp) {
      return state.team.indexOf(sp.x) === -1;
    });
    if (!boxMembers.length) {
      return '<div class="swap-panel"><div class="swap-empty">Nenhum Pokémon disponível na caixa. Adicione capturas na aba Caixa primeiro.</div></div>';
    }
    return '<div class="swap-panel">' +
      '<div class="swap-title">Trocar ' + escapeHtml(currentSp.n) + ' por:</div>' +
      '<div class="swap-list">' + boxMembers.map(function (sp) {
        return '<button class="swap-pick" data-idx="' + slotIdx + '" data-x="' + sp.x + '" type="button" title="' + escapeHtml(sp.n) + '">' +
          spriteImgHtml(sp.x, sp.n, 30) +
          '<span class="swap-pick-name">' + escapeHtml(sp.n) + '</span></button>';
      }).join("") + '</div></div>';
  }

  // The single roster mutation used by every entry point (team card, box chip,
  // dex row/detail). One rule set, so the three UIs can never drift apart:
  //   - the incoming Pokemon always leaves the box
  //   - whoever it displaces always lands in the box, like benching in-game
  //   - a Pokemon is never in the team twice
  // `outX` null means "take a free slot"; returns false if the move is invalid.
  function rosterMove(inX, outX) {
    if (getSpeciesByX(inX) === null) return false;
    if (state.team.indexOf(inX) !== -1) return false;

    if (outX === null || outX === undefined) {
      if (state.team.length >= 6) return false;
      state.team.push(inX);
    } else {
      var slot = state.team.indexOf(outX);
      if (slot === -1) return false;
      state.team[slot] = inX;
      if (state.box.indexOf(outX) === -1) state.box.push(outX);
    }
    state.box = state.box.filter(function (v) { return v !== inX; });

    teamSwapIdx = null;
    persist();
    updateTeamBadge();
    updateBoxBadge();
    return true;
  }

  var savedTeamEditingIdx = null;

  function teamsMatch(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    var sa = a.slice().sort();
    var sb = b.slice().sort();
    return sa.every(function (v, i) { return v === sb[i]; });
  }

  function renderSavedTeams() {
    var grid = document.getElementById("saved-teams-grid");
    var cards = [];
    for (var i = 0; i < 3; i++) {
      var slot = state.savedTeams[i];
      if (slot) {
        var slotXs = snamesToXs(slot.team);
        var members = slotXs.map(getSpeciesByX).filter(Boolean);
        var isActive = teamsMatch(slotXs, state.team);
        var nameHtml = savedTeamEditingIdx === i
          ? '<input type="text" class="stc-rename-input" id="stc-rename-input" value="' + escapeHtml(slot.name || ("Time " + (i + 1))) + '" maxlength="40">'
          : '<div class="stc-name">' + escapeHtml(slot.name || ("Time " + (i + 1))) + (isActive ? ' <span class="stc-active-badge">● ativo</span>' : '') + '</div>';
        cards.push('<div class="saved-team-card">' +
          nameHtml +
          '<div class="stc-sprites">' + members.map(function (sp) { return spriteImgHtml(sp.x, sp.n, 32); }).join("") + '</div>' +
          '<div class="stc-actions">' +
            (savedTeamEditingIdx === i
              ? '<button class="stc-rename-save" data-idx="' + i + '" type="button">Salvar nome</button>'
              : '<button class="stc-load" data-idx="' + i + '" type="button">Carregar</button>' +
                '<button class="stc-rename" data-idx="' + i + '" type="button">Renomear</button>' +
                '<button class="stc-delete" data-idx="' + i + '" type="button">Excluir</button>') +
          '</div></div>');
      } else {
        cards.push('<div class="saved-team-card empty">Slot vazio</div>');
      }
    }
    grid.innerHTML = cards.join("");

    var saveBtn = document.getElementById("save-team-btn");
    var freeSlots = state.savedTeams.length < 3;
    saveBtn.disabled = !(state.team.length && freeSlots);
    saveBtn.title = !state.team.length ? "Monte um time primeiro" : !freeSlots ? "Os 3 slots já estão ocupados — exclua um pra salvar outro" : "";

    grid.querySelectorAll(".stc-load").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.dataset.idx, 10);
        var slot = state.savedTeams[idx];
        if (!slot) return;
        state.team = snamesToXs(slot.team).slice(0, 6);
        saveTeam();
        renderTeam();
        document.getElementById("saved-teams-status").textContent = "Time \"" + (slot.name || ("Time " + (idx + 1))) + "\" carregado.";
      });
    });
    grid.querySelectorAll(".stc-delete").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.dataset.idx, 10);
        state.savedTeams.splice(idx, 1);
        saveSavedTeams();
        renderSavedTeams();
      });
    });
    grid.querySelectorAll(".stc-rename").forEach(function (btn) {
      btn.addEventListener("click", function () {
        savedTeamEditingIdx = parseInt(btn.dataset.idx, 10);
        renderSavedTeams();
        var input = document.getElementById("stc-rename-input");
        if (input) { input.focus(); input.select(); }
      });
    });
    grid.querySelectorAll(".stc-rename-save").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.dataset.idx, 10);
        var input = document.getElementById("stc-rename-input");
        var newName = input ? input.value.trim() : "";
        if (newName && state.savedTeams[idx]) state.savedTeams[idx].name = newName;
        savedTeamEditingIdx = null;
        saveSavedTeams();
        renderSavedTeams();
      });
    });
    var renameInput = document.getElementById("stc-rename-input");
    if (renameInput) {
      renameInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { document.querySelector(".stc-rename-save").click(); }
        if (e.key === "Escape") { savedTeamEditingIdx = null; renderSavedTeams(); }
      });
    }
  }

  document.getElementById("save-team-btn").addEventListener("click", function () {
    if (state.savedTeams.length >= 3 || !state.team.length) return;
    var nameInput = document.getElementById("save-team-name");
    var name = nameInput.value.trim() || ("Time " + (state.savedTeams.length + 1));
    state.savedTeams.push({ name: name, team: xsToSnames(state.team) });
    saveSavedTeams();
    nameInput.value = "";
    renderSavedTeams();
    document.getElementById("saved-teams-status").textContent = "Salvo como \"" + name + "\".";
  });

  function renderTeamAnalysis(members) {
    var el = document.getElementById("team-analysis");
    if (!members.length) {
      el.innerHTML = '<p style="color:var(--text-dim);font-size:13px;">Adicione Pokémon na aba Dex para ver a cobertura defensiva do time.</p>';
      return;
    }
    var head = '<th class="rowhead">Vs. tipo</th>' + members.map(function (sp) { return '<th>' + escapeHtml(sp.n.split(" ")[0]) + '</th>'; }).join("");
    var riskCount = {};
    var rows = USABLE_TYPES.map(function (atk) {
      var cells = members.map(function (sp) {
        var m = typeMultiplier(atk, speciesTypeNames(sp));
        var cls = m === 0 ? "cov-immune" : m >= 2 ? "cov-weak" : m < 1 ? "cov-resist" : "cov-neutral";
        if (m >= 2) riskCount[atk] = (riskCount[atk] || 0) + 1;
        var label = m === 0 ? "0" : m === 0.25 ? "&frac14;" : m === 0.5 ? "&frac12;" : m === 1 ? "&mdash;" : m + "&times;";
        return '<td><span class="cov-cell ' + cls + '">' + label + '</span></td>';
      }).join("");
      return '<tr><td class="rowhead">' + typePill(atk, true) + '</td>' + cells + '</tr>';
    }).join("");

    var risks = Object.keys(riskCount).map(function (t) { return { t: t, n: riskCount[t] }; })
      .filter(function (r) { return r.n >= 2; })
      .sort(function (a, b) { return b.n - a.n; });
    var riskHtml = risks.length ? risks.map(function (r) {
      var pct = (r.n / members.length) * 100;
      return '<div class="risk-item">' + typePill(r.t, true) +
        '<div class="risk-bar-track"><div class="risk-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="mono">' + r.n + '/' + members.length + ' fracos</span></div>';
    }).join("") : '<p style="color:var(--text-dim);font-size:13px;">Nenhum tipo derruba 2 ou mais membros do time ao mesmo tempo &mdash; boa cobertura defensiva de base.</p>';

    el.innerHTML = '<h3>Riscos compartilhados do time</h3><div class="risk-list">' + riskHtml + '</div>' +
      '<h3 style="margin-top:22px;">Cobertura defensiva (tabela padrão de tipos)</h3>' +
      '<div class="scroll-x"><table class="cov-table"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  // ---------------- bosses view ----------------
  var bossInited = false;
  var bossState = { query: "", cat: "", selected: null, diff: "party" };

  function initBosses() {
    document.getElementById("boss-count-badge").textContent = BOSSES.length;
    if (bossInited) return;
    bossInited = true;

    var cats = [];
    BOSSES.forEach(function (b) { if (cats.indexOf(b.cat) === -1) cats.push(b.cat); });
    var catSelect = document.getElementById("boss-cat-select");
    cats.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      catSelect.appendChild(opt);
    });
    catSelect.addEventListener("change", function () {
      bossState.cat = catSelect.value;
      renderBossList();
    });
    document.getElementById("boss-search-input").addEventListener("input", function (e) {
      bossState.query = e.target.value.trim().toLowerCase();
      document.getElementById("boss-shell").classList.remove("show-detail");
      renderBossList();
    });

    document.getElementById("boss-detail").addEventListener("click", function (e) {
      if (e.target && e.target.id === "boss-export-copy") {
        var ta = document.getElementById("boss-export-text");
        copyText(ta.value, document.getElementById("boss-export-status"), "Copiado! Cole na conversa com o Claude.", ta);
      }
    });

    renderBossList();
  }

  function getFilteredBosses() {
    return BOSSES.map(function (b, i) { return { b: b, i: i }; }).filter(function (row) {
      if (bossState.cat && row.b.cat !== bossState.cat) return false;
      if (bossState.query && row.b.name.toLowerCase().indexOf(bossState.query) === -1) return false;
      return true;
    });
  }

  function renderBossList() {
    var ul = document.getElementById("boss-list");
    var rows = getFilteredBosses();
    if (!rows.length) {
      ul.innerHTML = '<li class="no-results">Nenhum treinador encontrado.</li>';
      return;
    }
    ul.innerHTML = rows.map(function (row) {
      var sel = bossState.selected === row.i ? " selected" : "";
      return '<li class="species-row' + sel + '" data-i="' + row.i + '">' +
        '<span class="sname">' + escapeHtml(row.b.name) + (row.b.db ? " (dupla)" : "") + '</span>' +
        '<span class="boss-cat-tag">' + escapeHtml(row.b.cat) + '</span></li>';
    }).join("");
    ul.querySelectorAll(".species-row").forEach(function (li) {
      li.addEventListener("click", function () { selectBoss(parseInt(li.dataset.i, 10)); });
    });
  }

  var DIFF_LABELS = { party: "Padrão", insane: "Insane", hell: "Hell" };

  function buildBossExportText(boss, diffKey, party) {
    var lines = [];
    var diffNote = diffKey === "party" ? "" : " [dificuldade: " + DIFF_LABELS[diffKey] + "]";
    lines.push("Perdi para " + boss.name + diffNote + " (" + boss.cat + (boss.db ? ", batalha em dupla" : "") + ") no Elite Redux (build 2.65beta).");
    lines.push("Time dele: " + party.map(function (m) {
      return m.n + " [hab. " + (m.abi || "?") + ", item " + (m.item || "nenhum") + ", nature " + (m.nat || "?") + ", golpes: " + m.mv.join("/") + "]";
    }).join("; ") + ".");
    var teamMembers = state.team.map(getSpeciesByX).filter(Boolean);
    lines.push("Meu time atual: " + (teamMembers.length ? teamMembers.map(function (sp) { return sp.n; }).join(", ") : "(vazio)") + ".");
    var boxMembers = state.box.map(getSpeciesByX).filter(Boolean);
    lines.push("Minha caixa (" + boxMembers.length + "): " + (boxMembers.length ? boxMembers.map(function (sp) { return sp.n; }).join(", ") : "(vazia)") + ".");
    lines.push(settingsSummaryText());
    lines.push("Me ajuda a montar um time e estratégia pra vencer esse chefão.");
    return lines.join("\n");
  }

  function selectBoss(i) {
    bossState.selected = i;
    var preferred = DIFF_TO_BOSSKEY[state.settings.difficulty] || "party";
    var boss = BOSSES[i];
    bossState.diff = (boss && boss[preferred] && boss[preferred].length) ? preferred : "party";
    document.querySelectorAll("#boss-list .species-row").forEach(function (r) {
      r.classList.toggle("selected", parseInt(r.dataset.i, 10) === i);
    });
    document.getElementById("boss-shell").classList.add("show-detail");
    renderBossDetail();
  }

  function renderBossDetail() {
    var boss = BOSSES[bossState.selected];
    if (!boss) return;
    var diffKey = bossState.diff || "party";
    var party = boss[diffKey];
    if (!party || !party.length) { diffKey = "party"; party = boss.party; bossState.diff = "party"; }

    var availableDiffs = ["party", "insane", "hell"].filter(function (k) { return boss[k] && boss[k].length; });
    var diffBtns = availableDiffs.length > 1 ? availableDiffs.map(function (k) {
      var active = k === diffKey ? " active" : "";
      return '<button class="chip-btn' + active + '" data-diff="' + k + '" type="button" style="margin-right:6px;">' + DIFF_LABELS[k] + '</button>';
    }).join("") : "";

    var monsHtml = party.map(function (m) {
      var sp = getSpeciesByX(m.x);
      var typesHtml = sp ? speciesTypeNames(sp).map(function (n) { return typePill(n, true); }).join("") : "";
      return '<div class="boss-mon-card">' +
        '<div class="bm-head">' + spriteImgHtml(m.x, m.n, 36) +
        '<div><div class="bm-name">' + escapeHtml(m.n) + '</div>' +
        '<div class="bm-types">' + typesHtml + '</div></div></div>' +
        '<div class="bm-row"><b>Habilidade:</b> ' + escapeHtml(m.abi || "?") + '</div>' +
        '<div class="bm-row"><b>Item:</b> ' + escapeHtml(m.item || "nenhum") + '</div>' +
        '<div class="bm-row"><b>Nature:</b> ' + escapeHtml(m.nat || "?") + '</div>' +
        '<div class="bm-row"><b>Golpes:</b> ' + escapeHtml(m.mv.join(" / ")) + '</div>' +
      '</div>';
    }).join("");

    var exportText = buildBossExportText(boss, diffKey, party);

    document.getElementById("boss-detail").innerHTML =
      '<button class="back-btn" id="boss-back-to-list">&larr; Voltar para a lista</button>' +
      '<div class="detail-head"><div class="detail-titles">' +
        '<h2>' + escapeHtml(boss.name) + '</h2>' +
        '<div class="detail-dexno mono">' + escapeHtml(boss.cat) + (boss.db ? " · batalha em dupla" : "") + '</div>' +
      '</div></div>' +
      (diffBtns ? '<div style="margin-bottom:14px;">' + diffBtns + '<p style="color:var(--text-dim);font-size:11px;margin:6px 0 0;max-width:65ch;">Nomes crus dos dados do jogo — não temos 100% de certeza que "Insane"/"Hell" batem exatamente com os modos "Ace"/"Elite" do menu do jogo atual. Confira sua dificuldade no Centro Pokémon se quiser ter certeza.</p></div>' : "") +
      '<div class="card"><h3>Time do chefão' + (diffKey !== "party" ? " — " + DIFF_LABELS[diffKey] : "") + '</h3><div class="boss-mon-grid">' + monsHtml + '</div></div>' +
      '<div class="card"><h3>Enviar para o Claude</h3>' +
        '<p style="color:var(--text-dim);font-size:12.5px;margin:0 0 10px;max-width:65ch;">Junta o time dele com o seu time e sua caixa num texto só. Copie e cole na conversa pra eu montar a contra-estratégia.</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start;">' +
          '<textarea id="boss-export-text" class="mono" readonly rows="5" style="flex:1;min-width:220px;padding:9px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:12px;resize:vertical;">' + escapeHtml(exportText) + '</textarea>' +
          '<button id="boss-export-copy" class="add-team-btn" type="button">Copiar</button>' +
        '</div>' +
        '<div id="boss-export-status" style="font-size:11.5px;color:var(--accent-2);margin-top:6px;min-height:14px;"></div>' +
      '</div>';

    var backBtn = document.getElementById("boss-back-to-list");
    if (backBtn) backBtn.addEventListener("click", function () {
      document.getElementById("boss-shell").classList.remove("show-detail");
    });

    document.querySelectorAll("#boss-detail [data-diff]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        bossState.diff = btn.dataset.diff;
        renderBossDetail();
      });
    });
  }

  // ---------------- progress / settings view ----------------
  var progressInited = false;
  function renderCapBadge() {
    var cap = getCurrentCap();
    document.getElementById("cap-badge").textContent = cap === null ? "s/ limite" : "Lv " + cap;
  }
  function renderCapDisplay() {
    var cap = getCurrentCap();
    document.getElementById("cap-display").textContent = cap === null ? "Sem limite" : "Nível " + cap;
    if (LEVELCAPS) document.getElementById("settings-note").textContent = LEVELCAPS.note;
  }
  function initProgress() {
    if (progressInited) { renderCapDisplay(); return; }
    progressInited = true;
    var diffSel = document.getElementById("settings-difficulty");
    diffSel.value = state.settings.difficulty;
    var msSel = document.getElementById("settings-milestone");
    if (LEVELCAPS) {
      msSel.innerHTML = LEVELCAPS.rows.map(function (r, idx) {
        return '<option value="' + idx + '">' + escapeHtml(r.milestone) + '</option>';
      }).join("");
    }
    msSel.value = String(state.settings.milestone);
    diffSel.addEventListener("change", function () {
      state.settings.difficulty = diffSel.value;
      saveSettings();
      renderCapDisplay();
      renderCapBadge();
    });
    msSel.addEventListener("change", function () {
      state.settings.milestone = parseInt(msSel.value, 10);
      saveSettings();
      renderCapDisplay();
      renderCapBadge();
    });
    renderCapDisplay();
  }

  // ---------------- types view ----------------
  var typeMatrixRendered = false;
  function renderTypeMatrix() {
    if (typeMatrixRendered) return;
    typeMatrixRendered = true;
    var head = '<tr><th></th>' + USABLE_TYPES.map(function (t) { return '<th>' + typePill(t, true) + '</th>'; }).join("") + '</tr>';
    var rows = USABLE_TYPES.map(function (atk) {
      var cells = USABLE_TYPES.map(function (def) {
        var m = typeMultiplier(atk, [def]);
        var cls = m === 2 ? "mult-2" : m === 0.5 ? "mult-05" : m === 0 ? "mult-0" : "";
        var label = m === 1 ? "&middot;" : m === 0 ? "0" : m === 0.5 ? "&frac12;" : "2&times;";
        return '<td class="' + cls + '">' + label + '</td>';
      }).join("");
      return '<tr><th>' + typePill(atk, true) + '</th>' + cells + '</tr>';
    }).join("");
    document.getElementById("type-matrix").innerHTML = '<thead>' + head + '</thead><tbody>' + rows + '</tbody>';

    if (LEVELCAPS) {
      document.getElementById("levelcap-note").textContent = LEVELCAPS.note + " Fonte: " + LEVELCAPS.source;
      var lcHead = '<tr><th class="rowhead">Marco</th><th>Fácil</th><th>Ace</th><th>Elite</th></tr>';
      var lcRows = LEVELCAPS.rows.map(function (r) {
        var fmt = function (v) { return v === null ? "—" : v; };
        return '<tr><td class="rowhead">' + escapeHtml(r.milestone) + '</td><td class="mono">' + fmt(r.easy) + '</td><td class="mono">' + fmt(r.ace) + '</td><td class="mono">' + fmt(r.elite) + '</td></tr>';
      }).join("");
      document.getElementById("levelcap-table").innerHTML = '<thead>' + lcHead + '</thead><tbody>' + lcRows + '</tbody>';
    }
  }

  // ---------------- init ----------------
  document.getElementById("species-count").textContent = SPECIES.length;
  document.getElementById("data-stamp").textContent = (DATA.meta && DATA.meta.generated) || "?";
  updateTeamBadge();
  updateBoxBadge();
  renderCapBadge();
  renderList();
})();
</script>
```

### 10.2 Pipeline de build (PowerShell)

### scripts/build.ps1

_103 linhas, 4.582 bytes._ **Ponto de entrada unico do build.**

```powershell
<#
Elite Redux Terminal - single build entrypoint.

Regenerates data/dex_compact.json and data/bosses.json from the raw game data
snapshot, then splices template + all data files into artifact_final.html,
with validation.

Usage:
  powershell -File build.ps1                # full rebuild
  powershell -File build.ps1 -SkipExtract    # reuse existing dex_compact.json / bosses.json
                                              # (fast path when only editing the template,
                                              # builds.json or levelcaps.json)
#>
param(
    [switch]$SkipExtract
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$root = Split-Path $PSScriptRoot -Parent
$dataDir = Join-Path $root "data"
$templatePath = Join-Path $root "artifact_template.html"
$outPath = Join-Path $root "artifact_final.html"

if (-not $SkipExtract) {
    Write-Output "--- regenerating dex_compact.json and bosses.json from raw source ---"
    & (Join-Path $PSScriptRoot "transform.ps1")
    & (Join-Path $PSScriptRoot "extract_bosses.ps1")
} else {
    Write-Output "--- skipping extraction, reusing existing data/dex_compact.json and data/bosses.json ---"
}

if (-not (Test-Path (Join-Path $dataDir "sprite_atlas.png"))) {
    Write-Output "--- sprite atlas missing, building it (downloads ~1900 sprites on first run) ---"
    & (Join-Path $PSScriptRoot "build_sprite_atlas.ps1")
} else {
    Write-Output "--- reusing existing sprite atlas (run build_sprite_atlas.ps1 to refresh) ---"
}

$dataFiles = @{
    "__DEX_DATA_JSON__"  = Join-Path $dataDir "dex_compact.json"
    "__BUILDS_JSON__"    = Join-Path $dataDir "builds.json"
    "__BOSSES_JSON__"    = Join-Path $dataDir "bosses.json"
    "__LEVELCAPS_JSON__" = Join-Path $dataDir "levelcaps.json"
    "__SAVEDTEAMS_JSON__" = Join-Path $dataDir "saved_teams_seed.json"
    "__ABILITY_PT_JSON__" = Join-Path $dataDir "ability_translations_pt.json"
    "__SPRITE_INDEX_JSON__" = Join-Path $dataDir "sprite_index.json"
    "__MOVE_PT_JSON__" = Join-Path $dataDir "move_translations_pt.json"
}

foreach ($path in $dataFiles.Values) {
    if (-not (Test-Path $path)) { throw "Missing required data file: $path" }
}

Write-Output "--- splicing ---"
$final = Get-Content $templatePath -Raw -Encoding UTF8
$ser = New-GameDataParser

foreach ($placeholder in $dataFiles.Keys) {
    $path = $dataFiles[$placeholder]
    $json = Get-Content $path -Raw -Encoding UTF8

    # Validate each data file is actually parseable JSON before splicing it in -
    # a bad hand-edit to builds.json/levelcaps.json should fail loudly here,
    # not silently ship a broken artifact.
    try {
        [void]$ser.DeserializeObject($json)
    } catch {
        throw "Data file $path is not valid JSON: $($_.Exception.Message)"
    }

    if ($final -notmatch [regex]::Escape($placeholder)) {
        throw "Placeholder $placeholder not found in template - did the template change?"
    }

    $safeJson = $json.Replace("</script", "<\/script")
    $final = $final.Replace($placeholder, $safeJson)
}

# The sprite atlas is a binary PNG, not JSON, so it gets its own step: embedded
# as a base64 data URI the CSS points at.
$atlasPath = Join-Path $dataDir "sprite_atlas.png"
if (-not (Test-Path $atlasPath)) { throw "Missing sprite atlas: $atlasPath (run build_sprite_atlas.ps1)" }
$atlasUri = "data:image/png;base64," + [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes($atlasPath))
if ($final -notmatch [regex]::Escape("__SPRITE_ATLAS_DATAURI__")) { throw "Placeholder __SPRITE_ATLAS_DATAURI__ not found in template." }
$final = $final.Replace("__SPRITE_ATLAS_DATAURI__", $atlasUri)

foreach ($placeholder in $dataFiles.Keys) {
    if ($final.Contains($placeholder)) { throw "Placeholder $placeholder still present after splice - build is broken." }
}
if ($final.Contains("__SPRITE_ATLAS_DATAURI__")) { throw "Sprite atlas placeholder still present after splice." }

[System.IO.File]::WriteAllText($outPath, $final, (New-Object System.Text.UTF8Encoding($false)))

$bytes = (Get-Item $outPath).Length
if ($bytes -lt 500000) { throw "Output file is suspiciously small ($bytes bytes) - something likely failed silently." }
# Artifact hard limit is 16MB; warn well before we get near it.
if ($bytes -gt 14000000) { throw "Output is ${bytes} bytes, too close to the 16MB artifact limit." }

Write-Output "--- done ---"
Write-Output "artifact_final.html: $bytes bytes ($([math]::Round($bytes/1MB,2)) MB)"
Write-Output "Publish it with the Artifact tool (file_path=$outPath, keep the same artifact url to update in place)."
```

### scripts/common.ps1

_73 linhas, 2.679 bytes._ Escritor de JSON manual, compartilhado.

```powershell
# Shared helpers for the Elite Redux Terminal data pipeline.
# Dot-source this from other scripts: . (Join-Path $PSScriptRoot "common.ps1")

Add-Type -AssemblyName System.Web.Extensions

function New-GameDataParser {
    $ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
    $ser.MaxJsonLength = 200000000
    return $ser
}

# Manual JSON writer - JavaScriptSerializer.Serialize() throws a circular-reference
# error on values that came out of DeserializeObject(), so we write JSON by hand.
function Write-JsonString([System.Text.StringBuilder]$sb, [string]$s) {
    [void]$sb.Append('"')
    if ($s) {
        foreach ($ch in $s.ToCharArray()) {
            switch ($ch) {
                '"' { [void]$sb.Append('\"'); break }
                '\' { [void]$sb.Append('\\'); break }
                "`n" { [void]$sb.Append('\n'); break }
                "`r" { [void]$sb.Append('\r'); break }
                "`t" { [void]$sb.Append('\t'); break }
                default {
                    if ([int]$ch -lt 0x20) { [void]$sb.Append([string]::Format('\u{0:x4}', [int]$ch)) }
                    else { [void]$sb.Append($ch) }
                }
            }
        }
    }
    [void]$sb.Append('"')
}

function Write-JsonValue([System.Text.StringBuilder]$sb, $val) {
    if ($null -eq $val) { [void]$sb.Append('null'); return }
    if ($val -is [bool]) { [void]$sb.Append($(if ($val) { 'true' } else { 'false' })); return }
    if ($val -is [string]) { Write-JsonString $sb $val; return }
    if ($val -is [int] -or $val -is [long] -or $val -is [double] -or $val -is [float] -or $val -is [decimal]) {
        [void]$sb.Append([System.Convert]::ToString($val, [System.Globalization.CultureInfo]::InvariantCulture))
        return
    }
    if ($val -is [System.Collections.IDictionary]) {
        [void]$sb.Append('{')
        $first = $true
        foreach ($key in $val.Keys) {
            if (-not $first) { [void]$sb.Append(',') }
            $first = $false
            Write-JsonString $sb ([string]$key)
            [void]$sb.Append(':')
            Write-JsonValue $sb $val[$key]
        }
        [void]$sb.Append('}')
        return
    }
    if ($val -is [System.Collections.IEnumerable]) {
        [void]$sb.Append('[')
        $first = $true
        foreach ($item in $val) {
            if (-not $first) { [void]$sb.Append(',') }
            $first = $false
            Write-JsonValue $sb $item
        }
        [void]$sb.Append(']')
        return
    }
    Write-JsonString $sb ([string]$val)
}

function ConvertTo-JsonManual($val) {
    $sb = New-Object System.Text.StringBuilder
    Write-JsonValue $sb $val
    return $sb.ToString()
}
```

### scripts/transform.ps1

_100 linhas, 3.304 bytes._ Gera dex_compact.json a partir dos dados brutos.

```powershell
# Generates data/dex_compact.json from data/gameData_265beta.json (the raw
# Elite Redux NextDex export). Run via build.ps1, or standalone for debugging.

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$srcPath = Join-Path $dataDir "gameData_265beta.json"

$ser = New-GameDataParser
$json = Get-Content $srcPath -Raw -Encoding UTF8
$data = $ser.DeserializeObject($json)

# --- abilities lookup (array indexed by id) ---
$abilitiesOut = New-Object System.Collections.ArrayList
foreach ($a in $data.abilities) {
    [void]$abilitiesOut.Add(@($a["name"], $a["desc"]))
}

# --- moves lookup (array indexed by id) ---
$movesOut = New-Object System.Collections.ArrayList
foreach ($m in $data.moves) {
    $types = @($m["types"])
    $t0 = if ($types.Count -gt 0) { $types[0] } else { 0 }
    [void]$movesOut.Add(@($m["name"], $t0, $m["split"], $m["pwr"], $m["acc"], $m["pp"], $m["desc"]))
}

# --- species ---
$speciesOut = New-Object System.Collections.ArrayList
for ($idx = 0; $idx -lt $data.species.Count; $idx++) {
    $s = $data.species[$idx]
    $name = $s["name"]
    if (-not $name -or $name -eq "??????????") {
        [void]$speciesOut.Add($null)
        continue
    }
    $st = $s["stats"]
    $base = @($st["base"])
    $types = @($st["types"])
    $abis = @(@($st["abis"]) | Where-Object { $_ -ne 0 })
    $inns = @(@($st["inns"]) | Where-Object { $_ -ne 0 })

    $evos = New-Object System.Collections.ArrayList
    foreach ($e in @($s["evolutions"])) {
        [void]$evos.Add(@($e["kd"], $e["rs"], $e["in"]))
    }

    $lm = New-Object System.Collections.ArrayList
    foreach ($mv in @($s["levelUpMoves"])) {
        if ($mv["id"] -ne 0) {
            [void]$lm.Add(@($mv["lv"], $mv["id"]))
        }
    }

    $tu = @(@($s["tutor"]) | Where-Object { $_ -ne 0 })
    $tm = @(@($s["TMHMMoves"]) | Where-Object { $_ -ne 0 })

    $dexInfo = $s["dex"]
    $desc = if ($dexInfo) { $dexInfo["desc"] } else { "" }
    $hw = if ($dexInfo -and $dexInfo["hw"]) { @($dexInfo["hw"]) } else { @() }
    $dexId = if ($dexInfo) { $dexInfo["id"] } else { 0 }

    $entry = [ordered]@{
        x = $idx
        i = $dexId
        n = $name
        sname = $s["NAME"]
        t = $types
        b = $base
        ab = $abis
        inn = $inns
        ev = $evos.ToArray()
        lm = $lm.ToArray()
        tu = $tu
        tm = $tm
        d = $desc
        hw = $hw
    }
    [void]$speciesOut.Add($entry)
}

$out = [ordered]@{
    meta = [ordered]@{
        source = "Elite Redux NextDex (https://forwardfeed.github.io/ER-nextdex/static/)"
        repo = "https://github.com/ForwardFeed/ER-nextdex"
        version = "2.65beta"
        generated = (Get-Date -Format "yyyy-MM-dd")
    }
    types = @($data.typeT)
    splits = @($data.splitT)
    evoKinds = @($data.evoKindT)
    abilities = $abilitiesOut.ToArray()
    moves = $movesOut.ToArray()
    species = $speciesOut.ToArray()
}

$outJson = ConvertTo-JsonManual $out
$outPath = Join-Path $dataDir "dex_compact.json"
[System.IO.File]::WriteAllText($outPath, $outJson, (New-Object System.Text.UTF8Encoding($false)))

Write-Output "transform.ps1: OK ($($speciesOut.Count) species, $($abilitiesOut.Count) abilities, $($movesOut.Count) moves) -> $outPath ($((Get-Item $outPath).Length) bytes)"
```

### scripts/extract_bosses.ps1

_78 linhas, 2.884 bytes._ Gera bosses.json.

```powershell
# Generates data/bosses.json (boss trainers + their difficulty variants) from
# data/gameData_265beta.json. Run via build.ps1, or standalone for debugging.

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$srcPath = Join-Path $dataDir "gameData_265beta.json"

$ser = New-GameDataParser
$json = Get-Content $srcPath -Raw -Encoding UTF8
$data = $ser.DeserializeObject($json)

# Trainer class ids -> display category. String keys because OrderedDictionary's
# and Hashtable's [int] indexer can resolve positionally instead of by key.
$bossCategories = @{
    "34" = "Lider de Ginasio"
    "33" = "Alto Comando"
    "38" = "Campeao"
    "11" = "Equipe Aqua"
    "9"  = "Equipe Aqua (Admin)"
    "57" = "Equipe Magma"
    "16" = "Equipe Magma (Admin)"
    "62" = "Superchefao (Monotype)"
    "49" = "Superchefao"
    "46" = "Superchefao"
    "26" = "Frontier Brain"
}

function ResolveAbility($sp, $abiIdx) {
    if (-not $sp -or -not $sp["stats"] -or -not $sp["stats"]["abis"]) { return "" }
    $abisArr = @($sp["stats"]["abis"])
    if ($abiIdx -ge 0 -and $abiIdx -lt $abisArr.Count) {
        $aid = $abisArr[$abiIdx]
        if ($data.abilities[$aid]) { return $data.abilities[$aid]["name"] }
    }
    return ""
}

function ResolveParty($rawParty) {
    $party = New-Object System.Collections.ArrayList
    foreach ($mon in @($rawParty)) {
        $spIdx = $mon["spc"]
        $sp = $data.species[$spIdx]
        $abiName = ResolveAbility $sp $mon["abi"]
        $itemName = if ($mon["item"] -and $data.items[$mon["item"]]) { $data.items[$mon["item"]]["name"] } else { "" }
        $natName = if ($data.natureT[$mon["nature"]]) { $data.natureT[$mon["nature"]] } else { "" }
        $moveNames = @(@($mon["moves"]) | Where-Object { $_ -ne 0 } | ForEach-Object { if ($data.moves[$_]) { $data.moves[$_]["name"] } })
        [void]$party.Add([ordered]@{
            x = $spIdx
            n = if ($sp) { $sp["name"] } else { "?" }
            abi = $abiName
            item = $itemName
            nat = $natName
            mv = $moveNames
        })
    }
    return $party.ToArray()
}

$bosses = New-Object System.Collections.ArrayList
foreach ($t in $data.trainers) {
    $cid = [string]$t["tclass"]
    if (-not $bossCategories.ContainsKey($cid)) { continue }
    [void]$bosses.Add([ordered]@{
        name = $t["name"]
        cat = $bossCategories[$cid]
        db = [bool]$t["db"]
        party = ResolveParty $t["party"]
        insane = ResolveParty $t["insane"]
        hell = ResolveParty $t["hell"]
    })
}

$outJson = ConvertTo-JsonManual $bosses.ToArray()
$outPath = Join-Path $dataDir "bosses.json"
[System.IO.File]::WriteAllText($outPath, $outJson, (New-Object System.Text.UTF8Encoding($false)))

Write-Output "extract_bosses.ps1: OK ($($bosses.Count) bosses) -> $outPath ($((Get-Item $outPath).Length) bytes)"
```

### scripts/build_sprite_atlas.ps1

_111 linhas, 4.560 bytes._ Baixa e empacota os 1906 sprites.

```powershell
<#
Downloads the front sprite for EVERY species in dex_compact.json and packs them
into a single atlas PNG + an index map, so the artifact can show a sprite for all
1906 species without embedding 1906 separate base64 images.

Why an atlas: the artifact CSP blocks remote images, so sprites must be embedded.
As individual data URIs that is ~7MB of base64; as one atlas PNG it compresses to
a fraction of that, and the browser decodes one image instead of ~1900.

Outputs:
  data/sprite_atlas.png   - the packed image (64px cells, ATLAS_COLS per row)
  data/sprite_index.json  - { "<species x>": <slot index> }
Raw downloads are cached in data/sprites_all/<x>.png so re-runs are incremental.
#>

. (Join-Path $PSScriptRoot "common.ps1")
Add-Type -AssemblyName System.Drawing

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$rawDir = Join-Path $dataDir "sprites_all"
if (-not (Test-Path $rawDir)) { New-Item -ItemType Directory -Path $rawDir | Out-Null }

# Source sprites are 64px, but the UI never shows one larger than this cell size,
# so storing them bigger only costs page weight. At 48 the atlas drops from
# 2.5MB to 1.7MB with nothing in the UI being upscaled.
# NearestNeighbor on purpose: smooth interpolation invents intermediate colours
# and partial alpha, which makes the PNG BIGGER, not smaller (measured).
$CELL = 48
$ATLAS_COLS = 44

$ser = New-GameDataParser
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))

$available = @{}
foreach ($line in (Get-Content (Join-Path $dataDir "sprite_filenames.txt"))) { $available[$line] = $true }

$targets = New-Object System.Collections.ArrayList
foreach ($sp in $dex.species) {
    if (-not $sp) { continue }
    $key = ($sp["sname"] -replace "^SPECIES_", "")
    if (-not $available.ContainsKey($key)) { continue }
    [void]$targets.Add([ordered]@{ x = $sp["x"]; file = $key })
}
Write-Output "targets: $($targets.Count)"

# ---- download (incremental) ----
$wc = New-Object System.Net.WebClient
$fetched = 0; $cached = 0; $failed = 0
foreach ($t in $targets) {
    $path = Join-Path $rawDir ("" + $t.x + ".png")
    if (Test-Path $path) { $cached++; continue }
    $url = "https://raw.githubusercontent.com/ForwardFeed/ER-nextdex/main/static/sprites/$($t.file).png"
    try {
        $wc.DownloadFile($url, $path)
        $fetched++
        if ($fetched % 200 -eq 0) { Write-Output "  ...$fetched downloaded" }
    } catch {
        $failed++
    }
}
Write-Output "download: $fetched new, $cached cached, $failed failed"

# ---- pack atlas ----
$usable = @($targets | Where-Object { Test-Path (Join-Path $rawDir ("" + $_.x + ".png")) })
$rows = [math]::Ceiling($usable.Count / $ATLAS_COLS)
$atlasW = $ATLAS_COLS * $CELL
$atlasH = $rows * $CELL
Write-Output "atlas: $($usable.Count) sprites, ${atlasW}x${atlasH}px ($ATLAS_COLS x $rows cells)"

$bmp = New-Object System.Drawing.Bitmap($atlasW, $atlasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

$index = [ordered]@{}
$slot = 0
foreach ($t in $usable) {
    $path = Join-Path $rawDir ("" + $t.x + ".png")
    try {
        $img = [System.Drawing.Image]::FromFile($path)
        $col = $slot % $ATLAS_COLS
        $row = [math]::Floor($slot / $ATLAS_COLS)
        $dst = New-Object System.Drawing.Rectangle(($col * $CELL), ($row * $CELL), $CELL, $CELL)
        $srcR = New-Object System.Drawing.Rectangle(0, 0, $img.Width, $img.Height)
        $g.DrawImage($img, $dst, $srcR, [System.Drawing.GraphicsUnit]::Pixel)
        $img.Dispose()
        $index[[string]$t.x] = $slot
        $slot++
    } catch {
        Write-Output "  skip (unreadable): $path"
    }
}
$g.Dispose()

$atlasPath = Join-Path $dataDir "sprite_atlas.png"
$bmp.Save($atlasPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

$meta = [ordered]@{
    cell = $CELL
    cols = $ATLAS_COLS
    rows = $rows
    index = $index
}
$outPath = Join-Path $dataDir "sprite_index.json"
[System.IO.File]::WriteAllText($outPath, (ConvertTo-JsonManual $meta), (New-Object System.Text.UTF8Encoding($false)))

Write-Output "build_sprite_atlas.ps1: OK ($slot sprites packed)"
Write-Output "  $atlasPath ($([math]::Round((Get-Item $atlasPath).Length/1MB,2)) MB)"
Write-Output "  $outPath ($((Get-Item $outPath).Length) bytes)"
```

### scripts/slim_dex.ps1

_77 linhas, 2.881 bytes._ Remove campos nunca exibidos. Edita in-place.

```powershell
<#
Strips fields from data/dex_compact.json that the UI never renders, to cut page
weight. Run AFTER transform.ps1 (which regenerates the full file from the raw
game data) and before build.ps1.

Removed (all invisible or redundant - nothing the UI shows today is lost):
  hw  - height/weight, never rendered
  tm  - TM/HM move list, empty for every species in this build and never rendered
  move descriptions - the English text, now fully superseded by
        data/move_translations_pt.json (only dropped when coverage is 1031/1031;
        otherwise kept as a fallback)

Deliberately KEPT:
  d   - the English Pokedex flavour text (~277KB). It is displayed, so removing
        it is a product decision, not a build optimisation. Set -DropFlavor to
        strip it as well.

Idempotent: re-running on an already-slimmed file is a no-op.
#>
param(
    [switch]$DropFlavor
)

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$dexPath = Join-Path $dataDir "dex_compact.json"
$ptPath = Join-Path $dataDir "move_translations_pt.json"

$ser = New-GameDataParser
$dex = $ser.DeserializeObject((Get-Content $dexPath -Raw -Encoding UTF8))
$before = (Get-Item $dexPath).Length

# Only drop English move text if every described move has a translation.
$dropMoveDesc = $false
if (Test-Path $ptPath) {
    $pt = $ser.DeserializeObject((Get-Content $ptPath -Raw -Encoding UTF8))
    $missing = 0
    for ($i = 1; $i -lt $dex.moves.Count; $i++) {
        if ($dex.moves[$i][6] -and -not $pt["$i"]) { $missing++ }
    }
    if ($missing -eq 0) { $dropMoveDesc = $true }
    else { Write-Output "  aviso: $missing golpes sem traducao - mantendo o texto em ingles como fallback" }
}

$speciesOut = New-Object System.Collections.ArrayList
foreach ($s in $dex.species) {
    if (-not $s) { [void]$speciesOut.Add($null); continue }
    $entry = [ordered]@{
        x = $s["x"]; i = $s["i"]; n = $s["n"]; sname = $s["sname"]
        t = $s["t"]; b = $s["b"]; ab = $s["ab"]; inn = $s["inn"]
        ev = $s["ev"]; lm = $s["lm"]; tu = $s["tu"]
    }
    if (-not $DropFlavor) { $entry["d"] = $s["d"] }
    [void]$speciesOut.Add($entry)
}

$movesOut = New-Object System.Collections.ArrayList
foreach ($m in $dex.moves) {
    $arr = @($m)
    if ($dropMoveDesc -and $arr.Count -ge 7) { $arr = $arr[0..5] + @("") }
    [void]$movesOut.Add($arr)
}

$out = [ordered]@{
    meta = $dex.meta
    types = $dex.types
    splits = $dex.splits
    evoKinds = $dex.evoKinds
    abilities = $dex.abilities
    moves = $movesOut.ToArray()
    species = $speciesOut.ToArray()
}

[System.IO.File]::WriteAllText($dexPath, (ConvertTo-JsonManual $out), (New-Object System.Text.UTF8Encoding($false)))
$after = (Get-Item $dexPath).Length
Write-Output ("slim_dex.ps1: OK  {0:N0} -> {1:N0} bytes (-{2:N0} KB)" -f $before, $after, [math]::Round(($before-$after)/1024))
```

### scripts/expand_combo_abilities.ps1

_90 linhas, 3.469 bytes._ Expande habilidades combo. Edita in-place.

```powershell
<#
Some abilities are defined in the game data only as a sum of other abilities -
e.g. Brute Force's whole description is "Rock Head + Reckless". That tells you
nothing unless you already know both, so this script rewrites those entries in
data/ability_translations_pt.json to also spell out what each component does,
in Portuguese.

Combos can nest (a component may itself be a combo), so components are flattened
recursively down to abilities that have a real description.

Run after ability_translations_pt.json exists; it edits that file in place and is
idempotent (already-expanded entries are rebuilt from scratch each run).
#>

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))
$ptPath = Join-Path $dataDir "ability_translations_pt.json"
$pt = $ser.DeserializeObject((Get-Content $ptPath -Raw -Encoding UTF8))

# ability name -> id
$byName = @{}
for ($i = 0; $i -lt $dex.abilities.Count; $i++) {
    $n = $dex.abilities[$i][0]
    if ($n -and -not $byName.ContainsKey($n)) { $byName[$n] = $i }
}

function Get-ComboParts($id) {
    $desc = $dex.abilities[$id][1]
    if (-not $desc -or $desc -notmatch '\+') { return $null }
    $parts = ($desc.TrimEnd('.').Trim()) -split '\s*\+\s*'
    if ($parts.Count -lt 2) { return $null }
    $ids = New-Object System.Collections.ArrayList
    foreach ($p in $parts) {
        $key = $p.Trim()
        if (-not $byName.ContainsKey($key)) { return $null }
        [void]$ids.Add($byName[$key])
    }
    return $ids.ToArray()
}

# Flatten nested combos into atomic component ids, guarding against cycles.
function Flatten-Combo($id, $seen) {
    $out = New-Object System.Collections.ArrayList
    $parts = Get-ComboParts $id
    if (-not $parts) { [void]$out.Add($id); return $out.ToArray() }
    foreach ($p in $parts) {
        if ($seen -contains $p) { continue }
        $nextSeen = $seen + @($p)
        foreach ($f in (Flatten-Combo $p $nextSeen)) {
            if ($out -notcontains $f) { [void]$out.Add($f) }
        }
    }
    return $out.ToArray()
}

$expanded = 0
$skipped = New-Object System.Collections.ArrayList

for ($i = 1; $i -lt $dex.abilities.Count; $i++) {
    $parts = Get-ComboParts $i
    if (-not $parts) { continue }

    $atoms = Flatten-Combo $i @($i)
    if ($atoms.Count -eq 0) { [void]$skipped.Add($dex.abilities[$i][0]); continue }

    $headNames = @($parts | ForEach-Object { $dex.abilities[$_][0] })
    $lines = New-Object System.Collections.ArrayList
    [void]$lines.Add(($headNames -join " + "))
    foreach ($a in $atoms) {
        $name = $dex.abilities[$a][0]
        $desc = $pt["$a"]
        if (-not $desc) { $desc = $dex.abilities[$a][1] }   # fall back to English if untranslated
        if (-not $desc) { continue }
        [void]$lines.Add("- " + $name + ": " + $desc)
    }
    if ($lines.Count -lt 2) { [void]$skipped.Add($dex.abilities[$i][0]); continue }
    $pt["$i"] = ($lines -join "`n")
    $expanded++
}

[System.IO.File]::WriteAllText($ptPath, (ConvertTo-JsonManual $pt), (New-Object System.Text.UTF8Encoding($false)))

Write-Output "expand_combo_abilities.ps1: OK ($expanded combo abilities expanded)"
if ($skipped.Count -gt 0) {
    Write-Output "  could not expand $($skipped.Count): $($skipped -join ', ')"
}
Write-Output "  -> $ptPath ($((Get-Item $ptPath).Length) bytes)"
```

### scripts/check_upstream.ps1

_83 linhas, 3.130 bytes._ Detecta divergencia com o NextDex.

```powershell
<#
Compares our local game-data snapshot against the live NextDex, so a new Elite
Redux build does not go unnoticed. Checks two things:

  1. Is 2.65beta still the version the official dex defaults to? (the dex picks
     the LAST entry of allVersions in static/js/data_version.js)
  2. Is our snapshot byte-identical to the remote file for that version?

Exit code 0 = in sync, 1 = drifted (so it can gate a build or a scheduled run).
Read-only: never overwrites the snapshot. To actually update, re-download
gameDataV<version>.json into data/ and re-run build.ps1 WITHOUT -SkipExtract,
then re-run expand_combo_abilities.ps1.
#>

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$localPath = Join-Path $dataDir "gameData_265beta.json"
$OUR_VERSION = "2.65beta"
$base = "https://raw.githubusercontent.com/ForwardFeed/ER-nextdex/main"

$drift = $false
$wc = New-Object System.Net.WebClient

Write-Output "--- versao padrao do dex oficial ---"
try {
    $verJs = $wc.DownloadString("$base/static/js/data_version.js")
    $m = [regex]::Match($verJs, 'allVersions\s*=\s*\[(.*?)\]', 'Singleline')
    if ($m.Success) {
        $versions = [regex]::Matches($m.Groups[1].Value, '"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
        $latest = $versions[-1]
        if ($latest -eq $OUR_VERSION) {
            Write-Output "  OK: continua '$latest'"
        } else {
            Write-Output "  MUDOU: dex agora usa '$latest', nosso snapshot e '$OUR_VERSION'"
            $drift = $true
        }
    } else {
        Write-Output "  AVISO: nao consegui ler allVersions (formato do arquivo mudou?)"
        $drift = $true
    }
} catch {
    Write-Output "  ERRO ao consultar: $($_.Exception.Message)"
    $drift = $true
}

Write-Output "--- conteudo do snapshot ---"
if (-not (Test-Path $localPath)) {
    Write-Output "  ERRO: snapshot local ausente ($localPath)"
    exit 1
}
$localBytes = (Get-Item $localPath).Length
try {
    $remote = $wc.DownloadData("$base/static/js/data/gameDataV$OUR_VERSION.json")
    Write-Output "  local:  $localBytes bytes"
    Write-Output "  remoto: $($remote.Length) bytes"
    if ($remote.Length -ne $localBytes) {
        Write-Output "  MUDOU: tamanhos diferentes - dados de $OUR_VERSION foram atualizados"
        $drift = $true
    } else {
        $localHash = (Get-FileHash $localPath -Algorithm SHA256).Hash
        $sha = [System.Security.Cryptography.SHA256]::Create()
        $remoteHash = ([System.BitConverter]::ToString($sha.ComputeHash($remote)) -replace '-', '')
        if ($localHash -eq $remoteHash) {
            Write-Output "  OK: identico (sha256 $($localHash.Substring(0,12))...)"
        } else {
            Write-Output "  MUDOU: mesmo tamanho, conteudo diferente"
            $drift = $true
        }
    }
} catch {
    Write-Output "  ERRO ao baixar: $($_.Exception.Message)"
    $drift = $true
}

Write-Output ""
if ($drift) {
    Write-Output "RESULTADO: dados DESATUALIZADOS ou inconclusivos - revisar antes de confiar na ferramenta."
    exit 1
} else {
    Write-Output "RESULTADO: em dia."
    exit 0
}
```

### 10.3 Dados curados a mao

### data/builds.json

_66 linhas, 2.926 bytes._ Builds por Pokemon, chaveadas por sname.

```json
{
  "SPECIES_AERODACTYL_MEGA": {
    "ability": "Fatal Precision",
    "nature": "Jolly",
    "evs": "252 Atk / 4 SpD / 252 Spe",
    "item": "Life Orb",
    "moves": ["Head Smash", "Dragon Dance", "Brave Bird", "Tectonic Fangs"],
    "note": "Mega permanente: a Aerodactylite só é necessária na 1a evolução, depois libera o slot pro Life Orb. Rock Head (innate) zera o recuo do Head Smash."
  },
  "SPECIES_GLIMMORA_MEGA": {
    "ability": "Corrosion",
    "nature": "Modest",
    "evs": "252 SpA / 252 Spe / 4 HP",
    "item": "Life Orb",
    "moves": ["Meteor Beam", "Sludge Wave", "Earth Power", "Stealth Rock"],
    "note": "Mega permanente: Glimmoranite só na 1a evolução. Corrosion faz Poison pegar em Steel; Accelerate (innate) tira o turno de carga do Meteor Beam."
  },
  "SPECIES_ARCANINE_HISUIAN_MEGA": {
    "ability": "Tough Claws",
    "nature": "Jolly",
    "evs": "252 Atk / 4 SpD / 252 Spe",
    "item": "Life Orb",
    "moves": ["Flare Blitz", "Head Smash", "Close Combat", "Extreme Speed"],
    "note": "Habilidade travada (as 3 opções são Tough Claws). Mega permanente: Arcanite H só na 1a evolução. Rock Head + Reckless = recuo zero e +20% de dano."
  },
  "SPECIES_TERRAKION": {
    "ability": "Rockhard Will",
    "nature": "Jolly",
    "evs": "252 Atk / 4 SpD / 252 Spe",
    "item": "Life Orb",
    "moves": ["Stone Edge", "Sacred Sword", "Earthquake", "Swords Dance"],
    "note": "Sem Mega. Mold Breaker (innate) ignora habilidades defensivas do alvo — combina com Swords Dance."
  },
  "SPECIES_AVALUGG_HISUIAN": {
    "ability": "Self Sufficient",
    "nature": "Impish",
    "evs": "252 HP / 252 Def / 4 SpD",
    "item": "Leftovers",
    "moves": ["Recover", "Body Press", "Avalanche", "Rock Slide"],
    "note": "Impish porque Body Press usa a Defesa como ataque: subir Def aumenta dano e resistência ao mesmo tempo."
  },
  "SPECIES_TYRANITAR_MEGA_REDUX": {
    "ability": "Evaporate",
    "nature": "Modest",
    "evs": "252 HP / 252 SpA / 4 SpD",
    "item": "Leftovers",
    "moves": ["Eruption", "Diamond Storm", "Flamethrower", "Earth Power"],
    "note": "Habilidade travada (Evaporate = imunidade a Water). Leftovers em vez de Life Orb porque Eruption escala com %HP."
  },
  "SPECIES_PROBOPASS": {
    "ability": "Impenetrable",
    "nature": "Calm",
    "evs": "252 HP / 252 SpD / 4 Def",
    "item": "Leftovers",
    "moves": ["Stealth Rock", "Volt Switch", "Power Gem", "Body Press"],
    "note": "Levitate (innate) dá imunidade real a Ground — o buraco do time. Rock/Steel ainda resiste Psychic e Electric."
  },
  "SPECIES_COALOSSAL_MEGA": {
    "ability": "Earth Eater",
    "nature": "Modest",
    "evs": "252 HP / 252 SpA / 4 SpD",
    "item": "Leftovers",
    "moves": ["Meteor Beam", "Magma Storm", "Steam Eruption", "Rock Polish"],
    "note": "Habilidade travada. Earth Eater cura 25% ao levar Ground; resistir Fire anula o Molten Down inimigo."
  }
}
```

### data/levelcaps.json

_16 linhas, 1.102 bytes._ Ver secao 9 item 2 - origem menos confiavel.

```json
{
  "source": "https://eliteredux.net/level-caps/",
  "note": "Se voce passar do cap, o Pokemon acima do nivel pode parar de obedecer. Dificuldade pode ser abaixada a qualquer Centro Pokemon, mas nao aumentada de novo depois.",
  "rows": [
    { "milestone": "Sem Badge (inicio)", "easy": 20, "ace": 18, "elite": 16 },
    { "milestone": "Stone Badge (1o ginasio)", "easy": 28, "ace": 25, "elite": 23 },
    { "milestone": "Knuckle Badge (2o ginasio)", "easy": 44, "ace": 40, "elite": 36 },
    { "milestone": "Dynamo Badge (3o ginasio)", "easy": 55, "ace": 50, "elite": 45 },
    { "milestone": "Heat Badge (4o ginasio)", "easy": 65, "ace": 55, "elite": 50 },
    { "milestone": "Balance Badge (5o ginasio)", "easy": 80, "ace": 70, "elite": 55 },
    { "milestone": "Feather Badge (6o ginasio)", "easy": 90, "ace": 85, "elite": 60 },
    { "milestone": "Mind Badge (7o ginasio)", "easy": null, "ace": 92, "elite": 70 },
    { "milestone": "Rain Badge (8o ginasio)", "easy": null, "ace": 95, "elite": 80 },
    { "milestone": "Champion / Alto Comando", "easy": null, "ace": null, "elite": null }
  ]
}
```

### data/saved_teams_seed.json

_13 linhas, 266 bytes._ Time recomendado pre-carregado.

```json
[
  {
    "name": "Recomendado vs Monochamp Rock",
    "team": [
      "SPECIES_AERODACTYL_MEGA",
      "SPECIES_PROBOPASS",
      "SPECIES_COALOSSAL_MEGA",
      "SPECIES_TERRAKION",
      "SPECIES_AVALUGG_HISUIAN",
      "SPECIES_TYRANITAR_MEGA_REDUX"
    ]
  }
]
```

---

## 11. Amostras dos dados gerados

Arquivos grandes demais para incluir na íntegra. Amostras representativas:

### `data/dex_compact.json` — uma espécie

```json
{"x":6,"i":6,"n":"Charizard","sname":"SPECIES_CHARIZARD","t":[2,6],
 "b":[79,84,78,109,85,100],"ab":[357,371,181],"inn":[66,413,555],
 "ev":[[1,"ITEM_CHARIZARDITE_X",1120],[1,"ITEM_CHARIZARDITE_Y",1121],[1,"ITEM_CHARIZARDITE_Z",1595]],
 "lm":[[1,424],[1,481],[1,45]],"tu":[403,213,712,68,432],
 "d":"A Charizard flies about in search of strong opponents..."}
```

### `data/dex_compact.json` — abilities e moves

```json
"abilities": [["-------","Empty ability slot."],
              ["Stench","10% chance to flinch targets. Toxic terrain is permanent."],
              ["Drizzle","Summons rain on entry. Lasts 8 turns."]]

"moves[424]": ["Fire Fang", 2, 0, 80, 100, 15, ""]
               nome        tipo split pwr acc pp  desc (esvaziada por slim_dex.ps1)
```

### `data/ability_translations_pt.json`

```json
{
  "66":  "Aumenta golpes do tipo Fire em 1.2x, ou 1.5x quando com menos de 1/3 do HP.",
  "357": "O tipo Fire é super efetivo contra o tipo Rock.",
  "758": "Rock Head + Reckless\n- Rock Head: Imune a dano de recuo, mas não a dano de Explosion/crash.\n- Reckless: Golpes que causam dano de recuo causam 1.2x mais dano."
}
```

A entrada `758` mostra o resultado de `expand_combo_abilities.ps1`: a descrição original era
literalmente `"Rock Head + Reckless"`, o que não informa nada a quem não conhece as duas.

### `data/move_translations_pt.json`

```json
{
  "1":   "Golpeia o oponente com as patas dianteiras ou a cauda.",
  "424": "Pode causar flinch ou deixar o oponente queimado.",
  "446": "Coloca Stealth Rock, que fere oponentes que entram em campo."
}
```

### `data/sprite_index.json`

```json
{ "cell": 48, "cols": 44, "rows": 44, "index": { "6": 5, "142": 130, ... } }
```

`index` mapeia `x` da espécie → posição no atlas. A CSS calcula
`background-position: -(col*tamanho)px -(row*tamanho)px`.

---

## 12. Como o usuário pode verificar (comandos reais)

Se a auditoria precisar de confirmação empírica, estes comandos existem e funcionam:

```powershell
# Reconstrói tudo do zero a partir dos dados brutos
powershell -File scripts\build.ps1

# Build rápido (reaproveita dex/bosses/atlas já gerados)
powershell -File scripts\build.ps1 -SkipExtract

# Verifica se o snapshot local ainda bate com o NextDex ao vivo
powershell -File scripts\check_upstream.ps1     # exit 0 = em dia, 1 = divergiu

# Regenera o atlas (baixa sprites faltantes, reempacota)
powershell -File scripts\build_sprite_atlas.ps1
```

Para inspecionar os dados em PowerShell (lembrando que `ConvertFrom-Json` **falha** neste
dataset):

```powershell
Add-Type -AssemblyName System.Web.Extensions
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = 200000000
$dex = $ser.DeserializeObject((Get-Content data\dex_compact.json -Raw -Encoding UTF8))
```

Para testar comportamento em runtime, a página é servida localmente e inspecionada via
JavaScript no console — foi assim que todas as métricas da §8 foram obtidas.

---

## 13. Contexto de manutenção

- **Não é um repositório git.** Não há histórico de versões nem CI.
- **Não há testes automatizados.** Toda verificação foi manual: servir a página localmente,
  executar asserções em JavaScript no console e comparar resultados. Isso já pegou bugs reais
  (o tipo duplicado em mono-tipos, o viewport ausente), mas não é regressão automatizada.
- **Os scripts `.ps1` devem permanecer em ASCII puro.** PowerShell 5.1 lê arquivos sem BOM
  usando a codepage do sistema; um travessão em um comentário quebra o parser com erros
  confusos de "token inesperado". Textos acentuados ficam no template HTML, que é lido como UTF-8
  explicitamente.
- **Dois scripts editam arquivos de dados in-place** (`slim_dex.ps1`, `expand_combo_abilities.ps1`)
  e não fazem parte do `build.ps1`. Isso é frágil por design atual — ver §9.9.

---

## 14. O que eu gostaria de saber ao final da auditoria

1. Existe algum caminho pelo qual o usuário **perca dados** que eu não tenha coberto?
2. A análise de fraquezas de tipo (§9.4) é **enganosa a ponto de valer removê-la**?
3. Qual é o **próximo maior risco** deste projeto, na sua avaliação — e não necessariamente algo
   que eu já tenha listado?
4. Alguma decisão da §5 está **objetivamente errada**?
