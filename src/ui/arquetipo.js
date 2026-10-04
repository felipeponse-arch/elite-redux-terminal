  // ===== src/ui/arquetipo.js =====
  // Arquétipo do time, time sugerido e o Gerador Inteligente de Times.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui arquetipo.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- team strategy & archetype ----------------
  // teamAnalysisReport ("Leitura estratégica") e o botão avulso "Montar
  // melhor time" foram removidos (pedido do usuário, 2026-09-18: "montar
  // melhor time tem que sair junto com leitura estrategica nao temos mais
  // que ter esses botoes eles nao fazem mais sentido" - "Gerar time
  // completo" já cobre composição + guia de uso numa ação só). teamKeyFor
  // continua servindo generatedTeamResult/teamRecommendation abaixo.
  function teamKeyFor(members) {
    return members.map(function (sp) { return sp.sname; }).sort().join(",");
  }

  // Arquétipo do time (Fase 3b, redesenhado 2026-09-12 por pedido direto do
  // usuário: "a ideia não é analisar os poke que eu tenho no time e sim ao
  // clicar ali ele me dar o melhor time possível dentro dos poke que eu
  // tenho focado naquele arquétipo" - e "ele falar que eu tenho 6 tanque no
  // time não me ajuda de forma objetiva". Trocado de "detectar o arquétipo
  // do time atual" (só informativo) pra "montar o melhor time possível pro
  // arquétipo escolhido" (uma ação real). Os dois <select> continuam sendo
  // a fonte de verdade explícita (RN05) - agora como o ALVO que o botão usa,
  // não mais algo que a IA preenche a partir do time atual. O aviso de papel
  // redundante (que só constatava o problema sem resolver nada) foi
  // substituído pela própria recomendação, que evita concentração de papel
  // sozinha quando faz sentido pro arquétipo pedido.
  var teamRecommendation = null; // { snames, reasoning, forPace, forWeather, forMonotype }
  // Resultado do Gerador Inteligente de Times (pedido do usuário,
  // 2026-09-17): guia de uso + validação da ÚLTIMA geração completa.
  // Mesmo padrão efêmero de teamRecommendation - não persiste, e some
  // sozinho quando o time muda (forTeamKey).
  var generatedTeamResult = null;

  // Chips no lugar de <select> (redesign 2026-09-18: "battle prep" tocável
  // em vez de formulário) - Estilo, Clima e campo e Tática têm poucas
  // opções, cabem bem como chips. Monotype (18 tipos) usa a MESMA cor real de tipo que o
  // resto do app já usa (typePill/TYPE_META) - reconhecer pela cor é mais
  // rápido que ler 18 nomes numa lista.
  function archetypeChipsHtml(axis, options, current, typeColored) {
    var noneChip = '<button type="button" class="arch-chip' + (!current ? " active" : "") + '" data-axis="' + axis + '" data-value="">Nenhum</button>';
    var chips = options.map(function (opt) {
      var isActive = current === opt;
      var style = "";
      if (typeColored) {
        var meta = TYPE_META[opt] || { hex: "#777777" };
        style = ' style="--chip-color:' + meta.hex + ';--chip-ink:' + tintaDoTipo(meta.hex) + '"';
      }
      return '<button type="button" class="arch-chip' + (typeColored ? " arch-chip-type" : "") + (isActive ? " active" : "") +
        '"' + style + ' data-axis="' + axis + '" data-value="' + escapeHtml(opt) + '">' + escapeHtml(opt) + '</button>';
    }).join("");
    return '<div class="archetype-chips">' + noneChip + chips + '</div>';
  }

  // Redesenho 2026-09-24 (pedido do usuário: "ainda não está bonito"): o card
  // ocupava a primeira tela inteira do Meu Time e empurrava o próprio time pra
  // fora da vista. Agora é um <details> fechado por padrão, com o que está
  // escolhido numa linha; abre ao clicar e lembra se ficou aberto (o
  // conteúdo é redesenhado a cada escolha, e fechar a cada clique seria pior).
  var arquetipoAberto = false;
  function resumoDoArquetipo() {
    var partes = [
      ["Estilo", state.archetype.pace],
      ["Clima e campo", state.archetype.weather],
      ["Tática", state.archetype.tatica],
      ["Monotype", state.archetype.monotype],
    ].map(function (p) {
      return '<span class="arquetipo-item">' + p[0] + ': <b>' + escapeHtml(p[1] || "nenhum") + '</b></span>';
    });
    return partes.join("");
  }
  function archetypeCardHtml(members) {
    return '<details class="card arquetipo"' + (arquetipoAberto ? " open" : "") + '>' +
      '<summary class="arquetipo-resumo"><span class="arquetipo-titulo">Arquétipo</span>' + resumoDoArquetipo() +
        '<span class="arquetipo-ajustar" aria-hidden="true">' + (arquetipoAberto ? "Fechar" : "Ajustar") + '</span></summary>' +
      '<p class="mybuild-hint">Escolha um Estilo, Clima e campo, Tática e/ou Monotype e peça o melhor time de até 6, usando só os Pokémon que você já tem (time + caixa). "Gerar time completo" monta a composição, gera a build de cada um e escreve o guia de como jogar - tudo numa ação só.</p>' +
      '<div class="archetype-axis"><span class="archetype-axis-label">Estilo</span>' + archetypeChipsHtml("pace", PACE_ARCHETYPES, state.archetype.pace || "", false) + '</div>' +
      '<div class="archetype-axis"><span class="archetype-axis-label">Clima e campo</span>' + archetypeChipsHtml("weather", WEATHER_ARCHETYPES, state.archetype.weather || "", false) + '</div>' +
      '<div class="archetype-axis"><span class="archetype-axis-label">Tática</span>' + archetypeChipsHtml("tatica", TATICA_ARCHETYPES, state.archetype.tatica || "", false) + '</div>' +
      '<div class="archetype-axis"><span class="archetype-axis-label">Monotype</span>' + archetypeChipsHtml("monotype", MONOTYPE_ARCHETYPES, state.archetype.monotype || "", true) + '</div>' +
      '<div class="archetype-row">' +
        '<button id="archetype-build-complete" class="add-team-btn" type="button" title="Composição + build de cada um + guia de como jogar, tudo de uma vez">Gerar time completo</button>' +
      '</div>' +
      '<span id="archetype-status" class="notes-status" role="status" aria-live="polite"></span>' +
    '</details>';
  }

  // Chips de arquétipo e "Montar time completo": ouvinte único em #team-strategy
  // (fase 5 da refatoração, 2026-09-24) - antes religados a cada renderTeamStrategy.
  (function () {
    var painel = document.getElementById("team-strategy");
    // "toggle" não borbulha - captura no painel.
    painel.addEventListener("toggle", function (e) {
      if (!e.target.classList || !e.target.classList.contains("arquetipo")) return;
      arquetipoAberto = e.target.open;
      var rotulo = e.target.querySelector(".arquetipo-ajustar");
      if (rotulo) rotulo.textContent = arquetipoAberto ? "Fechar" : "Ajustar";
    }, true);
    painel.addEventListener("click", function (e) {
      var alvo = e.target.closest("button");
      if (!alvo || !painel.contains(alvo)) return;
      if (alvo.id === "archetype-build-complete") { generateCompleteTeam(); return; }
      // Desfaz o "Montar time contra este chefão": volta o time de antes (as
      // builds novas ficam salvas como variantes - nada se perde).
      if (alvo.id === "chefao-restaurar" && generatedTeamResult && generatedTeamResult.anterior) {
        teamRecommendation = { snames: generatedTeamResult.anterior.snames.slice(), reasoning: state.archetype.reasoning || "" };
        generatedTeamResult = null;
        applyRecommendedTeam();
        return;
      }
      if (!alvo.classList.contains("arch-chip")) return;
      var axis = alvo.dataset.axis;
      var value = alvo.dataset.value || null;
      // O Estilo decide qual curada o time mostra (estilo) - por isso "time" e
      // "builds", não só o card de arquétipo.
      acao(["time", "builds", "resumo"], function () {
        state.archetype[axis] = value;
        teamRecommendation = null; // alvo mudou, sugestão antiga não vale mais
        if (axis === "monotype") generatedTeamResult = null; // arquétipo mudou, o time gerado antigo não corresponde mais ao que foi pedido
      });
    });
  })();

  // IA monta o MELHOR TIME possível (até 6) usando só espécies que o
  // jogador realmente possui (time ∪ caixa) - nunca decide sozinha: o
  // resultado é uma proposta, só vira time real quando o jogador clica
  // "Usar este time" (applyRecommendedTeam abaixo). Inclui a Velocidade
  // base de cada um no roster (achado em revisão de código: faltava esse
  // dado pra julgar Trick Room/Hyper Offense de verdade) e dá acesso real
  // às mesmas ferramentas que generateBuildWithAI/generateTeamUsageGuide usam
  // (buildStandardAiTools) - antes esta função não passava tools nenhuma,
  // inconsistente com as outras duas chamadas de IA do app.
  async function generateTeamForArchetype() {
    try {
      var statusEl = document.getElementById("archetype-status");
      var pace = state.archetype.pace;
      var weather = state.archetype.weather;
      var monotype = state.archetype.monotype;
      if (!pace && !weather && !monotype && !state.archetype.tatica) {
        if (statusEl) statusEl.textContent = "Escolha um Estilo, Clima e campo, Tática ou Monotype primeiro, pra eu focar o time em algo.";
        return false;
      }
      if (statusEl) statusEl.textContent = "Consultando o Claude...";
      var r = rosterParaTimeIA(monotype);
      if (!r.roster.length) {
        if (statusEl) statusEl.textContent = monotype
          ? "Nenhum Pokémon do tipo " + monotype + " capturado ainda - pegue um na Dex primeiro."
          : "Nenhum Pokémon capturado ainda - pegue algo na Dex primeiro.";
        return false;
      }
      var resp = await pedirIA({
        prompt: montarPromptTimeArquetipo(r.roster, pace, weather, monotype),
        tentativas: 1,
        oQue: "Montagem",
        aviso: function (texto) { if (statusEl) statusEl.textContent = texto; },
        validar: function (bruto) {
          var snames = snamesValidosDoTime(bruto, r.validSnames);
          return snames.length ? { valor: snames } : { motivo: "A resposta não trouxe nenhuma espécie real da sua caixa/time - tente de novo." };
        }
      });
      if (!resp.ok) {
        if (statusEl) statusEl.textContent = resp.mensagem;
        return false;
      }
      teamRecommendation = {
        snames: resp.valor,
        reasoning: (resp.bruto && typeof resp.bruto.reasoning === "string") ? resp.bruto.reasoning.slice(0, 600) : "",
        forPace: pace, forWeather: weather, forMonotype: monotype
      };
      renderTeamStrategy(state.team.map(getSpeciesByX).filter(Boolean));
      flashToast("Time sugerido - confira e use se fizer sentido.");
      return true;
    } catch (e) {
      // Erro no app (não da IA - esses o pedirIA já trata) ao aplicar a resposta.
      if (typeof console !== "undefined") console.error(e);
      var elErro = document.getElementById("archetype-status");
      if (elErro) elErro.textContent = "Não consegui aplicar a resposta da IA - tente de novo.";
      return false;
    }
  }

  // Aplica a recomendação: revalida CADA sname contra o time/caixa ATUAIS no
  // momento do clique (mesma lição do bug de "Aplicar troca" - o jogador
  // pode ter mexido no roster entre a geração e o clique), monta o novo
  // time e manda pra caixa quem foi deixado de fora (mesma regra de
  // "benching" que rosterMove() já usa em trocas individuais).
  function applyRecommendedTeam() {
    if (!teamRecommendation) return;
    var ownedXs = state.team.concat(state.box);
    var xs = [];
    // Quem do roster foi "usado" por cada escolha - a IA pode escolher a forma
    // mega de alguém que está como base (ou o contrário): é a MESMA criatura,
    // então entra a forma escolhida e sai a outra, sem duplicar.
    var consumed = [];
    teamRecommendation.snames.forEach(function (sn) {
      var sp = getSpeciesBySname(sn);
      if (!sp || xs.indexOf(sp.x) !== -1) return;
      var ownedX = null;
      ownedXs.forEach(function (ox) {
        if (ownedX !== null || consumed.indexOf(ox) !== -1) return;
        if (formFamilyOf(getSpeciesByX(ox)).some(function (f) { return f.x === sp.x; })) ownedX = ox;
      });
      if (ownedX === null || xs.length >= 6) return;
      consumed.push(ownedX);
      xs.push(sp.x);
    });
    if (!xs.length) {
      flashToast("Nenhum dos sugeridos ainda está com você - monte de novo.");
      teamRecommendation = null;
      TELAS.time(); // estado de tela (a sugestão), nada a gravar
      return false;
    }
    acao(TELAS_ELENCO.concat(["ficha"]), function () {
      state.team.forEach(function (x) {
        if (xs.indexOf(x) === -1 && consumed.indexOf(x) === -1 && state.box.indexOf(x) === -1) state.box.push(x);
      });
      state.box = state.box.filter(function (x) { return xs.indexOf(x) === -1 && consumed.indexOf(x) === -1; });
      state.team = xs;
      state.archetype.reasoning = teamRecommendation.reasoning;
      teamRecommendation = null;
    });
    flashToast("Time atualizado (" + xs.length + "/6).");
    return true;
  }

  // Validação determinística da equipe gerada (item 5/10 do pedido do
  // usuário, 2026-09-17: "verificar sinergia entre os integrantes",
  // "verificar se a estratégia é executável") - NADA aqui é decidido pela
  // IA. Reaproveita computeSharedRisks() (já usada em "Riscos
  // compartilhados do time") e effectiveBuild() (já usada em toda parte
  // que mostra a build ativa) - nunca afirma "time pronto" se algum
  // membro ainda não tem build salva de verdade.
  function computeTeamGenerationValidation(members) {
    var withoutBuild = members.filter(function (sp) { return !effectiveBuild(sp); }).map(function (sp) { return sp.n; });
    return {
      total: members.length,
      withoutBuild: withoutBuild,
      allBuilt: withoutBuild.length === 0,
      sharedRisks: computeSharedRisks(members)
    };
  }

  // Guia de utilização (item 3 do pedido do usuário, 2026-09-17: conceito,
  // abertura, desenvolvimento, condição de vitória, ameaças/respostas) -
  // pede pra IA um texto PRÁTICO desta equipe especificamente, com as
  // builds reais já geradas (não uma descrição genérica do arquétipo).
  // Mesmas ferramentas reais de generateTeamForArchetype/generateBuildWithAI
  // (buildStandardAiTools) - sem isso a IA inventaria matchup/ameaça sem
  // checar o dado real do jogo.
  async function generateTeamUsageGuide(members, focusDesc, statusElId) {
    try {
      var statusEl = document.getElementById(statusElId || "archetype-status");
      var resp = await pedirIA({
        prompt: montarPromptGuia(members, focusDesc),
        tentativas: 1,
        aviso: function (texto) { if (statusEl) statusEl.textContent = texto; },
        validar: function (bruto) { var g = guiaDaResposta(bruto, members); return g ? { valor: g } : { motivo: "o guia não veio no formato pedido." }; }
      });
      if (!resp.ok) {
        if (statusEl && !resp.rejeitada) statusEl.textContent = resp.mensagem;
        return null;
      }
      var guide = resp.valor;
      // Confere se "threats" citou mesmo um chefão/líder real: 1 nova tentativa,
      // só desse campo (mais barato que refazer o guia inteiro). Se falhar, fica
      // com o original.
      var remainingNames = aiTool_getRemainingBosses().remainingBossNames;
      if (!guiaCitaChefaoReal(guide, remainingNames)) {
        var ameacas = await pedirIA({ prompt: montarPromptAmeacas(members, remainingNames), tentativas: 1 });
        if (ameacas.ok && ameacas.bruto && typeof ameacas.bruto.threats === "string") {
          var corrigido = guiaDaResposta({ threats: ameacas.bruto.threats, threatMemberSname: ameacas.bruto.threatMemberSname }, members);
          guide.threats = corrigido.threats;
          guide.threatMemberX = corrigido.threatMemberX;
        }
      }
      return guide;
    } catch (e) {
      // Erro no app (não da IA - esses o pedirIA já trata) ao aplicar a resposta.
      if (typeof console !== "undefined") console.error(e);
      return null;
    }
  }

  // Orquestrador do Gerador Inteligente de Times (pedido do usuário,
  // 2026-09-17): uma única ação que encadeia os módulos que já existiam
  // soltos - Arquétipo (generateTeamForArchetype), aplica sozinho
  // (applyRecommendedTeam), Builds (generateBuildWithAI, uma vez por
  // membro, sempre nova - reaproveita a MESMA função que "Gerar build
  // com IA" já usa em cada slot do time, então já respeita level cap,
  // item já em uso por outro membro e sinergia habilidade x movepool),
  // Guia de uso (generateTeamUsageGuide, novo) e por fim uma validação
  // determinística (computeTeamGenerationValidation, novo). Nada aqui
  // reescreve as funções que já existiam - só as encadeia.
  async function generateCompleteTeam() {
    function setStatus(msg) {
      var el = document.getElementById("archetype-status");
      if (el) el.textContent = msg;
    }
    var pace = state.archetype.pace, weather = state.archetype.weather, monotype = state.archetype.monotype;
    if (!pace && !weather && !monotype && !state.archetype.tatica) {
      setStatus("Escolha um Estilo, Clima e campo, Tática ou Monotype primeiro, pra eu focar o time em algo.");
      return;
    }
    setStatus("Etapa 1/4 - montando a composição do time...");
    var composed = await generateTeamForArchetype();
    if (!composed || !teamRecommendation) return; // generateTeamForArchetype já deixou o motivo no status
    if (!applyRecommendedTeam()) return; // idem, applyRecommendedTeam já deixou o motivo no status/toast
    var members = state.team.map(getSpeciesByX).filter(Boolean);
    // Time novo = build nova pra todos (2026-09-29, pedido do usuário): antes quem
    // já tinha build era pulado e a antiga continuava na tela. Agora a nova vira
    // a ativa e a antiga fica de variante no chip da ficha (nada se perde).
    // Todas numa consulta só (lote, 2026-09-30); quem falhar é pedido sozinho.
    comecarLoteDeBuilds(members.map(function (m) { return m.x; }));
    try {
      // Curada do estilo sem IA (2026-09-30, decisão do usuário: só quando não há
      // Clima/Tática - a curada não é ajustada a eles).
      var paraIA = members;
      if (!weather && !state.archetype.tatica) {
        paraIA = members.filter(function (sp) {
          if (!aplicarCuradaNoTimeNovo(sp, pace)) return true;
          concluirBuildDoLote(sp.x);
          return false;
        });
      }
      await gerarBuildsDoTimeComIA(paraIA, "archetype-status", function () { return { timeNovo: true }; }, {},
        function (texto) { setStatus("Etapa 2/4 - " + texto.charAt(0).toLowerCase() + texto.slice(1)); });
    } finally {
      encerrarLoteDeBuilds();
    }
    setStatus("Etapa 3/4 - escrevendo o guia de como jogar este time...");
    var focusDesc = [pace ? "Estilo: " + pace : "", weather ? "Clima e campo: " + weather : "", state.archetype.tatica ? "Tática: " + state.archetype.tatica : "", monotype ? "Monotype: " + monotype : ""].filter(Boolean).join(" + ");
    var guide = await generateTeamUsageGuide(members, focusDesc);
    setStatus("Etapa 4/4 - validando a equipe...");
    generatedTeamResult = { archetypeLabel: focusDesc, guide: guide, validation: computeTeamGenerationValidation(members), forTeamKey: teamKeyFor(members) };
    TELAS.time(); // estado de tela (resultado da geração); as builds já foram gravadas pelas ações
    setStatus(guide ? "Time completo gerado." : "Time e builds gerados - o guia de uso não veio desta vez, pode gerar de novo depois.");
    flashToast("Time completo gerado: composição, builds" + (guide ? " e guia" : "") + " prontos.");
  }

  // Card único "Time gerado: <foco>" (item 4 do pedido do usuário,
  // 2026-09-17 - "o usuário deve conseguir consultar o time completo sem
  // precisar abrir cada módulo separadamente"). A composição/sinergia/
  // cobertura/build de cada um já aparecem embaixo (team-slots e os
  // cards de renderTeamAnalysis) - este card cobre só o que mais faltava:
  // nome do foco, guia de uso e validação. Some sozinho se o time mudar
  // depois (forTeamKey), igual teamRecommendation.
  // Modo chefão (botão "Montar time contra este chefão", 2026-09-29): no lugar
  // do guia da IA, o plano da luta do simulador de duelo - na ordem em que o
  // chefão manda os Pokémon, quem do time responde a cada um e com que golpe.
  function planoContraChefaoHtml(res) {
    var cobertos = res.plano.filter(function (p) { return p.coberto; }).length;
    var itens = res.plano.map(function (p) {
      var resp = p.respostas.length
        ? p.respostas.map(function (a) {
            return '<span class="goto-species" tabindex="0" role="button" data-x="' + a.x + '">' + escapeHtml(a.nome) + '</span>' +
              (a.golpe ? " (" + escapeHtml(a.golpe) + (a.efTipo >= 2 ? ", super efetivo" : "") + ")" : "");
          }).join(" ou ")
        : '<span class="plano-sem-resposta">ninguém do seu time vence este duelo com folga - evite deixá-lo montar</span>';
      return '<li><div class="plano-foe"><b>' + escapeHtml(p.foe) + '</b> <span class="plano-tipos">' + p.tipos.map(function (t) { return typePill(t, true); }).join("") + '</span></div>' +
        '<div class="plano-resp">' + resp + '</div></li>';
    }).join("");
    return '<div class="ts-usage-guide">' +
      '<p class="mybuild-hint">Escolhido pelo simulador de duelo do app (o mesmo do rank): ' + cobertos + ' de ' + res.plano.length +
        ' Pokémon dele têm resposta clara no seu time. A ordem abaixo é a em que ele manda os Pokémon.' +
        (res.estrategia
          ? "" : (res.clima ? " Ele arma " + (res.clima === "sol" ? "sol: golpes Fire ficam mais fortes." : "chuva: golpes Water ficam mais fortes.") : "")) + '</p>' +
      (res.estrategia
        ? '<p class="plano-estrategia"><b>Estratégia do time:</b> ' + escapeHtml(res.estrategia.armador) + ' arma ' + escapeHtml(NOME_DA_CONDICAO[res.estrategia.clima] || res.estrategia.clima) +
          ' ao entrar (' + escapeHtml(res.estrategia.habilidade) + ')' +
          (res.estrategia.aproveitam.length ? '; aproveitam: ' + escapeHtml(res.estrategia.aproveitam.join(", ")) : "") +
          '. Abra com ele pra ligar o clima.</p>'
        : "") +
      (res.buffs
        ? '<p class="mybuild-hint' + (res.buffs.total && !res.buffs.ativos.length ? " plano-buffs-aviso" : "") + '"><b>Buffs do ginásio na conta:</b> ' +
          (res.buffs.ativos.length ? escapeHtml(res.buffs.ativos.join(", ")) + "."
            : "nenhum (todos marcados como já tirados). Se a luta ainda tem os buffs, desmarque-os no card Buffs do ginásio e monte o time de novo.") + '</p>'
        : "") +
      '<ol class="plano-chefao">' + itens + '</ol>' +
      (res.luta
        ? '<p class="mybuild-hint"><b>Luta simulada inteira' + (res.luta.dupla ? " em dupla" : "") + '</b> (o HP passa de uma luta pra outra): ' +
          (res.luta.venceu ? "vence, com " + res.luta.vivos + " de pé" : "derruba " + res.luta.derrubados + " de " + res.luta.total) + ".</p>" +
          '<ol class="plano-luta">' + res.luta.passos.map(function (t) { return "<li>" + escapeHtml(t) + "</li>"; }).join("") + "</ol>"
        : "") +
    '</div>';
  }
  function generatedTeamCardHtml(members) {
    if (!generatedTeamResult || generatedTeamResult.forTeamKey !== teamKeyFor(members)) return "";
    if (generatedTeamResult.plano) {
      var res = generatedTeamResult;
      var vc = computeTeamGenerationValidation(members);
      var restaurar = res.anterior && res.anterior.snames.length
        ? '<button type="button" id="chefao-restaurar" class="text-action-btn">Voltar ao time anterior</button>' +
          (res.anterior.salvo ? "" : '<span class="mybuild-hint"> (os 3 espaços de Times salvos estão ocupados - o time anterior só fica guardado enquanto esta página estiver aberta)</span>')
        : "";
      return '<div class="card ts-generated-team"><h3>Time gerado ' + escapeHtml(res.archetypeLabel) + '</h3>' +
        planoContraChefaoHtml(res) +
        // O aviso "Faltou build pra..." vem separado do resto do texto pra ter a cor de aviso
        // (o texto continua começando por ele: a suíte procura por "Faltou build").
        '<p id="chefao-build-status" class="notes-status" role="status" aria-live="polite">' +
          (res.aviso ? '<span class="plano-faltou-build">' + escapeHtml(res.aviso) + '</span>' + (res.progresso ? " " : "") : "") +
          escapeHtml(res.progresso || "") + '</p>' +
        '<div class="plano-rodape"><span class="plano-chip">' +
          (vc.total - vc.withoutBuild.length) + "/" + vc.total + ' membros com build</span>' + restaurar + '</div></div>';
    }
    var g = generatedTeamResult.guide;
    var v = generatedTeamResult.validation;
    var guideHtml = g
      ? '<div class="ts-usage-guide">' +
          '<div class="ts-guide-item"><b>Conceito:</b> ' + escapeHtml(g.concept || "—") + '</div>' +
          '<div class="ts-guide-item"><b>Abertura:</b> ' + escapeHtml(g.opening || "—") + '</div>' +
          '<div class="ts-guide-item"><b>Desenvolvimento:</b> ' + escapeHtml(g.development || "—") + '</div>' +
          '<div class="ts-guide-item"><b>Condição de vitória:</b> ' + escapeHtml(g.winCondition || "—") + '</div>' +
          '<div class="ts-guide-item"><b>Ameaças e respostas:</b> ' + escapeHtml(g.threats || "—") +
            (g.threatMemberX !== null && g.threatMemberX !== undefined
              ? ' <span class="goto-species-strategies" tabindex="0" role="button" data-x="' + g.threatMemberX + '">Ver Estratégias &rarr;</span>'
              : "") +
          '</div>' +
        '</div>'
      : '<p class="mybuild-hint">O guia de uso não veio desta vez - o time e as builds continuam válidos, só falta o texto de como jogar (pode gerar de novo).</p>';
    var riskText = v.sharedRisks.length
      ? v.sharedRisks.map(function (r) { return typePill(r.t, true) + " (" + r.n + "/" + v.total + ")"; }).join(", ")
      : "nenhum tipo derruba 2 ou mais membros ao mesmo tempo";
    var validationHtml = '<div class="ts-validation' + (v.allBuilt ? "" : " ts-validation-warn") + '">' +
      (v.allBuilt
        ? (v.total === 1 ? "O único membro tem build confirmada." : "Todos os " + v.total + " membros têm build confirmada.")
        : (v.total - v.withoutBuild.length) + "/" + v.total + " membros com build confirmada - faltou gerar pra: " + escapeHtml(v.withoutBuild.join(", ")) + ".") +
      ' Riscos compartilhados: ' + riskText + '.' +
    '</div>';
    return '<div class="card ts-generated-team"><h3>Time gerado: ' + escapeHtml(generatedTeamResult.archetypeLabel) + '</h3>' + guideHtml + validationHtml + '</div>';
  }

  function renderTeamStrategy(members) {
    var el = document.getElementById("team-strategy");
    if (!el) return;
    if (!members.length) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML = generatedTeamCardHtml(members) + archetypeCardHtml(members);
  }

  // Clima que combina com o tipo (só bônus confirmado - ver CLIMA_QUE_COMBINA):
  // um clique põe no "Clima e campo" do arquétipo; já escolhido, só confirma.
  function climaQueCombinaHtml(tipo) {
    var c = climaQueCombina(tipo);
    if (!c) return "";
    var jaE = state.archetype.weather === c.clima;
    return '<li class="mono-clima" title="' + escapeHtml(c.porque) + '"><span class="mono-rotulo">Clima</span>' +
      '<span class="mono-valor"><b>' + escapeHtml(c.clima) + '</b> <span class="mono-dim">' + escapeHtml(c.curto) + '</span>' +
      (jaE ? '<span class="mono-ja-tem">é o clima do seu time</span>'
        : '<button type="button" class="mono-usar-clima" data-clima="' + escapeHtml(c.clima) + '">Usar</button>') +
      '</span></li>';
  }

  // Mono run (2026-09-26, pedido do usuário): com um Monotype escolhido, aparece
  // sozinho o que dá pra pegar desse tipo até a sua etapa e o que libera no
  // próximo líder - sem pergunta nem clique a mais (RNF09). Dado: mono_run.js.
  // Revisão da equipe de front/CX (2026-09-27, pedido do usuário: "a tela está
  // muito carregada"): o card ficava ACIMA do time (no celular o time começava
  // a 1.096 px, fora da tela) com 7 blocos e ~80 itens à vista. Agora mora
  // abaixo do time (#team-mono), mostra só o resumo (fraquezas, próximo líder,
  // clima, quem pegar agora) e as listas completas ficam recolhidas - o app
  // lembra se ficou aberto (o card é redesenhado a cada ação).
  var monoTudoAberto = false;
  function monoRunCardHtml() {
    var tipo = state.archetype.monotype;
    if (!tipo || !MONO_DISP) return "";
    var etapa = state.settings.milestone || 0;
    var d = monoDisponibilidade(tipo, etapa, state.team.concat(state.box));
    if (!d.novos.length && !d.antes.length && !d.proxima.length) return "";
    function nomeHtml(i) {
      return '<button type="button" class="mono-nome" data-x="' + i.sp.x + '" title="Abrir a ficha na Dex">' + escapeHtml(i.sp.n) + '</button>';
    }
    function itemHtml(i) {
      var marcas = i.marcas.map(function (m) {
        return '<span class="mono-marca">' + escapeHtml(MONO_MARCAS[m]) + '</span>';
      }).join("");
      return '<li class="mono-item' + (i.jaTem ? " mono-tem" : "") + '">' + nomeHtml(i) +
        (i.tier ? '<span class="rank-badge-mono ' + (RANK_TIER_CLASS[i.tier] || "tier-C") + '" title="Rank entre os Pokémon ' + escapeHtml(tipo) + '">' + i.tier + '</span>' : "") +
        (i.jaTem ? '<span class="mono-ja-tem">já tem</span>' : "") +
        '<span class="mono-local">' + escapeHtml(i.local || "local não informado") + '</span>' + marcas +
      '</li>';
    }
    function grupo(titulo, itens) {
      if (!itens.length) return "";
      return '<h4 class="mono-grupo">' + titulo + ' <span class="mono-conta">' + itens.length + '</span></h4>' +
        '<ul class="mono-lista">' + itens.map(itemHtml).join("") + '</ul>';
    }
    var fracas = fraquezasDoTipo(tipo);
    var aviso = avisoProximoLider(tipo);
    var avisoHtml = aviso && aviso.total
      ? '<li class="' + (aviso.batemForte.length * 2 >= aviso.total ? "mono-aviso-forte" : "") + '"' +
          (aviso.batemForte.length ? ' title="Com golpe super efetivo em ' + escapeHtml(tipo) + ': ' + escapeHtml(aviso.batemForte.join(", ")) + '"' : "") + '>' +
          '<span class="mono-rotulo">Próximo líder</span>' + escapeHtml(aviso.lider) + ': ' +
          (aviso.batemForte.length ? aviso.batemForte.length + ' de ' + aviso.total + ' batem forte' : 'nenhum bate forte') + '</li>'
      : "";
    var cobrem = d.novos.concat(d.antes).filter(function (i) { return !i.jaTem && i.cobre.length && i.marcas.indexOf("M") === -1; }).slice(0, 3);
    var cobremHtml = cobrem.length
      ? '<li class="mono-pegar"><span class="mono-rotulo">Pegar agora</span><span class="mono-valor">' + cobrem.map(function (i) {
          return '<span class="mono-sugestao" title="Cobre ' + escapeHtml(i.cobre.join(", ")) + '">' + nomeHtml(i) +
            ' <span class="mono-dim">' + escapeHtml(i.local || "") + '</span></span>';
        }).join("") + '</span></li>'
      : "";
    var total = d.novos.length + d.antes.length + d.proxima.length;
    var etapaTxt = LEVELCAPS && LEVELCAPS.rows[etapa] ? LEVELCAPS.rows[etapa].milestone : "";
    return '<div class="card mono-run">' +
      '<h3>Mono ' + escapeHtml(tipo) + '</h3>' +
      '<ul class="mono-resumo">' +
        '<li><span class="mono-rotulo">Fraco a</span><b>' + escapeHtml(fracas.join(", ")) + '</b></li>' +
        avisoHtml + climaQueCombinaHtml(tipo) + cobremHtml +
      '</ul>' +
      '<details class="mono-tudo"' + (monoTudoAberto ? " open" : "") + '><summary>Tudo o que dá pra pegar <span class="mono-conta">' + total + '</span></summary>' +
        grupo(etapa === 0 ? "Desde o início" : "Novos depois de " + escapeHtml(d.liderAnterior || ""), d.novos) +
        grupo("Disponíveis desde antes", d.antes) +
        (d.proximoLider ? grupo("Depois de vencer " + escapeHtml(d.proximoLider), d.proxima) : "") +
        '<p class="mono-fonte">Até ' + escapeHtml(etapaTxt) + ', os melhores do tipo primeiro. Fonte: planilha da comunidade ' +
          '<a href="' + escapeHtml(MONO_DISP.fonte) + '" target="_blank" rel="noopener">Mono earliest locations</a> (índice oficial), conferida com os dados do jogo.</p>' +
      '</details>' +
    '</div>';
  }

  function renderMonoRun() {
    var el = document.getElementById("team-mono");
    if (el) el.innerHTML = state.team.length ? monoRunCardHtml() : "";
  }
  // Nome abre a ficha; "Usar" põe o clima no arquétipo; lembra se "Tudo o que dá
  // pra pegar" ficou aberto. Ouvinte único no contêiner (padrão da fase 5).
  (function () {
    var painel = document.getElementById("team-mono");
    if (!painel) return;
    painel.addEventListener("toggle", function (e) {
      if (e.target.classList && e.target.classList.contains("mono-tudo")) monoTudoAberto = e.target.open;
    }, true);
    painel.addEventListener("click", function (e) {
      var alvo = e.target.closest("button");
      if (!alvo || !painel.contains(alvo)) return;
      if (alvo.classList.contains("mono-nome")) { goToDexSpecies(Number(alvo.dataset.x)); return; }
      if (alvo.classList.contains("mono-usar-clima")) {
        var clima = alvo.dataset.clima;
        acao(["time", "builds", "resumo"], function () {
          state.archetype.weather = clima;
          teamRecommendation = null; // alvo mudou, sugestão antiga não vale mais
        });
      }
    });
  })();

  function renderTeamAnalysis(members) {
    var el = document.getElementById("team-analysis");
    if (!members.length) {
      el.innerHTML = '<div class="card"><p style="color:var(--text-dim);font-size:var(--fs-texto);">Adicione Pokémon na aba Dex para ver a cobertura defensiva do time.</p></div>';
      return;
    }
    var head = '<th class="rowhead">Vs. tipo</th>' + members.map(function (sp) {
      return '<th><span class="cov-head">' + spriteImgHtml(sp.x, sp.n, 26) + '<span class="cov-head-name">' + escapeHtml(sp.n.split(" ")[0]) + '</span></span></th>';
    }).join("");
    var anyAbilityMod = false;
    var rows = USABLE_TYPES.map(function (atk) {
      var cells = members.map(function (sp) {
        var info = abilityTypeMod(atk, sp);
        var m = info.mult;
        var cls = m === 0 ? "cov-immune" : m >= 2 ? "cov-weak" : m < 1 ? "cov-resist" : "cov-neutral";
        var label = m === 0 ? "0" : m === 0.25 ? "&frac14;" : m === 0.5 ? "&frac12;" : m === 1 ? "&mdash;" : (Math.round(m * 100) / 100) + "&times;";
        var flag = "";
        if (info.reasons.length) {
          anyAbilityMod = true;
          flag = '<span class="cov-flag" title="' + escapeHtml(info.reasons.join("; ")) + '">*</span>';
        }
        return '<td><span class="cov-cell ' + cls + '">' + label + flag + '</span></td>';
      }).join("");
      return '<tr><td class="rowhead">' + typePill(atk, true) + '</td>' + cells + '</tr>';
    }).join("");
    var abilityNote = anyAbilityMod
      ? '<p style="color:var(--text-dim);font-size:var(--fs-pequeno);margin-top:6px;">* ajustado por habilidade inata ou travada (passe o mouse pra ver qual). Só cobre as habilidades já verificadas neste time — o resto da tabela ainda é o multiplicador de tipo puro, sem considerar habilidade.</p>'
      : '<p style="color:var(--text-dim);font-size:var(--fs-pequeno);margin-top:6px;">Tabela de multiplicador de tipo puro — nenhuma habilidade deste time altera esses valores hoje (mas isso só está verificado para as habilidades já conferidas, não para as 1033 do jogo).</p>';

    var risks = computeSharedRisks(members);
    var riskHtml = risks.length ? risks.map(function (r) {
      var pct = (r.n / members.length) * 100;
      return '<div class="risk-item">' + typePill(r.t, true) +
        '<div class="risk-bar-track"><div class="risk-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="mono">' + r.n + '/' + members.length + ' fracos</span></div>';
    }).join("") : '<p style="color:var(--text-dim);font-size:var(--fs-texto);">Nenhum tipo derruba 2 ou mais membros do time ao mesmo tempo &mdash; boa cobertura defensiva de base.</p>';

    // Used to be two bare <h3>s dumped straight into #team-analysis, with no
    // .card wrapper - the only section titles in the whole app that didn't
    // get the standard uppercase/letter-spaced/dim treatment every other
    // <h3> gets (see .card h3). Right in the densest, most important screen
    // in the tool, of all places (design review, 2026-09-09). Two separate
    // cards now, matching how every other section on this page is chunked
    // (Stats, Habilidades, Builds de referência...), not one mega-block.
    // "Leitura estratégica" morou aqui até 2026-09-11 - agora é
    // renderTeamStrategy(), seu próprio elemento no topo da página.
    el.innerHTML = '<div class="card"><h3>Riscos compartilhados do time</h3><div class="risk-list">' + riskHtml + '</div></div>' +
      '<div class="card"><h3>Cobertura defensiva</h3>' +
      '<div class="scroll-x"><table class="cov-table"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      abilityNote + '</div>';
  }
