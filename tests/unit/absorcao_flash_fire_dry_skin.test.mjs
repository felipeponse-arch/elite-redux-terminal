// Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
// Ticket calibracao-2026-10-15/04 (15/10/2026): Flash Fire e Dry Skin absorvem o golpe (código do jogo: abilities.cc:696-706 e
// 1471-1487, `onAbsorb`; a er-config diz "complete immunity to Fire-type moves"). Antes a tabela de tipos deixava as duas de fora porque
// o texto curto ("Powers up Fire-type moves by 1.5x if hit by a Fire-type move", "Water/Rain heals") não diz "imune", e o Fire contra um
// Ninetales com Flash Fire dava o dano inteiro. Chefões reais do app (21 com Flash Fire, 5 com Dry Skin).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";
import { ninetales2653b } from "./fixture_ninetales_2653b.mjs";

const R = ninetales2653b(carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" }));
const NIVEL = 55;
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b + " (tolerância " + tol + ")");

// Unidade com as habilidades ISOLADAS (sem as innates da espécie).
function iso(especie, habs, golpes, item = "") {
  const s = sp(especie);
  const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Hardy", evs: [0, 252, 0, 252, 0, 0], item, moves: golpes }, NIVEL, null);
  const ids = habs.map(idHab);
  u.ids = ids; u.ab = habs[0] || ""; u.abId = ids.length ? ids[0] : null;
  u.ef = R.efeitoDasHabilidadesNoDuelo(ids, s.sname + "|" + habs.join("+"), null);
  u.tipos = R.tiposNaBatalha(s, u.ef);
  u.golpeIds = golpes.map((n) => R.MOVE_ID_BY_NAME[n]);
  u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
  return u;
}
const dano = (a, d) => R.danoNoDuelo(a, d, NIVEL).melhor.dano;
const chefao = (nome, mon) => {
  const b = R.BOSSES.find((x) => x.name === nome);
  const p = b && b.party.find((x) => x.n === mon);
  assert.ok(p, nome + " / " + mon + " não existe em bosses.json");
  return R.foeDeDuelo(p, NIVEL, null);
};
const golpe = (tipo, extra) => Object.assign({ nome: "T" + tipo, tipo, cat: "F", contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const sintetica = (habs, tipos, golpes, extra) => {
  const ids = habs.map(idHab);
  return Object.assign({ sp: { n: "Teste", sname: "SPECIES_TESTE", inn: [] }, tipos, ids, ef: R.efeitoDasHabilidadesNoDuelo(ids, "AB04_" + habs.join("+"), null), item: "", it: R.itemDoDuelo("", null),
    stats: [320, 100, 100, 100, 100, 100], golpesProntos: golpes, statusIds: [] }, extra || {});
};

// ---------- a imunidade ----------
test("Flash Fire (Ninetales de Courtney, innate): o Fire do atacante dá dano 0; golpe de outro tipo dá o dano de sempre", () => {
  const ninetales = chefao("Courtney Meteor Falls", "Ninetales");
  assert.ok(ninetales.ids.includes(idHab("Flash Fire")), "o Ninetales de Courtney tem Flash Fire");
  assert.equal(dano(iso("Garchomp", [], ["Ember"]), ninetales), 0, "Ember (Fire)");
  assert.deepEqual(ninetales.tipos, ["Fire", "Ghost"]);
  assert.ok(dano(iso("Garchomp", [], ["Surf"]), ninetales) > 0, "Surf (Water; o Tackle não serve de controle: o Ninetales é Fire/Ghost)");
});

test("Dry Skin (Toxicroak de Brawly 1, innate): Water dá dano 0 (cura 25%); Fire segue x1,25; os outros tipos não mudam", () => {
  const toxicroak = chefao("Brawly 1", "Toxicroak");
  assert.ok(toxicroak.ids.includes(idHab("Dry Skin")), "o Toxicroak de Brawly 1 tem Dry Skin");
  assert.equal(dano(iso("Garchomp", [], ["Water Gun"]), toxicroak), 0, "Water Gun (Water)");
  assert.ok(dano(iso("Garchomp", [], ["Tackle"]), toxicroak) > 0, "Tackle");
});

test("razão do dano recebido com a habilidade isolada: Flash Fire Fire x0, Dry Skin Water x0 e Fire x1,25, Elemental Vortex os dois x0", () => {
  const razao = (hab, golpeNome) => {
    const a = iso("Garchomp", [], [golpeNome]);
    return dano(a, iso("Magikarp", [hab], ["Tackle"])) / dano(a, iso("Magikarp", [], ["Tackle"]));
  };
  assert.equal(razao("Flash Fire", "Ember"), 0);
  perto(razao("Flash Fire", "Tackle"), 1, 1e-9, "Flash Fire / Normal");
  assert.equal(razao("Dry Skin", "Water Gun"), 0);
  perto(razao("Dry Skin", "Ember"), 1.25, 0.02 * 1.25, "Dry Skin / Fire");
  perto(razao("Dry Skin", "Tackle"), 1, 1e-9, "Dry Skin / Normal");
  assert.equal(razao("Elemental Vortex", "Ember"), 0);
  assert.equal(razao("Elemental Vortex", "Water Gun"), 0);
  assert.equal(razao("Water Absorb", "Water Gun"), 0, "controle: Water Absorb já era imune");
});

// Depende de dado: espécie real (a regra, com fixture inventada, está em regras_com_fixture.test.mjs)
test("Mold Breaker atravessa a absorção (Flash Fire e Dry Skin)", () => {
  const molde = iso("Garchomp", ["Mold Breaker"], ["Ember"]);
  assert.ok(dano(molde, iso("Magikarp", ["Flash Fire"], ["Tackle"])) > 0, "Flash Fire");
  perto(dano(molde, iso("Magikarp", ["Flash Fire"], ["Tackle"])) / dano(molde, iso("Magikarp", [], ["Tackle"])), 1, 1e-9, "dano igual ao de quem não tem a habilidade");
  assert.ok(dano(iso("Garchomp", ["Mold Breaker"], ["Water Gun"]), iso("Magikarp", ["Dry Skin"], ["Tackle"])) > 0, "Dry Skin");
});

test("a tabela de tipos (telas do app) também mostra a imunidade: Flash Fire imune a Fire, Dry Skin imune a Water e fraca a Fire", () => {
  const r = (atq, ids) => R.abilityTypeModFor(atq, ["Normal"], ids.map(idHab));
  assert.equal(r("Fire", ["Flash Fire"]).mult, 0);
  assert.match(r("Fire", ["Flash Fire"]).reasons.join(" "), /Flash Fire \(imune\)/);
  assert.equal(r("Water", ["Dry Skin"]).mult, 0);
  assert.match(r("Water", ["Dry Skin"]).reasons.join(" "), /Dry Skin \(imune, cura 25%\)/);
  assert.equal(r("Fire", ["Dry Skin"]).mult, 1, "a tabela não põe o x1,25 do Dry Skin (ele vem do texto no duelo)");
  assert.equal(r("Fire", ["Elemental Vortex"]).mult, 0);
  assert.equal(r("Water", ["Elemental Vortex"]).mult, 0);
  assert.equal(r("Fire", []).mult, 1);
});

// ---------- o x1,5 depois da absorção ----------
test("o texto do Flash Fire vira absorveReforca { Fire, 1,5 }; Elemental Vortex (Flash Fire + Water Absorb) herda; as outras absorções não", () => {
  const ef = (n) => R.efeitoDasHabilidadesNoDuelo([idHab(n)], "ABS_" + n, null);
  assert.deepEqual(JSON.parse(JSON.stringify(ef("Flash Fire").absorveReforca)), { tipo: "Fire", mult: 1.5 });
  assert.deepEqual(JSON.parse(JSON.stringify(ef("Elemental Vortex").absorveReforca)), { tipo: "Fire", mult: 1.5 });
  for (const n of ["Water Absorb", "Dry Skin", "Volt Absorb", "Sap Sipper"]) assert.equal(ef(n).absorveReforca, null, n);
});

test("Flash Fire: o rival que só tem golpe Fire é absorvido e o Fire do dono sai x1,5 dali em diante (1 turno: x1; 3 turnos: (1 + 1,5 x 2)/3)", () => {
  const meu = (habs, golpeRival, turnos, extraRival) => {
    const eu = sintetica(habs, ["Fire"], [golpe("Fire")]);
    const rival = sintetica([], ["Water"], golpeRival, extraRival);
    return R.danoComStatusNoDuelo(eu, rival, R.danoNoDuelo(eu, rival, NIVEL), R.danoNoDuelo(rival, eu, NIVEL), turnos, true).meu;
  };
  const rivalFire = [golpe("Fire")];
  assert.equal(R.danoNoDuelo(sintetica([], ["Water"], rivalFire), sintetica(["Flash Fire"], ["Fire"], [golpe("Fire")]), NIVEL).melhor.dano, 0, "o Fire do rival é absorvido");
  perto(meu(["Flash Fire"], rivalFire, 1) / meu([], rivalFire, 1), 1, 1e-9, "1 turno: o golpe do dono sai antes da absorção");
  perto(meu(["Flash Fire"], rivalFire, 3) / meu([], rivalFire, 3), (1 + 1.5 * 2) / 3, 1e-6, "3 turnos");
  perto(meu(["Flash Fire"], rivalFire, 6) / meu([], rivalFire, 6), (1 + 1.5 * 5) / 6, 1e-6, "6 turnos: o bônus não acumula, só entra");
});

test("Flash Fire: sem absorção não há bônus (rival com outro golpe de dano, rival com Mold Breaker, golpe do dono que não é Fire)", () => {
  const eu = (golpes) => sintetica(["Flash Fire"], ["Fire"], golpes);
  const sem = (golpes) => sintetica([], ["Fire"], golpes);
  const rival = (golpes, habs) => sintetica(habs || [], ["Water"], golpes);
  const meu = (mon, rv, turnos) => R.danoComStatusNoDuelo(mon, rv, R.danoNoDuelo(mon, rv, NIVEL), R.danoNoDuelo(rv, mon, NIVEL), turnos, true).meu;
  // rival com Fire e Normal: lança o Normal (uma IA que sabe da habilidade evita o Fire absorvido), então nada é absorvido
  const misto = rival([golpe("Fire"), golpe("Normal")]);
  perto(meu(eu([golpe("Fire")]), misto, 3) / meu(sem([golpe("Fire")]), misto, 3), 1, 1e-9, "rival com outro golpe");
  // Mold Breaker do rival: o Fire não é absorvido
  const molde = rival([golpe("Fire")], ["Mold Breaker"]);
  perto(meu(eu([golpe("Fire")]), molde, 3) / meu(sem([golpe("Fire")]), molde, 3), 1, 1e-9, "Mold Breaker");
  // o golpe do dono é Normal: o reforço é só dos Fire
  const soFire = rival([golpe("Fire")]);
  perto(meu(eu([golpe("Normal")]), soFire, 3) / meu(sem([golpe("Normal")]), soFire, 3), 1, 1e-9, "golpe do dono Normal");
});

// B4 (decisão do Felipe, 21/10/2026): o x1,5 em Fire do Flash Fire e do Elemental Vortex só liga DEPOIS de absorver um golpe Fire
// (abilities.cc:695-706 e 8262-8264, `onOffensiveMultiplier` com RESOURCE_FLAG_FLASH_FIRE). A "sinergia por golpe" da espécie
// (species_ability_synergy.json) somava o x1,5 sempre ligado por cima do gatilho; ela saiu (SINERGIA_SEM_BONUS_DE_DANO_DUELO).
// Dado real: Ninetales (Flash Fire de innate) com o Flamethrower contra um Garchomp que só tem Fire ou só tem Normal.
test("Flash Fire na sinergia da espécie: sem golpe Fire do rival o Ninetales não ganha o x1,5; com ele, o bônus entra pelo gatilho", () => {
  const nine = R.unidadeDaBuild(sp("Ninetales"), { ability: "Flaming Soul", nature: "Modest", evs: [0, 0, 0, 252, 0, 252], item: "", moves: ["Flamethrower"] }, NIVEL, null);
  assert.ok(nine.ids.includes(idHab("Flash Fire")), "fixture: o Ninetales tem Flash Fire");
  const g = nine.golpesProntos.find((x) => x.nome === "Flamethrower");
  perto(g.forca, g.poder * 1.5, 1e-9, "força do Flamethrower: poder x STAB, sem o x1,5 sempre ligado da sinergia");
  const rival = (golpe) => R.unidadeDaBuild(sp("Garchomp"), { ability: "Sand Veil", nature: "Adamant", evs: [0, 252, 0, 0, 0, 252], item: "", moves: [golpe] }, NIVEL, null);
  const dele = (mon, rv, turnos) => R.danoComStatusNoDuelo(mon, rv, R.danoNoDuelo(mon, rv, NIVEL), R.danoNoDuelo(rv, mon, NIVEL), turnos, true).meu;
  const semGatilho = Object.assign({}, nine, { ef: Object.assign({}, nine.ef, { absorveReforca: null }) }); // o mesmo Ninetales sem o gatilho do Flash Fire
  const semAbsorcao = rival("Earthquake"), comAbsorcao = rival("Flamethrower");
  assert.equal(R.danoNoDuelo(comAbsorcao, nine, NIVEL).melhor.dano, 0, "fixture: o Fire do rival é absorvido");
  perto(dele(nine, semAbsorcao, 3) / dele(semGatilho, semAbsorcao, 3), 1, 1e-9, "rival sem golpe Fire: nada é absorvido, sem bônus");
  const ganho = dele(nine, comAbsorcao, 3) / dele(semGatilho, comAbsorcao, 3);
  assert.ok(ganho > 1.2 && ganho <= 1.5, "rival só com Fire: o bônus entra pelo gatilho (3 turnos: até x1,33): " + ganho);
});
