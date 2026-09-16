// Seção 14 (2026-09-16): três achados reais do usuário na mesma rodada.
//   1. "Está sugerindo Roost em uma build super ofensiva" - o papel de cada
//      golpe agora vem do efeito real do jogo (data/move_roles.json) e a
//      build por IA 100% ofensiva não pode gastar slot com cura.
//   2. "Quando o Poke entra no time ou na box deve considerar forma normal e
//      mega" - formFamilyOf() liga base <-> mega nos dois sentidos.
//   3. "Eu estava no lv 55 e vc evoluiu pra Selenumbra, que só evolui no 56" -
//      o dado estava certo; a auto-evolução é que era irreversível.
// Fixtures derivadas do dado em tempo de execução, e testes de função pura
// via window.__erTest sempre que possível (lição da seção 06: teste que mexe
// no estado compartilhado mente). A parte de evolução precisa mexer no
// roster de verdade - por isso esta seção roda por último.
async function section14() {
  var T = window.__erTest;
  check("ponte de teste exposta com as funções novas",
    !!T && typeof T.moveRoleOf === "function" && typeof T.formFamilyOf === "function");
  if (!T) return;

  // ---- 1. papel do golpe, a partir do efeito real ----
  check("Roost é classificado como cura", T.moveRoleOf("Roost") === "cura", T.moveRoleOf("Roost"));
  check("Swords Dance é classificado como setup", T.moveRoleOf("Swords Dance") === "setup", T.moveRoleOf("Swords Dance"));
  check("golpe de dano é 'dano', não depende da tabela de status", T.moveRoleOf("Flamethrower") === "dano", T.moveRoleOf("Flamethrower"));
  // Diferença real deste hack: Heal Bell cura 30% do HP do usuário. Decorar
  // pelo nome erraria isso.
  check("Heal Bell conta como cura (neste hack ele cura HP do usuário)", T.moveRoleOf("Heal Bell") === "cura", T.moveRoleOf("Heal Bell"));
  check("Healing Wish NÃO é cura (o usuário desmaia)", T.moveRoleOf("Healing Wish") !== "cura", T.moveRoleOf("Healing Wish"));

  // ---- 1b. trava de coerência na build por IA ----
  var cap = T.getCurrentCap();
  function movesAllowed(sp) {
    var lm = sp.lm.filter(function (p) { return cap === null || cap === undefined || p[0] <= cap; });
    return T.uniqueIds(lm.map(function (p) { return p[1]; }).concat(sp.tu)).map(function (id) { return T.MOVES[id][0]; });
  }
  var fx = null;
  for (var i = 0; i < T.SPECIES.length && !fx; i++) {
    var sp = T.SPECIES[i];
    if (!sp || !sp.ab || !sp.ab.length) continue;
    var syn = T.ABILITY_SYNERGY[sp.sname];
    if (syn && syn.length) continue; // isola a regra nova da regra de sinergia
    var mv = movesAllowed(sp);
    if (mv.indexOf("Roost") === -1) continue;
    var dano = mv.filter(function (m) { return T.moveRoleOf(m) === "dano"; });
    if (dano.length < 4) continue;
    fx = { sp: sp, dano: dano };
  }
  check("achou espécie com Roost + 4 golpes de dano pra testar a trava", !!fx);
  if (fx) {
    var abi = T.ABILITIES[T.uniqueIds(fx.sp.ab)[0]][0];
    var ofensiva = [0, 252, 0, 0, 4, 252];
    var bulky = [252, 0, 252, 0, 4, 0];
    var comRoost = [fx.dano[0], fx.dano[1], fx.dano[2], "Roost"];
    var motivo = {};
    check("build 100% ofensiva com Roost é rejeitada",
      T.validateAiBuild(fx.sp, { ability: abi, nature: "Jolly", item: "", moves: comRoost, evs: ofensiva }, motivo) === null, fx.sp.n);
    check("a rejeição cita o golpe de cura e o motivo",
      !!motivo.txt && motivo.txt.indexOf("Roost") !== -1 && motivo.txt.indexOf("ofensiva") !== -1, motivo.txt || "(sem motivo)");
    check("a mesma build com EVs de bulk é aceita (cura faz sentido em quem aguenta)",
      !!T.validateAiBuild(fx.sp, { ability: abi, nature: "Bold", item: "", moves: comRoost, evs: bulky }), fx.sp.n);
    check("build 100% ofensiva com 4 golpes de dano é aceita",
      !!T.validateAiBuild(fx.sp, { ability: abi, nature: "Jolly", item: "", moves: fx.dano.slice(0, 4), evs: ofensiva }), fx.sp.n);
  }

  // ---- bug do "Status" x "STATUS" nos tipos de ataque do chefão ----
  var vazou = null;
  (T.BOSSES || []).some(function (b) {
    var tipos = T.computeBossAttackTypes(b);
    var tiposDeDano = {};
    ["party", "insane", "hell"].forEach(function (k) {
      (b[k] || []).forEach(function (m) {
        (m.mv || []).forEach(function (n) {
          var move = T.MOVE_BY_NAME[n];
          if (move && T.moveRoleOf(n) === "dano") tiposDeDano[T.TYPES[move[1]]] = true;
        });
      });
    });
    var extra = tipos.filter(function (t) { return !tiposDeDano[t]; });
    if (extra.length) { vazou = b.name + ": " + extra.join(","); return true; }
    return false;
  });
  check("tipos de ataque do chefão vêm só de golpes de dano (golpe de status não conta mais)", !vazou, vazou || "");

  // ---- 2. família de formas ----
  var chari = T.getSpeciesBySname("SPECIES_CHARIZARD");
  var chariY = T.getSpeciesBySname("SPECIES_CHARIZARD_MEGA_Y");
  if (chari && chariY) {
    var famBase = T.formFamilyOf(chari).map(function (s) { return s.sname; });
    var famMega = T.formFamilyOf(chariY).map(function (s) { return s.sname; });
    check("da base chega nas megas (Charizard -> X, Y...)",
      famBase[0] === "SPECIES_CHARIZARD" && famBase.indexOf("SPECIES_CHARIZARD_MEGA_X") !== -1 && famBase.indexOf("SPECIES_CHARIZARD_MEGA_Y") !== -1, famBase.join(","));
    check("de uma mega no roster volta pra mesma família (Mega Y -> Charizard + megas)",
      famMega.join(",") === famBase.join(","), famMega.join(","));
  } else {
    check("Charizard e Mega Charizard Y existem no dado", false);
  }
  var semMega = T.SPECIES.find(function (s) { return s && T.formFamilyOf(s).length === 1; });
  check("espécie sem mega tem família de 1 forma só", !!semMega);
  // Melhor rank entre as formas: acha uma base cuja mega rankeia acima dela.
  var megaMelhor = null;
  T.SPECIES.some(function (s) {
    if (!s) return false;
    var fam = T.formFamilyOf(s);
    if (fam.length < 2 || fam[0].x !== s.x) return false;
    var rb = T.SPECIES_RANK[s.sname];
    var best = T.bestRankForm(s);
    if (rb && best && best.sp.x !== s.x && best.score > rb.score) { megaMelhor = { s: s, best: best }; return true; }
    return false;
  });
  check("comparação de rank usa a melhor forma da criatura (mega quando ela rende mais)",
    !!megaMelhor, megaMelhor ? megaMelhor.s.n + " -> " + megaMelhor.best.sp.n : "");

  // ---- 3. auto-evolução reversível (caso real do usuário) ----
  var volc = T.getSpeciesBySname("SPECIES_VOLCARONA_REDUX");
  var selen = T.getSpeciesBySname("SPECIES_SELENUMBRA");
  check("Volcarona Redux evolui pra Selenumbra no nível 56 no dado do jogo",
    !!volc && volc.ev.some(function (e) { return e[2] === (selen && selen.x) && Number(e[1]) === 56; }));
  if (volc && selen) {
    document.getElementById("tabs-more-toggle").click();
    await wait(20);
    document.querySelector('#tabs-more-panel [data-tab="progress"]').click();
    await wait(50);
    var diff = document.getElementById("settings-difficulty");
    var ms = document.getElementById("settings-milestone");
    function setCap(d, m) {
      diff.value = d; diff.dispatchEvent(new Event("change", { bubbles: true }));
      ms.value = String(m); ms.dispatchEvent(new Event("change", { bubbles: true }));
    }
    function boxSnames() {
      return T.state.box.map(function (x) { var s = T.getSpeciesByX(x); return s ? s.sname : null; });
    }
    // Elite + Balance Badge = cap 55 (o nível em que o usuário estava).
    setCap("elite", 5);
    await wait(30);
    T.state.box = T.state.box.filter(function (x) { return x !== volc.x && x !== selen.x; });
    T.state.box.push(volc.x);
    // Passa por um cap maior (Feather Badge, 60) - é assim que o bug acontecia.
    setCap("elite", 6);
    await pollUntil(function () { return boxSnames().indexOf("SPECIES_SELENUMBRA") !== -1; });
    check("com cap 60 o Volcarona Redux evolui pra Selenumbra",
      boxSnames().indexOf("SPECIES_SELENUMBRA") !== -1, boxSnames().join(","));
    // Volta pro cap real, 55: a evolução automática tem que ser desfeita.
    setCap("elite", 5);
    await pollUntil(function () { return boxSnames().indexOf("SPECIES_VOLCARONA_REDUX") !== -1; });
    var toast = document.getElementById("toast").textContent;
    check("voltando pro cap 55 a evolução automática é desfeita (Selenumbra -> Volcarona Redux)",
      boxSnames().indexOf("SPECIES_VOLCARONA_REDUX") !== -1 && boxSnames().indexOf("SPECIES_SELENUMBRA") === -1, boxSnames().join(","));
    check("o aviso explica que voltou e em que nível evolui", toast.indexOf("voltou") !== -1 && toast.indexOf("56") !== -1, toast);
    var saved = JSON.parse(localStorage.getItem("er_terminal_save") || "{}");
    check("o registro da evolução automática sai do save depois de desfeita",
      !!saved.autoEvolved && !saved.autoEvolved.SPECIES_SELENUMBRA, JSON.stringify(saved.autoEvolved));
    // Selenumbra adicionado À MÃO (não evoluído pelo app) nunca é desfeito.
    T.state.box = T.state.box.filter(function (x) { return x !== volc.x; });
    T.state.box.push(selen.x);
    setCap("elite", 4);
    await wait(60);
    check("Selenumbra colocado pelo jogador (não pela auto-evolução) não é desfeito ao baixar o cap",
      boxSnames().indexOf("SPECIES_SELENUMBRA") !== -1, boxSnames().join(","));
  }
}
