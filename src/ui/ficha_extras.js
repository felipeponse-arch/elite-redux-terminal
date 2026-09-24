  // ===== src/ui/ficha_extras.js =====
  // Ficha: comparar builds, anotações, histórico de builds e builds de referência dos chefões.
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.ps1 (marcador @ui ficha_extras.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- compare card ----------------
  // "Comparar builds" - Fase 2, 2026-09-09. Deliberately scoped to stats +
  // types + rank + a one-line build summary, NOT a full damage/matchup
  // calculator - same scope discipline as the boss stat calculator and
  // "Meu build" status preview (see their own comments): give the user a
  // clear side-by-side of two Pokemon's numbers, don't pretend to model a
  // battle between them.
  function compareCardHtml(sp) {
    return '<div class="card"><h3>Comparar com outro Pokémon</h3>' +
      '<input type="text" id="compare-input" list="compare-species-list" placeholder="Nome de outro Pokémon..." autocomplete="off" ' +
      'style="width:100%;max-width:320px;padding:9px 10px;border-radius: var(--radius-md);border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:13px;">' +
      '<div id="compare-result" style="margin-top:12px;"></div>' +
    '</div>';
  }

  function compareResultHtml(spA, spB) {
    var rows = STAT_LABELS_SHORT.map(function (label, i) {
      var a = spA.b[i], b = spB.b[i];
      var aCls = a > b ? "cmp-win" : (a < b ? "cmp-lose" : "");
      var bCls = b > a ? "cmp-win" : (b < a ? "cmp-lose" : "");
      return '<tr><td>' + label + '</td><td class="mono ' + aCls + '">' + a + '</td><td class="mono ' + bCls + '">' + b + '</td></tr>';
    }).join("");
    var bstA = bst(spA), bstB = bst(spB);
    var bstAcls = bstA > bstB ? "cmp-win" : (bstA < bstB ? "cmp-lose" : "");
    var bstBcls = bstB > bstA ? "cmp-win" : (bstB < bstA ? "cmp-lose" : "");
    function typesRow(sp) { return speciesTypeNames(sp).map(function (n) { return typePill(n, true); }).join(" "); }
    function buildLine(sp) {
      var b = effectiveBuild(sp);
      if (!b) return '<span style="color:var(--text-dim);">sem build salva</span>';
      var parts = [];
      if (b.ability) parts.push(stripNote(b.ability));
      if (b.item) parts.push("@ " + stripNote(b.item));
      return parts.length ? escapeHtml(parts.join(" ")) : '<span style="color:var(--text-dim);">sem build salva</span>';
    }
    return '<table class="compare-table"><thead><tr><th></th>' +
        '<th>' + escapeHtml(spA.n) + ' ' + rankBadgeHtml(spA.sname) + '</th>' +
        '<th>' + escapeHtml(spB.n) + ' ' + rankBadgeHtml(spB.sname) + '</th>' +
      '</tr></thead><tbody>' +
      '<tr><td>Tipo</td><td>' + typesRow(spA) + '</td><td>' + typesRow(spB) + '</td></tr>' +
      rows +
      '<tr><td><b>BST</b></td><td class="mono ' + bstAcls + '"><b>' + bstA + '</b></td><td class="mono ' + bstBcls + '"><b>' + bstB + '</b></td></tr>' +
      '<tr><td>Build</td><td>' + buildLine(spA) + '</td><td>' + buildLine(spB) + '</td></tr>' +
      '</tbody></table>';
  }

  // Campo "Comparar com outro Pokémon": ouvinte único no painel da ficha (fase 5
  // da refatoração) - a espécie é a da ficha aberta.
  (function () {
    var painel = document.getElementById("species-detail");
    painel.addEventListener("input", function (e) {
      if (e.target.id !== "compare-input") return;
      var out = document.getElementById("compare-result");
      var sp = state.selected !== null && state.selected !== undefined ? getSpeciesByX(state.selected) : null;
      if (!out || !sp) return;
      // A datalist only ever gives back an exact option value or free text
      // the user is still mid-typing - only render once the typed text is
      // a real, exact species name, same "silently do nothing until valid"
      // idiom the move/item pickers elsewhere already use.
      var other = SPECIES_BY_NAME[e.target.value];
      if (!other || other.sname === sp.sname) { out.innerHTML = ""; return; }
      out.innerHTML = compareResultHtml(sp, other);
    });
  })();

  // Used by the Dex detail card and the team-slot card (renderTeam).
  // ---------------- notes, build history & boss references ----------------
  // "Minhas anotações" - free text per species, the user's own, saved
  // locally (see state.notes). Explicit Save button rather than
  // auto-save-on-blur, matching the same predictable pattern already used
  // for renaming a saved team - the user should always know exactly when
  // something got written, not guess.
  function notesCardHtml(sp) {
    var val = state.notes[sp.sname] || "";
    return '<div class="card"><h3>Minhas anotações</h3>' +
      '<textarea id="species-notes-input" class="notes-textarea" rows="3" placeholder="Sua própria anotação sobre este Pokémon - build que testou, estratégia, o que funcionou numa luta...">' + escapeHtml(val) + '</textarea>' +
      '<div class="notes-actions"><button id="species-notes-save" class="text-action-btn" type="button">Salvar</button>' +
      '<span id="species-notes-status" class="notes-status" role="status" aria-live="polite"></span></div>' +
    '</div>';
  }

  function buildHistoryHtml(sp) {
    var hist = BUILD_HISTORY[sp.sname];
    if (!hist || !hist.length) return "";
    var items = hist.slice().reverse().map(function (entry, i) {
      var meta = '<span class="bh-date mono">' + escapeHtml(entry.savedAt || "") + '</span>' +
        (entry.context ? '<span class="bh-context">' + escapeHtml(entry.context) + '</span>' : '');
      return buildEntryHtml(sp, entry, meta, 'data-src="hist" data-sname="' + sp.sname + '" data-idx="' + i + '"');
    }).join("");
    return '<details class="bh-details"><summary>Histórico de builds (' + hist.length + ')</summary>' + items + '</details>';
  }

  // Dex detail only (see selectSpecies) - reference/inspiration builds pulled
  // from boss trainer parties, not shown in the team card on purpose: the
  // team card is about the ACTIVE build + its own history, and a boss's
  // moveset is tuned for one specific fight, not necessarily a good general
  // build (flagged as such via the "chefão" label and (dupla) tag).
  function bossReferenceHtml(sp) {
    var refs = BOSS_BUILDS[sp.sname];
    if (!refs || !refs.length) return "";
    var items = refs.map(function (entry, i) {
      var meta = '<span class="bh-date mono">' + escapeHtml(DIFF_LABELS[entry.tier] || entry.tier) + '</span>' +
        '<span class="bh-context">' + escapeHtml(entry.boss) + (entry.db ? " (dupla)" : "") + '</span>';
      return buildEntryHtml(sp, entry, meta, 'data-src="boss" data-sname="' + sp.sname + '" data-idx="' + i + '"');
    }).join("");
    return '<details class="bh-details"><summary>Builds vistas em chefões (' + refs.length + ')</summary>' + items +
      '<p style="color:var(--text-dim);font-size:11px;margin-top:8px;">Referência do time de um chefão, não uma recomendação — o moveset foi ajustado pra aquela luta específica, não necessariamente pro seu time.</p></details>';
  }

  // Delegated once for the whole document: the Dex detail and the team slots
  // re-render their own subtree often, so binding here avoids re-attaching a
  // listener every time either view redraws.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".bh-copy");
    if (!btn) return;
    var sp = getSpeciesBySname(btn.dataset.sname);
    if (!sp) return;
    var fromBoss = btn.dataset.src === "boss";
    var list = fromBoss ? BOSS_BUILDS[sp.sname] : BUILD_HISTORY[sp.sname];
    if (!list) return;
    var entry = fromBoss ? list[parseInt(btn.dataset.idx, 10)] : list.slice().reverse()[parseInt(btn.dataset.idx, 10)];
    if (!entry) return;
    copyText(showdownSet(sp, entry), null, "");
    flashToast((fromBoss ? "Build de chefão do " : "Build antiga do ") + sp.n + " copiada (formato Showdown)");
  });

  // "+ Usar como meu build" on a history/boss-reference entry - 2026-09-09,
  // user caught that the "copiar" button above never touched "Meu build" or
  // the Team tab, only the clipboard. Same data, same effectiveBuild()
  // priority rule (a user's own pick always wins - this just sets it),
  // reuses the exact data-src/data-sname/data-idx attrs "copiar" already
  // carries so there's no second lookup scheme to keep in sync.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".use-entry-build-btn");
    if (!btn) return;
    var sp = getSpeciesBySname(btn.dataset.sname);
    if (!sp) return;
    var fromBoss = btn.dataset.src === "boss";
    var list = fromBoss ? BOSS_BUILDS[sp.sname] : BUILD_HISTORY[sp.sname];
    if (!list) return;
    var entry = fromBoss ? list[parseInt(btn.dataset.idx, 10)] : list.slice().reverse()[parseInt(btn.dataset.idx, 10)];
    if (!entry) return;
    // ivsRaw só existe em entradas de chefão (boss_reference_builds.json) e
    // só desde a correção de 2026-09-11 - histórico de build antigo
    // (BUILD_HISTORY) nunca teve IV de verdade pra guardar (é uma build do
    // PRÓPRIO jogador). Sem o dado real, 31 fixo continua sendo o fallback
    // honesto (não um valor inventado - é literalmente o padrão competitivo
    // "perfect IV" que builds manuais também assumem).
    var ivs = (Array.isArray(entry.ivsRaw) && entry.ivsRaw.length === 6)
      ? entry.ivsRaw.slice()
      : [31, 31, 31, 31, 31, 31];
    setOrReplaceActiveBuild(sp.sname, {
      ability: entry.ability || "",
      nature: entry.nature || "",
      item: entry.item || "",
      moves: (entry.moves || []).slice(0, 4),
      ivs: ivs,
      evs: evsTextoParaArray(entry.evs)
    }, "manual"); // ação: grava e redesenha a ficha aberta desta espécie
    flashToast("Build " + (fromBoss ? "de chefão " : "antiga ") + "copiada pro seu \"Meu build\" de " + sp.n);
  });


  // Rótulo e linhas de contexto da build mostrada (card do time e ficha).
  function rotuloDaBuild(build) {
    if (!build) return "";
    if (build.origem === "ia") return "Build gerada por IA";
    if (build.origem === "manual") return "Meu build";
    if (build.origem === "curada") return ESTILO_ROTULO[build.estilo] ? "Build curada (" + ESTILO_ROTULO[build.estilo] + ")" : "Build curada";
    if (build.origem === "base") return "Build da forma base";
    return "Build (formato Showdown)";
  }
  function planoDaBuildHtml(build) {
    if (!build) return "";
    var linhas = [];
    if (build.herdadaDe) {
      linhas.push("Mesma criatura de " + escapeHtml(build.herdadaDe) + ": mesmos golpes" +
        (build.ajustes && build.ajustes.length ? ", " + build.ajustes.map(function (c) { return c.campo + " " + escapeHtml(c.de) + " → " + escapeHtml(c.para); }).join("; ") + " (não existe na Mega)" : "") + ".");
    }
    if (build.trocas && build.trocas.length) {
      linhas.push("Já liberado: " + build.trocas.map(function (t) { return escapeHtml(t.para) + " no lugar de " + escapeHtml(t.de) + " (nível " + t.nivel + ")"; }).join(", ") + ".");
    }
    if (build.pendentes && build.pendentes.length) {
      linhas.push("Próximas trocas: " + build.pendentes.map(function (t) { return escapeHtml(t.de) + " → " + escapeHtml(t.para) + " no nível " + t.nivel; }).join(", ") + ".");
    }
    return linhas.map(buildNoteHtml).join("");
  }

  // Etiqueta em criatura que é forma Mega enquanto a Mega ainda não existe pro
  // jogador (antes da 4ª insígnia): o rank SS dela é dado real, mas nenhuma
  // sugestão a conta - a etiqueta diz isso na própria tela.
  function megaLockedTagHtml(sp) {
    if (!sp || !isMegaForm(sp) || megaEvolutionUnlocked()) return "";
    return ' <span class="mega-lock-tag" title="Mega Evolução só a partir da 4ª insígnia (Flannery). Até lá as sugestões contam esta criatura como a forma base.">Mega só na 4ª insígnia</span>';
  }
  // Linha "Outra forma: Mega X" no card do time (2026-09-16) - lembra que a
  // mesma criatura tem outra forma disponível, com link pra ficha dela.
  function otherFormsHtml(sp) {
    var others = formFamilyOf(sp).filter(function (f) { return f.x !== sp.x; });
    if (!others.length) return "";
    return '<br><b>' + (others.length > 1 ? 'Outras formas' : 'Outra forma') + ':</b> ' + others.map(function (f) {
      return '<span class="goto-species" tabindex="0" role="button" data-x="' + f.x + '">' + escapeHtml(f.n) + '</span>';
    }).join(", ") + (!megaEvolutionUnlocked() && others.some(isMegaForm) ? ' <span class="mega-lock-tag" title="Mega Evolução só a partir da 4ª insígnia (Flannery).">Mega só na 4ª insígnia</span>' : "");
  }
