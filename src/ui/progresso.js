  // ===== src/ui/progresso.js =====
  // Aba Progresso: dificuldade, level cap, insígnia, modo de Mega, confirmação da run e acessibilidade.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui progresso.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- progress / settings view ----------------
  var progressInited = false;
  function renderRunStatus() {
    var el = document.getElementById("settings-run-status");
    if (!el) return;
    var d = state.settings.runConfirmedAt ? new Date(state.settings.runConfirmedAt) : null;
    el.textContent = d && !isNaN(d.getTime())
      ? "Confirmado em " + d.toLocaleDateString("pt-BR") + ". Mudou algo no jogo? Ajuste e confirme de novo."
      : "Ainda não confirmado.";
  }
  function renderCapBadge() {
    var cap = getCurrentCap();
    document.getElementById("cap-badge").textContent = cap === null ? "s/ limite" : "Lv " + cap;
  }
  function renderCapDisplay() {
    var cap = getCurrentCap();
    document.getElementById("cap-display").textContent = cap === null ? "Sem limite" : "Nível " + cap;
    if (LEVELCAPS) document.getElementById("settings-note").textContent = LEVELCAPS.note;
  }
  // Trilha visual da jornada (redesign 2026-09-18) - lê LEVELCAPS e
  // state.settings.milestone. Desde 2026-09-24 cada etapa é clicável, mas o
  // clique só escolhe o valor no #settings-milestone - quem grava continua
  // sendo o ouvinte dele (um caminho só pra mudar o badge).
  function renderProgressTrail() {
    var el = document.getElementById("progress-trail");
    if (!el || !LEVELCAPS || !Array.isArray(LEVELCAPS.rows) || !LEVELCAPS.rows.length) return;
    var current = state.settings.milestone;
    var last = LEVELCAPS.rows.length - 1;
    var nodes = LEVELCAPS.rows.map(function (r, idx) {
      var st = idx < current ? "done" : idx === current ? "active" : "locked";
      var dotContent = idx < current ? "&check;" : String(idx);
      // Cada etapa é um botão (2026-09-24, pedido do usuário: marcar a
      // insígnia levava 3 cliques na lista). O clique usa o mesmo caminho do
      // <select> #settings-milestone (ouvinte logo abaixo).
      return '<button type="button" class="trail-node" data-marco="' + idx + '"' +
        (idx === current ? ' aria-current="step"' : "") +
        ' aria-label="' + escapeHtml(r.milestone) + (idx === current ? " (atual)" : " - marcar como último badge") + '">' +
        '<span class="trail-dot ' + st + '">' + dotContent + '</span>' +
        '<span class="trail-label' + (idx === current ? " active" : "") + '">' + escapeHtml(r.milestone) + '</span>' +
        '</button>';
    }).join("");
    var pct = last > 0 ? Math.max(0, Math.min(100, (current / last) * 100)) : 0;
    el.innerHTML = '<div class="trail-track">' +
      '<div class="trail-line-bg"></div>' +
      '<div class="trail-line-fill" style="width: ' + pct + '%;"></div>' +
      nodes +
      '</div>';
    // Linhas medidas em pixels reais (2026-09-24): em % da largura visível a
    // linha verde passava da etapa atual no computador e parava antes dela
    // quando a trilha rolava; a tracejada não cobria a parte rolada.
    var trilha = el.querySelector(".trail-track");
    var atual = el.querySelector('.trail-node[aria-current]');
    // Aba escondida não tem medida (tudo 0): fica o valor aproximado em %, e a
    // aba redesenha a trilha ao abrir (abas.js).
    if (!trilha || !trilha.clientWidth) return;
    var fundo = trilha.querySelector(".trail-line-bg");
    var cheia = trilha.querySelector(".trail-line-fill");
    var ultimo = trilha.querySelector(".trail-node:last-of-type");
    if (fundo && ultimo) { fundo.style.right = "auto"; fundo.style.width = Math.max(0, ultimo.offsetLeft + ultimo.offsetWidth / 2 - 4) + "px"; }
    if (cheia) cheia.style.width = atual ? Math.max(0, atual.offsetLeft + atual.offsetWidth / 2 - 4) + "px" : "0";
    // Em tela estreita a trilha rola de lado: centraliza a etapa atual (antes
    // ela ficava cortada na borda).
    if (atual && trilha.scrollWidth > trilha.clientWidth) {
      trilha.scrollLeft = Math.max(0, atual.offsetLeft - trilha.clientWidth / 2 + atual.offsetWidth / 2);
    }
  }
  // Clique numa etapa da trilha = escolher esse badge no <select> (a mesma
  // ação, com a mesma gravação, log e redesenho de quando se usa a lista).
  (function () {
    var trilha = document.getElementById("progress-trail");
    if (!trilha) return;
    trilha.addEventListener("click", function (e) {
      var no = e.target.closest(".trail-node[data-marco]");
      var sel = document.getElementById("settings-milestone");
      if (!no || !sel || String(state.settings.milestone) === no.dataset.marco) return;
      sel.value = no.dataset.marco;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    });
  })();

  // "Novidades" - Fase 1 quality-of-life item, 2026-09-09: the user asked
  // to see what changed without having to ask. Static, hand-authored list
  // (data/changelog.json) - no attempt to auto-generate from git log, which
  // would just dump dev-facing commit messages instead of player-facing
  // summaries.
  function renderChangelog() {
    var out = document.getElementById("changelog-list");
    if (!out) return;
    if (!CHANGELOG.length) { out.innerHTML = '<p class="hint">Nada por aqui ainda.</p>'; return; }
    out.innerHTML = CHANGELOG.map(function (entry) {
      var items = (entry.items || []).map(function (line) {
        return "<li>" + escapeHtml(line) + "</li>";
      }).join("");
      return '<div class="changelog-entry"><div class="changelog-date mono">' + escapeHtml(entry.date) + '</div>' +
        '<ul class="changelog-items">' + items + '</ul></div>';
    }).join("");
  }

  function initProgress() {
    if (progressInited) { renderCapDisplay(); renderChangelog(); renderProgressTrail(); return; }
    progressInited = true;
    renderChangelog();
    var diffSel = document.getElementById("settings-difficulty");
    diffSel.value = state.settings.difficulty;
    var capSel = document.getElementById("settings-level-cap");
    capSel.value = levelCapMode();
    var msSel = document.getElementById("settings-milestone");
    if (LEVELCAPS) {
      msSel.innerHTML = LEVELCAPS.rows.map(function (r, idx) {
        return '<option value="' + idx + '">' + escapeHtml(r.milestone) + '</option>';
      }).join("");
    }
    msSel.value = String(state.settings.milestone);
    renderProgressTrail();
    // Auto-evolução por level cap, 2026-09-10: dispara na hora, junto com a
    // mudança que acabou de alterar o cap - exatamente o que o usuário pediu
    // ("na hora, ao mudar o level cap"), não só no próximo save manual.
    // Mudança de level cap (marco ou modo): uma ação só - a configuração, a
    // auto-evolução que o cap novo libera, as trocas do plano de golpes e o
    // registro no log gravam juntos e redesenham tudo que depende do cap
    // (time, caixa, ficha aberta, confronto, progresso). Antes eram 2
    // gravações e 9 redesenhos chamados à mão.
    function afterCapChange(mudar) {
      acao(TELAS_ELENCO.concat(["ficha", "progresso", "log", "builds"]), function () {
        mudar();
        autoEvolveRoster(true);
        registrarTrocasDoPlano(capRegistrado, getCurrentCap());
        capRegistrado = getCurrentCap();
        // "Meu build" fica linkado ao level cap (pedido do usuário): derruba a
        // flag de valor manual, e a ficha aberta é redesenhada pela ação.
        myBuildLevelIsCustom = false;
      });
    }
    // Dificuldade só escolhe a variante dos chefões - não mexe no cap, então
    // não dispara auto-evolução nem destrava golpes.
    diffSel.addEventListener("change", function () {
      // Chefão já aberto passa pra variante da dificuldade nova (levantamento de
      // 2026-09-24: só mudava ao reabrir o chefão). Mesma escolha de variante de
      // selectBoss(), sem mexer na navegação (no celular o jogador pode estar na
      // lista, com o chefão ainda marcado).
      // O rank muda com a dificuldade (rank v2: time party em Fácil/Ace, insane em Elite).
      acao(["resumo", "chefao", "lista", "ficha", "time"], function () {
        state.settings.difficulty = diffSel.value;
        var bossAberto = bossState.selected !== null ? BOSSES[bossState.selected] : null;
        if (bossAberto) bossState.diff = varianteDoChefao(bossAberto);
      });
    });
    capSel.addEventListener("change", function () {
      afterCapChange(function () {
        state.settings.levelCapMode = LEVEL_CAP_MODES.indexOf(capSel.value) !== -1 ? capSel.value : "more";
      });
    });
    msSel.addEventListener("change", function () {
      // Registro automático da luta vencida (fase 5, 2026-09-24): avançar de
      // insígnia é o único sinal que o app tem de que a luta anterior foi
      // vencida (derrota não deixa rastro nenhum) - então anota, sem
      // perguntar nada, o que o quadro de confronto via ANTES dessa luta com o
      // time que o jogador tinha. Sem clique e sem dado novo persistido: vai
      // pro log "O que o app fez sozinho", que já existe.
      var milestoneAntes = state.settings.milestone;
      var lutaAnterior = getRemainingBossEntries()[0];
      var cxAntes = lutaAnterior ? confrontoParaParty(bossPartyPorDificuldade(lutaAnterior), false) : null;
      afterCapChange(function () {
        state.settings.milestone = parseInt(msSel.value, 10);
        if (cxAntes && state.settings.milestone > milestoneAntes) {
          logAutoAction("Você avançou de insígnia, então assumi que venceu " + lutaAnterior.name + ". Antes da luta o quadro de confronto via " +
            cxAntes.c.buracos.length + " Pokémon dele sem resposta super efetiva e " + cxAntes.c.ameacas.length + " ameaçando metade ou mais do seu time.");
        }
      });
    });
    var megaSel = document.getElementById("settings-mega-mode");
    megaSel.value = megaMode();
    megaSel.addEventListener("change", function () {
      acao(["time", "resumo", "ficha", "chefao", "builds"], function () {
        state.settings.megaMode = megaSel.value === "permanente" ? "permanente" : "temporaria";
      });
      flashToast("Mega Evolução: modo " + (megaMode() === "permanente" ? "permanente" : "temporário"));
    });
    renderCapDisplay();
    renderAutoLog();

    var runBtn = document.getElementById("settings-run-confirm");
    renderRunStatus();
    runBtn.addEventListener("click", function () {
      acao(["progresso"], function () { state.settings.runConfirmedAt = new Date().toISOString(); });
      document.getElementById("run-setup-banner").hidden = true;
      flashToast("Configuração da run confirmada");
    });

    // Acessibilidade (checklist eMAG, 2026-09-13) - reflete o que já foi
    // aplicado no boot (applyA11yPrefs, ver perto de loadSave()) nos
    // próprios controles, e salva/reaplica a cada mudança.
    var a11yPrefs = loadA11yPrefs();
    var hcCheckbox = document.getElementById("settings-high-contrast");
    var fontSelect = document.getElementById("settings-font-scale");
    hcCheckbox.checked = !!a11yPrefs.highContrast;
    fontSelect.value = String(a11yPrefs.fontScale || 1);
    hcCheckbox.addEventListener("change", function () {
      a11yPrefs.highContrast = hcCheckbox.checked;
      saveA11yPrefs(a11yPrefs);
    });
    fontSelect.addEventListener("change", function () {
      a11yPrefs.fontScale = parseFloat(fontSelect.value);
      saveA11yPrefs(a11yPrefs);
    });
  }
