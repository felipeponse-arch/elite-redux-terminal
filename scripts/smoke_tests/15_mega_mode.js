// Seção 15 (2026-09-16): modo de Mega Evolução, regra de jogo passada pelo
// usuário. Temporária (padrão): volta à base ao fim de cada batalha, então a
// criatura luta nas DUAS formas e a pedra ocupa o item o tempo todo.
// Permanente: fica mega até trocar a forma fora da batalha; cada forma é uma
// escolha separada e a pedra só é necessária na primeira mega.
// Funções puras via ponte; o modo é trocado direto no state e restaurado no
// fim de cada bloco pra não vazar pra outras checagens.
async function section15() {
  await prepararRunPadrao();
  var T = window.__erTest;
  check("ponte expõe as funções do modo de mega", !!T && typeof T.battleUnitsOf === "function" && typeof T.megaStoneRuleFor === "function");
  if (!T) return;
  var modoOriginal = T.state.settings.megaMode;
  function comModo(modo, fn) {
    T.state.settings.megaMode = modo;
    try { return fn(); } finally { T.state.settings.megaMode = modoOriginal; }
  }

  check("modo padrão de um save novo é temporária", modoOriginal === "temporaria", modoOriginal);

  // ---- unidades de batalha ----
  var chari = T.getSpeciesBySname("SPECIES_CHARIZARD");
  if (chari) {
    var temp = comModo("temporaria", function () { return T.battleUnitsOf(chari); });
    var perm = comModo("permanente", function () { return T.battleUnitsOf(chari); });
    var fmt = function (units) { return units.map(function (u) { return u.forms.map(function (f) { return f.sname; }).join("+"); }).join(" | "); };
    check("temporária: base sozinha + base junto de cada mega (toda luta começa na base)",
      temp.length === 4 && temp[0].forms.length === 1 && temp.slice(1).every(function (u) { return u.forms.length === 2 && u.forms[0].sname === "SPECIES_CHARIZARD"; }), fmt(temp));
    check("permanente: cada forma é uma escolha separada",
      perm.length === 4 && perm.every(function (u) { return u.forms.length === 1; }), fmt(perm));
  } else {
    check("Charizard existe no dado", false);
  }

  // No temporário a unidade vale pelo PIOR multiplicador entre as formas.
  var achado = null;
  T.SPECIES.some(function (sp) {
    if (!sp) return false;
    var units = comModo("temporaria", function () { return T.battleUnitsOf(sp); });
    var par = units.filter(function (u) { return u.forms.length === 2; })[0];
    if (!par || par.forms[0].x !== sp.x) return false;
    return T.USABLE_TYPES.some(function (t) {
      var b = T.abilityTypeMod(t, par.forms[0]).mult;
      var m = T.abilityTypeMod(t, par.forms[1]).mult;
      if (b !== m) { achado = { par: par, t: t, b: b, m: m }; return true; }
      return false;
    });
  });
  check("achou base/mega que reagem diferente a um tipo", !!achado);
  if (achado) {
    var u = T.unitTypeMult(achado.par, achado.t);
    check("temporária: a unidade base+mega usa o pior multiplicador das duas formas",
      u === Math.max(achado.b, achado.m), achado.par.main.n + " vs " + achado.t + ": base " + achado.b + ", mega " + achado.m + ", unidade " + u);
  }

  // ---- regra da pedra ----
  var megaTal = T.getSpeciesBySname("SPECIES_TALONFLAME_MEGA");
  var baseTal = T.getSpeciesBySname("SPECIES_TALONFLAME");
  if (megaTal && baseTal) {
    var regraTemp = comModo("temporaria", function () { return T.megaStoneRuleFor(megaTal); });
    check("temporária: forma mega exige a própria pedra", !!regraTemp && regraTemp.stones.indexOf("Talonflameite") !== -1, JSON.stringify(regraTemp && regraTemp.stones));
    check("permanente: sem regra de pedra (o slot fica livre depois da 1a mega)",
      comModo("permanente", function () { return T.megaStoneRuleFor(megaTal); }) === null);
    check("forma base nunca tem regra de pedra (pode lutar sem mega-evoluir)",
      comModo("temporaria", function () { return T.megaStoneRuleFor(baseTal); }) === null);
  }

  // Build por IA de uma mega com pedra única: item errado é corrigido pra pedra
  // no temporário e mantido no permanente.
  var cap = T.getCurrentCap();
  var fx = null;
  T.SPECIES.some(function (sp) {
    if (!sp || !sp.ab || !sp.ab.length) return false;
    var stones = T.stonesOf(sp);
    if (stones.length !== 1) return false;
    var syn = T.ABILITY_SYNERGY[sp.sname];
    if (syn && syn.length) return false;
    var lm = sp.lm.filter(function (p) { return cap === null || cap === undefined || p[0] <= cap; });
    var dano = T.uniqueIds(lm.map(function (p) { return p[1]; }).concat(sp.tu)).map(function (id) { return T.MOVES[id][0]; })
      .filter(function (m) { return T.moveRoleOf(m) === "dano"; });
    if (dano.length < 4) return false;
    fx = { sp: sp, stone: stones[0], moves: dano.slice(0, 4), abi: T.ABILITIES[T.uniqueIds(sp.ab)[0]][0] };
    return true;
  });
  check("achou forma mega com pedra única pra testar a build por IA", !!fx);
  if (fx) {
    var raw = { ability: fx.abi, nature: "Bold", item: "Life Orb", moves: fx.moves, evs: [252, 0, 252, 0, 4, 0] };
    var vTemp = comModo("temporaria", function () { return T.validateAiBuild(fx.sp, raw); });
    var vPerm = comModo("permanente", function () { return T.validateAiBuild(fx.sp, raw); });
    check("temporária: build por IA de mega com outro item tem o item trocado pela pedra",
      !!vTemp && vTemp.item === fx.stone, fx.sp.n + " -> " + (vTemp && vTemp.item));
    check("permanente: o item escolhido é mantido",
      !!vPerm && vPerm.item === "Life Orb", fx.sp.n + " -> " + (vPerm && vPerm.item));
  }

  // ---- aviso em build curada escrita pro modo permanente ----
  var aero = T.getSpeciesBySname("SPECIES_AERODACTYL_MEGA");
  var aeroBuild = T.BUILDS.SPECIES_AERODACTYL_MEGA;
  if (aero && aeroBuild && aeroBuild.item !== "Aerodactylite") {
    var notaTemp = comModo("temporaria", function () { return T.megaModeBuildNoteHtml(aero, aeroBuild); });
    var notaPerm = comModo("permanente", function () { return T.megaModeBuildNoteHtml(aero, aeroBuild); });
    check("temporária: build curada de mega sem a pedra ganha aviso explicando o modo",
      notaTemp.indexOf("Aerodactylite") !== -1 && notaTemp.indexOf("permanente") !== -1, notaTemp.replace(/<[^>]+>/g, ""));
    check("permanente: a mesma build não ganha aviso", notaPerm === "");
  } else {
    check("fixture Mega Aerodactyl curada com item fora da pedra", false, JSON.stringify(aeroBuild));
  }

  // ---- rótulo de evolução por gênero (item D2, 2026-09-16) ----
  // indexOf("MALE") também casava com "EVO_LEVEL_FEMALE": evolução só de
  // fêmea aparecia com ♂. Fixtures achadas no dado, não nomes chumbados.
  var femea = null, macho = null;
  T.SPECIES.some(function (sp) {
    (sp && sp.ev || []).forEach(function (ev) {
      var txt = T.evoConditionText(ev);
      if (!femea && /FEMALE$/.test(T.EVOKINDS[ev[0]])) femea = { sp: sp, txt: txt };
      if (!macho && /_MALE$/.test(T.EVOKINDS[ev[0]])) macho = { sp: sp, txt: txt };
    });
    return femea && macho;
  });
  check("evolução só de fêmea mostra ♀ (não ♂)", !!femea && femea.txt.indexOf("♀") !== -1 && femea.txt.indexOf("♂") === -1, femea ? femea.sp.n + ": " + femea.txt : "sem fixture");
  check("evolução só de macho mostra ♂", !!macho && macho.txt.indexOf("♂") !== -1, macho ? macho.sp.n + ": " + macho.txt : "sem fixture");

  // ---- configuração na tela de Progresso ----
  var sel = document.getElementById("settings-mega-mode");
  check("tela de Progresso tem o seletor de modo de mega", !!sel);
  if (sel) {
    sel.value = "permanente";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    await pollUntil(function () { return (JSON.parse(localStorage.getItem("er_terminal_save") || "{}").settings || {}).megaMode === "permanente"; });
    var s = JSON.parse(localStorage.getItem("er_terminal_save") || "{}").settings || {};
    check("trocar o modo salva no save", s.megaMode === "permanente", JSON.stringify(s));
    sel.value = modoOriginal;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(30);
  }
}
