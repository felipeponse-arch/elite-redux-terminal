# Chamadas entre arquivos - src/regras/

Gerado por `npm run mapa` (scripts/mapa_chamadas.mjs, API do TypeScript); não edite à mão.
Por função de nível superior: `chama:` e `chamado por:` funções de OUTROS arquivos de src/regras e src/ui, como `nome (arquivo:linha)`;
no máximo 5 por lista, o resto vira `+N`. Referência vale também como callback. Chamada pelo template/HTML não aparece. Mapa geral: [mapa-do-codigo.md](../mapa-do-codigo.md).

## regras/avisos_build.js
- avisosDaBuild:8 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), stripNote (builds.js:49), garantiaDaCondicao (condicoes_habilidade.js:154), +15 | chamado por: buildContextNotesHtml (editor_build.js:161)
- ondeAcharItemTexto:100 - chamado por: itemDescHtml (editor_build.js:45)
- primeiroLugarDoItem:94 - chamado por: etapaDoItem (liberado_na_run.js:17), itensAindaIndisponiveisParaIA (prompts_ia.js:299)
- rotuloDaEtapaDoItem:98 - chamado por: blocoItensAindaIndisponiveisIA (prompts_ia.js:307)
- seloDaBuild:82 - chamado por: seloDaBuildHtml (editor_build.js:168)

## regras/builds.js
- BUILD_SOURCES:17 - chamado por: applySave (save.js:47)
- MAX_MESMO_ITEM_NO_TIME:150 - chamado por: avisosDaBuild (avisos_build.js:8), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103), blocoItensComunsIA (prompts_ia.js:313), blocoTimeEmUsoIA (prompts_ia.js:343), montarPromptBuildsDoTime (prompts_ia.js:585), +1
- comecarLoteDeBuilds:118 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337), generateCompleteTeam (arquetipo.js:302)
- concluirBuildDoLote:119 - chamado por: generateCompleteTeam (arquetipo.js:302), gerarBuildsDoTimeComIA (ia.js:176)
- effectiveBuild:202 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), MEGA_BASE_BY_X (formas_mega.js:21), isMegaForm (formas_mega.js:71), getCurrentCap (level_cap.js:49), +6 | chamado por: confrontoUnitOf (chefoes.js:243), descricaoTimeParaGuia (prompts_ia.js:795), montarPromptTimeArquetipo (prompts_ia.js:743), computeTeamGenerationValidation (arquetipo.js:253), compareResultHtml (ficha_extras.js:22), +1
- encerrarLoteDeBuilds:120 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337), generateCompleteTeam (arquetipo.js:302)
- entradaDeBuild:23 - chama: getSpeciesBySname (dados_base.js:79), getCurrentCap (level_cap.js:49), planoSaneado (plano_build.js:107) | chamado por: acrescentarVarianteNaLista (lista_de_builds.js:23), trocarBuildAtivaNaLista (lista_de_builds.js:11), gravarSugestoesDoMotor (sugestao_do_motor.js:61)
- evsToShowdownText:75 - chama: ROTULOS_EV (plano_build.js:21) | chamado por: myBuildEditorHtml (editor_build.js:223), strategySetsHtml (editor_build.js:432)
- golpesFuturosDe:179 - chama: MOVES (dados_base.js:11), nivelDeEvolucaoDaForma (plano_build.js:68), nivelDoGolpe (plano_build.js:56) | chamado por: blocoPlanoCurtoIA (escolha_ia_candidatos.js:72), planoPromptBlock (prompts_ia.js:75), processarRevisoes (revisao_automatica.js:72)
- itemEsgotadoNoTime:152 - chamado por: avisosDaBuild (avisos_build.js:8), blocoTimeCurtoIA (escolha_ia_candidatos.js:55), itemValidoNoTime (itens_do_time.js:94), blocoTimeEmUsoIA (prompts_ia.js:343), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:513), +1
- itensEmUsoComQuem:153 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:343), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:513), validateAiBuild (validacao_build_ia.js:208)
- showdownSet:58 - chamado por: initBosses (aba_chefoes.js:33), buildEntryHtml (editor_build.js:182), myBuildEditorHtml (editor_build.js:223), strategySetsHtml (editor_build.js:432), renderTeam (time.js:8)
- stripNote:49 - chamado por: avisosDaBuild (avisos_build.js:8), aiTool_getItemInfo (ferramentas_ia.js:150), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:513), hpEvEfficiencyNote (editor_build.js:83), itemDescHtml (editor_build.js:45), +1
- teamItemsInUse:90 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- teamMovesInUse:123 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:343)
- teamRolesInUse:165 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:343)

## regras/calc_stat.js
- ITEM_MOVE_POWER_MODS:132 - chamado por: updateMyBuildStatus (editor_build.js:362)
- calcFinalStat:160 - chama: NATURE_MODS (dados_base.js:90) | chamado por: computeSpeedTiers (chefoes.js:511), foeDeDuelo (duelo.js:3071), semItemDuplicadoNoHell (duelo.js:3111), unidadeDeDuelo (duelo.js:3121), linhaVelocidadeIA (prompts_ia.js:410), +3
- especiePorNomeDoItem:135 - chama: SPECIES (dados_base.js:52)
- itemRuleFor:149 - chamado por: itemDoDuelo (duelo.js:1004), bossMonCardHtml (aba_chefoes.js:493), updateMyBuildStatus (editor_build.js:362)
- minEvSameStat:200 - chamado por: evBreakpointNote (editor_build.js:116)
- regraCasaComEspecie:139 - chama: isMegaEvoKind (formas_mega.js:22)
- trimAndReallocateEvs:238 - chamado por: validateAiBuild (validacao_build_ia.js:208)

## regras/campo.js
- CLIMA_OFICIAL:49 - chamado por: danoNoDuelo (duelo.js:2087), montarTimeNoClimaEmPassos (duelo.js:4609), prepararGolpesDuelo (duelo.js:1864), motorSimularComClima (time_pelo_motor_papeis.js:143)
- DURACAO_CAMPO:9 - chamado por: lerCampoDaFraseDuelo (duelo.js:923), lerDiversosDaFraseDuelo (duelo.js:686)
- HAZARD_DO_GOLPE:56 - chamado por: planoDoGolpeStatus (duelo.js:3312)
- hazardCheioNoLado:57 - chamado por: simularLutaDeVerdadeContraChefao (duelo.js:4308)
- poeHazardNoLado:58 - chamado por: simularDuplaContraChefao (duelo.js:3819), simularLutaDeVerdadeContraChefao (duelo.js:4308)
- rotuloDoArquetipoDeCampo:46 - chamado por: archetypeBuildGuidance (prompts_ia.js:58), montarPromptTimeArquetipo (prompts_ia.js:743)

## regras/chefoes.js
- DIFF_TO_BOSSKEY:25 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorLutasComunsDoContexto (time_pelo_motor.js:107), motorMontarLuta (time_pelo_motor.js:78), quemResolveCardHtml (quem_resolve.js:83)
- FATIA_DOS_CHEFOES:29 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorLutasComunsDoContexto (time_pelo_motor.js:107)
- LUTAS_DA_RUN:324 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorLutasDoContexto (time_pelo_motor.js:122)
- SPEEDTIER_NATURE:509 - chamado por: renderSpeedTiers (tipos.js:35)
- TIER_DA_DIFICULDADE:21 - chamado por: chaveDoRankDaDificuldade (rank_da_run.js:23)
- bestBoxCandidateForBoss:193 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:263), unitTypeMult (formas_mega.js:279), serveProMono (mono_run.js:74), rankDe (rank_da_run.js:29), +1 | chamado por: aiTool_getBoxCandidatesForBoss (ferramentas_ia.js:182), linhasProximaLutaIA (prompts_ia.js:426), nextFightDetailHtml (resumo_luta.js:215)
- bestRankForm:343 - chama: battleUnitsOf (formas_mega.js:263), rankDe (rank_da_run.js:29) | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- bossPartyPorDificuldade:337 - chama: state (nucleo.js:8) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), avisoProximoLider (mono_run.js:158), pipelineResolverAlvo (pipeline_build.js:71), linhasProximaLutaIA (prompts_ia.js:426), motorMontarLuta (time_pelo_motor.js:78), +2
- bossSafetyScore:181 - chama: unitTypeMult (formas_mega.js:279)
- bossSpeedSummary:142 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- buffsAtivosDoChefao:498 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:78), contextoDeValidacao (validacao_build_ia.js:191), montarTimeContraEsteChefao (aba_chefoes.js:337)
- buffsParaMostrarDoChefao:489 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337), buffsMudaram (arquetipo.js:383)
- comportamentoDaIADoChefao:449 - chamado por: iaDoChefaoHtml (aba_chefoes.js:190)
- computeBossAttackTypes:157 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9), moveRoleOf (golpes.js:53), state (nucleo.js:8)
- computeSharedRisks:119 - chama: USABLE_TYPES (dados_base.js:132), abilityTypeMod (tipos.js:172) | chamado por: linhaDeFraquezasDoTimeIA (escolha_ia_candidatos.js:51), aiTool_getTeamWeaknesses (ferramentas_ia.js:15), blocoPapelIA (prompts_ia.js:229), computeTeamGenerationValidation (arquetipo.js:253), renderTeamAnalysis (arquetipo.js:599), +2
- computeSpeedTiers:511 - chama: calcFinalStat (calc_stat.js:160), SPECIES (dados_base.js:52), nivelDeCalculo (level_cap.js:65) | chamado por: aiTool_getSpeedBenchmark (ferramentas_ia.js:204), linhaVelocidadeIA (prompts_ia.js:410), renderSpeedTiers (tipos.js:35)
- confrontoFoesDe:268 - chama: foeFromBossMember (confronto.js:49), getSpeciesBySname (dados_base.js:79) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), linhasProximaLutaIA (prompts_ia.js:426)
- confrontoMelhorUnidade:279 - chama: confrontoTime (confronto.js:146), battleUnitsOf (formas_mega.js:263)
- confrontoMinhasUnidades:289 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- confrontoParaParty:308 - chama: confrontoTime (confronto.js:146), melhoresTrocas (confronto.js:265) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), linhasProximaLutaIA (prompts_ia.js:426), initProgress (progresso.js:105), bossConfrontoHtml (resumo_luta.js:96), dashboardConfrontoHtml (resumo_luta.js:135)
- confrontoUnidadesDaCaixa:299 - chama: getSpeciesByX (dados_base.js:78), serveProMono (mono_run.js:74), state (nucleo.js:8)
- confrontoUnitOf:243 - chama: effectiveBuild (builds.js:202), ABILITY_ID_BY_NAME (confronto.js:17), availableMovesFor (level_cap.js:73), alwaysActiveAbilities (tipos.js:163), speciesTypeNames (tipos.js:253)
- ehRevancheDeLider:470 - chamado por: linhasProximaLutaIA (prompts_ia.js:426), renderGymSkillsCardHtml (aba_chefoes.js:456)
- getRemainingBossEntries:61 - chama: state (nucleo.js:8) | chamado por: aiTool_getBoxCandidatesForBoss (ferramentas_ia.js:182), aiTool_getNextBossRoster (ferramentas_ia.js:120), aiTool_getRemainingBosses (ferramentas_ia.js:159), avisoProximoLider (mono_run.js:158), pipelineResolverAlvo (pipeline_build.js:71), +7
- gymLeaderBaseName:55 - chamado por: avisoProximoLider (mono_run.js:158), linhasProximaLutaIA (prompts_ia.js:426), renderGymSkillsCardHtml (aba_chefoes.js:456)
- gymSkillsSummaryFor:377 - chama: state (nucleo.js:8) | chamado por: linhasProximaLutaIA (prompts_ia.js:426), renderGymSkillsCardHtml (aba_chefoes.js:456)
- nextFightCx:361 - chamado por: renderDashboard (resumo_luta.js:183), renderNextFightCard (resumo_luta.js:257)
- regraDeCampoDoChefao:422 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), linhasProximaLutaIA (prompts_ia.js:426), motorMontarLuta (time_pelo_motor.js:78), campoDoChefaoHtml (aba_chefoes.js:178), montarTimeContraEsteChefao (aba_chefoes.js:337)
- regrasDoHell:463 - chamado por: hellDoChefaoHtml (aba_chefoes.js:199)
- varianteDoChefao:368 - chama: state (nucleo.js:8) | chamado por: selectBoss (aba_chefoes.js:437), initProgress (progresso.js:105)

## regras/condicoes_habilidade.js
- NOME_DA_CONDICAO:42 - chamado por: objetivoDaEscolhaIA (escolha_ia_candidatos.js:80), contextoDoModoPrompt (prompts_ia.js:85), montarPromptBuildsDoTime (prompts_ia.js:585), planoContraChefaoHtml (arquetipo.js:387)
- blocoCondicoesIA:237 - chamado por: montarPromptBuild (prompts_ia.js:530), montarPromptBuildsDoTime (prompts_ia.js:585), montarPromptEstrategias (prompts_ia.js:633)
- comoGarantir:170 - chama: ITEMS (dados_base.js:12), availableMovesFor (level_cap.js:73), megaStoneRuleFor (validacao_build_ia.js:14)
- condicaoDaBuild:189 - chamado por: validateAiBuild (validacao_build_ia.js:208)
- descricaoDeHabilidade:85 - chama: ABILITIES (dados_base.js:10)
- descricaoDeHabilidadePorId:96 - chama: ABILITIES (dados_base.js:10) | chamado por: textoHabDuelo (duelo.js:203)
- expandirTextoDeHabilidade:107 - chama: ABILITIES (dados_base.js:10), LIDO_PELO_TEXTO_NOVO_DUELO (duelo.js:201), TEXTO_DA_VERSAO_NOVA_DUELO (duelo.js:50) | chamado por: textoHabDuelo (duelo.js:203)
- garantiaDaCondicao:154 - chama: ITEMS (dados_base.js:12) | chamado por: avisosDaBuild (avisos_build.js:8)
- garantiaDoTime:140 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), state (nucleo.js:8)
- habilidadeArma:121 - chamado por: armadoresDeClima (duelo.js:3280), climaDoTimeDoChefao (duelo.js:3097), efeitoDasHabilidadesNoDuelo (duelo.js:1495), habilidadeSemRegraNoDuelo (duelo.js:1802)
- nomesDeHabilidades:124 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122) | chamado por: avisosDaBuild (avisos_build.js:8), nivelDaHabilidadeNoElite (level_cap.js:40)
- podeTerStatus:132 - chama: STATUS_DUELO (duelo.js:357), speciesTypeNames (tipos.js:253)
- precisaDeSetter:212 - chama: availableMovesFor (level_cap.js:73) | chamado por: avisosDaBuild (avisos_build.js:8), marcasDoRankHtml (dex_ficha.js:288)

## regras/confronto.js
- ABILITY_ID_BY_NAME:17 - chamado por: confrontoUnitOf (chefoes.js:243), climaDoTimeDoChefao (duelo.js:3097), foeDeDuelo (duelo.js:3071), montarTimeNoClimaEmPassos (duelo.js:4609), unidadeDaBuild (duelo.js:3219), +5
- aberturaEmDupla:319 - chamado por: confrontoPlanoHtml (resumo_luta.js:67)
- ameacaDe:91 - chama: MOVE_BY_NAME (dados_base.js:86), abilityTypeModFor (tipos.js:195)
- coberturaSugerida:196 - chama: MOVE_BY_NAME (dados_base.js:86), moveRoleOf (golpes.js:53), abilityTypeModFor (tipos.js:195), speciesTypeNames (tipos.js:253) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), linhasProximaLutaIA (prompts_ia.js:426), confrontoAjustesHtml (resumo_luta.js:44)
- confrontoDamagingMoves:29 - chama: MOVE_BY_NAME (dados_base.js:86), moveRoleOf (golpes.js:53)
- confrontoMoveType:32 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9)
- confrontoTime:146 - chamado por: confrontoMelhorUnidade (chefoes.js:279), confrontoParaParty (chefoes.js:308)
- cuidadosDoChefao:302 - chamado por: confrontoPlanoHtml (resumo_luta.js:67)
- foeFromBossMember:49 - chama: getSpeciesByX (dados_base.js:78) | chamado por: confrontoFoesDe (chefoes.js:268)
- melhoresTrocas:265 - chamado por: confrontoParaParty (chefoes.js:308)
- ofensaContra:59 - chama: MOVE_BY_NAME (dados_base.js:86), abilityTypeModFor (tipos.js:195), speciesTypeNames (tipos.js:253)

## regras/dados_base.js
- ABILITIES:10 - chamado por: descricaoDeHabilidade (condicoes_habilidade.js:85), descricaoDeHabilidadePorId (condicoes_habilidade.js:96), expandirTextoDeHabilidade (condicoes_habilidade.js:107), nomesDeHabilidades (condicoes_habilidade.js:124), efeitoDasHabilidadesNoDuelo (duelo.js:1495), +17
- ALL_NATURES:101 - chamado por: fecharBuild (pipeline_build.js:698), validateAiBuild (validacao_build_ia.js:208), myBuildEditorHtml (editor_build.js:223)
- EVOKINDS:13 - chamado por: evolveChainByX (evolucao.js:66), isMegaEvoKind (formas_mega.js:22), nivelDeEvolucaoDaForma (plano_build.js:68), evoConditionText (dex_ficha.js:88)
- EVO_LEVEL:30 - chamado por: evolveChainByX (evolucao.js:66), nivelDeEvolucaoDaForma (plano_build.js:68)
- EVO_LEVEL_FEMALE:32 - chamado por: evoConditionText (dex_ficha.js:88)
- EVO_LEVEL_MALE:31 - chamado por: evoConditionText (dex_ficha.js:88)
- EVO_MEGA_KINDS:34 - chamado por: isMegaEvoKind (formas_mega.js:22), evoConditionText (dex_ficha.js:88)
- EVO_PRIMAL:33 - chamado por: isMegaEvoKind (formas_mega.js:22), evoConditionText (dex_ficha.js:88)
- ITEMS:12 - chamado por: comoGarantir (condicoes_habilidade.js:170), garantiaDaCondicao (condicoes_habilidade.js:154), itensDeEspeciePara (itens_do_time.js:82), soExistentes (itens_do_time.js:30), orientacaoMono (mono_run.js:144), +6
- MAPS:49 - chamado por: howToObtainText (dex_ficha.js:236), whereToFindText (dex_ficha.js:266)
- MONOTYPE_ARCHETYPES:157 - chamado por: applySave (save.js:47), archetypeCardHtml (arquetipo.js:85)
- MOVES:11 - chamado por: golpesFuturosDe (builds.js:179), acertosDoGolpeDuelo (duelo.js:232), efeitoDoPlanoDuelo (duelo.js:3608), escolherProximoDoChefao (duelo.js:4136), golpeDeRecargaDuelo (duelo.js:239), +23
- MOVE_BY_NAME:86 - chamado por: computeBossAttackTypes (chefoes.js:157), ameacaDe (confronto.js:91), coberturaSugerida (confronto.js:196), confrontoDamagingMoves (confronto.js:29), confrontoMoveType (confronto.js:32), +7
- MOVE_ID_BY_NAME:87 - chamado por: danoDoFuturoDuelo (duelo.js:2783), foeDeDuelo (duelo.js:3071), lerCondicaoDaFraseDuelo (duelo.js:496), lerDiversosDaFraseDuelo (duelo.js:686), poderDoDadoDuelo (duelo.js:2278), +9
- NATURE_MODS:90 - chamado por: calcFinalStat (calc_stat.js:160), conflitoDeNature (validacao_build_ia.js:113), validateAiBuild (validacao_build_ia.js:208)
- PACE_ARCHETYPES:146 - chamado por: applySave (save.js:47), archetypeCardHtml (arquetipo.js:85)
- ROLE_LABEL_PT:182 - chamado por: aiTool_getSpeciesRank (ferramentas_ia.js:24), blocoTimeEmUsoIA (prompts_ia.js:343), descricaoTimeParaGuia (prompts_ia.js:795), montarPromptTimeArquetipo (prompts_ia.js:743), nomePapel (prompts_ia.js:228), +2
- SPECIES:52 - chamado por: especiePorNomeDoItem (calc_stat.js:135), computeSpeedTiers (chefoes.js:511), especieDaFormaDuelo (duelo.js:3560), buildStandardAiTools (ferramentas_ia.js:249), especiesQueResolvem (pipeline_build.js:639), +4
- SPECIES_BY_SNAME:72 - chamado por: snamesToXs (save.js:15)
- SPLIT_LABEL_PT:183 - chamado por: aiTool_getSpeciesRank (ferramentas_ia.js:24), roleTagsHtml (dex_ficha.js:215)
- SPLIT_STATUS:29 - chamado por: moveRoleOf (golpes.js:53), conflitoDeItem (validacao_build_ia.js:130), updateMyBuildStatus (editor_build.js:362)
- TATICA_ARCHETYPES:150 - chamado por: applySave (save.js:47), archetypeCardHtml (arquetipo.js:85)
- TYPES:9 - chamado por: computeBossAttackTypes (chefoes.js:157), confrontoMoveType (confronto.js:32), efeitoDasHabilidadesNoDuelo (duelo.js:1495), escolherProximoDoChefao (duelo.js:4136), lerDiversosDaFraseDuelo (duelo.js:686), +11
- USABLE_TYPES:132 - chamado por: computeSharedRisks (chefoes.js:119), fraquezasDoTipo (mono_run.js:80), resistemAoTipo (mono_run.js:83), applySave (save.js:47), perfilDefensivoDaEspecie (tipos.js:178), +2
- WEATHER_ARCHETYPES:147 - chamado por: applySave (save.js:47), archetypeCardHtml (arquetipo.js:85)
- clampInt:103 - chamado por: applySave (save.js:47), sanitizarStrategySets (save.js:255), limitarEvsAoJogo (validacao_build_ia.js:163), lerFormularioDoEditor (editor_build.js:493), updateMyBuildEvTotal (editor_build.js:332), +1
- descricaoDaEspecie:188 - chamado por: fichaCabecalhoHtml (dex_ficha.js:504)
- getSpeciesBySname:79 - chamado por: entradaDeBuild (builds.js:23), confrontoFoesDe (chefoes.js:268), efeitoDasHabilidadesNoDuelo (duelo.js:1495), foeDeDuelo (duelo.js:3071), carryUserData (evolucao.js:167), +16
- getSpeciesByX:78 - chamado por: effectiveBuild (builds.js:202), itensEmUsoComQuem (builds.js:153), teamItemsInUse (builds.js:90), teamMovesInUse (builds.js:123), teamRolesInUse (builds.js:165), +56
- habilidadesEscolhiveis:119 - chamado por: formFamilyPromptNote (formas_mega.js:46), montarPromptTimeArquetipo (prompts_ia.js:743), habilidadeSubstitutaPara (reconciliar_build.js:26), reconciliarBuild (reconciliar_build.js:39), ajustarBuildDaIa (validacao_build_ia.js:494), +5
- snameOf:80 - chamado por: applySave (save.js:47), xsToSnames (save.js:24)
- uniqueIds:122 - chamado por: nomesDeHabilidades (condicoes_habilidade.js:124), armadoresDeClima (duelo.js:3280), climaDoTimeDoChefao (duelo.js:3097), comHabilidadesDuelo (duelo.js:3515), foeDeDuelo (duelo.js:3071), +17

## regras/duelo.js
- DURACAO_LADO_DUELO:4027 - chamado por: motorGanhoDaCondicao (time_pelo_motor_papeis.js:56)
- LIDO_PELO_TEXTO_NOVO_DUELO:201 - chamado por: expandirTextoDeHabilidade (condicoes_habilidade.js:107)
- STATUS_DUELO:357 - chamado por: podeTerStatus (condicoes_habilidade.js:132)
- TEXTO_DA_VERSAO_NOVA_DUELO:50 - chamado por: expandirTextoDeHabilidade (condicoes_habilidade.js:107)
- acertosDoGolpeDuelo:232 - chama: MOVES (dados_base.js:11)
- aguentaUmGolpe:2300 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:147), pipelineLinhaDoGolpe (pipeline_build.js:184)
- armadoresDeClima:3280 - chama: habilidadeArma (condicoes_habilidade.js:121), uniqueIds (dados_base.js:122) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:33)
- aterradoDuelo:958 - chama: abilityTypeModFor (tipos.js:195)
- bloqueiosNoDuelo:2771 - chamado por: pipelineLinhaDoGolpe (pipeline_build.js:184)
- climaDoTimeDoChefao:3097 - chama: habilidadeArma (condicoes_habilidade.js:121), ABILITY_ID_BY_NAME (confronto.js:17), getSpeciesByX (dados_base.js:78), uniqueIds (dados_base.js:122) | chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:78), motorMontarLutaComum (time_pelo_motor.js:89)
- comHabilidadesDuelo:3515 - chama: uniqueIds (dados_base.js:122)
- conferirTimeComBuilds:3206 - chama: getActiveBuild (evolucao.js:16) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337)
- danoDoFuturoDuelo:2783 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- danoNoDuelo:2087 - chama: CLIMA_OFICIAL (campo.js:49) | chamado por: motorProvasDosMembros (time_pelo_motor_papeis.js:157)
- efeitoDasHabilidadesNoDuelo:1495 - chama: habilidadeArma (condicoes_habilidade.js:121), ABILITIES (dados_base.js:10), TYPES (dados_base.js:9), getSpeciesBySname (dados_base.js:79) | chamado por: pipelineSemRecuo (pipeline_build.js:481), pipelineTiposExtraDeStab (pipeline_build.js:425), validateAiBuild (validacao_build_ia.js:208)
- efeitoDoPlanoDuelo:3608 - chama: MOVES (dados_base.js:11)
- efetividadeNoDuelo:2036 - chama: TYPE_MOD_ABILITIES (tipos.js:74), abilityTypeModFor (tipos.js:195), typeMultiplier (tipos.js:243)
- entrarNoLadoDuelo:4082 - chama: typeMultiplier (tipos.js:243)
- escolherProximoDoChefao:4136 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- especieDaFormaDuelo:3560 - chama: SPECIES (dados_base.js:52)
- fDanoGlobalHell:3068 - chama: state (nucleo.js:8)
- foeDeDuelo:3071 - chama: calcFinalStat (calc_stat.js:160), ABILITY_ID_BY_NAME (confronto.js:17), MOVE_ID_BY_NAME (dados_base.js:87), getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), +1 | chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:78), motorMontarLutaComum (time_pelo_motor.js:89)
- foesComBuffsDoGinasio:4222 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:78)
- foesComRegraDeCampo:4246 - chamado por: pipelineResolverAlvo (pipeline_build.js:71), motorMontarLuta (time_pelo_motor.js:78)
- golpeDeRecargaDuelo:239 - chama: MOVES (dados_base.js:11)
- golpeUtilNoDuelo:253 - chama: MOVES (dados_base.js:11)
- golpesDeDueloAte:281 - chama: uniqueIds (dados_base.js:122) | chamado por: pipelineCandidatos (pipeline_build.js:522)
- golpesDeRecargaAte:274 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122)
- golpesDeStatusAte:287 - chama: uniqueIds (dados_base.js:122)
- golpesNecessariosComPrimeiroDuelo:2292 - chamado por: pipelineAvaliarConjunto (pipeline_build.js:278), pipelineLinhaDoGolpe (pipeline_build.js:184)
- golpesNecessariosDuelo:2290 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:147)
- habilidadeSemRegraNoDuelo:1802 - chama: habilidadeArma (condicoes_habilidade.js:121), ABILITIES (dados_base.js:10), TYPE_MOD_ABILITIES (tipos.js:74) | chamado por: pipelineHabilidadesSemRegra (pipeline_build.js:381)
- inicioDaLutaComBuffs:4267 - chamado por: motorMontarLuta (time_pelo_motor.js:78)
- itemDoDuelo:1004 - chama: itemRuleFor (calc_stat.js:149), speciesTypeNames (tipos.js:253)
- itemDoSetDuelo:1090 - chama: isMegaEvoKind (formas_mega.js:22), speciesTypeNames (tipos.js:253)
- ivDoJogadorDuelo:3109 - chama: state (nucleo.js:8)
- lerCampoDaFraseDuelo:923 - chama: DURACAO_CAMPO (campo.js:9)
- lerCondicaoDaFraseDuelo:496 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- lerDiversosDaFraseDuelo:686 - chama: DURACAO_CAMPO (campo.js:9), MOVE_ID_BY_NAME (dados_base.js:87), TYPES (dados_base.js:9)
- melhorUnidadeContra:3145 - chama: uniqueIds (dados_base.js:122) | chamado por: motorBuildDoCandidato (time_pelo_motor.js:168)
- meuComBuffsDoGinasio:4259 - chama: MOVES (dados_base.js:11) | chamado por: motorSimular (time_pelo_motor.js:246), motorGanhoDaCondicao (time_pelo_motor_papeis.js:56), motorSimularComClima (time_pelo_motor_papeis.js:143), motorUnidadeNaLuta (time_pelo_motor_papeis.js:23)
- modoHellDuelo:356 - chama: state (nucleo.js:8)
- montarTimeContraChefaoEmPassos:4741 - chamado por: simularSemTravarATela (aba_chefoes.js:324)
- montarTimeNoClimaEmPassos:4609 - chama: CLIMA_OFICIAL (campo.js:49), ABILITY_ID_BY_NAME (confronto.js:17)
- nivelDoInimigoHell:3070 - chama: state (nucleo.js:8)
- nomeHabDuelo:46 - chama: ABILITIES (dados_base.js:10) | chamado por: pipelineCandidatos (pipeline_build.js:522), pipelineHabilidadesSemRegra (pipeline_build.js:381)
- novoLadoDuelo:4030 - chamado por: motorGanhoDaCondicao (time_pelo_motor_papeis.js:56), motorSimularComClima (time_pelo_motor_papeis.js:143)
- planoDoGolpeStatus:3312 - chama: HAZARD_DO_GOLPE (campo.js:56) | chamado por: motorUnidade (time_pelo_motor.js:234), motorCondicoes (time_pelo_motor_papeis.js:33), motorTemTipo (time_pelo_motor_papeis.js:202)
- planosUteisDuelo:3379 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- poderDoDadoDuelo:2278 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- poderDoGolpeDuelo:583 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- prepararGolpesDuelo:1864 - chama: CLIMA_OFICIAL (campo.js:49), MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- prioBloqueadaPelaHabilidadeDuelo:1850 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:147)
- quatroGolpesDeDano:3169 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- resultadoDoDuelo:2796 - chamado por: pipelineDuelo (pipeline_build.js:174), motorGanhoDaCondicao (time_pelo_motor_papeis.js:56)
- resumoProvadoPeloSimulador:3191 - chama: MOVES (dados_base.js:11) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337)
- semGolpesDeLadoDuelo:4717 - chamado por: motorTemGolpeDeLado (time_pelo_motor.js:275)
- semItemDuplicadoNoHell:3111 - chama: calcFinalStat (calc_stat.js:160)
- simularDuplaContraChefao:3819 - chama: poeHazardNoLado (campo.js:58) | chamado por: motorSimular (time_pelo_motor.js:246)
- simularLutaContraChefao:4299 - chamado por: motorSimular (time_pelo_motor.js:246), motorLutaDetalhada (time_pelo_motor_papeis.js:136), motorSimularComClima (time_pelo_motor_papeis.js:143)
- simularLutaDeVerdadeContraChefao:4308 - chama: hazardCheioNoLado (campo.js:57), poeHazardNoLado (campo.js:58), typeMultiplier (tipos.js:243)
- sinergiasDaEspecie:1444 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122) | chamado por: aiTool_getAbilityMovepoolSynergy (ferramentas_ia.js:75), pipelineSinergiasAtivas (pipeline_build.js:233), linhasContextoDaEspecieIA (prompts_ia.js:472), habilidadeSubstitutaPara (reconciliar_build.js:26), validateAiBuild (validacao_build_ia.js:208), +2
- temPrioridadeNoCampoDuelo:2346 - chamado por: pipelineLinhaDoGolpe (pipeline_build.js:184)
- textoHabDuelo:203 - chama: descricaoDeHabilidadePorId (condicoes_habilidade.js:96), expandirTextoDeHabilidade (condicoes_habilidade.js:107), ABILITIES (dados_base.js:10)
- tipoDoTextoDuelo:308 - chama: TYPES (dados_base.js:9)
- tiposNaBatalha:3063 - chama: speciesTypeNames (tipos.js:253)
- totalDePassosContraChefao:4740 - chamado por: simularSemTravarATela (aba_chefoes.js:324)
- unidadeDaBuild:3219 - chama: ABILITY_ID_BY_NAME (confronto.js:17), MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: pipelineTabela (pipeline_build.js:247), motorUnidade (time_pelo_motor.js:234), motorGanhoDaCondicao (time_pelo_motor_papeis.js:56), motorSimularComClima (time_pelo_motor_papeis.js:143)
- unidadeDeDuelo:3121 - chama: calcFinalStat (calc_stat.js:160), uniqueIds (dados_base.js:122), innatesAtivasNoNivel (level_cap.js:34) | chamado por: motorItensCandidatos (time_pelo_motor.js:369)
- unidadeSemClima:3232 - chamado por: motorSimularComClima (time_pelo_motor_papeis.js:143)

## regras/escolha_ia_candidatos.js
- blocoDeCandidatosParaIA:33 - chama: dadoExterno (golpes.js:19), speciesTypeNames (tipos.js:253)
- blocoPlanoCurtoIA:72 - chama: golpesFuturosDe (builds.js:179), MOVES (dados_base.js:11), TYPES (dados_base.js:9), SIGLA_CATEGORIA (golpes.js:27), dadoExterno (golpes.js:19), +2
- blocoTimeCurtoIA:55 - chama: itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), teamMovesInUse (builds.js:123), teamRolesInUse (builds.js:165), getSpeciesByX (dados_base.js:78), +3
- candidatosParaAEscolhaDaIa:201 - chama: candidatosDeBuild (pipeline_build.js:518) | chamado por: generateBuildWithAI (ia.js:278), gerarBuildsDoTimeComIA (ia.js:176)
- escolherCandidatoDaIa:168 - chamado por: generateBuildWithAI (ia.js:278), gerarBuildsDoTimeComIA (ia.js:176)
- fecharCandidatoDaEscolha:142 - chama: validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), fecharBuild (pipeline_build.js:698)
- linhaDeFraquezasDoTimeIA:51 - chama: computeSharedRisks (chefoes.js:119)
- linhaDePapelNaturalIA:47 - chama: nomePapel (prompts_ia.js:228)
- linhaDoChefaoPorEspecieIA:68 - chama: dadoExterno (golpes.js:19), linhaProvadoIA (prompts_ia.js:520)
- montarPromptEscolhaDeBuild:86 - chama: getCurrentCap (level_cap.js:49), archetypeBuildGuidance (prompts_ia.js:58), blocoItensIA (prompts_ia.js:292), cabecalhoIA (prompts_ia.js:191), versaoDosDados (prompts_ia.js:190) | chamado por: generateBuildWithAI (ia.js:278)
- montarPromptEscolhaDoTime:103 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), getSpeciesByX (dados_base.js:78), getCurrentCap (level_cap.js:49), archetypeBuildGuidance (prompts_ia.js:58), blocoItensComunsIA (prompts_ia.js:313), +4 | chamado por: gerarBuildsDoTimeComIA (ia.js:176)
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
- getActiveBuild:16 - chamado por: effectiveBuild (builds.js:202), garantiaDoTime (condicoes_habilidade.js:140), conferirTimeComBuilds (duelo.js:3206), gravarBuildDaIaNaLista (gravacao_build_ia.js:68), respostaDaIaObsoleta (gravacao_build_ia.js:55), +10
- getBuildList:14 - chama: state (nucleo.js:8) | chamado por: gravarPlanoDaIa (gravacao_build_ia.js:134), acrescentarVarianteNaLista (lista_de_builds.js:23), buildQueSaiParaAbrirVaga (lista_de_builds.js:43), removerBuildDaLista (lista_de_builds.js:32), trocarBuildAtivaNaLista (lista_de_builds.js:11), +9
- logAutoAction:229 - chama: AUTO_LOG_MAX (save.js:37), state (nucleo.js:8) | chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68), gravarPlanoDaIa (gravacao_build_ia.js:134), applySave (save.js:47), autoEvolveRoster (auto_evolucao.js:20), aplicarCuradaNoTimeNovo (ia.js:153), +4
- marcarRevisaoPosEvolucao:236 - chama: getSpeciesBySname (dados_base.js:79)
- podarAutoEvolved:61 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- reconciliarBuildsDe:104 - chama: getSpeciesBySname (dados_base.js:79), reconciliarBuild (reconciliar_build.js:39), state (nucleo.js:8)
- reconciliarBuildsSalvas:148 - chama: state (nucleo.js:8) | chamado por: applySave (save.js:47)
- runTemAlgoPraZerar:247 - chama: state (nucleo.js:8) | chamado por: updateResetTeamBoxBtn (dex_ficha.js:740)

## regras/ferramentas_ia.js
- aiTool_getAbilityMovepoolSynergy:75 - chama: getSpeciesBySname (dados_base.js:79), sinergiasDaEspecie (duelo.js:1444)
- aiTool_getBoxCandidatesForBoss:182 - chama: bestBoxCandidateForBoss (chefoes.js:193), getRemainingBossEntries (chefoes.js:61)
- aiTool_getItemInfo:150 - chama: stripNote (builds.js:49), dadoExterno (golpes.js:19)
- aiTool_getNextBossRoster:120 - chama: bossPartyPorDificuldade (chefoes.js:337), confrontoFoesDe (chefoes.js:268), confrontoParaParty (chefoes.js:308), getRemainingBossEntries (chefoes.js:61), coberturaSugerida (confronto.js:196), +1
- aiTool_getPriorityMoveOptions:51 - chama: MOVES (dados_base.js:11), getSpeciesBySname (dados_base.js:79), availableMovesFor (level_cap.js:73)
- aiTool_getRemainingBosses:159 - chama: getRemainingBossEntries (chefoes.js:61), getSpeciesByX (dados_base.js:78), speciesTypeNames (tipos.js:253)
- aiTool_getSpeciesRank:24 - chama: ROLE_LABEL_PT (dados_base.js:182), SPLIT_LABEL_PT (dados_base.js:183), rankDe (rank_da_run.js:29)
- aiTool_getSpeedBenchmark:204 - chama: computeSpeedTiers (chefoes.js:511), getSpeciesBySname (dados_base.js:79)
- aiTool_getTeamWeaknesses:15 - chama: computeSharedRisks (chefoes.js:119), getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- buildStandardAiTools:249 - chama: SPECIES (dados_base.js:52) | chamado por: opcoesDaIA (ia.js:72)

## regras/formas_mega.js
- MEGA_BASE_BY_X:21 - chamado por: effectiveBuild (builds.js:202), tarefaDeRevisao (revisao_automatica.js:24)
- MEGA_PEDRAS_TARDIAS:110 - chamado por: etapaDaPedra (liberado_na_run.js:15)
- MEGA_UNLOCK_MILESTONE:94 - chamado por: etapaDaPedra (liberado_na_run.js:15)
- ROTULO_ETAPA_MEGA:189 - chamado por: avisosDaBuild (avisos_build.js:8)
- battleFamilyOf:219 - chamado por: rosterParaTimeIA (prompts_ia.js:697)
- battleUnitsOf:263 - chamado por: bestBoxCandidateForBoss (chefoes.js:193), bestRankForm (chefoes.js:343), confrontoMelhorUnidade (chefoes.js:279), especiesQueResolvem (pipeline_build.js:639), motorCandidatosEmPassos (time_pelo_motor.js:204), +3
- etapaDaMega:191 - chama: etapaDaPedra (liberado_na_run.js:15)
- evioliteFunciona:32 - chamado por: pipelineEvioliteServe (pipeline_build.js:488), blocoPapelIA (prompts_ia.js:229), conflitoDeItem (validacao_build_ia.js:130)
- formFamilyOf:65 - chama: getSpeciesByX (dados_base.js:78) | chamado por: mudancaDeTipo (mono_run.js:95), applyRecommendedTeam (arquetipo.js:207), otherFormsHtml (ficha_extras.js:206)
- formFamilyPromptNote:46 - chama: ABILITIES (dados_base.js:10), habilidadesEscolhiveis (dados_base.js:119), rankDe (rank_da_run.js:29), speciesTypeNames (tipos.js:253) | chamado por: blocoMegaIA (prompts_ia.js:271), descricaoTimeParaGuia (prompts_ia.js:795), montarPromptTimeArquetipo (prompts_ia.js:743)
- isMegaEvoKind:22 - chama: EVOKINDS (dados_base.js:13), EVO_MEGA_KINDS (dados_base.js:34), EVO_PRIMAL (dados_base.js:33) | chamado por: regraCasaComEspecie (calc_stat.js:139), itemDoSetDuelo (duelo.js:1090), linhaEvolutivaDe (mono_run.js:20), motorRaizDaLinha (time_pelo_motor.js:150)
- isMegaForm:71 - chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:202), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), mudancaDeTipo (mono_run.js:95), blocoMegaIA (prompts_ia.js:271), +6
- megaEvolutionUnlocked:95 - chama: state (nucleo.js:8) | chamado por: blocoMegaIA (prompts_ia.js:271), montarPromptTimeArquetipo (prompts_ia.js:743)
- megaFormLiberada:196 - chama: state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- megaFormsOf:38 - chama: getSpeciesByX (dados_base.js:78) | chamado por: validateAiBuild (validacao_build_ia.js:208)
- megaMode:82 - chama: state (nucleo.js:8) | chamado por: motorChaveDoContexto (time_pelo_motor.js:167), motorSimular (time_pelo_motor.js:246), megaStoneRuleFor (validacao_build_ia.js:14), modoMotorChave (modo_motor.js:21), initProgress (progresso.js:105), +1
- megaPromptBlock:226 - chamado por: blocoMegaIA (prompts_ia.js:271)
- megaSoNoDebug:197 - chamado por: megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- quandoMega:199 - chamado por: avisosDaBuild (avisos_build.js:8), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- rotuloEtapaDaMega:200 - chamado por: megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- stonesOf:253 - chamado por: megaStoneRuleFor (validacao_build_ia.js:14), validateAiBuild (validacao_build_ia.js:208)
- unitTypeMult:279 - chama: abilityTypeMod (tipos.js:172) | chamado por: bestBoxCandidateForBoss (chefoes.js:193), bossSafetyScore (chefoes.js:181), boxFitNote (resumo_luta.js:154)
- usableSpeciesFor:222 - chamado por: rosterParaTimeIA (prompts_ia.js:697)

## regras/golpes.js
- LEGENDA_GOLPE:26 - chamado por: blocoMovepoolIA (prompts_ia.js:259), planoPromptBlock (prompts_ia.js:75)
- PROMPT_DADOS_AVISO:17 - chamado por: cabecalhoIA (prompts_ia.js:191), montarPromptPlano (prompts_ia.js:685)
- SIGLA_CATEGORIA:27 - chamado por: blocoPlanoCurtoIA (escolha_ia_candidatos.js:72)
- dadoExterno:19 - chamado por: blocoDeCandidatosParaIA (escolha_ia_candidatos.js:33), blocoPlanoCurtoIA (escolha_ia_candidatos.js:72), blocoTimeCurtoIA (escolha_ia_candidatos.js:55), linhaDoChefaoPorEspecieIA (escolha_ia_candidatos.js:68), objetivoDaEscolhaIA (escolha_ia_candidatos.js:80), +11
- ehGolpeDePivo:41 - chama: MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: blocoPapelIA (prompts_ia.js:229), conferirPapelDaBuild (validacao_build_ia.js:80)
- ehPrioridadeDeDano:49 - chama: MOVE_BY_NAME (dados_base.js:86) | chamado por: blocoPapelIA (prompts_ia.js:229)
- movePromptLine:28 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9) | chamado por: blocoMovepoolIA (prompts_ia.js:259), planoPromptBlock (prompts_ia.js:75)
- moveRoleOf:53 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87), SPLIT_STATUS (dados_base.js:29) | chamado por: avisosDaBuild (avisos_build.js:8), computeBossAttackTypes (chefoes.js:157), coberturaSugerida (confronto.js:196), confrontoDamagingMoves (confronto.js:29), blocoPlanoCurtoIA (escolha_ia_candidatos.js:72), +5

## regras/gravacao_build_ia.js
- buildDoLoteDeBuilds:45 - chama: contextoDeValidacao (validacao_build_ia.js:191), validateAiBuild (validacao_build_ia.js:208) | chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- gravarBuildDaIaNaLista:68 - chama: getActiveBuild (evolucao.js:16), logAutoAction (evolucao.js:229), acrescentarVarianteNaLista (lista_de_builds.js:23), liberarVagaNaLista (lista_de_builds.js:51), trocarBuildAtivaNaLista (lista_de_builds.js:11)
- gravarPlanoDaIa:134 - chama: getBuildList (evolucao.js:14), logAutoAction (evolucao.js:229), nivelDoGolpe (plano_build.js:56), validarPlano (plano_build.js:80) | chamado por: gerarPlanoParaBuild (ia.js:342)
- gravarRespostaValidadaDaIa:105 - chama: capOuPadrao (level_cap.js:61), anexarPlanoDaIa (prompts_ia.js:125), ajustarBuildDaIa (validacao_build_ia.js:494) | chamado por: gravarBuildValidadaDaIa (ia.js:141)
- motivoDeNaoGerarBuild:18 - chama: isMegaForm (formas_mega.js:71), megaFormLiberada (formas_mega.js:196), quandoMega (formas_mega.js:199) | chamado por: generateBuildWithAI (ia.js:278), gerarBuildsDoTimeComIA (ia.js:176)
- respostaDaIaObsoleta:55 - chama: getActiveBuild (evolucao.js:16), state (nucleo.js:8)
- textoDaRetentativaDeBuild:35 - chamado por: generateBuildWithAI (ia.js:278)
- textoDeLimiteDeBuilds:61 - chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- validarRespostaDeBuildDaIa:26 - chama: contextoDeValidacao (validacao_build_ia.js:191), validateAiBuild (validacao_build_ia.js:208) | chamado por: fecharCandidatoDaEscolha (escolha_ia_candidatos.js:142), fecharBuild (pipeline_build.js:698), generateBuildWithAI (ia.js:278)
- validarRespostaDoLoteDeBuilds:40 - chamado por: gerarBuildsDoTimeComIA (ia.js:176)

## regras/itens_do_time.js
- AI_ITEM_POOL:89 - chamado por: itensAindaIndisponiveisParaIA (prompts_ia.js:299), validateAiBuild (validacao_build_ia.js:208)
- ITENS_IA_BERRIES:46 - chamado por: blocoItensComunsIA (prompts_ia.js:313)
- ITENS_IA_GEMAS:63 - chamado por: blocoItensComunsIA (prompts_ia.js:313)
- ITENS_IA_GERAIS:33 - chamado por: blocoItensComunsIA (prompts_ia.js:313)
- ITENS_IA_TIPO:55 - chamado por: blocoItensComunsIA (prompts_ia.js:313)
- ITENS_IA_UTILIDADE:66 - chamado por: blocoItensComunsIA (prompts_ia.js:313)
- itemDeTipoDoTime:102 - chamado por: motorItensCandidatos (time_pelo_motor.js:369)
- itemValidoNoTime:94 - chama: itemEsgotadoNoTime (builds.js:152), liberadoNaRun (liberado_na_run.js:22) | chamado por: motorFecharItens (time_pelo_motor.js:392), motorItensCandidatos (time_pelo_motor.js:369)
- itensDeEspeciePara:82 - chama: ITEMS (dados_base.js:12) | chamado por: blocoItensDaEspecieIA (prompts_ia.js:287), validateAiBuild (validacao_build_ia.js:208)
- itensDoTime:98 - chamado por: itensAindaIndisponiveisParaIA (prompts_ia.js:299)
- soExistentes:30 - chama: ITEMS (dados_base.js:12)

## regras/level_cap.js
- LEVEL_CAP_MODES:15 - chamado por: applySave (save.js:47), initProgress (progresso.js:105)
- NIVEL_DA_INNATE_ELITE:33 - chamado por: blocoEspecieIA (prompts_ia.js:202)
- availableMovesFor:73 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122), liberadoNaRun (liberado_na_run.js:22), state (nucleo.js:8) | chamado por: confrontoUnitOf (chefoes.js:243), comoGarantir (condicoes_habilidade.js:170), precisaDeSetter (condicoes_habilidade.js:212), aiTool_getPriorityMoveOptions (ferramentas_ia.js:51), pipelineCandidatos (pipeline_build.js:522), +5
- capOuPadrao:61 - chamado por: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105), contextoDoMotor (time_pelo_motor.js:140), montarTimeContraEsteChefao (aba_chefoes.js:337), modoMotorChave (modo_motor.js:21)
- getCurrentCap:49 - chama: state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:202), entradaDeBuild (builds.js:23), blocoPlanoCurtoIA (escolha_ia_candidatos.js:72), montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86), +24
- golpesTravadosNoCap:90 - chama: MOVE_ID_BY_NAME (dados_base.js:87), liberadoNaRun (liberado_na_run.js:22), state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), contextoDoModoPrompt (prompts_ia.js:85), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:513), processarRevisoes (revisao_automatica.js:72), tarefaDeRevisao (revisao_automatica.js:24)
- innatesAtivasNoNivel:34 - chama: state (nucleo.js:8) | chamado por: unidadeDeDuelo (duelo.js:3121), pipelineCandidatos (pipeline_build.js:522)
- innatesTravadasNoNivel:44 - chamado por: blocoEspecieIA (prompts_ia.js:202)
- levelCapMode:16 - chama: state (nucleo.js:8) | chamado por: motorChaveDoContexto (time_pelo_motor.js:167), motorNivelDaEtapa (time_pelo_motor.js:72), modoMotorChave (modo_motor.js:21), initProgress (progresso.js:105)
- levelCapModeFromDifficulty:22 - chamado por: applySave (save.js:47)
- nivelDaHabilidadeNoElite:40 - chama: nomesDeHabilidades (condicoes_habilidade.js:124) | chamado por: marcasDoRankHtml (dex_ficha.js:288)
- nivelDeCalculo:65 - chamado por: computeSpeedTiers (chefoes.js:511), pipelineResolverAlvo (pipeline_build.js:71), blocoEspecieIA (prompts_ia.js:202), validateAiBuild (validacao_build_ia.js:208), montarTimeContraEsteChefao (aba_chefoes.js:337), +5

## regras/liberado_na_run.js
- entradasDoJogador:33 - chama: state (nucleo.js:8) | chamado por: applyRecommendedTeam (arquetipo.js:207), monoRunCardHtml (arquetipo.js:516)
- etapaDaPedra:15 - chama: MEGA_PEDRAS_TARDIAS (formas_mega.js:110), MEGA_UNLOCK_MILESTONE (formas_mega.js:94) | chamado por: avisosDaBuild (avisos_build.js:8), etapaDaMega (formas_mega.js:191)
- etapaDoItem:17 - chama: primeiroLugarDoItem (avisos_build.js:94) | chamado por: pipelineEvioliteServe (pipeline_build.js:488)
- liberadoNaRun:22 - chamado por: avisosDaBuild (avisos_build.js:8), itemValidoNoTime (itens_do_time.js:94), availableMovesFor (level_cap.js:73), golpesTravadosNoCap (level_cap.js:90), pipelineEvioliteServe (pipeline_build.js:488), +3
- xsDoJogador:37 - chamado por: rosterParaTimeIA (prompts_ia.js:697), viramDoTipoPrompt (prompts_ia.js:732), contextoDoMotor (time_pelo_motor.js:140), candidatosDoJogador (aba_chefoes.js:248), modoMotorCapturados (modo_motor.js:26), +2

## regras/lista_de_builds.js
- acrescentarVarianteNaLista:23 - chama: entradaDeBuild (builds.js:23), getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68), gravarSugestoesDoMotor (sugestao_do_motor.js:61), addBuildVariant (nucleo.js:101)
- buildQueSaiParaAbrirVaga:43 - chama: getBuildList (evolucao.js:14) | chamado por: abrirVagaPreservando (nucleo.js:118)
- liberarVagaNaLista:51 - chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68)
- removerBuildDaLista:32 - chama: getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarSugestoesDoMotor (sugestao_do_motor.js:61), removeBuildIndex (nucleo.js:124)
- trocarBuildAtivaNaLista:11 - chama: entradaDeBuild (builds.js:23), getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68), setOrReplaceActiveBuild (nucleo.js:94)

## regras/mono_run.js
- MONO_MARCAS:11 - chamado por: monoRunCardHtml (arquetipo.js:516)
- avisoProximoLider:158 - chama: bossPartyPorDificuldade (chefoes.js:337), getRemainingBossEntries (chefoes.js:61), gymLeaderBaseName (chefoes.js:55), MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9), +3 | chamado por: monoRunCardHtml (arquetipo.js:516)
- climaQueCombina:141 - chamado por: climaQueCombinaHtml (arquetipo.js:495)
- cobreFraquezas:88 - chama: abilityTypeMod (tipos.js:172) | chamado por: notaMonoDoCandidato (prompts_ia.js:726)
- compraDeInicialTexto:47 - chama: getSpeciesBySname (dados_base.js:79) | chamado por: fichaCabecalhoHtml (dex_ficha.js:504)
- fraquezasDoTipo:80 - chama: USABLE_TYPES (dados_base.js:132), typeMultiplier (tipos.js:243) | chamado por: notaMonoDoCandidato (prompts_ia.js:726), monoRunCardHtml (arquetipo.js:516)
- linhaEvolutivaDe:20 - chama: getSpeciesByX (dados_base.js:78), isMegaEvoKind (formas_mega.js:22)
- monoDisponibilidade:176 - chama: getSpeciesBySname (dados_base.js:79), rankDe (rank_da_run.js:29) | chamado por: monoRunCardHtml (arquetipo.js:516)
- monotypeAtivo:72 - chama: state (nucleo.js:8) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:337), renderBossDetail (aba_chefoes.js:589)
- mudancaDeTipo:95 - chama: formFamilyOf (formas_mega.js:65), isMegaForm (formas_mega.js:71), speciesTypeNames (tipos.js:253) | chamado por: notaMonoDoCandidato (prompts_ia.js:726), viramDoTipoPrompt (prompts_ia.js:732)
- orientacaoMono:144 - chama: ITEMS (dados_base.js:12) | chamado por: archetypeBuildGuidance (prompts_ia.js:58), montarPromptTimeArquetipo (prompts_ia.js:743)
- resistemAoTipo:83 - chama: USABLE_TYPES (dados_base.js:132), typeMultiplier (tipos.js:243)
- serveProMono:74 - chama: speciesTypeNames (tipos.js:253) | chamado por: bestBoxCandidateForBoss (chefoes.js:193), confrontoUnidadesDaCaixa (chefoes.js:299), especiesQueResolvem (pipeline_build.js:639), motorCandidatosEmPassos (time_pelo_motor.js:204), motorClassificar (time_pelo_motor_papeis.js:207), +2

## regras/pipeline_build.js
- candidatosDeBuild:518 - chamado por: candidatosParaAEscolhaDaIa (escolha_ia_candidatos.js:201), pipelineResultado (pipeline_tela.js:14)
- especiesQueResolvem:639 - chama: SPECIES (dados_base.js:52), getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:263), serveProMono (mono_run.js:74), rankDe (rank_da_run.js:29), +1 | chamado por: quemResolveCalcular (quem_resolve.js:22)
- fecharBuild:698 - chama: ALL_NATURES (dados_base.js:101), getSpeciesBySname (dados_base.js:79), validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), megaStoneRuleFor (validacao_build_ia.js:14) | chamado por: fecharCandidatoDaEscolha (escolha_ia_candidatos.js:142)
- pipelineAmeacasDePrioridade:147 - chama: aguentaUmGolpe (duelo.js:2300), golpesNecessariosDuelo (duelo.js:2290), prioBloqueadaPelaHabilidadeDuelo (duelo.js:1850)
- pipelineAvaliarConjunto:278 - chama: golpesNecessariosComPrimeiroDuelo (duelo.js:2292)
- pipelineCandidatos:522 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122), golpesDeDueloAte (duelo.js:281), nomeHabDuelo (duelo.js:46), moveRoleOf (golpes.js:53), +4 | chamado por: motorBuildDoCandidato (time_pelo_motor.js:168)
- pipelineDuelo:174 - chama: resultadoDoDuelo (duelo.js:2796)
- pipelineEspecie:59 - chama: getSpeciesBySname (dados_base.js:79)
- pipelineEvioliteServe:488 - chama: ITEMS (dados_base.js:12), evioliteFunciona (formas_mega.js:32), getCurrentCap (level_cap.js:49), etapaDoItem (liberado_na_run.js:17), liberadoNaRun (liberado_na_run.js:22), +1
- pipelineGolpesComRecuo:474 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- pipelineHabilidadesSemRegra:381 - chama: ABILITY_ID_BY_NAME (confronto.js:17), habilidadeSemRegraNoDuelo (duelo.js:1802), nomeHabDuelo (duelo.js:46)
- pipelineLinhaDoGolpe:184 - chama: aguentaUmGolpe (duelo.js:2300), bloqueiosNoDuelo (duelo.js:2771), golpesNecessariosComPrimeiroDuelo (duelo.js:2292), temPrioridadeNoCampoDuelo (duelo.js:2346)
- pipelineMontarConjunto:328 - chama: moveRoleOf (golpes.js:53)
- pipelineResolverAlvo:71 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), FATIA_DOS_CHEFOES (chefoes.js:29), LUTAS_DA_RUN (chefoes.js:324), bossPartyPorDificuldade (chefoes.js:337), buffsAtivosDoChefao (chefoes.js:498), +8 | chamado por: motorBuildDoCandidato (time_pelo_motor.js:168)
- pipelineSemRecuo:481 - chama: ABILITY_ID_BY_NAME (confronto.js:17), uniqueIds (dados_base.js:122), efeitoDasHabilidadesNoDuelo (duelo.js:1495)
- pipelineSinergiasAtivas:233 - chama: sinergiasDaEspecie (duelo.js:1444)
- pipelineTabela:247 - chama: unidadeDaBuild (duelo.js:3219)
- pipelineTiposExtraDeStab:425 - chama: ABILITY_ID_BY_NAME (confronto.js:17), uniqueIds (dados_base.js:122), efeitoDasHabilidadesNoDuelo (duelo.js:1495)
- pipelineValidarRascunho:493 - chama: ITEMS (dados_base.js:12), contextoDeValidacao (validacao_build_ia.js:191), megaStoneRuleFor (validacao_build_ia.js:14), validateAiBuild (validacao_build_ia.js:208)

## regras/plano_build.js
- ESTILO_ROTULO:20 - chamado por: rotuloDaBuild (ficha_extras.js:170)
- ROTULOS_EV:21 - chamado por: evsToShowdownText (builds.js:75)
- curadaParaEstilo:160 - chamado por: effectiveBuild (builds.js:202), aplicarCuradaNoTimeNovo (ia.js:153), processarRevisoes (revisao_automatica.js:72), tarefaDeRevisao (revisao_automatica.js:24)
- curadasDe:153 - chamado por: montarPromptEstrategias (prompts_ia.js:633)
- estiloDeEvs:37 - chamado por: effectiveBuild (builds.js:202), montarPromptEstrategias (prompts_ia.js:633)
- estiloDoRitmo:48 - chamado por: effectiveBuild (builds.js:202), aplicarCuradaNoTimeNovo (ia.js:153), processarRevisoes (revisao_automatica.js:72), tarefaDeRevisao (revisao_automatica.js:24)
- evsTextoParaArray:24 - chamado por: ajustarBuildDaIa (validacao_build_ia.js:494), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:513), processarRevisoes (revisao_automatica.js:72)
- golpesNoCap:123 - chamado por: effectiveBuild (builds.js:202), myBuildEditorHtml (editor_build.js:223)
- nivelDeEvolucaoDaForma:68 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL (dados_base.js:30) | chamado por: golpesFuturosDe (builds.js:179)
- nivelDoGolpe:56 - chama: MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: golpesFuturosDe (builds.js:179), gravarPlanoDaIa (gravacao_build_ia.js:134)
- planoSaneado:107 - chamado por: entradaDeBuild (builds.js:23), anteriorSaneado (save.js:236), applySave (save.js:47)
- trocasEntreCaps:141 - chamado por: registrarTrocasDoPlano (revisao_automatica.js:149)
- validarPlano:80 - chamado por: gravarPlanoDaIa (gravacao_build_ia.js:134), anexarPlanoDaIa (prompts_ia.js:125)

## regras/prompts_ia.js
- anexarPlanoDaIa:125 - chama: validarPlano (plano_build.js:80) | chamado por: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105)
- archetypeBuildGuidance:58 - chama: rotuloDoArquetipoDeCampo (campo.js:46), orientacaoMono (mono_run.js:144), state (nucleo.js:8) | chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- avisoInnatesEliteIA:495 - chama: getCurrentCap (level_cap.js:49), state (nucleo.js:8)
- blocoEspecieIA:202 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122), NIVEL_DA_INNATE_ELITE (level_cap.js:33), innatesTravadasNoNivel (level_cap.js:44), nivelDeCalculo (level_cap.js:65), +1
- blocoItensAindaIndisponiveisIA:307 - chama: rotuloDaEtapaDoItem (avisos_build.js:98)
- blocoItensComunsIA:313 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), ITEMS (dados_base.js:12), ITENS_IA_BERRIES (itens_do_time.js:46), ITENS_IA_GEMAS (itens_do_time.js:63), ITENS_IA_GERAIS (itens_do_time.js:33), +2 | chamado por: montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- blocoItensDaEspecieIA:287 - chama: itensDeEspeciePara (itens_do_time.js:82), regraItemConsumivelPrompt (validacao_build_ia.js:57) | chamado por: montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- blocoItensIA:292 - chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86)
- blocoManualIA:389 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122)
- blocoMegaIA:271 - chama: formFamilyPromptNote (formas_mega.js:46), isMegaForm (formas_mega.js:71), megaEvolutionUnlocked (formas_mega.js:95), megaPromptBlock (formas_mega.js:226), megaStoneRuleFor (validacao_build_ia.js:14)
- blocoMovepoolIA:259 - chama: LEGENDA_GOLPE (golpes.js:26), movePromptLine (golpes.js:28), availableMovesFor (level_cap.js:73)
- blocoPapelIA:229 - chama: computeSharedRisks (chefoes.js:119), ITEMS (dados_base.js:12), getSpeciesByX (dados_base.js:78), evioliteFunciona (formas_mega.js:32), ehGolpeDePivo (golpes.js:41), +3
- blocoTimeEmUsoIA:343 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), teamMovesInUse (builds.js:123), teamRolesInUse (builds.js:165), +2
- cabecalhoIA:191 - chama: PROMPT_DADOS_AVISO (golpes.js:17) | chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- comDescricaoIA:284 - chama: dadoExterno (golpes.js:19)
- contextoDoModoPrompt:85 - chama: NOME_DA_CONDICAO (condicoes_habilidade.js:42), dadoExterno (golpes.js:19), golpesTravadosNoCap (level_cap.js:90)
- descricaoTimeParaGuia:795 - chama: effectiveBuild (builds.js:202), ROLE_LABEL_PT (dados_base.js:182), formFamilyPromptNote (formas_mega.js:46), speciesTypeNames (tipos.js:253)
- guiaDaResposta:828 - chamado por: generateTeamUsageGuide (arquetipo.js:270)
- itensAindaIndisponiveisParaIA:299 - chama: primeiroLugarDoItem (avisos_build.js:94), AI_ITEM_POOL (itens_do_time.js:89), itensDoTime (itens_do_time.js:98), getCurrentCap (level_cap.js:49), state (nucleo.js:8)
- linhaHabilidadeIA:198 - chama: ABILITIES (dados_base.js:10), dadoExterno (golpes.js:19)
- linhaProvadoIA:520 - chama: dadoExterno (golpes.js:19) | chamado por: linhaDoChefaoPorEspecieIA (escolha_ia_candidatos.js:68)
- linhaVelocidadeIA:410 - chama: calcFinalStat (calc_stat.js:160), computeSpeedTiers (chefoes.js:511), state (nucleo.js:8)
- linhasContextoComumIA:501 - chama: getRemainingBossEntries (chefoes.js:61), getSpeciesByX (dados_base.js:78), speciesTypeNames (tipos.js:253)
- linhasContextoDaEspecieIA:472 - chama: sinergiasDaEspecie (duelo.js:1444), rankDe (rank_da_run.js:29)
- linhasProximaLutaIA:426 - chama: bestBoxCandidateForBoss (chefoes.js:193), bossPartyPorDificuldade (chefoes.js:337), confrontoFoesDe (chefoes.js:268), confrontoParaParty (chefoes.js:308), ehRevancheDeLider (chefoes.js:470), +6
- montarPromptBuild:530 - chama: blocoCondicoesIA (condicoes_habilidade.js:237), getCurrentCap (level_cap.js:49) | chamado por: generateBuildWithAI (ia.js:278)
- montarPromptBuildsDoTime:585 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), NOME_DA_CONDICAO (condicoes_habilidade.js:42), blocoCondicoesIA (condicoes_habilidade.js:237), dadoExterno (golpes.js:19), getCurrentCap (level_cap.js:49) | chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- montarPromptEstrategias:633 - chama: blocoCondicoesIA (condicoes_habilidade.js:237), getCurrentCap (level_cap.js:49), curadasDe (plano_build.js:153), estiloDeEvs (plano_build.js:37) | chamado por: generateStrategySets (revisao_automatica.js:182)
- montarPromptGuia:805 - chamado por: generateTeamUsageGuide (arquetipo.js:270)
- montarPromptPlano:685 - chama: PROMPT_DADOS_AVISO (golpes.js:17), dadoExterno (golpes.js:19), speciesTypeNames (tipos.js:253) | chamado por: gerarPlanoParaBuild (ia.js:342)
- montarPromptTimeArquetipo:743 - chama: effectiveBuild (builds.js:202), rotuloDoArquetipoDeCampo (campo.js:46), ABILITIES (dados_base.js:10), ROLE_LABEL_PT (dados_base.js:182), habilidadesEscolhiveis (dados_base.js:119), +6 | chamado por: generateTeamForArchetype (arquetipo.js:153)
- nomePapel:228 - chama: ROLE_LABEL_PT (dados_base.js:182) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), linhaDePapelNaturalIA (escolha_ia_candidatos.js:47)
- notaMonoDoCandidato:726 - chama: cobreFraquezas (mono_run.js:88), fraquezasDoTipo (mono_run.js:80), mudancaDeTipo (mono_run.js:95)
- planoPromptBlock:75 - chama: golpesFuturosDe (builds.js:179), LEGENDA_GOLPE (golpes.js:26), movePromptLine (golpes.js:28)
- rosterParaTimeIA:697 - chama: getSpeciesByX (dados_base.js:78), battleFamilyOf (formas_mega.js:219), usableSpeciesFor (formas_mega.js:222), xsDoJogador (liberado_na_run.js:37), speciesTypeNames (tipos.js:253) | chamado por: generateTeamForArchetype (arquetipo.js:153)
- sampleErrorMessage:147 - chamado por: pedirIAAgora (ia.js:109)
- snamesValidosDoTime:783 - chamado por: generateTeamForArchetype (arquetipo.js:153)
- versaoDosDados:190 - chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:86), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:103)
- viramDoTipoPrompt:732 - chama: getSpeciesByX (dados_base.js:78), xsDoJogador (liberado_na_run.js:37), mudancaDeTipo (mono_run.js:95)

## regras/rank_da_run.js
- FORA_DO_RANK:10 - chamado por: rankBadgeHtml (dex_ficha.js:169), rankInfoLineHtml (dex_ficha.js:310)
- MOTIVO_FORA_DO_RANK_PT:17 - chamado por: rankBadgeHtml (dex_ficha.js:169), rankInfoLineHtml (dex_ficha.js:310)
- chaveDoRankDaDificuldade:23 - chama: TIER_DA_DIFICULDADE (chefoes.js:21)
- rankDaDificuldadeDe:69 - chamado por: marcasDoRankHtml (dex_ficha.js:288)
- rankDe:29 - chama: state (nucleo.js:8) | chamado por: bestBoxCandidateForBoss (chefoes.js:193), bestRankForm (chefoes.js:343), aiTool_getSpeciesRank (ferramentas_ia.js:24), formFamilyPromptNote (formas_mega.js:46), monoDisponibilidade (mono_run.js:176), +9

## regras/reconciliar_build.js
- habilidadeSubstitutaPara:26 - chama: habilidadesEscolhiveis (dados_base.js:119), sinergiasDaEspecie (duelo.js:1444)
- movepoolCompletoDe:17 - chama: MOVES (dados_base.js:11)
- reconciliarBuild:39 - chama: habilidadesEscolhiveis (dados_base.js:119) | chamado por: effectiveBuild (builds.js:202), reconciliarBuildsDe (evolucao.js:104)

## regras/save.js
- AUTO_LOG_MAX:37 - chamado por: logAutoAction (evolucao.js:229)
- anteriorSaneado:236 - chama: planoSaneado (plano_build.js:107)
- applySave:47 - chama: BUILD_SOURCES (builds.js:17), MONOTYPE_ARCHETYPES (dados_base.js:157), PACE_ARCHETYPES (dados_base.js:146), TATICA_ARCHETYPES (dados_base.js:150), USABLE_TYPES (dados_base.js:132), +10 | chamado por: loadSave (nucleo.js:337), aplicarSaveRemoto (sync.js:45)
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
- contextoDoMotor:140 - chama: capOuPadrao (level_cap.js:61), xsDoJogador (liberado_na_run.js:37), state (nucleo.js:8) | chamado por: modoMotorAquecer (modo_motor.js:40), modoMotorMontar (modo_motor.js:68)
- criarCacheDoMotor:64 - chamado por: modoMotorCache (modo_motor.js:19)
- montarTimePeloMotorEmPassos:431 - chama: SPECIES (dados_base.js:52), motorClassificar (time_pelo_motor_papeis.js:207), motorTextos (time_pelo_motor_papeis.js:306) | chamado por: modoMotorMontar (modo_motor.js:68)
- motorAquecerBuildsEmPassos:228 - chamado por: modoMotorAquecer (modo_motor.js:40)
- motorArred:61 - chamado por: motorClassificar (time_pelo_motor_papeis.js:207), motorDeltaSemMembro (time_pelo_motor_papeis.js:194), motorDeltaSemTipos (time_pelo_motor_papeis.js:198), motorProvasDosMembros (time_pelo_motor_papeis.js:157)
- motorAvaliar:263 - chamado por: motorClassificar (time_pelo_motor_papeis.js:207)
- motorBuildDoCandidato:168 - chama: ABILITIES (dados_base.js:10), MOVES (dados_base.js:11), melhorUnidadeContra (duelo.js:3145), getActiveBuild (evolucao.js:16), liberadoNaRun (liberado_na_run.js:22), +2
- motorCandidatosEmPassos:204 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:263), serveProMono (mono_run.js:74)
- motorChaveDaBuild:164 - chamado por: motorAlternativasArmadoras (time_pelo_motor_papeis.js:101)
- motorChaveDoContexto:167 - chama: megaMode (formas_mega.js:82), levelCapMode (level_cap.js:16), state (nucleo.js:8) | chamado por: motorAlternativasArmadoras (time_pelo_motor_papeis.js:101)
- motorFecharItens:392 - chama: itemValidoNoTime (itens_do_time.js:94)
- motorGuardar:65 - chamado por: motorAux (time_pelo_motor_papeis.js:26)
- motorItensCandidatos:369 - chama: MOVES (dados_base.js:11), unidadeDeDuelo (duelo.js:3121), itemDeTipoDoTime (itens_do_time.js:102), itemValidoNoTime (itens_do_time.js:94), conflitoDeItem (validacao_build_ia.js:130)
- motorLutasComunsDoContexto:107 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), FATIA_DOS_CHEFOES (chefoes.js:29), state (nucleo.js:8)
- motorLutasDoContexto:122 - chama: LUTAS_DA_RUN (chefoes.js:324)
- motorMontarLuta:78 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), bossPartyPorDificuldade (chefoes.js:337), buffsAtivosDoChefao (chefoes.js:498), regraDeCampoDoChefao (chefoes.js:422), climaDoTimeDoChefao (duelo.js:3097), +5 | chamado por: motorLutaComClima (time_pelo_motor_papeis.js:53)
- motorMontarLutaComum:89 - chama: climaDoTimeDoChefao (duelo.js:3097), foeDeDuelo (duelo.js:3071)
- motorNivelDaEtapa:72 - chama: levelCapMode (level_cap.js:16)
- motorRaizDaLinha:150 - chama: SPECIES (dados_base.js:52), isMegaEvoKind (formas_mega.js:22)
- motorSimular:246 - chama: meuComBuffsDoGinasio (duelo.js:4259), simularDuplaContraChefao (duelo.js:3819), simularLutaContraChefao (duelo.js:4299), megaMode (formas_mega.js:82), state (nucleo.js:8) | chamado por: motorClassificar (time_pelo_motor_papeis.js:207), motorDeltaSemMembro (time_pelo_motor_papeis.js:194), motorDeltaSemTipos (time_pelo_motor_papeis.js:198)
- motorTemGolpeDeLado:275 - chama: semGolpesDeLadoDuelo (duelo.js:4717)
- motorUnidade:234 - chama: planoDoGolpeStatus (duelo.js:3312), unidadeDaBuild (duelo.js:3219) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:33), motorProvasDosMembros (time_pelo_motor_papeis.js:157), motorTemTipo (time_pelo_motor_papeis.js:202), motorUnidadeNaLuta (time_pelo_motor_papeis.js:23)

## regras/time_pelo_motor_papeis.js
- MOTOR_FRASE_DA_PROVA:321 - chamado por: modoMotorMembroHtml (modo_motor.js:177)
- motorAlternativasArmadoras:101 - chama: liberadoNaRun (liberado_na_run.js:22), motorChaveDaBuild (time_pelo_motor.js:164), motorChaveDoContexto (time_pelo_motor.js:167)
- motorAux:26 - chama: motorGuardar (time_pelo_motor.js:65)
- motorClassificar:207 - chama: serveProMono (mono_run.js:74), motorArred (time_pelo_motor.js:61), motorAvaliar (time_pelo_motor.js:263), motorSimular (time_pelo_motor.js:246), state (nucleo.js:8) | chamado por: montarTimePeloMotorEmPassos (time_pelo_motor.js:431)
- motorCondicoes:33 - chama: ABILITY_ID_BY_NAME (confronto.js:17), MOVES (dados_base.js:11), armadoresDeClima (duelo.js:3280), planoDoGolpeStatus (duelo.js:3312), motorUnidade (time_pelo_motor.js:234)
- motorDeltaSemMembro:194 - chama: motorArred (time_pelo_motor.js:61), motorSimular (time_pelo_motor.js:246)
- motorDeltaSemTipos:198 - chama: motorArred (time_pelo_motor.js:61), motorSimular (time_pelo_motor.js:246)
- motorGanhoDaCondicao:56 - chama: DURACAO_LADO_DUELO (duelo.js:4027), meuComBuffsDoGinasio (duelo.js:4259), novoLadoDuelo (duelo.js:4030), resultadoDoDuelo (duelo.js:2796), unidadeDaBuild (duelo.js:3219)
- motorLutaComClima:53 - chama: motorMontarLuta (time_pelo_motor.js:78)
- motorLutaDetalhada:136 - chama: simularLutaContraChefao (duelo.js:4299)
- motorProvasDosMembros:157 - chama: danoNoDuelo (duelo.js:2087), motorArred (time_pelo_motor.js:61), motorUnidade (time_pelo_motor.js:234)
- motorSimularComClima:143 - chama: CLIMA_OFICIAL (campo.js:49), meuComBuffsDoGinasio (duelo.js:4259), novoLadoDuelo (duelo.js:4030), simularLutaContraChefao (duelo.js:4299), unidadeDaBuild (duelo.js:3219), +1
- motorTemTipo:202 - chama: planoDoGolpeStatus (duelo.js:3312), motorUnidade (time_pelo_motor.js:234)
- motorTextos:306 - chamado por: montarTimePeloMotorEmPassos (time_pelo_motor.js:431)
- motorUnidadeNaLuta:23 - chama: meuComBuffsDoGinasio (duelo.js:4259), motorUnidade (time_pelo_motor.js:234)

## regras/tipos.js
- TYPE_MOD_ABILITIES:74 - chamado por: efetividadeNoDuelo (duelo.js:2036), habilidadeSemRegraNoDuelo (duelo.js:1802)
- abilityTypeMod:172 - chamado por: computeSharedRisks (chefoes.js:119), unitTypeMult (formas_mega.js:279), cobreFraquezas (mono_run.js:88), renderTeamAnalysis (arquetipo.js:599)
- abilityTypeModFor:195 - chama: ABILITIES (dados_base.js:10) | chamado por: ameacaDe (confronto.js:91), coberturaSugerida (confronto.js:196), ofensaContra (confronto.js:59), aterradoDuelo (duelo.js:958), efetividadeNoDuelo (duelo.js:2036)
- alwaysActiveAbilities:163 - chamado por: confrontoUnitOf (chefoes.js:243)
- perfilDefensivoDaEspecie:178 - chama: USABLE_TYPES (dados_base.js:132) | chamado por: fichaEfetividadeHtml (dex_ficha.js:423)
- speciesTypeNames:253 - chama: TYPES (dados_base.js:9) | chamado por: confrontoUnitOf (chefoes.js:243), podeTerStatus (condicoes_habilidade.js:132), coberturaSugerida (confronto.js:196), ofensaContra (confronto.js:59), itemDoDuelo (duelo.js:1004), +28
- typeMultiplier:243 - chamado por: efetividadeNoDuelo (duelo.js:2036), entrarNoLadoDuelo (duelo.js:4082), simularLutaDeVerdadeContraChefao (duelo.js:4308), avisoProximoLider (mono_run.js:158), fraquezasDoTipo (mono_run.js:80), +2

## regras/validacao_build_ia.js
- ITENS_CHOICE:105 - chamado por: avisosDaBuild (avisos_build.js:8)
- ajustarBuildDaIa:494 - chama: habilidadesEscolhiveis (dados_base.js:119), evsTextoParaArray (plano_build.js:24) | chamado por: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105)
- conferirPapelDaBuild:80 - chama: ehGolpeDePivo (golpes.js:41), availableMovesFor (level_cap.js:73), state (nucleo.js:8)
- conflitoDeItem:130 - chama: MOVE_BY_NAME (dados_base.js:86), SPLIT_STATUS (dados_base.js:29), evioliteFunciona (formas_mega.js:32), speciesTypeNames (tipos.js:253) | chamado por: avisosDaBuild (avisos_build.js:8), motorItensCandidatos (time_pelo_motor.js:369)
- conflitoDeNature:113 - chama: MOVE_BY_NAME (dados_base.js:86), NATURE_MODS (dados_base.js:90), moveRoleOf (golpes.js:53), state (nucleo.js:8)
- contextoDeValidacao:191 - chama: buffsAtivosDoChefao (chefoes.js:498), habilidadesEscolhiveis (dados_base.js:119) | chamado por: buildDoLoteDeBuilds (gravacao_build_ia.js:45), validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), pipelineValidarRascunho (pipeline_build.js:493)
- entradaDaCuradaParaTimeNovo:513 - chama: itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), stripNote (builds.js:49), habilidadesEscolhiveis (dados_base.js:119), golpesTravadosNoCap (level_cap.js:90), +1 | chamado por: aplicarCuradaNoTimeNovo (ia.js:153)
- limitarEvsAoJogo:163 - chama: clampInt (dados_base.js:103)
- megaStoneRuleFor:14 - chama: isMegaForm (formas_mega.js:71), megaMode (formas_mega.js:82), stonesOf (formas_mega.js:253) | chamado por: avisosDaBuild (avisos_build.js:8), comoGarantir (condicoes_habilidade.js:170), fecharBuild (pipeline_build.js:698), pipelineValidarRascunho (pipeline_build.js:493), blocoMegaIA (prompts_ia.js:271), +1
- regraItemConsumivelPara:47 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122)
- regraItemConsumivelPrompt:57 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122) | chamado por: blocoItensDaEspecieIA (prompts_ia.js:287)
- setsValidosDaResposta:478 - chamado por: generateStrategySets (revisao_automatica.js:182)
- validateAiBuild:208 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), trimAndReallocateEvs (calc_stat.js:238), condicaoDaBuild (condicoes_habilidade.js:189), +23 | chamado por: buildDoLoteDeBuilds (gravacao_build_ia.js:45), validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), pipelineValidarRascunho (pipeline_build.js:493)
