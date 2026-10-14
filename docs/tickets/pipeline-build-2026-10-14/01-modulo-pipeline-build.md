# 01 — Módulo do pipeline de build com intenção

Status: pronto-para-revisao (branch `pipeline-modulo`, sem merge e sem publicação)
Bloqueado por: nenhum
Desbloqueia: 02 (ligar o botão e o lote), 03 (motivo e selo na tela)

## O que entrega
`src/regras/pipeline_build.js` (marcador no template, depois de `prompts_ia.js`), três funções puras, sem tela:
- `candidatosDeBuild(sp, opts)` -> `{ alvo, candidatos, aviso, avisos }`: de 3 a 5 candidatos (uma das 3 habilidades + as inatas + 4 golpes), cada um com `golpes`, `habilidade`, `inatas`, `motivos`, `hitKill` (1 | 2 | 0), `baterPrimeiro`, `porQue` ("velocidade" | "prioridade" | null), `dano { min, max }` (% do HP do pior alvo, faixa de 85% a 100%), `rotulo` ("calibrada" | "estimada"), `avisos` e `build` (rascunho que passa em `validateAiBuild`; leva também `sname` para o `fecharBuild`).
- `especiesQueResolvem(alvo, opts)` -> `[{ sp, candidato }]`: do alvo para os Pokémon do time e da caixa (ou `opts.especies`); só quem tem `hitKill > 0`; `opts.max` (padrão 10).
- `fecharBuild(candidato, escolha)` -> `{ ok, build, erros }`: a IA escolhe `{ evs, item, natureza }`; passa por `validarRespostaDeBuildDaIa`; dado ruim vira `ok: false`, nunca exceção.

Como funciona (resumo): kit = golpes liberados no cap (`golpesDeDueloAte` + `availableMovesFor`) sem golpe que depende do item (Fling, Natural Gift); referência de simulação = EVs de ataque + 252 Spe, sem item, natureza que mais ajuda (Adamant, Jolly, Modest e Timid são testadas); cada golpe é medido com `resultadoDoDuelo(..., { soPar: true })` contra o primeiro Pokémon do alvo e contra o ás (vale o pior). Sem `opts.alvo`: o próximo líder de ginásio da Etapa (`getRemainingBossEntries`); se não há, `alvo: null`, aviso "sem chefão adiante" e candidatos só por sinergia (`hitKill 0`, `dano { 0, 0 }`).

Ranking (decisão do usuário): hit-kill de 1 golpe e bate primeiro > hit-kill de 2 golpes e bate primeiro > resto por dano e sinergia. "Bate primeiro" = golpe de prioridade que o alvo não bloqueia (Queenly Majesty, Dazzling, Armor Tail; vale também para a prioridade condicional da Coil Up) OU mais Velocidade que o alvo. A prioridade condicional vale só quando o golpe derruba de uma vez.

## Critérios de aceite (comportamento ATUAL, fim da rodada 2)
- [x] Caso A (Centiskorch): com Brawly, Tate e Liza e sem chefão adiante, o 1º candidato é Coil Up + Fire Fang e os motivos citam Coil Up e Flaming Jaws.
- [x] Caso B (Ledian x Ninetales da Meteor Falls): Mega Punch, hitKill 1, bate primeiro por velocidade, mas "estimada" com o aviso "O alvo age antes com Flame Burst (+1 de prioridade) e derruba Ledian antes de ele agir". Accelgor/Beatdown e Steelix/Coil Up não ganham "bate primeiro" por prioridade.
- [x] Rótulo "calibrada" só por caso conferido (`CASOS_CALIBRADOS`: Ledian + Aerodynamics + Mega Punch ou Aerial Ace contra o Ninetales), sem prioridade do alvo que o atacante não supere e sem fuga no Intimidate. "Derruba no turno 1" só com `calibrada` e `garantido` (dano mínimo da rolagem já derruba); senão "Provável derrubar" com a faixa.
- [x] Todo candidato passa em `validateAiBuild`; determinismo; não muta `state`; sem exceção por falta de dado (lista vazia sempre traz o motivo em `aviso` e `avisos`).
- [x] Tempo: ~40 ms por espécie em média, no máximo ~140 ms (limite era ~2 s).
- [x] 39 testes em `tests/unit/pipeline_build.test.mjs`; 26 sabotagens `pipeline-*` em `tests/unit/mutacoes.mjs`, todas pegas.

## Comentários
- Limite conhecido, avisado em `avisos`: "Simulação 1x1: luta em dupla e Fake Out não são simulados."
- A prioridade do alvo (Flame Burst, +1) NÃO entra na definição de "bate primeiro" (decisão do usuário); ela rebaixa o rótulo e gera aviso (ver P1 abaixo). Usa a prioridade EFETIVA do motor, então Psychic Terrain (Tapu Lele, Indeedee com Psychic Surge) e Surprise! a zeram.
- "Alvo qualquer" no caso A não vale ao pé da letra: contra o Nosepass da Roxanne, Molten Down + Flamethrower derruba em 2 golpes batendo primeiro e, pela ordem do usuário, sobe no ranking acima de Coil Up + Fire Fang. O teste do caso A usa Brawly, Tate e Liza e o modo sem chefão.
- Habilidade que só funciona gastando o item (Gluttony, Ripen) é recusada pela validação sem item: o rascunho leva Sitrus Berry e o candidato avisa. Mega no modo de mega temporária (duas pedras possíveis): o rascunho leva a primeira pedra e o candidato avisa. Nos dois casos a simulação não conta o item.
- Quando a validação recusa todo conjunto (ex.: Pyukumuku, sem golpe do próprio tipo), `candidatos: []` e o motivo vai em `aviso` e `avisos`.
- Fuga no Intimidate (Tactical Retreat): o motor devolve só a nota 0,5 em vez do duelo; o módulo mede o dano como se ninguém fugisse (cópias sem a fuga, motor intocado), marca o candidato "estimada" e avisa.
- `tests/unit/pipeline_kit_legal.test.mjs` (vindo de outra sessão) foi aproveitado como contrato da fase 1.

## Rodada 2 do supervisor (14/10, REFAZER): o que mudou
1. O aviso/rótulo da prioridade do alvo usa a prioridade efetiva do motor (`r.meu.melhor.prio`), não a do dado: Tapu Lele e Indeedee com Psychic Surge não recebem "O alvo age antes". Teste e sabotagem `pipeline-prioridade-do-alvo-pelo-dado`.
2. Fuga no Intimidate: 8 espécies (Tatsugiri e formas, Tatsugiri Mega, Deoxys Speed, Chansey e Blissey Redux) voltavam com 0 candidatos por ler o retorno numérico do motor como `{ meu }`. Corrigido nas duas chamadas; teste das 8 nos milestones 1, 4 e 6 e sabotagens `pipeline-fuga-no-intimidate-*`.
3. Megas com duas pedras (Abomasnow, Dragalge, Excadrill, Skarmory, Meowstic): rascunho com a pedra + aviso; teste dos 5 e sabotagem `pipeline-pedra-do-rascunho-some`.
4. Critérios de aceite reescritos conforme o comportamento atual (acima).
5. Lista vazia sempre com motivo: varredura por amostra nos milestones 1 e 6 (inclui Alcremie, Pyukumuku, Budew, Castform Sandy) e sabotagem `pipeline-lista-vazia-sem-motivo`.

## Rodada 1 do supervisor (14/10, REFAZER): o que mudou
1. `calibrada` só por caso conferido: lista `CASOS_CALIBRADOS` ({atacante, habilidade, golpe, alvo}); hoje só Ledian + Aerodynamics + Mega Punch/Aerial Ace contra o Ninetales. Qualquer outro atacante, habilidade ou alvo é "estimada" (o Scyther Mega com Aerial Ace contra o Charizard saía "calibrada" sem nunca ter sido conferido). Ampliar a lista é decisão do usuário.
2. Campo novo `garantido`: "derruba no turno 1" só com o dano mínimo (rolagem de 85%) já derrubando; senão o motivo diz "Provável derrubar" e mostra a faixa. O ranking segue pela média.
3. Prioridade negativa (Avalanche -4...) nunca "bate primeiro por velocidade"; Focus Punch saiu do kit (falha se o atacante leva dano).
4. `especiesQueResolvem` ordena pelos 3 níveis do usuário, depois por dano (o teste que travava o erro foi corrigido).
5. Listas vazias (Aerodactyl x Flannery, Pinsir Mega e Diancie na milestone 6): o golpe de sinergia forçado só precisa bater em UM alvo, e a sinergia pode estar num golpe de status do movepool (Pinsir Mega: Aerodynamics + Tailwind). Travado por teste.
6. O aviso de prioridade do alvo olha TODOS os golpes dele com prioridade > 0 (Bullet Punch do Metang, Aqua Jet do Gabite Redux, Extreme Speed do Genesect), não só o melhor.
7. Padrão conservador `alvoAgeAntes` (constante `CONSIDERA_PRIORIDADE_DO_ALVO`, reverte numa linha): se o alvo tem golpe de prioridade não bloqueado, mais alta que a do atacante, o rótulo cai para "estimada" e o aviso diz "O alvo age antes com <golpe> (+N de prioridade) e tira X% do HP de <atacante>" (ou "derruba <atacante> antes de ele agir"). `baterPrimeiro` e o ranking seguem a definição do usuário. Ledian x Ninetales: hitKill 1, bate primeiro por velocidade, mas "estimada".
8. Testes novos: Typhlosion x Ninetales (Earthquake derruba, Aerial Ace acessório não deixa "calibrada"), calibrada exige todos os alvos, desempate por dano e sinergia, aviso com todos os golpes de prioridade. 10 sabotagens novas (21 `pipeline-*`, todas pegas, incluindo every->some).
9. Motor NÃO mudou. Reuso de `temPrioridadeNoDuelo`, `aguentaUmGolpe`, `bloqueiosNoDuelo`, `resultadoDoDuelo`. Cópias que ficaram no módulo (comentadas): o bloqueio da prioridade CONDICIONAL por Queenly Majesty (`pipelinePrioridadeBloqueada`, espelha `danoNoDuelo`, duelo.js ~1673) e a leitura de prioridade do alvo (`pipelineAmeacasDePrioridade`, espelha `prioAqui`/`prioCheio`); as regras de sinergia/STAB espelham `validateAiBuild`.

## Perguntas ao usuário (ele estava dormindo: ficou o padrão conservador)
**P1. A prioridade do alvo (Flame Burst +1 do Ninetales da Meteor Falls; o motor dá derrota ao Ledian na luta completa).**
(a) Manter assim: "bate primeiro" pela definição dele, rótulo "estimada" e aviso "O alvo age antes..." (padrão atual).
(b) A prioridade do alvo passa a definir "bate primeiro" (muda o ranking: o Ledian deixa de bater primeiro e sai do topo).
(c) Voltar a "calibrada" ignorando o Flame Burst (`CONSIDERA_PRIORIDADE_DO_ALVO = false`).

**P2. Levar a correção para o motor (duelo.js, regra de mecânica)?** Pontos que o módulo trata por conta própria porque o motor não trata: (1) Coil Up (prioridade condicional) contra Queenly Majesty na luta completa: o motor só bloqueia o golpe de prioridade de base; (2) Psychic Terrain contra a prioridade condicional; (3) Opportunist (`prioNoFinal`) dá prioridade ao golpe que decide, e o módulo só usa a prioridade condicional quando o golpe derruba de uma vez. Opções: (a) deixar no módulo; (b) corrigir no motor e o módulo passa a reusar.
