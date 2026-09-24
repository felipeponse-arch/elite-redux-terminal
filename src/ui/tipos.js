  // ===== src/ui/tipos.js =====
  // Aba Tipos: tabela de efetividade, velocidades e compêndio de papéis.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui tipos.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- types view ----------------
  var typeMatrixRendered = false;
  function renderTypeMatrix() {
    if (typeMatrixRendered) return;
    typeMatrixRendered = true;
    var head = '<tr><th></th>' + USABLE_TYPES.map(function (t) { return '<th>' + typePill(t, true) + '</th>'; }).join("") + '</tr>';
    var rows = USABLE_TYPES.map(function (atk) {
      var cells = USABLE_TYPES.map(function (def) {
        var m = typeMultiplier(atk, [def]);
        var cls = m === 2 ? "mult-2" : m === 0.5 ? "mult-05" : m === 0 ? "mult-0" : "";
        var label = m === 1 ? "&middot;" : m === 0 ? "0" : m === 0.5 ? "&frac12;" : "2&times;";
        return '<td class="' + cls + '">' + label + '</td>';
      }).join("");
      return '<tr><th>' + typePill(atk, true) + '</th>' + cells + '</tr>';
    }).join("");
    document.getElementById("type-matrix").innerHTML = '<thead>' + head + '</thead><tbody>' + rows + '</tbody>';

    if (LEVELCAPS) {
      document.getElementById("levelcap-note").textContent = LEVELCAPS.note + " Fonte: " + LEVELCAPS.source;
      var lcHead = '<tr><th class="rowhead">Marco</th><th>Easy</th><th>More</th><th>Elite</th></tr>';
      var lcRows = LEVELCAPS.rows.map(function (r) {
        var fmt = function (v) { return v === null ? "—" : v; };
        return '<tr><td class="rowhead">' + escapeHtml(r.milestone) + '</td><td class="mono">' + fmt(r.easy) + '</td><td class="mono">' + fmt(r.more) + '</td><td class="mono">' + fmt(r.elite) + '</td></tr>';
      }).join("");
      document.getElementById("levelcap-table").innerHTML = '<thead>' + lcHead + '</thead><tbody>' + lcRows + '</tbody>';
    }
    renderRoleCompendium();
  }

  function renderSpeedTiers() {
    var query = document.getElementById("speedtier-search").value;
    var result = computeSpeedTiers(query);
    // Destaque de arquétipo (achado em auditoria, 2026-09-18, item 18) -
    // mesmo tratamento do Glossário de Papéis logo abaixo: sinaliza quem é
    // do tipo Monotype ativo, nunca filtra (a tabela inteira continua
    // visível/útil fora de uma run Monotype).
    var monotype = state.archetype.monotype || "";
    document.getElementById("speedtier-note").textContent =
      "Velocidade calculada no seu level cap atual (" + result.level + "), IVs 31. \"Investido\" = 252 EV + natureza " +
      SPEEDTIER_NATURE + " (mesmo +10% de qualquer natureza +Velocidade). \"+ Choice Scarf\" empilha 1.5x em cima do investido, quando o item existe neste hack." +
      (monotype ? " Linhas destacadas: compatíveis com sua run Monotype " + monotype + "." : "");
    var body = result.rows.map(function (r, idx) {
      var combina = !!monotype && speciesTypeNames(r.sp).indexOf(monotype) !== -1;
      return '<tr' + (combina ? ' class="speedtier-row-match"' : '') + '>' +
        '<td class="rowhead"><span class="speedtier-name-cell"><span class="speedtier-rank mono">' + (idx + 1) + '</span>' + spriteImgHtml(r.sp.x, r.sp.n, 24) +
          '<span class="goto-species" tabindex="0" role="button" data-x="' + r.sp.x + '">' + escapeHtml(r.sp.n) + '</span></span></td>' +
        '<td class="mono">' + r.base + '</td>' +
        '<td class="mono">' + r.neutral + '</td>' +
        '<td class="mono speedtier-invested">' + r.invested + '</td>' +
        '<td class="mono">' + r.scarf + '</td>' +
      '</tr>';
    }).join("");
    document.getElementById("speedtier-table").innerHTML =
      '<thead><tr><th class="rowhead">Pokémon</th><th>Base</th><th>Neutro</th><th>Investido</th><th>+ Choice Scarf</th></tr></thead><tbody>' + body + '</tbody>';
    document.getElementById("speedtier-empty").hidden = result.rows.length > 0;
  }
  var speedTierWired = false;
  function wireSpeedTiersOnce() {
    if (speedTierWired) return;
    speedTierWired = true;
    // debounce (mesmo padrão e mesmo valor da busca da Dex, linha ~3181) -
    // achado real em auditoria, 2026-09-18: renderSpeedTiers reconstrói a
    // tabela inteira (até 1906 linhas) a cada tecla; medido ao vivo em
    // ~40ms sem filtro, ~2,5 frames de trabalho síncrono por tecla.
    document.getElementById("speedtier-search").addEventListener("input", debounce(renderSpeedTiers, 80));
  }

  // ---------------- Role compendium ----------------
  // Descrições fiéis ao critério REAL de scripts/compute_species_role.ps1
  // (nunca uma definição de manual genérica) - qualquer mudança na fórmula
  // do script precisa atualizar este texto junto.
  var ROLE_DESCRIPTIONS_PT = {
    Pivo: "Tem um golpe de pivô real no movepool (U-turn, Volt Switch, Flip Turn, Teleport, Parting Shot ou Baton Pass) e bulk fora do quartil mais frágil do jogo (percentil 25 ou mais) - aguenta pelo menos um hit antes de trocar, mantendo controle de quem entra em campo.",
    Tanque: "Bulk entre os 25% mais altos do jogo (percentil 75+) E tem um golpe de recuperação real (Recover, Roost, Wish, Slack Off...) - bulk sozinho, sem recuperação, se desgasta em poucos turnos.",
    Wallbreaker: "Ataque - físico ou especial, o maior dos dois - entre os 25% mais altos do jogo (percentil 75+), mas SEM bulk alto (percentil abaixo de 60) - fura muralhas sem depender de golpe de setup pra isso.",
    Sweeper: "Velocidade entre as 25% mais altas do jogo (percentil 75+), ataque acima da mediana (percentil 60+) E tem um golpe de setup real (Swords Dance, Dragon Dance, Nasty Plot, Calm Mind...) - vira avalanche quando entra limpo no fim de jogo."
  };
  var ROLE_SORT_PCT = { Pivo: "bulkPct", Tanque: "bulkPct", Wallbreaker: "offensePct", Sweeper: "spePct" };
  var ROLE_TIER_ORDER = { SS: 0, S: 1, A: 2, B: 3, C: 4, D: 5 };
  // Destaque de arquétipo (achado em auditoria, 2026-09-18, item 18): antes
  // o Glossário de Papéis era cego ao arquétipo - um jogador numa run
  // Monotype via o mesmo top-10 global de sempre, incluindo espécies de
  // tipos que ele nem pode usar. `combina` sinaliza (nunca filtra/esconde -
  // a referência continua útil fora de uma run Monotype) quem é do tipo
  // Monotype ativo.
  function computeRoleCompendium() {
    var monotype = state.archetype.monotype || "";
    return ["Pivo", "Tanque", "Wallbreaker", "Sweeper"].map(function (role) {
      var members = [];
      SPECIES.forEach(function (sp) {
        var r = SPECIES_ROLE[sp.sname];
        if (r && r.roles && r.roles.indexOf(role) !== -1) {
          var rank = SPECIES_RANK[sp.sname];
          members.push({
            sp: sp, tier: rank ? rank.tier : null, sortVal: r[ROLE_SORT_PCT[role]],
            combina: !!monotype && speciesTypeNames(sp).indexOf(monotype) !== -1
          });
        }
      });
      members.sort(function (a, b) {
        var ta = (a.tier !== null && ROLE_TIER_ORDER[a.tier] !== undefined) ? ROLE_TIER_ORDER[a.tier] : 6;
        var tb = (b.tier !== null && ROLE_TIER_ORDER[b.tier] !== undefined) ? ROLE_TIER_ORDER[b.tier] : 6;
        return ta !== tb ? ta - tb : b.sortVal - a.sortVal;
      });
      return { role: role, label: ROLE_LABEL_PT[role] || role, desc: ROLE_DESCRIPTIONS_PT[role], total: members.length, examples: members.slice(0, 10), monotype: monotype };
    });
  }
  function renderRoleCompendium() {
    var groups = computeRoleCompendium();
    document.getElementById("role-compendium").innerHTML = groups.map(function (g) {
      var chips = g.examples.map(function (m) {
        return '<span class="role-chip goto-species' + (m.combina ? ' role-chip-match' : '') + '" tabindex="0" role="button" data-x="' + m.sp.x + '">' + spriteImgHtml(m.sp.x, m.sp.n, 24) +
          escapeHtml(m.sp.n) + rankBadgeHtml(m.sp.sname) + '</span>';
      }).join("");
      var monotypeNote = g.monotype
        ? '<p class="hint" style="margin:2px 0 8px;">Destacados: compatíveis com sua run Monotype ' + escapeHtml(g.monotype) + '.</p>'
        : "";
      return '<div class="card"><h3>' + escapeHtml(g.label) + ' <span class="role-count">(' + g.total + ' espécie(s))</span></h3>' +
        '<p class="mybuild-hint">' + escapeHtml(g.desc) + '</p>' + monotypeNote +
        (chips ? '<div class="role-chip-list">' + chips + '</div>' : '<p class="hint">Nenhuma espécie se encaixa neste papel com os critérios atuais.</p>') +
      '</div>';
    }).join("");
  }
