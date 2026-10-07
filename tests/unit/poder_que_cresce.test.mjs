// Ticket 19 (07/10/2026): poder que cresce e golpe que carrega, pelo código oficial (er-repo 217dd0f):
// battle_util.c CalcMoveBasePower EFFECT_MISC_HIT (Last Respects +10 por aliado caído, Rage Fist +20 por
// vez que levou dano até 6, Psyblade x1,5 no Electric Terrain) e battle_scripts_1.s Electro Shot.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const perto = (a, b) => Math.abs(a - b) < 1e-9;
const unid = (golpes, extra = {}) => {
  const u = Object.assign({ nome: "x", ef: R.efeitoDasHabilidadesNoDuelo((extra.habs || []).map(idHab), "PC_" + (extra.habs || []).join("+"), null), tipos: ["Normal"], stats: [300, 100, 100, 100, 100, 100], ids: [], item: "", sp: { n: "x" } }, extra.u || {});
  u.golpesProntos = R.prepararGolpesDuelo(golpes.map((n) => R.MOVE_ID_BY_NAME[n]), u, extra.clima || null);
  return u;
};
const comEf = (ef) => ({ ef: Object.assign({}, unid([]).ef, ef), tipos: ["Normal"] });

test("Last Respects: poder do dado (90) +10 por aliado caído", () => {
  assert.equal(R.poderVariavelDuelo("Last Respects", comEf({}), null), 90);
  assert.equal(R.poderVariavelDuelo("Last Respects", comEf({ aliadosCaidos: 3 }), null), 120);
  assert.equal(unid(["Last Respects"]).golpesProntos[0].poderVariavel, "Last Respects");
});

test("Rage Fist: 80 +20 por golpe levado, até 6 (200); dentro do duelo cresce a cada golpe", () => {
  assert.equal(R.poderVariavelDuelo("Rage Fist", comEf({ jaApanhou: 2 }), null), 120);
  assert.equal(R.poderVariavelDuelo("Rage Fist", comEf({ jaApanhou: 9 }), null), 200);
  const g = unid(["Rage Fist"]).golpesProntos[0];
  assert.ok(perto(R.golpeCondicionalDuelo(comEf({}), g, {}, 0, 3), (80 + 100 + 120) / 3 / 80));
  assert.equal(R.golpeCondicionalDuelo(comEf({ jaApanhou: 6 }), g, {}, 0, 3), 1, "no máximo não cresce mais");
});

test("Psyblade: x1,5 no Electric Terrain para quem está no chão", () => {
  const antes = R.CAMPO_DUELO;
  try {
    R.CAMPO_DUELO = { terreno: "eletrico" };
    assert.equal(R.poderVariavelDuelo("Psyblade", unid([]), null), 85 * 1.5);
    assert.equal(R.poderVariavelDuelo("Psyblade", unid([], { u: { tipos: ["Flying"] } }), null), 85);
    R.CAMPO_DUELO = null;
    assert.equal(R.poderVariavelDuelo("Psyblade", unid([]), null), 85);
  } finally { R.CAMPO_DUELO = antes; }
});

test("Electro Shot: sem chuva carrega (fica fora); na chuva, Accelerate ou Power Herb sai com o +1 de Sp. Atk", () => {
  assert.equal(unid(["Electro Shot"]).golpesProntos.length, 0);
  const chuva = unid(["Electro Shot"], { clima: "chuva" }).golpesProntos[0];
  assert.ok(chuva, "na chuva dispara na hora");
  assert.ok(perto(chuva.forca / chuva.forcaBase, 1.5), "o +1 de Sp. Atk entra antes do dano");
  assert.ok(unid(["Electro Shot"], { habs: ["Accelerate"] }).golpesProntos.length === 1);
  const contrario = unid(["Electro Shot"], { clima: "chuva", habs: ["Contrary"] }).golpesProntos[0];
  assert.ok(perto(contrario.forca / contrario.forcaBase, 2 / 3), "Contrary: o +1 vira -1");
});

test("luta contra o chefão: Last Respects conta os meus caídos e Rage Fist os golpes levados no duelo anterior", () => {
  // Last Respects no chefão (a ordem dele é fixa): depois de 2 caídos, bate mais no meu.
  const isca = (n) => unid(["Tackle"], { u: { nome: n, sp: { n }, stats: [10, 10, 10, 10, 10, 10] } });
  const lr = () => unid(["Last Respects"], { u: { nome: "LR", sp: { n: "LR" }, stats: [300, 110, 100, 50, 100, 60] } });
  const meu = () => unid(["Tackle"], { u: { nome: "Meu", sp: { n: "Meu" }, tipos: ["Fighting"], stats: [420, 90, 110, 50, 110, 80] } });
  const so = R.simularLutaContraChefao([meu()], [lr()], 50).log.find((l) => l.contra === "LR");
  const comCaidos = R.simularLutaContraChefao([meu()], [isca("I1"), isca("I2"), lr()], 50).log.find((l) => l.contra === "LR");
  assert.ok(comCaidos.fracFoe > so.fracFoe + 0.05, "com 2 caídos o Last Respects dele fecha antes: " + comCaidos.fracFoe + " x " + so.fracFoe);
  // Rage Fist leva os golpes levados para o duelo seguinte: o 2º duelo rende mais que começando do zero.
  const parede = () => unid(["Tackle"], { u: { nome: "Parede", sp: { n: "Parede" }, tipos: ["Fighting"], stats: [300, 90, 110, 50, 110, 80] } });
  const rf = () => unid(["Rage Fist"], { u: { nome: "RF", sp: { n: "RF" }, tipos: ["Normal"], stats: [400, 120, 120, 50, 120, 60] } });
  const fraco = () => unid(["Tackle"], { u: { nome: "Fraco", sp: { n: "Fraco" }, tipos: ["Fighting"], stats: [200, 80, 90, 50, 90, 80] } });
  const s = R.simularLutaContraChefao([rf()], [fraco(), parede()], 50);
  const d1 = s.log[0], d2 = s.log.find((l) => l.contra === "Parede");
  assert.equal(d1.venceu, true);
  assert.ok(d1.turnos >= 2, "levou golpes no 1º duelo: " + d1.turnos);
  const doZero = R.resultadoDoDuelo(rf(), parede(), 50, { detalhe: true, fracEu: d1.fracEu });
  assert.ok(d2.fracEu > doZero.fracEu + 0.02, "fecha antes e sobra mais HP: " + d2.fracEu + " x " + doZero.fracEu);
});
