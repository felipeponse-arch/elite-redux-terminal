// Seção 19 (2026-09-17): dois achados da verificação de "Gym Skills" contra o
// código-fonte oficial (github.com/Elite-Redux/eliteredux-source, branch
// upcoming, conferido linha a linha em src/battle_main.c).
//
// P1 - DIFF_TO_BOSSKEY estava deslocado uma posição: o jogo usa o mesmo
// campo "party" pra Easy E Ace (a diferença entre elas é só EVs habilitados,
// não o time), e só troca de time em Elite ("insane") e Hell ("hell", que o
// app não modela). O app usava ace->insane e elite->hell, mostrando o time
// errado por padrão pra quem joga Ace ou Elite.
async function section19() {
  await prepararRunPadrao();
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }

  var diffOriginal = T.state.settings.difficulty;
  document.querySelector('.tab-btn[data-tab="bosses"]').click();
  await wait(50);
  document.getElementById("boss-search-input").value = "Roxanne 1";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  var row = document.querySelector("#boss-list .species-row");
  if (achou("Roxanne 1 (fixture) na lista de chefões", row)) {
    function timeSelecionadoPara(dificuldade) {
      T.state.settings.difficulty = dificuldade;
      row.click();
      return document.querySelectorAll(".boss-mon-card .bm-name").length;
    }
    // O fixture Roxanne 1 tem 5 membros no time "party" (Easy/Ace) e 6 no
    // "insane" (Elite) - conferido direto em data/bosses.json antes de
    // escrever este teste, não chutado.
    check("Dificuldade Easy mostra o time \"party\" (5 membros) por padrão",
      timeSelecionadoPara("easy") === 5, "membros=" + document.querySelectorAll(".boss-mon-card .bm-name").length);
    check("Dificuldade Ace mostra o time \"party\" (5 membros) por padrão, não o \"insane\"",
      timeSelecionadoPara("ace") === 5, "membros=" + document.querySelectorAll(".boss-mon-card .bm-name").length);
    check("Dificuldade Elite mostra o time \"insane\" (6 membros) por padrão",
      timeSelecionadoPara("elite") === 6, "membros=" + document.querySelectorAll(".boss-mon-card .bm-name").length);
    var insaneBtn = document.querySelector('.chip-btn[data-diff="insane"]');
    check("o seletor manual de chips (Padrão/Insane/Hell) continua disponível pra conferir os outros tiers",
      !!insaneBtn);
    // Levantamento de 2026-09-24: mudar a dificuldade no Progresso não mudava o
    // time do chefão que já estava aberto (só ao reabrir).
    timeSelecionadoPara("ace");
    document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
    await wait(30);
    var diffSel = document.getElementById("settings-difficulty");
    diffSel.value = "elite";
    diffSel.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelector('.tab-btn[data-tab="bosses"]').click();
    await wait(30);
    check("mudar a dificuldade atualiza o chefão já aberto, sem reabrir (Ace 5 -> Elite 6 membros)",
      document.querySelectorAll(".boss-mon-card .bm-name").length === 6, "membros=" + document.querySelectorAll(".boss-mon-card .bm-name").length);
    diffSel.value = diffOriginal;
    diffSel.dispatchEvent(new Event("change", { bubbles: true }));
  }
  T.state.settings.difficulty = diffOriginal;
  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));

  // P2 - Gym Skills: achado real durante a investigação, o mecanismo que a
  // FAQ oficial descreve (derrotar treinador de apoio tira um buff do líder)
  // NÃO vem do sistema exclusivo do modo Hell (que eu tinha achado primeiro
  // e é irrelevante pra quem joga Ace/Elite/Easy). Vem do script de cada
  // ginásio (EventScript_CheckTrainers), sem trava de dificuldade - achado
  // só depois que o usuário confirmou, jogando, que via isso em qualquer
  // dificuldade. Dado extraído de scripts.pory de cada ginásio real.
  check("ponte expõe GYM_SKILLS com os 9 líderes confirmados na fonte",
    !!T.GYM_SKILLS && Object.keys(T.GYM_SKILLS.leaders || {}).length === 9,
    T.GYM_SKILLS && JSON.stringify(Object.keys(T.GYM_SKILLS.leaders || {})));
  check("gymLeaderBaseName tira o número da rebatalha",
    T.gymLeaderBaseName("Roxanne 3") === "Roxanne" && T.gymLeaderBaseName("Wallace") === "Wallace");

  document.getElementById("boss-search-input").value = "Roxanne 1";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  var roxRow = document.querySelector("#boss-list .species-row");
  if (achou("Roxanne 1 (fixture) achada de novo pro card de Gym Skills", roxRow)) {
    roxRow.click();
    await wait(50);
    var card = document.querySelector('#boss-detail [data-gym-leader="Roxanne"]');
    if (achou("card \"Buffs do ginásio\" aparece pra um líder de ginásio", card)) {
      var boxes = card.querySelectorAll("[data-gymskill]");
      check("mostra os 3 buffs confirmados de Roxanne, sem citar nenhum treinador de apoio pelo nome",
        boxes.length === 3 && !/Josh|Tommy|Marc/.test(card.textContent), "boxes=" + boxes.length);
      check("todos começam desmarcados (nada foi tirado ainda nesta run de teste)",
        [...boxes].every(function (b) { return !b.checked; }));
      check("resumo mostra 3 de 3 buffs restantes", /3 de 3/.test(card.querySelector(".gym-skill-summary").textContent),
        card.querySelector(".gym-skill-summary").textContent);

      boxes[0].click();
      boxes[0].dispatchEvent(new Event("change", { bubbles: true }));
      await wait(30);
      card = document.querySelector('#boss-detail [data-gym-leader="Roxanne"]');
      check("marcar um buff atualiza o resumo pra 2 de 3 e persiste no save",
        /2 de 3/.test(card.querySelector(".gym-skill-summary").textContent) &&
        Array.isArray(JSON.parse(localStorage.getItem("er_terminal_save") || "{}").gymSkillsCleared.Roxanne),
        card.querySelector(".gym-skill-summary").textContent);

      // desmarca de volta, deixando o save como estava antes do teste
      var stillChecked = card.querySelector("[data-gymskill]:checked");
      if (stillChecked) { stillChecked.click(); stillChecked.dispatchEvent(new Event("change", { bubbles: true })); await wait(30); }
    }
  }

  document.getElementById("boss-search-input").value = "Sidney";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  var sidneyRow = document.querySelector("#boss-list .species-row");
  if (achou("Sidney (Alto Comando, fixture de não-líder)", sidneyRow)) {
    sidneyRow.click();
    await wait(50);
    check("chefão que não é líder de ginásio não ganha o card de Gym Skills",
      !document.querySelector("#boss-detail [data-gym-leader]"));
  }

  document.getElementById("boss-search-input").value = "Juan 1";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  var juanRow = document.querySelector("#boss-list .species-row");
  if (achou("Juan 1 (fixture, ginásio sem buffs progressivos)", juanRow)) {
    juanRow.click();
    await wait(50);
    var juanCard = document.querySelector('#boss-detail [data-gym-leader="Juan"]');
    check("Sootopolis (Juan/Wallace) mostra a trava explicada, sem checkboxes de buff",
      !!juanCard && juanCard.querySelectorAll("[data-gymskill]").length === 0 && /10 treinadores/.test(juanCard.textContent),
      juanCard ? juanCard.textContent.slice(0, 120) : "(sem card)");
  }

  // ---- Comparação time x chefão na ficha do chefão (achado em auditoria,
  // 2026-09-18, item 17: antes só existia o jeito manual de copiar time+chefão
  // pra colar numa conversa à parte). Era o card "Prontidão do seu time"
  // (só tipo); desde 2026-09-24 é o card "Confronto com o seu time" (motor
  // src/regras/confronto.js), e o teste cruza a tela contra o que o motor
  // calcula, não contra a presença de um texto. ----
  T.state.settings.difficulty = "ace";
  document.getElementById("boss-search-input").value = "Roxanne 1";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(30);
  var roxanneRow = document.querySelector("#boss-list .species-row");
  if (achou("Roxanne 1 (fixture) pra testar Prontidão do seu time", roxanneRow)) {
    roxanneRow.click();
    await wait(50);
    var boss = T.BOSSES.find(function (b) { return b.name === "Roxanne 1"; });
    if (achou("dado real do chefão Roxanne 1 (T.BOSSES)", boss)) {
      var teamMembers = T.state.team.map(T.getSpeciesByX).filter(Boolean);
      // O card antigo "Prontidão do seu time" (só tipo, 2026-09-18) foi
      // fundido no "Confronto com o seu time" em 2026-09-24: não pode voltar
      // a aparecer duplicado na ficha.
      check("ficha do chefão não tem mais o card \"Prontidão do seu time\" (fundido no Confronto)",
        ![...document.querySelectorAll("#boss-detail .card h3")].some(function (h) { return h.textContent.indexOf("Prontidão") !== -1; }));

      // ---- "Confronto com o seu time" (motor src/regras/confronto.js,
      // 2026-09-24): aparece sozinho na ficha, sem clique, e a tela mostra
      // exatamente o que o motor calculou (uma linha por Pokémon do chefão,
      // uma coluna por membro do time, buracos citados pelo nome). ----
      var cardConfronto = document.getElementById("boss-confronto");
      if (teamMembers.length && achou("card \"Confronto com o seu time\" na ficha do chefão (time não vazio)", cardConfronto)) {
        var cx = T.confrontoParaParty(boss.party);
        if (achou("resultado do motor pra Roxanne 1", cx)) {
          check("uma linha por Pokémon do chefão e uma coluna por membro do time",
            cardConfronto.querySelectorAll("tbody tr").length === boss.party.length &&
              cardConfronto.querySelectorAll("tbody tr:first-child .cf-cell").length === teamMembers.length,
            cardConfronto.querySelectorAll("tbody tr").length + " linhas, " + cardConfronto.querySelectorAll("tbody tr:first-child .cf-cell").length + " colunas");
          var textoConfronto = cardConfronto.querySelector(".cf-verdict").textContent;
          check("todo Pokémon sem resposta super efetiva é citado pelo nome no resumo",
            cx.c.buracos.every(function (f) { return textoConfronto.indexOf(f.name) !== -1; }), textoConfronto);
          check("todo Pokémon do seu time exposto ao que o chefão ataca é citado pelo nome (o lado defensivo do antigo card de Prontidão)",
            cx.c.expostos.every(function (i) { return textoConfronto.indexOf(cx.minhas[i].main.n) !== -1; }) &&
              (cx.c.expostos.length === 0 || textoConfronto.indexOf("expostos") !== -1), textoConfronto);
          check("o resumo cita a melhor abertura do motor",
            textoConfronto.indexOf(cx.minhas[cx.c.abertura].main.n) !== -1, textoConfronto);
          check("cada célula tem texto acessível dizendo o veredito (não só cor)",
            [].slice.call(cardConfronto.querySelectorAll(".cf-cell .cf-sym")).every(function (s) {
              return /vantagem|seguro|neutro|arriscado|desvantagem/.test(s.getAttribute("aria-label") || "");
            }));

          // Fases 3-6 (2026-09-24): plano de luta sempre presente (um passo
          // por Pokémon do chefão, mais a abertura), ajustes só quando o
          // motor tem o que sugerir, botão de aplicar só com troca real.
          var plano = cardConfronto.querySelector("details.cf-plan");
          check("plano de luta tem a abertura e um passo por Pokémon do chefão",
            !!plano && plano.querySelectorAll("li").length >= boss.party.length + 1,
            plano ? plano.querySelectorAll("li").length + " passos" : "(sem plano)");
          var cxTrocas = T.confrontoParaParty(boss.party, true);
          var ajustes = cardConfronto.querySelector(".cf-fix");
          var temTrocas = !!(cxTrocas.trocas && cxTrocas.trocas.trocas.length);
          var temAlgoPraSugerir = T.coberturaSugerida(cxTrocas.minhas, cxTrocas.c).length > 0 || temTrocas;
          check("bloco \"Como melhorar este confronto\" aparece só quando o motor tem o que sugerir",
            !!ajustes === temAlgoPraSugerir,
            { ajustes: !!ajustes, buracos: cxTrocas.c.buracos.length });
          check("botão de aplicar troca existe se e somente se há troca sugerida da caixa",
            !!cardConfronto.querySelector(".cf-apply-swap") === temTrocas);

          // Ferramenta de IA com o elenco real da próxima luta (fase 4).
          var milestoneFase4 = T.state.settings.milestone;
          T.state.settings.milestone = 0;
          var roster = T.aiTool_getNextBossRoster();
          var proxima = T.getRemainingBossEntries()[0];
          check("getNextBossRoster devolve o elenco real da próxima luta (golpes, habilidade, item)",
            roster.nextBossName === proxima.name &&
              roster.timeDoChefao.length === T.bossPartyPorDificuldade(proxima).length &&
              roster.timeDoChefao.every(function (m) { return m.golpes.length > 0 && m.habilidade; }),
            roster);
          T.state.settings.milestone = milestoneFase4;
        }
      }
    }
  }

  document.getElementById("boss-search-input").value = "";
  document.getElementById("boss-search-input").dispatchEvent(new Event("input", { bubbles: true }));
  document.querySelector('.tab-btn[data-tab="dex"]').click();
  await wait(30);

  // Resumo da Dex: linha "Confronto" da próxima luta, sem clique (o mesmo
  // motor da ficha do chefão). Só aparece com time montado.
  // O resumo só re-renderiza quando o time muda (dashboardDirty), então o
  // teste força o render com o progresso em "sem badge" (a próxima luta é
  // sempre um líder de ginásio) e restaura o milestone no fim.
  if (T.state.team.length) {
    var milestoneAntes = T.state.settings.milestone;
    T.state.settings.milestone = 0;
    T.renderDashboard();
    var dashConfronto = document.querySelector("#team-nextfight .dash-confronto");
    check("o detalhe da próxima luta (fim da aba Time) mostra a linha \"Confronto\" quando há time",
      !!dashConfronto && /melhor abertura/.test(dashConfronto.textContent),
      dashConfronto ? dashConfronto.textContent : "(sem linha)");
    // Print do usuário (2026-09-24): o resumo do topo da Dex tinha crescido
    // até empurrar a busca pra fora da tela do celular. Agora é compacto; o
    // detalhe mora no fim da aba Time.
    var dashCompacto = document.querySelector("#dashboard .dashboard-card");
    check("resumo do topo da Dex é compacto: só Time, Maior risco e uma linha da próxima luta",
      !!dashCompacto && dashCompacto.querySelectorAll(".dash-item").length === 3 && !!dashCompacto.querySelector(".dash-next") &&
        !dashCompacto.querySelector(".dash-confronto") && !dashCompacto.querySelector(".dash-speed") && !dashCompacto.querySelector(".dash-suggestion"),
      dashCompacto ? dashCompacto.textContent : "(sem card)");
    check("resumo do topo da Dex é curto (menos de 240 caracteres)", !!dashCompacto && dashCompacto.textContent.length < 240,
      dashCompacto ? dashCompacto.textContent.length : "(sem card)");
    var maisBtn = document.querySelector("#dashboard .dash-more");
    if (achou("botão \"detalhes\" no resumo compacto", maisBtn)) {
      maisBtn.click();
      await wait(50);
      check("\"detalhes\" leva pra aba Time, onde o card da próxima luta mora",
        document.getElementById("view-team").classList.contains("active") && !document.getElementById("team-nextfight").hidden);
      document.querySelector('.tab-btn[data-tab="dex"]').click();
      await wait(30);
    }
    T.state.settings.milestone = milestoneAntes;
    T.renderDashboard();
  }

  // ---- Registro automático da luta vencida (fase 5): avançar de insígnia
  // anota no log "O que o app fez sozinho" o que o confronto via antes da
  // luta; voltar de insígnia não anota nada. Mexe em time/caixa/log/progresso
  // (auto-evolução pode disparar), então tira um retrato antes e restaura no
  // fim. ----
  if (T.state.team.length) {
    var retrato = JSON.parse(JSON.stringify({ team: T.state.team, box: T.state.box, autoLog: T.state.autoLog, settings: T.state.settings }));
    T.state.settings.milestone = 0;
    document.getElementById("tabs-more-toggle").click();
    await wait(20);
    document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
    await wait(50);
    var msSel19 = document.getElementById("settings-milestone");
    msSel19.value = "0";
    msSel19.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(30);
    // logAutoAction não empilha a mesma frase seguida - só atualiza a data da
    // entrada que já existe (seções anteriores podem ter gerado a mesma
    // frase com este mesmo time), então o que vale é "a entrada existe e foi
    // gravada/atualizada agora", não a contagem.
    var inicioAvanco = new Date().toISOString();
    msSel19.value = "1";
    msSel19.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(50);
    var logAvanco = T.state.autoLog.find(function (e) { return e.text.indexOf("assumi que venceu") !== -1; });
    check("avançar de insígnia registra a luta vencida no log automático, com o que o confronto via",
      !!logAvanco && /sem resposta super efetiva/.test(logAvanco.text) && logAvanco.at >= inicioAvanco,
      logAvanco ? logAvanco.at + " / " + logAvanco.text : "(sem registro)");
    var atDoAvanco = logAvanco && logAvanco.at;
    await wait(15);
    msSel19.value = "0";
    msSel19.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(50);
    var logDepoisDeVoltar = T.state.autoLog.find(function (e) { return e.text.indexOf("assumi que venceu") !== -1; });
    check("voltar de insígnia não registra nem atualiza luta vencida",
      !!logDepoisDeVoltar && logDepoisDeVoltar.at === atDoAvanco, logDepoisDeVoltar ? logDepoisDeVoltar.at + " vs " + atDoAvanco : "(sem registro)");
    T.state.team = retrato.team; T.state.box = retrato.box; T.state.autoLog = retrato.autoLog;
    T.state.settings.difficulty = retrato.settings.difficulty; T.state.settings.milestone = retrato.settings.milestone;
    msSel19.value = String(retrato.settings.milestone);
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    await wait(30);
  }
}
