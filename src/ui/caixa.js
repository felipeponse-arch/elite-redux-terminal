  // ===== src/ui/caixa.js =====
  // Aba Caixa (PC Box): grade por páginas, busca e ações de cada Pokémon da caixa.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.ps1 (marcador @ui caixa.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // PC Box - Fase 2 do roadmap de estratégia (2026-09-11/12, redesenho pedido
  // pelo usuário com print de referência do jogo real). 30 slots por caixa
  // (grade 6x5, casa com o print) - membros da caixa são fatiados em páginas
  // fixas por posição no array (não há "slot salvo" persistente por espécie,
  // só ordem de captura), navegação com setas + salto direto por busca.
  var PCBOX_SIZE = 30;
  var pcBoxPage = 0;
  var pcBoxSelectedX = null;

  function renderBox() {
    var content = document.getElementById("pcbox-content");
    var members = state.box.map(getSpeciesByX).filter(Boolean);
    if (!members.length) {
      content.innerHTML = '<p class="pcbox-empty-note">Caixa vazia — abra um Pokémon na aba Dex e clique em "+ Adicionar à caixa".</p>';
      return;
    }

    var totalPages = Math.max(1, Math.ceil(members.length / PCBOX_SIZE));
    if (pcBoxPage >= totalPages) pcBoxPage = totalPages - 1;
    if (pcBoxPage < 0) pcBoxPage = 0;
    // A espécie selecionada pode ter saído da caixa (removida/mandada pro
    // time) desde a última renderização - solta a seleção em vez de apontar
    // pra um x que não está mais lá.
    if (pcBoxSelectedX !== null && state.box.indexOf(pcBoxSelectedX) === -1) pcBoxSelectedX = null;

    var startIdx = pcBoxPage * PCBOX_SIZE;
    var slotsHtml = "";
    for (var i = 0; i < PCBOX_SIZE; i++) {
      var sp = members[startIdx + i];
      if (sp) {
        var selected = sp.x === pcBoxSelectedX;
        slotsHtml += '<button class="pcbox-slot' + (selected ? ' selected' : '') + '" data-x="' + sp.x + '" type="button" title="' + escapeHtml(sp.n) + '">' +
          spriteImgHtml(sp.x, sp.n, 40) + '</button>';
      } else {
        slotsHtml += '<div class="pcbox-slot empty" aria-hidden="true"></div>';
      }
    }

    // Mesma regra de sempre: o time cheio nunca desabilita a ação, só troca
    // de "mandar" pra "trocar" (ver AUDITORIA-DOSSIE.md UX 1).
    var teamFull = state.team.length >= 6;
    var title = teamFull ? "Trocar por um do time" : "Mandar para o time";
    var selectedSp = pcBoxSelectedX !== null ? getSpeciesByX(pcBoxSelectedX) : null;
    var detailHtml;
    if (selectedSp) {
      var names = speciesTypeNames(selectedSp);
      var fitNote = boxFitNote(selectedSp, state.team.map(getSpeciesByX).filter(Boolean));
      var abiNames = uniqueIds(selectedSp.ab).map(function (id) { return ABILITIES[id][0]; }).join(", ");
      var innNames = selectedSp.inn.map(function (id) { return ABILITIES[id][0]; }).join(", ");
      var usageHtml = roleTagsHtml(selectedSp.sname);
      detailHtml = '<div class="pcbox-detail">' +
        '<div class="pcbox-detail-top">' +
          '<span class="pcbox-detail-sprite goto-species" tabindex="0" role="button" data-x="' + selectedSp.x + '" title="Ver na Dex">' + spriteImgHtml(selectedSp.x, selectedSp.n, 44) + '</span>' +
          '<div class="pcbox-detail-identity">' +
            '<div class="pcbox-detail-name-row">' +
              '<span class="pcbox-detail-name goto-species" tabindex="0" role="button" data-x="' + selectedSp.x + '" title="Ver na Dex">' + escapeHtml(selectedSp.n) + '</span>' +
              rankBadgeHtml(selectedSp.sname) + megaLockedTagHtml(selectedSp) +
            '</div>' +
            '<div class="pcbox-detail-types">' + names.map(typePip).join("") + '</div>' +
          '</div>' +
          '<span class="pcbox-detail-actions">' +
            '<button class="box-to-team' + (teamFull ? ' is-swap' : '') + '" data-x="' + selectedSp.x + '" type="button" title="' + title + '" aria-label="' + title + '">' +
              (teamFull ? '&hArr;&nbsp;trocar' : '&rarr;&nbsp;time') + '</button>' +
            '<button class="remove-btn" data-x="' + selectedSp.x + '" title="remover da caixa">&times;</button>' +
          '</span>' +
        '</div>' +
        '<div class="pcbox-detail-abis"><b>Hab.:</b> ' + escapeHtml(abiNames) + '<br><b>Innate:</b> ' + escapeHtml(innNames) + '</div>' +
        (usageHtml ? '<div class="pcbox-detail-usage"><span class="pcbox-detail-usage-label">Análise de uso</span>' + usageHtml + '</div>' : "") +
        (fitNote ? '<span class="pcbox-fit-note">' + fitNote + '</span>' : '') +
        '</div>';
    } else {
      detailHtml = '<p class="pcbox-empty-note">Clique num Pokémon da grade pra ver detalhes e ações.</p>';
    }

    content.innerHTML =
      '<div class="pcbox-nav">' +
        '<button class="pcbox-arrow" id="pcbox-prev" type="button" aria-label="Caixa anterior"' + (pcBoxPage === 0 ? ' disabled' : '') + '>&larr;</button>' +
        '<div class="pcbox-title">Box ' + (pcBoxPage + 1) + '<small>' + members.length + ' na caixa &middot; ' + totalPages + ' caixa' + (totalPages === 1 ? '' : 's') + '</small></div>' +
        '<button class="pcbox-arrow" id="pcbox-next" type="button" aria-label="Próxima caixa"' + (pcBoxPage === totalPages - 1 ? ' disabled' : '') + '>&rarr;</button>' +
      '</div>' +
      '<div class="pcbox-grid">' + slotsHtml + '</div>' +
      detailHtml;

    // Cliques: ouvinte único em #pcbox-content (logo abaixo).
  }

  // Um ouvinte só pra caixa inteira (fase 5 da refatoração, 2026-09-24): setas,
  // os 30 slots e os botões do detalhe eram religados a cada redesenho.
  (function () {
    var content = document.getElementById("pcbox-content");
    content.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn || !content.contains(btn)) return;
      var x = parseInt(btn.dataset.x, 10);
      if (btn.id === "pcbox-prev") { pcBoxPage--; renderBox(); }
      else if (btn.id === "pcbox-next") { pcBoxPage++; renderBox(); }
      else if (btn.classList.contains("pcbox-slot") && !btn.classList.contains("empty")) {
        pcBoxSelectedX = (pcBoxSelectedX === x) ? null : x; // estado de tela, nada a gravar
        renderBox();
      } else if (btn.classList.contains("remove-btn") && btn.closest(".pcbox-detail")) {
        var sp = getSpeciesByX(x);
        // Achado GRAVE na auditoria de 2026-09-18: ao contrário do "remover"
        // do Time (que banca pra caixa, nada se perde), este "×" tira o
        // Pokémon da caixa de vez - não vai pro time, não sobra em lugar
        // nenhum. É um ícone pequeno, do lado de um botão grande de "→
        // time", plausível de clique errado achando que só fecha o painel
        // de detalhes. Mesma classe de risco do bug do "Novo jogo" (perda
        // de dado sem aviso), só que de um único Pokémon por clique em vez
        // do time inteiro - por isso ganha a mesma confirmação.
        openConfirmModal(
          "Remover " + (sp ? sp.n : "Pokémon") + " da caixa?",
          "Isso tira " + (sp ? sp.n : "este Pokémon") + " da sua caixa de vez - ele não vai pro time, não fica guardado em lugar nenhum, e não dá pra desfazer.",
          "Remover",
          function () {
            acao(telasDeElenco(x), function () {
              state.box = state.box.filter(function (v) { return v !== x; });
              pcBoxSelectedX = null;
            });
            flashToast((sp ? sp.n : "Pokémon") + " removido da caixa.");
          }
        );
      } else if (btn.classList.contains("box-to-team") && btn.closest(".pcbox-detail")) {
        if (state.team.length >= 6) { openSwapModal(x); return; }
        var spTime = getSpeciesByX(x);
        // Lote: a seleção da caixa é limpa antes do redesenho da própria ação.
        var foi = acao([], function () {
          var ok = rosterMove(x, null);
          if (ok) pcBoxSelectedX = null;
          return ok;
        });
        if (foi) flashToast(spTime.n + " foi para o time (" + state.team.length + "/6)");
      }
    });
  })();

  // Busca da PC Box: salta pra caixa+slot certos e seleciona, em vez de
  // filtrar a grade (a grade representa POSIÇÃO real, filtrar quebraria a
  // metáfora de "caixa numerada" que o pedido original era reproduzir).
  // Campo fica fora do innerHTML que renderBox() reconstrói (ver comentário
  // no HTML) - só troca o listener de teardown-safe, escutado uma vez aqui.
  document.getElementById("pcbox-search").addEventListener("input", function (e) {
    var q = e.target.value.trim().toLowerCase();
    if (!q) return;
    var members = state.box.map(getSpeciesByX).filter(Boolean);
    var foundIdx = -1;
    for (var i = 0; i < members.length; i++) {
      if (members[i].n.toLowerCase().indexOf(q) !== -1) { foundIdx = i; break; }
    }
    if (foundIdx !== -1) {
      pcBoxPage = Math.floor(foundIdx / PCBOX_SIZE);
      pcBoxSelectedX = members[foundIdx].x;
      renderBox();
    }
  });

  function settingsSummaryText() {
    var cap = getCurrentCap();
    var milestone = LEVELCAPS && LEVELCAPS.rows[state.settings.milestone] ? LEVELCAPS.rows[state.settings.milestone].milestone : "?";
    var diffLabel = { easy: "Easy", ace: "Ace", elite: "Elite" }[state.settings.difficulty] || state.settings.difficulty;
    var capLabel = { easy: "Easy", more: "More", elite: "Elite" }[levelCapMode()];
    return "Dificuldade " + diffLabel + ", Level Cap " + capLabel + ", progresso " + milestone + ", level cap atual " + (cap === null ? "sem limite" : cap) + ".";
  }
