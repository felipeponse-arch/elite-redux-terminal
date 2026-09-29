// Cura, recuo e dano por contato no duelo (2026-09-29): recuo e dreno dos golpes
// vêm do dado (move_categorias: rc/dr, da descrição longa do NextDex).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes, clima) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "CR2_" + nomes.join("+") + (clima || ""), clima || null);
const perto = (a, b) => Math.abs(a - b) < 1e-6;
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ tipos: ["Water"], ids: [], ef, item: "", stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g] }, extra || {});
const combinar = (eu, ele) => R.danoComStatusNoDuelo(eu, ele, R.danoNoDuelo(eu, ele, 50), R.danoNoDuelo(ele, eu, 50), 3, true);

test("dado: recuo e dreno dos golpes (Brave Bird 33%, Head Smash 50%, Mega Drain 75%)", () => {
  const e = (n) => R.MOVE_CATEGORIAS[R.MOVE_ID_BY_NAME[n]] || {};
  assert.equal(e("Brave Bird").rc, 33);
  assert.equal(e("Head Smash").rc, 50);
  assert.equal(e("Mega Drain").dr, 75);
  assert.equal(e("Drain Punch").dr, 50);
});

test("golpe: Rock Head anula o recuo; Reckless reforça o golpe com recuo", () => {
  const bb = R.MOVE_ID_BY_NAME["Brave Bird"];
  const u = (ab) => ({ ef: efDe(ab), tipos: ["Normal"], stats: [100, 100, 100, 100, 100, 100] });
  const [base] = R.prepararGolpesDuelo([bb], u([]), null);
  assert.ok(perto(base.recuo, 0.33));
  assert.equal(R.prepararGolpesDuelo([bb], u(["Rock Head"]), null)[0].recuo, 0);
  assert.ok(perto(R.prepararGolpesDuelo([bb], u(["Reckless"]), null)[0].forca / base.forca, 1.2));
});

// Recuo, custo e dreno valem sobre o dano que entra (até o HP do alvo) e só nos
// golpes ANTES do nocaute - o do golpe que derruba não muda o resultado.
const entraEAntes = (ataque, hpAlvo) => { const n = Math.ceil(hpAlvo / ataque); return { entra: Math.min(ataque, hpAlvo / n), antes: (n - 1) / n }; };
test("recuo de quem ataca vira dano a mais contra ele mesmo (só antes do golpe que derruba)", () => {
  const ele = unidade(efDe([]), golpe("F"));
  const semRecuo = combinar(unidade(efDe([]), golpe("F")), ele);
  const comRecuo = combinar(unidade(efDe([]), golpe("F", { recuo: 0.33 })), ele);
  const ataque = R.danoNoDuelo(unidade(efDe([]), golpe("F")), ele, 50).melhor.dano;
  const { entra, antes } = entraEAntes(ataque, 320);
  assert.ok(perto(comRecuo.dele - semRecuo.dele, 0.33 * entra * antes), (comRecuo.dele - semRecuo.dele) + " x " + 0.33 * entra * antes);
});

test("Rough Skin pune o contato; Magic Guard ignora", () => {
  const rough = unidade(efDe(["Rough Skin"]), golpe("F"));
  const contato = (ab) => unidade(efDe(ab), golpe("F", { contato: true }));
  const d = combinar(contato([]), rough).dele - combinar(unidade(efDe([]), golpe("F")), rough).dele;
  assert.ok(perto(d, 320 / 8));
  assert.ok(perto(combinar(contato(["Magic Guard"]), rough).dele, combinar(unidade(efDe(["Magic Guard"]), golpe("F")), rough).dele));
});

test("cura por turno (Self Sufficient) reduz o dano líquido que leva; Permanence do rival anula", () => {
  const ele = (ab) => unidade(efDe(ab), golpe("F"));
  const eu = (ab) => unidade(efDe(ab), golpe("F"));
  const sem = combinar(eu([]), ele([])).dele, com = combinar(eu(["Self Sufficient"]), ele([])).dele;
  assert.ok(perto(sem - com, 320 / 16));
  assert.ok(perto(combinar(eu(["Self Sufficient"]), ele(["Permanence"])).dele, sem));
});

test("dreno: metade do dano causado volta; Liquid Ooze do alvo transforma em dano", () => {
  const ele = (ab) => unidade(efDe(ab), golpe("F"));
  const dreno = unidade(efDe([]), golpe("F", { dreno: 0.5 }));
  const ataque = R.danoNoDuelo(dreno, ele([]), 50).melhor.dano;
  const sem = combinar(unidade(efDe([]), golpe("F")), ele([])).dele;
  const { entra } = entraEAntes(ataque, 320);
  assert.ok(perto(sem - combinar(dreno, ele([])).dele, 0.5 * entra));
  assert.ok(perto(combinar(dreno, ele(["Liquid Ooze"])).dele - sem, 0.5 * entra));
});

// Bug achado no rank de 2026-09-29: o recuo usava o dano "bruto" (Head Smash de 650
// num alvo de 153 de HP custava 325) e contava até o golpe que derruba - o set
// ofensivo perdia duelos que nocauteava de um golpe só.
test("golpe de recuo que nocauteia de uma vez vence (o recuo do golpe final não conta)", () => {
  const eu = unidade(efDe([]), golpe("F", { forca: 5000, forcaBase: 5000, recuo: 0.5 }), { stats: [171, 100, 100, 100, 100, 100] });
  const ele = unidade(efDe([]), golpe("F"), { stats: [153, 100, 100, 100, 100, 200] });
  const r = R.resultadoDoDuelo(eu, ele, 50, { detalhe: true });
  assert.equal(r.venceu, true, JSON.stringify(r));
  assert.ok(r.fracEu > 0.5, "leva só o golpe dele, sem recuo nenhum");
});
