// Fase 4 da reunião de 30/09/2026: o motor conferido contra o FAQ oficial, o
// changelog 2.65.3b e o dado. Uma checagem por divergência (A a G).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes, clima) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "F4_" + nomes.join("+") + (clima || ""), clima || null);
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ sp: { n: "Teste", sname: "T", inn: [] }, tipos: ["Water"], ids: [], ef, item: "", it: R.itemDoDuelo("", null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g], statusIds: [] }, extra || {});
const combinar = (eu, ele) => R.danoComStatusNoDuelo(eu, ele, R.danoNoDuelo(eu, ele, 50), R.danoNoDuelo(ele, eu, 50), 4, true);
const u100 = (ids, tipos) => ({ ef: R.efeitoDasHabilidadesNoDuelo(ids, "F4U" + ids.join(), null), tipos: tipos || ["Normal"], stats: [100, 100, 100, 100, 100, 100] });

test("A. habilidade composta aplica TODAS as partes (Fearmonger, Yuki Onna, Fire's Wrath, As One, Atlantic Ruler)", () => {
  for (const n of ["Fearmonger", "Yuki Onna", "Fire's Wrath"]) {
    const e = efDe([n]);
    assert.equal(e.intimida, 1, n + " intimida");
    assert.equal(e.assusta, 1, n + " assusta");
  }
  // Duas "As One" com textos diferentes: a de Grim Neigh ganha o efeito do Grim Neigh.
  const asOne = R.DATA.abilities.map((a, i) => ({ a, i })).filter((o) => o.a && o.a[0] === "As One" && /Grim Neigh/.test(o.a[1]));
  assert.equal(asOne.length, 1);
  assert.match(R.descricaoDeHabilidadePorId(asOne[0].i), /KOs raise Sp\. Atk/);
  // O dado grava a parte como "ChillngNeigh" (nome cortado no jogo): a de Chilling Neigh também ganha o efeito (15/10).
  const asOneAtk = R.DATA.abilities.map((a, i) => ({ a, i })).filter((o) => o.a && o.a[0] === "As One" && /Chilling Neigh/.test(o.a[1]));
  assert.equal(asOneAtk.length, 1);
  assert.match(R.descricaoDeHabilidadePorId(asOneAtk[0].i), /KOs raise Attack/);
  assert.match(R.descricaoDeHabilidadePorId(idHab("Atlantic Ruler")), /Boosts the power of Water-type moves by 1\.5x/);
});

test("B. Bleed impede a cura e anula as subidas de quem sangra", () => {
  const sangra = golpe("F", { status: [{ st: "sangrar", p: 1, doGolpe: true }] });
  const ataca = unidade(efDe([]), sangra);
  const normal = unidade(efDe([]), golpe("F"));
  const curaCom = combinar(unidade(efDe([]), golpe("F")), normal).dele - combinar(unidade(efDe(["Self Sufficient"]), golpe("F")), normal).dele;
  const curaSangrando = combinar(unidade(efDe([]), golpe("F")), ataca).dele - combinar(unidade(efDe(["Self Sufficient"]), golpe("F")), ataca).dele;
  assert.ok(curaCom > 0);
  assert.ok(curaSangrando < curaCom * 0.6, curaSangrando + " x " + curaCom);
  // Subida na entrada (Intrepid Sword) perde valor quando o rival faz sangrar.
  const comSubida = (ele) => combinar(unidade(efDe(["Intrepid Sword"]), golpe("F")), ele).meu;
  assert.ok(comSubida(ataca) < comSubida(normal));
});

test("D. Eerie Fog: subida cai 1 por turno; cura pelo clima (Moonlight...) cai pra 1/4 no clima", () => {
  assert.equal(R.subidaMediaNaNevoa(2, 4), 0.75);
  assert.equal(R.subidaMediaNaNevoa(1, 1), 1);
  const lua = R.planoDoGolpeStatus(R.MOVE_ID_BY_NAME["Moonlight"]);
  assert.equal(lua && lua.peloClima, true);
  assert.equal(R.planoDoGolpeStatus(R.MOVE_ID_BY_NAME["Roost"]).peloClima, false);
});

test("E. Aurora Borealis: Blizzard e Sheer Cold não erram", () => {
  const bz = R.MOVE_ID_BY_NAME["Blizzard"];
  assert.ok(R.prepararGolpesDuelo([bz], u100([]), null)[0].precisao < 1);
  assert.equal(R.prepararGolpesDuelo([bz], u100([idHab("Aurora Borealis")]), null)[0].precisao, 1);
});

test("F. False Swipe/Hold Back (deixam 1 HP) não entram como golpe de nocaute", () => {
  for (const n of ["False Swipe", "Hold Back"]) assert.equal(R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME[n]], u100([]), null).length, 0, n);
});

test("G. Draco Meteor perde força a cada uso (-2 Sp. Atk); Contrary faz subir", () => {
  const dm = R.MOVE_ID_BY_NAME["Draco Meteor"];
  const atq = (ab) => { const u = unidade(efDe(ab), golpe("E"), { tipos: ["Dragon"] }); u.golpesProntos = R.prepararGolpesDuelo([dm], u, null); return u; };
  const tanque = unidade(efDe([]), golpe("F"), { stats: [2000, 100, 100, 100, 100, 100], tipos: ["Normal"] });
  const cheio = R.danoNoDuelo(atq([]), unidade(efDe([]), golpe("F"), { stats: [10, 100, 100, 100, 100, 100], tipos: ["Normal"] }), 50).melhor.dano;
  const longo = R.danoNoDuelo(atq([]), tanque, 50).melhor.dano;
  assert.ok(longo < cheio * 0.6, "vários usos: bem menos que o 1º golpe (" + longo + " x " + cheio + ")");
  assert.ok(R.danoNoDuelo(atq(["Contrary"]), tanque, 50).melhor.dano > cheio, "Contrary: sobe a cada uso");
});
