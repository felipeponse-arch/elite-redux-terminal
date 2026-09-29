// Luta inteira contra o time do chefão (2026-09-29, decisão do usuário): HP que
// passa de uma luta pra outra, bônus de nocaute (Moxie), efeito de desmaio
// (Aftermath), hazards (Stealth Rock de Loose Rocks) e o detalhe do duelo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "SQ_" + nomes.join("+"), null);
const perto = (a, b) => Math.abs(a - b) < 1e-6;
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: true }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ sp: { n: "Teste", sname: "T" }, tipos: ["Water"], ids: [], ef, item: "", it: R.itemDoDuelo("", null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g] }, extra || {});

test("detalhe do duelo: quem vence e o HP que sobra; começar ferido pesa", () => {
  const eu = unidade(efDe([]), golpe("F"), { stats: [320, 100, 100, 100, 100, 120] });
  const ele = unidade(efDe([]), golpe("F"));
  const cheio = R.resultadoDoDuelo(eu, ele, 50, { detalhe: true });
  assert.equal(cheio.venceu, true);
  assert.ok(cheio.fracEu > 0 && cheio.fracEu < 1 && cheio.fracFoe === 0, JSON.stringify(cheio));
  const ferido = R.resultadoDoDuelo(eu, ele, 50, { detalhe: true, fracEu: 0.05 });
  assert.equal(ferido.venceu, false);
  assert.equal(R.resultadoDoDuelo(eu, ele, 50), 1, "sem ini, a nota de sempre");
});

test("o HP passa de uma luta pra outra: um só Pokémon não varre três iguais a ele", () => {
  const eu = unidade(efDe([]), golpe("F"), { stats: [320, 100, 100, 100, 100, 120] });
  const f = () => unidade(efDe([]), golpe("F"));
  const s = R.simularLutaContraChefao([eu], [f(), f(), f()], 50);
  assert.ok(s.derrubados >= 1 && s.derrubados < 3, JSON.stringify(s.log));
  assert.equal(s.venceu, false);
});

test("Moxie: o nocaute dá +1 de Ataque pra luta seguinte", () => {
  const moxie = unidade(efDe(["Moxie"]), golpe("F", { forca: 400, forcaBase: 400 }), { stats: [320, 100, 100, 100, 100, 120] });
  const semMoxie = unidade(efDe([]), golpe("F", { forca: 400, forcaBase: 400 }), { stats: [320, 100, 100, 100, 100, 120] });
  const f = () => unidade(efDe([]), golpe("F"), { stats: [900, 100, 100, 100, 100, 100] });
  const a = R.simularLutaContraChefao([moxie], [f(), f()], 50), b = R.simularLutaContraChefao([semMoxie], [f(), f()], 50);
  assert.ok(a.pontos > b.pontos, a.pontos + " x " + b.pontos);
});

test("Aftermath: quem derruba leva o golpe de desmaio", () => {
  const eu = unidade(efDe([]), golpe("F", { forca: 5000, forcaBase: 5000 }), { stats: [320, 100, 100, 100, 100, 120] });
  const com = R.simularLutaContraChefao([eu], [unidade(efDe(["Aftermath"]), golpe("F"))], 50);
  const sem = R.simularLutaContraChefao([eu], [unidade(efDe([]), golpe("F"))], 50);
  assert.ok(com.hpRestante < sem.hpRestante, com.hpRestante + " x " + sem.hpRestante);
});

test("hazard: Stealth Rock fere quem entra, pela tabela de Rock; Heavy-Duty Boots protege", () => {
  const lado = R.novoLadoDuelo();
  R.poeHazardDuelo(lado, "rocha");
  const c = R.participanteDuelo(unidade(efDe([]), golpe("F"), { tipos: ["Fire"] }));
  R.entrarNoLadoDuelo(c, lado);
  assert.ok(perto(c.frac, 1 - 2 / 8), "Fire leva 2x de Rock");
  const botas = R.participanteDuelo(unidade(efDe([]), golpe("F"), { tipos: ["Fire"], item: "Heavy-Duty Boots" }));
  R.entrarNoLadoDuelo(botas, lado);
  assert.equal(botas.frac, 1);
});
