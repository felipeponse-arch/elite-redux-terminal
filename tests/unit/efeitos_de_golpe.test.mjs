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
  assert.equal(ha.estagios?.proprio?.spe, -1); // ?. : sem a regra, falha por asserção (não por TypeError)
  const vc = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["V-create"]], u100(), null)[0];
  assert.equal([vc.estagios?.proprio?.def, vc.estagios?.proprio?.spd, vc.estagios?.proprio?.spe].join(","), "-1,-1,-1");
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

// 2026-10-01, 2º lote (textos do NextDex 2.65beta, a versão dos dados do app).
const prep = (nome, atq) => { const u = atq || unidade(efDe([]), golpe("E")); u.golpesProntos = R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME[nome]], u, null); return u; };
const alvoDe = (tipos) => unidade(efDe([]), golpe("F"), { tipos, stats: [5000, 100, 100, 100, 100, 100] });
test("'Super effective vs X': Freeze-Dry em Water, Acid em Steel (que seria imune a Poison)", () => {
  const fd = prep("Freeze-Dry", unidade(efDe([]), golpe("E"), { tipos: ["Ice"] }));
  assert.equal(R.danoNoDuelo(fd, alvoDe(["Water"]), 50).melhor.efTipo, 2);
  assert.equal(R.danoNoDuelo(fd, alvoDe(["Water", "Ground"]), 50).melhor.efTipo, 4);
  assert.equal(R.danoNoDuelo(fd, alvoDe(["Fire"]), 50).melhor.efTipo, 0.5, "fora do tipo citado, tabela normal");
  const acid = prep("Acid", unidade(efDe([]), golpe("E"), { tipos: ["Poison"] }));
  assert.equal(R.danoNoDuelo(acid, alvoDe(["Steel"]), 50).melhor.efTipo, 2);
});
test("Upper Hand só vale contra quem tem golpe de prioridade", () => {
  const uh = prep("Upper Hand", unidade(efDe([]), golpe("F"), { tipos: ["Fighting"] }));
  assert.equal(R.danoNoDuelo(uh, alvoDe(["Normal"]), 50).melhor.dano, 0);
  const comPrio = alvoDe(["Normal"]); comPrio.golpesProntos = [golpe("F", { prio: 1 })];
  assert.ok(R.danoNoDuelo(uh, comPrio, 50).melhor.dano > 0);
});
test("Infernal Parade: +50% na parte da luta com o alvo sob status; Matcha Gotcha drena metade", () => {
  const u = unidade(efDe([]), golpe("E"));
  assert.ok(perto(R.golpeCondicionalDuelo(u, { efeito: "Infernal Parade" }, { queimar: 0.6 }, 0, 3), 1.3));
  assert.equal(R.golpeCondicionalDuelo(u, { efeito: "Infernal Parade" }, {}, 0, 3), 1);
  assert.equal(prep("Matcha Gotcha").golpesProntos[0].dreno, 0.5);
});
test("Glaive Rush: quem usa leva o dobro - vence menos que o mesmo golpe sem a regra", () => {
  const atq = () => prep("Glaive Rush", unidade(efDe([]), golpe("F"), { tipos: ["Dragon"], stats: [600, 100, 150, 100, 150, 100] }));
  const semRegra = (u) => Object.assign({}, u, { golpesProntos: u.golpesProntos.map((g) => Object.assign({}, g, { nome: "Outro" })) });
  const rival = () => unidade(efDe([]), golpe("F", { forca: 40, poder: 40, forcaBase: 40 }), { tipos: ["Normal"], stats: [700, 80, 100, 80, 100, 80] });
  const com = R.resultadoDoDuelo(atq(), rival(), 50, { detalhe: true }), sem = R.resultadoDoDuelo(semRegra(atq()), rival(), 50, { detalhe: true });
  assert.ok(com.fracEu < sem.fracEu, com.fracEu + " x " + sem.fracEu);
});
