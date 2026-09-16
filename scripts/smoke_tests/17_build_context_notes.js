// Seção 17 (2026-09-16, itens P2 e P3 da pauta técnica, pedidos do
// Playtester de Build): a build diz se "aguenta a minha run, NESTE ponto".
//   P2 - golpe aprendido só por nível acima do level cap atual (informativo);
//   P3 - golpe que só funciona em batalha dupla: informativo nas curadas,
//        rejeitado na build por IA.
// Funções puras via ponte; o level cap é trocado direto no state e restaurado.
async function section17() {
  var T = window.__erTest;
  if (!T) { check("ponte de teste disponível", false); return; }

  // ---- papel "dupla", conferido pela descrição real ----
  check("Helping Hand e Follow Me são golpes só de batalha dupla",
    T.moveRoleOf("Helping Hand") === "dupla" && T.moveRoleOf("Follow Me") === "dupla");
  check("Protect, Aromatic Mist e Gear Up NÃO são 'dupla' (neste hack afetam o próprio usuário)",
    ["Protect", "Aromatic Mist", "Gear Up"].every(function (m) { return T.moveRoleOf(m) !== "dupla"; }),
    ["Protect", "Aromatic Mist", "Gear Up"].map(T.moveRoleOf).join(","));

  // ---- P3 na build por IA: rejeitada ----
  var cap = T.getCurrentCap();
  var fx = null;
  T.SPECIES.some(function (sp) {
    if (!sp || !sp.ab || !sp.ab.length || (T.ABILITY_SYNERGY[sp.sname] || []).length) return false;
    var lm = sp.lm.filter(function (p) { return cap === null || cap === undefined || p[0] <= cap; });
    var mv = T.uniqueIds(lm.map(function (p) { return p[1]; }).concat(sp.tu)).map(function (id) { return T.MOVES[id][0]; });
    var dupla = mv.filter(function (m) { return T.moveRoleOf(m) === "dupla"; })[0];
    var dano = mv.filter(function (m) { return T.moveRoleOf(m) === "dano"; });
    if (!dupla || dano.length < 3) return false;
    fx = { sp: sp, dupla: dupla, dano: dano, abi: T.ABILITIES[T.uniqueIds(sp.ab)[0]][0] };
    return true;
  });
  if (achou("espécie com golpe de dupla + 3 de dano no movepool", fx)) {
    var motivo = {};
    var r = T.validateAiBuild(fx.sp, { ability: fx.abi, nature: "Bold", item: "", moves: [fx.dano[0], fx.dano[1], fx.dano[2], fx.dupla], evs: [252, 0, 252, 0, 4, 0] }, motivo);
    check("build por IA com golpe só de dupla é rejeitada, citando o golpe", r === null && (motivo.txt || "").indexOf(fx.dupla) !== -1, fx.sp.n + ": " + (motivo.txt || ""));
  }

  // ---- P3 na build curada: só observação ----
  var curadaDupla = null;
  Object.keys(T.BUILDS).some(function (sn) {
    var b = T.BUILDS[sn];
    if (!b.moves.some(function (m) { return T.moveRoleOf(m) === "dupla"; })) return false;
    curadaDupla = { sp: T.getSpeciesBySname(sn), b: b };
    return !!curadaDupla.sp;
  });
  if (achou("build curada com golpe só de dupla", curadaDupla)) {
    var notaDupla = T.buildContextNotesHtml(curadaDupla.sp, curadaDupla.b);
    check("build curada com golpe de dupla ganha a observação (não é removida)",
      notaDupla.indexOf("batalha dupla") !== -1, curadaDupla.sp.n + ": " + notaDupla.replace(/<[^>]+>/g, ""));
  }

  // ---- P2: golpe acima do level cap ----
  var settingsOriginais = { difficulty: T.state.settings.difficulty, milestone: T.state.settings.milestone };
  try {
    T.state.settings.difficulty = "elite";
    T.state.settings.milestone = 0;
    var capBaixo = T.getCurrentCap();
    var acima = null;
    Object.keys(T.BUILDS).some(function (sn) {
      var sp = T.getSpeciesBySname(sn);
      if (!sp) return false;
      var b = T.BUILDS[sn];
      var golpe = b.moves.filter(function (m) {
        var entrada = sp.lm.filter(function (p) { return T.MOVES[p[1]][0] === m; });
        var tutor = sp.tu.some(function (tid) { return T.MOVES[tid][0] === m; });
        return !tutor && entrada.length && Math.min.apply(null, entrada.map(function (p) { return p[0]; })) > capBaixo;
      })[0];
      if (golpe) { acima = { sp: sp, b: b, golpe: golpe }; return true; }
      return false;
    });
    if (achou("build curada com golpe acima do cap " + capBaixo, acima)) {
      var nota = T.buildContextNotesHtml(acima.sp, acima.b);
      check("build curada mostra o golpe acima do level cap e o nível em que aprende",
        nota.indexOf("Acima do seu level cap") !== -1 && nota.indexOf(acima.golpe) !== -1 && nota.indexOf("nível") !== -1,
        acima.sp.n + ": " + nota.replace(/<[^>]+>/g, ""));
      // Sem level cap (Campeão/Alto Comando) não existe "acima do cap".
      T.state.settings.milestone = 9;
      var semCap = T.buildContextNotesHtml(acima.sp, acima.b);
      check("sem level cap (Campeão), a observação de golpe acima do cap some", semCap.indexOf("Acima do seu level cap") === -1, semCap.replace(/<[^>]+>/g, ""));
    }
  } finally {
    T.state.settings.difficulty = settingsOriginais.difficulty;
    T.state.settings.milestone = settingsOriginais.milestone;
  }

  // ---- D3: uma fonte só pro movepool liberado ----
  // O seletor de golpes do "Meu build" tem que oferecer exatamente o que
  // availableMovesFor() diz - é a mesma lista que a validação da IA aceita.
  // Precisa de um level cap ativo pra existir golpe travado - configura aqui,
  // pelo seletor de verdade, em vez de herdar o cap da seção 14 (Q1).
  document.getElementById("tabs-more-toggle").click();
  await wait(20);
  document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
  await wait(50);
  var msSelD3 = document.getElementById("settings-milestone");
  var msOriginalD3 = msSelD3.value;
  msSelD3.value = "2";
  msSelD3.dispatchEvent(new Event("change", { bubbles: true }));
  await wait(50);
  var spD3 = T.SPECIES.find(function (sp) {
    if (!sp) return false;
    var av = T.availableMovesFor(sp);
    return av.lockedCount > 0 && sp.tu.length > 0 && av.ids.length >= 4;
  });
  if (achou("espécie com golpe travado pelo cap e golpe de tutor", spD3)) {
    document.querySelector('.tab-btn[data-tab="dex"]').click();
    await wait(30);
    setSearch(spD3.n);
    await wait(120);
    var rowD3 = document.querySelector('#species-list .species-row[data-x="' + spD3.x + '"]');
    if (achou("linha de " + spD3.n + " na busca", rowD3)) {
      rowD3.click();
      await wait(60);
      var sel = document.getElementById("mybuild-move-0");
      if (achou("seletor de golpe do Meu build", sel)) {
        var noSeletor = [].slice.call(sel.options).map(function (o) { return o.value; }).filter(Boolean).sort();
        var esperado = T.availableMovesFor(spD3).names.slice().sort();
        check("seletor do Meu build oferece exatamente os golpes de availableMovesFor()",
          JSON.stringify(noSeletor) === JSON.stringify(esperado), spD3.n + ": seletor " + noSeletor.length + ", função " + esperado.length);
        check("golpe travado pelo cap fica fora e tutor fica dentro",
          spD3.tu.every(function (id) { return noSeletor.indexOf(T.MOVES[id][0]) !== -1; }), spD3.n);
      }
    }
  }
  msSelD3.value = msOriginalD3;
  msSelD3.dispatchEvent(new Event("change", { bubbles: true }));
  await wait(30);
}
