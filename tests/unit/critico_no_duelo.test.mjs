// Crítico no duelo (2026-09-29): antes o motor não tinha crítico nenhum - Super
// Luck, Sniper, Merciless, Battle Armor e o flag "High Crit Rate" do golpe não
// valiam nada. Regra da série (a fonte oficial não redefine): 1/24, 1/8, 1/2 e
// sempre por estágio; dano 1,5x.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "CR_" + nomes.join("+"), null);
const perto = (a, b) => Math.abs(a - b) < 1e-9;
const golpe = (crit) => ({ nome: "T", tipo: "Normal", cat: "F", contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, status: [], crit });
const unidade = (ef, g) => ({ tipos: ["Water"], ids: [], ef, stats: [300, 100, 100, 100, 100, 100], golpesProntos: [g] });

test("chance por estágio: 1/24, 1/8, 1/2, sempre", () => {
  assert.ok(perto(R.chanceDoEstagioCrit(0), 1 / 24));
  assert.ok(perto(R.chanceDoEstagioCrit(1), 1 / 8));
  assert.equal(R.chanceDoEstagioCrit(2), 0.5);
  assert.equal(R.chanceDoEstagioCrit(5), 1);
});

test("texto do jogo: Super Luck, Sniper, Precise Fist, Battle Aura, Battle Armor, Bad Luck", () => {
  assert.equal(efDe(["Super Luck"]).critEstagio, 1);
  assert.equal(efDe(["Sniper"]).critMult, 2.25);
  assert.equal(efDe(["Precise Fist"]).critCategoria.soco, 1);
  const aura = efDe(["Battle Aura"]);
  assert.ok(aura.critEstagio === 2 && aura.critTodos === 2, "vale pros dois lados");
  assert.ok(efDe(["Battle Armor"]).imuneCritico);
  assert.ok(efDe(["Bad Luck"]).imuneCritico, "Foes can't crit");
});

test("golpe: o flag High Crit Rate do dado soma um estágio; Always Crits crita sempre", () => {
  const u = { ef: efDe([]) };
  const achar = (flag) => R.MOVES.find((m) => m && m[3] > 0 && (m[8] || []).some((i) => R.DATA.flags[i] === flag));
  const alto = achar("High Crit Rate"), sempre = achar("Always Crits");
  assert.ok(alto && sempre, "fixture: golpes com os dois flags");
  assert.equal(R.criticoDoGolpeDuelo(alto, { contato: false }, [], u).estagio, 1);
  assert.equal(R.criticoDoGolpeDuelo(sempre, { contato: false }, [], u).sempre, true);
});

test("dano: crítico entra como valor esperado; Sniper aumenta; Battle Armor anula", () => {
  const nada = efDe([]);
  const dano = (efAtq, efDef, crit) => R.danoNoDuelo(unidade(efAtq, golpe(crit)), unidade(efDef, golpe(crit)), 50).melhor.dano;
  // Só a imunidade (o Battle Armor de verdade também reduz 20% do dano).
  const semCrit = dano(nada, Object.assign({}, nada, { imuneCritico: true }), { estagio: 0, sempre: false });
  const base = dano(nada, nada, { estagio: 0, sempre: false });
  assert.ok(perto(base / semCrit, 1 + (1 / 24) * 0.5));
  const sempre = dano(nada, nada, { estagio: 0, sempre: true });
  assert.ok(perto(sempre / semCrit, 1.5));
  assert.ok(perto(dano(efDe(["Sniper"]), nada, { estagio: 0, sempre: true }) / semCrit, 2.25));
});

test("Merciless crita sempre o alvo envenenado; Ambush garante o 1º turno", () => {
  const nada = efDe([]);
  const veneno = golpe({ estagio: 0, sempre: false });
  veneno.status = [{ st: "envenenar", p: 1, doGolpe: true }];
  const eu = unidade(efDe(["Merciless"]), veneno), ele = unidade(nada, golpe({ estagio: 0, sempre: false }));
  const d = (u) => R.danoNoDuelo(u, ele, 50);
  const comMerciless = R.danoComStatusNoDuelo(eu, ele, d(eu), R.danoNoDuelo(ele, eu, 50), 1, true).meu;
  const semMerciless = R.danoComStatusNoDuelo(Object.assign({}, eu, { ef: nada }), ele, d(Object.assign({}, eu, { ef: nada })), R.danoNoDuelo(ele, eu, 50), 1, true).meu;
  // Os dois lados levam o mesmo resíduo do veneno (1/8 de 300); fora ele, 1,5x / fator comum.
  const f0 = d(eu).melhor.crit.fator;
  assert.ok(perto((comMerciless - 37.5) / (semMerciless - 37.5), 1.5 / f0), comMerciless + " x " + semMerciless);
  const amb = unidade(efDe(["Ambush"]), golpe({ estagio: 0, sempre: false }));
  const dAmb = R.danoNoDuelo(amb, ele, 50);
  const st = R.danoComStatusNoDuelo(amb, ele, dAmb, R.danoNoDuelo(ele, amb, 50), 2, true);
  const f = dAmb.melhor.crit.fator;
  assert.ok(perto(st.meu / dAmb.melhor.dano, ((1.5 + f) / 2) / f), "metade da luta (1 de 2 turnos) com crítico certo");
});
