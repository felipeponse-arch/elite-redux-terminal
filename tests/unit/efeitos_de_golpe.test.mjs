// Efeitos de golpe que a auditoria do motor apontou (2026-09-30), pelos textos do
// NextDex: Rock Climb de dois turnos, Fake Out só no 1º turno, Hex (Plasma Pulse),
// Eruption (Water Spout) e Knock Off.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "EG_" + nomes.join("+"), null);
const perto = (a, b) => Math.abs(a - b) < 1e-9;
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ sp: { n: "Teste", sname: "T", inn: [] }, tipos: ["Water"], ids: [], ef, item: "", it: R.itemDoDuelo("", null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g], statusIds: [] }, extra || {});
const u100 = (ab) => ({ ef: efDe(ab || []), tipos: ["Normal"], stats: [100, 100, 100, 100, 100, 100] });

test("Rock Climb é golpe de dois turnos ('A charging attack'): sai, salvo com Accelerate", () => {
  const rc = R.MOVE_ID_BY_NAME["Rock Climb"];
  assert.equal(R.prepararGolpesDuelo([rc], u100(), null).length, 0);
  assert.equal(R.prepararGolpesDuelo([rc], u100(["Accelerate"]), null).length, 1);
});

test("First Impression vale um golpe só: contra alvo que aguenta vários, a média cai", () => {
  const fi = R.MOVE_ID_BY_NAME["First Impression"];
  const atq = unidade(efDe([]), golpe("F"), { tipos: ["Bug"] });
  atq.golpesProntos = R.prepararGolpesDuelo([fi], atq, null);
  const alvo = (hp) => unidade(efDe([]), golpe("F"), { tipos: ["Normal"], stats: [hp, 100, 100, 100, 100, 100] });
  const umGolpe = R.danoNoDuelo(atq, alvo(10), 50).melhor.dano;
  const tanque = R.danoNoDuelo(atq, alvo(5000), 50).melhor.dano;
  assert.ok(tanque < umGolpe / 3, tanque + " x " + umGolpe);
});

test("Hex (Plasma Pulse): dobra na parte da luta em que o alvo tem status", () => {
  const u = unidade(efDe([]), golpe("E"));
  assert.ok(perto(R.golpeCondicionalDuelo(u, { efeito: "Hex" }, { queimar: 0.6 }, 0, 3), 1.6));
  assert.equal(R.golpeCondicionalDuelo(u, { efeito: "Hex" }, {}, 0, 3), 1);
});

test("Eruption (Water Spout): força pela média do HP de quem usa enquanto apanha", () => {
  const u = unidade(efDe([]), golpe("E"), { stats: [100, 100, 100, 100, 100, 100] });
  assert.ok(perto(R.golpeCondicionalDuelo(u, { efeito: "Eruption" }, {}, 50, 2), 0.75)); // (100% + 50%) / 2
  assert.equal(R.golpeCondicionalDuelo(u, { efeito: "Eruption" }, {}, 0, 3), 1);
});

test("Knock Off: o item do alvo vale metade da luta; pedra de Mega e Sticky Hold não caem", () => {
  const ko = R.MOVE_ID_BY_NAME["Knock Off"];
  const atq = unidade(efDe([]), golpe("F"), { tipos: ["Dark"] });
  atq.golpesProntos = R.prepararGolpesDuelo([ko], atq, null);
  const com = (item, ab) => unidade(efDe(ab || []), golpe("F"), { item, it: R.itemDoDuelo(item, null) });
  assert.equal(R.itemAtivoDuelo(com("Leftovers"), atq), 0.5);
  assert.equal(R.itemAtivoDuelo(com("Garchompite"), atq), 1);
  assert.equal(R.itemAtivoDuelo(com("Leftovers", ["Sticky Hold"]), atq), 1);
  assert.equal(R.itemAtivoDuelo(com("Leftovers"), unidade(efDe([]), golpe("F"))), 1, "sem Knock Off, o item vale inteiro");
});

// 2026-10-01 (lote dos golpes da auditoria): Hammer Arm e V-create baixam o próprio
// atributo; Rampage (Outrage...) deixa quem usa confuso depois de 2-3 turnos.
test("Hammer Arm baixa a própria Velocidade; V-create, Defesa, Def. Especial e Velocidade", () => {
  const ha = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["Hammer Arm"]], u100(), null)[0];
  assert.equal(ha.estagios.proprio.spe, -1);
  const vc = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["V-create"]], u100(), null)[0];
  assert.equal([vc.estagios.proprio.def, vc.estagios.proprio.spd, vc.estagios.proprio.spe].join(","), "-1,-1,-1");
});

test("Rampage (Outrage): em luta longa, quem usa fica confuso e se fere; Own Tempo não", () => {
  const out = R.MOVE_ID_BY_NAME["Outrage"];
  const atq = (ab) => { const u = unidade(efDe(ab || []), golpe("F"), { tipos: ["Dragon"], stats: [300, 100, 100, 100, 100, 100] }); u.golpesProntos = R.prepararGolpesDuelo([out], u, null); return u; };
  const semEfeito = (u) => Object.assign({}, u, { golpesProntos: u.golpesProntos.map((g) => Object.assign({}, g, { efeito: null })) });
  const tanque = () => unidade(efDe([]), golpe("F", { forca: 40, poder: 40, forcaBase: 40 }), { tipos: ["Normal"], stats: [900, 60, 140, 60, 140, 50] });
  const com = R.resultadoDoDuelo(atq(), tanque(), 50, { detalhe: true });
  const sem = R.resultadoDoDuelo(semEfeito(atq()), tanque(), 50, { detalhe: true });
  assert.ok(com.turnos > 3, "luta longa: " + com.turnos);
  assert.ok(com.fracEu < sem.fracEu, com.fracEu + " x " + sem.fracEu);
  const ownTempo = R.resultadoDoDuelo(atq(["Own Tempo"]), tanque(), 50, { detalhe: true });
  assert.ok(ownTempo.fracEu > com.fracEu, ownTempo.fracEu + " x " + com.fracEu);
});
