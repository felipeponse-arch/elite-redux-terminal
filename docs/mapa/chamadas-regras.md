# Chamadas entre arquivos - src/regras/

Gerado por `npm run mapa` (scripts/mapa_chamadas.mjs, API do TypeScript); não edite à mão.
Por função de nível superior: `chama:` e `chamado por:` funções de OUTROS arquivos de src/regras e src/ui, como `nome (arquivo:linha)`;
no máximo 5 por lista, o resto vira `+N`. Referência vale também como callback. Chamada pelo template/HTML não aparece. Mapa geral: [mapa-do-codigo.md](../mapa-do-codigo.md).

## regras/avisos_build.js
- avisosDaBuild:8 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itensEmUsoComQuem (builds.js:151), stripNote (builds.js:49), garantiaDaCondicao (condicoes_habilidade.js:156), nomesDeHabilidades (condicoes_habilidade.js:128), +14 | chamado por: buildContextNotesHtml (editor_build.js:161)
- ondeAcharItemTexto:100 - chamado por: itemDescHtml (editor_build.js:45)
- primeiroLugarDoItem:94 - chamado por: etapaDoItem (liberado_na_run.js:18), itensAindaIndisponiveisParaIA (prompts_ia.js:382)
- rotuloDaEtapaDoItem:98 - chamado por: blocoItensAindaIndisponiveisIA (prompts_ia.js:387)
- seloDaBuild:82 - chamado por: seloDaBuildHtml (editor_build.js:168)

## regras/builds.js
- BUILD_SOURCES:17 - chamado por: applySave (save.js:43)
- MAX_MESMO_ITEM_NO_TIME:150 - chamado por: avisosDaBuild (avisos_build.js:8), blocoTimeCurtoIA (escolha_ia_candidatos.js:55), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103), blocoItensComunsIA (prompts_ia.js:393), blocoTimeEmUsoIA (prompts_ia.js:423), +4
- comecarLoteDeBuilds:118 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337), generateCompleteTeam (arquetipo.js:302)
- concluirBuildDoLote:119 - chamado por: generateCompleteTeam (arquetipo.js:302), gerarBuildsDoTimeComIA (ia.js:176)
- effectiveBuild:200 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), MEGA_BASE_BY_X (formas_mega.js:21), isMegaForm (formas_mega.js:64), getCurrentCap (level_cap.js:49), +6 | chamado por: confrontoUnitOf (chefoes.js:233), descricaoTimeParaGuia (prompts_ia.js:875), montarPromptTimeArquetipo (prompts_ia.js:823), computeTeamGenerationValidation (arquetipo.js:253), compareResultHtml (ficha_extras.js:22), +1
- encerrarLoteDeBuilds:120 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337), generateCompleteTeam (arquetipo.js:302)
- entradaDeBuild:23 - chama: getSpeciesBySname (dados_base.js:79), getCurrentCap (level_cap.js:49), planoSaneado (plano_build.js:107) | chamado por: acrescentarVarianteNaLista (lista_de_builds.js:23), trocarBuildAtivaNaLista (lista_de_builds.js:11), gravarSugestoesDoMotor (sugestao_do_motor.js:61)
- evsToShowdownText:75 - chama: ROTULOS_EV (plano_build.js:21) | chamado por: myBuildEditorHtml (editor_build.js:223), strategySetsHtml (editor_build.js:432)
- golpesFuturosDe:177 - chama: MOVES (dados_base.js:11), nivelDeEvolucaoDaForma (plano_build.js:68), nivelDoGolpe (plano_build.js:56) | chamado por: blocoPlanoCurtoIA (escolha_ia_candidatos.js:72), planoPromptBlock (prompts_ia.js:158), processarRevisoes (revisao_automatica.js:72)
- itensEmUsoComQuem:151 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:423), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:517), validateAiBuild (validacao_build_ia.js:214)
- showdownSet:58 - chamado por: initBosses (aba_chefoes.js:33), buildEntryHtml (editor_build.js:182), myBuildEditorHtml (editor_build.js:223), strategySetsHtml (editor_build.js:432), renderTeam (time.js:8)
- stripNote:49 - chamado por: avisosDaBuild (avisos_build.js:8), aiTool_getItemInfo (ferramentas_ia.js:150), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:517), hpEvEfficiencyNote (editor_build.js:83), itemDescHtml (editor_build.js:45), +1
- teamItemsInUse:90 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- teamMovesInUse:123 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:423)
- teamRolesInUse:163 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:423)

## regras/calc_stat.js
- ITEM_MOVE_POWER_MODS:105 - chamado por: updateMyBuildStatus (editor_build.js:362)
- calcFinalStat:119 - chama: NATURE_MODS (dados_base.js:90) | chamado por: computeSpeedTiers (chefoes.js:495), foeDeDuelo (duelo.js:3024), unidadeDeDuelo (duelo.js:3060), linhaVelocidadeIA (prompts_ia.js:490), bossMonCardHtml (aba_chefoes.js:493), +2
- itemRuleFor:106 - chamado por: bossMonCardHtml (aba_chefoes.js:493), updateMyBuildStatus (editor_build.js:362)
- minEvSameStat:157 - chamado por: evBreakpointNote (editor_build.js:116)
- trimAndReallocateEvs:195 - chamado por: validateAiBuild (validacao_build_ia.js:214)

## regras/chefoes.js
- DIFF_TO_BOSSKEY:19 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorLutasComunsDoContexto (time_pelo_motor.js:108), motorMontarLuta (time_pelo_motor.js:79), quemResolveCardHtml (quem_resolve.js:83)
- LUTAS_DA_RUN:314 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorLutasDoContexto (time_pelo_motor.js:123)
- SPEEDTIER_NATURE:493 - chamado por: renderSpeedTiers (tipos.js:35)
- bestBoxCandidateForBoss:183 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:223), unitTypeMult (formas_mega.js:239), serveProMono (mono_run.js:75), rankDe (rank_da_run.js:28), +1 | chamado por: aiTool_getBoxCandidatesForBoss (ferramentas_ia.js:182), linhasProximaLutaIA (prompts_ia.js:506), nextFightDetailHtml (resumo_luta.js:215)
- bestRankForm:333 - chama: battleUnitsOf (formas_mega.js:223), rankDe (rank_da_run.js:28) | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- bossPartyPorDificuldade:327 - chama: state (nucleo.js:8) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), avisoProximoLider (mono_run.js:159), pipelineResolverAlvo (pipeline_build.js:71), linhasProximaLutaIA (prompts_ia.js:506), motorMontarLuta (time_pelo_motor.js:79), +2
- bossSafetyScore:171 - chama: unitTypeMult (formas_mega.js:239)
- bossSpeedSummary:132 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- buffsAtivosDoChefao:482 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:79), contextoDeValidacao (validacao_build_ia.js:197), montarTimeContraEsteChefao (aba_chefoes.js:337)
- buffsParaMostrarDoChefao:473 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337), buffsMudaram (arquetipo.js:383)
- comportamentoDaIADoChefao:433 - chamado por: iaDoChefaoHtml (aba_chefoes.js:190)
- computeBossAttackTypes:147 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9), moveRoleOf (golpes.js:53), state (nucleo.js:8)
- computeSharedRisks:109 - chama: USABLE_TYPES (dados_base.js:128), abilityTypeMod (tipos.js:169) | chamado por: linhaDeFraquezasDoTimeIA (escolha_ia_candidatos.js:51), aiTool_getTeamWeaknesses (ferramentas_ia.js:15), blocoPapelIA (prompts_ia.js:312), computeTeamGenerationValidation (arquetipo.js:253), renderTeamAnalysis (arquetipo.js:599), +2
- computeSpeedTiers:495 - chama: calcFinalStat (calc_stat.js:119), SPECIES (dados_base.js:52), nivelDeCalculo (level_cap.js:63) | chamado por: aiTool_getSpeedBenchmark (ferramentas_ia.js:204), linhaVelocidadeIA (prompts_ia.js:490), renderSpeedTiers (tipos.js:35)
- confrontoFoesDe:258 - chama: foeFromBossMember (confronto.js:49), getSpeciesBySname (dados_base.js:79) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), linhasProximaLutaIA (prompts_ia.js:506)
- confrontoMelhorUnidade:269 - chama: confrontoTime (confronto.js:146), battleUnitsOf (formas_mega.js:223)
- confrontoMinhasUnidades:279 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- confrontoParaParty:298 - chama: confrontoTime (confronto.js:146), melhoresTrocas (confronto.js:265) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), linhasProximaLutaIA (prompts_ia.js:506), initProgress (progresso.js:105), bossConfrontoHtml (resumo_luta.js:96), dashboardConfrontoHtml (resumo_luta.js:135)
- confrontoUnidadesDaCaixa:289 - chama: getSpeciesByX (dados_base.js:78), serveProMono (mono_run.js:75), state (nucleo.js:8)
- confrontoUnitOf:233 - chama: effectiveBuild (builds.js:200), ABILITY_ID_BY_NAME (confronto.js:17), availableMovesFor (level_cap.js:71), alwaysActiveAbilities (tipos.js:160), speciesTypeNames (tipos.js:250)
- ehRevancheDeLider:454 - chamado por: linhasProximaLutaIA (prompts_ia.js:506), renderGymSkillsCardHtml (aba_chefoes.js:456)
- getRemainingBossEntries:51 - chama: state (nucleo.js:8) | chamado por: aiTool_getBoxCandidatesForBoss (ferramentas_ia.js:182), aiTool_getNextBossRoster (ferramentas_ia.js:120), aiTool_getRemainingBosses (ferramentas_ia.js:159), avisoProximoLider (mono_run.js:159), pipelineResolverAlvo (pipeline_build.js:71), +7
- gymLeaderBaseName:45 - chamado por: avisoProximoLider (mono_run.js:159), linhasProximaLutaIA (prompts_ia.js:506), renderGymSkillsCardHtml (aba_chefoes.js:456)
- gymSkillsSummaryFor:367 - chama: state (nucleo.js:8) | chamado por: linhasProximaLutaIA (prompts_ia.js:506), renderGymSkillsCardHtml (aba_chefoes.js:456)
- nextFightCx:351 - chamado por: renderDashboard (resumo_luta.js:183), renderNextFightCard (resumo_luta.js:257)
- regraDeCampoDoChefao:416 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), linhasProximaLutaIA (prompts_ia.js:506), motorMontarLuta (time_pelo_motor.js:79), campoDoChefaoHtml (aba_chefoes.js:178), montarTimeContraEsteChefao (aba_chefoes.js:337)
- regrasDoHell:447 - chamado por: hellDoChefaoHtml (aba_chefoes.js:199)
- varianteDoChefao:358 - chama: state (nucleo.js:8) | chamado por: selectBoss (aba_chefoes.js:437), initProgress (progresso.js:105)

## regras/condicoes_habilidade.js
- NOME_DA_CONDICAO:42 - chamado por: objetivoDaEscolhaIA (escolha_ia_candidatos.js:80), contextoDoModoPrompt (prompts_ia.js:168), montarPromptBuildsDoTime (prompts_ia.js:665), planoContraChefaoHtml (arquetipo.js:387)
- blocoCondicoesIA:239 - chamado por: montarPromptBuild (prompts_ia.js:610), montarPromptBuildsDoTime (prompts_ia.js:665), montarPromptEstrategias (prompts_ia.js:713)
- comoGarantir:172 - chama: ITEMS (dados_base.js:12), availableMovesFor (level_cap.js:71), megaStoneRuleFor (validacao_build_ia.js:14)
- condicaoDaBuild:191 - chamado por: validateAiBuild (validacao_build_ia.js:214)
- descricaoDeHabilidade:89 - chama: ABILITIES (dados_base.js:10)
- descricaoDeHabilidadePorId:100 - chama: ABILITIES (dados_base.js:10) | chamado por: textoHabDuelo (duelo.js:203)
- expandirTextoDeHabilidade:111 - chama: ABILITIES (dados_base.js:10), LIDO_PELO_TEXTO_NOVO_DUELO (duelo.js:201), TEXTO_DA_VERSAO_NOVA_DUELO (duelo.js:50) | chamado por: textoHabDuelo (duelo.js:203)
- garantiaDaCondicao:156 - chama: ITEMS (dados_base.js:12) | chamado por: avisosDaBuild (avisos_build.js:8)
- garantiaDoTime:142 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), state (nucleo.js:8)
- habilidadeArma:125 - chamado por: armadoresDeClima (duelo.js:3218), climaDoTimeDoChefao (duelo.js:3049), efeitoDasHabilidadesNoDuelo (duelo.js:1467), habilidadeSemRegraNoDuelo (duelo.js:1774)
- nomesDeHabilidades:128 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:118) | chamado por: avisosDaBuild (avisos_build.js:8), nivelDaHabilidadeNoElite (level_cap.js:40)
- podeTerStatus:134 - chama: speciesTypeNames (tipos.js:250)
- precisaDeSetter:214 - chama: availableMovesFor (level_cap.js:71) | chamado por: avisosDaBuild (avisos_build.js:8), marcasDoRankHtml (dex_ficha.js:297)

## regras/confronto.js
- ABILITY_ID_BY_NAME:17 - chamado por: confrontoUnitOf (chefoes.js:233), climaDoTimeDoChefao (duelo.js:3049), foeDeDuelo (duelo.js:3024), montarTimeNoClimaEmPassos (duelo.js:4549), unidadeDaBuild (duelo.js:3157), +5
- aberturaEmDupla:319 - chamado por: confrontoPlanoHtml (resumo_luta.js:67)
- ameacaDe:91 - chama: MOVE_BY_NAME (dados_base.js:86), abilityTypeModFor (tipos.js:192)
- coberturaSugerida:196 - chama: MOVE_BY_NAME (dados_base.js:86), moveRoleOf (golpes.js:53), abilityTypeModFor (tipos.js:192), speciesTypeNames (tipos.js:250) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), linhasProximaLutaIA (prompts_ia.js:506), confrontoAjustesHtml (resumo_luta.js:44)
- confrontoDamagingMoves:29 - chama: MOVE_BY_NAME (dados_base.js:86), moveRoleOf (golpes.js:53)
- confrontoMoveType:32 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9)
- confrontoTime:146 - chamado por: confrontoMelhorUnidade (chefoes.js:269), confrontoParaParty (chefoes.js:298)
- cuidadosDoChefao:302 - chamado por: confrontoPlanoHtml (resumo_luta.js:67)
- foeFromBossMember:49 - chama: getSpeciesByX (dados_base.js:78) | chamado por: confrontoFoesDe (chefoes.js:258)
- melhoresTrocas:265 - chamado por: confrontoParaParty (chefoes.js:298)
- ofensaContra:59 - chama: MOVE_BY_NAME (dados_base.js:86), abilityTypeModFor (tipos.js:192), speciesTypeNames (tipos.js:250)

## regras/dados_base.js
- ABILITIES:10 - chamado por: descricaoDeHabilidade (condicoes_habilidade.js:89), descricaoDeHabilidadePorId (condicoes_habilidade.js:100), expandirTextoDeHabilidade (condicoes_habilidade.js:111), nomesDeHabilidades (condicoes_habilidade.js:128), efeitoDasHabilidadesNoDuelo (duelo.js:1467), +23
- ALL_NATURES:101 - chamado por: fecharBuild (pipeline_build.js:697), validateAiBuild (validacao_build_ia.js:214), myBuildEditorHtml (editor_build.js:223)
- EVOKINDS:13 - chamado por: evolveChainByX (evolucao.js:66), isMegaEvoKind (formas_mega.js:22), nivelDeEvolucaoDaForma (plano_build.js:68), evoConditionText (dex_ficha.js:88)
- EVO_LEVEL:30 - chamado por: evolveChainByX (evolucao.js:66), nivelDeEvolucaoDaForma (plano_build.js:68)
- EVO_LEVEL_FEMALE:32 - chamado por: evoConditionText (dex_ficha.js:88)
- EVO_LEVEL_MALE:31 - chamado por: evoConditionText (dex_ficha.js:88)
- EVO_MEGA_KINDS:34 - chamado por: isMegaEvoKind (formas_mega.js:22), evoConditionText (dex_ficha.js:88)
- EVO_PRIMAL:33 - chamado por: isMegaEvoKind (formas_mega.js:22), evoConditionText (dex_ficha.js:88)
- ITEMS:12 - chamado por: comoGarantir (condicoes_habilidade.js:172), garantiaDaCondicao (condicoes_habilidade.js:156), orientacaoMono (mono_run.js:145), pipelineEvioliteServe (pipeline_build.js:488), pipelineValidarRascunho (pipeline_build.js:493), +7
- MAPS:49 - chamado por: howToObtainText (dex_ficha.js:245), whereToFindText (dex_ficha.js:275)
- MONOTYPE_ARCHETYPES:154 - chamado por: applySave (save.js:43), archetypeCardHtml (arquetipo.js:85)
- MOVES:11 - chamado por: golpesFuturosDe (builds.js:177), acertosDoGolpeDuelo (duelo.js:232), efeitoDoPlanoDuelo (duelo.js:3546), escolherProximoDoChefao (duelo.js:4078), golpeUtilNoDuelo (duelo.js:237), +22
- MOVE_BY_NAME:86 - chamado por: computeBossAttackTypes (chefoes.js:147), ameacaDe (confronto.js:91), coberturaSugerida (confronto.js:196), confrontoDamagingMoves (confronto.js:29), confrontoMoveType (confronto.js:32), +7
- MOVE_ID_BY_NAME:87 - chamado por: danoDoFuturoDuelo (duelo.js:2740), foeDeDuelo (duelo.js:3024), lerCondicaoDaFraseDuelo (duelo.js:480), lerDiversosDaFraseDuelo (duelo.js:670), poderDoDadoDuelo (duelo.js:2235), +9
- NATURE_MODS:90 - chamado por: calcFinalStat (calc_stat.js:119), conflitoDeNature (validacao_build_ia.js:119), validateAiBuild (validacao_build_ia.js:214)
- PACE_ARCHETYPES:142 - chamado por: applySave (save.js:43), archetypeCardHtml (arquetipo.js:85)
- ROLE_LABEL_PT:179 - chamado por: aiTool_getSpeciesRank (ferramentas_ia.js:24), blocoTimeEmUsoIA (prompts_ia.js:423), descricaoTimeParaGuia (prompts_ia.js:875), montarPromptTimeArquetipo (prompts_ia.js:823), nomePapel (prompts_ia.js:311), +2
- SPECIES:52 - chamado por: computeSpeedTiers (chefoes.js:495), especieDaFormaDuelo (duelo.js:3498), buildStandardAiTools (ferramentas_ia.js:249), especiesQueResolvem (pipeline_build.js:638), montarTimePeloMotorEmPassos (time_pelo_motor.js:435), +3
- SPECIES_BY_SNAME:72 - chamado por: snamesToXs (save.js:15)
- SPLIT_LABEL_PT:180 - chamado por: aiTool_getSpeciesRank (ferramentas_ia.js:24), roleTagsHtml (dex_ficha.js:224)
- SPLIT_STATUS:29 - chamado por: moveRoleOf (golpes.js:53), conflitoDeItem (validacao_build_ia.js:136), updateMyBuildStatus (editor_build.js:362)
- TATICA_ARCHETYPES:147 - chamado por: applySave (save.js:43), archetypeCardHtml (arquetipo.js:85)
- TYPES:9 - chamado por: computeBossAttackTypes (chefoes.js:147), confrontoMoveType (confronto.js:32), efeitoDasHabilidadesNoDuelo (duelo.js:1467), escolherProximoDoChefao (duelo.js:4078), lerDiversosDaFraseDuelo (duelo.js:670), +11
- USABLE_TYPES:128 - chamado por: computeSharedRisks (chefoes.js:109), fraquezasDoTipo (mono_run.js:81), resistemAoTipo (mono_run.js:84), applySave (save.js:43), perfilDefensivoDaEspecie (tipos.js:175), +2
- WEATHER_ARCHETYPES:143 - chamado por: applySave (save.js:43), archetypeCardHtml (arquetipo.js:85)
- clampInt:103 - chamado por: applySave (save.js:43), sanitizarStrategySets (save.js:242), limitarEvsAoJogo (validacao_build_ia.js:169), lerFormularioDoEditor (editor_build.js:493), updateMyBuildEvTotal (editor_build.js:332), +1
- descricaoDaEspecie:185 - chamado por: fichaCabecalhoHtml (dex_ficha.js:515)
- getSpeciesBySname:79 - chamado por: entradaDeBuild (builds.js:23), confrontoFoesDe (chefoes.js:258), efeitoDasHabilidadesNoDuelo (duelo.js:1467), foeDeDuelo (duelo.js:3024), carryUserData (evolucao.js:167), +16
- getSpeciesByX:78 - chamado por: effectiveBuild (builds.js:200), itensEmUsoComQuem (builds.js:151), teamItemsInUse (builds.js:90), teamMovesInUse (builds.js:123), teamRolesInUse (builds.js:163), +56
- snameOf:80 - chamado por: xsToSnames (save.js:24)
- uniqueIds:118 - chamado por: nomesDeHabilidades (condicoes_habilidade.js:128), armadoresDeClima (duelo.js:3218), climaDoTimeDoChefao (duelo.js:3049), comHabilidadesDuelo (duelo.js:3453), foeDeDuelo (duelo.js:3024), +26

## regras/duelo.js
- DURACAO_LADO_DUELO:3962 - chamado por: motorGanhoDaCondicao (time_pelo_motor_papeis.js:56)
- LIDO_PELO_TEXTO_NOVO_DUELO:201 - chamado por: expandirTextoDeHabilidade (condicoes_habilidade.js:111)
- TEXTO_DA_VERSAO_NOVA_DUELO:50 - chamado por: expandirTextoDeHabilidade (condicoes_habilidade.js:111)
- acertosDoGolpeDuelo:232 - chama: MOVES (dados_base.js:11)
- aguentaUmGolpe:2257 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:147), pipelineLinhaDoGolpe (pipeline_build.js:184)
- armadoresDeClima:3218 - chama: habilidadeArma (condicoes_habilidade.js:125), uniqueIds (dados_base.js:118) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:33)
- aterradoDuelo:942 - chama: abilityTypeModFor (tipos.js:192)
- bloqueiosNoDuelo:2728 - chamado por: pipelineLinhaDoGolpe (pipeline_build.js:184)
- climaDoTimeDoChefao:3049 - chama: habilidadeArma (condicoes_habilidade.js:125), ABILITY_ID_BY_NAME (confronto.js:17), getSpeciesByX (dados_base.js:78), uniqueIds (dados_base.js:118) | chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:79), motorMontarLutaComum (time_pelo_motor.js:90)
- comHabilidadesDuelo:3453 - chama: uniqueIds (dados_base.js:118)
- conferirTimeComBuilds:3144 - chama: getActiveBuild (evolucao.js:16) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337)
- danoDoFuturoDuelo:2740 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- danoNoDuelo:2054 - chama: CLIMA_OFICIAL (mono_run.js:133) | chamado por: motorProvasDosMembros (time_pelo_motor_papeis.js:157)
- efeitoDasHabilidadesNoDuelo:1467 - chama: habilidadeArma (condicoes_habilidade.js:125), ABILITIES (dados_base.js:10), TYPES (dados_base.js:9), getSpeciesBySname (dados_base.js:79) | chamado por: pipelineSemRecuo (pipeline_build.js:481), pipelineTiposExtraDeStab (pipeline_build.js:425), validateAiBuild (validacao_build_ia.js:214)
- efeitoDoPlanoDuelo:3546 - chama: MOVES (dados_base.js:11)
- efetividadeNoDuelo:2003 - chama: TYPE_MOD_ABILITIES (tipos.js:71), abilityTypeModFor (tipos.js:192), typeMultiplier (tipos.js:240)
- entrarNoLadoDuelo:4026 - chama: typeMultiplier (tipos.js:240)
- escolherProximoDoChefao:4078 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- especieDaFormaDuelo:3498 - chama: SPECIES (dados_base.js:52)
- foeDeDuelo:3024 - chama: calcFinalStat (calc_stat.js:119), ABILITY_ID_BY_NAME (confronto.js:17), MOVE_ID_BY_NAME (dados_base.js:87), getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), +1 | chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:79), motorMontarLutaComum (time_pelo_motor.js:90)
- foesComBuffsDoGinasio:4164 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:79)
- foesComRegraDeCampo:4188 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:79)
- golpeUtilNoDuelo:237 - chama: MOVES (dados_base.js:11)
- golpesDeDueloAte:265 - chama: uniqueIds (dados_base.js:118) | chamado por: pipelineCandidatos (pipeline_build.js:521)
- golpesDeRecargaAte:258 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:118)
- golpesDeStatusAte:271 - chama: uniqueIds (dados_base.js:118)
- golpesNecessariosComPrimeiroDuelo:2249 - chamado por: pipelineAvaliarConjunto (pipeline_build.js:278), pipelineLinhaDoGolpe (pipeline_build.js:184)
- golpesNecessariosDuelo:2247 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:147)
- habilidadeSemRegraNoDuelo:1774 - chama: habilidadeArma (condicoes_habilidade.js:125), ABILITIES (dados_base.js:10), TYPE_MOD_ABILITIES (tipos.js:71) | chamado por: pipelineHabilidadesSemRegra (pipeline_build.js:381)
- inicioDaLutaComBuffs:4209 - chamado por: motorMontarLuta (time_pelo_motor.js:79)
- itemDoDuelo:988 - chama: isMegaEvoKind (formas_mega.js:22), speciesTypeNames (tipos.js:250)
- itemDoSetDuelo:1070 - chama: isMegaEvoKind (formas_mega.js:22), speciesTypeNames (tipos.js:250)
- lerCondicaoDaFraseDuelo:480 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- lerDiversosDaFraseDuelo:670 - chama: MOVE_ID_BY_NAME (dados_base.js:87), TYPES (dados_base.js:9)
- melhorUnidadeContra:3083 - chama: uniqueIds (dados_base.js:118) | chamado por: motorBuildDoCandidato (time_pelo_motor.js:170)
- meuComBuffsDoGinasio:4201 - chama: MOVES (dados_base.js:11) | chamado por: motorSimular (time_pelo_motor.js:248), motorGanhoDaCondicao (time_pelo_motor_papeis.js:56), motorSimularComClima (time_pelo_motor_papeis.js:143), motorUnidadeNaLuta (time_pelo_motor_papeis.js:23)
- modoHellDuelo:340 - chama: state (nucleo.js:8)
- montarTimeContraChefaoEmPassos:4681 - chamado por: simularSemTravarATela (aba_chefoes.js:324)
- montarTimeNoClimaEmPassos:4549 - chama: ABILITY_ID_BY_NAME (confronto.js:17), CLIMA_OFICIAL (mono_run.js:133)
- nomeHabDuelo:46 - chama: ABILITIES (dados_base.js:10) | chamado por: pipelineCandidatos (pipeline_build.js:521), pipelineHabilidadesSemRegra (pipeline_build.js:381)
- novoLadoDuelo:3968 - chamado por: motorGanhoDaCondicao (time_pelo_motor_papeis.js:56), motorSimularComClima (time_pelo_motor_papeis.js:143)
- planoDoGolpeStatus:3250 - chamado por: motorUnidade (time_pelo_motor.js:236), motorCondicoes (time_pelo_motor_papeis.js:33), motorTemTipo (time_pelo_motor_papeis.js:202)
- planosUteisDuelo:3317 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- poderDoDadoDuelo:2235 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- poderDoGolpeDuelo:567 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- prepararGolpesDuelo:1836 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9), CLIMA_OFICIAL (mono_run.js:133)
- prioBloqueadaPelaHabilidadeDuelo:1822 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:147)
- quatroGolpesDeDano:3107 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- resultadoDoDuelo:2753 - chamado por: pipelineDuelo (pipeline_build.js:174), motorGanhoDaCondicao (time_pelo_motor_papeis.js:56)
- resumoProvadoPeloSimulador:3129 - chama: MOVES (dados_base.js:11) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337)
- semGolpesDeLadoDuelo:4657 - chamado por: motorTemGolpeDeLado (time_pelo_motor.js:277)
- simularDuplaContraChefao:3756 - chamado por: motorSimular (time_pelo_motor.js:248)
- simularLutaContraChefao:4241 - chamado por: motorSimular (time_pelo_motor.js:248), motorLutaDetalhada (time_pelo_motor_papeis.js:136), motorSimularComClima (time_pelo_motor_papeis.js:143)
- simularLutaDeVerdadeContraChefao:4249 - chama: typeMultiplier (tipos.js:240)
- sinergiasDaEspecie:1416 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:118) | chamado por: aiTool_getAbilityMovepoolSynergy (ferramentas_ia.js:75), pipelineSinergiasAtivas (pipeline_build.js:233), linhasContextoDaEspecieIA (prompts_ia.js:552), habilidadeSubstitutaPara (reconciliar_build.js:26), validateAiBuild (validacao_build_ia.js:214), +2
- temPrioridadeNoCampoDuelo:2303 - chamado por: pipelineLinhaDoGolpe (pipeline_build.js:184)
- textoHabDuelo:203 - chama: descricaoDeHabilidadePorId (condicoes_habilidade.js:100), expandirTextoDeHabilidade (condicoes_habilidade.js:111), ABILITIES (dados_base.js:10)
- tipoDoTextoDuelo:292 - chama: TYPES (dados_base.js:9)
- tiposNaBatalha:3020 - chama: speciesTypeNames (tipos.js:250)
- totalDePassosContraChefao:4680 - chamado por: simularSemTravarATela (aba_chefoes.js:324)
- unidadeDaBuild:3157 - chama: ABILITY_ID_BY_NAME (confronto.js:17), MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: pipelineTabela (pipeline_build.js:247), motorUnidade (time_pelo_motor.js:236), motorGanhoDaCondicao (time_pelo_motor_papeis.js:56), motorSimularComClima (time_pelo_motor_papeis.js:143)
- unidadeDeDuelo:3060 - chama: calcFinalStat (calc_stat.js:119), uniqueIds (dados_base.js:118), innatesAtivasNoNivel (level_cap.js:34) | chamado por: motorItensCandidatos (time_pelo_motor.js:371)
- unidadeSemClima:3170 - chamado por: motorSimularComClima (time_pelo_motor_papeis.js:143)

## regras/escolha_ia_candidatos.js
- blocoDeCandidatosParaIA:33 - chama: dadoExterno (golpes.js:19), speciesTypeNames (tipos.js:250)
- blocoPlanoCurtoIA:72 - chama: golpesFuturosDe (builds.js:177), MOVES (dados_base.js:11), TYPES (dados_base.js:9), SIGLA_CATEGORIA (golpes.js:27), dadoExterno (golpes.js:19), +2
- blocoTimeCurtoIA:55 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itensEmUsoComQuem (builds.js:151), teamMovesInUse (builds.js:123), teamRolesInUse (builds.js:163), getSpeciesByX (dados_base.js:78), +3
- candidatosParaAEscolhaDaIa:201 - chama: candidatosDeBuild (pipeline_build.js:517) | chamado por: generateBuildWithAI (ia.js:278), gerarBuildsDoTimeComIA (ia.js:176)
- escolherCandidatoDaIa:168 - chamado por: generateBuildWithAI (ia.js:278), gerarBuildsDoTimeComIA (ia.js:176)
- fecharCandidatoDaEscolha:142 - chama: validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), fecharBuild (pipeline_build.js:697)
- linhaDeFraquezasDoTimeIA:51 - chama: computeSharedRisks (chefoes.js:109)
- linhaDePapelNaturalIA:47 - chama: nomePapel (prompts_ia.js:311)
- linhaDoChefaoPorEspecieIA:68 - chama: dadoExterno (golpes.js:19), linhaProvadoIA (prompts_ia.js:600)
- montarPromptEscolhaDeBuild:86 - chama: getCurrentCap (level_cap.js:49), archetypeBuildGuidance (prompts_ia.js:141), blocoItensIA (prompts_ia.js:375), cabecalhoIA (prompts_ia.js:274), versaoDosDados (prompts_ia.js:273) | chamado por: generateBuildWithAI (ia.js:278)
- montarPromptEscolhaDoTime:103 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), getSpeciesByX (dados_base.js:78), getCurrentCap (level_cap.js:49), archetypeBuildGuidance (prompts_ia.js:141), blocoItensComunsIA (prompts_ia.js:393), +4 | chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- objetivoDaEscolhaIA:80 - chama: NOME_DA_CONDICAO (condicoes_habilidade.js:42), dadoExterno (golpes.js:19)
- respostaForaDoCandidato:132 - chama: dadoExterno (golpes.js:19)
- textoDaRazaoDaEscolha:150 - chama: dadoExterno (golpes.js:19)
- textoDeCandidatoParaIA:20 - chama: dadoExterno (golpes.js:19)

## regras/evolucao.js
- carryUserData:167 - chama: getSpeciesBySname (dados_base.js:79), state (nucleo.js:8)
- devolveChainByX:206 - chama: getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- ehEvolucaoPraFrente:143 - chama: getSpeciesBySname (dados_base.js:79)
- evoluirElencoSemDuplicar:40 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- evolveChainByX:66 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL (dados_base.js:30), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- getActiveBuild:16 - chamado por: effectiveBuild (builds.js:200), garantiaDoTime (condicoes_habilidade.js:142), conferirTimeComBuilds (duelo.js:3144), gravarBuildDaIaNaLista (gravacao_build_ia.js:68), respostaDaIaObsoleta (gravacao_build_ia.js:55), +10
- getBuildList:14 - chama: state (nucleo.js:8) | chamado por: gravarPlanoDaIa (gravacao_build_ia.js:134), acrescentarVarianteNaLista (lista_de_builds.js:23), buildQueSaiParaAbrirVaga (lista_de_builds.js:43), removerBuildDaLista (lista_de_builds.js:32), trocarBuildAtivaNaLista (lista_de_builds.js:11), +9
- logAutoAction:229 - chama: AUTO_LOG_MAX (save.js:33), state (nucleo.js:8) | chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68), gravarPlanoDaIa (gravacao_build_ia.js:134), applySave (save.js:43), autoEvolveRoster (auto_evolucao.js:20), aplicarCuradaNoTimeNovo (ia.js:153), +4
- marcarRevisaoPosEvolucao:236 - chama: getSpeciesBySname (dados_base.js:79)
- podarAutoEvolved:61 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- reconciliarBuildsDe:104 - chama: getSpeciesBySname (dados_base.js:79), reconciliarBuild (reconciliar_build.js:39), state (nucleo.js:8)
- reconciliarBuildsSalvas:148 - chama: state (nucleo.js:8) | chamado por: applySave (save.js:43)
- runTemAlgoPraZerar:247 - chama: state (nucleo.js:8) | chamado por: updateResetTeamBoxBtn (dex_ficha.js:751)

## regras/ferramentas_ia.js
- aiTool_getAbilityMovepoolSynergy:75 - chama: getSpeciesBySname (dados_base.js:79), sinergiasDaEspecie (duelo.js:1416)
- aiTool_getBoxCandidatesForBoss:182 - chama: bestBoxCandidateForBoss (chefoes.js:183), getRemainingBossEntries (chefoes.js:51)
- aiTool_getItemInfo:150 - chama: stripNote (builds.js:49), dadoExterno (golpes.js:19)
- aiTool_getNextBossRoster:120 - chama: bossPartyPorDificuldade (chefoes.js:327), confrontoFoesDe (chefoes.js:258), confrontoParaParty (chefoes.js:298), getRemainingBossEntries (chefoes.js:51), coberturaSugerida (confronto.js:196), +1
- aiTool_getPriorityMoveOptions:51 - chama: MOVES (dados_base.js:11), getSpeciesBySname (dados_base.js:79), availableMovesFor (level_cap.js:71)
- aiTool_getRemainingBosses:159 - chama: getRemainingBossEntries (chefoes.js:51), getSpeciesByX (dados_base.js:78), speciesTypeNames (tipos.js:250)
- aiTool_getSpeciesRank:24 - chama: ROLE_LABEL_PT (dados_base.js:179), SPLIT_LABEL_PT (dados_base.js:180), rankDe (rank_da_run.js:28)
- aiTool_getSpeedBenchmark:204 - chama: computeSpeedTiers (chefoes.js:495), getSpeciesBySname (dados_base.js:79)
- aiTool_getTeamWeaknesses:15 - chama: computeSharedRisks (chefoes.js:109), getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- buildStandardAiTools:249 - chama: SPECIES (dados_base.js:52) | chamado por: opcoesDaIA (ia.js:72)

## regras/formas_mega.js
- MEGA_BASE_BY_X:21 - chamado por: effectiveBuild (builds.js:200), tarefaDeRevisao (revisao_automatica.js:24)
- MEGA_PEDRAS_TARDIAS:103 - chamado por: etapaDaPedra (liberado_na_run.js:16)
- MEGA_UNLOCK_MILESTONE:87 - chamado por: etapaDaPedra (liberado_na_run.js:16)
- ROTULO_ETAPA_MEGA:153 - chamado por: avisosDaBuild (avisos_build.js:8)
- battleFamilyOf:179 - chamado por: rosterParaTimeIA (prompts_ia.js:777)
- battleUnitsOf:223 - chamado por: bestBoxCandidateForBoss (chefoes.js:183), bestRankForm (chefoes.js:333), confrontoMelhorUnidade (chefoes.js:269), especiesQueResolvem (pipeline_build.js:638), motorCandidatosEmPassos (time_pelo_motor.js:206), +3
- etapaDaMega:155 - chama: etapaDaPedra (liberado_na_run.js:16)
- formFamilyOf:58 - chama: getSpeciesByX (dados_base.js:78) | chamado por: mudancaDeTipo (mono_run.js:96), applyRecommendedTeam (arquetipo.js:207), otherFormsHtml (ficha_extras.js:206)
- formFamilyPromptNote:39 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:118), rankDe (rank_da_run.js:28), speciesTypeNames (tipos.js:250) | chamado por: blocoMegaIA (prompts_ia.js:354), descricaoTimeParaGuia (prompts_ia.js:875), montarPromptTimeArquetipo (prompts_ia.js:823)
- isMegaEvoKind:22 - chama: EVOKINDS (dados_base.js:13), EVO_MEGA_KINDS (dados_base.js:34), EVO_PRIMAL (dados_base.js:33) | chamado por: itemDoDuelo (duelo.js:988), itemDoSetDuelo (duelo.js:1070)
- isMegaForm:64 - chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:200), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), mudancaDeTipo (mono_run.js:96), blocoMegaIA (prompts_ia.js:354), +6
- megaEvolutionUnlocked:88 - chama: state (nucleo.js:8) | chamado por: blocoMegaIA (prompts_ia.js:354), montarPromptTimeArquetipo (prompts_ia.js:823)
- megaFormLiberada:160 - chama: state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- megaFormsOf:31 - chama: getSpeciesByX (dados_base.js:78) | chamado por: validateAiBuild (validacao_build_ia.js:214)
- megaMode:75 - chama: state (nucleo.js:8) | chamado por: motorChaveDoContexto (time_pelo_motor.js:169), motorSimular (time_pelo_motor.js:248), megaStoneRuleFor (validacao_build_ia.js:14), modoMotorChave (modo_motor.js:22), initProgress (progresso.js:105), +1
- megaPromptBlock:186 - chamado por: blocoMegaIA (prompts_ia.js:354)
- rotuloEtapaDaMega:161 - chamado por: avisosDaBuild (avisos_build.js:8), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- stonesOf:213 - chamado por: megaStoneRuleFor (validacao_build_ia.js:14), validateAiBuild (validacao_build_ia.js:214)
- unitTypeMult:239 - chama: abilityTypeMod (tipos.js:169) | chamado por: bestBoxCandidateForBoss (chefoes.js:183), bossSafetyScore (chefoes.js:171), boxFitNote (resumo_luta.js:154)
- usableSpeciesFor:182 - chamado por: rosterParaTimeIA (prompts_ia.js:777)

## regras/golpes.js
- LEGENDA_GOLPE:26 - chamado por: blocoMovepoolIA (prompts_ia.js:342), planoPromptBlock (prompts_ia.js:158)
- PROMPT_DADOS_AVISO:17 - chamado por: cabecalhoIA (prompts_ia.js:274), montarPromptPlano (prompts_ia.js:765)
- SIGLA_CATEGORIA:27 - chamado por: blocoPlanoCurtoIA (escolha_ia_candidatos.js:72)
- dadoExterno:19 - chamado por: blocoDeCandidatosParaIA (escolha_ia_candidatos.js:33), blocoPlanoCurtoIA (escolha_ia_candidatos.js:72), blocoTimeCurtoIA (escolha_ia_candidatos.js:55), linhaDoChefaoPorEspecieIA (escolha_ia_candidatos.js:68), objetivoDaEscolhaIA (escolha_ia_candidatos.js:80), +11
- ehGolpeDePivo:41 - chama: MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: blocoPapelIA (prompts_ia.js:312), conferirPapelDaBuild (validacao_build_ia.js:80)
- ehPrioridadeDeDano:49 - chama: MOVE_BY_NAME (dados_base.js:86) | chamado por: blocoPapelIA (prompts_ia.js:312)
- movePromptLine:28 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9) | chamado por: blocoMovepoolIA (prompts_ia.js:342), planoPromptBlock (prompts_ia.js:158)
- moveRoleOf:53 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87), SPLIT_STATUS (dados_base.js:29) | chamado por: avisosDaBuild (avisos_build.js:8), computeBossAttackTypes (chefoes.js:147), coberturaSugerida (confronto.js:196), confrontoDamagingMoves (confronto.js:29), blocoPlanoCurtoIA (escolha_ia_candidatos.js:72), +5

## regras/gravacao_build_ia.js
- buildDoLoteDeBuilds:45 - chama: contextoDeValidacao (validacao_build_ia.js:197), validateAiBuild (validacao_build_ia.js:214) | chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- gravarBuildDaIaNaLista:68 - chama: getActiveBuild (evolucao.js:16), logAutoAction (evolucao.js:229), acrescentarVarianteNaLista (lista_de_builds.js:23), liberarVagaNaLista (lista_de_builds.js:51), trocarBuildAtivaNaLista (lista_de_builds.js:11)
- gravarPlanoDaIa:134 - chama: getBuildList (evolucao.js:14), logAutoAction (evolucao.js:229), nivelDoGolpe (plano_build.js:56), validarPlano (plano_build.js:80) | chamado por: gerarPlanoParaBuild (ia.js:342)
- gravarRespostaValidadaDaIa:105 - chama: capOuPadrao (level_cap.js:59), anexarPlanoDaIa (prompts_ia.js:208), ajustarBuildDaIa (validacao_build_ia.js:498) | chamado por: gravarBuildValidadaDaIa (ia.js:141)
- motivoDeNaoGerarBuild:18 - chama: isMegaForm (formas_mega.js:64), megaFormLiberada (formas_mega.js:160), rotuloEtapaDaMega (formas_mega.js:161) | chamado por: generateBuildWithAI (ia.js:278), gerarBuildsDoTimeComIA (ia.js:176)
- respostaDaIaObsoleta:55 - chama: getActiveBuild (evolucao.js:16), state (nucleo.js:8)
- textoDaRetentativaDeBuild:35 - chamado por: generateBuildWithAI (ia.js:278)
- textoDeLimiteDeBuilds:61 - chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- validarRespostaDeBuildDaIa:26 - chama: contextoDeValidacao (validacao_build_ia.js:197), validateAiBuild (validacao_build_ia.js:214) | chamado por: fecharCandidatoDaEscolha (escolha_ia_candidatos.js:142), fecharBuild (pipeline_build.js:697), generateBuildWithAI (ia.js:278)
- validarRespostaDoLoteDeBuilds:40 - chamado por: gerarBuildsDoTimeComIA (ia.js:176)

## regras/level_cap.js
- LEVEL_CAP_MODES:15 - chamado por: applySave (save.js:43), initProgress (progresso.js:105)
- NIVEL_DA_INNATE_ELITE:33 - chamado por: blocoEspecieIA (prompts_ia.js:285)
- availableMovesFor:71 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:118), liberadoNaRun (liberado_na_run.js:23), state (nucleo.js:8) | chamado por: confrontoUnitOf (chefoes.js:233), comoGarantir (condicoes_habilidade.js:172), precisaDeSetter (condicoes_habilidade.js:214), aiTool_getPriorityMoveOptions (ferramentas_ia.js:51), pipelineCandidatos (pipeline_build.js:521), +5
- capOuPadrao:59 - chamado por: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105), contextoDoMotor (time_pelo_motor.js:141), montarTimeContraEsteChefao (aba_chefoes.js:337), modoMotorChave (modo_motor.js:22)
- getCurrentCap:49 - chama: state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:200), entradaDeBuild (builds.js:23), blocoPlanoCurtoIA (escolha_ia_candidatos.js:72), montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86), +23
- golpesTravadosNoCap:88 - chama: MOVE_ID_BY_NAME (dados_base.js:87), liberadoNaRun (liberado_na_run.js:23), state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), contextoDoModoPrompt (prompts_ia.js:168), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:517), processarRevisoes (revisao_automatica.js:72), tarefaDeRevisao (revisao_automatica.js:24)
- innatesAtivasNoNivel:34 - chama: state (nucleo.js:8) | chamado por: unidadeDeDuelo (duelo.js:3060), pipelineCandidatos (pipeline_build.js:521)
- innatesTravadasNoNivel:44 - chamado por: blocoEspecieIA (prompts_ia.js:285)
- levelCapMode:16 - chama: state (nucleo.js:8) | chamado por: motorChaveDoContexto (time_pelo_motor.js:169), motorNivelDaEtapa (time_pelo_motor.js:73), modoMotorChave (modo_motor.js:22), initProgress (progresso.js:105)
- levelCapModeFromDifficulty:22 - chamado por: applySave (save.js:43)
- nivelDaHabilidadeNoElite:40 - chama: nomesDeHabilidades (condicoes_habilidade.js:128) | chamado por: marcasDoRankHtml (dex_ficha.js:297)
- nivelDeCalculo:63 - chamado por: computeSpeedTiers (chefoes.js:495), pipelineResolverAlvo (pipeline_build.js:71), blocoEspecieIA (prompts_ia.js:285), validateAiBuild (validacao_build_ia.js:214), montarTimeContraEsteChefao (aba_chefoes.js:337), +5

## regras/liberado_na_run.js
- entradasDoJogador:34 - chama: state (nucleo.js:8) | chamado por: applyRecommendedTeam (arquetipo.js:207), monoRunCardHtml (arquetipo.js:516)
- etapaDaPedra:16 - chama: MEGA_PEDRAS_TARDIAS (formas_mega.js:103), MEGA_UNLOCK_MILESTONE (formas_mega.js:87) | chamado por: avisosDaBuild (avisos_build.js:8), etapaDaMega (formas_mega.js:155)
- etapaDoItem:18 - chama: primeiroLugarDoItem (avisos_build.js:94) | chamado por: pipelineEvioliteServe (pipeline_build.js:488)
- liberadoNaRun:23 - chamado por: avisosDaBuild (avisos_build.js:8), availableMovesFor (level_cap.js:71), golpesTravadosNoCap (level_cap.js:88), pipelineEvioliteServe (pipeline_build.js:488), itensAindaIndisponiveisParaIA (prompts_ia.js:382), +3
- xsDoJogador:38 - chamado por: rosterParaTimeIA (prompts_ia.js:777), viramDoTipoPrompt (prompts_ia.js:812), contextoDoMotor (time_pelo_motor.js:141), candidatosDoJogador (aba_chefoes.js:248), modoMotorCapturados (modo_motor.js:27), +2

## regras/lista_de_builds.js
- acrescentarVarianteNaLista:23 - chama: entradaDeBuild (builds.js:23), getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68), gravarSugestoesDoMotor (sugestao_do_motor.js:61), addBuildVariant (nucleo.js:100)
- buildQueSaiParaAbrirVaga:43 - chama: getBuildList (evolucao.js:14) | chamado por: abrirVagaPreservando (nucleo.js:117)
- liberarVagaNaLista:51 - chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68)
- removerBuildDaLista:32 - chama: getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarSugestoesDoMotor (sugestao_do_motor.js:61), removeBuildIndex (nucleo.js:123)
- trocarBuildAtivaNaLista:11 - chama: entradaDeBuild (builds.js:23), getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68), setOrReplaceActiveBuild (nucleo.js:93)

## regras/mono_run.js
- CLIMA_OFICIAL:133 - chamado por: danoNoDuelo (duelo.js:2054), montarTimeNoClimaEmPassos (duelo.js:4549), prepararGolpesDuelo (duelo.js:1836), motorSimularComClima (time_pelo_motor_papeis.js:143)
- MONO_MARCAS:11 - chamado por: monoRunCardHtml (arquetipo.js:516)
- avisoProximoLider:159 - chama: bossPartyPorDificuldade (chefoes.js:327), getRemainingBossEntries (chefoes.js:51), gymLeaderBaseName (chefoes.js:45), MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9), +3 | chamado por: monoRunCardHtml (arquetipo.js:516)
- climaQueCombina:142 - chamado por: climaQueCombinaHtml (arquetipo.js:495)
- cobreFraquezas:89 - chama: abilityTypeMod (tipos.js:169) | chamado por: notaMonoDoCandidato (prompts_ia.js:806)
- compraDeInicialTexto:48 - chama: getSpeciesBySname (dados_base.js:79) | chamado por: fichaCabecalhoHtml (dex_ficha.js:515)
- fraquezasDoTipo:81 - chama: USABLE_TYPES (dados_base.js:128), typeMultiplier (tipos.js:240) | chamado por: notaMonoDoCandidato (prompts_ia.js:806), monoRunCardHtml (arquetipo.js:516)
- linhaEvolutivaDe:20 - chama: getSpeciesByX (dados_base.js:78)
- monoDisponibilidade:177 - chama: getSpeciesBySname (dados_base.js:79), rankDe (rank_da_run.js:28) | chamado por: monoRunCardHtml (arquetipo.js:516)
- monotypeAtivo:73 - chama: state (nucleo.js:8) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337), renderBossDetail (aba_chefoes.js:589)
- mudancaDeTipo:96 - chama: formFamilyOf (formas_mega.js:58), isMegaForm (formas_mega.js:64), speciesTypeNames (tipos.js:250) | chamado por: notaMonoDoCandidato (prompts_ia.js:806), viramDoTipoPrompt (prompts_ia.js:812)
- orientacaoMono:145 - chama: ITEMS (dados_base.js:12) | chamado por: archetypeBuildGuidance (prompts_ia.js:141), montarPromptTimeArquetipo (prompts_ia.js:823)
- resistemAoTipo:84 - chama: USABLE_TYPES (dados_base.js:128), typeMultiplier (tipos.js:240)
- serveProMono:75 - chama: speciesTypeNames (tipos.js:250) | chamado por: bestBoxCandidateForBoss (chefoes.js:183), confrontoUnidadesDaCaixa (chefoes.js:289), especiesQueResolvem (pipeline_build.js:638), motorCandidatosEmPassos (time_pelo_motor.js:206), motorClassificar (time_pelo_motor_papeis.js:207), +2

## regras/pipeline_build.js
- candidatosDeBuild:517 - chamado por: candidatosParaAEscolhaDaIa (escolha_ia_candidatos.js:201), pipelineResultado (pipeline_tela.js:14)
- especiesQueResolvem:638 - chama: SPECIES (dados_base.js:52), getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:223), serveProMono (mono_run.js:75), rankDe (rank_da_run.js:28), +1 | chamado por: quemResolveCalcular (quem_resolve.js:22)
- fecharBuild:697 - chama: ALL_NATURES (dados_base.js:101), getSpeciesBySname (dados_base.js:79), validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), megaStoneRuleFor (validacao_build_ia.js:14) | chamado por: fecharCandidatoDaEscolha (escolha_ia_candidatos.js:142)
- pipelineAmeacasDePrioridade:147 - chama: aguentaUmGolpe (duelo.js:2257), golpesNecessariosDuelo (duelo.js:2247), prioBloqueadaPelaHabilidadeDuelo (duelo.js:1822)
- pipelineAvaliarConjunto:278 - chama: golpesNecessariosComPrimeiroDuelo (duelo.js:2249)
- pipelineCandidatos:521 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:118), golpesDeDueloAte (duelo.js:265), nomeHabDuelo (duelo.js:46), moveRoleOf (golpes.js:53), +4 | chamado por: motorBuildDoCandidato (time_pelo_motor.js:170)
- pipelineDuelo:174 - chama: resultadoDoDuelo (duelo.js:2753)
- pipelineEspecie:59 - chama: getSpeciesBySname (dados_base.js:79)
- pipelineEvioliteServe:488 - chama: ITEMS (dados_base.js:12), getCurrentCap (level_cap.js:49), etapaDoItem (liberado_na_run.js:18), liberadoNaRun (liberado_na_run.js:23), evoluiAinda (validacao_build_ia.js:108), +1
- pipelineGolpesComRecuo:474 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- pipelineHabilidadesSemRegra:381 - chama: ABILITY_ID_BY_NAME (confronto.js:17), habilidadeSemRegraNoDuelo (duelo.js:1774), nomeHabDuelo (duelo.js:46)
- pipelineLinhaDoGolpe:184 - chama: aguentaUmGolpe (duelo.js:2257), bloqueiosNoDuelo (duelo.js:2728), golpesNecessariosComPrimeiroDuelo (duelo.js:2249), temPrioridadeNoCampoDuelo (duelo.js:2303)
- pipelineMontarConjunto:328 - chama: moveRoleOf (golpes.js:53)
- pipelineResolverAlvo:71 - chama: DIFF_TO_BOSSKEY (chefoes.js:19), LUTAS_DA_RUN (chefoes.js:314), bossPartyPorDificuldade (chefoes.js:327), buffsAtivosDoChefao (chefoes.js:482), getRemainingBossEntries (chefoes.js:51), +7 | chamado por: motorBuildDoCandidato (time_pelo_motor.js:170)
- pipelineSemRecuo:481 - chama: ABILITY_ID_BY_NAME (confronto.js:17), uniqueIds (dados_base.js:118), efeitoDasHabilidadesNoDuelo (duelo.js:1467)
- pipelineSinergiasAtivas:233 - chama: sinergiasDaEspecie (duelo.js:1416)
- pipelineTabela:247 - chama: unidadeDaBuild (duelo.js:3157)
- pipelineTiposExtraDeStab:425 - chama: ABILITY_ID_BY_NAME (confronto.js:17), uniqueIds (dados_base.js:118), efeitoDasHabilidadesNoDuelo (duelo.js:1467)
- pipelineValidarRascunho:493 - chama: ITEMS (dados_base.js:12), megaStoneRuleFor (validacao_build_ia.js:14), validateAiBuild (validacao_build_ia.js:214)

## regras/plano_build.js
- ESTILO_ROTULO:20 - chamado por: rotuloDaBuild (ficha_extras.js:170)
- ROTULOS_EV:21 - chamado por: evsToShowdownText (builds.js:75)
- curadaParaEstilo:160 - chamado por: effectiveBuild (builds.js:200), aplicarCuradaNoTimeNovo (ia.js:153), processarRevisoes (revisao_automatica.js:72), tarefaDeRevisao (revisao_automatica.js:24)
- curadasDe:153 - chamado por: montarPromptEstrategias (prompts_ia.js:713)
- estiloDeEvs:37 - chamado por: effectiveBuild (builds.js:200), montarPromptEstrategias (prompts_ia.js:713)
- estiloDoRitmo:48 - chamado por: effectiveBuild (builds.js:200), aplicarCuradaNoTimeNovo (ia.js:153), processarRevisoes (revisao_automatica.js:72), tarefaDeRevisao (revisao_automatica.js:24)
- evsTextoParaArray:24 - chamado por: ajustarBuildDaIa (validacao_build_ia.js:498), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:517), processarRevisoes (revisao_automatica.js:72)
- golpesNoCap:123 - chamado por: effectiveBuild (builds.js:200), myBuildEditorHtml (editor_build.js:223)
- nivelDeEvolucaoDaForma:68 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL (dados_base.js:30) | chamado por: golpesFuturosDe (builds.js:177)
- nivelDoGolpe:56 - chama: MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: golpesFuturosDe (builds.js:177), gravarPlanoDaIa (gravacao_build_ia.js:134)
- planoSaneado:107 - chamado por: entradaDeBuild (builds.js:23), anteriorSaneado (save.js:223), applySave (save.js:43)
- trocasEntreCaps:141 - chamado por: registrarTrocasDoPlano (revisao_automatica.js:149)
- validarPlano:80 - chamado por: gravarPlanoDaIa (gravacao_build_ia.js:134), anexarPlanoDaIa (prompts_ia.js:208)

## regras/prompts_ia.js
- AI_ITEM_POOL:91 - chamado por: validateAiBuild (validacao_build_ia.js:214)
- anexarPlanoDaIa:208 - chama: validarPlano (plano_build.js:80) | chamado por: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105)
- archetypeBuildGuidance:141 - chama: orientacaoMono (mono_run.js:145), state (nucleo.js:8) | chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- avisoInnatesEliteIA:575 - chama: getCurrentCap (level_cap.js:49), state (nucleo.js:8)
- blocoEspecieIA:285 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:118), NIVEL_DA_INNATE_ELITE (level_cap.js:33), innatesTravadasNoNivel (level_cap.js:44), nivelDeCalculo (level_cap.js:63), +1
- blocoItensAindaIndisponiveisIA:387 - chama: rotuloDaEtapaDoItem (avisos_build.js:98)
- blocoItensComunsIA:393 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), ITEMS (dados_base.js:12) | chamado por: montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- blocoItensDaEspecieIA:370 - chama: regraItemConsumivelPrompt (validacao_build_ia.js:57) | chamado por: montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- blocoItensIA:375 - chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86)
- blocoManualIA:469 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:118)
- blocoMegaIA:354 - chama: formFamilyPromptNote (formas_mega.js:39), isMegaForm (formas_mega.js:64), megaEvolutionUnlocked (formas_mega.js:88), megaPromptBlock (formas_mega.js:186), megaStoneRuleFor (validacao_build_ia.js:14)
- blocoMovepoolIA:342 - chama: LEGENDA_GOLPE (golpes.js:26), movePromptLine (golpes.js:28), availableMovesFor (level_cap.js:71)
- blocoPapelIA:312 - chama: computeSharedRisks (chefoes.js:109), ITEMS (dados_base.js:12), getSpeciesByX (dados_base.js:78), ehGolpeDePivo (golpes.js:41), ehPrioridadeDeDano (golpes.js:49), +3
- blocoTimeEmUsoIA:423 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itensEmUsoComQuem (builds.js:151), teamMovesInUse (builds.js:123), teamRolesInUse (builds.js:163), ROLE_LABEL_PT (dados_base.js:179), +1
- cabecalhoIA:274 - chama: PROMPT_DADOS_AVISO (golpes.js:17) | chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- comDescricaoIA:367 - chama: dadoExterno (golpes.js:19)
- contextoDoModoPrompt:168 - chama: NOME_DA_CONDICAO (condicoes_habilidade.js:42), dadoExterno (golpes.js:19), golpesTravadosNoCap (level_cap.js:88)
- descricaoTimeParaGuia:875 - chama: effectiveBuild (builds.js:200), ROLE_LABEL_PT (dados_base.js:179), formFamilyPromptNote (formas_mega.js:39), speciesTypeNames (tipos.js:250)
- guiaDaResposta:908 - chamado por: generateTeamUsageGuide (arquetipo.js:270)
- itensAindaIndisponiveisParaIA:382 - chama: primeiroLugarDoItem (avisos_build.js:94), getCurrentCap (level_cap.js:49), liberadoNaRun (liberado_na_run.js:23), state (nucleo.js:8)
- itensDeEspeciePara:84 - chama: ITEMS (dados_base.js:12) | chamado por: validateAiBuild (validacao_build_ia.js:214)
- linhaHabilidadeIA:281 - chama: ABILITIES (dados_base.js:10), dadoExterno (golpes.js:19)
- linhaProvadoIA:600 - chama: dadoExterno (golpes.js:19) | chamado por: linhaDoChefaoPorEspecieIA (escolha_ia_candidatos.js:68)
- linhaVelocidadeIA:490 - chama: calcFinalStat (calc_stat.js:119), computeSpeedTiers (chefoes.js:495), state (nucleo.js:8)
- linhasContextoComumIA:581 - chama: getRemainingBossEntries (chefoes.js:51), getSpeciesByX (dados_base.js:78), speciesTypeNames (tipos.js:250)
- linhasContextoDaEspecieIA:552 - chama: sinergiasDaEspecie (duelo.js:1416), rankDe (rank_da_run.js:28)
- linhasProximaLutaIA:506 - chama: bestBoxCandidateForBoss (chefoes.js:183), bossPartyPorDificuldade (chefoes.js:327), confrontoFoesDe (chefoes.js:258), confrontoParaParty (chefoes.js:298), ehRevancheDeLider (chefoes.js:454), +6
- montarPromptBuild:610 - chama: blocoCondicoesIA (condicoes_habilidade.js:239), getCurrentCap (level_cap.js:49) | chamado por: generateBuildWithAI (ia.js:278)
- montarPromptBuildsDoTime:665 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), NOME_DA_CONDICAO (condicoes_habilidade.js:42), blocoCondicoesIA (condicoes_habilidade.js:239), dadoExterno (golpes.js:19), getCurrentCap (level_cap.js:49) | chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- montarPromptEstrategias:713 - chama: blocoCondicoesIA (condicoes_habilidade.js:239), getCurrentCap (level_cap.js:49), curadasDe (plano_build.js:153), estiloDeEvs (plano_build.js:37) | chamado por: generateStrategySets (revisao_automatica.js:182)
- montarPromptGuia:885 - chamado por: generateTeamUsageGuide (arquetipo.js:270)
- montarPromptPlano:765 - chama: PROMPT_DADOS_AVISO (golpes.js:17), dadoExterno (golpes.js:19), speciesTypeNames (tipos.js:250) | chamado por: gerarPlanoParaBuild (ia.js:342)
- montarPromptTimeArquetipo:823 - chama: effectiveBuild (builds.js:200), ABILITIES (dados_base.js:10), ROLE_LABEL_PT (dados_base.js:179), uniqueIds (dados_base.js:118), formFamilyPromptNote (formas_mega.js:39), +5 | chamado por: generateTeamForArchetype (arquetipo.js:153)
- nomePapel:311 - chama: ROLE_LABEL_PT (dados_base.js:179) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), linhaDePapelNaturalIA (escolha_ia_candidatos.js:47)
- notaMonoDoCandidato:806 - chama: cobreFraquezas (mono_run.js:89), fraquezasDoTipo (mono_run.js:81), mudancaDeTipo (mono_run.js:96)
- planoPromptBlock:158 - chama: golpesFuturosDe (builds.js:177), LEGENDA_GOLPE (golpes.js:26), movePromptLine (golpes.js:28)
- rosterParaTimeIA:777 - chama: getSpeciesByX (dados_base.js:78), battleFamilyOf (formas_mega.js:179), usableSpeciesFor (formas_mega.js:182), xsDoJogador (liberado_na_run.js:38), speciesTypeNames (tipos.js:250) | chamado por: generateTeamForArchetype (arquetipo.js:153)
- sampleErrorMessage:230 - chamado por: pedirIAAgora (ia.js:109)
- snamesValidosDoTime:863 - chamado por: generateTeamForArchetype (arquetipo.js:153)
- soExistentes:32 - chama: ITEMS (dados_base.js:12)
- versaoDosDados:273 - chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- viramDoTipoPrompt:812 - chama: getSpeciesByX (dados_base.js:78), xsDoJogador (liberado_na_run.js:38), mudancaDeTipo (mono_run.js:96)

## regras/rank_da_run.js
- FORA_DO_RANK:10 - chamado por: rankBadgeHtml (dex_ficha.js:169), rankInfoLineHtml (dex_ficha.js:319)
- MOTIVO_FORA_DO_RANK_PT:17 - chamado por: rankBadgeHtml (dex_ficha.js:169), rankInfoLineHtml (dex_ficha.js:319)
- rankDaDificuldadeDe:68 - chamado por: marcasDoRankHtml (dex_ficha.js:297)
- rankDe:28 - chama: state (nucleo.js:8) | chamado por: bestBoxCandidateForBoss (chefoes.js:183), bestRankForm (chefoes.js:333), aiTool_getSpeciesRank (ferramentas_ia.js:24), formFamilyPromptNote (formas_mega.js:39), monoDisponibilidade (mono_run.js:177), +10

## regras/reconciliar_build.js
- habilidadeSubstitutaPara:26 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:118), sinergiasDaEspecie (duelo.js:1416)
- movepoolCompletoDe:17 - chama: MOVES (dados_base.js:11)
- reconciliarBuild:39 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:118) | chamado por: effectiveBuild (builds.js:200), reconciliarBuildsDe (evolucao.js:104)

## regras/save.js
- AUTO_LOG_MAX:33 - chamado por: logAutoAction (evolucao.js:229)
- anteriorSaneado:223 - chama: planoSaneado (plano_build.js:107)
- applySave:43 - chama: BUILD_SOURCES (builds.js:17), MONOTYPE_ARCHETYPES (dados_base.js:154), PACE_ARCHETYPES (dados_base.js:142), TATICA_ARCHETYPES (dados_base.js:147), USABLE_TYPES (dados_base.js:128), +9 | chamado por: aplicarSaveRemoto (sync.js:45)
- buildSave:320 - chamado por: persist (nucleo.js:143), connectSync (sync.js:172)
- conferirSomaDoSave:313 - chamado por: remotoComSomaErrada (sync.js:88)
- montarSave:325 - chama: state (nucleo.js:8)
- reconciliouAoAplicar:40 - chamado por: aplicarSaveRemoto (sync.js:45)
- sanitizarStrategySets:242 - chama: clampInt (dados_base.js:103), getSpeciesBySname (dados_base.js:79) | chamado por: generateStrategySets (revisao_automatica.js:182)
- saveChegandoTemMenosProgresso:363 - chamado por: conflitoDeProgresso (sync.js:61)
- snamesToXs:15 - chama: SPECIES_BY_SNAME (dados_base.js:72) | chamado por: carregarTimeSalvo (time.js:245), renderSavedTeams (time.js:206)
- syncContentDiffers:377 - chamado por: connectSync (sync.js:172)
- xsToSnames:24 - chama: snameOf (dados_base.js:80) | chamado por: guardarTimeAnterior (aba_chefoes.js:266)

## regras/sugestao_do_motor.js
- SUGESTAO_ROTULO:11 - chamado por: buildChipsHtml (editor_build.js:212), rotuloDaBuild (ficha_extras.js:170), modoMotorFicarComVariante (modo_motor.js:120), modoMotorRodapeHtml (modo_motor.js:191)
- gravarSugestoesDoMotor:61 - chama: entradaDeBuild (builds.js:23), getBuildList (evolucao.js:14), acrescentarVarianteNaLista (lista_de_builds.js:23), removerBuildDaLista (lista_de_builds.js:32), state (nucleo.js:8) | chamado por: modoMotorFicarComVariante (modo_motor.js:120)
- planoDeGravarSugestoes:39 - chama: getActiveBuild (evolucao.js:16), getBuildList (evolucao.js:14) | chamado por: modoMotorFicarComVariante (modo_motor.js:120)

## regras/time_pelo_motor.js
- contextoDoMotor:141 - chama: capOuPadrao (level_cap.js:59), xsDoJogador (liberado_na_run.js:38), state (nucleo.js:8) | chamado por: modoMotorAquecer (modo_motor.js:41), modoMotorMontar (modo_motor.js:69)
- criarCacheDoMotor:65 - chamado por: modoMotorCache (modo_motor.js:20)
- montarTimePeloMotorEmPassos:435 - chama: SPECIES (dados_base.js:52), motorClassificar (time_pelo_motor_papeis.js:207), motorTextos (time_pelo_motor_papeis.js:306) | chamado por: modoMotorMontar (modo_motor.js:69)
- motorAquecerBuildsEmPassos:230 - chamado por: modoMotorAquecer (modo_motor.js:41)
- motorArred:62 - chamado por: motorClassificar (time_pelo_motor_papeis.js:207), motorDeltaSemMembro (time_pelo_motor_papeis.js:194), motorDeltaSemTipos (time_pelo_motor_papeis.js:198), motorProvasDosMembros (time_pelo_motor_papeis.js:157)
- motorAvaliar:265 - chamado por: motorClassificar (time_pelo_motor_papeis.js:207)
- motorBuildDoCandidato:170 - chama: ABILITIES (dados_base.js:10), MOVES (dados_base.js:11), melhorUnidadeContra (duelo.js:3083), getActiveBuild (evolucao.js:16), liberadoNaRun (liberado_na_run.js:23), +2
- motorCandidatosEmPassos:206 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:223), serveProMono (mono_run.js:75)
- motorChaveDaBuild:166 - chamado por: motorAlternativasArmadoras (time_pelo_motor_papeis.js:101)
- motorChaveDoContexto:169 - chama: megaMode (formas_mega.js:75), levelCapMode (level_cap.js:16), state (nucleo.js:8) | chamado por: motorAlternativasArmadoras (time_pelo_motor_papeis.js:101)
- motorFecharItens:396 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150)
- motorGuardar:66 - chamado por: motorAux (time_pelo_motor_papeis.js:26)
- motorItensCandidatos:371 - chama: ITEMS (dados_base.js:12), MOVES (dados_base.js:11), unidadeDeDuelo (duelo.js:3060), liberadoNaRun (liberado_na_run.js:23), conflitoDeItem (validacao_build_ia.js:136)
- motorLutasComunsDoContexto:108 - chama: DIFF_TO_BOSSKEY (chefoes.js:19), state (nucleo.js:8)
- motorLutasDoContexto:123 - chama: LUTAS_DA_RUN (chefoes.js:314)
- motorMontarLuta:79 - chama: DIFF_TO_BOSSKEY (chefoes.js:19), bossPartyPorDificuldade (chefoes.js:327), buffsAtivosDoChefao (chefoes.js:482), regraDeCampoDoChefao (chefoes.js:416), climaDoTimeDoChefao (duelo.js:3049), +5 | chamado por: motorLutaComClima (time_pelo_motor_papeis.js:53)
- motorMontarLutaComum:90 - chama: climaDoTimeDoChefao (duelo.js:3049), foeDeDuelo (duelo.js:3024)
- motorNivelDaEtapa:73 - chama: levelCapMode (level_cap.js:16)
- motorRaizDaLinha:151 - chama: SPECIES (dados_base.js:52)
- motorSimular:248 - chama: meuComBuffsDoGinasio (duelo.js:4201), simularDuplaContraChefao (duelo.js:3756), simularLutaContraChefao (duelo.js:4241), megaMode (formas_mega.js:75), state (nucleo.js:8) | chamado por: motorClassificar (time_pelo_motor_papeis.js:207), motorDeltaSemMembro (time_pelo_motor_papeis.js:194), motorDeltaSemTipos (time_pelo_motor_papeis.js:198)
- motorTemGolpeDeLado:277 - chama: semGolpesDeLadoDuelo (duelo.js:4657)
- motorUnidade:236 - chama: planoDoGolpeStatus (duelo.js:3250), unidadeDaBuild (duelo.js:3157) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:33), motorProvasDosMembros (time_pelo_motor_papeis.js:157), motorTemTipo (time_pelo_motor_papeis.js:202), motorUnidadeNaLuta (time_pelo_motor_papeis.js:23)

## regras/time_pelo_motor_papeis.js
- MOTOR_FRASE_DA_PROVA:321 - chamado por: modoMotorMembroHtml (modo_motor.js:178)
- motorAlternativasArmadoras:101 - chama: liberadoNaRun (liberado_na_run.js:23), motorChaveDaBuild (time_pelo_motor.js:166), motorChaveDoContexto (time_pelo_motor.js:169)
- motorAux:26 - chama: motorGuardar (time_pelo_motor.js:66)
- motorClassificar:207 - chama: serveProMono (mono_run.js:75), motorArred (time_pelo_motor.js:62), motorAvaliar (time_pelo_motor.js:265), motorSimular (time_pelo_motor.js:248), state (nucleo.js:8) | chamado por: montarTimePeloMotorEmPassos (time_pelo_motor.js:435)
- motorCondicoes:33 - chama: ABILITY_ID_BY_NAME (confronto.js:17), MOVES (dados_base.js:11), armadoresDeClima (duelo.js:3218), planoDoGolpeStatus (duelo.js:3250), motorUnidade (time_pelo_motor.js:236)
- motorDeltaSemMembro:194 - chama: motorArred (time_pelo_motor.js:62), motorSimular (time_pelo_motor.js:248)
- motorDeltaSemTipos:198 - chama: motorArred (time_pelo_motor.js:62), motorSimular (time_pelo_motor.js:248)
- motorGanhoDaCondicao:56 - chama: DURACAO_LADO_DUELO (duelo.js:3962), meuComBuffsDoGinasio (duelo.js:4201), novoLadoDuelo (duelo.js:3968), resultadoDoDuelo (duelo.js:2753), unidadeDaBuild (duelo.js:3157)
- motorLutaComClima:53 - chama: motorMontarLuta (time_pelo_motor.js:79)
- motorLutaDetalhada:136 - chama: simularLutaContraChefao (duelo.js:4241)
- motorProvasDosMembros:157 - chama: danoNoDuelo (duelo.js:2054), motorArred (time_pelo_motor.js:62), motorUnidade (time_pelo_motor.js:236)
- motorSimularComClima:143 - chama: meuComBuffsDoGinasio (duelo.js:4201), novoLadoDuelo (duelo.js:3968), simularLutaContraChefao (duelo.js:4241), unidadeDaBuild (duelo.js:3157), unidadeSemClima (duelo.js:3170), +1
- motorTemTipo:202 - chama: planoDoGolpeStatus (duelo.js:3250), motorUnidade (time_pelo_motor.js:236)
- motorTextos:306 - chamado por: montarTimePeloMotorEmPassos (time_pelo_motor.js:435)
- motorUnidadeNaLuta:23 - chama: meuComBuffsDoGinasio (duelo.js:4201), motorUnidade (time_pelo_motor.js:236)

## regras/tipos.js
- TYPE_MOD_ABILITIES:71 - chamado por: efetividadeNoDuelo (duelo.js:2003), habilidadeSemRegraNoDuelo (duelo.js:1774)
- abilityTypeMod:169 - chamado por: computeSharedRisks (chefoes.js:109), unitTypeMult (formas_mega.js:239), cobreFraquezas (mono_run.js:89), renderTeamAnalysis (arquetipo.js:599)
- abilityTypeModFor:192 - chama: ABILITIES (dados_base.js:10) | chamado por: ameacaDe (confronto.js:91), coberturaSugerida (confronto.js:196), ofensaContra (confronto.js:59), aterradoDuelo (duelo.js:942), efetividadeNoDuelo (duelo.js:2003)
- alwaysActiveAbilities:160 - chamado por: confrontoUnitOf (chefoes.js:233)
- perfilDefensivoDaEspecie:175 - chama: USABLE_TYPES (dados_base.js:128) | chamado por: fichaEfetividadeHtml (dex_ficha.js:434)
- speciesTypeNames:250 - chama: TYPES (dados_base.js:9) | chamado por: confrontoUnitOf (chefoes.js:233), podeTerStatus (condicoes_habilidade.js:134), coberturaSugerida (confronto.js:196), ofensaContra (confronto.js:59), itemDoDuelo (duelo.js:988), +28
- typeMultiplier:240 - chamado por: efetividadeNoDuelo (duelo.js:2003), entrarNoLadoDuelo (duelo.js:4026), simularLutaDeVerdadeContraChefao (duelo.js:4249), avisoProximoLider (mono_run.js:159), fraquezasDoTipo (mono_run.js:81), +2

## regras/validacao_build_ia.js
- ITENS_CHOICE:105 - chamado por: avisosDaBuild (avisos_build.js:8)
- ajustarBuildDaIa:498 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:118), evsTextoParaArray (plano_build.js:24) | chamado por: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105)
- conferirPapelDaBuild:80 - chama: ehGolpeDePivo (golpes.js:41), availableMovesFor (level_cap.js:71), state (nucleo.js:8)
- conflitoDeItem:136 - chama: MOVE_BY_NAME (dados_base.js:86), SPLIT_STATUS (dados_base.js:29), speciesTypeNames (tipos.js:250) | chamado por: avisosDaBuild (avisos_build.js:8), motorItensCandidatos (time_pelo_motor.js:371)
- conflitoDeNature:119 - chama: MOVE_BY_NAME (dados_base.js:86), NATURE_MODS (dados_base.js:90), moveRoleOf (golpes.js:53), state (nucleo.js:8)
- contextoDeValidacao:197 - chama: buffsAtivosDoChefao (chefoes.js:482), ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:118) | chamado por: buildDoLoteDeBuilds (gravacao_build_ia.js:45), validarRespostaDeBuildDaIa (gravacao_build_ia.js:26)
- entradaDaCuradaParaTimeNovo:517 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itensEmUsoComQuem (builds.js:151), stripNote (builds.js:49), ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:118), +2 | chamado por: aplicarCuradaNoTimeNovo (ia.js:153)
- evoluiAinda:108 - chamado por: pipelineEvioliteServe (pipeline_build.js:488), blocoPapelIA (prompts_ia.js:312)
- limitarEvsAoJogo:169 - chama: clampInt (dados_base.js:103)
- megaStoneRuleFor:14 - chama: isMegaForm (formas_mega.js:64), megaMode (formas_mega.js:75), stonesOf (formas_mega.js:213) | chamado por: avisosDaBuild (avisos_build.js:8), comoGarantir (condicoes_habilidade.js:172), fecharBuild (pipeline_build.js:697), pipelineValidarRascunho (pipeline_build.js:493), blocoMegaIA (prompts_ia.js:354), +1
- regraItemConsumivelPara:47 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:118)
- regraItemConsumivelPrompt:57 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:118) | chamado por: blocoItensDaEspecieIA (prompts_ia.js:370)
- setsValidosDaResposta:482 - chamado por: generateStrategySets (revisao_automatica.js:182)
- validateAiBuild:214 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itensEmUsoComQuem (builds.js:151), trimAndReallocateEvs (calc_stat.js:195), condicaoDaBuild (condicoes_habilidade.js:191), ABILITY_ID_BY_NAME (confronto.js:17), +20 | chamado por: buildDoLoteDeBuilds (gravacao_build_ia.js:45), validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), pipelineValidarRascunho (pipeline_build.js:493)
