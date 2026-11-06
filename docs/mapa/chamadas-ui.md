# Chamadas entre arquivos - src/ui/

Gerado por `npm run mapa` (scripts/mapa_chamadas.mjs, API do TypeScript); não edite à mão.
Por função de nível superior: `chama:` e `chamado por:` funções de OUTROS arquivos de src/regras e src/ui, como `nome (arquivo:linha)`;
no máximo 5 por lista, o resto vira `+N`. Referência vale também como callback. Chamada pelo template/HTML não aparece. Mapa geral: [mapa-do-codigo.md](../mapa-do-codigo.md).

## ui/aba_chefoes.js
- DIFF_LABELS:233 - chamado por: bossReferenceHtml (ficha_extras.js:103), quemResolveCardHtml (quem_resolve.js:83)
- STAT_LABELS_SHORT:555 - chamado por: evBreakpointNote (editor_build.js:116), myBuildEditorHtml (editor_build.js:223), updateMyBuildStatus (editor_build.js:362), compareResultHtml (ficha_extras.js:22)
- bossMonCardHtml:460 - chama: calcFinalStat (calc_stat.js:160), itemRuleFor (calc_stat.js:149), ABILITIES (dados_base.js:10), getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), +2
- bossState:13 - chamado por: initProgress (progresso.js:105), quemResolvePreencher (quem_resolve.js:66), quemResolveRestaurar (quem_resolve.js:103)
- campoDoChefaoHtml:178 - chama: regraDeCampoDoChefao (chefoes.js:426)
- candidatosDoJogador:248 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), battleUnitsOf (formas_mega.js:185), xsDoJogador (liberado_na_run.js:38), serveProMono (mono_run.js:74)
- guardarTimeAnterior:266 - chama: getSpeciesByX (dados_base.js:78), ehBackupDeTime (save.js:48), xsToSnames (save.js:24), generatedTeamResult (arquetipo.js:35), teamKeyFor (arquetipo.js:14), +2
- hellDoChefaoHtml:199 - chama: regrasDoHell (chefoes.js:477)
- iaDoChefaoHtml:190 - chama: comportamentoDaIADoChefao (chefoes.js:459)
- initBosses:33 - chama: showdownSet (builds.js:58), getSpeciesByX (dados_base.js:78), flashToast (dex_lista.js:473), copyText (editor_build.js:11), acao (nucleo.js:243), +3
- montarTimeContraEsteChefao:308 - chama: comecarLoteDeBuilds (builds.js:118), computeTeamGenerationValidation (builds.js:240), encerrarLoteDeBuilds (builds.js:120), buffsAtivosDoChefao (chefoes.js:515), buffsParaMostrarDoChefao (chefoes.js:503), +19
- myBuildLevel:19 - chamado por: myBuildEditorHtml (editor_build.js:223), updateMyBuildStatus (editor_build.js:362), wireMyBuildEditor (editor_build.js:465)
- myBuildLevelIsCustom:31 - chamado por: myBuildEditorHtml (editor_build.js:223), wireMyBuildEditor (editor_build.js:465), initProgress (progresso.js:105), zerarRun (time.js:362)
- renderBossDetail:556 - chama: classeDoCabecalhoDoChefao (chefoes.js:57), nivelDeCalculo (level_cap.js:65), monotypeAtivo (mono_run.js:72), quemResolveCardHtml (quem_resolve.js:83), quemResolveRestaurar (quem_resolve.js:103), +1
- renderGymSkillsCardHtml:423 - chama: ehRevancheDeLider (chefoes.js:484), gymLeaderBaseName (chefoes.js:55), gymSkillsSummaryFor (chefoes.js:379)
- selectBoss:404 - chama: varianteDoChefao (chefoes.js:370)
- simularSemTravarATela:295 - chama: montarTimeContraChefaoEmPassos (duelo.js:4789), totalDePassosContraChefao (duelo.js:4788)

## ui/arquetipo.js
- applyRecommendedTeam:207 - chama: getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), formFamilyOf (formas_mega.js:65), entradasDoJogador (liberado_na_run.js:34), flashToast (dex_lista.js:473), +4 | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308), modoMotorFicarComVariante (modo_motor.js:119)
- archetypeCardHtml:85 - chama: ARQUETIPOS_DE_CAMPO (campo.js:33), MONOTYPE_ARCHETYPES (dados_base.js:156), PACE_ARCHETYPES (dados_base.js:146), TATICA_ARCHETYPES (dados_base.js:149), modoDeMontagem (modo_motor.js:9), +4
- buffsMudaram:364 - chama: buffsParaMostrarDoChefao (chefoes.js:503)
- climaQueCombinaHtml:476 - chama: climaQueCombina (mono_run.js:141), state (nucleo.js:8)
- generateCompleteTeam:292 - chama: comecarLoteDeBuilds (builds.js:118), computeTeamGenerationValidation (builds.js:240), concluirBuildDoLote (builds.js:119), encerrarLoteDeBuilds (builds.js:120), getSpeciesByX (dados_base.js:78), +5
- generateTeamForArchetype:153 - chama: getSpeciesByX (dados_base.js:78), ctxDoState (prompts_ia.js:16), montarPromptTimeArquetipo (prompts_ia.js:767), rosterParaTimeIA (prompts_ia.js:721), snamesValidosDoTime (prompts_ia.js:808), +3
- generateTeamUsageGuide:260 - chama: guiaDaResposta (prompts_ia.js:853), montarPromptGuia (prompts_ia.js:830), pedirIA (ia.js:80)
- generatedTeamCardHtml:417 - chama: computeTeamGenerationValidation (builds.js:240)
- generatedTeamResult:35 - chamado por: guardarTimeAnterior (aba_chefoes.js:266), montarTimeContraEsteChefao (aba_chefoes.js:308), zerarRun (time.js:362)
- monoRunCardHtml:497 - chama: entradasDoJogador (liberado_na_run.js:34), MONO_MARCAS (mono_run.js:11), avisoProximoLider (mono_run.js:158), fraquezasDoTipo (mono_run.js:80), monoDisponibilidade (mono_run.js:176), +2
- planoContraChefaoHtml:368 - chama: faixaDeHpDaLuta (chefoes.js:593), NOME_DA_CONDICAO (condicoes_habilidade.js:42)
- renderMonoRun:554 - chama: state (nucleo.js:8) | chamado por: renderTeam (time.js:8)
- renderTeamAnalysis:580 - chama: computeSharedRisks (chefoes.js:121), USABLE_TYPES (dados_base.js:132), abilityTypeMod (tipos.js:173) | chamado por: renderTeam (time.js:8)
- renderTeamStrategy:463 - chama: modoDeMontagem (modo_motor.js:9), modoMotorAquecer (modo_motor.js:40), modoMotorResultadoHtml (modo_motor.js:233) | chamado por: modoMotorFicarComVariante (modo_motor.js:119), modoMotorMontar (modo_motor.js:68), renderTeam (time.js:8)
- resumoDoArquetipo:74 - chama: state (nucleo.js:8)
- teamKeyFor:14 - chamado por: guardarTimeAnterior (aba_chefoes.js:266), montarTimeContraEsteChefao (aba_chefoes.js:308)
- teamRecommendation:30 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308), modoMotorFicarComVariante (modo_motor.js:119), zerarRun (time.js:362)
- vereditoDaLutaHtml:355 - chama: vereditoDaLuta (chefoes.js:587)

## ui/auto_evolucao.js
- autoEvolveRoster:20 - chama: devolveChainByX (evolucao.js:206), evoluirElencoSemDuplicar (evolucao.js:40), evolveChainByX (evolucao.js:66), logAutoAction (evolucao.js:229), podarAutoEvolved (evolucao.js:61), +3 | chamado por: loadSave (nucleo.js:337), initProgress (progresso.js:105)
- renderAutoLog:9 - chama: state (nucleo.js:8) | chamado por: initProgress (progresso.js:105), registrarTrocasDoPlano (revisao_automatica.js:149)

## ui/caixa.js
- pcBoxSelectedX:14 - chamado por: zerarRun (time.js:362)
- renderBox:16 - chama: ABILITIES (dados_base.js:10), getSpeciesByX (dados_base.js:78), habilidadesEscolhiveis (dados_base.js:119), speciesTypeNames (tipos.js:254), rankBadgeHtml (dex_ficha.js:169), +4

## ui/dex_ficha.js
- RANK_TIER_CLASS:154 - chamado por: monoRunCardHtml (arquetipo.js:497)
- abilityCard:14 - chama: ABILITIES (dados_base.js:10)
- buildSynergyHtml:42 - chama: sinergiasDaEspecie (duelo.js:1320) | chamado por: buildEntryHtml (editor_build.js:182), strategySetsHtml (editor_build.js:432), renderTeam (time.js:8)
- conditionMoveSynergyNoteHtml:70 - chama: buildNoteHtml (editor_build.js:155)
- evoConditionText:88 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL_FEMALE (dados_base.js:32), EVO_LEVEL_MALE (dados_base.js:31), EVO_MEGA_KINDS (dados_base.js:34), EVO_PRIMAL (dados_base.js:33)
- fichaCabecalhoHtml:504 - chama: avisoSemSpriteHtml (dados_base.js:196), descricaoDaEspecie (dados_base.js:187), compraDeInicialTexto (mono_run.js:47), speciesTypeNames (tipos.js:254), state (nucleo.js:8)
- fichaConhecerHtml:558 - chama: uniqueIds (dados_base.js:122), sinergiasDaEspecie (duelo.js:1320), bst (dex_lista.js:152)
- fichaEfetividadeHtml:423 - chama: perfilDefensivoDaEspecie (tipos.js:179)
- fichaEvolucaoHtml:446 - chama: getSpeciesByX (dados_base.js:78)
- fichaFormasHtml:464 - chama: getSpeciesByX (dados_base.js:78)
- fichaNavHtml:435 - chama: listaAtual (dex_lista.js:210) | chamado por: renderList (dex_lista.js:243)
- fichaNotasHtml:591 - chama: bossReferenceHtml (ficha_extras.js:103), buildHistoryHtml (ficha_extras.js:87), notesCardHtml (ficha_extras.js:78)
- fichaStatsHtml:413 - chama: statPct (dex_lista.js:163), statTier (dex_lista.js:164)
- howToObtainText:236 - chama: MAPS (dados_base.js:49)
- marcasDoRankHtml:288 - chama: precisaDeSetter (condicoes_habilidade.js:213), nivelDaHabilidadeNoElite (level_cap.js:40), rankDaDificuldadeDe (rank_da_run.js:69), state (nucleo.js:8)
- rankBadgeHtml:169 - chama: FORA_DO_RANK (rank_da_run.js:10), MOTIVO_FORA_DO_RANK_PT (rank_da_run.js:17), rankDe (rank_da_run.js:29) | chamado por: renderBox (caixa.js:16), linhaDaListaHtml (dex_lista.js:212), compareResultHtml (ficha_extras.js:22), renderTeam (time.js:8), renderRoleCompendium (tipos.js:113)
- rankInfoLineHtml:310 - chama: FORA_DO_RANK (rank_da_run.js:10), MOTIVO_FORA_DO_RANK_PT (rank_da_run.js:17), rankDe (rank_da_run.js:29)
- rankStageBadgeHtml:203 - chama: rankDe (rank_da_run.js:29)
- renderMovesTable:111 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9), getCurrentCap (level_cap.js:49)
- roleTagsHtml:215 - chama: ROLE_LABEL_PT (dados_base.js:181), SPLIT_LABEL_PT (dados_base.js:182) | chamado por: renderBox (caixa.js:16)
- scheduleDashboardRefresh:726 - chama: renderDashboard (resumo_luta.js:183)
- selectSpecies:599 - chama: getSpeciesByX (dados_base.js:78), myBuildEditorHtml (editor_build.js:223), strategySetsHtml (editor_build.js:432), wireMyBuildEditor (editor_build.js:465), compareCardHtml (ficha_extras.js:14), +1 | chamado por: redesenharFichaAberta (nucleo.js:197)
- updateResetTeamBoxBtn:740 - chama: runTemAlgoPraZerar (evolucao.js:247) | chamado por: persist (nucleo.js:144)
- whereToFindText:266 - chama: MAPS (dados_base.js:49)

## ui/dex_lista.js
- bst:152 - chamado por: fichaConhecerHtml (dex_ficha.js:558), compareResultHtml (ficha_extras.js:22)
- flashToast:473 - chamado por: initBosses (aba_chefoes.js:33), montarTimeContraEsteChefao (aba_chefoes.js:308), applyRecommendedTeam (arquetipo.js:207), generateCompleteTeam (arquetipo.js:292), generateTeamForArchetype (arquetipo.js:153), +4
- getFiltered:171 - chama: SPECIES (dados_base.js:52), rankDe (rank_da_run.js:29), speciesTypeNames (tipos.js:254), state (nucleo.js:8)
- linhaDaListaHtml:212 - chama: avisoSemSpriteHtml (dados_base.js:196), speciesTypeNames (tipos.js:254), rankBadgeHtml (dex_ficha.js:169), state (nucleo.js:8)
- listaAtual:210 - chamado por: fichaNavHtml (dex_ficha.js:435)
- openConfirmModal:403 - chamado por: excluirTimeSalvo (time.js:279)
- openSwapModal:328 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- renderList:243 - chama: getSpeciesByX (dados_base.js:78), fichaNavHtml (dex_ficha.js:435), state (nucleo.js:8)
- renderMaisLista:232 - chama: state (nucleo.js:8)
- statPct:163 - chamado por: fichaStatsHtml (dex_ficha.js:413)
- statTier:164 - chamado por: fichaStatsHtml (dex_ficha.js:413)
- syncRowAddButtons:313 - chama: state (nucleo.js:8)

## ui/editor_build.js
- apagarBuildComDesfazer:516 - chama: getSpeciesByX (dados_base.js:78), getBuildList (evolucao.js:14), flashToast (dex_lista.js:473), reinserirBuild (nucleo.js:131), removeBuildIndex (nucleo.js:124), +1
- buildChipsHtml:212 - chama: SUGESTAO_ROTULO (sugestao_do_motor.js:11)
- buildContextNotesHtml:161 - chama: avisosDaBuild (avisos_build.js:8) | chamado por: renderTeam (time.js:8)
- buildEntryHtml:182 - chama: showdownSet (builds.js:58), buildSynergyHtml (dex_ficha.js:42) | chamado por: bossReferenceHtml (ficha_extras.js:103), buildHistoryHtml (ficha_extras.js:87)
- buildNoteHtml:155 - chamado por: conditionMoveSynergyNoteHtml (dex_ficha.js:70), planoDaBuildHtml (ficha_extras.js:179), renderTeam (time.js:8)
- copyText:11 - chamado por: initBosses (aba_chefoes.js:33)
- evBreakpointNote:116 - chama: minEvSameStat (calc_stat.js:200), STAT_LABELS_SHORT (aba_chefoes.js:555)
- hpEvEfficiencyNote:83 - chama: stripNote (builds.js:49), calcFinalStat (calc_stat.js:160)
- itemDescHtml:45 - chama: ondeAcharItemTexto (avisos_build.js:100), stripNote (builds.js:49) | chamado por: renderTeam (time.js:8)
- lerFormularioDoEditor:493 - chama: clampInt (dados_base.js:103)
- megaModeBuildNoteHtml:174 - chama: megaStoneRuleFor (validacao_build_ia.js:14) | chamado por: renderTeam (time.js:8)
- myBuildEditorHtml:223 - chama: evsToShowdownText (builds.js:75), showdownSet (builds.js:58), ABILITIES (dados_base.js:10), ALL_NATURES (dados_base.js:101), ITEMS (dados_base.js:12), +12 | chamado por: selectSpecies (dex_ficha.js:599)
- seloDaBuildHtml:168 - chama: seloDaBuild (avisos_build.js:82) | chamado por: renderTeam (time.js:8)
- strategySetsHtml:432 - chama: evsToShowdownText (builds.js:75), showdownSet (builds.js:58), nivelDeCalculo (level_cap.js:65), buildSynergyHtml (dex_ficha.js:42), state (nucleo.js:8) | chamado por: selectSpecies (dex_ficha.js:599)
- updateMyBuildEvTotal:332 - chama: clampInt (dados_base.js:103)
- updateMyBuildStatus:362 - chama: ITEM_MOVE_POWER_MODS (calc_stat.js:132), calcFinalStat (calc_stat.js:160), itemRuleFor (calc_stat.js:149), MOVE_BY_NAME (dados_base.js:86), SPLIT_STATUS (dados_base.js:29), +6
- wireMyBuildEditor:465 - chama: getActiveBuild (evolucao.js:16), nivelDeCalculo (level_cap.js:65), myBuildLevel (aba_chefoes.js:19), myBuildLevelIsCustom (aba_chefoes.js:31), pipelineDesenharFicha (pipeline_tela.js:113) | chamado por: selectSpecies (dex_ficha.js:599)

## ui/ficha_extras.js
- bossReferenceHtml:103 - chama: DIFF_LABELS (aba_chefoes.js:233), buildEntryHtml (editor_build.js:182) | chamado por: fichaNotasHtml (dex_ficha.js:591)
- buildHistoryHtml:87 - chama: buildEntryHtml (editor_build.js:182) | chamado por: fichaNotasHtml (dex_ficha.js:591), renderTeam (time.js:8)
- compareCardHtml:14 - chamado por: selectSpecies (dex_ficha.js:599)
- compareResultHtml:22 - chama: effectiveBuild (builds.js:202), stripNote (builds.js:49), speciesTypeNames (tipos.js:254), STAT_LABELS_SHORT (aba_chefoes.js:555), rankBadgeHtml (dex_ficha.js:169), +1
- megaLockedTagHtml:199 - chama: isMegaForm (formas_mega.js:71), megaFormLiberada (formas_mega.js:109), megaSoNoDebug (formas_mega.js:110), quandoMega (formas_mega.js:112), rotuloEtapaDaMega (formas_mega.js:113) | chamado por: renderBox (caixa.js:16), renderTeam (time.js:8)
- notesCardHtml:78 - chama: state (nucleo.js:8) | chamado por: fichaNotasHtml (dex_ficha.js:591)
- otherFormsHtml:206 - chama: formFamilyOf (formas_mega.js:65), isMegaForm (formas_mega.js:71), megaFormLiberada (formas_mega.js:109), megaSoNoDebug (formas_mega.js:110), quandoMega (formas_mega.js:112), +1 | chamado por: renderTeam (time.js:8)
- planoDaBuildHtml:179 - chama: buildNoteHtml (editor_build.js:155) | chamado por: myBuildEditorHtml (editor_build.js:223), renderTeam (time.js:8)
- rotuloDaBuild:170 - chama: ESTILO_ROTULO (plano_build.js:20), SUGESTAO_ROTULO (sugestao_do_motor.js:11) | chamado por: renderTeam (time.js:8)

## ui/ia.js
- aplicarCuradaNoTimeNovo:153 - chama: getActiveBuild (evolucao.js:16), getBuildList (evolucao.js:14), logAutoAction (evolucao.js:229), curadaParaEstilo (plano_build.js:160), estiloDoRitmo (plano_build.js:48), +6 | chamado por: generateCompleteTeam (arquetipo.js:292)
- generateBuildWithAI:278 - chama: candidatosParaAEscolhaDaIa (escolha_ia_candidatos.js:204), escolherCandidatoDaIa (escolha_ia_candidatos.js:171), montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:87), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), textoDaRetentativaDeBuild (gravacao_build_ia.js:35), +4 | chamado por: processarRevisoes (revisao_automatica.js:72)
- gerarBuildsDoTimeComIA:176 - chama: concluirBuildDoLote (builds.js:119), candidatosParaAEscolhaDaIa (escolha_ia_candidatos.js:204), escolherCandidatoDaIa (escolha_ia_candidatos.js:171), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:105), getBuildList (evolucao.js:14), +7 | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308), generateCompleteTeam (arquetipo.js:292)
- gerarPlanoParaBuild:342 - chama: gravarPlanoDaIa (gravacao_build_ia.js:134), getCurrentCap (level_cap.js:49), montarPromptPlano (prompts_ia.js:709), acao (nucleo.js:243), telasDeBuild (nucleo.js:237) | chamado por: processarRevisoes (revisao_automatica.js:72)
- gravarBuildValidadaDaIa:141 - chama: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105), flashToast (dex_lista.js:473), acao (nucleo.js:243), telasDeBuild (nucleo.js:237)
- opcoesDaIA:72 - chama: buildStandardAiTools (ferramentas_ia.js:249)
- pedirIA:80 - chamado por: generateTeamForArchetype (arquetipo.js:153), generateTeamUsageGuide (arquetipo.js:260), generateStrategySets (revisao_automatica.js:182)
- pedirIAAgora:109 - chama: sampleErrorMessage (prompts_ia.js:156)

## ui/modo_motor.js
- modoDeMontagem:9 - chamado por: archetypeCardHtml (arquetipo.js:85), renderTeamStrategy (arquetipo.js:463)
- modoMotorAquecer:40 - chama: contextoDoMotor (time_pelo_motor.js:140), motorAquecerBuildsEmPassos (time_pelo_motor.js:228) | chamado por: renderTeamStrategy (arquetipo.js:463)
- modoMotorBotaoHtml:172 - chamado por: archetypeCardHtml (arquetipo.js:85)
- modoMotorCache:19 - chama: criarCacheDoMotor (time_pelo_motor.js:64)
- modoMotorCapturados:26 - chama: getSpeciesByX (dados_base.js:78), xsDoJogador (liberado_na_run.js:38), state (nucleo.js:8)
- modoMotorChave:21 - chama: megaMode (formas_mega.js:82), capOuPadrao (level_cap.js:61), levelCapMode (level_cap.js:16), xsDoJogador (liberado_na_run.js:38), state (nucleo.js:8)
- modoMotorFavoritosHtml:160 - chamado por: archetypeCardHtml (arquetipo.js:85)
- modoMotorFavoritosValidos:31 - chama: state (nucleo.js:8)
- modoMotorFicarComVariante:119 - chama: getSpeciesByX (dados_base.js:78), SUGESTAO_ROTULO (sugestao_do_motor.js:11), gravarSugestoesDoMotor (sugestao_do_motor.js:61), planoDeGravarSugestoes (sugestao_do_motor.js:39), applyRecommendedTeam (arquetipo.js:207), +4
- modoMotorMembroHtml:177 - chama: MOTOR_FRASE_DA_PROVA (time_pelo_motor_papeis.js:317)
- modoMotorMontar:68 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:185), xsDoJogador (liberado_na_run.js:38), serveProMono (mono_run.js:74), contextoDoMotor (time_pelo_motor.js:140), +3
- modoMotorResultadoHtml:233 - chamado por: renderTeamStrategy (arquetipo.js:463)
- modoMotorRodapeHtml:190 - chama: SUGESTAO_ROTULO (sugestao_do_motor.js:11)
- modoMotorSeletorHtml:152 - chamado por: archetypeCardHtml (arquetipo.js:85)

## ui/nucleo.js
- STORE_KEY:82 - chamado por: aplicarSaveRemoto (sync.js:45), lerSaveLocal (sync.js:174)
- TELAS:205 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308), applyRecommendedTeam (arquetipo.js:207), generateCompleteTeam (arquetipo.js:292), processarRevisoes (revisao_automatica.js:72)
- abrirVagaPreservando:118 - chama: buildQueSaiParaAbrirVaga (lista_de_builds.js:43) | chamado por: aplicarCuradaNoTimeNovo (ia.js:153), processarRevisoes (revisao_automatica.js:72)
- acao:243 - chamado por: guardarTimeAnterior (aba_chefoes.js:266), initBosses (aba_chefoes.js:33), applyRecommendedTeam (arquetipo.js:207), aplicarCuradaNoTimeNovo (ia.js:153), gerarPlanoParaBuild (ia.js:342), +10
- addBuildVariant:101 - chama: acrescentarVarianteNaLista (lista_de_builds.js:23) | chamado por: aplicarCuradaNoTimeNovo (ia.js:153), processarRevisoes (revisao_automatica.js:72)
- concluirAcoes:266 - chama: agendarRevisoes (revisao_automatica.js:169)
- fichaAfetada:261 - chama: getSpeciesByX (dados_base.js:78)
- loadA11yPrefs:285 - chamado por: initProgress (progresso.js:105)
- loadSave:337 - chama: applySave (save.js:49), conferirSomaDoSave (save.js:329), reconciliouAoAplicar (save.js:44), autoEvolveRoster (auto_evolucao.js:20)
- lsGet:84 - chamado por: ponteFalhas (revisao_automatica.js:22), lerSaveLocal (sync.js:174)
- lsSet:85 - chamado por: registrarFalhaPonte (revisao_automatica.js:23), aplicarSaveRemoto (sync.js:45)
- persist:144 - chama: buildSave (save.js:339), updateResetTeamBoxBtn (dex_ficha.js:740), pushToSync (sync.js:96) | chamado por: aplicarSaveRemoto (sync.js:45)
- redesenharFichaAberta:197 - chama: selectSpecies (dex_ficha.js:599)
- reinserirBuild:131 - chama: getBuildList (evolucao.js:14) | chamado por: apagarBuildComDesfazer (editor_build.js:516)
- removeBuildIndex:124 - chama: removerBuildDaLista (lista_de_builds.js:32) | chamado por: apagarBuildComDesfazer (editor_build.js:516)
- saveA11yPrefs:295 - chamado por: initProgress (progresso.js:105)
- setActiveBuildIndex:104 - chama: getBuildList (evolucao.js:14)
- setOrReplaceActiveBuild:94 - chama: trocarBuildAtivaNaLista (lista_de_builds.js:11) | chamado por: initBosses (aba_chefoes.js:33), aplicarCuradaNoTimeNovo (ia.js:153), processarRevisoes (revisao_automatica.js:72)
- showStorageBanner:166 - chamado por: remotoComSomaErrada (sync.js:88)
- state:8 - chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:202), itensEmUsoComQuem (builds.js:153), teamItemsInUse (builds.js:90), teamMovesInUse (builds.js:123), +106
- telasDeBuild:237 - chamado por: aplicarCuradaNoTimeNovo (ia.js:153), gerarPlanoParaBuild (ia.js:342), gravarBuildValidadaDaIa (ia.js:141), processarRevisoes (revisao_automatica.js:72)

## ui/pipeline_tela.js
- pipelineAlvoValido:26 - chama: getRemainingBossEntries (chefoes.js:63)
- pipelineCandidatoHtml:77 - chamado por: quemResolveItemHtml (quem_resolve.js:43)
- pipelineDesenharFicha:113 - chamado por: wireMyBuildEditor (editor_build.js:465)
- pipelineDesenharTime:125 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: renderTeam (time.js:8)
- pipelineGolpeHtml:71 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9)
- pipelineResultado:14 - chama: getCurrentCap (level_cap.js:49), candidatosDeBuild (pipeline_build.js:530), state (nucleo.js:8)
- pipelineSeletorDeAlvoHtml:32 - chama: getRemainingBossEntries (chefoes.js:63)

## ui/progresso.js
- initProgress:105 - chama: bossPartyPorDificuldade (chefoes.js:339), confrontoParaParty (chefoes.js:310), getRemainingBossEntries (chefoes.js:63), varianteDoChefao (chefoes.js:370), logAutoAction (evolucao.js:229), +16
- renderCapBadge:17 - chama: getCurrentCap (level_cap.js:49)
- renderCapDisplay:21 - chama: getCurrentCap (level_cap.js:49)
- renderProgressTrail:30 - chama: state (nucleo.js:8)
- renderRunStatus:9 - chama: state (nucleo.js:8)

## ui/quem_resolve.js
- quemResolveCalcular:22 - chama: especiesQueResolvem (pipeline_build.js:653)
- quemResolveCardHtml:83 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), DIFF_LABELS (aba_chefoes.js:233), state (nucleo.js:8) | chamado por: renderBossDetail (aba_chefoes.js:556)
- quemResolveChave:17 - chama: getCurrentCap (level_cap.js:49), state (nucleo.js:8)
- quemResolveItemHtml:43 - chama: pipelineCandidatoHtml (pipeline_tela.js:77)
- quemResolveOrigemHtml:37 - chama: rankDe (rank_da_run.js:29)
- quemResolvePreencher:66 - chama: bossState (aba_chefoes.js:13)
- quemResolveRestaurar:103 - chama: bossState (aba_chefoes.js:13) | chamado por: renderBossDetail (aba_chefoes.js:556)

## ui/resumo_luta.js
- bossConfrontoHtml:96 - chama: confrontoParaParty (chefoes.js:310) | chamado por: renderBossDetail (aba_chefoes.js:556)
- boxFitNote:154 - chama: computeSharedRisks (chefoes.js:121), battleUnitsOf (formas_mega.js:185), unitTypeMult (formas_mega.js:201) | chamado por: renderBox (caixa.js:16)
- confrontoAjustesHtml:44 - chama: coberturaSugerida (confronto.js:196)
- confrontoPlanoHtml:67 - chama: aberturaEmDupla (confronto.js:319), cuidadosDoChefao (confronto.js:302)
- dashboardConfrontoHtml:135 - chama: bossPartyPorDificuldade (chefoes.js:339), confrontoParaParty (chefoes.js:310)
- megaOfNote:175 - chama: isMegaForm (formas_mega.js:71), megaMode (formas_mega.js:82)
- nextFightDetailHtml:215 - chama: bestBoxCandidateForBoss (chefoes.js:195), bestRankForm (chefoes.js:345), bossSpeedSummary (chefoes.js:144)
- renderDashboard:183 - chama: computeSharedRisks (chefoes.js:121), getRemainingBossEntries (chefoes.js:63), nextFightCx (chefoes.js:363), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: scheduleDashboardRefresh (dex_ficha.js:726)
- renderNextFightCard:257 - chama: getRemainingBossEntries (chefoes.js:63), nextFightCx (chefoes.js:363), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: renderTeam (time.js:8)

## ui/revisao_automatica.js
- agendarRevisoes:169 - chamado por: concluirAcoes (nucleo.js:266)
- capRegistrado:148 - chamado por: initProgress (progresso.js:105), aplicarSaveRemoto (sync.js:45), zerarRun (time.js:362)
- generateStrategySets:182 - chama: getCurrentCap (level_cap.js:49), ctxDoState (prompts_ia.js:16), montarPromptEstrategias (prompts_ia.js:656), sanitizarStrategySets (save.js:258), setsValidosDaResposta (validacao_build_ia.js:480), +3
- ponteFalhas:22 - chama: lsGet (nucleo.js:84)
- processarRevisoes:72 - chama: golpesFuturosDe (builds.js:179), getSpeciesByX (dados_base.js:78), getBuildList (evolucao.js:14), logAutoAction (evolucao.js:229), getCurrentCap (level_cap.js:49), +13
- registrarFalhaPonte:23 - chama: lsSet (nucleo.js:85)
- registrarTrocasDoPlano:149 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), logAutoAction (evolucao.js:229), trocasEntreCaps (plano_build.js:141), renderAutoLog (auto_evolucao.js:9), +1 | chamado por: initProgress (progresso.js:105)
- revisaoStatusHtml:44 - chama: getSpeciesBySname (dados_base.js:79), getActiveBuild (evolucao.js:16) | chamado por: renderTeam (time.js:8)
- tarefaDeRevisao:24 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), MEGA_BASE_BY_X (formas_mega.js:21), isMegaForm (formas_mega.js:71), golpesTravadosNoCap (level_cap.js:90), +3

## ui/sync.js
- aplicarSaveRemoto:45 - chama: getCurrentCap (level_cap.js:49), applySave (save.js:49), buildSave (save.js:339), reconciliouAoAplicar (save.js:44), STORE_KEY (nucleo.js:82), +3
- conflitoDeProgresso:61 - chama: saveChegandoTemMenosProgresso (save.js:386)
- connectSync:179 - chama: buildSave (save.js:339), saveEnviavel (save.js:336), syncContentDiffers (save.js:400)
- lerSaveLocal:174 - chama: STORE_KEY (nucleo.js:82), lsGet (nucleo.js:84)
- pushToSync:96 - chamado por: persist (nucleo.js:144)
- remotoComSomaErrada:88 - chama: conferirSomaDoSave (save.js:329), saveEnviavel (save.js:336), showStorageBanner (nucleo.js:166)

## ui/time.js
- TELAS_ELENCO:168 - chamado por: applyRecommendedTeam (arquetipo.js:207), initProgress (progresso.js:105)
- carregarTimeSalvo:251 - chama: snamesToXs (save.js:15), acao (nucleo.js:243), state (nucleo.js:8)
- excluirTimeSalvo:279 - chama: openConfirmModal (dex_lista.js:403), acao (nucleo.js:243), state (nucleo.js:8)
- renderSavedTeams:227 - chama: getSpeciesByX (dados_base.js:78), snamesToXs (save.js:15), state (nucleo.js:8)
- renderTeam:8 - chama: effectiveBuild (builds.js:202), showdownSet (builds.js:58), ABILITIES (dados_base.js:10), getSpeciesByX (dados_base.js:78), habilidadesEscolhiveis (dados_base.js:119), +20
- rosterMove:178 - chama: getSpeciesByX (dados_base.js:78), acao (nucleo.js:243), state (nucleo.js:8) | chamado por: initBosses (aba_chefoes.js:33)
- salvarNomeTimeSalvo:303 - chama: acao (nucleo.js:243), state (nucleo.js:8)
- swapPanelHtml:144 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- telasDeElenco:170 - chama: getSpeciesByX (dados_base.js:78)
- zerarRun:362 - chama: logAutoAction (evolucao.js:229), getCurrentCap (level_cap.js:49), myBuildLevelIsCustom (aba_chefoes.js:31), generatedTeamResult (arquetipo.js:35), teamRecommendation (arquetipo.js:30), +4

## ui/tipos.js
- computeRoleCompendium:91 - chama: ROLE_LABEL_PT (dados_base.js:181), SPECIES (dados_base.js:52), rankDe (rank_da_run.js:29), speciesTypeNames (tipos.js:254), state (nucleo.js:8)
- renderRoleCompendium:113 - chama: rankBadgeHtml (dex_ficha.js:169)
- renderSpeedTiers:35 - chama: SPEEDTIER_NATURE (chefoes.js:527), computeSpeedTiers (chefoes.js:529), speciesTypeNames (tipos.js:254), state (nucleo.js:8)
- renderTypeMatrix:9 - chama: USABLE_TYPES (dados_base.js:132), typeMultiplier (tipos.js:244)
