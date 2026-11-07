  // Painel da build no cartão do Meu Time (fatia 2b, 07/11/2026). Só desenha dados que já existem:
  // habilidade/inatas, item, natureza, EVs, golpes, origem, avisos, sinergia. O texto no formato
  // Showdown saiu do cartão (showdownSet continua na Dex, no editor e na cópia do chefão).
  var EV_ROTULOS = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
  var CATEGORIA_ROTULO = { fisico: "Físico", especial: "Especial", status: "Status" };
  var CATEGORIA_ICONE = {
    fisico: '<polygon points="8,1 9.8,5.2 14.5,4 11.6,7.8 15,11 10.4,10.6 8,15 5.6,10.6 1,11 4.4,7.8 1.5,4 6.2,5.2"/>',
    especial: '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8" cy="8" r="2.4"/>',
    status: '<path d="M2 11 C5 4 11 12 14 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  };
  function categoriaDoGolpe(mv) {
    var split = DATA.splits[mv[2]] || "";
    if (split === SPLIT_STATUS) return "status";
    return /^spec/i.test(split) ? "especial" : "fisico";
  }
  function evsDaBuild(build) {
    var v = [0, 0, 0, 0, 0, 0];
    if (Array.isArray(build.evs)) { build.evs.slice(0, 6).forEach(function (n, i) { v[i] = Number(n) || 0; }); return v; }
    String(build.evs || "").replace(/(\d+)\s*(HP|Atk|Def|SpA|SpD|Spe)\b/g, function (_, n, s) { v[EV_ROTULOS.indexOf(s)] = Number(n); return ""; });
    return v;
  }
  function evsBarrasHtml(build) {
    if (!build.evs || (Array.isArray(build.evs) && !build.evs.length)) return "";
    var v = evsDaBuild(build);
    return '<div class="bp-evs" role="group" aria-label="EVs da build">' + EV_ROTULOS.map(function (r, i) {
      return '<div class="bp-ev' + (v[i] ? ' bp-ev-on' : '') + '" data-stat="' + r + '"><span class="bp-ev-r">' + r + '</span>' +
        '<span class="bp-ev-trilho"><i style="width:' + Math.min(100, Math.round(v[i] / 252 * 100)) + '%"></i></span><span class="bp-ev-n">' + v[i] + '</span></div>';
    }).join("") + '</div>';
  }
  function golpesBuildHtml(build) {
    var golpes = (build.moves || []).filter(Boolean);
    if (!golpes.length) return "";
    return '<ul class="cm-golpes" aria-label="Golpes da build">' + golpes.map(function (n) {
      var nome = stripNote(n), mv = MOVE_BY_NAME[nome];
      if (!mv) return '<li class="cm-golpe"><span class="cm-g-nome">' + escapeHtml(nome) + '</span></li>';
      var tipo = TYPES[mv[1]], cat = categoriaDoGolpe(mv);
      return '<li class="cm-golpe tipo-' + tipo + '" title="' + tipo + " · " + CATEGORIA_ROTULO[cat] + '">' +
        '<svg class="cm-g-cat" viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="currentColor">' + CATEGORIA_ICONE[cat] + '</svg>' +
        '<span class="cm-g-nome">' + escapeHtml(nome) + '</span>' +
        '<span class="cm-g-tipo">' + tipo + ' · ' + CATEGORIA_ROTULO[cat] + '</span></li>';
    }).join("") + '</ul>';
  }
  function habilidadesBuildHtml(sp, build) {
    var escolhida = stripNote(build.ability);
    var chips = habilidadesEscolhiveis(sp).map(function (n) {
      return '<span class="bp-chip' + (n === escolhida ? ' bp-chip-sel' : '') + '"' + (n === escolhida ? ' title="Habilidade desta build"' : '') + '>' + escapeHtml(n) + '</span>';
    });
    if (escolhida && habilidadesEscolhiveis(sp).indexOf(escolhida) === -1) chips.unshift('<span class="bp-chip bp-chip-sel" title="Habilidade desta build">' + escapeHtml(escolhida) + '</span>');
    var inatas = sp.inn.map(function (id) { return '<span class="bp-chip bp-chip-inn" title="Innate (sempre ativa)">' + escapeHtml(ABILITIES[id][0]) + '</span>'; });
    return '<div class="bp-abis"><span class="bp-rot">Hab.</span>' + chips.join("") + '</div>' +
      (inatas.length ? '<div class="bp-abis"><span class="bp-rot">Innate</span>' + inatas.join("") + '</div>' : "");
  }
  function itemBuildHtml(build) {
    var item = stripNote(build.item), nat = stripNote(build.nature);
    if (!item && !nat) return "";
    var desc = item && (ITEM_PT[item] || ITEM_DESC[item]);
    return '<div class="bp-item">' +
      (item ? '<span class="bp-chip bp-chip-item"><span class="bp-rot">Item</span> ' + escapeHtml(item) + '</span>' : "") +
      (nat ? '<span class="bp-chip"><span class="bp-rot">Natureza</span> ' + escapeHtml(nat) + '</span>' : "") + '</div>' +
      (desc ? '<div class="ts-item-desc" title="' + escapeHtml(desc) + '"><b>' + escapeHtml(item) + ':</b> ' + escapeHtml(desc) +
        '</div>' : "");
  }
  // Avisos "Não serve agora": linha enxuta (ícone + 2 linhas), o detalhe abre por toque.
  function avisoEnxutoHtml(sp, build) {
    var avisos = avisosDaBuild(sp, build);
    if (!avisos.length) return "";
    return '<details class="aviso-build bp-alerta" role="note"><summary><span class="bp-alerta-ico" aria-hidden="true">⚠</span>' +
      '<span class="bp-alerta-txt"><b>Não serve agora</b><span class="bp-alerta-resumo"> · ' + escapeHtml(avisos[0].texto) + '</span></span>' +
      (avisos.length > 1 ? '<span class="bp-alerta-mais">+' + (avisos.length - 1) + '</span>' : "") + '</summary><ul>' +
      avisos.map(function (a) { return '<li data-aviso="' + a.tipo + '">' + escapeHtml(a.texto) + '</li>'; }).join("") + '</ul></details>';
  }
  function painelDaBuildHtml(sp, build) {
    var onde = build.item && ondeAcharItemTexto(stripNote(build.item));
    var descItem = build.item && (ITEM_PT[stripNote(build.item)] || ITEM_DESC[stripNote(build.item)]);
    var notas = (descItem && descItem.length > 90 ? '<div class="ts-build-note">Efeito de ' + escapeHtml(stripNote(build.item)) + ': ' + escapeHtml(descItem) + '</div>' : "") + planoDaBuildHtml(build) + megaModeBuildNoteHtml(sp, build) +
      (build.note ? '<div class="ts-nota-fonte">' + buildNoteHtml(escapeHtml(build.note)) + '</div>' : "") +
      (onde ? '<div class="ts-build-note">Onde achar o item: ' + escapeHtml(onde) + '</div>' : "");
    return '<div class="ts-build bp">' +
      '<div class="ts-build-head"><span class="bp-titulo"><span class="ts-build-label">' + rotuloDaBuild(build) + '</span></span>' + seloDaBuildHtml(build) + '</div>' +
      habilidadesBuildHtml(sp, build) + itemBuildHtml(build) + evsBarrasHtml(build) + golpesBuildHtml(build) +
      buildSynergyHtml(sp, build) + avisoEnxutoHtml(sp, build) +
      (notas ? '<details class="bp-mais"><summary>Onde achar e notas da build</summary><div class="bp-mais-corpo">' + notas + '</div></details>' : "") +
      '</div>';
  }
  function semBuildHtml() {
    return '<div class="ts-build ts-build-empty bp-vazio"><span class="bp-vazio-txt">Sem build salva ainda</span>' +
      '<button type="button" class="ts-montar-build add-team-btn" title="Monta o melhor time pelo simulador de duelo do app, com a build de cada um">Montar meu melhor time</button></div>';
  }
  function papelChipsHtml(sp) {
    var role = SPECIES_ROLE[sp.sname];
    if (!role) return "";
    var chips = (role.roles || []).map(function (r) { return [r, ROLE_LABEL_PT[r] || r]; });
    if (role.split) chips.push([role.split, SPLIT_LABEL_PT[role.split] || role.split]);
    if (!chips.length) return "";
    return '<div class="cm-papeis">' + chips.map(function (c) {
      return '<button type="button" class="cm-papel cm-foco" data-foco="' + c[0] + '" title="Papel calculado por ataque, bulk e velocidade (não avalia sinergia com o time)">' + escapeHtml(c[1]) + '</button>';
    }).join("") + '</div>';
  }
