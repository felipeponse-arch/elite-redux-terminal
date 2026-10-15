# Plano: que versão do jogo o app mira? (para o Felipe decidir de manhã)

Só documento. Nada de código, nenhum ticket criado ou alterado. Base: master do GitHub `74622b1`. Fontes: `docs/tickets/dados-2654/01-10`, `docs/tickets/calibracao-2026-10-15/07` e `08` (branch `calibracao-varredura`), `docs/pesquisa_versao_2654.md`, `docs/pesquisa_2654_changelog.md`, `docs/calibracao/versao_dos_jogadores.md` (branch `versao-dos-jogadores`), `docs/calibracao/versao_publica_x_upcoming.md` (branch `calibracao-versao-publica`), `docs/tickets/calibracao-2026-10-15/03-perguntas.md`.

## 1. Em três linhas
- A versão pública mais recente de que há registro é a **2.65.3b (26/03/2026)**; o app está no dado de **28/03** (2.65beta, `er-config` `6a30b66`). A 2.65.4 (dado do NextDex de 07/10, `er-config` `7285071` de 06/10) e o `upcoming` (`486026e`/`d1a9a4c`, 14/10) são **desenvolvimento**, sem nota oficial (o changelog para na 2.65.3b; o texto de versão no código segue "v2.65 Beta2.1").
- A calibração dos tickets 01 a 06 vale para o código de 28/03 (25 de 27 divergências com o trecho igual); **vale em qualquer cenário**.
- **Recomendação (a decidir pelo Felipe): cenário A agora** (publicar a calibração na 2.65beta) e **preparar o B em paralelo, sem publicar**. O C não: é alvo móvel (40 commits em 8 dias entre a 2.65.4 e o `upcoming`).

## 2. As três versões lado a lado
| | 2.65beta (app hoje) | 2.65.4 (dado NextDex 07/10) | `upcoming` (14/10) |
|---|---|---|---|
| Código / config | `7d85acd` / `6a30b66` (28/03) | config `7285071` (06/10) | `486026e` / `d1a9a4c` (14/10) |
| É versão pública? | quase (2.65.3b é de 26/03; a fonte não confirma que seja este commit) | **não** (sem nota oficial) | **não** |
| Habilidades | 1034 | 1063 (**29 novas**, 5 renomeadas, 163 com texto curto mudado) | 1072 (**38 novas**, 7 renomeações, 174 com texto curto mudado) |
| Golpes | 1032 | 1032 (37 alterados, 0 novos) | 1041 (**9 novos**, 42 alterados) |
| Espécies | 1911 | 1926 (17 novas, 1 removida: Arbok Mega) | 1926 (16 novas, 1 removida, 116 alteradas em relação à beta) |
| Itens | - | nenhum mudou de efeito (2 renomeados) | nenhum mudou de efeito |
| Contagem de texto: simples (descrição curta, mesma conta nas três); a varredura de 15/10 contou 201 no `upcoming` por outro critério | | | |
| Só nesta coluna e não na do meio | - | - | 9 habilidades novas (Photokinesis, Photon Burst, Rippling Punch, Cackling, Fresh Snowfall, Sticky Situation, Bioluminescent, Blinking Flash, Brain Freeze), Keen Edge -> Sharpness, 9 golpes novos, 17 textos de habilidade a mais (contagem simples) |

Achados que mudam o plano (medidos hoje na `er-config`):
1. **As 59 habilidades cujo texto novo quebra o parser do motor já mudaram na 2.65.4** (59 de 59 com o texto diferente em `7285071`). O "parser antes do dado" do ticket 08 da calibração não é só do cenário C: o B também precisa dele, e **nenhum ticket do `dados-2654` o cobre**.
2. **Madness Enhancement (M8) e Feathercoat (B1) já têm o número novo na 2.65.4** ("reduces damage taken by 20%"; "15% / 30%"), e os dois estão na lista do `dados-2654/02`. O ticket 07 da calibração só repete esses dois para o B e o C.
3. **6 das habilidades que o ticket 03 da calibração corrigiu têm texto novo na 2.65.4** (Thick Blubber, Hyper Cleanse, Warmonger, Hammer Fist, Deep Freeze, Devious Present): os leitores de texto que escrevi para elas (feitos sobre o texto da 2.65beta) param de casar depois da troca. As outras 18 conferidas têm texto igual. O código do jogo dessas habilidades é igual nas duas datas.
4. **O ticket 07 do `dados-2654` (sono e paralisia estilo Champions) não foi conferido contra o código de 28/03**: o `versao_publica_x_upcoming.md` não o cobre. Só se sabe que o código do `upcoming` liga `B_USE_CHAMPIONS_SLEEP/PARALYSIS`.
5. O `dados-2654` não tem ticket para os **golpes alterados** (37 na 2.65.4): o dado novo já traz poder, PP e prioridade, mas as flags de categoria do ticket 01 da calibração (`data/golpes_flags_config.json`) precisam ser regeradas junto.

## 3. Os dois conjuntos de tickets lado a lado
| Tema | `dados-2654` (curadoria de 07/10) | Calibração 07 / 08 (15/10) | Sobreposição e lacuna |
|---|---|---|---|
| Trocar o dado | **01** (G): dado NextDex 2.65.4, Eviolite item 0, chefões vs `TrainerList` `7285071`, Arbok Mega fora, 5 renomeações | **08** (G): dado novo a partir da `er-config` estruturada (`expanded_description`, flags, `hold_effect_strength`) | Mesmo trabalho, **fontes diferentes**: NextDex (sem flags nem itens) x `er-config`. Escolher uma como verdade. O 08 da calibração tem mais 2 renomeações (Keen Edge -> Sharpness, Abominable Monster / Icicle Fist) que só existem no `upcoming` |
| Parser do texto | nenhum | **08**, 1º item | **Lacuna do `dados-2654`** (achado 1) |
| Habilidades com efeito mudado | **02** (10) e **03** (10 prováveis) | **07**: M8 e B1 | M8 e B1 são 2 das 10 do 02. O resto de 02 e 03 não tem equivalente na calibração |
| Habilidades novas | **04, 05, 06** (29 em 10/10/9) | **08**: 38 novas (15 sem efeito lido) | O `dados-2654` cobre 29; as outras 9 são só do `upcoming` |
| Golpes | nenhum ticket (37 alterados) | **08**: 9 novos, 42 alterados | Lacuna no `dados-2654`; tratar dentro da troca do dado |
| Espécies e treinadores | dentro do **01** (chefões regerados) | **08**: 16 novas, 116 alteradas, 6 diferenças em chefões | Mesma conferência; o limite muda de `7285071` para `d1a9a4c` |
| Sono e paralisia Champions | **07** | - | Só do `dados-2654` (a conferir contra 28/03) |
| Builds | **08** (revisar as afetadas) e **09** (17 espécies novas) | - | Só do `dados-2654`; dependem do dado e das habilidades |
| M9 "Normal vira X" (STAB x1,5 do código x x1,3 da calculadora) | - | **07** (P, `para-o-usuario`): o Felipe mede o dano em batalha | **Independe de versão** (o trecho do jogo é igual em 28/03 e 14/10) |
| M10 (multiplicador de habilidade depois do +2) | - | **08** | Independe de versão (a ordem do cálculo é igual nas duas datas); efeito de 1% a 3%; pode ir em qualquer cenário |
| Rank, histórico, publicação | **10** (M): recalcula o rank UMA vez e publica | **08**, último item | Mesmo fechamento. As correções de 01 a 06 da calibração **também exigem recalcular o rank** (nenhuma o recalculou) |
| Já resolvidos | 11, 12, 13 | - | - |

Os tamanhos P/M/G abaixo são meus (os tickets do `dados-2654` não trazem tamanho): G = mexe em dado e em vários arquivos; M = uma regra ou um lote com teste e sabotagem; P = uma decisão ou um ajuste.

**Ordem de dependência (vale para B e C):**
`calibracao-empilhada (01-06)` -> `pergunta 1 do 03` (ver seção 6) -> `parser` -> `dados-2654/01` -> { `02`, `03`, `04` -> `05`/`06`, `07` } -> { `08`, `09` } -> `10`. O `dados-2654/01` já diz que só começa depois do 01 da dívida técnica e do 08 das pendências; some a isso a pilha da calibração, que mexe nos mesmos arquivos (`duelo.js`, `data/`). O M9 (medida do Felipe) e o M10 ficam soltos.

## 4. Os três cenários
### A. Ficar na 2.65beta / 2.65.3b pública (regra do Felipe de 07/10: manter o app até a versão nova sair no site)
- **O que muda:** só a calibração 01-06 (categorias de golpe, itens, multiplicadores de habilidade, Flash Fire/Dry Skin, Multiscale/Booster Energy, prioridade e campo) e o que a pergunta 1 decidir. O dado, as builds e o rótulo de versão não mudam. M8 e B1 **não** entram (o motor já está certo para 28/03).
- **Risco:** baixo no motor (o código de 28/03 é igual nos trechos calibrados). O risco de produto é o app ficar atrás do que os jogadores já jogam, se houver build pública depois da 2.65.3b que a fonte não mostra. A flag `light` (25 golpes) e o Ice Ball (`throwing`) vêm de `d1a9a4c` e não existem em `6a30b66`: efeito pequeno (nenhuma habilidade da 2.65beta lê `light`).
- **Fonte:** `versao_publica_x_upcoming.md` (25 de 27 iguais); decisão 75 do registro; `versao_dos_jogadores.md`.
- **Tickets que sobram (em ordem):**
  1. Calibração 01-06, `calibracao-empilhada`: já no portão. Sobra só entrar no master. (G, pronto)
  2. Decisão da pergunta 1 -> se aprovada, um ticket novo de dupla contagem. (M)
  3. M9, medida do Ledian em batalha (calibração 07, só a parte M9). (P, é com o Felipe)
  4. M10, opcional, junto da pilha. (P)
  5. `dados-2654/10` reduzido: recalcular o rank uma vez, entrada no histórico, publicar. (M)
- **Total:** M, sem ticket G novo.

### B. Mirar o dado 2.65.4 do NextDex (desenvolvimento de 07/10)
- **O que muda:** o app passa a mostrar "Dado: 2.65.4 (07/10)" com 29 habilidades novas, 17 espécies novas, Arbok Mega fora, 10 efeitos corrigidos, mais sono/paralisia Champions. Precisa quebrar a decisão 75 (o app só segue versão publicada) ou ser publicado como "dado de desenvolvimento".
- **Risco:** médio-alto. É um dado que **nenhum jogador tem** (sem nota oficial, sem tag, `2.65.4.1b` só aparece em pesquisa de IA). Três commits de 07/10 ficam fora do dado (Kirlia Redux, Morpekyll, Polartic). O parser precisa de reforma (achado 1). Os 6 leitores de texto da calibração que perdem o casamento (achado 3) precisam ser revistos.
- **Fonte:** `pesquisa_versao_2654.md` e `pesquisa_2654_changelog.md`; achados 1 a 3 acima.
- **Tickets que sobram (em ordem):**
  1. Calibração 01-06 (como em A). (G, pronto)
  2. Pergunta 1 e ticket de dupla contagem. (M)
  3. **Parser** (1º item do 08 da calibração): trocar a fonte do texto pelo dado estruturado da `er-config` `7285071`. (G)
  4. `dados-2654/01` trocar o dado (+ regerar `golpes_flags_config.json` e `itens_config.json` para `7285071`). (G)
  5. `dados-2654/02` e `/03`: 20 habilidades; já cobrem M8 e B1. (M + M)
  6. `dados-2654/04`, `/05`, `/06`: 29 habilidades novas. (M + M + M)
  7. `dados-2654/07` sono e paralisia (conferir antes o código de 28/03 e o de 07/10). (M)
  8. `dados-2654/08` revisar as builds afetadas, `/09` builds das 17 espécies. (M + M)
  9. M9 (P) e M10 (P).
  10. `dados-2654/10` fechamento: rank, histórico, publicação. (M)
- **Total:** G, com 2 tickets G, 10 M e 2 P.

### C. Mirar o `upcoming` (`486026e`, 14/10)
- **O que muda:** tudo do B, mais o que só o `upcoming` tem: 9 habilidades novas, Keen Edge -> Sharpness (27 chefões, 54 espécies), 9 golpes novos, 5 golpes alterados a mais, 17 textos de habilidade, itens iguais. O app avisaria "versão ainda não publicada".
- **Risco:** o mais alto. Alvo móvel: 40 commits na `er-config` entre `7285071` e `d1a9a4c` (e 42 commits no código do jogo desde 06/10). A decisão 75 teria de ser reescrita. Qualquer commit novo reabre o ticket de dado.
- **Fonte:** `versao_dos_jogadores.md` (seção 5) e `versao_publica_x_upcoming.md`.
- **Tickets que sobram (em ordem):** os do B, trocando o limite do `dados-2654/01` e do `/08` de `7285071` para `d1a9a4c`, mais:
  - Ticket novo "delta do `upcoming`": 9 habilidades novas (mesmo molde dos lotes 04-06), a renomeação Sharpness, os 9 golpes novos e os 42 alterados, as 116 espécies e os chefões vs o `TrainerList` atual. (G)
  - `dados-2654/04-06` passam de 29 para 38 habilidades (um lote extra). (M)
  - Reescrever a decisão 75 e o aviso de "versão não publicada" no app. (P)
- **Total:** G+, com 3 tickets G, 11 M e 3 P.

## 5. Comparação rápida
| | A | B | C |
|---|---|---|---|
| Tamanho | M | G | G+ |
| Tickets novos (não existem hoje) | 1 (dupla contagem, M) | 2 (parser vira ticket próprio; dupla contagem) | 3 (+ delta do `upcoming`) |
| Fica de acordo com a regra de 07/10 | sim | não (dado de desenvolvimento) | não |
| Alvo estável | sim | sim (o dado de 07/10 está parado) | **não** |
| Reaproveita o que existe | pilha 01-06 + `dados-2654/10` | tudo de `dados-2654` + 08 da calibração | idem + um delta |

## 6. A pergunta pendente do `03-perguntas.md`: dupla contagem da sinergia por golpe
- **O que é:** em ~50 habilidades (Nocturnal, Levitate, Electrocytes, Overgrow, Blaze...) o motor lê o número do texto E soma a sinergia por golpe da espécie (`species_ability_synergy.json`): Nocturnal x1,25 sai x1,54, Levitate x1,55, Overgrow x1,44. A pilha só tirou a sinergia das 15 habilidades que o ticket 03 passou a ler do texto; por isso 5 Pokémon de chefão (Aerodactyl x2, Charizard, Talonflame e o Braviary de Norman 5) ficam ~20% acima do código do jogo.
- **A correção geral** (3 linhas em `duelo.js`) muda o melhor golpe de **82 Pokémon de chefão a mais, para baixo, de x0,86 a x0,50**, e reescreve 2 testes. Decisão do Felipe, pendente.
- **Onde entra:**
  - **A:** ticket próprio (M) **antes** de recalcular o rank, depois de `calibracao-empilhada`.
  - **B e C:** **logo depois do `dados-2654/01`**, e não antes. A tabela `species_ability_synergy.json` vem do dado antigo; se for regerada na troca do dado, a decisão pode virar "aposentar a tabela" em vez de "pular as entradas" (**inferência minha, a conferir no script que a gera**). Em todo caso, **sempre antes do rank** (`dados-2654/10`), porque muda ~80 chefões.
- **Recomendação:** aplicar (o jogo multiplica uma vez só), mas só depois de o Felipe ver os 82 chefões que mudam.

## 7. O que o Felipe precisa decidir
1. Cenário: **A** (recomendado agora), B ou C. A e B não se excluem no tempo: A publica, B prepara.
2. Pergunta 1 do `03-perguntas.md`: aplicar a correção geral? (recomendo sim, antes do rank)
3. Se B ou C: qual fonte manda no dado, NextDex ou `er-config` estruturada? (recomendo a `er-config`: tem flags e itens, e o parser precisa dela)
4. Se B ou C: a decisão 75 (só versão publicada) muda? Sem mudar, o B vira "preparado, não publicado".
5. M9: quando medir o Ledian (a medida só o Felipe faz).

## 8. O que a fonte não confirma
- Se existe versão pública depois da 2.65.3b; qual commit gerou a ROM de qualquer versão pública; o conteúdo do eliteredux.net e das *releases* do GitHub (host bloqueado nesta sessão).
- Os tamanhos dos tickets do `dados-2654` (estimados por mim).
- Se o código de 28/03 já tinha o que o ticket 07 do `dados-2654` descreve (sono e paralisia Champions).
