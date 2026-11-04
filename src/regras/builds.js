  // ===== src/regras/builds.js =====
  // Build mostrada (effectiveBuild: salva > herdada da base pela Mega > curada do
  // estilo do time), entrada salva de uma build, formato Showdown e o que o resto
  // do time já usa (itens, golpes, papéis).
  // Colado dentro do <script> principal do app por scripts/build.mjs (marcador
  // @regras builds.js), no mesmo escopo do resto do código. Só lógica: nada aqui
  // lê ou desenha a página - testável no Node (tests/unit). Movido do template na
  // fase 3 da refatoração (2026-09-24), sem mudar o comportamento.

  // Used by the two pre-existing "+ Usar como meu build" quick-copy buttons
  // (boss party card, build-history/boss-reference entries) - their
  // established behavior is "replace whatever's currently showing", not
  // "add a new variant", so they keep working exactly as before even with
  // the list-based storage underneath.
  // Único lugar que monta a entrada salva de uma build (antes eram 2 cópias
  // campo a campo, e um campo novo - o plano de golpes - sumia numa delas).
  var BUILD_SOURCES = ["ia", "manual", "curada", "sugestao"]; // "sugestao" = "Sugestão do app" (Meu Time, 21/10/2026)

  // Plano de golpes: o que veio com a build; senão, o da build que ela substitui
  // (editar a build à mão mantém as trocas dos golpes que continuam nela). Build
  // sem plano que ainda tem golpe por liberar fica marcada pra revisão
  // automática, que pede só o plano à IA (gerarPlanoParaBuild).
  function entradaDeBuild(build, source, sname, substituida) {
    var e = {
      ability: build.ability, nature: build.nature, item: build.item, moves: build.moves, ivs: build.ivs, evs: build.evs,
      source: BUILD_SOURCES.indexOf(source) !== -1 ? source : "manual", active: true, savedAt: new Date().toISOString(),
      rationale: build.rationale || ""
    };
    var plano = (build.plano && Object.keys(build.plano).length) ? build.plano
      : (substituida && substituida.plano ? planoSaneado(substituida.plano, build.moves || []) : null);
    if (plano) e.plano = plano;
    if (build.ponte) e.ponte = true; // golpe-ponte da curada (avisosDaBuild confere o item dela)
    // Plano já perguntado à IA (mesmo que a resposta tenha sido "nenhuma troca"):
    // editar natureza/EV/item sem mexer nos golpes não pede de novo.
    var mesmosGolpes = !!substituida && (substituida.moves || []).slice().sort().join("|") === (build.moves || []).slice().sort().join("|");
    if (build.planoConsultado || (mesmosGolpes && substituida.planoConsultado)) e.planoConsultado = true;
    if (build.feitaPara) e.feitaPara = { chefao: build.feitaPara.chefao, cap: build.feitaPara.cap }; // botão do chefão (2026-09-30)
    if (!plano && !e.planoConsultado && (e.source !== "ia" || build.pedirPlano)) {
      var sp = getSpeciesBySname(sname);
      if (sp && golpesFuturosDe(sp, getCurrentCap()).length) { e.revisar = "plano"; e.tentativasRevisao = 0; }
    }
    return e;
  }

  // ---- Smogon / Pokemon Showdown set format ----
  // builds.json keeps human-readable notes in parentheses ("Tough Claws (única
  // opção)"); Showdown wants the bare value, so strip them here rather than
  // duplicating every field in the data file.
  function stripNote(s) {
    return String(s || "").replace(/\s*\(.*?\)\s*$/, "").trim();
  }

  // Showdown writes alternate forms hyphenated: "Charizard-Mega-X".
  function showdownName(name) {
    return String(name || "").trim().replace(/\s+/g, "-");
  }

  function showdownSet(sp, build) {
    if (!build) return "";
    var lines = [];
    var item = stripNote(build.item);
    lines.push(showdownName(sp.n) + (item ? " @ " + item : ""));
    var ability = stripNote(build.ability);
    if (ability) lines.push("Ability: " + ability);
    if (build.evs) lines.push("EVs: " + build.evs);
    var nature = stripNote(build.nature);
    if (nature) lines.push(nature + " Nature");
    (build.moves || []).forEach(function (mv) { lines.push("- " + mv); });
    return lines.join("\n");
  }

  // Inverso de evsTextoParaArray (plano_build.js): [0,252,0,0,4,252] ->
  // "252 Atk / 4 SpD / 252 Spe". Os dois usam os mesmos rótulos (ROTULOS_EV) -
  // antes havia uma cópia de cada, com uma lista de rótulos própria.
  function evsToShowdownText(evs) {
    var parts = [];
    for (var i = 0; i < 6; i++) { if (evs[i] > 0) parts.push(evs[i] + " " + ROTULOS_EV[i]); }
    return parts.join(" / ");
  }

  // Itens já em uso por OUTROS membros do time. Nasceu de um pedido de
  // 2026-09-12 ("nenhum outro pode ter a build montada com life orb") e deixou
  // de ser regra em 2026-09-27, a pedido do mesmo usuário: item PODE repetir no
  // time. Em 2026-09-29 voltou como limite (no máximo 2 iguais) - ver
  // itensEmUsoComQuem logo abaixo, que diz também QUEM segura. Olha só a build ATIVA
  // de cada outro membro (effectiveBuild - a mesma noção de "a build" que
  // o resto do app usa, não as até 3 variantes salvas), e só membros do
  // TIME (não a caixa inteira) - é o item já em uso NA PRÓXIMA LUTA, não
  // um item que só existe guardado em algum lugar.
  function teamItemsInUse(excludeX) {
    var items = [];
    state.team.forEach(function (x) {
      if (x === excludeX) return;
      var otherSp = getSpeciesByX(x);
      if (!otherSp) return;
      var b = effectiveBuild(otherSp);
      if (b && b.item) items.push(b.item);
    });
    return items;
  }

  // Golpes já em uso por OUTROS membros do time (achado real do usuário,
  // 2026-09-20: "em grande maioria eles usam sempre o mesmo move... o time
  // fica repetitivo, a estratégia não tem variedade") - mesmo raciocínio
  // de teamItemsInUse acima, aplicado a golpe. Diferença importante: item
  // repetido é sempre desperdício (só um Pokémon usa por vez), mas golpe
  // repetido às vezes É a escolha certa (o mesmo STAB forte pode ser a
  // melhor opção pra duas espécies do mesmo tipo) - por isso isto vira
  // preferência forte no prompt, não proibição, e não ganha a mesma trava
  // de "defesa em profundidade" pós-validação que os itens têm (não dá pra
  // simplesmente apagar 1 dos 4 golpes de uma build sem deixá-la quebrada,
  // ao contrário do item, que tem "vazio" como fallback válido).
  // Lote de builds em andamento (2026-09-30, revisão): no "Montar time completo" e
  // no botão do chefão, quem ainda vai ganhar build nova não conta como "em uso" -
  // a build antiga dele vai sair. Antes a trava de 2 itens iguais rejeitava item
  // válido por causa dessas builds velhas e gastava mais uma chamada de IA.
  var buildsPendentesNoLote = [];
  function comecarLoteDeBuilds(xs) { buildsPendentesNoLote = xs.slice(); }
  function concluirBuildDoLote(x) { buildsPendentesNoLote = buildsPendentesNoLote.filter(function (p) { return p !== x; }); }
  function encerrarLoteDeBuilds() { buildsPendentesNoLote = []; }
  function contaNoTime(x, excludeX) { return x !== excludeX && buildsPendentesNoLote.indexOf(x) === -1; }

  function teamMovesInUse(excludeX) {
    var moves = [];
    state.team.forEach(function (x) {
      if (!contaNoTime(x, excludeX)) return;
      var otherSp = getSpeciesByX(x);
      if (!otherSp) return;
      var b = effectiveBuild(otherSp);
      if (b && b.moves) moves = moves.concat(b.moves);
    });
    return moves;
  }

  // Papéis já cobertos por OUTROS membros do time (achado real, 2026-09-22:
  // a correção de golpe repetido não bastou - "a estratégia não tem
  // variedade" também vem da IA nunca saber que papel os outros membros já
  // cumprem, decidindo o papel de cada Pokémon isolado, então um time podia
  // sair com 6 atacantes puros mesmo com golpes todos diferentes). Usa
  // SPECIES_ROLE (mesmo dado real já mostrado na linha "Papel" da ficha -
  // ver roleTagsHtml), não uma heurística nova - papel aqui é sobre o perfil
  // NATURAL da espécie (ataque/bulk/velocidade + movepool), não o que a IA
  // escolheu numa build anterior. Ainda mais "preferência", nunca proibição,
  // que golpe: times de verdade às vezes precisam de 2+ sweepers de
  // propósito - o objetivo é a IA PESAR isso, não ser forçada a evitar.
  // Itens já segurados por OUTROS membros do time, com quem segura cada um
  // (2026-09-29, usuário: "nos times hyper offensive todos os pokés têm a
  // recomendação de usar Life Orb... isso compromete o time"). Decisão dele:
  // no máximo 2 membros com o mesmo item. { item: [nomes] }.
  var MAX_MESMO_ITEM_NO_TIME = 2;
  // Item esgotado: quem já tem MAX_MESMO_ITEM_NO_TIME donos no time (TK-18, 10.7). donos = lista de quem segura.
  function itemEsgotadoNoTime(donos) { return (donos || []).length >= MAX_MESMO_ITEM_NO_TIME; }
  function itensEmUsoComQuem(excludeX, ctx) {
    var usados = {};
    (ctx ? ctx.team : state.team).forEach(function (x) {
      if (!contaNoTime(x, excludeX)) return;
      var otherSp = getSpeciesByX(x);
      if (!otherSp) return;
      var b = effectiveBuild(otherSp);
      if (b && b.item) (usados[b.item] = usados[b.item] || []).push(otherSp.n);
    });
    return usados;
  }

  function teamRolesInUse(excludeX) {
    var roles = [];
    state.team.forEach(function (x) {
      if (x === excludeX) return;
      var otherSp = getSpeciesByX(x);
      if (!otherSp) return;
      var role = SPECIES_ROLE[otherSp.sname];
      if (role && role.roles) roles = roles.concat(role.roles);
    });
    return roles;
  }

  // Golpes que esta forma ainda vai aprender por nível (acima do cap, e antes de
  // evoluir sozinha) - a IA usa pra montar o plano de golpes da build.
  function golpesFuturosDe(sp, cap) {
    if (cap === null || cap === undefined) return [];
    var limite = nivelDeEvolucaoDaForma(sp);
    var vistos = {}, out = [];
    sp.lm.slice().sort(function (a, b) { return a[0] - b[0]; }).forEach(function (p) {
      var nome = MOVES[p[1]] && MOVES[p[1]][0];
      if (!nome || vistos[nome] || p[0] <= cap || (limite !== null && p[0] > limite) || sp.tu.indexOf(p[1]) !== -1) return;
      if (nivelDoGolpe(sp, nome) <= cap) return; // também aprende antes, em outro nível
      vistos[nome] = true;
      out.push({ id: p[1], nome: nome, nivel: p[0] });
    });
    return out;
  }

  // A user's own "Meu build" (state.customBuilds) always wins over the
  // curated one (BUILDS/builds.json) when both exist for the same species -
  // it's THEIR pick, made deliberately in the Dex editor; the curated one is
  // a starting suggestion, not something that should keep overriding a
  // choice the user already made. Centralized here so the team-slot card,
  // "copy whole team", and the per-slot copy button can't disagree about
  // which build is actually showing - found a real bug in this session
  // where renderTeam() only ever read BUILDS, so a saved "Meu build" from
  // the Dex never reached the Team tab at all (user feedback, 2026-09-09).
  function effectiveBuild(sp) {
    var custom = getActiveBuild(sp.sname);
    if (custom) {
      // Normalized to the exact shape showdownSet()/renderTeam() already
      // expect from a BUILDS entry (evs as a formatted string, not the raw
      // 6-number array customBuilds actually stores) - found live: without
      // this, the preview printed "EVs: 0,252,0,0,0,0" (Array.toString()
      // via string concatenation) instead of "EVs: 252 Atk".
      // Golpes derivados pelo cap a partir do plano (src/regras/plano_build.js):
      // o que está salvo nunca muda; a troca aparece quando o golpe libera e
      // some sozinha se o cap voltar.
      var d = golpesNoCap(sp, custom.moves, custom.plano, getCurrentCap());
      return { ability: custom.ability, nature: custom.nature, item: custom.item, evs: evsToShowdownText(custom.evs), moves: d.moves,
        origem: custom.source, estilo: estiloDeEvs(custom.evs), trocas: d.trocas, pendentes: d.pendentes };
    }
    // Forma Mega sem build própria: é a MESMA criatura da base, com os mesmos
    // golpes (293 de 303 Megas têm movepool idêntico ao da base) - herda a build
    // da base e ajusta só o que não vale na Mega (a habilidade, na maioria).
    if (isMegaForm(sp)) {
      var base = getSpeciesByX(MEGA_BASE_BY_X[sp.x]);
      var daBase = base && getActiveBuild(base.sname);
      if (daBase) {
        var r = reconciliarBuild(daBase, sp);
        var dm = golpesNoCap(sp, r.build.moves, r.build.plano, getCurrentCap());
        return { ability: r.build.ability, nature: r.build.nature, item: r.build.item, evs: evsToShowdownText(r.build.evs), moves: dm.moves,
          origem: "base", herdadaDe: base.n, ajustes: r.changes, trocas: dm.trocas, pendentes: dm.pendentes };
      }
    }
    // Curada: a do estilo que o Ritmo do time pede; sem essa, a primeira.
    var cur = curadaParaEstilo(sp.sname, estiloDoRitmo(state.archetype.pace), false);
    if (!cur) return null;
    // Curada promovida pelo Playtester pode ter plano (golpes do cap em que foi
    // gerada + trocas): segue o cap igual às builds do jogador.
    var dc = golpesNoCap(sp, cur.moves, cur.plano, getCurrentCap());
    return Object.assign({}, cur, { moves: dc.moves, origem: "curada", estilo: cur.estilo || estiloDeEvs(cur.evs), trocas: dc.trocas, pendentes: dc.pendentes });
  }

  // Validação do time gerado (TK-28, movida da tela): quem do time ainda não tem build efetiva e os riscos de tipo em comum.
  function computeTeamGenerationValidation(members) {
    var withoutBuild = members.filter(function (sp) { return !effectiveBuild(sp); }).map(function (sp) { return sp.n; });
    return {
      total: members.length,
      withoutBuild: withoutBuild,
      allBuilt: withoutBuild.length === 0,
      sharedRisks: computeSharedRisks(members)
    };
  }
