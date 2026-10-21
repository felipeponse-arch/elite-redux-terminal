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
    // "Remover da caixa" ganhou confirmação na auditoria de 2026-09-18 (era
    // apagado na hora, sem aviso - achado grave, mesma classe do bug do
    // "Novo jogo"). O clique acima só ABRE o diálogo agora - cancela sem
    // remover, porque este teste é sobre dashboardDirty, não sobre remoção,
    // e um <dialog> modal aberto deixa o resto da página inert e travaria
    // os passos seguintes desta seção.
    const cancelBtn09 = document.getElementById("confirm-modal-cancel");
    if (cancelBtn09) { cancelBtn09.click(); await wait(30); }
    // Como o Pokémon não é mais removido de verdade (cancelei o diálogo),
    // ele continua selecionado (pcBoxSelectedX) - o teste de PC Box mais
    // abaixo desta seção espera a caixa "limpa", sem seleção, igual ficava
    // depois de uma remoção de verdade. Clicar de novo no MESMO slot
    // desmarca (o clique é um toggle - ver o listener de .pcbox-slot).
    // Reconsulta: renderBox() trocou o nó. Desde a fase 5 (2026-09-24) o
    // clique é tratado por UM ouvinte na caixa, então clicar no nó antigo (já
    // fora da página) não faz nada - igual na tela de verdade.
    document.querySelector('.pcbox-slot[data-x="' + slotForRemoveTest.dataset.x + '"]').click();
    await wait(30);
  } else {
    check("caixa tinha pelo menos 1 membro pro teste de dashboardDirty", false);
  }
  // Fase 2 da refatoração (2026-09-24): quem marca o resumo como
  // desatualizado é a AÇÃO que muda o estado, não o desenho da caixa. O
  // diálogo acima foi cancelado (nada mudou), então voltar pra Dex não
  // recalcula - antes recalculava à toa, porque renderBox mexia no contador.
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(50);
  const dashSemMudanca = document.querySelector("#dashboard .dashboard-card");
  check("sem mudança de estado, voltar pra Dex não recalcula o resumo (nada mudou)",
    dashSemMudanca === dashBefore, "mesmo nó: " + (dashSemMudanca === dashBefore));
  // Mudança de verdade feita em outra aba: marca e recalcula ao voltar.
  document.querySelector('.tab-btn[data-tab="box"]').click();
  await wait(30);
  window.__erTest.acao(["resumo"], function () { return true; });
  const dashAindaNaCaixa = document.querySelector("#dashboard .dashboard-card");
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(50);
  const dashAfterSwitch = document.querySelector("#dashboard .dashboard-card");
  check("ação em outra aba não recalcula na hora; recalcula (flush) ao voltar pra Dex",
    dashAindaNaCaixa === dashBefore && dashAfterSwitch !== dashBefore, "mesmo nó: " + (dashAfterSwitch === dashBefore));

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

  // --- 22. Âncoras de calibração do rank (QA: "calibração roda ANTES de
  // qualquer publish, com espécies de controle conhecidas"). Desde 2026-09-28
  // o rank é o duelo simulado (scripts/calcular_rank_duelo.mjs) e a âncora
  // antiga (Probopass SS, calibrada pra fórmula de tipagem defensiva) saiu.
  // Rank v2 (02/10): Primal Kyogre saiu do rank (só no pós-jogo pelo código do jogo).
  // Âncora nova: Sandslash Mega, SS em Fácil/Ace e em Elite, obtível na etapa 4
  // (arma a própria tempestade de areia com Sand Stream).
  // Versão nova do jogo (15/10): com os treinadores novos e o fim da dupla contagem, foi de SS 97 para S 94 sem
  // mudar no dado; a âncora passa a ser "fica no topo" (S ou SS).
  setSearch("Sandslash Mega");
  await wait(120);
  const ancoraRow = [...document.querySelectorAll("#species-list .species-row")].find((r) => /Sandslash Mega/.test(r.textContent));
  if (ancoraRow) {
    ancoraRow.click();
    await wait(30);
    const rankBadge = document.querySelector("#species-detail .rank-badge");
    check("Sandslash Mega fica no topo, S ou SS (âncora de calibração do rank v2)",
      !!rankBadge && /^S{1,2}$/.test(rankBadge.textContent), rankBadge && rankBadge.textContent);
    check("tooltip do rank badge explica o duelo simulado contra os chefões (não a fórmula antiga)",
      !!rankBadge && rankBadge.title.indexOf("Duelo simulado") !== -1 && rankBadge.title.indexOf("Sinal principal") === -1,
      rankBadge && rankBadge.title);
  } else {
    check("Sandslash Mega encontrado pro teste de calibração do rank", false);
  }
  setSearch("");
  await wait(120);

  // --- 23. Arquétipo de time (card só de configuração desde 2026-09-18:
  // "montar melhor time tem que sair junto com leitura estrategica nao
  // temos mais que ter esses botoes eles nao fazem mais sentido" - pedido
  // direto do usuário. O botão avulso "Montar melhor time"/"Usar este time"
  // e o card "Leitura estratégica" foram REMOVIDOS; "Gerar time completo"
  // (seção 20, generateCompleteTeam) cobre composição + build + guia numa
  // ação só e é o único caminho de UI que resta pra gerar um time pelo
  // arquétipo. teamRecommendation/generateTeamForArchetype/
  // applyRecommendedTeam continuam existindo como uso INTERNO de
  // generateCompleteTeam, sem botão próprio.
  document.querySelector('.tab-btn[data-tab="team"]').click();
  await wait(50);
  // Redesenho 2026-09-24: o card virou um <details> recolhido numa linha (o
  // time vem primeiro na tela), com o que está escolhido no resumo.
  const archCard = document.querySelector("#team-strategy details.arquetipo");
  check("card de arquétipo é o primeiro item da #team-strategy (não tem mais Leitura estratégica abaixo)",
    !!archCard && document.getElementById("team-strategy").firstElementChild === archCard);
  check("arquétipo começa recolhido, com as escolhas no resumo",
    !!archCard && !archCard.open && /Estilo:\s*nenhum/.test(archCard.querySelector("summary").textContent),
    archCard && archCard.querySelector("summary").textContent);
  // <select> viraram chips (.arch-chip) no redesign de 2026-09-18.
  const paceChips = [...document.querySelectorAll('.arch-chip[data-axis="pace"]')];
  const weatherChips = [...document.querySelectorAll('.arch-chip[data-axis="weather"]')];
  check("os chips de arquétipo (ritmo/clima) existem e têm as opções da taxonomia real (Reddit r/VGC)",
    paceChips.some(c => c.dataset.value === "Balance") && paceChips.some(c => c.dataset.value === "Stall") &&
    weatherChips.some(c => c.dataset.value === "Sand") && weatherChips.some(c => c.dataset.value === "Trick Room"));
  check("aviso de papel redundante (versão antiga, só informativa) foi removido - não existe mais essa classe",
    !document.querySelector(".archetype-warning"));
  check("botão avulso 'Montar melhor time' foi removido (achado de UX, 2026-09-18)",
    !document.getElementById("archetype-build"));
  check("o Meu Time abre no Modo Motor (padrão): botão 'Montar time pelo Motor' e chip Motor marcado",
    !!document.getElementById("motor-montar") && document.getElementById("modo-montagem-motor").getAttribute("aria-pressed") === "true");
  await usarModoIA(); // o padrão é o Modo Motor (botão 'Montar time pelo Motor'); a IA é o outro chip
  check("só resta o botão 'Gerar time completo' no card de arquétipo (modo IA)",
    !!document.getElementById("archetype-build-complete"));
  check("card 'Leitura estratégica' foi removido (redundante com 'Gerar time completo')",
    ![...document.querySelectorAll(".card h3")].some(h => h.textContent === "Leitura estratégica"));

  // Seleção manual persiste de verdade (controle explícito - a IA só monta
  // o time pro alvo já escolhido, nunca decide o alvo sozinha).
  selecionarArquetipo("weather", "Rain");
  await wait(30);
  const savedArch1 = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").archetype;
  check("selecionar Clima manualmente persiste em localStorage (arquétipo não é só decorativo)",
    !!savedArch1 && savedArch1.weather === "Rain", savedArch1);

  // --- 24. PC Box ganha sugestão geral de encaixe no time (Fase 4 do
  // roadmap, 2026-09-12) - "não só a sugestão única do próximo chefão".
  // Cenário determinístico (não depende de adivinhar tabela de tipos):
  // Squirtle + Wartortle são Water puro, então compartilham fraqueza real a
  // Grass E Electric (computeSharedRisks real, não simulado). Charmander é
  // Fire puro, que resiste Grass (0.5x) em qualquer tabela de tipos padrão -
  // boxFitNote() deve achar exatamente essa combinação e ignorar Electric
  // (Fire é neutro contra Electric, não conta como resistência).
  esvaziarTimePelosBotoes();
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
    esvaziarTimePelosBotoes();
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
