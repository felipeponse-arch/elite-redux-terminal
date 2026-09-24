  // ===== src/ui/editor_build.js =====
  // Formato Showdown, cópia e o editor "Meu build" da ficha (e os sets de Estratégias).
  // Interface: lê e desenha a página. Colado no <script> principal por
  // scripts/build.mjs (marcador @ui editor_build.js) no MESMO lugar de onde saiu do
  // template (fase 5 da refatoração, 2026-09-24) - a ordem de execução não mudou.

  // ---------------- Showdown export & "Meu build" editor ----------------
  // Single clipboard path for the whole app. `srcEl` may be a field (its value
  // is copied and left selected, so the manual Ctrl+C fallback works) or null
  // when copying a plain string.
  function copyText(text, statusEl, okMsg, srcEl) {
    var done = function (msg) { if (statusEl) statusEl.textContent = msg; };
    var fallbackEl = srcEl;
    if (!fallbackEl) {
      fallbackEl = document.createElement("textarea");
      fallbackEl.value = text;
      fallbackEl.style.position = "fixed";
      fallbackEl.style.opacity = "0";
      document.body.appendChild(fallbackEl);
    }
    fallbackEl.focus();
    fallbackEl.select();
    if (fallbackEl.setSelectionRange) fallbackEl.setSelectionRange(0, String(text).length);

    var cleanup = function () { if (!srcEl && fallbackEl.parentNode) document.body.removeChild(fallbackEl); };
    var fallback = function () {
      try { document.execCommand("copy"); done(okMsg); }
      catch (e) { done("Não consegui copiar automaticamente — o texto já está selecionado, use Ctrl+C."); }
      cleanup();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(okMsg); cleanup(); }).catch(fallback);
    } else {
      fallback();
    }
  }




  // Descrição real do item segurado, quando existe (ver ITEM_DESC acima) -
  // resolve um gap real: nem todo item novo deste hack (ex. Swirly Glasses,
  // Tactical Vest) é reconhecível de cabeça, e o dado bruto do jogo nunca
  // trouxe descrição nenhuma antes desta pesquisa (2026-09-13).
  function itemDescHtml(item) {
    var clean = stripNote(item);
    var desc = clean && (ITEM_PT[clean] || ITEM_DESC[clean]);
    if (!desc) return "";
    return '<div class="ts-item-desc"><b>' + escapeHtml(clean) + ':</b> ' + escapeHtml(desc) + '</div>';
  }

  // Shared by buildHistoryHtml and bossReferenceHtml below - same entry
  // markup either way, just a different meta line and copy-button attrs.
  // Two DISTINCT actions, not one repurposed button, 2026-09-09 (user
  // caught the gap: clicking "copiar" here did nothing to "Meu build" or
  // the Team tab) - "copiar" still only puts clipboard text (someone
  // pasting into Showdown directly shouldn't have their own saved build
  // silently overwritten as a side effect), "+ Usar como meu build" is the
  // new, explicit write into state.customBuilds, same button/label
  // convention already shipped on the boss party card.
  // Aviso em build (curada ou salva) de forma mega que NÃO segura a pedra,
  // quando o jogador joga no modo temporário. Várias builds do Discord foram
  // escritas pro modo permanente ("a pedra só é necessária na 1a evolução,
  // depois libera o slot") - no temporário esse item nunca entra em campo.
  // Não bloqueia nada: explica em qual modo a build funciona.
  // Aviso de eficiência de EV de HP com item de cura percentual (referência
  // do Smogon: "Monotype Sets Compendium", 2026-09-18 - "For Leftovers
  // numbers generally you want to hit a number divisible by 16+1"). Leftovers/
  // Black Sludge curam 1/16 do HP máximo por turno desde a introdução deles
  // (mecânica vanilla inalterada, mesmo raciocínio já usado pra Life Orb em
  // ITEM_MOVE_POWER_MODS - textbook, não precisa de fonte externa por
  // espécie) - um HP final que não é múltiplo de 16 (ou 16k+1, o ideal)
  // desperdiça parte dessa cura no arredondamento pra baixo. Só informativo,
  // nunca bloqueia nada - mesmo espírito de buildContextNotesHtml abaixo.
  var HP_FRACTION_16_ITEMS = ["Leftovers", "Black Sludge"];
  // `level` é obrigatório (não recalcula getCurrentCap() sozinha) - "Meu
  // build" deixa simular outro nível digitando em #mybuild-level, e a nota
  // precisa citar o MESMO nível que os status mostrados na tela usam, não
  // sempre o level cap real (bug achado ao escrever evBreakpointNote logo
  // abaixo, que tem exatamente essa mesma necessidade).
  function hpEvEfficiencyNote(sp, hpEv, item, level) {
    if (!sp || HP_FRACTION_16_ITEMS.indexOf(stripNote(item)) === -1) return "";
    var base = sp.b[0];
    var currentHp = calcFinalStat(base, 31, hpEv, level, 0);
    if (currentHp % 16 === 1) return "";
    var best = null;
    for (var ev = 0; ev <= 252 && !best; ev += 4) {
      if (calcFinalStat(base, 31, ev, level, 0) % 16 === 1) best = { ev: ev, ideal: true };
    }
    if (!best) {
      for (var ev2 = 0; ev2 <= 252 && !best; ev2 += 4) {
        if (calcFinalStat(base, 31, ev2, level, 0) % 16 === 0) best = { ev: ev2, ideal: false };
      }
    }
    if (!best || best.ev === hpEv) return "";
    var bestHp = calcFinalStat(base, 31, best.ev, level, 0);
    return '<div class="ts-build-note">Com ' + escapeHtml(item) + ' (cura 1/16 do HP máximo por turno): ' +
      hpEv + ' EV em HP dá ' + currentHp + ' HP no nível ' + level + ', desperdiçando parte da cura no ' +
      'arredondamento. ' + best.ev + ' EV renderia ' + bestHp + ' HP' +
      (best.ideal ? ' (múltiplo de 16+1, o ideal pra Leftovers)' : ' (múltiplo de 16)') + '.</div>';
  }
  // Breakpoints de EV (referência do Smogon: "A Beginner's Guide to
  // Understanding EVs" - "at level 50, EVs are worked with in multiples of
  // 8" em vez de 4). calcFinalStat já usa a fórmula padrão desde o Gen 3
  // (floor((2*base+iv+floor(ev/4)) * level/100) + 5) - textbook, igual ao
  // raciocínio já usado pra Leftovers/Life Orb acima - e essa fórmula fica
  // cada vez mais grosseira quanto MENOR o nível: só no nível 100 cada +4
  // EV garante +1 no stat final; em níveis mais baixos (a norma no Elite
  // Redux, que trava tudo por level cap) vários EVs seguidos podem não
  // mudar nada no stat mostrado. Acha, pra cada stat investido, o menor EV
  // que já dá o MESMO stat final (mesmo nature/item, pra não confundir
  // arredondamento de nature com arredondamento de nível) - se for menor
  // que o EV atual, sinaliza o excesso. Só informativo, nunca bloqueia.
  function evBreakpointNote(sp, ivs, evs, level, nature, item) {
    if (!sp) return "";
    var desperdicio = [];
    for (var i = 0; i < 6; i++) {
      if (!evs[i]) continue;
      // minEvSameStat vive em src/regras/calc_stat.js - mesma conta que
      // trimAndReallocateEvs usa pra já cortar isso direto de build gerada
      // por IA; aqui é só o aviso (nunca muda o que o jogador digitou).
      var minEv = minEvSameStat(sp.b[i], ivs[i], evs[i], level, i, nature, item, sp.n);
      if (minEv < evs[i]) desperdicio.push({ stat: i, atual: evs[i], minimo: minEv });
    }
    if (!desperdicio.length) return "";
    var partes = desperdicio.map(function (w) {
      return STAT_LABELS_SHORT[w.stat] + ' (' + w.atual + ' EV &rarr; ' + w.minimo + ' já dá o mesmo)';
    }).join(", ");
    var totalSobra = desperdicio.reduce(function (a, w) { return a + (w.atual - w.minimo); }, 0);
    return '<div class="ts-build-note">No nível ' + level + ', os saltos de EV ficam mais espaçados que no nível 100 (cada ponto de stat pode custar mais de 4 EV - regra vanilla, não é bug daqui): ' +
      partes + '. ' + totalSobra + ' EV no total dá pra realocar sem perder nada nesses stats.</div>';
  }
  // Junta as duas notas de EV num só lugar (achado em auditoria, 2026-09-18:
  // a cadeia hpEvEfficiencyNote(...) + evBreakpointNote(...) era escrita à
  // mão duas vezes - "Meu build" e "Estratégias" - com a forma do array de
  // IV montada separadamente em cada uma, já tendo divergido uma vez sem
  // ninguém notar). Um lugar só decide quais notas de EV aparecem; os dois
  // chamadores só passam os dados de verdade da build.
  function buildEvNotesHtml(sp, ivs, evs, level, nature, item) {
    return hpEvEfficiencyNote(sp, evs[0], item, level) + evBreakpointNote(sp, ivs, evs, level, nature, item);
  }
  // Observações de contexto numa build (itens P2 e P3 da pauta técnica,
  // 2026-09-16), só informativas - nunca bloqueiam nem escondem a build:
  //   - golpe aprendido só por nível ACIMA do level cap atual (as builds do
  //     Discord são afinadas pro fim de jogo; 36 delas usam golpe acima do
  //     nível 55). Golpe de tutor nunca conta como acima do cap;
  //   - golpe que só funciona em batalha dupla, num app pensado pra 1x1.
  // Wrapper único pra nota de build (achado em auditoria, 2026-09-18): o
  // mesmo `'<div class="ts-build-note">' + texto + '</div>'` era escrito à
  // mão em 5 lugares diferentes. Texto vazio/falsy devolve "" - cada
  // chamador continua decidindo SE mostra a nota, este helper só decide
  // COMO ela vira HTML.
  function buildNoteHtml(texto) {
    return texto ? '<div class="ts-build-note">' + texto + '</div>' : "";
  }
  function buildContextNotesHtml(sp, build) {
    if (!sp || !build || !Array.isArray(build.moves)) return "";
    var cap = getCurrentCap();
    var notas = [];
    // Conta única em golpesTravadosNoCap (src/regras/level_cap.js). Golpe que
    // a forma não aprende (nivel null) não entra aqui - reconciliarBuild cuida.
    var acima = golpesTravadosNoCap(sp, build.moves).filter(function (g) { return g.nivel !== null; });
    if (acima.length) notas.push("Acima do seu level cap atual (" + cap + "): " + acima.map(function (g) {
      return escapeHtml(g.nome) + " (nível " + g.nivel + ")";
    }).join(", ") + ".");
    var dupla = build.moves.filter(function (m) { return moveRoleOf(m) === "dupla"; });
    if (build.formato === "dupla") notas.push("A fonte descreve este set como pensado pra batalha dupla.");
    if (dupla.length) notas.push("Só funciona em batalha dupla: " + dupla.map(escapeHtml).join(", ") + ".");
    return notas.map(buildNoteHtml).join("");
  }
  function megaModeBuildNoteHtml(sp, build) {
    var rule = megaStoneRuleFor(sp);
    if (!rule || !build || rule.stones.indexOf(build.item) !== -1) return "";
    return buildNoteHtml('Mega temporária: a ' + escapeHtml(sp.n) + ' precisa segurar ' +
      escapeHtml(rule.stones.join(" ou ")) + ' o tempo todo, então ' +
      (build.item ? escapeHtml(build.item) + ' só funciona' : 'esta build só funciona') +
      ' no modo permanente. Troque o modo em Progresso se for o seu caso.');
  }
  function buildEntryHtml(sp, entry, metaHtml, copyAttrs) {
    return '<div class="bh-entry">' +
      '<div class="bh-meta">' + metaHtml +
      '<button class="bh-copy" ' + copyAttrs + ' type="button" title="Copiar este set">copiar</button></div>' +
      '<pre class="showdown-block">' + escapeHtml(showdownSet(sp, entry)) + '</pre>' +
      itemDescHtml(entry.item) +
      megaModeBuildNoteHtml(sp, entry) +
      buildContextNotesHtml(sp, entry) +
      buildSynergyHtml(sp, entry) +
      buildNoteHtml(entry.note && escapeHtml(entry.note)) +
      '<button class="text-action-btn use-entry-build-btn" ' + copyAttrs + ' type="button" style="margin-top:6px;">+ Usar como meu build</button>' +
    '</div>';
  }



  // "Meu build" - 2026-09-09, user feedback on the free-text notes field
  // ("não tem interação com o poke, o usuário tem que digitar tudo"):
  // pick ability/nature/item/moves from this species' own real options
  // (choosable abilities, its actual movepool via lm+tu, the full item
  // list) instead of typing them from memory, plus IV/EV number fields.
  // Saved separately from the free-text notes (state.customBuilds, kept
  // alongside it, not replacing it - prose notes are still their own
  // useful thing). Renders through the same showdownSet() every other
  // build source (builds.json, build history, boss reference) already
  // uses, so it looks and copies identically to a curated build.
  // Chips to switch between up to 3 saved builds per species (manual and/or
  // AI-generated) - 2026-09-09, user's own rule: show what's saved, ask if
  // they want a different one, cap at 3. Kept as its own small function
  // (not inlined in myBuildEditorHtml) since it's also useful standalone.
  function buildChipsHtml(list) {
    if (!list.length) return "";
    return '<div class="mybuild-chips">' + list.map(function (b, i) {
      var label = (b.source === "ia" ? "IA" : "Manual") + " " + (i + 1);
      return '<button type="button" class="mybuild-chip' + (b.active ? " active" : "") + '" data-idx="' + i + '">' + label + '</button>';
    }).join("") + '</div>';
  }

  function myBuildEditorHtml(sp) {
    // Resincroniza ANTES de montar o HTML (o valor inicial do campo
    // #mybuild-level abaixo é escrito aqui, direto no innerHTML - só
    // resincronizar depois, dentro de wireMyBuildEditor(), não adianta:
    // essa função já roda depois do innerHTML ter sido inserido no DOM).
    if (!myBuildLevelIsCustom) myBuildLevel = getCurrentCap() || 50;
    var list = getBuildList(sp.sname);
    var b = getActiveBuild(sp.sname) || { ability: "", nature: "", item: "", moves: [], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0] };
    var abiIds = uniqueIds(sp.ab);
    var abiOptionsHtml = '<option value="">(nenhuma)</option>' + abiIds.map(function (id) {
      var a = ABILITIES[id];
      return a ? '<option value="' + escapeHtml(a[0]) + '">' + escapeHtml(a[0]) + '</option>' : "";
    }).join("");
    var natureOptionsHtml = '<option value="">(neutra)</option>' + ALL_NATURES.map(function (n) {
      return '<option value="' + n + '">' + n + '</option>';
    }).join("");
    // This species' real movepool only - level-up + tutor (which already
    // covers what would be TM-taught moves in this hack's own data model,
    // see extract_bosses.ps1/transform.ps1 notes - TMHMMoves is empty for
    // every species, checked directly).
    // Trava por level cap, 2026-09-10 (pedido do usuário): assume que o
    // Pokémon já está no nível liberado pelo cap - golpes de NÍVEL acima
    // dele somem do seletor (a tabela "Golpes por Nível" já sinalizava isso
    // visualmente com "acima", mas o seletor da build ainda oferecia todos).
    // Golpes de tutor ficam sempre disponíveis de propósito - não há gate
    // por nível pra eles no jogo. Sem cap configurado (null), não filtra
    // nada - não há base pra travar.
    var mbAvail = availableMovesFor(sp);
    var mbCap = mbAvail.cap;
    var mbLockedCount = mbAvail.lockedCount;
    var moveIds = mbAvail.ids;
    var moveOptionsHtml = '<option value="">(nenhum)</option>' + moveIds.map(function (id) {
      var m = MOVES[id];
      return m ? '<option value="' + escapeHtml(m[0]) + '">' + escapeHtml(m[0]) + '</option>' : "";
    }).join("");
    var mbLockedHint = mbLockedCount > 0
      ? '<p class="mybuild-hint" style="margin:4px 0 0;">' + mbLockedCount + ' golpe(s) de nível acima do level cap atual (' + mbCap + ') não aparecem aqui.</p>'
      : "";
    var itemDatalist = '<datalist id="mybuild-item-list">' + ITEMS.map(function (n) { return '<option value="' + escapeHtml(n) + '">'; }).join("") + '</datalist>';
    var ivEvHeader = '<span></span>' + STAT_LABELS_SHORT.map(function (l) { return '<span>' + l + '</span>'; }).join("");
    var ivRow = '<span>IV</span>' + [0, 1, 2, 3, 4, 5].map(function (i) {
      return '<input type="number" class="mybuild-num" id="mybuild-iv-' + i + '" min="0" max="31" aria-label="IV de ' + STAT_LABELS_SHORT[i] + '">';
    }).join("");
    var evRow = '<span>EV</span>' + [0, 1, 2, 3, 4, 5].map(function (i) {
      return '<input type="number" class="mybuild-num" id="mybuild-ev-' + i + '" min="0" max="252" step="4" aria-label="EV de ' + STAT_LABELS_SHORT[i] + '">';
    }).join("");
    var hasBuild = list.length > 0;
    var preview = hasBuild ? showdownSet(sp, {
      ability: b.ability, nature: b.nature, item: b.item,
      evs: evsToShowdownText(b.evs), moves: b.moves.filter(Boolean)
    }) : "";
    return '<div class="card"><h3>Meu build</h3>' +
      '<p class="mybuild-hint">Monte seu set escolhendo direto das opções reais deste Pokémon - nada de digitar de cabeça.</p>' +
      buildChipsHtml(list) +
      (hasBuild && b.plano ? planoDaBuildHtml(golpesNoCap(sp, b.moves, b.plano, getCurrentCap())) +
        buildNoteHtml("Aqui você edita os golpes de agora; as trocas acima entram sozinhas no time quando o level cap liberar.") : "") +
      '<div class="mybuild-row">' +
        '<label class="mybuild-field">Habilidade<select id="mybuild-ability" class="campo campo-ajuste">' + abiOptionsHtml + '</select></label>' +
        '<label class="mybuild-field">Nature<select id="mybuild-nature" class="campo campo-ajuste">' + natureOptionsHtml + '</select></label>' +
        '<label class="mybuild-field">Item<input type="text" id="mybuild-item" class="campo campo-ajuste" list="mybuild-item-list" placeholder="Buscar item..." autocomplete="off"></label>' +
      '</div>' + itemDatalist +
      '<div class="mybuild-row mybuild-moves">' +
        [0, 1, 2, 3].map(function (i) {
          return '<label class="mybuild-field">Golpe ' + (i + 1) + '<select id="mybuild-move-' + i + '" class="campo campo-ajuste">' + moveOptionsHtml + '</select></label>';
        }).join("") +
      '</div>' + mbLockedHint +
      '<div class="mybuild-ivev">' +
        '<div class="mybuild-ivev-row mybuild-ivev-header">' + ivEvHeader + '</div>' +
        '<div class="mybuild-ivev-row">' + ivRow + '</div>' +
        '<div class="mybuild-ivev-row">' + evRow + '</div>' +
        '<div class="mybuild-ev-total" id="mybuild-ev-total"></div>' +
        '<div class="mybuild-ev-bar-track"><div class="mybuild-ev-bar-fill" id="mybuild-ev-bar"></div></div>' +
      '</div>' +
      '<div class="boss-level-row"><label for="mybuild-level">Status calculados pro nível (level cap atual' + (mbCap ? ": " + mbCap : "") + ')</label>' +
        '<input type="number" id="mybuild-level" class="campo campo-numero" min="1" max="100" value="' + (myBuildLevel || mbCap || 50) + '"></div>' +
      '<div id="mybuild-status-preview"></div>' +
      '<p class="mybuild-hint" style="margin:2px 0 12px;">Preenchido a partir do level cap configurado em Progresso - pode digitar outro valor pra simular, mas volta a seguir o cap sempre que ele mudar. Poder de golpe considera STAB e Life Orb quando presente - não é uma calculadora de dano (sem efetividade de tipo, sem status de campo, sem outras habilidades de golpe).</p>' +
      '<div class="notes-actions"><button id="mybuild-save" class="text-action-btn" type="button">Salvar build</button>' +
        (list.length < 3 ? '<button id="mybuild-save-variant" class="text-action-btn" type="button">Salvar como nova variante</button>' : '') +
        (hasBuild ? '<button id="mybuild-clear" class="text-action-btn" type="button" style="color:var(--sem-weak);">Apagar esta</button>' : '') +
        '<span id="mybuild-status" class="notes-status" role="status" aria-live="polite"></span></div>' +
      // Justificativa em destaque, 2026-09-10 (pedido da UX na reunião da
      // equipe: "a linha precisa ser em destaque") - só aparece pra build
      // com origem "ia" e que realmente veio com uma justificativa (uma
      // build manual, ou uma da IA sem essa parte da resposta, não mostra
      // nada aqui). Visualmente separado do bloco Showdown de baixo (que é
      // só o set em si) - isso é o "porquê", não o "o quê".
      (hasBuild && b.source === "ia" && b.rationale
        ? '<div class="mybuild-rationale"><strong>Por que essa escolha:</strong> ' + escapeHtml(b.rationale) + '</div>'
        : '') +
      (hasBuild ? '<pre class="showdown-block">' + escapeHtml(preview) + '</pre><button id="mybuild-copy" class="text-action-btn" type="button">Copiar</button>' : '') +
      // "Gerar build com IA" - 2026-09-09, user's own rule: quando não tem
      // build salva (ou quando quer uma diferente das já salvas), chama o
      // Claude pra montar uma nova, em vez de exigir que o usuário venha
      // pedir numa conversa separada. Disparado só por clique explícito -
      // a capacidade `sample` cobra do usuário por chamada e a própria
      // regra da plataforma proíbe disparo automático sem gesto real.
      '<div class="mybuild-ai-row">' +
        (list.length >= 3
          ? '<p class="hint" style="margin:0;">Limite de 3 builds atingido - apague uma antes de gerar outra.</p>'
          : '<button id="mybuild-ai-generate" class="text-action-btn" type="button">Gerar build com IA</button>') +
        '<span id="mybuild-ai-status" class="notes-status" role="status" aria-live="polite"></span>' +
      '</div>' +
    '</div>';
  }

  function updateMyBuildEvTotal() {
    var total = 0;
    for (var i = 0; i < 6; i++) {
      var el = document.getElementById("mybuild-ev-" + i);
      if (el) total += clampInt(el.value, 0, 252, 0);
    }
    var out = document.getElementById("mybuild-ev-total");
    if (!out) return;
    out.textContent = "Total de EVs: " + total + " / 510";
    var over = total > 510;
    out.style.color = over ? "var(--sem-weak)" : "var(--text-dim)";
    // Barra visual do orçamento de EVs (redesign 2026-09-18) - o mesmo dado
    // que o texto já dizia, só mais rápido de ler de relance; nunca a
    // única fonte da informação (o texto continua ao lado).
    var bar = document.getElementById("mybuild-ev-bar");
    if (bar) {
      bar.style.width = Math.min(100, (total / 510) * 100) + "%";
      bar.style.background = over ? "var(--sem-weak)" : "linear-gradient(90deg, var(--accent-2), var(--accent))";
    }
  }

  // Status preview for "Meu build" - 2026-09-09, urgent user request: after
  // filling every field, the editor showed no HP/Atk/etc. and no sense of
  // how strong the chosen moves actually are. Reads every field straight
  // from the live DOM (same idiom as updateMyBuildEvTotal above) and
  // rewrites ONLY this small block - never the whole card - so typing in
  // any field never steals focus from itself. Deliberately NOT a damage
  // calculator: no defender, no type effectiveness, no field state - just
  // "how strong is this stat / this move for THIS build", the same scope
  // boundary the boss stat calculator already draws.
  function updateMyBuildStatus(sp) {
    var out = document.getElementById("mybuild-status-preview");
    if (!out) return;
    var levelEl = document.getElementById("mybuild-level");
    var level = levelEl ? clampInt(levelEl.value, 1, 100, myBuildLevel || 50) : (myBuildLevel || 50);
    var nature = document.getElementById("mybuild-nature").value;
    var item = document.getElementById("mybuild-item").value.trim();
    var ivs = [], evs = [];
    for (var i = 0; i < 6; i++) {
      ivs.push(clampInt(document.getElementById("mybuild-iv-" + i).value, 0, 31, 31));
      evs.push(clampInt(document.getElementById("mybuild-ev-" + i).value, 0, 252, 0));
    }
    var statsHtml = '<div class="bm-stats">' + sp.b.map(function (base, i) {
      var v = calcFinalStat(base, ivs[i], evs[i], level, i, nature, item, sp.n);
      var rule = itemRuleFor(item, i, sp.n);
      var flag = rule ? '<span class="cov-flag" title="' + escapeHtml(item) + ' (x' + rule.mult + ')">*</span>' : "";
      return '<span class="bm-stat"><span class="bm-stat-label">' + STAT_LABELS_SHORT[i] + '</span><span class="mono">' + v + '</span>' + flag + '</span>';
    }).join("") + '</div>';

    var typeNames = speciesTypeNames(sp);
    var powerMult = ITEM_MOVE_POWER_MODS[item] || 1;
    var movesHtml = [0, 1, 2, 3].map(function (i) {
      var el = document.getElementById("mybuild-move-" + i);
      var name = el ? el.value : "";
      if (!name) return "";
      var mv = MOVE_BY_NAME[name];
      if (!mv) return "";
      // Precisão junto do poder (referência do Smogon: "Mastering the
      // Maison" - reduzir variância é o conselho mais repetido do artigo
      // pra sequência longa de lutas sem cura, tipo Elite Four/Campeão -
      // "avoid moves that regularly need to use inaccurate attacks"). O
      // dado já existia (mv[4], mesmo usado na tabela de golpes da Dex,
      // coluna "Acc") só nunca tinha chegado até aqui, o lugar onde o
      // jogador de fato ESCOLHE o golpe - até agora só dava pra ver a
      // precisão saindo desta tela e conferindo a Dex à parte. Mesmo
      // fallback "nunca erra" da tabela da Dex (mv[4] falsy = sem número).
      var accLabel = mv[4] ? ' &middot; precisão <span class="mono">' + mv[4] + '%</span>' : ' &middot; nunca erra';
      if (DATA.splits[mv[2]] === SPLIT_STATUS || !mv[3]) {
        return '<div class="mybuild-move-power"><b>' + escapeHtml(name) + '</b> <span style="color:var(--text-dim);">golpe de status, sem poder de ataque</span>' + accLabel + '</div>';
      }
      var typeName = TYPES[mv[1]];
      var base = mv[3];
      var stab = typeNames.indexOf(typeName) !== -1;
      var withBuffs = Math.floor(base * (stab ? 1.5 : 1) * powerMult);
      var buffParts = [];
      if (stab) buffParts.push("STAB");
      // Achado em auditoria de segurança (2026-09-13): faltava escapeHtml
      // aqui, ao contrário dos outros 2 usos de `item` nesta mesma função
      // (linhas 4012/4036). Não era explorável hoje (ITEM_MOVE_POWER_MODS
      // é um literal fixo, só bate com "Life Orb" exato) - mas é o
      // padrão certo de defesa em profundidade, caso essa tabela ganhe
      // uma entrada vinda de dado externo no futuro.
      if (powerMult !== 1) buffParts.push(escapeHtml(item));
      var buffLabel = buffParts.length ? ' &middot; com ' + buffParts.join(" + ") + ': <span class="mono">' + withBuffs + '</span>' : "";
      return '<div class="mybuild-move-power"><b>' + escapeHtml(name) + '</b> (' + escapeHtml(typeName) + ') poder base <span class="mono">' + base + '</span>' + buffLabel + accLabel + '</div>';
    }).join("");

    out.innerHTML = itemDescHtml(item) + statsHtml + buildEvNotesHtml(sp, ivs, evs, level, nature, item) +
      (movesHtml ? '<div class="mybuild-moves-power">' + movesHtml + '</div>' : "");
  }

  // "Estratégias" (pedido do usuário, 2026-09-18, referência explícita ao
  // dex do Smogon: "vários sets nomeados por Pokémon, cada um com
  // parágrafo explicando o porquê"). Diferente de "Meu build" (1 build
  // ativa, sua build de verdade pra batalha), isto é referência
  // exploratória - vários papéis possíveis, gerados sob demanda, nunca
  // persistidos no save (cache efêmero por sname, mesmo espírito de
  // generatedTeamResult/teamRecommendation - "Gerar de novo" já resolve
  // se o jogador quiser outra leitura). Cada set passa pela MESMA
  // validateAiBuild() que "Meu build" usa - nenhuma garantia a menos.
  function strategySetsHtml(sp) {
    var cached = state.strategySets[sp.sname];
    var strategyLevel = getCurrentCap() || 50;
    var cardsHtml = cached ? cached.sets.map(function (set, idx) {
      // showdownSet() quer EVs já formatado ("252 Atk / 4 SpD"), não o
      // array cru que validateAiBuild devolve - mesma conversão que
      // effectiveBuild() já faz pra "Meu build" (evsToShowdownText).
      var forDisplay = { ability: set.ability, nature: set.nature, item: set.item, moves: set.moves, evs: evsToShowdownText(set.evs) };
      return '<div class="strategy-set">' +
        '<div class="strategy-set-head"><span class="strategy-set-name">' + escapeHtml(set.name) + '</span>' +
          '<button class="text-action-btn strategy-set-copy" data-idx="' + idx + '" type="button">copiar</button></div>' +
        '<pre class="showdown-block">' + escapeHtml(showdownSet(sp, forDisplay)) + '</pre>' +
        itemDescHtml(set.item) +
        megaModeBuildNoteHtml(sp, set) +
        buildContextNotesHtml(sp, set) +
        buildEvNotesHtml(sp, [31, 31, 31, 31, 31, 31], set.evs, strategyLevel, set.nature, set.item) +
        buildSynergyHtml(sp, set) +
        buildNoteHtml(set.rationale && escapeHtml(set.rationale)) +
        '<button class="text-action-btn strategy-set-use" data-idx="' + idx + '" type="button" style="margin-top:6px;">+ Usar como meu build</button>' +
      '</div>';
    }).join("") : "";
    return '<p class="mybuild-hint">Referência do Smogon, adaptada: até 3 papéis competitivos distintos pra ' + escapeHtml(sp.n) +
      ' neste hack, cada um com golpes/item/EVs reais e o porquê. Não é "Meu build" (isso continua acima, sua build de verdade) - é leitura exploratória. Os sets ficam guardados; "Gerar de novo" pede outra leitura.</p>' +
      (cached && cached.cap ? '<p class="mybuild-hint">Gerados no level cap ' + cached.cap + (cached.geradoEm ? ' em ' + escapeHtml(cached.geradoEm.slice(0, 10).split("-").reverse().join("/")) : "") + '.</p>' : "") +
      '<button id="strategy-sets-generate" class="text-action-btn" type="button">' + (cached ? "Gerar de novo" : "Gerar sets de estratégia") + '</button> ' +
      '<span id="strategy-sets-status" class="notes-status" role="status" aria-live="polite"></span>' +
      cardsHtml;
  }
  // (Botões dos sets de Estratégias: ouvinte único do painel da ficha, junto do editor.)

  // Sets initial <select>/<input> values from saved state (kept out of the
  // HTML-string generation in myBuildEditorHtml() - easier to set .value
  // directly than to re-walk every option list marking one "selected").
  function wireMyBuildEditor(sp) {
    // Só preenche os campos com a build ativa. Digitação e botões do editor
    // são tratados por ouvintes únicos no painel da ficha (logo abaixo, fase 5
    // da refatoração) - antes eram ~20 ouvintes religados a cada abertura.
    var b = getActiveBuild(sp.sname) || { ability: "", nature: "", item: "", moves: [], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0] };
    if (!myBuildLevelIsCustom) myBuildLevel = getCurrentCap() || 50;
    var abiEl = document.getElementById("mybuild-ability");
    if (abiEl) abiEl.value = b.ability || "";
    var natEl = document.getElementById("mybuild-nature");
    if (natEl) natEl.value = b.nature || "";
    var itemEl = document.getElementById("mybuild-item");
    if (itemEl) itemEl.value = b.item || "";
    for (var i = 0; i < 4; i++) {
      var mv = document.getElementById("mybuild-move-" + i);
      if (mv) mv.value = b.moves[i] || "";
    }
    for (var j = 0; j < 6; j++) {
      var ivEl = document.getElementById("mybuild-iv-" + j);
      if (ivEl) ivEl.value = b.ivs[j];
      var evEl = document.getElementById("mybuild-ev-" + j);
      if (evEl) evEl.value = b.evs[j];
    }
    updateMyBuildEvTotal();
    updateMyBuildStatus(sp);
  }

  // O que está digitado no editor agora (a build salva só muda ao salvar).
  function lerFormularioDoEditor() {
    var moves = [];
    for (var i = 0; i < 4; i++) {
      var mv = document.getElementById("mybuild-move-" + i);
      if (mv && mv.value) moves.push(mv.value);
    }
    var ivs = [], evs = [];
    for (var j = 0; j < 6; j++) {
      ivs.push(clampInt(document.getElementById("mybuild-iv-" + j).value, 0, 31, 31));
      evs.push(clampInt(document.getElementById("mybuild-ev-" + j).value, 0, 252, 0));
    }
    return {
      ability: document.getElementById("mybuild-ability").value,
      nature: document.getElementById("mybuild-nature").value,
      item: document.getElementById("mybuild-item").value.trim(),
      moves: moves, ivs: ivs, evs: evs
    };
  }

  // Ouvintes únicos do editor "Meu build" e dos sets de Estratégias, no painel da
  // ficha. A espécie é sempre a da ficha aberta (state.selected).
  (function () {
    var painel = document.getElementById("species-detail");
    function especieAberta() { return state.selected !== null && state.selected !== undefined ? getSpeciesByX(state.selected) : null; }
    // Digitação: status ao vivo (e o total de EV) sem gravar nada.
    painel.addEventListener("input", function (e) {
      var id = e.target.id || "";
      var sp = especieAberta();
      if (!sp || id.indexOf("mybuild-") !== 0) return;
      if (/^mybuild-ev-\d$/.test(id)) updateMyBuildEvTotal();
      // "input" (not "change") - unlike the boss-level-input, this only ever
      // touches #mybuild-status-preview, never re-renders the level field
      // itself, so there's no focus-loss risk from updating on every keystroke.
      if (id === "mybuild-level") {
        myBuildLevel = clampInt(e.target.value, 1, 100, myBuildLevel);
        myBuildLevelIsCustom = true;
      }
      if (/^mybuild-(item|iv-\d|ev-\d|level)$/.test(id)) updateMyBuildStatus(sp);
    });
    painel.addEventListener("change", function (e) {
      var sp = especieAberta();
      if (sp && /^mybuild-(nature|move-\d)$/.test(e.target.id || "")) updateMyBuildStatus(sp);
    });
    painel.addEventListener("click", function (e) {
      var alvo = e.target.closest("button");
      var sp = especieAberta();
      if (!alvo || !painel.contains(alvo) || !sp) return;
      if (alvo.id === "mybuild-save") {
        setOrReplaceActiveBuild(sp.sname, lerFormularioDoEditor(), "manual");
        flashToast("Build salvo para " + sp.n);
      } else if (alvo.id === "mybuild-save-variant") {
        if (addBuildVariant(sp.sname, lerFormularioDoEditor(), "manual")) flashToast("Nova variante salva para " + sp.n);
      } else if (alvo.classList.contains("mybuild-chip")) {
        setActiveBuildIndex(sp.sname, parseInt(alvo.dataset.idx, 10));
      } else if (alvo.id === "mybuild-clear") {
        var list = getBuildList(sp.sname);
        var activeIdx = 0;
        for (var i = 0; i < list.length; i++) { if (list[i].active) { activeIdx = i; break; } }
        removeBuildIndex(sp.sname, activeIdx);
      } else if (alvo.id === "mybuild-copy") {
        var saved = getActiveBuild(sp.sname);
        if (!saved) return;
        var text = showdownSet(sp, {
          ability: saved.ability, nature: saved.nature, item: saved.item,
          evs: evsToShowdownText(saved.evs), moves: saved.moves.filter(Boolean)
        });
        copyText(text, document.getElementById("mybuild-status"), "Copiado!");
      } else if (alvo.id === "mybuild-ai-generate") {
        generateBuildWithAI(sp);
      } else if (alvo.id === "strategy-sets-generate") {
        generateStrategySets(sp);
      } else if (alvo.classList.contains("strategy-set-copy") || alvo.classList.contains("strategy-set-use")) {
        var cache = state.strategySets[sp.sname];
        var set = cache && cache.sets[parseInt(alvo.dataset.idx, 10)];
        if (!set) return;
        if (alvo.classList.contains("strategy-set-copy")) {
          copyText(showdownSet(sp, { ability: set.ability, nature: set.nature, item: set.item, moves: set.moves, evs: evsToShowdownText(set.evs) }), document.getElementById("strategy-sets-status"), "Copiado!");
        } else {
          setOrReplaceActiveBuild(sp.sname, {
            ability: set.ability, nature: set.nature, item: set.item,
            moves: set.moves.slice(0, 4), ivs: [31, 31, 31, 31, 31, 31], evs: set.evs, rationale: set.rationale, pedirPlano: true
          }, "ia");
          flashToast('"' + set.name + '" virou seu "Meu build" de ' + sp.n);
        }
      }
    });
  })();
