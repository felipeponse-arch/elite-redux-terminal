// O resto das habilidades (2026-09-29, pedido do usuário: "não quero que fique
// nada de fora"): prisão, clima anulado, formas, cópia/supressão de habilidade,
// sono, Toxic Terrain e item gasto na luta inteira.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes, clima) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "RS_" + nomes.join("+") + (clima || ""), clima || null);
const perto = (a, b) => Math.abs(a - b) < 1e-6;
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ sp: { n: "Teste", sname: "T", inn: [] }, tipos: ["Water"], ids: [], ef, item: "", it: R.itemDoDuelo("", null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g], statusIds: [] }, extra || {});
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);

test("prisão: Shadow Tag prende quem não é Ghost; Arena Trap só quem está no chão; Magnet Pull, Steel", () => {
  const u = (tipos) => unidade(efDe([]), golpe("F"), { tipos });
  assert.equal(R.prendeDuelo(unidade(efDe(["Shadow Tag"]), golpe("F")), u(["Water"])), true);
  assert.equal(R.prendeDuelo(unidade(efDe(["Shadow Tag"]), golpe("F")), u(["Ghost"])), false);
  assert.equal(R.prendeDuelo(unidade(efDe(["Arena Trap"]), golpe("F")), u(["Flying"])), false);
  assert.equal(R.prendeDuelo(unidade(efDe(["Magnet Pull"]), golpe("F")), u(["Steel"])), true);
  assert.equal(R.prendeDuelo(unidade(efDe(["Magnet Pull"]), golpe("F")), u(["Water"])), false);
});

test("clima: Water no sol sai pela metade (série); Catastrophe vira reforço; Nika anula", () => {
  const agua = R.MOVE_ID_BY_NAME["Surf"];
  const u = (ab) => ({ ef: efDe(ab, "sol"), tipos: ["Normal"], stats: [100, 100, 100, 100, 100, 100] });
  const semClima = R.prepararGolpesDuelo([agua], { ef: efDe([]), tipos: ["Normal"], stats: [100, 100, 100, 100, 100, 100] }, null)[0].forca;
  assert.ok(perto(R.prepararGolpesDuelo([agua], u([]), "sol")[0].forca / semClima, 0.5));
  assert.ok(perto(R.prepararGolpesDuelo([agua], u(["Catastrophe"]), "sol")[0].forca / semClima, 1.5));
});

test("Delta Stream tira a fraqueza do Flying; Weather Control barra golpe de clima", () => {
  const voador = unidade(efDe(["Delta Stream"]), golpe("F"), { tipos: ["Flying"] });
  assert.equal(R.efetividadeNoDuelo(unidade(efDe([]), golpe("F")), "Rock", voador), 1);
  const wc = unidade(efDe(["Weather Control"]), golpe("F"));
  assert.equal(R.danoNoDuelo(unidade(efDe([]), golpe("E", { flags: ["Weather Based"] })), wc, 50).melhor.dano, 0);
});

test("formas: Schooling usa a School em 3/4 da luta; Forecast vira Fire no sol", () => {
  const w = sp("Wishiwashi"), base = R.unidadeDeDuelo(w, R.SETS_DE_DUELO[0], null, 50, R.golpesDeDueloAte(w, null), null);
  const school = sp("Wishiwashi School");
  assert.ok(base.ef.forma && base.ef.forma.nome === "School");
  assert.ok(base.stats[1] > R.calcFinalStat(w.b[1], 31, 252, 50, 1, "Adamant", "Life Orb", w.n), "Ataque maior que o da forma sozinha");
  assert.ok(base.stats[1] < R.calcFinalStat(school.b[1], 31, 252, 50, 1, "Adamant", "Life Orb", school.n));
  const c = sp("Castform");
  const cs = R.unidadeDeDuelo(c, R.SETS_DE_DUELO[1], null, 50, R.golpesDeDueloAte(c, null), "sol");
  assert.deepEqual([...cs.tipos], ["Fire"]);
});

test("Mummy: quem faz contato perde a habilidade escolhida depois do 1º contato", () => {
  const mumia = unidade(efDe(["Mummy"]), golpe("F"));
  const ab = idHab("Huge Power");
  const bruto = { sp: { n: "B", sname: "B", inn: [], t: [0, 0] }, ids: [ab], abId: ab, ef: efDe(["Huge Power"]), tipos: ["Normal"], item: "", it: R.itemDoDuelo("", null), stats: [320, 100, 100, 100, 100, 100], golpeIds: [R.MOVE_ID_BY_NAME["Tackle"]], clima: null, statusIds: [] };
  bruto.golpesProntos = R.prepararGolpesDuelo(bruto.golpeIds, bruto, null);
  const sem = R.comHabilidadesDuelo(bruto, "semEscolhida");
  assert.equal(sem.ef.atkMult, 1);
  assert.equal(bruto.ef.atkMult, 2);
  const troca = R.comHabilidadeTrocada(bruto, mumia, R.danoNoDuelo(bruto, mumia, 50), R.danoNoDuelo(mumia, bruto, 50), 50);
  assert.ok(troca.meu.melhor.dano < R.danoNoDuelo(bruto, mumia, 50).melhor.dano, "o Huge Power some depois do contato");
});

test("sono virou status: Hypnotic Touch dorme o outro no contato; Insomnia barra", () => {
  const ht = efDe(["Hypnotic Touch"]);
  assert.ok(ht.statusDefesa.some((e) => e.st.includes("sono")), JSON.stringify(ht.statusDefesa));
  assert.equal(R.podeSofrerStatusDuelo(unidade(efDe(["Insomnia"]), golpe("F")), "sono"), false);
});

test("Toxic Terrain (dado: reforça Poison e tira 1/16): Toxic Surge arma; Biofilm na defesa", () => {
  assert.equal(efDe(["Toxic Surge"]).armaTerreno, "toxico");
  assert.equal(efDe(["Biofilm"]).noTerreno[0].terreno, "toxico");
});

test("luta inteira: item gasto não volta (Sitrus); Harvest guarda a baga", () => {
  const c = R.participanteDuelo(unidade(efDe([]), golpe("F"), { item: "Sitrus Berry", it: R.itemDoDuelo("Sitrus Berry", null) }));
  c.itemGasto = true;
  assert.equal(R.comoEstaDuelo(c).item, "");
  const h = R.participanteDuelo(unidade(efDe(["Harvest"], "sol"), golpe("F"), { item: "Sitrus Berry", it: R.itemDoDuelo("Sitrus Berry", null) }));
  h.itemGasto = true;
  assert.equal(R.comoEstaDuelo(h).item, "Sitrus Berry");
});
