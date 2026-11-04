# Chamadas entre arquivos - src/regras/

Gerado por `npm run mapa` (scripts/mapa_chamadas.mjs, API do TypeScript); não edite à mão.
Por função de nível superior: `chama:` e `chamado por:` funções de OUTROS arquivos de src/regras e src/ui, como `nome (arquivo:linha)`;
no máximo 5 por lista, o resto vira `+N`. Referência vale também como callback. Chamada pelo template/HTML não aparece. Mapa geral: [mapa-do-codigo.md](../mapa-do-codigo.md).

## regras/avisos_build.js
- avisosDaBuild:8 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), stripNote (builds.js:49), garantiaDaCondicao (condicoes_habilidade.js:155), +15 | chamado por: buildContextNotesHtml (editor_build.js:161)
- ondeAcharItemTexto:100 - chamado por: itemDescHtml (editor_build.js:45)
- primeiroLugarDoItem:94 - chamado por: etapaDoItem (liberado_na_run.js:18), itensAindaIndisponiveisParaIA (prompts_ia.js:310)
- rotuloDaEtapaDoItem:98 - chamado por: blocoItensAindaIndisponiveisIA (prompts_ia.js:319)
- seloDaBuild:82 - chamado por: seloDaBuildHtml (editor_build.js:168)

## regras/builds.js
- BUILD_SOURCES:17 - chamado por: applySave (save.js:49)
- MAX_MESMO_ITEM_NO_TIME:150 - chamado por: avisosDaBuild (avisos_build.js:8), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:105), blocoItensComunsIA (prompts_ia.js:326), blocoTimeEmUsoIA (prompts_ia.js:359), montarPromptBuildsDoTime (prompts_ia.js:607), +1
- comecarLoteDeBuilds:118 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308), generateCompleteTeam (arquetipo.js:292)
- computeTeamGenerationValidation:240 - chama: computeSharedRisks (chefoes.js:121) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308), generateCompleteTeam (arquetipo.js:292), generatedTeamCardHtml (arquetipo.js:417)
- concluirBuildDoLote:119 - chamado por: generateCompleteTeam (arquetipo.js:292), gerarBuildsDoTimeComIA (ia.js:176)
- effectiveBuild:202 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), MEGA_BASE_BY_X (formas_mega.js:21), isMegaForm (formas_mega.js:71), getCurrentCap (level_cap.js:49), +6 | chamado por: confrontoUnitOf (chefoes.js:245), descricaoTimeParaGuia (prompts_ia.js:820), montarPromptTimeArquetipo (prompts_ia.js:767), compareResultHtml (ficha_extras.js:22), renderTeam (time.js:8)
- encerrarLoteDeBuilds:120 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308), generateCompleteTeam (arquetipo.js:292)
- entradaDeBuild:23 - chama: getSpeciesBySname (dados_base.js:79), getCurrentCap (level_cap.js:49), planoSaneado (plano_build.js:107) | chamado por: acrescentarVarianteNaLista (lista_de_builds.js:23), trocarBuildAtivaNaLista (lista_de_builds.js:11), gravarSugestoesDoMotor (sugestao_do_motor.js:61)
- evsToShowdownText:75 - chama: ROTULOS_EV (plano_build.js:21) | chamado por: myBuildEditorHtml (editor_build.js:223), strategySetsHtml (editor_build.js:432)
- golpesFuturosDe:179 - chama: MOVES (dados_base.js:11), nivelDeEvolucaoDaForma (plano_build.js:68), nivelDoGolpe (plano_build.js:56) | chamado por: blocoPlanoCurtoIA (escolha_ia_candidatos.js:73), planoPromptBlock (prompts_ia.js:84), processarRevisoes (revisao_automatica.js:72)
- itemEsgotadoNoTime:152 - chamado por: avisosDaBuild (avisos_build.js:8), blocoTimeCurtoIA (escolha_ia_candidatos.js:55), itemValidoNoTime (itens_do_time.js:94), blocoTimeEmUsoIA (prompts_ia.js:359), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:515), +1
- itensEmUsoComQuem:153 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:359), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:515), validateAiBuild (validacao_build_ia.js:210)
- showdownSet:58 - chamado por: initBosses (aba_chefoes.js:33), buildEntryHtml (editor_build.js:182), myBuildEditorHtml (editor_build.js:223), strategySetsHtml (editor_build.js:432), renderTeam (time.js:8)
- stripNote:49 - chamado por: avisosDaBuild (avisos_build.js:8), aiTool_getItemInfo (ferramentas_ia.js:150), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:515), hpEvEfficiencyNote (editor_build.js:83), itemDescHtml (editor_build.js:45), +1
- teamItemsInUse:90 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- teamMovesInUse:123 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:359)
- teamRolesInUse:165 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), blocoTimeEmUsoIA (prompts_ia.js:359)

## regras/calc_stat.js
- ITEM_MOVE_POWER_MODS:132 - chamado por: updateMyBuildStatus (editor_build.js:362)
- calcFinalStat:160 - chama: NATURE_MODS (dados_base.js:90) | chamado por: computeSpeedTiers (chefoes.js:525), foeDeDuelo (duelo.js:3031), semItemDuplicadoNoHell (duelo.js:3071), unidadeDeDuelo (duelo.js:3081), linhaVelocidadeIA (prompts_ia.js:426), +3
- especiePorNomeDoItem:135 - chama: SPECIES (dados_base.js:52)
- itemRuleFor:149 - chamado por: itemDoDuelo (duelo.js:883), bossMonCardHtml (aba_chefoes.js:460), updateMyBuildStatus (editor_build.js:362)
- minEvSameStat:200 - chamado por: evBreakpointNote (editor_build.js:116)
- regraCasaComEspecie:139 - chama: isMegaEvoKind (formas_mega.js:22)
- trimAndReallocateEvs:238 - chamado por: validateAiBuild (validacao_build_ia.js:210)

## regras/campo.js
- ARQUETIPOS_DE_CAMPO:33 - chamado por: applySave (save.js:49), archetypeCardHtml (arquetipo.js:85)
- CAMADAS_DE_HAZARD:55 - chamado por: novoLadoDuelo (duelo.js:4026)
- CLIMAS_DO_CAMPO:25 - chamado por: armadoresDeClima (duelo.js:3271), efeitoDasHabilidadesNoDuelo (duelo.js:1371), habilidadeSemRegraNoDuelo (duelo.js:1704)
- CLIMA_OFICIAL:49 - chamado por: danoNoDuelo (duelo.js:1976), montarTimeNoClimaEmPassos (duelo.js:4609), prepararGolpesDuelo (duelo.js:1753), motorSimularComClima (time_pelo_motor_papeis.js:143)
- CONDICAO_DO_ARQUETIPO_CAMPO:35 - chamado por: garantiaDoTime (condicoes_habilidade.js:141)
- DURACAO_CAMPO:9 - chamado por: lerCampoDaFraseDuelo (duelo.js:801), lerDiversosDaFraseDuelo (duelo.js:564)
- HAZARD_DO_GOLPE:56 - chamado por: planoDoGolpeStatus (duelo.js:3303), resultadosDaLutaComHazard (duelo.js:3215)
- TERRENO_DO_TEXTO:29 - chamado por: lerCampoDaFraseDuelo (duelo.js:801)
- hazardCheioNoLado:57 - chamado por: simularLutaDeVerdadeContraChefao (duelo.js:4308)
- poeHazardNoLado:58 - chamado por: resultadosDaLutaComHazard (duelo.js:3215), simularDuplaContraChefao (duelo.js:3814), simularLutaDeVerdadeContraChefao (duelo.js:4308)
- rotuloDoArquetipoDeCampo:46 - chamado por: archetypeBuildGuidance (prompts_ia.js:66), montarPromptTimeArquetipo (prompts_ia.js:767)

## regras/chefoes.js
- DIFF_TO_BOSSKEY:25 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorLutasComunsDoContexto (time_pelo_motor.js:107), motorMontarLuta (time_pelo_motor.js:78), quemResolveCardHtml (quem_resolve.js:83)
- FATIA_DOS_CHEFOES:29 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorLutasComunsDoContexto (time_pelo_motor.js:107)
- HELL_DANO_EXTRA_A_PARTIR_DA_INSIGNIA:470 - chamado por: fDanoGlobalHell (duelo.js:3028)
- HELL_IV_ZERO_A_PARTIR_DA_INSIGNIA:471 - chamado por: ivDoJogadorDuelo (duelo.js:3069)
- HELL_NIVEIS_EXTRAS:467 - chamado por: nivelDoInimigoHell (duelo.js:3030)
- HELL_NIVEIS_EXTRAS_A_PARTIR_DA_INSIGNIA:468 - chamado por: nivelDoInimigoHell (duelo.js:3030)
- LUTAS_DA_RUN:326 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorLutasDoContexto (time_pelo_motor.js:122)
- SPEEDTIER_NATURE:523 - chamado por: renderSpeedTiers (tipos.js:35)
- TIER_DA_DIFICULDADE:21 - chamado por: chaveDoRankDaDificuldade (rank_da_run.js:23)
- bestBoxCandidateForBoss:195 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:185), unitTypeMult (formas_mega.js:201), serveProMono (mono_run.js:74), rankDe (rank_da_run.js:29), +1 | chamado por: aiTool_getBoxCandidatesForBoss (ferramentas_ia.js:182), linhasProximaLutaIA (prompts_ia.js:443), nextFightDetailHtml (resumo_luta.js:215)
- bestRankForm:345 - chama: battleUnitsOf (formas_mega.js:185), rankDe (rank_da_run.js:29) | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- bossPartyPorDificuldade:339 - chama: state (nucleo.js:8) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), avisoProximoLider (mono_run.js:158), pipelineResolverAlvo (pipeline_build.js:73), linhasProximaLutaIA (prompts_ia.js:443), motorMontarLuta (time_pelo_motor.js:78), +2
- bossSafetyScore:183 - chama: unitTypeMult (formas_mega.js:201)
- bossSpeedSummary:144 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- buffsAtivosDoChefao:512 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorMontarLuta (time_pelo_motor.js:78), contextoDeValidacao (validacao_build_ia.js:193), montarTimeContraEsteChefao (aba_chefoes.js:308)
- buffsParaMostrarDoChefao:503 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308), buffsMudaram (arquetipo.js:364)
- classeDoCabecalhoDoChefao:57 - chamado por: renderBossDetail (aba_chefoes.js:556)
- comportamentoDaIADoChefao:459 - chamado por: iaDoChefaoHtml (aba_chefoes.js:190)
- computeBossAttackTypes:159 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9), moveRoleOf (golpes.js:53), state (nucleo.js:8)
- computeSharedRisks:121 - chama: USABLE_TYPES (dados_base.js:132), abilityTypeMod (tipos.js:173) | chamado por: computeTeamGenerationValidation (builds.js:240), linhaDeFraquezasDoTimeIA (escolha_ia_candidatos.js:51), aiTool_getTeamWeaknesses (ferramentas_ia.js:15), blocoPapelIA (prompts_ia.js:238), renderTeamAnalysis (arquetipo.js:580), +2
- computeSpeedTiers:525 - chama: calcFinalStat (calc_stat.js:160), SPECIES (dados_base.js:52), nivelDeCalculo (level_cap.js:65) | chamado por: aiTool_getSpeedBenchmark (ferramentas_ia.js:204), linhaVelocidadeIA (prompts_ia.js:426), renderSpeedTiers (tipos.js:35)
- confrontoFoesDe:270 - chama: foeFromBossMember (confronto.js:49), getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), megaDaPedra (formas_mega.js:169) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), linhasProximaLutaIA (prompts_ia.js:443)
- confrontoMelhorUnidade:281 - chama: confrontoTime (confronto.js:146), battleUnitsOf (formas_mega.js:185)
- confrontoMinhasUnidades:291 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- confrontoParaParty:310 - chama: confrontoTime (confronto.js:146), melhoresTrocas (confronto.js:265) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), linhasProximaLutaIA (prompts_ia.js:443), initProgress (progresso.js:105), bossConfrontoHtml (resumo_luta.js:96), dashboardConfrontoHtml (resumo_luta.js:135)
- confrontoUnidadesDaCaixa:301 - chama: getSpeciesByX (dados_base.js:78), serveProMono (mono_run.js:74), state (nucleo.js:8)
- confrontoUnitOf:245 - chama: effectiveBuild (builds.js:202), ABILITY_ID_BY_NAME (confronto.js:17), availableMovesFor (level_cap.js:73), alwaysActiveAbilities (tipos.js:164), speciesTypeNames (tipos.js:254)
- ehRevancheDeLider:484 - chamado por: linhasProximaLutaIA (prompts_ia.js:443), renderGymSkillsCardHtml (aba_chefoes.js:423)
- faixaDeHpDaLuta:589 - chamado por: planoContraChefaoHtml (arquetipo.js:368)
- getRemainingBossEntries:63 - chama: state (nucleo.js:8) | chamado por: aiTool_getBoxCandidatesForBoss (ferramentas_ia.js:182), aiTool_getNextBossRoster (ferramentas_ia.js:120), aiTool_getRemainingBosses (ferramentas_ia.js:159), avisoProximoLider (mono_run.js:158), pipelineResolverAlvo (pipeline_build.js:73), +7
- gymLeaderBaseName:55 - chamado por: avisoProximoLider (mono_run.js:158), linhasProximaLutaIA (prompts_ia.js:443), renderGymSkillsCardHtml (aba_chefoes.js:423)
- gymSkillsSummaryFor:379 - chama: state (nucleo.js:8) | chamado por: linhasProximaLutaIA (prompts_ia.js:443), renderGymSkillsCardHtml (aba_chefoes.js:423)
- nextFightCx:363 - chamado por: renderDashboard (resumo_luta.js:183), renderNextFightCard (resumo_luta.js:257)
- planoDaLuta:545 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308)
- quemRespondeNoPlano:574 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308)
- regraDeCampoDoChefao:426 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), linhasProximaLutaIA (prompts_ia.js:443), motorMontarLuta (time_pelo_motor.js:78), campoDoChefaoHtml (aba_chefoes.js:178), montarTimeContraEsteChefao (aba_chefoes.js:308)
- regrasDoHell:477 - chamado por: hellDoChefaoHtml (aba_chefoes.js:199)
- resumoDaLuta:558 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308)
- varianteDoChefao:370 - chama: state (nucleo.js:8) | chamado por: selectBoss (aba_chefoes.js:404), initProgress (progresso.js:105)
- vereditoDaLuta:583 - chamado por: vereditoDaLutaHtml (arquetipo.js:355)

## regras/condicoes_habilidade.js
- NOME_DA_CONDICAO:42 - chamado por: objetivoDaEscolhaIA (escolha_ia_candidatos.js:81), contextoDoModoPrompt (prompts_ia.js:94), montarPromptBuildsDoTime (prompts_ia.js:607), planoContraChefaoHtml (arquetipo.js:368)
- blocoCondicoesIA:238 - chamado por: montarPromptBuild (prompts_ia.js:551), montarPromptBuildsDoTime (prompts_ia.js:607), montarPromptEstrategias (prompts_ia.js:656)
- comoGarantir:171 - chama: ITEMS (dados_base.js:12), availableMovesFor (level_cap.js:73), megaStoneRuleFor (validacao_build_ia.js:14)
- condicaoDaBuild:190 - chamado por: validateAiBuild (validacao_build_ia.js:210)
- descricaoDeHabilidade:77 - chama: ABILITIES (dados_base.js:10)
- descricaoDeHabilidadePorId:88 - chama: ABILITIES (dados_base.js:10) | chamado por: textoHabDuelo (duelo.js:48)
- expandirTextoDeHabilidade:99 - chama: ABILITIES (dados_base.js:10), LIDO_PELO_TEXTO_NOVO_DUELO (texto_versao_nova.js:160), TEXTO_DA_VERSAO_NOVA_DUELO (texto_versao_nova.js:9) | chamado por: textoHabDuelo (duelo.js:48)
- garantiaDaCondicao:155 - chama: ITEMS (dados_base.js:12) | chamado por: avisosDaBuild (avisos_build.js:8)
- garantiaDoTime:141 - chama: CONDICAO_DO_ARQUETIPO_CAMPO (campo.js:35), getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), state (nucleo.js:8)
- habilidadeArma:113 - chamado por: armadoresDeClima (duelo.js:3271), climaDoTimeDoChefao (duelo.js:3057), efeitoDasHabilidadesNoDuelo (duelo.js:1371), habilidadeSemRegraNoDuelo (duelo.js:1704)
- nomesDeHabilidades:116 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122) | chamado por: avisosDaBuild (avisos_build.js:8), nivelDaHabilidadeNoElite (level_cap.js:40)
- podeTerStatus:128 - chama: ABILITY_ID_BY_NAME (confronto.js:17), STATUS_DUELO (duelo.js:217), efeitoDasHabilidadesNoDuelo (duelo.js:1371), speciesTypeNames (tipos.js:254)
- precisaDeSetter:213 - chama: availableMovesFor (level_cap.js:73) | chamado por: avisosDaBuild (avisos_build.js:8), marcasDoRankHtml (dex_ficha.js:288)

## regras/confronto.js
- ABILITY_ID_BY_NAME:17 - chamado por: confrontoUnitOf (chefoes.js:245), podeTerStatus (condicoes_habilidade.js:128), climaDoTimeDoChefao (duelo.js:3057), foeDeDuelo (duelo.js:3031), montarTimeNoClimaEmPassos (duelo.js:4609), +6
- aberturaEmDupla:319 - chamado por: confrontoPlanoHtml (resumo_luta.js:67)
- ameacaDe:91 - chama: MOVE_BY_NAME (dados_base.js:86), abilityTypeModFor (tipos.js:196)
- coberturaSugerida:196 - chama: MOVE_BY_NAME (dados_base.js:86), moveRoleOf (golpes.js:53), abilityTypeModFor (tipos.js:196), speciesTypeNames (tipos.js:254) | chamado por: aiTool_getNextBossRoster (ferramentas_ia.js:120), linhasProximaLutaIA (prompts_ia.js:443), confrontoAjustesHtml (resumo_luta.js:44)
- confrontoDamagingMoves:29 - chama: MOVE_BY_NAME (dados_base.js:86), moveRoleOf (golpes.js:53)
- confrontoMoveType:32 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9)
- confrontoTime:146 - chamado por: confrontoMelhorUnidade (chefoes.js:281), confrontoParaParty (chefoes.js:310)
- cuidadosDoChefao:302 - chamado por: confrontoPlanoHtml (resumo_luta.js:67)
- foeFromBossMember:49 - chama: getSpeciesByX (dados_base.js:78) | chamado por: confrontoFoesDe (chefoes.js:270)
- melhoresTrocas:265 - chamado por: confrontoParaParty (chefoes.js:310)
- ofensaContra:59 - chama: MOVE_BY_NAME (dados_base.js:86), abilityTypeModFor (tipos.js:196), speciesTypeNames (tipos.js:254)

## regras/dados_base.js
- ABILITIES:10 - chamado por: descricaoDeHabilidade (condicoes_habilidade.js:77), descricaoDeHabilidadePorId (condicoes_habilidade.js:88), expandirTextoDeHabilidade (condicoes_habilidade.js:99), nomesDeHabilidades (condicoes_habilidade.js:116), camposLidosDaHabilidade (duelo.js:1685), +18
- ALL_NATURES:101 - chamado por: fecharBuild (pipeline_build.js:713), validateAiBuild (validacao_build_ia.js:210), myBuildEditorHtml (editor_build.js:223)
- EVOKINDS:13 - chamado por: evolveChainByX (evolucao.js:66), isMegaEvoKind (formas_mega.js:22), nivelDeEvolucaoDaForma (plano_build.js:68), evoConditionText (dex_ficha.js:88)
- EVO_LEVEL:30 - chamado por: evolveChainByX (evolucao.js:66), nivelDeEvolucaoDaForma (plano_build.js:68)
- EVO_LEVEL_FEMALE:32 - chamado por: evoConditionText (dex_ficha.js:88)
- EVO_LEVEL_MALE:31 - chamado por: evoConditionText (dex_ficha.js:88)
- EVO_MEGA_KINDS:34 - chamado por: isMegaEvoKind (formas_mega.js:22), evoConditionText (dex_ficha.js:88)
- EVO_PRIMAL:33 - chamado por: isMegaEvoKind (formas_mega.js:22), evoConditionText (dex_ficha.js:88)
- ITEMS:12 - chamado por: comoGarantir (condicoes_habilidade.js:171), garantiaDaCondicao (condicoes_habilidade.js:155), itensDeEspeciePara (itens_do_time.js:82), soExistentes (itens_do_time.js:30), orientacaoMono (mono_run.js:144), +6
- MAPS:49 - chamado por: howToObtainText (dex_ficha.js:236), whereToFindText (dex_ficha.js:266)
- MONOTYPE_ARCHETYPES:156 - chamado por: applySave (save.js:49), archetypeCardHtml (arquetipo.js:85)
- MOVES:11 - chamado por: golpesFuturosDe (builds.js:179), acertosDoGolpeDuelo (duelo.js:86), efeitoDoPlanoDuelo (duelo.js:3600), escolherProximoDoChefao (duelo.js:4136), fracaoDormindoDuelo (duelo.js:2203), +26
- MOVE_BY_NAME:86 - chamado por: computeBossAttackTypes (chefoes.js:159), ameacaDe (confronto.js:91), coberturaSugerida (confronto.js:196), confrontoDamagingMoves (confronto.js:29), confrontoMoveType (confronto.js:32), +7
- MOVE_ID_BY_NAME:87 - chamado por: danoDoFuturoDuelo (duelo.js:2735), foeDeDuelo (duelo.js:3031), lerCondicaoDaFraseDuelo (duelo.js:370), lerDiversosDaFraseDuelo (duelo.js:564), poderDoDadoDuelo (duelo.js:2180), +9
- NATURE_MODS:90 - chamado por: calcFinalStat (calc_stat.js:160), conflitoDeNature (validacao_build_ia.js:114), validateAiBuild (validacao_build_ia.js:210)
- PACE_ARCHETYPES:146 - chamado por: applySave (save.js:49), archetypeCardHtml (arquetipo.js:85)
- ROLE_LABEL_PT:181 - chamado por: aiTool_getSpeciesRank (ferramentas_ia.js:24), blocoTimeEmUsoIA (prompts_ia.js:359), descricaoTimeParaGuia (prompts_ia.js:820), montarPromptTimeArquetipo (prompts_ia.js:767), nomePapel (prompts_ia.js:237), +2
- SPECIES:52 - chamado por: especiePorNomeDoItem (calc_stat.js:135), computeSpeedTiers (chefoes.js:525), especieDaFormaDuelo (duelo.js:3551), buildStandardAiTools (ferramentas_ia.js:249), especiesQueResolvem (pipeline_build.js:653), +4
- SPECIES_BY_SNAME:72 - chamado por: snamesToXs (save.js:15)
- SPLIT_LABEL_PT:182 - chamado por: aiTool_getSpeciesRank (ferramentas_ia.js:24), roleTagsHtml (dex_ficha.js:215)
- SPLIT_STATUS:29 - chamado por: moveRoleOf (golpes.js:53), conflitoDeItem (validacao_build_ia.js:132), updateMyBuildStatus (editor_build.js:362)
- TATICA_ARCHETYPES:149 - chamado por: applySave (save.js:49), archetypeCardHtml (arquetipo.js:85)
- TYPES:9 - chamado por: computeBossAttackTypes (chefoes.js:159), confrontoMoveType (confronto.js:32), efeitoDasHabilidadesNoDuelo (duelo.js:1371), escolherProximoDoChefao (duelo.js:4136), lerDiversosDaFraseDuelo (duelo.js:564), +11
- USABLE_TYPES:132 - chamado por: computeSharedRisks (chefoes.js:121), fraquezasDoTipo (mono_run.js:80), resistemAoTipo (mono_run.js:83), applySave (save.js:49), perfilDefensivoDaEspecie (tipos.js:179), +2
- clampInt:103 - chamado por: applySave (save.js:49), sanitizarStrategySets (save.js:258), limitarEvsAoJogo (validacao_build_ia.js:165), lerFormularioDoEditor (editor_build.js:493), updateMyBuildEvTotal (editor_build.js:332), +1
- descricaoDaEspecie:187 - chamado por: fichaCabecalhoHtml (dex_ficha.js:504)
- getSpeciesBySname:79 - chamado por: entradaDeBuild (builds.js:23), confrontoFoesDe (chefoes.js:270), efeitoDasHabilidadesNoDuelo (duelo.js:1371), foeDeDuelo (duelo.js:3031), carryUserData (evolucao.js:167), +17
- getSpeciesByX:78 - chamado por: effectiveBuild (builds.js:202), itensEmUsoComQuem (builds.js:153), teamItemsInUse (builds.js:90), teamMovesInUse (builds.js:123), teamRolesInUse (builds.js:165), +57
- habilidadesEscolhiveis:119 - chamado por: formFamilyPromptNote (formas_mega.js:46), montarPromptTimeArquetipo (prompts_ia.js:767), habilidadeSubstitutaPara (reconciliar_build.js:26), reconciliarBuild (reconciliar_build.js:39), ajustarBuildDaIa (validacao_build_ia.js:496), +5
- snameOf:80 - chamado por: applySave (save.js:49), xsToSnames (save.js:24)
- uniqueIds:122 - chamado por: nomesDeHabilidades (condicoes_habilidade.js:116), armadoresDeClima (duelo.js:3271), climaDoTimeDoChefao (duelo.js:3057), comHabilidadesDuelo (duelo.js:3506), foeDeDuelo (duelo.js:3031), +17

## regras/duelo.js
- DURACAO_LADO_DUELO:4022 - chamado por: motorGanhoDaCondicao (time_pelo_motor_papeis.js:56)
- STATUS_DUELO:217 - chamado por: podeTerStatus (condicoes_habilidade.js:128)
- acertosDoGolpeDuelo:86 - chama: MOVES (dados_base.js:11)
- aguentaUmGolpe:2224 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:150), pipelineLinhaDoGolpe (pipeline_build.js:187)
- armadoresDeClima:3271 - chama: CLIMAS_DO_CAMPO (campo.js:25), habilidadeArma (condicoes_habilidade.js:113), uniqueIds (dados_base.js:122) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:33)
- aterradoDuelo:837 - chama: abilityTypeModFor (tipos.js:196)
- bloqueiosNoDuelo:2723 - chamado por: pipelineLinhaDoGolpe (pipeline_build.js:187)
- camposLidosDaHabilidade:1685 - chama: ABILITIES (dados_base.js:10)
- climaDoTimeDoChefao:3057 - chama: habilidadeArma (condicoes_habilidade.js:113), ABILITY_ID_BY_NAME (confronto.js:17), getSpeciesByX (dados_base.js:78), uniqueIds (dados_base.js:122) | chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorMontarLuta (time_pelo_motor.js:78), motorMontarLutaComum (time_pelo_motor.js:89)
- comHabilidadesDuelo:3506 - chama: uniqueIds (dados_base.js:122)
- conferirTimeComBuilds:3166 - chama: getActiveBuild (evolucao.js:16) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308)
- danoDoFuturoDuelo:2735 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- danoNoDuelo:1976 - chama: CLIMA_OFICIAL (campo.js:49) | chamado por: motorProvasDosMembros (time_pelo_motor_papeis.js:157)
- efeitoDasHabilidadesNoDuelo:1371 - chama: CLIMAS_DO_CAMPO (campo.js:25), habilidadeArma (condicoes_habilidade.js:113), ABILITIES (dados_base.js:10), TYPES (dados_base.js:9), getSpeciesBySname (dados_base.js:79) | chamado por: podeTerStatus (condicoes_habilidade.js:128), pipelineSemRecuo (pipeline_build.js:484), pipelineTiposExtraDeStab (pipeline_build.js:428), validateAiBuild (validacao_build_ia.js:210)
- efeitoDoPlanoDuelo:3600 - chama: MOVES (dados_base.js:11)
- efetividadeNoDuelo:1925 - chama: TYPE_MOD_ABILITIES (tipos.js:75), abilityTypeModFor (tipos.js:196), typeMultiplier (tipos.js:244)
- entrarNoLadoDuelo:4082 - chama: typeMultiplier (tipos.js:244)
- escolherProximoDoChefao:4136 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- especieDaFormaDuelo:3551 - chama: SPECIES (dados_base.js:52)
- fDanoGlobalHell:3028 - chama: HELL_DANO_EXTRA_A_PARTIR_DA_INSIGNIA (chefoes.js:470), state (nucleo.js:8)
- foeDeDuelo:3031 - chama: calcFinalStat (calc_stat.js:160), ABILITY_ID_BY_NAME (confronto.js:17), MOVE_ID_BY_NAME (dados_base.js:87), getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), +2 | chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorMontarLuta (time_pelo_motor.js:78), motorMontarLutaComum (time_pelo_motor.js:89)
- foesComBuffsDoGinasio:4222 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorMontarLuta (time_pelo_motor.js:78)
- foesComRegraDeCampo:4246 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorMontarLuta (time_pelo_motor.js:78)
- fracaoDormindoDuelo:2203 - chama: MOVES (dados_base.js:11)
- golpeDeRecargaDuelo:93 - chama: MOVES (dados_base.js:11)
- golpeUtilNoDuelo:107 - chama: MOVES (dados_base.js:11)
- golpesDeDueloAte:135 - chama: uniqueIds (dados_base.js:122) | chamado por: pipelineCandidatos (pipeline_build.js:535)
- golpesDeRecargaAte:128 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122)
- golpesDeStatusAte:141 - chama: uniqueIds (dados_base.js:122)
- golpesNecessariosComPrimeiroDuelo:2216 - chamado por: pipelineAvaliarConjunto (pipeline_build.js:281), pipelineLinhaDoGolpe (pipeline_build.js:187)
- golpesNecessariosDuelo:2214 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:150)
- habilidadeSemRegraNoDuelo:1704 - chama: CLIMAS_DO_CAMPO (campo.js:25), habilidadeArma (condicoes_habilidade.js:113), ABILITIES (dados_base.js:10), TYPE_MOD_ABILITIES (tipos.js:75) | chamado por: pipelineHabilidadesSemRegra (pipeline_build.js:384)
- inicioDaLutaComBuffs:4267 - chamado por: motorMontarLuta (time_pelo_motor.js:78)
- itemDoDuelo:883 - chama: itemRuleFor (calc_stat.js:149), speciesTypeNames (tipos.js:254)
- itemDoSetDuelo:969 - chama: isMegaEvoKind (formas_mega.js:22), speciesTypeNames (tipos.js:254)
- ivDoJogadorDuelo:3069 - chama: HELL_IV_ZERO_A_PARTIR_DA_INSIGNIA (chefoes.js:471), state (nucleo.js:8)
- lerCampoDaFraseDuelo:801 - chama: DURACAO_CAMPO (campo.js:9), TERRENO_DO_TEXTO (campo.js:29)
- lerCondicaoDaFraseDuelo:370 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- lerDiversosDaFraseDuelo:564 - chama: DURACAO_CAMPO (campo.js:9), MOVE_ID_BY_NAME (dados_base.js:87), TYPES (dados_base.js:9)
- melhorUnidadeContra:3105 - chama: uniqueIds (dados_base.js:122) | chamado por: motorBuildDoCandidato (time_pelo_motor.js:168)
- meuComBuffsDoGinasio:4259 - chama: MOVES (dados_base.js:11) | chamado por: motorSimular (time_pelo_motor.js:246), motorGanhoDaCondicao (time_pelo_motor_papeis.js:56), motorSimularComClima (time_pelo_motor_papeis.js:143), motorUnidadeNaLuta (time_pelo_motor_papeis.js:23)
- modoHellDuelo:216 - chama: state (nucleo.js:8)
- montarTimeContraChefaoEmPassos:4741 - chamado por: simularSemTravarATela (aba_chefoes.js:295)
- montarTimeNoClimaEmPassos:4609 - chama: CLIMA_OFICIAL (campo.js:49), ABILITY_ID_BY_NAME (confronto.js:17)
- nivelDoInimigoHell:3030 - chama: HELL_NIVEIS_EXTRAS (chefoes.js:467), HELL_NIVEIS_EXTRAS_A_PARTIR_DA_INSIGNIA (chefoes.js:468), state (nucleo.js:8)
- nomeHabDuelo:46 - chama: ABILITIES (dados_base.js:10) | chamado por: pipelineCandidatos (pipeline_build.js:535), pipelineHabilidadesSemRegra (pipeline_build.js:384)
- novoLadoDuelo:4026 - chama: CAMADAS_DE_HAZARD (campo.js:55) | chamado por: motorGanhoDaCondicao (time_pelo_motor_papeis.js:56), motorSimularComClima (time_pelo_motor_papeis.js:143)
- planoDoGolpeStatus:3303 - chama: HAZARD_DO_GOLPE (campo.js:56) | chamado por: motorUnidade (time_pelo_motor.js:234), motorCondicoes (time_pelo_motor_papeis.js:33), motorTemTipo (time_pelo_motor_papeis.js:198)
- planosUteisDuelo:3370 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- poderDoDadoDuelo:2180 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- poderDoGolpeDuelo:462 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- prepararGolpesDuelo:1753 - chama: CLIMA_OFICIAL (campo.js:49), MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- prioBloqueadaPelaHabilidadeDuelo:1739 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:150)
- quatroGolpesDeDano:3129 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- removeHazardDuelo:3211 - chama: MOVES (dados_base.js:11)
- resultadoDoDuelo:2748 - chamado por: pipelineDuelo (pipeline_build.js:177), motorGanhoDaCondicao (time_pelo_motor_papeis.js:56)
- resultadosDaLutaComHazard:3215 - chama: HAZARD_DO_GOLPE (campo.js:56), poeHazardNoLado (campo.js:58), MOVES (dados_base.js:11)
- resumoProvadoPeloSimulador:3151 - chama: MOVES (dados_base.js:11) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308)
- semGolpesDeLadoDuelo:4717 - chamado por: motorTemGolpeDeLado (time_pelo_motor.js:275)
- semItemDuplicadoNoHell:3071 - chama: calcFinalStat (calc_stat.js:160)
- simularDuplaContraChefao:3814 - chama: poeHazardNoLado (campo.js:58) | chamado por: motorSimular (time_pelo_motor.js:246)
- simularLutaContraChefao:4299 - chamado por: motorSimular (time_pelo_motor.js:246), motorLutaDetalhada (time_pelo_motor_papeis.js:136), motorSimularComClima (time_pelo_motor_papeis.js:143)
- simularLutaDeVerdadeContraChefao:4308 - chama: hazardCheioNoLado (campo.js:57), poeHazardNoLado (campo.js:58), typeMultiplier (tipos.js:244)
- sinergiasDaEspecie:1324 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122) | chamado por: aiTool_getAbilityMovepoolSynergy (ferramentas_ia.js:75), pipelineSinergiasAtivas (pipeline_build.js:236), linhasContextoDaEspecieIA (prompts_ia.js:490), habilidadeSubstitutaPara (reconciliar_build.js:26), validateAiBuild (validacao_build_ia.js:210), +2
- temPrioridadeNoCampoDuelo:2270 - chamado por: pipelineLinhaDoGolpe (pipeline_build.js:187)
- textoHabDuelo:48 - chama: descricaoDeHabilidadePorId (condicoes_habilidade.js:88), expandirTextoDeHabilidade (condicoes_habilidade.js:99), ABILITIES (dados_base.js:10), LIDO_PELO_TEXTO_NOVO_DUELO (texto_versao_nova.js:160), TEXTO_DA_VERSAO_NOVA_DUELO (texto_versao_nova.js:9)
- tipoDoTextoDuelo:162 - chama: TYPES (dados_base.js:9)
- tiposNaBatalha:3023 - chama: speciesTypeNames (tipos.js:254)
- totalDePassosContraChefao:4740 - chamado por: simularSemTravarATela (aba_chefoes.js:295)
- unidadeDaBuild:3179 - chama: ABILITY_ID_BY_NAME (confronto.js:17), MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: pipelineTabela (pipeline_build.js:250), motorUnidade (time_pelo_motor.js:234), motorGanhoDaCondicao (time_pelo_motor_papeis.js:56), motorSimularComClima (time_pelo_motor_papeis.js:143)
- unidadeDeDuelo:3081 - chama: calcFinalStat (calc_stat.js:160), uniqueIds (dados_base.js:122), innatesAtivasNoNivel (level_cap.js:34) | chamado por: motorItensCandidatos (time_pelo_motor.js:369)
- unidadeSemClima:3192 - chamado por: motorSimularComClima (time_pelo_motor_papeis.js:143)

## regras/escolha_ia_candidatos.js
- blocoDeCandidatosParaIA:33 - chama: dadoExterno (golpes.js:19), speciesTypeNames (tipos.js:254)
- blocoPlanoCurtoIA:73 - chama: golpesFuturosDe (builds.js:179), MOVES (dados_base.js:11), TYPES (dados_base.js:9), SIGLA_CATEGORIA (golpes.js:27), dadoExterno (golpes.js:19), +2
- blocoTimeCurtoIA:55 - chama: itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), teamMovesInUse (builds.js:123), teamRolesInUse (builds.js:165), getSpeciesByX (dados_base.js:78), +3
- candidatosParaAEscolhaDaIa:204 - chama: candidatosDeBuild (pipeline_build.js:530) | chamado por: generateBuildWithAI (ia.js:278), gerarBuildsDoTimeComIA (ia.js:176)
- escolherCandidatoDaIa:171 - chamado por: generateBuildWithAI (ia.js:278), gerarBuildsDoTimeComIA (ia.js:176)
- fecharCandidatoDaEscolha:145 - chama: validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), fecharBuild (pipeline_build.js:713)
- linhaDeFraquezasDoTimeIA:51 - chama: computeSharedRisks (chefoes.js:121)
- linhaDePapelNaturalIA:47 - chama: nomePapel (prompts_ia.js:237)
- linhaDoChefaoPorEspecieIA:69 - chama: dadoExterno (golpes.js:19), linhaProvadoIA (prompts_ia.js:541)
- montarPromptEscolhaDeBuild:87 - chama: archetypeBuildGuidance (prompts_ia.js:66), blocoItensIA (prompts_ia.js:302), cabecalhoIA (prompts_ia.js:200), completarCtx (prompts_ia.js:17), versaoDosDados (prompts_ia.js:199) | chamado por: generateBuildWithAI (ia.js:278)
- montarPromptEscolhaDoTime:105 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), getSpeciesByX (dados_base.js:78), archetypeBuildGuidance (prompts_ia.js:66), blocoItensComunsIA (prompts_ia.js:326), blocoItensDaEspecieIA (prompts_ia.js:297), +3 | chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- objetivoDaEscolhaIA:81 - chama: NOME_DA_CONDICAO (condicoes_habilidade.js:42), dadoExterno (golpes.js:19)
- respostaForaDoCandidato:135 - chama: dadoExterno (golpes.js:19)
- textoDaRazaoDaEscolha:153 - chama: dadoExterno (golpes.js:19)
- textoDeCandidatoParaIA:20 - chama: dadoExterno (golpes.js:19)

## regras/evolucao.js
- carryUserData:167 - chama: getSpeciesBySname (dados_base.js:79), state (nucleo.js:8)
- devolveChainByX:206 - chama: getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- ehEvolucaoPraFrente:143 - chama: getSpeciesBySname (dados_base.js:79)
- evoluirElencoSemDuplicar:40 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- evolveChainByX:66 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL (dados_base.js:30), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- getActiveBuild:16 - chamado por: effectiveBuild (builds.js:202), garantiaDoTime (condicoes_habilidade.js:141), conferirTimeComBuilds (duelo.js:3166), gravarBuildDaIaNaLista (gravacao_build_ia.js:68), respostaDaIaObsoleta (gravacao_build_ia.js:55), +10
- getBuildList:14 - chama: state (nucleo.js:8) | chamado por: gravarPlanoDaIa (gravacao_build_ia.js:134), acrescentarVarianteNaLista (lista_de_builds.js:23), buildQueSaiParaAbrirVaga (lista_de_builds.js:43), removerBuildDaLista (lista_de_builds.js:32), trocarBuildAtivaNaLista (lista_de_builds.js:11), +9
- logAutoAction:229 - chama: AUTO_LOG_MAX (save.js:37), state (nucleo.js:8) | chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68), gravarPlanoDaIa (gravacao_build_ia.js:134), applySave (save.js:49), autoEvolveRoster (auto_evolucao.js:20), aplicarCuradaNoTimeNovo (ia.js:153), +4
- marcarRevisaoPosEvolucao:236 - chama: getSpeciesBySname (dados_base.js:79)
- podarAutoEvolved:61 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- reconciliarBuildsDe:104 - chama: getSpeciesBySname (dados_base.js:79), reconciliarBuild (reconciliar_build.js:39), state (nucleo.js:8)
- reconciliarBuildsSalvas:148 - chama: state (nucleo.js:8) | chamado por: applySave (save.js:49)
- runTemAlgoPraZerar:247 - chama: state (nucleo.js:8) | chamado por: updateResetTeamBoxBtn (dex_ficha.js:740)

## regras/ferramentas_ia.js
- aiTool_getAbilityMovepoolSynergy:75 - chama: getSpeciesBySname (dados_base.js:79), sinergiasDaEspecie (duelo.js:1324)
- aiTool_getBoxCandidatesForBoss:182 - chama: bestBoxCandidateForBoss (chefoes.js:195), getRemainingBossEntries (chefoes.js:63)
- aiTool_getItemInfo:150 - chama: stripNote (builds.js:49), dadoExterno (golpes.js:19)
- aiTool_getNextBossRoster:120 - chama: bossPartyPorDificuldade (chefoes.js:339), confrontoFoesDe (chefoes.js:270), confrontoParaParty (chefoes.js:310), getRemainingBossEntries (chefoes.js:63), coberturaSugerida (confronto.js:196), +1
- aiTool_getPriorityMoveOptions:51 - chama: MOVES (dados_base.js:11), getSpeciesBySname (dados_base.js:79), availableMovesFor (level_cap.js:73)
- aiTool_getRemainingBosses:159 - chama: getRemainingBossEntries (chefoes.js:63), getSpeciesByX (dados_base.js:78), speciesTypeNames (tipos.js:254)
- aiTool_getSpeciesRank:24 - chama: ROLE_LABEL_PT (dados_base.js:181), SPLIT_LABEL_PT (dados_base.js:182), rankDe (rank_da_run.js:29)
- aiTool_getSpeedBenchmark:204 - chama: computeSpeedTiers (chefoes.js:525), getSpeciesBySname (dados_base.js:79)
- aiTool_getTeamWeaknesses:15 - chama: computeSharedRisks (chefoes.js:121), getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- buildStandardAiTools:249 - chama: SPECIES (dados_base.js:52) | chamado por: opcoesDaIA (ia.js:72)

## regras/formas_mega.js
- MEGA_BASE_BY_X:21 - chamado por: effectiveBuild (builds.js:202), tarefaDeRevisao (revisao_automatica.js:24)
- MEGA_PEDRAS_TARDIAS:94 - chamado por: etapaDaPedra (liberado_na_run.js:16)
- MEGA_UNLOCK_MILESTONE:92 - chamado por: etapaDaPedra (liberado_na_run.js:16)
- ROTULO_ETAPA_MEGA:99 - chamado por: avisosDaBuild (avisos_build.js:8)
- battleFamilyOf:132 - chamado por: rosterParaTimeIA (prompts_ia.js:721)
- battleUnitsOf:185 - chamado por: bestBoxCandidateForBoss (chefoes.js:195), bestRankForm (chefoes.js:345), confrontoMelhorUnidade (chefoes.js:281), especiesQueResolvem (pipeline_build.js:653), motorCandidatosEmPassos (time_pelo_motor.js:204), +3
- etapaDaMega:104 - chama: etapaDaPedra (liberado_na_run.js:16)
- evioliteFunciona:32 - chamado por: pipelineEvioliteServe (pipeline_build.js:491), blocoPapelIA (prompts_ia.js:238), conflitoDeItem (validacao_build_ia.js:132)
- formFamilyOf:65 - chama: getSpeciesByX (dados_base.js:78) | chamado por: mudancaDeTipo (mono_run.js:95), applyRecommendedTeam (arquetipo.js:207), otherFormsHtml (ficha_extras.js:206)
- formFamilyPromptNote:46 - chama: ABILITIES (dados_base.js:10), habilidadesEscolhiveis (dados_base.js:119), rankDe (rank_da_run.js:29), speciesTypeNames (tipos.js:254) | chamado por: blocoMegaIA (prompts_ia.js:281), descricaoTimeParaGuia (prompts_ia.js:820), montarPromptTimeArquetipo (prompts_ia.js:767)
- isMegaEvoKind:22 - chama: EVOKINDS (dados_base.js:13), EVO_MEGA_KINDS (dados_base.js:34), EVO_PRIMAL (dados_base.js:33) | chamado por: regraCasaComEspecie (calc_stat.js:139), itemDoSetDuelo (duelo.js:969), linhaEvolutivaDe (mono_run.js:20), motorRaizDaLinha (time_pelo_motor.js:150)
- isMegaForm:71 - chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:202), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), mudancaDeTipo (mono_run.js:95), blocoMegaIA (prompts_ia.js:281), +6
- megaDaPedra:169 - chama: getSpeciesBySname (dados_base.js:79) | chamado por: confrontoFoesDe (chefoes.js:270), foeDeDuelo (duelo.js:3031), bossMonCardHtml (aba_chefoes.js:460)
- megaEvolutionUnlocked:93 - chama: state (nucleo.js:8) | chamado por: blocoMegaIA (prompts_ia.js:281), montarPromptTimeArquetipo (prompts_ia.js:767)
- megaFormLiberada:109 - chama: state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- megaFormsOf:38 - chama: getSpeciesByX (dados_base.js:78) | chamado por: validateAiBuild (validacao_build_ia.js:210)
- megaMode:82 - chama: state (nucleo.js:8) | chamado por: motorChaveDoContexto (time_pelo_motor.js:167), motorSimular (time_pelo_motor.js:246), megaStoneRuleFor (validacao_build_ia.js:14), modoMotorChave (modo_motor.js:21), initProgress (progresso.js:105), +1
- megaPromptBlock:139 - chamado por: blocoMegaIA (prompts_ia.js:281)
- megaSoNoDebug:110 - chamado por: megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- quandoMega:112 - chamado por: avisosDaBuild (avisos_build.js:8), motivoDeNaoGerarBuild (gravacao_build_ia.js:18), megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- rotuloDaEtapaDaMegaLiberada:102 - chamado por: montarPromptTimeArquetipo (prompts_ia.js:767)
- rotuloEtapaDaMega:113 - chamado por: megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- stonesOf:175 - chamado por: megaStoneRuleFor (validacao_build_ia.js:14), validateAiBuild (validacao_build_ia.js:210)
- unitTypeMult:201 - chama: abilityTypeMod (tipos.js:173) | chamado por: bestBoxCandidateForBoss (chefoes.js:195), bossSafetyScore (chefoes.js:183), boxFitNote (resumo_luta.js:154)
- usableSpeciesFor:135 - chamado por: rosterParaTimeIA (prompts_ia.js:721)

## regras/golpes.js
- LEGENDA_GOLPE:26 - chamado por: blocoMovepoolIA (prompts_ia.js:269), planoPromptBlock (prompts_ia.js:84)
- PROMPT_DADOS_AVISO:17 - chamado por: cabecalhoIA (prompts_ia.js:200), montarPromptPlano (prompts_ia.js:709)
- SIGLA_CATEGORIA:27 - chamado por: blocoPlanoCurtoIA (escolha_ia_candidatos.js:73)
- dadoExterno:19 - chamado por: blocoDeCandidatosParaIA (escolha_ia_candidatos.js:33), blocoPlanoCurtoIA (escolha_ia_candidatos.js:73), blocoTimeCurtoIA (escolha_ia_candidatos.js:55), linhaDoChefaoPorEspecieIA (escolha_ia_candidatos.js:69), objetivoDaEscolhaIA (escolha_ia_candidatos.js:81), +11
- ehGolpeDePivo:41 - chama: MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: blocoPapelIA (prompts_ia.js:238), conferirPapelDaBuild (validacao_build_ia.js:80)
- ehPrioridadeDeDano:49 - chama: MOVE_BY_NAME (dados_base.js:86) | chamado por: blocoPapelIA (prompts_ia.js:238)
- movePromptLine:28 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9) | chamado por: blocoMovepoolIA (prompts_ia.js:269), planoPromptBlock (prompts_ia.js:84)
- moveRoleOf:53 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87), SPLIT_STATUS (dados_base.js:29) | chamado por: avisosDaBuild (avisos_build.js:8), computeBossAttackTypes (chefoes.js:159), coberturaSugerida (confronto.js:196), confrontoDamagingMoves (confronto.js:29), blocoPlanoCurtoIA (escolha_ia_candidatos.js:73), +5

## regras/gravacao_build_ia.js
- buildDoLoteDeBuilds:45 - chama: contextoDeValidacao (validacao_build_ia.js:193), validateAiBuild (validacao_build_ia.js:210) | chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- gravarBuildDaIaNaLista:68 - chama: getActiveBuild (evolucao.js:16), logAutoAction (evolucao.js:229), acrescentarVarianteNaLista (lista_de_builds.js:23), liberarVagaNaLista (lista_de_builds.js:51), trocarBuildAtivaNaLista (lista_de_builds.js:11)
- gravarPlanoDaIa:134 - chama: getBuildList (evolucao.js:14), logAutoAction (evolucao.js:229), nivelDoGolpe (plano_build.js:56), validarPlano (plano_build.js:80) | chamado por: gerarPlanoParaBuild (ia.js:342)
- gravarRespostaValidadaDaIa:105 - chama: capOuPadrao (level_cap.js:61), anexarPlanoDaIa (prompts_ia.js:134), ajustarBuildDaIa (validacao_build_ia.js:496) | chamado por: gravarBuildValidadaDaIa (ia.js:141)
- motivoDeNaoGerarBuild:18 - chama: isMegaForm (formas_mega.js:71), megaFormLiberada (formas_mega.js:109), quandoMega (formas_mega.js:112) | chamado por: generateBuildWithAI (ia.js:278), gerarBuildsDoTimeComIA (ia.js:176)
- respostaDaIaObsoleta:55 - chama: getActiveBuild (evolucao.js:16), state (nucleo.js:8)
- textoDaRetentativaDeBuild:35 - chamado por: generateBuildWithAI (ia.js:278)
- textoDeLimiteDeBuilds:61 - chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- validarRespostaDeBuildDaIa:26 - chama: contextoDeValidacao (validacao_build_ia.js:193), validateAiBuild (validacao_build_ia.js:210) | chamado por: fecharCandidatoDaEscolha (escolha_ia_candidatos.js:145), fecharBuild (pipeline_build.js:713), generateBuildWithAI (ia.js:278)
- validarRespostaDoLoteDeBuilds:40 - chamado por: gerarBuildsDoTimeComIA (ia.js:176)

## regras/itens_do_time.js
- AI_ITEM_POOL:89 - chamado por: itensAindaIndisponiveisParaIA (prompts_ia.js:310), validateAiBuild (validacao_build_ia.js:210)
- ITENS_IA_BERRIES:46 - chamado por: blocoItensComunsIA (prompts_ia.js:326)
- ITENS_IA_GEMAS:63 - chamado por: blocoItensComunsIA (prompts_ia.js:326)
- ITENS_IA_GERAIS:33 - chamado por: blocoItensComunsIA (prompts_ia.js:326)
- ITENS_IA_TIPO:55 - chamado por: blocoItensComunsIA (prompts_ia.js:326)
- ITENS_IA_UTILIDADE:66 - chamado por: blocoItensComunsIA (prompts_ia.js:326)
- itemDeTipoDoTime:102 - chamado por: motorItensCandidatos (time_pelo_motor.js:369)
- itemValidoNoTime:94 - chama: itemEsgotadoNoTime (builds.js:152), liberadoNaRun (liberado_na_run.js:23) | chamado por: motorFecharItens (time_pelo_motor.js:392), motorItensCandidatos (time_pelo_motor.js:369)
- itensDeEspeciePara:82 - chama: ITEMS (dados_base.js:12) | chamado por: blocoItensDaEspecieIA (prompts_ia.js:297), validateAiBuild (validacao_build_ia.js:210)
- itensDoTime:98 - chamado por: itensAindaIndisponiveisParaIA (prompts_ia.js:310)
- soExistentes:30 - chama: ITEMS (dados_base.js:12)

## regras/level_cap.js
- LEVEL_CAP_MODES:15 - chamado por: applySave (save.js:49), initProgress (progresso.js:105)
- NIVEL_DA_INNATE_ELITE:33 - chamado por: blocoEspecieIA (prompts_ia.js:211)
- NIVEL_DE_CALCULO_SEM_CAP:60 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), blocoEspecieIA (prompts_ia.js:211), validateAiBuild (validacao_build_ia.js:210)
- availableMovesFor:73 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122), liberadoNaRun (liberado_na_run.js:23), state (nucleo.js:8) | chamado por: confrontoUnitOf (chefoes.js:245), comoGarantir (condicoes_habilidade.js:171), precisaDeSetter (condicoes_habilidade.js:213), aiTool_getPriorityMoveOptions (ferramentas_ia.js:51), pipelineCandidatos (pipeline_build.js:535), +5
- capOuPadrao:61 - chamado por: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105), contextoDoMotor (time_pelo_motor.js:140), montarTimeContraEsteChefao (aba_chefoes.js:308), modoMotorChave (modo_motor.js:21)
- getCurrentCap:49 - chama: state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:202), entradaDeBuild (builds.js:23), blocoPlanoCurtoIA (escolha_ia_candidatos.js:73), ctxDoState (prompts_ia.js:16), +15
- golpesTravadosNoCap:90 - chama: MOVE_ID_BY_NAME (dados_base.js:87), liberadoNaRun (liberado_na_run.js:23), state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), contextoDoModoPrompt (prompts_ia.js:94), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:515), processarRevisoes (revisao_automatica.js:72), tarefaDeRevisao (revisao_automatica.js:24)
- innatesAtivasNoNivel:34 - chama: state (nucleo.js:8) | chamado por: unidadeDeDuelo (duelo.js:3081), pipelineCandidatos (pipeline_build.js:535)
- innatesTravadasNoNivel:44 - chamado por: blocoEspecieIA (prompts_ia.js:211)
- levelCapMode:16 - chama: state (nucleo.js:8) | chamado por: motorChaveDoContexto (time_pelo_motor.js:167), motorNivelDaEtapa (time_pelo_motor.js:72), modoMotorChave (modo_motor.js:21), initProgress (progresso.js:105)
- levelCapModeFromDifficulty:22 - chamado por: applySave (save.js:49)
- nivelDaHabilidadeNoElite:40 - chama: nomesDeHabilidades (condicoes_habilidade.js:116) | chamado por: marcasDoRankHtml (dex_ficha.js:288)
- nivelDeCalculo:65 - chamado por: computeSpeedTiers (chefoes.js:525), montarTimeContraEsteChefao (aba_chefoes.js:308), renderBossDetail (aba_chefoes.js:556), myBuildEditorHtml (editor_build.js:223), strategySetsHtml (editor_build.js:432), +2

## regras/liberado_na_run.js
- entradasDoJogador:34 - chama: state (nucleo.js:8) | chamado por: applyRecommendedTeam (arquetipo.js:207), monoRunCardHtml (arquetipo.js:497)
- etapaDaPedra:16 - chama: MEGA_PEDRAS_TARDIAS (formas_mega.js:94), MEGA_UNLOCK_MILESTONE (formas_mega.js:92) | chamado por: avisosDaBuild (avisos_build.js:8), etapaDaMega (formas_mega.js:104)
- etapaDoItem:18 - chama: primeiroLugarDoItem (avisos_build.js:94) | chamado por: pipelineEvioliteServe (pipeline_build.js:491)
- liberadoNaRun:23 - chamado por: avisosDaBuild (avisos_build.js:8), itemValidoNoTime (itens_do_time.js:94), availableMovesFor (level_cap.js:73), golpesTravadosNoCap (level_cap.js:90), pipelineEvioliteServe (pipeline_build.js:491), +3
- xsDoJogador:38 - chamado por: rosterParaTimeIA (prompts_ia.js:721), viramDoTipoPrompt (prompts_ia.js:756), contextoDoMotor (time_pelo_motor.js:140), candidatosDoJogador (aba_chefoes.js:248), modoMotorCapturados (modo_motor.js:26), +2

## regras/lista_de_builds.js
- acrescentarVarianteNaLista:23 - chama: entradaDeBuild (builds.js:23), getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68), gravarSugestoesDoMotor (sugestao_do_motor.js:61), addBuildVariant (nucleo.js:101)
- buildQueSaiParaAbrirVaga:43 - chama: getBuildList (evolucao.js:14) | chamado por: abrirVagaPreservando (nucleo.js:118)
- liberarVagaNaLista:51 - chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68)
- removerBuildDaLista:32 - chama: getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarSugestoesDoMotor (sugestao_do_motor.js:61), removeBuildIndex (nucleo.js:124)
- trocarBuildAtivaNaLista:11 - chama: entradaDeBuild (builds.js:23), getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarBuildDaIaNaLista (gravacao_build_ia.js:68), setOrReplaceActiveBuild (nucleo.js:94)

## regras/mono_run.js
- MONO_MARCAS:11 - chamado por: monoRunCardHtml (arquetipo.js:497)
- avisoProximoLider:158 - chama: bossPartyPorDificuldade (chefoes.js:339), getRemainingBossEntries (chefoes.js:63), gymLeaderBaseName (chefoes.js:55), MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9), +3 | chamado por: monoRunCardHtml (arquetipo.js:497)
- climaQueCombina:141 - chamado por: climaQueCombinaHtml (arquetipo.js:476)
- cobreFraquezas:88 - chama: abilityTypeMod (tipos.js:173) | chamado por: notaMonoDoCandidato (prompts_ia.js:750)
- compraDeInicialTexto:47 - chama: getSpeciesBySname (dados_base.js:79) | chamado por: fichaCabecalhoHtml (dex_ficha.js:504)
- fraquezasDoTipo:80 - chama: USABLE_TYPES (dados_base.js:132), typeMultiplier (tipos.js:244) | chamado por: notaMonoDoCandidato (prompts_ia.js:750), monoRunCardHtml (arquetipo.js:497)
- linhaEvolutivaDe:20 - chama: getSpeciesByX (dados_base.js:78), isMegaEvoKind (formas_mega.js:22)
- monoDisponibilidade:176 - chama: getSpeciesBySname (dados_base.js:79), rankDe (rank_da_run.js:29) | chamado por: monoRunCardHtml (arquetipo.js:497)
- monotypeAtivo:72 - chama: state (nucleo.js:8) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:308), renderBossDetail (aba_chefoes.js:556)
- mudancaDeTipo:95 - chama: formFamilyOf (formas_mega.js:65), isMegaForm (formas_mega.js:71), speciesTypeNames (tipos.js:254) | chamado por: notaMonoDoCandidato (prompts_ia.js:750), viramDoTipoPrompt (prompts_ia.js:756)
- orientacaoMono:144 - chama: ITEMS (dados_base.js:12) | chamado por: archetypeBuildGuidance (prompts_ia.js:66), montarPromptTimeArquetipo (prompts_ia.js:767)
- resistemAoTipo:83 - chama: USABLE_TYPES (dados_base.js:132), typeMultiplier (tipos.js:244)
- serveProMono:74 - chama: speciesTypeNames (tipos.js:254) | chamado por: bestBoxCandidateForBoss (chefoes.js:195), confrontoUnidadesDaCaixa (chefoes.js:301), especiesQueResolvem (pipeline_build.js:653), motorCandidatosEmPassos (time_pelo_motor.js:204), motorClassificar (time_pelo_motor_papeis.js:203), +2

## regras/pipeline_build.js
- candidatosDeBuild:530 - chama: ctxDoState (prompts_ia.js:16) | chamado por: candidatosParaAEscolhaDaIa (escolha_ia_candidatos.js:204), pipelineResultado (pipeline_tela.js:14)
- especiesQueResolvem:653 - chama: SPECIES (dados_base.js:52), getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:185), serveProMono (mono_run.js:74), ctxDoState (prompts_ia.js:16), +1 | chamado por: quemResolveCalcular (quem_resolve.js:22)
- fecharBuild:713 - chama: ALL_NATURES (dados_base.js:101), getSpeciesBySname (dados_base.js:79), validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), megaStoneRuleFor (validacao_build_ia.js:14) | chamado por: fecharCandidatoDaEscolha (escolha_ia_candidatos.js:145)
- pipelineAmeacasDePrioridade:150 - chama: aguentaUmGolpe (duelo.js:2224), golpesNecessariosDuelo (duelo.js:2214), prioBloqueadaPelaHabilidadeDuelo (duelo.js:1739)
- pipelineAvaliarConjunto:281 - chama: golpesNecessariosComPrimeiroDuelo (duelo.js:2216)
- pipelineCandidatos:535 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122), golpesDeDueloAte (duelo.js:135), nomeHabDuelo (duelo.js:46), moveRoleOf (golpes.js:53), +4 | chamado por: motorBuildDoCandidato (time_pelo_motor.js:168)
- pipelineDuelo:177 - chama: resultadoDoDuelo (duelo.js:2748)
- pipelineEspecie:61 - chama: getSpeciesBySname (dados_base.js:79)
- pipelineEvioliteServe:491 - chama: ITEMS (dados_base.js:12), evioliteFunciona (formas_mega.js:32), etapaDoItem (liberado_na_run.js:18), liberadoNaRun (liberado_na_run.js:23)
- pipelineGolpesComRecuo:477 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- pipelineHabilidadesSemRegra:384 - chama: ABILITY_ID_BY_NAME (confronto.js:17), habilidadeSemRegraNoDuelo (duelo.js:1704), nomeHabDuelo (duelo.js:46)
- pipelineLinhaDoGolpe:187 - chama: aguentaUmGolpe (duelo.js:2224), bloqueiosNoDuelo (duelo.js:2723), golpesNecessariosComPrimeiroDuelo (duelo.js:2216), temPrioridadeNoCampoDuelo (duelo.js:2270)
- pipelineMontarConjunto:331 - chama: moveRoleOf (golpes.js:53)
- pipelineResolverAlvo:73 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), FATIA_DOS_CHEFOES (chefoes.js:29), LUTAS_DA_RUN (chefoes.js:326), bossPartyPorDificuldade (chefoes.js:339), buffsAtivosDoChefao (chefoes.js:512), +8 | chamado por: motorBuildDoCandidato (time_pelo_motor.js:168)
- pipelineSemRecuo:484 - chama: ABILITY_ID_BY_NAME (confronto.js:17), uniqueIds (dados_base.js:122), efeitoDasHabilidadesNoDuelo (duelo.js:1371)
- pipelineSinergiasAtivas:236 - chama: sinergiasDaEspecie (duelo.js:1324)
- pipelineTabela:250 - chama: unidadeDaBuild (duelo.js:3179)
- pipelineTiposExtraDeStab:428 - chama: ABILITY_ID_BY_NAME (confronto.js:17), uniqueIds (dados_base.js:122), efeitoDasHabilidadesNoDuelo (duelo.js:1371)
- pipelineValidarRascunho:505 - chama: ITEMS (dados_base.js:12), contextoDeValidacao (validacao_build_ia.js:193), megaStoneRuleFor (validacao_build_ia.js:14), validateAiBuild (validacao_build_ia.js:210)

## regras/plano_build.js
- ESTILO_ROTULO:20 - chamado por: rotuloDaBuild (ficha_extras.js:170)
- ROTULOS_EV:21 - chamado por: evsToShowdownText (builds.js:75)
- curadaParaEstilo:160 - chamado por: effectiveBuild (builds.js:202), aplicarCuradaNoTimeNovo (ia.js:153), processarRevisoes (revisao_automatica.js:72), tarefaDeRevisao (revisao_automatica.js:24)
- curadasDe:153 - chamado por: montarPromptEstrategias (prompts_ia.js:656)
- estiloDeEvs:37 - chamado por: effectiveBuild (builds.js:202), montarPromptEstrategias (prompts_ia.js:656)
- estiloDoRitmo:48 - chamado por: effectiveBuild (builds.js:202), aplicarCuradaNoTimeNovo (ia.js:153), processarRevisoes (revisao_automatica.js:72), tarefaDeRevisao (revisao_automatica.js:24)
- evsTextoParaArray:24 - chamado por: ajustarBuildDaIa (validacao_build_ia.js:496), entradaDaCuradaParaTimeNovo (validacao_build_ia.js:515), processarRevisoes (revisao_automatica.js:72)
- golpesNoCap:123 - chamado por: effectiveBuild (builds.js:202), myBuildEditorHtml (editor_build.js:223)
- nivelDeEvolucaoDaForma:68 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL (dados_base.js:30) | chamado por: golpesFuturosDe (builds.js:179)
- nivelDoGolpe:56 - chama: MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: golpesFuturosDe (builds.js:179), gravarPlanoDaIa (gravacao_build_ia.js:134)
- planoSaneado:107 - chamado por: entradaDeBuild (builds.js:23), anteriorSaneado (save.js:239), applySave (save.js:49)
- trocasEntreCaps:141 - chamado por: registrarTrocasDoPlano (revisao_automatica.js:149)
- validarPlano:80 - chamado por: gravarPlanoDaIa (gravacao_build_ia.js:134), anexarPlanoDaIa (prompts_ia.js:134)

## regras/prompts_ia.js
- anexarPlanoDaIa:134 - chama: validarPlano (plano_build.js:80) | chamado por: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105)
- archetypeBuildGuidance:66 - chama: rotuloDoArquetipoDeCampo (campo.js:46), orientacaoMono (mono_run.js:144) | chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:87), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:105)
- blocoEspecieIA:211 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122), NIVEL_DA_INNATE_ELITE (level_cap.js:33), NIVEL_DE_CALCULO_SEM_CAP (level_cap.js:60), innatesTravadasNoNivel (level_cap.js:44), +1
- blocoItensAindaIndisponiveisIA:319 - chama: rotuloDaEtapaDoItem (avisos_build.js:98)
- blocoItensComunsIA:326 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), ITEMS (dados_base.js:12), ITENS_IA_BERRIES (itens_do_time.js:46), ITENS_IA_GEMAS (itens_do_time.js:63), ITENS_IA_GERAIS (itens_do_time.js:33), +5 | chamado por: montarPromptEscolhaDoTime (escolha_ia_candidatos.js:105)
- blocoItensDaEspecieIA:297 - chama: itensDeEspeciePara (itens_do_time.js:82), regraItemConsumivelPrompt (validacao_build_ia.js:57) | chamado por: montarPromptEscolhaDoTime (escolha_ia_candidatos.js:105)
- blocoItensIA:302 - chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:87)
- blocoManualIA:405 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122)
- blocoMegaIA:281 - chama: formFamilyPromptNote (formas_mega.js:46), isMegaForm (formas_mega.js:71), megaEvolutionUnlocked (formas_mega.js:93), megaPromptBlock (formas_mega.js:139), megaStoneRuleFor (validacao_build_ia.js:14)
- blocoMovepoolIA:269 - chama: LEGENDA_GOLPE (golpes.js:26), movePromptLine (golpes.js:28), availableMovesFor (level_cap.js:73)
- blocoPapelIA:238 - chama: computeSharedRisks (chefoes.js:121), ITEMS (dados_base.js:12), getSpeciesByX (dados_base.js:78), evioliteFunciona (formas_mega.js:32), ehGolpeDePivo (golpes.js:41), +2
- blocoTimeEmUsoIA:359 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), teamMovesInUse (builds.js:123), teamRolesInUse (builds.js:165), +2
- cabecalhoIA:200 - chama: PROMPT_DADOS_AVISO (golpes.js:17) | chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:87), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:105)
- comDescricaoIA:294 - chama: dadoExterno (golpes.js:19)
- completarCtx:17 - chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:87), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:105), conferirPapelDaBuild (validacao_build_ia.js:80), conflitoDeNature (validacao_build_ia.js:114), validateAiBuild (validacao_build_ia.js:210)
- contextoDoModoPrompt:94 - chama: NOME_DA_CONDICAO (condicoes_habilidade.js:42), dadoExterno (golpes.js:19), golpesTravadosNoCap (level_cap.js:90)
- ctxDoState:16 - chama: getCurrentCap (level_cap.js:49), state (nucleo.js:8) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), candidatosDeBuild (pipeline_build.js:530), especiesQueResolvem (pipeline_build.js:653), pipelineCandidatos (pipeline_build.js:535), pipelineResolverAlvo (pipeline_build.js:73), +4
- descricaoTimeParaGuia:820 - chama: effectiveBuild (builds.js:202), ROLE_LABEL_PT (dados_base.js:181), formFamilyPromptNote (formas_mega.js:46), speciesTypeNames (tipos.js:254)
- guiaDaResposta:853 - chamado por: generateTeamUsageGuide (arquetipo.js:260)
- itensAindaIndisponiveisParaIA:310 - chama: primeiroLugarDoItem (avisos_build.js:94), AI_ITEM_POOL (itens_do_time.js:89), itensDoTime (itens_do_time.js:98)
- linhaHabilidadeIA:207 - chama: ABILITIES (dados_base.js:10), dadoExterno (golpes.js:19)
- linhaProvadoIA:541 - chama: dadoExterno (golpes.js:19) | chamado por: linhaDoChefaoPorEspecieIA (escolha_ia_candidatos.js:69)
- linhaVelocidadeIA:426 - chama: calcFinalStat (calc_stat.js:160), computeSpeedTiers (chefoes.js:525)
- linhasContextoComumIA:521 - chama: getRemainingBossEntries (chefoes.js:63), getSpeciesByX (dados_base.js:78), speciesTypeNames (tipos.js:254)
- linhasContextoDaEspecieIA:490 - chama: sinergiasDaEspecie (duelo.js:1324), rankDe (rank_da_run.js:29)
- linhasProximaLutaIA:443 - chama: bestBoxCandidateForBoss (chefoes.js:195), bossPartyPorDificuldade (chefoes.js:339), confrontoFoesDe (chefoes.js:270), confrontoParaParty (chefoes.js:310), ehRevancheDeLider (chefoes.js:484), +6
- montarPromptBuild:551 - chama: blocoCondicoesIA (condicoes_habilidade.js:238) | chamado por: generateBuildWithAI (ia.js:278)
- montarPromptBuildsDoTime:607 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), NOME_DA_CONDICAO (condicoes_habilidade.js:42), blocoCondicoesIA (condicoes_habilidade.js:238), dadoExterno (golpes.js:19) | chamado por: gerarBuildsDoTimeComIA (ia.js:176)
- montarPromptEstrategias:656 - chama: blocoCondicoesIA (condicoes_habilidade.js:238), curadasDe (plano_build.js:153), estiloDeEvs (plano_build.js:37) | chamado por: generateStrategySets (revisao_automatica.js:182)
- montarPromptGuia:830 - chamado por: generateTeamUsageGuide (arquetipo.js:260)
- montarPromptPlano:709 - chama: PROMPT_DADOS_AVISO (golpes.js:17), dadoExterno (golpes.js:19), speciesTypeNames (tipos.js:254) | chamado por: gerarPlanoParaBuild (ia.js:342)
- montarPromptTimeArquetipo:767 - chama: effectiveBuild (builds.js:202), rotuloDoArquetipoDeCampo (campo.js:46), ABILITIES (dados_base.js:10), ROLE_LABEL_PT (dados_base.js:181), habilidadesEscolhiveis (dados_base.js:119), +6 | chamado por: generateTeamForArchetype (arquetipo.js:153)
- nomePapel:237 - chama: ROLE_LABEL_PT (dados_base.js:181) | chamado por: blocoTimeCurtoIA (escolha_ia_candidatos.js:55), linhaDePapelNaturalIA (escolha_ia_candidatos.js:47)
- notaMonoDoCandidato:750 - chama: cobreFraquezas (mono_run.js:88), fraquezasDoTipo (mono_run.js:80), mudancaDeTipo (mono_run.js:95)
- planoPromptBlock:84 - chama: golpesFuturosDe (builds.js:179), LEGENDA_GOLPE (golpes.js:26), movePromptLine (golpes.js:28)
- rosterParaTimeIA:721 - chama: getSpeciesByX (dados_base.js:78), battleFamilyOf (formas_mega.js:132), usableSpeciesFor (formas_mega.js:135), xsDoJogador (liberado_na_run.js:38), speciesTypeNames (tipos.js:254) | chamado por: generateTeamForArchetype (arquetipo.js:153)
- sampleErrorMessage:156 - chamado por: pedirIAAgora (ia.js:109)
- snamesValidosDoTime:808 - chamado por: generateTeamForArchetype (arquetipo.js:153)
- versaoDosDados:199 - chamado por: montarPromptEscolhaDeBuild (escolha_ia_candidatos.js:87), montarPromptEscolhaDoTime (escolha_ia_candidatos.js:105)
- viramDoTipoPrompt:756 - chama: getSpeciesByX (dados_base.js:78), xsDoJogador (liberado_na_run.js:38), mudancaDeTipo (mono_run.js:95)

## regras/rank_da_run.js
- FORA_DO_RANK:10 - chamado por: rankBadgeHtml (dex_ficha.js:169), rankInfoLineHtml (dex_ficha.js:310)
- MOTIVO_FORA_DO_RANK_PT:17 - chamado por: rankBadgeHtml (dex_ficha.js:169), rankInfoLineHtml (dex_ficha.js:310)
- chaveDoRankDaDificuldade:23 - chama: TIER_DA_DIFICULDADE (chefoes.js:21)
- rankDaDificuldadeDe:69 - chamado por: marcasDoRankHtml (dex_ficha.js:288)
- rankDe:29 - chama: state (nucleo.js:8) | chamado por: bestBoxCandidateForBoss (chefoes.js:195), bestRankForm (chefoes.js:345), aiTool_getSpeciesRank (ferramentas_ia.js:24), formFamilyPromptNote (formas_mega.js:46), monoDisponibilidade (mono_run.js:176), +9

## regras/reconciliar_build.js
- habilidadeSubstitutaPara:26 - chama: habilidadesEscolhiveis (dados_base.js:119), sinergiasDaEspecie (duelo.js:1324)
- movepoolCompletoDe:17 - chama: MOVES (dados_base.js:11)
- reconciliarBuild:39 - chama: habilidadesEscolhiveis (dados_base.js:119) | chamado por: effectiveBuild (builds.js:202), reconciliarBuildsDe (evolucao.js:104)

## regras/save.js
- AUTO_LOG_MAX:37 - chamado por: logAutoAction (evolucao.js:229)
- anteriorSaneado:239 - chama: planoSaneado (plano_build.js:107)
- applySave:49 - chama: BUILD_SOURCES (builds.js:17), ARQUETIPOS_DE_CAMPO (campo.js:33), MONOTYPE_ARCHETYPES (dados_base.js:156), PACE_ARCHETYPES (dados_base.js:146), TATICA_ARCHETYPES (dados_base.js:149), +10 | chamado por: loadSave (nucleo.js:337), aplicarSaveRemoto (sync.js:45)
- buildSave:339 - chamado por: persist (nucleo.js:144), aplicarSaveRemoto (sync.js:45), connectSync (sync.js:179)
- conferirSomaDoSave:329 - chamado por: loadSave (nucleo.js:337), remotoComSomaErrada (sync.js:88)
- ehBackupDeTime:48 - chamado por: guardarTimeAnterior (aba_chefoes.js:266)
- montarSave:344 - chama: state (nucleo.js:8)
- reconciliouAoAplicar:44 - chamado por: loadSave (nucleo.js:337), aplicarSaveRemoto (sync.js:45)
- sanitizarStrategySets:258 - chama: clampInt (dados_base.js:103), getSpeciesBySname (dados_base.js:79) | chamado por: generateStrategySets (revisao_automatica.js:182)
- saveChegandoTemMenosProgresso:386 - chamado por: conflitoDeProgresso (sync.js:61)
- saveEnviavel:336 - chamado por: connectSync (sync.js:179), remotoComSomaErrada (sync.js:88)
- snamesToXs:15 - chama: SPECIES_BY_SNAME (dados_base.js:72) | chamado por: carregarTimeSalvo (time.js:251), renderSavedTeams (time.js:227)
- syncContentDiffers:400 - chamado por: connectSync (sync.js:179)
- xsToSnames:24 - chama: snameOf (dados_base.js:80) | chamado por: guardarTimeAnterior (aba_chefoes.js:266)

## regras/sugestao_do_motor.js
- SUGESTAO_ROTULO:11 - chamado por: buildChipsHtml (editor_build.js:212), rotuloDaBuild (ficha_extras.js:170), modoMotorFicarComVariante (modo_motor.js:119), modoMotorRodapeHtml (modo_motor.js:190)
- gravarSugestoesDoMotor:61 - chama: entradaDeBuild (builds.js:23), getBuildList (evolucao.js:14), acrescentarVarianteNaLista (lista_de_builds.js:23), removerBuildDaLista (lista_de_builds.js:32), state (nucleo.js:8) | chamado por: modoMotorFicarComVariante (modo_motor.js:119)
- planoDeGravarSugestoes:39 - chama: getActiveBuild (evolucao.js:16), getBuildList (evolucao.js:14) | chamado por: modoMotorFicarComVariante (modo_motor.js:119)

## regras/texto_versao_nova.js
- LIDO_PELO_TEXTO_NOVO_DUELO:160 - chamado por: expandirTextoDeHabilidade (condicoes_habilidade.js:99), textoHabDuelo (duelo.js:48)
- TEXTO_DA_VERSAO_NOVA_DUELO:9 - chamado por: expandirTextoDeHabilidade (condicoes_habilidade.js:99), textoHabDuelo (duelo.js:48)

## regras/time_pelo_motor.js
- contextoDoMotor:140 - chama: capOuPadrao (level_cap.js:61), xsDoJogador (liberado_na_run.js:38), state (nucleo.js:8) | chamado por: modoMotorAquecer (modo_motor.js:40), modoMotorMontar (modo_motor.js:68)
- criarCacheDoMotor:64 - chamado por: modoMotorCache (modo_motor.js:19)
- montarTimePeloMotorEmPassos:431 - chama: SPECIES (dados_base.js:52), motorClassificar (time_pelo_motor_papeis.js:203), motorTextos (time_pelo_motor_papeis.js:302) | chamado por: modoMotorMontar (modo_motor.js:68)
- motorAquecerBuildsEmPassos:228 - chamado por: modoMotorAquecer (modo_motor.js:40)
- motorArred:61 - chamado por: motorClassificar (time_pelo_motor_papeis.js:203), motorDeltaSemTipos (time_pelo_motor_papeis.js:194), motorProvasDosMembros (time_pelo_motor_papeis.js:157)
- motorAvaliar:263 - chamado por: motorClassificar (time_pelo_motor_papeis.js:203)
- motorBuildDoCandidato:168 - chama: ABILITIES (dados_base.js:10), MOVES (dados_base.js:11), melhorUnidadeContra (duelo.js:3105), getActiveBuild (evolucao.js:16), liberadoNaRun (liberado_na_run.js:23), +2
- motorCandidatosEmPassos:204 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:185), serveProMono (mono_run.js:74)
- motorChaveDaBuild:164 - chamado por: motorAlternativasArmadoras (time_pelo_motor_papeis.js:101)
- motorChaveDoContexto:167 - chama: megaMode (formas_mega.js:82), levelCapMode (level_cap.js:16), state (nucleo.js:8) | chamado por: motorAlternativasArmadoras (time_pelo_motor_papeis.js:101)
- motorFecharItens:392 - chama: itemValidoNoTime (itens_do_time.js:94)
- motorGuardar:65 - chamado por: motorAux (time_pelo_motor_papeis.js:26)
- motorItensCandidatos:369 - chama: MOVES (dados_base.js:11), unidadeDeDuelo (duelo.js:3081), itemDeTipoDoTime (itens_do_time.js:102), itemValidoNoTime (itens_do_time.js:94), conflitoDeItem (validacao_build_ia.js:132)
- motorLutasComunsDoContexto:107 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), FATIA_DOS_CHEFOES (chefoes.js:29), state (nucleo.js:8)
- motorLutasDoContexto:122 - chama: LUTAS_DA_RUN (chefoes.js:326)
- motorMontarLuta:78 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), bossPartyPorDificuldade (chefoes.js:339), buffsAtivosDoChefao (chefoes.js:512), regraDeCampoDoChefao (chefoes.js:426), climaDoTimeDoChefao (duelo.js:3057), +5 | chamado por: motorLutaComClima (time_pelo_motor_papeis.js:53)
- motorMontarLutaComum:89 - chama: climaDoTimeDoChefao (duelo.js:3057), foeDeDuelo (duelo.js:3031)
- motorNivelDaEtapa:72 - chama: levelCapMode (level_cap.js:16)
- motorRaizDaLinha:150 - chama: SPECIES (dados_base.js:52), isMegaEvoKind (formas_mega.js:22)
- motorSimular:246 - chama: meuComBuffsDoGinasio (duelo.js:4259), simularDuplaContraChefao (duelo.js:3814), simularLutaContraChefao (duelo.js:4299), megaMode (formas_mega.js:82), state (nucleo.js:8) | chamado por: motorClassificar (time_pelo_motor_papeis.js:203), motorDeltaSemTipos (time_pelo_motor_papeis.js:194)
- motorTemGolpeDeLado:275 - chama: semGolpesDeLadoDuelo (duelo.js:4717)
- motorUnidade:234 - chama: planoDoGolpeStatus (duelo.js:3303), unidadeDaBuild (duelo.js:3179) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:33), motorProvasDosMembros (time_pelo_motor_papeis.js:157), motorTemTipo (time_pelo_motor_papeis.js:198), motorUnidadeNaLuta (time_pelo_motor_papeis.js:23)

## regras/time_pelo_motor_papeis.js
- MOTOR_FRASE_DA_PROVA:317 - chamado por: modoMotorMembroHtml (modo_motor.js:177)
- motorAlternativasArmadoras:101 - chama: liberadoNaRun (liberado_na_run.js:23), motorChaveDaBuild (time_pelo_motor.js:164), motorChaveDoContexto (time_pelo_motor.js:167)
- motorAux:26 - chama: motorGuardar (time_pelo_motor.js:65)
- motorClassificar:203 - chama: serveProMono (mono_run.js:74), motorArred (time_pelo_motor.js:61), motorAvaliar (time_pelo_motor.js:263), motorSimular (time_pelo_motor.js:246), state (nucleo.js:8) | chamado por: montarTimePeloMotorEmPassos (time_pelo_motor.js:431)
- motorCondicoes:33 - chama: ABILITY_ID_BY_NAME (confronto.js:17), MOVES (dados_base.js:11), armadoresDeClima (duelo.js:3271), planoDoGolpeStatus (duelo.js:3303), motorUnidade (time_pelo_motor.js:234)
- motorDeltaSemTipos:194 - chama: motorArred (time_pelo_motor.js:61), motorSimular (time_pelo_motor.js:246)
- motorGanhoDaCondicao:56 - chama: DURACAO_LADO_DUELO (duelo.js:4022), meuComBuffsDoGinasio (duelo.js:4259), novoLadoDuelo (duelo.js:4026), resultadoDoDuelo (duelo.js:2748), unidadeDaBuild (duelo.js:3179)
- motorLutaComClima:53 - chama: motorMontarLuta (time_pelo_motor.js:78)
- motorLutaDetalhada:136 - chama: simularLutaContraChefao (duelo.js:4299)
- motorProvasDosMembros:157 - chama: danoNoDuelo (duelo.js:1976), motorArred (time_pelo_motor.js:61), motorUnidade (time_pelo_motor.js:234)
- motorSimularComClima:143 - chama: CLIMA_OFICIAL (campo.js:49), meuComBuffsDoGinasio (duelo.js:4259), novoLadoDuelo (duelo.js:4026), simularLutaContraChefao (duelo.js:4299), unidadeDaBuild (duelo.js:3179), +1
- motorTemTipo:198 - chama: planoDoGolpeStatus (duelo.js:3303), motorUnidade (time_pelo_motor.js:234)
- motorTextos:302 - chamado por: montarTimePeloMotorEmPassos (time_pelo_motor.js:431)
- motorUnidadeNaLuta:23 - chama: meuComBuffsDoGinasio (duelo.js:4259), motorUnidade (time_pelo_motor.js:234)

## regras/tipos.js
- TYPE_MOD_ABILITIES:75 - chamado por: efetividadeNoDuelo (duelo.js:1925), habilidadeSemRegraNoDuelo (duelo.js:1704)
- abilityTypeMod:173 - chamado por: computeSharedRisks (chefoes.js:121), unitTypeMult (formas_mega.js:201), cobreFraquezas (mono_run.js:88), renderTeamAnalysis (arquetipo.js:580)
- abilityTypeModFor:196 - chama: ABILITIES (dados_base.js:10) | chamado por: ameacaDe (confronto.js:91), coberturaSugerida (confronto.js:196), ofensaContra (confronto.js:59), aterradoDuelo (duelo.js:837), efetividadeNoDuelo (duelo.js:1925)
- alwaysActiveAbilities:164 - chamado por: confrontoUnitOf (chefoes.js:245)
- perfilDefensivoDaEspecie:179 - chama: USABLE_TYPES (dados_base.js:132) | chamado por: fichaEfetividadeHtml (dex_ficha.js:423)
- speciesTypeNames:254 - chama: TYPES (dados_base.js:9) | chamado por: confrontoUnitOf (chefoes.js:245), podeTerStatus (condicoes_habilidade.js:128), coberturaSugerida (confronto.js:196), ofensaContra (confronto.js:59), itemDoDuelo (duelo.js:883), +28
- typeMultiplier:244 - chamado por: efetividadeNoDuelo (duelo.js:1925), entrarNoLadoDuelo (duelo.js:4082), simularLutaDeVerdadeContraChefao (duelo.js:4308), avisoProximoLider (mono_run.js:158), fraquezasDoTipo (mono_run.js:80), +2

## regras/validacao_build_ia.js
- GOLPES_QUE_PASSAM_ITEM:108 - chamado por: blocoItensComunsIA (prompts_ia.js:326)
- ITENS_CHOICE:106 - chamado por: avisosDaBuild (avisos_build.js:8), blocoItensComunsIA (prompts_ia.js:326)
- ITENS_VEST:107 - chamado por: blocoItensComunsIA (prompts_ia.js:326)
- ajustarBuildDaIa:496 - chama: habilidadesEscolhiveis (dados_base.js:119), evsTextoParaArray (plano_build.js:24) | chamado por: gravarRespostaValidadaDaIa (gravacao_build_ia.js:105)
- conferirPapelDaBuild:80 - chama: ehGolpeDePivo (golpes.js:41), availableMovesFor (level_cap.js:73), completarCtx (prompts_ia.js:17)
- conflitoDeItem:132 - chama: MOVE_BY_NAME (dados_base.js:86), SPLIT_STATUS (dados_base.js:29), evioliteFunciona (formas_mega.js:32), speciesTypeNames (tipos.js:254) | chamado por: avisosDaBuild (avisos_build.js:8), motorItensCandidatos (time_pelo_motor.js:369)
- conflitoDeNature:114 - chama: MOVE_BY_NAME (dados_base.js:86), NATURE_MODS (dados_base.js:90), moveRoleOf (golpes.js:53), completarCtx (prompts_ia.js:17)
- contextoDeValidacao:193 - chama: buffsAtivosDoChefao (chefoes.js:512), habilidadesEscolhiveis (dados_base.js:119) | chamado por: buildDoLoteDeBuilds (gravacao_build_ia.js:45), validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), pipelineValidarRascunho (pipeline_build.js:505)
- entradaDaCuradaParaTimeNovo:515 - chama: itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), stripNote (builds.js:49), habilidadesEscolhiveis (dados_base.js:119), golpesTravadosNoCap (level_cap.js:90), +1 | chamado por: aplicarCuradaNoTimeNovo (ia.js:153)
- limitarEvsAoJogo:165 - chama: clampInt (dados_base.js:103)
- megaStoneRuleFor:14 - chama: isMegaForm (formas_mega.js:71), megaMode (formas_mega.js:82), stonesOf (formas_mega.js:175) | chamado por: avisosDaBuild (avisos_build.js:8), comoGarantir (condicoes_habilidade.js:171), fecharBuild (pipeline_build.js:713), pipelineValidarRascunho (pipeline_build.js:505), blocoMegaIA (prompts_ia.js:281), +1
- regraItemConsumivelPara:47 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122)
- regraItemConsumivelPrompt:57 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122) | chamado por: blocoItensDaEspecieIA (prompts_ia.js:297)
- setsValidosDaResposta:480 - chamado por: generateStrategySets (revisao_automatica.js:182)
- validateAiBuild:210 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:150), itemEsgotadoNoTime (builds.js:152), itensEmUsoComQuem (builds.js:153), trimAndReallocateEvs (calc_stat.js:238), condicaoDaBuild (condicoes_habilidade.js:190), +22 | chamado por: buildDoLoteDeBuilds (gravacao_build_ia.js:45), validarRespostaDeBuildDaIa (gravacao_build_ia.js:26), pipelineValidarRascunho (pipeline_build.js:505)
