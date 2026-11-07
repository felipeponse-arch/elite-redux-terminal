  // Faixa de Etapa no cabeçalho (fatia 1 do visual "Carteira de Treinador", 07/11/2026).
  // Etapa = state.settings.milestone (linhas de LEVELCAPS: 0 início, 1 a 8 insígnias, 9 Campeão).
  // Tocar numa insígnia usa o MESMO caminho da trilha de Progresso: grava no <select> #settings-milestone
  // e dispara "change" (quem grava, registra e redesenha é o ouvinte dele). Nenhuma regra nova.
  // Silhuetas próprias (sem arte oficial); a cor vem do tipo do ginásio (classe .tipo-X, cartao.css).
  var INSIGNIAS_FORMAS = [
    // 1 Stone (Rock): escudo facetado
    '<path d="M16 2 L28 9 L26 24 L16 30 L6 24 L4 9 Z"/>',
    // 2 Knuckle (Fighting): placa com quatro nós de punho
    '<rect x="5" y="12" width="22" height="16" rx="4"/><circle cx="8.5" cy="10.5" r="3.6"/><circle cx="14" cy="9" r="3.6"/><circle cx="19.5" cy="9" r="3.6"/><circle cx="24" cy="10.5" r="3.2"/>',
    // 3 Dynamo (Electric): losango
    '<path d="M16 2 L30 16 L16 30 L2 16 Z"/>',
    // 4 Heat (Fire): chama
    '<path d="M16 2 C18 9 27 12 27 20 C27 26 22 30 16 30 C10 30 5 26 5 20 C5 15 9 13 10 8 C12 10 13 12 14 13 C15 9 15 5 16 2 Z"/>',
    // 5 Balance (Normal): disco
    '<circle cx="16" cy="16" r="13"/>',
    // 6 Feather (Flying): pena
    '<path d="M27 3 C14 4 6 12 5 27 L7 28 C8 24 10 22 13 21 C22 20 27 13 27 3 Z"/>',
    // 7 Mind (Psychic): olho
    '<path d="M2 16 C8 6 24 6 30 16 C24 26 8 26 2 16 Z"/>',
    // 8 Rain (Water): gota
    '<path d="M16 2 C16 2 6 14 6 20 C6 26 10.5 30 16 30 C21.5 30 26 26 26 20 C26 14 16 2 16 2 Z"/>',
    // 9 Campeão: estrela
    '<path d="M16 2 L19.6 11.6 L30 12 L21.8 18.3 L24.7 28.5 L16 22.6 L7.3 28.5 L10.2 18.3 L2 12 L12.4 11.6 Z"/>'
  ];
  // Detalhe em baixo-relevo (escuro) de cada silhueta.
  var INSIGNIAS_FUROS = [
    '<path d="M16 2 L16 30 M4 9 L16 16 L28 9" fill="none" stroke="currentColor" stroke-width="1.2"/>',
    '', '<path d="M18 6 L10 17 H15 L13 26 L22 14 H17 Z"/>',
    '<path d="M16 14 C17 18 21 19 21 23 C21 26 18.5 27.5 16 27.5 C13.5 27.5 11 26 11 23 C11 20 14 19 16 14 Z"/>',
    '<path d="M16 3 A13 13 0 0 1 16 29 A6.5 6.5 0 0 1 16 16 A6.5 6.5 0 0 0 16 3 Z"/>',
    '<path d="M7 27 C10 18 16 11 25 6" fill="none" stroke="currentColor" stroke-width="1.2"/>',
    '<circle cx="16" cy="16" r="5"/>', '<path d="M11 21 C11 18 13 16 14 14" fill="none" stroke="currentColor" stroke-width="1.4"/>', ''
  ];
  var INSIGNIAS_TIPOS = ["Rock", "Fighting", "Electric", "Fire", "Normal", "Flying", "Psychic", "Water", "Dragon"];
  var insigniaParaEncaixar = null;

  function insigniaSvgHtml(i) {
    return '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><g class="b-corpo">' + INSIGNIAS_FORMAS[i] + '</g>' +
      '<g class="b-metal">' + INSIGNIAS_FORMAS[i] + '</g><g class="b-furo">' + INSIGNIAS_FUROS[i] + '</g></svg>';
  }
  function etapaNomeCurto(nome) {
    var m = /^(\S+) Badge/.exec(nome);
    return m ? m[1] : /^Sem Badge/.test(nome) ? "Início" : "Campeão";
  }
  function etapaPara(idx) {
    if (typeof initProgress === "function" && !progressInited) initProgress();
    var sel = document.getElementById("settings-milestone");
    if (!sel || String(state.settings.milestone) === String(idx)) return;
    insigniaParaEncaixar = idx;
    sel.value = String(idx);
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function renderFaixaEtapa() {
    var el = document.getElementById("faixa-etapa");
    if (!el || !LEVELCAPS || !Array.isArray(LEVELCAPS.rows) || !LEVELCAPS.rows.length) return;
    var rows = LEVELCAPS.rows, atual = state.settings.milestone, ultimo = rows.length - 1;
    var cap = getCurrentCap();
    var capTxt = cap === null ? "Sem limite" : "Nv " + cap;
    var nomeCompleto = rows[atual] ? rows[atual].milestone : "";
    var botoes = rows.slice(1).map(function (r, k) {
      var idx = k + 1, acesa = idx <= atual, proxima = idx === atual + 1;
      var forma = Math.min(idx, INSIGNIAS_FORMAS.length) - 1;
      return '<button type="button" class="ins-btn tipo-' + INSIGNIAS_TIPOS[forma] + (acesa ? " on" : "") + (proxima ? " proxima" : "") +
        (idx === insigniaParaEncaixar ? " encaixa" : "") + '" data-etapa="' + idx + '"' + (idx === atual ? ' aria-current="step"' : "") +
        ' title="' + escapeHtml(r.milestone) + '" aria-label="' + escapeHtml(r.milestone) + (idx === atual ? " (atual)" : " - definir como Etapa") + '">' +
        insigniaSvgHtml(forma) + '</button>';
    }).join("");
    insigniaParaEncaixar = null;
    var pontos = rows.map(function (r, i) { return '<i' + (i <= atual ? ' class="on"' : "") + '></i>'; }).join("");
    el.innerHTML =
      '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="ins-metal" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs></svg>' +
      '<div class="faixa-insignias" role="group" aria-label="Insígnias da run">' + botoes + '</div>' +
      '<div class="etapa-info"><span class="etapa-nome">' + escapeHtml(nomeCompleto) + '</span><span class="etapa-cap">Level cap ' + capTxt + '</span></div>' +
      '<div class="etapa-compacta"><button type="button" class="etapa-passo" data-passo="-1" aria-label="Etapa anterior"' + (atual <= 0 ? " disabled" : "") + '>&lsaquo;</button>' +
        '<div class="etapa-info"><span class="etapa-nome">' + escapeHtml(etapaNomeCurto(nomeCompleto)) + ' &middot; Etapa ' + atual + '/' + (ultimo - 1) + '</span><span class="etapa-cap">' + capTxt + '</span><span class="etapa-pontos" aria-hidden="true">' + pontos + '</span></div>' +
        '<button type="button" class="etapa-passo" data-passo="1" aria-label="Próxima Etapa"' + (atual >= ultimo ? " disabled" : "") + '>&rsaquo;</button></div>';
  }
  (function () {
    var el = document.getElementById("faixa-etapa");
    if (!el) return;
    el.addEventListener("click", function (e) {
      var b = e.target.closest(".ins-btn[data-etapa]");
      if (b) { etapaPara(parseInt(b.dataset.etapa, 10)); return; }
      var p = e.target.closest(".etapa-passo[data-passo]");
      if (p) etapaPara(Math.max(0, Math.min(LEVELCAPS.rows.length - 1, state.settings.milestone + parseInt(p.dataset.passo, 10))));
    });
  })();
