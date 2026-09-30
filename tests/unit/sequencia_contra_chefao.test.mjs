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

// Quem o chefão manda depois de um nocaute (2026-09-30, regra do usuário pela run:
// depois da Sunflora veio quem tinha vantagem): primeiro quem tem golpe super
// efetivo no meu Pokémon em campo; sem isso, quem mais resiste a ele.
test("depois de um nocaute, o chefão manda quem tem vantagem sobre o meu Pokémon, não a ordem do time", () => {
  const eu = unidade(efDe([]), golpe("F", { forca: 900, forcaBase: 900, tipo: "Water" }), { tipos: ["Water"], stats: [5000, 100, 100, 100, 100, 200] });
  const abre = unidade(efDe([]), golpe("F"), { sp: { n: "Abre", sname: "A" }, nome: "Abre", tipos: ["Normal"] });
  const neutro = unidade(efDe([]), golpe("F"), { sp: { n: "Neutro", sname: "N" }, nome: "Neutro", tipos: ["Normal"] });
  const planta = unidade(efDe([]), golpe("E", { tipo: "Grass" }), { sp: { n: "Planta", sname: "P" }, nome: "Planta", tipos: ["Normal"] });
  const s = R.simularLutaContraChefao([eu], [abre, neutro, planta], 50);
  const derrubados = s.log.filter((l) => l.contra && !l.troca).map((l) => l.contra);
  assert.equal(derrubados.join(","), ["Abre", "Planta", "Neutro"].join(","), JSON.stringify(s.log));
});

test("sem ninguém com vantagem, entra quem mais resiste ao meu Pokémon", () => {
  const eu = unidade(efDe([]), golpe("F", { forca: 900, forcaBase: 900, tipo: "Water" }), { tipos: ["Normal"], stats: [5000, 100, 100, 100, 100, 200] });
  const abre = unidade(efDe([]), golpe("F"), { sp: { n: "Abre", sname: "A" }, nome: "Abre", tipos: ["Normal"] });
  const neutro = unidade(efDe([]), golpe("F"), { sp: { n: "Neutro", sname: "N" }, nome: "Neutro", tipos: ["Normal"] });
  const resiste = unidade(efDe([]), golpe("F"), { sp: { n: "Resiste", sname: "R" }, nome: "Resiste", tipos: ["Grass"] });
  const s = R.simularLutaContraChefao([eu], [abre, neutro, resiste], 50);
  const derrubados = s.log.filter((l) => l.contra && !l.troca).map((l) => l.contra);
  assert.equal(derrubados.join(","), ["Abre", "Resiste", "Neutro"].join(","), JSON.stringify(s.log));
});

// Revisão de 2026-09-30: "vantagem" é QUALQUER golpe de dano super efetivo, não só o
// mais forte - e a luta em dupla segue a mesma regra.
test("vantagem conta golpe super efetivo mesmo que não seja o mais forte do Pokémon do chefão", () => {
  const eu = { u: unidade(efDe([]), golpe("F", { tipo: "Water" }), { tipos: ["Water"] }), frac: 1, vivo: true, status: {}, bonus: { estagios: {}, crit: 0, mult: 1, semGolpe: [] } };
  const part = (nome, golpes, tipos) => ({ u: unidade(efDe([]), golpes[0], { sp: { n: nome, sname: nome }, nome, tipos, golpesProntos: golpes }), frac: 1, vivo: true, status: {}, bonus: { estagios: {}, crit: 0, mult: 1, semGolpe: [] } });
  const forteNeutro = golpe("F", { forca: 300, forcaBase: 300 });
  const fracoSe = golpe("E", { tipo: "Grass", forca: 20, forcaBase: 20 });
  const comSe = part("ComSe", [forteNeutro, fracoSe], ["Normal"]);
  const semSe = part("SemSe", [forteNeutro], ["Normal"]);
  assert.equal(R.escolherProximoDoChefao([semSe, comSe], [eu], 50), comSe);
});

test("luta em dupla: o chefão repõe quem tem vantagem, não a ordem do time", () => {
  const forte = golpe("F", { forca: 900, forcaBase: 900, tipo: "Water" });
  const eu1 = unidade(efDe([]), forte, { tipos: ["Water"], stats: [5000, 100, 100, 100, 100, 200] });
  const eu2 = unidade(efDe([]), forte, { tipos: ["Water"], stats: [5000, 100, 100, 100, 100, 200] });
  const f = (nome, g, tipos) => unidade(efDe([]), g, { sp: { n: nome, sname: nome, inn: [] }, nome, tipos, statusIds: [] });
  const s = R.simularDuplaContraChefao([eu1, eu2], [f("A", golpe("F"), ["Normal"]), f("B", golpe("F"), ["Normal"]), f("Neutro", golpe("F"), ["Normal"]), f("Planta", golpe("E", { tipo: "Grass" }), ["Normal"])], 50);
  const ordem = s.log.filter((l) => l.derruba).map((l) => l.derruba);
  assert.ok(ordem.indexOf("Planta") !== -1 && ordem.indexOf("Planta") < ordem.indexOf("Neutro"), JSON.stringify(ordem));
});
