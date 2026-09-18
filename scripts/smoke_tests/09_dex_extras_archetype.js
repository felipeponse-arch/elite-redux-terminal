// Seções 19 a 24: dashboardDirty/scheduleDashboardRefresh, formas alternativas, PC Box, rank robusto por simulação, arquétipo de time e sugestão geral de encaixe na PC Box.
// Extraído de scripts/smoke_test_suite.js (refactor 2026-09-13) - conteúdo idêntico ao original, só movido pra seu próprio arquivo.
async function section09() {
  await prepararRunPadrao();
  // --- 19. dashboardDirty / scheduleDashboardRefresh() (décima-sétima
  // passagem, 2026-09-11 - fix de performance, commit 1c4b3c9) ---
  // Gap real: aquele fix nunca ganhou cobertura de teste na hora (uma nota
  // errada na memória do projeto chegou a dizer que a seção 18 acima
  // cobria isto - não cobre, é sobre TYPE_MOD_ABILITIES). Compara
  // IDENTIDADE de nó DOM (não conteúdo) pra provar se renderDashboard()
  // rodou ou não - innerHTML sempre cria nós novos, então o mesmo nó
  // sobrevivendo prova que NÃO recalculou; um nó diferente prova que
  // recalculou. Mesma técnica já usada (fora da suíte) pra validar isto ao
  // vivo na própria décima-sétima passagem.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  const dashBefore = document.querySelector("#dashboard .dashboard-card");
  document.querySelector('.tab-btn[data-tab="box"]').click();
  await wait(50);
  // PC Box (Fase 2, 2026-09-11/12): remover exige selecionar o slot primeiro
  // - o botão só existe no painel de detalhe do slot selecionado.
  const slotForRemoveTest = document.querySelector(".pcbox-slot:not(.empty)");
  if (slotForRemoveTest) { slotForRemoveTest.click(); await wait(30); }
  const firstRemoveBtn = document.querySelector(".pcbox-detail .remove-btn");
  if (firstRemoveBtn) {
    firstRemoveBtn.click();
    await wait(30);
    const dashWhileOnBox = document.querySelector("#dashboard .dashboard-card");
    check("dashboard NÃO recalcula enquanto o jogador está numa aba diferente da Dex (dashboardDirty adia o recálculo)",
      dashWhileOnBox === dashBefore, "mesmo nó: " + (dashWhileOnBox === dashBefore));
  } else {
    check("caixa tinha pelo menos 1 membro pro teste de dashboardDirty", false);
  }
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(50);
  const dashAfterSwitch = document.querySelector("#dashboard .dashboard-card");
  check("dashboard recalcula (flush) ao voltar pra aba Dex com dashboardDirty=true",
    dashAfterSwitch !== dashBefore, "mesmo nó: " + (dashAfterSwitch === dashBefore));

  // Atualização ao vivo, JÁ na aba Dex, sem trocar de aba nenhuma vez -
  // usa Torkoal (não tocado por nenhuma seção anterior desta suíte) mas
  // ainda confere `add-box-btn.disabled` antes de clicar em vez de supor -
  // achado real da décima-sexta passagem: clicar numa espécie que já
  // estava na caixa vira no-op e derruba este teste com um falso alarme.
  setSearch("Torkoal");
  await wait(120);
  const torkoalRow = document.querySelector("#species-list .species-row");
  if (torkoalRow) {
    torkoalRow.click();
    await wait(30);
    const addBoxBtn = document.getElementById("add-box-btn");
    if (addBoxBtn && !addBoxBtn.disabled) {
      addBoxBtn.click();
      await wait(30);
      const dashAfterLiveAdd = document.querySelector("#dashboard .dashboard-card");
      check("dashboard atualiza IMEDIATAMENTE (sem trocar de aba) quando o jogador já está na Dex",
        dashAfterLiveAdd !== dashAfterSwitch, "mesmo nó: " + (dashAfterLiveAdd === dashAfterSwitch));
    } else {
      check("Torkoal ainda não estava na caixa (add-box-btn habilitado) pro teste de atualização ao vivo", false,
        "disabled=" + (addBoxBtn && addBoxBtn.disabled));
    }
  } else {
    check("Torkoal encontrado pro teste de atualização ao vivo do dashboard", false);
  }
  setSearch("");
  await wait(120);

  // --- 20. Formas alternativas (sp.frm) - varredura completa do jogo
  // pedida pelo usuário, 2026-09-11 ---
  // Rotom tem as 5 formas de eletrodoméstico reais (Heat/Wash/Frost/Fan/Mow)
  // como fixture - dado nunca extraído até esta passagem. Charizard (sem
  // formas alternativas neste hack) confirma que o card some quando a lista
  // está vazia, não aparece sempre vazio.
  setSearch("Rotom");
  await wait(120);
  const rotomRow = [...document.querySelectorAll("#species-list .species-row")].find(r => r.querySelector(".sname").textContent === "Rotom");
  if (rotomRow) {
    rotomRow.click();
    await wait(30);
    const frmCard = [...document.querySelectorAll(".card")].find(c => c.querySelector("h3") && c.querySelector("h3").textContent === "Formas alternativas");
    check("card 'Formas alternativas' aparece pro Rotom com as 5 formas reais",
      !!frmCard && ["Heat", "Wash", "Frost", "Fan", "Mow"].every(f => frmCard.textContent.indexOf("Rotom " + f) !== -1),
      frmCard && frmCard.textContent);
    const washNode = frmCard && [...frmCard.querySelectorAll(".goto-species")].find(n => n.textContent === "Rotom Wash");
    if (washNode) {
      washNode.click();
      await wait(50);
      check("clicar numa forma alternativa navega pra ficha real dela",
        document.querySelector(".detail-titles h2").textContent === "Rotom Wash",
        document.querySelector(".detail-titles h2").textContent);
    } else {
      check("nó de navegação do Rotom Wash encontrado no card", false);
    }
  } else {
    check("Rotom encontrado pro teste de formas alternativas", false);
  }
  setSearch("Charizard");
  await wait(120);
  const charRowFrm = document.querySelector("#species-list .species-row");
  if (charRowFrm) {
    charRowFrm.click();
    await wait(30);
    const noFrmCard = [...document.querySelectorAll(".card")].find(c => c.querySelector("h3") && c.querySelector("h3").textContent === "Formas alternativas");
    check("card 'Formas alternativas' NÃO aparece pra espécie sem formas (Charizard)", !noFrmCard);
  } else {
    check("Charizard encontrado pro teste de ausência de formas alternativas", false);
  }
  setSearch("");
  await wait(120);

  // --- 21. PC Box (Fase 2 do roadmap de estratégia, 2026-09-11/12) ---
  // Redesenho pedido pelo usuário com print de referência do jogo real:
  // grade paginada (30 slots/caixa) + busca que salta pra caixa+slot certo +
  // painel de detalhe por seleção, em vez da lista fluida de chips antiga.
  document.querySelector('.tab-btn[data-tab="box"]').click();
  await wait(50);
  check("aba renomeada pra 'PC Box' (não mais 'Caixa')",
    document.querySelector('.tab-btn[data-tab="box"]').textContent.indexOf("PC Box") !== -1);
  const pcGrid = document.querySelector(".pcbox-grid");
  check("grade da PC Box tem 30 slots (6x5, mesmo tamanho do print de referência)",
    !!pcGrid && pcGrid.querySelectorAll(".pcbox-slot").length === 30,
    pcGrid && pcGrid.querySelectorAll(".pcbox-slot").length);
  // Tamanho FIXO (não mais 1fr esticando pra preencher a largura da tela) -
  // achado real do usuário, 2026-09-12: numa tela larga cada slot virava um
  // quadrado enorme com o sprite minúsculo boiando no meio.
  const pcAnySlot = document.querySelector(".pcbox-slot:not(.empty)") || document.querySelector(".pcbox-slot.empty");
  check("slots da PC Box têm largura fixa (60px), não esticam pra preencher a tela",
    !!pcAnySlot && getComputedStyle(pcAnySlot).width === "60px",
    pcAnySlot && getComputedStyle(pcAnySlot).width);
  const filledBefore = document.querySelectorAll(".pcbox-slot:not(.empty)").length;
  check("pelo menos 1 slot preenchido (caixa não está vazia nesta altura da suíte)", filledBefore > 0, filledBefore);
  // Seleciona o 1º slot preenchido, confirma painel de detalhe + navegação
  // até a Dex real via o sprite/nome (mesmo goToDexSpecies de sempre).
  const pcFirstSlot = document.querySelector(".pcbox-slot:not(.empty)");
  if (pcFirstSlot) {
    const pcFirstSlotX = pcFirstSlot.dataset.x;
    pcFirstSlot.click();
    await wait(30);
    // renderBox() reconstrói o innerHTML no clique - o nó ANTIGO (pcFirstSlot)
    // fica órfão, precisa reconsultar o novo pra checar .selected nele.
    const reQueriedSlot = document.querySelector('.pcbox-slot[data-x="' + pcFirstSlotX + '"]');
    check("selecionar um slot marca .selected e abre o painel de detalhe",
      !!reQueriedSlot && reQueriedSlot.classList.contains("selected") && !!document.querySelector(".pcbox-detail .pcbox-detail-name"));
    // Mesma informação que o card do Meu Time já mostra (Hab./Innate) -
    // pedido explícito do usuário: "quero a mesma informação que temos
    // aqui no time para cada poke" na caixa.
    const pcAbisEl = document.querySelector(".pcbox-detail-abis");
    check("painel de detalhe da PC Box mostra Hab./Innate, igual o card do Meu Time",
      !!pcAbisEl && pcAbisEl.textContent.indexOf("Hab.:") !== -1 && pcAbisEl.textContent.indexOf("Innate:") !== -1,
      pcAbisEl && pcAbisEl.textContent);
    // "Análise de uso" (redesenho 2026-09-13, esboço do usuário) - reaproveita
    // roleTagsHtml() (mesma função/dado real já usado na Dex), só apresentado
    // aqui dentro de uma seção com nome próprio. Só checa presença/rótulo -
    // o conteúdo exato (Papel/split) já é responsabilidade da própria função,
    // testada indiretamente pelos testes de rank/papel da Dex.
    const pcUsageEl = document.querySelector(".pcbox-detail-usage");
    check("painel de detalhe da PC Box tem a seção 'Análise de uso' (reaproveita o papel/split real já calculado)",
      !!pcUsageEl && pcUsageEl.textContent.indexOf("Análise de uso") !== -1 && pcUsageEl.textContent.indexOf("Papel") !== -1,
      pcUsageEl && pcUsageEl.textContent);
    const detailName = document.querySelector(".pcbox-detail .pcbox-detail-name").textContent;
    document.querySelector(".pcbox-detail .pcbox-detail-name").click();
    await wait(50);
    check("clicar no nome do painel de detalhe navega pra ficha real dele na Dex",
      document.querySelector(".detail-titles h2").textContent === detailName,
      document.querySelector(".detail-titles h2").textContent);
    document.querySelector('.tab-btn[data-tab="box"]').click();
    await wait(50);
  } else {
    check("slot preenchido encontrado pro teste de seleção/detalhe", false);
  }
  // Busca: foco não pode se perder a cada tecla (achado real ao testar isto
  // manualmente antes de escrever o teste - ver comentário no HTML do input).
  const pcSearchBox = document.getElementById("pcbox-search");
  pcSearchBox.focus();
  pcSearchBox.value = "z";
  pcSearchBox.dispatchEvent(new Event("input", { bubbles: true }));
  await wait(50);
  check("campo de busca da PC Box não perde o foco a cada tecla digitada (não é recriado no innerHTML)",
    document.activeElement === pcSearchBox);
  pcSearchBox.value = "";
  pcSearchBox.dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);

  // --- 22. Rank robusto por simulação (vigésima-quarta passagem,
  // 2026-09-12) - âncora de calibração pedida pela QA na própria reunião da
  // equipe ("calibração roda ANTES de qualquer publish, com espécies de
  // controle conhecidas"). Probopass é a âncora: SS estabelecido em VÁRIAS
  // passagens anteriores (sexta passagem em diante) por causa de Levitate +
  // Solid Rock - a primeira versão desta simulação (só tipagem crua, sem
  // ajuste por habilidade) derrubava ele pra C, porque Rock/Steel sozinho é
  // FRACO 4x a Ground - só a Levitate (habilidade) resolve isso de verdade.
  // Este teste existe pra pegar exatamente essa classe de regressão se
  // Get-AbilityAdjustedTypeMultiplier algum dia parar de ser chamado.
  setSearch("Probopass");
  await wait(120);
  const probopassRow = document.querySelector("#species-list .species-row");
  if (probopassRow) {
    probopassRow.click();
    await wait(30);
    const rankBadge = document.querySelector(".rank-badge");
    check("Probopass continua SS (âncora de calibração - Levitate anula a fraqueza 4x a Ground de Rock/Steel)",
      !!rankBadge && rankBadge.textContent === "SS", rankBadge && rankBadge.textContent);
    check("tooltip do rank badge menciona a simulação contra chefões (não a fórmula antiga de uso-em-chefão)",
      !!rankBadge && rankBadge.title.indexOf("simulação de") !== -1 && rankBadge.title.indexOf("uso em chefões") === -1,
      rankBadge && rankBadge.title);
  } else {
    check("Probopass encontrado pro teste de calibração do rank", false);
  }
  setSearch("");
  await wait(120);

  // --- 23. Arquétipo de time: monta o melhor time pro arquétipo escolhido
  // (Fase 3b, REDESENHADA 2026-09-12 por pedido direto do usuário: "a ideia
  // não é analisar os poke que eu tenho no time e sim ao clicar ali ele me
  // dar o melhor time possível dentro dos poke que eu tenho focado naquele
  // arquétipo" - e "ele falar que eu tenho 6 tanque no time não me ajuda de
  // forma objetiva". O antigo "Detectar automaticamente" (só rotulava o
  // time atual) e o aviso de papel redundante (só constatava o problema)
  // foram REMOVIDOS - esta seção substitui inteiramente a versão anterior).
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  const archCard = [...document.querySelectorAll(".card")].find(c => c.querySelector("h3") && c.querySelector("h3").textContent === "Arquétipo do time");
  check("card 'Arquétipo do time' aparece acima da Leitura estratégica (primeiro item da #team-strategy)",
    !!archCard && document.getElementById("team-strategy").firstElementChild === archCard);
  const paceSel = document.getElementById("archetype-pace");
  const weatherSel = document.getElementById("archetype-weather");
  check("os dois <select> de arquétipo (ritmo/clima) existem e têm as opções da taxonomia real (Reddit r/VGC)",
    !!paceSel && !!weatherSel &&
    [...paceSel.options].some(o => o.value === "Balance") && [...paceSel.options].some(o => o.value === "Stall") &&
    [...weatherSel.options].some(o => o.value === "Sand") && [...weatherSel.options].some(o => o.value === "Trick Room"));
  check("aviso de papel redundante (versão antiga, só informativa) foi removido - não existe mais essa classe",
    !document.querySelector(".archetype-warning"));

  // Clicar sem escolher Ritmo/Clima dá uma mensagem construtiva, não chama
  // a IA às cegas (ela precisaria de um alvo real pra montar algo focado).
  const buildBtn = document.getElementById("archetype-build");
  check("botão 'Montar melhor time' existe (substitui 'Detectar automaticamente')", !!buildBtn);
  if (buildBtn) {
    buildBtn.click();
    await wait(30);
    check("clicar sem Ritmo/Clima/Monotype escolhido dá uma mensagem construtiva pedindo pra escolher um eixo primeiro",
      document.getElementById("archetype-status").textContent.indexOf("Ritmo, Clima ou Monotype") !== -1,
      document.getElementById("archetype-status").textContent);
  }

  // Seleção manual persiste de verdade (controle explícito - a IA só monta
  // o time pro alvo já escolhido, nunca decide o alvo sozinha).
  weatherSel.value = "Rain";
  weatherSel.dispatchEvent(new Event("change", { bubbles: true }));
  await wait(30);
  const savedArch1 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").archetype;
  check("selecionar Clima manualmente persiste em localStorage (arquétipo não é só decorativo)",
    !!savedArch1 && savedArch1.weather === "Rain", savedArch1);

  // Monta o roster real (time + caixa ATUAIS desta suíte) pra alimentar o
  // mock com snames de verdade - o mock devolve 2 reais + 1 INVENTADO
  // (sname que não existe no roster), confirmando que a validação defensiva
  // filtra o inventado em vez de confiar cegamente na resposta da IA.
  const saveForArch = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
  const rosterSnames = (saveForArch.team || []).concat(saveForArch.box || []);
  window.__archToolCalls = [];
  window.claude = {
    use: async function (name) {
      if (name !== "sample") return null;
      return {
        json: async function (prompt, opts) {
          window.__archLastPrompt = prompt;
          if (opts && Array.isArray(opts.tools)) {
            for (const t of opts.tools) {
              if (!t.inputSchema) { try { await t.execute({}); window.__archToolCalls.push(t.name); } catch (e) { } }
            }
          }
          return {
            team: rosterSnames.slice(0, 2).concat(["SPECIES_ISTO_NAO_EXISTE"]),
            reasoning: "Mock: time de teste automatizado focado no arquétipo pedido."
          };
        }
      };
    }
  };
  buildBtn.click();
  await wait(100);
  check("'Montar melhor time' chama as ferramentas reais compartilhadas (buildStandardAiTools, Fase 4+)",
    window.__archToolCalls.indexOf("getTeamWeaknesses") !== -1, window.__archToolCalls);
  const recoBtn = document.getElementById("archetype-apply-team");
  check("sugestão de time aparece com botão 'Usar este time' quando o mock devolve um team válido",
    !!recoBtn, recoBtn && recoBtn.textContent);
  check("chip do time sugerido mostra só os 2 reais - o sname inventado (SPECIES_ISTO_NAO_EXISTE) foi filtrado",
    document.querySelectorAll(".archetype-reco-chip").length === 2,
    document.querySelectorAll(".archetype-reco-chip").length);

  if (recoBtn) {
    recoBtn.click();
    await wait(50);
    const saveAfterArch = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("'Usar este time' realmente aplica o time recomendado (só os 2 reais, não o inventado)",
      saveAfterArch.team.length === 2 &&
      rosterSnames.slice(0, 2).every(sn => saveAfterArch.team.indexOf(sn) !== -1),
      saveAfterArch.team);
    check("motivo da recomendação aplicada fica salvo em state.archetype.reasoning",
      saveAfterArch.archetype && saveAfterArch.archetype.reasoning.indexOf("Mock") !== -1,
      saveAfterArch.archetype);
    check("a sugestão some sozinha depois de aplicada (mesmo padrão da troca acionável da Leitura estratégica)",
      !document.getElementById("archetype-apply-team"));
  }
  delete window.claude;

  // --- 24. PC Box ganha sugestão geral de encaixe no time (Fase 4 do
  // roadmap, 2026-09-12) - "não só a sugestão única do próximo chefão".
  // Cenário determinístico (não depende de adivinhar tabela de tipos):
  // Squirtle + Wartortle são Water puro, então compartilham fraqueza real a
  // Grass E Electric (computeSharedRisks real, não simulado). Charmander é
  // Fire puro, que resiste Grass (0.5x) em qualquer tabela de tipos padrão -
  // boxFitNote() deve achar exatamente essa combinação e ignorar Electric
  // (Fire é neutro contra Electric, não conta como resistência).
  [...document.querySelectorAll(".team-slot .remove-btn")].forEach(b => b.click());
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);
  await addByName("Squirtle", false);
  await addByName("Wartortle", false);
  await addByName("Charmander", true);
  document.querySelector('.tab-btn[data-tab="box"]').click();
  await wait(50);
  const charSlot = [...document.querySelectorAll(".pcbox-slot:not(.empty)")].find(function (b) {
    return b.title === "Charmander";
  });
  if (charSlot) {
    charSlot.click();
    await wait(30);
    const fitNoteEl = document.querySelector(".pcbox-fit-note");
    check("PC Box mostra sugestão geral de encaixe (Charmander resiste a Grass, fraqueza real do time)",
      !!fitNoteEl && fitNoteEl.textContent.indexOf("Charmander") !== -1 &&
      fitNoteEl.textContent.indexOf("resiste bem a Grass") !== -1,
      fitNoteEl && fitNoteEl.textContent);
    check("sugestão geral NÃO menciona Electric (Fire é neutro contra Electric, não é resistência real)",
      !fitNoteEl || fitNoteEl.textContent.indexOf("Electric") === -1, fitNoteEl && fitNoteEl.textContent);

    // Sem time (nenhuma fraqueza compartilhada possível), a nota some -
    // confirma que ela depende do time real, não é um texto fixo por espécie.
    [...document.querySelectorAll(".team-slot .remove-btn")].forEach(b => b.click());
    document.querySelector('.tab-btn[data-tab="box"]').click();
    await wait(50);
    const charSlotAgain = [...document.querySelectorAll(".pcbox-slot:not(.empty)")].find(function (b) {
      return b.title === "Charmander";
    });
    if (charSlotAgain) { charSlotAgain.click(); await wait(30); }
    check("SEM time, a sugestão geral de encaixe não aparece (nada pra 'encaixar' sem fraqueza compartilhada)",
      !document.querySelector(".pcbox-fit-note"));
  } else {
    check("Charmander encontrado na PC Box pro teste de encaixe geral", false);
  }

}
