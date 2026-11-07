# Chamadas entre arquivos - src/ui/

Gerado por `npm run mapa` (scripts/mapa_chamadas.mjs, API do TypeScript); não edite à mão.
Por função de nível superior: `chama:` e `chamado por:` funções de OUTROS arquivos de src/regras e src/ui, como `nome (arquivo:linha)`;
no máximo 5 por lista, o resto vira `+N`. Referência vale também como callback. Chamada pelo template/HTML não aparece. Mapa geral: [mapa-do-codigo.md](../mapa-do-codigo.md).

## ui/aba_chefoes.js
- DIFF_LABELS:233 - chamado por: bossReferenceHtml (ficha_extras.js:103), quemResolveCardHtml (quem_resolve.js:83)
- STAT_LABELS_SHORT:526 - chamado por: evBreakpointNote (editor_build.js:116), myBuildEditorHtml (editor_build.js:223), updateMyBuildStatus (editor_build.js:352), compareResultHtml (ficha_extras.js:22)
- bossMonCardHtml:431 - chama: calcFinalStat (calc_stat.js:160), itemRuleFor (calc_stat.js:149), ABILITIES (dados_base.js:10), getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), +2
- bossState:13 - chamado por: initProgress (progresso.js:105), quemResolvePreencher (quem_resolve.js:66), quemResolveRestaurar (quem_resolve.js:103)
- campoDoChefaoHtml:178 - chama: regraDeCampoDoChefao (chefoes.js:426)
- candidatosDoJogador:247 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), battleUnitsOf (formas_mega.js:185), xsDoJogador (liberado_na_run.js:38), serveProMono (mono_run.js:74)
- guardarTimeAnterior:265 - chama: getSpeciesByX (dados_base.js:78), ehBackupDeTime (save.js:48), xsToSnames (save.js:24), generatedTeamResult (arquetipo.js:35), teamKeyFor (arquetipo.js:14), +2
- hellDoChefaoHtml:199 - chama: regrasDoHell (chefoes.js:477)
- iaDoChefaoHtml:190 - chama: comportamentoDaIADoChefao (chefoes.js:459)
- initBosses:33 - chama: showdownSet (builds.js:53), getSpeciesByX (dados_base.js:78), flashToast (dex_lista.js:473), copyText (editor_build.js:11), acao (nucleo.js:243), +3
- montarTimeContraEsteChefao:307 - chama: computeTeamGenerationValidation (builds.js:228), buffsAtivosDoChefao (chefoes.js:534), buffsParaMostrarDoChefao (chefoes.js:522), planoDaLuta (chefoes.js:568), regraDeCampoDoChefao (chefoes.js:426), +12
- myBuildLevel:19 - chamado por: myBuildEditorHtml (editor_build.js:223), updateMyBuildStatus (editor_build.js:352), wireMyBuildEditor (editor_build.js:416)
- myBuildLevelIsCustom:31 - chamado por: myBuildEditorHtml (editor_build.js:223), wireMyBuildEditor (editor_build.js:416), initProgress (progresso.js:105), zerarRun (time.js:343)
- renderBossDetail:527 - chama: classeDoCabecalhoDoChefao (chefoes.js:57), nivelDeCalculo (level_cap.js:65), monotypeAtivo (mono_run.js:72), quemResolveCardHtml (quem_resolve.js:83), quemResolveRestaurar (quem_resolve.js:103), +1
- renderGymSkillsCardHtml:394 - chama: ehRevancheDeLider (chefoes.js:486), gymLeaderBaseName (chefoes.js:55), gymSkillsSummaryFor (chefoes.js:379)
- selectBoss:375 - chama: varianteDoChefao (chefoes.js:370)
- simularSemTravarATela:294 - chama: montarTimeContraChefaoEmPassos (duelo.js:4792), totalDePassosContraChefao (duelo.js:4791)

## ui/arquetipo.js
- applyRecommendedTeam:143 - chama: getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), formFamilyOf (formas_mega.js:65), entradasDoJogador (liberado_na_run.js:34), flashToast (dex_lista.js:473), +4 | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:307), modoMotorFicarComVariante (modo_motor.js:118)
- archetypeCardHtml:85 - chama: ARQUETIPOS_DE_CAMPO (campo.js:33), MONOTYPE_ARCHETYPES (dados_base.js:156), PACE_ARCHETYPES (dados_base.js:146), TATICA_ARCHETYPES (dados_base.js:149), modoMotorBotaoHtml (modo_motor.js:163), +2
- buffsMudaram:208 - chama: buffsParaMostrarDoChefao (chefoes.js:522)
- climaQueCombinaHtml:296 - chama: climaQueCombina (mono_run.js:141), state (nucleo.js:8)
- generatedTeamCardHtml:261 - chama: computeTeamGenerationValidation (builds.js:228)
- generatedTeamResult:35 - chamado por: guardarTimeAnterior (aba_chefoes.js:265), montarTimeContraEsteChefao (aba_chefoes.js:307), zerarRun (time.js:343)
- monoRunCardHtml:317 - chama: entradasDoJogador (liberado_na_run.js:34), MONO_MARCAS (mono_run.js:11), avisoProximoLider (mono_run.js:158), fraquezasDoTipo (mono_run.js:80), monoDisponibilidade (mono_run.js:176), +2
- planoContraChefaoHtml:212 - chama: faixaDeHpDaLuta (chefoes.js:612), NOME_DA_CONDICAO (condicoes_habilidade.js:42)
- renderMonoRun:374 - chama: state (nucleo.js:8) | chamado por: renderTeam (time.js:8)
- renderTeamAnalysis:400 - chama: computeSharedRisks (chefoes.js:121), USABLE_TYPES (dados_base.js:132), abilityTypeMod (tipos.js:173) | chamado por: renderTeam (time.js:8)
- renderTeamStrategy:283 - chama: modoMotorAquecer (modo_motor.js:39), modoMotorResultadoHtml (modo_motor.js:223) | chamado por: modoMotorFicarComVariante (modo_motor.js:118), modoMotorMontar (modo_motor.js:67), renderTeam (time.js:8)
- resumoDoArquetipo:74 - chama: state (nucleo.js:8)
- teamKeyFor:14 - chamado por: guardarTimeAnterior (aba_chefoes.js:265), montarTimeContraEsteChefao (aba_chefoes.js:307)
- teamRecommendation:30 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:307), modoMotorFicarComVariante (modo_motor.js:118), zerarRun (time.js:343)
- vereditoDaLutaHtml:199 - chama: vereditoDaLuta (chefoes.js:606)

## ui/auto_evolucao.js
- autoEvolveRoster:20 - chama: devolveChainByX (evolucao.js:206), evoluirElencoSemDuplicar (evolucao.js:40), evolveChainByX (evolucao.js:66), logAutoAction (evolucao.js:229), podarAutoEvolved (evolucao.js:61), +3 | chamado por: loadSave (nucleo.js:337), initProgress (progresso.js:105)
- renderAutoLog:9 - chama: state (nucleo.js:8) | chamado por: initProgress (progresso.js:105), registrarTrocasDoPlano (revisao_automatica.js:71)

## ui/caixa.js
- pcBoxSelectedX:14 - chamado por: zerarRun (time.js:343)
- renderBox:16 - chama: ABILITIES (dados_base.js:10), getSpeciesByX (dados_base.js:78), habilidadesEscolhiveis (dados_base.js:119), speciesTypeNames (tipos.js:254), rankBadgeHtml (dex_ficha.js:169), +4

## ui/dex_ficha.js
- RANK_TIER_CLASS:154 - chamado por: monoRunCardHtml (arquetipo.js:317)
- abilityCard:14 - chama: ABILITIES (dados_base.js:10)
- buildSynergyHtml:42 - chama: sinergiasDaEspecie (duelo.js:1320) | chamado por: buildEntryHtml (editor_build.js:182), renderTeam (time.js:8)
- conditionMoveSynergyNoteHtml:70 - chama: buildNoteHtml (editor_build.js:155)
- evoConditionText:88 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL_FEMALE (dados_base.js:32), EVO_LEVEL_MALE (dados_base.js:31), EVO_MEGA_KINDS (dados_base.js:34), EVO_PRIMAL (dados_base.js:33)
- fichaCabecalhoHtml:469 - chama: avisoSemSpriteHtml (dados_base.js:196), descricaoDaEspecie (dados_base.js:187), compraDeInicialTexto (mono_run.js:47), speciesTypeNames (tipos.js:254), state (nucleo.js:8)
- fichaConhecerHtml:523 - chama: uniqueIds (dados_base.js:122), sinergiasDaEspecie (duelo.js:1320), bst (dex_lista.js:152)
- fichaEfetividadeHtml:388 - chama: perfilDefensivoDaEspecie (tipos.js:179)
- fichaEvolucaoHtml:411 - chama: getSpeciesByX (dados_base.js:78)
- fichaFormasHtml:429 - chama: getSpeciesByX (dados_base.js:78)
- fichaNavHtml:400 - chama: listaAtual (dex_lista.js:210) | chamado por: renderList (dex_lista.js:243)
- fichaNotasHtml:556 - chama: bossReferenceHtml (ficha_extras.js:103), buildHistoryHtml (ficha_extras.js:87), notesCardHtml (ficha_extras.js:78)
- fichaStatsHtml:378 - chama: statPct (dex_lista.js:163), statTier (dex_lista.js:164)
- howToObtainText:236 - chama: MAPS (dados_base.js:49)
- marcasDoRankHtml:288 - chama: precisaDeSetter (condicoes_habilidade.js:213), nivelDaHabilidadeNoElite (level_cap.js:40), rankDaDificuldadeDe (rank_da_run.js:69), state (nucleo.js:8)
- rankBadgeHtml:169 - chama: FORA_DO_RANK (rank_da_run.js:10), MOTIVO_FORA_DO_RANK_PT (rank_da_run.js:17), rankDe (rank_da_run.js:29) | chamado por: renderBox (caixa.js:16), linhaDaListaHtml (dex_lista.js:212), compareResultHtml (ficha_extras.js:22), renderTeam (time.js:8), renderRoleCompendium (tipos.js:113)
- rankInfoLineHtml:310 - chama: FORA_DO_RANK (rank_da_run.js:10), MOTIVO_FORA_DO_RANK_PT (rank_da_run.js:17), rankDe (rank_da_run.js:29)
- rankStageBadgeHtml:203 - chama: rankDe (rank_da_run.js:29)
- renderMovesTable:111 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9), getCurrentCap (level_cap.js:49)
- roleTagsHtml:215 - chama: ROLE_LABEL_PT (dados_base.js:181), SPLIT_LABEL_PT (dados_base.js:182) | chamado por: renderBox (caixa.js:16)
- scheduleDashboardRefresh:688 - chama: renderDashboard (resumo_luta.js:183)
- selectSpecies:564 - chama: getSpeciesByX (dados_base.js:78), myBuildEditorHtml (editor_build.js:223), wireMyBuildEditor (editor_build.js:416), compareCardHtml (ficha_extras.js:14), state (nucleo.js:8) | chamado por: redesenharFichaAberta (nucleo.js:197)
- updateResetTeamBoxBtn:702 - chama: runTemAlgoPraZerar (evolucao.js:247) | chamado por: persist (nucleo.js:144)
- whereToFindText:266 - chama: MAPS (dados_base.js:49)

## ui/dex_lista.js
- bst:152 - chamado por: fichaConhecerHtml (dex_ficha.js:523), compareResultHtml (ficha_extras.js:22)
- flashToast:473 - chamado por: initBosses (aba_chefoes.js:33), montarTimeContraEsteChefao (aba_chefoes.js:307), applyRecommendedTeam (arquetipo.js:143), autoEvolveRoster (auto_evolucao.js:20), apagarBuildComDesfazer (editor_build.js:467), +1
- getFiltered:171 - chama: SPECIES (dados_base.js:52), rankDe (rank_da_run.js:29), speciesTypeNames (tipos.js:254), state (nucleo.js:8)
- linhaDaListaHtml:212 - chama: avisoSemSpriteHtml (dados_base.js:196), speciesTypeNames (tipos.js:254), rankBadgeHtml (dex_ficha.js:169), state (nucleo.js:8)
- listaAtual:210 - chamado por: fichaNavHtml (dex_ficha.js:400)
- openConfirmModal:403 - chamado por: excluirTimeSalvo (time.js:260)
- openSwapModal:328 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- renderList:243 - chama: getSpeciesByX (dados_base.js:78), fichaNavHtml (dex_ficha.js:400), state (nucleo.js:8)
- renderMaisLista:232 - chama: state (nucleo.js:8)
- statPct:163 - chamado por: fichaStatsHtml (dex_ficha.js:378)
- statTier:164 - chamado por: fichaStatsHtml (dex_ficha.js:378)
- syncRowAddButtons:313 - chama: state (nucleo.js:8)

## ui/editor_build.js
- apagarBuildComDesfazer:467 - chama: getSpeciesByX (dados_base.js:78), getBuildList (evolucao.js:14), flashToast (dex_lista.js:473), reinserirBuild (nucleo.js:131), removeBuildIndex (nucleo.js:124), +1
- buildChipsHtml:212 - chama: SUGESTAO_ROTULO (sugestao_do_motor.js:11)
- buildContextNotesHtml:161 - chama: avisosDaBuild (avisos_build.js:8) | chamado por: renderTeam (time.js:8)
- buildEntryHtml:182 - chama: showdownSet (builds.js:53), buildSynergyHtml (dex_ficha.js:42) | chamado por: bossReferenceHtml (ficha_extras.js:103), buildHistoryHtml (ficha_extras.js:87)
- buildNoteHtml:155 - chamado por: conditionMoveSynergyNoteHtml (dex_ficha.js:70), planoDaBuildHtml (ficha_extras.js:179), renderTeam (time.js:8)
- copyText:11 - chamado por: initBosses (aba_chefoes.js:33)
- evBreakpointNote:116 - chama: minEvSameStat (calc_stat.js:200), STAT_LABELS_SHORT (aba_chefoes.js:526)
- hpEvEfficiencyNote:83 - chama: stripNote (builds.js:44), calcFinalStat (calc_stat.js:160)
- itemDescHtml:45 - chama: ondeAcharItemTexto (avisos_build.js:100), stripNote (builds.js:44) | chamado por: renderTeam (time.js:8)
- lerFormularioDoEditor:444 - chama: clampInt (dados_base.js:103)
- megaModeBuildNoteHtml:174 - chama: megaStoneRuleFor (validacao_build_ia.js:18) | chamado por: renderTeam (time.js:8)
- myBuildEditorHtml:223 - chama: evsToShowdownText (builds.js:70), showdownSet (builds.js:53), ABILITIES (dados_base.js:10), ALL_NATURES (dados_base.js:101), ITEMS (dados_base.js:12), +12 | chamado por: selectSpecies (dex_ficha.js:564)
- seloDaBuildHtml:168 - chama: seloDaBuild (avisos_build.js:82) | chamado por: renderTeam (time.js:8)
- updateMyBuildEvTotal:322 - chama: clampInt (dados_base.js:103)
- updateMyBuildStatus:352 - chama: ITEM_MOVE_POWER_MODS (calc_stat.js:132), calcFinalStat (calc_stat.js:160), itemRuleFor (calc_stat.js:149), MOVE_BY_NAME (dados_base.js:86), SPLIT_STATUS (dados_base.js:29), +6
- wireMyBuildEditor:416 - chama: getActiveBuild (evolucao.js:16), nivelDeCalculo (level_cap.js:65), myBuildLevel (aba_chefoes.js:19), myBuildLevelIsCustom (aba_chefoes.js:31), pipelineDesenharFicha (pipeline_tela.js:113) | chamado por: selectSpecies (dex_ficha.js:564)

## ui/ficha_extras.js
- bossReferenceHtml:103 - chama: DIFF_LABELS (aba_chefoes.js:233), buildEntryHtml (editor_build.js:182) | chamado por: fichaNotasHtml (dex_ficha.js:556)
- buildHistoryHtml:87 - chama: buildEntryHtml (editor_build.js:182) | chamado por: fichaNotasHtml (dex_ficha.js:556), renderTeam (time.js:8)
- compareCardHtml:14 - chamado por: selectSpecies (dex_ficha.js:564)
- compareResultHtml:22 - chama: effectiveBuild (builds.js:190), stripNote (builds.js:44), speciesTypeNames (tipos.js:254), STAT_LABELS_SHORT (aba_chefoes.js:526), rankBadgeHtml (dex_ficha.js:169), +1
- megaLockedTagHtml:199 - chama: isMegaForm (formas_mega.js:71), megaFormLiberada (formas_mega.js:109), megaSoNoDebug (formas_mega.js:110), quandoMega (formas_mega.js:112), rotuloEtapaDaMega (formas_mega.js:113) | chamado por: renderBox (caixa.js:16), renderTeam (time.js:8)
- notesCardHtml:78 - chama: state (nucleo.js:8) | chamado por: fichaNotasHtml (dex_ficha.js:556)
- otherFormsHtml:206 - chama: formFamilyOf (formas_mega.js:65), isMegaForm (formas_mega.js:71), megaFormLiberada (formas_mega.js:109), megaSoNoDebug (formas_mega.js:110), quandoMega (formas_mega.js:112), +1 | chamado por: renderTeam (time.js:8)
- planoDaBuildHtml:179 - chama: buildNoteHtml (editor_build.js:155) | chamado por: myBuildEditorHtml (editor_build.js:223), renderTeam (time.js:8)
- rotuloDaBuild:170 - chama: ESTILO_ROTULO (plano_build.js:20), SUGESTAO_ROTULO (sugestao_do_motor.js:11) | chamado por: renderTeam (time.js:8)

## ui/modo_motor.js
- modoMotorAquecer:39 - chama: contextoDoMotor (time_pelo_motor.js:140), motorAquecerBuildsEmPassos (time_pelo_motor.js:228) | chamado por: renderTeamStrategy (arquetipo.js:283)
- modoMotorBotaoHtml:163 - chamado por: archetypeCardHtml (arquetipo.js:85)
- modoMotorCache:18 - chama: criarCacheDoMotor (time_pelo_motor.js:64)
- modoMotorCapturados:25 - chama: getSpeciesByX (dados_base.js:78), xsDoJogador (liberado_na_run.js:38), state (nucleo.js:8)
- modoMotorChave:20 - chama: megaMode (formas_mega.js:82), capOuPadrao (level_cap.js:61), levelCapMode (level_cap.js:16), xsDoJogador (liberado_na_run.js:38), state (nucleo.js:8)
- modoMotorFavoritosHtml:151 - chamado por: archetypeCardHtml (arquetipo.js:85)
- modoMotorFavoritosValidos:30 - chama: state (nucleo.js:8)
- modoMotorFicarComVariante:118 - chama: getSpeciesByX (dados_base.js:78), SUGESTAO_ROTULO (sugestao_do_motor.js:11), gravarSugestoesDoMotor (sugestao_do_motor.js:61), planoDeGravarSugestoes (sugestao_do_motor.js:39), applyRecommendedTeam (arquetipo.js:143), +4
- modoMotorMontar:67 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:185), xsDoJogador (liberado_na_run.js:38), serveProMono (mono_run.js:74), contextoDoMotor (time_pelo_motor.js:140), +3
- modoMotorResultadoHtml:223 - chamado por: renderTeamStrategy (arquetipo.js:283)
- modoMotorRodapeHtml:180 - chama: SUGESTAO_ROTULO (sugestao_do_motor.js:11)

## ui/nucleo.js
- STORE_KEY:82 - chamado por: aplicarSaveRemoto (sync.js:45), lerSaveLocal (sync.js:174)
- TELAS:205 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:307), applyRecommendedTeam (arquetipo.js:143)
- abrirVagaPreservando:118 - chama: buildQueSaiParaAbrirVaga (lista_de_builds.js:43) | chamado por: processarRevisoes (revisao_automatica.js:23)
- acao:243 - chamado por: guardarTimeAnterior (aba_chefoes.js:265), initBosses (aba_chefoes.js:33), applyRecommendedTeam (arquetipo.js:143), modoMotorFicarComVariante (modo_motor.js:118), initProgress (progresso.js:105), +6
- addBuildVariant:101 - chama: acrescentarVarianteNaLista (lista_de_builds.js:23) | chamado por: processarRevisoes (revisao_automatica.js:23)
- concluirAcoes:266 - chama: agendarRevisoes (revisao_automatica.js:91)
- fichaAfetada:261 - chama: getSpeciesByX (dados_base.js:78)
- loadA11yPrefs:285 - chamado por: initProgress (progresso.js:105)
- loadSave:337 - chama: applySave (save.js:49), conferirSomaDoSave (save.js:329), reconciliouAoAplicar (save.js:44), autoEvolveRoster (auto_evolucao.js:20)
- lsGet:84 - chamado por: lerSaveLocal (sync.js:174)
- lsSet:85 - chamado por: aplicarSaveRemoto (sync.js:45)
- persist:144 - chama: buildSave (save.js:339), updateResetTeamBoxBtn (dex_ficha.js:702), pushToSync (sync.js:96) | chamado por: aplicarSaveRemoto (sync.js:45)
- redesenharFichaAberta:197 - chama: selectSpecies (dex_ficha.js:564)
- reinserirBuild:131 - chama: getBuildList (evolucao.js:14) | chamado por: apagarBuildComDesfazer (editor_build.js:467)
- removeBuildIndex:124 - chama: removerBuildDaLista (lista_de_builds.js:32) | chamado por: apagarBuildComDesfazer (editor_build.js:467)
- saveA11yPrefs:295 - chamado por: initProgress (progresso.js:105)
- setActiveBuildIndex:104 - chama: getBuildList (evolucao.js:14)
- setOrReplaceActiveBuild:94 - chama: trocarBuildAtivaNaLista (lista_de_builds.js:11) | chamado por: initBosses (aba_chefoes.js:33), processarRevisoes (revisao_automatica.js:23)
- showStorageBanner:166 - chamado por: remotoComSomaErrada (sync.js:88)
- state:8 - chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:190), itensEmUsoComQuem (builds.js:141), teamItemsInUse (builds.js:85), teamMovesInUse (builds.js:111), +100
- telasDeBuild:237 - chamado por: processarRevisoes (revisao_automatica.js:23)

## ui/pipeline_tela.js
- pipelineAlvoValido:26 - chama: getRemainingBossEntries (chefoes.js:63)
- pipelineCandidatoHtml:77 - chamado por: quemResolveItemHtml (quem_resolve.js:43)
- pipelineDesenharFicha:113 - chamado por: wireMyBuildEditor (editor_build.js:416)
- pipelineDesenharTime:125 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: renderTeam (time.js:8)
- pipelineGolpeHtml:71 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9)
- pipelineResultado:14 - chama: getCurrentCap (level_cap.js:49), candidatosDeBuild (pipeline_build.js:568), state (nucleo.js:8)
- pipelineSeletorDeAlvoHtml:32 - chama: getRemainingBossEntries (chefoes.js:63)

## ui/progresso.js
- initProgress:105 - chama: bossPartyPorDificuldade (chefoes.js:339), confrontoParaParty (chefoes.js:310), getRemainingBossEntries (chefoes.js:63), varianteDoChefao (chefoes.js:370), logAutoAction (evolucao.js:229), +16
- renderCapBadge:17 - chama: getCurrentCap (level_cap.js:49)
- renderCapDisplay:21 - chama: getCurrentCap (level_cap.js:49)
- renderProgressTrail:30 - chama: state (nucleo.js:8)
- renderRunStatus:9 - chama: state (nucleo.js:8)

## ui/quem_resolve.js
- quemResolveCalcular:22 - chama: especiesQueResolvem (pipeline_build.js:697)
- quemResolveCardHtml:83 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), DIFF_LABELS (aba_chefoes.js:233), state (nucleo.js:8) | chamado por: renderBossDetail (aba_chefoes.js:527)
- quemResolveChave:17 - chama: getCurrentCap (level_cap.js:49), state (nucleo.js:8)
- quemResolveItemHtml:43 - chama: pipelineCandidatoHtml (pipeline_tela.js:77)
- quemResolveOrigemHtml:37 - chama: rankDe (rank_da_run.js:29)
- quemResolvePreencher:66 - chama: bossState (aba_chefoes.js:13)
- quemResolveRestaurar:103 - chama: bossState (aba_chefoes.js:13) | chamado por: renderBossDetail (aba_chefoes.js:527)

## ui/resumo_luta.js
- bossConfrontoHtml:96 - chama: confrontoParaParty (chefoes.js:310) | chamado por: renderBossDetail (aba_chefoes.js:527)
- boxFitNote:154 - chama: computeSharedRisks (chefoes.js:121), battleUnitsOf (formas_mega.js:185), unitTypeMult (formas_mega.js:201) | chamado por: renderBox (caixa.js:16)
- confrontoAjustesHtml:44 - chama: coberturaSugerida (confronto.js:196)
- confrontoPlanoHtml:67 - chama: aberturaEmDupla (confronto.js:319), cuidadosDoChefao (confronto.js:302)
- dashboardConfrontoHtml:135 - chama: bossPartyPorDificuldade (chefoes.js:339), confrontoParaParty (chefoes.js:310)
- megaOfNote:175 - chama: isMegaForm (formas_mega.js:71), megaMode (formas_mega.js:82)
- nextFightDetailHtml:215 - chama: bestBoxCandidateForBoss (chefoes.js:195), bestRankForm (chefoes.js:345), bossSpeedSummary (chefoes.js:144)
- renderDashboard:183 - chama: computeSharedRisks (chefoes.js:121), getRemainingBossEntries (chefoes.js:63), nextFightCx (chefoes.js:363), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: scheduleDashboardRefresh (dex_ficha.js:688)
- renderNextFightCard:257 - chama: getRemainingBossEntries (chefoes.js:63), nextFightCx (chefoes.js:363), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: renderTeam (time.js:8)

## ui/revisao_automatica.js
- agendarRevisoes:91 - chamado por: concluirAcoes (nucleo.js:266)
- capRegistrado:70 - chamado por: initProgress (progresso.js:105), aplicarSaveRemoto (sync.js:45), zerarRun (time.js:343)
- processarRevisoes:23 - chama: getSpeciesByX (dados_base.js:78), logAutoAction (evolucao.js:229), golpesTravadosNoCap (level_cap.js:90), curadaParaEstilo (plano_build.js:160), estiloDoRitmo (plano_build.js:48), +7
- registrarTrocasDoPlano:71 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), logAutoAction (evolucao.js:229), trocasEntreCaps (plano_build.js:141), renderAutoLog (auto_evolucao.js:9), +1 | chamado por: initProgress (progresso.js:105)
- tarefaDeRevisao:13 - chama: getActiveBuild (evolucao.js:16)

## ui/sync.js
- aplicarSaveRemoto:45 - chama: getCurrentCap (level_cap.js:49), applySave (save.js:49), buildSave (save.js:339), reconciliouAoAplicar (save.js:44), STORE_KEY (nucleo.js:82), +3
- conflitoDeProgresso:61 - chama: saveChegandoTemMenosProgresso (save.js:386)
- connectSync:179 - chama: buildSave (save.js:339), saveEnviavel (save.js:336), syncContentDiffers (save.js:400)
- lerSaveLocal:174 - chama: STORE_KEY (nucleo.js:82), lsGet (nucleo.js:84)
- pushToSync:96 - chamado por: persist (nucleo.js:144)
- remotoComSomaErrada:88 - chama: conferirSomaDoSave (save.js:329), saveEnviavel (save.js:336), showStorageBanner (nucleo.js:166)

## ui/time.js
- TELAS_ELENCO:149 - chamado por: applyRecommendedTeam (arquetipo.js:143), initProgress (progresso.js:105)
- carregarTimeSalvo:232 - chama: snamesToXs (save.js:15), acao (nucleo.js:243), state (nucleo.js:8)
- excluirTimeSalvo:260 - chama: openConfirmModal (dex_lista.js:403), acao (nucleo.js:243), state (nucleo.js:8)
- renderSavedTeams:208 - chama: getSpeciesByX (dados_base.js:78), snamesToXs (save.js:15), state (nucleo.js:8)
- renderTeam:8 - chama: effectiveBuild (builds.js:190), showdownSet (builds.js:53), ABILITIES (dados_base.js:10), getSpeciesByX (dados_base.js:78), habilidadesEscolhiveis (dados_base.js:119), +19
- rosterMove:159 - chama: getSpeciesByX (dados_base.js:78), acao (nucleo.js:243), state (nucleo.js:8) | chamado por: initBosses (aba_chefoes.js:33)
- salvarNomeTimeSalvo:284 - chama: acao (nucleo.js:243), state (nucleo.js:8)
- swapPanelHtml:125 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- telasDeElenco:151 - chama: getSpeciesByX (dados_base.js:78)
- zerarRun:343 - chama: logAutoAction (evolucao.js:229), getCurrentCap (level_cap.js:49), myBuildLevelIsCustom (aba_chefoes.js:31), generatedTeamResult (arquetipo.js:35), teamRecommendation (arquetipo.js:30), +4

## ui/tipos.js
- computeRoleCompendium:91 - chama: ROLE_LABEL_PT (dados_base.js:181), SPECIES (dados_base.js:52), rankDe (rank_da_run.js:29), speciesTypeNames (tipos.js:254), state (nucleo.js:8)
- renderRoleCompendium:113 - chama: rankBadgeHtml (dex_ficha.js:169)
- renderSpeedTiers:35 - chama: SPEEDTIER_NATURE (chefoes.js:546), computeSpeedTiers (chefoes.js:548), speciesTypeNames (tipos.js:254), state (nucleo.js:8)
- renderTypeMatrix:9 - chama: USABLE_TYPES (dados_base.js:132), typeMultiplier (tipos.js:244)
