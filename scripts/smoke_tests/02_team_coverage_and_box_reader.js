// Seções 6, 7 e 7b: card de builds de referência, tabela de cobertura do time e o 'leitor de caixa' (sugestão de próxima luta + Analisar meu time).
// Extraído de scripts/smoke_test_suite.js (refactor 2026-09-13) - conteúdo idêntico ao original, só movido pra seu próprio arquivo.
async function section02() {
  // --- 6. build-reference card has a real title (not a bare <details>) ---
  // Achado em auditoria de QA (2026-09-13): esta checagem sempre passava
  // (`check(..., true)`) - `buildCard` era calculado e nunca usado na
  // asserção. Nidoking (espécie atual nesta seção) não tem build de
  // chefão real (não está em data/boss_reference_builds.json), então o
  // card nem deveria renderizar aqui - testa esse caminho de verdade, e
  // depois troca pra uma espécie que TEM dado real (Eelektross) pra testar
  // o caminho positivo também.
  const buildCardAbsent = [...document.querySelectorAll("#species-detail .card h3")]
    .find(h => h.textContent === "Builds de referência");
  check("espécie sem build de chefão real (Nidoking) não mostra o card 'Builds de referência'", !buildCardAbsent);

  setSearch("Eelektross");
  await wait(120);
  const eelektrossRow6 = document.querySelector("#species-list .species-row");
  if (eelektrossRow6) {
    eelektrossRow6.click();
    await wait(30);
    const buildCard = [...document.querySelectorAll("#species-detail .card h3")]
      .find(h => h.textContent === "Builds de referência");
    // .closest("details") É esperado (a seção inteira "Golpes/Anotações e
    // builds de referência/Comparar" vive dentro de um <details
    // class="detail-group"> colapsável de propósito, Fase 2 2026-09-11) -
    // o que este teste verifica é só que o TÍTULO em si é um <h3> de
    // verdade dentro de um .card, não texto solto ou um <summary> fazendo
    // o papel de cabeçalho.
    check("espécie com build de chefão real (Eelektross) mostra o card 'Builds de referência' com título de verdade",
      !!buildCard && !!buildCard.closest(".card"));
  } else { check("Eelektross encontrado pro teste do card de builds de referência", false); }
  setSearch("");
  await wait(120);

  // --- 7. team coverage table sits in a titled .card (not a bare <h3>) ---
  // 2 cards em #team-analysis (Riscos compartilhados + Cobertura defensiva)
  // - "Leitura estratégica" morou aqui até a décima-nona/vigésima-primeira
  // passagem (2026-09-11), quando subiu pro topo da página como seu próprio
  // elemento #team-strategy (pedido do usuário - ver checagem 7c abaixo).
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const analysisCards = document.querySelectorAll("#team-analysis .card");
  check("team-analysis renders inside .card elements (not bare <h3>)", analysisCards.length === 2, "found " + analysisCards.length);
  const scrollX = document.querySelector("#team-analysis .scroll-x");
  if (scrollX) {
    const cs = getComputedStyle(scrollX);
    check("coverage table has a scroll mask", !!(cs.maskImage && cs.maskImage !== "none") || !!(cs.webkitMaskImage && cs.webkitMaskImage !== "none"));
  }

  // --- 7b. "leitor de caixa" (reunião 2026-09-11) - Fase 1 (dashboard) +
  // Fase 2 (análise de time por IA) + Fase 3 (ferramenta unificada). Não
  // dá pra chamar bestBoxCandidateForBoss()/BOSSES direto daqui (fecham
  // dentro da IIFE do app, o teste só enxerga o DOM) - as checagens abaixo
  // são estruturais: se uma sugestão aparecer, ela precisa ser
  // autoconsistente com o que já está renderizado em outro lugar da tela
  // (o nome sugerido é mesmo um membro real da caixa), não um valor
  // hardcoded que quebraria se o balanceamento do jogo mudar.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  document.getElementById("tabs-more-toggle").click();
  await wait(20);
  document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
  await wait(50);
  const milestoneSelBefore = document.getElementById("settings-milestone").value;
  document.getElementById("settings-milestone").value = "1"; // muitos chefões ainda faltam
  document.getElementById("settings-milestone").dispatchEvent(new Event("change", { bubbles: true }));
  await wait(50);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(50);
  // Classe própria (.dash-suggestion-boss), não :last-child nem substring -
  // achado real ao rodar isto pela primeira vez: a sugestão por RANK que já
  // existia (dash-suggestion "normal") também tem "na caixa" no texto,
  // então :last-child + indexOf("na caixa") colidia com ela quando a
  // sugestão de chefão não renderiza (falso positivo pra classe errada).
  const nextFightLine = document.querySelector("#dashboard .dash-suggestion-boss .dash-value");
  const nextFightText = nextFightLine ? nextFightLine.textContent : "";
  if (nextFightLine) {
    check("linha 'Próxima luta' do dashboard (Fase 1) tem o formato esperado (chefão: espécie na caixa + motivo)",
      /.+: .+ na caixa (imune a|resiste bem a) .+/.test(nextFightText), nextFightText);
    // confirma que a espécie sugerida é mesmo um membro REAL da caixa agora
    // (não do time, não inventado) - cruza com a aba Caixa renderizada
    const suggestedName = nextFightLine.querySelector(".goto-species") ? nextFightLine.querySelector(".goto-species").textContent : "";
    document.querySelector('.tab-btn[data-tab="box"]').click();
    await wait(50);
    // PC Box (Fase 2, 2026-09-11/12) só mostra sprite na grade, não nome de
    // toda espécie ao mesmo tempo - usa a própria busca da PC Box (que já
    // pula pra caixa+slot certo e seleciona) pra confirmar que a espécie
    // sugerida é mesmo um membro real, em vez de listar todos os nomes.
    const pcSearch = document.getElementById("pcbox-search");
    pcSearch.value = suggestedName || "";
    pcSearch.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(50);
    const foundDetailName = document.querySelector(".pcbox-detail .pcbox-detail-name");
    check("a espécie sugerida na Fase 1 é mesmo um membro real da caixa (não inventado, não do time)",
      !!suggestedName && !!foundDetailName && foundDetailName.textContent === suggestedName,
      { suggestedName: suggestedName, foundInBox: foundDetailName && foundDetailName.textContent });
    pcSearch.value = "";
    pcSearch.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    await wait(30);
  } else {
    // Nenhuma sugestão é um resultado válido (a caixa pode genuinamente não
    // ter nada mais seguro que o time já tem) - só registra, não falha.
    check("dashboard sem sugestão de 'próxima luta' é um resultado aceito (caixa sem candidato melhor)", true);
  }
  // restaura o milestone "sem limite" que o resto da suíte inteira depende
  document.getElementById("tabs-more-toggle").click();
  await wait(20);
  document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
  await wait(50);
  document.getElementById("settings-milestone").value = milestoneSelBefore;
  document.getElementById("settings-milestone").dispatchEvent(new Event("change", { bubbles: true }));
  await wait(50);
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // Fase 2/4 - "Analisar meu time": mesmo padrão de mock de window.claude já
  // usado pra "Gerar build com IA" (sample.json(), campos estruturados) -
  // trocado de sample() puro (só {text}) pra sample.json() na Fase 4
  // (2026-09-12) pra caber o campo extra `swap` (sugestão de troca
  // acionável), mesmo contrato que "Gerar build com IA" já usa.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  // Reposicionamento pedido pelo usuário, 2026-09-11: "Leitura estratégica"
  // era a ÚLTIMA coisa da aba - agora é a PRIMEIRA, acima até de "Meu time".
  // DOCUMENT_POSITION_FOLLOWING = o 2º argumento vem DEPOIS do 1º no DOM.
  const teamStrategyEl = document.getElementById("team-strategy");
  const teamSlotsEl = document.getElementById("team-slots");
  check("'Leitura estratégica' aparece ANTES de 'Meu time' no DOM (primeiro item da página)",
    !!teamStrategyEl && !!teamSlotsEl &&
    !!(teamStrategyEl.compareDocumentPosition(teamSlotsEl) & Node.DOCUMENT_POSITION_FOLLOWING));
  const strategyBtn = document.getElementById("team-strategy-generate");
  if (strategyBtn) {
    window.__strategyToolCalls = [];
    const mockText = "Leitura de teste automatizado: time equilibrado, entra com o mais rápido primeiro.";
    function mockStrategyClaude(swapPayload) {
      window.claude = {
        use: async function (name) {
          if (name !== "sample") return null;
          return {
            json: async function (prompt, opts) {
              window.__strategyLastPrompt = prompt;
              if (opts && Array.isArray(opts.tools)) {
                var teamSnames = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").team || [];
                for (const t of opts.tools) {
                  if (t.inputSchema) {
                    for (const sname of teamSnames) {
                      const result = await t.execute({ sname: sname });
                      window.__strategyToolCalls.push({ name: t.name, sname: sname, result: result });
                    }
                  } else {
                    const result = await t.execute({});
                    window.__strategyToolCalls.push({ name: t.name, result: result });
                  }
                }
              }
              return { text: mockText, swap: swapPayload };
            }
          };
        }
      };
    }
    mockStrategyClaude(null);
    strategyBtn.click();
    await wait(100);
    check("'Analisar meu time' chamou getTeamWeaknesses de verdade (não simulado por fora)",
      window.__strategyToolCalls.some(function (c) { return c.name === "getTeamWeaknesses" && typeof c.result.teamSize === "number"; }));
    check("'Analisar meu time' chamou getSpeciesRank/getPriorityMoveOptions/getAbilityMovepoolSynergy pra CADA membro do time (Fase 2)",
      ["getSpeciesRank", "getPriorityMoveOptions", "getAbilityMovepoolSynergy"].every(function (name) {
        return window.__strategyToolCalls.filter(function (c) { return c.name === name; }).length === 6;
      }), window.__strategyToolCalls.map(function (c) { return c.name; }));
    // Fase 3 - a MESMA ferramenta unificada de sugestão de caixa também
    // chamada aqui, não só na geração de build
    check("'Analisar meu time' também chamou getBoxCandidatesForBoss (Fase 3, ferramenta unificada)",
      window.__strategyToolCalls.some(function (c) { return c.name === "getBoxCandidatesForBoss"; }));
    // Fase 4 - getBoxOverview (caixa inteira, não só 1 candidato pra 1 luta)
    check("'Analisar meu time' também chamou getBoxOverview (Fase 4, caixa inteira)",
      window.__strategyToolCalls.some(function (c) { return c.name === "getBoxOverview" && typeof c.result.boxSize === "number"; }),
      window.__strategyToolCalls.map(function (c) { return c.name; }));
    const rationaleBlock = document.querySelector("#team-strategy .mybuild-rationale");
    check("a leitura estratégica (mock) aparece em destaque na tela",
      rationaleBlock && rationaleBlock.textContent.indexOf(mockText) !== -1);
    check("o botão vira 'Analisar de novo' depois de uma leitura já existir",
      document.getElementById("team-strategy-generate") && document.getElementById("team-strategy-generate").textContent.indexOf("de novo") !== -1);
    check("SEM sugestão de troca acionável quando a IA (mock) devolveu swap:null",
      !document.getElementById("team-strategy-apply-swap"));

    // Fase 4 - sugestão de troca acionável: mock devolve um swap real (1
    // membro do time atual + 1 da caixa atual, ambos lidos do save real, não
    // inventados), confirma que o botão aplica a MESMA rosterMove() de
    // sempre (não uma mutação de estado paralela).
    const saveBeforeSwap = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    const outSnameForSwap = (saveBeforeSwap.team || [])[0];
    const inSnameForSwap = (saveBeforeSwap.box || [])[0];
    if (outSnameForSwap && inSnameForSwap) {
      mockStrategyClaude({ outSname: outSnameForSwap, inSname: inSnameForSwap, reason: "teste automatizado de troca" });
      document.getElementById("team-strategy-generate").click();
      await wait(100);
      const applySwapBtn = document.getElementById("team-strategy-apply-swap");
      check("sugestão de troca acionável aparece quando a IA (mock) devolve um swap válido",
        !!applySwapBtn, applySwapBtn && applySwapBtn.outerHTML);
      if (applySwapBtn) {
        applySwapBtn.click();
        await wait(50);
        const saveAfterSwap = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
        check("'Aplicar troca' realmente moveu o Pokémon da caixa pro time (mesma rosterMove() de sempre)",
          (saveAfterSwap.team || []).indexOf(inSnameForSwap) !== -1 && (saveAfterSwap.team || []).indexOf(outSnameForSwap) === -1,
          saveAfterSwap.team);
        check("'Aplicar troca' mandou quem saiu do time pra caixa (não descartou)",
          (saveAfterSwap.box || []).indexOf(outSnameForSwap) !== -1, saveAfterSwap.box);
        check("a sugestão de troca some sozinha depois de aplicada (time mudou, forTeamKey não bate mais)",
          !document.getElementById("team-strategy-apply-swap"));

        // Desfaz a troca (mesmo botão, sentido invertido) - nenhum teste
        // depois deste nesta suíte deveria herdar um time diferente do seed
        // original só por causa deste teste ter rodado. Dobra como um
        // segundo check real: a troca funciona nos dois sentidos.
        mockStrategyClaude({ outSname: inSnameForSwap, inSname: outSnameForSwap, reason: "desfazendo o teste" });
        document.getElementById("team-strategy-generate").click();
        await wait(100);
        const undoBtn = document.getElementById("team-strategy-apply-swap");
        if (undoBtn) {
          undoBtn.click();
          await wait(50);
          const saveRestored = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
          check("troca desfeita com sucesso (time volta ao seed original desta suíte)",
            (saveRestored.team || []).indexOf(outSnameForSwap) !== -1 && (saveRestored.box || []).indexOf(inSnameForSwap) !== -1,
            saveRestored.team);
        } else {
          check("botão de desfazer a troca encontrado", false);
        }
      }
    } else {
      check("time/caixa reais disponíveis pro teste de sugestão de troca acionável", false, saveBeforeSwap);
    }
    delete window.claude;
  } else {
    check("botão 'Analisar meu time' encontrado", false);
  }

}
