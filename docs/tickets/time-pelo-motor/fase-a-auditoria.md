# Ticket 01 — Fase A: auditoria (somente leitura)

Base: worktree `time-pelo-motor-01`, master a0ab869, 20/10/2026. Nenhum arquivo do app foi editado. Medições em scripts
descartáveis fora do repo (`scratchpad/medir.mjs`, `juiz.mjs`, `juiz2.mjs`). Todos os caminhos abaixo são de `src/`.

## 1. Achado principal (muda o plano)

O botão "Meu Time melhor no geral" (v180) **não usa o motor para escolher o time**. `generateCompleteTeam`
(`ui/arquetipo.js:295`) chama `generateTeamForArchetype` (`ui/arquetipo.js:146`), que faz `pedirIA` (`ui/ia.js:~80`, via
`claude.use("sample")`, `ia.js:76-77`) sobre o roster de `rosterParaTimeIA` (`regras/prompts_ia.js:777`). O motor entra só nas
**builds** (`candidatosDeBuild` com `alvo { campo: true }`, `regras/pipeline_build.js:489`, chamado por
`regras/escolha_ia_candidatos.js:205`). Quem monta time pelo motor hoje é só o botão "Montar time contra este chefão"
(`ui/aba_chefoes.js:337`), que chama `montarTimeContraChefaoEmPassos` (`aba_chefoes.js:325`) contra **um** chefão por vez.
Não existe montagem de time contra o campo inteiro (`LUTAS_DA_RUN`, 29 lutas, `regras/chefoes.js:314`). A Fase C é função nova,
não só troca de botão.

## 2. Mapa de chamadas

```
Meu Time hoje (IA)            ui/arquetipo.js:295 generateCompleteTeam
  -> generateTeamForArchetype (arquetipo.js:146) -> pedirIA (ia.js) -> claude.use("sample")  [ESCOLHA DO TIME = IA]
  -> applyRecommendedTeam (arquetipo.js:200)
  -> gerarBuildsDoTimeComIA {timeNovo, campo:true} -> escolha_ia_candidatos.js:205 -> candidatosDeBuild (pipeline_build.js:489)
        -> pipelineResolverAlvo (:68, campo = 1 ás por luta de LUTAS_DA_RUN, :78-89) -> foesComBuffsDoGinasio(..buffsAtivosDoChefao)

Botão do chefão (motor)       ui/aba_chefoes.js:337 montarTimeContraEsteChefao
  -> candidatosDoJogador (aba_chefoes.js:248: time+caixa, battleUnitsOf = Mega só se liberada, serveProMono = mono)
  -> simularSemTravarATela (:323) -> montarTimeContraChefaoEmPassos (duelo.js:4432)   [opcoes: dupla, buffs, campo, ordem]
       -> climaDoTimeDoChefao (:2993) -> montarTimeNoClimaEmPassos (:4333)  1 passada sem clima + 1 por armador de clima
            -> por candidato: unidadeDaBuild (:3102, se tem build) OU melhorUnidadeContra (:3028)
                  -> 3 sets (+1 par rápido) x habilidades -> resultadoDoDuelo (:2707) por foe  -> comQuatroGolpes (:3125)
            -> guloso por cobertura (:4375-4388) -> simular() = simularLutaContraChefao (:4120) / simularDuplaContraChefao (:3696)
            -> 8 reservas x 6 vagas trocadas se pontos sobem (:4395-4403)  = até 48 simulações extras + 1
       -> escolhe a passada de clima com maior `valor`
  -> conferirTimeComBuilds (duelo.js:3085) refaz com as builds salvas (usa opcoes.ordem)
```

## 3. Assinaturas e semântica (item 2 do pedido)

Todos os nomes existem. Nenhum precisou de equivalente.

- `montarTimeContraChefao(candidatos, party, nivel, opcoes)` — `duelo.js:4425`; só drena o gerador `montarTimeContraChefaoEmPassos`
  (`:4432`). `candidatos` = `[{sp, owned, build?}]`. `party` = time do chefão (`bossPartyPorDificuldade`). Devolve
  `{escolhidos[{sp,owned,nota,set,ab,porFoe,unidade}], plano, clima, foes, valor, avaliados, simulacao, estrategia}`.
- `opcoes` lido em `:4433`: `dupla`, `buffs` (ids), `campo` (regra de campo), `ordem` (lista de `owned`). **Não existe** `favoritos`,
  `mono`, `mega`, nem objetivo/perfil. Mono e Mega são filtrados fora do motor, em `candidatosDoJogador` (UI).
- `simularLutaContraChefao(meus, foes, nivel, inicio)` — `duelo.js:4120`. `meus` = unidades (`unidadeDeDuelo`/`unidadeDaBuild`),
  `foes` = `foeDeDuelo` (`:2969`). `inicio` (opcional) = `{lado, statusNoFim, ultimo, clima}`. Retorna
  `{venceu, derrubados, total, vivos, hpRestante, log, pontos}`. A dupla é outra função (`simularDuplaContraChefao`, `:3696`).
- `pontos` — `duelo.js:4326-4328`: `derrubados + (venceu ? 6 + 0,5*vivos + 0,5*soma(HP dos vivos) : 0) + 0,5*soma(1-HP) dos foes vivos`.
- `comQuatroGolpes(melhor, sp, foes, nivel, clima)` — `duelo.js:3125`. **Não** pega top-1 de pipeline: refaz os 4 golpes por
  cobertura de dano (`quatroGolpesDeDano`, `:3052`, guloso) e disputa o 4º espaço com cada golpe de status útil
  (`planosUteisDuelo`, `:3260`) pela nota dos duelos. Chamado só por `melhorUnidadeContra` (`:3045`).
- `buffsAtivosDoChefao(leaderName)` — `regras/chefoes.js:482`; devolve ids dos buffs de ginásio não removidos; `[]` em revanche
  (`ehRevancheDeLider`, `:454`) e para quem não é líder. Os ids viram `opcoes.buffs`, consumidos por `inicioDaLutaComBuffs`
  (`duelo.js:4092`, hazards e status nos últimos N), `foesComBuffsDoGinasio` (`:4047`) e `meuComBuffsDoGinasio` (`:4084`),
  tabela `BUFFS_DO_GINASIO_DUELO` (`:~4030`). Dependência de estado global (`gymSkillsSummaryFor`, `chefoes.js:367`).
  O pipeline de build (`pipeline_build.js:108`) usa só `foesComBuffs...`, não `inicioDaLutaComBuffs`.
- `ordem` — `duelo.js:4389`: **só reordena** `escolhidos` depois de escolhidos (o sono de ginásio cai no último da party real). Não
  muda objetivo nem avaliação. Confirma o risco 3: as três variantes **não** nascem de `ordem`; precisam de perfil de objetivo novo.
  Hoje existe exatamente um objetivo, fixo: cobertura por foe (`:4375`) + `sim.pontos` (`:4401`).

## 4. Efeitos de lado (item 3)

Estado hoje:
- `novoLadoDuelo()` (`duelo.js:3898`) = `{rocha, espinho, toxico, teia}`. **Só hazards, sem turnos**. `ladoMeu`/`ladoDele`
  (`:4122`) persistem entre membros; hazards entram em `entrarNoLadoDuelo` (`:3909`). `limpaHazards` (Defog de entrada) recria o lado (`:4170`).
- Clima: `climaLigado`/`climaRestante` (`:4129`) — duração `CLIMA_OFICIAL.duracaoTurnos` (8), decrementada por `r.turnos` de cada duelo
  (`:4306`). É o único efeito com turnos entre membros.
- Tela: golpe Reflect/Light Screen/Aurora Veil = `planoDoGolpeStatus` (`:3209-3211`) -> `efeitoDoPlanoDuelo` (`:3564-3568`)
  `multY = 0.5` para **a duração inteira daquele 1x1**, sem 5 turnos, sem Light Clay, sem exigir granizo no Aurora Veil, sem persistir.
  Telas por habilidade de entrada (`telaE`/`telaF`/`telaNaEntrada`, `:672, :774`) ou buff de ginásio (`abreTela`, `:4059`) entram em
  `tela()` (`:2428-2432`) com a fração `min(t,turnos)/turnos` — só dentro do duelo. `limpaTelas` (`:894, :2426`) ignora telas.
- Tailwind: golpe = `r.velX = 2` (`:3607` região, `p.tipo === "vento"`) para o duelo todo; habilidade = `ef.vento` (`:891`)
  `turnos <= u.ef.vento` (`:2576`). Não passa a outro membro nem do lado do chefão para os meus.
- Trick Room: golpe = `r.inverteOrdem` (plano "sala"); `CAMPO_DUELO.sala` (`:932, :2776`) vem de `ef.sala` da habilidade ou da
  regra de campo do chefão (`foesComRegraDeCampo`, `:4071-4076`, `sala = 99` = permanente OK).
  `Math.max(eu.ef.sala, foe.ef.sala)` — não há "usar de novo desliga".
- `:3607`: comentário do próprio código — "proteção e hazard: valem na luta inteira, não no 1x1".

Falta para virar estado do lado com turnos (Fase B): ampliar `novoLadoDuelo` (ou par `campoDoLado`) com
`{tela:{F,E,veu}: turnosRestantes, vento: turnos, sala: turnos|perm}` para os dois lados; aplicar em `resultadoNoCampoDuelo` via
`ini` (como `fracEu/fracFoe`) em vez de só `ef`; decrementar por `r.turnos` (descontando o turno do uso, regra `started` do ticket §2.7);
mover os golpes de status de tela/vento/sala de `efeitoDoPlanoDuelo` (efeito no 1x1) para `poeEfeitoDeLadoComGolpe` (parente de
`poeHazardComGolpe`, `:4226`) quando usados; Light Clay (campo `item` na unidade); Aurora Veil condicionado a granizo/Aurora Borealis;
Defog/Brick Break limpam. O 1x1 passa a ler o estado do lado por parâmetro. Dupla (`simularDuplaContraChefao`) tem `ladoMeu` próprio (`:3698`) — duplicar a mudança.

## 5. Juiz (item 4): `pontos` enxerga suporte?

**Não de forma confiável.** Evidência no código:
1. `pontos` só soma KOs, bônus de vitória e HP restante (`:4326`). Nenhuma parcela por tela, hazard, clima armado ou Speed.
2. Quem entra é escolhido por `nota` do duelo 1x1 (`:4260`, sort por `nota`). Suporte só entra se vencer seu duelo sozinho; a troca (`:4288`)
   só aceita quem `venceu === true`. Suporte só entra pela nota do duelo ou, na troca, se vencer.
3. Tela/vento/sala só valem dentro do 1x1 de quem os usou (§4), então o benefício aos outros cinco, que é o ponto do suporte, é
   invisível ao `pontos`. Hazard (`poeHazardComGolpe`, `:4224`) é a exceção: persiste no lado, mas só se o usuário vence depois de apanhar.
4. Experimento (descartável, Flannery 1 nível 50 e Steven nível 100, 22 Fadas): 5 melhores do motor + 6º = atacante, ou Grimmsnarl
   Reflect/Light Screen, Togekiss Tailwind, Klefki Trick Room, Klefki Stealth Rock/Spikes. Resultado: `pontos` **idêntico** nos 5
   casos (16,72 na Flannery; 16,00 no Steven), `derrubados=6`. Em 7 de 10 casos o suporte nem entrou na luta. Limitação: a base já
   vence tudo, então o experimento prova saturação e ausência de sinal, não que o juiz erra num time apertado. A Fase B precisa de
   fixture em que o time-base **não** vence sozinho (chefão mais forte, ou 3 atacantes + 3 vagas de teste).
5. Conclusão: o gate do ticket (§2.6) **reprova hoje**. Corrigir o juiz (efeitos de lado, §4) vem antes de qualquer busca de papéis.

Papéis legados (`data/species_role.json`, `scripts/compute_species_role.ps1:123-144`) são por **espécie**, estáticos: Pivô = golpe de
pivô no movepool + bulk percentil 25+; Tanque = bulk 75+ e golpe de recuperação; Wallbreaker = ataque 75+ e bulk <60; Sweeper = Spe 75+,
ataque 60+, golpe de setup. Sem prova de luta. Consumidores: `regras/builds.js:140,169`, `regras/dados_base.js:167-173`,
`regras/escolha_ia_candidatos.js:48`, `regras/ferramentas_ia.js:27-32`, `regras/prompts_ia.js:313,825,878`, `ui/dex_ficha.js:225`,
`ui/tipos.js:74-110` (descrições e glossário, atrelado ao texto do `.ps1`). Manter como fallback é consistente com o ticket.

## 6. Testes existentes (item 5)

Motor em Node via `tests/unit/carregar_regras.mjs` (`carregarRegras({milestone, difficulty, levelCapMode, megaMode})`, carrega os JSON
de `data/` e `src/regras/*.js` num `vm`; aceita `MUTACAO_ARQUIVO` para sabotagem). **Não carrega `src/ui/`**, então `ia.js`/`claude.use`
não existem nos testes unitários; o teste de "Motor não chama `claude.use`" fica a cargo do smoke de navegador (`dev_server.ps1` mocka
`claude.use("sample")`) ou de uma checagem de texto do fonte do novo orquestrador (padrão já usado em `time_melhor_no_geral.test.mjs`, que lê o `.js` e faz `assert.match`).

Convenção de fixture: dado real, nunca valores à mão (`cenarios_do_duelo.mjs:1-6`): `eu()` = `unidadeDaBuild`, `chefao()` = `foeDeDuelo`,
`lutar()` = `resultadoDoDuelo` com `detalhe`; fixture clássica de time = Flannery 1, nível 50, 22 Fadas (`montar_time_contra_chefao.test.mjs`).

Cobrem o motor/times: `montar_time_contra_chefao`, `sequencia_contra_chefao`, `lote_b_plano_real`, `lote_a_motor`, `lote_c_validacao`,
`lote_d_confiabilidade`, `dupla_no_duelo`, `setup_entre_duelos`, `tira_setup`, `campo_invertido_no_plano`, `campo_no_duelo`,
`chefao_pela_interface`, `duelo_pela_interface`, `efeitos_pela_interface`, `buffs_e_pendencias_antigas`, `auditoria_do_motor`,
`calibracao_calculadora_do_jogo`, `mega_gate`, `mono_run`, `time_melhor_no_geral`, `pipeline_build`, `escolha_ia_candidatos`,
`rank_da_run`. Telas/Tailwind/TR: nenhum teste de duração/persistência (`telas_efetividade_real` é só efetividade). Sabotagem:
`tests/unit/mutacoes.mjs` + `tests/run_sabotage.mjs`. Gate: `npm run check --silent && node --test tests/unit/*.test.mjs && node tests/run_sabotage.mjs`.

## 7. Medição (item 6)

Script: `scratchpad/medir.mjs`, Node, `performance.now()`, após aquecimento. **Caso**: Flannery 1 (6 foes, sol), nível 50, 22
candidatos Fada (lista do teste existente), buffs reais da Flannery (8 ids) via `buffsAtivosDoChefao`.
- **UMA `simularLutaContraChefao`**: ~12,4 ms (sem buffs) e ~12,7 ms (com `inicioDaLutaComBuffs`), média de 200 repetições, cache de unidades quente.
- `montarTimeContraChefao` completo, 22 candidatos: ~2,6 s (3 rodadas: 2662/2577/2675 ms), clima do chefão = sol, sem estratégia de clima aceita.
- Mesmo com 60 candidatos (BST>=500, 1ª fatia da lista): **27,4 s**. Estourou o alvo de 10 s.
- 6 primeiras lutas de `LUTAS_DA_RUN` com os mesmos 22: 1,4 a 2,9 s cada, média 2,2 s. Montar contra o campo inteiro (29 lutas) por
  repetição de `montarTimeContraChefao` custaria ~60 s: inviável. Nota: nó (V8) mais rápido que o navegador/celular; refazer no navegador na Fase C.
- Onde vai o tempo: ~48 simulações da troca = ~0,6 s; o resto são as ~22-60 chamadas a `melhorUnidadeContra` (4 sets x habilidades x foes
  + `comQuatroGolpes`). A estimativa "6x4x2 = 48 avaliações" do ticket vale para a busca local, mas o custo dominante é gerar os candidatos, não a busca.
  Cache com chave completa (espécie, set, habilidade, golpes, item, nível, foes+buffs, clima) é obrigatório para a busca por papel/variantes.

## 8. Riscos do ticket (§3): o que o código mostra

| # | Risco | O que o código mostra |
| --- | --- | --- |
| 1 | Juiz cego para suporte | **Confirmado** (§5): `pontos` idêntico em 5 variantes; suporte raramente entra. |
| 2 | Estado de campo incorreto | **Confirmado**: tela/vento/sala não existem como estado do lado; clima é o único com timer (8 turnos). |
| 3 | Variantes nominais | **Confirmado**: `ordem` só reordena (`:4389`); um objetivo fixo. Perfis de objetivo precisam ser criados. |
| 4 | Sinergia não identificada | Hoje `estrategia.aproveitam` (`:4357-4363`) marca quem ganha >=0,5 de nota com o clima, mas basta `armadorEntrou` e `GANHO_MINIMO_ESTRATEGIA`; não pede dois beneficiados. Só clima; sem terreno/tática. |
| 5 | Favoritos alterados | Nenhum conceito de favorito no motor; o laço de troca (`:4395`) só poupa o armador (`idx===0`). Precisa de `opcoes.fixos`. |
| 6 | Disponibilidade tardia | Mega/etapa/mono filtrados em `candidatosDoJogador` (UI), não no motor. Motor puro precisa de função equivalente em `regras/` (pode chamar `battleUnitsOf`, `serveProMono`, `usableSpeciesFor`, que já estão em `regras/`). |
| 7 | Buffs esquecidos | No botão do chefão passam (`aba_chefoes.js:356`); `conferirTimeComBuilds` repassa `opcoes`. Pipeline de build campo usa buffs só nos foes. Em modo campo/sem chefão selecionado, cada luta precisa dos seus buffs: `buffsAtivosDoChefao(luta)` depende de estado global e revanche devolve `[]`. |
| 8 | Papéis falsos | Papel legado é estatístico por espécie (`compute_species_role.ps1`); nada mede prova de luta. O simulador devolve `log` por duelo, `porFoe`, `fracEu` — base para evidência. |
| 9 | Regressão do legado | 8+ consumidores de `SPECIES_ROLE` (§5); Fase D não pode trocar o formato, só acrescentar campo novo. |
| 10 | Tempo excedido | **Confirmado em Node** com pool maior (§7): 27 s para 60 candidatos; campo inteiro ~60 s sem cache. |

## 9. Plano de testes da Fase B

Todos em `tests/unit/`, nomes sugeridos, fixture real, `node --test` só nos novos + `auditoria_do_motor`.
1. `efeitos_de_lado.test.mjs` — Reflect/Light Screen: duração 5 (com `Light Clay` 8), turno do uso não conta, x0,5 em 1x1, não vale em
   crítico/Infiltrator; sobrevive a troca e a desmaio; segundo uso com tela ativa falha (Screen Cleaner é exceção); Aurora Veil só sob
   granizo; Defog e Brick Break removem. Tailwind: 3 turnos, Speed x2, persistência após troca, expira. Trick Room: 5 turnos, segundo uso
   desliga, regra de campo `sala=99` não expira (`campo_invertido_no_plano` como modelo).
2. `juiz_reconhece_suporte.test.mjs` — time-base fraco (ex.: 3 atacantes de Fada contra Steven nível 100, ou Flannery 1 com buffs) + 3º membro
   suporte vs atacante equivalente; exige `pontos(suporte útil) > pontos(suporte inútil)` e suporte inútil (mesmo golpe sem alvo) <= atacante.
   Gate: se falhar, a Fase B não avança.
3. `buffs_do_lider_no_motor.test.mjs` — `opcoes.buffs` muda o resultado (Flannery 1 com e sem os 8 ids); campo/revanche devolve `[]`.
4. Regressão: `montar_time_contra_chefao`, `lote_b_plano_real`, `campo_no_duelo`, `calibracao_calculadora_do_jogo`, `dupla_no_duelo`; qualquer mudança em
   dano/tela precisa bater com a calculadora do jogo e o simulador 2.65.3b (tickets `calibracao-simulador/`).
5. Sabotagem: adicionar mutações em `mutacoes.mjs` (duração 5->4, não persistir, decremento no turno do uso).
6. Registrar fatos em `docs/decisoes_mecanicas.md` (hoje sem Reflect/Tailwind/TR/Light Clay).

## 10. O que a Fase B precisa mudar (e o que não)

Mudar: `novoLadoDuelo`/estado de lado com turnos para telas, vento, sala (`duelo.js:3898`, `resultadoNoCampoDuelo` recebe o estado por `ini`,
`simularLutaContraChefao` e `simularDuplaContraChefao` o mantêm); mover tela/vento/sala de `efeitoDoPlanoDuelo` (`:3564-3606`) para efeito de
lado; hook de entrada (`telaE`, `vento`, `sala`, `:672-891`) passa a registrar no lado; `pontos` (ou juiz auxiliar medido ao lado, sem mexer no
`pontos` público usado pelo rank) precisa de sinal de suporte — decisão do dono: mudar `pontos` afeta rank e testes, então propor juiz
novo separado e comparar; `opcoes.fixos` (favoritos) e perfil de objetivo ficam para a Fase C.
Não mudar: `species_role.json` e consumidores; `comQuatroGolpes` (escolha de golpes); regra existente sem pergunta ao coordenador. Pontos para o
coordenador decidir: (a) tocar `pontos` ou criar juiz paralelo; (b) o ticket diz "top-1 do pipeline" mas o motor atual usa `comQuatroGolpes` (cobertura),
não o pipeline de build — qual vale no Modo Motor sem favoritos; (c) campo inteiro (29 lutas) exige cache e/ou amostra de lutas por causa do tempo.
