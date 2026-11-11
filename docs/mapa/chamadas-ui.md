# Chamadas entre arquivos - src/ui/

Gerado por `npm run mapa` (scripts/mapa_chamadas.mjs, API do TypeScript); não edite à mão.
Por função de nível superior: `chama:` e `chamado por:` funções de OUTROS arquivos de src/regras e src/ui, como `nome (arquivo:linha)`;
no máximo 5 por lista, o resto vira `+N`. Referência vale também como callback. Chamada pelo template/HTML não aparece. Mapa geral: [mapa-do-codigo.md](../mapa-do-codigo.md).

## ui/aba_chefoes.js
- DIFF_LABELS:236 - chamado por: bossReferenceHtml (ficha_extras.js:103), quemResolveCardHtml (quem_resolve.js:84)
- STAT_LABELS_SHORT:533 - chamado por: evBreakpointNote (editor_build.js:116), myBuildEditorHtml (editor_build.js:230), updateMyBuildStatus (editor_build.js:354), compareResultHtml (ficha_extras.js:22)
- bossMonCardHtml:434 - chama: calcFinalStat (calc_stat.js:160), itemRuleFor (calc_stat.js:149), ABILITIES (dados_base.js:10), getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), +6
- bossState:13 - chamado por: initProgress (progresso.js:106), quemResolvePreencher (quem_resolve.js:67), quemResolveRestaurar (quem_resolve.js:104)
- campoDoChefaoHtml:178 - chama: regraDeCampoDoChefao (chefoes.js:423)
- candidatosDoJogador:250 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), battleUnitsOf (formas_mega.js:185), xsDoJogador (liberado_na_run.js:38), serveProMono (mono_run.js:74)
- guardarTimeAnterior:268 - chama: getSpeciesByX (dados_base.js:78), ehBackupDeTime (save.js:44), xsToSnames (save.js:24), generatedTeamResult (arquetipo.js:35), teamKeyFor (arquetipo.js:14), +2
- hellDoChefaoHtml:199 - chama: regrasDoHell (chefoes.js:474)
- iaDoChefaoHtml:190 - chama: comportamentoDaIADoChefao (chefoes.js:456)
- initBosses:33 - chama: showdownSet (builds.js:53), getSpeciesByX (dados_base.js:78), flashToast (dex_lista.js:473), copyText (editor_build.js:11), acao (nucleo.js:238), +3
- montarTimeContraEsteChefao:310 - chama: computeTeamGenerationValidation (builds.js:228), buffsAtivosDoChefao (chefoes.js:531), buffsParaMostrarDoChefao (chefoes.js:519), planoDaLuta (chefoes.js:565), regraDeCampoDoChefao (chefoes.js:423), +12
- myBuildLevel:19 - chamado por: myBuildEditorHtml (editor_build.js:230), updateMyBuildStatus (editor_build.js:354), wireMyBuildEditor (editor_build.js:418)
- myBuildLevelIsCustom:31 - chamado por: myBuildEditorHtml (editor_build.js:230), wireMyBuildEditor (editor_build.js:418), initProgress (progresso.js:106), zerarRun (time.js:342)
- renderBossDetail:534 - chama: classeDoCabecalhoDoChefao (chefoes.js:54), getRemainingBossEntries (chefoes.js:60), nivelDeCalculo (level_cap.js:65), monotypeAtivo (mono_run.js:72), quemResolveCardHtml (quem_resolve.js:84), +2
- renderBossList:211 - chama: getRemainingBossEntries (chefoes.js:60)
- renderGymSkillsCardHtml:397 - chama: ehRevancheDeLider (chefoes.js:483), gymLeaderBaseName (chefoes.js:52), gymSkillsSummaryFor (chefoes.js:376)
- selectBoss:378 - chama: varianteDoChefao (chefoes.js:367)
- simularSemTravarATela:297 - chama: montarTimeContraChefaoEmPassos (duelo.js:4798), totalDePassosContraChefao (duelo.js:4797)

## ui/arquetipo.js
- applyRecommendedTeam:143 - chama: getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), formFamilyOf (formas_mega.js:65), entradasDoJogador (liberado_na_run.js:34), flashToast (dex_lista.js:473), +4 | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:310), modoMotorFicarComVariante (modo_motor.js:118)
- archetypeCardHtml:85 - chama: ARQUETIPOS_DE_CAMPO (campo.js:33), MONOTYPE_ARCHETYPES (dados_base.js:156), PACE_ARCHETYPES (dados_base.js:146), TATICA_ARCHETYPES (dados_base.js:149), modoMotorBotaoHtml (modo_motor.js:163), +2
- buffsMudaram:208 - chama: buffsParaMostrarDoChefao (chefoes.js:519)
- climaQueCombinaHtml:296 - chama: climaQueCombina (mono_run.js:141), state (nucleo.js:8)
- generatedTeamCardHtml:261 - chama: computeTeamGenerationValidation (builds.js:228)
- generatedTeamResult:35 - chamado por: guardarTimeAnterior (aba_chefoes.js:268), montarTimeContraEsteChefao (aba_chefoes.js:310), zerarRun (time.js:342)
- monoRunCardHtml:317 - chama: entradasDoJogador (liberado_na_run.js:34), MONO_MARCAS (mono_run.js:11), avisoProximoLider (mono_run.js:158), fraquezasDoTipo (mono_run.js:80), monoDisponibilidade (mono_run.js:176), +2
- planoContraChefaoHtml:212 - chama: faixaDeHpDaLuta (chefoes.js:609), NOME_DA_CONDICAO (condicoes_habilidade.js:42)
- renderMonoRun:374 - chama: state (nucleo.js:8) | chamado por: renderTeam (time.js:17)
- renderTeamAnalysis:400 - chama: computeSharedRisks (chefoes.js:118), USABLE_TYPES (dados_base.js:132), abilityTypeMod (tipos.js:173) | chamado por: renderTeam (time.js:17)
- renderTeamStrategy:283 - chama: modoMotorAquecer (modo_motor.js:39), modoMotorResultadoHtml (modo_motor.js:223) | chamado por: modoMotorFicarComVariante (modo_motor.js:118), modoMotorMontar (modo_motor.js:67), renderTeam (time.js:17)
- resumoDoArquetipo:74 - chama: state (nucleo.js:8)
- teamKeyFor:14 - chamado por: guardarTimeAnterior (aba_chefoes.js:268), montarTimeContraEsteChefao (aba_chefoes.js:310)
- teamRecommendation:30 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:310), modoMotorFicarComVariante (modo_motor.js:118), zerarRun (time.js:342)
- vereditoDaLutaHtml:199 - chama: vereditoDaLuta (chefoes.js:603)

## ui/auto_evolucao.js
- autoEvolveRoster:20 - chama: devolveChainByX (evolucao.js:206), evoluirElencoSemDuplicar (evolucao.js:40), evolveChainByX (evolucao.js:66), logAutoAction (evolucao.js:229), podarAutoEvolved (evolucao.js:61), +3 | chamado por: loadSave (nucleo.js:332), initProgress (progresso.js:106)
- renderAutoLog:9 - chama: state (nucleo.js:8) | chamado por: initProgress (progresso.js:106), registrarTrocasDoPlano (revisao_automatica.js:71)

## ui/caixa.js
- pcBoxSelectedX:14 - chamado por: zerarRun (time.js:342)
- renderBox:16 - chama: ABILITIES (dados_base.js:10), getSpeciesByX (dados_base.js:78), habilidadesEscolhiveis (dados_base.js:119), speciesTypeNames (tipos.js:254), rankBadgeHtml (dex_ficha.js:169), +4

## ui/dex_ficha.js
- RANK_TIER_CLASS:154 - chamado por: monoRunCardHtml (arquetipo.js:317)
- abilityCard:14 - chama: ABILITIES (dados_base.js:10)
- buildSynergyHtml:42 - chama: sinergiasDaEspecie (duelo.js:1320) | chamado por: buildEntryHtml (editor_build.js:191), painelDaBuildHtml (time_build.js:72)
- conditionMoveSynergyNoteHtml:70 - chama: buildNoteHtml (editor_build.js:155)
- evoConditionText:88 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL_FEMALE (dados_base.js:32), EVO_LEVEL_MALE (dados_base.js:31), EVO_MEGA_KINDS (dados_base.js:34), EVO_PRIMAL (dados_base.js:33)
- fichaCabecalhoHtml:469 - chama: avisoSemSpriteHtml (dados_base.js:196), descricaoDaEspecie (dados_base.js:187), compraDeInicialTexto (mono_run.js:47), speciesTypeNames (tipos.js:254), bst (dex_lista.js:152), +1
- fichaConhecerHtml:525 - chama: uniqueIds (dados_base.js:122), sinergiasDaEspecie (duelo.js:1320)
- fichaEfetividadeHtml:388 - chama: perfilDefensivoDaEspecie (tipos.js:179)
- fichaEvolucaoHtml:411 - chama: getSpeciesByX (dados_base.js:78)
- fichaFormasHtml:429 - chama: getSpeciesByX (dados_base.js:78)
- fichaNavHtml:400 - chama: listaAtual (dex_lista.js:210) | chamado por: renderList (dex_lista.js:243)
- fichaNotasHtml:556 - chama: bossReferenceHtml (ficha_extras.js:103), buildHistoryHtml (ficha_extras.js:87), notesCardHtml (ficha_extras.js:78)
- fichaStatsHtml:378 - chama: statPct (dex_lista.js:163), statTier (dex_lista.js:164)
- howToObtainText:236 - chama: MAPS (dados_base.js:49)
- marcasDoRankHtml:288 - chama: precisaDeSetter (condicoes_habilidade.js:213), nivelDaHabilidadeNoElite (level_cap.js:40), rankDaDificuldadeDe (rank_da_run.js:69), state (nucleo.js:8)
- rankBadgeHtml:169 - chama: FORA_DO_RANK (rank_da_run.js:10), MOTIVO_FORA_DO_RANK_PT (rank_da_run.js:17), rankDe (rank_da_run.js:29) | chamado por: renderBox (caixa.js:16), linhaDaListaHtml (dex_lista.js:212), compareResultHtml (ficha_extras.js:22), renderTeam (time.js:17), renderRoleCompendium (tipos.js:113)
- rankInfoLineHtml:310 - chama: FORA_DO_RANK (rank_da_run.js:10), MOTIVO_FORA_DO_RANK_PT (rank_da_run.js:17), rankDe (rank_da_run.js:29)
- rankStageBadgeHtml:203 - chama: rankDe (rank_da_run.js:29)
- renderMovesTable:111 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9), getCurrentCap (level_cap.js:49)
- roleTagsHtml:215 - chama: ROLE_LABEL_PT (dados_base.js:181), SPLIT_LABEL_PT (dados_base.js:182) | chamado por: renderBox (caixa.js:16)
- scheduleDashboardRefresh:688 - chama: renderDashboard (resumo_luta.js:183)
- selectSpecies:564 - chama: getSpeciesByX (dados_base.js:78), myBuildEditorHtml (editor_build.js:230), wireMyBuildEditor (editor_build.js:418), compareCardHtml (ficha_extras.js:14), state (nucleo.js:8) | chamado por: redesenharFichaAberta (nucleo.js:192)
- updateResetTeamBoxBtn:702 - chama: runTemAlgoPraZerar (evolucao.js:247) | chamado por: persist (nucleo.js:139)
- whereToFindText:266 - chama: MAPS (dados_base.js:49)

## ui/dex_lista.js
- bst:152 - chamado por: fichaCabecalhoHtml (dex_ficha.js:469), compareResultHtml (ficha_extras.js:22)
- flashToast:473 - chamado por: initBosses (aba_chefoes.js:33), montarTimeContraEsteChefao (aba_chefoes.js:310), applyRecommendedTeam (arquetipo.js:143), autoEvolveRoster (auto_evolucao.js:20), apagarBuildComDesfazer (editor_build.js:469), +2
- getFiltered:171 - chama: SPECIES (dados_base.js:52), rankDe (rank_da_run.js:29), speciesTypeNames (tipos.js:254), state (nucleo.js:8)
- linhaDaListaHtml:212 - chama: avisoSemSpriteHtml (dados_base.js:196), speciesTypeNames (tipos.js:254), rankBadgeHtml (dex_ficha.js:169), state (nucleo.js:8)
- listaAtual:210 - chamado por: fichaNavHtml (dex_ficha.js:400)
- openConfirmModal:403 - chamado por: excluirTimeSalvo (time.js:259), usarSugestaoDoCartao (time_build.js:123)
- openSwapModal:328 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- renderList:243 - chama: getSpeciesByX (dados_base.js:78), fichaNavHtml (dex_ficha.js:400), state (nucleo.js:8)
- renderMaisLista:232 - chama: state (nucleo.js:8)
- statPct:163 - chamado por: fichaStatsHtml (dex_ficha.js:378)
- statTier:164 - chamado por: fichaStatsHtml (dex_ficha.js:378)
- syncRowAddButtons:313 - chama: state (nucleo.js:8)

## ui/editor_build.js
- apagarBuildComDesfazer:469 - chama: getSpeciesByX (dados_base.js:78), getBuildList (evolucao.js:14), flashToast (dex_lista.js:473), reinserirBuild (nucleo.js:126), removeBuildIndex (nucleo.js:119), +1
- buildChipsHtml:219 - chama: SUGESTAO_ROTULO (sugestao_do_motor.js:11)
- buildContextNotesHtml:161 - chama: avisosDaBuild (avisos_build.js:8)
- buildEntryHtml:191 - chama: buildSynergyHtml (dex_ficha.js:42) | chamado por: bossReferenceHtml (ficha_extras.js:103), buildHistoryHtml (ficha_extras.js:87)
- buildNoteHtml:155 - chamado por: conditionMoveSynergyNoteHtml (dex_ficha.js:70), planoDaBuildHtml (ficha_extras.js:166), painelDaBuildHtml (time_build.js:72)
- copyText:11 - chamado por: initBosses (aba_chefoes.js:33)
- entradaResumoHtml:183 - chama: evsToShowdownText (builds.js:70), stripNote (builds.js:44), golpesBuildHtml (time_build.js:30), itemBuildHtml (time_build.js:53)
- evBreakpointNote:116 - chama: minEvSameStat (calc_stat.js:200), STAT_LABELS_SHORT (aba_chefoes.js:533)
- hpEvEfficiencyNote:83 - chama: stripNote (builds.js:44), calcFinalStat (calc_stat.js:160)
- itemDescHtml:45 - chama: ondeAcharItemTexto (avisos_build.js:100), stripNote (builds.js:44)
- lerFormularioDoEditor:446 - chama: clampInt (dados_base.js:103)
- megaModeBuildNoteHtml:174 - chama: megaStoneRuleFor (validacao_build_ia.js:18) | chamado por: painelDaBuildHtml (time_build.js:72)
- myBuildEditorHtml:230 - chama: ABILITIES (dados_base.js:10), ALL_NATURES (dados_base.js:101), ITEMS (dados_base.js:12), MOVES (dados_base.js:11), uniqueIds (dados_base.js:122), +10 | chamado por: selectSpecies (dex_ficha.js:564)
- seloDaBuildHtml:168 - chama: seloDaBuild (avisos_build.js:82) | chamado por: painelDaBuildHtml (time_build.js:72)
- updateMyBuildEvTotal:324 - chama: clampInt (dados_base.js:103)
- updateMyBuildStatus:354 - chama: ITEM_MOVE_POWER_MODS (calc_stat.js:132), calcFinalStat (calc_stat.js:160), itemRuleFor (calc_stat.js:149), MOVE_BY_NAME (dados_base.js:86), SPLIT_STATUS (dados_base.js:29), +6
- wireMyBuildEditor:418 - chama: getActiveBuild (evolucao.js:16), nivelDeCalculo (level_cap.js:65), myBuildLevel (aba_chefoes.js:19), myBuildLevelIsCustom (aba_chefoes.js:31), pipelineDesenharFicha (pipeline_tela.js:114) | chamado por: selectSpecies (dex_ficha.js:564)

## ui/ficha_extras.js
- bossReferenceHtml:103 - chama: DIFF_LABELS (aba_chefoes.js:236), buildEntryHtml (editor_build.js:191) | chamado por: fichaNotasHtml (dex_ficha.js:556)
- buildHistoryHtml:87 - chama: buildEntryHtml (editor_build.js:191) | chamado por: fichaNotasHtml (dex_ficha.js:556), renderTeam (time.js:17)
- compareCardHtml:14 - chamado por: selectSpecies (dex_ficha.js:564)
- compareResultHtml:22 - chama: effectiveBuild (builds.js:190), stripNote (builds.js:44), speciesTypeNames (tipos.js:254), STAT_LABELS_SHORT (aba_chefoes.js:533), rankBadgeHtml (dex_ficha.js:169), +1
- megaLockedTagHtml:186 - chama: isMegaForm (formas_mega.js:71), megaFormLiberada (formas_mega.js:109), megaSoNoDebug (formas_mega.js:110), quandoMega (formas_mega.js:112), rotuloEtapaDaMega (formas_mega.js:113) | chamado por: renderBox (caixa.js:16), renderTeam (time.js:17)
- notesCardHtml:78 - chama: state (nucleo.js:8) | chamado por: fichaNotasHtml (dex_ficha.js:556)
- otherFormsHtml:193 - chama: formFamilyOf (formas_mega.js:65), isMegaForm (formas_mega.js:71), megaFormLiberada (formas_mega.js:109), megaSoNoDebug (formas_mega.js:110), quandoMega (formas_mega.js:112), +1 | chamado por: renderTeam (time.js:17)
- planoDaBuildHtml:166 - chama: buildNoteHtml (editor_build.js:155) | chamado por: myBuildEditorHtml (editor_build.js:230), painelDaBuildHtml (time_build.js:72)
- rotuloDaBuild:157 - chama: ESTILO_ROTULO (plano_build.js:20), SUGESTAO_ROTULO (sugestao_do_motor.js:11) | chamado por: painelDaBuildHtml (time_build.js:72)

## ui/insignias_faixa.js
- INSIGNIAS_FORMAS:6 - chamado por: carimboEtapaHtml (time.js:9)
- INSIGNIAS_TIPOS:35 - chamado por: carimboEtapaHtml (time.js:9)
- etapaPara:46 - chama: state (nucleo.js:8), initProgress (progresso.js:106), progressInited (progresso.js:8)
- insigniaSvgHtml:38 - chamado por: carimboEtapaHtml (time.js:9)
- renderFaixaEtapa:54 - chama: getCurrentCap (level_cap.js:49), state (nucleo.js:8) | chamado por: renderCapBadge (progresso.js:17)

## ui/modo_motor.js
- modoMotorAquecer:39 - chama: contextoDoMotor (time_pelo_motor.js:96), motorAquecerBuildsEmPassos (time_pelo_motor.js:184) | chamado por: renderTeamStrategy (arquetipo.js:283)
- modoMotorBotaoHtml:163 - chamado por: archetypeCardHtml (arquetipo.js:85)
- modoMotorCache:18 - chama: criarCacheDoMotor (time_pelo_motor.js:56)
- modoMotorCapturados:25 - chama: getSpeciesByX (dados_base.js:78), xsDoJogador (liberado_na_run.js:38), state (nucleo.js:8)
- modoMotorChave:20 - chama: megaMode (formas_mega.js:82), capOuPadrao (level_cap.js:61), levelCapMode (level_cap.js:16), xsDoJogador (liberado_na_run.js:38), state (nucleo.js:8)
- modoMotorFavoritosHtml:151 - chamado por: archetypeCardHtml (arquetipo.js:85)
- modoMotorFavoritosValidos:30 - chama: state (nucleo.js:8)
- modoMotorFicarComVariante:118 - chama: getSpeciesByX (dados_base.js:78), SUGESTAO_ROTULO (sugestao_do_motor.js:11), gravarSugestoesDoMotor (sugestao_do_motor.js:61), planoDeGravarSugestoes (sugestao_do_motor.js:39), applyRecommendedTeam (arquetipo.js:143), +4
- modoMotorMontar:67 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:185), xsDoJogador (liberado_na_run.js:38), serveProMono (mono_run.js:74), contextoDoMotor (time_pelo_motor.js:96), +3
- modoMotorResultadoHtml:223 - chamado por: renderTeamStrategy (arquetipo.js:283)
- modoMotorRodapeHtml:180 - chama: SUGESTAO_ROTULO (sugestao_do_motor.js:11)

## ui/nucleo.js
- STORE_KEY:77 - chamado por: aplicarSaveRemoto (sync.js:45), lerSaveLocal (sync.js:174)
- TELAS:200 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:310), applyRecommendedTeam (arquetipo.js:143)
- abrirVagaPreservando:113 - chama: buildQueSaiParaAbrirVaga (lista_de_builds.js:43) | chamado por: processarRevisoes (revisao_automatica.js:23)
- acao:238 - chamado por: guardarTimeAnterior (aba_chefoes.js:268), initBosses (aba_chefoes.js:33), applyRecommendedTeam (arquetipo.js:143), modoMotorFicarComVariante (modo_motor.js:118), initProgress (progresso.js:106), +7
- addBuildVariant:96 - chama: acrescentarVarianteNaLista (lista_de_builds.js:23) | chamado por: processarRevisoes (revisao_automatica.js:23)
- concluirAcoes:261 - chama: agendarRevisoes (revisao_automatica.js:91)
- fichaAfetada:256 - chama: getSpeciesByX (dados_base.js:78)
- loadA11yPrefs:280 - chamado por: initProgress (progresso.js:106)
- loadSave:332 - chama: applySave (save.js:45), conferirSomaDoSave (save.js:285), reconciliouAoAplicar (save.js:40), autoEvolveRoster (auto_evolucao.js:20)
- lsGet:79 - chamado por: lerSaveLocal (sync.js:174)
- lsSet:80 - chamado por: aplicarSaveRemoto (sync.js:45)
- persist:139 - chama: buildSave (save.js:295), updateResetTeamBoxBtn (dex_ficha.js:702), pushToSync (sync.js:96) | chamado por: aplicarSaveRemoto (sync.js:45)
- redesenharFichaAberta:192 - chama: selectSpecies (dex_ficha.js:564)
- reinserirBuild:126 - chama: getBuildList (evolucao.js:14) | chamado por: apagarBuildComDesfazer (editor_build.js:469)
- removeBuildIndex:119 - chama: removerBuildDaLista (lista_de_builds.js:32) | chamado por: apagarBuildComDesfazer (editor_build.js:469)
- saveA11yPrefs:290 - chamado por: initProgress (progresso.js:106)
- setActiveBuildIndex:99 - chama: getBuildList (evolucao.js:14)
- setOrReplaceActiveBuild:89 - chama: trocarBuildAtivaNaLista (lista_de_builds.js:11) | chamado por: initBosses (aba_chefoes.js:33), processarRevisoes (revisao_automatica.js:23)
- showStorageBanner:161 - chamado por: remotoComSomaErrada (sync.js:88)
- state:8 - chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:190), itensEmUsoComQuem (builds.js:141), teamItemsInUse (builds.js:85), teamMovesInUse (builds.js:111), +104
- telasDeBuild:232 - chamado por: processarRevisoes (revisao_automatica.js:23)

## ui/pipeline_tela.js
- pipelineAlvoValido:26 - chama: getRemainingBossEntries (chefoes.js:60)
- pipelineCandidatoHtml:78 - chama: golpesBuildHtml (time_build.js:30) | chamado por: quemResolveItemHtml (quem_resolve.js:43)
- pipelineDesenharFicha:114 - chamado por: wireMyBuildEditor (editor_build.js:418)
- pipelineDesenharTime:126 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: renderTeam (time.js:17)
- pipelineGolpeHtml:71 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9)
- pipelineResultado:14 - chama: getCurrentCap (level_cap.js:49), candidatosDeBuild (pipeline_build.js:549), state (nucleo.js:8)
- pipelineSeletorDeAlvoHtml:32 - chama: getRemainingBossEntries (chefoes.js:60)

## ui/progresso.js
- initProgress:106 - chama: bossPartyPorDificuldade (chefoes.js:336), confrontoParaParty (chefoes.js:307), getRemainingBossEntries (chefoes.js:60), varianteDoChefao (chefoes.js:367), logAutoAction (evolucao.js:229), +16 | chamado por: etapaPara (insignias_faixa.js:46)
- progressInited:8 - chamado por: etapaPara (insignias_faixa.js:46)
- renderCapBadge:17 - chama: getCurrentCap (level_cap.js:49), renderFaixaEtapa (insignias_faixa.js:54)
- renderCapDisplay:22 - chama: getCurrentCap (level_cap.js:49)
- renderProgressTrail:31 - chama: state (nucleo.js:8)
- renderRunStatus:9 - chama: state (nucleo.js:8)

## ui/quem_resolve.js
- quemResolveCalcular:22 - chama: especiesQueResolvem (pipeline_build.js:759)
- quemResolveCardHtml:84 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), DIFF_LABELS (aba_chefoes.js:236), state (nucleo.js:8) | chamado por: renderBossDetail (aba_chefoes.js:534)
- quemResolveChave:17 - chama: getCurrentCap (level_cap.js:49), state (nucleo.js:8)
- quemResolveItemHtml:43 - chama: speciesTypeNames (tipos.js:254), pipelineCandidatoHtml (pipeline_tela.js:78)
- quemResolveOrigemHtml:37 - chama: rankDe (rank_da_run.js:29)
- quemResolvePreencher:67 - chama: bossState (aba_chefoes.js:13)
- quemResolveRestaurar:104 - chama: bossState (aba_chefoes.js:13) | chamado por: renderBossDetail (aba_chefoes.js:534)

## ui/resumo_luta.js
- bossConfrontoHtml:96 - chama: confrontoParaParty (chefoes.js:307) | chamado por: renderBossDetail (aba_chefoes.js:534)
- boxFitNote:154 - chama: computeSharedRisks (chefoes.js:118), battleUnitsOf (formas_mega.js:185), unitTypeMult (formas_mega.js:201) | chamado por: renderBox (caixa.js:16)
- confrontoAjustesHtml:44 - chama: coberturaSugerida (confronto.js:196)
- confrontoPlanoHtml:67 - chama: aberturaEmDupla (confronto.js:319), cuidadosDoChefao (confronto.js:302)
- dashboardConfrontoHtml:135 - chama: bossPartyPorDificuldade (chefoes.js:336), confrontoParaParty (chefoes.js:307)
- megaOfNote:175 - chama: isMegaForm (formas_mega.js:71), megaMode (formas_mega.js:82)
- nextFightDetailHtml:215 - chama: bestBoxCandidateForBoss (chefoes.js:192), bestRankForm (chefoes.js:342), bossSpeedSummary (chefoes.js:141)
- renderDashboard:183 - chama: computeSharedRisks (chefoes.js:118), getRemainingBossEntries (chefoes.js:60), nextFightCx (chefoes.js:360), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: scheduleDashboardRefresh (dex_ficha.js:688)
- renderNextFightCard:257 - chama: getRemainingBossEntries (chefoes.js:60), nextFightCx (chefoes.js:360), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: renderTeam (time.js:17)

## ui/revisao_automatica.js
- agendarRevisoes:91 - chamado por: concluirAcoes (nucleo.js:261)
- capRegistrado:70 - chamado por: initProgress (progresso.js:106), aplicarSaveRemoto (sync.js:45), zerarRun (time.js:342)
- processarRevisoes:23 - chama: getSpeciesByX (dados_base.js:78), logAutoAction (evolucao.js:229), golpesTravadosNoCap (level_cap.js:90), curadaParaEstilo (plano_build.js:160), estiloDoRitmo (plano_build.js:48), +7
- registrarTrocasDoPlano:71 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), logAutoAction (evolucao.js:229), trocasEntreCaps (plano_build.js:141), renderAutoLog (auto_evolucao.js:9), +1 | chamado por: initProgress (progresso.js:106)
- tarefaDeRevisao:13 - chama: getActiveBuild (evolucao.js:16)

## ui/sync.js
- aplicarSaveRemoto:45 - chama: getCurrentCap (level_cap.js:49), applySave (save.js:45), buildSave (save.js:295), reconciliouAoAplicar (save.js:40), STORE_KEY (nucleo.js:77), +3
- conflitoDeProgresso:61 - chama: saveChegandoTemMenosProgresso (save.js:341)
- connectSync:179 - chama: buildSave (save.js:295), saveEnviavel (save.js:292), syncContentDiffers (save.js:355)
- lerSaveLocal:174 - chama: STORE_KEY (nucleo.js:77), lsGet (nucleo.js:79)
- pushToSync:96 - chamado por: persist (nucleo.js:139)
- remotoComSomaErrada:88 - chama: conferirSomaDoSave (save.js:285), saveEnviavel (save.js:292), showStorageBanner (nucleo.js:161)

## ui/time.js
- TELAS_ELENCO:148 - chamado por: applyRecommendedTeam (arquetipo.js:143), initProgress (progresso.js:106)
- carimboEtapaHtml:9 - chama: INSIGNIAS_FORMAS (insignias_faixa.js:6), INSIGNIAS_TIPOS (insignias_faixa.js:35), insigniaSvgHtml (insignias_faixa.js:38), state (nucleo.js:8)
- carregarTimeSalvo:231 - chama: snamesToXs (save.js:15), acao (nucleo.js:238), state (nucleo.js:8)
- excluirTimeSalvo:259 - chama: openConfirmModal (dex_lista.js:403), acao (nucleo.js:238), state (nucleo.js:8)
- renderSavedTeams:207 - chama: getSpeciesByX (dados_base.js:78), snamesToXs (save.js:15), state (nucleo.js:8)
- renderTeam:17 - chama: effectiveBuild (builds.js:190), ABILITIES (dados_base.js:10), getSpeciesByX (dados_base.js:78), habilidadesEscolhiveis (dados_base.js:119), speciesTypeNames (tipos.js:254), +14 | chamado por: alternarFocoDoCartao (time_build.js:109)
- rosterMove:158 - chama: getSpeciesByX (dados_base.js:78), acao (nucleo.js:238), state (nucleo.js:8) | chamado por: initBosses (aba_chefoes.js:33)
- salvarNomeTimeSalvo:283 - chama: acao (nucleo.js:238), state (nucleo.js:8)
- swapPanelHtml:124 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- telasDeElenco:150 - chama: getSpeciesByX (dados_base.js:78)
- zerarRun:342 - chama: logAutoAction (evolucao.js:229), getCurrentCap (level_cap.js:49), myBuildLevelIsCustom (aba_chefoes.js:31), generatedTeamResult (arquetipo.js:35), teamRecommendation (arquetipo.js:30), +4

## ui/time_build.js
- alternarFocoDoCartao:109 - chama: getSpeciesByX (dados_base.js:78), buildFocadaDoMotor (pipeline_build.js:734), state (nucleo.js:8), renderTeam (time.js:17)
- avisoEnxutoHtml:64 - chama: avisosDaBuild (avisos_build.js:8)
- categoriaDoGolpe:11 - chama: SPLIT_STATUS (dados_base.js:29)
- evsBarrasHtml:22 - chamado por: bossMonCardHtml (aba_chefoes.js:434)
- golpesBuildHtml:30 - chama: stripNote (builds.js:44), MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9) | chamado por: bossMonCardHtml (aba_chefoes.js:434), entradaResumoHtml (editor_build.js:183), pipelineCandidatoHtml (pipeline_tela.js:78)
- habilidadesBuildHtml:43 - chama: stripNote (builds.js:44), ABILITIES (dados_base.js:10), habilidadesEscolhiveis (dados_base.js:119) | chamado por: bossMonCardHtml (aba_chefoes.js:434)
- itemBuildHtml:53 - chama: stripNote (builds.js:44) | chamado por: bossMonCardHtml (aba_chefoes.js:434), entradaResumoHtml (editor_build.js:183)
- painelDaBuildHtml:72 - chama: ondeAcharItemTexto (avisos_build.js:100), stripNote (builds.js:44), buildSynergyHtml (dex_ficha.js:42), buildNoteHtml (editor_build.js:155), megaModeBuildNoteHtml (editor_build.js:174), +3 | chamado por: renderTeam (time.js:17)
- papelChipsHtml:89 - chama: ROLE_LABEL_PT (dados_base.js:181), SPLIT_LABEL_PT (dados_base.js:182) | chamado por: renderTeam (time.js:17)
- semBuildHtml:85 - chamado por: renderTeam (time.js:17)
- sugestaoDoCartaoHtml:140 - chama: ROTULO_FOCO_BUILD (pipeline_build.js:687) | chamado por: renderTeam (time.js:17)
- sugestaoDoCartaoVale:104 - chama: state (nucleo.js:8)
- usarSugestaoDoCartao:123 - chama: getSpeciesByX (dados_base.js:78), SUGESTAO_ROTULO (sugestao_do_motor.js:11), gravarSugestoesDoMotor (sugestao_do_motor.js:61), planoDeGravarSugestoes (sugestao_do_motor.js:39), flashToast (dex_lista.js:473), +2

## ui/tipos.js
- computeRoleCompendium:91 - chama: ROLE_LABEL_PT (dados_base.js:181), SPECIES (dados_base.js:52), rankDe (rank_da_run.js:29), speciesTypeNames (tipos.js:254), state (nucleo.js:8)
- renderRoleCompendium:113 - chama: rankBadgeHtml (dex_ficha.js:169)
- renderSpeedTiers:35 - chama: SPEEDTIER_NATURE (chefoes.js:543), computeSpeedTiers (chefoes.js:545), speciesTypeNames (tipos.js:254), state (nucleo.js:8)
- renderTypeMatrix:9 - chama: USABLE_TYPES (dados_base.js:132), typeMultiplier (tipos.js:244)
