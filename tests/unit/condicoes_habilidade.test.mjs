// Habilidade condicional (reunião de 2026-09-28): a auditoria das builds salvas
// do usuário achou Goodra com Poison Heal e Choice Specs (nada envenena) - a
// build escolhe a habilidade e não garante a condição. Fixtures do dado real.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const porNome = (n) => { const s = R.SPECIES.find((x) => x.n === n); assert.ok(s, n); return s; };

beforeEach(() => {
  R.state.settings.milestone = 9;
  R.state.team = []; R.state.box = []; R.state.customBuilds = {};
  R.state.archetype = { pace: null, weather: null, monotype: null, tatica: null, reasoning: "" };
});

test("Poison Heal com Choice Specs não tem garantia; com Toxic Orb tem", () => {
  const goodra = porNome("Goodra");
  const moves = ["Dragon Pulse", "Hydro Pump", "Earth Power", "Energy Wave"];
  const sem = R.condicaoDaBuild(goodra, { ability: "Poison Heal", item: "Choice Specs", moves });
  assert.equal(sem.garantidaPor, null);
  assert.deepEqual([...sem.comoGarantir], ["segurar Toxic Orb"]);
  assert.match(R.condicaoDaBuild(goodra, { ability: "Poison Heal", item: "Toxic Orb", moves }).garantidaPor, /Toxic Orb/);
});

test("a validação rejeita a build do Goodra do usuário, dizendo como garantir", () => {
  const m = {};
  const v = R.validateAiBuild(porNome("Goodra"), {
    ability: "Poison Heal", nature: "Modest", item: "Choice Specs",
    moves: ["Dragon Pulse", "Hydro Pump", "Earth Power", "Energy Wave"], evs: [252, 0, 0, 252, 4, 0], rationale: "t"
  }, m);
  assert.equal(v, null);
  assert.match(m.txt, /Poison Heal só funciona com estar envenenado.*segurar Toxic Orb/);
});

test("habilidade de clima: garantida pelo time, pelo arquétipo ou pelo próprio golpe", () => {
  const kingdra = porNome("Kingdra");
  const build = { ability: "Swift Swim", item: "", moves: ["Surf", "Dragon Pulse", "Ice Beam", "Flash Cannon"] };
  assert.equal(R.condicaoDaBuild(kingdra, build).garantidaPor, null);
  assert.match(R.condicaoDaBuild(kingdra, Object.assign({}, build, { moves: ["Rain Dance", "Surf", "Dragon Pulse", "Ice Beam"] })).garantidaPor, /Rain Dance/);
  R.state.archetype.weather = "Rain";
  assert.match(R.condicaoDaBuild(kingdra, build).garantidaPor, /Clima e campo do time/);
  R.state.archetype.weather = null;
  // Membro do time com Rain Dance na build ativa (o caso real da Luvdisc do usuário).
  const luvdisc = porNome("Luvdisc");
  R.state.team = [luvdisc.x];
  R.state.customBuilds[luvdisc.sname] = [{ ability: "Swift Swim", moves: ["Rain Dance", "Surf", "Ice Beam", "Charm"], active: true, source: "ia" }];
  assert.match(R.condicaoDaBuild(kingdra, build).garantidaPor, /Luvdisc \(Rain Dance\)/);
});

test("habilidade que arma o clima é lida do texto do jogo, inclusive a composta", () => {
  assert.ok(R.habilidadeArma("Drizzle", "chuva"));
  assert.ok(R.habilidadeArma("Sand Bender", "areia")); // "Sand Stream + Sand Force"
  assert.ok(R.habilidadeArma("Snowy Wrath", "granizo")); // "Snow Warning + Cryomancy"
  assert.ok(!R.habilidadeArma("Swift Swim", "chuva"));
});

test("tipo Poison ou Steel não é envenenado pela Toxic Orb", () => {
  const poison = R.SPECIES.find((s) => R.speciesTypeNames(s).includes("Poison"));
  assert.equal(R.podeTerStatus(poison, "veneno", []), false);
  assert.equal(R.podeTerStatus(porNome("Goodra"), "veneno", []), true);
  assert.equal(R.podeTerStatus(porNome("Goodra"), "veneno", ["Immunity"]), false); // "Cannot be poisoned"
});

test("o prompt avisa as habilidades condicionais e traz o contexto sem pedir ferramenta", () => {
  const p = R.montarPromptBuild(porNome("Goodra"), {});
  assert.match(p, /HABILIDADES CONDICIONAIS[\s\S]*Poison Heal \(escolhivel\): so funciona com estar envenenado\. NAO garantida hoje - para usar: segurar Toxic Orb/);
  assert.match(p, /CONTEXTO JA CALCULADO PELO APP/);
  assert.match(p, /Velocidade no nivel \d+/);
  assert.doesNotMatch(p, /getSpeedBenchmark|getNextBossRoster|getAbilityMovepoolSynergy|getConditionMoveSynergy/);
  assert.doesNotMatch(R.montarPromptEstrategias(porNome("Goodra")), /getSpeedBenchmark|getNextBossRoster|getSpeciesRank/);
});

test("Trick Room: build lenta de propósito sai com IV de Velocidade 0 (Iron Pill)", () => {
  R.state.archetype.weather = "Trick Room";
  const sp = porNome("Snorlax"); // innate Gluttony pede berry
  const dano = R.availableMovesFor(sp).names.filter((m) => R.moveRoleOf(m) === "dano");
  const sinergia = (R.ABILITY_SYNERGY[sp.sname] || []).flatMap((h) => h.golpes || []);
  const moves = [...new Set([...sinergia.filter((g) => dano.includes(g)).slice(0, 1), ...dano])].slice(0, 4);
  const ab = R.ABILITIES[R.uniqueIds(sp.ab).find((id) => !R.CONDICAO_DE_HABILIDADE[R.ABILITIES[id][0]])][0];
  const m = {};
  const v = R.validateAiBuild(sp, { ability: ab, nature: "Brave", item: "Sitrus Berry", moves, evs: [252, 252, 4, 0, 0, 0], rationale: "t" }, m);
  assert.ok(v, m.txt);
  assert.equal(v.ivs[5], 0);
  assert.match(v.rationale, /^IV de Velocidade 0 \(use a Iron Pill\)/);
  R.state.archetype.weather = null;
  assert.equal(R.validateAiBuild(sp, { ability: ab, nature: "Brave", item: "Sitrus Berry", moves, evs: [252, 252, 4, 0, 0, 0], rationale: "t" }).ivs[5], 31);
});

test("innate condicional: a escolhível da espécie que arma a condição aparece como forma de garantir", () => {
  const nomeHab = (id) => (R.ABILITIES[id] ? R.ABILITIES[id][0] : "");
  const sp = R.SPECIES.find((s) => s && R.uniqueIds(s.inn || []).some((id) => {
    const conds = R.CONDICAO_DE_HABILIDADE[nomeHab(id)];
    return conds && R.uniqueIds(s.ab || []).some((ab) => conds.some((c) => R.habilidadeArma(nomeHab(ab), c)));
  }));
  assert.ok(sp, "fixture: espécie com innate condicional e escolhível que arma a condição");
  assert.match(R.blocoCondicoesIA(sp), /\(innate\)[^\n]*escolher a habilidade /);
});

test("mega no modo temporário: a dica não manda segurar orbe (o slot é da pedra)", () => {
  R.state.settings.megaMode = "temporaria";
  const nomeHab = (id) => (R.ABILITIES[id] ? R.ABILITIES[id][0] : "");
  const mega = R.SPECIES.find((s) => s && R.megaStoneRuleFor(s) && R.uniqueIds((s.ab || []).concat(s.inn || [])).some((id) => {
    const c = R.CONDICAO_DE_HABILIDADE[nomeHab(id)];
    return c && (c.includes("veneno") || c.includes("status") || c.includes("queimadura"));
  }));
  if (!mega) return; // nenhuma mega com habilidade de status neste dado - nada a conferir
  assert.doesNotMatch(R.blocoCondicoesIA(mega), /segurar (Toxic|Flame) Orb/);
});
