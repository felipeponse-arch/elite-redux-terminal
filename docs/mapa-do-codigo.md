# Mapa do código

Gerado por `npm run mapa` (scripts/mapa_do_codigo.mjs); o pré-commit regenera quando há `src/` ou `scripts/` em staging.
Não edite à mão. Conflito de junção neste arquivo: regenere (`npm run mapa -- --rapido`) e adicione.
Uso: ache o arquivo aqui, depois abra só o trecho (`arquivo:linha`, offset/limit). Quem chama quem entre arquivos: [chamadas-regras](mapa/chamadas-regras.md), [chamadas-ui](mapa/chamadas-ui.md).

## Regras (lógica pura) - src/regras/
- **avisos_build.js** - Lote 5 das pesquisas de 06/10 (ideias do GPT, seções 3.2/17/26/42): Avisos de build e selo de
  avisosDaBuild:8, seloDaBuild:82, primeiroLugarDoItem:94, rotuloDaEtapaDoItem:98, ondeAcharItemTexto:100
- **builds.js** - Build mostrada (effectiveBuild: salva > herdada da base pela Mega > curada do
  entradaDeBuild:23, stripNote:49, showdownName:54, showdownSet:58, evsToShowdownText:75, teamItemsInUse:90, comecarLoteDeBuilds:118, concluirBuildDoLote:119, encerrarLoteDeBuilds:120, contaNoTime:121, teamMovesInUse:123, itensEmUsoComQuem:151, teamRolesInUse:163, golpesFuturosDe:177, effectiveBuild:200
- **calc_stat.js** - Fórmula de status final (base+IV+EV+nível+nature+item) e o que deriva
  itemRuleFor:106, calcFinalStat:119, minEvSameStat:159, nextEvBreakpoint:169, priorityOrderForEvs:194, trimAndReallocateEvs:197
- **chefoes.js** - Chefões e a próxima luta: o que falta vencer, variante por dificuldade,
  gymLeaderBaseName:45, getRemainingBossEntries:51, computeSharedRisks:109, bossSpeedSummary:132, computeBossAttackTypes:147, bossSafetyScore:171, bestBoxCandidateForBoss:183, confrontoUnitOf:233, confrontoFoesDe:258, confrontoMelhorUnidade:269, confrontoMinhasUnidades:279, confrontoUnidadesDaCaixa:289, confrontoParaParty:298, bossPartyPorDificuldade:327, bestRankForm:333, nextFightCx:351, varianteDoChefao:358, gymSkillsSummaryFor:367, regraDeCampoDoChefao:416, comportamentoDaIADoChefao:433, habilidadesExtrasDoHell:446, regrasDoHell:447, ehRevancheDeLider:454, buffsParaMostrarDoChefao:473, buffsAtivosDoChefao:482, computeSpeedTiers:495
- **condicoes_habilidade.js** - Habilidade que só funciona numa condição do PRÓPRIO Pokémon (status,
  descricaoDeHabilidade:89, descricaoDeHabilidadePorId:100, expandirTextoDeHabilidade:111, habilidadeArma:125, nomesDeHabilidades:128, podeTerStatus:136, garantiaDoTime:144, garantiaDaCondicao:158, comoGarantir:174, condicaoDaBuild:193, precisaDeSetter:216, blocoCondicoesIA:241
- **confronto.js** - Motor de confronto: dado o time do jogador e o time de um chefão, diz quem
  confrontoDamagingMoves:29, confrontoMoveType:32, foeAbilityIds:36, foeFromBossMember:49, ofensaContra:59, ameacaDe:91, velocidadeBase:114, confrontoDuelo:126, confrontoTime:146, coberturaSugerida:196, confrontoDuelosDe:243, valorDoTime:249, melhoresTrocas:265, cuidadosDoChefao:302, aberturaEmDupla:319
- **dados_base.js** - Tabelas derivadas dos dados do jogo (tipos, golpes, espécies, rótulos conferidos, naturezas) e utilitários puros.
  dataLabel:23, getSpeciesByX:78, getSpeciesBySname:79, snameOf:80, clampInt:103, uniqueIds:118, descricaoDaEspecie:185
- **duelo.js** - Simulador de duelo 1x1 contra Pokémon reais de chefão - o motor do rank
  nomeHabDuelo:46, textoHabDuelo:203, bonusDeGolpeLidoDoTextoDuelo:231, acertosDoGolpeDuelo:232, golpeUtilNoDuelo:237, categoriaNoDuelo:249, temContatoDuelo:255, golpesDeRecargaAte:258, golpesDeDueloAte:265, golpesDeStatusAte:271, tipoDoTextoDuelo:292, fraseFixaDuelo:297, categoriasDoTextoDuelo:312, categoriasDoGolpeDuelo:315, modoHellDuelo:340, statusDoTrechoDuelo:385, presencaDoStatus:392, todosOsStatusDuelo:398, lerStatusDaFraseDuelo:403, chanceDoEstagioCrit:453, lerCriticoDaFraseDuelo:454, lerCondicaoDaFraseDuelo:480, estagioDoTexto:509, multDoEstagio:510, lerEstagioDaFraseDuelo:512, poderDoGolpeDuelo:567, lerExtrasDaFraseDuelo:569, lerCuraDaFraseDuelo:624, filtroDoTextoDuelo:657, empurraStatusDuelo:667 (+142)
- **escolha_ia_candidatos.js** - A IA ESCOLHE ENTRE os candidatos do pipeline de build (passo 4 de docs/pipeline_de_build.md; ticket 03 de
  textoDeCandidatoParaIA:20, blocoDeCandidatosParaIA:33, regrasDaEscolhaIA:40, linhaDePapelNaturalIA:47, linhaDeFraquezasDoTimeIA:51, blocoTimeCurtoIA:55, linhaDoChefaoPorEspecieIA:68, blocoPlanoCurtoIA:72, objetivoDaEscolhaIA:80, montarPromptEscolhaDeBuild:86, montarPromptEscolhaDoTime:103, indiceDaEscolhaIA:126, respostaForaDoCandidato:132, fecharCandidatoDaEscolha:142, textoDaRazaoDaEscolha:150, juntarRazaoNaBuild:158, escolherCandidatoDaIa:168, candidatosParaAEscolhaDaIa:201
- **evolucao.js** - Builds salvas por espécie, registro "O que o app fez sozinho" e o que acontece
  getBuildList:14, getActiveBuild:16, evoluirElencoSemDuplicar:40, podarAutoEvolved:61, evolveChainByX:66, reconciliarBuildsDe:104, restaurarAnteriorPara:129, ehEvolucaoPraFrente:143, reconciliarBuildsSalvas:148, carryUserData:167, devolveChainByX:206, logAutoAction:229, marcarRevisaoPosEvolucao:236, runTemAlgoPraZerar:247
- **ferramentas_ia.js** - Ferramentas que a IA consulta (aiTool_*) e a fábrica única delas (buildStandardAiTools).
  aiTool_getTeamWeaknesses:15, aiTool_getSpeciesRank:24, aiTool_getPriorityMoveOptions:51, aiTool_getAbilityMovepoolSynergy:75, aiTool_getConditionMoveSynergy:99, aiTool_getNextBossRoster:120, aiTool_getItemInfo:150, aiTool_getRemainingBosses:159, aiTool_getBoxCandidatesForBoss:182, aiTool_getSpeedBenchmark:204, buildStandardAiTools:249
- **formas_mega.js** - Família de formas (base <-> mega), modo de Mega Evolução, pedras e unidades de batalha.
  isMegaEvoKind:22, megaFormsOf:31, formFamilyPromptNote:39, megaModePromptLine:53, formFamilyOf:58, isMegaForm:64, megaMode:75, megaEvolutionUnlocked:88, etapaDaMega:174, megaFormLiberada:179, megaSoNoDebug:180, quandoMega:182, rotuloEtapaDaMega:183, battleFamilyOf:202, usableSpeciesFor:205, megaPromptBlock:209, stonesOf:236, battleUnitsOf:246, unitTypeMult:262
- **golpes.js** - O que cada golpe faz (papel pelo efeito real) e como descrevê-lo pra IA.
  dadoExterno:19, movePromptLine:28, ehGolpeDePivo:41, ehPrioridadeDeDano:49, moveRoleOf:53
- **gravacao_build_ia.js** - O caminho "resposta da IA -> build validada -> o que gravar", sem tela (ticket 06 da dívida
  motivoDeNaoGerarBuild:18, validarRespostaDeBuildDaIa:26, textoDaRetentativaDeBuild:35, validarRespostaDoLoteDeBuilds:40, buildDoLoteDeBuilds:45, respostaDaIaObsoleta:55, textoDeLimiteDeBuilds:61, gravarBuildDaIaNaLista:68, gravarRespostaValidadaDaIa:105, gravarPlanoDaIa:134
- **level_cap.js** - Level cap atual e golpes liberados por ele.
  levelCapMode:16, levelCapModeFromDifficulty:22, innatesAtivasNoNivel:34, nivelDaHabilidadeNoElite:40, innatesTravadasNoNivel:44, getCurrentCap:49, capOuPadrao:61, nivelDeCalculo:65, availableMovesFor:73, golpesTravadosNoCap:90
- **liberado_na_run.js** - O que a run libera: UMA função pura (etapa, levelCap, alvo) -> boolean para pedra mega, item e
  etapaDaPedra:15, etapaDoItem:17, liberadoNaRun:22, entradasDoJogador:33, xsDoJogador:37
- **lista_de_builds.js** - As 4 mudanças na lista de builds salvas de uma espécie (state.customBuilds[sname],
  trocarBuildAtivaNaLista:11, acrescentarVarianteNaLista:23, removerBuildDaLista:32, buildQueSaiParaAbrirVaga:43, liberarVagaNaLista:51
- **mono_run.js** - Mono run: o que dá pra pegar do seu tipo até a etapa atual (2026-09-26,
  linhaEvolutivaDe:20, compraDeInicialTexto:48, monotypeAtivo:73, serveProMono:75, fraquezasDoTipo:81, resistemAoTipo:84, cobreFraquezas:89, mudancaDeTipo:96, pctClima:134, climaQueCombina:142, orientacaoMono:145, avisoProximoLider:159, monoDisponibilidade:177
- **pipeline_build.js** - Pipeline de build com intenção (ticket 20 da dívida, desenho de 14/10/2026; docs/pipeline_de_build.md).
  pipelineEspecie:59, pipelineResolverAlvo:71, pipelineAmeacasDePrioridade:147, pipelineSemFuga:173, pipelineDuelo:174, pipelineLinhaDoGolpe:184, pipelineTierDaLinha:223, pipelineChaveDaLinha:228, pipelineSinergiasAtivas:233, pipelinePesoDoGolpe:238, pipelinePesoDoConjunto:241, pipelineTabela:247, pipelineValorDoGolpe:273, pipelineAvaliarConjunto:278, pipelineMontarConjunto:328, pipelineHabilidadesSemRegra:381, pipelineTierDoCandidato:389, pipelineVelocidade:392, pipelineMotivos:398, pipelineTiposExtraDeStab:425, pipelineSplitDoConjunto:440, pipelineNaturezaServe:450, pipelineAtributoFraco:454, pipelineNaturezaEEvs:460, pipelineGolpesComRecuo:474, pipelineSemRecuo:481, pipelineEvioliteServe:488, pipelineValidarRascunho:493, candidatosDeBuild:517, pipelineCandidatos:521 (+2)
- **plano_build.js** - Build que acompanha o jogador: plano de golpes por slot, estilo da build e
  evsTextoParaArray:24, estiloDeEvs:37, estiloDoRitmo:48, nivelDoGolpe:56, nivelDeEvolucaoDaForma:68, validarPlano:80, planoSaneado:107, golpesNoCap:123, trocasEntreCaps:141, curadasDe:153, curadaParaEstilo:160
- **prompts_ia.js** - Peças dos prompts de IA (o que vai pro modelo) e a tradução dos erros da IA pro
  soExistentes:32, itensDeEspeciePara:84, archetypeBuildGuidance:141, planoPromptBlock:158, contextoDoModoPrompt:168, anexarPlanoDaIa:208, sampleErrorMessage:230, versaoDosDados:273, cabecalhoIA:274, linhaHabilidadeIA:281, blocoEspecieIA:285, nomePapel:311, blocoPapelIA:312, blocoMovepoolIA:342, blocoRegrasDePapelIA:348, blocoMegaIA:354, comDescricaoIA:367, blocoItensDaEspecieIA:370, blocoItensIA:375, itensAindaIndisponiveisParaIA:382, blocoItensAindaIndisponiveisIA:387, blocoItensComunsIA:393, blocoTimeEmUsoIA:423, blocoManualIA:469, linhaVelocidadeIA:490, linhasProximaLutaIA:506, blocoContextoIA:542, envelopeContextoIA:545, linhasContextoDaEspecieIA:552, avisoInnatesEliteIA:575 (+16)
- **rank_da_run.js** - Rank v2 (2026-10-02, modelo aprovado pelo usuário - scripts/calcular_rank_v2.mjs):
  chaveDoRankDaDificuldade:23, rankDe:29, dominantesNoTipo:51, rankDaDificuldadeDe:69
- **reconciliar_build.js** - Uma build salva precisa continuar valendo pra espécie em que ela está AGORA.
  movepoolCompletoDe:17, habilidadeSubstitutaPara:26, reconciliarBuild:39
- **save.js** - Save do app: formato gravado (buildSave), leitura defensiva (applySave e os
  snamesToXs:15, xsToSnames:24, applySave:47, anteriorSaneado:236, sanitizarStrategySets:255, textoCanonicoDoSave:301, somaDoSave:316, conferirSomaDoSave:326, saveEnviavel:333, buildSave:336, montarSave:341, progressoDoSave:377, saveChegandoTemMenosProgresso:383, syncContentDiffers:397
- **sugestao_do_motor.js** - "Ficar com este time" do Meu Time (ticket time-pelo-motor/01, F5, 21/10/2026): além de trocar o time, grava as builds do
  sugestaoDoMembro:13, sugestaoMesmaBuild:24, ehBuildDoJogador:28, indiceQueSaiParaSugestao:31, planoDeGravarSugestoes:39, gravarSugestoesDoMotor:61
- **time_pelo_motor.js** - Modo Motor do Meu Time (ticket time-pelo-motor/01, Fase C, 21/10/2026): monta o time SEM IA, só pelo simulador.
  motorMedia:61, motorArred:62, criarCacheDoMotor:65, motorGuardar:66, motorNivelDaEtapa:73, motorMontarLuta:79, motorMontarLutaComum:90, motorEspacadas:99, motorLutasComunsDoContexto:108, motorLutasDoContexto:123, motorValorDoObjetivo:135, contextoDoMotor:141, motorRaizDaLinha:151, motorChaveDaBuild:166, motorChaveDoContexto:169, motorBuildDoCandidato:170, motorSecar:205, motorCandidatosEmPassos:206, motorCandidatos:228, motorAquecerBuildsEmPassos:230, motorUnidade:236, motorSimular:248, motorEhMeu:264, motorAvaliar:265, motorMetricas:268, motorTemGolpeDeLado:277, motorBuscar:278, motorBuscarEmPassos:279, motorPlanoB:332, motorItensCandidatos:371 (+4)
- **time_pelo_motor_papeis.js** - Modo Motor do Meu Time, Fase D (papéis por build, tags, sinergia e explicação). Carrega depois de time_pelo_motor.js (mesmo escopo).
  motorMediana:22, motorUnidadeNaLuta:23, motorSemTipos:24, motorSemEsse:25, motorAux:26, motorLutasDeProva:27, motorAssinaturaDasLutas:28, motorCondicoes:33, motorLutaComClima:53, motorGanhoDaCondicao:56, motorSinergia:86, motorAlternativasArmadoras:101, motorExtrasDeSinergia:119, motorLutaDetalhada:136, motorSimularComClima:143, motorFoePorNome:155, motorProvasDosMembros:157, motorDeltaSemMembro:194, motorDeltaSemTipos:198, motorTemTipo:202, motorClassificar:207, motorTextos:306, motorTextosDaClassificacao:329
- **tipos.js** - Tabela de efetividade de tipos, habilidades que alteram dano recebido por tipo e tipagem de espécie.
  alwaysActiveAbilities:163, abilityTypeMod:172, perfilDefensivoDaEspecie:178, abilityTypeModFor:195, typeMultiplier:243, speciesTypeNames:253
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
  modoMotorCache:19, modoMotorChave:21, modoMotorCapturados:26, modoMotorFavoritosValidos:31, modoMotorSegundos:35, modoMotorEsperar:36, modoMotorAquecer:40, modoMotorMontar:68, modoMotorVarianteDe:118, modoMotorFicarComVariante:119, modoMotorSeletorHtml:152, modoMotorFavoritosHtml:160, modoMotorBotaoHtml:172, modoMotorMembroHtml:177, modoMotorRodapeHtml:190, modoMotorVarianteHtml:205, modoMotorResultadoHtml:233
- **nucleo.js** - Estado do app (state), gravação no aparelho e a camada de ações (acao/TELAS): toda mudança grava uma vez e redesenha cada tela uma vez.
  lsGet:84, lsSet:85, setOrReplaceActiveBuild:94, addBuildVariant:101, setActiveBuildIndex:104, abrirVagaPreservando:118, removeBuildIndex:124, reinserirBuild:131, persist:144, showStorageBanner:166, abaAtiva:184, redesenharFichaAberta:197, telasDeBuild:237, acao:243, fichaAfetada:261, concluirAcoes:266, loadA11yPrefs:285, applyA11yPrefs:291, saveA11yPrefs:295, corDoTema:307, loadSave:337
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
  aplicarSaveRemoto:45, conflitoDeProgresso:61, remotoComSomaErrada:88, pushToSync:96, showSyncBanner:105, syncBannerOffset:119, atualizarTituloDoSubtitulo:139, setSyncStatusIndicator:143, scheduleSyncRetry:162, lerSaveLocal:174, connectSync:179
- **time.js** - Aba Time: cards dos membros, troca com a caixa, times salvos e "Novo jogo".
  renderTeam:8, swapPanelHtml:144, telasDeElenco:170, rosterMove:178, teamsMatch:199, renderSavedTeams:206, carregarTimeSalvo:245, excluirTimeSalvo:273, comecarRenomearTimeSalvo:291, salvarNomeTimeSalvo:297, zerarRun:356
- **tipos.js** - Aba Tipos: tabela de efetividade, velocidades e compêndio de papéis.
  renderTypeMatrix:9, renderSpeedTiers:35, wireSpeedTiersOnce:63, computeRoleCompendium:91, renderRoleCompendium:113

## Scripts (.mjs) - scripts/
- **alarme_upstream.mjs** - Alarme de versão nova do Elite Redux (2026-09-24, pedido do usuário: "faz o
  ultimaVersaoDoDex:35, versaoDaPaginaDeDownload:43, hashDoConteudo:50, baixar:55, main:76
- **atualizar_de_config.mjs** - Atualiza data/gameData_2654.json a partir do er-config (código/config do jogo é a verdade).
  saida:10, desescapar:14, parse:23, ler:41, enumMap:42, idx:49, porId:54
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
- **compute_move_effects.ps1** - (sem comentário de topo)
  Get-MoveEffects:85
- **compute_move_roles.ps1** - (sem comentário de topo)
- **compute_species_rank.ps1** - (sem comentário de topo)
  Get-AbilityScore:164, Get-BossDefenseScore:211, Get-MovepoolScore:237, Get-TypeScore:274, Get-Stage:337, Get-PercentileRanks:387, Get-Tier:412, Compute-Tiers:430
- **compute_species_role.ps1** - (sem comentário de topo)
  Get-MoveIdSet:52, Get-PercentileRanks:66
- **dev_server.ps1** - Injecao de mock de sincronizacao (db), 2026-09-11: exclusiva deste servidor
  Get-MockDbScript:13
- **expand_combo_abilities.ps1** - >
  Get-ComboParts:30, Flatten-Combo:45
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
- **transform.ps1** - Generates data/dex_compact.json from data/gameData_2654.json (the raw

## Testes unitários (o que cobrem) - tests/unit/
- **absorcao_flash_fire_dry_skin.test.mjs** - Ticket calibracao-2026-10-15/04 (15/10/2026): Flash Fire e Dry Skin absorvem o golpe (código do jogo: abilities.cc:696-706 e
- **alarme_upstream.test.mjs** - Leitura das páginas oficiais pelo alarme de versão nova (sem rede).
- **areia_e_sets_rapidos.test.mjs** - Diagnóstico dos físicos subavaliados (03/10): Tyranitar/Rock sem o +50% de Sp. Def na areia (código oficial
- **atalhos_teclado.test.mjs** - Ticket 14 da dívida técnica (2026-10-08): atalhos que não são botão de verdade
- **atributo_do_ataque.test.mjs** - Golpes que trocam o atributo de ataque ou de defesa (06/10, lote 4 da fila da comunidade; ver
- **auditoria_do_motor.test.mjs** - Auditoria permanente do motor do duelo (revisão da equipe, 2026-09-30, pedido do
- **avisos_e_selo_de_build.test.mjs** - Lote 5 das pesquisas de 06/10: Avisos de build (um bloco, reaproveitando as contas
- **best_offense_pelo_codigo.test.mjs** - Ticket versao-nova/05 (15/10/2026), pergunta P2 respondida pelo Felipe: Best Offense e Magus Blades valem pelo CÓDIGO da versão mais nova
- **buffs_e_pendencias_antigas.test.mjs** - Lote de 2026-10-01: buffs do ginásio no simulador (números do código do jogo,
- **cache_sabotagem.test.mjs** - (sem comentário de topo)
- **calibracao_calculadora_do_jogo.test.mjs** - Calibração do motor contra a calculadora de dano do próprio jogo (10/10/2026, prints do usuário).
- **calibracao_simulador_wasm.test.mjs** - Calibração do motor contra o simulador do jogo compilado (WebAssembly, Elite Redux 2.65.3b), 21/10/2026
- **campo_com_lutas_comuns.test.mjs** - todas-as-lutas/03: o alvo { campo: true } mede também as lutas comuns (mesma fatia 60/40 do rank, vinda de data/lutas_comuns_run.json).
- **campo_do_campeao_monotype.test.mjs** - Efeito do campeão monotype (04/10): o jogo anuncia um efeito por tipo (src/battle_main.c HandleMonoChampSpecialEffects
- **campo_invertido_no_plano.test.mjs** - Achado do vídeo do usuário (02/10): o plano contra a Tate & Liza 1 chamava Axe Kick (Dark) de
- **campo_no_duelo.test.mjs** - Campo no duelo (2026-09-29): terreno das habilidades (Grassy/Electric/Psychic/
- **categorias_de_golpe.test.mjs** - Categoria de golpe (soco, mordida, corte...) do NextDex (2026-09-29): antes
- **categorias_de_golpe_da_config.test.mjs** - Ticket calibracao-2026-10-15/01 (15/10/2026): as categorias de golpe (soco, mordida, corte, martelo, pulso, chifre,
- **checar_encoding.test.mjs** - A trava de codificação (scripts/checar_encoding.mjs) precisa pegar exatamente
- **checar_paralelo.test.mjs** - Testes do scripts/checar_paralelo.mjs (ticket 04, fluxo 14/10/2026).
- **chefao_pela_interface.test.mjs** - Ticket 07 da dívida técnica (08/10/2026), 2ª metade: a luta inteira contra o time do chefão e a
- **chefoes_pela_config.test.mjs** - Ticket 02 (07/10/2026): times dos chefões conferidos contra a config oficial do jogo (er-config
- **chefoes_pela_config_nova.test.mjs** - Ticket versao-nova/05 (15/10/2026): os chefões contra o TrainerList da versão MAIS NOVA (er-config d1a9a4c, 14/10/2026). A comparação achou
- **clima_oficial_e_revisao.test.mjs** - Achados da reunião de alinhamento (2026-09-30): clima com os números oficiais
- **comparar_motor_ia.test.mjs** - Comparação Motor x IA (time-pelo-motor/01, Fase E): a leitura da resposta da IA e o juiz comum.
- **condicoes_habilidade.test.mjs** - Habilidade condicional (reunião de 2026-09-28): a auditoria das builds salvas
- **condicoes_no_duelo.test.mjs** - Condições da luta no duelo (2026-09-29): status no próprio Pokémon (Guts com
- **config_v10.test.mjs** - Ticket versao-nova/10 (15/10/2026): o que sobrou da config d1a9a4c depois do v09 - aprendizado de golpes de TODAS as espécies, os quatro ...
- **confronto.test.mjs** - Testes do motor de confronto (src/regras/confronto.js, 2026-09-24).
- **contato_tirado_no_duelo.test.mjs** - Ticket mecanica-2026-10-22/02: Long Reach e Punching Glove (num soco) tiram o contato INTEIRO (IsMoveMakingContact, battle_util.c:6579-65...
- **critico_no_duelo.test.mjs** - Crítico no duelo (2026-09-29): antes o motor não tinha crítico nenhum - Super
- **cura_recuo_no_duelo.test.mjs** - Cura, recuo e dano por contato no duelo (2026-09-29): recuo e dreno dos golpes
- **dados_de_mega_e_presentes.test.mjs** - Achados de 03/10 na revisão das lutas: mega_forms.json (feito à mão em 09/2026) estava 36 pedras
- **demolitionist_pelo_codigo.test.mjs** - Ticket mecanica-2026-10-22/03 (parte Demolitionist), 22/10/2026. Valem pelo CÓDIGO da versão nova (er-repo upcoming):
- **descricao_especie.test.mjs** - Descrição de teste do jogo escondida na ficha (15/10/2026): o Noxislash mostrava "Hi i use this for implementing.".
- **diff_versoes.test.mjs** - Diff entre versões do gameData: detecta o que mudou e o que do app cita isso
- **dificuldade_hell.test.mjs** - TK-10a: a Dificuldade Hell existe no save e no seletor; Dificuldade do jogador e tier do chefão são mapas separados.
- **diversos_no_duelo.test.mjs** - Habilidades "diversas" no duelo (2026-09-29): o resto que muda um 1x1 -
- **drench.test.mjs** - Ticket 17 (07/10/2026): status drench pelo código oficial (er-repo 217dd0f). Encharcado age por
- **duelo_pela_interface.test.mjs** - Ticket 07 da dívida técnica (08/10/2026), 1ª metade: o duelo testado pela entrada pública.
- **dupla_contagem_da_sinergia.test.mjs** - Ticket versao-nova/01 (15/10/2026): o código do jogo multiplica o bônus de golpe de uma habilidade UMA vez (abilities.cc, onModifyDamage).
- **dupla_no_duelo.test.mjs** - Dupla (2026-09-29, decisão do usuário: duelo em dupla completo). 25 chefões
- **efeitos_de_golpe.test.mjs** - Efeitos de golpe que a auditoria do motor apontou (2026-09-30), pelos textos do
- **efeitos_de_golpe_03_10.test.mjs** - Efeitos de golpe da lista "sem regra" que pesavam em builds e chefes (03/10): Thunder/Hurricane no clima
- **efeitos_pela_interface.test.mjs** - Ticket 07 da dívida técnica (08/10/2026), 2ª metade, bloco 2: efeitos do duelo que só tinham teste
- **encalhados_e_checkpoint.test.mjs** - Testes de scripts/encalhados.mjs e scripts/checkpoint.mjs (melhoria C do fluxo).
- **escolha_ia_candidatos.test.mjs** - A IA escolhe ENTRE os candidatos do pipeline de build (ticket 03 do pipeline; src/regras/escolha_ia_candidatos.js).
- **estado_do_app.test.mjs** - Testes das regras que saíram do template na fase 3 da refatoração (2026-09-24):
- **estagios_no_duelo.test.mjs** - Estágios de atributo no duelo (2026-09-29): entrada (Intrepid Sword), ao
- **extracao_transform.test.mjs** - Ticket versao-nova/05 (15/10/2026): a extração do dado em Node (scripts/extracao/) é o que gera os arquivos derivados. Estes testes trava...
- **extras_no_duelo.test.mjs** - Golpes extras, bloqueio e entrada no duelo (2026-09-29): Readied Action,
- **ferramentas_ia.test.mjs** - Ferramentas que a IA consulta (src/regras/ferramentas_ia.js), testadas no Node sem navegador
- **ficha_perfil_defensivo.test.mjs** - Ticket 13 (07/10/2026): faixas Fraco/Resiste/Imune da ficha, com as innates (sempre ativas).
- **floettite_pos_jogo.test.mjs** - Ticket 08 (07/10/2026): a Floettite só sai depois de vencer a Elite 4 (NPC da primeira cidade,
- **fluffiest.test.mjs** - Fluffiest (678): a descrição (NextDex e er-config) diz "contato x0,25, fogo x4", mas o código do jogo
- **gerador_cacar_bugs.test.mjs** - Ticket 17 da dívida técnica (08/10/2026): caça-bugs no caminho do gerador de builds por IA
- **golpe_chave_imposto.test.mjs** - Relato da Tate & Liza (03/10): o plano dizia Dragon Claw e a build da IA tinha Dragon Pulse. Agora a validação
- **golpe_duplo.test.mjs** - Habilidades de golpe duplo (10/10/2026). O usuário testou no jogo: o Mega Punch do Ledian (Raging Boxer, Iron
- **golpes_de_status.test.mjs** - Golpes de status no duelo (2026-09-29, decisão do usuário: "com regras
- **golpes_novos_2654.test.mjs** - Ticket versao-nova/09 (15/10/2026): os 9 golpes novos do upcoming (er-config d1a9a4c, MoveList.textproto) entram no app, com as espécies ...
- **gravacao_build_ia.test.mjs** - Caminho "resposta da IA -> build validada -> o que gravar" (src/regras/gravacao_build_ia.js e
- **guarda_lutas_comuns.test.mjs** - Guardas de todas-as-lutas/02: dado provisório não publica; o rank gravado não aceita outra fatia nem outra lista de lutas.
- **habilidades_mudadas_2654.test.mjs** - Ticket versao-nova/06 (15/10/2026): habilidades cujo efeito mudou na versão mais nova (dados-2654/02 e 03). Fonte: abilities.cc (upcoming...
- **habilidades_novas_2654.test.mjs** - Ticket versao-nova/07 (15/10/2026): as 29 habilidades novas da NextDex 2.65.4 + as 9 do delta da er-config d1a9a4c (upcoming) funcionam n...
- **habilidades_texto_novo_2654.test.mjs** - TK-00b (28/10): textos de habilidade que a v2.65.4.1 reescreveu. A regra do motor lê o TEXTO; cada teste prova que a redação nova ainda
- **hazard_de_tipo_inverse_room.test.mjs** - TK-07 (decisão 6, 28/10/2026): Stealth Rock e Creeping Thorns passam por GetTypeModifier, que usa a tabela
- **ia_do_chefao_golpe.test.mjs** - Ticket 03 (07/10/2026): o chefão escolhe o golpe pelos pontos da IA do jogo (battle_ai_main.c AI_TryToFaint,
- **importar_dex_strategy.test.mjs** - Importador das estratégias oficiais do código do jogo (src/data/dex-strategy.md), achado da pesquisa profunda de 06/10.
- **imunidades_de_habilidade.test.mjs** - Imunidades escritas como "absorve"/"redireciona"/"em vez de ser atingido"
- **inversa_ia.test.mjs** - Revisão de 07/10 (ticket 03 x Inverse Room): com a sala invertida cobrindo a luta, o chefão usa o golpe que a
- **itens_consumiveis.test.mjs** - Berries na IA e habilidades que dependem de gastar o item (2026-09-26).
- **itens_da_config.test.mjs** - Ticket calibracao-2026-10-15/02 (15/10/2026): os parâmetros dos itens vêm do `hold_effect_strength` da er-config, como o
- **itens_no_duelo.test.mjs** - Itens no duelo (2026-09-29, decisão do usuário: "item nos sets do duelo").
- **juiz_do_time.test.mjs** - Ticket time-pelo-motor/01, Fase B2 (21/10/2026): juiz do time pela LUTA COMPLETA (avaliarTimePelaLutaCompleta), ao lado do
- **lacunas_sem_codigo.test.mjs** - Varredura "habilidades da config sem código" (21/10/2026; relatorios/sem_codigo_varredura_2026-10-21.md).
- **lado_no_duelo.test.mjs** - Ticket time-pelo-motor/01, Fase B1 (20/10/2026): Reflect, Light Screen, Aurora Veil, Tailwind e Trick Room são
- **level_cap_padrao_unico.test.mjs** - Ticket 04 (divida-tecnica): sem Level cap o padrão é um só (0 = sem limite; nível de cálculo 100).
- **levelcaps_contra_jogo.test.mjs** - TK-23: data/levelcaps.json tem de bater com GetLevelCap() do código do jogo (pokemon.c); 100 = sem limite.
- **liberado_na_run.test.mjs** - Ticket 05 (divida-tecnica): liberadoNaRun é a única régua de pedra, item e golpe;
- **lote_a_motor.test.mjs** - Lote A da força-tarefa (2026-10-02): correções do motor provadas na auditoria, cada uma
- **lote_b_plano_real.test.mjs** - Lote B da força-tarefa (2026-10-02): o plano contra o chefão tem que corresponder ao time
- **lote_c_validacao.test.mjs** - Lote C da força-tarefa (2026-10-02): validação estratégica das builds da IA e o que a
- **lote_d_confiabilidade.test.mjs** - Lote D da força-tarefa (2026-10-02): confiabilidade do estado, do save, da sincronização
- **lote_de_builds.test.mjs** - Lote de builds do time (2026-09-30, decisão do usuário: "sim, uma chamada pro
- **manual_build.test.mjs** - Manual de build competitivo (reunião de 2026-09-28): regras gerais de nature,
- **mapa_do_codigo.test.mjs** - Gerador do mapa do código: determinístico e acha função conhecida com a linha certa.
- **marcas_do_rank.test.mjs** - Marcas sem nota do rank v2 (ponto 6, 2026-10-02): "Precisa de setter"
- **mega_gate.test.mjs** - Trava de Mega Evolução nas SUGESTÕES (achado do usuário, print de 2026-09-24:
- **modo_motor_sem_ia.test.mjs** - Modo Motor nunca chama a IA (ticket time-pelo-motor/01, Fase F3, 21/10/2026). Duas provas independentes:
- **mono_run.test.mjs** - Mono run: disponibilidade por tipo e etapa (2026-09-26). O dado vem da
- **montar_time_contra_chefao.test.mjs** - Botão "Montar time contra este chefão" (2026-09-29): o simulador de duelo
- **motor_favoritos_save.test.mjs** - TK-02b (28/10/2026): favoritos do Modo Motor fazem parte do save (ida e volta, save antigo, saneamento).
- **motor_item.test.mjs** - O Modo Motor fecha o item de cada membro (ticket motor-item/01, 22/10/2026): testa os itens liberados na Etapa que o motor simula e
- **multiplicadores_do_codigo_do_jogo.test.mjs** - Ticket calibracao-2026-10-15/03 (15/10/2026): multiplicadores de habilidade que o texto da NextDex traz, mas que o motor não lia
- **nivel_da_mudanca.test.mjs** - Testes do gancho por nível (scripts/nivel_da_mudanca.mjs e scripts/verificar.mjs).
- **numeros_da_versao_nova.test.mjs** - Ticket versao-nova/02 (15/10/2026): o app mira a versão MAIS NOVA do jogo (código/config primeiro, NextDex depois). Três números que a 2....
- **onde_achar_itens.test.mjs** - Ticket 07 (07/10/2026): onde achar cada item na run, lido do código oficial do jogo (item no chão, escondido,
- **pedras_etapa_dado.test.mjs** - TK-11 (decisão 3): nenhuma pedra libera ANTES do dado (onde_achar_itens), salvo as que o código do jogo trava mais cedo
- **perfectionist.test.mjs** - Ticket 08 (07/10/2026): Perfectionist pelo código oficial (abilities.cc Impl<ABILITY_PERFECTIONIST>):
- **pinnacle_blade_pelo_codigo.test.mjs** - Ticket mecanica-2026-10-22/03 (parte Pinnacle Blade), 22/10/2026. Vale pelo CÓDIGO da versão nova (er-repo upcoming):
- **pipeline_build.test.mjs** - Pipeline de build com intenção (ticket 20 da dívida, 14/10/2026): src/regras/pipeline_build.js, só pela interface
- **pipeline_kit_legal.test.mjs** - Fase 1 do pipeline: contrato determinístico do kit legal.
- **pipeline_rascunho.test.mjs** - Rascunho coerente do pipeline de build (ticket docs/tickets/pipeline-build-2026-10-14/05-rascunho-coerente.md, revisão de metagame de 15/...
- **plano_build.test.mjs** - Testes da build que acompanha o jogador (src/regras/plano_build.js), pedido do
- **poder_que_cresce.test.mjs** - Ticket 19 (07/10/2026): poder que cresce e golpe que carrega, pelo código oficial (er-repo 217dd0f):
- **poder_variavel.test.mjs** - Ticket 16 (07/10/2026): golpes de poder 1 no dado com o poder do código oficial (src/script_conditions.cc
- **primeiro_golpe_e_booster_energy.test.mjs** - Ticket calibracao-2026-10-15/05 (15/10/2026):
- **prioridade_bloqueada_no_1x1.test.mjs** - Queenly Majesty, Dazzling e Armor Tail ("Protects itself and ally from priority moves") no duelo 1x1 (10/10/2026).
- **prioridade_condicional_no_duelo.test.mjs** - Prioridade no duelo (14/10/2026): golpe com prioridade (de base OU condicional: Coil Up, Sidewinder, Cutthroat, Edgelord,
- **prioridade_e_campo_pelo_codigo.test.mjs** - Ticket calibracao-2026-10-15/06 (15/10/2026): prioridade e campo pelo código do jogo.
- **prompt_build.test.mjs** - Revisão do prompt de build (2026-09-27, pedido do usuário): habilidade com
- **prompts_ia.test.mjs** - Peças dos prompts de IA e leitura das respostas (src/regras/prompts_ia.js e
- **rank_da_run.test.mjs** - Rank v2 no app (src/regras/rank_da_run.js): nota pela dificuldade da run, dois eixos,
- **rank_disponibilidade.test.mjs** - Rank v2, ponto 3: data/rank_disponibilidade.json (gerado por scripts/gerar_rank_disponibilidade.mjs
- **rank_escolha.test.mjs** - Ticket 08 (07/10/2026): a escolha do set do rank avalia por inteiro os melhores pela soma rápida
- **rank_fatia.test.mjs** - Fatia fixa de peso do rank (ticket todas-as-lutas/02, 21/10/2026): chefões 60% e lutas comuns 40%, com a composição REAL da run
- **rank_so_por_rankde.test.mjs** - ADR-003 (ticket 01): o dado do Rank só é lido por rankDe(); SPECIES_RANK não é reescrito depois da carga.
- **reconciliar_build.test.mjs** - Build salva que muda de espécie (auto-evolução) ou chega de um save antigo precisa
- **regras.test.mjs** - Testes unitários das regras do jogo (item Q3 da pauta técnica, 2026-09-16).
- **regras_oficiais_fase4.test.mjs** - Fase 4 da reunião de 30/09/2026: o motor conferido contra o FAQ oficial, o
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
- **sono_e_paralisia_champions.test.mjs** - Ticket versao-nova/08 (15/10/2026; dados-2654/07): o código novo liga o sono e a paralisia estilo Pokémon Champions.
- **sprite_index.test.mjs** - Sprite pelo nome da espécie (15/10/2026): a versão nova do jogo deslocou os números e o Beedrill Mega mostrava o Blastoise Mega.
- **status_no_duelo.test.mjs** - Status por chance no duelo (2026-09-29, grupo 1 do estudo de habilidades):
- **sugestao_do_motor.test.mjs** - "Ficar com este time" grava as builds como "Sugestão do app" (ticket time-pelo-motor/01, F5, 21/10/2026).
- **sync_canonico.test.mjs** - TK-02 (S12-2, S12-4, S12-5): comparação canônica no sync, campo v usado, team/box sem duplicata.
- **sync_progresso.test.mjs** - Sincronização não apaga run adiantada com run zerada (relato do usuário, 10/10/2026):
- **sync_soma_errada.test.mjs** - TK-01 (decisão 2 do usuário, 27/10/2026): save com soma errada nunca é regravado nem enviado à nuvem.
- **telas_efetividade_real.test.mjs** - Ticket 12 (dados-2654): as telas mostram a efetividade REAL contra Solid Rock / Primal Armor e citam a
- **texto_novo_das_habilidades.test.mjs** - Ticket versao-nova/04 (15/10/2026): o texto das habilidades mudou de redação na 2.65.4 da NextDex (07/10) e o parser do motor lê TEXTO. M...
- **time_melhor_no_geral.test.mjs** - Tela do time = melhor time no geral, sem pensar no próximo chefão (usuário, 16/10/2026). As builds do "Montar time completo"
- **time_pelo_motor.test.mjs** - Modo Motor do Meu Time, Fase C (ticket time-pelo-motor/01, 21/10/2026): montar o time SEM IA, só pelo simulador.
- **time_pelo_motor_comuns.test.mjs** - Meu Time na mesma régua do rank (ticket todas-as-lutas/02, 21/10/2026): o juiz do Modo Motor pesa as lutas COMUNS mais perigosas de cada
- **time_pelo_motor_papeis.test.mjs** - Modo Motor do Meu Time, Fase D (ticket time-pelo-motor/01, 21/10/2026): papéis por build, tags, sinergia e explicação.
- **time_pelo_motor_papeis_regras.test.mjs** - Fronteiras das regras de papel e estilo do Modo Motor (TK-03, 27/10/2026): cada teste usa um time real da Etapa 4 que fica DO LADO DE DENTRO
- **time_pelo_motor_regras.test.mjs** - Regras do Modo Motor que só a sabotagem do TK-03 (27/10/2026) mostrou sem proteção: item liberado e limite de repetição,
- **tipo_stellar.test.mjs** - Tipo Stellar (TK-04, achado motor-D1.4; decisão do usuário 28/10): tabela contra battle_util.c:1012-1013 e 1056-1057
- **tipos_contra_o_jogo.test.mjs** - TK-04 (motor-D1.1, D1.2): a tabela de tipos e TYPE_MOD_ABILITIES travadas contra o código do jogo.
- **tipos_habilidade_id_nome.test.mjs** - TK-00: trava id x nome de TYPE_MOD_ABILITIES. O id é do dex_compact do app (NextDex), NÃO o do enum do jogo
- **tira_setup.test.mjs** - Ticket 18 (07/10/2026): golpes que tiram setup, pelo código oficial (er-repo 217dd0f,
- **traducoes_alinhadas_por_nome.test.mjs** - Versão 2.65.4 deslocou ids de habilidade (Mighty Horn 391 -> 390; 391 virou Hardened Sheath...). A tradução PT é indexada por id, então
- **vaga.test.mjs** - Vaga de verificação pesada (scripts/vaga.mjs, melhoria B de 2026-10-13).
- **validar_dado_cru.test.mjs** - Validação do dado cru do NextDex na ingestão (scripts/validar_dado_cru.mjs, lote 2).
