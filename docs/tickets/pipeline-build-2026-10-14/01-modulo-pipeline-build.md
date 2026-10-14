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

## Critérios de aceite
- [x] Caso A (Centiskorch): com Brawly, Tate e Liza e sem chefão adiante, o 1º candidato é Coil Up + Fire Fang e os motivos citam Coil Up e Flaming Jaws.
- [x] Caso B (Ledian x Ninetales da Meteor Falls): Mega Punch, hitKill 1, bate primeiro por velocidade, "calibrada"; Accelgor/Beatdown e Steelix/Coil Up não ganham "bate primeiro" por prioridade.
- [x] Rótulo "calibrada" só com golpe da lista `GOLPES_CALIBRADOS` (Mega Punch, Aerial Ace); "derruba no turno 1" só nesses casos.
- [x] Todo candidato passa em `validateAiBuild`; determinismo; não muta `state`; sem exceção por falta de dado.
- [x] Tempo: ~40 ms por espécie em média, no máximo ~140 ms (limite era ~2 s).
- [x] 25 testes em `tests/unit/pipeline_build.test.mjs`; 11 sabotagens `pipeline-*` em `tests/unit/mutacoes.mjs`, todas pegas.

## Comentários
- Limite conhecido, avisado em `avisos`: "Simulação 1x1: luta em dupla e Fake Out não são simulados."
- Decisão a confirmar (pergunta do módulo): o motor vê o Ninetales da Meteor Falls agindo antes com Flame Burst (+1 de prioridade no dado) e a luta completa dá derrota ao Ledian. Pela definição do usuário ("prioridade que não é bloqueada OU mais Velocidade") o Ledian "bate primeiro por velocidade"; o candidato carrega o aviso "o alvo tem golpe de prioridade (Flame Burst)...". Se o usuário quiser que a prioridade do alvo entre na definição, é uma linha em `pipelineLinhaDoGolpe`.
- "Alvo qualquer" no caso A não vale ao pé da letra: contra o Nosepass da Roxanne, Molten Down + Flamethrower derruba em 2 golpes batendo primeiro e, pela ordem do usuário, sobe no ranking acima de Coil Up + Fire Fang. O teste do caso A usa Brawly, Tate e Liza e o modo sem chefão.
- Habilidade que só funciona gastando o item (Gluttony, Ripen) é recusada pela validação sem item: o rascunho leva Sitrus Berry e o candidato avisa (a simulação não conta o item).
- Quando a validação recusa todo conjunto (ex.: Pyukumuku, sem golpe do próprio tipo), `candidatos: []` e o motivo vai em `avisos`.
- `tests/unit/pipeline_kit_legal.test.mjs` (vindo de outra sessão) foi aproveitado como contrato da fase 1 e entra neste commit.
