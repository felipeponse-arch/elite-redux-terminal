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
      return '<button type="button" class="cm-papel cm-foco" data-x="' + sp.x + '" data-foco="' + c[0] + '" aria-pressed="' + (sugestaoDoCartao[sp.x] && sugestaoDoCartao[sp.x].foco === c[0] ? "true" : "false") + '" title="Papel calculado por ataque, bulk e velocidade (não avalia sinergia com o time)">' + escapeHtml(c[1]) + '</button>';
    }).join("") + '</div>';
  }

  // ---- Sugestão do Motor por chip (fatia 2c, 07/11/2026): buildFocadaDoMotor desenha, nada é aplicado sozinho ----
  // Estado só de tela (qual chip está aberto em cada cartão); "Usar esta build" grava pelo mesmo caminho do "Ficar com este time"
  // (gravarSugestoesDoMotor: origem "Sugestão do app", build do jogador nunca é apagada, confirmação se passar por cima da ativa).
  var sugestaoDoCartao = {};
  function sugestaoDoCartaoVale(x) {
    var s = sugestaoDoCartao[x];
    if (s && s.etapa !== state.settings.milestone) { delete sugestaoDoCartao[x]; s = null; }
    return s;
  }
  function alternarFocoDoCartao(x, foco) {
    var sp = getSpeciesByX(x), atual = sugestaoDoCartaoVale(x);
    if (!sp) return;
    if (atual && atual.foco === foco) { delete sugestaoDoCartao[x]; renderTeam(); return; }
    var r;
    try { var proxima = getRemainingBossEntries()[0]; r = buildFocadaDoMotor(sp.sname, foco, proxima ? { luta: proxima.name } : undefined); } catch (err) { r = { ok: false, motivo: "não foi possível calcular agora" }; }
    sugestaoDoCartao[x] = { foco: foco, r: r, etapa: state.settings.milestone };
    renderTeam();
    var chip = document.querySelector('#team-slots .cm-foco[data-x="' + x + '"][data-foco="' + foco + '"]');
    if (chip) chip.focus();
  }
  function membroDaSugestao(sp, r) {
    return { sname: sp.sname, nome: sp.n, build: { ability: r.build.habilidade, item: r.build.item, nature: r.build.natureza, evs: r.build.evs, moves: r.build.golpes } };
  }
  function usarSugestaoDoCartao(x) {
    var s = sugestaoDoCartaoVale(x), sp = getSpeciesByX(x);
    if (!s || !s.r.ok || !sp) return;
    var membro = membroDaSugestao(sp, s.r), plano = planoDeGravarSugestoes([membro])[0];
    function gravar() {
      var r = { gravadas: 0, semVaga: [] };
      delete sugestaoDoCartao[x];
      acao(["builds", "resumo", "time", "chefao", "ficha:" + sp.sname], function () { r = gravarSugestoesDoMotor([membro]); return r.gravadas > 0; });
      flashToast(r.gravadas ? "Build " + s.r.rotulo + " de " + sp.n + " guardada como \"" + SUGESTAO_ROTULO + "\"" : "Sem vaga: " + sp.n + " já tem 3 builds suas");
    }
    if (plano.acao === "sem-vaga") { flashToast("Sem vaga: " + sp.n + " já tem 3 builds suas"); return; }
    if (plano.confirmar) {
      openConfirmModal("Você já tem build própria", "A build que você montou para " + sp.n + " está ativa. A sugestão entra no lugar dela como ativa; a sua fica guardada como variante.", "Usar esta build", gravar);
      return;
    }
    gravar();
  }
  function sugestaoDoCartaoHtml(sp) {
    var s = sugestaoDoCartaoVale(sp.x);
    var id = 'id="build-sugerida-' + sp.x + '" aria-live="polite"';
    if (!s) return '<div class="build-sugerida" ' + id + ' hidden></div>';
    var fechar = '<button type="button" class="bs-fechar" data-x="' + sp.x + '">Fechar</button>';
    var r = s.r;
    if (!r.ok) return '<div class="build-sugerida" ' + id + '><p class="bs-msg" role="status">' + escapeHtml(r.motivo || "sem sugestão") + '</p><div class="bs-acoes">' + fechar + '</div></div>';
    var build = { ability: r.build.habilidade, item: r.build.item, nature: r.build.natureza, evs: r.build.evs, moves: r.build.golpes, origem: "sugestao" };
    var porque = (r.motivos || []).concat(r.avisos || []);
    return '<div class="build-sugerida" ' + id + '>' +
      '<div class="bs-cab"><span class="bs-foco">' + escapeHtml(ROTULO_FOCO_BUILD[r.foco] || r.foco) + '</span>' +
        '<span class="bs-selo bs-selo-' + (r.estimado ? 'estimada' : 'medida') + '" title="' + (r.estimado ? 'Não medida pelo simulador de duelo' : 'Medida pelo simulador de duelo') + '">' + (r.estimado ? 'estimada' : 'medida') + '</span>' +
        (typeof r.nota === "number" ? '<span class="bs-nota">nota ' + r.nota + '</span>' : '') + '</div>' +
      (r.contraChefao ? '<p class="bs-chefao bs-chefao-' + r.contraChefao.resultado + '">' + escapeHtml(r.contraChefao.motivo) + '</p>' : '') +
      painelDaBuildHtml(sp, build) +
      (porque.length ? '<details class="bp-mais"><summary>Por que esta build</summary><ul class="bs-motivos">' + porque.map(function (m) { return '<li>' + escapeHtml(m) + '</li>'; }).join("") + '</ul></details>' : '') +
      '<div class="bs-acoes"><button type="button" class="bs-usar add-team-btn" data-x="' + sp.x + '">Usar esta build</button>' + fechar + '</div></div>';
  }
