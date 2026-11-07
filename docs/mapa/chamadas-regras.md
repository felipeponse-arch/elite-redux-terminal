# Chamadas entre arquivos - src/regras/

Gerado por `npm run mapa` (scripts/mapa_chamadas.mjs, API do TypeScript); não edite à mão.
Por função de nível superior: `chama:` e `chamado por:` funções de OUTROS arquivos de src/regras e src/ui, como `nome (arquivo:linha)`;
no máximo 5 por lista, o resto vira `+N`. Referência vale também como callback. Chamada pelo template/HTML não aparece. Mapa geral: [mapa-do-codigo.md](../mapa-do-codigo.md).

## regras/avisos_build.js
- avisosDaBuild:8 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:138), itemEsgotadoNoTime (builds.js:140), itensEmUsoComQuem (builds.js:141), stripNote (builds.js:44), garantiaDaCondicao (condicoes_habilidade.js:155), +15 | chamado por: buildContextNotesHtml (editor_build.js:161)
- ondeAcharItemTexto:100 - chamado por: itemDescHtml (editor_build.js:45)
- primeiroLugarDoItem:94 - chamado por: etapaDoItem (liberado_na_run.js:18)
- seloDaBuild:82 - chamado por: seloDaBuildHtml (editor_build.js:168)

## regras/builds.js
- BUILD_SOURCES:17 - chamado por: applySave (save.js:49)
- MAX_MESMO_ITEM_NO_TIME:138 - chamado por: avisosDaBuild (avisos_build.js:8), validateAiBuild (validacao_build_ia.js:199)
- computeTeamGenerationValidation:228 - chama: computeSharedRisks (chefoes.js:121) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:307), generatedTeamCardHtml (arquetipo.js:261)
- effectiveBuild:190 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), MEGA_BASE_BY_X (formas_mega.js:21), isMegaForm (formas_mega.js:71), getCurrentCap (level_cap.js:49), +6 | chamado por: confrontoUnitOf (chefoes.js:245), compareResultHtml (ficha_extras.js:22), renderTeam (time.js:8)
- entradaDeBuild:22 - chama: planoSaneado (plano_build.js:107) | chamado por: acrescentarVarianteNaLista (lista_de_builds.js:23), trocarBuildAtivaNaLista (lista_de_builds.js:11), gravarSugestoesDoMotor (sugestao_do_motor.js:61)
- evsToShowdownText:70 - chama: ROTULOS_EV (plano_build.js:21) | chamado por: myBuildEditorHtml (editor_build.js:223)
- golpesFuturosDe:167 - chama: MOVES (dados_base.js:11), nivelDeEvolucaoDaForma (plano_build.js:68), nivelDoGolpe (plano_build.js:56)
- itemEsgotadoNoTime:140 - chamado por: avisosDaBuild (avisos_build.js:8), itemValidoNoTime (itens_do_time.js:94), validateAiBuild (validacao_build_ia.js:199)
- itensEmUsoComQuem:141 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), validateAiBuild (validacao_build_ia.js:199)
- showdownSet:53 - chamado por: initBosses (aba_chefoes.js:33), buildEntryHtml (editor_build.js:182), myBuildEditorHtml (editor_build.js:223), renderTeam (time.js:8)
- stripNote:44 - chamado por: avisosDaBuild (avisos_build.js:8), hpEvEfficiencyNote (editor_build.js:83), itemDescHtml (editor_build.js:45), compareResultHtml (ficha_extras.js:22)
- teamItemsInUse:85 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- teamMovesInUse:111 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- teamRolesInUse:153 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)

## regras/calc_stat.js
- ITEM_MOVE_POWER_MODS:132 - chamado por: updateMyBuildStatus (editor_build.js:352)
- calcFinalStat:160 - chama: NATURE_MODS (dados_base.js:90) | chamado por: computeSpeedTiers (chefoes.js:529), foeDeDuelo (duelo.js:3037), semItemDuplicadoNoHell (duelo.js:3077), unidadeDeDuelo (duelo.js:3087), bossMonCardHtml (aba_chefoes.js:431), +2
- especiePorNomeDoItem:135 - chama: SPECIES (dados_base.js:52)
- itemRuleFor:149 - chamado por: itemDoDuelo (duelo.js:879), bossMonCardHtml (aba_chefoes.js:431), updateMyBuildStatus (editor_build.js:352)
- minEvSameStat:200 - chamado por: evBreakpointNote (editor_build.js:116)
- regraCasaComEspecie:139 - chama: isMegaEvoKind (formas_mega.js:22)
- trimAndReallocateEvs:238 - chamado por: validateAiBuild (validacao_build_ia.js:199)

## regras/campo.js
- ARQUETIPOS_DE_CAMPO:33 - chamado por: applySave (save.js:49), archetypeCardHtml (arquetipo.js:85)
- CAMADAS_DE_HAZARD:55 - chamado por: novoLadoDuelo (duelo.js:4039), temHazardDuelo (duelo.js:4059), trocaHazardsDosLadosDuelo (duelo.js:4061)
- CLIMAS_DO_CAMPO:25 - chamado por: armadoresDeClima (duelo.js:3283), efeitoDasHabilidadesNoDuelo (duelo.js:1367), habilidadeSemRegraNoDuelo (duelo.js:1706)
- CLIMA_OFICIAL:49 - chamado por: danoNoDuelo (duelo.js:1982), montarTimeNoClimaEmPassos (duelo.js:4657), prepararGolpesDuelo (duelo.js:1755)
- CONDICAO_DO_ARQUETIPO_CAMPO:35 - chamado por: garantiaDoTime (condicoes_habilidade.js:141)
- DURACAO_CAMPO:9 - chamado por: lerCampoDaFraseDuelo (duelo.js:797), lerDiversosDaFraseDuelo (duelo.js:560)
- HAZARD_DO_GOLPE:56 - chamado por: planoDoGolpeStatus (duelo.js:3315), resultadosDaLutaComHazard (duelo.js:3227)
- TERRENO_DO_TEXTO:29 - chamado por: lerCampoDaFraseDuelo (duelo.js:797)
- hazardCheioNoLado:57 - chamado por: simularLutaDeVerdadeContraChefao (duelo.js:4351)
- poeHazardNoLado:58 - chamado por: resultadosDaLutaComHazard (duelo.js:3227), simularDuplaContraChefao (duelo.js:3827), simularLutaDeVerdadeContraChefao (duelo.js:4351)

## regras/chefoes.js
- DIFF_TO_BOSSKEY:25 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorLutasComunsDoContexto (time_pelo_motor.js:107), motorMontarLuta (time_pelo_motor.js:78), quemResolveCardHtml (quem_resolve.js:83)
- FATIA_DOS_CHEFOES:29 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorLutasComunsDoContexto (time_pelo_motor.js:107)
- HELL_DANO_EXTRA_A_PARTIR_DA_INSIGNIA:470 - chamado por: fDanoGlobalHell (duelo.js:3034)
- HELL_IV_ZERO_A_PARTIR_DA_INSIGNIA:471 - chamado por: ivDoJogadorDuelo (duelo.js:3075)
- HELL_NIVEIS_EXTRAS:467 - chamado por: nivelDoInimigoHell (duelo.js:3036)
- HELL_NIVEIS_EXTRAS_A_PARTIR_DA_INSIGNIA:468 - chamado por: nivelDoInimigoHell (duelo.js:3036)
- LUTAS_DA_RUN:326 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorLutasDoContexto (time_pelo_motor.js:122)
- SPEEDTIER_NATURE:527 - chamado por: renderSpeedTiers (tipos.js:35)
- TIER_DA_DIFICULDADE:21 - chamado por: chaveDoRankDaDificuldade (rank_da_run.js:23)
- bestBoxCandidateForBoss:195 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:185), unitTypeMult (formas_mega.js:201), serveProMono (mono_run.js:74), rankDe (rank_da_run.js:29), +1 | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- bestRankForm:345 - chama: battleUnitsOf (formas_mega.js:185), rankDe (rank_da_run.js:29) | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- bossPartyPorDificuldade:339 - chama: state (nucleo.js:8) | chamado por: avisoProximoLider (mono_run.js:158), pipelineResolverAlvo (pipeline_build.js:73), motorMontarLuta (time_pelo_motor.js:78), initProgress (progresso.js:105), dashboardConfrontoHtml (resumo_luta.js:135)
- bossSafetyScore:183 - chama: unitTypeMult (formas_mega.js:201)
- bossSpeedSummary:144 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- buffsAtivosDoChefao:515 - chama: state (nucleo.js:8) | chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorMontarLuta (time_pelo_motor.js:78), contextoDeValidacao (validacao_build_ia.js:182), montarTimeContraEsteChefao (aba_chefoes.js:307)
- buffsParaMostrarDoChefao:503 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:307), buffsMudaram (arquetipo.js:208)
- classeDoCabecalhoDoChefao:57 - chamado por: renderBossDetail (aba_chefoes.js:527)
- comportamentoDaIADoChefao:459 - chamado por: iaDoChefaoHtml (aba_chefoes.js:190)
- computeBossAttackTypes:159 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9), moveRoleOf (golpes.js:53), state (nucleo.js:8)
- computeSharedRisks:121 - chama: USABLE_TYPES (dados_base.js:132), abilityTypeMod (tipos.js:173) | chamado por: computeTeamGenerationValidation (builds.js:228), renderTeamAnalysis (arquetipo.js:400), boxFitNote (resumo_luta.js:154), renderDashboard (resumo_luta.js:183)
- computeSpeedTiers:529 - chama: calcFinalStat (calc_stat.js:160), SPECIES (dados_base.js:52), nivelDeCalculo (level_cap.js:65) | chamado por: renderSpeedTiers (tipos.js:35)
- confrontoFoesDe:270 - chama: foeFromBossMember (confronto.js:49), getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), megaDaPedra (formas_mega.js:169)
- confrontoMelhorUnidade:281 - chama: confrontoTime (confronto.js:146), battleUnitsOf (formas_mega.js:185)
- confrontoMinhasUnidades:291 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- confrontoParaParty:310 - chama: confrontoTime (confronto.js:146), melhoresTrocas (confronto.js:265) | chamado por: initProgress (progresso.js:105), bossConfrontoHtml (resumo_luta.js:96), dashboardConfrontoHtml (resumo_luta.js:135)
- confrontoUnidadesDaCaixa:301 - chama: getSpeciesByX (dados_base.js:78), serveProMono (mono_run.js:74), state (nucleo.js:8)
- confrontoUnitOf:245 - chama: effectiveBuild (builds.js:190), ABILITY_ID_BY_NAME (confronto.js:17), availableMovesFor (level_cap.js:73), alwaysActiveAbilities (tipos.js:164), speciesTypeNames (tipos.js:254)
- ehRevancheDeLider:484 - chamado por: renderGymSkillsCardHtml (aba_chefoes.js:394)
- faixaDeHpDaLuta:593 - chamado por: planoContraChefaoHtml (arquetipo.js:212)
- getRemainingBossEntries:63 - chama: state (nucleo.js:8) | chamado por: avisoProximoLider (mono_run.js:158), pipelineResolverAlvo (pipeline_build.js:73), pipelineAlvoValido (pipeline_tela.js:26), pipelineSeletorDeAlvoHtml (pipeline_tela.js:32), initProgress (progresso.js:105), +2
- gymLeaderBaseName:55 - chamado por: avisoProximoLider (mono_run.js:158), renderGymSkillsCardHtml (aba_chefoes.js:394)
- gymSkillsSummaryFor:379 - chama: state (nucleo.js:8) | chamado por: renderGymSkillsCardHtml (aba_chefoes.js:394)
- nextFightCx:363 - chamado por: renderDashboard (resumo_luta.js:183), renderNextFightCard (resumo_luta.js:257)
- planoDaLuta:549 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:307)
- regraDeCampoDoChefao:426 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorMontarLuta (time_pelo_motor.js:78), campoDoChefaoHtml (aba_chefoes.js:178), montarTimeContraEsteChefao (aba_chefoes.js:307)
- regrasDoHell:477 - chamado por: hellDoChefaoHtml (aba_chefoes.js:199)
- resumoDaLuta:562 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:307)
- varianteDoChefao:370 - chama: state (nucleo.js:8) | chamado por: selectBoss (aba_chefoes.js:375), initProgress (progresso.js:105)
- vereditoDaLuta:587 - chamado por: vereditoDaLutaHtml (arquetipo.js:199)

## regras/condicoes_habilidade.js
- NOME_DA_CONDICAO:42 - chamado por: planoContraChefaoHtml (arquetipo.js:212)
- comoGarantir:171 - chama: ITEMS (dados_base.js:12), availableMovesFor (level_cap.js:73), megaStoneRuleFor (validacao_build_ia.js:18)
- condicaoDaBuild:190 - chamado por: validateAiBuild (validacao_build_ia.js:199)
- descricaoDeHabilidade:77 - chama: ABILITIES (dados_base.js:10)
- descricaoDeHabilidadePorId:88 - chama: ABILITIES (dados_base.js:10) | chamado por: textoHabDuelo (duelo.js:48)
- expandirTextoDeHabilidade:99 - chama: ABILITIES (dados_base.js:10), LIDO_PELO_TEXTO_NOVO_DUELO (texto_versao_nova.js:156), TEXTO_DA_VERSAO_NOVA_DUELO (texto_versao_nova.js:9) | chamado por: textoHabDuelo (duelo.js:48)
- garantiaDaCondicao:155 - chama: ITEMS (dados_base.js:12) | chamado por: avisosDaBuild (avisos_build.js:8)
- garantiaDoTime:141 - chama: CONDICAO_DO_ARQUETIPO_CAMPO (campo.js:35), getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), state (nucleo.js:8)
- habilidadeArma:113 - chamado por: armadoresDeClima (duelo.js:3283), climaDoTimeDoChefao (duelo.js:3063), efeitoDasHabilidadesNoDuelo (duelo.js:1367), habilidadeSemRegraNoDuelo (duelo.js:1706)
- nomesDeHabilidades:116 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122) | chamado por: avisosDaBuild (avisos_build.js:8), nivelDaHabilidadeNoElite (level_cap.js:40)
- podeTerStatus:128 - chama: ABILITY_ID_BY_NAME (confronto.js:17), STATUS_DUELO (duelo.js:213), efeitoDasHabilidadesNoDuelo (duelo.js:1367), speciesTypeNames (tipos.js:254)
- precisaDeSetter:213 - chama: availableMovesFor (level_cap.js:73) | chamado por: avisosDaBuild (avisos_build.js:8), marcasDoRankHtml (dex_ficha.js:288)

## regras/confronto.js
- ABILITY_ID_BY_NAME:17 - chamado por: confrontoUnitOf (chefoes.js:245), podeTerStatus (condicoes_habilidade.js:128), climaDoTimeDoChefao (duelo.js:3063), foeDeDuelo (duelo.js:3037), montarTimeNoClimaEmPassos (duelo.js:4657), +6
- aberturaEmDupla:319 - chamado por: confrontoPlanoHtml (resumo_luta.js:67)
- ameacaDe:91 - chama: MOVE_BY_NAME (dados_base.js:86), abilityTypeModFor (tipos.js:196)
- coberturaSugerida:196 - chama: MOVE_BY_NAME (dados_base.js:86), moveRoleOf (golpes.js:53), abilityTypeModFor (tipos.js:196), speciesTypeNames (tipos.js:254) | chamado por: confrontoAjustesHtml (resumo_luta.js:44)
- confrontoDamagingMoves:29 - chama: MOVE_BY_NAME (dados_base.js:86), moveRoleOf (golpes.js:53)
- confrontoMoveType:32 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9)
- confrontoTime:146 - chamado por: confrontoMelhorUnidade (chefoes.js:281), confrontoParaParty (chefoes.js:310)
- cuidadosDoChefao:302 - chamado por: confrontoPlanoHtml (resumo_luta.js:67)
- foeFromBossMember:49 - chama: getSpeciesByX (dados_base.js:78) | chamado por: confrontoFoesDe (chefoes.js:270)
- melhoresTrocas:265 - chamado por: confrontoParaParty (chefoes.js:310)
- ofensaContra:59 - chama: MOVE_BY_NAME (dados_base.js:86), abilityTypeModFor (tipos.js:196), speciesTypeNames (tipos.js:254)

## regras/dados_base.js
- ABILITIES:10 - chamado por: descricaoDeHabilidade (condicoes_habilidade.js:77), descricaoDeHabilidadePorId (condicoes_habilidade.js:88), expandirTextoDeHabilidade (condicoes_habilidade.js:99), nomesDeHabilidades (condicoes_habilidade.js:116), camposLidosDaHabilidade (duelo.js:1687), +13
- ALL_NATURES:101 - chamado por: validateAiBuild (validacao_build_ia.js:199), myBuildEditorHtml (editor_build.js:223)
- EVOKINDS:13 - chamado por: evolveChainByX (evolucao.js:66), isMegaEvoKind (formas_mega.js:22), nivelDeEvolucaoDaForma (plano_build.js:68), evoConditionText (dex_ficha.js:88)
- EVO_LEVEL:30 - chamado por: evolveChainByX (evolucao.js:66), nivelDeEvolucaoDaForma (plano_build.js:68)
- EVO_LEVEL_FEMALE:32 - chamado por: evoConditionText (dex_ficha.js:88)
- EVO_LEVEL_MALE:31 - chamado por: evoConditionText (dex_ficha.js:88)
- EVO_MEGA_KINDS:34 - chamado por: isMegaEvoKind (formas_mega.js:22), evoConditionText (dex_ficha.js:88)
- EVO_PRIMAL:33 - chamado por: isMegaEvoKind (formas_mega.js:22), evoConditionText (dex_ficha.js:88)
- ITEMS:12 - chamado por: comoGarantir (condicoes_habilidade.js:171), garantiaDaCondicao (condicoes_habilidade.js:155), itensDeEspeciePara (itens_do_time.js:82), soExistentes (itens_do_time.js:30), orientacaoMono (mono_run.js:144), +4
- MAPS:49 - chamado por: howToObtainText (dex_ficha.js:236), whereToFindText (dex_ficha.js:266)
- MONOTYPE_ARCHETYPES:156 - chamado por: applySave (save.js:49), archetypeCardHtml (arquetipo.js:85)
- MOVES:11 - chamado por: golpesFuturosDe (builds.js:167), acertosDoGolpeDuelo (duelo.js:86), efeitoDoPlanoDuelo (duelo.js:3613), escolherProximoDoChefao (duelo.js:4176), fracaoDormindoDuelo (duelo.js:2209), +24
- MOVE_BY_NAME:86 - chamado por: computeBossAttackTypes (chefoes.js:159), ameacaDe (confronto.js:91), coberturaSugerida (confronto.js:196), confrontoDamagingMoves (confronto.js:29), confrontoMoveType (confronto.js:32), +7
- MOVE_ID_BY_NAME:87 - chamado por: danoDoFuturoDuelo (duelo.js:2741), foeDeDuelo (duelo.js:3037), lerCondicaoDaFraseDuelo (duelo.js:366), lerDiversosDaFraseDuelo (duelo.js:560), poderDoDadoDuelo (duelo.js:2186), +9
- NATURE_MODS:90 - chamado por: calcFinalStat (calc_stat.js:160), conflitoDeNature (validacao_build_ia.js:103), validateAiBuild (validacao_build_ia.js:199)
- PACE_ARCHETYPES:146 - chamado por: applySave (save.js:49), archetypeCardHtml (arquetipo.js:85)
- ROLE_LABEL_PT:181 - chamado por: motorPapeisDaEspecie (time_pelo_motor_papeis.js:119), roleTagsHtml (dex_ficha.js:215), computeRoleCompendium (tipos.js:91)
- SPECIES:52 - chamado por: especiePorNomeDoItem (calc_stat.js:135), computeSpeedTiers (chefoes.js:529), especieDaFormaDuelo (duelo.js:3564), especiesQueResolvem (pipeline_build.js:697), montarTimePeloMotorEmPassos (time_pelo_motor.js:429), +3
- SPECIES_BY_SNAME:72 - chamado por: snamesToXs (save.js:15)
- SPLIT_LABEL_PT:182 - chamado por: roleTagsHtml (dex_ficha.js:215)
- SPLIT_STATUS:29 - chamado por: moveRoleOf (golpes.js:53), conflitoDeItem (validacao_build_ia.js:121), updateMyBuildStatus (editor_build.js:352)
- TATICA_ARCHETYPES:149 - chamado por: applySave (save.js:49), archetypeCardHtml (arquetipo.js:85)
- TYPES:9 - chamado por: computeBossAttackTypes (chefoes.js:159), confrontoMoveType (confronto.js:32), efeitoDasHabilidadesNoDuelo (duelo.js:1367), escolherProximoDoChefao (duelo.js:4176), lerDiversosDaFraseDuelo (duelo.js:560), +10
- USABLE_TYPES:132 - chamado por: computeSharedRisks (chefoes.js:121), fraquezasDoTipo (mono_run.js:80), resistemAoTipo (mono_run.js:83), applySave (save.js:49), perfilDefensivoDaEspecie (tipos.js:179), +2
- avisoSemSpriteHtml:196 - chamado por: fichaCabecalhoHtml (dex_ficha.js:469), linhaDaListaHtml (dex_lista.js:212)
- clampInt:103 - chamado por: applySave (save.js:49), sanitizarStrategySets (save.js:258), limitarEvsAoJogo (validacao_build_ia.js:154), lerFormularioDoEditor (editor_build.js:444), updateMyBuildEvTotal (editor_build.js:322), +1
- descricaoDaEspecie:187 - chamado por: fichaCabecalhoHtml (dex_ficha.js:469)
- getSpeciesBySname:79 - chamado por: confrontoFoesDe (chefoes.js:270), efeitoDasHabilidadesNoDuelo (duelo.js:1367), foeDeDuelo (duelo.js:3037), carryUserData (evolucao.js:167), devolveChainByX (evolucao.js:206), +11
- getSpeciesByX:78 - chamado por: effectiveBuild (builds.js:190), itensEmUsoComQuem (builds.js:141), teamItemsInUse (builds.js:85), teamMovesInUse (builds.js:111), teamRolesInUse (builds.js:153), +46
- habilidadesEscolhiveis:119 - chamado por: formFamilyPromptNote (formas_mega.js:46), habilidadeSubstitutaPara (reconciliar_build.js:26), reconciliarBuild (reconciliar_build.js:39), contextoDeValidacao (validacao_build_ia.js:182), validateAiBuild (validacao_build_ia.js:199), +2
- snameOf:80 - chamado por: applySave (save.js:49), xsToSnames (save.js:24)
- uniqueIds:122 - chamado por: nomesDeHabilidades (condicoes_habilidade.js:116), armadoresDeClima (duelo.js:3283), climaDoTimeDoChefao (duelo.js:3063), comHabilidadesDuelo (duelo.js:3519), foeDeDuelo (duelo.js:3037), +14

## regras/duelo.js
- DURACAO_LADO_DUELO:4035 - chamado por: motorGanhoDaCondicao (time_pelo_motor_papeis.js:37)
- STATUS_DUELO:213 - chamado por: podeTerStatus (condicoes_habilidade.js:128)
- acertosDoGolpeDuelo:86 - chama: MOVES (dados_base.js:11)
- aguentaUmGolpe:2230 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:150), pipelineLinhaDoGolpe (pipeline_build.js:187)
- armadoresDeClima:3283 - chama: CLIMAS_DO_CAMPO (campo.js:25), habilidadeArma (condicoes_habilidade.js:113), uniqueIds (dados_base.js:122) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:14)
- aterradoDuelo:833 - chama: abilityTypeModFor (tipos.js:196)
- bloqueiosNoDuelo:2729 - chamado por: pipelineLinhaDoGolpe (pipeline_build.js:187)
- camposLidosDaHabilidade:1687 - chama: ABILITIES (dados_base.js:10)
- climaDoTimeDoChefao:3063 - chama: habilidadeArma (condicoes_habilidade.js:113), ABILITY_ID_BY_NAME (confronto.js:17), getSpeciesByX (dados_base.js:78), uniqueIds (dados_base.js:122) | chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorMontarLuta (time_pelo_motor.js:78), motorMontarLutaComum (time_pelo_motor.js:89)
- comHabilidadesDuelo:3519 - chama: uniqueIds (dados_base.js:122)
- conferirTimeComBuilds:3172 - chama: getActiveBuild (evolucao.js:16) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:307)
- danoDoFuturoDuelo:2741 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- danoNoDuelo:1982 - chama: CLIMA_OFICIAL (campo.js:49)
- efeitoDasHabilidadesNoDuelo:1367 - chama: CLIMAS_DO_CAMPO (campo.js:25), habilidadeArma (condicoes_habilidade.js:113), ABILITIES (dados_base.js:10), TYPES (dados_base.js:9), getSpeciesBySname (dados_base.js:79) | chamado por: podeTerStatus (condicoes_habilidade.js:128), pipelineSemRecuo (pipeline_build.js:484), pipelineTiposExtraDeStab (pipeline_build.js:428), validateAiBuild (validacao_build_ia.js:199)
- efeitoDoPlanoDuelo:3613 - chama: MOVES (dados_base.js:11)
- efetividadeNoDuelo:1927 - chama: TYPE_MOD_ABILITIES (tipos.js:75), abilityTypeModFor (tipos.js:196), typeMultiplier (tipos.js:244)
- entrarNoLadoDuelo:4100 - chama: typeMultiplier (tipos.js:244)
- escolherProximoDoChefao:4176 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- especieDaFormaDuelo:3564 - chama: SPECIES (dados_base.js:52)
- fDanoGlobalHell:3034 - chama: HELL_DANO_EXTRA_A_PARTIR_DA_INSIGNIA (chefoes.js:470), state (nucleo.js:8)
- foeDeDuelo:3037 - chama: calcFinalStat (calc_stat.js:160), ABILITY_ID_BY_NAME (confronto.js:17), MOVE_ID_BY_NAME (dados_base.js:87), getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), +2 | chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorMontarLuta (time_pelo_motor.js:78), motorMontarLutaComum (time_pelo_motor.js:89)
- foesComBuffsDoGinasio:4264 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorMontarLuta (time_pelo_motor.js:78)
- foesComRegraDeCampo:4289 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), motorMontarLuta (time_pelo_motor.js:78)
- fracaoDormindoDuelo:2209 - chama: MOVES (dados_base.js:11)
- golpeDeRecargaDuelo:93 - chama: MOVES (dados_base.js:11)
- golpeUtilNoDuelo:107 - chama: MOVES (dados_base.js:11)
- golpesDeDueloAte:135 - chama: uniqueIds (dados_base.js:122) | chamado por: pipelineCandidatos (pipeline_build.js:573)
- golpesDeRecargaAte:128 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122)
- golpesDeStatusAte:141 - chama: uniqueIds (dados_base.js:122)
- golpesNecessariosComPrimeiroDuelo:2222 - chamado por: pipelineAvaliarConjunto (pipeline_build.js:281), pipelineLinhaDoGolpe (pipeline_build.js:187)
- golpesNecessariosDuelo:2220 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:150)
- habilidadeSemRegraNoDuelo:1706 - chama: CLIMAS_DO_CAMPO (campo.js:25), habilidadeArma (condicoes_habilidade.js:113), ABILITIES (dados_base.js:10), TYPE_MOD_ABILITIES (tipos.js:75) | chamado por: pipelineHabilidadesSemRegra (pipeline_build.js:384)
- inicioDaLutaComBuffs:4310 - chamado por: motorMontarLuta (time_pelo_motor.js:78)
- itemDoDuelo:879 - chama: itemRuleFor (calc_stat.js:149), speciesTypeNames (tipos.js:254)
- itemDoSetDuelo:965 - chama: isMegaEvoKind (formas_mega.js:22), speciesTypeNames (tipos.js:254)
- ivDoJogadorDuelo:3075 - chama: HELL_IV_ZERO_A_PARTIR_DA_INSIGNIA (chefoes.js:471), state (nucleo.js:8)
- lerCampoDaFraseDuelo:797 - chama: DURACAO_CAMPO (campo.js:9), TERRENO_DO_TEXTO (campo.js:29)
- lerCondicaoDaFraseDuelo:366 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- lerDiversosDaFraseDuelo:560 - chama: DURACAO_CAMPO (campo.js:9), MOVE_ID_BY_NAME (dados_base.js:87), TYPES (dados_base.js:9)
- melhorUnidadeContra:3111 - chama: uniqueIds (dados_base.js:122) | chamado por: motorBuildDoCandidato (time_pelo_motor.js:168)
- meuComBuffsDoGinasio:4302 - chama: MOVES (dados_base.js:11) | chamado por: motorSimular (time_pelo_motor.js:244), motorGanhoDaCondicao (time_pelo_motor_papeis.js:37), motorUnidadeNaLuta (time_pelo_motor_papeis.js:7)
- modoHellDuelo:212 - chama: state (nucleo.js:8)
- montarTimeContraChefaoEmPassos:4789 - chamado por: simularSemTravarATela (aba_chefoes.js:294)
- montarTimeNoClimaEmPassos:4657 - chama: CLIMA_OFICIAL (campo.js:49), ABILITY_ID_BY_NAME (confronto.js:17)
- nivelDoInimigoHell:3036 - chama: HELL_NIVEIS_EXTRAS (chefoes.js:467), HELL_NIVEIS_EXTRAS_A_PARTIR_DA_INSIGNIA (chefoes.js:468), state (nucleo.js:8)
- nomeHabDuelo:46 - chama: ABILITIES (dados_base.js:10) | chamado por: pipelineCandidatos (pipeline_build.js:573), pipelineHabilidadesSemRegra (pipeline_build.js:384)
- novoLadoDuelo:4039 - chama: CAMADAS_DE_HAZARD (campo.js:55) | chamado por: motorGanhoDaCondicao (time_pelo_motor_papeis.js:37)
- planoDoGolpeStatus:3315 - chama: HAZARD_DO_GOLPE (campo.js:56) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:14)
- planosUteisDuelo:3383 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- poderDoDadoDuelo:2186 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- poderDoGolpeDuelo:458 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- prepararGolpesDuelo:1755 - chama: CLIMA_OFICIAL (campo.js:49), MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- prioBloqueadaPelaHabilidadeDuelo:1741 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:150)
- quatroGolpesDeDano:3135 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- removeHazardDuelo:3222 - chama: MOVES (dados_base.js:11)
- resultadoDoDuelo:2754 - chamado por: pipelineDuelo (pipeline_build.js:177), motorGanhoDaCondicao (time_pelo_motor_papeis.js:37)
- resultadosDaLutaComHazard:3227 - chama: HAZARD_DO_GOLPE (campo.js:56), poeHazardNoLado (campo.js:58), MOVES (dados_base.js:11)
- resumoProvadoPeloSimulador:3157 - chama: MOVES (dados_base.js:11)
- semGolpesDeLadoDuelo:4765 - chamado por: motorTemGolpeDeLado (time_pelo_motor.js:273)
- semItemDuplicadoNoHell:3077 - chama: calcFinalStat (calc_stat.js:160)
- simularDuplaContraChefao:3827 - chama: poeHazardNoLado (campo.js:58) | chamado por: motorSimular (time_pelo_motor.js:244)
- simularLutaContraChefao:4342 - chamado por: motorSimular (time_pelo_motor.js:244)
- simularLutaDeVerdadeContraChefao:4351 - chama: hazardCheioNoLado (campo.js:57), poeHazardNoLado (campo.js:58), typeMultiplier (tipos.js:244)
- sinergiasDaEspecie:1320 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122) | chamado por: pipelineSinergiasAtivas (pipeline_build.js:236), habilidadeSubstitutaPara (reconciliar_build.js:26), validateAiBuild (validacao_build_ia.js:199), buildSynergyHtml (dex_ficha.js:42), fichaConhecerHtml (dex_ficha.js:523)
- temHazardDuelo:4059 - chama: CAMADAS_DE_HAZARD (campo.js:55)
- temPrioridadeNoCampoDuelo:2276 - chamado por: pipelineLinhaDoGolpe (pipeline_build.js:187)
- textoHabDuelo:48 - chama: descricaoDeHabilidadePorId (condicoes_habilidade.js:88), expandirTextoDeHabilidade (condicoes_habilidade.js:99), ABILITIES (dados_base.js:10), LIDO_PELO_TEXTO_NOVO_DUELO (texto_versao_nova.js:156), TEXTO_DA_VERSAO_NOVA_DUELO (texto_versao_nova.js:9)
- tipoDoTextoDuelo:162 - chama: TYPES (dados_base.js:9)
- tiposNaBatalha:3029 - chama: speciesTypeNames (tipos.js:254)
- totalDePassosContraChefao:4788 - chamado por: simularSemTravarATela (aba_chefoes.js:294)
- trocaHazardsDosLadosDuelo:4061 - chama: CAMADAS_DE_HAZARD (campo.js:55)
- unidadeDaBuild:3185 - chama: ABILITY_ID_BY_NAME (confronto.js:17), MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: pipelineTabela (pipeline_build.js:250), motorUnidade (time_pelo_motor.js:234), motorGanhoDaCondicao (time_pelo_motor_papeis.js:37)
- unidadeDeDuelo:3087 - chama: calcFinalStat (calc_stat.js:160), uniqueIds (dados_base.js:122), innatesAtivasNoNivel (level_cap.js:34) | chamado por: motorItensCandidatos (time_pelo_motor.js:367)

## regras/evolucao.js
- carryUserData:167 - chama: getSpeciesBySname (dados_base.js:79), state (nucleo.js:8)
- devolveChainByX:206 - chama: getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- ehEvolucaoPraFrente:143 - chama: getSpeciesBySname (dados_base.js:79)
- evoluirElencoSemDuplicar:40 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- evolveChainByX:66 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL (dados_base.js:30), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- getActiveBuild:16 - chamado por: effectiveBuild (builds.js:190), garantiaDoTime (condicoes_habilidade.js:141), conferirTimeComBuilds (duelo.js:3172), planoDeGravarSugestoes (sugestao_do_motor.js:39), motorBuildDoCandidato (time_pelo_motor.js:168), +5
- getBuildList:14 - chama: state (nucleo.js:8) | chamado por: acrescentarVarianteNaLista (lista_de_builds.js:23), buildQueSaiParaAbrirVaga (lista_de_builds.js:43), removerBuildDaLista (lista_de_builds.js:32), trocarBuildAtivaNaLista (lista_de_builds.js:11), gravarSugestoesDoMotor (sugestao_do_motor.js:61), +5
- logAutoAction:229 - chama: AUTO_LOG_MAX (save.js:37), state (nucleo.js:8) | chamado por: applySave (save.js:49), autoEvolveRoster (auto_evolucao.js:20), initProgress (progresso.js:105), processarRevisoes (revisao_automatica.js:23), registrarTrocasDoPlano (revisao_automatica.js:71), +1
- marcarRevisaoPosEvolucao:236 - chama: getSpeciesBySname (dados_base.js:79)
- podarAutoEvolved:61 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:20)
- reconciliarBuildsDe:104 - chama: getSpeciesBySname (dados_base.js:79), reconciliarBuild (reconciliar_build.js:39), state (nucleo.js:8)
- reconciliarBuildsSalvas:148 - chama: state (nucleo.js:8) | chamado por: applySave (save.js:49)
- runTemAlgoPraZerar:247 - chama: state (nucleo.js:8) | chamado por: updateResetTeamBoxBtn (dex_ficha.js:702)

## regras/formas_mega.js
- MEGA_BASE_BY_X:21 - chamado por: effectiveBuild (builds.js:190)
- MEGA_PEDRAS_TARDIAS:94 - chamado por: etapaDaPedra (liberado_na_run.js:16)
- MEGA_UNLOCK_MILESTONE:92 - chamado por: etapaDaPedra (liberado_na_run.js:16)
- ROTULO_ETAPA_MEGA:99 - chamado por: avisosDaBuild (avisos_build.js:8)
- battleUnitsOf:185 - chamado por: bestBoxCandidateForBoss (chefoes.js:195), bestRankForm (chefoes.js:345), confrontoMelhorUnidade (chefoes.js:281), especiesQueResolvem (pipeline_build.js:697), motorCandidatosEmPassos (time_pelo_motor.js:204), +3
- etapaDaMega:104 - chama: etapaDaPedra (liberado_na_run.js:16)
- evioliteFunciona:32 - chamado por: pipelineEvioliteServe (pipeline_build.js:491), conflitoDeItem (validacao_build_ia.js:121)
- formFamilyOf:65 - chama: getSpeciesByX (dados_base.js:78) | chamado por: mudancaDeTipo (mono_run.js:95), applyRecommendedTeam (arquetipo.js:143), otherFormsHtml (ficha_extras.js:206)
- formFamilyPromptNote:46 - chama: ABILITIES (dados_base.js:10), habilidadesEscolhiveis (dados_base.js:119), rankDe (rank_da_run.js:29), speciesTypeNames (tipos.js:254)
- isMegaEvoKind:22 - chama: EVOKINDS (dados_base.js:13), EVO_MEGA_KINDS (dados_base.js:34), EVO_PRIMAL (dados_base.js:33) | chamado por: regraCasaComEspecie (calc_stat.js:139), itemDoSetDuelo (duelo.js:965), linhaEvolutivaDe (mono_run.js:20), motorRaizDaLinha (time_pelo_motor.js:150)
- isMegaForm:71 - chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:190), mudancaDeTipo (mono_run.js:95), megaStoneRuleFor (validacao_build_ia.js:18), validateAiBuild (validacao_build_ia.js:199), +3
- megaDaPedra:169 - chama: getSpeciesBySname (dados_base.js:79) | chamado por: confrontoFoesDe (chefoes.js:270), foeDeDuelo (duelo.js:3037), bossMonCardHtml (aba_chefoes.js:431)
- megaEvolutionUnlocked:93 - chama: state (nucleo.js:8)
- megaFormLiberada:109 - chama: state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- megaFormsOf:38 - chama: getSpeciesByX (dados_base.js:78) | chamado por: validateAiBuild (validacao_build_ia.js:199)
- megaMode:82 - chama: state (nucleo.js:8) | chamado por: motorChaveDoContexto (time_pelo_motor.js:167), motorSimular (time_pelo_motor.js:244), megaStoneRuleFor (validacao_build_ia.js:18), modoMotorChave (modo_motor.js:20), initProgress (progresso.js:105), +1
- megaSoNoDebug:110 - chamado por: megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- quandoMega:112 - chamado por: avisosDaBuild (avisos_build.js:8), megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- rotuloEtapaDaMega:113 - chamado por: megaLockedTagHtml (ficha_extras.js:199), otherFormsHtml (ficha_extras.js:206)
- stonesOf:175 - chamado por: megaStoneRuleFor (validacao_build_ia.js:18), validateAiBuild (validacao_build_ia.js:199)
- unitTypeMult:201 - chama: abilityTypeMod (tipos.js:173) | chamado por: bestBoxCandidateForBoss (chefoes.js:195), bossSafetyScore (chefoes.js:183), boxFitNote (resumo_luta.js:154)

## regras/golpes.js
- ehGolpeDePivo:41 - chama: MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: pipelinePapeisDuplos (pipeline_build.js:533), conferirPapelDaBuild (validacao_build_ia.js:69)
- ehPrioridadeDeDano:49 - chama: MOVE_BY_NAME (dados_base.js:86)
- movePromptLine:28 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- moveRoleOf:53 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87), SPLIT_STATUS (dados_base.js:29) | chamado por: avisosDaBuild (avisos_build.js:8), computeBossAttackTypes (chefoes.js:159), coberturaSugerida (confronto.js:196), confrontoDamagingMoves (confronto.js:29), avisoProximoLider (mono_run.js:158), +4

## regras/itens_do_time.js
- AI_ITEM_POOL:89 - chamado por: validateAiBuild (validacao_build_ia.js:199)
- itemDeTipoDoTime:102 - chamado por: motorItensCandidatos (time_pelo_motor.js:367)
- itemValidoNoTime:94 - chama: itemEsgotadoNoTime (builds.js:140), liberadoNaRun (liberado_na_run.js:23) | chamado por: motorFecharItens (time_pelo_motor.js:390), motorItensCandidatos (time_pelo_motor.js:367)
- itensDeEspeciePara:82 - chama: ITEMS (dados_base.js:12) | chamado por: validateAiBuild (validacao_build_ia.js:199)
- soExistentes:30 - chama: ITEMS (dados_base.js:12)

## regras/level_cap.js
- LEVEL_CAP_MODES:15 - chamado por: applySave (save.js:49), initProgress (progresso.js:105)
- NIVEL_DE_CALCULO_SEM_CAP:60 - chamado por: pipelineResolverAlvo (pipeline_build.js:73), validateAiBuild (validacao_build_ia.js:199)
- availableMovesFor:73 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122), liberadoNaRun (liberado_na_run.js:23), state (nucleo.js:8) | chamado por: confrontoUnitOf (chefoes.js:245), comoGarantir (condicoes_habilidade.js:171), precisaDeSetter (condicoes_habilidade.js:213), pipelineCandidatos (pipeline_build.js:573), conferirPapelDaBuild (validacao_build_ia.js:69), +2
- capOuPadrao:61 - chamado por: contextoDoMotor (time_pelo_motor.js:140), modoMotorChave (modo_motor.js:20)
- getCurrentCap:49 - chama: state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:190), ctxDoState (validacao_build_ia.js:10), autoEvolveRoster (auto_evolucao.js:20), renderMovesTable (dex_ficha.js:111), +8
- golpesTravadosNoCap:90 - chama: MOVE_ID_BY_NAME (dados_base.js:87), liberadoNaRun (liberado_na_run.js:23), state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), processarRevisoes (revisao_automatica.js:23)
- innatesAtivasNoNivel:34 - chama: state (nucleo.js:8) | chamado por: unidadeDeDuelo (duelo.js:3087), pipelineCandidatos (pipeline_build.js:573)
- levelCapMode:16 - chama: state (nucleo.js:8) | chamado por: motorChaveDoContexto (time_pelo_motor.js:167), motorNivelDaEtapa (time_pelo_motor.js:72), modoMotorChave (modo_motor.js:20), initProgress (progresso.js:105)
- levelCapModeFromDifficulty:22 - chamado por: applySave (save.js:49)
- nivelDaHabilidadeNoElite:40 - chama: nomesDeHabilidades (condicoes_habilidade.js:116) | chamado por: marcasDoRankHtml (dex_ficha.js:288)
- nivelDeCalculo:65 - chamado por: computeSpeedTiers (chefoes.js:529), montarTimeContraEsteChefao (aba_chefoes.js:307), renderBossDetail (aba_chefoes.js:527), myBuildEditorHtml (editor_build.js:223), updateMyBuildStatus (editor_build.js:352), +1

## regras/liberado_na_run.js
- entradasDoJogador:34 - chama: state (nucleo.js:8) | chamado por: applyRecommendedTeam (arquetipo.js:143), monoRunCardHtml (arquetipo.js:317)
- etapaDaPedra:16 - chama: MEGA_PEDRAS_TARDIAS (formas_mega.js:94), MEGA_UNLOCK_MILESTONE (formas_mega.js:92) | chamado por: avisosDaBuild (avisos_build.js:8), etapaDaMega (formas_mega.js:104)
- etapaDoItem:18 - chama: primeiroLugarDoItem (avisos_build.js:94) | chamado por: pipelineEvioliteServe (pipeline_build.js:491)
- liberadoNaRun:23 - chamado por: avisosDaBuild (avisos_build.js:8), itemValidoNoTime (itens_do_time.js:94), availableMovesFor (level_cap.js:73), golpesTravadosNoCap (level_cap.js:90), pipelineEvioliteServe (pipeline_build.js:491), +3
- xsDoJogador:38 - chamado por: contextoDoMotor (time_pelo_motor.js:140), candidatosDoJogador (aba_chefoes.js:247), modoMotorCapturados (modo_motor.js:25), modoMotorChave (modo_motor.js:20), modoMotorMontar (modo_motor.js:67)

## regras/lista_de_builds.js
- acrescentarVarianteNaLista:23 - chama: entradaDeBuild (builds.js:22), getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarSugestoesDoMotor (sugestao_do_motor.js:61), addBuildVariant (nucleo.js:101)
- buildQueSaiParaAbrirVaga:43 - chama: getBuildList (evolucao.js:14) | chamado por: abrirVagaPreservando (nucleo.js:118)
- removerBuildDaLista:32 - chama: getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarSugestoesDoMotor (sugestao_do_motor.js:61), removeBuildIndex (nucleo.js:124)
- trocarBuildAtivaNaLista:11 - chama: entradaDeBuild (builds.js:22), getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: setOrReplaceActiveBuild (nucleo.js:94)

## regras/mono_run.js
- MONO_MARCAS:11 - chamado por: monoRunCardHtml (arquetipo.js:317)
- avisoProximoLider:158 - chama: bossPartyPorDificuldade (chefoes.js:339), getRemainingBossEntries (chefoes.js:63), gymLeaderBaseName (chefoes.js:55), MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9), +3 | chamado por: monoRunCardHtml (arquetipo.js:317)
- climaQueCombina:141 - chamado por: climaQueCombinaHtml (arquetipo.js:296)
- cobreFraquezas:88 - chama: abilityTypeMod (tipos.js:173)
- compraDeInicialTexto:47 - chama: getSpeciesBySname (dados_base.js:79) | chamado por: fichaCabecalhoHtml (dex_ficha.js:469)
- fraquezasDoTipo:80 - chama: USABLE_TYPES (dados_base.js:132), typeMultiplier (tipos.js:244) | chamado por: monoRunCardHtml (arquetipo.js:317)
- linhaEvolutivaDe:20 - chama: getSpeciesByX (dados_base.js:78), isMegaEvoKind (formas_mega.js:22)
- monoDisponibilidade:176 - chama: getSpeciesBySname (dados_base.js:79), rankDe (rank_da_run.js:29) | chamado por: monoRunCardHtml (arquetipo.js:317)
- monotypeAtivo:72 - chama: state (nucleo.js:8) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:307), renderBossDetail (aba_chefoes.js:527)
- mudancaDeTipo:95 - chama: formFamilyOf (formas_mega.js:65), isMegaForm (formas_mega.js:71), speciesTypeNames (tipos.js:254)
- orientacaoMono:144 - chama: ITEMS (dados_base.js:12)
- resistemAoTipo:83 - chama: USABLE_TYPES (dados_base.js:132), typeMultiplier (tipos.js:244)
- serveProMono:74 - chama: speciesTypeNames (tipos.js:254) | chamado por: bestBoxCandidateForBoss (chefoes.js:195), confrontoUnidadesDaCaixa (chefoes.js:301), especiesQueResolvem (pipeline_build.js:697), motorCandidatosEmPassos (time_pelo_motor.js:204), motorClassificar (time_pelo_motor_papeis.js:123), +2

## regras/pipeline_build.js
- candidatosDeBuild:568 - chama: ctxDoState (validacao_build_ia.js:10) | chamado por: pipelineResultado (pipeline_tela.js:14)
- especiesQueResolvem:697 - chama: SPECIES (dados_base.js:52), getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:185), serveProMono (mono_run.js:74), rankDe (rank_da_run.js:29), +1 | chamado por: quemResolveCalcular (quem_resolve.js:22)
- pipelineAmeacasDePrioridade:150 - chama: aguentaUmGolpe (duelo.js:2230), golpesNecessariosDuelo (duelo.js:2220), prioBloqueadaPelaHabilidadeDuelo (duelo.js:1741)
- pipelineAvaliarConjunto:281 - chama: golpesNecessariosComPrimeiroDuelo (duelo.js:2222)
- pipelineCandidatos:573 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:122), golpesDeDueloAte (duelo.js:135), nomeHabDuelo (duelo.js:46), moveRoleOf (golpes.js:53), +4 | chamado por: motorBuildDoCandidato (time_pelo_motor.js:168)
- pipelineDuelo:177 - chama: resultadoDoDuelo (duelo.js:2754)
- pipelineEspecie:61 - chama: getSpeciesBySname (dados_base.js:79)
- pipelineEvioliteServe:491 - chama: ITEMS (dados_base.js:12), evioliteFunciona (formas_mega.js:32), etapaDoItem (liberado_na_run.js:18), liberadoNaRun (liberado_na_run.js:23)
- pipelineGolpesComRecuo:477 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- pipelineHabilidadesSemRegra:384 - chama: ABILITY_ID_BY_NAME (confronto.js:17), habilidadeSemRegraNoDuelo (duelo.js:1706), nomeHabDuelo (duelo.js:46)
- pipelineLinhaDoGolpe:187 - chama: aguentaUmGolpe (duelo.js:2230), bloqueiosNoDuelo (duelo.js:2729), golpesNecessariosComPrimeiroDuelo (duelo.js:2222), temPrioridadeNoCampoDuelo (duelo.js:2276)
- pipelineMontarConjunto:331 - chama: moveRoleOf (golpes.js:53)
- pipelinePapeisDuplos:533 - chama: ehGolpeDePivo (golpes.js:41), conferirPapelDaBuild (validacao_build_ia.js:69)
- pipelineResolverAlvo:73 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), FATIA_DOS_CHEFOES (chefoes.js:29), LUTAS_DA_RUN (chefoes.js:326), bossPartyPorDificuldade (chefoes.js:339), buffsAtivosDoChefao (chefoes.js:515), +8 | chamado por: motorBuildDoCandidato (time_pelo_motor.js:168)
- pipelineSemRecuo:484 - chama: ABILITY_ID_BY_NAME (confronto.js:17), uniqueIds (dados_base.js:122), efeitoDasHabilidadesNoDuelo (duelo.js:1367)
- pipelineSinergiasAtivas:236 - chama: sinergiasDaEspecie (duelo.js:1320)
- pipelineTabela:250 - chama: unidadeDaBuild (duelo.js:3185)
- pipelineTiposExtraDeStab:428 - chama: ABILITY_ID_BY_NAME (confronto.js:17), uniqueIds (dados_base.js:122), efeitoDasHabilidadesNoDuelo (duelo.js:1367)
- pipelineValidarRascunho:505 - chama: ITEMS (dados_base.js:12), contextoDeValidacao (validacao_build_ia.js:182), megaStoneRuleFor (validacao_build_ia.js:18), validateAiBuild (validacao_build_ia.js:199)

## regras/plano_build.js
- ESTILO_ROTULO:20 - chamado por: rotuloDaBuild (ficha_extras.js:170)
- ROTULOS_EV:21 - chamado por: evsToShowdownText (builds.js:70)
- curadaParaEstilo:160 - chamado por: effectiveBuild (builds.js:190), processarRevisoes (revisao_automatica.js:23)
- estiloDeEvs:37 - chamado por: effectiveBuild (builds.js:190)
- estiloDoRitmo:48 - chamado por: effectiveBuild (builds.js:190), processarRevisoes (revisao_automatica.js:23)
- evsTextoParaArray:24 - chamado por: processarRevisoes (revisao_automatica.js:23)
- golpesNoCap:123 - chamado por: effectiveBuild (builds.js:190), myBuildEditorHtml (editor_build.js:223)
- nivelDeEvolucaoDaForma:68 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL (dados_base.js:30) | chamado por: golpesFuturosDe (builds.js:167)
- nivelDoGolpe:56 - chama: MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: golpesFuturosDe (builds.js:167)
- planoSaneado:107 - chamado por: entradaDeBuild (builds.js:22), anteriorSaneado (save.js:239), applySave (save.js:49)
- trocasEntreCaps:141 - chamado por: registrarTrocasDoPlano (revisao_automatica.js:71)

## regras/rank_da_run.js
- FORA_DO_RANK:10 - chamado por: rankBadgeHtml (dex_ficha.js:169), rankInfoLineHtml (dex_ficha.js:310)
- MOTIVO_FORA_DO_RANK_PT:17 - chamado por: rankBadgeHtml (dex_ficha.js:169), rankInfoLineHtml (dex_ficha.js:310)
- chaveDoRankDaDificuldade:23 - chama: TIER_DA_DIFICULDADE (chefoes.js:21)
- rankDaDificuldadeDe:69 - chamado por: marcasDoRankHtml (dex_ficha.js:288)
- rankDe:29 - chama: state (nucleo.js:8) | chamado por: bestBoxCandidateForBoss (chefoes.js:195), bestRankForm (chefoes.js:345), formFamilyPromptNote (formas_mega.js:46), monoDisponibilidade (mono_run.js:176), especiesQueResolvem (pipeline_build.js:697), +6

## regras/reconciliar_build.js
- habilidadeSubstitutaPara:26 - chama: habilidadesEscolhiveis (dados_base.js:119), sinergiasDaEspecie (duelo.js:1320)
- movepoolCompletoDe:17 - chama: MOVES (dados_base.js:11)
- reconciliarBuild:39 - chama: habilidadesEscolhiveis (dados_base.js:119) | chamado por: effectiveBuild (builds.js:190), reconciliarBuildsDe (evolucao.js:104)

## regras/save.js
- AUTO_LOG_MAX:37 - chamado por: logAutoAction (evolucao.js:229)
- anteriorSaneado:239 - chama: planoSaneado (plano_build.js:107)
- applySave:49 - chama: BUILD_SOURCES (builds.js:17), ARQUETIPOS_DE_CAMPO (campo.js:33), MONOTYPE_ARCHETYPES (dados_base.js:156), PACE_ARCHETYPES (dados_base.js:146), TATICA_ARCHETYPES (dados_base.js:149), +10 | chamado por: loadSave (nucleo.js:337), aplicarSaveRemoto (sync.js:45)
- buildSave:339 - chamado por: persist (nucleo.js:144), aplicarSaveRemoto (sync.js:45), connectSync (sync.js:179)
- conferirSomaDoSave:329 - chamado por: loadSave (nucleo.js:337), remotoComSomaErrada (sync.js:88)
- ehBackupDeTime:48 - chamado por: guardarTimeAnterior (aba_chefoes.js:265)
- montarSave:344 - chama: state (nucleo.js:8)
- reconciliouAoAplicar:44 - chamado por: loadSave (nucleo.js:337), aplicarSaveRemoto (sync.js:45)
- sanitizarStrategySets:258 - chama: clampInt (dados_base.js:103), getSpeciesBySname (dados_base.js:79)
- saveChegandoTemMenosProgresso:386 - chamado por: conflitoDeProgresso (sync.js:61)
- saveEnviavel:336 - chamado por: connectSync (sync.js:179), remotoComSomaErrada (sync.js:88)
- snamesToXs:15 - chama: SPECIES_BY_SNAME (dados_base.js:72) | chamado por: carregarTimeSalvo (time.js:232), renderSavedTeams (time.js:208)
- syncContentDiffers:400 - chamado por: connectSync (sync.js:179)
- xsToSnames:24 - chama: snameOf (dados_base.js:80) | chamado por: guardarTimeAnterior (aba_chefoes.js:265)

## regras/sugestao_do_motor.js
- SUGESTAO_ROTULO:11 - chamado por: buildChipsHtml (editor_build.js:212), rotuloDaBuild (ficha_extras.js:170), modoMotorFicarComVariante (modo_motor.js:118), modoMotorRodapeHtml (modo_motor.js:180)
- gravarSugestoesDoMotor:61 - chama: entradaDeBuild (builds.js:22), getBuildList (evolucao.js:14), acrescentarVarianteNaLista (lista_de_builds.js:23), removerBuildDaLista (lista_de_builds.js:32), state (nucleo.js:8) | chamado por: modoMotorFicarComVariante (modo_motor.js:118)
- planoDeGravarSugestoes:39 - chama: getActiveBuild (evolucao.js:16), getBuildList (evolucao.js:14) | chamado por: modoMotorFicarComVariante (modo_motor.js:118)

## regras/texto_versao_nova.js
- LIDO_PELO_TEXTO_NOVO_DUELO:156 - chamado por: expandirTextoDeHabilidade (condicoes_habilidade.js:99), textoHabDuelo (duelo.js:48)
- TEXTO_DA_VERSAO_NOVA_DUELO:9 - chamado por: expandirTextoDeHabilidade (condicoes_habilidade.js:99), textoHabDuelo (duelo.js:48)

## regras/time_pelo_motor.js
- contextoDoMotor:140 - chama: capOuPadrao (level_cap.js:61), xsDoJogador (liberado_na_run.js:38), state (nucleo.js:8) | chamado por: modoMotorAquecer (modo_motor.js:39), modoMotorMontar (modo_motor.js:67)
- criarCacheDoMotor:64 - chamado por: modoMotorCache (modo_motor.js:18)
- montarTimePeloMotorEmPassos:429 - chama: SPECIES (dados_base.js:52), motorClassificar (time_pelo_motor_papeis.js:123), motorTextos (time_pelo_motor_papeis.js:146) | chamado por: modoMotorMontar (modo_motor.js:67)
- motorAquecerBuildsEmPassos:228 - chamado por: modoMotorAquecer (modo_motor.js:39)
- motorArred:61 - chamado por: motorClassificar (time_pelo_motor_papeis.js:123)
- motorBuildDoCandidato:168 - chama: ABILITIES (dados_base.js:10), MOVES (dados_base.js:11), melhorUnidadeContra (duelo.js:3111), getActiveBuild (evolucao.js:16), liberadoNaRun (liberado_na_run.js:23), +2
- motorCandidatosEmPassos:204 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:185), serveProMono (mono_run.js:74)
- motorChaveDaBuild:164 - chamado por: motorAlternativasArmadoras (time_pelo_motor_papeis.js:82)
- motorChaveDoContexto:167 - chama: megaMode (formas_mega.js:82), levelCapMode (level_cap.js:16), state (nucleo.js:8) | chamado por: motorAlternativasArmadoras (time_pelo_motor_papeis.js:82)
- motorFecharItens:390 - chama: itemValidoNoTime (itens_do_time.js:94)
- motorGuardar:65 - chamado por: motorAux (time_pelo_motor_papeis.js:8)
- motorItensCandidatos:367 - chama: MOVES (dados_base.js:11), unidadeDeDuelo (duelo.js:3087), itemDeTipoDoTime (itens_do_time.js:102), itemValidoNoTime (itens_do_time.js:94), conflitoDeItem (validacao_build_ia.js:121)
- motorLutasComunsDoContexto:107 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), FATIA_DOS_CHEFOES (chefoes.js:29), state (nucleo.js:8)
- motorLutasDoContexto:122 - chama: LUTAS_DA_RUN (chefoes.js:326)
- motorMontarLuta:78 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), bossPartyPorDificuldade (chefoes.js:339), buffsAtivosDoChefao (chefoes.js:515), regraDeCampoDoChefao (chefoes.js:426), climaDoTimeDoChefao (duelo.js:3063), +5 | chamado por: motorLutaComClima (time_pelo_motor_papeis.js:34)
- motorMontarLutaComum:89 - chama: climaDoTimeDoChefao (duelo.js:3063), foeDeDuelo (duelo.js:3037)
- motorNivelDaEtapa:72 - chama: levelCapMode (level_cap.js:16)
- motorRaizDaLinha:150 - chama: SPECIES (dados_base.js:52), isMegaEvoKind (formas_mega.js:22)
- motorSimular:244 - chama: meuComBuffsDoGinasio (duelo.js:4302), simularDuplaContraChefao (duelo.js:3827), simularLutaContraChefao (duelo.js:4342), megaMode (formas_mega.js:82), state (nucleo.js:8)
- motorTemGolpeDeLado:273 - chama: semGolpesDeLadoDuelo (duelo.js:4765)
- motorUnidade:234 - chama: unidadeDaBuild (duelo.js:3185) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:14), motorUnidadeNaLuta (time_pelo_motor_papeis.js:7)

## regras/time_pelo_motor_papeis.js
- motorAlternativasArmadoras:82 - chama: liberadoNaRun (liberado_na_run.js:23), motorChaveDaBuild (time_pelo_motor.js:164), motorChaveDoContexto (time_pelo_motor.js:167)
- motorAux:8 - chama: motorGuardar (time_pelo_motor.js:65)
- motorClassificar:123 - chama: serveProMono (mono_run.js:74), motorArred (time_pelo_motor.js:61), state (nucleo.js:8) | chamado por: montarTimePeloMotorEmPassos (time_pelo_motor.js:429)
- motorCondicoes:14 - chama: ABILITY_ID_BY_NAME (confronto.js:17), MOVES (dados_base.js:11), armadoresDeClima (duelo.js:3283), planoDoGolpeStatus (duelo.js:3315), motorUnidade (time_pelo_motor.js:234)
- motorGanhoDaCondicao:37 - chama: DURACAO_LADO_DUELO (duelo.js:4035), meuComBuffsDoGinasio (duelo.js:4302), novoLadoDuelo (duelo.js:4039), resultadoDoDuelo (duelo.js:2754), unidadeDaBuild (duelo.js:3185)
- motorLutaComClima:34 - chama: motorMontarLuta (time_pelo_motor.js:78)
- motorPapeisDaEspecie:119 - chama: ROLE_LABEL_PT (dados_base.js:181)
- motorTextos:146 - chamado por: montarTimePeloMotorEmPassos (time_pelo_motor.js:429)
- motorUnidadeNaLuta:7 - chama: meuComBuffsDoGinasio (duelo.js:4302), motorUnidade (time_pelo_motor.js:234)

## regras/tipos.js
- TYPE_MOD_ABILITIES:75 - chamado por: efetividadeNoDuelo (duelo.js:1927), habilidadeSemRegraNoDuelo (duelo.js:1706)
- abilityTypeMod:173 - chamado por: computeSharedRisks (chefoes.js:121), unitTypeMult (formas_mega.js:201), cobreFraquezas (mono_run.js:88), renderTeamAnalysis (arquetipo.js:400)
- abilityTypeModFor:196 - chama: ABILITIES (dados_base.js:10) | chamado por: ameacaDe (confronto.js:91), coberturaSugerida (confronto.js:196), ofensaContra (confronto.js:59), aterradoDuelo (duelo.js:833), efetividadeNoDuelo (duelo.js:1927)
- alwaysActiveAbilities:164 - chamado por: confrontoUnitOf (chefoes.js:245)
- perfilDefensivoDaEspecie:179 - chama: USABLE_TYPES (dados_base.js:132) | chamado por: fichaEfetividadeHtml (dex_ficha.js:388)
- speciesTypeNames:254 - chama: TYPES (dados_base.js:9) | chamado por: confrontoUnitOf (chefoes.js:245), podeTerStatus (condicoes_habilidade.js:128), coberturaSugerida (confronto.js:196), ofensaContra (confronto.js:59), itemDoDuelo (duelo.js:879), +18
- typeMultiplier:244 - chamado por: efetividadeNoDuelo (duelo.js:1927), entrarNoLadoDuelo (duelo.js:4100), simularLutaDeVerdadeContraChefao (duelo.js:4351), avisoProximoLider (mono_run.js:158), fraquezasDoTipo (mono_run.js:80), +2

## regras/validacao_build_ia.js
- ITENS_CHOICE:95 - chamado por: avisosDaBuild (avisos_build.js:8)
- conferirPapelDaBuild:69 - chama: ehGolpeDePivo (golpes.js:41), availableMovesFor (level_cap.js:73) | chamado por: pipelinePapeisDuplos (pipeline_build.js:533)
- conflitoDeItem:121 - chama: MOVE_BY_NAME (dados_base.js:86), SPLIT_STATUS (dados_base.js:29), evioliteFunciona (formas_mega.js:32), speciesTypeNames (tipos.js:254) | chamado por: avisosDaBuild (avisos_build.js:8), motorItensCandidatos (time_pelo_motor.js:367)
- conflitoDeNature:103 - chama: MOVE_BY_NAME (dados_base.js:86), NATURE_MODS (dados_base.js:90), moveRoleOf (golpes.js:53)
- contextoDeValidacao:182 - chama: buffsAtivosDoChefao (chefoes.js:515), habilidadesEscolhiveis (dados_base.js:119) | chamado por: pipelineValidarRascunho (pipeline_build.js:505)
- ctxDoState:10 - chama: getCurrentCap (level_cap.js:49), state (nucleo.js:8) | chamado por: candidatosDeBuild (pipeline_build.js:568), especiesQueResolvem (pipeline_build.js:697), pipelineCandidatos (pipeline_build.js:573), pipelineResolverAlvo (pipeline_build.js:73)
- limitarEvsAoJogo:154 - chama: clampInt (dados_base.js:103)
- megaStoneRuleFor:18 - chama: isMegaForm (formas_mega.js:71), megaMode (formas_mega.js:82), stonesOf (formas_mega.js:175) | chamado por: avisosDaBuild (avisos_build.js:8), comoGarantir (condicoes_habilidade.js:171), pipelineValidarRascunho (pipeline_build.js:505), megaModeBuildNoteHtml (editor_build.js:174)
- regraItemConsumivelPara:51 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:122)
- validateAiBuild:199 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:138), itemEsgotadoNoTime (builds.js:140), itensEmUsoComQuem (builds.js:141), trimAndReallocateEvs (calc_stat.js:238), condicaoDaBuild (condicoes_habilidade.js:190), +21 | chamado por: pipelineValidarRascunho (pipeline_build.js:505)
