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
  // em vez de formulário) - Ritmo/Clima só têm 5 opções cada, cabem bem
  // como chips. Monotype (18 tipos) usa a MESMA cor real de tipo que o
  // resto do app já usa (typePill/TYPE_META) - reconhecer pela cor é mais
  // rápido que ler 18 nomes numa lista.
  function archetypeChipsHtml(axis, options, current, typeColored) {
    var noneChip = '<button type="button" class="arch-chip' + (!current ? " active" : "") + '" data-axis="' + axis + '" data-value="">Nenhum</button>';
    var chips = options.map(function (opt) {
      var isActive = current === opt;
      var style = "";
      if (typeColored) {
        var meta = TYPE_META[opt] || { hex: "#777", dark: false };
        style = ' style="--chip-color:' + meta.hex + ';--chip-ink:' + (meta.dark ? "#1c1b17" : "#fff9f2") + '"';
      }
      return '<button type="button" class="arch-chip' + (typeColored ? " arch-chip-type" : "") + (isActive ? " active" : "") +
        '"' + style + ' data-axis="' + axis + '" data-value="' + escapeHtml(opt) + '">' + escapeHtml(opt) + '</button>';
    }).join("");
    return '<div class="archetype-chips">' + noneChip + chips + '</div>';
  }

  function archetypeCardHtml(members) {
    return '<div class="card"><h3>Arquétipo do time</h3>' +
      '<p class="mybuild-hint">Escolha um Ritmo, Clima e/ou Monotype e peça o melhor time de até 6, usando só os Pokémon que você já tem (time + caixa). "Gerar time completo" monta a composição, gera a build de cada um e escreve o guia de como jogar - tudo numa ação só.</p>' +
      '<div class="archetype-axis"><span class="archetype-axis-label">Ritmo</span>' + archetypeChipsHtml("pace", PACE_ARCHETYPES, state.archetype.pace || "", false) + '</div>' +
      '<div class="archetype-axis"><span class="archetype-axis-label">Clima</span>' + archetypeChipsHtml("weather", WEATHER_ARCHETYPES, state.archetype.weather || "", false) + '</div>' +
      '<div class="archetype-axis"><span class="archetype-axis-label">Monotype</span>' + archetypeChipsHtml("monotype", MONOTYPE_ARCHETYPES, state.archetype.monotype || "", true) + '</div>' +
      '<div class="archetype-row">' +
        '<button id="archetype-build-complete" class="add-team-btn" type="button" title="Composição + build de cada um + guia de como jogar, tudo de uma vez">Gerar time completo</button>' +
      '</div>' +
      '<span id="archetype-status" class="notes-status" role="status" aria-live="polite"></span>' +
    '</div>';
  }

  // Chips de arquétipo e "Montar time completo": ouvinte único em #team-strategy
  // (fase 5 da refatoração, 2026-09-24) - antes religados a cada renderTeamStrategy.
  (function () {
    var painel = document.getElementById("team-strategy");
    painel.addEventListener("click", function (e) {
      var alvo = e.target.closest("button");
      if (!alvo || !painel.contains(alvo)) return;
      if (alvo.id === "archetype-build-complete") { generateCompleteTeam(); return; }
      if (!alvo.classList.contains("arch-chip")) return;
      var axis = alvo.dataset.axis;
      var value = alvo.dataset.value || null;
      // O Ritmo decide qual curada o time mostra (estilo) - por isso "time" e
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
      if (!pace && !weather && !monotype) {
        if (statusEl) statusEl.textContent = "Escolha um Ritmo, Clima ou Monotype primeiro, pra eu focar o time em algo.";
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
  // membro sem build salva - reaproveita a MESMA função que "Gerar build
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
    if (!pace && !weather && !monotype) {
      setStatus("Escolha um Ritmo, Clima ou Monotype primeiro, pra eu focar o time em algo.");
      return;
    }
    setStatus("Etapa 1/4 - montando a composição do time...");
    var composed = await generateTeamForArchetype();
    if (!composed || !teamRecommendation) return; // generateTeamForArchetype já deixou o motivo no status
    if (!applyRecommendedTeam()) return; // idem, applyRecommendedTeam já deixou o motivo no status/toast
    var members = state.team.map(getSpeciesByX).filter(Boolean);
    for (var i = 0; i < members.length; i++) {
      var sp = members[i];
      if (effectiveBuild(sp)) continue; // já tinha build salva (ex: já jogava com este Pokémon) - não gera de novo por cima
      setStatus("Etapa 2/4 - gerando build " + (i + 1) + "/" + members.length + " (" + sp.n + ")...");
      await generateBuildWithAI(sp, "archetype-status");
    }
    setStatus("Etapa 3/4 - escrevendo o guia de como jogar este time...");
    var focusDesc = [pace ? "Ritmo: " + pace : "", weather ? "Clima: " + weather : "", monotype ? "Monotype: " + monotype : ""].filter(Boolean).join(" + ");
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
  function generatedTeamCardHtml(members) {
    if (!generatedTeamResult || generatedTeamResult.forTeamKey !== teamKeyFor(members)) return "";
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
