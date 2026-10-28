// Lote D da força-tarefa (2026-10-02): confiabilidade do estado, do save, da sincronização
// e travas que pegam o problema antes do jogador.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "./carregar_regras.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const R = carregarRegras({ milestone: 1, difficulty: "ace", levelCapMode: "more" });
const x = (s) => R.getSpeciesBySname(s).x;
const sn = (lista) => lista.map((v) => R.getSpeciesByX(v).sname).join(",");

beforeEach(() => {
  R.state.team = []; R.state.box = []; R.state.autoEvolved = {}; R.state.orphans = { team: [], box: [] };
});

test("auto-evolução não cria duas cópias da mesma espécie (Charmander + Charmeleon)", () => {
  const passo = (v, msgs) => R.evolveChainByX(v, 30, msgs); // cap 30: Charmander -> Charmeleon
  const r = R.evoluirElencoSemDuplicar([x("SPECIES_CHARMANDER"), x("SPECIES_CHARMELEON")], [], passo);
  assert.equal(new Set(r.team).size, 2, sn(r.team));
  assert.equal(sn(r.team), "SPECIES_CHARMANDER,SPECIES_CHARMELEON");
  assert.match(r.messages.join(" "), /não evoluiu/);
});

test("registro de auto-evolução de espécie que saiu do elenco é podado", () => {
  R.state.autoEvolved = { SPECIES_CHARIZARD: { from: "SPECIES_CHARMELEON", lvl: 36 }, SPECIES_IVYSAUR: { from: "SPECIES_BULBASAUR", lvl: 16 } };
  R.podarAutoEvolved([x("SPECIES_IVYSAUR")], []);
  assert.deepEqual(Object.keys(R.state.autoEvolved), ["SPECIES_IVYSAUR"]);
});

test("save: runConfirmedAt null sincroniza; dificuldade e insígnia inválidas não entram; 7º do time vai pra caixa", () => {
  R.state.settings.runConfirmedAt = "2026-09-20T10:00:00.000Z";
  R.state.settings.difficulty = "ace";
  R.applySave({ settings: { runConfirmedAt: null, difficulty: "hacker", milestone: 1.5 },
    team: ["SPECIES_PIKACHU", "SPECIES_EEVEE", "SPECIES_ODDISH", "SPECIES_ZUBAT", "SPECIES_GEODUDE", "SPECIES_MACHOP", "SPECIES_ABRA"], box: [] });
  assert.equal(R.state.settings.runConfirmedAt, null);
  assert.equal(R.state.settings.difficulty, "ace");
  assert.equal(R.state.settings.milestone, 1);
  assert.equal(R.state.team.length, 6);
  assert.equal(sn(R.state.box), "SPECIES_ABRA");
});

test("save: gravação automática mantém a data do save carregado; ação do jogador usa a de agora", () => {
  R.applySave({ savedAt: "2026-01-01T00:00:00.000Z", team: [], box: [] });
  assert.equal(R.buildSave({ manterData: true }).savedAt, "2026-01-01T00:00:00.000Z");
  assert.notEqual(R.buildSave().savedAt, "2026-01-01T00:00:00.000Z");
});

test("sync: mudar só a ordenação ou o filtro de tipo da Dex não é 'conteúdo mudou'", () => {
  const a = { team: ["X"], settings: { difficulty: "ace", sort: "dex", typeFilter: [] } };
  assert.equal(R.syncContentDiffers(a, { team: ["X"], settings: { difficulty: "ace", sort: "nome", typeFilter: ["Fire"] } }), false);
  assert.equal(R.syncContentDiffers(a, { team: ["X"], settings: { difficulty: "elite", sort: "dex", typeFilter: [] } }), true);
});

// ---------------- travas que pegam o problema antes do jogador ----------------
const CONFIG_NOVA = JSON.parse(readFileSync(join(raiz, "data", "config_nova.json"), "utf8"));
test("trava: dado derivado (dex_compact/bosses) bate com o bruto 2.65.4 + o delta da config nova", () => {
  const bruto = JSON.parse(readFileSync(join(raiz, "data", "gameData.json"), "utf8"));
  const dex = R.DATA;
  bruto.moves.forEach((m, i) => {
    if (!m) return;
    const d = dex.moves[i];
    assert.deepEqual([d[0], d[1], d[3], d[4], d[7]], [m.name, m.types[0], m.pwr, m.acc, m.prio], "golpe " + i);
    assert.equal(d[9], m.types.length > 1 ? m.types[1] : -1, "2º tipo do golpe " + m.name);
  });
  let n = 0;
  bruto.species.forEach((s, i) => {
    if (!s || !s.name || s.name === "??????????") return;
    const d = dex.species[i];
    assert.equal(d.n, s.name);
    // o delta da er-config d1a9a4c (data/config_nova.json) vale sobre o dado bruto: Morpekyll Hangry 97/104/78/62/74/121
    const remendo = CONFIG_NOVA.especies[d.sname] && CONFIG_NOVA.especies[d.sname].b;
    assert.equal(d.b.join(","), (remendo || s.stats.base).join(","), "stats de " + s.name);
    n++;
  });
  assert.ok(n > 1800);
  const porNome = {};
  bruto.trainers.forEach((t) => { porNome[t.name] = t; });
  R.BOSSES.forEach((b) => {
    const t = porNome[b.name];
    assert.ok(t, "chefão no bruto: " + b.name);
    assert.equal(b.party.length, t.party.length, b.name);
    b.party.forEach((m, k) => assert.equal(m.x, t.party[k].spc, b.name + " #" + k));
  });
});

test("trava: nenhum nome de topo repetido entre arquivos (escopo global compartilhado)", () => {
  const onde = {};
  for (const d of ["src/regras", "src/ui"]) {
    for (const f of readdirSync(join(raiz, d)).filter((f) => f.endsWith(".js"))) {
      const t = readFileSync(join(raiz, d, f), "utf8");
      const re = /^ {2}(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(|^ {2}var\s+([A-Za-z_$][\w$]*)/gm;
      let m;
      while ((m = re.exec(t))) { const n = m[1] || m[2]; (onde[n] = onde[n] || []).push(d + "/" + f); }
    }
  }
  const repetidos = Object.entries(onde).filter(([, l]) => l.length > 1).map(([n, l]) => n + " (" + l.join(", ") + ")");
  assert.deepEqual(repetidos, [], "um nome repetido troca o comportamento de outro módulo em silêncio");
  assert.ok(Object.keys(onde).length > 700);
});

test("evolução desfeita pra não duplicar não deixa registro de auto-evolução no outro", () => {
  R.state.autoEvolved = {};
  R.evoluirElencoSemDuplicar([x("SPECIES_CHARMANDER"), x("SPECIES_CHARMELEON")], [], (v, msgs) => R.evolveChainByX(v, 30, msgs));
  assert.equal(R.state.autoEvolved.SPECIES_CHARMELEON, undefined);
});
