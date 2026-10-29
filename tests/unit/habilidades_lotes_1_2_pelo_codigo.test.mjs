// TK-12, divergências dos lotes 1 e 2 conferidas no código do jogo (er-repo f34fc2b):
// Run Away +2 (abilities.cc:11827) e Prankster que não barra golpe de campo (battle_util.c:8650-8667).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const idG = (n) => R.MOVE_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "L12_" + nomes.join("+"), null);
const golpe = (cat) => ({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 });
const unidade = (ef, g, extra) => Object.assign({ sp: { n: "Teste", sname: "T" }, tipos: ["Water"], ids: [], ef, item: "", it: R.itemDoDuelo("", null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g], statusIds: [] }, extra || {});

test("Run Away: +2 de Speed ao ser reduzido (abilities.cc:11827), não +1", () => {
  assert.equal(efDe(["Run Away"]).aoSerReduzido.spe, 2);
});

test("Prankster não barra golpe de lado (Reflect, Tailwind, hazard) contra Dark, mas barra status no alvo", () => {
  const dark = unidade(efDe([]), golpe("F"), { tipos: ["Dark"] });
  const eu = unidade(efDe(["Prankster"]), golpe("E"));
  assert.equal(R.statusPassaDuelo(eu, dark), false);
  assert.equal(R.statusPassaDuelo(eu, dark, true), true);
  const base = { golpeX: golpe("E"), golpeY: golpe("F") };
  const plano = (nome) => R.efeitoDoPlanoDuelo(eu, dark, idG(nome), base, 50);
  assert.notEqual(plano("Reflect"), null);
  assert.notEqual(plano("Tailwind"), null);
  assert.equal(plano("Taunt"), null);
});

test("Blinking Flash: golpe de luz do portador tira precisão média do rival (10% de -1 ACC por acerto, abilities.cc:12919)", () => {
  const ef = efDe(["Blinking Flash"]);
  assert.equal(ef.luzReduzPrecisao, 0.1);
  const luz = { ...golpe("E"), cats: ["luz"], precisao: 1 };
  const dono = unidade(ef, luz);
  const rival = unidade(efDe([]), golpe("F"));
  const est = R.estagiosMediosDuelo(rival, dono, rival.golpesProntos[0], luz, 7); // acumula = 3 golpes
  assert.ok(Math.abs(est.acc - -0.3) < 1e-9);
  const semLuz = R.estagiosMediosDuelo(rival, dono, rival.golpesProntos[0], golpe("E"), 7);
  assert.equal(semLuz.acc, 0);
});
