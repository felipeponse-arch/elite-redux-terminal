  // ===== src/ui/dex_lista.js =====
  // Dex: filtro de tipo, busca, ordenação, lista em lotes e o modal de troca do time.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.ps1 (marcador @ui dex_lista.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- type filter panel ----------------
  var typeFilterPanel = document.getElementById("type-filter-panel");
  USABLE_TYPES.forEach(function (t) {
    var label = document.createElement("label");
    label.className = "type-check";
    label.innerHTML = '<input type="checkbox" value="' + escapeHtml(t) + '">' + escapeHtml(t);
    var meta = TYPE_META[t];
    // Fase 1 quality-of-life, 2026-09-09: type filter now persists between
    // sessions (see applySave()/buildSave()) - reflect any restored value
    // in this checkbox's initial appearance, not just an empty checkbox
    // regardless of state.
    var checkboxEl = label.querySelector("input");
    if (state.typeFilter.has(t)) {
      checkboxEl.checked = true;
      label.classList.add("checked");
      label.style.background = meta.hex; label.style.color = meta.dark ? "#1c1b17" : "#fff9f2"; label.style.borderColor = meta.hex;
    }
    checkboxEl.addEventListener("change", function (e) {
      var marcado = e.target.checked;
      if (marcado) { label.classList.add("checked"); label.style.background = meta.hex; label.style.color = meta.dark ? "#1c1b17" : "#fff9f2"; label.style.borderColor = meta.hex; }
      else { label.classList.remove("checked"); label.style.background = ""; label.style.color = ""; label.style.borderColor = ""; }
      acao(["lista"], function () { if (marcado) state.typeFilter.add(t); else state.typeFilter.delete(t); });
    });
    typeFilterPanel.appendChild(label);
  });
  document.getElementById("type-filter-toggle").addEventListener("click", function () {
    typeFilterPanel.classList.toggle("hidden");
    this.classList.toggle("active");
  });

  document.getElementById("search-input").addEventListener("input", debounce(function (e) {
    state.query = e.target.value.trim().toLowerCase();
    // Typing means "find me something else": surface the results again. On
    // desktop both panes are visible anyway, so this is a no-op there.
    document.getElementById("dex-shell").classList.remove("show-detail");
    renderList();
  }, 80));
  // Fase 1 quality-of-life, 2026-09-09: sort order persists between
  // sessions - reflect a restored value in the <select> itself, since the
  // static HTML always ships with "dex" marked as the default option.
  document.getElementById("sort-select").value = state.sort;
  document.getElementById("sort-select").addEventListener("change", function (e) {
    acao(["lista"], function () { state.sort = e.target.value; });
  });

  // Keyboard shortcuts - Fase 1 quality-of-life, 2026-09-09: "/" jumps to
  // the relevant search box, Esc backs out of a detail view (same action
  // as clicking "Voltar para a lista"), arrow keys move a highlight
  // through the Dex list and Enter opens the highlighted species. All
  // guarded on not currently typing in a field, so "/" typed into notes or
  // an item search still types a literal slash instead of stealing focus.
  document.addEventListener("keydown", function (e) {
    var activeTag = document.activeElement && document.activeElement.tagName;
    var typing = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";

    if (e.key === "/" && !typing) {
      e.preventDefault();
      var dexActive = document.querySelector('.tab-btn[data-tab="dex"]').classList.contains("active");
      var bossesActive = document.querySelector('.tab-btn[data-tab="bosses"]').classList.contains("active");
      if (dexActive) {
        document.getElementById("search-input").focus();
      } else if (bossesActive) {
        var bossSearch = document.getElementById("boss-search-input");
        if (bossSearch) bossSearch.focus();
      }
      return;
    }

    if (e.key === "Escape" && !typing) {
      if (document.getElementById("dex-shell").classList.contains("show-detail")) {
        document.getElementById("back-to-list").click();
      } else if (document.getElementById("boss-shell").classList.contains("show-detail")) {
        var bossBack = document.getElementById("boss-back-to-list");
        if (bossBack) bossBack.click();
      }
      return;
    }

    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !typing) {
      var dexActiveNav = document.querySelector('.tab-btn[data-tab="dex"]').classList.contains("active");
      var bossesActiveNav = document.querySelector('.tab-btn[data-tab="bosses"]').classList.contains("active");
      if (dexActiveNav && !document.getElementById("dex-shell").classList.contains("show-detail")) {
        moveListboxCursor("#species-list .species-row", e);
      } else if (bossesActiveNav && !document.getElementById("boss-shell").classList.contains("show-detail")) {
        // Accessibility pass, 2026-09-10: Chefões never had this shortcut at
        // all before - only the Dex list did (Fase 1). Same cursor logic,
        // same helper.
        moveListboxCursor("#boss-list .species-row", e);
      }
      return;
    }

    if (e.key === "Enter" && !typing) {
      var activeRow = document.querySelector("#species-list .species-row.kbd-active, #boss-list .species-row.kbd-active");
      if (activeRow) activeRow.click();
    }
  });

  // Shared by the Dex and Chefões arrow-key cursors above. Moves BOTH the
  // existing .kbd-active visual highlight (unchanged from Fase 1, still
  // exactly what the smoke suite checks) AND real DOM focus + a roving
  // tabindex, so a screen reader actually announces which option has the
  // keyboard's attention instead of only a sighted user seeing an outline
  // move. Deliberately does NOT touch aria-selected - that reflects which
  // species/boss is actually OPEN in the detail panel (state.selected /
  // bossState.selected), a distinct concept from "where the keyboard cursor
  // currently sits", same reasoning already documented for why .kbd-active
  // is its own CSS class instead of reusing .selected.
  function moveListboxCursor(rowSelector, e) {
    var rows = document.querySelectorAll(rowSelector);
    if (!rows.length) return;
    e.preventDefault();
    // Lista da Dex em lotes (renderMaisLista): com o cursor nas últimas linhas,
    // traz o próximo lote antes de mover, senão a seta pra baixo travaria no fim
    // do que já está na tela.
    if (rowSelector.indexOf("#species-list") === 0 && e.key === "ArrowDown") {
      var ativo = document.querySelector("#species-list .species-row.kbd-active");
      var idxAtivo = ativo ? Array.prototype.indexOf.call(rows, ativo) : -1;
      if (idxAtivo >= rows.length - 3 && renderMaisLista()) rows = document.querySelectorAll(rowSelector);
    }
    var curIdx = -1;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].classList.contains("kbd-active")) { curIdx = i; break; }
    }
    if (curIdx !== -1) { rows[curIdx].classList.remove("kbd-active"); rows[curIdx].tabIndex = -1; }
    var nextIdx;
    if (e.key === "ArrowDown") nextIdx = curIdx === -1 ? 0 : Math.min(curIdx + 1, rows.length - 1);
    else nextIdx = curIdx === -1 ? 0 : Math.max(curIdx - 1, 0);
    rows[nextIdx].classList.add("kbd-active");
    rows[nextIdx].tabIndex = 0;
    rows[nextIdx].focus();
    rows[nextIdx].scrollIntoView({ block: "nearest" });
  }

  // ---------------- list rendering ----------------
  var STAT_IDX = { hp: 0, atk: 1, def: 2, spa: 3, spd: 4, spe: 5 };

  function bst(sp) { return sp.b.reduce(function (a, b) { return a + b; }, 0); }

  // Stat bars used to divide by the theoretical byte ceiling (255), which
  // nothing in this dataset gets close to in practice (median base stat is
  // ~78, p95 is ~135 - measured across all 1906 species x 6 stats). Against
  // 255 a genuinely great 130 stat filled barely half the bar and read as
  // mediocre at a glance. 180 makes the top few percent read as "maxed" -
  // the exact number is still printed next to the bar, so nothing is hidden,
  // just anything above 180 (a small handful of species) visually clips.
  // See AUDITORIA-DOSSIE.md UX 2.
  var STAT_BAR_CEILING = 180;
  function statPct(v) { return Math.max(2, Math.min(100, (v / STAT_BAR_CEILING) * 100)); }
  function statTier(v) {
    if (v < 60) return "tier-weak";
    if (v >= 150) return "tier-elite";
    if (v >= 110) return "tier-good";
    return "";
  }

  function getFiltered() {
    var list = SPECIES.filter(function (sp) {
      if (state.query && sp.n.toLowerCase().indexOf(state.query) === -1) return false;
      if (state.typeFilter.size > 0) {
        var names = speciesTypeNames(sp);
        var ok = false;
        state.typeFilter.forEach(function (t) { if (names.indexOf(t) !== -1) ok = true; });
        if (!ok) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      if (state.sort === "name") return a.n.localeCompare(b.n);
      // SS is the highest tier, D the lowest - .score is already the
      // underlying 0-100 percentile the letter comes from, so sorting by it
      // directly (rather than the letter) also orders correctly WITHIN a
      // tier. Species without a rank (shouldn't happen - all 1906 get one)
      // fall to the bottom instead of erroring.
      if (state.sort === "rank") {
        var ra = SPECIES_RANK[a.sname], rb = SPECIES_RANK[b.sname];
        return (rb ? rb.score : -1) - (ra ? ra.score : -1);
      }
      if (state.sort === "bst") return bst(b) - bst(a);
      if (state.sort in STAT_IDX) return b.b[STAT_IDX[state.sort]] - a.b[STAT_IDX[state.sort]];
      return (a.i || 9999) - (b.i || 9999) || a.x - b.x;
    });
    return list;
  }

  // Lista da Dex em LOTES (2026-09-24, achado da auditoria: reconstruir as 1906
  // linhas custava ~30ms por busca/filtro/ordenação, e medido depois que o
  // custo é o NÚMERO de nós - até uma lista mínima de 1906 <li> custa ~18ms;
  // só renderizar menos resolve: ~1,5ms). Renderiza um lote e o resto entra
  // conforme a rolagem chega perto do fim (ou a seta pra baixo chega na
  // última linha) - a lista continua completa, só que sob demanda. Busca e
  // filtro seguem valendo pra lista INTEIRA (getFiltered), não pro que já está
  // na tela.
  var LISTA_LOTE = 150;
  var LISTA_LOTE_ATE_SELECIONADA = 600;
  var listaAtual = [];
  var listaRenderizadas = 0;
  function linhaDaListaHtml(sp, idx, teamFull, hasSelectedRow) {
    var names = speciesTypeNames(sp);
    var pips = names.map(typePip).join("");
    var isSel = state.selected === sp.x;
    var sel = isSel ? " selected" : "";
    var isTabStop = isSel || (!hasSelectedRow && idx === 0);
    var inTeam = state.team.indexOf(sp.x) !== -1;
    // Same three states syncRowAddButtons() maintains: in team / team full (swap) / free slot.
    var addTitle = inTeam ? "Já está no time" : teamFull ? "Trocar por um do time" : "Adicionar ao time";
    var addLabel = inTeam ? "✓" : teamFull ? "⇄" : "+";
    return '<li class="species-row' + sel + '" data-x="' + sp.x + '" role="option" aria-selected="' + isSel + '" tabindex="' + (isTabStop ? "0" : "-1") + '">' +
      '<span class="dexno mono">#' + String(sp.i || 0).padStart(3, "0") + '</span>' +
      spriteImgHtml(sp.x, sp.n, 28) +
      '<span class="sname">' + escapeHtml(sp.n) + '</span>' +
      rankBadgeHtml(sp.sname) +
      '<span class="pips">' + pips + '</span>' +
      '<button class="row-add-btn' + (!inTeam && teamFull ? ' is-swap' : '') + '" data-add="' + sp.x + '" type="button" title="' + addTitle + '" aria-label="' + addTitle + '"' +
        (inTeam ? ' disabled' : '') + '>' + addLabel + '</button></li>';
  }
  // Acrescenta o próximo lote no fim da lista. Devolve true se acrescentou algo.
  function renderMaisLista() {
    if (listaRenderizadas >= listaAtual.length) return false;
    var ul = document.getElementById("species-list");
    var teamFull = state.team.length >= 6;
    var fim = Math.min(listaAtual.length, listaRenderizadas + LISTA_LOTE);
    var html = "";
    for (var i = listaRenderizadas; i < fim; i++) html += linhaDaListaHtml(listaAtual[i], i, teamFull, true);
    ul.insertAdjacentHTML("beforeend", html);
    listaRenderizadas = fim;
    return true;
  }
  function renderList() {
    var list = getFiltered();
    var ul = document.getElementById("species-list");
    listaAtual = list;
    if (list.length === 0) {
      listaRenderizadas = 0;
      ul.innerHTML = '<li class="no-results">Nenhum Pokémon encontrado.</li>';
      return;
    }
    var teamFull = state.team.length >= 6;
    // Accessibility pass, 2026-09-10: role="listbox"/"option" + a roving
    // tabindex (ARIA APG listbox pattern) so this list is reachable with a
    // plain Tab, not only via the "/" + arrow-keys shortcut from Fase 1 -
    // that shortcut moved a CSS class (.kbd-active) around, never real DOM
    // focus, so a screen reader user tabbing through the page skipped the
    // list entirely and had no way to know it was there. Exactly one row is
    // a tab stop at a time (tabindex=0): the selected one, or the first row
    // if nothing is selected yet - everyone else is -1 so Tab doesn't stop
    // 1900+ times. Arrow keys move which row is 0 (see the keydown handler
    // below), matching how a real listbox behaves.
    // A linha aberta continua na tela quando está perto do topo (até
    // LISTA_LOTE_ATE_SELECIONADA); mais longe que isso ela só aparece quando a
    // rolagem chegar lá, e o tab stop fica na primeira linha.
    var selIdx = -1;
    for (var s = 0; s < list.length; s++) { if (list[s].x === state.selected) { selIdx = s; break; } }
    var n = LISTA_LOTE;
    if (selIdx !== -1 && selIdx < LISTA_LOTE_ATE_SELECIONADA) n = Math.max(n, selIdx + 1);
    n = Math.min(n, list.length);
    var hasSelectedRow = selIdx !== -1 && selIdx < n;
    var html = "";
    for (var i = 0; i < n; i++) html += linhaDaListaHtml(list[i], i, teamFull, hasSelectedRow);
    ul.innerHTML = html;
    listaRenderizadas = n;
    preencherListaSeCurta();
  }
  // Se a área visível ainda não está cheia (lista curta na tela, tela muito
  // alta) ou a rolagem chegou perto do fim, acrescenta lotes até sobrar folga.
  function preencherListaSeCurta() {
    var ul = document.getElementById("species-list");
    var guarda = 0;
    while (listaRenderizadas < listaAtual.length && guarda++ < 40 &&
           ul.clientHeight > 0 && ul.scrollHeight - ul.scrollTop - ul.clientHeight < 800) {
      renderMaisLista();
    }
  }
  // Uma escuta só na lista inteira (antes eram 2 por linha, reanexadas a cada render).
  (function () {
    var ul = document.getElementById("species-list");
    ul.addEventListener("click", function (e) {
      var addBtn = e.target.closest(".row-add-btn");
      if (addBtn) {
        var x = parseInt(addBtn.dataset.add, 10);
        if (state.team.indexOf(x) !== -1) return;
        if (state.team.length >= 6) { openSwapModal(x); return; }
        // A ação redesenha contadores, botões "+" e a ficha aberta ao lado.
        if (rosterMove(x, null)) flashToast(getSpeciesByX(x).n + " adicionado ao time (" + state.team.length + "/6)");
        return;
      }
      var row = e.target.closest(".species-row");
      if (row) selectSpecies(parseInt(row.dataset.x, 10));
    });
    ul.addEventListener("scroll", preencherListaSeCurta, { passive: true });
  })();

  // Keeps the Dex list's quick-add buttons truthful after the team changes
  // somewhere else (detail view, box, swap) without re-rendering 1900 rows.
  // With a full team the button turns into a swap affordance rather than going dead.
  function syncRowAddButtons() {
    var teamFull = state.team.length >= 6;
    document.querySelectorAll(".row-add-btn").forEach(function (btn) {
      var x = parseInt(btn.dataset.add, 10);
      var inTeam = state.team.indexOf(x) !== -1;
      btn.textContent = inTeam ? "✓" : teamFull ? "⇄" : "+";
      btn.disabled = inTeam;
      btn.classList.toggle("is-swap", !inTeam && teamFull);
      btn.title = inTeam ? "Já está no time" : teamFull ? "Trocar por um do time" : "Adicionar ao time";
    });
  }

  // ---- Dex -> team swap modal ----
  var swapModalX = null;

  function openSwapModal(x) {
    var sp = getSpeciesByX(x);
    if (!sp) return;
    swapModalX = x;
    document.getElementById("swap-modal-title").textContent = "Colocar " + sp.n + " no time";
    var list = document.getElementById("swap-modal-list");
    list.innerHTML = state.team.map(getSpeciesByX).filter(Boolean).map(function (m) {
      return '<button class="swap-pick" data-out="' + m.x + '" type="button">' +
        spriteImgHtml(m.x, m.n, 30) +
        '<span class="swap-pick-name">' + escapeHtml(m.n) + '</span></button>';
    }).join("");
    // Clique numa opção: ouvinte único em #swap-modal-list (logo abaixo).
    // <dialog> nativo (2026-09-13, refactor de estrutura - Engenheira de
    // Frontend/CSS): showModal() já move o foco pra dentro do diálogo
    // sozinho, mas o alvo padrão do navegador é o próprio <dialog> - ainda
    // mandamos o foco explicitamente pro primeiro swap-pick (ou o botão de
    // fechar, se o time estiver vazio) igual antes, é só a devolução de
    // foco ao fechar e o trap de Tab que o navegador passa a fazer sozinho.
    document.getElementById("swap-modal").showModal();
    var firstPick = list.querySelector(".swap-pick");
    (firstPick || document.getElementById("swap-modal-close")).focus();
  }

  // Troca pelo modal: um ouvinte só na lista (fase 5 da refatoração).
  (function () {
    var list = document.getElementById("swap-modal-list");
    list.addEventListener("click", function (e) {
      var btn = e.target.closest(".swap-pick");
      if (!btn || !list.contains(btn) || swapModalX === null || swapModalX === undefined) return;
      var sp = getSpeciesByX(swapModalX);
      var outX = parseInt(btn.dataset.out, 10);
      var outSp = getSpeciesByX(outX);
      // A ação (rosterMove) redesenha a ficha aberta e a caixa, se visíveis.
      if (!sp || !outSp || !rosterMove(swapModalX, outX)) return;
      closeSwapModal();
      flashToast(sp.n + " entrou; " + outSp.n + " foi para a caixa");
    });
  })();

  function closeSwapModal() {
    document.getElementById("swap-modal").close();
  }

  document.getElementById("swap-modal-close").addEventListener("click", closeSwapModal);
  document.getElementById("swap-modal").addEventListener("click", function (e) {
    if (e.target.id === "swap-modal") closeSwapModal();
  });
  // showModal()/close() já cuidam de: Escape fecha sozinho (dispara
  // "cancel" + "close"), Tab só cicla dentro do diálogo, e o foco volta
  // sozinho pra quem abriu - nenhum desses 3 precisa mais de código próprio
  // (antes eram 2 listeners globais de keydown + rastrear swapModalTrigger
  // à mão). Verificado ao vivo: fechar pelo X e pelo clique fora (backdrop)
  // - o Escape em si é garantia nativa da spec de <dialog>/showModal(),
  // mas não deu pra confirmar ao vivo NESTA sessão porque a ferramenta de
  // automação usada aqui não aciona a ação padrão do navegador pra Escape
  // num <dialog> (confirmado que o evento chega na página de verdade - o
  // Escape do dropdown "Mais", que usa um keydown listener normal, fechou
  // certinho com a mesma tecla - o que não disparou foi especificamente o
  // comportamento interno do navegador pro <dialog>, limitação conhecida
  // de automação via CDP, não um bug daqui). Só falta zerar o estado da
  // própria aplicação, que não é algo que o navegador saberia fazer - reage
  // ao evento "close" pra cobrir TODO jeito de fechar (botão, clique fora,
  // Escape), não só um deles.
  document.getElementById("swap-modal").addEventListener("close", function () {
    swapModalX = null;
  });

  // Substitui window.confirm() nativo (achado da auditoria, 2026-09-18 -
  // ver comentário no <dialog id="confirm-modal"> sobre o motivo). Genérico
  // pra qualquer confirmação destrutiva futura: openConfirmModal(titulo,
  // mensagem, texto do botão de confirmar, callback executado só se
  // confirmar). Foco inicial vai pro Cancelar de propósito (não pro botão
  // de confirmar) - numa ação destrutiva, um Enter querendo só fechar o
  // diálogo não pode virar uma confirmação sem querer.
  var confirmModalCallback = null;
  function openConfirmModal(title, message, confirmLabel, onConfirm) {
    document.getElementById("confirm-modal-title").textContent = title;
    document.getElementById("confirm-modal-message").textContent = message;
    document.getElementById("confirm-modal-ok").textContent = confirmLabel;
    confirmModalCallback = onConfirm;
    document.getElementById("confirm-modal").showModal();
    document.getElementById("confirm-modal-cancel").focus();
  }
  function closeConfirmModal() {
    document.getElementById("confirm-modal").close();
  }
  document.getElementById("confirm-modal-close").addEventListener("click", closeConfirmModal);
  document.getElementById("confirm-modal-cancel").addEventListener("click", closeConfirmModal);
  document.getElementById("confirm-modal").addEventListener("click", function (e) {
    if (e.target.id === "confirm-modal") closeConfirmModal();
  });
  document.getElementById("confirm-modal-ok").addEventListener("click", function () {
    var cb = confirmModalCallback;
    closeConfirmModal();
    if (cb) cb();
  });
  document.getElementById("confirm-modal").addEventListener("close", function () {
    confirmModalCallback = null;
  });

  var toastTimer = null;
  function flashToast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    if (toastTimer) clearTimeout(toastTimer);
    // If a toast is already showing (fast successive actions - e.g. adding
    // several Pokemon in a row), just swapping the text with .show already
    // applied doesn't retrigger the opacity/transform transition, so the
    // confirmation for the second action can go unnoticed. Dropping the
    // class, forcing a reflow, then re-adding it restarts the transition
    // every time. See AUDITORIA-DOSSIE.md UX 5.
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }
