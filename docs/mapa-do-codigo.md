# Mapa do código

Gerado por `npm run mapa` (scripts/mapa_do_codigo.mjs); o pré-commit regenera quando há `src/` ou `scripts/` em staging.
Não edite à mão. Conflito de junção neste arquivo: regenere (`npm run mapa -- --rapido`) e adicione.
Uso: ache o arquivo aqui, depois abra só o trecho (`arquivo:linha`, offset/limit). Chamadas entre arquivos não aparecem.

## Regras (lógica pura) - src/regras/
- **avisos_build.js** - Lote 5 das pesquisas de 06/10 (ideias do GPT, seções 3.2/17/26/42): Avisos de build e selo de
  avisosDaBuild:8, seloDaBuild:82, primeiroLugarDoItem:94, rotuloDaEtapaDoItem:98, ondeAcharItemTexto:100
- **builds.js** - Build mostrada (effectiveBuild: salva > herdada da base pela Mega > curada do
  entradaDeBuild:23, stripNote:49, showdownName:54, showdownSet:58, evsToShowdownText:75, teamItemsInUse:90, comecarLoteDeBuilds:118, concluirBuildDoLote:119, encerrarLoteDeBuilds:120, contaNoTime:121, teamMovesInUse:123, itensEmUsoComQuem:151, teamRolesInUse:163, golpesFuturosDe:177, effectiveBuild:200
- **calc_stat.js** - Fórmula de status final (base+IV+EV+nível+nature+item) e o que deriva
  itemRuleFor:106, calcFinalStat:119, minEvSameStat:157, nextEvBreakpoint:167, priorityOrderForEvs:192, trimAndReallocateEvs:195
- **chefoes.js** - Chefões e a próxima luta: o que falta vencer, variante por dificuldade,
  gymLeaderBaseName:45, getRemainingBossEntries:51, computeSharedRisks:109, bossSpeedSummary:132, computeBossAttackTypes:147, bossSafetyScore:171, bestBoxCandidateForBoss:183, confrontoUnitOf:233, confrontoFoesDe:258, confrontoMelhorUnidade:269, confrontoMinhasUnidades:279, confrontoUnidadesDaCaixa:289, confrontoParaParty:298, bossPartyPorDificuldade:327, bestRankForm:333, nextFightCx:351, varianteDoChefao:358, gymSkillsSummaryFor:367, regraDeCampoDoChefao:416, comportamentoDaIADoChefao:433, habilidadesExtrasDoHell:446, regrasDoHell:447, ehRevancheDeLider:454, buffsParaMostrarDoChefao:473, buffsAtivosDoChefao:482, computeSpeedTiers:495
- **condicoes_habilidade.js** - Habilidade que só funciona numa condição do PRÓPRIO Pokémon (status,
  descricaoDeHabilidade:89, descricaoDeHabilidadePorId:100, expandirTextoDeHabilidade:111, habilidadeArma:125, nomesDeHabilidades:128, podeTerStatus:134, garantiaDoTime:142, garantiaDaCondicao:156, comoGarantir:172, condicaoDaBuild:191, precisaDeSetter:214, blocoCondicoesIA:239
- **confronto.js** - Motor de confronto: dado o time do jogador e o time de um chefão, diz quem
  confrontoDamagingMoves:29, confrontoMoveType:32, foeAbilityIds:36, foeFromBossMember:49, ofensaContra:59, ameacaDe:91, velocidadeBase:114, confrontoDuelo:126, confrontoTime:146, coberturaSugerida:196, confrontoDuelosDe:243, valorDoTime:249, melhoresTrocas:265, cuidadosDoChefao:302, aberturaEmDupla:319
- **dados_base.js** - Tabelas derivadas dos dados do jogo (tipos, golpes, espécies, rótulos conferidos, naturezas) e utilitários puros.
  dataLabel:23, getSpeciesByX:78, getSpeciesBySname:79, snameOf:80, clampInt:103, uniqueIds:118, descricaoDaEspecie:185
- **duelo.js** - Simulador de duelo 1x1 contra Pokémon reais de chefão - o motor do rank
  nomeHabDuelo:46, textoHabDuelo:203, bonusDeGolpeLidoDoTextoDuelo:231, acertosDoGolpeDuelo:232, golpeUtilNoDuelo:237, categoriaNoDuelo:249, temContatoDuelo:255, golpesDeRecargaAte:258, golpesDeDueloAte:265, golpesDeStatusAte:271, tipoDoTextoDuelo:292, fraseFixaDuelo:297, categoriasDoTextoDuelo:312, categoriasDoGolpeDuelo:315, modoHellDuelo:340, statusDoTrechoDuelo:385, presencaDoStatus:392, todosOsStatusDuelo:398, lerStatusDaFraseDuelo:403, chanceDoEstagioCrit:453, lerCriticoDaFraseDuelo:454, lerCondicaoDaFraseDuelo:480, estagioDoTexto:509, multDoEstagio:510, lerEstagioDaFraseDuelo:512, poderDoGolpeDuelo:567, lerExtrasDaFraseDuelo:569, lerCuraDaFraseDuelo:618, filtroDoTextoDuelo:651, empurraStatusDuelo:661 (+141)
- **escolha_ia_candidatos.js** - A IA ESCOLHE ENTRE os candidatos do pipeline de build (passo 4 de docs/pipeline_de_build.md; ticket 03 de
  textoDeCandidatoParaIA:20, blocoDeCandidatosParaIA:33, regrasDaEscolhaIA:40, linhaDePapelNaturalIA:47, linhaDeFraquezasDoTimeIA:51, blocoTimeCurtoIA:55, linhaDoChefaoPorEspecieIA:68, blocoPlanoCurtoIA:72, objetivoDaEscolhaIA:80, montarPromptEscolhaDeBuild:86, montarPromptEscolhaDoTime:103, indiceDaEscolhaIA:126, respostaForaDoCandidato:132, fecharCandidatoDaEscolha:142, textoDaRazaoDaEscolha:150, juntarRazaoNaBuild:158, escolherCandidatoDaIa:168, candidatosParaAEscolhaDaIa:201
- **evolucao.js** - Builds salvas por espécie, registro "O que o app fez sozinho" e o que acontece
  getBuildList:14, getActiveBuild:16, evoluirElencoSemDuplicar:40, podarAutoEvolved:61, evolveChainByX:66, reconciliarBuildsDe:104, restaurarAnteriorPara:129, ehEvolucaoPraFrente:143, reconciliarBuildsSalvas:148, carryUserData:167, devolveChainByX:206, logAutoAction:229, marcarRevisaoPosEvolucao:236, runTemAlgoPraZerar:247
- **ferramentas_ia.js** - Ferramentas que a IA consulta (aiTool_*) e a fábrica única delas (buildStandardAiTools).
  aiTool_getTeamWeaknesses:15, aiTool_getSpeciesRank:24, aiTool_getPriorityMoveOptions:51, aiTool_getAbilityMovepoolSynergy:75, aiTool_getConditionMoveSynergy:99, aiTool_getNextBossRoster:120, aiTool_getItemInfo:150, aiTool_getRemainingBosses:159, aiTool_getBoxCandidatesForBoss:182, aiTool_getSpeedBenchmark:204, buildStandardAiTools:249
- **formas_mega.js** - Família de formas (base <-> mega), modo de Mega Evolução, pedras e unidades de batalha.
  isMegaEvoKind:22, megaFormsOf:31, formFamilyPromptNote:39, megaModePromptLine:53, formFamilyOf:58, isMegaForm:64, megaMode:75, megaEvolutionUnlocked:88, etapaDaMega:151, megaFormLiberada:156, rotuloEtapaDaMega:157, battleFamilyOf:175, usableSpeciesFor:178, megaPromptBlock:182, stonesOf:209, battleUnitsOf:219, unitTypeMult:235
- **golpes.js** - O que cada golpe faz (papel pelo efeito real) e como descrevê-lo pra IA.
  dadoExterno:19, movePromptLine:28, ehGolpeDePivo:41, ehPrioridadeDeDano:49, moveRoleOf:53
- **gravacao_build_ia.js** - O caminho "resposta da IA -> build validada -> o que gravar", sem tela (ticket 06 da dívida
  motivoDeNaoGerarBuild:18, validarRespostaDeBuildDaIa:26, textoDaRetentativaDeBuild:35, validarRespostaDoLoteDeBuilds:40, buildDoLoteDeBuilds:45, respostaDaIaObsoleta:55, textoDeLimiteDeBuilds:61, gravarBuildDaIaNaLista:68, gravarRespostaValidadaDaIa:105, gravarPlanoDaIa:134
- **level_cap.js** - Level cap atual e golpes liberados por ele.
  levelCapMode:16, levelCapModeFromDifficulty:22, innatesAtivasNoNivel:34, nivelDaHabilidadeNoElite:40, innatesTravadasNoNivel:44, getCurrentCap:49, capOuPadrao:59, nivelDeCalculo:63, availableMovesFor:71, golpesTravadosNoCap:88
- **liberado_na_run.js** - O que a run libera: UMA função pura (etapa, levelCap, alvo) -> boolean para pedra mega, item e
  etapaDaPedra:16, etapaDoItem:18, liberadoNaRun:23, entradasDoJogador:34, xsDoJogador:38
- **lista_de_builds.js** - As 4 mudanças na lista de builds salvas de uma espécie (state.customBuilds[sname],
  trocarBuildAtivaNaLista:11, acrescentarVarianteNaLista:23, removerBuildDaLista:32, buildQueSaiParaAbrirVaga:43, liberarVagaNaLista:51
- **mono_run.js** - Mono run: o que dá pra pegar do seu tipo até a etapa atual (2026-09-26,
  linhaEvolutivaDe:20, compraDeInicialTexto:48, monotypeAtivo:73, serveProMono:75, fraquezasDoTipo:81, resistemAoTipo:84, cobreFraquezas:89, mudancaDeTipo:96, pctClima:134, climaQueCombina:142, orientacaoMono:145, avisoProximoLider:159, monoDisponibilidade:177
- **pipeline_build.js** - Pipeline de build com intenção (ticket 20 da dívida, desenho de 14/10/2026; docs/pipeline_de_build.md).
  pipelineEspecie:59, pipelineResolverAlvo:68, pipelineAmeacasDePrioridade:128, pipelineSemFuga:154, pipelineDuelo:155, pipelineLinhaDoGolpe:165, pipelineTierDaLinha:204, pipelineChaveDaLinha:209, pipelineSinergiasAtivas:214, pipelinePesoDoGolpe:219, pipelinePesoDoConjunto:222, pipelineTabela:228, pipelineValorDoGolpe:253, pipelineAvaliarConjunto:258, pipelineMontarConjunto:300, pipelineHabilidadesSemRegra:353, pipelineTierDoCandidato:361, pipelineVelocidade:364, pipelineMotivos:370, pipelineTiposExtraDeStab:397, pipelineSplitDoConjunto:412, pipelineNaturezaServe:422, pipelineAtributoFraco:426, pipelineNaturezaEEvs:432, pipelineGolpesComRecuo:446, pipelineSemRecuo:453, pipelineEvioliteServe:460, pipelineValidarRascunho:465, candidatosDeBuild:489, pipelineCandidatos:493 (+2)
- **plano_build.js** - Build que acompanha o jogador: plano de golpes por slot, estilo da build e
  evsTextoParaArray:24, estiloDeEvs:37, estiloDoRitmo:48, nivelDoGolpe:56, nivelDeEvolucaoDaForma:68, validarPlano:80, planoSaneado:107, golpesNoCap:123, trocasEntreCaps:141, curadasDe:153, curadaParaEstilo:160
- **prompts_ia.js** - Peças dos prompts de IA (o que vai pro modelo) e a tradução dos erros da IA pro
  soExistentes:32, itensDeEspeciePara:84, archetypeBuildGuidance:141, planoPromptBlock:158, contextoDoModoPrompt:168, anexarPlanoDaIa:208, sampleErrorMessage:230, versaoDosDados:273, cabecalhoIA:274, linhaHabilidadeIA:281, blocoEspecieIA:285, nomePapel:311, blocoPapelIA:312, blocoMovepoolIA:342, blocoRegrasDePapelIA:348, blocoMegaIA:354, comDescricaoIA:367, blocoItensDaEspecieIA:370, blocoItensIA:375, itensAindaIndisponiveisParaIA:382, blocoItensAindaIndisponiveisIA:387, blocoItensComunsIA:393, blocoTimeEmUsoIA:423, blocoManualIA:469, linhaVelocidadeIA:490, linhasProximaLutaIA:506, blocoContextoIA:542, envelopeContextoIA:545, linhasContextoDaEspecieIA:552, avisoInnatesEliteIA:575 (+16)
- **rank_da_run.js** - Rank v2 (2026-10-02, modelo aprovado pelo usuário - scripts/calcular_rank_v2.mjs):
  chaveDoRankDaDificuldade:22, rankDe:28, dominantesNoTipo:50, rankDaDificuldadeDe:68
- **reconciliar_build.js** - Uma build salva precisa continuar valendo pra espécie em que ela está AGORA.
  movepoolCompletoDe:17, habilidadeSubstitutaPara:26, reconciliarBuild:39
- **save.js** - Save do app: formato gravado (buildSave), leitura defensiva (applySave e os
  snamesToXs:15, xsToSnames:24, applySave:43, anteriorSaneado:223, sanitizarStrategySets:242, textoCanonicoDoSave:288, somaDoSave:303, conferirSomaDoSave:313, buildSave:320, montarSave:325, progressoDoSave:357, saveChegandoTemMenosProgresso:363, syncContentDiffers:377
- **sugestao_do_motor.js** - "Ficar com este time" do Meu Time (ticket time-pelo-motor/01, F5, 21/10/2026): além de trocar o time, grava as builds do
  sugestaoDoMembro:13, sugestaoMesmaBuild:24, ehBuildDoJogador:28, indiceQueSaiParaSugestao:31, planoDeGravarSugestoes:39, gravarSugestoesDoMotor:61
- **time_pelo_motor.js** - Modo Motor do Meu Time (ticket time-pelo-motor/01, Fase C, 21/10/2026): monta o time SEM IA, só pelo simulador.
  motorMedia:61, motorArred:62, criarCacheDoMotor:65, motorGuardar:66, motorNivelDaEtapa:73, motorMontarLuta:79, motorMontarLutaComum:90, motorEspacadas:99, motorLutasComunsDoContexto:108, motorLutasDoContexto:123, motorValorDoObjetivo:135, contextoDoMotor:141, motorRaizDaLinha:151, motorChaveDaBuild:166, motorChaveDoContexto:169, motorBuildDoCandidato:170, motorSecar:205, motorCandidatosEmPassos:206, motorCandidatos:228, motorAquecerBuildsEmPassos:230, motorUnidade:236, motorSimular:248, motorEhMeu:264, motorAvaliar:265, motorMetricas:268, motorTemGolpeDeLado:277, motorBuscar:278, motorBuscarEmPassos:279, motorPlanoB:332, montarTimePeloMotor:365 (+1)
- **time_pelo_motor_papeis.js** - Modo Motor do Meu Time, Fase D (papéis por build, tags, sinergia e explicação). Carrega depois de time_pelo_motor.js (mesmo escopo).
  motorMediana:22, motorUnidadeNaLuta:23, motorSemTipos:24, motorSemEsse:25, motorAux:26, motorLutasDeProva:27, motorAssinaturaDasLutas:28, motorCondicoes:33, motorLutaComClima:53, motorGanhoDaCondicao:56, motorSinergia:86, motorAlternativasArmadoras:101, motorExtrasDeSinergia:119, motorLutaDetalhada:136, motorSimularComClima:143, motorFoePorNome:155, motorProvasDosMembros:157, motorDeltaSemMembro:194, motorDeltaSemTipos:198, motorTemTipo:202, motorClassificar:207, motorTextos:306, motorTextosDaClassificacao:329
- **tipos.js** - Tabela de efetividade de tipos, habilidades que alteram dano recebido por tipo e tipagem de espécie.
  alwaysActiveAbilities:160, abilityTypeMod:169, perfilDefensivoDaEspecie:175, abilityTypeModFor:192, typeMultiplier:240, speciesTypeNames:250
- **validacao_build_ia.js** - Validação da build sugerida pela IA contra o dado real.
  megaStoneRuleFor:14, ehBerry:40, itemSeGastaNaLuta:41, regraItemConsumivelPara:47, regraItemConsumivelPrompt:57, papelNormalizado:76, conferirPapelDaBuild:80, evoluiAinda:108, conflitoDeNature:119, conflitoDeItem:136, citarDoModelo:158, evsEmFormatoValido:162, limitarEvsAoJogo:169, contextoDeValidacao:197, validateAiBuild:214, setsValidosDaResposta:482, ajustarBuildDaIa:498, entradaDaCuradaParaTimeNovo:517

## Interface - src/ui/
- **aba_chefoes.js** - Aba Chefões: lista, time do chefão por dificuldade, buffs de ginásio e exportação.
  initBosses:33, getFilteredBosses:148, nomeDaCategoriaDeChefao:175, campoDoChefaoHtml:178, opcionalHtml:185, iaDoChefaoHtml:190, hellDoChefaoHtml:199, bossCatColor:209, renderBossList:211, candidatosDoJogador:248, mesmoConjunto:265, guardarTimeAnterior:266, planoDaLuta:292, resumoDaLuta:305, simularSemTravarATela:324, montarTimeContraEsteChefao:337, selectBoss:437, renderGymSkillsCardHtml:456, bossMonCardHtml:493, renderBossDetail:589
- **abas.js** - Navegação entre abas (e o redesenho da aba que abre).
  posicionarProgresso:22, closeMorePanel:32
- **arquetipo.js** - Arquétipo do time, time sugerido e o Gerador Inteligente de Times.
  teamKeyFor:14, classeDeEntradaDoCardGerado:41, archetypeChipsHtml:53, resumoDoArquetipo:74, archetypeCardHtml:85, generateTeamForArchetype:153, applyRecommendedTeam:207, computeTeamGenerationValidation:253, generateTeamUsageGuide:270, generateCompleteTeam:302, vereditoDaLutaHtml:365, buffsMudaram:383, planoContraChefaoHtml:387, generatedTeamCardHtml:436, renderTeamStrategy:482, climaQueCombinaHtml:495, monoRunCardHtml:516, renderMonoRun:573, renderTeamAnalysis:599
- **auto_evolucao.js** - Registro "O que o app fez sozinho" na tela e a auto-evolução do time/caixa pelo level cap.
  renderAutoLog:9, autoEvolveRoster:20
- **caixa.js** - Aba Caixa (PC Box): grade por páginas, busca e ações de cada Pokémon da caixa.
  renderBox:16
- **dex_ficha.js** - Dex: ficha do Pokémon (stats, habilidades, golpes, rank, evolução) e o agendamento do resumo do topo.
  abilityCard:14, buildSynergyHtml:42, conditionMoveSynergyNoteHtml:70, evoConditionText:88, renderMovesTable:111, rankBadgeHtml:169, rankDuplaBadgeHtml:204, rankStageBadgeHtml:212, roleTagsHtml:224, howToObtainText:245, whereToFindText:275, badgeDeTierHtml:293, marcasDoRankHtml:297, rankInfoLineHtml:319, goToDexSpecies:365, goToDexSpeciesStrategies:395, fichaStatsHtml:424, fichaEfetividadeHtml:434, fichaNavHtml:446, fichaEvolucaoHtml:457, fichaFormasHtml:475, fichaComoObterHtml:497, fichaCabecalhoHtml:515, fichaConhecerHtml:569, fichaGolpesHtml:591, fichaNotasHtml:602, selectSpecies:610, scheduleDashboardRefresh:737, updateResetTeamBoxBtn:751
- **dex_lista.js** - Dex: filtro de tipo, busca, ordenação, lista em lotes e o modal de troca do time.
  moveListboxCursor:118, bst:152, statPct:163, statTier:164, getFiltered:171, linhaDaListaHtml:212, renderMaisLista:232, renderList:243, preencherListaSeCurta:283, syncRowAddButtons:313, openSwapModal:328, closeSwapModal:367, openConfirmModal:403, closeConfirmModal:411, esconderToast:437, agendarToast:451, flashToast:473
- **editor_build.js** - Formato Showdown, cópia e o editor "Meu build" da ficha (e os sets de Estratégias).
  copyText:11, itemDescHtml:45, hpEvEfficiencyNote:83, evBreakpointNote:116, buildEvNotesHtml:141, buildNoteHtml:155, buildContextNotesHtml:161, seloDaBuildHtml:168, megaModeBuildNoteHtml:174, buildEntryHtml:182, buildChipsHtml:212, myBuildEditorHtml:223, updateMyBuildEvTotal:332, updateMyBuildStatus:362, strategySetsHtml:432, wireMyBuildEditor:465, lerFormularioDoEditor:493, apagarBuildComDesfazer:516
- **ficha_extras.js** - Ficha: comparar builds, anotações, histórico de builds e builds de referência dos chefões.
  compareCardHtml:14, compareResultHtml:22, notesCardHtml:78, buildHistoryHtml:87, bossReferenceHtml:103, rotuloDaBuild:170, planoDaBuildHtml:179, megaLockedTagHtml:199, otherFormsHtml:206
- **ia.js** - IA: cliente único pedirIA e os geradores de build/Estratégias (o pedido e o status na tela).
  erroIAPassageiro:52, comTempoLimite:61, opcoesDaIA:72, obterClienteSample:75, esperarMs:79, pedirIA:80, chamarModelo:90, pedirIAAgora:109, gravarBuildValidadaDaIa:141, aplicarCuradaNoTimeNovo:153, gerarBuildsDoTimeComIA:176, generateBuildWithAI:278, gerarPlanoParaBuild:342
- **modo_motor.js** - Modo Motor no Meu Time (ticket time-pelo-motor/01, Fase F2, 21/10/2026). O Modo Motor é o PADRÃO (aprovação do usuário, 21/10):
  modoMotorCache:20, modoMotorChave:22, modoMotorCapturados:27, modoMotorFavoritosValidos:32, modoMotorSegundos:36, modoMotorEsperar:37, modoMotorAquecer:41, modoMotorMontar:69, modoMotorVarianteDe:119, modoMotorFicarComVariante:120, modoMotorSeletorHtml:153, modoMotorFavoritosHtml:161, modoMotorBotaoHtml:173, modoMotorMembroHtml:178, modoMotorRodapeHtml:191, modoMotorVarianteHtml:206, modoMotorResultadoHtml:234
- **nucleo.js** - Estado do app (state), gravação no aparelho e a camada de ações (acao/TELAS): toda mudança grava uma vez e redesenha cada tela uma vez.
  lsGet:83, lsSet:84, setOrReplaceActiveBuild:93, addBuildVariant:100, setActiveBuildIndex:103, abrirVagaPreservando:117, removeBuildIndex:123, reinserirBuild:130, persist:143, showStorageBanner:165, abaAtiva:183, redesenharFichaAberta:196, telasDeBuild:236, acao:242, fichaAfetada:260, concluirAcoes:265, loadA11yPrefs:284, applyA11yPrefs:290, saveA11yPrefs:294, corDoTema:306
- **pipeline_tela.js** - Pipeline de build na tela (ticket docs/tickets/pipeline-build-2026-10-14/02): só desenho. As regras (candidatos, hit-kill,
  pipelineResultado:14, pipelineAlvoValido:26, pipelineSeletorDeAlvoHtml:32, pipelineResumoDoAlvo:46, pipelineVereditoDe:53, pipelineSeloHtml:63, pipelineGolpeHtml:71, pipelineCandidatoHtml:77, pipelinePainelDaFichaHtml:96, pipelineDesenharFicha:113, pipelineDesenharTime:125
- **progresso.js** - Aba Progresso: dificuldade, level cap, insígnia, modo de Mega, confirmação da run e acessibilidade.
  renderRunStatus:9, renderCapBadge:17, renderCapDisplay:21, renderProgressTrail:30, renderChangelog:92, initProgress:105
- **quem_resolve.js** - "Quem derruba este chefão" (ticket docs/tickets/pipeline-build-2026-10-14/04): o caso B do pipeline (especiesQueResolvem,
  quemResolveEstadoDe:14, quemResolveChave:17, quemResolveEmCache:21, quemResolveCalcular:22, quemResolveOrigemHtml:37, quemResolveItemHtml:43, quemResolveListaHtml:50, quemResolvePreencher:66, quemResolveCardHtml:83, quemResolveRestaurar:103
- **resumo_luta.js** - Confronto e resumo da próxima luta (card do chefão, resumo do topo da Dex, card no fim do Time).
  confrontoMultTxt:11, confrontoNomesTxt:12, confrontoCelulaHtml:15, confrontoResumoTxt:25, trocaBuracosTxt:40, confrontoAjustesHtml:44, confrontoPlanoHtml:67, bossConfrontoHtml:96, dashboardConfrontoHtml:135, boxFitNote:154, megaOfNote:175, renderDashboard:183, nextFightDetailHtml:215, renderNextFightCard:257
- **revisao_automatica.js** - Revisão automática das builds do time (evolução, plano, golpe-ponte) e as trocas do plano ao mudar o cap.
  ponteFalhas:22, registrarFalhaPonte:23, tarefaDeRevisao:24, revisaoEmAndamento:43, revisaoStatusHtml:44, iaLiberadaSemPerguntar:61, processarRevisoes:72, registrarTrocasDoPlano:149, agendarRevisoes:169, generateStrategySets:182
- **sync.js** - Sincronização entre aparelhos (capability db) e os avisos de sync.
  aplicarSaveRemoto:45, conflitoDeProgresso:61, remotoComSomaErrada:88, pushToSync:95, showSyncBanner:104, syncBannerOffset:118, atualizarTituloDoSubtitulo:138, setSyncStatusIndicator:142, scheduleSyncRetry:161, connectSync:172
- **time.js** - Aba Time: cards dos membros, troca com a caixa, times salvos e "Novo jogo".
  renderTeam:8, swapPanelHtml:144, telasDeElenco:170, rosterMove:178, teamsMatch:199, renderSavedTeams:206, carregarTimeSalvo:245, excluirTimeSalvo:273, comecarRenomearTimeSalvo:291, salvarNomeTimeSalvo:297, zerarRun:356
- **tipos.js** - Aba Tipos: tabela de efetividade, velocidades e compêndio de papéis.
  renderTypeMatrix:9, renderSpeedTiers:35, wireSpeedTiersOnce:63, computeRoleCompendium:91, renderRoleCompendium:113

## Scripts (.mjs) - scripts/
- **alarme_upstream.mjs** - Alarme de versão nova do Elite Redux (2026-09-24, pedido do usuário: "faz o
  ultimaVersaoDoDex:35, versaoDaPaginaDeDownload:43, hashDoConteudo:50, baixar:55, main:76
- **build.mjs** - Montagem do artifact_final.html em Node (fase 8 da refatoração, 2026-09-24).
  ler:21, trocarTudo:24, falhar:25
- **cache_sabotagem.mjs** - Cache de "arquivo lembrado" da sabotagem (tests/.sabotagem_cache.json, fora do git).
  mesclarCache:9, ler:18, gravarCacheMesclando:26
- **calcular_rank_duelo.mjs** - Rank por DUELO SIMULADO contra os chefões reais (reunião de 2026-09-28,
  montarFoe:72, notaDaEspecie:90, percentis:146, tierDe:157, linha:170, med:186
- **calcular_rank_v2.mjs** - Rank v2 (modelo aprovado pelo usuário em 2026-10-02, depois da pesquisa de método):
  capDe:38, foe:42, ARG:60, etapaDe:79, br:82, avaliar:89, notas:183, percentis:191, tierDe:196, lutasComunsParaOMeuTime:225
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
- **comparar_motor_ia.mjs** - Comparação Motor x IA (ticket time-pelo-motor/01, Fase E).
  fatia:21, varianteCasada:41, montarRun:44, gerarPrompt:55, lerRespostaIA:62, timeDeMembros:75, media:85, desvio:86, metricasDoTime:87, preparar:102, f1:126, comparar:127
- **conferir_chefoes_config.mjs** - Confere os times dos chefões do bosses.json contra a config oficial do jogo
  lerTreinadores:14, constante:41, semPrefixo:43, mapasDoDado:48, usarMapas:55, compararMon:57, conferir:74, preencherItensPerdidos:100, corrigirTimes:121
- **diff_versoes.mjs** - Diff entre duas versões do gameData do NextDex, com análise de impacto
  lerGameData:20, igual:25, compararLista:28, compararVersoes:53, impacto:67, lista:106, formatarRelatorio:113, arquivar:130, lerDadosDoApp:139
- **encalhados.mjs** - Lista o trabalho encalhado: worktrees com mudança sem commit, staging na pasta principal
  git:13, normalizarCaminho:22, lerWorktrees:27, lerStatus:45, avaliarAlertas:66, idade:77, formatarRelatorio:84, coletar:105
- **etapa_do_mapa.mjs** - Resolvedor único de mapa do jogo -> etapa da run (índice de levelcaps.json), compartilhado pelo rank de
  chaveDoMapa:7, etapaDoLocalDaPlanilha:9, criarEtapaDoMapa:21
- **extrair_categorias_golpes.mjs** - Categorias de golpe, chance e efeito extra. As categorias que reforçam habilidades (soco, mordida, corte,
- **gerar_mega_forms.mjs** - Completa data/mega_forms.json (pedra -> forma Mega/Primal) com as evoluções do dado bruto 2.65beta.
- **gerar_onde_achar_itens.mjs** - Gera data/onde_achar_itens.json: onde cada item se consegue na run e a partir de qual etapa (ticket 07,
  ler:21, anotar:32, localLegivel:37, etapaDaPasta:38
- **gerar_poder_variavel.mjs** - Gera data/poder_variavel.json (ticket 16, 07/10/2026): o que o motor precisa para os golpes de poder 1 no dado,
- **gerar_presentes.mjs** - Completa data/how_to_obtain.json com os presentes (Mystery Gift) da tabela oficial do jogo:
  nomeDoItem:13
- **gerar_rank_disponibilidade.mjs** - Gera data/rank_disponibilidade.json: em que etapa (índice de levelcaps.json) cada
  marcar:33, varaDaVaga:52, exigencia:57, soPresenteNaPlanilha:99, etapaDoNivel:109
- **gerar_sinergia_habilidade_movepool.mjs** - Porte para Node de scripts/compute_ability_movepool_synergy.ps1 (15/10/2026). Gera data/species_ability_synergy.json: cruza cada habilida...
  textosDasHabilidades:32, normalizar:61, tiposCitados:65, gerarSinergia:73
- **guarda_lutas_comuns.mjs** - Guarda de publicação (todas-as-lutas/02): data/lutas_comuns_run.json só pode ir para o app se vier do rank COMPLETO.
  problemaDasLutasComuns:3
- **importar_dex_strategy.mjs** - Importa para data/builds.json as estratégias oficiais por espécie do arquivo src/data/dex-strategy.md do código do jogo
  norm:16, lerBlocos:21, montarIndice:44, resolverEspecie:70, primeiroDe:84, converter:86, assinatura:150, juntar:151, main:171
- **importar_mono.mjs** - Importa a planilha oficial "Mono earliest locations" (índice oficial:
  lerCsv:38, lerNome:60, chave:69, distancia:70, variantes:88, casarNomes:101, lerAba:121, main:140
- **itens_pela_config.mjs** - Parâmetros de item pelo código do jogo, não por números soltos no motor.
  lerItensDaConfig:18, TIPO_EN:46, efeitoDoItem:49, itensDeBatalha:55
- **mapa_do_codigo.mjs** - Gera docs/mapa-do-codigo.md: por arquivo de src/regras, src/ui e scripts/*.mjs, a responsabilidade
  responsabilidade:18, funcoes:29, gerarMapa:39
- **medir_texto_novo.mjs** - Mede o que um dado novo da NextDex faz com o parser de habilidades do motor (ticket versao-nova/04, 15/10/2026).
  semClimas:17, limpar:18, lerTodas:23
- **nivel_da_mudanca.mjs** - Classificador do gancho por nível (melhoria A de docs/pipeline_do_projeto.md, 2026-10-14).
  ambienteDosFilhos:26, ehMaster:33, normalizar:39, nivelDoArquivo:59, nivelDaMudanca:76, etapaSabotagem:105, etapasDoNivel:124, precisaDaVagaPesada:141, arquivosEmStaging:150, classificarPorStaging:160
- **playtester_curadoria.mjs** - Curadoria do Playtester (pedido do usuário, 2026-09-24): toda build que a IA
  evsTexto:47, avaliar:49
- **prototipo_kit_sinergia.mjs** - PROTÓTIPO DESCARTÁVEL (10/10/2026) — fases 1 e 2 do pipeline de build
  nomeHab:16
- **rank_escolha.mjs** - Escolha do set no rank v2 (ticket 08, 07/10/2026). A soma rápida (nota do duelo contra todos os
  melhoresPelaSoma:9, mediaDoEixo:13, notaDosEixos:18, escolherPelaNotaFinal:22
- **rank_fatia.mjs** - Rank com fatia fixa de peso (ticket todas-as-lutas/02, decisão do usuário em 16/10/2026): chefões 60% e lutas comuns 40%.
  notasComFatia:10, comunsMaisPerigosas:37
- **remapear_sprite_index.mjs** - Sprites pelo NOME da espécie (15/10/2026). O atlas (data/sprite_atlas.png) foi montado com o índice pelo número da espécie (x) do
  indicePorNumero:8
- **sabotagem_incremental.mjs** - Sabotagem incremental no master (decisão do usuário, 14/10/2026): no master a sabotagem roda só as
  git:17, caminhoDoVerde:22, lerVerde:28, gravarVerde:40, modoDaSabotagemNoMaster:55, selecionarMutacoes:68
- **servidor_estatico.mjs** - Servidor estático dos testes (fase 6 da refatoração, 2026-09-24): serve a raiz
- **vaga.mjs** - Vaga de máquina para verificação pesada (melhoria B de docs/pipeline_do_projeto.md, 2026-10-13).
  pasta:38, vivo:44, lerJson:49, donoAbandonado:55, existe:61, dorme:63, filaViva:67, segurarVaga:80, comVaga:152
- **validar_dado_cru.mjs** - Validação do dado CRU do NextDex (lote 2, 2026-10-06). Roda ANTES do
  unicos:19, validarDadoCru:21
- **validar_dados.mjs** - Travas de dado do build (fase 8 da refatoração, 2026-09-24: porte em Node de
  carregar:12, lista:13, validarBuilds:28, validarInvariantes:98
- **validar_rank_v2.mjs** - Ponto 7 do rank v2: conferir o rank novo contra referências de fora, sem ajustar peso.
  norm:26, achar:30, postos:32, spearman:41, f2:49, media:50, notaV1:52
- **varrer_chefoes.mjs** - Varredura dos dados de TODOS os chefes (membros de party/insane/hell): pedra sem Mega, habilidade/golpe sem id,
  add:6
- **verificar.mjs** - Verificação antes de um commit (hook de pre-commit) e antes de publicar (prepare_publish.ps1).
  rodar:39
