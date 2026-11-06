  // ===== src/ui/time.js =====
  // Aba Time: cards dos membros, troca com a caixa, times salvos e "Novo jogo".
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui time.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- team roster rendering ----------------
  function renderTeam() {
    // Só desenha. A revisão automática das builds é disparada pelas ações que
    // mudam time/builds (concluirAcoes), não por quem desenha.
    var slotsEl = document.getElementById("team-slots");
    var members = state.team.map(getSpeciesByX).filter(Boolean);
    var slots = [];
    for (var i = 0; i < 6; i++) {
      if (members[i]) {
        var sp = members[i];
        var names = speciesTypeNames(sp);
        var abiNames = habilidadesEscolhiveis(sp).join(", ");
        var innNames = sp.inn.map(function (id) { return ABILITIES[id][0]; }).join(", ");
        var build = effectiveBuild(sp);
        var buildHtml = build ? (
          '<div class="ts-build">' +
            '<div class="ts-build-head"><span class="ts-build-label">' + rotuloDaBuild(build) + '</span>' + seloDaBuildHtml(build) +
              '<button class="ts-build-copy" data-x="' + sp.x + '" type="button" title="Copiar este set">copiar</button></div>' +
            '<pre class="showdown-block">' + escapeHtml(showdownSet(sp, build)) + '</pre>' +
            planoDaBuildHtml(build) +
            itemDescHtml(build.item) +
            megaModeBuildNoteHtml(sp, build) +
            buildContextNotesHtml(sp, build) +
            buildSynergyHtml(sp, build) +
            // Nota da curada (fonte + observações do autor): no card fica em 3
            // linhas, com o texto inteiro no title; completa na ficha
            // (redesenho 2026-09-24 - ocupava metade do card).
            (build.note ? '<div class="ts-nota-fonte" title="' + escapeHtml(build.note) + '">' + buildNoteHtml(escapeHtml(build.note)) + '</div>' : "") +
          '</div>'
        ) : (
          // Sem build salva: o texto leva para a Dex (o app não gera build por IA; o Modo Motor monta o time com as builds).
          '<div class="ts-build ts-build-empty">' +
            '<p style="margin:0 0 8px;">Sem build salva ainda - monte na Dex ou use "Montar meu melhor time".</p>' +
          '</div>'
        );
        var swapOpen = teamSwapIdx === i;
        slots.push('<div class="team-slot' + (swapOpen ? ' swapping' : '') + '"><div>' +
          '<div class="ts-head goto-species" tabindex="0" role="button" data-x="' + sp.x + '" title="Ver na Dex">' + spriteImgHtml(sp.x, sp.n, 64) +
          '<div><div class="ts-name">' + escapeHtml(sp.n) + ' ' + rankBadgeHtml(sp.sname) + megaLockedTagHtml(sp) + '</div>' +
          '<div class="ts-types">' + names.map(function (n) { return typePill(n, true); }).join("") + '</div></div></div>' +
          '<div class="ts-abis"><b>Hab.:</b> ' + escapeHtml(abiNames) + '<br><b>Innate:</b> ' + escapeHtml(innNames) + otherFormsHtml(sp) + '</div>' +
          buildHtml +
          buildHistoryHtml(sp) +
          (swapOpen ? swapPanelHtml(i, sp) : "") +
          '</div><div class="ts-actions">' +
            '<button class="ts-swap-btn" data-idx="' + i + '" type="button">' + (swapOpen ? 'Cancelar' : '⇄ Trocar') + '</button>' +
            '<button class="remove-btn" data-x="' + sp.x + '" type="button" title="Manda de volta pra caixa">remover</button>' +
          '</div></div>');
      }
    }
    // One compact call-to-action instead of up to six identical empty boxes —
    // on a phone those pushed everything useful ~1300px down the page.
    if (members.length < 6) {
      var free = 6 - members.length;
      slots.push('<div class="team-slot empty">' +
        '<div>' + free + ' ' + (free === 1 ? 'vaga livre' : 'vagas livres') + '</div>' +
        '<button class="ts-goto-dex" id="ts-goto-dex" type="button">+ Adicionar da Dex</button>' +
        (state.box.length ? '<button class="ts-goto-dex" id="ts-goto-box" type="button">+ Puxar da Caixa</button>' : '') +
        '</div>');
    }
    slotsEl.innerHTML = slots.join("");

    // Cliques dos cards: ouvinte único em #team-slots (ver abaixo de renderTeam).

    // Contadores e resumo da Dex são das ações (TELAS.contadores/resumo), não
    // do desenho do time - chamá-los daqui recalculava o confronto 2 vezes.
    renderTeamStrategy(members);
    renderMonoRun(); // abaixo do time (revisão de front/CX, 2026-09-27)
    renderTeamAnalysis(members);
    renderSavedTeams();
    renderNextFightCard();
    pipelineDesenharTime(); // bloco "Sugestões do jogo para o time": só desenha se estiver aberto
  }

  // Um ouvinte só pra todos os cards do time (fase 5 da refatoração,
  // 2026-09-24). Antes renderTeam religava ~5 ouvintes por card a cada
  // redesenho (remover, trocar, copiar, gerar com IA, escolher da caixa, atalhos).
  (function () {
    var slotsEl = document.getElementById("team-slots");
    slotsEl.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn || !slotsEl.contains(btn)) return;
      var x = parseInt(btn.dataset.x, 10);
      if (btn.classList.contains("remove-btn")) {
        // Achado em auditoria completa da equipe (2026-09-13): isto
        // descartava o Pokémon direto, ao contrário de
        // rosterMove()/applyRecommendedTeam()/renderSavedTeams() "Carregar",
        // que sempre banem quem sai do time pra caixa - inconsistente com a
        // filosofia "nada se perde, só se move" usada em todo o resto do
        // app. Time e Caixa não têm médo comum aqui (não é rosterMove(),
        // que troca um POR outro) - só garante que quem sai não desaparece.
        acao(telasDeElenco(x), function () {
          state.team = state.team.filter(function (v) { return v !== x; });
          if (state.box.indexOf(x) === -1) state.box.push(x);
          teamSwapIdx = null;
        });
      } else if (btn.classList.contains("ts-swap-btn")) {
        var idx = parseInt(btn.dataset.idx, 10);
        teamSwapIdx = (teamSwapIdx === idx) ? null : idx; // estado de tela (painel aberto), nada a gravar
        renderTeam();
      } else if (btn.classList.contains("ts-build-copy")) {
        var spCopia = getSpeciesByX(x);
        copyText(showdownSet(spCopia, effectiveBuild(spCopia)), null, "");
        flashToast("Set do " + spCopia.n + " copiado (formato Showdown)");
      } else if (btn.classList.contains("swap-pick")) {
        rosterMove(x, state.team[parseInt(btn.dataset.idx, 10)]); // a ação redesenha o time
      } else if (btn.id === "ts-goto-dex") {
        document.querySelector('.tab-btn[data-tab="dex"]').click();
        document.getElementById("search-input").focus();
      } else if (btn.id === "ts-goto-box") {
        document.querySelector('.tab-btn[data-tab="box"]').click();
      }
    });
  })();

  // ---- team <-> box swapping ----
  var teamSwapIdx = null;

  function swapPanelHtml(slotIdx, currentSp) {
    var boxMembers = state.box.map(getSpeciesByX).filter(Boolean).filter(function (sp) {
      return state.team.indexOf(sp.x) === -1;
    });
    if (!boxMembers.length) {
      return '<div class="swap-panel"><div class="swap-empty">Nenhum Pokémon disponível na caixa. Adicione capturas na aba PC Box primeiro.</div></div>';
    }
    return '<div class="swap-panel">' +
      '<div class="swap-title">Trocar ' + escapeHtml(currentSp.n) + ' por:</div>' +
      '<div class="swap-list">' + boxMembers.map(function (sp) {
        return '<button class="swap-pick" data-idx="' + slotIdx + '" data-x="' + sp.x + '" type="button" title="' + escapeHtml(sp.n) + '">' +
          spriteImgHtml(sp.x, sp.n, 30) +
          '<span class="swap-pick-name">' + escapeHtml(sp.n) + '</span></button>';
      }).join("") + '</div></div>';
  }

  // The single roster mutation used by every entry point (team card, box chip,
  // dex row/detail). One rule set, so the three UIs can never drift apart:
  //   - the incoming Pokemon always leaves the box
  //   - whoever it displaces always lands in the box, like benching in-game
  //   - a Pokemon is never in the team twice
  // `outX` null means "take a free slot"; returns false if the move is invalid.
  // Telas que dependem de quem está no time/caixa (a ficha mostra "no time",
  // o card do chefão mostra o confronto com o time).
  var TELAS_ELENCO = ["contadores", "resumo", "time", "caixa", "chefao"];
  // + a ficha de cada Pokémon envolvido (só redesenha se for a que está aberta).
  function telasDeElenco() {
    var out = TELAS_ELENCO.slice();
    for (var i = 0; i < arguments.length; i++) {
      var sp = arguments[i] !== null && arguments[i] !== undefined ? getSpeciesByX(arguments[i]) : null;
      if (sp) out.push("ficha:" + sp.sname);
    }
    return out;
  }
  function rosterMove(inX, outX) {
    return acao(telasDeElenco(inX, outX), function () {
      if (getSpeciesByX(inX) === null) return false;
      if (state.team.indexOf(inX) !== -1) return false;
      if (outX === null || outX === undefined) {
        if (state.team.length >= 6) return false;
        state.team.push(inX);
      } else {
        var slot = state.team.indexOf(outX);
        if (slot === -1) return false;
        state.team[slot] = inX;
        if (state.box.indexOf(outX) === -1) state.box.push(outX);
      }
      state.box = state.box.filter(function (v) { return v !== inX; });
      teamSwapIdx = null;
      return true;
    });
  }

  var savedTeamEditingIdx = null;

  function teamsMatch(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    var sa = a.slice().sort();
    var sb = b.slice().sort();
    return sa.every(function (v, i) { return v === sb[i]; });
  }

  // HTML de um cartão de time salvo (função pura: facilita o teste de acessibilidade).
  // Sprite = <button> com aria-label (antes era span role=button só com title); campo de nome com aria-label.
  function htmlDoCartaoDoTimeSalvo(slot, i, members, isActive, editando) {
    var nome = slot.name || ("Time " + (i + 1));
    var nameHtml = editando
      ? '<input type="text" class="stc-rename-input" id="stc-rename-input" aria-label="Nome do time" value="' + escapeHtml(nome) + '" maxlength="40">'
      : '<div class="stc-name">' + escapeHtml(nome) + (isActive ? ' <span class="stc-active-badge">● ativo</span>' : '') + '</div>';
    return '<div class="saved-team-card">' +
      nameHtml +
      '<div class="stc-sprites">' + members.map(function (sp) {
        return '<button type="button" class="goto-species stc-sprite" data-x="' + sp.x + '" title="Ver na Dex" aria-label="Ver ' + escapeHtml(sp.n) + ' na Dex">' + spriteImgHtml(sp.x, sp.n, 32) + '</button>';
      }).join("") + '</div>' +
      '<div class="stc-actions">' +
        (editando
          ? '<button class="stc-rename-save" data-idx="' + i + '" type="button">Salvar nome</button>'
          : '<button class="stc-load" data-idx="' + i + '" type="button">Carregar</button>' +
            '<button class="stc-rename" data-idx="' + i + '" type="button">Renomear</button>' +
            '<button class="stc-delete" data-idx="' + i + '" type="button">Excluir</button>') +
      '</div></div>';
  }

  function renderSavedTeams() {
    var grid = document.getElementById("saved-teams-grid");
    var cards = [];
    for (var i = 0; i < 3; i++) {
      var slot = state.savedTeams[i];
      if (slot) {
        var slotXs = snamesToXs(slot.team);
        var members = slotXs.map(getSpeciesByX).filter(Boolean);
        cards.push(htmlDoCartaoDoTimeSalvo(slot, i, members, teamsMatch(slotXs, state.team), savedTeamEditingIdx === i));
      } else {
        cards.push('<div class="saved-team-card empty">Slot vazio</div>');
      }
    }
    grid.innerHTML = cards.join("");

    var saveBtn = document.getElementById("save-team-btn");
    var freeSlots = state.savedTeams.length < 3;
    saveBtn.disabled = !(state.team.length && freeSlots);
    saveBtn.title = !state.team.length ? "Monte um time primeiro" : !freeSlots ? "Os 3 slots já estão ocupados — exclua um pra salvar outro" : "";

    // Cliques e teclas da grade: ouvintes únicos em #saved-teams-grid (logo abaixo).
  }

  // ---- times salvos: ações e ouvintes únicos (fase 5 da refatoração) ----
  function carregarTimeSalvo(idx) {
    var slot = state.savedTeams[idx];
    if (!slot) return;
    // Achado em auditoria (2026-09-13): esta troca costumava substituir
    // state.team direto, ao contrário de rosterMove()/
    // applyRecommendedTeam() - quem estava no time atual e não pertence
    // ao slot salvo simplesmente sumia (nunca ia pra caixa), e qualquer
    // sname do slot que a build de dados atual não reconhece (ex: um
    // save sincronizado de um aparelho com dado de versão diferente)
    // era descartado sem rastro. Agora segue o MESMO critério dos
    // outros dois: quem sai do time é banido pra caixa, nunca
    // descartado, e órfãos entram em state.orphans pra sobreviver ao
    // próximo persist() (mesmo mecanismo do save principal, ver
    // snamesToXs()/state.orphans acima).
    var loadOrphans = [];
    var xs = snamesToXs(slot.team, loadOrphans).slice(0, 6);
    acao(TELAS_ELENCO.concat(["ficha"]), function () {
      state.team.forEach(function (x) {
        if (xs.indexOf(x) === -1 && state.box.indexOf(x) === -1) state.box.push(x);
      });
      state.box = state.box.filter(function (x) { return xs.indexOf(x) === -1; });
      state.team = xs;
      loadOrphans.forEach(function (sn) {
        if (state.orphans.team.indexOf(sn) === -1) state.orphans.team.push(sn);
      });
    });
    document.getElementById("saved-teams-status").textContent = "Time \"" + (slot.name || ("Time " + (idx + 1))) + "\" carregado.";
  }
  function excluirTimeSalvo(idx) {
    var slot = state.savedTeams[idx];
    if (!slot) return;
    // Achado na auditoria de 2026-09-18: excluía na hora, sem confirmar
    // - botão "Excluir" fica ao lado de "Carregar", um clique errado
    // perdia o layout salvo sem aviso nenhum e sem como desfazer (os
    // Pokémon em si continuam no time/caixa, só a referência salva some).
    // Mesmo <dialog> de confirmação do "Novo jogo" - já pronto e
    // testado, reaproveitado aqui em vez de duplicar a lógica.
    openConfirmModal(
      "Excluir time salvo?",
      "Isso apaga o layout \"" + (slot.name || ("Time " + (idx + 1))) + "\" salvo. Os Pokémon continuam no seu time/caixa - só a referência salva é removida, e não dá pra desfazer.",
      "Excluir",
      function () {
        acao(["timesSalvos", "contadores"], function () { state.savedTeams.splice(idx, 1); });
      }
    );
  }
  function comecarRenomearTimeSalvo(idx) {
    savedTeamEditingIdx = idx; // estado de tela (campo aberto), nada a gravar
    renderSavedTeams();
    var input = document.getElementById("stc-rename-input");
    if (input) { input.focus(); input.select(); }
  }
  function salvarNomeTimeSalvo(idx) {
    var input = document.getElementById("stc-rename-input");
    var newName = input ? input.value.trim() : "";
    savedTeamEditingIdx = null;
    acao(["timesSalvos"], function () { if (newName && state.savedTeams[idx]) state.savedTeams[idx].name = newName; });
  }
  (function () {
    var grid = document.getElementById("saved-teams-grid");
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn || !grid.contains(btn)) return;
      var idx = parseInt(btn.dataset.idx, 10);
      if (btn.classList.contains("stc-load")) carregarTimeSalvo(idx);
      else if (btn.classList.contains("stc-delete")) excluirTimeSalvo(idx);
      else if (btn.classList.contains("stc-rename")) comecarRenomearTimeSalvo(idx);
      else if (btn.classList.contains("stc-rename-save")) salvarNomeTimeSalvo(idx);
    });
    grid.addEventListener("keydown", function (e) {
      if (e.target.id !== "stc-rename-input") return;
      if (e.key === "Enter") { var b = grid.querySelector(".stc-rename-save"); if (b) salvarNomeTimeSalvo(parseInt(b.dataset.idx, 10)); }
      if (e.key === "Escape") { savedTeamEditingIdx = null; renderSavedTeams(); }
    });
  })();

  document.getElementById("save-team-btn").addEventListener("click", function () {
    if (state.savedTeams.length >= 3 || !state.team.length) return;
    var nameInput = document.getElementById("save-team-name");
    var name = nameInput.value.trim() || ("Time " + (state.savedTeams.length + 1));
    nameInput.value = "";
    acao(["timesSalvos"], function () { state.savedTeams.push({ name: name, team: xsToSnames(state.team) }); });
    document.getElementById("saved-teams-status").textContent = "Salvo como \"" + name + "\".";
  });

  // "Novo jogo" (pedido do usuário, 2026-09-13): reseta time E caixa de uma
  // vez - a ação destrutiva e sem banco-de-recuperação deste app (diferente
  // de "remover" do time, que sempre banca pra caixa - aqui não há pra onde
  // bancar). Builds/anotações/times salvos ficam intactos - só a composição
  // atual de time/caixa é limpa, exatamente o que foi pedido, nada além
  // disso.
  // BUG achado na auditoria de 2026-09-18 (relatado pelo usuário: "o botão
  // não funciona"): isto usava window.confirm() nativo. Artifact publicado
  // roda num iframe cujo atributo sandbox o app não controla - sem
  // "allow-modals" nesse atributo, confirm()/alert()/prompt() são
  // bloqueados pelo navegador (não dá erro nenhum, só nunca aparece nada e
  // a função segue com `ok` falso) - o clique parecia não fazer nada. Trocado
  // pro <dialog>.showModal() já usado em #swap-modal, que não é um dos
  // diálogos síncronos que esse atributo restringe.
  // 2026-09-24 (pauta da auditoria de 23/09, "vale só time/caixa ou a run
  // inteira?"): o texto do próprio diálogo prometia "como se fosse começar um
  // jogo novo", mas Arquétipo, registro de auto-evolução (indexado por NOME de
  // espécie: um Pokémon novo de mesmo nome podia ser "desevoluído" por engano),
  // buffs de ginásio já resgatados e a insígnia atual sobreviviam. Decisão
  // (sem perguntar, regra de ser semi-automático): "Novo jogo" zera TUDO que
  // pertence à run - time, caixa, arquétipo, auto-evolução, buffs de ginásio e
  // insígnia (volta pro início). Dificuldade, level cap e modo de Mega são as
  // opções de setup do jogo e podem continuar iguais numa run nova, então
  // ficam como estão, mas a confirmação da run é pedida de novo (o banner
  // "Confira sua run" volta). Builds, anotações e times salvos continuam
  // guardados, como sempre.
  function zerarRun() {
    acao(TELAS_ELENCO.concat(["ficha", "progresso", "log"]), function () {
      state.team = [];
      state.box = [];
      state.archetype = { pace: null, weather: null, monotype: null, tatica: null, reasoning: "" };
      state.autoEvolved = {};
      state.gymSkillsCleared = {};
      state.orphans = { team: [], box: [] }; // Pokémon de versão mais nova dos dados também são da run antiga
      state.settings.milestone = 0;
      state.settings.runConfirmedAt = null;
      capRegistrado = getCurrentCap();
      teamRecommendation = null;
      generatedTeamResult = null;
      teamSwapIdx = null;
      pcBoxSelectedX = null;
      myBuildLevelIsCustom = false;
      logAutoAction("Novo jogo: time, caixa, arquétipo, progresso de Etapas e buffs de ginásio zerados. Builds, anotações e times salvos foram mantidos.");
    });
    var msSel = document.getElementById("settings-milestone");
    if (msSel) msSel.value = "0";
    document.getElementById("run-setup-banner").hidden = false;
  }
  document.getElementById("reset-team-box-btn").addEventListener("click", function () {
    if (!runTemAlgoPraZerar()) return;
    openConfirmModal(
      "Começar um jogo novo?",
      "Isso zera a sua run: remove TODOS os Pokémon do time e da caixa, volta a Etapa pro início e limpa o arquétipo e os buffs de ginásio já resgatados. " +
        "Dificuldade, level cap e modo de Mega ficam como estão, mas o app pede pra você confirmar de novo. Builds, anotações e times salvos continuam guardados.",
      "Começar jogo novo",
      function () {
        zerarRun();
        flashToast("Run zerada - pronto pra um jogo novo. Confira a dificuldade e o level cap.");
      }
    );
  });
