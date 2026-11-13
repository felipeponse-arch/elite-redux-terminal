# Chamadas entre arquivos - src/regras/

Gerado por `npm run mapa` (scripts/mapa_chamadas.mjs, API do TypeScript); não edite à mão.
Por função de nível superior: `chama:` e `chamado por:` funções de OUTROS arquivos de src/regras e src/ui, como `nome (arquivo:linha)`;
no máximo 5 por lista, o resto vira `+N`. Referência vale também como callback. Chamada pelo template/HTML não aparece. Mapa geral: [mapa-do-codigo.md](../mapa-do-codigo.md).

## regras/arquivo_de_save.js
- BACKUPS_MAX:18 - chamado por: arquivoDeSaveUi (arquivo_de_save.js:7)
- contarDoSave:38 - chamado por: arquivoDeSaveUi (arquivo_de_save.js:7)
- empilharBackup:19 - chamado por: arquivoDeSaveUi (arquivo_de_save.js:7)
- erroDeTamanho:13 - chamado por: arquivoDeSaveUi (arquivo_de_save.js:7)
- lerArquivoDeSave:48 - chama: conferirSomaDoSave (save.js:285) | chamado por: arquivoDeSaveUi (arquivo_de_save.js:7)
- mesclarBuildsDoAtual:70 - chamado por: arquivoDeSaveUi (arquivo_de_save.js:7)
- montarArquivoDeSave:25 - chama: buildSave (save.js:295) | chamado por: arquivoDeSaveUi (arquivo_de_save.js:7)
- resumoDaImportacao:92 - chama: SPECIES_BY_SNAME (dados_base.js:72), state (nucleo.js:8) | chamado por: arquivoDeSaveUi (arquivo_de_save.js:7)

## regras/avisos_build.js
- avisosDaBuild:8 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:138), itemEsgotadoNoTime (builds.js:140), itensEmUsoComQuem (builds.js:141), stripNote (builds.js:44), garantiaDaCondicao (condicoes_habilidade.js:155), +15 | chamado por: buildContextNotesHtml (editor_build.js:161), avisoEnxutoHtml (time_build.js:64)
- ondeAcharItemTexto:100 - chamado por: itemDescHtml (editor_build.js:45), painelDaBuildHtml (time_build.js:72)
- primeiroLugarDoItem:94 - chamado por: etapaDoItem (liberado_na_run.js:18)
- seloDaBuild:82 - chamado por: seloDaBuildHtml (editor_build.js:168)

## regras/builds.js
- BUILD_SOURCES:17 - chamado por: applySave (save.js:45)
- MAX_MESMO_ITEM_NO_TIME:138 - chamado por: avisosDaBuild (avisos_build.js:8), validateAiBuild (validacao_build_ia.js:199)
- computeTeamGenerationValidation:228 - chama: computeSharedRisks (chefoes.js:118) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:310), generatedTeamCardHtml (arquetipo.js:261)
- effectiveBuild:190 - chama: getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), MEGA_BASE_BY_X (formas_mega.js:21), isMegaForm (formas_mega.js:71), getCurrentCap (level_cap.js:49), +6 | chamado por: confrontoUnitOf (chefoes.js:242), compareResultHtml (ficha_extras.js:22), renderTeam (time.js:17)
- entradaDeBuild:22 - chama: planoSaneado (plano_build.js:107) | chamado por: acrescentarVarianteNaLista (lista_de_builds.js:23), trocarBuildAtivaNaLista (lista_de_builds.js:11), gravarSugestoesDoMotor (sugestao_do_motor.js:61)
- evsToShowdownText:70 - chama: ROTULOS_EV (plano_build.js:21) | chamado por: entradaResumoHtml (editor_build.js:183)
- golpesFuturosDe:167 - chama: MOVES (dados_base.js:11), nivelDeEvolucaoDaForma (plano_build.js:68), nivelDoGolpe (plano_build.js:56)
- itemEsgotadoNoTime:140 - chamado por: avisosDaBuild (avisos_build.js:8), itemValidoNoTime (itens_do_time.js:94), validateAiBuild (validacao_build_ia.js:199)
- itensEmUsoComQuem:141 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), validateAiBuild (validacao_build_ia.js:199)
- showdownSet:53 - chamado por: initBosses (aba_chefoes.js:33)
- stripNote:44 - chamado por: avisosDaBuild (avisos_build.js:8), entradaResumoHtml (editor_build.js:183), hpEvEfficiencyNote (editor_build.js:83), itemDescHtml (editor_build.js:45), compareResultHtml (ficha_extras.js:22), +4
- teamItemsInUse:85 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- teamMovesInUse:111 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- teamRolesInUse:153 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)

## regras/calc_stat.js
- ITEM_MOVE_POWER_MODS:132 - chamado por: updateMyBuildStatus (editor_build.js:354)
- calcFinalStat:160 - chama: NATURE_MODS (dados_base.js:100) | chamado por: computeSpeedTiers (chefoes.js:545), foeDeDuelo (duelo.js:3044), semItemDuplicadoNoHell (duelo.js:3084), unidadeDeDuelo (duelo.js:3094), bossMonCardHtml (aba_chefoes.js:434), +2
- especiePorNomeDoItem:135 - chama: SPECIES (dados_base.js:52)
- itemRuleFor:149 - chamado por: itemDoDuelo (duelo.js:879), bossMonCardHtml (aba_chefoes.js:434), updateMyBuildStatus (editor_build.js:354)
- minEvSameStat:200 - chamado por: evBreakpointNote (editor_build.js:116)
- regraCasaComEspecie:139 - chama: isMegaEvoKind (formas_mega.js:22)
- trimAndReallocateEvs:238 - chamado por: validateAiBuild (validacao_build_ia.js:199)

## regras/campo.js
- ARQUETIPOS_DE_CAMPO:33 - chamado por: applySave (save.js:45), archetypeCardHtml (arquetipo.js:85)
- CAMADAS_DE_HAZARD:55 - chamado por: novoLadoDuelo (duelo.js:4050), temHazardDuelo (duelo.js:4070), trocaHazardsDosLadosDuelo (duelo.js:4072)
- CLIMAS_DO_CAMPO:25 - chamado por: armadoresDeClima (duelo.js:3290), efeitoDasHabilidadesNoDuelo (duelo.js:1367), habilidadeSemRegraNoDuelo (duelo.js:1708)
- CLIMA_OFICIAL:49 - chamado por: danoNoDuelo (duelo.js:1989), montarTimeNoClimaEmPassos (duelo.js:4668), prepararGolpesDuelo (duelo.js:1757)
- CONDICAO_DO_ARQUETIPO_CAMPO:35 - chamado por: garantiaDoTime (condicoes_habilidade.js:141)
- DURACAO_CAMPO:9 - chamado por: lerCampoDaFraseDuelo (duelo.js:797), lerDiversosDaFraseDuelo (duelo.js:560)
- HAZARD_DO_GOLPE:56 - chamado por: planoDoGolpeStatus (duelo.js:3322), resultadosDaLutaComHazard (duelo.js:3234)
- TERRENO_DO_TEXTO:29 - chamado por: lerCampoDaFraseDuelo (duelo.js:797)
- hazardCheioNoLado:57 - chamado por: simularLutaDeVerdadeContraChefao (duelo.js:4362)
- poeHazardNoLado:58 - chamado por: resultadosDaLutaComHazard (duelo.js:3234), simularDuplaContraChefao (duelo.js:3835), simularLutaDeVerdadeContraChefao (duelo.js:4362)

## regras/chefoes.js
- DIFF_TO_BOSSKEY:25 - chamado por: motorMontarLuta (time_pelo_motor.js:70), quemResolveCardHtml (quem_resolve.js:84)
- HELL_DANO_EXTRA_A_PARTIR_DA_INSIGNIA:467 - chamado por: fDanoGlobalHell (duelo.js:3041)
- HELL_IV_ZERO_A_PARTIR_DA_INSIGNIA:468 - chamado por: ivDoJogadorDuelo (duelo.js:3082)
- HELL_NIVEIS_EXTRAS:464 - chamado por: nivelDoInimigoHell (duelo.js:3043)
- HELL_NIVEIS_EXTRAS_A_PARTIR_DA_INSIGNIA:465 - chamado por: nivelDoInimigoHell (duelo.js:3043)
- LUTAS_DA_RUN:323 - chamado por: pipelineResolverAlvo (pipeline_build.js:70), motorLutasDoContexto (time_pelo_motor.js:81)
- SPEEDTIER_NATURE:543 - chamado por: renderSpeedTiers (tipos.js:35)
- TIER_DA_DIFICULDADE:21 - chamado por: chaveDoRankDaDificuldade (rank_da_run.js:23)
- bestBoxCandidateForBoss:192 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:185), unitTypeMult (formas_mega.js:201), serveProMono (mono_run.js:74), rankDe (rank_da_run.js:29), +1 | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- bestRankForm:342 - chama: battleUnitsOf (formas_mega.js:185), rankDe (rank_da_run.js:29) | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- bossPartyPorDificuldade:336 - chama: state (nucleo.js:8) | chamado por: avisoProximoLider (mono_run.js:158), pipelineResolverAlvo (pipeline_build.js:70), motorMontarLuta (time_pelo_motor.js:70), initProgress (progresso.js:111), dashboardConfrontoHtml (resumo_luta.js:135)
- bossSafetyScore:180 - chama: unitTypeMult (formas_mega.js:201)
- bossSpeedSummary:141 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: nextFightDetailHtml (resumo_luta.js:215)
- buffsAtivosDoChefao:531 - chama: state (nucleo.js:8) | chamado por: pipelineResolverAlvo (pipeline_build.js:70), motorMontarLuta (time_pelo_motor.js:70), contextoDeValidacao (validacao_build_ia.js:182), montarTimeContraEsteChefao (aba_chefoes.js:310)
- buffsParaMostrarDoChefao:519 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:310), buffsMudaram (arquetipo.js:208)
- classeDoCabecalhoDoChefao:54 - chamado por: renderBossDetail (aba_chefoes.js:534)
- comportamentoDaIADoChefao:456 - chamado por: iaDoChefaoHtml (aba_chefoes.js:190)
- computeBossAttackTypes:156 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9), moveRoleOf (golpes.js:53), state (nucleo.js:8)
- computeSharedRisks:118 - chama: USABLE_TYPES (dados_base.js:142), abilityTypeMod (tipos.js:173) | chamado por: computeTeamGenerationValidation (builds.js:228), renderTeamAnalysis (arquetipo.js:400), boxFitNote (resumo_luta.js:154), renderDashboard (resumo_luta.js:183)
- computeSpeedTiers:545 - chama: calcFinalStat (calc_stat.js:160), SPECIES (dados_base.js:52), nivelDeCalculo (level_cap.js:65) | chamado por: renderSpeedTiers (tipos.js:35)
- confrontoFoesDe:267 - chama: foeFromBossMember (confronto.js:49), getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), megaDaPedra (formas_mega.js:169)
- confrontoMelhorUnidade:278 - chama: confrontoTime (confronto.js:146), battleUnitsOf (formas_mega.js:185)
- confrontoMinhasUnidades:288 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8)
- confrontoParaParty:307 - chama: confrontoTime (confronto.js:146), melhoresTrocas (confronto.js:265) | chamado por: initProgress (progresso.js:111), bossConfrontoHtml (resumo_luta.js:96), dashboardConfrontoHtml (resumo_luta.js:135)
- confrontoUnidadesDaCaixa:298 - chama: getSpeciesByX (dados_base.js:78), serveProMono (mono_run.js:74), state (nucleo.js:8)
- confrontoUnitOf:242 - chama: effectiveBuild (builds.js:190), ABILITY_ID_BY_NAME (confronto.js:17), availableMovesFor (level_cap.js:73), alwaysActiveAbilities (tipos.js:164), speciesTypeNames (tipos.js:254)
- ehRevancheDeLider:483 - chama: state (nucleo.js:8) | chamado por: renderGymSkillsCardHtml (aba_chefoes.js:397)
- faixaDeHpDaLuta:609 - chamado por: planoContraChefaoHtml (arquetipo.js:212)
- getRemainingBossEntries:60 - chama: state (nucleo.js:8) | chamado por: avisoProximoLider (mono_run.js:158), pipelineResolverAlvo (pipeline_build.js:70), renderBossDetail (aba_chefoes.js:534), renderBossList (aba_chefoes.js:211), pipelineAlvoValido (pipeline_tela.js:26), +5
- gymLeaderBaseName:52 - chamado por: avisoProximoLider (mono_run.js:158), renderGymSkillsCardHtml (aba_chefoes.js:397)
- gymSkillsSummaryFor:376 - chama: state (nucleo.js:8) | chamado por: renderGymSkillsCardHtml (aba_chefoes.js:397)
- nextFightCx:360 - chamado por: renderDashboard (resumo_luta.js:183), renderNextFightCard (resumo_luta.js:257)
- planoDaLuta:565 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:310)
- regraDeCampoDoChefao:423 - chamado por: pipelineResolverAlvo (pipeline_build.js:70), motorMontarLuta (time_pelo_motor.js:70), campoDoChefaoHtml (aba_chefoes.js:178), montarTimeContraEsteChefao (aba_chefoes.js:310)
- regrasDoHell:474 - chamado por: hellDoChefaoHtml (aba_chefoes.js:199)
- resumoDaLuta:578 - chamado por: montarTimeContraEsteChefao (aba_chefoes.js:310)
- simularOitavoGinasio:494 - chama: climaDoTimeDoChefao (duelo.js:3070), foeDeDuelo (duelo.js:3044), simularDuplaContraChefao (duelo.js:3835)
- varianteDoChefao:367 - chama: state (nucleo.js:8) | chamado por: selectBoss (aba_chefoes.js:378), initProgress (progresso.js:111)
- vereditoDaLuta:603 - chamado por: vereditoDaLutaHtml (arquetipo.js:199)

## regras/condicoes_habilidade.js
- NOME_DA_CONDICAO:42 - chamado por: planoContraChefaoHtml (arquetipo.js:212)
- comoGarantir:171 - chama: ITEMS (dados_base.js:12), availableMovesFor (level_cap.js:73), megaStoneRuleFor (validacao_build_ia.js:18)
- condicaoDaBuild:190 - chamado por: validateAiBuild (validacao_build_ia.js:199)
- descricaoDeHabilidade:77 - chama: ABILITIES (dados_base.js:10)
- descricaoDeHabilidadePorId:88 - chama: ABILITIES (dados_base.js:10) | chamado por: textoHabDuelo (duelo.js:48)
- expandirTextoDeHabilidade:99 - chama: ABILITIES (dados_base.js:10), LIDO_PELO_TEXTO_NOVO_DUELO (texto_versao_nova.js:156), TEXTO_DA_VERSAO_NOVA_DUELO (texto_versao_nova.js:9) | chamado por: textoHabDuelo (duelo.js:48)
- garantiaDaCondicao:155 - chama: ITEMS (dados_base.js:12) | chamado por: avisosDaBuild (avisos_build.js:8)
- garantiaDoTime:141 - chama: CONDICAO_DO_ARQUETIPO_CAMPO (campo.js:35), getSpeciesByX (dados_base.js:78), getActiveBuild (evolucao.js:16), state (nucleo.js:8)
- habilidadeArma:113 - chamado por: armadoresDeClima (duelo.js:3290), climaDoTimeDoChefao (duelo.js:3070), efeitoDasHabilidadesNoDuelo (duelo.js:1367), habilidadeSemRegraNoDuelo (duelo.js:1708)
- nomesDeHabilidades:116 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:132) | chamado por: avisosDaBuild (avisos_build.js:8), nivelDaHabilidadeNoElite (level_cap.js:40)
- podeTerStatus:128 - chama: ABILITY_ID_BY_NAME (confronto.js:17), STATUS_DUELO (duelo.js:213), efeitoDasHabilidadesNoDuelo (duelo.js:1367), speciesTypeNames (tipos.js:254)
- precisaDeSetter:213 - chama: availableMovesFor (level_cap.js:73) | chamado por: avisosDaBuild (avisos_build.js:8), marcasDoRankHtml (dex_ficha.js:288)

## regras/confronto.js
- ABILITY_ID_BY_NAME:17 - chamado por: confrontoUnitOf (chefoes.js:242), podeTerStatus (condicoes_habilidade.js:128), climaDoTimeDoChefao (duelo.js:3070), foeDeDuelo (duelo.js:3044), montarTimeNoClimaEmPassos (duelo.js:4668), +7
- aberturaEmDupla:319 - chamado por: confrontoPlanoHtml (resumo_luta.js:67)
- ameacaDe:91 - chama: MOVE_BY_NAME (dados_base.js:86), abilityTypeModFor (tipos.js:196)
- coberturaSugerida:196 - chama: MOVE_BY_NAME (dados_base.js:86), moveRoleOf (golpes.js:53), abilityTypeModFor (tipos.js:196), speciesTypeNames (tipos.js:254) | chamado por: confrontoAjustesHtml (resumo_luta.js:44)
- confrontoDamagingMoves:29 - chama: MOVE_BY_NAME (dados_base.js:86), moveRoleOf (golpes.js:53)
- confrontoMoveType:32 - chama: MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9)
- confrontoTime:146 - chamado por: confrontoMelhorUnidade (chefoes.js:278), confrontoParaParty (chefoes.js:307)
- cuidadosDoChefao:302 - chamado por: confrontoPlanoHtml (resumo_luta.js:67)
- foeFromBossMember:49 - chama: getSpeciesByX (dados_base.js:78) | chamado por: confrontoFoesDe (chefoes.js:267)
- melhoresTrocas:265 - chamado por: confrontoParaParty (chefoes.js:307)
- ofensaContra:59 - chama: MOVE_BY_NAME (dados_base.js:86), abilityTypeModFor (tipos.js:196), speciesTypeNames (tipos.js:254)

## regras/dados_base.js
- ABILITIES:10 - chamado por: descricaoDeHabilidade (condicoes_habilidade.js:77), descricaoDeHabilidadePorId (condicoes_habilidade.js:88), expandirTextoDeHabilidade (condicoes_habilidade.js:99), nomesDeHabilidades (condicoes_habilidade.js:116), camposLidosDaHabilidade (duelo.js:1689), +14
- ALL_NATURES:111 - chamado por: validateAiBuild (validacao_build_ia.js:199), myBuildEditorHtml (editor_build.js:230)
- EVOKINDS:13 - chamado por: evolveChainByX (evolucao.js:66), isMegaEvoKind (formas_mega.js:22), nivelDeEvolucaoDaForma (plano_build.js:68), evoConditionText (dex_ficha.js:88)
- EVO_LEVEL:30 - chamado por: evolveChainByX (evolucao.js:66), nivelDeEvolucaoDaForma (plano_build.js:68)
- EVO_LEVEL_FEMALE:32 - chamado por: evoConditionText (dex_ficha.js:88)
- EVO_LEVEL_MALE:31 - chamado por: evoConditionText (dex_ficha.js:88)
- EVO_MEGA_KINDS:34 - chamado por: isMegaEvoKind (formas_mega.js:22), evoConditionText (dex_ficha.js:88)
- EVO_PRIMAL:33 - chamado por: isMegaEvoKind (formas_mega.js:22), evoConditionText (dex_ficha.js:88)
- ITEMS:12 - chamado por: comoGarantir (condicoes_habilidade.js:171), garantiaDaCondicao (condicoes_habilidade.js:155), itensDeEspeciePara (itens_do_time.js:82), soExistentes (itens_do_time.js:30), orientacaoMono (mono_run.js:144), +4
- MAPS:49 - chamado por: howToObtainText (dex_ficha.js:236), whereToFindText (dex_ficha.js:266)
- MONOTYPE_ARCHETYPES:166 - chamado por: applySave (save.js:45), archetypeCardHtml (arquetipo.js:85)
- MOVES:11 - chamado por: golpesFuturosDe (builds.js:167), acertosDoGolpeDuelo (duelo.js:86), efeitoDoPlanoDuelo (duelo.js:3620), escolherProximoDoChefao (duelo.js:4187), fracaoDormindoDuelo (duelo.js:2216), +24
- MOVE_BY_NAME:86 - chamado por: computeBossAttackTypes (chefoes.js:156), ameacaDe (confronto.js:91), coberturaSugerida (confronto.js:196), confrontoDamagingMoves (confronto.js:29), confrontoMoveType (confronto.js:32), +9
- MOVE_ID_BY_NAME:87 - chamado por: danoDoFuturoDuelo (duelo.js:2748), foeDeDuelo (duelo.js:3044), lerCondicaoDaFraseDuelo (duelo.js:366), lerDiversosDaFraseDuelo (duelo.js:560), poderDoDadoDuelo (duelo.js:2193), +11
- NATURE_MODS:100 - chamado por: calcFinalStat (calc_stat.js:160), conflitoDeNature (validacao_build_ia.js:103), validateAiBuild (validacao_build_ia.js:199)
- PACE_ARCHETYPES:156 - chamado por: applySave (save.js:45), archetypeCardHtml (arquetipo.js:85)
- ROLE_LABEL_PT:191 - chamado por: motorPapeisDaEspecie (time_pelo_motor_papeis.js:119), roleTagsHtml (dex_ficha.js:215), papelChipsHtml (time_build.js:89), computeRoleCompendium (tipos.js:91)
- SPECIES:52 - chamado por: especiePorNomeDoItem (calc_stat.js:135), computeSpeedTiers (chefoes.js:545), especieDaFormaDuelo (duelo.js:3571), especiesQueResolvem (pipeline_build.js:868), montarTimePeloMotorEmPassos (time_pelo_motor.js:385), +3
- SPECIES_BY_SNAME:72 - chamado por: resumoDaImportacao (arquivo_de_save.js:92), snamesToXs (save.js:15)
- SPLIT_LABEL_PT:192 - chamado por: roleTagsHtml (dex_ficha.js:215), papelChipsHtml (time_build.js:89)
- SPLIT_STATUS:29 - chamado por: moveRoleOf (golpes.js:53), conflitoDeItem (validacao_build_ia.js:121), updateMyBuildStatus (editor_build.js:354), categoriaDoGolpe (time_build.js:11)
- TATICA_ARCHETYPES:159 - chamado por: applySave (save.js:45), archetypeCardHtml (arquetipo.js:85)
- TYPES:9 - chamado por: computeBossAttackTypes (chefoes.js:156), confrontoMoveType (confronto.js:32), efeitoDasHabilidadesNoDuelo (duelo.js:1367), escolherProximoDoChefao (duelo.js:4187), lerDiversosDaFraseDuelo (duelo.js:560), +11
- USABLE_TYPES:142 - chamado por: computeSharedRisks (chefoes.js:118), fraquezasDoTipo (mono_run.js:80), resistemAoTipo (mono_run.js:83), applySave (save.js:45), perfilDefensivoDaEspecie (tipos.js:179), +2
- avisoSemSpriteHtml:206 - chamado por: fichaCabecalhoHtml (dex_ficha.js:469), linhaDaListaHtml (dex_lista.js:212)
- clampInt:113 - chamado por: applySave (save.js:45), limitarEvsAoJogo (validacao_build_ia.js:154), lerFormularioDoEditor (editor_build.js:446), updateMyBuildEvTotal (editor_build.js:324), updateMyBuildStatus (editor_build.js:354)
- descricaoDaEspecie:197 - chamado por: fichaCabecalhoHtml (dex_ficha.js:469)
- descricaoDaHabilidade:95 - chamado por: abilityCard (dex_ficha.js:14), lupaAbrir (lupa.js:34)
- descricaoDoGolpe:91 - chamado por: renderMovesTable (dex_ficha.js:111), lupaAbrir (lupa.js:34)
- getSpeciesBySname:79 - chamado por: confrontoFoesDe (chefoes.js:267), efeitoDasHabilidadesNoDuelo (duelo.js:1367), foeDeDuelo (duelo.js:3044), carryUserData (evolucao.js:167), devolveChainByX (evolucao.js:206), +10
- getSpeciesByX:78 - chamado por: effectiveBuild (builds.js:190), itensEmUsoComQuem (builds.js:141), teamItemsInUse (builds.js:85), teamMovesInUse (builds.js:111), teamRolesInUse (builds.js:153), +48
- habilidadesEscolhiveis:129 - chamado por: formFamilyPromptNote (formas_mega.js:46), habilidadeSubstitutaPara (reconciliar_build.js:26), reconciliarBuild (reconciliar_build.js:39), contextoDeValidacao (validacao_build_ia.js:182), validateAiBuild (validacao_build_ia.js:199), +3
- snameOf:80 - chamado por: applySave (save.js:45), xsToSnames (save.js:24)
- uniqueIds:132 - chamado por: nomesDeHabilidades (condicoes_habilidade.js:116), armadoresDeClima (duelo.js:3290), climaDoTimeDoChefao (duelo.js:3070), comHabilidadesDuelo (duelo.js:3526), foeDeDuelo (duelo.js:3044), +14

## regras/duelo.js
- DURACAO_LADO_DUELO:4046 - chamado por: motorGanhoDaCondicao (time_pelo_motor_papeis.js:37)
- STATUS_DUELO:213 - chamado por: podeTerStatus (condicoes_habilidade.js:128)
- acertosDoGolpeDuelo:86 - chama: MOVES (dados_base.js:11)
- aguentaUmGolpe:2237 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:132), pipelineLinhaDoGolpe (pipeline_build.js:169)
- armadoresDeClima:3290 - chama: CLIMAS_DO_CAMPO (campo.js:25), habilidadeArma (condicoes_habilidade.js:113), uniqueIds (dados_base.js:132) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:14)
- aterradoDuelo:833 - chama: abilityTypeModFor (tipos.js:196)
- bloqueiosNoDuelo:2736 - chamado por: pipelineLinhaDoGolpe (pipeline_build.js:169)
- camposLidosDaHabilidade:1689 - chama: ABILITIES (dados_base.js:10)
- climaDoTimeDoChefao:3070 - chama: habilidadeArma (condicoes_habilidade.js:113), ABILITY_ID_BY_NAME (confronto.js:17), getSpeciesByX (dados_base.js:78), uniqueIds (dados_base.js:132) | chamado por: simularOitavoGinasio (chefoes.js:494), pipelineResolverAlvo (pipeline_build.js:70), motorMontarLuta (time_pelo_motor.js:70)
- comHabilidadesDuelo:3526 - chama: uniqueIds (dados_base.js:132)
- conferirTimeComBuilds:3179 - chama: getActiveBuild (evolucao.js:16) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:310)
- danoDoFuturoDuelo:2748 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- danoNoDuelo:1989 - chama: CLIMA_OFICIAL (campo.js:49)
- efeitoDasHabilidadesNoDuelo:1367 - chama: CLIMAS_DO_CAMPO (campo.js:25), habilidadeArma (condicoes_habilidade.js:113), ABILITIES (dados_base.js:10), TYPES (dados_base.js:9), getSpeciesBySname (dados_base.js:79) | chamado por: podeTerStatus (condicoes_habilidade.js:128), pipelineSemRecuo (pipeline_build.js:467), pipelineTiposExtraDeStab (pipeline_build.js:403), validateAiBuild (validacao_build_ia.js:199)
- efeitoDoPlanoDuelo:3620 - chama: MOVES (dados_base.js:11)
- efetividadeNoDuelo:1929 - chama: TYPE_MOD_ABILITIES (tipos.js:75), abilityTypeModFor (tipos.js:196), typeMultiplier (tipos.js:244)
- entrarNoLadoDuelo:4111 - chama: typeMultiplier (tipos.js:244)
- escolherProximoDoChefao:4187 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- especieDaFormaDuelo:3571 - chama: SPECIES (dados_base.js:52)
- fDanoGlobalHell:3041 - chama: HELL_DANO_EXTRA_A_PARTIR_DA_INSIGNIA (chefoes.js:467), state (nucleo.js:8)
- foeDeDuelo:3044 - chama: calcFinalStat (calc_stat.js:160), ABILITY_ID_BY_NAME (confronto.js:17), MOVE_ID_BY_NAME (dados_base.js:87), getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), +2 | chamado por: simularOitavoGinasio (chefoes.js:494), pipelineResolverAlvo (pipeline_build.js:70), motorMontarLuta (time_pelo_motor.js:70)
- foesComBuffsDoGinasio:4275 - chamado por: pipelineResolverAlvo (pipeline_build.js:70), motorMontarLuta (time_pelo_motor.js:70)
- foesComRegraDeCampo:4300 - chamado por: pipelineResolverAlvo (pipeline_build.js:70), motorMontarLuta (time_pelo_motor.js:70)
- fracaoDormindoDuelo:2216 - chama: MOVES (dados_base.js:11)
- golpeDeRecargaDuelo:93 - chama: MOVES (dados_base.js:11)
- golpeUtilNoDuelo:107 - chama: MOVES (dados_base.js:11)
- golpesDeDueloAte:135 - chama: uniqueIds (dados_base.js:132) | chamado por: pipelineCandidatos (pipeline_build.js:627)
- golpesDeRecargaAte:128 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:132)
- golpesDeStatusAte:141 - chama: uniqueIds (dados_base.js:132)
- golpesNecessariosComPrimeiroDuelo:2229 - chamado por: pipelineAvaliarConjunto (pipeline_build.js:263), pipelineLinhaDoGolpe (pipeline_build.js:169)
- golpesNecessariosDuelo:2227 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:132)
- habilidadeSemRegraNoDuelo:1708 - chama: CLIMAS_DO_CAMPO (campo.js:25), habilidadeArma (condicoes_habilidade.js:113), ABILITIES (dados_base.js:10), TYPE_MOD_ABILITIES (tipos.js:75) | chamado por: pipelineHabilidadesSemRegra (pipeline_build.js:359)
- inicioDaLutaComBuffs:4321 - chamado por: motorMontarLuta (time_pelo_motor.js:70)
- itemDoDuelo:879 - chama: itemRuleFor (calc_stat.js:149), speciesTypeNames (tipos.js:254)
- itemDoSetDuelo:965 - chama: isMegaEvoKind (formas_mega.js:22), speciesTypeNames (tipos.js:254)
- ivDoJogadorDuelo:3082 - chama: HELL_IV_ZERO_A_PARTIR_DA_INSIGNIA (chefoes.js:468), state (nucleo.js:8)
- lerCampoDaFraseDuelo:797 - chama: DURACAO_CAMPO (campo.js:9), TERRENO_DO_TEXTO (campo.js:29)
- lerCondicaoDaFraseDuelo:366 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- lerDiversosDaFraseDuelo:560 - chama: DURACAO_CAMPO (campo.js:9), MOVE_ID_BY_NAME (dados_base.js:87), TYPES (dados_base.js:9)
- melhorUnidadeContra:3118 - chama: uniqueIds (dados_base.js:132) | chamado por: motorBuildDoCandidato (time_pelo_motor.js:124)
- meuComBuffsDoGinasio:4313 - chama: MOVES (dados_base.js:11) | chamado por: pipelineDuelarContraChefao (pipeline_build.js:851), motorSimular (time_pelo_motor.js:200), motorGanhoDaCondicao (time_pelo_motor_papeis.js:37), motorUnidadeNaLuta (time_pelo_motor_papeis.js:7)
- modoHellDuelo:212 - chama: state (nucleo.js:8)
- montarTimeContraChefaoEmPassos:4800 - chamado por: simularSemTravarATela (aba_chefoes.js:297)
- montarTimeNoClimaEmPassos:4668 - chama: CLIMA_OFICIAL (campo.js:49), ABILITY_ID_BY_NAME (confronto.js:17)
- nivelDoInimigoHell:3043 - chama: HELL_NIVEIS_EXTRAS (chefoes.js:464), HELL_NIVEIS_EXTRAS_A_PARTIR_DA_INSIGNIA (chefoes.js:465), state (nucleo.js:8)
- nomeHabDuelo:46 - chama: ABILITIES (dados_base.js:10) | chamado por: pipelineCandidatos (pipeline_build.js:627), pipelineHabilidadesSemRegra (pipeline_build.js:359)
- novoLadoDuelo:4050 - chama: CAMADAS_DE_HAZARD (campo.js:55) | chamado por: motorGanhoDaCondicao (time_pelo_motor_papeis.js:37)
- planoDoGolpeStatus:3322 - chama: HAZARD_DO_GOLPE (campo.js:56) | chamado por: pipelineGolpesDeStatusUteis (pipeline_build.js:527), motorCondicoes (time_pelo_motor_papeis.js:14)
- planosUteisDuelo:3390 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- poderDoDadoDuelo:2193 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- poderDoGolpeDuelo:458 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87)
- prepararGolpesDuelo:1757 - chama: CLIMA_OFICIAL (campo.js:49), MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- prioBloqueadaPelaHabilidadeDuelo:1743 - chamado por: pipelineAmeacasDePrioridade (pipeline_build.js:132)
- quatroGolpesDeDano:3142 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- removeHazardDuelo:3229 - chama: MOVES (dados_base.js:11)
- resultadoDoDuelo:2761 - chamado por: pipelineDuelo (pipeline_build.js:159), pipelineNotaDoSet (pipeline_build.js:517), motorGanhoDaCondicao (time_pelo_motor_papeis.js:37)
- resultadosDaLutaComHazard:3234 - chama: HAZARD_DO_GOLPE (campo.js:56), poeHazardNoLado (campo.js:58), MOVES (dados_base.js:11)
- resumoProvadoPeloSimulador:3164 - chama: MOVES (dados_base.js:11)
- semGolpesDeLadoDuelo:4776 - chamado por: motorTemGolpeDeLado (time_pelo_motor.js:229)
- semItemDuplicadoNoHell:3084 - chama: calcFinalStat (calc_stat.js:160)
- simularDuplaContraChefao:3835 - chama: poeHazardNoLado (campo.js:58) | chamado por: simularOitavoGinasio (chefoes.js:494), pipelineDuelarContraChefao (pipeline_build.js:851), motorSimular (time_pelo_motor.js:200)
- simularLutaContraChefao:4353 - chamado por: pipelineDuelarContraChefao (pipeline_build.js:851), motorSimular (time_pelo_motor.js:200)
- simularLutaDeVerdadeContraChefao:4362 - chama: hazardCheioNoLado (campo.js:57), poeHazardNoLado (campo.js:58), typeMultiplier (tipos.js:244)
- sinergiasDaEspecie:1320 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:132) | chamado por: pipelineSinergiasAtivas (pipeline_build.js:218), habilidadeSubstitutaPara (reconciliar_build.js:26), validateAiBuild (validacao_build_ia.js:199), buildSynergyHtml (dex_ficha.js:42), fichaConhecerHtml (dex_ficha.js:525)
- temHazardDuelo:4070 - chama: CAMADAS_DE_HAZARD (campo.js:55)
- temPrioridadeNoCampoDuelo:2283 - chamado por: pipelineLinhaDoGolpe (pipeline_build.js:169)
- textoHabDuelo:48 - chama: descricaoDeHabilidadePorId (condicoes_habilidade.js:88), expandirTextoDeHabilidade (condicoes_habilidade.js:99), ABILITIES (dados_base.js:10), LIDO_PELO_TEXTO_NOVO_DUELO (texto_versao_nova.js:156), TEXTO_DA_VERSAO_NOVA_DUELO (texto_versao_nova.js:9)
- tipoDoTextoDuelo:162 - chama: TYPES (dados_base.js:9)
- tiposNaBatalha:3036 - chama: speciesTypeNames (tipos.js:254)
- totalDePassosContraChefao:4799 - chamado por: simularSemTravarATela (aba_chefoes.js:297)
- trocaHazardsDosLadosDuelo:4072 - chama: CAMADAS_DE_HAZARD (campo.js:55)
- unidadeDaBuild:3192 - chama: ABILITY_ID_BY_NAME (confronto.js:17), MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: pipelineDuelarContraChefao (pipeline_build.js:851), pipelineNotaDoSet (pipeline_build.js:517), pipelineTabela (pipeline_build.js:232), motorUnidade (time_pelo_motor.js:190), motorGanhoDaCondicao (time_pelo_motor_papeis.js:37)
- unidadeDeDuelo:3094 - chama: calcFinalStat (calc_stat.js:160), uniqueIds (dados_base.js:132), innatesAtivasNoNivel (level_cap.js:34) | chamado por: motorItensCandidatos (time_pelo_motor.js:323)

## regras/evolucao.js
- carryUserData:167 - chama: getSpeciesBySname (dados_base.js:79), state (nucleo.js:8)
- devolveChainByX:206 - chama: getSpeciesBySname (dados_base.js:79), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:23)
- ehEvolucaoPraFrente:143 - chama: getSpeciesBySname (dados_base.js:79)
- evoluirElencoSemDuplicar:40 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:23)
- evolveChainByX:66 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL (dados_base.js:30), getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:23)
- getActiveBuild:16 - chamado por: effectiveBuild (builds.js:190), garantiaDoTime (condicoes_habilidade.js:141), conferirTimeComBuilds (duelo.js:3179), planoDeGravarSugestoes (sugestao_do_motor.js:39), motorBuildDoCandidato (time_pelo_motor.js:124), +5
- getBuildList:14 - chama: state (nucleo.js:8) | chamado por: acrescentarVarianteNaLista (lista_de_builds.js:23), buildQueSaiParaAbrirVaga (lista_de_builds.js:43), removerBuildDaLista (lista_de_builds.js:32), trocarBuildAtivaNaLista (lista_de_builds.js:11), gravarSugestoesDoMotor (sugestao_do_motor.js:61), +5
- logAutoAction:229 - chama: AUTO_LOG_MAX (save.js:37), state (nucleo.js:8) | chamado por: applySave (save.js:45), autoEvolveRoster (auto_evolucao.js:23), initProgress (progresso.js:111), processarRevisoes (revisao_automatica.js:23), registrarTrocasDoPlano (revisao_automatica.js:71), +1
- marcarRevisaoPosEvolucao:236 - chama: getSpeciesBySname (dados_base.js:79)
- podarAutoEvolved:61 - chama: getSpeciesByX (dados_base.js:78), state (nucleo.js:8) | chamado por: autoEvolveRoster (auto_evolucao.js:23)
- reconciliarBuildsDe:104 - chama: getSpeciesBySname (dados_base.js:79), reconciliarBuild (reconciliar_build.js:39), state (nucleo.js:8)
- reconciliarBuildsSalvas:148 - chama: state (nucleo.js:8) | chamado por: applySave (save.js:45)
- runTemAlgoPraZerar:247 - chama: state (nucleo.js:8) | chamado por: updateResetTeamBoxBtn (dex_ficha.js:702)

## regras/formas_mega.js
- MEGA_BASE_BY_X:21 - chamado por: effectiveBuild (builds.js:190)
- MEGA_PEDRAS_TARDIAS:94 - chamado por: etapaDaPedra (liberado_na_run.js:16)
- MEGA_UNLOCK_MILESTONE:92 - chamado por: etapaDaPedra (liberado_na_run.js:16)
- ROTULO_ETAPA_MEGA:99 - chamado por: avisosDaBuild (avisos_build.js:8)
- battleUnitsOf:185 - chamado por: bestBoxCandidateForBoss (chefoes.js:192), bestRankForm (chefoes.js:342), confrontoMelhorUnidade (chefoes.js:278), especiesQueResolvem (pipeline_build.js:868), motorCandidatosEmPassos (time_pelo_motor.js:160), +3
- etapaDaMega:104 - chama: etapaDaPedra (liberado_na_run.js:16)
- evioliteFunciona:32 - chamado por: pipelineEvioliteServe (pipeline_build.js:474), conflitoDeItem (validacao_build_ia.js:121)
- formFamilyOf:65 - chama: getSpeciesByX (dados_base.js:78) | chamado por: mudancaDeTipo (mono_run.js:95), applyRecommendedTeam (arquetipo.js:143), otherFormsHtml (ficha_extras.js:193)
- formFamilyPromptNote:46 - chama: ABILITIES (dados_base.js:10), habilidadesEscolhiveis (dados_base.js:129), rankDe (rank_da_run.js:29), speciesTypeNames (tipos.js:254)
- isMegaEvoKind:22 - chama: EVOKINDS (dados_base.js:13), EVO_MEGA_KINDS (dados_base.js:34), EVO_PRIMAL (dados_base.js:33) | chamado por: regraCasaComEspecie (calc_stat.js:139), itemDoSetDuelo (duelo.js:965), linhaEvolutivaDe (mono_run.js:20), motorRaizDaLinha (time_pelo_motor.js:106)
- isMegaForm:71 - chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:190), mudancaDeTipo (mono_run.js:95), megaStoneRuleFor (validacao_build_ia.js:18), validateAiBuild (validacao_build_ia.js:199), +3
- megaDaPedra:169 - chama: getSpeciesBySname (dados_base.js:79) | chamado por: confrontoFoesDe (chefoes.js:267), foeDeDuelo (duelo.js:3044), bossMonCardHtml (aba_chefoes.js:434)
- megaEvolutionUnlocked:93 - chama: state (nucleo.js:8)
- megaFormLiberada:109 - chama: state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), megaLockedTagHtml (ficha_extras.js:186), otherFormsHtml (ficha_extras.js:193)
- megaFormsOf:38 - chama: getSpeciesByX (dados_base.js:78) | chamado por: validateAiBuild (validacao_build_ia.js:199)
- megaMode:82 - chama: state (nucleo.js:8) | chamado por: motorChaveDoContexto (time_pelo_motor.js:123), motorSimular (time_pelo_motor.js:200), megaStoneRuleFor (validacao_build_ia.js:18), modoMotorChave (modo_motor.js:20), initProgress (progresso.js:111), +1
- megaSoNoDebug:110 - chamado por: megaLockedTagHtml (ficha_extras.js:186), otherFormsHtml (ficha_extras.js:193)
- quandoMega:112 - chamado por: avisosDaBuild (avisos_build.js:8), megaLockedTagHtml (ficha_extras.js:186), otherFormsHtml (ficha_extras.js:193)
- rotuloEtapaDaMega:113 - chamado por: megaLockedTagHtml (ficha_extras.js:186), otherFormsHtml (ficha_extras.js:193)
- stonesOf:175 - chamado por: megaStoneRuleFor (validacao_build_ia.js:18), validateAiBuild (validacao_build_ia.js:199)
- unitTypeMult:201 - chama: abilityTypeMod (tipos.js:173) | chamado por: bestBoxCandidateForBoss (chefoes.js:192), bossSafetyScore (chefoes.js:180), boxFitNote (resumo_luta.js:154)

## regras/golpes.js
- ehGolpeDePivo:41 - chama: MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: pipelineCandidatos (pipeline_build.js:627), pipelineComStatus (pipeline_build.js:544), pipelineGolpesDeStatusUteis (pipeline_build.js:527), pipelinePapeisDuplos (pipeline_build.js:582), conferirPapelDaBuild (validacao_build_ia.js:69)
- ehPrioridadeDeDano:49 - chama: MOVE_BY_NAME (dados_base.js:86)
- movePromptLine:28 - chama: MOVES (dados_base.js:11), TYPES (dados_base.js:9)
- moveRoleOf:53 - chama: MOVES (dados_base.js:11), MOVE_ID_BY_NAME (dados_base.js:87), SPLIT_STATUS (dados_base.js:29) | chamado por: avisosDaBuild (avisos_build.js:8), computeBossAttackTypes (chefoes.js:156), coberturaSugerida (confronto.js:196), confrontoDamagingMoves (confronto.js:29), avisoProximoLider (mono_run.js:158), +7

## regras/itens_do_time.js
- AI_ITEM_POOL:89 - chamado por: validateAiBuild (validacao_build_ia.js:199)
- itemDeTipoDoTime:102 - chamado por: motorItensCandidatos (time_pelo_motor.js:323)
- itemValidoNoTime:94 - chama: itemEsgotadoNoTime (builds.js:140), liberadoNaRun (liberado_na_run.js:23) | chamado por: motorFecharItens (time_pelo_motor.js:346), motorItensCandidatos (time_pelo_motor.js:323)
- itensDeEspeciePara:82 - chama: ITEMS (dados_base.js:12) | chamado por: validateAiBuild (validacao_build_ia.js:199)
- soExistentes:30 - chama: ITEMS (dados_base.js:12)

## regras/level_cap.js
- LEVEL_CAP_MODES:15 - chamado por: applySave (save.js:45), initProgress (progresso.js:111)
- NIVEL_DE_CALCULO_SEM_CAP:60 - chamado por: pipelineResolverAlvo (pipeline_build.js:70), validateAiBuild (validacao_build_ia.js:199)
- availableMovesFor:73 - chama: MOVES (dados_base.js:11), uniqueIds (dados_base.js:132), liberadoNaRun (liberado_na_run.js:23), state (nucleo.js:8) | chamado por: confrontoUnitOf (chefoes.js:242), comoGarantir (condicoes_habilidade.js:171), precisaDeSetter (condicoes_habilidade.js:213), pipelineCandidatos (pipeline_build.js:627), conferirPapelDaBuild (validacao_build_ia.js:69), +2
- capOuPadrao:61 - chamado por: contextoDoMotor (time_pelo_motor.js:96), modoMotorChave (modo_motor.js:20)
- getCurrentCap:49 - chama: state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), effectiveBuild (builds.js:190), ctxDoState (validacao_build_ia.js:10), arquivoDeSaveUi (arquivo_de_save.js:7), autoEvolveRoster (auto_evolucao.js:23), +10
- golpesTravadosNoCap:90 - chama: MOVE_ID_BY_NAME (dados_base.js:87), liberadoNaRun (liberado_na_run.js:23), state (nucleo.js:8) | chamado por: avisosDaBuild (avisos_build.js:8), processarRevisoes (revisao_automatica.js:23)
- innatesAtivasNoNivel:34 - chama: state (nucleo.js:8) | chamado por: unidadeDeDuelo (duelo.js:3094), pipelineCandidatos (pipeline_build.js:627)
- levelCapMode:16 - chama: state (nucleo.js:8) | chamado por: motorChaveDoContexto (time_pelo_motor.js:123), motorNivelDaEtapa (time_pelo_motor.js:64), arquivoDeSaveUi (arquivo_de_save.js:7), modoMotorChave (modo_motor.js:20), initProgress (progresso.js:111)
- levelCapModeFromDifficulty:22 - chamado por: applySave (save.js:45)
- nivelDaHabilidadeNoElite:40 - chama: nomesDeHabilidades (condicoes_habilidade.js:116) | chamado por: marcasDoRankHtml (dex_ficha.js:288)
- nivelDeCalculo:65 - chamado por: computeSpeedTiers (chefoes.js:545), montarTimeContraEsteChefao (aba_chefoes.js:310), renderBossDetail (aba_chefoes.js:534), myBuildEditorHtml (editor_build.js:230), updateMyBuildStatus (editor_build.js:354), +1

## regras/liberado_na_run.js
- entradasDoJogador:34 - chama: state (nucleo.js:8) | chamado por: applyRecommendedTeam (arquetipo.js:143), monoRunCardHtml (arquetipo.js:317)
- etapaDaPedra:16 - chama: MEGA_PEDRAS_TARDIAS (formas_mega.js:94), MEGA_UNLOCK_MILESTONE (formas_mega.js:92) | chamado por: avisosDaBuild (avisos_build.js:8), etapaDaMega (formas_mega.js:104)
- etapaDoItem:18 - chama: primeiroLugarDoItem (avisos_build.js:94) | chamado por: pipelineEvioliteServe (pipeline_build.js:474)
- liberadoNaRun:23 - chamado por: avisosDaBuild (avisos_build.js:8), itemValidoNoTime (itens_do_time.js:94), availableMovesFor (level_cap.js:73), golpesTravadosNoCap (level_cap.js:90), pipelineEvioliteServe (pipeline_build.js:474), +3
- xsDoJogador:38 - chamado por: contextoDoMotor (time_pelo_motor.js:96), candidatosDoJogador (aba_chefoes.js:250), modoMotorCapturados (modo_motor.js:25), modoMotorChave (modo_motor.js:20), modoMotorMontar (modo_motor.js:67)

## regras/lista_de_builds.js
- acrescentarVarianteNaLista:23 - chama: entradaDeBuild (builds.js:22), getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarSugestoesDoMotor (sugestao_do_motor.js:61), addBuildVariant (nucleo.js:96)
- buildQueSaiParaAbrirVaga:43 - chama: getBuildList (evolucao.js:14) | chamado por: abrirVagaPreservando (nucleo.js:113)
- removerBuildDaLista:32 - chama: getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: gravarSugestoesDoMotor (sugestao_do_motor.js:61), removeBuildIndex (nucleo.js:119)
- trocarBuildAtivaNaLista:11 - chama: entradaDeBuild (builds.js:22), getBuildList (evolucao.js:14), state (nucleo.js:8) | chamado por: setOrReplaceActiveBuild (nucleo.js:89)

## regras/mono_run.js
- MONO_MARCAS:11 - chamado por: monoRunCardHtml (arquetipo.js:317)
- avisoProximoLider:158 - chama: bossPartyPorDificuldade (chefoes.js:336), getRemainingBossEntries (chefoes.js:60), gymLeaderBaseName (chefoes.js:52), MOVE_BY_NAME (dados_base.js:86), TYPES (dados_base.js:9), +3 | chamado por: monoRunCardHtml (arquetipo.js:317)
- climaQueCombina:141 - chamado por: climaQueCombinaHtml (arquetipo.js:296)
- cobreFraquezas:88 - chama: abilityTypeMod (tipos.js:173)
- compraDeInicialTexto:47 - chama: getSpeciesBySname (dados_base.js:79) | chamado por: fichaCabecalhoHtml (dex_ficha.js:469)
- fraquezasDoTipo:80 - chama: USABLE_TYPES (dados_base.js:142), typeMultiplier (tipos.js:244) | chamado por: monoRunCardHtml (arquetipo.js:317)
- linhaEvolutivaDe:20 - chama: getSpeciesByX (dados_base.js:78), isMegaEvoKind (formas_mega.js:22)
- monoDisponibilidade:176 - chama: getSpeciesBySname (dados_base.js:79), rankDe (rank_da_run.js:29) | chamado por: monoRunCardHtml (arquetipo.js:317)
- monotypeAtivo:72 - chama: state (nucleo.js:8) | chamado por: montarTimeContraEsteChefao (aba_chefoes.js:310), renderBossDetail (aba_chefoes.js:534)
- mudancaDeTipo:95 - chama: formFamilyOf (formas_mega.js:65), isMegaForm (formas_mega.js:71), speciesTypeNames (tipos.js:254)
- orientacaoMono:144 - chama: ITEMS (dados_base.js:12)
- resistemAoTipo:83 - chama: USABLE_TYPES (dados_base.js:142), typeMultiplier (tipos.js:244)
- serveProMono:74 - chama: speciesTypeNames (tipos.js:254) | chamado por: bestBoxCandidateForBoss (chefoes.js:192), confrontoUnidadesDaCaixa (chefoes.js:298), especiesQueResolvem (pipeline_build.js:868), motorCandidatosEmPassos (time_pelo_motor.js:160), motorClassificar (time_pelo_motor_papeis.js:123), +2

## regras/pipeline_build.js
- ROTULO_FOCO_BUILD:771 - chamado por: sugestaoDoCartaoHtml (time_build.js:140)
- buildFocadaDoMotor:818 - chama: rankDe (rank_da_run.js:29), ctxDoState (validacao_build_ia.js:10) | chamado por: alternarFocoDoCartao (time_build.js:109)
- candidatosDeBuild:622 - chama: ctxDoState (validacao_build_ia.js:10) | chamado por: pipelineResultado (pipeline_tela.js:14)
- especiesQueResolvem:868 - chama: SPECIES (dados_base.js:52), getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:185), serveProMono (mono_run.js:74), rankDe (rank_da_run.js:29), +1 | chamado por: quemResolveCalcular (quem_resolve.js:22)
- pipelineAceitosDoFoco:800 - chama: conferirPapelDaBuild (validacao_build_ia.js:69)
- pipelineAmeacasDePrioridade:132 - chama: aguentaUmGolpe (duelo.js:2237), golpesNecessariosDuelo (duelo.js:2227), prioBloqueadaPelaHabilidadeDuelo (duelo.js:1743)
- pipelineAvaliarConjunto:263 - chama: golpesNecessariosComPrimeiroDuelo (duelo.js:2229)
- pipelineCandidatos:627 - chama: MOVES (dados_base.js:11), MOVE_BY_NAME (dados_base.js:86), uniqueIds (dados_base.js:132), golpesDeDueloAte (duelo.js:135), nomeHabDuelo (duelo.js:46), +6 | chamado por: motorBuildDoCandidato (time_pelo_motor.js:124)
- pipelineComStatus:544 - chama: ehGolpeDePivo (golpes.js:41), moveRoleOf (golpes.js:53), speciesTypeNames (tipos.js:254), contextoDeValidacao (validacao_build_ia.js:182), validateAiBuild (validacao_build_ia.js:199)
- pipelineContaCategorias:774 - chama: moveRoleOf (golpes.js:53)
- pipelineDuelarContraChefao:851 - chama: meuComBuffsDoGinasio (duelo.js:4313), simularDuplaContraChefao (duelo.js:3835), simularLutaContraChefao (duelo.js:4353), unidadeDaBuild (duelo.js:3192), motorMontarLuta (time_pelo_motor.js:70)
- pipelineDuelo:159 - chama: resultadoDoDuelo (duelo.js:2761)
- pipelineEspecie:61 - chama: getSpeciesBySname (dados_base.js:79)
- pipelineEvioliteServe:474 - chama: ITEMS (dados_base.js:12), evioliteFunciona (formas_mega.js:32), etapaDoItem (liberado_na_run.js:18), liberadoNaRun (liberado_na_run.js:23)
- pipelineGolpesComRecuo:460 - chama: MOVE_ID_BY_NAME (dados_base.js:87)
- pipelineGolpesDeStatusUteis:527 - chama: MOVE_ID_BY_NAME (dados_base.js:87), planoDoGolpeStatus (duelo.js:3322), ehGolpeDePivo (golpes.js:41), moveRoleOf (golpes.js:53)
- pipelineHabilidadesSemRegra:359 - chama: ABILITY_ID_BY_NAME (confronto.js:17), habilidadeSemRegraNoDuelo (duelo.js:1708), nomeHabDuelo (duelo.js:46)
- pipelineLinhaDoGolpe:169 - chama: aguentaUmGolpe (duelo.js:2237), bloqueiosNoDuelo (duelo.js:2736), golpesNecessariosComPrimeiroDuelo (duelo.js:2229), temPrioridadeNoCampoDuelo (duelo.js:2283)
- pipelineMontarConjunto:306 - chama: moveRoleOf (golpes.js:53)
- pipelineNotaDoSet:517 - chama: resultadoDoDuelo (duelo.js:2761), unidadeDaBuild (duelo.js:3192)
- pipelinePapeisDuplos:582 - chama: ehGolpeDePivo (golpes.js:41), conferirPapelDaBuild (validacao_build_ia.js:69)
- pipelineResolverAlvo:70 - chama: LUTAS_DA_RUN (chefoes.js:323), bossPartyPorDificuldade (chefoes.js:336), buffsAtivosDoChefao (chefoes.js:531), getRemainingBossEntries (chefoes.js:60), regraDeCampoDoChefao (chefoes.js:423), +6 | chamado por: motorBuildDoCandidato (time_pelo_motor.js:124)
- pipelineSemRecuo:467 - chama: ABILITY_ID_BY_NAME (confronto.js:17), uniqueIds (dados_base.js:132), efeitoDasHabilidadesNoDuelo (duelo.js:1367)
- pipelineSinergiasAtivas:218 - chama: sinergiasDaEspecie (duelo.js:1320)
- pipelineTabela:232 - chama: unidadeDaBuild (duelo.js:3192)
- pipelineTiposExtraDeStab:403 - chama: ABILITY_ID_BY_NAME (confronto.js:17), uniqueIds (dados_base.js:132), efeitoDasHabilidadesNoDuelo (duelo.js:1367)
- pipelineValidarRascunho:488 - chama: ITEMS (dados_base.js:12), contextoDeValidacao (validacao_build_ia.js:182), megaStoneRuleFor (validacao_build_ia.js:18), validateAiBuild (validacao_build_ia.js:199)

## regras/plano_build.js
- ESTILO_ROTULO:20 - chamado por: rotuloDaBuild (ficha_extras.js:157)
- ROTULOS_EV:21 - chamado por: evsToShowdownText (builds.js:70)
- curadaParaEstilo:160 - chamado por: effectiveBuild (builds.js:190), processarRevisoes (revisao_automatica.js:23)
- estiloDeEvs:37 - chamado por: effectiveBuild (builds.js:190)
- estiloDoRitmo:48 - chamado por: effectiveBuild (builds.js:190), processarRevisoes (revisao_automatica.js:23)
- evsTextoParaArray:24 - chamado por: processarRevisoes (revisao_automatica.js:23)
- golpesNoCap:123 - chamado por: effectiveBuild (builds.js:190), myBuildEditorHtml (editor_build.js:230)
- nivelDeEvolucaoDaForma:68 - chama: EVOKINDS (dados_base.js:13), EVO_LEVEL (dados_base.js:30) | chamado por: golpesFuturosDe (builds.js:167)
- nivelDoGolpe:56 - chama: MOVE_ID_BY_NAME (dados_base.js:87) | chamado por: golpesFuturosDe (builds.js:167)
- planoSaneado:107 - chamado por: entradaDeBuild (builds.js:22), anteriorSaneado (save.js:235), applySave (save.js:45)
- trocasEntreCaps:141 - chamado por: registrarTrocasDoPlano (revisao_automatica.js:71)

## regras/rank_da_run.js
- FORA_DO_RANK:10 - chamado por: rankBadgeHtml (dex_ficha.js:169), rankInfoLineHtml (dex_ficha.js:310)
- MOTIVO_FORA_DO_RANK_PT:17 - chamado por: rankBadgeHtml (dex_ficha.js:169), rankInfoLineHtml (dex_ficha.js:310)
- chaveDoRankDaDificuldade:23 - chama: TIER_DA_DIFICULDADE (chefoes.js:21)
- rankDaDificuldadeDe:69 - chamado por: marcasDoRankHtml (dex_ficha.js:288)
- rankDe:29 - chama: state (nucleo.js:8) | chamado por: bestBoxCandidateForBoss (chefoes.js:192), bestRankForm (chefoes.js:342), formFamilyPromptNote (formas_mega.js:46), monoDisponibilidade (mono_run.js:176), buildFocadaDoMotor (pipeline_build.js:818), +7

## regras/reconciliar_build.js
- habilidadeSubstitutaPara:26 - chama: habilidadesEscolhiveis (dados_base.js:129), sinergiasDaEspecie (duelo.js:1320)
- movepoolCompletoDe:17 - chama: MOVES (dados_base.js:11)
- reconciliarBuild:39 - chama: habilidadesEscolhiveis (dados_base.js:129) | chamado por: effectiveBuild (builds.js:190), reconciliarBuildsDe (evolucao.js:104)

## regras/save.js
- AUTO_LOG_MAX:37 - chamado por: logAutoAction (evolucao.js:229)
- anteriorSaneado:235 - chama: planoSaneado (plano_build.js:107)
- applySave:45 - chama: BUILD_SOURCES (builds.js:17), ARQUETIPOS_DE_CAMPO (campo.js:33), MONOTYPE_ARCHETYPES (dados_base.js:166), PACE_ARCHETYPES (dados_base.js:156), TATICA_ARCHETYPES (dados_base.js:159), +10 | chamado por: arquivoDeSaveUi (arquivo_de_save.js:7), loadSave (nucleo.js:332), aplicarSaveRemoto (sync.js:45)
- buildSave:295 - chamado por: montarArquivoDeSave (arquivo_de_save.js:25), arquivoDeSaveUi (arquivo_de_save.js:7), persist (nucleo.js:139), aplicarSaveRemoto (sync.js:45), connectSync (sync.js:179)
- conferirSomaDoSave:285 - chamado por: lerArquivoDeSave (arquivo_de_save.js:48), loadSave (nucleo.js:332), remotoComSomaErrada (sync.js:88)
- ehBackupDeTime:44 - chamado por: guardarTimeAnterior (aba_chefoes.js:268)
- montarSave:300 - chama: state (nucleo.js:8)
- reconciliouAoAplicar:40 - chamado por: loadSave (nucleo.js:332), aplicarSaveRemoto (sync.js:45)
- saveChegandoTemMenosProgresso:341 - chamado por: conflitoDeProgresso (sync.js:61)
- saveEnviavel:292 - chamado por: connectSync (sync.js:179), remotoComSomaErrada (sync.js:88)
- snamesToXs:15 - chama: SPECIES_BY_SNAME (dados_base.js:72) | chamado por: carregarTimeSalvo (time.js:231), renderSavedTeams (time.js:207)
- syncContentDiffers:355 - chamado por: connectSync (sync.js:179)
- xsToSnames:24 - chama: snameOf (dados_base.js:80) | chamado por: guardarTimeAnterior (aba_chefoes.js:268)

## regras/sugestao_do_motor.js
- SUGESTAO_ROTULO:11 - chamado por: buildChipsHtml (editor_build.js:219), rotuloDaBuild (ficha_extras.js:157), modoMotorFicarComVariante (modo_motor.js:118), modoMotorRodapeHtml (modo_motor.js:180), usarSugestaoDoCartao (time_build.js:123)
- gravarSugestoesDoMotor:61 - chama: entradaDeBuild (builds.js:22), getBuildList (evolucao.js:14), acrescentarVarianteNaLista (lista_de_builds.js:23), removerBuildDaLista (lista_de_builds.js:32), state (nucleo.js:8) | chamado por: modoMotorFicarComVariante (modo_motor.js:118), usarSugestaoDoCartao (time_build.js:123)
- planoDeGravarSugestoes:39 - chama: getActiveBuild (evolucao.js:16), getBuildList (evolucao.js:14) | chamado por: modoMotorFicarComVariante (modo_motor.js:118), usarSugestaoDoCartao (time_build.js:123)

## regras/texto_versao_nova.js
- LIDO_PELO_TEXTO_NOVO_DUELO:156 - chamado por: expandirTextoDeHabilidade (condicoes_habilidade.js:99), textoHabDuelo (duelo.js:48)
- TEXTO_DA_VERSAO_NOVA_DUELO:9 - chamado por: expandirTextoDeHabilidade (condicoes_habilidade.js:99), textoHabDuelo (duelo.js:48)

## regras/time_pelo_motor.js
- contextoDoMotor:96 - chama: capOuPadrao (level_cap.js:61), xsDoJogador (liberado_na_run.js:38), state (nucleo.js:8) | chamado por: modoMotorAquecer (modo_motor.js:39), modoMotorMontar (modo_motor.js:67)
- criarCacheDoMotor:56 - chamado por: modoMotorCache (modo_motor.js:18)
- montarTimePeloMotorEmPassos:385 - chama: SPECIES (dados_base.js:52), motorClassificar (time_pelo_motor_papeis.js:123), motorTextos (time_pelo_motor_papeis.js:146) | chamado por: modoMotorMontar (modo_motor.js:67)
- motorAquecerBuildsEmPassos:184 - chamado por: modoMotorAquecer (modo_motor.js:39)
- motorArred:53 - chamado por: motorClassificar (time_pelo_motor_papeis.js:123)
- motorBuildDoCandidato:124 - chama: ABILITIES (dados_base.js:10), MOVES (dados_base.js:11), melhorUnidadeContra (duelo.js:3118), getActiveBuild (evolucao.js:16), liberadoNaRun (liberado_na_run.js:23), +2
- motorCandidatosEmPassos:160 - chama: getSpeciesByX (dados_base.js:78), battleUnitsOf (formas_mega.js:185), serveProMono (mono_run.js:74)
- motorChaveDaBuild:120 - chamado por: motorAlternativasArmadoras (time_pelo_motor_papeis.js:82)
- motorChaveDoContexto:123 - chama: megaMode (formas_mega.js:82), levelCapMode (level_cap.js:16), state (nucleo.js:8) | chamado por: motorAlternativasArmadoras (time_pelo_motor_papeis.js:82)
- motorFecharItens:346 - chama: itemValidoNoTime (itens_do_time.js:94)
- motorGuardar:57 - chamado por: motorAux (time_pelo_motor_papeis.js:8)
- motorItensCandidatos:323 - chama: MOVES (dados_base.js:11), unidadeDeDuelo (duelo.js:3094), itemDeTipoDoTime (itens_do_time.js:102), itemValidoNoTime (itens_do_time.js:94), conflitoDeItem (validacao_build_ia.js:121)
- motorLutasDoContexto:81 - chama: LUTAS_DA_RUN (chefoes.js:323)
- motorMontarLuta:70 - chama: DIFF_TO_BOSSKEY (chefoes.js:25), bossPartyPorDificuldade (chefoes.js:336), buffsAtivosDoChefao (chefoes.js:531), regraDeCampoDoChefao (chefoes.js:423), climaDoTimeDoChefao (duelo.js:3070), +5 | chamado por: pipelineDuelarContraChefao (pipeline_build.js:851), motorLutaComClima (time_pelo_motor_papeis.js:34)
- motorNivelDaEtapa:64 - chama: levelCapMode (level_cap.js:16)
- motorRaizDaLinha:106 - chama: SPECIES (dados_base.js:52), isMegaEvoKind (formas_mega.js:22)
- motorSimular:200 - chama: meuComBuffsDoGinasio (duelo.js:4313), simularDuplaContraChefao (duelo.js:3835), simularLutaContraChefao (duelo.js:4353), megaMode (formas_mega.js:82), state (nucleo.js:8)
- motorTemGolpeDeLado:229 - chama: semGolpesDeLadoDuelo (duelo.js:4776)
- motorUnidade:190 - chama: unidadeDaBuild (duelo.js:3192) | chamado por: motorCondicoes (time_pelo_motor_papeis.js:14), motorUnidadeNaLuta (time_pelo_motor_papeis.js:7)

## regras/time_pelo_motor_papeis.js
- motorAlternativasArmadoras:82 - chama: liberadoNaRun (liberado_na_run.js:23), motorChaveDaBuild (time_pelo_motor.js:120), motorChaveDoContexto (time_pelo_motor.js:123)
- motorAux:8 - chama: motorGuardar (time_pelo_motor.js:57)
- motorClassificar:123 - chama: serveProMono (mono_run.js:74), motorArred (time_pelo_motor.js:53), state (nucleo.js:8) | chamado por: montarTimePeloMotorEmPassos (time_pelo_motor.js:385)
- motorCondicoes:14 - chama: ABILITY_ID_BY_NAME (confronto.js:17), MOVES (dados_base.js:11), armadoresDeClima (duelo.js:3290), planoDoGolpeStatus (duelo.js:3322), motorUnidade (time_pelo_motor.js:190)
- motorGanhoDaCondicao:37 - chama: DURACAO_LADO_DUELO (duelo.js:4046), meuComBuffsDoGinasio (duelo.js:4313), novoLadoDuelo (duelo.js:4050), resultadoDoDuelo (duelo.js:2761), unidadeDaBuild (duelo.js:3192)
- motorLutaComClima:34 - chama: motorMontarLuta (time_pelo_motor.js:70)
- motorPapeisDaEspecie:119 - chama: ROLE_LABEL_PT (dados_base.js:191)
- motorTextos:146 - chamado por: montarTimePeloMotorEmPassos (time_pelo_motor.js:385)
- motorUnidadeNaLuta:7 - chama: meuComBuffsDoGinasio (duelo.js:4313), motorUnidade (time_pelo_motor.js:190)

## regras/tipos.js
- TYPE_MOD_ABILITIES:75 - chamado por: efetividadeNoDuelo (duelo.js:1929), habilidadeSemRegraNoDuelo (duelo.js:1708)
- abilityTypeMod:173 - chamado por: computeSharedRisks (chefoes.js:118), unitTypeMult (formas_mega.js:201), cobreFraquezas (mono_run.js:88), renderTeamAnalysis (arquetipo.js:400)
- abilityTypeModFor:196 - chama: ABILITIES (dados_base.js:10) | chamado por: ameacaDe (confronto.js:91), coberturaSugerida (confronto.js:196), ofensaContra (confronto.js:59), aterradoDuelo (duelo.js:833), efetividadeNoDuelo (duelo.js:1929)
- alwaysActiveAbilities:164 - chamado por: confrontoUnitOf (chefoes.js:242)
- perfilDefensivoDaEspecie:179 - chama: USABLE_TYPES (dados_base.js:142) | chamado por: fichaEfetividadeHtml (dex_ficha.js:388)
- speciesTypeNames:254 - chama: TYPES (dados_base.js:9) | chamado por: confrontoUnitOf (chefoes.js:242), podeTerStatus (condicoes_habilidade.js:128), coberturaSugerida (confronto.js:196), ofensaContra (confronto.js:59), itemDoDuelo (duelo.js:879), +20
- typeMultiplier:244 - chamado por: efetividadeNoDuelo (duelo.js:1929), entrarNoLadoDuelo (duelo.js:4111), simularLutaDeVerdadeContraChefao (duelo.js:4362), avisoProximoLider (mono_run.js:158), fraquezasDoTipo (mono_run.js:80), +2

## regras/validacao_build_ia.js
- ITENS_CHOICE:95 - chamado por: avisosDaBuild (avisos_build.js:8)
- conferirPapelDaBuild:69 - chama: ehGolpeDePivo (golpes.js:41), availableMovesFor (level_cap.js:73) | chamado por: pipelineAceitosDoFoco (pipeline_build.js:800), pipelinePapeisDuplos (pipeline_build.js:582)
- conflitoDeItem:121 - chama: MOVE_BY_NAME (dados_base.js:86), SPLIT_STATUS (dados_base.js:29), evioliteFunciona (formas_mega.js:32), speciesTypeNames (tipos.js:254) | chamado por: avisosDaBuild (avisos_build.js:8), motorItensCandidatos (time_pelo_motor.js:323)
- conflitoDeNature:103 - chama: MOVE_BY_NAME (dados_base.js:86), NATURE_MODS (dados_base.js:100), moveRoleOf (golpes.js:53)
- contextoDeValidacao:182 - chama: buffsAtivosDoChefao (chefoes.js:531), habilidadesEscolhiveis (dados_base.js:129) | chamado por: pipelineComStatus (pipeline_build.js:544), pipelineValidarRascunho (pipeline_build.js:488)
- ctxDoState:10 - chama: getCurrentCap (level_cap.js:49), state (nucleo.js:8) | chamado por: buildFocadaDoMotor (pipeline_build.js:818), candidatosDeBuild (pipeline_build.js:622), especiesQueResolvem (pipeline_build.js:868), pipelineCandidatos (pipeline_build.js:627), pipelineResolverAlvo (pipeline_build.js:70)
- limitarEvsAoJogo:154 - chama: clampInt (dados_base.js:113)
- megaStoneRuleFor:18 - chama: isMegaForm (formas_mega.js:71), megaMode (formas_mega.js:82), stonesOf (formas_mega.js:175) | chamado por: avisosDaBuild (avisos_build.js:8), comoGarantir (condicoes_habilidade.js:171), pipelineValidarRascunho (pipeline_build.js:488), megaModeBuildNoteHtml (editor_build.js:174)
- regraItemConsumivelPara:51 - chama: ABILITIES (dados_base.js:10), uniqueIds (dados_base.js:132)
- validateAiBuild:199 - chama: MAX_MESMO_ITEM_NO_TIME (builds.js:138), itemEsgotadoNoTime (builds.js:140), itensEmUsoComQuem (builds.js:141), trimAndReallocateEvs (calc_stat.js:238), condicaoDaBuild (condicoes_habilidade.js:190), +21 | chamado por: pipelineComStatus (pipeline_build.js:544), pipelineValidarRascunho (pipeline_build.js:488)
