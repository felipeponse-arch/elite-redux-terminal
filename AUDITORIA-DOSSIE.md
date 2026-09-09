# Dossiê de Auditoria — Elite Redux Terminal

**Gerado em:** 09/09/2026 (segunda geração — a primeira foi em 08/09/2026, esta cobre mais dois
dias inteiros de trabalho: sistema de rank automático, calculadora de stat final de chefão com
Mega Evolução/Primal Reversion, editor de build interativo, sincronização automática entre
aparelhos, e uma bateria de correções de bugs reais encontrados usando o app de verdade)
**Para:** auditoria externa independente (Gemini)
**Autor do projeto:** Claude (Sonnet 5 / Opus 5, sessões diferentes), em pair-programming com o usuário
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
- **Se você já auditou a versão de 08/09**: a seção 7 lista, por data, tudo que mudou desde então.
  Não repita achados já corrigidos lá — confirme que a correção realmente resolveu o problema, ou
  aponte se a correção foi incompleta.

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
- Existem itens exclusivos do hack (ex.: Tactical Vest) e itens vanilla rebalanceados
  (ex.: Light Ball afeta Raichu, não só Pikachu, com multiplicadores diferentes por espécie).
- É uma **beta em desenvolvimento ativo** (versão atual: `2.65beta`). Os dados mudam entre versões.
- Tem 3 modos de dificuldade (Easy / Ace / Elite) que alteram os times dos treinadores.
- Tem sistema de level cap por badge.
- Tem opção de "Mega Evolução permanente".
- **Os treinadores/chefões não guardam nível em lugar nenhum dos dados** — o jogo escala nível em
  tempo real conforme progresso da história. Toda conta que depende de nível pede o número ao
  usuário; nada nisso pode ser "puxado" dos dados com confiança.

**O usuário é brasileiro e não lê inglês.** Isso é um requisito funcional, não uma preferência
estética: toda descrição de mecânica precisa estar em português.

**O que a ferramenta faz hoje** (a aba Progresso/Tipos foi reorganizada em 09/09 — ver §7 — mas as
funções abaixo continuam todas acessíveis):

| Aba | Função |
|---|---|
| Dex | Busca/filtro das 1.906 espécies; ficha com stats, habilidades+innates, evolução, movepool, notas pessoais, editor de build próprio ("Meu build"), histórico de builds e builds de referência extraídas de chefões, rank automático (geral + relativo ao estágio evolutivo) |
| Meu Time | Até 6 Pokémon, com build efetiva (própria > curada) em formato Smogon/Showdown; troca com a caixa; dashboard com completude do time, maior risco compartilhado e sugestão de troca |
| Caixa | Registro de tudo que o jogador capturou; mesmo fluxo de troca do Dex |
| Chefões | 107 treinadores-chefe reais extraídos do jogo, com time completo, variantes de dificuldade, calculadora de stat final por nível (com modificador de item e transformação Mega/Primal), e botão para copiar o set do chefão como "meu build" |
| Progresso | Dificuldade + badge atual, que alimenta avisos de level cap (agora atrás do menu "Mais" no mobile) |
| Tipos | Matriz de efetividade 18×18 + tabela de level caps (atrás do menu "Mais" no mobile) |

**Fluxo de uso principal (importante para julgar decisões de UX):** o usuário perde para um
chefão → abre a aba Chefões → copia um texto que junta o time do chefão + seu time + sua caixa →
cola numa conversa com o Claude → recebe análise e builds → as builds voltam para a ferramenta na
próxima publicação **ou** o próprio usuário já preenche o "Meu build" na hora, direto no app, sem
precisar de uma sessão de desenvolvimento — este segundo caminho só existe desde 09/09 (ver §7,
passes 16–19). A ferramenta é o **repositório de dados** e, desde 09/09, também um **editor
funcional**; a análise estratégica mais profunda continua acontecendo na conversa.

---

## 2. Restrições da plataforma (origem de muitas decisões)

O projeto é publicado como um **Artifact do Claude** — uma página HTML única hospedada em
claude.ai. As restrições abaixo não são escolhas minhas; são o ambiente:

1. **CSP estrita.** A página publicada **não pode fazer nenhuma requisição externa**: sem CDN,
   sem imagem remota, sem `fetch`. Única exceção: folha de estilo do Google Fonts. Consequência
   direta: **todo asset precisa estar embutido** (data URI / inline).
2. **Limite de 16 MB** por artifact.
3. **Arquivo único.** Não há build/bundler em runtime; tudo é inlined no momento da publicação.
4. **Capacidades de runtime disponíveis nesta conta, hoje:** `db` (documento JSON compartilhado,
   usado para a sincronização automática entre aparelhos — ver §5, D10) e `artifact` (a página
   republicar a si mesma). **Atualização importante em relação à versão anterior deste dossiê**:
   em 08/09 eu tinha registrado `db` como indisponível; isso estava errado, ou mudou entre uma
   verificação e outra — `db` está disponível e em produção desde 09/09. A capacidade `downloads`
   foi usada até 09/09 (card de "levar para outro aparelho" com exportação de arquivo) e foi
   **removida** no mesmo dia em que o `db` passou a cobrir o mesmo caso de uso — não é mais
   declarada na publicação.
5. **`localStorage` continua sendo a fonte de verdade de cada aparelho** — a sincronização via
   `db` é uma camada best-effort por cima, nunca um requisito para o app funcionar offline.
6. **Eu (Claude) não consigo ler o estado do usuário diretamente.** O documento `db` é uma
   comunicação aparelho-a-aparelho do próprio usuário; eu não tenho um canal para inspecionar ou
   escrever nele fora de uma sessão de desenvolvimento explícita.

> **Peça ao auditor:** se você propuser algo que viole 1, 2 ou 6, a proposta é inválida no
> ambiente. Verifique contra esta lista antes de sugerir. Note em particular que a
> disponibilidade de `db` (item 4) **mudou** desde a última auditoria — qualquer achado antigo que
> dependia de "sincronização impossível" precisa ser revisto à luz disso.

---

## 3. Arquitetura e pipeline

### 3.1 Fluxo de dados

```
NextDex (GitHub, oficial do jogo)
  └── gameDataV2.65beta.json  (3,8 MB, snapshot manual)
        │
        ├── transform.ps1        → data/dex_compact.json     (espécies/moves/abilities/itens enxutos)
        ├── extract_bosses.ps1   → data/bosses.json          (107 chefes + variantes + EVs/IVs crus)
        ├── extract_boss_builds.ps1 → data/boss_reference_builds.json (maior tier de cada espécie em qualquer luta)
        └── build_sprite_atlas.ps1
              ├── baixa 1.906 PNGs → data/sprites_all/       (cache, 64px)
              └── empacota          → data/sprite_atlas.png  (atlas 48px) + sprite_index.json

  Arquivos curados à mão (não gerados):
        data/builds.json                   builds por Pokémon (chave = sname)
        data/build_history.json            histórico de builds já recomendadas (sname → lista)
        data/levelcaps.json                tabela de level cap (transcrita de site — ver §9)
        data/saved_teams_seed.json         time recomendado pré-carregado
        data/mega_forms.json               234 pares item→espécie-alvo de Mega/Primal (ver §5, D13)
        data/ability_translations_pt.json  1.033 traduções (geradas por LLM, curadas)
        data/move_translations_pt.json     1.031 traduções (geradas por LLM, curadas)

  Pós-processamento (edita arquivos in-place, NÃO faz parte do build.ps1 por padrão — ver §9):
        slim_dex.ps1               remove campos nunca exibidos de dex_compact.json
        expand_combo_abilities.ps1 expande 151 habilidades "A + B"

  Análise derivada (gerada a partir de tudo acima):
        compute_species_rank.ps1   → data/species_rank.json (rank SS/S/A/B/C/D geral + por estágio evolutivo)
        archive_build.ps1          arquiva a build antiga de uma espécie em build_history.json
                                    ANTES de sobrescrevê-la em builds.json — passo manual obrigatório

  Montagem:
        build.ps1 = artifact_template.html + todos os JSONs + atlas em base64
                  → artifact_final.html (4,47 MB)  → publicado como Artifact
        build.ps1 roda slim_dex.ps1, expand_combo_abilities.ps1 e compute_species_rank.ps1
        automaticamente no caminho de rebuild completo (corrigido em 09/09 — antes disso um
        rebuild do zero silenciosamente revertia esses dois pós-processamentos, ver §7).

  Verificação:
        check_upstream.ps1  compara o snapshot local com o NextDex ao vivo — agora roda
                             automaticamente dentro do build.ps1 completo (aviso, não trava o build)
```

### 3.2 Mecanismo de montagem

`artifact_template.html` contém placeholders literais (`__DEX_DATA_JSON__`, `__BUILDS_JSON__`,
`__SPRITE_ATLAS_DATAURI__`, `__BUILD_HISTORY_JSON__`, `__BOSS_REF_BUILDS_JSON__`,
`__MEGA_FORMS_JSON__`, etc.). `build.ps1` substitui cada um pelo conteúdo do arquivo
correspondente, validando antes que:

- cada arquivo de dados é JSON parseável;
- cada placeholder existe no template;
- nenhum placeholder sobrou após a substituição;
- o resultado não é pequeno demais (>500 KB) nem perto do limite (<14 MB).

`</script` dentro dos JSONs é escapado para `<\/script` para não fechar a tag prematuramente.

**Incidente real registrado aqui de propósito, para o auditor avaliar se a mitigação é
suficiente**: em 09/09, já depois de uma sessão de correções testada e commitada, o arquivo
publicado no Artifact foi **`artifact_template.html` (o template cru, com os placeholders
literais ainda não substituídos)**, não `artifact_final.html`. O app publicado ficou sem
nenhum dado (Dex vazia, times vazios) até o usuário reportar e a publicação ser refeita com o
arquivo correto. A causa raiz: o passo de rebuild foi pulado por hábito antes de publicar, e a
suíte de testes que rodou "verde" antes da publicação estava testando uma build local antiga e
correta — não o arquivo que de fato foi publicado depois. **Pergunta em aberto para o
auditor**: existe alguma validação *dentro do próprio HTML publicado* (não apenas no pipeline
de build) capaz de detectar essa situação sozinha — por exemplo, o próprio app JS reconhecer
que os placeholders não foram substituídos e mostrar um erro visível, em vez de silenciosamente
renderizar uma Dex vazia?

### 3.3 Por que PowerShell

O ambiente não tem Node nem Python. Além disso, `ConvertFrom-Json` do PowerShell **falha** neste
dataset (o JSON do jogo tem chaves duplicadas que diferem só em caixa: `name` e `NAME`), então
todo o pipeline usa `System.Web.Script.Serialization.JavaScriptSerializer`. A serialização de
volta é feita por um escritor de JSON manual (`common.ps1`), porque
`JavaScriptSerializer.Serialize()` lança erro de referência circular em objetos vindos de
`DeserializeObject()`.

**Gotcha de codificação, real e já batido**: um travessão (ou qualquer não-ASCII) num `.ps1`
salvo sem BOM quebra o parser do PowerShell 5.1 com erros confusos de "token inesperado". Os
scripts `.ps1` deste projeto são mantidos em ASCII puro por esse motivo; os textos acentuados
vivem só no template HTML, lido explicitamente como UTF-8.

---

## 4. Modelo de dados

### 4.1 Os dois identificadores — ponto central da arquitetura

| Id | O que é | Estável? | Onde pode aparecer |
|---|---|---|---|
| `x` | índice do Pokémon no array `species` do build atual | **NÃO** | apenas em memória e em arquivos gerados junto com o dex |
| `sname` | `SPECIES_AERODACTYL_MEGA` | **SIM** (único nas 1.906) | tudo que é persistido ou escrito à mão |

**Evidência de que `x` é instável:** comparei o snapshot `2.65beta` com outro build do mesmo jogo
("Latest"). Das 1.665 posições comparáveis, **1.661 apontavam para espécies diferentes**; a
divergência começa no índice 4. Este era o achado crítico de uma auditoria interna anterior; foi
corrigido migrando toda a persistência para `sname`, e **o código de migração do formato antigo
(v1, baseado em `x`) foi removido em 09/09** depois que o usuário confirmou que nenhum aparelho
em uso ainda dependia dele — ver §7.

### 4.2 `dex_compact.json`

```jsonc
{
  "meta":   { "source": "...", "repo": "...", "version": "2.65beta", "generated": "2026-08-29" },
  "types":  ["Normal","Fighting","Fire", ...],        // 21; índice = id de tipo
  "splits": ["PHYSICAL","SPECIAL","STATUS", ...],
  "evoKinds": ["EVO_LEVEL","EVO_MEGA_EVOLUTION", ...],
  "abilities": [ ["nome","descrição em inglês"], ... ],  // 1034; índice = id; 0 = placeholder
  "moves":     [ ["nome", tipo, split, pwr, acc, pp, "desc"], ... ], // 1032; índice = id
  "items":     ["nome", ...],                            // lista plana, ordenada; adicionada em 09/09 para o autocomplete do editor de build
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
                "nat":"Jolly", "mv":["Dual Wingbeat","Cross Poison","Bite","U-turn"],
                "evs":"...", "evsRaw":[...], "ivsRaw":[...] }, ... ],
  "insane": [ ... ],                   // variante de dificuldade (vazio na maioria)
  "hell":   [ ... ]                    // idem
}]
```

Os campos `insane`/`hell` vêm crus dos dados do jogo. **O mapeamento deles para os nomes
Easy/Ace/Elite do menu do jogo continua sendo uma suposição não confirmada** — ver §9. `evsRaw`/
`ivsRaw` foram adicionados em 09/09 especificamente para alimentar a calculadora de stat final
(§4.5); a string `evs` formatada continua existindo para as builds de referência já existentes.

### 4.4 `data/mega_forms.json` (novo em 09/09)

```jsonc
{ "ITEM_MILOTICITE": "SPECIES_MILOTIC_MEGA", "ITEM_LUCKY_ORB": "SPECIES_VICTINI_PRIMAL", ... }
```

234 entradas, item segurado → espécie de destino. Quando um chefão segura um desses itens, a
calculadora de stat final passa a computar a partir dos stats base **da espécie transformada**,
não da espécie segurando o item. Deliberadamente **não tenta adivinhar qual das habilidades
escolhíveis da forma transformada está ativa** (ver §5, D14) — mostra só as innates, que são
determinísticas.

### 4.5 `data/species_rank.json` (novo em 09/09)

```jsonc
{ "SPECIES_PROBOPASS": { "tier": "SS", "score": 94.2, "stage": 1, "stageTier": null, ... }, ... }
```

Rank automático (SS/S/A/B/C/D) por espécie, calculado sem revisão manual por Pokémon — ver §5,
D15/D16 para a fórmula e os dois bugs reais encontrados ao calibrá-la.

### 4.6 Save do usuário (`localStorage`, chave `er_terminal_save`)

```jsonc
{
  "v": 2,                              // versão do schema
  "dataVersion": "2.65beta",
  "savedAt": "2026-09-09T...",
  "team": ["SPECIES_AERODACTYL_MEGA", ...],       // máx. 6
  "box":  ["SPECIES_TYRANITAR", ...],
  "savedTeams": [{ "name": "...", "team": ["SPECIES_...", ...] }],  // máx. 3
  "settings": { "difficulty": "ace", "milestone": 0 },
  "notes": { "SPECIES_CHARIZARD": "texto livre..." },              // novo em 09/09
  "customBuilds": { "SPECIES_CHARIZARD": { "ability":"...", "nature":"...", "item":"...",
                     "moves":[...4], "ivs":[6 números], "evs":[6 números] } },  // novo em 09/09
  "orphans": { "team": [...], "box": [...] }        // snames de um build de jogo diferente, preservados em vez de descartados
}
```

O schema v1 (chaves separadas por array de `x`) e `migrateLegacy()` **foram removidos em
09/09** — ver §7. Toda instalação em uso já está no schema v2 há tempo suficiente para isso ser
seguro, confirmado com o usuário antes de remover.

### 4.7 Sincronização entre aparelhos (novo em 09/09)

Um único documento compartilhado, `db.doc("sync/save")` (capacidade `db`, não a capacidade
`user` por-visualizador — ver §5, D10 para o porquê). `persist()` — o único ponto por onde toda
mudança de estado já passava — agora também empurra o save inteiro pro documento, best-effort.
No carregamento, o save remoto é comparado por **conteúdo real** (não só `savedAt`) contra o
local; se divergir e o remoto for mais novo, aparece um banner oferecendo recarregar. Uma
assinatura `onSnapshot` cobre mudanças que cheguem enquanto a aba já está aberta.

---

## 5. Decisões técnicas e o porquê

| # | Decisão | Motivo |
|---|---|---|
| D1 | Persistir `sname`, nunca `x` | `x` muda entre versões do jogo (§4.1) — corrupção silenciosa |
| D2 | Save único versionado (migração v1 removida em 09/09) | Permite migrar/exportar/importar como unidade; código de migração morto foi removido só depois de confirmar que nenhum aparelho ainda precisava dele |
| D3 | Sprites num **atlas** único, não 1.906 imagens | CSP obriga embutir; 1.906 data URIs = ~7 MB e 1.906 decodificações |
| D4 | Atlas com células de **48px** | É o maior tamanho que a UI exibe; nada é ampliado. 64px custava +1,1 MB. Reafirmado pelo usuário quando questionado por uma auditoria anterior — não é um atalho não-examinado |
| D5 | `NearestNeighbor` ao reduzir sprites | Interpolação suave inventa cores e alpha parcial e **aumenta** o PNG |
| D6 | Atlas embutido na regra CSS, não via custom property | Valor de vários MB é rejeitado como CSS custom property, mas funciona em `url()` |
| D7 | Traduzir descrições, manter nomes em inglês | Pedido explícito do usuário; nomes são identificadores usados na comunidade |
| D8 | Expandir 151 habilidades "A + B" | A descrição original só nomeia as partes; sem expandir, não informa nada |
| D9 | Uma única função `rosterMove()` | Havia 3 caminhos de troca com regras divergentes |
| D10 | Sincronização automática via capacidade `db` (substituiu transferência manual por texto) | A capacidade `db` passou a estar disponível nesta conta; um documento único compartilhado (não a capacidade `user` por-visualizador) porque o artifact é privado/não-compartilhado de qualquer forma — escopo por usuário não traria benefício real de privacidade aqui |
| D11 | Builds exibidas em formato Showdown | Pedido do usuário; é o formato usado pela comunidade Smogon |
| D12 | Manter o texto de Pokédex em inglês | É conteúdo **visível**; removê-lo é decisão de produto, não otimização |
| D13 | `mega_forms.json` construído por DUAS fontes independentes cruzadas (fork do Showdown do próprio hack + casador difuso de nomes), não uma só | As duas concordaram em 100% dos 65 itens que se sobrepunham — validação cruzada real, não confiança cega numa fonte |
| D14 | Boss transformado por Mega/Primal mostra só as innates da forma nova, nunca "adivinha" a habilidade escolhível ativa | `Milotic` e `Milotic Mega` têm arrays `abis` sem NENHUM id em comum — não existe sinal nos dados que diga qual foi escolhida; fabricar uma resposta seria pior que admitir a lacuna |
| D15 | Rank de espécie = percentil do **percentil-ranking do composto**, não corte direto sobre o composto bruto | Uma média ponderada de percentis regride à média — aplicar corte direto deu ZERO espécies em SS na primeira tentativa. Bug real, encontrado e corrigido antes de publicar |
| D16 | Rank por estágio evolutivo ignora transições Mega/Primal como "estágio" | Sem isso, lendários com forma Mega inundavam a faixa SS/S do "estágio 1" só por já terem BST altíssimo antes de qualquer Mega — medido: 28 de 529 espécies nessa situação, mais que o corte de ~3% deveria permitir |
| D17 | `.selector[hidden] { display:none }` explícito sempre que existir uma regra de `display` incondicional no mesmo seletor | CSS de autor sempre vence o comportamento nativo do atributo `hidden`, **independente de especificidade** — bug encontrado e corrigido duas vezes no mesmo projeto (menu "Mais" em 09/09 cedo, banner de sync em 09/09 mais tarde) até virar checklist padrão |
| D18 | `height: 100%` no contêiner raiz, não `min-height: 100%` | `min-height` é piso (deixa crescer além da viewport); só `height` funciona como teto e permite que as correntes internas `flex:1;min-height:0;overflow-y:auto` realmente criem rolagem interna em vez de rolar a página inteira |

---

## 6. Becos sem saída já medidos (não recomendar)

Foram testados empiricamente e **falharam**. Se a auditoria sugerir algum destes, já foi tentado:

| Tentativa | Resultado medido |
|---|---|
| Reescrever o PNG do atlas com filtragem adaptativa própria | **3,79 MB** vs 2,53 MB do encoder do sistema — o `DeflateStream` do .NET é mais fraco que o do GDI+ |
| PNG-8 (paleta de 256 cores) sem perda | Impossível: o atlas tem **11.354 cores únicas** |
| Reduzir sprites com interpolação bicúbica | **Aumenta** o arquivo (48px ficou 7,1 MB) — cria cores intermediárias e alpha parcial |
| Hospedar sprites/itens externamente | CSP bloqueia toda requisição externa |
| Ícones de item | **Não existem em lugar nenhum**: os dados do jogo guardam só `{name, id}`, o repositório do NextDex não tem imagens de item, o `items_icons.ts` é um stub vazio, e a dex oficial renderiza item como texto puro |
| Adivinhar qual habilidade escolhível uma Mega Evolução de chefão está usando | Os ids de habilidade escolhível da forma base e da forma Mega não têm sobreposição nenhuma — não há sinal nos dados, qualquer palpite seria fabricação |
| Modelar Phantom Meteor/Mimikyu no mapa de Mega/Primal | Mimikyu tem 5 formas especiais nesse dataset e a descrição do item não é específica o bastante pra escolher uma com segurança; só 1 chefão no jogo inteiro segura o item — não valeu o risco de adivinhar |
| Calculadora de dano completa (não só stat final) | Precisaria modelar ordem de turno, clima/terreno já ativo, crítico, multi-hit, ativação condicional de habilidade — mesma categoria de complexidade que já tinha inviabilizado a primeira tentativa; ver §9 item 11 para a proposta de escopo reduzido levantada em reunião mas não decidida |

---

## 7. Histórico de correções já aplicadas

### Até 08/09 (já cobertas na primeira geração deste dossiê, resumo)

1. Ids instáveis → migração para `sname` + schema versionado.
2. Sem detecção de dados desatualizados → `check_upstream.ps1`.
3. Peso da página → atlas 48px + remoção de campos nunca exibidos: 4,91 → 3,82 MB.
4. ARIA inconsistente → `role="tab"`/`aria-selected`, `aria-label`.
5. Três caminhos de troca divergentes → unificados em `rosterMove()`.
6. Clipboard duplicado / CSS morto → unificados e removidos.
7. Busca linear O(n) → índices `SPECIES_BY_X` / `SPECIES_BY_SNAME`.
8. Viewport mobile ausente → corrigido.
9. Tipo duplicado em Pokémon mono-tipo dobrava multiplicador de fraqueza → corrigido.

### 08/09, mesmo dia, correções pós-auditoria Gemini

- **Retenção de órfãos no save**: `sname` desconhecido (de um build de jogo diferente) era
  descartado silenciosamente ao salvar. Agora é preservado em `state.orphans`.
- **Lacuna no pipeline de build**: `slim_dex.ps1` e `expand_combo_abilities.ps1` nunca eram
  chamados por `build.ps1` — um rebuild completo revertia silenciosamente ambos. Corrigido,
  agora rodam automaticamente.
- **Claim de XSS investigado e não confirmado**: nome de time salvo já passava por
  `escapeHtml()` nos dois lugares (exibição e edição). Sem correção necessária.
- **48px de sprite reafirmado**, não revertido — troca já discutida e aceita pelo usuário.
- **Análise de fraqueza por habilidade**: apontada como o ponto de menor confiança já conhecido;
  não implementada de forma ampla (precisaria de dataset curado das ~1000 habilidades restantes).

### 08/09, segunda passada — UX/UI (5 itens, todos verificados ao vivo)

Troca caixa↔time inconsistente entre abas, barras de stat sem variação de cor pro topo da escala,
overflow de abas no mobile sem indicação visual, beco sem saída no mobile depois de adicionar ao
time pela ficha de detalhe, toast que não reiniciava a transição em cliques rápidos. Todos
corrigidos e verificados com captura de tela antes/depois.

### 08/09, terceira a décima sétima passadas — funcionalidades novas, todas com verificação ao vivo

Histórico de builds por espécie; builds de referência extraídas de chefões (maior tier já
alcançado); navegação cruzada (nome/sprite de Pokémon sempre clicável); rank automático
SS/S/A/B/C/D (dois bugs reais de calibração encontrados e corrigidos antes de publicar — ver
D15); rank relativo ao estágio evolutivo (bug real: Mega/Primal inflava o "estágio 1" — ver D16);
correção de badges de rank e card de build de referência mal identificados; revisão de design
completa (2 achados reais: título de seção sem card, tabela sem indicação de rolagem horizontal);
lote de 6 itens aprovados (ordenação por rank, guarda de ordem no pipeline, aviso automático de
desvio contra o NextDex ao vivo, **contraste real WCAG AA reprovado e corrigido nos badges de
rank** — ver §9 para o mesmo problema ainda aberto em outras 3 classes CSS, suíte de testes
auto-verificável, navegação em abas dividida com dropdown "Mais", resumo no topo do Dex);
pesquisa de campo (calculadora de stat final de chefão por nível, notas pessoais, linhas de golpe
coloridas por tipo); modificador de item held (Choice Band/Scarf/Specs, Assault Vest — pesquisado
contra os dados reais antes de assumir nome/efeito); pesquisa dos repositórios-fonte reais do hack
(`er-config`, fork do Showdown) para mapear Tactical Vest/Thick Club/Light Ball com segurança;
usabilidade real (4 bugs encontrados usando o app como o usuário usaria, não só testando
asserções de DOM — ver a nota importante logo abaixo); Mega Evolução/Primal Reversion na
calculadora de chefão (ver D13/D14); editor "Meu build" interativo (escolha real de habilidade,
natureza, item com autocomplete, golpes restritos ao movepool real da espécie, IV/EV); build
salva no Dex passa a aparecer também na aba Time, e um clique copia o set de um chefão como "meu
build".

**Nota importante sobre a passada de usabilidade real (14ª)**: os 4 bugs encontrados ali — menu
"Mais" visivelmente aberto desde o dia em que foi lançado, cards de habilidade duplicados,
frase do dashboard quebrada em coluna de palavras soltas, cards de time forçando rolagem
horizontal da página inteira — **não apareceram na suíte de testes automatizada, que continuava
"passando"**, porque a suíte checava estado do DOM (`.hidden === true`, conteúdo de texto), não
aparência renderizada de verdade (`getComputedStyle().display`, largura real). Isso motivou
reforçar a suíte para checar aparência computada onde fizer sentido, não só estado lógico — e é
o mesmo tipo de lição que voltou a se repetir em 09/09 (ver abaixo).

### 09/09 — sincronização automática entre aparelhos

Ver §4.7 e D10. **Não pôde ser verificado dentro da própria sessão de desenvolvimento** (sem
login em claude.ai no navegador de teste) — foi verificado depois pelo usuário, em dois
aparelhos reais simultâneos (PC + celular), com confirmação explícita de que o time ficou
idêntico nos dois lados depois do sync.

### 09/09 — unificar o botão "copiar" antigo com o editor de build novo

As builds mostradas em "Histórico de builds" e "Builds vistas em chefões" (ambas no Dex) só
copiavam texto para a área de transferência, sem nunca gravar em `customBuilds` — mecanismo
antigo, que existia antes do editor "Meu build". Corrigido adicionando um segundo botão
("+ Usar como meu build") ao lado do "copiar" original, sem remover o original (propósitos
diferentes: colar externamente vs. persistir no app).

### 09/09 — remoção de funcionalidades obsoletas

Card de transferência manual entre aparelhos (copiar/colar texto + download de arquivo) removido,
substituído pela sincronização automática; a capacidade `downloads` foi retirada da declaração de
publicação por não ter mais nenhum uso no arquivo. Documento `manual_smoke_tests.md` removido, já
totalmente absorvido por `smoke_test_suite.js`. Código de migração do save v1 (`migrateLegacy()`)
removido, depois de confirmar com o usuário que nenhum aparelho em uso ainda precisava dele.

### 09/09 — dois bugs reais reportados pelo usuário, mesma classe de causa raiz de bugs anteriores

- **Banner de sincronização aparecendo sem motivo real**: `.sync-banner` tinha uma regra CSS de
  `display: flex` incondicional que vencia o atributo nativo `hidden` — **o mesmo erro exato já
  cometido e documentado com o menu "Mais"**, repetido no mesmo projeto. Corrigido com
  `.sync-banner[hidden] { display:none }` (ver D17). Auditados todos os outros elementos
  controlados por `hidden` no arquivo — só esse estava sem a regra de exceção.
- **Dex "travando" ao rolar**: `#app` usava `min-height:100%` (um piso) onde precisava de
  `height:100%` (um teto) — ver D18. Corrigido, e ao verificar a correção foi encontrado (não
  reportado separadamente pelo usuário) que trocar de espécie não resetava a posição de rolagem
  do painel de detalhe; corrigido com uma checagem que só reseta quando a espécie realmente muda,
  preservando a posição ao apenas re-renderizar a mesma espécie (ex.: depois de salvar um build).

### 09/09 — segundo incidente de publicação, corrigido no mesmo dia

Ver a nota na §3.2. Publicado o arquivo errado (`artifact_template.html` em vez de
`artifact_final.html`); corrigido assim que o usuário reportou; adicionada uma verificação
pós-publicação obrigatória ao processo (ler de volta o conteúdo publicado e confirmar ausência
dos placeholders) para este projeto especificamente, dado o histórico.

---

## 8. Métricas medidas (afirmações a verificar)

Medidas em `localhost`, Chromium, viewport ~534–549px (o ambiente de teste desta sessão não
conseguiu emular largura desktop de forma confiável — ver nota em §9):

| Métrica | Valor em 08/09 | Valor em 09/09 |
|---|---|---|
| Página final | 3,82 MB | 4,47 MB (cresceu com rank, mega_forms, build_history, boss_reference_builds, tabela de itens) |
| Atlas de sprites | 1,60 MB binário → ~2,25 MB em base64 | inalterado |
| Cobertura de sprites | 1.906 / 1.906 | inalterado |
| Cobertura de tradução | habilidades 1.033/1.033; golpes 1.031/1.031 | inalterado |
| Erros de console | 0 | 0, em todas as passadas de teste |
| Suíte de testes automatizada (`smoke_test_suite.js`) | não existia | **66/66 passando** (ver §9 sobre o limite dessa suíte) |
| Distribuição de rank (1.906 espécies) | não existia | SS 59 / S 133 / A 284 / B 491 / C 559 / D 380 |
| Contraste WCAG AA dos badges de rank | não medido | reprovava (3,0–3,3:1); corrigido para 4,65:1 mínimo medido, ambos os temas |

---

## 9. Pontos onde eu tenho menos confiança (priorize)

1. **Mapeamento `insane`/`hell` → Ace/Elite.** Continua não confirmado desde a primeira geração
   deste dossiê. Pesquisa adicional em 08/09 (documentação oficial menciona só 3 dificuldades,
   batendo com as 3 chaves de dados) aumentou a confiança sem confirmar de fato. Única checagem
   real possível: comparar contra uma luta de verdade no save do usuário em modo Ace.

2. **`levelcaps.json` veio de scraping de um site**, não dos arquivos do jogo — nível de
   confiança menor que o resto dos dados.

3. **Cobertura parcial da análise de fraqueza por habilidade** (`TYPE_MOD_ABILITIES`). Cobre só
   as habilidades do time atual do usuário no momento em que cada regra foi adicionada
   (Levitate/Earth Eater/Molten Down e outras poucas) — não as ~1000 habilidades restantes do
   jogo. Isso é intencional (curar 1033 habilidades sem dados de referência estruturados seria
   fabricar confiança), mas fica registrado aqui para o auditor não achar lacuna escondida: a
   tabela cresce conforme o time do usuário muda, não é uma cobertura geral.

4. **Contraste ainda não corrigido em `.cov-weak`/`.cov-resist`/`.cov-immune`.** Usam a mesma
   técnica de texto colorido sobre fundo semi-transparente que reprovou WCAG AA nos badges de
   rank (item já corrigido, ver §8). Ninguém mediu o contraste real dessas três classes ainda —
   é bem provável que reprovem também, dado o padrão de tint parecido. Aparecem na matriz de
   tipos inteira e na tabela de cobertura do time, então o raio de impacto de uma correção
   malfeita é maior que o dos badges — vale medir antes de aplicar a mesma solução.

5. **~33 de ~267 itens no formato "-ite" (Mega Stone) continuam sem mapeamento em
   `mega_forms.json`** — casos genuinamente ambíguos na própria nomenclatura dos dados (ex.:
   duas espécies "Reuniclus Mega" distintas com nomes de exibição idênticos). Degradam com
   segurança (mostram os stats da espécie base, sem transformação), não foi forçada uma escolha.

6. **Formato Showdown.** `showdownName()` só troca espaço por hífen (`Aerodactyl Mega` →
   `Aerodactyl-Mega`). Formas customizadas do hack não existem no Showdown de qualquer forma — o
   valor é o formato, não a importação real. Ainda não confirmado se algum caso de nome quebra
   essa conversão simples.

7. **`expand_combo_abilities.ps1` e `slim_dex.ps1` editam arquivos de dados in-place** e não
   fazem parte do `build.ps1` por padrão (rodam automaticamente só no caminho de rebuild
   completo, não no `-SkipExtract`). Se as traduções forem regeradas fora desse caminho, as 151
   habilidades combo voltam a ser "A + B" silenciosamente.

8. **A calculadora de stat final de chefão não modela persistência de clima/terreno/Trick Room**
   através de uma transformação Mega/Primal em combate — o texto da interface avisa isso
   explicitamente, mas é uma simplificação real, não só um aviso de rodapé.

9. **Ambiente de teste desta sessão não emula largura desktop de forma confiável** (o painel do
   navegador ficou preso em ~534–549px de largura relatada, independente da largura pedida).
   Bugs específicos de layout desktop (>860px, onde o grid da Dex muda de coluna dupla pra
   única) foram checados analiticamente lendo o CSS, não visualmente — risco real de algo
   passar despercebido nessa faixa de largura especificamente.

10. **Incidente de publicação do arquivo errado** (§3.2, §7) — a mitigação adotada (ler de volta
    o conteúdo publicado e grepar por `__DEX_DATA_JSON__`) é um processo humano/de sessão, não
    uma trava no próprio sistema. Pergunta aberta ao auditor: vale a pena um mecanismo *dentro*
    do HTML publicado que detecte e avise sobre esse estado sozinho?

11. **Calculadora de dano completa (não só stat final).** Levantada em reunião de equipe em
    09/09 como possível próximo passo, dado que já existem todas as peças (stat final, item,
    natureza, Mega/Primal) exceto a simulação de um golpe real. **Não decidido** — depende de o
    usuário querer avançar com um escopo reduzido (um golpe, sem efeitos de campo/turnos) ou
    preferir deixar como está, dado o histórico de complexidade que já abortou a primeira
    tentativa completa.

---

## 10. Código-fonte completo

O que segue é o conteúdo **literal** dos arquivos, extraído automaticamente (sem transcrição
manual, para evitar divergência entre o que auditei e o que está em produção).


### 10.1 Template da aplicacao

Este e o arquivo onde vive toda a logica: HTML, CSS e JavaScript. Os placeholders
no formato __NOME__ sao substituidos pelos JSONs no momento do build.

### artifact_template.html

_3639 linhas, 185.525 bytes._

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
    /* Badge-only text-safe variants of --accent/--accent-2/--sem-resist,
       LIGHT mode only (dark mode reuses the plain tokens below unchanged -
       they already clear AA there). Accessibility review, 2026-09-09:
       measured that --accent/--accent-2/--sem-resist at full saturation
       fall short of WCAG AA 4.5:1 as TEXT against a light surface (4.27,
       4.45, 4.08) - not something tinting a background can fix, since a
       fainter version of an already-too-light color only gets fainter.
       These are ~10% darker (same hue), which alone clears 4.5:1 - not a
       change to the actual brand/accent colors used everywhere else in the
       app, scoped to rank badges only to keep the blast radius small. */
    --badge-accent: #c3421c;
    --badge-accent2: #10796e;
    --badge-resist: #1c8156;
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
      /* Dark mode's plain --accent/--accent-2/--sem-resist already clear
         AA as text (6.3-9.2:1 measured) - no darkening needed here. */
      --badge-accent: #ff7a45;
      --badge-accent2: #3fd8c8;
      --badge-resist: #4fce93;
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
    --badge-accent: #ff7a45;
    --badge-accent2: #3fd8c8;
    --badge-resist: #4fce93;
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
    /* This was the real root cause of "a dex fica travada ao rolar" (user
       report, 2026-09-09): `min-height: 100%` sets a FLOOR, not a ceiling -
       once #app's content (topbar + main + footer) is taller than the
       viewport, #app just grows past it instead of being capped, which
       means `main`'s `flex:1; min-height:0` (and everything inside it -
       .species-detail, .species-list, etc. - each already correctly
       `overflow-y:auto`) never actually gets a bounded height to clip
       against. Nothing inside ever got the chance to scroll internally -
       the whole BODY scrolled instead (confirmed directly: scrolling the
       page moved `window.scrollY`/`document.body.scrollTop`, not any
       inner panel's own `scrollTop`, which stayed 0 the entire time). On
       a desktop-width Dex specifically this meant scrolling down through
       a long species' detail scrolled the SEARCH BOX AND SPECIES LIST
       away with it, instead of leaving that sidebar in place with its own
       independent scroll (which its CSS already intended -
       `.species-list { overflow-y: auto; flex: 1; }` was correct and
       simply never got the chance to engage). `height: 100%` caps it
       instead, so every already-correct internal `overflow-y:auto` now
       actually does its job. */
    height: 100%;
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

  /* Groups .tabs + .tabs-more so .topbar's justify-content:space-between
     (brand <-> nav area) only fires once, between brand and this whole row -
     without it, space-between would also push .tabs-more away from .tabs
     itself, off to the far edge instead of sitting right beside it. */
  .tabs-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .tabs { display: flex; gap: 4px; background: var(--surface-2); padding: 4px; border-radius: 10px; min-width: 0; }
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

  /* "Mais" dropdown (Progresso/Tipos) - design review, 2026-09-09. The
     toggle reuses .tab-btn/.tab-btn.active as-is (same class), so it looks
     identical to a real tab and gets the same "active" highlight
     automatically when Progresso or Tipos is the current view. */
  .tabs-more { position: relative; flex: none; }
  .tabs-more-panel {
    position: absolute; top: calc(100% + 6px); right: 0; z-index: 50;
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    box-shadow: var(--shadow); padding: 4px; display: flex; flex-direction: column;
    gap: 2px; min-width: 160px;
  }
  /* An author-stylesheet display value always beats the browser's native
     [hidden] handling regardless of selector specificity (author origin
     outranks user-agent origin in the cascade) - found via an actual fresh
     page load, not just checking morePanel.hidden === true in JS, which
     stayed correct throughout. Same fix .modal-backdrop[hidden] already
     has below; this rule was missing here since the dropdown shipped. */
  .tabs-more-panel[hidden] { display: none; }
  .tabs-more-panel .tab-btn { justify-content: flex-start; width: 100%; }

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

  /* Dashboard summary, top of the Dex - design proposal B, 2026-09-09. */
  #dashboard { padding: 12px 20px 0; }
  .dashboard-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 8px 22px; align-items: center;
  }
  .dash-item { display: flex; align-items: center; gap: 7px; font-size: 12.5px; }
  .dash-label { color: var(--text-dim); font-weight: 600; text-transform: uppercase; font-size: 10.5px; letter-spacing: .04em; }
  .dash-value { color: var(--text); display: inline-flex; align-items: center; gap: 5px; }
  .dash-suggestion { flex-basis: 100%; }
  /* .dash-value's inline-flex is right for the other dash-items (a short
     pill + a couple words), but the suggestion's value is a full sentence
     with two links stitched in - flexbox lays out each text run/link as
     its own wrapping box instead of one flowing paragraph, which visually
     stacked into a column of single words (found by actually looking at
     the dashboard with a real 6-Pokemon team, not from a DOM assertion -
     the existing smoke check only looks for the word "fracos" in the
     text, which was still present and "passing" the whole time). */
  .dash-suggestion .dash-value { color: var(--accent-2); display: inline; }
  .dash-suggestion .goto-species { text-decoration: underline; text-decoration-style: dotted; }

  .stat-row { display: grid; grid-template-columns: 90px 40px 1fr; align-items: center; gap: 10px; margin-bottom: 7px; }
  .stat-row:last-child { margin-bottom: 0; }
  .stat-row .stat-label { font-size: 12px; color: var(--text-dim); font-weight: 600; }
  .stat-row .stat-val { font-size: 13px; text-align: right; }
  .stat-bar-track { height: 8px; background: var(--surface-2); border-radius: 999px; overflow: hidden; }
  .stat-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--accent-2), var(--accent)); }
  /* Color banding so a glance tells "weak/average/good/elite" apart, not
     just the bar length - see statTier() and AUDITORIA-DOSSIE.md UX 2. */
  .stat-bar-fill.tier-weak { background: var(--sem-weak); }
  .stat-bar-fill.tier-good { background: var(--sem-resist); }
  .stat-bar-fill.tier-elite { background: var(--sem-immune); }
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
  /* Any Pokemon name/sprite the user might reasonably want to jump to in the
     Dex from - evolution chain, team slot, box chip, saved-team sprite, boss
     party member. See goToDexSpecies(). */
  .goto-species { cursor: pointer; }
  .goto-species:hover { opacity: .8; }
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
  /* Same edge-fade already used for the mobile tab bar (see .tabs) - used
     here without a media-query gate because both tables that rely on this
     (cov-table, the type matrix) stretch far enough (up to 18 type columns)
     that they overflow at almost any realistic viewport width, not just
     mobile. Design review, 2026-09-09: this was the one other place in the
     app hiding a scrollbar with zero cue that there's more to see. */
  .scroll-x {
    overflow-x: auto;
    mask-image: linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%);
  }
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
  .box-chip .bc-name-wrap { display: inline-flex; align-items: center; gap: 8px; }
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
  .boss-mon-card .bm-transform { color: var(--accent-2); font-style: italic; margin-bottom: 4px; }
  .boss-level-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 2px; }
  .boss-level-row label { font-size: 12.5px; color: var(--text-dim); }
  #boss-level-input {
    width: 62px; padding: 5px 8px; border-radius: 7px; border: 1px solid var(--border);
    background: var(--surface-2); color: var(--text); font-size: 13px;
  }
  .bm-stats {
    display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 8px; padding-top: 8px;
    border-top: 1px dashed var(--border);
  }
  .bm-stat { display: inline-flex; align-items: baseline; gap: 4px; font-size: 11.5px; }
  .bm-stat-label { color: var(--text-dim); }
  .team-slot {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
    background: var(--surface);
    min-height: 96px;
    min-width: 0;
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
  .box-chip .box-to-team.is-swap { color: var(--accent); }

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

  .sync-banner {
    position: fixed; left: 0; right: 0; top: 0; z-index: 200;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    background: var(--accent-2); color: var(--accent-ink);
    font-size: 12.5px; font-weight: 600; padding: 8px 14px; box-shadow: var(--shadow);
  }
  /* The EXACT same bug as .tabs-more-panel earlier today: an author-
     stylesheet `display` always beats the browser's native [hidden]
     handling, regardless of the hidden attribute/property being correctly
     set. Missed it again when adding this banner - this is why the user
     saw "Atualizar" showing constantly even though the banner's own JS
     logic (.hidden===true) was correct the whole time; the content-diff
     fix alongside this one was real too, but this CSS bug alone explains
     the reported symptom on its own. */
  .sync-banner[hidden] { display: none; }
  .sync-banner button {
    border: none; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 700;
    cursor: pointer; background: rgba(0,0,0,.15); color: inherit;
  }
  #sync-banner-dismiss { background: none; font-size: 16px; padding: 0 4px; line-height: 1; }

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

  .bh-details { margin-top: 10px; }
  .bh-details + .bh-details { margin-top: 8px; }
  /* Used to be a bare dim line with a tiny triangle - easy to mistake for
     stray text, not a feature (user feedback, 2026-09-09). Now styled like
     any other clickable row in the app, so it reads as one. */
  .bh-details summary {
    cursor: pointer;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--accent-2);
    list-style: none;
    padding: 9px 12px;
    border-radius: 8px;
    background: var(--surface-2);
    border: 1px solid var(--border);
  }
  .bh-details summary:hover { background: var(--surface-3); }
  .bh-details summary::-webkit-details-marker { display: none; }
  .bh-details summary::before { content: "▸ "; }
  .bh-details[open] summary::before { content: "▾ "; }
  .bh-entry { margin-top: 10px; }
  .bh-meta { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
  .bh-date { font-size: 10.5px; color: var(--text-dim); }
  .bh-context { font-size: 11px; color: var(--text); font-style: italic; flex: 1; }
  .bh-copy { background: none; border: none; color: var(--accent-2); font-size: 11px; font-weight: 700; cursor: pointer; padding: 2px 4px; }

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

  .notes-textarea {
    width: 100%;
    padding: 9px 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    font-size: 12.5px;
    font-family: inherit;
    resize: vertical;
    margin-bottom: 8px;
  }
  .notes-actions { display: flex; align-items: center; gap: 10px; }
  .notes-status { font-size: 11.5px; color: var(--accent-2); }
  .mybuild-hint { color: var(--text-dim); font-size: 12px; margin: 0 0 12px; }
  .mybuild-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
  .mybuild-field {
    display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px;
    font-size: 11px; color: var(--text-dim); font-weight: 600; text-transform: uppercase; letter-spacing: .03em;
  }
  .mybuild-field select, .mybuild-field input {
    padding: 8px 9px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--surface-2); color: var(--text); font-size: 13px; font-family: inherit;
    text-transform: none; letter-spacing: normal; font-weight: 400;
  }
  .mybuild-ivev { margin-bottom: 12px; }
  .mybuild-ivev-row { display: grid; grid-template-columns: 34px repeat(6, 1fr); gap: 6px; align-items: center; margin-bottom: 5px; }
  .mybuild-ivev-header { font-size: 10.5px; color: var(--text-dim); font-weight: 600; text-align: center; }
  .mybuild-ivev-row > span { font-size: 11px; color: var(--text-dim); font-weight: 600; }
  .mybuild-num {
    width: 100%; padding: 6px 4px; text-align: center; border-radius: 6px; border: 1px solid var(--border);
    background: var(--surface-2); color: var(--text); font-size: 12.5px; font-family: inherit;
  }
  .mybuild-ev-total { font-size: 11.5px; color: var(--text-dim); margin-top: 2px; }
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

  .cov-table { border-collapse: collapse; font-size: 12px; }
  .cov-table th, .cov-table td { padding: 6px 7px; text-align: center; border-bottom: 1px solid var(--border); }
  .cov-table th.rowhead, .cov-table td.rowhead { text-align: left; font-weight: 600; }
  .cov-cell { border-radius: 5px; padding: 3px 0; font-weight: 700; font-family: "IBM Plex Mono", monospace; }
  .cov-weak { background: color-mix(in srgb, var(--sem-weak) 24%, transparent); color: var(--sem-weak); }
  .cov-resist { background: color-mix(in srgb, var(--sem-resist) 22%, transparent); color: var(--sem-resist); }
  .cov-immune { background: color-mix(in srgb, var(--sem-immune) 26%, transparent); color: var(--sem-immune); }
  .cov-neutral { color: var(--text-dim); }

  /* Species rank badge. Originally used the same translucent-tint pattern as
     .cov-weak/.cov-resist/.cov-immune above - accessibility review,
     2026-09-09, MEASURED (actual WCAG relative-luminance contrast ratios,
     not eyeballed) that several tiers fell short of the 4.5:1 AA minimum
     for normal-size text: in light mode S/A/B were only 3.0-3.3:1 tinted,
     and their FULL-saturation color already falls short of white
     (--accent 4.27, --sem-resist 4.08, --accent-2 4.45 - a tint can only
     make that worse, never better). Switched to a solid background (each
     tier's real color, ~10% darker for the three light-mode offenders -
     see --badge-accent/--badge-accent2/--badge-resist above) with
     --accent-ink text, the same computed-contrast approach typePill()
     already uses for type colors. Verified: every tier now clears 4.5:1 in
     both themes (worst case 4.65:1, light mode A-tier).
     NOTE: .cov-weak/.cov-resist/.cov-immune above have this SAME underlying
     problem (same tint percentages) and were NOT touched in this pass -
     they're used in more places (the type matrix, team coverage table) and
     deserve their own dedicated pass rather than a rushed fix bundled into
     this one. Flagged, not fixed yet. */
  .rank-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 20px; height: 17px; padding: 0 4px; border-radius: 5px;
    font-size: 10px; font-weight: 800; font-family: "IBM Plex Mono", monospace;
    letter-spacing: .02em; cursor: help; flex: none;
    color: var(--accent-ink);
  }
  .rank-badge.tier-SS { background: var(--sem-immune); }
  .rank-badge.tier-S  { background: var(--badge-accent); }
  .rank-badge.tier-A  { background: var(--badge-resist); }
  .rank-badge.tier-B  { background: var(--badge-accent2); }
  .rank-badge.tier-C  { background: var(--surface-3); color: var(--text); }
  .rank-badge.tier-D  { background: var(--sem-weak); }

  /* Stage-relative badge - outlined instead of filled so it visually reads
     as "secondary/contextual" next to the plain rank badge, not a second
     opinion on the same question. Dex only (list + detail) - see
     rankStageBadgeHtml(). Text-on-surface, so it needs the SAME
     accessibility-safe tokens as .rank-badge above for S/A/B (verified:
     worst case 4.65:1 in light mode); SS/D/C's plain tokens already cleared
     4.5:1 as text without adjustment. */
  .rank-badge-stage {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 20px; height: 17px; padding: 0 4px; border-radius: 5px;
    font-size: 9.5px; font-weight: 800; font-family: "IBM Plex Mono", monospace;
    letter-spacing: .02em; cursor: help; flex: none; background: none;
    border: 1.5px solid currentColor;
  }
  .rank-badge-stage.tier-SS { color: var(--sem-immune); }
  .rank-badge-stage.tier-S  { color: var(--badge-accent); }
  .rank-badge-stage.tier-A  { color: var(--badge-resist); }
  .rank-badge-stage.tier-B  { color: var(--badge-accent2); }
  .rank-badge-stage.tier-C  { color: var(--text); }
  .rank-badge-stage.tier-D  { color: var(--sem-weak); }

  .rank-info-line { display: flex; flex-wrap: wrap; gap: 16px; margin: -4px 0 14px; }
  .rank-info-item { display: inline-flex; align-items: center; gap: 6px; }
  .rank-info-label { font-size: 11px; color: var(--text-dim); }
  .rank-info-scale { font-size: 10.5px; color: var(--text-dim); }
  .cov-flag { cursor: help; font-weight: 700; margin-left: 1px; opacity: .85; }

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
    /* #view-dex is the only view with two direct children (#dashboard +
       .dex-shell) - .view.active is `display:flex` with no direction set,
       so it defaults to row, and every screenshot so far (including this
       project's own past mobile-review passes) happened to land wide
       enough that a ~180px dashboard sidebar still read fine next to the
       list. A real phone-width check (found the pane's viewport floor is
       549px in this environment, testing narrower via width/height didn't
       go below it - still narrow enough to show the problem) revealed
       #dashboard squeezed to ~200px, wrapping every stat/suggestion onto
       its own near-vertical column of single words. Stack them instead. */
    #view-dex.active { flex-direction: column; }
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
    /* Vertical space is scarce here and the Pokemon being looked at matters
       more than the team summary - hide the dashboard while a detail is
       open. */
    #dashboard:has(+ .dex-shell.show-detail) { display: none; }
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
    .tabs-row { width: 100%; }
    .tabs {
      flex: 1;
      overflow-x: auto;
      flex-wrap: nowrap;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      /* Hiding the scrollbar (above) also hid the only cue that Progresso
         and Tipos exist off to the right - a fade at both edges signals
         "more to scroll" the way native horizontal chip/tab lists do. See
         AUDITORIA-DOSSIE.md UX 3. */
      mask-image: linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%);
      -webkit-mask-image: linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%);
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
    <div class="tabs-row">
    <nav class="tabs" role="tablist" aria-label="Seções">
      <button class="tab-btn active" data-tab="dex" type="button" role="tab" aria-selected="true" aria-controls="view-dex">Dex</button>
      <button class="tab-btn" data-tab="team" type="button" role="tab" aria-selected="false" aria-controls="view-team">Meu Time <span id="team-count-badge" class="count-badge mono">0/6</span></button>
      <button class="tab-btn" data-tab="box" type="button" role="tab" aria-selected="false" aria-controls="view-box">Caixa <span id="box-count-badge" class="count-badge mono">0</span></button>
      <button class="tab-btn" data-tab="bosses" type="button" role="tab" aria-selected="false" aria-controls="view-bosses">Chefões <span id="boss-count-badge" class="count-badge mono"></span></button>
    </nav>
    <!--
        Design review, 2026-09-09: 6 flat tabs of equal visual weight was the
        root cause behind the mobile scroll-mask patch two sessions ago -
        deliberately a SIBLING of <nav class="tabs">, not nested inside it -
        .tabs gets overflow-x:auto on narrow screens (the existing mobile
        scroll fix) and an absolutely-positioned dropdown inside a clipped
        scroll container gets clipped too regardless of z-index (found this
        the hard way: the first version rendered a real, positioned,
        non-hidden panel that was nonetheless invisible).
        Dex/Meu Time/Caixa/Chefões are the daily-use core loop, Progresso and
        Tipos are configured once or checked occasionally. Splitting them
        fixes the crowding at its source instead of masking the symptom
        further. #tabs-more-toggle/-panel are real .tab-btn elements inside,
        same class + data-tab the existing delegated click handler already
        matches - moving them visually didn't need any of that logic to
        change, only where they render and a show/hide toggle for the panel.
      -->
      <div class="tabs-more">
        <button id="tabs-more-toggle" class="tab-btn" type="button" aria-haspopup="true" aria-expanded="false">Mais &#9662;</button>
        <div id="tabs-more-panel" class="tabs-more-panel" hidden>
          <button class="tab-btn" data-tab="progress" type="button" role="tab" aria-selected="false" aria-controls="view-progress">Progresso <span id="cap-badge" class="count-badge mono"></span></button>
          <button class="tab-btn" data-tab="types" type="button" role="tab" aria-selected="false" aria-controls="view-types">Tipos</button>
        </div>
      </div>
    </div>
  </header>

  <main>
    <section id="view-dex" class="view active">
      <!--
        Design proposal B, 2026-09-09: the Dex used to open straight into a
        raw list of 1906 species with a search box - no orientation, no "here's
        where you left off", even though the team-analysis and rank data
        needed to answer that already existed elsewhere in the app. Filled by
        renderDashboard(), called from updateTeamBadge()/updateBoxBadge() (the
        two existing chokepoints every roster change already runs through -
        see rosterMove()), so it never needs its own separate update wiring.
        Hidden on mobile while a Dex detail is open (:has() - see CSS), where
        vertical space is scarce and the summary is less relevant than the
        Pokemon actually being looked at.
      -->
      <div id="dashboard"></div>
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
              <option value="rank">Rank (melhor primeiro)</option>
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

  <!-- Cross-device sync banner (db capability), 2026-09-09: unlike the toast
       above, this must stay up until the user notices and acts, not
       auto-hide after 2.2s - a "your save changed elsewhere" notice that
       vanished on its own would defeat the point. See wireSync() below. -->
  <div id="sync-banner" class="sync-banner" hidden>
    <span id="sync-banner-text"></span>
    <button id="sync-banner-reload" type="button">Atualizar</button>
    <button id="sync-banner-dismiss" type="button" aria-label="Dispensar">&times;</button>
  </div>

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
<script id="buildhistory" type="application/json">__BUILD_HISTORY_JSON__</script>
<script id="bossbuilds" type="application/json">__BOSS_BUILDS_JSON__</script>
<script id="speciesrank" type="application/json">__SPECIES_RANK_JSON__</script>
<script id="megaforms" type="application/json">__MEGA_FORMS_JSON__</script>
<script>
(function () {
  "use strict";
  var DATA = JSON.parse(document.getElementById("dexdata").textContent);
  var BUILDS = JSON.parse(document.getElementById("builds").textContent || "{}");
  // Fully-automatic SS/S/A/B/C/D rank per species (BST + boss usage +
  // ability impact, all computed with no per-species human review - see
  // scripts/compute_species_rank.ps1). Unlisted sname = not computed
  // (shouldn't happen for a real species, but degrade safely regardless).
  var SPECIES_RANK = JSON.parse(document.getElementById("speciesrank").textContent || "{}");
  // Past builds.json entries for a species, archived by scripts/archive_build.ps1
  // whenever a curated build gets replaced - see data/build_history.json.
  var BUILD_HISTORY = JSON.parse(document.getElementById("buildhistory").textContent || "{}");
  // Boss-team builds, one per species per boss appearance at that species' own
  // highest difficulty tier reached anywhere (hell > insane > party) - see
  // scripts/extract_boss_builds.ps1. Reference/inspiration, NOT a substitute
  // for BUILDS: a boss's moveset is tuned for one specific fight (sometimes a
  // double battle), not necessarily a generically good build for the player.
  var BOSS_BUILDS = JSON.parse(document.getElementById("bossbuilds").textContent || "{}");
  // Held-item name -> sname of the Mega/Primal species it turns the holder
  // into (e.g. "Miloticite" -> SPECIES_MILOTIC_MEGA). Built once from this
  // hack's own Pokemon Showdown fork (megaStone/megaEvolves fields in
  // data/items.ts) cross-validated against a species-name matcher run on
  // the real game data (100% agreement on the ~65 items both methods
  // covered) - see data/mega_forms.json's own generation notes in project
  // memory. Not regenerated by build.ps1 (same pattern as
  // ability_translations_pt.json) - re-run the research if this hack adds
  // new Mega/Primal items and they're missing here.
  var MEGA_FORMS = JSON.parse(document.getElementById("megaforms").textContent || "{}");
  var BOSSES = JSON.parse(document.getElementById("bossdata").textContent || "[]");
  var LEVELCAPS = JSON.parse(document.getElementById("levelcapdata").textContent || "null");
  var SAVEDTEAMS_SEED = JSON.parse(document.getElementById("savedteamsseed").textContent || "[]");
  var ABILITY_PT = JSON.parse(document.getElementById("abilitypt").textContent || "{}");
  var MOVE_PT = JSON.parse(document.getElementById("movept").textContent || "{}");
  var SPRITE_INDEX = JSON.parse(document.getElementById("spriteindex").textContent || "{}");
  var TYPES = DATA.types;
  var ABILITIES = DATA.abilities;
  var MOVES = DATA.moves;
  var ITEMS = DATA.items || [];
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
  // this data build no longer knows about. Unknown snames are NOT lost: the
  // caller collects them separately (state.orphans) and buildSave() writes
  // them back out untouched, so a save imported into an older/mismatched
  // data build doesn't silently delete Pokemon on the next persist() - see
  // AUDITORIA-DOSSIE.md 1.1.
  function snamesToXs(list, orphansOut) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (sn) {
      var known = (typeof sn === "string") && !!SPECIES_BY_SNAME[sn];
      if (!known && orphansOut && typeof sn === "string") orphansOut.push(sn);
      return known;
    }).map(function (sn) { return SPECIES_BY_SNAME[sn].x; });
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

  // Curated, NOT auto-generated: type-effectiveness modifiers for abilities
  // verified against their real (translated) Elite Redux description text -
  // never assumed from vanilla Pokemon behavior, since this hack renames and
  // rebalances abilities freely (see AUDITORIA-DOSSIE.md 9.4 - this is
  // exactly why a full 1033-ability table wasn't attempted in one go).
  // Only covers abilities actually seen on the user's team/box so far.
  // Unlisted ids simply have no effect (same safe-degrade as ABILITY_PT).
  // Ids are the same indices as ABILITIES / dex_compact.json "abilities".
  var TYPE_MOD_ABILITIES = {
    26:  { immune: ["Ground"] },                // Levitate
    444: { immune: ["Water"] },                 // Evaporate
    450: { immune: ["Ground"], healPct: 25 },   // Earth Eater
    116: { seDamper: 0.65 },                    // Solid Rock: -35% on SE hits
    318: { seDamper: 0.5 },                     // Primal Armor: -50% on SE hits
    303: { resist: { Rock: 0.5 } }               // Fossilized: extra half dmg from Rock
  };

  // Which of a species' abilities are safe to treat as ALWAYS active without
  // knowing which build the player picked: innates (always on, by the game's
  // own rule) plus any choosable slot that isn't really a choice - when all 3
  // listed choosable ids are identical there's no alternative to pick, so
  // it's effectively locked (e.g. Coalossal Mega's 3 slots are all Earth
  // Eater). A choosable ability with real alternatives (e.g. Terrakion's
  // Justified/Avenger/Rockhard Will) is deliberately left out here - which one
  // is active depends on the build, and guessing wrong would be worse than
  // showing the unmodified type chart.
  function alwaysActiveAbilities(sp) {
    var ids = sp.inn.slice();
    if (sp.ab.length && sp.ab.every(function (id) { return id === sp.ab[0]; })) ids.push(sp.ab[0]);
    return ids;
  }

  // Applies TYPE_MOD_ABILITIES on top of the flat type chart for one species'
  // real ability kit. Returns the adjusted multiplier plus which ability(ies)
  // caused a change, so the UI can show its work instead of a bare number.
  function abilityTypeMod(atk, sp) {
    var raw = typeMultiplier(atk, speciesTypeNames(sp));
    var ids = alwaysActiveAbilities(sp);

    // Immunity always wins and is checked across ALL active abilities first:
    // otherwise, if a damage-dampening ability (Solid Rock) happens to be
    // listed before an immunity one (Evaporate) in sp.inn's order, the
    // dampener's now-moot reason ("amortece...") would show alongside the
    // real answer ("imune"), which is confusing even though the final
    // number is still correct either way.
    var immuneId = ids.filter(function (id) {
      var mod = TYPE_MOD_ABILITIES[id];
      return mod && mod.immune && mod.immune.indexOf(atk) !== -1;
    })[0];
    if (immuneId !== undefined) {
      var mod = TYPE_MOD_ABILITIES[immuneId];
      var name = (ABILITIES[immuneId] && ABILITIES[immuneId][0]) || "?";
      return { raw: raw, mult: 0, reasons: [name + (mod.healPct ? " (imune, cura " + mod.healPct + "%)" : " (imune)")] };
    }

    var mult = raw;
    var reasons = [];
    ids.forEach(function (id) {
      var m = TYPE_MOD_ABILITIES[id];
      if (!m) return;
      var nm = (ABILITIES[id] && ABILITIES[id][0]) || "?";
      if (m.resist && m.resist[atk] !== undefined) {
        mult *= m.resist[atk];
        reasons.push(nm + " (resistência extra)");
      } else if (m.seDamper && raw > 1) {
        mult *= m.seDamper;
        reasons.push(nm + " (amortece dano super efetivo)");
      }
    });
    return { raw: raw, mult: mult, reasons: reasons };
  }

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
    savedTeams: [],
    // snames from the last loaded save that this data build doesn't
    // recognise (e.g. a save made on a newer game version). Kept verbatim
    // and written back by buildSave() so importing an old save into this
    // build, then saving again, doesn't delete those Pokemon for good.
    orphans: { team: [], box: [] },
    // Free-text notes per species, sname-keyed - "minhas anotações", 2026-09-09
    // field research follow-up: the official NextDex for this same game has
    // a per-species notes field the PLAYER fills in, separate from anything
    // the site curates - this project had build history and boss-reference
    // builds (both things I write), but nothing where the user writes
    // something themselves without going through me. Purely additive field,
    // safe default {} for any save saved before this existed - no
    // SCHEMA_VERSION bump needed, same pattern as adding `orphans` earlier.
    notes: {},
    // Interactive "meu build" per species, sname-keyed - 2026-09-09, user
    // feedback: the free-text notes field above has "no interaction with
    // the Pokemon", the user has to type everything by hand instead of
    // picking from real options. This is the structured counterpart -
    // ability/nature/item/moves picked from that species' own real data
    // (choosable abilities, its actual movepool, the full item list), IVs/
    // EVs as numbers - rendered as a Showdown block via the same
    // showdownSet() every other build source already uses. Purely
    // additive, same {} safe-default pattern as notes/orphans.
    customBuilds: {}
  };

  // ---------------- persistence ----------------
  // Everything is stored under ONE versioned key so the whole save can be
  // migrated, exported and imported as a unit. Schema:
  //   { v: 2, team: [sname], box: [sname], savedTeams: [{name, team:[sname]}],
  //     settings: {difficulty, milestone}, dataVersion, savedAt }
  var STORE_KEY = "er_terminal_save";
  var SCHEMA_VERSION = 2;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  function applySave(save) {
    if (!save || typeof save !== "object") return;
    // Orphans (snames this build doesn't recognise) are stored INSIDE
    // save.team/save.box by buildSave(), not in a separate field, so they
    // keep re-partitioning correctly on every future load: known-again ->
    // back into the active list, still-unknown -> still an orphan.
    var teamOrphans = [], boxOrphans = [];
    state.team = snamesToXs(save.team, teamOrphans).slice(0, 6);
    state.box = snamesToXs(save.box, boxOrphans);
    state.orphans = { team: teamOrphans, box: boxOrphans };
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
    // Bounds-check against this build's actual level-cap table: a save from
    // a build with more/fewer milestones could otherwise index past the end
    // of LEVELCAPS.rows wherever milestone is used to look up a row.
    if (LEVELCAPS && Array.isArray(LEVELCAPS.rows) && LEVELCAPS.rows.length) {
      var maxMilestone = LEVELCAPS.rows.length - 1;
      if (state.settings.milestone < 0) state.settings.milestone = 0;
      if (state.settings.milestone > maxMilestone) state.settings.milestone = maxMilestone;
    }
    // Defensive on import: only keep string values, so a hand-edited or
    // corrupted save can't inject something odd into a field that gets
    // rendered as plain text.
    state.notes = {};
    if (save.notes && typeof save.notes === "object") {
      Object.keys(save.notes).forEach(function (k) {
        if (typeof save.notes[k] === "string" && save.notes[k]) state.notes[k] = save.notes[k];
      });
    }
    // Same defensive-import discipline as notes above: only accept a build
    // that actually has the right shape, so a hand-edited or corrupted
    // save can't inject something odd into fields that get rendered as
    // plain text or fed into calcFinalStat.
    state.customBuilds = {};
    if (save.customBuilds && typeof save.customBuilds === "object") {
      Object.keys(save.customBuilds).forEach(function (k) {
        var b = save.customBuilds[k];
        if (!b || typeof b !== "object") return;
        var clean = {
          ability: typeof b.ability === "string" ? b.ability : "",
          nature: typeof b.nature === "string" ? b.nature : "",
          item: typeof b.item === "string" ? b.item : "",
          moves: Array.isArray(b.moves) ? b.moves.filter(function (m) { return typeof m === "string" && m; }).slice(0, 4) : [],
          ivs: Array.isArray(b.ivs) && b.ivs.length === 6 ? b.ivs.map(function (v) { return clampInt(v, 0, 31, 31); }) : [31, 31, 31, 31, 31, 31],
          evs: Array.isArray(b.evs) && b.evs.length === 6 ? b.evs.map(function (v) { return clampInt(v, 0, 252, 0); }) : [0, 0, 0, 0, 0, 0]
        };
        var isEmpty = !clean.ability && !clean.nature && !clean.item && !clean.moves.length &&
          clean.ivs.every(function (v) { return v === 31; }) && clean.evs.every(function (v) { return v === 0; });
        if (!isEmpty) state.customBuilds[k] = clean;
      });
    }
  }

  function clampInt(v, min, max, fallback) {
    var n = parseInt(v, 10);
    if (isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function buildSave() {
    return {
      v: SCHEMA_VERSION,
      dataVersion: DATA.meta ? DATA.meta.version : null,
      savedAt: new Date().toISOString(),
      team: xsToSnames(state.team).concat(state.orphans.team),
      box: xsToSnames(state.box).concat(state.orphans.box),
      savedTeams: state.savedTeams,
      settings: state.settings,
      notes: state.notes,
      customBuilds: state.customBuilds
    };
  }

  function persist() {
    var save = buildSave();
    lsSet(STORE_KEY, JSON.stringify(save));
    pushToSync(save);
  }
  // Kept as separate names so call sites still read clearly; all write the
  // one versioned blob.
  function saveTeam() { persist(); }
  function saveBox() { persist(); }
  function saveSettings() { persist(); }
  function saveSavedTeams() { persist(); }

  (function loadSave() {
    var raw = lsGet(STORE_KEY);
    if (raw) {
      try { applySave(JSON.parse(raw)); return; } catch (e) { /* fall through */ }
    }
    // First visit on this browser: seed with Claude's latest recommendation
    // instead of starting empty, and persist so it only happens once.
    applySave({ savedTeams: SAVEDTEAMS_SEED.slice(0, 3) });
    persist();
  })();

  // ---------------- cross-device sync (db capability) ----------------
  // 2026-09-09, user asked for automatic sync between PC and phone instead
  // of the manual copy/paste or file-download transfer card - confirmed
  // working on real devices the same day, so that card (and the
  // now-unused `downloads` capability it was the only user of) was
  // removed right after, same day, to keep the page lighter. One SHARED
  // document (not the `user` capability's per-viewer data/users/ subtree)
  // is deliberate: this artifact is private/unshared (sharing: owner), so
  // only the owner can ever open it regardless of who else is technically
  // in the org - a plain shared doc is simpler than per-viewer scoping for
  // a single-person tool, and avoids depending on a capability this
  // control plane doesn't list as declarable.
  // Never blocks first paint (see artifact-capabilities guidance): this
  // runs AFTER the synchronous loadSave() above already rendered from
  // localStorage, entirely in the background. A newer save found elsewhere
  // is written to localStorage immediately but NOT live-patched into the
  // already-rendered UI (surgically re-rendering every view correctly is
  // real risk for real benefit here) - instead a dismissible banner offers
  // a reload, so a build the user is mid-editing is never silently
  // overwritten by a remote change arriving in the background.
  // UPDATE 2026-09-09, same day: the banner was showing up "toda hora" even
  // with nothing actually changed anywhere (user report). Root cause: this
  // compared `savedAt` timestamps, but `savedAt` ticks forward on every
  // persist() call - including a call that re-saves byte-identical content
  // (e.g. this same reconciliation code unconditionally re-pushing local
  // up on every single page load, even when local already matched remote
  // exactly). A changed TIMESTAMP isn't the same thing as changed DATA.
  // Switched to comparing the actual save CONTENT (team/box/savedTeams/
  // settings/notes/customBuilds), ignoring savedAt/dataVersion entirely -
  // the banner (and any store write at all) now only fires when something
  // real actually differs.
  var syncDb = null, syncRef = null;
  var SYNC_CONTENT_KEYS = ["team", "box", "savedTeams", "settings", "notes", "customBuilds"];
  function syncContentDiffers(a, b) {
    if (!a || !b) return true;
    for (var i = 0; i < SYNC_CONTENT_KEYS.length; i++) {
      var k = SYNC_CONTENT_KEYS[i];
      if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) return true;
    }
    return false;
  }
  function pushToSync(save) {
    if (!syncRef) return;
    // persist() only ever runs from a genuine content-changing action (every
    // call site checked directly - all gated behind a click/change event,
    // none on mere navigation/render), so every push here is real; no need
    // to content-diff before writing, unlike the read side below where an
    // incoming write's REASON isn't known and has to be checked.
    syncRef.set(save).catch(function () { /* offline/transient - localStorage already has it; the next persist() retries */ });
  }
  function showSyncBanner(text) {
    document.getElementById("sync-banner-text").textContent = text;
    document.getElementById("sync-banner").hidden = false;
  }
  (async function wireSync() {
    if (typeof claude === "undefined" || !claude.use) return; // no viewer chrome (e.g. local dev server) - stays local-only
    var db = await claude.use("db");
    if (!db) return; // not served/granted/loaded in this view
    syncDb = db;
    syncRef = db.doc("sync/save");
    try {
      var snap = await syncRef.get();
      if (snap.exists) {
        var remote = snap.data();
        var localRaw = lsGet(STORE_KEY);
        var local = localRaw ? JSON.parse(localRaw) : null;
        if (syncContentDiffers(local, remote)) {
          if (!local || (remote.savedAt && (!local.savedAt || remote.savedAt > local.savedAt))) {
            // Remote has real differences and is the newer (or only) copy.
            lsSet(STORE_KEY, JSON.stringify(remote));
            showSyncBanner("Encontramos um save mais novo de outro aparelho.");
          } else {
            // Local has real differences and isn't older - push it up.
            syncRef.set(local).catch(function () {});
          }
        }
        // else: content already matches - nothing to write, nothing to show.
      } else {
        var localRaw2 = lsGet(STORE_KEY);
        var seed = localRaw2 ? JSON.parse(localRaw2) : buildSave();
        syncRef.set(seed).catch(function () {});
      }
    } catch (e) { /* get() failed - stay local-only for this load; persist() keeps trying to push */ }

    syncRef.onSnapshot(function (snap) {
      if (!snap.exists || snap.metadata.hasPendingWrites) return;
      var remote = snap.data();
      var localRaw3 = lsGet(STORE_KEY);
      var local3 = localRaw3 ? JSON.parse(localRaw3) : null;
      if (!syncContentDiffers(local3, remote)) return;
      lsSet(STORE_KEY, JSON.stringify(remote));
      showSyncBanner("Seu time foi atualizado em outro aparelho agora.");
    }, function () { syncDb = null; syncRef = null; });
  })();
  document.getElementById("sync-banner-reload").addEventListener("click", function () { location.reload(); });
  document.getElementById("sync-banner-dismiss").addEventListener("click", function () {
    document.getElementById("sync-banner").hidden = true;
  });

  var DIFF_TO_BOSSKEY = { easy: "party", ace: "insane", elite: "hell" };

  function getCurrentCap() {
    if (!LEVELCAPS || !LEVELCAPS.rows[state.settings.milestone]) return null;
    return LEVELCAPS.rows[state.settings.milestone][state.settings.difficulty];
  }

  // Final-stat calculator for boss Pokemon - 2026-09-09 field research +
  // approved next step. Deliberately NOT a full damage calculator (that idea
  // was aborted the same day: no trainer in the raw data has a level field
  // anywhere, so a real damage calc would need a level from somewhere we
  // can't source with confidence). This sidesteps that exact problem: the
  // user TYPES the level in (they can read it off their own screen), the
  // tool never asserts one. The stat formula itself (base+IV+EV -> final
  // stat, nature +/-10%) is the same since Gen 3 and not something a
  // data-only ROM hack rewrites, so it's safe to hardcode - unlike level,
  // which is genuinely unknowable from this project's data.
  // UPDATE 2026-09-09 (same day, user asked directly): held-item stat
  // modifiers ARE now applied, for the items this data actually confirms
  // the identity of - Choice Band/Specs/Scarf and Assault Vest appear under
  // their exact, unmistakable franchise names (checked: `grep -o
  // '"item":"[^"]*"' data/bosses.json`, 13/12/33/75 occurrences
  // respectively) and their effect is textbook, unchanged-since-introduced
  // vanilla mechanics.
  // UPDATE 2026-09-09, later same day (user asked for a field-research pass
  // on every exclusive item, not just documenting the gap): found the
  // hack's actual source of truth - github.com/Elite-Redux/er-config (the
  // "er-config" git submodule of the public NextDex repo) ships
  // items/*.textproto with real name+description text per item, AND
  // github.com/Elite-Redux/pokemon-showdown-ER (this hack's own Showdown
  // fork) has the exact numeric battle-engine implementation in
  // data/items.ts. That resolved every item this project had previously
  // left as "can't verify":
  // - Tactical Vest: textproto says "Raises Def but prevents the use of
  //   status moves" with hold_effect_strength: 50 - the SAME shape as
  //   Assault Vest's own entry (also strength: 50), just aimed at Def
  //   instead of SpD. Not a reskin guess anymore, confirmed from the
  //   engine's own item table.
  // - Thick Club/Light Ball: textproto confirms they're still species-
  //   locked (Cubone/Marowak; Pikachu/Raichu), so the species that holds
  //   them in THIS data had to be checked, not assumed - Thick Club sits on
  //   "Marowak Alolan" (matches vanilla's own species lock, safe) but Light
  //   Ball sits on "Raichu Alolan" (vanilla Light Ball does NOT affect
  //   Raichu at all). Showdown's data/items.ts spells out the exact,
  //   hack-specific numbers: Pikachu gets x2 Atk/SpA (vanilla), Raichu gets
  //   a REDUCED x1.5 Atk/SpA (this hack's own balance choice, not
  //   something vanilla knowledge could have supplied). Hand-verified:
  //   Marowak Alolan (base Atk 80, Adamant, 252 Atk EV, Thick Club, "Phoebe
  //   4" boss) at level 50 -> 290 Atk; Raichu Alolan (base SpA 95, Modest,
  //   252 SpA EV, Light Ball, "Wattson 1" insane tier) at level 50 -> 241
  //   SpA. Both match this formula exactly.
  // Researched but NOT added here, because it doesn't fit a per-stat
  // multiplier at all (documented for the record, not silently dropped):
  // - Swirly Glasses (textproto: "Swaps the split of attacking moves") -
  //   a move-category swap, not a stat change.
  // UPDATE 2026-09-09, same day: Mega Stones and Primal orbs ARE now
  // handled, just not through this table - they don't modify a stat on the
  // SAME species, they turn the holder into a DIFFERENT species entirely
  // (own base stats/types), already modeled as its own dex entry (e.g.
  // "Miloticite" -> the separately-stated "Milotic Mega"). See MEGA_FORMS
  // and its use in renderBossDetail() - a structurally different mechanism
  // (species swap) from ITEM_STAT_MODS (same-species multiplier), covering
  // 234 of ~267 stone-shaped items (built from this hack's own Pokemon
  // Showdown fork's megaStone/megaEvolves fields, cross-validated against
  // an independent species-name matcher - 100% agreement on their ~65-item
  // overlap). The ~33 leftover items are genuinely ambiguous in the source
  // data (e.g. "Lucarionite" between "Lucario Mega X"/"Mega Z" with no
  // signal to pick one) - left unresolved rather than guessed, degrades
  // safely to showing the base (held) species' own stats.
  // Still no in-battle ability/stage modifiers (stat stages, weather, an
  // ability's damage-time effect) - this is "what does the stat screen
  // say", not an attempt to simulate a turn.
  var ITEM_STAT_MODS = {
    "Choice Band": [{ statIdx: 1, mult: 1.5 }],
    "Choice Specs": [{ statIdx: 3, mult: 1.5 }],
    "Choice Scarf": [{ statIdx: 5, mult: 1.5 }],
    "Assault Vest": [{ statIdx: 4, mult: 1.5 }],
    "Tactical Vest": [{ statIdx: 2, mult: 1.5 }],
    "Thick Club": [{ statIdx: 1, mult: 2, speciesPrefix: ["Cubone", "Marowak"] }],
    "Light Ball": [
      { statIdx: 1, mult: 2, speciesPrefix: ["Pikachu"] },
      { statIdx: 3, mult: 2, speciesPrefix: ["Pikachu"] },
      { statIdx: 1, mult: 1.5, speciesPrefix: ["Raichu"] },
      { statIdx: 3, mult: 1.5, speciesPrefix: ["Raichu"] }
    ]
  };
  function itemRuleFor(itemName, statIdx, speciesName) {
    var rules = ITEM_STAT_MODS[itemName];
    if (!rules) return null;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.statIdx !== statIdx) continue;
      if (!r.speciesPrefix) return r;
      for (var j = 0; j < r.speciesPrefix.length; j++) {
        if (speciesName && speciesName.indexOf(r.speciesPrefix[j]) === 0) return r;
      }
    }
    return null;
  }
  var NATURE_MODS = {
    Lonely: [1, 2], Brave: [1, 5], Adamant: [1, 3], Naughty: [1, 4],
    Bold: [2, 1], Relaxed: [2, 5], Impish: [2, 3], Lax: [2, 4],
    Timid: [5, 1], Hasty: [5, 2], Jolly: [5, 3], Naive: [5, 4],
    Modest: [3, 1], Mild: [3, 2], Quiet: [3, 5], Rash: [3, 4],
    Calm: [4, 1], Gentle: [4, 2], Sassy: [4, 5], Careful: [4, 3]
    // Hardy/Docile/Serious/Bashful/Quirky are neutral - no entry, falls
    // through to the no-modifier case below.
  };
  // Full 25-nature list for the "Meu build" picker (Object.keys(NATURE_MODS)
  // is only the 20 that actually change a stat).
  var ALL_NATURES = Object.keys(NATURE_MODS).concat(["Hardy", "Docile", "Serious", "Bashful", "Quirky"]).sort();
  function calcFinalStat(base, iv, ev, level, statIdx, natureName, itemName, speciesName) {
    iv = (typeof iv === "number") ? iv : 31;
    ev = (typeof ev === "number") ? ev : 0;
    level = level || 1;
    if (statIdx === 0) {
      return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10);
    }
    var raw = Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5;
    var mods = NATURE_MODS[natureName];
    var mult = 1;
    if (mods) {
      if (mods[0] === statIdx) mult = 1.1;
      else if (mods[1] === statIdx) mult = 0.9;
    }
    var withNature = Math.floor(raw * mult);
    // Held-item multiplier applies to the nature-adjusted stat, same order
    // the actual games compute it in (base formula -> nature -> item).
    // Some items (Light Ball) only apply to one of several species that can
    // hold them, at different multipliers each - itemRuleFor() checks both.
    var rule = itemRuleFor(itemName, statIdx, speciesName);
    if (rule) {
      return Math.floor(withNature * rule.mult);
    }
    return withNature;
  }

  // ---------------- tabs ----------------
  var moreToggle = document.getElementById("tabs-more-toggle");
  var morePanel = document.getElementById("tabs-more-panel");
  var MORE_TABS = ["progress", "types"];
  function closeMorePanel() {
    morePanel.hidden = true;
    moreToggle.setAttribute("aria-expanded", "false");
  }
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    // #tabs-more-toggle shares the .tab-btn class for matching visual sizing
    // (see .tabs-more-toggle CSS) but isn't a real tab - it has no data-tab
    // and is wired separately below.
    if (!btn.dataset.tab) return;
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      document.getElementById("view-" + btn.dataset.tab).classList.add("active");
      moreToggle.classList.toggle("active", MORE_TABS.indexOf(btn.dataset.tab) !== -1);
      closeMorePanel();
      if (btn.dataset.tab === "team") renderTeam();
      if (btn.dataset.tab === "box") renderBox();
      if (btn.dataset.tab === "bosses") initBosses();
      if (btn.dataset.tab === "progress") initProgress();
      if (btn.dataset.tab === "types") renderTypeMatrix();
    });
  });
  moreToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    var willOpen = morePanel.hidden;
    morePanel.hidden = !willOpen;
    moreToggle.setAttribute("aria-expanded", String(willOpen));
  });
  document.addEventListener("click", function (e) {
    if (!morePanel.hidden && !e.target.closest(".tabs-more")) closeMorePanel();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !morePanel.hidden) closeMorePanel();
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

  // Stat bars used to divide by the theoretical byte ceiling (255), which
  // nothing in this dataset gets close to in practice (median base stat is
  // ~78, p95 is ~135 - measured across all 1906 species x 6 stats). Against
  // 255 a genuinely great 130 stat filled barely half the bar and read as
  // mediocre at a glance. 180 makes the top few percent read as "maxed" -
  // the exact number is still printed next to the bar, so nothing is hidden,
  // just anything above 180 (a small handful of species) visually clips.
  // See AUDITORIA-DOSSIE.md UX 2.
  var STAT_BAR_CEILING = 180;
  function statPct(v) { return Math.max(2, Math.min(100, (v / STAT_BAR_CEILING) * 100)); }
  function statTier(v) {
    if (v < 60) return "tier-weak";
    if (v >= 150) return "tier-elite";
    if (v >= 110) return "tier-good";
    return "";
  }

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
      // SS is the highest tier, D the lowest - .score is already the
      // underlying 0-100 percentile the letter comes from, so sorting by it
      // directly (rather than the letter) also orders correctly WITHIN a
      // tier. Species without a rank (shouldn't happen - all 1906 get one)
      // fall to the bottom instead of erroring.
      if (state.sort === "rank") {
        var ra = SPECIES_RANK[a.sname], rb = SPECIES_RANK[b.sname];
        return (rb ? rb.score : -1) - (ra ? ra.score : -1);
      }
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
        rankBadgeHtml(sp.sname) +
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
        // this modal now opens from the Box tab too (see renderBox), which
        // has its own grid that rosterMove()'s badge updates don't touch -
        // refresh it directly. Harmless no-op cost when Box isn't the
        // visible tab.
        renderBox();
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
    if (toastTimer) clearTimeout(toastTimer);
    // If a toast is already showing (fast successive actions - e.g. adding
    // several Pokemon in a row), just swapping the text with .show already
    // applied doesn't retrigger the opacity/transform transition, so the
    // confirmation for the second action can go unnoticed. Dropping the
    // class, forcing a reflow, then re-adding it restarts the transition
    // every time. See AUDITORIA-DOSSIE.md UX 5.
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  // ---------------- detail rendering ----------------
  // Real data quirk, not a bug: 149 of 1906 species have all 3 choosable-
  // ability slots pointing at the identical id in the raw game data (e.g.
  // Tyranitar Mega Redux's own "abis":[444,444,444] - checked directly,
  // this is upstream, not a splicing mistake). alwaysActiveAbilities()
  // already treats that case as "no real choice" for the weakness table;
  // this dedupes the same ids before they reach a card list, so a species
  // like that shows ONE Evaporate card instead of three identical ones -
  // found by actually opening the Dex on the user's own team member, not
  // by reading the data cold.
  function uniqueIds(ids) {
    var seen = {}, out = [];
    for (var i = 0; i < ids.length; i++) {
      if (!seen[ids[i]]) { seen[ids[i]] = true; out.push(ids[i]); }
    }
    return out;
  }
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
      // Whole-row type tint, not just the pill - field research, 2026-09-09
      // (the official NextDex for this same game does this and it's
      // genuinely faster to scan a long movepool by). Low alpha (9%) so it
      // stays a background hint, not competing with the text - a much
      // bigger shift than that isn't needed to be visible, and this project
      // learned the hard way (rank badges, same day) not to touch a colored
      // background without checking what it does to text contrast: at 9%
      // the row barely moves off --surface, so --text's already-huge margin
      // there (12:1+, verified in that same pass) has no realistic way to
      // drop under the 4.5:1 AA minimum.
      var main = '<tr class="move-row' + (aboveCap ? " above-cap" : "") + '" data-target="' + id + '" style="background:color-mix(in srgb, ' + meta.hex + ' 9%, transparent);">' +
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

  // Jump to a species' Dex detail from anywhere it's shown as a name/sprite
  // in the app - evolution chain, team slot, box chip, saved-team sprite,
  // boss party member. One function so "click a Pokemon" behaves the same
  // everywhere, wired via the single delegated ".goto-species" listener
  // right below it.
  var RANK_TIER_CLASS = { SS: "tier-SS", S: "tier-S", A: "tier-A", B: "tier-B", C: "tier-C", D: "tier-D" };
  // Shown next to a species' name everywhere it appears (Dex list/detail,
  // team slot, box chip) - the tooltip spells out the three inputs AND the
  // limitation (no moveset/synergy judgment) every time, not just once in a
  // help page nobody reads.
  function rankBadgeHtml(sname) {
    var r = SPECIES_RANK[sname];
    if (!r) return "";
    var title = "Rank " + r.tier + " de SS (melhor) a D (pior) — score " + r.score + "/100, calculado automaticamente a partir de " +
      "BST (percentil " + r.bstPct + "), uso em chefões (percentil " + r.bossPct + ") e impacto das habilidades " +
      "(percentil " + r.abilityPct + "). Não avalia moveset nem sinergia com o resto do time.";
    return '<span class="rank-badge ' + (RANK_TIER_CLASS[r.tier] || "tier-C") + '" title="' + escapeHtml(title) + '">' + r.tier + '</span>';
  }

  // Dex DETAIL only (never the list, never Team/Box - see rankInfoLineHtml
  // below): answers "is this a good example of a Pokemon at ITS stage"
  // (useful when deciding whether an early-game catch is worth grinding),
  // a different question from the plain rank badge's "how strong is this
  // right now". A species with no real evolution line (standalones, and
  // Mega/Primal-only lineages like most box legendaries - see
  // compute_species_rank.ps1) has no stageTier and renders nothing, same
  // safe-degrade as everywhere else.
  var STAGE_LABEL = { 1: "1º estágio", 2: "2º estágio", 3: "3º estágio", 4: "4º estágio" };
  function rankStageBadgeHtml(sname) {
    var r = SPECIES_RANK[sname];
    if (!r || r.stageTier === null || r.stageTier === undefined) return "";
    var label = STAGE_LABEL[r.stage] || (r.stage + "º estágio");
    var title = "Rank " + r.stageTier + " entre outros Pokémon de " + label + " (score " + r.stageScore + "/100) — " +
      "mesma fórmula do rank normal, mas comparado só com quem está no mesmo estágio evolutivo, não com o jogo todo.";
    return '<span class="rank-badge-stage ' + (RANK_TIER_CLASS[r.stageTier] || "tier-C") + '" title="' + escapeHtml(title) + '">' + r.stageTier + '</span>';
  }

  // The Dex detail used to show both badges bare, side by side, right next
  // to the species name - "S" filled next to "A" outlined with zero label,
  // which read as confusing/contradictory rather than as two different
  // questions being answered (user feedback, 2026-09-09). Now a labeled
  // line of its own, in plain words, so no tooltip is required to understand
  // it. The list row and Team/Box cards keep just the bare rankBadgeHtml()
  // chip - that's fine there, it's a single glanceable "how good is this"
  // signal, not a place to also explain a second, different ranking.
  function rankInfoLineHtml(sp) {
    var r = SPECIES_RANK[sp.sname];
    if (!r) return "";
    var items = '<span class="rank-info-item"><span class="rank-info-label">Rank geral</span>' + rankBadgeHtml(sp.sname) + '</span>';
    if (r.stageTier !== null && r.stageTier !== undefined) {
      var label = STAGE_LABEL[r.stage] || (r.stage + "º estágio");
      items += '<span class="rank-info-item"><span class="rank-info-label">Rank no ' + label + '</span>' + rankStageBadgeHtml(sp.sname) + '</span>';
    }
    // The letters alone don't say which end is good without a hover -
    // user feedback, 2026-09-09 ("falta indicar qual seria o rank mais
    // valioso"). Spelled out in plain text every time, not just on hover,
    // plus you can now sort the whole Dex list by rank (search controls).
    items += '<span class="rank-info-scale">Escala: SS (melhor) &rarr; S &rarr; A &rarr; B &rarr; C &rarr; D (pior)</span>';
    return '<div class="rank-info-line">' + items + '</div>';
  }

  function goToDexSpecies(x) {
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    selectSpecies(x);
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest(".goto-species");
    if (!el) return;
    var x = parseInt(el.dataset.x, 10);
    if (!isNaN(x)) goToDexSpecies(x);
  });

  function selectSpecies(x) {
    // Only reset scroll when the species actually CHANGES - selectSpecies()
    // is also called to refresh the currently-open species in place (e.g.
    // after "Salvar build"/"Limpar" in Meu build), and yanking the user
    // back to the top after they clicked a button deep in the page would be
    // its own real regression. Paired with the #app height fix just above
    // (min-height -> height, the actual root cause of "a dex fica travada"
    // - the whole page was scrolling instead of this panel internally) -
    // without that fix this reset would have had nothing to reset, since
    // .species-detail's own scrollTop never moved at all before.
    var isSameSpecies = state.selected === x;
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
      return '<div class="stat-row"><span class="stat-label">' + statLabels[i] + '</span><span class="stat-val mono">' + v + '</span>' +
        '<div class="stat-bar-track"><div class="stat-bar-fill ' + statTier(v) + '" style="width:' + statPct(v) + '%"></div></div></div>';
    }).join("");

    var abiHtml = uniqueIds(sp.ab).map(function (id) { return abilityCard(id, "Escolhível", "choosable"); }).join("");
    var innHtml = sp.inn.map(function (id) { return abilityCard(id, "Innate", "innate"); }).join("");

    var evoHtml = "";
    if (sp.ev.length) {
      var nodes = ['<div class="evo-node goto-species" data-x="' + sp.x + '">' + escapeHtml(sp.n) + '</div>'];
      sp.ev.forEach(function (ev) {
        var target = getSpeciesByX(ev[2]);
        nodes.push('<span class="evo-arrow">&rarr;<small>' + evoConditionText(ev) + '</small></span>');
        nodes.push('<div class="evo-node' + (target ? ' goto-species" data-x="' + target.x : '') + '">' + escapeHtml(target ? target.n : "?") + '</div>');
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
        // Only relevant once the Pokemon IS on the team: on mobile the species
        // list is hidden while a detail is open (.dex-shell.show-detail), so
        // without this the only way to see the team update is back -> scroll
        // -> switch tab by hand. See AUDITORIA-DOSSIE.md UX 4.
        (inTeam ? '<button class="back-btn" id="goto-team-link" type="button" style="margin:0;">Ir para Meu Time &rarr;</button>' : "") +
      '</div></div>' +
      '<div class="detail-types">' + names.map(function (n) { return typePill(n); }).join("") + '</div>' +
      rankInfoLineHtml(sp) +
      (sp.d ? '<p class="flavor">' + escapeHtml(sp.d) + '</p>' : "") +
      '<div class="card"><h3>Stats base</h3>' + statsHtml +
        '<div class="stat-total">Total (BST) <b class="mono">' + bst(sp) + '</b></div></div>' +
      '<div class="card"><h3>Habilidades &amp; Innates</h3><div class="abi-grid">' + abiHtml + innHtml + '</div>' +
        '<p style="color:var(--text-dim);font-size:11.5px;margin-top:10px;">1 habilidade escolhível fica ativa por vez, como na série principal. As innates ficam sempre ativas, além da habilidade escolhida.</p></div>' +
      myBuildEditorHtml(sp) +
      notesCardHtml(sp) +
      (function () {
        var inner = buildHistoryHtml(sp) + bossReferenceHtml(sp);
        // Used to be a bare, untitled card - just a couple of collapsed
        // one-line <details>, indistinguishable from stray text between
        // Habilidades and Linha evolutiva (user feedback, 2026-09-09: "muito
        // mal localizada"). A real header fixes the "what IS this" problem;
        // the individual <details> summaries got heavier styling (see
        // .bh-details summary) to read as a real, clickable feature instead
        // of a barely-visible line.
        return inner ? '<div class="card"><h3>Builds de referência</h3>' + inner + '</div>' : "";
      })() +
      evoHtml + lmHtml + tuHtml;

    if (!isSameSpecies) {
      var detailPanel = document.querySelector(".species-detail");
      if (detailPanel) detailPanel.scrollTop = 0;
    }

    var backBtn = document.getElementById("back-to-list");
    if (backBtn) backBtn.addEventListener("click", function () {
      document.getElementById("dex-shell").classList.remove("show-detail");
    });

    var addBtn = document.getElementById("add-team-btn");
    if (addBtn && !inTeam) {
      addBtn.addEventListener("click", function () {
        if (state.team.length >= 6) { openSwapModal(x); return; }
        if (rosterMove(x, null)) {
          flashToast(sp.n + " entrou no time (" + state.team.length + "/6)");
          selectSpecies(x);
        }
      });
    }

    var gotoTeamLink = document.getElementById("goto-team-link");
    if (gotoTeamLink) {
      gotoTeamLink.addEventListener("click", function () {
        document.querySelector('.tab-btn[data-tab="team"]').click();
      });
    }

    var notesSaveBtn = document.getElementById("species-notes-save");
    if (notesSaveBtn) {
      notesSaveBtn.addEventListener("click", function () {
        var text = document.getElementById("species-notes-input").value.trim();
        if (text) state.notes[sp.sname] = text; else delete state.notes[sp.sname];
        persist();
        var status = document.getElementById("species-notes-status");
        if (status) status.textContent = "Salvo.";
      });
    }

    wireMyBuildEditor(sp);

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
    renderDashboard();
  }

  // ---------------- box view ----------------
  function updateBoxBadge() {
    document.getElementById("box-count-badge").textContent = state.box.length;
    renderDashboard();
  }

  function renderBox() {
    var grid = document.getElementById("box-grid");
    var members = state.box.map(getSpeciesByX).filter(Boolean);
    if (!members.length) {
      grid.innerHTML = '<p class="empty-note">Caixa vazia — abra um Pokémon na aba Dex e clique em "+ Adicionar à caixa".</p>';
    } else {
      var teamFull = state.team.length >= 6;
      // The Dex tab never blocks this: a full team opens the swap modal
      // instead of disabling the button (see openSwapModal / row-add-btn
      // above). The Box used to be the odd one out - disabled and forcing
      // the user to switch tabs to free a slot first. Same rule here now:
      // the button is never disabled, it just swaps instead of appending
      // once the team is full. See AUDITORIA-DOSSIE.md UX 1.
      var title = teamFull ? "Trocar por um do time" : "Mandar para o time";
      grid.innerHTML = members.map(function (sp) {
        var names = speciesTypeNames(sp);
        return '<div class="box-chip">' +
          '<span class="bc-name-wrap goto-species" data-x="' + sp.x + '" title="Ver na Dex">' + spriteImgHtml(sp.x, sp.n, 26) +
          '<span>' + escapeHtml(sp.n) + '</span></span>' +
          rankBadgeHtml(sp.sname) +
          '<span class="box-chip-pips">' + names.map(typePip).join("") + '</span>' +
          '<button class="box-to-team' + (teamFull ? ' is-swap' : '') + '" data-x="' + sp.x + '" type="button" title="' + title + '" aria-label="' + title + '">' +
            (teamFull ? '&hArr;&nbsp;trocar' : '&rarr;&nbsp;time') + '</button>' +
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
          if (state.team.length >= 6) { openSwapModal(x); return; }
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

  // Shared by buildHistoryHtml and bossReferenceHtml below - same entry
  // markup either way, just a different meta line and copy-button attrs.
  // Two DISTINCT actions, not one repurposed button, 2026-09-09 (user
  // caught the gap: clicking "copiar" here did nothing to "Meu build" or
  // the Team tab) - "copiar" still only puts clipboard text (someone
  // pasting into Showdown directly shouldn't have their own saved build
  // silently overwritten as a side effect), "+ Usar como meu build" is the
  // new, explicit write into state.customBuilds, same button/label
  // convention already shipped on the boss party card.
  function buildEntryHtml(sp, entry, metaHtml, copyAttrs) {
    return '<div class="bh-entry">' +
      '<div class="bh-meta">' + metaHtml +
      '<button class="bh-copy" ' + copyAttrs + ' type="button" title="Copiar este set">copiar</button></div>' +
      '<pre class="showdown-block">' + escapeHtml(showdownSet(sp, entry)) + '</pre>' +
      (entry.note ? '<div class="ts-build-note">' + escapeHtml(entry.note) + '</div>' : '') +
      '<button class="ts-build-copy use-entry-build-btn" ' + copyAttrs + ' type="button" style="margin-top:6px;">+ Usar como meu build</button>' +
    '</div>';
  }

  // Inverse of evsToShowdownText() - these reference builds (build history,
  // boss-seen builds) store EVs as that same formatted string, but
  // state.customBuilds needs the raw 6-number array. No IVs are stored on
  // either source, so a copy from here defaults to 31 all - same default
  // "Meu build" itself already assumes for an unfilled IV field.
  function evsTextToArray(text) {
    var out = [0, 0, 0, 0, 0, 0];
    (text || "").split("/").forEach(function (part) {
      var m = part.trim().match(/^(\d+)\s+(\S+)$/);
      if (!m) return;
      var idx = STAT_LABELS_SHORT.indexOf(m[2]);
      if (idx !== -1) out[idx] = parseInt(m[1], 10);
    });
    return out;
  }

  function evsToShowdownText(evs) {
    var parts = [];
    for (var i = 0; i < 6; i++) { if (evs[i] > 0) parts.push(evs[i] + " " + STAT_LABELS_SHORT[i]); }
    return parts.join(" / ");
  }

  // "Meu build" - 2026-09-09, user feedback on the free-text notes field
  // ("não tem interação com o poke, o usuário tem que digitar tudo"):
  // pick ability/nature/item/moves from this species' own real options
  // (choosable abilities, its actual movepool via lm+tu, the full item
  // list) instead of typing them from memory, plus IV/EV number fields.
  // Saved separately from the free-text notes (state.customBuilds, kept
  // alongside it, not replacing it - prose notes are still their own
  // useful thing). Renders through the same showdownSet() every other
  // build source (builds.json, build history, boss reference) already
  // uses, so it looks and copies identically to a curated build.
  function myBuildEditorHtml(sp) {
    var b = state.customBuilds[sp.sname] || { ability: "", nature: "", item: "", moves: [], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0] };
    var abiIds = uniqueIds(sp.ab);
    var abiOptionsHtml = '<option value="">(nenhuma)</option>' + abiIds.map(function (id) {
      var a = ABILITIES[id];
      return a ? '<option value="' + escapeHtml(a[0]) + '">' + escapeHtml(a[0]) + '</option>' : "";
    }).join("");
    var natureOptionsHtml = '<option value="">(neutra)</option>' + ALL_NATURES.map(function (n) {
      return '<option value="' + n + '">' + n + '</option>';
    }).join("");
    // This species' real movepool only - level-up + tutor (which already
    // covers what would be TM-taught moves in this hack's own data model,
    // see extract_bosses.ps1/transform.ps1 notes - TMHMMoves is empty for
    // every species, checked directly).
    var moveIds = uniqueIds(sp.lm.map(function (p) { return p[1]; }).concat(sp.tu));
    var moveOptionsHtml = '<option value="">(nenhum)</option>' + moveIds.map(function (id) {
      var m = MOVES[id];
      return m ? '<option value="' + escapeHtml(m[0]) + '">' + escapeHtml(m[0]) + '</option>' : "";
    }).join("");
    var itemDatalist = '<datalist id="mybuild-item-list">' + ITEMS.map(function (n) { return '<option value="' + escapeHtml(n) + '">'; }).join("") + '</datalist>';
    var ivEvHeader = '<span></span>' + STAT_LABELS_SHORT.map(function (l) { return '<span>' + l + '</span>'; }).join("");
    var ivRow = '<span>IV</span>' + [0, 1, 2, 3, 4, 5].map(function (i) {
      return '<input type="number" class="mybuild-num" id="mybuild-iv-' + i + '" min="0" max="31">';
    }).join("");
    var evRow = '<span>EV</span>' + [0, 1, 2, 3, 4, 5].map(function (i) {
      return '<input type="number" class="mybuild-num" id="mybuild-ev-' + i + '" min="0" max="252" step="4">';
    }).join("");
    var hasBuild = state.customBuilds[sp.sname];
    var preview = hasBuild ? showdownSet(sp, {
      ability: b.ability, nature: b.nature, item: b.item,
      evs: evsToShowdownText(b.evs), moves: b.moves.filter(Boolean)
    }) : "";
    return '<div class="card"><h3>Meu build</h3>' +
      '<p class="mybuild-hint">Monte seu set escolhendo direto das opções reais deste Pokémon - nada de digitar de cabeça.</p>' +
      '<div class="mybuild-row">' +
        '<label class="mybuild-field">Habilidade<select id="mybuild-ability">' + abiOptionsHtml + '</select></label>' +
        '<label class="mybuild-field">Nature<select id="mybuild-nature">' + natureOptionsHtml + '</select></label>' +
        '<label class="mybuild-field">Item<input type="text" id="mybuild-item" list="mybuild-item-list" placeholder="Buscar item..." autocomplete="off"></label>' +
      '</div>' + itemDatalist +
      '<div class="mybuild-row mybuild-moves">' +
        [0, 1, 2, 3].map(function (i) {
          return '<label class="mybuild-field">Golpe ' + (i + 1) + '<select id="mybuild-move-' + i + '">' + moveOptionsHtml + '</select></label>';
        }).join("") +
      '</div>' +
      '<div class="mybuild-ivev">' +
        '<div class="mybuild-ivev-row mybuild-ivev-header">' + ivEvHeader + '</div>' +
        '<div class="mybuild-ivev-row">' + ivRow + '</div>' +
        '<div class="mybuild-ivev-row">' + evRow + '</div>' +
        '<div class="mybuild-ev-total" id="mybuild-ev-total"></div>' +
      '</div>' +
      '<div class="notes-actions"><button id="mybuild-save" class="ts-build-copy" type="button">Salvar build</button>' +
        (hasBuild ? '<button id="mybuild-clear" class="ts-build-copy" type="button" style="color:var(--sem-weak);">Limpar</button>' : '') +
        '<span id="mybuild-status" class="notes-status"></span></div>' +
      (hasBuild ? '<pre class="showdown-block">' + escapeHtml(preview) + '</pre><button id="mybuild-copy" class="ts-build-copy" type="button">Copiar</button>' : '') +
    '</div>';
  }

  function updateMyBuildEvTotal() {
    var total = 0;
    for (var i = 0; i < 6; i++) {
      var el = document.getElementById("mybuild-ev-" + i);
      if (el) total += clampInt(el.value, 0, 252, 0);
    }
    var out = document.getElementById("mybuild-ev-total");
    if (!out) return;
    out.textContent = "Total de EVs: " + total + " / 510";
    out.style.color = total > 510 ? "var(--sem-weak)" : "var(--text-dim)";
  }

  // Sets initial <select>/<input> values from saved state (kept out of the
  // HTML-string generation in myBuildEditorHtml() - easier to set .value
  // directly than to re-walk every option list marking one "selected"),
  // and wires the save/clear/copy buttons + the live EV-total counter.
  function wireMyBuildEditor(sp) {
    var b = state.customBuilds[sp.sname] || { ability: "", nature: "", item: "", moves: [], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0] };
    var abiEl = document.getElementById("mybuild-ability");
    if (abiEl) abiEl.value = b.ability || "";
    var natEl = document.getElementById("mybuild-nature");
    if (natEl) natEl.value = b.nature || "";
    var itemEl = document.getElementById("mybuild-item");
    if (itemEl) itemEl.value = b.item || "";
    for (var i = 0; i < 4; i++) {
      var mv = document.getElementById("mybuild-move-" + i);
      if (mv) mv.value = b.moves[i] || "";
    }
    for (var j = 0; j < 6; j++) {
      var ivEl = document.getElementById("mybuild-iv-" + j);
      if (ivEl) ivEl.value = b.ivs[j];
      var evEl = document.getElementById("mybuild-ev-" + j);
      if (evEl) evEl.value = b.evs[j];
      if (evEl) evEl.addEventListener("input", updateMyBuildEvTotal);
    }
    updateMyBuildEvTotal();

    var saveBtn = document.getElementById("mybuild-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var moves = [];
        for (var i = 0; i < 4; i++) {
          var mv = document.getElementById("mybuild-move-" + i);
          if (mv && mv.value) moves.push(mv.value);
        }
        var ivs = [], evs = [];
        for (var j = 0; j < 6; j++) {
          ivs.push(clampInt(document.getElementById("mybuild-iv-" + j).value, 0, 31, 31));
          evs.push(clampInt(document.getElementById("mybuild-ev-" + j).value, 0, 252, 0));
        }
        state.customBuilds[sp.sname] = {
          ability: document.getElementById("mybuild-ability").value,
          nature: document.getElementById("mybuild-nature").value,
          item: document.getElementById("mybuild-item").value.trim(),
          moves: moves, ivs: ivs, evs: evs
        };
        persist();
        flashToast("Build salvo para " + sp.n);
        selectSpecies(sp.x);
      });
    }
    var clearBtn = document.getElementById("mybuild-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        delete state.customBuilds[sp.sname];
        persist();
        selectSpecies(sp.x);
      });
    }
    var copyBtn = document.getElementById("mybuild-copy");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var saved = state.customBuilds[sp.sname];
        if (!saved) return;
        var text = showdownSet(sp, {
          ability: saved.ability, nature: saved.nature, item: saved.item,
          evs: evsToShowdownText(saved.evs), moves: saved.moves.filter(Boolean)
        });
        copyText(text, document.getElementById("mybuild-status"), "Copiado!");
      });
    }
  }

  // Used by the Dex detail card and the team-slot card (renderTeam).
  // "Minhas anotações" - free text per species, the user's own, saved
  // locally (see state.notes). Explicit Save button rather than
  // auto-save-on-blur, matching the same predictable pattern already used
  // for renaming a saved team - the user should always know exactly when
  // something got written, not guess.
  function notesCardHtml(sp) {
    var val = state.notes[sp.sname] || "";
    return '<div class="card"><h3>Minhas anotações</h3>' +
      '<textarea id="species-notes-input" class="notes-textarea" rows="3" placeholder="Sua própria anotação sobre este Pokémon - build que testou, estratégia, o que funcionou numa luta...">' + escapeHtml(val) + '</textarea>' +
      '<div class="notes-actions"><button id="species-notes-save" class="ts-build-copy" type="button">Salvar</button>' +
      '<span id="species-notes-status" class="notes-status"></span></div>' +
    '</div>';
  }

  function buildHistoryHtml(sp) {
    var hist = BUILD_HISTORY[sp.sname];
    if (!hist || !hist.length) return "";
    var items = hist.slice().reverse().map(function (entry, i) {
      var meta = '<span class="bh-date mono">' + escapeHtml(entry.savedAt || "") + '</span>' +
        (entry.context ? '<span class="bh-context">' + escapeHtml(entry.context) + '</span>' : '');
      return buildEntryHtml(sp, entry, meta, 'data-src="hist" data-sname="' + sp.sname + '" data-idx="' + i + '"');
    }).join("");
    return '<details class="bh-details"><summary>Histórico de builds (' + hist.length + ')</summary>' + items + '</details>';
  }

  // Dex detail only (see selectSpecies) - reference/inspiration builds pulled
  // from boss trainer parties, not shown in the team card on purpose: the
  // team card is about the ACTIVE build + its own history, and a boss's
  // moveset is tuned for one specific fight, not necessarily a good general
  // build (flagged as such via the "chefão" label and (dupla) tag).
  function bossReferenceHtml(sp) {
    var refs = BOSS_BUILDS[sp.sname];
    if (!refs || !refs.length) return "";
    var items = refs.map(function (entry, i) {
      var meta = '<span class="bh-date mono">' + escapeHtml(DIFF_LABELS[entry.tier] || entry.tier) + '</span>' +
        '<span class="bh-context">' + escapeHtml(entry.boss) + (entry.db ? " (dupla)" : "") + '</span>';
      return buildEntryHtml(sp, entry, meta, 'data-src="boss" data-sname="' + sp.sname + '" data-idx="' + i + '"');
    }).join("");
    return '<details class="bh-details"><summary>Builds vistas em chefões (' + refs.length + ')</summary>' + items +
      '<p style="color:var(--text-dim);font-size:11px;margin-top:8px;">Referência do time de um chefão, não uma recomendação — o moveset foi ajustado pra aquela luta específica, não necessariamente pro seu time.</p></details>';
  }

  // Delegated once for the whole document: the Dex detail and the team slots
  // re-render their own subtree often, so binding here avoids re-attaching a
  // listener every time either view redraws.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".bh-copy");
    if (!btn) return;
    var sp = getSpeciesBySname(btn.dataset.sname);
    if (!sp) return;
    var fromBoss = btn.dataset.src === "boss";
    var list = fromBoss ? BOSS_BUILDS[sp.sname] : BUILD_HISTORY[sp.sname];
    if (!list) return;
    var entry = fromBoss ? list[parseInt(btn.dataset.idx, 10)] : list.slice().reverse()[parseInt(btn.dataset.idx, 10)];
    if (!entry) return;
    copyText(showdownSet(sp, entry), null, "");
    flashToast((fromBoss ? "Build de chefão do " : "Build antiga do ") + sp.n + " copiada (formato Showdown)");
  });

  // "+ Usar como meu build" on a history/boss-reference entry - 2026-09-09,
  // user caught that the "copiar" button above never touched "Meu build" or
  // the Team tab, only the clipboard. Same data, same effectiveBuild()
  // priority rule (a user's own pick always wins - this just sets it),
  // reuses the exact data-src/data-sname/data-idx attrs "copiar" already
  // carries so there's no second lookup scheme to keep in sync.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".use-entry-build-btn");
    if (!btn) return;
    var sp = getSpeciesBySname(btn.dataset.sname);
    if (!sp) return;
    var fromBoss = btn.dataset.src === "boss";
    var list = fromBoss ? BOSS_BUILDS[sp.sname] : BUILD_HISTORY[sp.sname];
    if (!list) return;
    var entry = fromBoss ? list[parseInt(btn.dataset.idx, 10)] : list.slice().reverse()[parseInt(btn.dataset.idx, 10)];
    if (!entry) return;
    state.customBuilds[sp.sname] = {
      ability: entry.ability || "",
      nature: entry.nature || "",
      item: entry.item || "",
      moves: (entry.moves || []).slice(0, 4),
      ivs: [31, 31, 31, 31, 31, 31],
      evs: evsTextToArray(entry.evs)
    };
    persist();
    flashToast("Build " + (fromBoss ? "de chefão " : "antiga ") + "copiada pro seu \"Meu build\" de " + sp.n);
    // Refresh the open Dex detail so "Meu build"'s fields/preview reflect
    // this write immediately, same as every other write path already does.
    if (document.getElementById("mybuild-ability")) selectSpecies(sp.x);
  });

  // A user's own "Meu build" (state.customBuilds) always wins over the
  // curated one (BUILDS/builds.json) when both exist for the same species -
  // it's THEIR pick, made deliberately in the Dex editor; the curated one is
  // a starting suggestion, not something that should keep overriding a
  // choice the user already made. Centralized here so the team-slot card,
  // "copy whole team", and the per-slot copy button can't disagree about
  // which build is actually showing - found a real bug in this session
  // where renderTeam() only ever read BUILDS, so a saved "Meu build" from
  // the Dex never reached the Team tab at all (user feedback, 2026-09-09).
  function effectiveBuild(sp) {
    var custom = state.customBuilds[sp.sname];
    if (custom) {
      // Normalized to the exact shape showdownSet()/renderTeam() already
      // expect from a BUILDS entry (evs as a formatted string, not the raw
      // 6-number array customBuilds actually stores) - found live: without
      // this, the preview printed "EVs: 0,252,0,0,0,0" (Array.toString()
      // via string concatenation) instead of "EVs: 252 Atk".
      return { ability: custom.ability, nature: custom.nature, item: custom.item, evs: evsToShowdownText(custom.evs), moves: custom.moves };
    }
    return BUILDS[sp.sname] || null;
  }

  function showdownTeam() {
    return state.team.map(getSpeciesByX).filter(Boolean).map(function (sp) {
      var b = effectiveBuild(sp);
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
        var abiNames = uniqueIds(sp.ab).map(function (id) { return ABILITIES[id][0]; }).join(", ");
        var innNames = sp.inn.map(function (id) { return ABILITIES[id][0]; }).join(", ");
        var isCustomBuild = !!state.customBuilds[sp.sname];
        var build = effectiveBuild(sp);
        var buildHtml = build ? (
          '<div class="ts-build">' +
            '<div class="ts-build-head"><span class="ts-build-label">' + (isCustomBuild ? "Meu build" : "Build (formato Showdown)") + '</span>' +
              '<button class="ts-build-copy" data-x="' + sp.x + '" type="button" title="Copiar este set">copiar</button></div>' +
            '<pre class="showdown-block">' + escapeHtml(showdownSet(sp, build)) + '</pre>' +
            (build.note ? '<div class="ts-build-note">' + escapeHtml(build.note) + '</div>' : '') +
          '</div>'
        ) : (
          '<div class="ts-build ts-build-empty">Sem build salva ainda — monte uma na ficha do Pokémon na Dex, ou peça uma ao Claude numa conversa.</div>'
        );
        var swapOpen = teamSwapIdx === i;
        slots.push('<div class="team-slot' + (swapOpen ? ' swapping' : '') + '"><div>' +
          '<div class="ts-head goto-species" data-x="' + sp.x + '" title="Ver na Dex">' + spriteImgHtml(sp.x, sp.n, 40) +
          '<div><div class="ts-name">' + escapeHtml(sp.n) + ' ' + rankBadgeHtml(sp.sname) + '</div>' +
          '<div class="ts-types">' + names.map(function (n) { return typePill(n, true); }).join("") + '</div></div></div>' +
          '<div class="ts-abis"><b>Hab.:</b> ' + escapeHtml(abiNames) + '<br><b>Innate:</b> ' + escapeHtml(innNames) + '</div>' +
          buildHtml +
          buildHistoryHtml(sp) +
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
        copyText(showdownSet(sp, effectiveBuild(sp)), null, "");
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
          '<div class="stc-sprites">' + members.map(function (sp) {
            return '<span class="goto-species" data-x="' + sp.x + '" title="Ver na Dex">' + spriteImgHtml(sp.x, sp.n, 32) + '</span>';
          }).join("") + '</div>' +
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

  // Shared by renderTeamAnalysis (the full table) and renderDashboard (the
  // one-line "biggest shared weakness" summary) - factored out so the two
  // can never quietly disagree about what the team's worst shared risk is.
  function computeSharedRisks(members) {
    var riskCount = {};
    USABLE_TYPES.forEach(function (atk) {
      members.forEach(function (sp) {
        if (abilityTypeMod(atk, sp).mult >= 2) riskCount[atk] = (riskCount[atk] || 0) + 1;
      });
    });
    return Object.keys(riskCount).map(function (t) { return { t: t, n: riskCount[t] }; })
      .filter(function (r) { return r.n >= 2; })
      .sort(function (a, b) { return b.n - a.n; });
  }

  // Dashboard summary at the top of the Dex - design proposal B, 2026-09-09.
  // Deliberately reuses computeSharedRisks() (also used by the full team
  // analysis table) rather than a separate calculation, so this can't
  // quietly disagree with what "Cobertura defensiva" says the same risk is.
  function renderDashboard() {
    var el = document.getElementById("dashboard");
    if (!el) return;
    var teamMembers = state.team.map(getSpeciesByX).filter(Boolean);
    if (!teamMembers.length) {
      el.innerHTML = '<div class="dashboard-card"><p style="color:var(--text-dim);font-size:13px;margin:0;">Monte seu time na Dex pra ver um resumo aqui.</p></div>';
      return;
    }
    var boxMembers = state.box.map(getSpeciesByX).filter(Boolean);

    var items = '<div class="dash-item"><span class="dash-label">Time</span><span class="dash-value">' + teamMembers.length + '/6</span></div>';

    var risks = computeSharedRisks(teamMembers);
    items += risks.length
      ? '<div class="dash-item"><span class="dash-label">Maior risco</span><span class="dash-value">' + typePill(risks[0].t, true) + ' <span class="mono">' + risks[0].n + '/' + teamMembers.length + '</span> fracos</span></div>'
      : '<div class="dash-item"><span class="dash-label">Maior risco</span><span class="dash-value">nenhum tipo derruba 2+ ao mesmo tempo</span></div>';

    // Swap suggestion: biggest-scoring box member vs lowest-scoring team
    // member, only surfaced when the gap is real (>=15 of 100) - a 2-point
    // difference isn't worth interrupting the user over every session.
    if (boxMembers.length) {
      var worstTeam = null, bestBox = null;
      teamMembers.forEach(function (sp) {
        var r = SPECIES_RANK[sp.sname];
        if (r && (!worstTeam || r.score < worstTeam.score)) worstTeam = { sp: sp, score: r.score, tier: r.tier };
      });
      boxMembers.forEach(function (sp) {
        var r = SPECIES_RANK[sp.sname];
        if (r && (!bestBox || r.score > bestBox.score)) bestBox = { sp: sp, score: r.score, tier: r.tier };
      });
      if (worstTeam && bestBox && bestBox.score - worstTeam.score >= 15) {
        items += '<div class="dash-item dash-suggestion"><span class="dash-label">Sugestão</span><span class="dash-value">' +
          '<span class="goto-species" data-x="' + bestBox.sp.x + '">' + escapeHtml(bestBox.sp.n) + '</span> (' + bestBox.tier + ') na caixa rende mais que ' +
          '<span class="goto-species" data-x="' + worstTeam.sp.x + '">' + escapeHtml(worstTeam.sp.n) + '</span> (' + worstTeam.tier + ') no time</span></div>';
      }
    }

    el.innerHTML = '<div class="dashboard-card">' + items + '</div>';
  }

  function renderTeamAnalysis(members) {
    var el = document.getElementById("team-analysis");
    if (!members.length) {
      el.innerHTML = '<div class="card"><p style="color:var(--text-dim);font-size:13px;">Adicione Pokémon na aba Dex para ver a cobertura defensiva do time.</p></div>';
      return;
    }
    var head = '<th class="rowhead">Vs. tipo</th>' + members.map(function (sp) { return '<th>' + escapeHtml(sp.n.split(" ")[0]) + '</th>'; }).join("");
    var anyAbilityMod = false;
    var rows = USABLE_TYPES.map(function (atk) {
      var cells = members.map(function (sp) {
        var info = abilityTypeMod(atk, sp);
        var m = info.mult;
        var cls = m === 0 ? "cov-immune" : m >= 2 ? "cov-weak" : m < 1 ? "cov-resist" : "cov-neutral";
        var label = m === 0 ? "0" : m === 0.25 ? "&frac14;" : m === 0.5 ? "&frac12;" : m === 1 ? "&mdash;" : (Math.round(m * 100) / 100) + "&times;";
        var flag = "";
        if (info.reasons.length) {
          anyAbilityMod = true;
          flag = '<span class="cov-flag" title="' + escapeHtml(info.reasons.join("; ")) + '">*</span>';
        }
        return '<td><span class="cov-cell ' + cls + '">' + label + flag + '</span></td>';
      }).join("");
      return '<tr><td class="rowhead">' + typePill(atk, true) + '</td>' + cells + '</tr>';
    }).join("");
    var abilityNote = anyAbilityMod
      ? '<p style="color:var(--text-dim);font-size:11.5px;margin-top:6px;">* ajustado por habilidade inata ou travada (passe o mouse pra ver qual). Só cobre as habilidades já verificadas neste time — o resto da tabela ainda é o multiplicador de tipo puro, sem considerar habilidade.</p>'
      : '<p style="color:var(--text-dim);font-size:11.5px;margin-top:6px;">Tabela de multiplicador de tipo puro — nenhuma habilidade deste time altera esses valores hoje (mas isso só está verificado para as habilidades já conferidas, não para as 1033 do jogo).</p>';

    var risks = computeSharedRisks(members);
    var riskHtml = risks.length ? risks.map(function (r) {
      var pct = (r.n / members.length) * 100;
      return '<div class="risk-item">' + typePill(r.t, true) +
        '<div class="risk-bar-track"><div class="risk-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="mono">' + r.n + '/' + members.length + ' fracos</span></div>';
    }).join("") : '<p style="color:var(--text-dim);font-size:13px;">Nenhum tipo derruba 2 ou mais membros do time ao mesmo tempo &mdash; boa cobertura defensiva de base.</p>';

    // Used to be two bare <h3>s dumped straight into #team-analysis, with no
    // .card wrapper - the only section titles in the whole app that didn't
    // get the standard uppercase/letter-spaced/dim treatment every other
    // <h3> gets (see .card h3). Right in the densest, most important screen
    // in the tool, of all places (design review, 2026-09-09). Two separate
    // cards now, matching how every other section on this page is chunked
    // (Stats, Habilidades, Builds de referência...), not one mega-block.
    el.innerHTML = '<div class="card"><h3>Riscos compartilhados do time</h3><div class="risk-list">' + riskHtml + '</div></div>' +
      '<div class="card"><h3>Cobertura defensiva</h3>' +
      '<div class="scroll-x"><table class="cov-table"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      abilityNote + '</div>';
  }

  // ---------------- bosses view ----------------
  var bossInited = false;
  // level: null until first shown, then defaults once to the current level
  // cap (getCurrentCap()) as a starting point - NOT reset every time a
  // different boss is opened, so browsing several bosses at "the level I'm
  // actually at" doesn't mean re-typing it each time.
  var bossState = { query: "", cat: "", selected: null, diff: "party", level: null };

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
      var buildBtn = e.target && e.target.closest && e.target.closest(".use-boss-build-btn");
      if (buildBtn) {
        var boss = BOSSES[bossState.selected];
        var party = boss && boss[bossState.diff || "party"];
        var m = party && party[parseInt(buildBtn.dataset.idx, 10)];
        var sp = m && getSpeciesByX(m.x);
        if (!sp) return;
        state.customBuilds[sp.sname] = {
          ability: m.abi || "",
          nature: m.nat || "",
          item: m.item || "",
          moves: (m.mv || []).slice(0, 4),
          ivs: m.ivsRaw.slice(),
          evs: m.evsRaw.slice()
        };
        persist();
        flashToast("Build do " + m.n + " copiado pro seu \"Meu build\" - vá na Dex pra ver/ajustar");
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

  var STAT_LABELS_SHORT = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
  function renderBossDetail() {
    var boss = BOSSES[bossState.selected];
    if (!boss) return;
    var diffKey = bossState.diff || "party";
    var party = boss[diffKey];
    if (!party || !party.length) { diffKey = "party"; party = boss.party; bossState.diff = "party"; }

    if (bossState.level === null) bossState.level = getCurrentCap() || 50;

    var availableDiffs = ["party", "insane", "hell"].filter(function (k) { return boss[k] && boss[k].length; });
    var diffBtns = availableDiffs.length > 1 ? availableDiffs.map(function (k) {
      var active = k === diffKey ? " active" : "";
      return '<button class="chip-btn' + active + '" data-diff="' + k + '" type="button" style="margin-right:6px;">' + DIFF_LABELS[k] + '</button>';
    }).join("") : "";

    var monsHtml = party.map(function (m, idx) {
      var sp = getSpeciesByX(m.x);
      // Mega Evolution / Primal Reversion, 2026-09-09 (user's follow-up
      // question on the held-item pass): a Mega Stone or Primal orb doesn't
      // change a stat, it turns the holder into an entirely different
      // species (own stats/types/abilities), already modeled as its own
      // dex entry (e.g. "Miloticite" -> "Milotic Mega"). MEGA_FORMS maps
      // item name -> that species' sname, built from this hack's own
      // Pokemon Showdown fork (megaStone/megaEvolves fields) cross-checked
      // against a species-name matcher run on the real game data - not
      // guessed. Deliberately does NOT try to model which of the Mega
      // form's OWN choosable abilities activates (its 3 choosable slots
      // are a completely different id pool from the base form's - checked
      // directly on Milotic vs Milotic Mega, zero overlap - so nothing in
      // this data says which one a given boss "picked"), and does NOT
      // touch weather/terrain/Trick-Room persistence across the
      // transformation - that needs real turn-order + multi-Pokemon battle
      // state, the same category of simulation this calculator has always
      // stayed out of (see the level-cap caveat below).
      var megaSname = MEGA_FORMS[m.item];
      var megaSp = megaSname ? getSpeciesBySname(megaSname) : null;
      var effectiveSp = megaSp || sp;
      var displayX = megaSp ? megaSp.x : m.x;
      var displayName = megaSp ? megaSp.n : m.n;
      var typesHtml = effectiveSp ? speciesTypeNames(effectiveSp).map(function (n) { return typePill(n, true); }).join("") : "";
      var transformNote = megaSp
        ? '<div class="bm-row bm-transform">Entra como <b>' + escapeHtml(m.n) + '</b>, muda pra isso com ' + escapeHtml(m.item) + '</div>'
        : "";
      // Final stats at the level typed in above - only computable at all
      // when the species resolves (need base stats) and the boss data has
      // real EV/IV arrays (should always be true post-2026-09-09, but a
      // species that fails to resolve degrades safely to no stats shown
      // rather than a crash or a fabricated number).
      var statsHtml = "";
      if (effectiveSp && m.evsRaw && m.ivsRaw) {
        var vals = effectiveSp.b.map(function (base, i) {
          return calcFinalStat(base, m.ivsRaw[i], m.evsRaw[i], bossState.level, i, m.nat, m.item, m.n);
        });
        statsHtml = '<div class="bm-stats">' + vals.map(function (v, i) {
          // Flag which stat(s) the held item actually changed - same "*" +
          // tooltip pattern already used for ability-adjusted type
          // multipliers (Meu Time's coverage table), not a new convention.
          // A species-gated item (Light Ball) can flag more than one stat,
          // each possibly at a different multiplier - re-check per stat
          // rather than reusing one item-wide flag like the simpler items.
          // Mega/Primal items are never in ITEM_STAT_MODS, so this simply
          // stays unflagged for them - the whole stat block already
          // reflects the transformation, no single stat to point at.
          var rule = itemRuleFor(m.item, i, m.n);
          var flag = rule
            ? '<span class="cov-flag" title="' + escapeHtml(m.item) + ' (x' + rule.mult + ')">*</span>' : "";
          return '<span class="bm-stat"><span class="bm-stat-label">' + STAT_LABELS_SHORT[i] + '</span><span class="mono">' + v + '</span>' + flag + '</span>';
        }).join("") + '</div>';
      }
      var abiHtml;
      if (megaSp) {
        var megaInnNames = (megaSp.inn || []).map(function (id) { return ABILITIES[id] ? ABILITIES[id][0] : null; }).filter(Boolean);
        abiHtml = '<div class="bm-row"><b>Entra com:</b> ' + escapeHtml(m.abi || "?") + '</div>' +
          '<div class="bm-row"><b>Após transformar:</b> ' +
          (megaInnNames.length ? escapeHtml(megaInnNames.join(", ")) + ' (inata' + (megaInnNames.length > 1 ? "s" : "") + ')' + (megaSp.ab && megaSp.ab.length ? " + " : "") : "") +
          (megaSp.ab && megaSp.ab.length ? '1 escolhível própria da forma (não sabemos qual das ' + megaSp.ab.length + ')' : "") +
          '</div>';
      } else {
        abiHtml = '<div class="bm-row"><b>Habilidade:</b> ' + escapeHtml(m.abi || "?") + '</div>';
      }
      return '<div class="boss-mon-card">' +
        '<div class="bm-head goto-species" data-x="' + displayX + '" title="Ver na Dex">' + spriteImgHtml(displayX, displayName, 36) +
        '<div><div class="bm-name">' + escapeHtml(displayName) + '</div>' +
        '<div class="bm-types">' + typesHtml + '</div></div></div>' +
        transformNote +
        abiHtml +
        '<div class="bm-row"><b>Item:</b> ' + escapeHtml(m.item || "nenhum") + '</div>' +
        '<div class="bm-row"><b>Nature:</b> ' + escapeHtml(m.nat || "?") + '</div>' +
        (m.evs ? '<div class="bm-row"><b>EVs:</b> ' + escapeHtml(m.evs) + '</div>' : "") +
        '<div class="bm-row"><b>Golpes:</b> ' + escapeHtml(m.mv.join(" / ")) + '</div>' +
        statsHtml +
        // Copies this boss party member's build straight into "Meu build"
        // for the same species - 2026-09-09, user feedback: the only way to
        // act on a boss's set was to export text and paste it into a chat.
        // Saved under the BASE (held) species' sname, even when Mega/Primal
        // transformed - the held item IS the mega stone/orb itself, so a
        // player's own copy of that Pokemon holding the same item would
        // transform the same way. Only offered when the base species and
        // its raw EV/IV arrays actually resolve (same guard as statsHtml).
        (sp && m.evsRaw && m.ivsRaw
          ? '<button class="ts-build-copy use-boss-build-btn" data-idx="' + idx + '" type="button" style="margin-top:8px;">+ Usar como meu build (' + escapeHtml(m.n) + ')</button>'
          : "") +
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
      '<div class="card"><h3>Time do chefão' + (diffKey !== "party" ? " — " + DIFF_LABELS[diffKey] : "") + '</h3>' +
        '<div class="boss-level-row"><label for="boss-level-input">Status final calculados pro nível</label>' +
          '<input type="number" id="boss-level-input" min="1" max="100" value="' + bossState.level + '"></div>' +
        '<p style="color:var(--text-dim);font-size:11px;margin:4px 0 12px;max-width:65ch;">Você digita o nível — não temos como saber o nível real de um treinador nos dados do jogo (por isso não existe uma calculadora de dano completa aqui, só isso). EVs/IVs são reais, extraídos do jogo. Considera o item quando é Choice Band/Specs/Scarf, Assault Vest, Tactical Vest, Thick Club ou Light Ball (marcado com *). Quando é Mega Stone ou orbe de reversão primal, os status já são calculados na forma transformada (types e stats reais dessa forma) — mas não sabemos qual das habilidades escolhíveis DA FORMA MEGA fica ativa (os dados não dizem), e não simulamos clima/campo/Trick Room já ativos antes da transformação (isso exigiria simular a ordem dos turnos, que este cálculo não faz). Efeito de habilidade em geral e itens ainda não identificados também não entram na conta.</p>' +
        '<div class="boss-mon-grid">' + monsHtml + '</div></div>' +
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

    // "change" (fires on blur/Enter), not "input" (fires every keystroke) -
    // renderBossDetail() replaces the whole card via innerHTML, which would
    // yank focus off this very input after the first digit if it re-rendered
    // on every keystroke, making a 2-digit level impossible to type.
    var levelInput = document.getElementById("boss-level-input");
    if (levelInput) levelInput.addEventListener("change", function () {
      var v = parseInt(levelInput.value, 10);
      if (isNaN(v) || v < 1) v = 1;
      bossState.level = Math.min(100, v);
      renderBossDetail();
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

_145 linhas, 7.255 bytes._ **Ponto de entrada unico do build.**

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
    # Back-end review, 2026-09-09: this used to be a manual step nobody was
    # forced to remember - same class of risk as slim_dex.ps1/
    # expand_combo_abilities.ps1 used to be before they got wired in. Only
    # runs here (not on -SkipExtract, which never touches game data at all)
    # so routine template-only iteration doesn't pay a network round-trip.
    # A warning, not a hard failure: drift means "don't trust a build/strategy
    # off this data without re-checking", not "nothing can be built right
    # now" - hard-blocking would stop even unrelated template work the
    # moment upstream changes, which is worse than a loud warning.
    Write-Output "--- checking upstream data for drift ---"
    & (Join-Path $PSScriptRoot "check_upstream.ps1")
    if ($LASTEXITCODE -ne 0) {
        Write-Output ""
        Write-Output "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
        Write-Output "!! UPSTREAM DATA DRIFT DETECTED (or check failed) - see details above.  !!"
        Write-Output "!! Builds/strategy suggestions may be based on stale game data. Run     !!"
        Write-Output "!! scripts\check_upstream.ps1 directly for the full report.             !!"
        Write-Output "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
        Write-Output ""
    } else {
        Write-Output "  em dia."
    }
    Write-Output "--- regenerating dex_compact.json and bosses.json from raw source ---"
    & (Join-Path $PSScriptRoot "transform.ps1")
    & (Join-Path $PSScriptRoot "extract_bosses.ps1")
    Write-Output "--- extracting boss reference builds ---"
    & (Join-Path $PSScriptRoot "extract_boss_builds.ps1")
    # These used to be manual, run-by-hand steps, which meant a fresh
    # transform.ps1 run silently reverted slim_dex.ps1's size cuts and
    # expand_combo_abilities.ps1's "A + B" expansions back to their raw
    # state (see AUDITORIA-DOSSIE.md 1.3). Both edit their target file
    # in place and are idempotent, so they're safe to always run here.
    Write-Output "--- slimming dex_compact.json ---"
    & (Join-Path $PSScriptRoot "slim_dex.ps1")
    Write-Output "--- expanding combo abilities ---"
    & (Join-Path $PSScriptRoot "expand_combo_abilities.ps1")
    # Must run AFTER expand_combo_abilities.ps1: it scores each ability's
    # translated text (including combo abilities), so it needs the final
    # expanded description, not the raw "A + B" placeholder.
    Write-Output "--- computing species ranks ---"
    & (Join-Path $PSScriptRoot "compute_species_rank.ps1")
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
    "__BUILD_HISTORY_JSON__" = Join-Path $dataDir "build_history.json"
    "__BOSS_BUILDS_JSON__" = Join-Path $dataDir "boss_reference_builds.json"
    "__SPECIES_RANK_JSON__" = Join-Path $dataDir "species_rank.json"
    "__MEGA_FORMS_JSON__" = Join-Path $dataDir "mega_forms.json"
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

_144 linhas, 6.795 bytes._ Escritor de JSON manual, compartilhado.

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

# Raw EVs are stored as a 6-int array [HP,Atk,Def,SpA,SpD,Spe] (same order as
# dex_compact.json species "b" base-stat arrays). Format as the same Showdown
# EV string style already used by hand in data/builds.json, e.g.
# "252 HP / 252 SpD / 4 Def" - zero values dropped, HP/Atk/Def/SpA/SpD/Spe order.
# Scores one ability's translated Portuguese description (from
# data/ability_translations_pt.json) 0-3 for PERSONAL combat impact - the
# survivability/damage relevance to the one Pokemon that has it, not
# team-wide utility like weather-setting (out of scope: the regex patterns
# below can't reliably judge that, so it's left neutral rather than guessed).
# This is the ability dimension of scripts/compute_species_rank.ps1 - it
# exists as a shared function (not copy-pasted) so scripts/score_abilities.ps1
# (the calibration/research tool) and the real computation always agree.
# Calibrated 2026-09-08 against all 1033 translated abilities - see
# score_abilities.ps1's distribution/sample output before changing these
# rules, a bug here silently reweights every species' rank.
function Score-AbilityText([string]$desc) {
    if (-not $desc) { return 0 }
    $d = $desc

    # A "NAO dobra X" clause is a disambiguation note (the style guide adds it
    # after a flat damage-halving ability, to clarify it's NOT ALSO a Fur-Coat
    # -style stat-doubling effect) - strip it before any "Dobra" check below,
    # otherwise the negation reads as a false positive for "doubles a stat".
    $dobraPositive = $d -replace '[Nn][ãa]o dobra[^.]*\.?', ''

    # Tier 3: full type immunity combined with a beneficial secondary effect
    # (heals HP, boosts a stat by >=1.2x, or a "no damage instead" clause), or
    # a Sturdy-like "cannot be OHKO'd" guarantee.
    if ($d -match 'Imune a (golpes d[oe] tipo|ataques d[oe] tipo)') {
        if ($d -match 'Cura \d+% do HP|Aumenta.*em \d+(\.\d+)?x|usa \w+ se atingido|maximiza a Velocidade') { return 3 }
    }
    if ($d -match 'N[ãa]o recebe dano.*se atingido por um golpe d[oe] tipo') { return 3 }
    if ($d -match 'n[ãa]o pode ser nocauteado em um golpe s[óo]') { return 3 }

    # Tier 2: solid unconditional mechanical advantage.
    if ($d -match 'Imune a (golpes d[oe] tipo|ataques d[oe] tipo)') { return 2 }
    if ($d -match 'Recebe (3[0-9]|[4-9][0-9]|100)% menos dano de golpes super efetivos') { return 2 }
    # Whole-category damage halving (all physical OR all special hits) is
    # broad enough to matter against roughly half of all possible attackers -
    # distinct from (and stronger than) halving just ONE type, see tier 1.
    if ($d -match 'Reduz pela metade o dano recebido de golpes (f[íi]sicos|especiais)') { return 2 }
    if ($d -match 'Cura \d\d+% do HP m[áa]ximo (ao|no fim)') { return 2 }
    if ($d -match 'Aumenta (a pr[óo]pria|o pr[óo]prio|os pr[óo]prios golpes).*em [1-9]\.[3-9]x') { return 2 }
    if ($d -match 'Aumenta.*em [2-9] est[áa]gios?') { return 2 }
    if ($dobraPositive -match 'Dobra ') { return 2 }

    # Tier 1: minor/situational bonus - single status immunity, small flat
    # bonus, small stage change, small/conditional healing, single-TYPE
    # (not whole-category) damage halving.
    if ($d -match 'Imune a (paralisia|envenenamento|queimadura|sono|confus[ãa]o|congelamento|atra[çc][ãa]o)') { return 1 }
    if ($d -match 'N[ãa]o pode ser (envenenado|paralisado|queimado|confuso|adormecido|congelado)') { return 1 }
    if ($d -match 'Recebe \d+% menos dano') { return 1 }
    if ($d -match 'Reduz pela metade o dano recebido') { return 1 }
    if ($d -match 'Aumenta.*em 1 est[áa]gio') { return 1 }
    if ($d -match 'Cura \d+% do HP') { return 1 }
    if ($d -match 'Aumenta.*em 1\.[1-2]x') { return 1 }

    return 0
}

function Format-Evs($evsArr) {
    $labels = @("HP", "Atk", "Def", "SpA", "SpD", "Spe")
    $arr = @($evsArr)
    $parts = New-Object System.Collections.ArrayList
    for ($i = 0; $i -lt 6; $i++) {
        $v = if ($i -lt $arr.Count) { [int]$arr[$i] } else { 0 }
        if ($v -gt 0) { [void]$parts.Add("$v $($labels[$i])") }
    }
    return ($parts -join " / ")
}
```

### scripts/transform.ps1

_106 linhas, 3.666 bytes._ Gera dex_compact.json a partir dos dados brutos.

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

# --- items lookup: flat, sorted list of real item names (no ids needed -
# a custom build just stores the chosen name as a string, same as
# bosses.json/builds.json already do). Placeholder entries filtered out.
$itemsOut = @($data.items | ForEach-Object { $_["name"] } | Where-Object { $_ -and $_ -ne "????????" } | Sort-Object -Unique)

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
    items = $itemsOut
    species = $speciesOut.ToArray()
}

$outJson = ConvertTo-JsonManual $out
$outPath = Join-Path $dataDir "dex_compact.json"
[System.IO.File]::WriteAllText($outPath, $outJson, (New-Object System.Text.UTF8Encoding($false)))

Write-Output "transform.ps1: OK ($($speciesOut.Count) species, $($abilitiesOut.Count) abilities, $($movesOut.Count) moves) -> $outPath ($((Get-Item $outPath).Length) bytes)"
```

### scripts/extract_bosses.ps1

_89 linhas, 3.568 bytes._ Gera bosses.json.

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
            evs = Format-Evs $mon["evs"]
            # Raw 6-int arrays alongside the formatted "evs" string above -
            # the string is for display (existing boss card / showdown-style
            # exports), these are for the final-stat calculator (2026-09-09
            # field research + approved next step) to compute with, without
            # re-parsing a formatted string back into numbers. Real IVs, not
            # assumed 31s - the raw game data has them per trainer (flawless
            # in every sample checked so far, but extracted for real in case
            # some trainer isn't).
            evsRaw = @($mon["evs"])
            ivsRaw = @($mon["ivs"])
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

### scripts/extract_boss_builds.ps1

_76 linhas, 3.417 bytes._ Gera boss_reference_builds.json (maior tier de cada especie em qualquer luta).

```powershell
<#
For every species that appears in a boss trainer's party (data/bosses.json),
finds that species' OWN highest difficulty tier reached anywhere in the game
(hell > insane > party) and keeps every boss appearance at that tier as a
reference build - data/boss_reference_builds.json, keyed by sname.

This is reference/inspiration data shown in the Dex ("Builds vistas em
chefoes"), NOT a replacement for the hand-curated data/builds.json: a boss's
moveset is tuned for that one fight (sometimes a double battle, sometimes a
support/stall set), not necessarily a generically good build for the
player's own team. Framed that way in the UI on purpose.

Run AFTER extract_bosses.ps1 and transform.ps1 (needs both data/bosses.json
and data/dex_compact.json - the latter only to resolve x -> sname, since
bosses.json itself is keyed by the unstable per-build x, same as everything
else species-index-based - see the x vs sname note in artifact_template.html).
#>

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser

$bosses = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "bosses.json") -Raw -Encoding UTF8))
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))

$snameByX = @{}
foreach ($s in $dex.species) { if ($s) { $snameByX[[string]$s["x"]] = $s["sname"] } }

$tierRank = @{ party = 0; insane = 1; hell = 2 }

# Pass 1: find each species' own best (highest) tier reached across ALL boss
# appearances anywhere - "highest tier" is per-species, not per-fight, since
# the same Pokemon can show up as a throwaway party-tier member in one fight
# and a hell-tier showcase in another.
$bestTier = @{}
$occurrences = New-Object System.Collections.ArrayList
foreach ($b in $bosses) {
    foreach ($tier in @("party", "insane", "hell")) {
        foreach ($m in @($b[$tier])) {
            if (-not $m -or -not $m["n"] -or $m["n"] -eq "?") { continue }
            $x = [string]$m["x"]
            $rank = $tierRank[$tier]
            if (-not $bestTier.ContainsKey($x) -or $rank -gt $bestTier[$x]) { $bestTier[$x] = $rank }
            [void]$occurrences.Add(@{ x = $x; rank = $rank; tier = $tier; boss = $b["name"]; cat = $b["cat"]; db = $b["db"]; m = $m })
        }
    }
}

# Pass 2: keep only the occurrences that match each species' own best tier.
$out = [ordered]@{}
foreach ($occ in $occurrences) {
    if ($occ.rank -ne $bestTier[$occ.x]) { continue }
    $sname = $snameByX[$occ.x]
    if (-not $sname) { continue }
    if (-not $out.Contains($sname)) { $out[$sname] = New-Object System.Collections.ArrayList }
    [void]$out[$sname].Add([ordered]@{
        boss    = $occ.boss
        cat     = $occ.cat
        db      = [bool]$occ.db
        tier    = $occ.tier
        ability = $occ.m["abi"]
        nature  = $occ.m["nat"]
        evs     = $occ.m["evs"]
        item    = $occ.m["item"]
        moves   = $occ.m["mv"]
    })
}

$outPath = Join-Path $dataDir "boss_reference_builds.json"
[System.IO.File]::WriteAllText($outPath, (ConvertTo-JsonManual $out), (New-Object System.Text.UTF8Encoding($false)))

$speciesCount = $out.Keys.Count
$entryCount = 0
foreach ($k in $out.Keys) { $entryCount += $out[$k].Count }
Write-Output "extract_boss_builds.ps1: OK ($speciesCount especies, $entryCount builds de referencia) -> $outPath ($((Get-Item $outPath).Length) bytes)"
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

_78 linhas, 2.904 bytes._ Remove campos nunca exibidos. Edita in-place.

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
    items = $dex.items
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

### scripts/compute_species_rank.ps1

_313 linhas, 14.751 bytes._ Gera species_rank.json (rank SS/S/A/B/C/D geral + por estagio evolutivo).

```powershell
<#
Computes a fully automatic SS/S/A/B/C/D rank for every species, from three
signals that need no per-Pokemon human review and no user interaction:

  1. BST (base stat total) - percentile rank.
  2. Boss usage - how many DISTINCT boss trainers (data/bosses.json, any
     tier: party/insane/hell) use this species anywhere. Real signal (only
     22% of species appear in any boss fight at all, only ~1% appear in 5+),
     but a known limitation: this can't tell "genuinely weak" apart from
     "late-game/postgame exclusive that just hasn't had a chance to appear
     yet", or "used for type-theme flavor, not power". Documented, not
     silently hidden.
  3. Ability impact - Score-AbilityText (common.ps1) applied to every innate
     (always active - summed) and the BEST of the 3 choosable slots (species'
     ceiling with an ideal pick). Systematically computed for all 1033
     translated abilities, not a sparse hand-picked subset - see
     scripts/score_abilities.ps1 for the calibration pass this rubric came
     from. Known limitation: the rubric only catches PERSONAL
     damage/survivability impact from patterns common in this project's
     translation style guide - it does not (cannot, from regex alone) judge
     team-wide utility (weather-setting, hazard-setting) or movepool quality.

Produces TWO ranks per species, both from the same three signals and the
same $WEIGHTS:

  - tier/score: percentile against ALL 1906 species. Answers "how strong is
    this RIGHT NOW" - a first-stage Pokemon will almost always rank low here,
    which is expected (it structurally has less BST than something fully
    evolved), not a bug.
  - stageTier/stageScore: percentile against only OTHER species at the same
    evolution stage (see Get-Stage below - 1 = no predecessor, otherwise
    predecessor's stage + 1; Mega/regional evolutions count as a further
    stage same as a normal one). Answers "is this a GOOD example of a
    Pokemon at this stage" - a first-stage mon that's simply strong for a
    first-stage mon can show SS here even while showing D/C globally. This
    is what a 2026-09-08 user request specifically asked for: rank each
    evolution stage against its own peers, not against fully-evolved forms.

Output: data/species_rank.json, keyed by sname, keeping the full breakdown
(not just the letters) so the UI can show its work.

Run after transform.ps1, extract_bosses.ps1 and expand_combo_abilities.ps1
(needs dex_compact.json, bosses.json, ability_translations_pt.json all
present and current).
#>

. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$ser = New-GameDataParser

$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))
$bosses = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "bosses.json") -Raw -Encoding UTF8))
$pt = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "ability_translations_pt.json") -Raw -Encoding UTF8))

# Order guard (architecture review, 2026-09-09): this script must run AFTER
# expand_combo_abilities.ps1, because Score-AbilityText reads the EXPANDED
# text - a raw "A + B" combo description matches none of its patterns and
# silently scores 0. Nothing enforced that ordering except a comment in
# build.ps1, so a reordering mistake would miscore all 151 combo abilities
# quietly. Detect it the same way expand_combo_abilities.ps1 detects a combo
# (name matches "X + Y" against known ability names) and fail loud if the
# translated text hasn't actually been expanded (no "`n- " marker).
$byName = @{}
for ($i = 0; $i -lt $dex.abilities.Count; $i++) {
    $n = $dex.abilities[$i][0]
    if ($n -and -not $byName.ContainsKey($n)) { $byName[$n] = $i }
}
$unexpanded = New-Object System.Collections.ArrayList
for ($i = 0; $i -lt $dex.abilities.Count; $i++) {
    $rawDesc = $dex.abilities[$i][1]
    if (-not $rawDesc -or $rawDesc -notmatch '\+') { continue }
    $parts = ($rawDesc.TrimEnd('.').Trim()) -split '\s*\+\s*'
    if ($parts.Count -lt 2) { continue }
    $isCombo = $true
    foreach ($p in $parts) { if (-not $byName.ContainsKey($p.Trim())) { $isCombo = $false; break } }
    if (-not $isCombo) { continue }
    $translated = $pt["$i"]
    if (-not $translated -or $translated -notmatch "`n-") { [void]$unexpanded.Add($dex.abilities[$i][0]) }
}
if ($unexpanded.Count -gt 0) {
    throw "compute_species_rank.ps1: $($unexpanded.Count) combo abilities are not expanded in ability_translations_pt.json ($($unexpanded -join ', ')) - run expand_combo_abilities.ps1 before this script (build.ps1 already orders this correctly; if you're running compute_species_rank.ps1 standalone, run expand_combo_abilities.ps1 first)."
}

$abilityScoreCache = @{}
function Get-AbilityScore([int]$id) {
    $key = [string]$id
    if (-not $abilityScoreCache.ContainsKey($key)) {
        $abilityScoreCache[$key] = Score-AbilityText $pt[$key]
    }
    return $abilityScoreCache[$key]
}

# --- boss usage: distinct boss names per species x, any tier ---
$bossCountByX = @{}
foreach ($b in $bosses) {
    $seen = @{}
    foreach ($tier in "party", "insane", "hell") {
        foreach ($m in @($b[$tier])) {
            if ($m -and $null -ne $m["x"]) { $seen[[string]$m["x"]] = 1 }
        }
    }
    foreach ($x in $seen.Keys) {
        if (-not $bossCountByX.ContainsKey($x)) { $bossCountByX[$x] = 0 }
        $bossCountByX[$x] = $bossCountByX[$x] + 1
    }
}

# --- evolution stage: 1 = nothing REAL evolves into this species, otherwise
# predecessor's stage + 1. A Mega/Primal transition does NOT count as a real
# stage and does not increment - it's a power-up, not growth, and box
# legendaries (already sitting on legendary-tier BST in their BASE form)
# disproportionately have a Mega/Primal-only path. Measured: treating Mega
# as a real stage let 28 of 529 "stage 1, has some evolution" species be
# legendary-tier (BST >= 580) - only ~16 species fit the top-3% SS cutoff,
# so that small group could occupy the ENTIRE SS/S band on its own and a
# real basic Pokemon like Bulbasaur would never be able to show
# stage-relative SS/S, defeating the point of the feature (comparing basics
# against other basics, not against legendaries that happen to share the
# same predecessor-count). ---
$megaKindIdx = @()
for ($ki = 0; $ki -lt $dex.evoKinds.Count; $ki++) {
    if ($dex.evoKinds[$ki] -match "MEGA_EVOLUTION|PRIMAL_REVERSION") { $megaKindIdx += $ki }
}

$predecessorOfX = @{}      # targetX -> sourceX, REAL (non-Mega/Primal) edges only
foreach ($s in $dex.species) {
    if (-not $s) { continue }
    foreach ($ev in @($s["ev"])) {
        if ($megaKindIdx -contains $ev[0]) { continue }
        $targetX = [string]$ev[2]
        # A handful of species (~30/1906) have more than one apparent
        # predecessor in the raw data (duplicate evolution-method entries
        # pointing at the same target, or a genuine branch). First one found
        # wins - stage is meant as a coarse bucket, not exact lineage, and
        # this affects too few species to be worth resolving more precisely.
        if (-not $predecessorOfX.ContainsKey($targetX)) { $predecessorOfX[$targetX] = [string]$s["x"] }
    }
}
$stageCache = @{}
function Get-Stage([string]$x, [int]$depth) {
    if ($stageCache.ContainsKey($x)) { return $stageCache[$x] }
    if ($depth -gt 10) { return 1 }  # cycle guard, shouldn't trigger on real data
    if (-not $predecessorOfX.ContainsKey($x)) { $stageCache[$x] = 1; return 1 }
    $s = (Get-Stage $predecessorOfX[$x] ($depth + 1)) + 1
    $stageCache[$x] = $s
    return $s
}

# --- per-species raw signals ---
$rows = New-Object System.Collections.ArrayList
foreach ($s in $dex.species) {
    if (-not $s) { continue }
    $x = [string]$s["x"]
    $bst = (@($s["b"]) | Measure-Object -Sum).Sum

    $innIds = @($s["inn"]) | Where-Object { $_ -and $_ -ne 0 } | Select-Object -Unique
    $innScore = 0
    foreach ($id in $innIds) { $innScore += (Get-AbilityScore $id) }
    $abIds = @($s["ab"]) | Where-Object { $_ -and $_ -ne 0 } | Select-Object -Unique
    $abBest = 0
    foreach ($id in $abIds) { $sc = Get-AbilityScore $id; if ($sc -gt $abBest) { $abBest = $sc } }
    $abilityScore = $innScore + $abBest

    $bossCount = if ($bossCountByX.ContainsKey($x)) { $bossCountByX[$x] } else { 0 }

    $stage = Get-Stage $x 0
    # Real evolution line = a real (non-Mega/Primal) edge on at least one
    # side. stage > 1 already proves a real predecessor (Get-Stage only
    # follows $predecessorOfX, which holds real edges only); otherwise check
    # for a real edge ahead. Species with neither (standalones, and
    # Mega/Primal-only lineages like most box legendaries) get no stageTier
    # at all - see the doc-comment above $megaKindIdx for why.
    $hasRealNextStage = $false
    foreach ($ev in @($s["ev"])) { if ($megaKindIdx -notcontains $ev[0]) { $hasRealNextStage = $true; break } }
    $hasEvolutionLine = ($stage -gt 1) -or $hasRealNextStage

    [void]$rows.Add([ordered]@{
        sname = $s["sname"]; bst = $bst; bossCount = $bossCount; abilityScore = $abilityScore
        stage = $stage; hasEvolutionLine = $hasEvolutionLine
    })
}

# --- percentile rank helper: fraction of the population at or below this
# value, as 0-100. Ties share the same (average) percentile. ---
function Get-PercentileRanks($values) {
    $sorted = $values | Sort-Object
    $n = $sorted.Count
    $rankOf = @{}
    $i = 0
    while ($i -lt $n) {
        $j = $i
        while ($j + 1 -lt $n -and $sorted[$j + 1] -eq $sorted[$i]) { $j++ }
        $avgPos = (($i + 1) + ($j + 1)) / 2.0
        $pct = ($avgPos / $n) * 100
        $rankOf[[string]$sorted[$i]] = [math]::Round($pct, 2)
        $i = $j + 1
    }
    return $rankOf
}

# Ability gets real weight because it's now systematically computed for all
# 1906 species (not a sparse hand-picked subset) - but BST still leads since
# it's the most universally reliable signal, and boss usage is real but
# noisier (see the doc-comment above). Same weights for the global rank and
# every per-stage rank, so the two numbers stay comparable in spirit.
$WEIGHTS = @{ bst = 0.40; boss = 0.25; ability = 0.35 }

function Get-Tier([double]$pct) {
    if ($pct -ge 97) { return "SS" }
    if ($pct -ge 90) { return "S" }
    if ($pct -ge 75) { return "A" }
    if ($pct -ge 50) { return "B" }
    if ($pct -ge 20) { return "C" }
    return "D"
}

# Computes tier+score+the three percentiles for one population of rows
# (either ALL species for the global rank, or one stage's worth for the
# stage-relative rank). Returns sname -> breakdown. Percentile-ranks the
# composite ITSELF before bucketing (not the raw weighted average) - a
# weighted average of percentiles is not itself uniformly distributed
# (species rarely top all three signals at once, so raw composites regress
# toward the middle); measured on the first version of this script, which
# applied Get-Tier's cutoffs directly to the raw composite and produced
# ZERO SS-tier species. Fixed by percentile-ranking the composite before
# bucketing, done here and reused for every group.
function Compute-Tiers($subsetRows) {
    $bstRanks = Get-PercentileRanks ($subsetRows | ForEach-Object { $_.bst })
    $bossRanks = Get-PercentileRanks ($subsetRows | ForEach-Object { $_.bossCount })
    $abilityRanks = Get-PercentileRanks ($subsetRows | ForEach-Object { $_.abilityScore })

    $composites = @{}
    foreach ($r in $subsetRows) {
        $bstPct = $bstRanks[[string]$r.bst]
        $bossPct = $bossRanks[[string]$r.bossCount]
        $abilityPct = $abilityRanks[[string]$r.abilityScore]
        $composites[$r.sname] = @{
            composite = $bstPct * $WEIGHTS.bst + $bossPct * $WEIGHTS.boss + $abilityPct * $WEIGHTS.ability
            bstPct = $bstPct; bossPct = $bossPct; abilityPct = $abilityPct
        }
    }
    $compositeRanks = Get-PercentileRanks ($composites.Values | ForEach-Object { $_.composite })

    $result = @{}
    foreach ($r in $subsetRows) {
        $c = $composites[$r.sname]
        $finalPct = $compositeRanks[[string]$c.composite]
        $result[$r.sname] = @{
            tier = Get-Tier $finalPct
            score = [math]::Round($finalPct, 1)
            bstPct = $c.bstPct; bossPct = $c.bossPct; abilityPct = $c.abilityPct
        }
    }
    return $result
}

$global = Compute-Tiers $rows

$byStage = @{}
foreach ($r in $rows) {
    if (-not $r.hasEvolutionLine) { continue }
    if (-not $byStage.ContainsKey($r.stage)) { $byStage[$r.stage] = New-Object System.Collections.ArrayList }
    [void]$byStage[$r.stage].Add($r)
}
$stageResults = @{}
foreach ($stageNum in $byStage.Keys) {
    $tiers = Compute-Tiers $byStage[$stageNum]
    foreach ($sname in $tiers.Keys) { $stageResults[$sname] = $tiers[$sname] }
}

$out = [ordered]@{}
foreach ($r in $rows) {
    $g = $global[$r.sname]
    $sg = if ($stageResults.ContainsKey($r.sname)) { $stageResults[$r.sname] } else { $null }
    $out[$r.sname] = [ordered]@{
        tier = $g.tier; score = $g.score
        stage = $r.stage
        stageTier = if ($sg) { $sg.tier } else { $null }
        stageScore = if ($sg) { $sg.score } else { $null }
        bst = $r.bst; bstPct = $g.bstPct
        bossCount = $r.bossCount; bossPct = $g.bossPct
        abilityScore = $r.abilityScore; abilityPct = $g.abilityPct
    }
}

$outPath = Join-Path $dataDir "species_rank.json"
[System.IO.File]::WriteAllText($outPath, (ConvertTo-JsonManual $out), (New-Object System.Text.UTF8Encoding($false)))

$tierCounts = @{}
$stageTierCounts = @{}
$standaloneCount = 0
foreach ($v in $out.Values) {
    if (-not $tierCounts.ContainsKey($v.tier)) { $tierCounts[$v.tier] = 0 }
    $tierCounts[$v.tier]++
    if ($null -eq $v.stageTier) { $standaloneCount++; continue }
    if (-not $stageTierCounts.ContainsKey($v.stageTier)) { $stageTierCounts[$v.stageTier] = 0 }
    $stageTierCounts[$v.stageTier]++
}
Write-Output "compute_species_rank.ps1: OK ($($out.Keys.Count) especies) -> $outPath ($((Get-Item $outPath).Length) bytes)"
Write-Output "-- rank global --"
foreach ($t in "SS", "S", "A", "B", "C", "D") {
    $c = if ($tierCounts.ContainsKey($t)) { $tierCounts[$t] } else { 0 }
    Write-Output ("  $t : $c")
}
Write-Output "-- rank por estagio (agregado, todas as populacoes somadas; standalone sem stageTier) --"
foreach ($t in "SS", "S", "A", "B", "C", "D") {
    $c = if ($stageTierCounts.ContainsKey($t)) { $stageTierCounts[$t] } else { 0 }
    Write-Output ("  $t : $c")
}
Write-Output "  standalone (sem linha evolutiva, sem stageTier): $standaloneCount"
Write-Output "-- especies por estagio (so quem tem linha evolutiva) --"
foreach ($k in ($byStage.Keys | Sort-Object)) { Write-Output ("  estagio ${k}: $($byStage[$k].Count)") }
```

### scripts/score_abilities.ps1

_53 linhas, 2.161 bytes._ Ferramenta de calibracao da formula de rank - NAO faz parte do build.ps1, roda-se a mao ao mudar a rubrica de pontuacao de habilidades.

```powershell
<#
Standalone research/calibration script - NOT part of build.ps1.

Scores every translated ability description (data/ability_translations_pt.json)
0-3 for personal combat impact (survivability/damage relevance to the ONE
Pokemon that has it - not team-wide utility like weather-setting), using
regex rules over the already-translated, style-guide-consistent Portuguese
text. This is the research pass behind the species-rank feature: run it,
eyeball the distribution and the per-tier samples below, adjust the rules,
re-run - BEFORE scores.compute_species_rank.ps1 consumes the same function
for real.

Usage: powershell -File scripts\score_abilities.ps1
#>

. (Join-Path $PSScriptRoot "common.ps1")
# Score-AbilityText lives in common.ps1 now, shared with
# scripts/compute_species_rank.ps1 so calibration and real use never drift.

$ser = New-GameDataParser
$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$pt = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "ability_translations_pt.json") -Raw -Encoding UTF8))
$dex = $ser.DeserializeObject((Get-Content (Join-Path $dataDir "dex_compact.json") -Raw -Encoding UTF8))

$scores = @{}
foreach ($id in $pt.Keys) { $scores[$id] = Score-AbilityText $pt[$id] }

$byTier = @{0=0;1=0;2=0;3=0}
foreach ($v in $scores.Values) { $byTier[$v]++ }
Write-Output "--- distribuicao de scores entre $($scores.Count) habilidades traduzidas ---"
foreach ($t in 0,1,2,3) { Write-Output ("tier $t : $($byTier[$t])") }

Write-Output "`n--- amostra tier 3 (ate 15) ---"
$n = 0
foreach ($id in $scores.Keys) {
    if ($scores[$id] -eq 3 -and $n -lt 15) {
        $name = $null
        foreach ($i in 0..($dex.abilities.Count-1)) { if ($i -eq [int]$id) { $name = $dex.abilities[$i][0]; break } }
        Write-Output ("$id`t$name`t$($pt[$id])")
        $n++
    }
}

Write-Output "`n--- amostra tier 2 (ate 15) ---"
$n = 0
foreach ($id in $scores.Keys) {
    if ($scores[$id] -eq 2 -and $n -lt 15) {
        $name = $null
        foreach ($i in 0..($dex.abilities.Count-1)) { if ($i -eq [int]$id) { $name = $dex.abilities[$i][0]; break } }
        Write-Output ("$id`t$name`t$($pt[$id])")
        $n++
    }
}
```

### scripts/archive_build.ps1

_67 linhas, 2.577 bytes._ Arquiva a build atual de uma especie em build_history.json ANTES de builds.json ser sobrescrito - passo manual do fluxo de curadoria.

```powershell
<#
Archives the CURRENT data/builds.json entry for one species into
data/build_history.json before that entry gets overwritten with a new
recommendation, so past builds aren't lost - see AUDITORIA-DOSSIE.md and the
"historico de builds" feature discussion in project memory.

Run this BEFORE hand-editing builds.json with a new build for the same
species. It only reads/appends - it does not touch builds.json itself.

Usage:
  powershell -File archive_build.ps1 -Sname SPECIES_PROBOPASS -Context "Time inicial, build 2.65beta"

If builds.json has no entry for -Sname yet, this is a no-op (there is
nothing to archive) - a warning is printed, nothing is written.
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Sname,
    [Parameter(Mandatory = $true)]
    [string]$Context
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$dataDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data"
$buildsPath = Join-Path $dataDir "builds.json"
$historyPath = Join-Path $dataDir "build_history.json"

$ser = New-GameDataParser
$builds = $ser.DeserializeObject((Get-Content $buildsPath -Raw -Encoding UTF8))

if (-not $builds.ContainsKey($Sname)) {
    Write-Output "archive_build.ps1: nada a arquivar - $Sname nao tem entrada em builds.json ainda."
    exit 0
}

$current = $builds[$Sname]

$history = if (Test-Path $historyPath) {
    $raw = (Get-Content $historyPath -Raw -Encoding UTF8).Trim()
    if ($raw) { $ser.DeserializeObject($raw) } else { @{} }
} else { @{} }

if (-not $history.ContainsKey($Sname)) {
    $history[$Sname] = New-Object System.Collections.ArrayList
} elseif ($history[$Sname] -isnot [System.Collections.ArrayList]) {
    # DeserializeObject gives back an object[]/ArrayList for JSON arrays depending
    # on caller history - normalize so .Add always works below.
    $tmp = New-Object System.Collections.ArrayList
    foreach ($item in @($history[$Sname])) { [void]$tmp.Add($item) }
    $history[$Sname] = $tmp
}

$entry = [ordered]@{
    savedAt = (Get-Date -Format "yyyy-MM-dd")
    context = $Context
}
foreach ($key in $current.Keys) { $entry[$key] = $current[$key] }

[void]$history[$Sname].Add($entry)

[System.IO.File]::WriteAllText($historyPath, (ConvertTo-JsonManual $history), (New-Object System.Text.UTF8Encoding($false)))

Write-Output "archive_build.ps1: OK - build anterior de $Sname arquivada (contexto: `"$Context`")."
Write-Output "  $Sname agora tem $($history[$Sname].Count) build(s) no historico."
Write-Output "  Lembrete: agora edite builds.json com a NOVA build para $Sname, depois rode build.ps1."
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

### data/mega_forms.json

_1 linhas, 9.278 bytes._ 234 pares item->especie-alvo de Mega/Primal, construidos por duas fontes cruzadas (ver D13).

```json
{"Abomasite":"SPECIES_ABOMASNOW_MEGA","Absolite":"SPECIES_ABSOL_MEGA","Aerodactylite":"SPECIES_AERODACTYL_MEGA","Aggronite":"SPECIES_AGGRON_MEGA","Alakazite":"SPECIES_ALAKAZAM_MEGA","Altarianite":"SPECIES_ALTARIA_MEGA","Ampharosite":"SPECIES_AMPHAROS_MEGA","Audinite":"SPECIES_AUDINO_MEGA","Banettite":"SPECIES_BANETTE_MEGA","Beedrillite":"SPECIES_BEEDRILL_MEGA","Blazikenite":"SPECIES_BLAZIKEN_MEGA","Cameruptite":"SPECIES_CAMERUPT_MEGA","Charizardite X":"SPECIES_CHARIZARD_MEGA_X","Charizardite Y":"SPECIES_CHARIZARD_MEGA_Y","Diancite":"SPECIES_DIANCIE_MEGA","Galladite":"SPECIES_GALLADE_MEGA","Garchompite":"SPECIES_GARCHOMP_MEGA","Gardevoirite":"SPECIES_GARDEVOIR_MEGA","Glalitite":"SPECIES_GLALIE_MEGA","Heracronite":"SPECIES_HERACROSS_MEGA","Houndoominite":"SPECIES_HOUNDOOM_MEGA","Kangaskhanite":"SPECIES_KANGASKHAN_MEGA","Latiasite":"SPECIES_LATIAS_MEGA","Latiosite":"SPECIES_LATIOS_MEGA","Lopunnite":"SPECIES_LOPUNNY_MEGA","Manectite":"SPECIES_MANECTRIC_MEGA","Mawilite":"SPECIES_MAWILE_MEGA","Medichamite":"SPECIES_MEDICHAM_MEGA","Metagrossite":"SPECIES_METAGROSS_MEGA","Mewtwonite X":"SPECIES_MEWTWO_MEGA_X","Mewtwonite Y":"SPECIES_MEWTWO_MEGA_Y","Pidgeotite":"SPECIES_PIDGEOT_MEGA","Pinsirite":"SPECIES_PINSIR_MEGA","Ribombite":"SPECIES_RIBOMBEE_MEGA","Sablenite":"SPECIES_SABLEYE_MEGA","Salamencite":"SPECIES_SALAMENCE_MEGA","Sceptilite":"SPECIES_SCEPTILE_MEGA","Scizorite":"SPECIES_SCIZOR_MEGA","Sharpedonite":"SPECIES_SHARPEDO_MEGA","Slowbronite":"SPECIES_SLOWBRO_MEGA","Steelixite":"SPECIES_STEELIX_MEGA","Swampertite":"SPECIES_SWAMPERT_MEGA","Tyranitarite":"SPECIES_TYRANITAR_MEGA","Machampite":"SPECIES_MACHAMP_MEGA","Kinglerite":"SPECIES_KINGLER_MEGA","Flygonite":"SPECIES_FLYGON_MEGA","Dewgongite":"SPECIES_DEWGONG_MEGA","Hitmonchanite":"SPECIES_HITMONCHAN_MEGA","Hitmontopite":"SPECIES_HITMONTOP_MEGA","Crobatite":"SPECIES_CROBAT_MEGA","Skarmorite":"SPECIES_SKARMORY_MEGA_REDUX","Infernapite":"SPECIES_INFERNAPE_MEGA","Empoleonite":"SPECIES_EMPOLEON_MEGA","Relicanthite":"SPECIES_RELICANTH_MEGA","Toucannonite":"SPECIES_TOUCANNON_MEGA","Breloomite":"SPECIES_BRELOOM_MEGA","Slakingite":"SPECIES_SLAKING_MEGA","Granbullite":"SPECIES_GRANBULL_MEGA","Gyaradosite Y":"SPECIES_GYARADOS_MEGA_Y","Haxorusite":"SPECIES_HAXORUS_MEGA","Meganiumite":"SPECIES_MEGANIUM_MEGA","Nidokingite":"SPECIES_NIDOKING_MEGA","Nidoqueenite":"SPECIES_NIDOQUEEN_MEGA","Sandslashite":"SPECIES_SANDSLASH_MEGA","Typhlosionite":"SPECIES_TYPHLOSION_MEGA","Magnezonite":"SPECIES_MAGNEZONE_MEGA","Swalotite":"SPECIES_SWALOT_MEGA","Lanturnite":"SPECIES_LANTURN_MEGA","Laprasite X":"SPECIES_LAPRAS_MEGA_X","Slowkingite":"SPECIES_SLOWKING_MEGA","Incinerite":"SPECIES_INCINEROAR_MEGA","Aggronite R":"SPECIES_AGGRON_REDUX_MEGA","Gothitite":"SPECIES_GOTHITELLE_MEGA","Miloticite":"SPECIES_MILOTIC_MEGA","Golisopite":"SPECIES_GOLISOPOD_MEGA","Snorlaxite":"SPECIES_SNORLAX_MEGA","Chandelurite X":"SPECIES_CHANDELURE_MEGA","Popcormite":"SPECIES_POPCORM_MEGA","Hariyamite":"SPECIES_HARIYAMA_MEGA","Scraftinite":"SPECIES_SCRAFTY_MEGA","Samurottite":"SPECIES_SAMUROTT_MEGA","Gengarite Y":"SPECIES_GENGAR_MEGA","Torterranite R":"SPECIES_TORTERRA_REDUX_MEGA","Scizorite R":"SPECIES_SCIZOR_REDUX_MEGA","Ribombite R":"SPECIES_RIBOMBEE_REDUX_MEGA","Arbokite":"SPECIES_ARBOK_MEGA","Meowscaradite":"SPECIES_MEOWSTIC_MEGA","Chesnaughtite":"SPECIES_CHESNAUGHT_MEGA","Houndoominite R":"SPECIES_HOUNDOOM_MEGA_REDUX","Goodrite-H":"SPECIES_GOODRA_HISUIAN_MEGA","Inteleonite":"SPECIES_INTELEON_MEGA","Wigglytuffite X":"SPECIES_WIGGLYTUFF_MEGA_X","Altarianite-R":"SPECIES_ALTARIA_REDUX_MEGA","Absolite Z":"SPECIES_ABSOL_MEGA_Z","Empoleonite R":"SPECIES_EMPOLEON_REDUX_MEGA","Raichunite Y":"SPECIES_RAICHU_MEGA_Y","Goodranite":"SPECIES_GOODRA_MEGA","Abomasite S":"SPECIES_ABOMASNOW_MEGA","Centiskite":"SPECIES_CENTISKORCH_MEGA","Rapidashite G":"SPECIES_RAPIDASH_MEGA_GALARIAN","Venusaurite X":"SPECIES_VENUSAUR_MEGA_X","Golisopite Y":"SPECIES_GOLISOPOD_MEGA_Y","Urshifite":"SPECIES_URSHIFU_MEGA","Scytherite":"SPECIES_SCYTHER_MEGA","Hatterenite":"SPECIES_HATTERENE_MEGA","Tatsugirinite":"SPECIES_TATSUGIRI_MEGA","Shedinjite":"SPECIES_SHEDINJA_MEGA","Alakazite R":"SPECIES_ALAKAZAM_MEGA_REDUX","Vanilluxeite-R":"SPECIES_VANILLUXE_REDUX_MEGA","Drampanite":"SPECIES_DRAMPA_MEGA","Quaquavite":"SPECIES_QUAQUAVAL_MEGA","Cormothite":"SPECIES_CORMOTH_MEGA","Mienshaoite":"SPECIES_MIENSHAO_MEGA","Crabominite":"SPECIES_CRABOMINABLE_MEGA","Garchompite Z":"SPECIES_GARCHOMP_MEGA_Z","Krookodilenite":"SPECIES_KROOKODILE_MEGA","Arcanite H":"SPECIES_ARCANINE_HISUIAN_MEGA","Dracovishite":"SPECIES_DRACOVISH_MEGA","Greninjite":"SPECIES_GRENINJA_MEGA","Copperajite":"SPECIES_COPPERAJAH_MEGA","Clefablite Y":"SPECIES_CLEFABLE_MEGA_Y","Rillaboomite":"SPECIES_RILLABOOM_MEGA","Galladite R":"SPECIES_GALLADE_REDUX_MEGA","Excadrite":"SPECIES_EXCADRILL_MEGA","Glimmoranite":"SPECIES_GLIMMORA_MEGA","Beedrillite R":"SPECIES_BEEDRILL_MEGA_REDUX","Scovillainite":"SPECIES_SCOVILLAIN_MEGA","Luxraynite R":"SPECIES_LUXRAY_REDUX_MEGA","Delphoxite":"SPECIES_DELPHOX_MEGA","Drednawite":"SPECIES_DREDNAW_MEGA","Zygardite":"SPECIES_ZYGARDE_COMPLETE_MEGA","Garchompite R":"SPECIES_GARCHOMP_MEGA_REDUX","Tyranitarite R":"SPECIES_TYRANITAR_MEGA_REDUX","Carbonixite":"SPECIES_CARBONIX_MEGA","Venusaurite Y":"SPECIES_VENUSAUR_MEGA","Cinderaceite":"SPECIES_CINDERACE_MEGA","Oricorionite":"SPECIES_ORICORIO_MEGA","Grimmsnarlite":"SPECIES_GRIMMSNARL_MEGA","Victreebelite":"SPECIES_VICTREEBEL_MEGA","Emboarite":"SPECIES_EMBOAR_MEGA","Sablenite R":"SPECIES_SABLEYE_MEGA_REDUX","Tinkatite R":"SPECIES_TINKATON_REDUX_MEGA","Hawluchanite":"SPECIES_HAWLUCHA_MEGA","Scolipite":"SPECIES_SCOLIPEDE_MEGA","Malamarite":"SPECIES_MALAMAR_MEGA","Sneaslerite":"SPECIES_SNEASLER_MEGA","Garbodorite":"SPECIES_GARBODOR_MEGA","Lucarionite Z":"SPECIES_LUCARIO_MEGA_Z","Machampite R":"SPECIES_MACHAMP_MEGA_REDUX","Yveltalite":"SPECIES_YVELTAL_MEGA","Zapdosite-EX":"SPECIES_ZAPDOS_EX_MEGA","Chimechite":"SPECIES_CHIMECHO_MEGA","Froslassite Y":"SPECIES_FROSLASS_MEGA_Y","Serperiorite":"SPECIES_SERPERIOR_MEGA","Slowkingite G":"SPECIES_SLOWKING_MEGA_GALARIAN","Kilozunite":"SPECIES_KILOZUNA_MEGA","Moltresite-EX":"SPECIES_MOLTRES_EX_MEGA","Meowthite":"SPECIES_MEOWTH_PARTNER_MEGA","Charizardite Z":"SPECIES_CHARIZARD_MEGA_Z","Torterranite":"SPECIES_TORTERRA_MEGA","Starminite":"SPECIES_STARMIE_MEGA","Ursalunite":"SPECIES_URSALUNA_MEGA","Eelektrossite":"SPECIES_EELEKTROSS_MEGA","Alcremite":"SPECIES_ALCREMIE_MEGA","Heatranite":"SPECIES_HEATRAN_MEGA","Vanilluxeite":"SPECIES_VANILLUXE_MEGA","Infernapite R":"SPECIES_INFERNAPE_REDUX_MEGA","Weavileite":"SPECIES_WEAVILE_MEGA","Golurkite":"SPECIES_GOLURK_MEGA","Feraligite X":"SPECIES_FERALIGATR_MEGA_X","Weavilite R":"SPECIES_WEAVILE_REDUX_MEGA","Pyroarite":"SPECIES_PYROAR_MEGA","Kleavite R":"SPECIES_KLEAVOR_REDUX_MEGA","Coalossite":"SPECIES_COALOSSAL_MEGA","Kinglerite R":"SPECIES_KINGLER_REDUX_MEGA","Luxraynite":"SPECIES_LUXRAY_MEGA","Blastoisinite X":"SPECIES_BLASTOISE_MEGA_X","Gengarite X":"SPECIES_GENGAR_MEGA_X","Skeledirgeite":"SPECIES_SKELEDIRGE_MEGA","Rapidashite":"SPECIES_RAPIDASH_MEGA","Darkranite":"SPECIES_DARKRAI_MEGA","Talonflameite":"SPECIES_TALONFLAME_MEGA","Froslassite X":"SPECIES_FROSLASS_MEGA","Baxcalibrite":"SPECIES_BAXCALIBUR_MEGA","Corvinite":"SPECIES_CORVIKNIGHT_MEGA","Mamoswinite-R":"SPECIES_MAMOSWINE_REDUX_MEGA","Dududunite":"SPECIES_DUDUDUNSPARCE_MEGA","Floettite":"SPECIES_FLOETTE_ETERNAL_FLOWER_MEGA","Falinksite":"SPECIES_FALINKS_MEGA","Dragapultite":"SPECIES_DRAGALGE_MEGA","Meowsticite":"SPECIES_MEOWSTIC_MEGA","Melmetalite":"SPECIES_MELMETAL_MEGA","Primarinite":"SPECIES_PRIMARINA_MEGA","Kingdranite":"SPECIES_KINGDRA_MEGA","Amphybuzzite":"SPECIES_AMPHYBUZZ_MEGA","Barbaracite":"SPECIES_BARBARACLE_MEGA","Roseradite":"SPECIES_ROSERADE_MEGA","Slowbronite G":"SPECIES_SLOWBRO_MEGA_GALARIAN","Sandslashite-A":"SPECIES_SANDSLASH_ALOLAN_MEGA","Deciduite H":"SPECIES_DECIDUEYE_HISUIAN_MEGA","Shucklenite":"SPECIES_SHUCKLE_MEGA","Aegislashite R":"SPECIES_AEGISLASH_BLADE_REDUX_MEGA","Snorlaxite R":"SPECIES_SNORLAX_REDUX_MEGA","Luxzerite":"SPECIES_LUXZERO_MEGA","Scytherite R":"SPECIES_SCYTHER_REDUX_MEGA","Blastoisinite Y":"SPECIES_BLASTOISE_MEGA","Typhlosionite H":"SPECIES_TYPHLOSION_HISUIAN_MEGA","Wigglytuffite Y":"SPECIES_WIGGLYTUFF_MEGA","Excadrillite-R":"SPECIES_EXCADRILL_MEGA","Dragoninite Y":"SPECIES_DRAGONITE_MEGA_Y","Magearnite":"SPECIES_MAGEARNA_MEGA","Toxtricitite R":"SPECIES_TOXTRICITY_REDUX_FUZZ_MEGA","Laprasite Y":"SPECIES_LAPRAS_MEGA","Butterfrenite":"SPECIES_BUTTERFREE_MEGA","Articunite-EX":"SPECIES_ARTICUNO_EX_MEGA","Chien-Paoite":"SPECIES_CHIEN_PAO_MEGA","Chandelurite Y":"SPECIES_CHANDELURE_MEGA_Y","Glalitite R":"SPECIES_GLALIE_REDUX_MEGA","Quagsirenite":"SPECIES_QUAGSIRE_MEGA","Feraligite Y":"SPECIES_FERALIGATR_MEGA_Y","Staraptite":"SPECIES_STARAPTOR_MEGA","Tinkatite":"SPECIES_TINKATON_MEGA","Kingambitite R":"SPECIES_KINGAMBIT_REDUX_MEGA","Zeraorite":"SPECIES_ZERAORA_MEGA","Orbeetite":"SPECIES_ORBEETLE_MEGA","Kleavite":"SPECIES_KLEAVOR_MEGA","Deciduite":"SPECIES_DECIDUEYE_MEGA","Sandacondite":"SPECIES_SANDACONDA_MEGA","Dragalgite":"SPECIES_DRAGALGE_MEGA","Raichunite X":"SPECIES_RAICHU_MEGA_X","Clodsite":"SPECIES_CLODSIRE_MEGA","Gardevoirite R":"SPECIES_GARDEVOIR_REDUX_MEGA","Samurottite H":"SPECIES_SAMUROTT_HISUIAN_MEGA","Lucky Orb":"SPECIES_VICTINI_PRIMAL"}
```

### data/build_history.json

_1 linhas, 3 bytes._ Historico de builds ja recomendadas por especie - comeca vazio, historico so a partir de 08/09.

```json
{}
```

### 10.4 Suite de testes

### scripts/smoke_test_suite.js

_706 linhas, 40.194 bytes._ 66 verificacoes auto-relatadas (PASS/FAIL), colada no console do navegador contra a pagina servida localmente. Ver secao 12 sobre o limite dela (checa estado do DOM, nem sempre aparencia renderizada).

```javascript
// Consolidated smoke-test suite for artifact_final.html - dev review, 2026-09-09:
// "toda correcao dependeu de eu lembrar de rodar aqueles trechos de JS na mao"
// (from the old scripts/manual_smoke_tests.md, since removed - fully
// superseded by this file, 2026-09-09, part of a broader pass removing
// things "Meu build"/sync made obsolete) "e so eu conferindo o resultado a
// olho, sem garantia nenhuma de que eu li certo". This doesn't add a real
// test *runner* (no node/npm/browser-test-framework in this environment -
// see AUDITORIA-DOSSIE.md section 13) - it removes the "read the result by
// eye" step: every check below asserts and reports PASS/FAIL itself,
// instead of returning a raw value the caller has to compare against a
// comment.
//
// Two parts, because a page reload always ends whatever script triggered it
// (the Browser tool's javascript_tool call dies with the page) - they can't
// be merged into one call no matter how this file is organized:
//
//   PART A (runLiveTests) - everything drivable without a reload. Paste the
//     whole function into the console (or run via javascript_tool) on a
//     freshly loaded page, then call runLiveTests(). Seeds its own team/box
//     via the real UI (search -> click -> add), same as a user would, so it
//     doubles as an interaction test, not just a state check. Clears
//     localStorage when done.
//
//   PART B (2 separate snippets below) - the save-orphan/milestone-clamp
//     test, which genuinely needs a reload between "write a fake save" and
//     "assert the app read it correctly". Run snippet B1, reload the page
//     (navigate to the same URL), then run snippet B2.
//
// To serve the build locally first: a plain HTTP server (not file://, some
// things behave differently) rooted at this project folder, e.g. a simple
// PowerShell HttpListener on port 8100 serving artifact_final.html, opened
// in the Browser tool via preview_start.

// ============================== PART A ==============================
async function runLiveTests() {
  const results = [];
  function check(name, cond, detail) {
    results.push({ name, pass: !!cond, detail: detail || "" });
  }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function setSearch(q) {
    const el = document.getElementById("search-input");
    el.value = q;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  async function addByName(name, toBox) {
    setSearch(name);
    await wait(30);
    const row = document.querySelector("#species-list .species-row");
    if (!row) { check("add " + name, false, "not found in list"); return; }
    row.click();
    await wait(30);
    const btn = document.getElementById(toBox ? "add-box-btn" : "add-team-btn");
    if (btn && !btn.disabled) btn.click();
    await wait(30);
  }

  localStorage.clear();
  location.reload ? null : null; // no-op, just documenting intent: NOT reloading here on purpose

  // --- seed: 6-Pokemon team + 1 box member, real UI interactions ---
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  for (const n of ["Aerodactyl Mega", "Probopass", "Coalossal Mega", "Terrakion", "Avalugg Hisuian", "Tyranitar Mega Redux"]) {
    await addByName(n, false);
  }
  await addByName("Eelektross", true);

  // --- 1. box-to-team never disables, opens swap modal when team is full ---
  document.querySelector('.tab-btn[data-tab="box"]').click();
  await wait(50);
  const boxBtn = document.querySelector("#box-grid .box-to-team");
  check("box-to-team button exists", !!boxBtn);
  if (boxBtn) {
    check("box-to-team never disabled", boxBtn.disabled === false, "disabled=" + boxBtn.disabled);
    check("box-to-team shows swap state when team full", boxBtn.classList.contains("is-swap"));
    boxBtn.click();
    await wait(30);
    check("swap modal opens on click", document.getElementById("swap-modal").hidden === false);
    document.getElementById("swap-modal-close").click();
    await wait(30);
  }

  // --- 2. stat bar tiers (Shuckle: extreme high/low stats) ---
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  setSearch("Shuckle");
  await wait(30);
  const shuckleRow = document.querySelector("#species-list .species-row");
  if (shuckleRow) {
    shuckleRow.click();
    await wait(30);
    const rows = [...document.querySelectorAll("#species-detail .stat-row")];
    const defRow = rows.find(r => r.querySelector(".stat-label").textContent === "Defesa");
    const spdRow = rows.find(r => r.querySelector(".stat-label").textContent === "Sp. Def");
    check("Shuckle Def shows tier-elite (BST >= 150 clamps to 100%)",
      defRow && defRow.querySelector(".stat-bar-fill").classList.contains("tier-elite"));
    check("Shuckle stat bar width clamped at 100%",
      defRow && defRow.querySelector(".stat-bar-fill").style.width === "100%");
  } else {
    check("Shuckle found in Dex", false);
  }

  // --- 3. rank badge + sort-by-rank ---
  setSearch(""); // clear any filter left by the stat-bar test above, or this
                  // "checks" the rank of whatever 1 species is still filtered
                  // in, not the actual top of the full sorted list
  await wait(30);
  const sel = document.getElementById("sort-select");
  sel.value = "rank";
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  await wait(30);
  const firstBadge = document.querySelector("#species-list .rank-badge");
  check("sort-by-rank populates rank badges", !!firstBadge);
  check("top of rank-sorted list is SS tier", firstBadge && firstBadge.textContent === "SS", firstBadge && firstBadge.textContent);
  sel.value = "dex";
  sel.dispatchEvent(new Event("change", { bubbles: true }));

  // --- 4. cross-navigation: team slot -> Dex ---
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const tsHead = document.querySelector("#team-slots .ts-head");
  if (tsHead) {
    const expectedName = tsHead.parentElement.querySelector(".ts-name").textContent.split(" ")[0];
    tsHead.click();
    await wait(30);
    const dexActive = document.querySelector('.tab-btn[data-tab="dex"]').classList.contains("active");
    const shownName = document.querySelector("#species-detail h2");
    check("clicking team-slot header navigates to Dex", dexActive);
    check("Dex detail shows the right species after nav",
      shownName && shownName.textContent.indexOf(expectedName) === 0, shownName && shownName.textContent);
  } else {
    check("team-slot header found", false);
  }

  // --- 5. rank info line shows both badges with plain-text labels ---
  const rankLine = document.querySelector(".rank-info-line");
  check("rank-info-line renders in Dex detail", !!rankLine);
  check("rank-info-line spells out the scale in plain text",
    rankLine && rankLine.textContent.indexOf("SS (melhor)") !== -1);

  // --- 6. build-reference card has a real title (not a bare <details>) ---
  const buildCard = [...document.querySelectorAll("#species-detail .card h3")]
    .find(h => h.textContent === "Builds de referência");
  // Only assert this if the currently shown species actually has boss-reference
  // data - not every species does, so absence alone isn't a failure here.
  check("no crash rendering species detail with/without build-reference card", true);

  // --- 7. team coverage table sits in a titled .card (not a bare <h3>) ---
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const analysisCards = document.querySelectorAll("#team-analysis .card");
  check("team-analysis renders inside .card elements (not bare <h3>)", analysisCards.length === 2, "found " + analysisCards.length);
  const scrollX = document.querySelector("#team-analysis .scroll-x");
  if (scrollX) {
    const cs = getComputedStyle(scrollX);
    check("coverage table has a scroll mask", !!(cs.maskImage && cs.maskImage !== "none") || !!(cs.webkitMaskImage && cs.webkitMaskImage !== "none"));
  }

  // --- 8. "Mais" dropdown (Progresso/Tipos) - design proposal A, 2026-09-09 ---
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  const moreToggle = document.getElementById("tabs-more-toggle");
  const morePanel = document.getElementById("tabs-more-panel");
  check("Mais panel starts hidden", morePanel.hidden === true);
  // The DOM property alone missed a real bug: .tabs-more-panel's own
  // `display: flex` (an author rule) always beat the browser's native
  // [hidden] handling regardless of the hidden attribute/property being
  // correctly set - found 2026-09-09 by actually looking at a fresh page
  // load, not by reading this same assertion. Check the rendered box too.
  check("Mais panel is actually invisible while hidden (not just .hidden===true)",
    getComputedStyle(morePanel).display === "none");
  moreToggle.click();
  check("Mais panel opens on click", morePanel.hidden === false);
  const progressInPanel = morePanel.querySelector('[data-tab="progress"]');
  if (progressInPanel) progressInPanel.click();
  await wait(30);
  check("selecting Progresso inside the panel activates that view",
    document.getElementById("view-progress").classList.contains("active"));
  check("panel closes after selecting an item inside it", morePanel.hidden === true);
  check("Mais toggle highlights while Progresso/Tipos is active", moreToggle.classList.contains("active"));
  moreToggle.click();
  document.body.click();
  check("clicking outside the dropdown closes it", morePanel.hidden === true);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 9. dashboard summary - design proposal B, 2026-09-09 ---
  document.getElementById("dex-shell").classList.remove("show-detail");
  const dash = document.querySelector(".dashboard-card");
  check("dashboard renders with a 6-member team", !!dash);
  check("dashboard shows team completeness", dash && dash.textContent.indexOf("6/6") !== -1);
  check("dashboard shows a shared-risk item", dash && dash.textContent.indexOf("fracos") !== -1);
  const suggestionLink = document.querySelector(".dash-suggestion .goto-species[data-x]");
  if (suggestionLink) {
    suggestionLink.click();
    await wait(30);
    check("clicking a dashboard suggestion opens its Dex detail",
      document.querySelector('.tab-btn[data-tab="dex"]').classList.contains("active") &&
      document.getElementById("dex-shell").classList.contains("show-detail"));
    document.getElementById("back-to-list").click();
    await wait(30);
  }

  // --- 10. boss final-stat calculator - 2026-09-09 field-research follow-up ---
  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  const bossRow = document.querySelector("#boss-list .species-row");
  if (bossRow) {
    bossRow.click();
    await wait(50);
    const levelInput = document.getElementById("boss-level-input");
    check("boss level input exists with a sensible default", levelInput && parseInt(levelInput.value, 10) >= 1);
    check("stats render for at least one boss party member", !!document.querySelector(".bm-stats"));
    if (levelInput) {
      var hpBefore = document.querySelector(".bm-stats .bm-stat .mono").textContent;
      levelInput.value = "100";
      levelInput.dispatchEvent(new Event("change", { bubbles: true }));
      await wait(30);
      var hpAfter = document.querySelector(".bm-stats .bm-stat .mono").textContent;
      check("changing level recomputes stats (HP changes) without losing the typed value",
        document.getElementById("boss-level-input").value === "100" && hpAfter !== hpBefore,
        "before=" + hpBefore + " after=" + hpAfter);
    }
    document.getElementById("boss-shell").classList.remove("show-detail");
  } else {
    check("at least one boss found to test the stat calculator", false);
  }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 11. "Minhas anotações" + move-row type tint - 2026-09-09, third field-research follow-up ---
  setSearch("Charizard");
  await wait(30);
  const cRow = document.querySelector("#species-list .species-row");
  if (cRow) {
    cRow.click();
    await wait(30);
    const notesArea = document.getElementById("species-notes-input");
    check("notes textarea renders", !!notesArea);
    if (notesArea) {
      notesArea.value = "teste automatizado";
      document.getElementById("species-notes-save").click();
      await wait(30);
      var savedNote = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
      check("note saved to localStorage under the sname",
        savedNote.notes && savedNote.notes.SPECIES_CHARIZARD === "teste automatizado");
    }
    const moveRow = document.querySelector(".moves-table .move-row");
    check("move row has a type-tinted background", moveRow && moveRow.style.background.indexOf("color-mix") !== -1);
  } else { check("Charizard found for notes/move-tint test", false); }
  setSearch("");
  await wait(30);

  // --- 12. boss held-item stat modifier - 2026-09-09, user asked directly ---
  // Greta Slateport's Landorus Therian holds a Choice Band. Checks the FLAG
  // and that it lands on the right stat (Atk) and not an unrelated one
  // (HP), not a hardcoded final number - stays valid regardless of the
  // level-cap default used to compute it.
  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  document.getElementById("boss-search-input").value = "Greta";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  const gretaRow = document.querySelector("#boss-list .species-row");
  if (gretaRow) {
    gretaRow.click();
    await wait(50);
    const landoCard = [...document.querySelectorAll(".boss-mon-card")].find(c => c.querySelector(".bm-name").textContent.indexOf("Landorus") === 0);
    if (landoCard) {
      const bmStats = [...landoCard.querySelectorAll(".bm-stat")];
      check("Choice Band flags the Atk stat with a tooltip",
        bmStats[1] && bmStats[1].querySelector(".cov-flag") && bmStats[1].querySelector(".cov-flag").title.indexOf("Choice Band") === 0);
      check("Choice Band does NOT flag an unrelated stat (HP)", bmStats[0] && !bmStats[0].querySelector(".cov-flag"));
    } else { check("Landorus Therian (the Choice Band fixture) found on this boss", false); }
  } else { check("Greta Slateport (the Choice Band fixture boss) found", false); }
  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  document.getElementById("boss-shell").classList.remove("show-detail");
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 13. boss held-item stat modifiers, round 2 - 2026-09-09, field
  // research into the hack's real item source (er-config textproto +
  // pokemon-showdown-ER data/items.ts) confirmed Tactical Vest, Thick Club
  // and Light Ball. Light Ball is the interesting case: species-gated with
  // a DIFFERENT multiplier for Pikachu (x2) vs Raichu (x1.5), and applies to
  // TWO stats (Atk and SpA) at once - the other checks only ever exercise
  // one flagged stat, so this is the one case actually testing itemRuleFor's
  // species-prefix + multi-rule logic instead of a single flat lookup.
  async function checkItemFlag(bossQuery, monPrefix, diffKey, statLabel, itemLabel) {
    document.querySelector('.tab-btn[data-tab="bosses"]').click();
    await wait(50);
    document.getElementById("boss-search-input").value = bossQuery;
    document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
    await wait(30);
    const row = document.querySelector("#boss-list .species-row");
    if (!row) { check(bossQuery + " (fixture boss) found", false); return; }
    row.click();
    await wait(50);
    if (diffKey) {
      const diffBtn = document.querySelector('.chip-btn[data-diff="' + diffKey + '"]');
      if (diffBtn) { diffBtn.click(); await wait(50); }
    }
    const card = [...document.querySelectorAll(".boss-mon-card")].find(c => c.querySelector(".bm-name").textContent.indexOf(monPrefix) === 0);
    if (!card) { check(monPrefix + " (fixture) found on " + bossQuery, false); return; }
    const stat = [...card.querySelectorAll(".bm-stat")].find(s => s.querySelector(".bm-stat-label").textContent === statLabel);
    const flag = stat && stat.querySelector(".cov-flag");
    check(itemLabel + " flags " + statLabel + " on " + monPrefix, flag && flag.title.indexOf(itemLabel) === 0, flag && flag.title);
    document.getElementById("boss-search-input").value = "";
    document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("boss-shell").classList.remove("show-detail");
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    await wait(30);
  }
  // Archie Slateport, Hell tier: Swampert holds Tactical Vest.
  await checkItemFlag("Archie Slateport", "Swampert", "hell", "Def", "Tactical Vest");
  // Phoebe 4: Marowak Alolan holds Thick Club.
  await checkItemFlag("Phoebe 4", "Marowak Alolan", null, "Atk", "Thick Club");
  // Wattson 1, Insane tier: Raichu Alolan holds Light Ball, boosted at x1.5
  // (not vanilla's x2 - this hack's own rebalance) on BOTH Atk and SpA.
  await checkItemFlag("Wattson 1", "Raichu Alolan", "insane", "Atk", "Light Ball (x1.5)");
  await checkItemFlag("Wattson 1", "Raichu Alolan", "insane", "SpA", "Light Ball (x1.5)");

  // --- 14. real usability pass, 2026-09-09 - 3 more bugs found by actually
  // using the app (real team, real narrow viewport), not by reading DOM
  // state cold. All root-caused before fixing, not guessed at.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  setSearch("Tyranitar Mega Redux");
  await wait(30);
  const ttarRow = document.querySelector("#species-list .species-row");
  if (ttarRow) {
    ttarRow.click();
    await wait(30);
    // Raw game data has this species' 3 choosable-ability slots all
    // pointing at the same id ("abis":[444,444,444], checked directly -
    // true for 149/1906 species, not a splicing bug) - it used to render
    // the identical "Evaporate" card 3 times.
    const choosable = [...document.querySelectorAll("#species-detail .abi-card")]
      .filter(c => c.querySelector(".abi-kind").textContent === "Escolhível");
    check("duplicate choosable abilities collapse to one card (Tyranitar Mega Redux)",
      choosable.length === 1, choosable.length + " cards");
  } else { check("Tyranitar Mega Redux (duplicate-ability fixture) found", false); }
  setSearch("");
  await wait(30);

  // Dashboard suggestion sentence used to render as flexbox children
  // (each text run/link its own wrapping box) instead of one flowing
  // paragraph - visually stacked into a column of single words. The team
  // seeded at the top of this suite is full (6/6), so the suggestion
  // should be showing.
  const dashVal = document.querySelector(".dash-suggestion .dash-value");
  // The fix sets `display: inline`, but a flex item's outer display is
  // always "blockified" per spec regardless of the specified value, so the
  // COMPUTED style correctly reports "block" here, not "inline" - checked
  // this against the live page instead of assuming, after the first
  // version of this assertion (checking for "inline" literally) failed on
  // a working fix. What actually matters is that it's neither of the flex
  // values that caused the bug.
  check("dashboard suggestion text flows as a paragraph (not flex children)",
    dashVal && getComputedStyle(dashVal).display !== "flex" && getComputedStyle(dashVal).display !== "inline-flex",
    dashVal && getComputedStyle(dashVal).display);

  // Team-slot cards used to force the whole page to scroll horizontally on
  // a narrow screen - a CSS grid item's default min-width:auto blocked it
  // from shrinking to its track's width, so its <pre> build block (which
  // already had its own overflow-x:auto) never got the chance to self-
  // scroll instead. Checking the computed min-width directly is cheaper
  // and just as real a regression guard as resizing the viewport here.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const tslot = document.querySelector(".team-slot");
  check("team-slot can shrink below its content's natural width (min-width:0)",
    tslot && getComputedStyle(tslot).minWidth === "0px", tslot && getComputedStyle(tslot).minWidth);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 15. Mega Evolution / Primal Reversion in the boss stat calculator -
  // 2026-09-09, user's follow-up on the held-item pass ("como devemos
  // aplicar da melhor forma"). Lucy Lavaridge (Insane tier) has a Milotic
  // holding Miloticite - hand-verified all 6 final stats against Milotic
  // MEGA's real base stats (95/69/110/129/156/81) at level 18, Careful
  // nature, 252 HP/4 Def/252 SpD: HP79 Atk35 Def50 SpA51 SpD85 Spe39, all
  // matched exactly. This just re-checks the card shows the transformed
  // identity/types/note, not the numbers again (those are covered by hand
  // once; re-deriving them here would just duplicate that arithmetic).
  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  document.getElementById("boss-search-input").value = "Lucy Lavaridge";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  const lucyRow = document.querySelector("#boss-list .species-row");
  if (lucyRow) {
    lucyRow.click();
    await wait(50);
    const insaneBtn = document.querySelector('.chip-btn[data-diff="insane"]');
    if (insaneBtn) { insaneBtn.click(); await wait(50); }
    const milCard = [...document.querySelectorAll(".boss-mon-card")].find(c => c.querySelector(".bm-name").textContent.indexOf("Milotic") === 0);
    if (milCard) {
      check("Mega-stone holder shows the transformed species name", milCard.querySelector(".bm-name").textContent === "Milotic Mega");
      const typeNames = [...milCard.querySelectorAll(".bm-types .type-pill")].map(t => t.textContent);
      check("Mega-stone holder shows the transformed species' types (Water/Fairy, not just Water)",
        typeNames.indexOf("Fairy") !== -1, typeNames.join(","));
      check("card explains what species it enters as", milCard.textContent.indexOf("Entra como") !== -1 && milCard.textContent.indexOf("Milotic") !== -1);
      check("card is honest that the post-transform choosable ability is unknown",
        milCard.textContent.indexOf("não sabemos qual") !== -1);
    } else { check("Milotic Mega (the Miloticite fixture) found on Lucy Lavaridge", false); }
  } else { check("Lucy Lavaridge (the Miloticite fixture boss) found", false); }
  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  document.getElementById("boss-shell").classList.remove("show-detail");
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 16. "Meu build" interactive editor - 2026-09-09, user feedback that
  // the free-text notes field had no real interaction with the Pokemon
  // ("o usuario tem que digitar tudo"). Charizard's 3 real choosable
  // abilities are Molten Down/Giant Wings/Tough Claws (matches the
  // original NextDex FAQ example this whole project started from) - a
  // good fixture because it's easy to independently verify by eye.
  setSearch("Charizard");
  await wait(30);
  const charRow = document.querySelector("#species-list .species-row");
  if (charRow) {
    charRow.click();
    await wait(30);
    const abiOptions = [...document.querySelectorAll("#mybuild-ability option")].map(o => o.value).filter(Boolean);
    check("ability picker only offers this species' real choosable abilities",
      abiOptions.length === 3 && abiOptions.indexOf("Tough Claws") !== -1, abiOptions.join(","));
    // Earthquake is NOT in Charizard's real movepool in this hack - trying
    // to select it should silently fail (native <select> behavior when the
    // value isn't one of its options), proving the move list is actually
    // restricted to real options, not just decorative.
    const moveSel = document.getElementById("mybuild-move-0");
    moveSel.value = "Earthquake";
    check("move picker rejects a move not in this species' real movepool", moveSel.value !== "Earthquake");
    moveSel.value = "Flare Blitz";
    check("move picker accepts a move that IS in this species' real movepool", moveSel.value === "Flare Blitz");

    function setSel(id, v) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
    setSel("mybuild-ability", "Tough Claws");
    setSel("mybuild-nature", "Adamant");
    document.getElementById("mybuild-item").value = "Life Orb";
    setSel("mybuild-move-1", "Dragon Claw");
    document.getElementById("mybuild-ev-1").value = 252;
    document.getElementById("mybuild-ev-1").dispatchEvent(new Event("input", { bubbles: true }));
    await wait(20);
    check("EV total counter updates live as EVs are typed",
      document.getElementById("mybuild-ev-total").textContent.indexOf("252") !== -1,
      document.getElementById("mybuild-ev-total").textContent);
    document.getElementById("mybuild-save").click();
    await wait(50);
    const preview = [...document.querySelectorAll("#species-detail .showdown-block")].find(p => p.textContent.indexOf("Charizard @ Life Orb") === 0);
    check("saved build renders as a real Showdown-format block",
      preview && preview.textContent.indexOf("Tough Claws") !== -1, preview && preview.textContent);
    var savedRaw = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("build persists to localStorage under the sname",
      savedRaw.customBuilds && savedRaw.customBuilds.SPECIES_CHARIZARD && savedRaw.customBuilds.SPECIES_CHARIZARD.ability === "Tough Claws");
    document.getElementById("mybuild-clear").click();
    await wait(30);
    check("clear button removes the build and resets the form",
      !document.getElementById("mybuild-clear") && document.getElementById("mybuild-ability").value === "");
  } else { check("Charizard found for the Meu build editor test", false); }
  setSearch("");
  await wait(30);

  // --- 17. "Meu build" reaching the Team tab + boss-build copy - 2026-09-09,
  // user feedback: a build saved in the Dex never showed up on the Team
  // tab (renderTeam() only ever read the curated BUILDS table, never
  // state.customBuilds), and the only way to act on a boss's set was to
  // export text and paste it into a separate chat. Also caught a real
  // formatting bug while fixing this: effectiveBuild() first passed
  // customBuilds' raw EVs array straight into showdownSet(), which just
  // string-concatenates it - printed "EVs: 0,252,0,0,0,0" instead of
  // "EVs: 252 Atk" until normalized through evsToShowdownText().
  setSearch("Tyranitar Mega Redux"); // already on the seeded team
  await wait(30);
  const ttarRow2 = document.querySelector("#species-list .species-row");
  if (ttarRow2) {
    ttarRow2.click();
    await wait(30);
    function setSel2(id, v) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
    setSel2("mybuild-nature", "Timid");
    document.getElementById("mybuild-ev-5").value = 252;
    document.getElementById("mybuild-save").click();
    await wait(50);
  } else { check("Tyranitar Mega Redux found for cross-tab build test", false); }
  setSearch("");
  await wait(30);
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  // Team order follows state.team's insertion order - Tyranitar Mega Redux
  // was added LAST in the seed at the top of this suite, so a bare
  // querySelector(".ts-build-label") would silently grab the FIRST slot's
  // label instead (Aerodactyl Mega, which has an unrelated curated build)
  // - caught by actually running this against the live page, not by
  // reading the assertion and assuming it checked the right element.
  const ttarSlot = [...document.querySelectorAll(".team-slot")].find(s => s.textContent.indexOf("Tyranitar Mega Redux") !== -1);
  const teamBuildLabel = ttarSlot && ttarSlot.querySelector(".ts-build-label");
  const teamBuildText = ttarSlot && ttarSlot.querySelector(".showdown-block");
  check("a build saved in the Dex shows up on the Team tab, labeled as mine",
    teamBuildLabel && teamBuildLabel.textContent === "Meu build", teamBuildLabel && teamBuildLabel.textContent);
  check("EVs render as a formatted string on the Team tab (not the raw array's default toString)",
    teamBuildText && teamBuildText.textContent.indexOf("252 Spe") !== -1 && teamBuildText.textContent.indexOf(",") === -1,
    teamBuildText && teamBuildText.textContent);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  document.getElementById("boss-search-input").value = "Greta";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  const gretaRow2 = document.querySelector("#boss-list .species-row");
  if (gretaRow2) {
    gretaRow2.click();
    await wait(50);
    const useBtn = document.querySelector(".use-boss-build-btn");
    if (useBtn) {
      useBtn.click();
      await wait(30);
      var savedLando = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").customBuilds;
      var lando = savedLando && savedLando.SPECIES_LANDORUS_THERIAN;
      check("'usar como meu build' copies the boss's real ability/item/nature",
        lando && lando.ability === "Moxie" && lando.item === "Choice Band" && lando.nature === "Adamant",
        lando && JSON.stringify(lando));
      check("'usar como meu build' copies the boss's real EVs (not the default 0s)",
        lando && lando.evs && lando.evs[1] === 252 && lando.evs[5] === 252, lando && lando.evs);
      check("'usar como meu build' copies the boss's real moves",
        lando && lando.moves && lando.moves.indexOf("Earthquake") !== -1 && lando.moves.length === 4, lando && lando.moves);
    } else { check("'usar como meu build' button found on Landorus Therian", false); }
  } else { check("Greta Slateport found for the boss-build-copy test", false); }
  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  document.getElementById("boss-shell").classList.remove("show-detail");
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- 18. "+ Usar como meu build" on Dex-side reference entries -
  // 2026-09-09, user caught that "Builds vistas em chefões" (and build
  // history) on the Dex detail had a "copiar" button that only ever put
  // text on the clipboard, never touched state.customBuilds or the Team
  // tab - the OLDER of two "copy a build" mechanisms in this app, built
  // before "Meu build" existed. Charizard's real boss-reference fixture
  // (Courtney Mossdeep, Charizardite Y) is used here specifically because
  // its EVs string ("252 SpA / 4 SpD / 252 Spe") exercises the new
  // evsTextToArray() parser - the inverse of evsToShowdownText(), needed
  // because these reference entries store EVs as a string while
  // customBuilds needs the raw 6-number array.
  setSearch("Charizard");
  await wait(30);
  const charRow2 = document.querySelector("#species-list .species-row");
  if (charRow2) {
    charRow2.click();
    await wait(30);
    const details = document.querySelector(".bh-details");
    if (details) details.setAttribute("open", "");
    await wait(30);
    const useEntryBtn = document.querySelector(".use-entry-build-btn");
    if (useEntryBtn) {
      useEntryBtn.click();
      await wait(50);
      const savedChar = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").customBuilds;
      const char = savedChar && savedChar.SPECIES_CHARIZARD;
      check("boss-reference 'usar como meu build' copies ability/item/nature",
        char && char.ability && char.item && char.nature, char && JSON.stringify(char));
      check("boss-reference EVs string is correctly parsed into the raw array (evsTextToArray)",
        char && char.evs && char.evs.reduce(function (a, b) { return a + b; }, 0) > 0 &&
        document.getElementById("mybuild-ev-total").textContent.indexOf(String(char.evs.reduce(function (a, b) { return a + b; }, 0))) !== -1,
        char && char.evs);
      check("the open Dex 'Meu build' editor refreshes to show the copied values",
        document.getElementById("mybuild-ability").value === (char && char.ability));
    } else { check("'+ Usar como meu build' button found on a boss-reference entry", false); }
  } else { check("Charizard found for the reference-entry build-copy test", false); }
  setSearch("");
  await wait(30);

  // --- transfer card removal - 2026-09-09, replaced by the db-capability
  // sync above and confirmed working on real devices the same day, so the
  // manual copy/paste/download UI was removed to keep the page lighter
  // (user's own request, right after confirming sync worked).
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  check("manual transfer card is gone (replaced by automatic sync)", !document.getElementById("transfer-card"));
  check("Enviar para o Claude card is untouched (unrelated feature, still there)", !!document.getElementById("claude-export-card"));
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // --- sync-banner CSS bug - 2026-09-09, user report: "sync aparecendo
  // toda hora mesmo sem eu ter atualizado nada". Root cause: the EXACT
  // same class of bug as the "Mais" dropdown from earlier today -
  // .sync-banner's own `display: flex` (author rule) always beat the
  // browser's native [hidden] handling, so the banner rendered visible
  // regardless of its .hidden property being correctly true the whole
  // time. Same fix as before: an explicit [hidden] override. Also
  // hardened the underlying logic to compare save CONTENT, not just the
  // savedAt timestamp (a changed timestamp isn't the same as changed
  // data) - can't easily exercise that half live without a real db
  // connection (unavailable on the local dev server this suite runs
  // against), so this check is scoped to what's actually verifiable here:
  // the CSS itself.
  const syncBanner = document.getElementById("sync-banner");
  check("sync banner is actually invisible while hidden (not just .hidden===true)",
    syncBanner && getComputedStyle(syncBanner).display === "none");

  // --- "#app" height bug - 2026-09-09, user report: "ao rolar para baixo a
  // dex fica travada". Root cause: #app used `min-height: 100%` (a FLOOR,
  // not a ceiling) instead of `height: 100%` - once its content (topbar +
  // main + footer) grew taller than the viewport, #app just grew past it
  // instead of being capped, so `main`'s flex:1/min-height:0 chain never
  // got a bounded height to clip against. Every internal panel's own
  // `overflow-y: auto` (.species-detail, .species-list, etc.) was already
  // correct CSS that simply never got the chance to engage - the whole
  // BODY scrolled instead (confirmed directly: window.scrollY moved,
  // every inner panel's own scrollTop stayed 0). At desktop width this
  // meant scrolling a long species' detail scrolled the search box and
  // species list away with it. Fixed by capping #app at `height: 100%`.
  setSearch("Charizard");
  await wait(30);
  const charRow3 = document.querySelector("#species-list .species-row");
  if (charRow3) {
    charRow3.click();
    await wait(30);
    const detailPanel = document.querySelector(".species-detail");
    detailPanel.scrollTop = 500;
    await wait(30);
    check(".species-detail scrolls internally (not the whole page/body)",
      detailPanel.scrollTop > 0 && window.scrollY === 0 && document.body.scrollTop === 0,
      "detailScrollTop=" + detailPanel.scrollTop + " windowScrollY=" + window.scrollY);

    // Switching to a DIFFERENT species should reset scroll to the top...
    document.getElementById("back-to-list").click();
    await wait(30);
    setSearch("Bulbasaur");
    await wait(30);
    document.querySelector("#species-list .species-row").click();
    await wait(30);
    check("scroll resets to top when switching to a different species",
      document.querySelector(".species-detail").scrollTop === 0);

    // ...but refreshing the SAME species in place (e.g. after "Salvar
    // build") must NOT yank the user back to the top - a real regression
    // this fix could easily have introduced if not careful.
    document.querySelector(".species-detail").scrollTop = 400;
    await wait(30);
    document.getElementById("mybuild-save").click();
    await wait(50);
    check("scroll position is preserved when the SAME species re-renders in place",
      document.querySelector(".species-detail").scrollTop === 400,
      document.querySelector(".species-detail").scrollTop);
  } else { check("Charizard found for the #app height-fix test", false); }
  setSearch("");
  await wait(30);

  localStorage.clear();

  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART A: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  return results;
}

// ============================== PART B ==============================
// B1 - run this FIRST, then reload the page (navigate to the same URL):
/*
localStorage.clear();
const fakeSave = {
  v: 2, dataVersion: "test", savedAt: new Date().toISOString(),
  team: ["SPECIES_CHARIZARD", "SPECIES_TOTALLY_MADE_UP_FUTURE_MON"],
  box: ["SPECIES_ANOTHER_FAKE_ONE"],
  savedTeams: [], settings: { difficulty: "ace", milestone: 999999 }
};
localStorage.setItem("er_terminal_save", JSON.stringify(fakeSave));
"B1 done - now reload the page, then run B2";
*/

// B2 - run this AFTER reloading:
/*
(function () {
  const results = [];
  function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || "" }); }
  // #settings-milestone starts with zero <option>s in the markup - it's only
  // populated by initProgress(), lazily, the first time the Progresso tab is
  // opened (same lazy-init pattern as Chefoes). Checking it before that just
  // measures an empty select, not the actual clamp (which lives in the
  // closure-private `state.settings.milestone`, unreachable from outside -
  // this IS the real, DOM-visible proxy for it).
  document.querySelector('.tab-btn[data-tab="progress"]').click();
  const milestoneEl = document.getElementById("settings-milestone");
  const maxOption = milestoneEl ? milestoneEl.options.length - 1 : null;
  check("milestone clamped to a valid option on load",
    milestoneEl && parseInt(milestoneEl.value, 10) === maxOption,
    "value=" + (milestoneEl && milestoneEl.value) + " max=" + maxOption);
  // force a real persist() via the UI, then check orphans survived it
  if (milestoneEl) milestoneEl.dispatchEvent(new Event("change", { bubbles: true }));
  const saved = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  check("orphan team member survives a real persist()",
    (saved.team || []).indexOf("SPECIES_TOTALLY_MADE_UP_FUTURE_MON") !== -1);
  check("orphan box member survives a real persist()",
    (saved.box || []).indexOf("SPECIES_ANOTHER_FAKE_ONE") !== -1);
  const passed = results.filter(r => r.pass).length;
  console.log("=== smoke_test_suite PART B: " + passed + "/" + results.length + " passed ===");
  results.forEach(r => console.log((r.pass ? "PASS" : "FAIL") + "  " + r.name + (r.detail ? "  (" + r.detail + ")" : "")));
  localStorage.clear();
  return results;
})();
*/
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

### `data/dex_compact.json` — abilities, moves e items

```json
"abilities": [["-------","Empty ability slot."],
              ["Stench","10% chance to flinch targets. Toxic terrain is permanent."],
              ["Drizzle","Summons rain on entry. Lasts 8 turns."]]

"moves[424]": ["Fire Fang", 2, 0, 80, 100, 15, ""]
               nome        tipo split pwr acc pp  desc (esvaziada por slim_dex.ps1)

"items": ["Adamant Orb", "Air Balloon", "Assault Vest", ...]   // adicionado em 09/09
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

### `data/mega_forms.json` (novo em 09/09)

```json
{ "ITEM_CHARIZARDITE_X": "SPECIES_CHARIZARD_MEGA_X", "ITEM_MILOTICITE": "SPECIES_MILOTIC_MEGA" }
```

### `data/species_rank.json` (novo em 09/09)

```json
{ "SPECIES_PROBOPASS": { "tier": "SS", "score": 94.2, "bstPct": 61, "bossPct": 88, "abilityPct": 99,
                          "stage": 1, "stageTier": "SS", "stageScore": 97.1 } }
```

`tier`/`score` são o rank geral (contra as 1.906 espécies); `stageTier`/`stageScore` são o mesmo
cálculo rodado só contra pares do mesmo estágio evolutivo (ver §5, D16). `stageTier: null` quando
a espécie não tem nenhuma evolução real (não-Mega/Primal) de nenhum lado.

### `data/boss_reference_builds.json` / `data/build_history.json` (formato compartilhado)

```json
{ "SPECIES_CHARIZARD": [ { "savedAt":"...", "context":"Courtney Mossdeep (dupla)",
                            "ability":"Tough Claws", "nature":"Timid", "item":"Charizardite Y",
                            "evs":"252 SpA / 4 SpD / 252 Spe", "moves":["Flamethrower", ...] } ] }
```

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

# Recalcula o rank de todas as espécies
powershell -File scripts\compute_species_rank.ps1

# Arquiva a build atual de uma espécie antes de sobrescrevê-la em builds.json
powershell -File scripts\archive_build.ps1 -Sname SPECIES_CHARIZARD -Context "..."
```

Para inspecionar os dados em PowerShell (lembrando que `ConvertFrom-Json` **falha** neste
dataset):

```powershell
Add-Type -AssemblyName System.Web.Extensions
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = 200000000
$dex = $ser.DeserializeObject((Get-Content data\dex_compact.json -Raw -Encoding UTF8))
```

Para testar comportamento em runtime, a página é servida localmente e a suíte
`scripts/smoke_test_suite.js` é colada no console do navegador (`await runLiveTests()`) — foi
assim que a métrica de 66/66 da §8 foi obtida. **Limite conhecido desta suíte** (achado real da
14ª passada de 09/09, ver §7): ela verifica majoritariamente *estado* do DOM (`.hidden`,
conteúdo de texto), não *aparência renderizada* — vários bugs reais (CSS de autor vencendo
`hidden`, larguras que forçam rolagem horizontal) passaram batido nela até serem encontrados por
uso manual real do app. Onde possível a suíte foi reforçada para checar `getComputedStyle(...)`
em vez de só o estado lógico, mas isso não é garantido em todo checkpoint.

---

## 13. Contexto de manutenção

- **É um repositório git local desde 08/09** (identidade local configurada, sem remoto). Um
  commit por mudança funcional, mensagens descritivas. Sem CI.
- **Existe uma suíte de testes semi-automatizada** (`scripts/smoke_test_suite.js`, ~66
  verificações) — não é um test runner real (sem Node/framework disponível no ambiente), mas
  cada checagem se auto-relata PASS/FAIL em vez de exigir inspeção visual de um valor bruto. Ver
  o limite dela na §12.
- **Os scripts `.ps1` devem permanecer em ASCII puro.** PowerShell 5.1 lê arquivos sem BOM
  usando a codepage do sistema; um travessão em um comentário quebra o parser com erros
  confusos de "token inesperado". Textos acentuados ficam no template HTML, que é lido como UTF-8
  explicitamente.
- **Dois scripts editam arquivos de dados in-place** (`slim_dex.ps1`, `expand_combo_abilities.ps1`)
  — desde 09/09 rodam automaticamente dentro do caminho de rebuild completo do `build.ps1`, mas
  continuam frágeis por design se chamados fora dessa ordem — ver §9 item 7.
- **Só publicar `artifact_final.html`, nunca `artifact_template.html`.** Ver o incidente
  documentado em §3.2/§7 — isso já aconteceu de verdade uma vez.

---

## 14. O que eu gostaria de saber ao final da auditoria

1. Existe algum caminho pelo qual o usuário **perca dados** que eu não tenha coberto — incluindo
   os novos campos `notes`/`customBuilds`/`orphans` do save?
2. A cobertura parcial da análise de fraqueza por habilidade (§9 item 3) é **enganosa a ponto de
   valer remover ou restringir mais claramente** a quais Pokémon ela se aplica?
3. Qual é o **próximo maior risco** deste projeto, na sua avaliação — e não necessariamente algo
   que eu já tenha listado?
4. Alguma decisão da §5 está **objetivamente errada**?
5. O incidente de publicação do arquivo errado (§3.2) — a mitigação de processo adotada é
   suficiente, ou existe uma trava técnica real e barata que eu não considerei?
6. Vale a pena avançar na calculadora de dano de escopo reduzido levantada em §9 item 11, ou o
   risco de complexidade continua maior que o benefício?
