# Mapa do código

Gerado por `npm run mapa` (scripts/mapa_do_codigo.mjs); o pré-commit regenera quando há `src/` ou `scripts/` em staging.
Não edite à mão. Conflito de junção neste arquivo: regenere (`npm run mapa -- --rapido`) e adicione.
Uso: ache o arquivo aqui, depois abra só o trecho (`arquivo:linha`, offset/limit). Quem chama quem entre arquivos: [chamadas-regras](mapa/chamadas-regras.md), [chamadas-ui](mapa/chamadas-ui.md).

## Regras (lógica pura) - src/regras/
- **avisos_build.js** - Lote 5 das pesquisas de 06/10 (ideias do GPT, seções 3.2/17/26/42): Avisos de build e selo de
  avisosDaBuild:8, seloDaBuild:82, primeiroLugarDoItem:94, rotuloDaEtapaDoItem:98, ondeAcharItemTexto:100
- **builds.js** - Build mostrada (effectiveBuild: salva > herdada da base pela Mega > curada do
  entradaDeBuild:22, stripNote:44, showdownName:49, showdownSet:53, evsToShowdownText:70, teamItemsInUse:85, contaNoTime:109, teamMovesInUse:111, itemEsgotadoNoTime:140, itensEmUsoComQuem:141, teamRolesInUse:153, golpesFuturosDe:167, effectiveBuild:190, computeTeamGenerationValidation:228
- **calc_stat.js** - Fórmula de status final (base+IV+EV+nível+nature+item) e o que deriva
  especiePorNomeDoItem:135, regraCasaComEspecie:139, itemRuleFor:149, calcFinalStat:160, minEvSameStat:200, nextEvBreakpoint:210, priorityOrderForEvs:235, trimAndReallocateEvs:238
- **campo.js** - TK-16 (campo, fase 1): FONTE ÚNICA do vocabulário de clima, terreno, telas e hazards, e das durações de campo.
  rotuloDoArquetipoDeCampo:46, hazardCheioNoLado:57, poeHazardNoLado:58
- **chefoes.js** - Chefões e a próxima luta: o que falta vencer, variante por dificuldade,
  gymLeaderBaseName:55, classeDoCabecalhoDoChefao:57, getRemainingBossEntries:63, computeSharedRisks:121, bossSpeedSummary:144, computeBossAttackTypes:159, bossSafetyScore:183, bestBoxCandidateForBoss:195, confrontoUnitOf:245, confrontoFoesDe:270, confrontoMelhorUnidade:281, confrontoMinhasUnidades:291, confrontoUnidadesDaCaixa:301, confrontoParaParty:310, bossPartyPorDificuldade:339, bestRankForm:345, nextFightCx:363, varianteDoChefao:370, gymSkillsSummaryFor:379, regraDeCampoDoChefao:426, comportamentoDaIADoChefao:459, habilidadesExtrasDoHell:476, regrasDoHell:477, ehRevancheDeLider:486, simularOitavoGinasio:497, buffsParaMostrarDoChefao:522, buffsAtivosDoChefao:534, computeSpeedTiers:548, planoDaLuta:568, resumoDaLuta:581 (+3)
- **condicoes_habilidade.js** - Habilidade que só funciona numa condição do PRÓPRIO Pokémon (status,
  descricaoDeHabilidade:77, descricaoDeHabilidadePorId:88, expandirTextoDeHabilidade:99, habilidadeArma:113, nomesDeHabilidades:116, podeTerStatus:128, garantiaDoTime:141, garantiaDaCondicao:155, comoGarantir:171, condicaoDaBuild:190, precisaDeSetter:213, blocoCondicoesIA:238
- **confronto.js** - Motor de confronto: dado o time do jogador e o time de um chefão, diz quem
  confrontoDamagingMoves:29, confrontoMoveType:32, foeAbilityIds:36, foeFromBossMember:49, ofensaContra:59, ameacaDe:91, velocidadeBase:114, confrontoDuelo:126, confrontoTime:146, coberturaSugerida:196, confrontoDuelosDe:243, valorDoTime:249, melhoresTrocas:265, cuidadosDoChefao:302, aberturaEmDupla:319
- **dados_base.js** - Tabelas derivadas dos dados do jogo (tipos, golpes, espécies, rótulos conferidos, naturezas) e utilitários puros.
  dataLabel:23, getSpeciesByX:78, getSpeciesBySname:79, snameOf:80, clampInt:103, habilidadesEscolhiveis:119, uniqueIds:122, descricaoDaEspecie:187, semSpriteOficial:193, avisoSemSpriteHtml:196
- **duelo.js** - Simulador de duelo 1x1 contra Pokémon reais de chefão - o motor do rank
  nomeHabDuelo:46, textoHabDuelo:48, bonusDeGolpeLidoDoTextoDuelo:85, acertosDoGolpeDuelo:86, golpeDeRecargaDuelo:93, golpeUtilNoDuelo:107, categoriaNoDuelo:119, temContatoDuelo:125, golpesDeRecargaAte:128, golpesDeDueloAte:135, golpesDeStatusAte:141, tipoDoTextoDuelo:162, fraseFixaDuelo:167, categoriasDoTextoDuelo:184, categoriasDoGolpeDuelo:187, modoHellDuelo:212, statusDoTrechoDuelo:271, presencaDoStatus:278, todosOsStatusDuelo:284, lerStatusDaFraseDuelo:289, chanceDoEstagioCrit:339, lerCriticoDaFraseDuelo:340, lerCondicaoDaFraseDuelo:366, estagioDoTexto:395, multDoEstagio:396, lerEstagioDaFraseDuelo:398, poderDoGolpeDuelo:458, lerExtrasDaFraseDuelo:460, lerCuraDaFraseDuelo:514, filtroDoTextoDuelo:547 (+159)
- **evolucao.js** - Builds salvas por espécie, registro "O que o app fez sozinho" e o que acontece
  getBuildList:14, getActiveBuild:16, evoluirElencoSemDuplicar:40, podarAutoEvolved:61, evolveChainByX:66, reconciliarBuildsDe:104, restaurarAnteriorPara:129, ehEvolucaoPraFrente:143, reconciliarBuildsSalvas:148, carryUserData:167, devolveChainByX:206, logAutoAction:229, marcarRevisaoPosEvolucao:236, runTemAlgoPraZerar:247
- **formas_mega.js** - Família de formas (base <-> mega), modo de Mega Evolução, pedras e unidades de batalha.
  isMegaEvoKind:22, evoluiAinda:27, evioliteFunciona:32, megaFormsOf:38, formFamilyPromptNote:46, megaModePromptLine:60, formFamilyOf:65, isMegaForm:71, megaMode:82, megaEvolutionUnlocked:93, rotuloDaEtapaDaMegaLiberada:102, etapaDaMega:104, megaFormLiberada:109, megaSoNoDebug:110, quandoMega:112, rotuloEtapaDaMega:113, battleFamilyOf:132, usableSpeciesFor:135, megaPromptBlock:139, megaDaPedra:169, stonesOf:175, battleUnitsOf:185, unitTypeMult:201
- **golpes.js** - O que cada golpe faz (papel pelo efeito real) e como descrevê-lo pra IA.
  dadoExterno:19, movePromptLine:28, ehGolpeDePivo:41, ehPrioridadeDeDano:49, moveRoleOf:53
- **itens_do_time.js** - UMA lista de itens para o set do duelo (itemDoSetDuelo), o Modo Motor (time_pelo_motor.js) e a validação de build (
  soExistentes:30, itensDeEspeciePara:82, itemValidoNoTime:94, itensDoTime:98, itemDeTipoDoTime:102
- **level_cap.js** - Level cap atual e golpes liberados por ele.
  levelCapMode:16, levelCapModeFromDifficulty:22, innatesAtivasNoNivel:34, nivelDaHabilidadeNoElite:40, innatesTravadasNoNivel:44, getCurrentCap:49, capOuPadrao:61, nivelDeCalculo:65, availableMovesFor:73, golpesTravadosNoCap:90
- **liberado_na_run.js** - O que a run libera: UMA função pura (etapa, levelCap, alvo) -> boolean para pedra mega, item e
  etapaDaPedra:16, etapaDoItem:18, liberadoNaRun:23, entradasDoJogador:34, xsDoJogador:38
- **lista_de_builds.js** - As 4 mudanças na lista de builds salvas de uma espécie (state.customBuilds[sname],
  trocarBuildAtivaNaLista:11, acrescentarVarianteNaLista:23, removerBuildDaLista:32, buildQueSaiParaAbrirVaga:43, liberarVagaNaLista:51
- **mono_run.js** - Mono run: o que dá pra pegar do seu tipo até a etapa atual (2026-09-26,
  linhaEvolutivaDe:20, compraDeInicialTexto:47, monotypeAtivo:72, serveProMono:74, fraquezasDoTipo:80, resistemAoTipo:83, cobreFraquezas:88, mudancaDeTipo:95, pctClima:133, climaQueCombina:141, orientacaoMono:144, avisoProximoLider:158, monoDisponibilidade:176
- **pipeline_build.js** - Pipeline de build com intenção (ticket 20 da dívida, desenho de 14/10/2026; docs/pipeline_de_build.md).
  pipelineEspecie:61, pipelineResolverAlvo:70, pipelineAmeacasDePrioridade:132, pipelineSemFuga:158, pipelineDuelo:159, pipelineLinhaDoGolpe:169, pipelineTierDaLinha:208, pipelineChaveDaLinha:213, pipelineSinergiasAtivas:218, pipelinePesoDoGolpe:223, pipelinePesoDoConjunto:226, pipelineTabela:232, pipelineValorDoGolpe:258, pipelineAvaliarConjunto:263, pipelineMontarConjunto:306, pipelineHabilidadesSemRegra:359, pipelineTierDoCandidato:367, pipelineVelocidade:370, pipelineMotivos:376, pipelineTiposExtraDeStab:403, pipelineSplitDoConjunto:418, pipelineNaturezaServe:428, pipelineAtributoFraco:432, pipelineNaturezaEEvs:438, pipelineGolpesComRecuo:452, pipelineSemRecuo:459, pipelineEvioliteServe:466, mesclarContextos:472, pipelineValidarRascunho:480, pipelinePapeisDuplos:509 (+7)
- **plano_build.js** - Build que acompanha o jogador: plano de golpes por slot, estilo da build e
  evsTextoParaArray:24, estiloDeEvs:37, estiloDoRitmo:48, nivelDoGolpe:56, nivelDeEvolucaoDaForma:68, validarPlano:80, planoSaneado:107, golpesNoCap:123, trocasEntreCaps:141, curadasDe:153, curadaParaEstilo:160
- **rank_da_run.js** - Rank v2 (2026-10-02, modelo aprovado pelo usuário - scripts/calcular_rank_v2.mjs):
  chaveDoRankDaDificuldade:23, rankDe:29, dominantesNoTipo:51, rankDaDificuldadeDe:69
- **reconciliar_build.js** - Uma build salva precisa continuar valendo pra espécie em que ela está AGORA.
  movepoolCompletoDe:17, habilidadeSubstitutaPara:26, reconciliarBuild:39
- **save.js** - Save do app: formato gravado (buildSave), leitura defensiva (applySave e os
  snamesToXs:15, xsToSnames:24, ehBackupDeTime:48, applySave:49, anteriorSaneado:239, sanitizarStrategySets:258, textoCanonicoDoSave:304, somaDoSave:319, conferirSomaDoSave:329, saveEnviavel:336, buildSave:339, montarSave:344, progressoDoSave:380, saveChegandoTemMenosProgresso:386, syncContentDiffers:400
- **sugestao_do_motor.js** - "Ficar com este time" do Meu Time (ticket time-pelo-motor/01, F5, 21/10/2026): além de trocar o time, grava as builds do
  sugestaoDoMembro:13, sugestaoMesmaBuild:24, ehBuildDoJogador:28, indiceQueSaiParaSugestao:31, planoDeGravarSugestoes:39, gravarSugestoesDoMotor:61
- **texto_versao_nova.js** - Texto da habilidade que o parser do duelo lê (tabelas de dado, saídas de duelo.js em 28/10/2026, TK-12 estrutura D4.5b).
- **time_pelo_motor.js** - Modo Motor do Meu Time (ticket time-pelo-motor/01, Fase C, 21/10/2026): monta o time SEM IA, só pelo simulador.
  motorMedia:52, motorArred:53, criarCacheDoMotor:56, motorGuardar:57, motorNivelDaEtapa:64, motorMontarLuta:70, motorLutasDoContexto:81, motorValorDoObjetivo:92, contextoDoMotor:96, motorRaizDaLinha:106, motorChaveDaBuild:120, motorChaveDoContexto:123, motorBuildDoCandidato:124, motorSecar:159, motorCandidatosEmPassos:160, motorCandidatos:182, motorAquecerBuildsEmPassos:184, motorUnidade:190, motorSimular:200, motorEhMeu:216, motorAvaliar:217, motorMetricas:220, motorTemGolpeDeLado:229, motorBuscar:230, motorBuscarEmPassos:231, motorPlanoB:284, motorItensCandidatos:323, motorComItem:340, motorFecharItens:346, montarTimePeloMotor:383 (+1)
- **time_pelo_motor_papeis.js** - Modo Motor do Meu Time, Fase D (papéis por build, tags, sinergia e explicação). Carrega depois de time_pelo_motor.js (mesmo escopo).
  motorUnidadeNaLuta:7, motorAux:8, motorLutasDeProva:9, motorAssinaturaDasLutas:10, motorCondicoes:14, motorLutaComClima:34, motorGanhoDaCondicao:37, motorSinergia:67, motorAlternativasArmadoras:82, motorExtrasDeSinergia:100, motorPapeisDaEspecie:119, motorClassificar:123, motorTextos:146, motorTextosDaClassificacao:159
- **tipos.js** - Tabela de efetividade de tipos, habilidades que alteram dano recebido por tipo e tipagem de espécie.
  alwaysActiveAbilities:164, abilityTypeMod:173, perfilDefensivoDaEspecie:179, abilityTypeModFor:196, typeMultiplier:244, speciesTypeNames:254
- **validacao_build_ia.js** - Validação da build sugerida pela IA contra o dado real.
  ctxDoState:10, completarCtx:11, megaStoneRuleFor:18, ehBerry:44, itemSeGastaNaLuta:45, regraItemConsumivelPara:51, papelNormalizado:65, conferirPapelDaBuild:69, conflitoDeNature:103, conflitoDeItem:121, citarDoModelo:143, evsEmFormatoValido:147, limitarEvsAoJogo:154, contextoDeValidacao:182, validateAiBuild:199

## Interface - src/ui/
- **aba_chefoes.js** - Aba Chefões: lista, time do chefão por dificuldade, buffs de ginásio e exportação.
  initBosses:33, getFilteredBosses:148, nomeDaCategoriaDeChefao:175, campoDoChefaoHtml:178, opcionalHtml:185, iaDoChefaoHtml:190, hellDoChefaoHtml:199, bossCatColor:209, renderBossList:211, candidatosDoJogador:247, mesmoConjunto:264, guardarTimeAnterior:265, simularSemTravarATela:294, montarTimeContraEsteChefao:307, selectBoss:375, renderGymSkillsCardHtml:394, bossMonCardHtml:431, renderBossDetail:527
- **abas.js** - Navegação entre abas (e o redesenho da aba que abre).
  posicionarProgresso:22, closeMorePanel:32
- **arquetipo.js** - Arquétipo do time, time sugerido e o Gerador Inteligente de Times.
  teamKeyFor:14, classeDeEntradaDoCardGerado:41, archetypeChipsHtml:53, resumoDoArquetipo:74, archetypeCardHtml:85, applyRecommendedTeam:143, vereditoDaLutaHtml:199, buffsMudaram:208, planoContraChefaoHtml:212, generatedTeamCardHtml:261, renderTeamStrategy:283, climaQueCombinaHtml:296, monoRunCardHtml:317, renderMonoRun:374, renderTeamAnalysis:400
- **auto_evolucao.js** - Registro "O que o app fez sozinho" na tela e a auto-evolução do time/caixa pelo level cap.
  renderAutoLog:9, autoEvolveRoster:20
- **caixa.js** - Aba Caixa (PC Box): grade por páginas, busca e ações de cada Pokémon da caixa.
  renderBox:16
- **dex_ficha.js** - Dex: ficha do Pokémon (stats, habilidades, golpes, rank, evolução) e o agendamento do resumo do topo.
  abilityCard:14, buildSynergyHtml:42, conditionMoveSynergyNoteHtml:70, evoConditionText:88, renderMovesTable:111, rankBadgeHtml:169, rankStageBadgeHtml:203, roleTagsHtml:215, howToObtainText:236, whereToFindText:266, badgeDeTierHtml:284, marcasDoRankHtml:288, rankInfoLineHtml:310, goToDexSpecies:354, fichaStatsHtml:378, fichaEfetividadeHtml:388, fichaNavHtml:400, fichaEvolucaoHtml:411, fichaFormasHtml:429, fichaComoObterHtml:451, fichaCabecalhoHtml:469, fichaConhecerHtml:525, fichaGolpesHtml:545, fichaNotasHtml:556, selectSpecies:564, scheduleDashboardRefresh:688, updateResetTeamBoxBtn:702
- **dex_lista.js** - Dex: filtro de tipo, busca, ordenação, lista em lotes e o modal de troca do time.
  moveListboxCursor:118, bst:152, statPct:163, statTier:164, getFiltered:171, linhaDaListaHtml:212, renderMaisLista:232, renderList:243, preencherListaSeCurta:283, syncRowAddButtons:313, openSwapModal:328, closeSwapModal:367, openConfirmModal:403, closeConfirmModal:411, esconderToast:437, agendarToast:451, flashToast:473
- **editor_build.js** - Formato Showdown, cópia e o editor "Meu build" da ficha.
  copyText:11, itemDescHtml:45, hpEvEfficiencyNote:83, evBreakpointNote:116, buildEvNotesHtml:141, buildNoteHtml:155, buildContextNotesHtml:161, seloDaBuildHtml:168, megaModeBuildNoteHtml:174, buildEntryHtml:182, buildChipsHtml:212, myBuildEditorHtml:223, updateMyBuildEvTotal:322, updateMyBuildStatus:352, wireMyBuildEditor:416, lerFormularioDoEditor:444, apagarBuildComDesfazer:467
- **ficha_extras.js** - Ficha: comparar builds, anotações, histórico de builds e builds de referência dos chefões.
  compareCardHtml:14, compareResultHtml:22, notesCardHtml:78, buildHistoryHtml:87, bossReferenceHtml:103, rotuloDaBuild:170, planoDaBuildHtml:179, megaLockedTagHtml:199, otherFormsHtml:206
- **insignias_faixa.js** - Faixa de Etapa no cabeçalho (fatia 1 do visual "Carteira de Treinador", 07/11/2026).
  insigniaSvgHtml:38, etapaNomeCurto:42, etapaPara:46, renderFaixaEtapa:54
- **modo_motor.js** - Modo Motor no Meu Time (ticket time-pelo-motor/01, Fase F2, 21/10/2026). O app NÃO usa IA (decisão do usuário, 06/11/2026):
  modoMotorCache:18, modoMotorChave:20, modoMotorCapturados:25, modoMotorFavoritosValidos:30, modoMotorSegundos:34, modoMotorEsperar:35, modoMotorAquecer:39, modoMotorMontar:67, modoMotorVarianteDe:117, modoMotorFicarComVariante:118, modoMotorFavoritosHtml:151, modoMotorBotaoHtml:163, modoMotorMembroHtml:168, modoMotorRodapeHtml:180, modoMotorVarianteHtml:195, modoMotorResultadoHtml:223
- **nucleo.js** - Estado do app (state), gravação no aparelho e a camada de ações (acao/TELAS): toda mudança grava uma vez e redesenha cada tela uma vez.
  lsGet:84, lsSet:85, setOrReplaceActiveBuild:94, addBuildVariant:101, setActiveBuildIndex:104, abrirVagaPreservando:118, removeBuildIndex:124, reinserirBuild:131, persist:144, showStorageBanner:166, abaAtiva:184, redesenharFichaAberta:197, telasDeBuild:237, acao:243, fichaAfetada:261, concluirAcoes:266, loadA11yPrefs:285, applyA11yPrefs:291, saveA11yPrefs:295, corDoTema:307, loadSave:337
- **pipeline_tela.js** - Pipeline de build na tela (ticket docs/tickets/pipeline-build-2026-10-14/02): só desenho. As regras (candidatos, hit-kill,
  pipelineResultado:14, pipelineAlvoValido:26, pipelineSeletorDeAlvoHtml:32, pipelineResumoDoAlvo:46, pipelineVereditoDe:53, pipelineSeloHtml:63, pipelineGolpeHtml:71, pipelineCandidatoHtml:77, pipelinePainelDaFichaHtml:96, pipelineDesenharFicha:113, pipelineDesenharTime:125
- **progresso.js** - Aba Progresso: dificuldade, level cap, insígnia, modo de Mega, confirmação da run e acessibilidade.
  renderRunStatus:9, renderCapBadge:17, renderCapDisplay:22, renderProgressTrail:31, renderChangelog:93, initProgress:106
- **quem_resolve.js** - "Quem derruba este chefão" (ticket docs/tickets/pipeline-build-2026-10-14/04): o caso B do pipeline (especiesQueResolvem,
  quemResolveEstadoDe:14, quemResolveChave:17, quemResolveEmCache:21, quemResolveCalcular:22, quemResolveOrigemHtml:37, quemResolveItemHtml:43, quemResolveListaHtml:50, quemResolvePreencher:66, quemResolveCardHtml:83, quemResolveRestaurar:103
- **resumo_luta.js** - Confronto e resumo da próxima luta (card do chefão, resumo do topo da Dex, card no fim do Time).
  confrontoMultTxt:11, confrontoNomesTxt:12, confrontoCelulaHtml:15, confrontoResumoTxt:25, trocaBuracosTxt:40, confrontoAjustesHtml:44, confrontoPlanoHtml:67, bossConfrontoHtml:96, dashboardConfrontoHtml:135, boxFitNote:154, megaOfNote:175, renderDashboard:183, nextFightDetailHtml:215, renderNextFightCard:257
- **revisao_automatica.js** - Revisão automática das builds do time (evolução, com a curada da forma nova, sem IA) e as trocas do plano ao mudar o cap.
  tarefaDeRevisao:13, processarRevisoes:23, registrarTrocasDoPlano:71, agendarRevisoes:91
- **sync.js** - Sincronização entre aparelhos (capability db) e os avisos de sync.
  aplicarSaveRemoto:45, conflitoDeProgresso:61, remotoComSomaErrada:88, pushToSync:96, showSyncBanner:105, syncBannerOffset:119, atualizarTituloDoSubtitulo:139, setSyncStatusIndicator:143, scheduleSyncRetry:162, lerSaveLocal:174, connectSync:179
- **time.js** - Aba Time: cards dos membros, troca com a caixa, times salvos e "Novo jogo".
  carimboEtapaHtml:9, renderTeam:17, swapPanelHtml:124, telasDeElenco:150, rosterMove:158, teamsMatch:179, htmlDoCartaoDoTimeSalvo:188, renderSavedTeams:207, carregarTimeSalvo:231, excluirTimeSalvo:259, comecarRenomearTimeSalvo:277, salvarNomeTimeSalvo:283, zerarRun:342
- **time_build.js** - Painel da build no cartão do Meu Time (fatia 2b, 07/11/2026). Só desenha dados que já existem:
  categoriaDoGolpe:11, evsDaBuild:16, evsBarrasHtml:22, golpesBuildHtml:30, habilidadesBuildHtml:43, itemBuildHtml:53, avisoEnxutoHtml:64, painelDaBuildHtml:72, semBuildHtml:85, papelChipsHtml:89, sugestaoDoCartaoVale:104, alternarFocoDoCartao:109, membroDaSugestao:120, usarSugestaoDoCartao:123, sugestaoDoCartaoHtml:140
- **tipos.js** - Aba Tipos: tabela de efetividade, velocidades e compêndio de papéis.
  renderTypeMatrix:9, renderSpeedTiers:35, wireSpeedTiersOnce:63, computeRoleCompendium:91, renderRoleCompendium:113

## Scripts (.mjs) - scripts/
- **alarme_upstream.mjs** - Alarme de versão nova do Elite Redux (2026-09-24, pedido do usuário: "faz o
  ultimaVersaoDoDex:35, versaoDaPaginaDeDownload:43, hashDoConteudo:50, baixar:55, main:76
- **atualizar_de_config.mjs** - Atualiza data/gameData.json a partir do er-config (código/config do jogo é a verdade).
  saida:10, desescapar:14, parse:23, ler:41, enumMap:42, idx:49, porId:54
- **build.mjs** - Montagem do artifact_final.html em Node (fase 8 da refatoração, 2026-09-24).
  ler:21, trocarTudo:24, falhar:25
- **cache_sabotagem.mjs** - Cache de "arquivo lembrado" da sabotagem (tests/.sabotagem_cache.json, fora do git).
  mesclarCache:9, ler:18, gravarCacheMesclando:26
- **calcular_rank_v2.mjs** - Rank v2 (modelo aprovado pelo usuário em 2026-10-02, depois da pesquisa de método):
  capDe:41, foe:45, ARG:61, etapaDe:64, br:67, avaliar:74, lerTxt:158, notas:213
- **carimbo_derivado.mjs** - TK-24: grava em data/carimbo_derivados.json de que versão do jogo/config cada derivado foi gerado.
  carimbarDerivado:4, avisosDeFrescor:15, pendentesSemCarimbo:22, problemasDeCarimbo:27
- **categorias_pela_config.mjs** - Categorias de golpe (soco, mordida, corte...) pelas FLAGS do jogo, não pelo texto da NextDex.
  lerGolpesDaConfig:37, recuoDoEfeito:65, categoriasDasFlags:71
- **checar_css.mjs** - Travas dos tokens de CSS (fase 7 da refatoração, 2026-09-24). Roda no
  bloco:20, declaracoes:30
- **checar_encoding.mjs** - Trava de codificação (fase 1 da refatoração, 2026-09-24). Origem: no mesmo dia
  ch:24, problemasDeEncoding:28
- **checar_fronteira.mjs** - Trava de fronteira do bundle (ADR-004 em docs/decisoes_arquitetura.md, 2026-10-02).
  ler:14, soCodigo:16, funcoes:18
- **checar_paralelo.mjs** - Entrada de `npm run check`: roda as checagens em paralelo (ticket 04, 14/10/2026).
- **checar_paralelo_lib.mjs** - Biblioteca das checagens em paralelo (a entrada é scripts/checar_paralelo.mjs) (ticket 04 do fluxo 14/10/2026).
  BIN:13, separarArgumentos:35, resolverComando:41, lancar:50, executarChecagens:81, encerrarFilhos:100, main:109
- **checar_sintaxe.mjs** - Checagem de sintaxe sem dependências (fase 1 da refatoração, 2026-09-24):
- **checkpoint.mjs** - Salva o trabalho parado de um worktree de ticket: `git add -A` + commit "WIP: <motivo>".
  git:18, montarMensagem:23, checkpoint:31
- **conferir_chefoes_config.mjs** - Confere os times dos chefões do bosses.json contra a config oficial do jogo
  lerTreinadores:14, constante:41, semPrefixo:43, mapasDoDado:48, usarMapas:55, compararMon:57, conferir:74, preencherItensPerdidos:100, corrigirTimes:121
- **diff_versoes.mjs** - Diff entre duas versões do gameData do NextDex, com análise de impacto
  lerGameData:20, igual:25, compararLista:28, compararVersoes:53, impacto:67, lista:106, formatarRelatorio:113, arquivar:130, lerDadosDoApp:139
- **encalhados.mjs** - Lista o trabalho encalhado: worktrees com mudança sem commit, staging na pasta principal
  git:13, normalizarCaminho:22, lerWorktrees:27, lerStatus:45, avaliarAlertas:66, idade:77, formatarRelatorio:84, coletar:105
- **etapa_do_mapa.mjs** - Resolvedor único de mapa do jogo -> etapa da run (índice de levelcaps.json), compartilhado pelo rank de
  chaveDoMapa:7, etapaDoLocalDaPlanilha:9, criarEtapaDoMapa:21
- **extrair_campo_chefoes.mjs** - Grava em data/bosses.json o campo `campo` (efeito de campo da luta) de cada chefão, lido dos
  arquivos:11, nomeDoChefao:18, extrairCampos:22
- **extrair_categorias_golpes.mjs** - Categorias de golpe, chance e efeito extra. As categorias que reforçam habilidades (soco, mordida, corte,
- **gerar_mega_forms.mjs** - Completa data/mega_forms.json (pedra -> forma Mega/Primal) com as evoluções do dado bruto 2.65.4.1.
- **gerar_onde_achar_itens.mjs** - Gera data/onde_achar_itens.json: onde cada item se consegue na run e a partir de qual etapa (ticket 07,
  ler:21, anotar:32, localLegivel:37, etapaDaPasta:38
- **gerar_poder_variavel.mjs** - Gera data/poder_variavel.json (ticket 16, 07/10/2026): o que o motor precisa para os golpes de poder 1 no dado,
- **gerar_presentes.mjs** - Completa data/how_to_obtain.json com os presentes (Mystery Gift) da tabela oficial do jogo:
  nomeDoItem:13
- **gerar_rank_disponibilidade.mjs** - Gera data/rank_disponibilidade.json: em que etapa (índice de levelcaps.json) cada
  marcar:33, varaDaVaga:52, exigencia:57, soPresenteNaPlanilha:99, etapaDoNivel:109
- **gerar_sinergia_habilidade_movepool.mjs** - Porte para Node de scripts/compute_ability_movepool_synergy.ps1 (15/10/2026). Gera data/species_ability_synergy.json: cruza cada habilida...
  textosDasHabilidades:32, normalizar:61, tiposCitados:65, gerarSinergia:73
- **importar_dex_strategy.mjs** - Importa para data/builds.json as estratégias oficiais por espécie do arquivo src/data/dex-strategy.md do código do jogo
  norm:16, lerBlocos:21, montarIndice:44, resolverEspecie:70, primeiroDe:84, converter:86, assinatura:150, juntar:151, main:171
- **importar_mono.mjs** - Importa a planilha oficial "Mono earliest locations" (índice oficial:
  lerCsv:38, lerNome:60, chave:69, distancia:70, variantes:88, casarNomes:101, lerAba:121, cruzarComDex:144, preservarEApp:169, main:179
- **itens_pela_config.mjs** - Parâmetros de item pelo código do jogo, não por números soltos no motor.
  lerItensDaConfig:18, TIPO_EN:46, efeitoDoItem:49, itensDeBatalha:55
- **mapa_chamadas.mjs** - Chamadas entre arquivos do app (src/regras + src/ui) pela API do TypeScript.
  carregarTs:10, grafoDeChamadas:25, lista:73, gerarChamadas:80
- **mapa_do_codigo.mjs** - Gera docs/mapa-do-codigo.md: por arquivo de src/regras, src/ui e scripts/*.mjs, a responsabilidade
  responsabilidade:24, funcoes:35, gerarMapa:46, escreverMapa:69
- **medir_texto_novo.mjs** - Mede o que um dado novo da NextDex faz com o parser de habilidades do motor (ticket versao-nova/04, 15/10/2026).
  semClimas:17, limpar:18, lerTodas:23
- **nivel_da_mudanca.mjs** - Classificador do gancho por nível (melhoria A de docs/pipeline_do_projeto.md, 2026-10-14).
  ambienteDosFilhos:26, ehMaster:33, normalizar:39, nivelDoArquivo:59, nivelDaMudanca:76, etapaSabotagem:105, etapasDoNivel:124, precisaDaVagaPesada:141, arquivosEmStaging:150, classificarPorStaging:160
- **playtester_curadoria.mjs** - Curadoria do Playtester (pedido do usuário, 2026-09-24): toda build que a IA
  evsTexto:47, avaliar:49
- **prototipo_kit_sinergia.mjs** - PROTÓTIPO DESCARTÁVEL (10/10/2026) — fases 1 e 2 do pipeline de build
  nomeHab:16
- **rank_comum.mjs** - Peças do rank v2 que precisam de teste e de um lugar só (TK-21, 28/10/2026).
  percentis:5, tierDe:12, unidadeComItemLiberado:16, chavesDoRankNovo:24, camposHerdados:31
- **rank_escolha.mjs** - Escolha do set no rank v2 (ticket 08, 07/10/2026). A soma rápida (nota do duelo contra todos os
  melhoresPelaSoma:9, mediaDoEixo:13, notaDosEixos:18, escolherPelaNotaFinal:22
- **rank_fatia.mjs** - Rank com fatia fixa de peso (ticket todas-as-lutas/02, decisão do usuário em 16/10/2026): chefões 60% e lutas comuns 40%.
  notasComFatia:9, comunsMaisPerigosas:36
- **rank_incremental.mjs** - Rank incremental (06/11/2026, decisão do usuário: atualização recalcula SÓ O QUE MUDOU).
  hash:10, digitalDaEspecie:15, digitalGlobal:23, decidir:29, r6:41, reduzirMedicao:42, expandirMedicao:53
- **remapear_sprite_index.mjs** - Sprites pelo NOME da espécie (15/10/2026). O atlas (data/sprite_atlas.png) foi montado com o índice pelo número da espécie (x) do
  indicePorNumero:10
- **sabotagem_incremental.mjs** - Sabotagem incremental no master (decisão do usuário, 14/10/2026): no master a sabotagem roda só as
  git:17, caminhoDoVerde:22, lerVerde:28, gravarVerde:40, modoDaSabotagemNoMaster:55, selecionarMutacoes:68
- **servidor_estatico.mjs** - Servidor estático dos testes (fase 6 da refatoração, 2026-09-24): serve a raiz
- **testes_unit.mjs** - Lista os arquivos de teste unitário em rápidos e pesados (tests/pesados.json) e roda um dos grupos.
  arquivosPesados:11, arquivosTodos:12, arquivosRapidos:13
- **vaga.mjs** - Vaga de máquina para verificação pesada (melhoria B de docs/pipeline_do_projeto.md, 2026-10-13).
  pasta:38, vivo:44, lerJson:49, donoAbandonado:55, existe:61, dorme:63, filaViva:67, segurarVaga:80, comVaga:152
- **validar_dado_cru.mjs** - Validação do dado CRU do NextDex (lote 2, 2026-10-06). Roda ANTES do
  unicos:19, validarDadoCru:21
- **validar_dados.mjs** - Travas de dado do build (fase 8 da refatoração, 2026-09-24: porte em Node de
  carregar:16, lista:17, validarBuilds:32, validarInvariantes:102
- **validar_rank_v2.mjs** - Ponto 7 do rank v2: conferir o rank novo contra referências de fora, sem ajustar peso.
  norm:26, achar:30, postos:32, spearman:41, f2:49, media:50, notaV1:52
- **varrer_chefoes.mjs** - Varredura dos dados de TODOS os chefes (membros de party/insane/hell): pedra sem Mega, habilidade/golpe sem id,
  add:6
- **verificar.mjs** - Verificação antes de um commit (hook de pre-commit) e antes de publicar (prepare_publish.ps1).
  rodar:38

## Scripts (.ps1) - scripts/
- **acrescentar_sprites_atlas.ps1** - >
- **archive_build.ps1** - >
- **audit_field_types.ps1** - Varredura sistemática de tipos no dado bruto do NextDex, 2026-09-10.
  Get-TypeName:25, Note:32
- **build.ps1** - (fast path when only editing the template,
- **build_sprite_atlas.ps1** - >
- **check_upstream.ps1** - >
- **common.ps1** - Shared helpers for the Elite Redux Terminal data pipeline.
  New-GameDataParser:6, Write-JsonString:14, Write-JsonValue:34, ConvertTo-JsonManual:69, Score-AbilityText:90, Get-TypeMultiplier:179, Get-AlwaysActiveAbilityIds:271, Get-AbilityAdjustedTypeMultiplier:287, Format-Evs:303
- **compute_ability_movepool_synergy.ps1** - (sem comentário de topo)
  Get-FlagMatches:56, Get-UnmappedHit:66, Get-TypeMatches:73
- **compute_condition_move_synergy.ps1** - (sem comentário de topo)
  Get-MoveEffects:73
- **compute_move_roles.ps1** - (sem comentário de topo)
- **compute_species_rank.ps1** - (sem comentário de topo)
  Get-AbilityScore:167, Get-BossDefenseScore:214, Get-MovepoolScore:240, Get-TypeScore:277, Get-Stage:340, Get-PercentileRanks:390, Get-Tier:415, Compute-Tiers:433
- **compute_species_role.ps1** - (sem comentário de topo)
  Get-MoveIdSet:56, Get-PercentileRanks:70
- **dev_server.ps1** - Injecao de mock de sincronizacao (db), 2026-09-11: exclusiva deste servidor
  Get-MockDbScript:13
- **expand_combo_abilities.ps1** - >
  Get-ComboParts:33, Flatten-Combo:48
- **extract_boss_builds.ps1** - (sem comentário de topo)
- **extract_bosses.ps1** - Generates data/bosses.json (boss trainers + their difficulty variants) from
  ResolveAbility:29, ResolveAbilityId:39, ResolveParty:46
- **install_git_hooks.ps1** - >
- **prepare_publish.ps1** - (sem comentário de topo)
  Fail:23
- **research_ability_synergy.ps1** - Script de pesquisa/calibracao (NAO faz parte do build.ps1) - lista toda habilidade
- **scheduled_upstream_check.ps1** - (sem comentário de topo)
  Log:25, Show-Notification:29
- **score_abilities.ps1** - >
- **slim_dex.ps1** - (sem comentário de topo)
- **transform.ps1** - Generates data/dex_compact.json from data/gameData.json (the raw

## Testes unitários (o que cobrem) - tests/unit/
- **absorcao_flash_fire_dry_skin.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **alarme_upstream.test.mjs** - Leitura das páginas oficiais pelo alarme de versão nova (sem rede).
- **aliases_de_campo_tirados.test.mjs** - TK-33b item 8: os aliases de migração CONDICAO_DO_ARQUETIPO e WEATHER_ARCHETYPES saíram; todos leem campo.js direto.
- **areia_e_sets_rapidos.test.mjs** - Diagnóstico dos físicos subavaliados (03/10): Tyranitar/Rock sem o +50% de Sp. Def na areia (código oficial
- **atalhos_teclado.test.mjs** - Ticket 14 da dívida técnica (2026-10-08): atalhos que não são botão de verdade
- **atributo_do_ataque.test.mjs** - Golpes que trocam o atributo de ataque ou de defesa (06/10, lote 4 da fila da comunidade; ver
- **auditoria_do_motor.test.mjs** - Auditoria permanente do motor do duelo (revisão da equipe, 2026-09-30, pedido do
- **avisos_e_selo_de_build.test.mjs** - Lote 5 das pesquisas de 06/10: Avisos de build (um bloco, reaproveitando as contas
- **best_offense_pelo_codigo.test.mjs** - Ticket versao-nova/05 (15/10/2026), pergunta P2 respondida pelo Felipe: Best Offense e Magus Blades valem pelo CÓDIGO da versão mais nova
- **buffs_e_pendencias_antigas.test.mjs** - Lote de 2026-10-01: buffs do ginásio no simulador (números do código do jogo,
- **build_focada.test.mjs** - buildFocadaDoMotor(sname, foco): a melhor build para o chip clicado no cartão (papel ou tipo de dano), na Etapa atual.
- **build_ps1_nao_regride.test.mjs** - Depende de dado: versão gravada pelo build (muda quando o jogo troca de versão).
- **builds_estrutura_18.test.mjs** - TK-18 (estrutura-2026-10-22): builds. Código de motivo na recusa, IA recusa item não liberado (decisão 10),
- **cache_sabotagem.test.mjs** - (sem comentário de topo)
- **calibracao_calculadora_do_jogo.test.mjs** - Calibração do motor contra a calculadora de dano do próprio jogo (10/10/2026, prints do usuário).
- **calibracao_simulador_wasm.test.mjs** - Calibração do motor contra o simulador do jogo compilado (WebAssembly, Elite Redux 2.65.3b), 21/10/2026
- **campo_caracterizacao_tk16.test.mjs** - TK-16 (campo, fase 1): caracterização ANTES da refatoração. Fixa o veredito do motor (R.resultadoDoDuelo) em lutas com
- **campo_do_campeao_monotype.test.mjs** - Efeito do campeão monotype (04/10): o jogo anuncia um efeito por tipo (src/battle_main.c HandleMonoChampSpecialEffects
- **campo_do_chefao_pelo_dado.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **campo_fonte_unica.test.mjs** - TK-16 (campo, fase 1): src/regras/campo.js é a fonte única de clima, terreno, telas, hazards e durações de campo.
- **campo_invertido_no_plano.test.mjs** - Achado do vídeo do usuário (02/10): o plano contra a Tate & Liza 1 chamava Axe Kick (Dark) de
- **campo_no_duelo.test.mjs** - Campo no duelo (2026-09-29): terreno das habilidades (Grassy/Electric/Psychic/
- **carimbo_derivados.test.mjs** - Depende de dado: rank/lutas/chefões (lê os derivados gravados; muda quando eles são regerados).
- **categorias_de_golpe.test.mjs** - Categoria de golpe (soco, mordida, corte...) do NextDex (2026-09-29): antes
- **categorias_de_golpe_da_config.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **checar_encoding.test.mjs** - A trava de codificação (scripts/checar_encoding.mjs) precisa pegar exatamente
- **checar_paralelo.test.mjs** - Testes do scripts/checar_paralelo.mjs (ticket 04, fluxo 14/10/2026).
- **chefao_pela_interface.test.mjs** - Ticket 07 da dívida técnica (08/10/2026), 2ª metade: a luta inteira contra o time do chefão e a
- **chefoes_pela_config.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **chefoes_pela_config_nova.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **clima_oficial_e_revisao.test.mjs** - Achados da reunião de alinhamento (2026-09-30): clima com os números oficiais
- **comentario_acima_sem_dono.test.mjs** - TK-33b item 9: comentário "NOME_EM_CAIXA_ALTA acima" não pode apontar para algo declarado em OUTRO arquivo
- **condicoes_habilidade.test.mjs** - Habilidade condicional (reunião de 2026-09-28): a auditoria das builds salvas
- **condicoes_no_duelo.test.mjs** - Condições da luta no duelo (2026-09-29): status no próprio Pokémon (Guts com
- **config_v10.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **confronto.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **contato_tirado_no_duelo.test.mjs** - Ticket mecanica-2026-10-22/02: Long Reach e Punching Glove (num soco) tiram o contato INTEIRO (IsMoveMakingContact, battle_util.c:6579-65...
- **contraste_dos_tokens.test.mjs** - Ticket design-2026-11-04/01 (TK-60): razões WCAG dos pares principais de tokens nos 3 temas (claro, escuro, alto contraste).
- **contraste_sigla_dos_tipos.test.mjs** - Ticket design-2026-11-04/01 (TK-60): a sigla de 3 letras sobre a cor de cada tipo exige contraste >= 4,5:1 (WCAG AA).
- **critico_no_duelo.test.mjs** - Crítico no duelo (2026-09-29): antes o motor não tinha crítico nenhum - Super
- **cura_recuo_no_duelo.test.mjs** - Cura, recuo e dano por contato no duelo (2026-09-29): recuo e dreno dos golpes
- **dado_habilidade_por_nome.test.mjs** - Depende de dado: nomes de habilidade de chefões/lutas (muda quando a config renomeia).
- **dados_de_mega_e_presentes.test.mjs** - Achados de 03/10 na revisão das lutas: mega_forms.json (feito à mão em 09/2026) estava 36 pedras
- **demolitionist_pelo_codigo.test.mjs** - Ticket mecanica-2026-10-22/03 (parte Demolitionist), 22/10/2026. Valem pelo CÓDIGO da versão nova (er-repo upcoming):
- **descricao_especie.test.mjs** - Descrição de teste do jogo escondida na ficha (15/10/2026): o Noxislash mostrava "Hi i use this for implementing.".
- **diff_versoes.test.mjs** - Diff entre versões do gameData: detecta o que mudou e o que do app cita isso
- **dificuldade_hell.test.mjs** - TK-10a: a Dificuldade Hell existe no save e no seletor; Dificuldade do jogador e tier do chefão são mapas separados.
- **diversos_no_duelo.test.mjs** - Habilidades "diversas" no duelo (2026-09-29): o resto que muda um 1x1 -
- **dream_eater_no_duelo.test.mjs** - TK-40: Dream Eater só age em alvo dormindo ou Comatose e cura metade do dano.
- **drench.test.mjs** - Ticket 17 (07/10/2026): status drench pelo código oficial (er-repo 217dd0f). Encharcado age por
- **duelo_pela_interface.test.mjs** - Ticket 07 da dívida técnica (08/10/2026), 1ª metade: o duelo testado pela entrada pública.
- **dupla_contagem_da_sinergia.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **dupla_no_duelo.test.mjs** - Dupla (2026-09-29, decisão do usuário: duelo em dupla completo). 25 chefões
- **efeitos_de_golpe.test.mjs** - Efeitos de golpe que a auditoria do motor apontou (2026-09-30), pelos textos do
- **efeitos_de_golpe_03_10.test.mjs** - Efeitos de golpe da lista "sem regra" que pesavam em builds e chefes (03/10): Thunder/Hurricane no clima
- **efeitos_pela_interface.test.mjs** - Ticket 07 da dívida técnica (08/10/2026), 2ª metade, bloco 2: efeitos do duelo que só tinham teste
- **encalhados_e_checkpoint.test.mjs** - Testes de scripts/encalhados.mjs e scripts/checkpoint.mjs (melhoria C do fluxo).
- **estado_do_app.test.mjs** - Testes das regras que saíram do template na fase 3 da refatoração (2026-09-24):
- **estagios_no_duelo.test.mjs** - Estágios de atributo no duelo (2026-09-29): entrada (Intrepid Sword), ao
- **etapa_mega_fonte_unica.test.mjs** - TK-33b item 6: a Etapa/líder da Mega nos textos vem de data/pedras_etapa.json (quandoVale + lideres),
- **extracao_transform.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **extras_no_duelo.test.mjs** - Golpes extras, bloqueio e entrada no duelo (2026-09-29): Readied Action,
- **ficha_perfil_defensivo.test.mjs** - Ticket 13 (07/10/2026): faixas Fraco/Resiste/Imune da ficha, com as innates (sempre ativas).
- **floettite_pos_jogo.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **fluffiest.test.mjs** - Fluffiest (678): a descrição (NextDex e er-config) diz "contato x0,25, fogo x4", mas o código do jogo
- **fontes_embutidas.test.mjs** - Fontes embutidas (05/11/2026): o app não pode depender do Google Fonts.
- **gerador_cacar_bugs.test.mjs** - Ticket 17 da dívida técnica (08/10/2026): caça-bugs no caminho do gerador de builds por IA
- **golpe_chave_imposto.test.mjs** - Relato da Tate & Liza (03/10): o plano dizia Dragon Claw e a build da IA tinha Dragon Pulse. Agora a validação
- **golpe_duplo.test.mjs** - Habilidades de golpe duplo (10/10/2026). O usuário testou no jogo: o Mega Punch do Ledian (Raging Boxer, Iron
- **golpes_de_status.test.mjs** - Golpes de status no duelo (2026-09-29, decisão do usuário: "com regras
- **golpes_fonte_unica.test.mjs** - TK-15 (29/10/2026): golpes - acertos com fonte, vocabulário cat/categoria/ef, e a fusão de move_effects.json no passo de sinergia.
- **golpes_novos_2654.test.mjs** - Ticket versao-nova/09 (15/10/2026): os 9 golpes novos do upcoming (er-config d1a9a4c, MoveList.textproto) entram no app, com as espécies ...
- **gym_skills_texto_do_jogo.test.mjs** - Texto dos buffs de ginásio conferido contra o código do jogo (er-repo f34fc2b, src/battle_events.c; comitê 29/10, TK-33b).
- **habilidades_2655.test.mjs** - TK-35c: habilidades novas da NextDex 2.65.5, lidas no código do jogo (ferramentas/er-repo, 4a2f6cfc).
- **habilidades_lote3_tk12.test.mjs** - TK-12 (28/10/2026): divergências do lote 3 (pacote onda0_P2_lote3) contra o código do jogo (er-repo f34fc2b), com dado real.
- **habilidades_lotes_1_2_pelo_codigo.test.mjs** - TK-12, divergências dos lotes 1 e 2 conferidas no código do jogo (er-repo f34fc2b):
- **habilidades_mudadas_2654.test.mjs** - Ticket versao-nova/06 (15/10/2026): habilidades cujo efeito mudou na versão mais nova (dados-2654/02 e 03). Fonte: abilities.cc (upcoming...
- **habilidades_novas_2654.test.mjs** - Ticket versao-nova/07 (15/10/2026): as 29 habilidades novas da NextDex 2.65.4 + as 9 do delta da er-config d1a9a4c (upcoming) funcionam n...
- **habilidades_texto_novo_2654.test.mjs** - TK-00b (28/10): textos de habilidade que a v2.65.4.1 reescreveu. A regra do motor lê o TEXTO; cada teste prova que a redação nova ainda
- **hazard_de_tipo_inverse_room.test.mjs** - TK-07 (decisão 6, 28/10/2026): Stealth Rock e Creeping Thorns passam por GetTypeModifier, que usa a tabela
- **hell_no_duelo.test.mjs** - TK-10b (28/10/2026): regras do modo Hell no motor. Fonte: relatorios/tk10b_evidencia.md (er-repo f34fc2b).
- **ia_do_chefao_golpe.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **importar_dex_strategy.test.mjs** - Importador das estratégias oficiais do código do jogo (src/data/dex-strategy.md), achado da pesquisa profunda de 06/10.
- **imunidade_status_habilidade.test.mjs** - TK-13b: imunidade a status por HABILIDADE numa fonte só (duelo.js IMUNE_STATUS_POR_HABILIDADE + texto),
- **imunidades_de_habilidade.test.mjs** - Imunidades escritas como "absorve"/"redireciona"/"em vez de ser atingido"
- **inversa_ia.test.mjs** - Revisão de 07/10 (ticket 03 x Inverse Room): com a sala invertida cobrindo a luta, o chefão usa o golpe que a
- **itens_consumiveis.test.mjs** - Berries na IA e habilidades que dependem de gastar o item (2026-09-26).
- **itens_da_config.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **itens_de_atributo.test.mjs** - TK-08 (28/10/2026): itens que mexem num atributo da espécie, iguais ao código do jogo (er-repo f34fc2b,
- **itens_do_time.test.mjs** - TK-14 (motor-D5.3, decisão do usuário 28/10): UMA lista de itens para o set do duelo, o Motor e a IA.
- **itens_no_duelo.test.mjs** - Itens no duelo (2026-09-29, decisão do usuário: "item nos sets do duelo").
- **itens_registro_14.test.mjs** - TK-14 (estrutura-2026-10-22): itens. Expert Belt 1,2x do código (não o f:30 da config), Knock Off pela regra real do jogo
- **juiz_do_time.test.mjs** - Depende de dado: chefões (bosses.json) e level caps (levelcaps.json) da versão do jogo (muda quando o jogo troca de versão).
- **lacunas_sem_codigo.test.mjs** - Varredura "habilidades da config sem código" (21/10/2026; relatorios/sem_codigo_varredura_2026-10-21.md).
- **lado_no_duelo.test.mjs** - Ticket time-pelo-motor/01, Fase B1 (20/10/2026): Reflect, Light Screen, Aurora Veil, Tailwind e Trick Room são
- **last_stand_no_duelo.test.mjs** - Last Stand (abilities.cc:7959-7965): Def/SpDef x(1 + 0,6 x fração de PV perdido).
- **level_cap_padrao_unico.test.mjs** - Ticket 04 (divida-tecnica): sem Level cap o padrão é um só (0 = sem limite; nível de cálculo 100).
- **levelcaps_contra_jogo.test.mjs** - TK-23: data/levelcaps.json tem de bater com GetLevelCap() do código do jogo (pokemon.c); 100 = sem limite.
- **liberacao_por_etapa_caracterizacao.test.mjs** - TK-35: segundo ajuste do instantâneo - Arcanite H Etapa 4 -> 7 (er-config MegaStonesList.textproto:2215-2226, mega_badge_requirement 7; d...
- **liberado_na_run.test.mjs** - Ticket 05 (divida-tecnica): liberadoNaRun é a única régua de pedra, item e golpe;
- **limpeza_motor_tk33a.test.mjs** - TK-33a (limpeza do motor, 29/10/2026): comportamento igual, fontes únicas. Itens 1-4.
- **lote_a_motor.test.mjs** - Lote A da força-tarefa (2026-10-02): correções do motor provadas na auditoria, cada uma
- **lote_b_plano_real.test.mjs** - Lote B da força-tarefa (2026-10-02): o plano contra o chefão tem que corresponder ao time
- **lote_c_validacao.test.mjs** - Lote C da força-tarefa (2026-10-02): validação estratégica das builds da IA e o que a
- **lote_d_confiabilidade.test.mjs** - Lote D da força-tarefa (2026-10-02): confiabilidade do estado, do save, da sincronização
- **manual_build.test.mjs** - Manual de build competitivo (reunião de 2026-09-28): regras gerais de nature,
- **mapa_do_codigo.test.mjs** - Gerador do mapa do código: determinístico e acha função conhecida com a linha certa.
- **marca_de_dado.test.mjs** - Gate de processo (TK-30): testes que dependem de dado que muda com a versão/rank/lutas levam marca,
- **marcas_do_rank.test.mjs** - Marcas sem nota do rank v2 (ponto 6, 2026-10-02): "Precisa de setter"
- **mauville_mais_um_melhor_ataque.test.mjs** - TK-48 (DECISÃO DO USUÁRIO 05/11): o treinador do Mauville Game Corner (TRAINER_SINNOH_MEGAS_MAUVILLE_GAME_CORNER) ganha +1 estágio no
- **mega_forms_do_jogo.test.mjs** - TK-22: mega_forms.json segue o jogo (SpeciesList/MegaStonesList do er-config 486a964), inclusive pedras de 2 alvos.
- **mega_gate.test.mjs** - Trava de Mega Evolução nas SUGESTÕES (achado do usuário, print de 2026-09-24:
- **modo_motor_sem_ia.test.mjs** - Modo Motor nunca chama a IA (ticket time-pelo-motor/01, Fase F3, 21/10/2026). Duas provas independentes:
- **mono_run.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **mono_tipo_da_especie.test.mjs** - TK-36: mono_disponibilidade.json listava a Snubbull em Ground; na 2.65.5 ela é Fada pura. Toda espécie sem marca (# % M) tem que ter o ti...
- **montar_time_contra_chefao.test.mjs** - Botão "Montar time contra este chefão" (2026-09-29): o simulador de duelo
- **motor_favoritos_save.test.mjs** - TK-02b (28/10/2026): favoritos do Modo Motor fazem parte do save (ida e volta, save antigo, saneamento).
- **motor_item.test.mjs** - O Modo Motor fecha o item de cada membro (ticket motor-item/01, 22/10/2026): testa os itens liberados na Etapa que o motor simula e
- **multiplicadores_do_codigo_do_jogo.test.mjs** - Ticket calibracao-2026-10-15/03 (15/10/2026): multiplicadores de habilidade que o texto da NextDex traz, mas que o motor não lia
- **nivel_da_mudanca.test.mjs** - Testes do gancho por nível (scripts/nivel_da_mudanca.mjs e scripts/verificar.mjs).
- **numeros_da_versao_nova.test.mjs** - Ticket versao-nova/02 (15/10/2026): o app mira a versão MAIS NOVA do jogo (código/config primeiro, NextDex depois). Três números que a 2....
- **oitavo_ginasio.test.mjs** - 8º ginásio (docs/tickets/oitavo-ginasio-dupla/01): Juan 1 + Wallace e depois Juan 5 + Wallace 5, duas duplas seguidas, sem cura
- **onde_achar_itens.test.mjs** - Ticket 07 (07/10/2026): onde achar cada item na run, lido do código oficial do jogo (item no chão, escondido,
- **origem_dado_cru.test.mjs** - TK-25: o dado cru ativo não leva versão no nome, e todo .ps1 que grava/lê dado usa UTF-8 explícito
- **pedras_etapa_dado.test.mjs** - TK-11 (decisão 3): nenhuma pedra libera ANTES do dado (onde_achar_itens), salvo as que o código do jogo trava mais cedo
- **perfectionist.test.mjs** - Ticket 08 (07/10/2026): Perfectionist pelo código oficial (abilities.cc Impl<ABILITY_PERFECTIONIST>):
- **pinnacle_blade_pelo_codigo.test.mjs** - Ticket mecanica-2026-10-22/03 (parte Pinnacle Blade), 22/10/2026. Vale pelo CÓDIGO da versão nova (er-repo upcoming):
- **pipeline_build.test.mjs** - Pipeline de build com intenção (ticket 20 da dívida, 14/10/2026): src/regras/pipeline_build.js, só pela interface
- **pipeline_kit_legal.test.mjs** - Fase 1 do pipeline: contrato determinístico do kit legal.
- **pipeline_papeis.test.mjs** - Pipeline: espécie com 2 papéis (um é Pivô) tem uma build para cada papel; 1 papel segue com as 2 melhores.
- **pipeline_rascunho.test.mjs** - Rascunho coerente do pipeline de build (ticket docs/tickets/pipeline-build-2026-10-14/05-rascunho-coerente.md, revisão de metagame de 15/...
- **plano_build.test.mjs** - Testes da build que acompanha o jogador (src/regras/plano_build.js), pedido do
- **poder_que_cresce.test.mjs** - Ticket 19 (07/10/2026): poder que cresce e golpe que carrega, pelo código oficial (er-repo 217dd0f):
- **poder_variavel.test.mjs** - Ticket 16 (07/10/2026): golpes de poder 1 no dado com o poder do código oficial (src/script_conditions.cc
- **primeiro_golpe_e_booster_energy.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **prioridade_bloqueada_no_1x1.test.mjs** - Queenly Majesty, Dazzling e Armor Tail ("Protects itself and ally from priority moves") no duelo 1x1 (10/10/2026).
- **prioridade_condicional_no_duelo.test.mjs** - Prioridade no duelo (14/10/2026): golpe com prioridade (de base OU condicional: Coil Up, Sidewinder, Cutthroat, Edgelord,
- **prioridade_e_campo_pelo_codigo.test.mjs** - Ticket calibracao-2026-10-15/06 (15/10/2026): prioridade e campo pelo código do jogo.
- **propriedades_do_motor.test.mjs** - TK-30 (29/10/2026, decisão do usuário): testes por propriedade (fast-check) do motor de duelo, com espécies INVENTADAS e golpes reais de ...
- **queda_por_habilidade_no_duelo.test.mjs** - Depende de dado: o texto das habilidades no NextDex (gameData.json) - "Biting moves have a 50% chance to lower defense", "slashing moves ...
- **rank_comum.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **rank_da_run.test.mjs** - Rank v2 no app (src/regras/rank_da_run.js): nota pela dificuldade da run, dois eixos,
- **rank_disponibilidade.test.mjs** - Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
- **rank_escolha.test.mjs** - Ticket 08 (07/10/2026): a escolha do set do rank avalia por inteiro os melhores pela soma rápida
- **rank_fatia.test.mjs** - Fatia fixa de peso do rank (ticket todas-as-lutas/02, 21/10/2026): chefões 60% e lutas comuns 40%, com as 29 lutas de chefão REAIS
- **rank_incremental.test.mjs** - Rank incremental (06/11/2026): impressão digital por espécie + global, e a decisão do que recalcular.
- **rank_premia_hazard.test.mjs** - TK-32 (decisão do usuário de 29/10/2026): o rank premia suporte, só hazard. Dado real: Forretress no nível 40
- **rank_so_por_rankde.test.mjs** - ADR-003 (ticket 01): o dado do Rank só é lido por rankDe(); SPECIES_RANK não é reescrito depois da carga.
- **recarga_e_dois_turnos.test.mjs** - TK-06 (decisão 7 do usuário, 28/10): recarga e golpe de 2 turnos lidos do EFEITO do dado, não da tradução PT.
- **reconciliar_build.test.mjs** - Build salva que muda de espécie (auto-evolução) ou chega de um save antigo precisa
- **regra_de_campo_do_chefao_tk33b.test.mjs** - TK-33b item 10: regraDeCampoDoChefao sem repetição (TYPE_ tirado uma vez, texto do Trick Room numa constante,
- **regras.test.mjs** - Testes unitários das regras do jogo (item Q3 da pauta técnica, 2026-09-16).
- **regras_com_fixture.test.mjs** - TK-30 (28/10/2026, decisão do usuário): a REGRA é testada aqui com espécie INVENTADA (montada no teste, sem depender do dado);
- **regras_oficiais_fase4.test.mjs** - Fase 4 da reunião de 30/09/2026: o motor conferido contra o FAQ oficial, o
- **regras_puras_ctx_explicito.test.mjs** - TK-19: prompts e validação da IA recebem ctx explícito ({ archetype, team, settings, cap }) e não leem o state global.
- **respostas_do_usuario_08_10.test.mjs** - Ticket dados-2654/11 (08/10/2026): as 13 decisões que o usuário tomou sobre as dúvidas acumuladas.
- **resto_das_habilidades.test.mjs** - O resto das habilidades (2026-09-29, pedido do usuário: "não quero que fique
- **reticencias.test.mjs** - Ticket 13 (07/10): texto de tela usa o caractere … (U+2026), nunca três pontos.
- **revanche_sem_buffs.test.mjs** - Revisão dos ginásios (04/10): nos 8 scripts oficiais o líder, com o jogo zerado (FLAG_SYS_GAME_CLEAR), vai direto pro script
- **sabotagem_incremental.test.mjs** - Sabotagem incremental no master (decisão do usuário, 14/10/2026). Cobre a regra:
- **sabotagem_runner.test.mjs** - TK-29 (27/10/2026): o runner de sabotagem só conta "pega" quando uma ASSERÇÃO falha, confere os alvos antes
- **selo_do_pipeline.test.mjs** - Ticket versao-nova/03 (15/10/2026): o selo do pipeline de build. Antes só 2 casos (Ledian + Mega Punch/Aerial Ace contra o Ninetales)
- **sempre_acerta_e_plasma_lamp.test.mjs** - Ticket mecanica-2026-10-22/01: "X moves always hit" não vale para todos os golpes; Plasma Lamp tem precisão x1,2 em Fire/Electric.
- **sequencia_contra_chefao.test.mjs** - Luta inteira contra o time do chefão (2026-09-29, decisão do usuário): HP que
- **setup_entre_duelos.test.mjs** - Ticket 05 (07/10/2026): os estágios de atributo só zeram para quem entra em campo
- **shedinja_hp1.test.mjs** - Shedinja HP 1 (decisão 5 do usuário, TK-09): o jogo fixa maxHP em 1 (pokemon.c:1000-1001);
- **sinergia_habilidade_movepool.test.mjs** - Gerador da sinergia habilidade x movepool (porte Node, lê o INGLÊS do dex). Trava: arquivo gravado == gerador, ids batem com o dex,
- **sinergia_sem_bonus_por_id.test.mjs** - TK-12 estrutura D4.3 (28/10/2026): SINERGIA_SEM_BONUS_DE_DANO_DUELO virou conjunto por ID, montado dos 7 nomes por ABILITY_ID_BY_NAME.
- **sono_do_alvo_no_duelo.test.mjs** - TK-43: alvo dormindo no motor (valor esperado). Fonte: er-repo battle_scripts_1.s:3564-3573 (Dream Eater), :4909-4911 (Nightmare),
- **sono_e_paralisia_champions.test.mjs** - Ticket versao-nova/08 (15/10/2026; dados-2654/07): o código novo liga o sono e a paralisia estilo Pokémon Champions.
- **sprite_index.test.mjs** - Sprite pelo nome da espécie (15/10/2026): a versão nova do jogo deslocou os números e o Beedrill Mega mostrava o Blastoise Mega.
- **sprites_provisorios.test.mjs** - Ticket design-2026-11-04/03 (decisão do usuário, 05/11/2026): espécie sem sprite oficial usa o sprite da base e mostra aviso.
- **status_no_duelo.test.mjs** - Status por chance no duelo (2026-09-29, grupo 1 do estudo de habilidades):
- **sugestao_do_motor.parte1.test.mjs** - Parte 1 de 3 de sugestao_do_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
- **sugestao_do_motor.parte2.test.mjs** - Parte 2 de 3 de sugestao_do_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
- **sugestao_do_motor.parte3.test.mjs** - Parte 3 de 3 de sugestao_do_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
- **sync_canonico.test.mjs** - TK-02 (S12-2, S12-4, S12-5): comparação canônica no sync, campo v usado, team/box sem duplicata.
- **sync_progresso.test.mjs** - Sincronização não apaga run adiantada com run zerada (relato do usuário, 10/10/2026):
- **sync_soma_errada.test.mjs** - TK-01 (decisão 2 do usuário, 27/10/2026): save com soma errada nunca é regravado nem enviado à nuvem.
- **telas_efetividade_real.test.mjs** - Ticket 12 (dados-2654): as telas mostram a efetividade REAL contra Solid Rock / Primal Armor e citam a
- **texto_novo_das_habilidades.test.mjs** - Ticket versao-nova/04 (15/10/2026): o texto das habilidades mudou de redação na 2.65.4 da NextDex (07/10) e o parser do motor lê TEXTO. M...
- **tier_e_fatia_unicos.test.mjs** - TK-20: dificuldade -> tier e a fatia 60/40 têm UMA fonte (src/regras/chefoes.js), lida por chefões, rank, Meu Time,
- **time_melhor_no_geral.test.mjs** - Tela do time = melhor time no geral, sem pensar no próximo chefão (usuário, 16/10/2026). As builds do "Montar time completo"
- **time_pelo_motor.parte1.test.mjs** - Parte 1 de 5 de time_pelo_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
- **time_pelo_motor.parte2.test.mjs** - Parte 2 de 5 de time_pelo_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
- **time_pelo_motor.parte3.test.mjs** - Parte 3 de 5 de time_pelo_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
- **time_pelo_motor.parte4.test.mjs** - Parte 4 de 5 de time_pelo_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
- **time_pelo_motor.parte5.test.mjs** - Parte 5 de 5 de time_pelo_motor.test.mjs (dividido em 06/11/2026 para rodar em paralelo; ver tests/pesados.json).
- **time_pelo_motor_papeis.test.mjs** - Papéis, estilo e tags do Modo Motor (corte 06/11/2026): o papel vem do rank (SPECIES_ROLE), o estilo é a contagem desses papéis
- **time_pelo_motor_regras.test.mjs** - Regras do Modo Motor que só a sabotagem do TK-03 (27/10/2026) mostrou sem proteção: item liberado e limite de repetição,
- **times_salvos_acessibilidade.test.mjs** - TK-28 (achados de acessibilidade): o cartão do time salvo gera HTML acessível.
- **times_salvos_backup.test.mjs** - TK-28: backup do time por CAMPO (backup: true), não pelo prefixo "Antes de " do nome; cabeçalho do chefão por função.
- **tipo_stellar.test.mjs** - Tipo Stellar (TK-04, achado motor-D1.4; decisão do usuário 28/10): tabela contra battle_util.c:1012-1013 e 1056-1057
- **tipos_contra_o_jogo.test.mjs** - TK-04 (motor-D1.1, D1.2): a tabela de tipos e TYPE_MOD_ABILITIES travadas contra o código do jogo.
- **tipos_habilidade_id_nome.test.mjs** - TK-00: trava id x nome de TYPE_MOD_ABILITIES. O id é do dex_compact do app (NextDex), NÃO o do enum do jogo
- **tira_setup.test.mjs** - Ticket 18 (07/10/2026): golpes que tiram setup, pelo código oficial (er-repo 217dd0f,
- **traducoes_alinhadas_por_nome.test.mjs** - Versão 2.65.4 deslocou ids de habilidade (Mighty Horn 391 -> 390; 391 virou Hardened Sheath...). A tradução PT é indexada por id, então
- **traducoes_cobertura.test.mjs** - Toda habilidade do dex tem descrição PT (a 2.65.5 acrescentou ids sem tradução e ninguém notou).
- **troca_de_tipo_na_defesa_no_duelo.test.mjs** - TK-34: a troca de tipo (Protean, Libero, RKS System, Pattern Change, Prismatic Fur, Color Change) vale para a DEFESA.
- **vaga.test.mjs** - Vaga de verificação pesada (scripts/vaga.mjs, melhoria B de 2026-10-13).
- **validacao_do_time_gerado.test.mjs** - TK-28: a decisão "quais Pokémon do time ainda estão sem build" mora em src/regras (computeTeamGenerationValidation), não na tela.
- **validar_dado_cru.test.mjs** - Validação do dado cru do NextDex na ingestão (scripts/validar_dado_cru.mjs, lote 2).
- **velocidade_por_categoria_no_duelo.test.mjs** - Speed Force, Momentum, Impulse, Blur e Elude: a config er-config 30f0f5a (04/11/2026) trocou contato/não-contato por Físico/Especial
- **veredito_da_luta.test.mjs** - TK-28: a decisão do veredito da luta e do plano contra o chefão mora em src/regras (chefoes.js), não na tela.
- **veu_do_cabecalho_do_chefao.test.mjs** - TK-33b item 11 (TK-28): o véu atrás do texto do cabeçalho do chefão (Aqua/Magma) tem de garantir contraste AA
- **vocabulario_da_etapa.test.mjs** - TK-27: texto da UI usa "Etapa" (GLOSSARY.md), não "marco".
