// Testes das regras que saíram do template na fase 3 da refatoração (2026-09-24):
// save (src/regras/save.js), evolução e builds salvas (evolucao.js), build mostrada
// (builds.js) e chefões (chefoes.js). Antes só eram exercitadas pela suíte do
// navegador; agora rodam no Node em milissegundos. Fixtures achadas no dado real.
// (Arrays criados dentro do vm não passam em deepEqual - compara com join/length.)
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const sp = (sname) => { const s = R.getSpeciesBySname(sname); assert.ok(s, sname + " existe"); return s; };
const build = (extra) => Object.assign({ ability: "", nature: "Jolly", item: "", moves: [], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0], source: "manual", active: true, savedAt: "x", rationale: "" }, extra);

beforeEach(() => {
  const s = R.state;
  s.team = []; s.box = []; s.savedTeams = []; s.orphans = { team: [], box: [] }; s.notes = {};
  s.autoEvolved = {}; s.autoLog = []; s.gymSkillsCleared = {}; s.customBuilds = {};
  s.archetype = { pace: null, weather: null, monotype: null, tatica: null, reasoning: "" };
  s.settings = { difficulty: "ace", levelCapMode: "more", milestone: 0, megaMode: "temporaria", runConfirmedAt: null };
});

// ---------------- save ----------------
test("save: buildSave -> applySave devolve o mesmo conteúdo", () => {
  const s = R.state;
  s.team = [sp("SPECIES_GARCHOMP").x, sp("SPECIES_SWAMPERT").x];
  s.box = [sp("SPECIES_HAXORUS").x];
  s.notes = { SPECIES_GARCHOMP: "anotação" };
  s.customBuilds = { SPECIES_GARCHOMP: [build({ moves: ["Earthquake"], source: "ia" })] };
  s.settings.milestone = 3;
  const salvo = JSON.parse(JSON.stringify(R.buildSave()));
  s.team = []; s.box = []; s.notes = {}; s.customBuilds = {}; s.settings.milestone = 0;
  R.applySave(salvo);
  assert.equal(R.xsToSnames(s.team).join(","), "SPECIES_GARCHOMP,SPECIES_SWAMPERT");
  assert.equal(R.xsToSnames(s.box).join(","), "SPECIES_HAXORUS");
  assert.equal(s.notes.SPECIES_GARCHOMP, "anotação");
  assert.equal(s.customBuilds.SPECIES_GARCHOMP[0].moves[0], "Earthquake");
  assert.equal(s.settings.milestone, 3);
  assert.equal(R.syncContentDiffers(salvo, JSON.parse(JSON.stringify(R.buildSave()))), false, "nada mudou no ida e volta");
});

// Soma de verificação (2026-10-01): a ideia do bit de paridade aplicada ao save.
test("save: soma de verificação confere no ida e volta e acusa qualquer mudança no conteúdo", () => {
  const s = R.state;
  s.team = [sp("SPECIES_GARCHOMP").x];
  s.notes = { SPECIES_GARCHOMP: "anotação" };
  s.customBuilds = { SPECIES_GARCHOMP: [build({ moves: ["Earthquake", "Dragon Claw"] })] };
  const salvo = JSON.parse(JSON.stringify(R.buildSave()));
  assert.match(salvo.soma, /^[0-9a-f]{8}$/);
  assert.equal(R.conferirSomaDoSave(salvo), "ok");
  // O banco da sincronização pode devolver as chaves em outra ordem: continua ok.
  const invertido = JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(salvo).reverse())));
  assert.equal(R.conferirSomaDoSave(invertido), "ok", "ordem das chaves não importa");
  // Uma letra trocada numa anotação, um golpe trocado numa build, um campo a mais.
  const mexido = (f) => { const c = JSON.parse(JSON.stringify(salvo)); f(c); return R.conferirSomaDoSave(c); };
  assert.equal(mexido((c) => { c.notes.SPECIES_GARCHOMP = "anotaçao"; }), "errada");
  assert.equal(mexido((c) => { c.customBuilds.SPECIES_GARCHOMP[0].moves[1] = "Outrage"; }), "errada");
  assert.equal(mexido((c) => { c.team.push("SPECIES_SWAMPERT"); }), "errada");
  assert.equal(mexido((c) => { c.savedAt = "2000-01-01T00:00:00.000Z"; }), "errada");
  // Save de antes desta conferência (sem soma) continua aceito como sempre foi.
  const antigo = JSON.parse(JSON.stringify(salvo)); delete antigo.soma;
  assert.equal(R.conferirSomaDoSave(antigo), "sem");
  assert.equal(R.conferirSomaDoSave(null), "errada");
  // A soma muda a cada gravação (savedAt), mas não conta como "conteúdo mudou" no sync.
  assert.equal(R.syncContentDiffers(salvo, Object.assign({}, salvo, { soma: "00000000" })), false);
});

test("save: save antigo com strategySets (sobra da IA) carrega inteiro e o campo não volta no próximo save", () => {
  const s = R.state;
  const versao = R.buildSave().dataVersion;
  const set = { name: "Sweeper Físico", ability: "x", nature: "Jolly", item: "", moves: ["Earthquake"], evs: [0, 252, 0, 0, 4, 252], rationale: "t" };
  const antigo = JSON.parse(JSON.stringify(R.buildSave()));
  antigo.team = ["SPECIES_GARCHOMP", "SPECIES_SWAMPERT"]; antigo.box = ["SPECIES_HAXORUS"]; antigo.notes = { SPECIES_GARCHOMP: "anotação" };
  antigo.customBuilds = { SPECIES_GARCHOMP: [build({ moves: ["Earthquake"], source: "ia" })] };
  antigo.settings.milestone = 3;
  antigo.strategySets = { SPECIES_GARCHOMP: { sets: [set], cap: 40, dataVersion: versao, geradoEm: "2026-09-24T10:00:00Z" } };
  antigo.soma = R.somaDoSave(antigo);
  assert.equal(R.conferirSomaDoSave(antigo), "ok");
  R.applySave(antigo);
  assert.equal(R.xsToSnames(s.team).join(","), "SPECIES_GARCHOMP,SPECIES_SWAMPERT");
  assert.equal(R.xsToSnames(s.box).join(","), "SPECIES_HAXORUS");
  assert.equal(s.notes.SPECIES_GARCHOMP, "anotação");
  assert.equal(s.customBuilds.SPECIES_GARCHOMP[0].moves[0], "Earthquake");
  assert.equal(s.settings.milestone, 3);
  const novo = JSON.parse(JSON.stringify(R.buildSave()));
  assert.equal("strategySets" in novo, false, "o campo morto não é mais gravado");
  assert.equal(R.conferirSomaDoSave(novo), "ok");
});

test("save: applySave é defensivo com save malformado ou de outra versão", () => {
  R.applySave({
    team: ["SPECIES_GARCHOMP", "SPECIES_QUE_NAO_EXISTE"], box: [],
    settings: { milestone: 999, megaMode: "invalido", levelCapMode: "xyz", difficulty: "ace" },
    notes: { SPECIES_GARCHOMP: 42, SPECIES_SWAMPERT: "ok" },
    customBuilds: {
      SPECIES_GARCHOMP: { ability: "x", moves: ["Earthquake"], source: "hacker", evs: [999, 0, 0, 0, 0, 0] }, // formato antigo: objeto
      SPECIES_HAXORUS: [{}],                                                                                  // build vazia
    },
    archetype: { pace: "Inventado", weather: "Rain" },
    gymSkillsCleared: { "Lider Inventado": ["x"] },
    autoLog: Array.from({ length: 50 }, (_, i) => ({ at: "t", text: "linha " + i })),
  });
  const s = R.state;
  assert.equal(s.team.length, 1, "espécie inexistente não entra no time...");
  assert.equal(s.orphans.team.join(","), "SPECIES_QUE_NAO_EXISTE", "...mas fica guardada como órfã, não é apagada");
  assert.equal(s.settings.milestone, R.LEVELCAPS.rows.length - 1, "marco fora da tabela é limitado");
  assert.equal(s.settings.levelCapMode, "more");
  assert.equal(s.notes.SPECIES_GARCHOMP, undefined, "anotação que não é texto sai");
  assert.equal(s.notes.SPECIES_SWAMPERT, "ok");
  const g = s.customBuilds.SPECIES_GARCHOMP;
  assert.equal(g.length, 1, "build no formato antigo (objeto) vira lista");
  assert.equal(g[0].source, "manual", "origem desconhecida vira manual");
  assert.equal(g[0].evs[0], 252, "EV acima do máximo é limitado");
  assert.equal(s.customBuilds.SPECIES_HAXORUS, undefined, "build vazia não é guardada");
  assert.equal(s.archetype.pace, null, "ritmo fora da taxonomia sai");
  assert.equal(s.archetype.weather, "Rain");
  assert.equal(Object.keys(s.gymSkillsCleared).length, 0, "líder que não existe sai");
  assert.equal(s.autoLog.length, R.AUTO_LOG_MAX, "registro limitado");
});

test("save: 'Snow' de save antigo vira 'Hail' e a Tática é guardada (2026-09-26)", () => {
  R.applySave({ team: [], box: [], archetype: { pace: "Balance", weather: "Snow", tatica: "Telas" } });
  assert.equal(R.state.archetype.weather, "Hail", "no Elite Redux o Snow Warning invoca granizo");
  assert.equal(R.state.archetype.tatica, "Telas");
  R.applySave({ team: [], box: [], archetype: { tatica: "Tática Inventada" } });
  assert.equal(R.state.archetype.tatica, null, "tática fora da taxonomia sai");
  assert.ok(!R.ARQUETIPOS_DE_CAMPO.includes("Snow"));
  for (const t of ["Hail", "Eerie Fog", "Electric Terrain", "Toxic Terrain"]) assert.ok(R.ARQUETIPOS_DE_CAMPO.includes(t), t);
});

test("save: syncContentDiffers ignora datas e o log, e vê qualquer outro campo (inclusive só de um lado)", () => {
  const a = { team: ["X"], savedAt: "1", autoLog: [1], v: 2 };
  assert.equal(R.syncContentDiffers(a, { team: ["X"], savedAt: "2", autoLog: [2], v: 3 }), false);
  assert.equal(R.syncContentDiffers(a, { team: ["X"], gymSkillsCleared: { Roxanne: ["b"] } }), true, "campo que só o outro tem conta");
  assert.equal(R.syncContentDiffers(a, { team: ["Y"] }), true);
  assert.equal(R.syncContentDiffers(null, a), true);
});

// ---------------- evolução e builds salvas ----------------
test("log: repetição seguida só atualiza a data; teto de entradas", () => {
  R.logAutoAction("a"); R.logAutoAction("a"); R.logAutoAction("b");
  assert.equal(R.state.autoLog.length, 2);
  for (let i = 0; i < 40; i++) R.logAutoAction("n" + i);
  assert.equal(R.state.autoLog.length, R.AUTO_LOG_MAX);
  assert.equal(R.state.autoLog[0].text, "n39", "a mais nova fica no topo");
});

test("auto-evolução encadeia várias etapas no cap, leva a build e registra; regressão desfaz só o que o app evoluiu", () => {
  // linha de 3 estágios por nível: acha no dado
  let base = null, meio = null, fim = null;
  for (const s of R.SPECIES) {
    const e1 = (s.ev || []).find((e) => R.EVOKINDS[e[0]] === R.EVO_LEVEL);
    if (!e1) continue;
    const m = R.getSpeciesByX(e1[2]);
    const e2 = m && (m.ev || []).find((e) => R.EVOKINDS[e[0]] === R.EVO_LEVEL);
    if (!e2 || Number(e2[1]) <= Number(e1[1]) || s.ev[0] !== e1) continue;
    base = s; meio = m; fim = R.getSpeciesByX(e2[2]); break;
  }
  assert.ok(base && meio && fim, "fixture: linha de 3 estágios por nível");
  R.state.customBuilds[base.sname] = [build({ moves: [R.MOVES[base.tu[0]] ? R.MOVES[base.tu[0]][0] : "Tackle"] })];
  const msgs = [];
  const x = R.evolveChainByX(base.x, 100, msgs);
  assert.equal(x, fim.x, "cap alto: vai direto ao último estágio");
  assert.equal(msgs.length, 2);
  assert.ok(R.state.customBuilds[fim.sname] && !R.state.customBuilds[base.sname], "a build foi junto até o fim");
  assert.ok(R.state.autoEvolved[fim.sname] && R.state.autoEvolved[meio.sname]);
  const volta = R.devolveChainByX(fim.x, 1, []);
  assert.equal(volta, base.x, "cap volta ao início: desfaz as 2 etapas");
  assert.ok(R.state.customBuilds[base.sname], "a build volta junto");
  const naoMexe = R.devolveChainByX(fim.x, 1, []);
  assert.equal(naoMexe, fim.x, "criatura que o app NÃO evoluiu (adicionada já evoluída) nunca regride");
});

test("runTemAlgoPraZerar: só há o que zerar quando a run tem algo", () => {
  assert.equal(R.runTemAlgoPraZerar(), false);
  R.state.gymSkillsCleared = { Roxanne: ["b"] };
  assert.equal(R.runTemAlgoPraZerar(), true);
});

// ---------------- build mostrada ----------------
test("effectiveBuild: a do jogador vence a curada; sem nenhuma, a curada do estilo do time", () => {
  const sw = sp("SPECIES_SALAMENCE");
  const cur = R.effectiveBuild(sw);
  assert.equal(cur.origem, "curada");
  R.state.customBuilds.SPECIES_SALAMENCE = [build({ moves: ["Earthquake"], evs: [0, 252, 0, 0, 4, 252] })];
  const minha = R.effectiveBuild(sw);
  assert.equal(minha.origem, "manual");
  assert.equal(minha.moves.join(","), "Earthquake");
  assert.equal(minha.evs, "252 Atk / 4 SpD / 252 Spe", "EVs no formato Showdown");
  assert.equal(minha.estilo, "ofensivo");
  const semNada = R.SPECIES.find((s) => !R.curadasDe(s.sname).length && !R.isMegaForm(s));
  assert.equal(R.effectiveBuild(semNada), null, "sem build salva nem curada: nada");
});

test("EVs: texto <-> lista são inversos (uma lista de rótulos só)", () => {
  const txt = "252 HP / 4 Def / 252 SpD";
  assert.equal(R.evsToShowdownText(R.evsTextoParaArray(txt)), txt);
});

test("showdownSet: formato que o Showdown importa", () => {
  const out = R.showdownSet(sp("SPECIES_GARCHOMP"), { ability: "Rough Skin", item: "Life Orb", nature: "Jolly", evs: "252 Atk / 252 Spe", moves: ["Earthquake", "Outrage"] });
  const linhas = out.split("\n");
  assert.match(linhas[0], /^Garchomp @ Life Orb$/);
  assert.ok(linhas.includes("Ability: Rough Skin") && linhas.includes("Jolly Nature") && linhas.includes("- Earthquake"));
});

test("itens e golpes em uso pelo resto do time excluem o próprio membro", () => {
  const g = sp("SPECIES_GARCHOMP"), s = sp("SPECIES_SWAMPERT");
  R.state.team = [g.x, s.x];
  R.state.customBuilds = {
    SPECIES_GARCHOMP: [build({ item: "Life Orb", moves: ["Earthquake"] })],
    SPECIES_SWAMPERT: [build({ item: "Leftovers", moves: ["Waterfall"] })],
  };
  assert.equal(R.teamItemsInUse(g.x).join(","), "Leftovers");
  assert.equal(R.teamMovesInUse(g.x).join(","), "Waterfall");
});

// ---------------- chefões ----------------
test("chefões: vencer um líder tira ele da lista do que falta", () => {
  assert.equal(R.gymLeaderBaseName("Roxanne 2"), "Roxanne");
  R.state.settings.milestone = 0;
  const antes = R.getRemainingBossEntries().map((b) => R.gymLeaderBaseName(b.name));
  assert.ok(antes.includes("Roxanne"), "no início, Roxanne falta");
  R.state.settings.milestone = 1;
  const depois = R.getRemainingBossEntries().map((b) => R.gymLeaderBaseName(b.name));
  assert.ok(!depois.includes("Roxanne") && depois.includes("Brawly"), "depois da 1ª insígnia, Roxanne sai e Brawly é a próxima");
  assert.equal(new Set(depois.filter((n) => R.GYM_LEADER_MILESTONE[n] !== undefined)).size, depois.filter((n) => R.GYM_LEADER_MILESTONE[n] !== undefined).length, "cada líder uma vez (rebatalhas não repetem)");
});

test("chefões: variante do time pela dificuldade (Roxanne 1: Ace 5, Elite 6)", () => {
  const rox = R.BOSSES.find((b) => b.name === "Roxanne 1");
  assert.ok(rox, "fixture Roxanne 1");
  R.state.settings.difficulty = "ace";
  assert.equal(R.varianteDoChefao(rox), "party");
  assert.equal(R.bossPartyPorDificuldade(rox).length, 5);
  R.state.settings.difficulty = "elite";
  assert.equal(R.varianteDoChefao(rox), "insane");
  assert.equal(R.bossPartyPorDificuldade(rox).length, 6);
});

test("chefões: buffs de ginásio contam os que faltam", () => {
  const lider = Object.keys(R.GYM_SKILLS.leaders).find((l) => !R.GYM_SKILLS.leaders[l].gateOnly);
  const total = R.GYM_SKILLS.leaders[lider].buffs.length;
  assert.equal(R.gymSkillsSummaryFor(lider).remaining, total);
  R.state.gymSkillsCleared[lider] = [R.GYM_SKILLS.leaders[lider].buffs[0].id];
  assert.equal(R.gymSkillsSummaryFor(lider).remaining, total - 1);
  assert.equal(R.gymSkillsSummaryFor("Ninguém"), null);
});

test("fraquezas compartilhadas: só tipo que acerta 2+ membros, do pior pro melhor", () => {
  const riscos = R.computeSharedRisks([sp("SPECIES_GARCHOMP"), sp("SPECIES_SALAMENCE")]);
  assert.ok(riscos.length > 0 && riscos.every((r) => r.n >= 2));
  assert.ok(riscos.some((r) => r.t === "Ice" || r.t === "Dragon" || r.t === "Fairy"), "dois dragões dividem fraqueza");
});

test("velocidade: ranking investido em ordem decrescente, no nível do cap", () => {
  const r = R.computeSpeedTiers("");
  assert.equal(r.level, R.getCurrentCap());
  assert.ok(r.rows.length === R.SPECIES.length);
  assert.ok(r.rows.every((x, i) => i === 0 || r.rows[i - 1].invested >= x.invested));
});
