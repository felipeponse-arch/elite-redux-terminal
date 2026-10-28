# Chamadas entre arquivos - src/regras/

Gerado por `npm run mapa` (scripts/mapa_chamadas.mjs, API do TypeScript); não edite à mão.
Por função de nível superior: `chama:` e `chamado por:` funções de OUTROS arquivos de src/regras e src/ui, como `nome (arquivo:linha)`;
no máximo 5 por lista, o resto vira `+N`. Referência vale também como callback. Chamada pelo template/HTML não aparece. Mapa geral: [mapa-do-codigo.md](../mapa-do-codigo.md).

## regras/avisos_build.js
- avisosDaBuild:8 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), stripNote (builds.js:49), garantiaDaCondicao (condicoes_habilidade.js:158), +15 | chamado por: buildContextNotesHtml (editor_build.js:161)
- ondeAcharItemTexto:100 - chamado por: itemDescHtml (editor_build.js:45)
- primeiroLugarDoItem:94 - chamado por: etapaDoItem (liberado_na_run.js:17), itensAindaIndisponiveisParaIA (prompts_ia.js:382)
- rotuloDaEtapaDoItem:98 - chamado por: blocoItensAindaIndisponiveisIA (prompts_ia.js:387)
- seloDaBuild:82 - chamado por: seloDaBuildHtml (editor_build.js:168)

## regras/builds.js
- BUILD_SOURCES:17 - chamado por: applySave (save.js:47)
- MAX_MESMO_ITEM_NO_TIME:150 - chamado por: avisosDaBuild (avisos_build.js:8), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103), blocoItensComunsIA (prompts_ia.js:393), blocoTimeEmUsoIA (prompts_ia.js:423), montarPromptBuildsDoTime (prompts_ia.js:665), +1
- comecarLoteDeBuilds:118 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337), generateCompleteTeam (arquetipo.js:302)
- concluirBuildDoLote:119 - chamado por: generateCompleteTeam (arquetipo.js:302), gerarBuildsDoTimeComIA (ia.js:176)
- effectiveBuild:202 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), MEGA_BASE_BY_X (formas_mega.js:21), isMegaForm (formas_mega.js:71), getCurrentCap (level_cap.js:49), +6 | chamado por: confrontoUnitOf (chefoes.js:233), descricaoTimeParaGuia (prompts_ia.js:875), montarPromptTimeArquetipo (prompts_ia.js:823), computeTeamGenerationValidation (arquetipo.js:253), compareResultHtml (ficha_extras.js:22), +1
- encerrarLoteDeBuilds:120 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337), generateCompleteTeam (arquetipo.js:302)
- entradaDeBuild:23 - chama: getSpeciesBySname (dados_base.js:79), getCurrentCap (level_cap.js:49), planoSaneado (plano_build.js:107) | chamado por: acrescentarVarianteNaLista (lista_de_builds.js:23), trocarBuildAtivaNaLista (lista_de_builds.js:11), gravarSugestoesDoMotor (sugestao_do_motor.js:61)
- evsToShowdownText:75 - chama: ROTULOS_EV (plano_build.js:21) | chamado por: myBuildEditorHtml (editor_build.js:223), strategySetsHtml (editor_build.js:432)
- golpesFuturosDe:179 - chama: MOVES (dados_base.js:11), nivelDeEvolucaoDaForma (plano_build.js:68), nivelDoGolpe (plano_build.js:56) | chamado por: blocoPlanoCurtoIA (escolha_ia_candidatos.js:72), planoPromptBlock (prompts_ia.js:158), processarRevisoes (revisao_automatica.js:72)
- itemEsgotadoNoTime:152 - chamado por: avisosDaBuild (avisos_build.js:8), blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:423), motorFecharItens (time_pelo_motor.js:395), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:513), +1
- itensEmUsoComQuem:153 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:423), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:513), validateAiBuild (validacao_build_ia.js:208)
- showdownSet:58 - chamado por: initBosses (aba_chefoes.js:33), buildEntryHtml (editor_build.js:182), myBuildEditorHtml (editor_build.js:223), strategySetsHtml (editor_build.js:432), renderTeam (time.js:8)
- stripNote:49 - chamado por: avisosDaBuild (avisos_build.js:8), aiTool_getItemInfo (ferramentas_ia.js:150), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:513), hpEvEfficiencyNote (editor_build.js:83), itemDescHtml (editor_build.js:45), +1
- teamItemsInUse:90 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- teamMovesInUse:123 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:423)
- teamRolesInUse:165 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:423)

## regras/calc_stat.js
- ITEM_MOVE_POWER_MODS:132 - chamado por: updateMyBuildStatus (editor_build.js:362)
- calcFinalStat:160 - chama: NATURE_MODS (dados_base.js:90) | chamado por: computeSpeedTiers (chefoes.js:495), foeDeDuelo (duelo.js:3064), semItemDuplicadoNoHell (duelo.js:3104), unidadeDeDuelo (duelo.js:3114), linhaVelocidadeIA (prompts_ia.js:490), +3
- especiePorNomeDoItem:135 - chama: SPECIES (dados_base.js:52)
- itemRuleFor:149 - chamado por: itemDoDuelo (duelo.js:1006), bossMonCardHtml (aba_chefoes.js:493), updateMyBuildStatus (editor_build.js:362)
- minEvSameStat:200 - chamado por: evBreakpointNote (editor_build.js:116)
- regraCasaComEspecie:139 - chama: isMegaEvoKind (formas_mega.js:22)
- trimAndReallocateEvs:238 - chamado por: validateAiBuild (validacao_build_ia.js:208)

## regras/chefoes.js
- DIFF_TO_BOSSKEY:19 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorLutasComunsDoContexto (time_pelo_motor.js:108), motorMontarLuta (time_pelo_motor.js:79), quemResolveCardHtml (quem_resolve.js:83)
- LUTAS_DA_RUN:314 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorLutasDoContexto (time_pelo_motor.js:123)
- SPEEDTIER_NATURE:493 - chamado por: renderSpeedTiers (tipos.js:35)
- bestBoxCandidateForBoss:183 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:253), unitTypeMult (formas_mega.js:269), serveProMono (mono_run.js:74), rankDe (rank_da_run.js:29), +1 | chamado por: aiTool_getBoxCandidatesForBoss (ferramentas_ia.js:182), linhasProximaLutaIA (prompts_ia.js:506), nextFightDetailHtml (resumo_luta.js:215)
- bestRankForm:333 - chama: battleUnitsOf (formas_mega.js:253), rankDe (rank_da_run.js:29) | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- bossPartyPorDificuldade:327 - chama: state (nucleo.js:8) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), avisoProximoLider (mono_run.js:158), pipelineResolverAlvo (pipeline_build.js:71), linhasProximaLutaIA (prompts_ia.js:506), motorMontarLuta (time_pelo_motor.js:79), +2
- bossSafetyScore:171 - chama: unitTypeMult (formas_mega.js:269)
- bossSpeedSummary:132 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- buffsAtivosDoChefao:482 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:79), contextoDeValidacao (validacao_build_ia.js:191), montarTimeContraEsteChefao (aba_chefoes.js:337)
- buffsParaMostrarDoChefao:473 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337), buffsMudaram (arquetipo.js:383)
- comportamentoDaIADoChefao:433 - chamado por: iaDoChefaoHtml (aba_chefoes.js:190)
- computeBossAttackTypes:147 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9), moveRoleOf (golpes.js:53), state (nucleo.js:8)
- computeSharedRisks:109 - chama: USABLE_TYPES (dados_base.js:132), abilityTypeMod (tipos.js:172) | chamado por: linhaDeFraquezasDoTimeIA (escolha_ia_candidatos.js:51), aiTool_getTeamWeaknesses (ferramentas_ia.js:15), blocoPapelIA (prompts_ia.js:312), computeTeamGenerationValidation (arquetipo.js:253), renderTeamAnalysis (arquetipo.js:599), +2
- computeSpeedTiers:495 - chama: calcFinalStat (calc_stat.js:160), SPECIES (dados_base.js:52), nivelDeCalculo (level_cap.js:65) | chamado por: aiTool_getSpeedBenchmark (ferramentas_ia.js:204), linhaVelocidadeIA (prompts_ia.js:490), renderSpeedTiers (tipos.js:35)
- confrontoFoesDe:258 - chama: foeFromBossMember (confronto.js:49), getSpeciesBySname (dados_base.js:79) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), linhasProximaLutaIA (prompts_ia.js:506)
- confrontoMelhorUnidade:269 - chama: confrontoTime (confronto.js:146), battleUnitsOf (formas_mega.js:253)
- confrontoMinhasUnidades:279 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- confrontoParaParty:298 - chama: confrontoTime (confronto.js:146), melhoresTrocas (confronto.js:265) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), linhasProximaLutaIA (prompts_ia.js:506), initProgress (progresso.js:105), bossConfrontoHtml (resumo_luta.js:96), dashboardConfrontoHtml (resumo_luta.js:135)
- confrontoUnidadesDaCaixa:289 - chama: getSpeciesByX (dados_base.js:78), serveProMono (mono_run.js:74), state (nucleo.js:8)
- confrontoUnitOf:233 - chama: effectiveBuild (builds.js:202), ABILITY_ID_BY_NAME (confronto.js:17), availableMovesFor (level_cap.js:73), alwaysActiveAbilities (tipos.js:163), speciesTypeNames (tipos.js:253)
- ehRevancheDeLider:454 - chamado por: linhasProximaLutaIA (prompts_ia.js:506), renderGymSkillsCardHtml (aba_chefoes.js:456)
- getRemainingBossEntries:51 - chama: state (nucleo.js:8) | chamado por: aiTool_getBoxCandidatesForBoss (ferramentas_ia.js:182), aiTool_getNextBossRoster (ferramentas_ia.js:120), aiTool_getRemainingBosses (ferramentas_ia.js:159), avisoProximoLider (mono_run.js:158), pipelineResolverAlvo (pipeline_build.js:71), +7
- gymLeaderBaseName:45 - chamado por: avisoProximoLider (mono_run.js:158), linhasProximaLutaIA (prompts_ia.js:506), renderGymSkillsCardHtml (aba_chefoes.js:456)
- gymSkillsSummaryFor:367 - chama: state (nucleo.js:8) | chamado por: linhasProximaLutaIA (prompts_ia.js:506), renderGymSkillsCardHtml (aba_chefoes.js:456)
- nextFightCx:351 - chamado por: renderDashboard (resumo_luta.js:183), renderNextFightCard (resumo_luta.js:257)
- regraDeCampoDoChefao:416 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), linhasProximaLutaIA (prompts_ia.js:506), motorMontarLuta (time_pelo_motor.js:79), campoDoChefaoHtml (aba_chefoes.js:178), montarTimeContraEsteChefao (aba_chefoes.js:337)
- regrasDoHell:447 - chamado por: hellDoChefaoHtml (aba_chefoes.js:199)
- varianteDoChefao:358 - chama: state (nucleo.js:8) | chamado por: selectBoss (aba_chefoes.js:437), initProgress (progresso.js:105)

## regras/condicoes_habilidade.js
- NOME_DA_CONDICAO:42 - chamado por: objetivoDaEscolhaIA (escolha_ia_candidatos.js:80), contextoDoModoPrompt (prompts_ia.js:168), montarPromptBuildsDoTime (prompts_ia.js:665), planoContraChefaoHtml (arquetipo.js:387)
- blocoCondicoesIA:241 - chamado por: montarPromptBuild (prompts_ia.js:610), montarPromptBuildsDoTime (prompts_ia.js:665), montarPromptEstrategias (prompts_ia.js:713)
- comoGarantir:174 - chama: ITEMS (dados_base.js:12), availableMovesFor (level_cap.js:73), megaStoneRuleFor (validacao_build_ia.js:14)
- condicaoDaBuild:193 - chamado por: validateAiBuild (validacao_build_ia.js:208)
- descricaoDeHabilidade:89 - chama: ABILITIES (dados_base.js:10)
- descricaoDeHabilidadePorId:100 - chama: ABILITIES (dados_base.js:10) | chamado por: textoHabDuelo (duelo.js:203)
- expandirTextoDeHabilidade:111 - chama: ABILITIES (dados_base.js:10), LIDO_PELO_TEXTO_NOVO_DUELO (duelo.js:201), TEXTO_DA_VERSAO_NOVA_DUELO (duelo.js:50) | chamado por: textoHabDuelo (duelo.js:203)
- garantiaDaCondicao:158 - chama: ITEMS (dados_base.js:12) | chamado por: avisosDaBuild (avisos_build.js:8)
- garantiaDoTime:144 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), state (nucleo.js:8)
- habilidadeArma:125 - chamado por: armadoresDeClima (duelo.js:3273), climaDoTimeDoChefao (duelo.js:3090), efeitoDasHabilidadesNoDuelo (duelo.js:1486), habilidadeSemRegraNoDuelo (duelo.js:1793)
- nomesDeHabilidades:128 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122) | chamado por: avisosDaBuild (avisos_build.js:8), nivelDaHabilidadeNoElite (level_cap.js:40)
- podeTerStatus:136 - chama: STATUS_DUELO (duelo.js:357), speciesTypeNames (tipos.js:253)
- precisaDeSetter:216 - chama: availableMovesFor (level_cap.js:73) | chamado por: avisosDaBuild (avisos_build.js:8), marcasDoRankHtml (dex_ficha.js:297)

## regras/confronto.js
- ABILITY_ID_BY_NAME:17 - chamado por: confrontoUnitOf (chefoes.js:233), climaDoTimeDoChefao (duelo.js:3090), foeDeDuelo (duelo.js:3064), montarTimeNoClimaEmPassos (duelo.js:4612), unidadeDaBuild (duelo.js:3212), +5
- aberturaEmDupla:319 - chamado por: confrontoPlanoHtml (resumo_luta.js:67)
- ameacaDe:91 - chama: MOVE_BY_NAME (dados_base.js:86), abilityTypeModFor (tipos.js:195)
- coberturaSugerida:196 - chama: MOVE_BY_NAME (dados_base.js:86), moveRoleOf (golpes.js:53), abilityTypeModFor (tipos.js:195), speciesTypeNames (tipos.js:253) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), linhasProximaLutaIA (prompts_ia.js:506), confrontoAjustesHtml (resumo_luta.js:44)
- confrontoDamagingMoves:29 - chama: MOVE_BY_NAME (dados_base.js:86), moveRoleOf (golpes.js:53)
- confrontoMoveType:32 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9)
- confrontoTime:146 - chamado por: confrontoMelhorUnidade (chefoes.js:269), confrontoParaParty (chefoes.js:298)
- cuidadosDoChefao:302 - chamado por: confrontoPlanoHtml (resumo_luta.js:67)
- foeFromBossMember:49 - chama: getSpeciesByX (dados_base.js:78) | chamado por: confrontoFoesDe (chefoes.js:258)
- melhoresTrocas:265 - chamado por: confrontoParaParty (chefoes.js:298)
- ofensaContra:59 - chama: MOVE_BY_NAME (dados_base.js:86), abilityTypeModFor (tipos.js:195), speciesTypeNames (tipos.js:253)

## regras/dados_base.js
- ABILITIES:10 - chamado por: descricaoDeHabilidade (condicoes_habilidade.js:89), descricaoDeHabilidadePorId (condicoes_habilidade.js:100), expandirTextoDeHabilidade (condicoes_habilidade.js:111), nomesDeHabilidades (condicoes_habilidade.js:128), efeitoDasHabilidadesNoDuelo (duelo.js:1486), +17
- ALL_NATURES:101 - chamado por: fecharBuild (pipeline_build.js:698), validateAiBuild (validacao_build_ia.js:208), myBuildEditorHtml (editor_build.js:223)
- EVOKINDS:13 - chamado por: evolveChainByX (evolucao.js:66), isMegaEvoKind (formas_mega.js:22), nivelDeEvolucaoDaForma (plano_build.js:68), evoConditionText (dex_ficha.js:88)
- EVO_LEVEL:30 - chamado por: evolveChainByX (evolucao.js:66), nivelDeEvolucaoDaForma (plano_build.js:68)
- EVO_LEVEL_FEMALE:32 - chamado por: evoConditionText (dex_ficha.js:88)
- EVO_LEVEL_MALE:31 - chamado por: evoConditionText (dex_ficha.js:88)
- EVO_MEGA_KINDS:34 - chamado por: isMegaEvoKind (formas_mega.js:22), evoConditionText (dex_ficha.js:88)
- EVO_PRIMAL:33 - chamado por: isMegaEvoKind (formas_mega.js:22), evoConditionText (dex_ficha.js:88)
- ITEMS:12 - chamado por: comoGarantir (condicoes_habilidade.js:174), garantiaDaCondicao (condicoes_habilidade.js:158), orientacaoMono (mono_run.js:144), pipelineEvioliteServe (pipeline_build.js:488), pipelineValidarRascunho (pipeline_build.js:493), +7
- MAPS:49 - chamado por: howToObtainText (dex_ficha.js:245), whereToFindText (dex_ficha.js:275)
- MONOTYPE_ARCHETYPES:158 - chamado por: applySave (save.js:47), archetypeCardHtml (arquetipo.js:85)
- MOVES:11 - chamado por: golpesFuturosDe (builds.js:179), acertosDoGolpeDuelo (duelo.js:232), efeitoDoPlanoDuelo (duelo.js:3601), escolherProximoDoChefao (duelo.js:4139), golpeDeRecargaDuelo (duelo.js:239), +23
- MOVE_BY_NAME:86 - chamado por: computeBossAttackTypes (chefoes.js:147), ameacaDe (confronto.js:91), coberturaSugerida (confronto.js:196), confrontoDamagingMoves (confronto.js:29), confrontoMoveType (confronto.js:32), +7
- MOVE_ID_BY_NAME:87 - chamado por: danoDoFuturoDuelo (duelo.js:2776), foeDeDuelo (duelo.js:3064), lerCondicaoDaFraseDuelo (duelo.js:496), lerDiversosDaFraseDuelo (duelo.js:686), poderDoDadoDuelo (duelo.js:2269), +9
- NATURE_MODS:90 - chamado por: calcFinalStat (calc_stat.js:160), conflitoDeNature (validacao_build_ia.js:113), validateAiBuild (validacao_build_ia.js:208)
- PACE_ARCHETYPES:146 - chamado por: applySave (save.js:47), archetypeCardHtml (arquetipo.js:85)
- ROLE_LABEL_PT:183 - chamado por: aiTool_getSpeciesRank (ferramentas_ia.js:24), blocoTimeEmUsoIA (prompts_ia.js:423), descricaoTimeParaGuia (prompts_ia.js:875), montarPromptTimeArquetipo (prompts_ia.js:823), nomePapel (prompts_ia.js:311), +2
- SPECIES:52 - chamado por: especiePorNomeDoItem (calc_stat.js:135), computeSpeedTiers (chefoes.js:495), especieDaFormaDuelo (duelo.js:3553), buildStandardAiTools (ferramentas_ia.js:249), especiesQueResolvem (pipeline_build.js:639), +4
- SPECIES_BY_SNAME:72 - chamado por: snamesToXs (save.js:15)
- SPLIT_LABEL_PT:184 - chamado por: aiTool_getSpeciesRank (ferramentas_ia.js:24), roleTagsHtml (dex_ficha.js:224)
- SPLIT_STATUS:29 - chamado por: moveRoleOf (golpes.js:53), conflitoDeItem (validacao_build_ia.js:130), updateMyBuildStatus (editor_build.js:362)
- TATICA_ARCHETYPES:151 - chamado por: applySave (save.js:47), archetypeCardHtml (arquetipo.js:85)
- TYPES:9 - chamado por: computeBossAttackTypes (chefoes.js:147), confrontoMoveType (confronto.js:32), efeitoDasHabilidadesNoDuelo (duelo.js:1486), escolherProximoDoChefao (duelo.js:4139), lerDiversosDaFraseDuelo (duelo.js:686), +11
- USABLE_TYPES:132 - chamado por: computeSharedRisks (chefoes.js:109), fraquezasDoTipo (mono_run.js:80), resistemAoTipo (mono_run.js:83), applySave (save.js:47), perfilDefensivoDaEspecie (tipos.js:178), +2
- WEATHER_ARCHETYPES:147 - chamado por: applySave (save.js:47), archetypeCardHtml (arquetipo.js:85)
- clampInt:103 - chamado por: applySave (save.js:47), sanitizarStrategySets (save.js:255), limitarEvsAoJogo (validacao_build_ia.js:163), lerFormularioDoEditor (editor_build.js:493), updateMyBuildEvTotal (editor_build.js:332), +1
- descricaoDaEspecie:189 - chamado por: fichaCabecalhoHtml (dex_ficha.js:515)
- getSpeciesBySname:79 - chamado por: entradaDeBuild (builds.js:23), confrontoFoesDe (chefoes.js:258), efeitoDasHabilidadesNoDuelo (duelo.js:1486), foeDeDuelo (duelo.js:3064), carryUserData (evolucao.js:167), +16
- getSpeciesByX:78 - chamado por: effectiveBuild (builds.js:202), itensEmUsoComQuem (builds.js:153), teamItemsInUse (builds.js:90), teamMovesInUse (builds.js:123), teamRolesInUse (builds.js:165), +56
- habilidadesEscolhiveis:119 - chamado por: formFamilyPromptNote (formas_mega.js:46), montarPromptTimeArquetipo (prompts_ia.js:823), habilidadeSubstitutaPara (reconciliar_build.js:26), reconciliarBuild (reconciliar_build.js:39), ajustarBuildDaIa (validacao_build_ia.js:494), +5
- snameOf:80 - chamado por: applySave (save.js:47), xsToSnames (save.js:24)
- uniqueIds:122 - chamado por: nomesDeHabilidades (condicoes_habilidade.js:128), armadoresDeClima (duelo.js:3273), climaDoTimeDoChefao (duelo.js:3090), comHabilidadesDuelo (duelo.js:3508), foeDeDuelo (duelo.js:3064), +17

## regras/duelo.js
- DURACAO_LADO_DUELO:4020 - chamado por: motorGanhoDaCondicao (time_pelo_motor_papeis.js:56)
- LIDO_PELO_TEXTO_NOVO_DUELO:201 - chamado por: expandirTextoDeHabilidade (condicoes_habilidade.js:111)
- STATUS_DUELO:357 - chamado por: podeTerStatus (condicoes_habilidade.js:136)
- TEXTO_DA_VERSAO_NOVA_DUELO:50 - chamado por: expandirTextoDeHabilidade (condicoes_habilidade.js:111)
- acertosDoGolpeDuelo:232 - chama: MOVES (dados_base.js:11)
- aguentaUmGolpe:2291 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:147), pipelineLinhaDoGolpe (pipeline_build.js:184)
- armadoresDeClima:3273 - chama: habilidadeArma (condicoes_habilidade.js:125), uniqueIds (dados_base.js:122) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:33)
- aterradoDuelo:960 - chama: abilityTypeModFor (tipos.js:195)
- bloqueiosNoDuelo:2764 - chamado por: pipelineLinhaDoGolpe (pipeline_build.js:184)
- climaDoTimeDoChefao:3090 - chama: habilidadeArma (condicoes_habilidade.js:125), ABILITY_ID_BY_NAME (confronto.js:17), getSpeciesByX (dados_base.js:78), uniqueIds (dados_base.js:122) | chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:79), motorMontarLutaComum (time_pelo_motor.js:90)
- comHabilidadesDuelo:3508 - chama: uniqueIds (dados_base.js:122)
- conferirTimeComBuilds:3199 - chama: getActiveBuild (evolucao.js:16) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337)
- danoDoFuturoDuelo:2776 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- danoNoDuelo:2078 - chama: CLIMA_OFICIAL (mono_run.js:132) | chamado por: motorProvasDosMembros (time_pelo_motor_papeis.js:157)
- efeitoDasHabilidadesNoDuelo:1486 - chama: habilidadeArma (condicoes_habilidade.js:125), ABILITIES (dados_base.js:10), TYPES (dados_base.js:9), getSpeciesBySname (dados_base.js:79) | chamado por: pipelineSemRecuo (pipeline_build.js:481), pipelineTiposExtraDeStab (pipeline_build.js:425), validateAiBuild (validacao_build_ia.js:208)
- efeitoDoPlanoDuelo:3601 - chama: MOVES (dados_base.js:11)
- efetividadeNoDuelo:2027 - chama: TYPE_MOD_ABILITIES (tipos.js:74), abilityTypeModFor (tipos.js:195), typeMultiplier (tipos.js:243)
- entrarNoLadoDuelo:4085 - chama: typeMultiplier (tipos.js:243)
- escolherProximoDoChefao:4139 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- especieDaFormaDuelo:3553 - chama: SPECIES (dados_base.js:52)
- fDanoGlobalHell:3061 - chama: state (nucleo.js:8)
- foeDeDuelo:3064 - chama: calcFinalStat (calc_stat.js:160), ABILITY_ID_BY_NAME (confronto.js:17), MOVE_ID_BY_NAME (dados_base.js:87), getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), +1 | chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:79), motorMontarLutaComum (time_pelo_motor.js:90)
- foesComBuffsDoGinasio:4225 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:79)
- foesComRegraDeCampo:4249 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:79)
- golpeDeRecargaDuelo:239 - chama: MOVES (dados_base.js:11)
- golpeUtilNoDuelo:253 - chama: MOVES (dados_base.js:11)
- golpesDeDueloAte:281 - chama: uniqueIds (dados_base.js:122) | chamado por: pipelineCandidatos (pipeline_build.js:522)
- golpesDeRecargaAte:274 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122)
- golpesDeStatusAte:287 - chama: uniqueIds (dados_base.js:122)
- golpesNecessariosComPrimeiroDuelo:2283 - chamado por: pipelineAvaliarConjunto (pipeline_build.js:278), pipelineLinhaDoGolpe (pipeline_build.js:184)
- golpesNecessariosDuelo:2281 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:147)
- habilidadeSemRegraNoDuelo:1793 - chama: habilidadeArma (condicoes_habilidade.js:125), ABILITIES (dados_base.js:10), TYPE_MOD_ABILITIES (tipos.js:74) | chamado por: pipelineHabilidadesSemRegra (pipeline_build.js:381)
- inicioDaLutaComBuffs:4270 - chamado por: motorMontarLuta (time_pelo_motor.js:79)
- itemDoDuelo:1006 - chama: itemRuleFor (calc_stat.js:149), speciesTypeNames (tipos.js:253)
- itemDoSetDuelo:1089 - chama: isMegaEvoKind (formas_mega.js:22), speciesTypeNames (tipos.js:253)
- ivDoJogadorDuelo:3102 - chama: state (nucleo.js:8)
- lerCondicaoDaFraseDuelo:496 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- lerDiversosDaFraseDuelo:686 - chama: MOVE_ID_BY_NAME (dados_base.js:87), TYPES (dados_base.js:9)
- melhorUnidadeContra:3138 - chama: uniqueIds (dados_base.js:122) | chamado por: motorBuildDoCandidato (time_pelo_motor.js:169)
- meuComBuffsDoGinasio:4262 - chama: MOVES (dados_base.js:11) | chamado por: motorSimular (time_pelo_motor.js:247), motorGanhoDaCondicao (time_pelo_motor_papeis.js:56), motorSimularComClima (time_pelo_motor_papeis.js:143), motorUnidadeNaLuta (time_pelo_motor_papeis.js:23)
- modoHellDuelo:356 - chama: state (nucleo.js:8)
- montarTimeContraChefaoEmPassos:4744 - chamado por: simularSemTravarATela (aba_chefoes.js:324)
- montarTimeNoClimaEmPassos:4612 - chama: ABILITY_ID_BY_NAME (confronto.js:17), CLIMA_OFICIAL (mono_run.js:132)
- nivelDoInimigoHell:3063 - chama: state (nucleo.js:8)
- nomeHabDuelo:46 - chama: ABILITIES (dados_base.js:10) | chamado por: pipelineCandidatos (pipeline_build.js:522), pipelineHabilidadesSemRegra (pipeline_build.js:381)
- novoLadoDuelo:4026 - chamado por: motorGanhoDaCondicao (time_pelo_motor_papeis.js:56), motorSimularComClima (time_pelo_motor_papeis.js:143)
- planoDoGolpeStatus:3305 - chamado por: motorUnidade (time_pelo_motor.js:235), motorCondicoes (time_pelo_motor_papeis.js:33), motorTemTipo (time_pelo_motor_papeis.js:202)
- planosUteisDuelo:3372 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- poderDoDadoDuelo:2269 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- poderDoGolpeDuelo:583 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- prepararGolpesDuelo:1855 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9), CLIMA_OFICIAL (mono_run.js:132)
- prioBloqueadaPelaHabilidadeDuelo:1841 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:147)
- quatroGolpesDeDano:3162 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- resultadoDoDuelo:2789 - chamado por: pipelineDuelo (pipeline_build.js:174), motorGanhoDaCondicao (time_pelo_motor_papeis.js:56)
- resumoProvadoPeloSimulador:3184 - chama: MOVES (dados_base.js:11) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337)
- semGolpesDeLadoDuelo:4720 - chamado por: motorTemGolpeDeLado (time_pelo_motor.js:276)
- semItemDuplicadoNoHell:3104 - chama: calcFinalStat (calc_stat.js:160)
- simularDuplaContraChefao:3812 - chamado por: motorSimular (time_pelo_motor.js:247)
- simularLutaContraChefao:4302 - chamado por: motorSimular (time_pelo_motor.js:247), motorLutaDetalhada (time_pelo_motor_papeis.js:136), motorSimularComClima (time_pelo_motor_papeis.js:143)
- simularLutaDeVerdadeContraChefao:4311 - chama: typeMultiplier (tipos.js:243)
- sinergiasDaEspecie:1435 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122) | chamado por: aiTool_getAbilityMovepoolSynergy (ferramentas_ia.js:75), pipelineSinergiasAtivas (pipeline_build.js:233), linhasContextoDaEspecieIA (prompts_ia.js:552), habilidadeSubstitutaPara (reconciliar_build.js:26), validateAiBuild (validacao_build_ia.js:208), +2
- temPrioridadeNoCampoDuelo:2337 - chamado por: pipelineLinhaDoGolpe (pipeline_build.js:184)
- textoHabDuelo:203 - chama: descricaoDeHabilidadePorId (condicoes_habilidade.js:100), expandirTextoDeHabilidade (condicoes_habilidade.js:111), ABILITIES (dados_base.js:10)
- tipoDoTextoDuelo:308 - chama: TYPES (dados_base.js:9)
- tiposNaBatalha:3056 - chama: speciesTypeNames (tipos.js:253)
- totalDePassosContraChefao:4743 - chamado por: simularSemTravarATela (aba_chefoes.js:324)
- unidadeDaBuild:3212 - chama: ABILITY_ID_BY_NAME (confronto.js:17), MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: pipelineTabela (pipeline_build.js:247), motorUnidade (time_pelo_motor.js:235), motorGanhoDaCondicao (time_pelo_motor_papeis.js:56), motorSimularComClima (time_pelo_motor_papeis.js:143)
- unidadeDeDuelo:3114 - chama: calcFinalStat (calc_stat.js:160), uniqueIds (dados_base.js:122), innatesAtivasNoNivel (level_cap.js:34) | chamado por: motorItensCandidatos (time_pelo_motor.js:370)
- unidadeSemClima:3225 - chamado por: motorSimularComClima (time_pelo_motor_papeis.js:143)

## regras/escolha_ia_candidatos.js
- blocoDeCandidatosParaIA:33 - chama: dadoExterno (golpes.js:19), speciesTypeNames (tipos.js:253)
- blocoPlanoCurtoIA:72 - chama: golpesFuturosDe (builds.js:179), MOVES (dados_base.js:11), TYPES (dados_base.js:9), SIGLA_CATEGORIA (golpes.js:27), dadoExterno (golpes.js:19), +2
- blocoTimeCurtoIA:55 - chama: itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), teamMovesInUse (builds.js:123), teamRolesInUse (builds.js:165), getSpeciesByX (dados_base.js:78), +3
- candidatosParaAEscolhaDaIa:201 - chama: candidatosDeBuild (pipeline_build.js:518) | chamado por: generateBuildWithAI (ia.js:278), gerarBuildsDoTimeComIA (ia.js:176)
- escolherCandidatoDaIa:168 - chamado por: generateBuildWithAI (ia.js:278), gerarBuildsDoTimeComIA (ia.js:176)
- fecharCandidatoDaEscolha:142 - chama: validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), fecharBuild (pipeline_build.js:698)
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
- getActiveBuild:16 - chamado por: effectiveBuild (builds.js:202), garantiaDoTime (condicoes_habilidade.js:144), conferirTimeComBuilds (duelo.js:3199), gravarBuildDaIaNaLista (gravacao_build_ia.js:68), respostaDaIaObsoleta (gravacao_build_ia.js:55), +10
- getBuildList:14 - chama: state (nucleo.js:8) | chamado por: gravarPlanoDaIa (gravacao_build_ia.js:134), acrescentarVarianteNaLista (lista_de_builds.js:23), buildQueSaiParaAbrirVaga (lista_de_builds.js:43), removerBuildDaLista (lista_de_builds.js:32), trocarBuildAtivaNaLista (lista_de_builds.js:11), +9
- logAutoAction:229 - chama: AUTO_LOG_MAX (save.js:37), state (nucleo.js:8) | chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68), gravarPlanoDaIa (gravacao_build_ia.js:134), applySave (save.js:47), autoEvolveRoster (auto_evolucao.js:20), aplicarCuradaNoTimeNovo (ia.js:153), +4
- marcarRevisaoPosEvolucao:236 - chama: getSpeciesBySname (dados_base.js:79)
- podarAutoEvolved:61 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- reconciliarBuildsDe:104 - chama: getSpeciesBySname (dados_base.js:79), reconciliarBuild (reconciliar_build.js:39), state (nucleo.js:8)
- reconciliarBuildsSalvas:148 - chama: state (nucleo.js:8) | chamado por: applySave (save.js:47)
- runTemAlgoPraZerar:247 - chama: state (nucleo.js:8) | chamado por: updateResetTeamBoxBtn (dex_ficha.js:751)

## regras/ferramentas_ia.js
- aiTool_getAbilityMovepoolSynergy:75 - chama: getSpeciesBySname (dados_base.js:79), sinergiasDaEspecie (duelo.js:1435)
- aiTool_getBoxCandidatesForBoss:182 - chama: bestBoxCandidateForBoss (chefoes.js:183), getRemainingBossEntries (chefoes.js:51)
- aiTool_getItemInfo:150 - chama: stripNote (builds.js:49), dadoExterno (golpes.js:19)
- aiTool_getNextBossRoster:120 - chama: bossPartyPorDificuldade (chefoes.js:327), confrontoFoesDe (chefoes.js:258), confrontoParaParty (chefoes.js:298), getRemainingBossEntries (chefoes.js:51), coberturaSugerida (confronto.js:196), +1
- aiTool_getPriorityMoveOptions:51 - chama: MOVES (dados_base.js:11), getSpeciesBySname (dados_base.js:79), availableMovesFor (level_cap.js:73)
- aiTool_getRemainingBosses:159 - chama: getRemainingBossEntries (chefoes.js:51), getSpeciesByX (dados_base.js:78), speciesTypeNames (tipos.js:253)
- aiTool_getSpeciesRank:24 - chama: ROLE_LABEL_PT (dados_base.js:183), SPLIT_LABEL_PT (dados_base.js:184), rankDe (rank_da_run.js:29)
- aiTool_getSpeedBenchmark:204 - chama: computeSpeedTiers (chefoes.js:495), getSpeciesBySname (dados_base.js:79)
- aiTool_getTeamWeaknesses:15 - chama: computeSharedRisks (chefoes.js:109), getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- buildStandardAiTools:249 - chama: SPECIES (dados_base.js:52) | chamado por: opcoesDaIA (ia.js:72)

## regras/formas_mega.js
- MEGA_BASE_BY_X:21 - chamado por: effectiveBuild (builds.js:202), tarefaDeRevisao (revisao_automatica.js:24)
- MEGA_PEDRAS_TARDIAS:110 - chamado por: etapaDaPedra (liberado_na_run.js:15)
- MEGA_UNLOCK_MILESTONE:94 - chamado por: etapaDaPedra (liberado_na_run.js:15)
- ROTULO_ETAPA_MEGA:179 - chamado por: avisosDaBuild (avisos_build.js:8)
- battleFamilyOf:209 - chamado por: rosterParaTimeIA (prompts_ia.js:777)
- battleUnitsOf:253 - chamado por: bestBoxCandidateForBoss (chefoes.js:183), bestRankForm (chefoes.js:333), confrontoMelhorUnidade (chefoes.js:269), especiesQueResolvem (pipeline_build.js:639), motorCandidatosEmPassos (time_pelo_motor.js:205), +3
- etapaDaMega:181 - chama: etapaDaPedra (liberado_na_run.js:15)
- evioliteFunciona:32 - chamado por: pipelineEvioliteServe (pipeline_build.js:488), blocoPapelIA (prompts_ia.js:312), conflitoDeItem (validacao_build_ia.js:130)
- formFamilyOf:65 - chama: getSpeciesByX (dados_base.js:78) | chamado por: mudancaDeTipo (mono_run.js:95), applyRecommendedTeam (arquetipo.js:207), otherFormsHtml (ficha_extras.js:206)
- formFamilyPromptNote:46 - chama: ABILITIES (dados_base.js:10), habilidadesEscolhiveis (dados_base.js:119), rankDe (rank_da_run.js:29), speciesTypeNames (tipos.js:253) | chamado por: blocoMegaIA (prompts_ia.js:354), descricaoTimeParaGuia (prompts_ia.js:875), montarPromptTimeArquetipo (prompts_ia.js:823)
- isMegaEvoKind:22 - chama: EVOKINDS (dados_base.js:13), EVO_MEGA_KINDS (dados_base.js:34), EVO_PRIMAL (dados_base.js:33) | chamado por: regraCasaComEspecie (calc_stat.js:139), itemDoSetDuelo (duelo.js:1089), linhaEvolutivaDe (mono_run.js:20), motorRaizDaLinha (time_pelo_motor.js:151)
- isMegaForm:71 - chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:202), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), mudancaDeTipo (mono_run.js:95), blocoMegaIA (prompts_ia.js:354), +6
- megaEvolutionUnlocked:95 - chama: state (nucleo.js:8) | chamado por: blocoMegaIA (prompts_ia.js:354), montarPromptTimeArquetipo (prompts_ia.js:823)
- megaFormLiberada:186 - chama: state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- megaFormsOf:38 - chama: getSpeciesByX (dados_base.js:78) | chamado por: validateAiBuild (validacao_build_ia.js:208)
- megaMode:82 - chama: state (nucleo.js:8) | chamado por: motorChaveDoContexto (time_pelo_motor.js:168), motorSimular (time_pelo_motor.js:247), megaStoneRuleFor (validacao_build_ia.js:14), modoMotorChave (modo_motor.js:21), initProgress (progresso.js:105), +1
- megaPromptBlock:216 - chamado por: blocoMegaIA (prompts_ia.js:354)
- megaSoNoDebug:187 - chamado por: megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- quandoMega:189 - chamado por: avisosDaBuild (avisos_build.js:8), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- rotuloEtapaDaMega:190 - chamado por: megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- stonesOf:243 - chamado por: megaStoneRuleFor (validacao_build_ia.js:14), validateAiBuild (validacao_build_ia.js:208)
- unitTypeMult:269 - chama: abilityTypeMod (tipos.js:172) | chamado por: bestBoxCandidateForBoss (chefoes.js:183), bossSafetyScore (chefoes.js:171), boxFitNote (resumo_luta.js:154)
- usableSpeciesFor:212 - chamado por: rosterParaTimeIA (prompts_ia.js:777)

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
- buildDoLoteDeBuilds:45 - chama: contextoDeValidacao (validacao_build_ia.js:191), validateAiBuild (validacao_build_ia.js:208) | chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- gravarBuildDaIaNaLista:68 - chama: getActiveBuild (evolucao.js:16), logAutoAction (evolucao.js:229), acrescentarVarianteNaLista (lista_de_builds.js:23), liberarVagaNaLista (lista_de_builds.js:51), trocarBuildAtivaNaLista (lista_de_builds.js:11)
- gravarPlanoDaIa:134 - chama: getBuildList (evolucao.js:14), logAutoAction (evolucao.js:229), nivelDoGolpe (plano_build.js:56), validarPlano (plano_build.js:80) | chamado por: gerarPlanoParaBuild (ia.js:342)
- gravarRespostaValidadaDaIa:105 - chama: capOuPadrao (level_cap.js:61), anexarPlanoDaIa (prompts_ia.js:208), ajustarBuildDaIa (validacao_build_ia.js:494) | chamado por: gravarBuildValidadaDaIa (ia.js:141)
- motivoDeNaoGerarBuild:18 - chama: isMegaForm (formas_mega.js:71), megaFormLiberada (formas_mega.js:186), quandoMega (formas_mega.js:189) | chamado por: generateBuildWithAI (ia.js:278), gerarBuildsDoTimeComIA (ia.js:176)
- respostaDaIaObsoleta:55 - chama: getActiveBuild (evolucao.js:16), state (nucleo.js:8)
- textoDaRetentativaDeBuild:35 - chamado por: generateBuildWithAI (ia.js:278)
- textoDeLimiteDeBuilds:61 - chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- validarRespostaDeBuildDaIa:26 - chama: contextoDeValidacao (validacao_build_ia.js:191), validateAiBuild (validacao_build_ia.js:208) | chamado por: fecharCandidatoDaEscolha (escolha_ia_candidatos.js:142), fecharBuild (pipeline_build.js:698), generateBuildWithAI (ia.js:278)
- validarRespostaDoLoteDeBuilds:40 - chamado por: gerarBuildsDoTimeComIA (ia.js:176)

## regras/level_cap.js
- LEVEL_CAP_MODES:15 - chamado por: applySave (save.js:47), initProgress (progresso.js:105)
- NIVEL_DA_INNATE_ELITE:33 - chamado por: blocoEspecieIA (prompts_ia.js:285)
- availableMovesFor:73 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122), liberadoNaRun (liberado_na_run.js:22), state (nucleo.js:8) | chamado por: confrontoUnitOf (chefoes.js:233), comoGarantir (condicoes_habilidade.js:174), precisaDeSetter (condicoes_habilidade.js:216), aiTool_getPriorityMoveOptions (ferramentas_ia.js:51), pipelineCandidatos (pipeline_build.js:522), +5
- capOuPadrao:61 - chamado por: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105), contextoDoMotor (time_pelo_motor.js:141), montarTimeContraEsteChefao (aba_chefoes.js:337), modoMotorChave (modo_motor.js:21)
- getCurrentCap:49 - chama: state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:202), entradaDeBuild (builds.js:23), blocoPlanoCurtoIA (escolha_ia_candidatos.js:72), montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86), +24
- golpesTravadosNoCap:90 - chama: MOVE_ID_BY_NAME (dados_base.js:87), liberadoNaRun (liberado_na_run.js:22), state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), contextoDoModoPrompt (prompts_ia.js:168), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:513), processarRevisoes (revisao_automatica.js:72), tarefaDeRevisao (revisao_automatica.js:24)
- innatesAtivasNoNivel:34 - chama: state (nucleo.js:8) | chamado por: unidadeDeDuelo (duelo.js:3114), pipelineCandidatos (pipeline_build.js:522)
- innatesTravadasNoNivel:44 - chamado por: blocoEspecieIA (prompts_ia.js:285)
- levelCapMode:16 - chama: state (nucleo.js:8) | chamado por: motorChaveDoContexto (time_pelo_motor.js:168), motorNivelDaEtapa (time_pelo_motor.js:73), modoMotorChave (modo_motor.js:21), initProgress (progresso.js:105)
- levelCapModeFromDifficulty:22 - chamado por: applySave (save.js:47)
- nivelDaHabilidadeNoElite:40 - chama: nomesDeHabilidades (condicoes_habilidade.js:128) | chamado por: marcasDoRankHtml (dex_ficha.js:297)
- nivelDeCalculo:65 - chamado por: computeSpeedTiers (chefoes.js:495), pipelineResolverAlvo (pipeline_build.js:71), blocoEspecieIA (prompts_ia.js:285), validateAiBuild (validacao_build_ia.js:208), montarTimeContraEsteChefao (aba_chefoes.js:337), +5

## regras/liberado_na_run.js
- entradasDoJogador:33 - chama: state (nucleo.js:8) | chamado por: applyRecommendedTeam (arquetipo.js:207), monoRunCardHtml (arquetipo.js:516)
- etapaDaPedra:15 - chama: MEGA_PEDRAS_TARDIAS (formas_mega.js:110), MEGA_UNLOCK_MILESTONE (formas_mega.js:94) | chamado por: avisosDaBuild (avisos_build.js:8), etapaDaMega (formas_mega.js:181)
- etapaDoItem:17 - chama: primeiroLugarDoItem (avisos_build.js:94) | chamado por: pipelineEvioliteServe (pipeline_build.js:488)
- liberadoNaRun:22 - chamado por: avisosDaBuild (avisos_build.js:8), availableMovesFor (level_cap.js:73), golpesTravadosNoCap (level_cap.js:90), pipelineEvioliteServe (pipeline_build.js:488), itensAindaIndisponiveisParaIA (prompts_ia.js:382), +4
- xsDoJogador:37 - chamado por: rosterParaTimeIA (prompts_ia.js:777), viramDoTipoPrompt (prompts_ia.js:812), contextoDoMotor (time_pelo_motor.js:141), candidatosDoJogador (aba_chefoes.js:248), modoMotorCapturados (modo_motor.js:26), +2

## regras/lista_de_builds.js
- acrescentarVarianteNaLista:23 - chama: entradaDeBuild (builds.js:23), getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68), gravarSugestoesDoMotor (sugestao_do_motor.js:61), addBuildVariant (nucleo.js:101)
- buildQueSaiParaAbrirVaga:43 - chama: getBuildList (evolucao.js:14) | chamado por: abrirVagaPreservando (nucleo.js:118)
- liberarVagaNaLista:51 - chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68)
- removerBuildDaLista:32 - chama: getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarSugestoesDoMotor (sugestao_do_motor.js:61), removeBuildIndex (nucleo.js:124)
- trocarBuildAtivaNaLista:11 - chama: entradaDeBuild (builds.js:23), getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68), setOrReplaceActiveBuild (nucleo.js:94)

## regras/mono_run.js
- CLIMA_OFICIAL:132 - chamado por: danoNoDuelo (duelo.js:2078), montarTimeNoClimaEmPassos (duelo.js:4612), prepararGolpesDuelo (duelo.js:1855), motorSimularComClima (time_pelo_motor_papeis.js:143)
- MONO_MARCAS:11 - chamado por: monoRunCardHtml (arquetipo.js:516)
- avisoProximoLider:158 - chama: bossPartyPorDificuldade (chefoes.js:327), getRemainingBossEntries (chefoes.js:51), gymLeaderBaseName (chefoes.js:45), MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9), +3 | chamado por: monoRunCardHtml (arquetipo.js:516)
- climaQueCombina:141 - chamado por: climaQueCombinaHtml (arquetipo.js:495)
- cobreFraquezas:88 - chama: abilityTypeMod (tipos.js:172) | chamado por: notaMonoDoCandidato (prompts_ia.js:806)
- compraDeInicialTexto:47 - chama: getSpeciesBySname (dados_base.js:79) | chamado por: fichaCabecalhoHtml (dex_ficha.js:515)
- fraquezasDoTipo:80 - chama: USABLE_TYPES (dados_base.js:132), typeMultiplier (tipos.js:243) | chamado por: notaMonoDoCandidato (prompts_ia.js:806), monoRunCardHtml (arquetipo.js:516)
- linhaEvolutivaDe:20 - chama: getSpeciesByX (dados_base.js:78), isMegaEvoKind (formas_mega.js:22)
- monoDisponibilidade:176 - chama: getSpeciesBySname (dados_base.js:79), rankDe (rank_da_run.js:29) | chamado por: monoRunCardHtml (arquetipo.js:516)
- monotypeAtivo:72 - chama: state (nucleo.js:8) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337), renderBossDetail (aba_chefoes.js:589)
- mudancaDeTipo:95 - chama: formFamilyOf (formas_mega.js:65), isMegaForm (formas_mega.js:71), speciesTypeNames (tipos.js:253) | chamado por: notaMonoDoCandidato (prompts_ia.js:806), viramDoTipoPrompt (prompts_ia.js:812)
- orientacaoMono:144 - chama: ITEMS (dados_base.js:12) | chamado por: archetypeBuildGuidance (prompts_ia.js:141), montarPromptTimeArquetipo (prompts_ia.js:823)
- resistemAoTipo:83 - chama: USABLE_TYPES (dados_base.js:132), typeMultiplier (tipos.js:243)
- serveProMono:74 - chama: speciesTypeNames (tipos.js:253) | chamado por: bestBoxCandidateForBoss (chefoes.js:183), confrontoUnidadesDaCaixa (chefoes.js:289), especiesQueResolvem (pipeline_build.js:639), motorCandidatosEmPassos (time_pelo_motor.js:205), motorClassificar (time_pelo_motor_papeis.js:207), +2

## regras/pipeline_build.js
- candidatosDeBuild:518 - chamado por: candidatosParaAEscolhaDaIa (escolha_ia_candidatos.js:201), pipelineResultado (pipeline_tela.js:14)
- especiesQueResolvem:639 - chama: SPECIES (dados_base.js:52), getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:253), serveProMono (mono_run.js:74), rankDe (rank_da_run.js:29), +1 | chamado por: quemResolveCalcular (quem_resolve.js:22)
- fecharBuild:698 - chama: ALL_NATURES (dados_base.js:101), getSpeciesBySname (dados_base.js:79), validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), megaStoneRuleFor (validacao_build_ia.js:14) | chamado por: fecharCandidatoDaEscolha (escolha_ia_candidatos.js:142)
- pipelineAmeacasDePrioridade:147 - chama: aguentaUmGolpe (duelo.js:2291), golpesNecessariosDuelo (duelo.js:2281), prioBloqueadaPelaHabilidadeDuelo (duelo.js:1841)
- pipelineAvaliarConjunto:278 - chama: golpesNecessariosComPrimeiroDuelo (duelo.js:2283)
- pipelineCandidatos:522 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122), golpesDeDueloAte (duelo.js:281), nomeHabDuelo (duelo.js:46), moveRoleOf (golpes.js:53), +4 | chamado por: motorBuildDoCandidato (time_pelo_motor.js:169)
- pipelineDuelo:174 - chama: resultadoDoDuelo (duelo.js:2789)
- pipelineEspecie:59 - chama: getSpeciesBySname (dados_base.js:79)
- pipelineEvioliteServe:488 - chama: ITEMS (dados_base.js:12), evioliteFunciona (formas_mega.js:32), getCurrentCap (level_cap.js:49), etapaDoItem (liberado_na_run.js:17), liberadoNaRun (liberado_na_run.js:22), +1
- pipelineGolpesComRecuo:474 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- pipelineHabilidadesSemRegra:381 - chama: ABILITY_ID_BY_NAME (confronto.js:17), habilidadeSemRegraNoDuelo (duelo.js:1793), nomeHabDuelo (duelo.js:46)
- pipelineLinhaDoGolpe:184 - chama: aguentaUmGolpe (duelo.js:2291), bloqueiosNoDuelo (duelo.js:2764), golpesNecessariosComPrimeiroDuelo (duelo.js:2283), temPrioridadeNoCampoDuelo (duelo.js:2337)
- pipelineMontarConjunto:328 - chama: moveRoleOf (golpes.js:53)
- pipelineResolverAlvo:71 - chama: DIFF_TO_BOSSKEY (chefoes.js:19), LUTAS_DA_RUN (chefoes.js:314), bossPartyPorDificuldade (chefoes.js:327), buffsAtivosDoChefao (chefoes.js:482), getRemainingBossEntries (chefoes.js:51), +7 | chamado por: motorBuildDoCandidato (time_pelo_motor.js:169)
- pipelineSemRecuo:481 - chama: ABILITY_ID_BY_NAME (confronto.js:17), uniqueIds (dados_base.js:122), efeitoDasHabilidadesNoDuelo (duelo.js:1486)
- pipelineSinergiasAtivas:233 - chama: sinergiasDaEspecie (duelo.js:1435)
- pipelineTabela:247 - chama: unidadeDaBuild (duelo.js:3212)
- pipelineTiposExtraDeStab:425 - chama: ABILITY_ID_BY_NAME (confronto.js:17), uniqueIds (dados_base.js:122), efeitoDasHabilidadesNoDuelo (duelo.js:1486)
- pipelineValidarRascunho:493 - chama: ITEMS (dados_base.js:12), contextoDeValidacao (validacao_build_ia.js:191), megaStoneRuleFor (validacao_build_ia.js:14), validateAiBuild (validacao_build_ia.js:208)

## regras/plano_build.js
- ESTILO_ROTULO:20 - chamado por: rotuloDaBuild (ficha_extras.js:170)
- ROTULOS_EV:21 - chamado por: evsToShowdownText (builds.js:75)
- curadaParaEstilo:160 - chamado por: effectiveBuild (builds.js:202), aplicarCuradaNoTimeNovo (ia.js:153), processarRevisoes (revisao_automatica.js:72), tarefaDeRevisao (revisao_automatica.js:24)
- curadasDe:153 - chamado por: montarPromptEstrategias (prompts_ia.js:713)
- estiloDeEvs:37 - chamado por: effectiveBuild (builds.js:202), montarPromptEstrategias (prompts_ia.js:713)
- estiloDoRitmo:48 - chamado por: effectiveBuild (builds.js:202), aplicarCuradaNoTimeNovo (ia.js:153), processarRevisoes (revisao_automatica.js:72), tarefaDeRevisao (revisao_automatica.js:24)
- evsTextoParaArray:24 - chamado por: ajustarBuildDaIa (validacao_build_ia.js:494), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:513), processarRevisoes (revisao_automatica.js:72)
- golpesNoCap:123 - chamado por: effectiveBuild (builds.js:202), myBuildEditorHtml (editor_build.js:223)
- nivelDeEvolucaoDaForma:68 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL (dados_base.js:30) | chamado por: golpesFuturosDe (builds.js:179)
- nivelDoGolpe:56 - chama: MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: golpesFuturosDe (builds.js:179), gravarPlanoDaIa (gravacao_build_ia.js:134)
- planoSaneado:107 - chamado por: entradaDeBuild (builds.js:23), anteriorSaneado (save.js:236), applySave (save.js:47)
- trocasEntreCaps:141 - chamado por: registrarTrocasDoPlano (revisao_automatica.js:149)
- validarPlano:80 - chamado por: gravarPlanoDaIa (gravacao_build_ia.js:134), anexarPlanoDaIa (prompts_ia.js:208)

## regras/prompts_ia.js
- AI_ITEM_POOL:91 - chamado por: validateAiBuild (validacao_build_ia.js:208)
- anexarPlanoDaIa:208 - chama: validarPlano (plano_build.js:80) | chamado por: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105)
- archetypeBuildGuidance:141 - chama: orientacaoMono (mono_run.js:144), state (nucleo.js:8) | chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- avisoInnatesEliteIA:575 - chama: getCurrentCap (level_cap.js:49), state (nucleo.js:8)
- blocoEspecieIA:285 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122), NIVEL_DA_INNATE_ELITE (level_cap.js:33), innatesTravadasNoNivel (level_cap.js:44), nivelDeCalculo (level_cap.js:65), +1
- blocoItensAindaIndisponiveisIA:387 - chama: rotuloDaEtapaDoItem (avisos_build.js:98)
- blocoItensComunsIA:393 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), ITEMS (dados_base.js:12) | chamado por: montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- blocoItensDaEspecieIA:370 - chama: regraItemConsumivelPrompt (validacao_build_ia.js:57) | chamado por: montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- blocoItensIA:375 - chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86)
- blocoManualIA:469 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122)
- blocoMegaIA:354 - chama: formFamilyPromptNote (formas_mega.js:46), isMegaForm (formas_mega.js:71), megaEvolutionUnlocked (formas_mega.js:95), megaPromptBlock (formas_mega.js:216), megaStoneRuleFor (validacao_build_ia.js:14)
- blocoMovepoolIA:342 - chama: LEGENDA_GOLPE (golpes.js:26), movePromptLine (golpes.js:28), availableMovesFor (level_cap.js:73)
- blocoPapelIA:312 - chama: computeSharedRisks (chefoes.js:109), ITEMS (dados_base.js:12), getSpeciesByX (dados_base.js:78), evioliteFunciona (formas_mega.js:32), ehGolpeDePivo (golpes.js:41), +3
- blocoTimeEmUsoIA:423 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), teamMovesInUse (builds.js:123), teamRolesInUse (builds.js:165), +2
- cabecalhoIA:274 - chama: PROMPT_DADOS_AVISO (golpes.js:17) | chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- comDescricaoIA:367 - chama: dadoExterno (golpes.js:19)
- contextoDoModoPrompt:168 - chama: NOME_DA_CONDICAO (condicoes_habilidade.js:42), dadoExterno (golpes.js:19), golpesTravadosNoCap (level_cap.js:90)
- descricaoTimeParaGuia:875 - chama: effectiveBuild (builds.js:202), ROLE_LABEL_PT (dados_base.js:183), formFamilyPromptNote (formas_mega.js:46), speciesTypeNames (tipos.js:253)
- guiaDaResposta:908 - chamado por: generateTeamUsageGuide (arquetipo.js:270)
- itensAindaIndisponiveisParaIA:382 - chama: primeiroLugarDoItem (avisos_build.js:94), getCurrentCap (level_cap.js:49), liberadoNaRun (liberado_na_run.js:22), state (nucleo.js:8)
- itensDeEspeciePara:84 - chama: ITEMS (dados_base.js:12) | chamado por: validateAiBuild (validacao_build_ia.js:208)
- linhaHabilidadeIA:281 - chama: ABILITIES (dados_base.js:10), dadoExterno (golpes.js:19)
- linhaProvadoIA:600 - chama: dadoExterno (golpes.js:19) | chamado por: linhaDoChefaoPorEspecieIA (escolha_ia_candidatos.js:68)
- linhaVelocidadeIA:490 - chama: calcFinalStat (calc_stat.js:160), computeSpeedTiers (chefoes.js:495), state (nucleo.js:8)
- linhasContextoComumIA:581 - chama: getRemainingBossEntries (chefoes.js:51), getSpeciesByX (dados_base.js:78), speciesTypeNames (tipos.js:253)
- linhasContextoDaEspecieIA:552 - chama: sinergiasDaEspecie (duelo.js:1435), rankDe (rank_da_run.js:29)
- linhasProximaLutaIA:506 - chama: bestBoxCandidateForBoss (chefoes.js:183), bossPartyPorDificuldade (chefoes.js:327), confrontoFoesDe (chefoes.js:258), confrontoParaParty (chefoes.js:298), ehRevancheDeLider (chefoes.js:454), +6
- montarPromptBuild:610 - chama: blocoCondicoesIA (condicoes_habilidade.js:241), getCurrentCap (level_cap.js:49) | chamado por: generateBuildWithAI (ia.js:278)
- montarPromptBuildsDoTime:665 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), NOME_DA_CONDICAO (condicoes_habilidade.js:42), blocoCondicoesIA (condicoes_habilidade.js:241), dadoExterno (golpes.js:19), getCurrentCap (level_cap.js:49) | chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- montarPromptEstrategias:713 - chama: blocoCondicoesIA (condicoes_habilidade.js:241), getCurrentCap (level_cap.js:49), curadasDe (plano_build.js:153), estiloDeEvs (plano_build.js:37) | chamado por: generateStrategySets (revisao_automatica.js:182)
- montarPromptGuia:885 - chamado por: generateTeamUsageGuide (arquetipo.js:270)
- montarPromptPlano:765 - chama: PROMPT_DADOS_AVISO (golpes.js:17), dadoExterno (golpes.js:19), speciesTypeNames (tipos.js:253) | chamado por: gerarPlanoParaBuild (ia.js:342)
- montarPromptTimeArquetipo:823 - chama: effectiveBuild (builds.js:202), ABILITIES (dados_base.js:10), ROLE_LABEL_PT (dados_base.js:183), habilidadesEscolhiveis (dados_base.js:119), formFamilyPromptNote (formas_mega.js:46), +5 | chamado por: generateTeamForArchetype (arquetipo.js:153)
- nomePapel:311 - chama: ROLE_LABEL_PT (dados_base.js:183) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), linhaDePapelNaturalIA (escolha_ia_candidatos.js:47)
- notaMonoDoCandidato:806 - chama: cobreFraquezas (mono_run.js:88), fraquezasDoTipo (mono_run.js:80), mudancaDeTipo (mono_run.js:95)
- planoPromptBlock:158 - chama: golpesFuturosDe (builds.js:179), LEGENDA_GOLPE (golpes.js:26), movePromptLine (golpes.js:28)
- rosterParaTimeIA:777 - chama: getSpeciesByX (dados_base.js:78), battleFamilyOf (formas_mega.js:209), usableSpeciesFor (formas_mega.js:212), xsDoJogador (liberado_na_run.js:37), speciesTypeNames (tipos.js:253) | chamado por: generateTeamForArchetype (arquetipo.js:153)
- sampleErrorMessage:230 - chamado por: pedirIAAgora (ia.js:109)
- snamesValidosDoTime:863 - chamado por: generateTeamForArchetype (arquetipo.js:153)
- soExistentes:32 - chama: ITEMS (dados_base.js:12)
- versaoDosDados:273 - chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- viramDoTipoPrompt:812 - chama: getSpeciesByX (dados_base.js:78), xsDoJogador (liberado_na_run.js:37), mudancaDeTipo (mono_run.js:95)

## regras/rank_da_run.js
- FORA_DO_RANK:10 - chamado por: rankBadgeHtml (dex_ficha.js:169), rankInfoLineHtml (dex_ficha.js:319)
- MOTIVO_FORA_DO_RANK_PT:17 - chamado por: rankBadgeHtml (dex_ficha.js:169), rankInfoLineHtml (dex_ficha.js:319)
- rankDaDificuldadeDe:69 - chamado por: marcasDoRankHtml (dex_ficha.js:297)
- rankDe:29 - chama: state (nucleo.js:8) | chamado por: bestBoxCandidateForBoss (chefoes.js:183), bestRankForm (chefoes.js:333), aiTool_getSpeciesRank (ferramentas_ia.js:24), formFamilyPromptNote (formas_mega.js:46), monoDisponibilidade (mono_run.js:176), +10

## regras/reconciliar_build.js
- habilidadeSubstitutaPara:26 - chama: habilidadesEscolhiveis (dados_base.js:119), sinergiasDaEspecie (duelo.js:1435)
- movepoolCompletoDe:17 - chama: MOVES (dados_base.js:11)
- reconciliarBuild:39 - chama: habilidadesEscolhiveis (dados_base.js:119) | chamado por: effectiveBuild (builds.js:202), reconciliarBuildsDe (evolucao.js:104)

## regras/save.js
- AUTO_LOG_MAX:37 - chamado por: logAutoAction (evolucao.js:229)
- anteriorSaneado:236 - chama: planoSaneado (plano_build.js:107)
- applySave:47 - chama: BUILD_SOURCES (builds.js:17), MONOTYPE_ARCHETYPES (dados_base.js:158), PACE_ARCHETYPES (dados_base.js:146), TATICA_ARCHETYPES (dados_base.js:151), USABLE_TYPES (dados_base.js:132), +10 | chamado por: loadSave (nucleo.js:337), aplicarSaveRemoto (sync.js:45)
- buildSave:336 - chamado por: persist (nucleo.js:144), aplicarSaveRemoto (sync.js:45), connectSync (sync.js:179)
- conferirSomaDoSave:326 - chamado por: loadSave (nucleo.js:337), remotoComSomaErrada (sync.js:88)
- montarSave:341 - chama: state (nucleo.js:8)
- reconciliouAoAplicar:44 - chamado por: loadSave (nucleo.js:337), aplicarSaveRemoto (sync.js:45)
- sanitizarStrategySets:255 - chama: clampInt (dados_base.js:103), getSpeciesBySname (dados_base.js:79) | chamado por: generateStrategySets (revisao_automatica.js:182)
- saveChegandoTemMenosProgresso:383 - chamado por: conflitoDeProgresso (sync.js:61)
- saveEnviavel:333 - chamado por: connectSync (sync.js:179), remotoComSomaErrada (sync.js:88)
- snamesToXs:15 - chama: SPECIES_BY_SNAME (dados_base.js:72) | chamado por: carregarTimeSalvo (time.js:245), renderSavedTeams (time.js:206)
- syncContentDiffers:397 - chamado por: connectSync (sync.js:179)
- xsToSnames:24 - chama: snameOf (dados_base.js:80) | chamado por: guardarTimeAnterior (aba_chefoes.js:266)

## regras/sugestao_do_motor.js
- SUGESTAO_ROTULO:11 - chamado por: buildChipsHtml (editor_build.js:212), rotuloDaBuild (ficha_extras.js:170), modoMotorFicarComVariante (modo_motor.js:119), modoMotorRodapeHtml (modo_motor.js:190)
- gravarSugestoesDoMotor:61 - chama: entradaDeBuild (builds.js:23), getBuildList (evolucao.js:14), acrescentarVarianteNaLista (lista_de_builds.js:23), removerBuildDaLista (lista_de_builds.js:32), state (nucleo.js:8) | chamado por: modoMotorFicarComVariante (modo_motor.js:119)
- planoDeGravarSugestoes:39 - chama: getActiveBuild (evolucao.js:16), getBuildList (evolucao.js:14) | chamado por: modoMotorFicarComVariante (modo_motor.js:119)

## regras/time_pelo_motor.js
- contextoDoMotor:141 - chama: capOuPadrao (level_cap.js:61), xsDoJogador (liberado_na_run.js:37), state (nucleo.js:8) | chamado por: modoMotorAquecer (modo_motor.js:40), modoMotorMontar (modo_motor.js:68)
- criarCacheDoMotor:65 - chamado por: modoMotorCache (modo_motor.js:19)
- montarTimePeloMotorEmPassos:434 - chama: SPECIES (dados_base.js:52), motorClassificar (time_pelo_motor_papeis.js:207), motorTextos (time_pelo_motor_papeis.js:306) | chamado por: modoMotorMontar (modo_motor.js:68)
- motorAquecerBuildsEmPassos:229 - chamado por: modoMotorAquecer (modo_motor.js:40)
- motorArred:62 - chamado por: motorClassificar (time_pelo_motor_papeis.js:207), motorDeltaSemMembro (time_pelo_motor_papeis.js:194), motorDeltaSemTipos (time_pelo_motor_papeis.js:198), motorProvasDosMembros (time_pelo_motor_papeis.js:157)
- motorAvaliar:264 - chamado por: motorClassificar (time_pelo_motor_papeis.js:207)
- motorBuildDoCandidato:169 - chama: ABILITIES (dados_base.js:10), MOVES (dados_base.js:11), melhorUnidadeContra (duelo.js:3138), getActiveBuild (evolucao.js:16), liberadoNaRun (liberado_na_run.js:22), +2
- motorCandidatosEmPassos:205 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:253), serveProMono (mono_run.js:74)
- motorChaveDaBuild:165 - chamado por: motorAlternativasArmadoras (time_pelo_motor_papeis.js:101)
- motorChaveDoContexto:168 - chama: megaMode (formas_mega.js:82), levelCapMode (level_cap.js:16), state (nucleo.js:8) | chamado por: motorAlternativasArmadoras (time_pelo_motor_papeis.js:101)
- motorFecharItens:395 - chama: itemEsgotadoNoTime (builds.js:152)
- motorGuardar:66 - chamado por: motorAux (time_pelo_motor_papeis.js:26)
- motorItensCandidatos:370 - chama: ITEMS (dados_base.js:12), MOVES (dados_base.js:11), unidadeDeDuelo (duelo.js:3114), liberadoNaRun (liberado_na_run.js:22), conflitoDeItem (validacao_build_ia.js:130)
- motorLutasComunsDoContexto:108 - chama: DIFF_TO_BOSSKEY (chefoes.js:19), state (nucleo.js:8)
- motorLutasDoContexto:123 - chama: LUTAS_DA_RUN (chefoes.js:314)
- motorMontarLuta:79 - chama: DIFF_TO_BOSSKEY (chefoes.js:19), bossPartyPorDificuldade (chefoes.js:327), buffsAtivosDoChefao (chefoes.js:482), regraDeCampoDoChefao (chefoes.js:416), climaDoTimeDoChefao (duelo.js:3090), +5 | chamado por: motorLutaComClima (time_pelo_motor_papeis.js:53)
- motorMontarLutaComum:90 - chama: climaDoTimeDoChefao (duelo.js:3090), foeDeDuelo (duelo.js:3064)
- motorNivelDaEtapa:73 - chama: levelCapMode (level_cap.js:16)
- motorRaizDaLinha:151 - chama: SPECIES (dados_base.js:52), isMegaEvoKind (formas_mega.js:22)
- motorSimular:247 - chama: meuComBuffsDoGinasio (duelo.js:4262), simularDuplaContraChefao (duelo.js:3812), simularLutaContraChefao (duelo.js:4302), megaMode (formas_mega.js:82), state (nucleo.js:8) | chamado por: motorClassificar (time_pelo_motor_papeis.js:207), motorDeltaSemMembro (time_pelo_motor_papeis.js:194), motorDeltaSemTipos (time_pelo_motor_papeis.js:198)
- motorTemGolpeDeLado:276 - chama: semGolpesDeLadoDuelo (duelo.js:4720)
- motorUnidade:235 - chama: planoDoGolpeStatus (duelo.js:3305), unidadeDaBuild (duelo.js:3212) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:33), motorProvasDosMembros (time_pelo_motor_papeis.js:157), motorTemTipo (time_pelo_motor_papeis.js:202), motorUnidadeNaLuta (time_pelo_motor_papeis.js:23)

## regras/time_pelo_motor_papeis.js
- MOTOR_FRASE_DA_PROVA:321 - chamado por: modoMotorMembroHtml (modo_motor.js:177)
- motorAlternativasArmadoras:101 - chama: liberadoNaRun (liberado_na_run.js:22), motorChaveDaBuild (time_pelo_motor.js:165), motorChaveDoContexto (time_pelo_motor.js:168)
- motorAux:26 - chama: motorGuardar (time_pelo_motor.js:66)
- motorClassificar:207 - chama: serveProMono (mono_run.js:74), motorArred (time_pelo_motor.js:62), motorAvaliar (time_pelo_motor.js:264), motorSimular (time_pelo_motor.js:247), state (nucleo.js:8) | chamado por: montarTimePeloMotorEmPassos (time_pelo_motor.js:434)
- motorCondicoes:33 - chama: ABILITY_ID_BY_NAME (confronto.js:17), MOVES (dados_base.js:11), armadoresDeClima (duelo.js:3273), planoDoGolpeStatus (duelo.js:3305), motorUnidade (time_pelo_motor.js:235)
- motorDeltaSemMembro:194 - chama: motorArred (time_pelo_motor.js:62), motorSimular (time_pelo_motor.js:247)
- motorDeltaSemTipos:198 - chama: motorArred (time_pelo_motor.js:62), motorSimular (time_pelo_motor.js:247)
- motorGanhoDaCondicao:56 - chama: DURACAO_LADO_DUELO (duelo.js:4020), meuComBuffsDoGinasio (duelo.js:4262), novoLadoDuelo (duelo.js:4026), resultadoDoDuelo (duelo.js:2789), unidadeDaBuild (duelo.js:3212)
- motorLutaComClima:53 - chama: motorMontarLuta (time_pelo_motor.js:79)
- motorLutaDetalhada:136 - chama: simularLutaContraChefao (duelo.js:4302)
- motorProvasDosMembros:157 - chama: danoNoDuelo (duelo.js:2078), motorArred (time_pelo_motor.js:62), motorUnidade (time_pelo_motor.js:235)
- motorSimularComClima:143 - chama: meuComBuffsDoGinasio (duelo.js:4262), novoLadoDuelo (duelo.js:4026), simularLutaContraChefao (duelo.js:4302), unidadeDaBuild (duelo.js:3212), unidadeSemClima (duelo.js:3225), +1
- motorTemTipo:202 - chama: planoDoGolpeStatus (duelo.js:3305), motorUnidade (time_pelo_motor.js:235)
- motorTextos:306 - chamado por: montarTimePeloMotorEmPassos (time_pelo_motor.js:434)
- motorUnidadeNaLuta:23 - chama: meuComBuffsDoGinasio (duelo.js:4262), motorUnidade (time_pelo_motor.js:235)

## regras/tipos.js
- TYPE_MOD_ABILITIES:74 - chamado por: efetividadeNoDuelo (duelo.js:2027), habilidadeSemRegraNoDuelo (duelo.js:1793)
- abilityTypeMod:172 - chamado por: computeSharedRisks (chefoes.js:109), unitTypeMult (formas_mega.js:269), cobreFraquezas (mono_run.js:88), renderTeamAnalysis (arquetipo.js:599)
- abilityTypeModFor:195 - chama: ABILITIES (dados_base.js:10) | chamado por: ameacaDe (confronto.js:91), coberturaSugerida (confronto.js:196), ofensaContra (confronto.js:59), aterradoDuelo (duelo.js:960), efetividadeNoDuelo (duelo.js:2027)
- alwaysActiveAbilities:163 - chamado por: confrontoUnitOf (chefoes.js:233)
- perfilDefensivoDaEspecie:178 - chama: USABLE_TYPES (dados_base.js:132) | chamado por: fichaEfetividadeHtml (dex_ficha.js:434)
- speciesTypeNames:253 - chama: TYPES (dados_base.js:9) | chamado por: confrontoUnitOf (chefoes.js:233), podeTerStatus (condicoes_habilidade.js:136), coberturaSugerida (confronto.js:196), ofensaContra (confronto.js:59), itemDoDuelo (duelo.js:1006), +28
- typeMultiplier:243 - chamado por: efetividadeNoDuelo (duelo.js:2027), entrarNoLadoDuelo (duelo.js:4085), simularLutaDeVerdadeContraChefao (duelo.js:4311), avisoProximoLider (mono_run.js:158), fraquezasDoTipo (mono_run.js:80), +2

## regras/validacao_build_ia.js
- ITENS_CHOICE:105 - chamado por: avisosDaBuild (avisos_build.js:8)
- ajustarBuildDaIa:494 - chama: habilidadesEscolhiveis (dados_base.js:119), evsTextoParaArray (plano_build.js:24) | chamado por: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105)
- conferirPapelDaBuild:80 - chama: ehGolpeDePivo (golpes.js:41), availableMovesFor (level_cap.js:73), state (nucleo.js:8)
- conflitoDeItem:130 - chama: MOVE_BY_NAME (dados_base.js:86), SPLIT_STATUS (dados_base.js:29), evioliteFunciona (formas_mega.js:32), speciesTypeNames (tipos.js:253) | chamado por: avisosDaBuild (avisos_build.js:8), motorItensCandidatos (time_pelo_motor.js:370)
- conflitoDeNature:113 - chama: MOVE_BY_NAME (dados_base.js:86), NATURE_MODS (dados_base.js:90), moveRoleOf (golpes.js:53), state (nucleo.js:8)
- contextoDeValidacao:191 - chama: buffsAtivosDoChefao (chefoes.js:482), habilidadesEscolhiveis (dados_base.js:119) | chamado por: buildDoLoteDeBuilds (gravacao_build_ia.js:45), validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), pipelineValidarRascunho (pipeline_build.js:493)
- entradaDaCuradaParaTimeNovo:513 - chama: itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), stripNote (builds.js:49), habilidadesEscolhiveis (dados_base.js:119), golpesTravadosNoCap (level_cap.js:90), +1 | chamado por: aplicarCuradaNoTimeNovo (ia.js:153)
- limitarEvsAoJogo:163 - chama: clampInt (dados_base.js:103)
- megaStoneRuleFor:14 - chama: isMegaForm (formas_mega.js:71), megaMode (formas_mega.js:82), stonesOf (formas_mega.js:243) | chamado por: avisosDaBuild (avisos_build.js:8), comoGarantir (condicoes_habilidade.js:174), fecharBuild (pipeline_build.js:698), pipelineValidarRascunho (pipeline_build.js:493), blocoMegaIA (prompts_ia.js:354), +1
- regraItemConsumivelPara:47 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122)
- regraItemConsumivelPrompt:57 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122) | chamado por: blocoItensDaEspecieIA (prompts_ia.js:370)
- setsValidosDaResposta:478 - chamado por: generateStrategySets (revisao_automatica.js:182)
- validateAiBuild:208 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), trimAndReallocateEvs (calc_stat.js:238), condicaoDaBuild (condicoes_habilidade.js:193), +23 | chamado por: buildDoLoteDeBuilds (gravacao_build_ia.js:45), validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), pipelineValidarRascunho (pipeline_build.js:493)
