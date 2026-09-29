// Golpes de status no duelo (2026-09-29, decisão do usuário: "com regras
// simples"). Cada lado escolhe o plano que mais rende contra o outro atacando
// direto: setup, queimar/paralisar/envenenar/dormir, cura que sustenta, tela,
// Taunt, Haze, Disable, clima. Magic Bounce, Good As Gold e Prankster valem.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const idG = (n) => R.MOVE_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "GS_" + nomes.join("+"), null);
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ sp: { n: "Teste", sname: "T" }, tipos: ["Water"], ids: [], ef, item: "", it: R.itemDoDuelo("", null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g], statusIds: [] }, extra || {});
const duelo = (eu, ele) => R.resultadoDoDuelo(eu, ele, 50, { detalhe: true });

test("classificação pelo efeito do dado", () => {
  assert.deepEqual({ ...R.planoDoGolpeStatus(idG("Swords Dance")).estagios }, { atk: 2 });
  assert.equal(R.planoDoGolpeStatus(idG("Will-O-Wisp")).status, "queimar");
  assert.equal(R.planoDoGolpeStatus(idG("Recover")).tipo, "cura");
  assert.equal(R.planoDoGolpeStatus(idG("Stealth Rock")).hazard, "rocha");
  assert.equal(R.planoDoGolpeStatus(idG("Rain Dance")).clima, "chuva");
});

test("setup: Swords Dance contra quem bate pouco vira vitória com folga", () => {
  const fraco = unidade(efDe([]), golpe("F", { forca: 20, forcaBase: 20 }));
  const semSD = duelo(unidade(efDe([]), golpe("F", { forca: 30, forcaBase: 30 })), fraco);
  const comSD = duelo(unidade(efDe([]), golpe("F", { forca: 30, forcaBase: 30 }), { statusIds: [idG("Swords Dance")] }), fraco);
  assert.equal(comSD.planoEu, "Swords Dance");
  assert.ok(comSD.fracEu > semSD.fracEu, comSD.fracEu + " x " + semSD.fracEu);
});

test("Will-O-Wisp contra atacante físico: queimado, ele bate pela metade", () => {
  const fisico = unidade(efDe([]), golpe("F", { forca: 120, forcaBase: 120 }), { stats: [320, 150, 100, 100, 100, 90] });
  const eu = (ids) => unidade(efDe([]), golpe("E", { forca: 60, forcaBase: 60 }), { statusIds: ids });
  const r = duelo(eu([idG("Will-O-Wisp")]), fisico);
  assert.equal(r.planoEu, "Will-O-Wisp");
  assert.ok(r.nota > duelo(eu([]), fisico).nota);
  // Tipo Fire é imune: não há plano.
  assert.equal(duelo(eu([idG("Will-O-Wisp")]), Object.assign({}, fisico, { tipos: ["Fire"] })).planoEu, null);
});

test("Magic Bounce devolve, Good As Gold é imune, Prankster falha em Dark", () => {
  const eu = unidade(efDe([]), golpe("E"));
  assert.equal(R.statusPassaDuelo(eu, unidade(efDe(["Magic Bounce"]), golpe("F"))), false);
  assert.equal(R.statusPassaDuelo(eu, unidade(efDe(["Good As Gold"]), golpe("F"))), false);
  assert.equal(R.statusPassaDuelo(unidade(efDe(["Prankster"]), golpe("E")), unidade(efDe([]), golpe("F"), { tipos: ["Dark"] })), false);
  assert.equal(R.statusPassaDuelo(eu, unidade(efDe([]), golpe("F"))), true);
});

test("Thunder Wave não pega em Ground; sono barrado por Insomnia", () => {
  const eu = unidade(efDe([]), golpe("E"));
  const base = { dX: 10, dY: 10, hpX: 320, hpY: 320, golpeX: eu.golpesProntos[0], golpeY: golpe("F") };
  assert.equal(R.efeitoDoPlanoDuelo(eu, unidade(efDe([]), golpe("F"), { tipos: ["Ground"] }), idG("Thunder Wave"), base, 50), null);
  assert.ok(R.efeitoDoPlanoDuelo(eu, unidade(efDe([]), golpe("F")), idG("Thunder Wave"), base, 50));
  assert.equal(R.efeitoDoPlanoDuelo(eu, unidade(efDe(["Insomnia"]), golpe("F")), idG("Spore"), base, 50), null);
});

test("Recover sustenta quando o rival tira menos que a cura por turno", () => {
  const fraco = unidade(efDe([]), golpe("F", { forca: 15, forcaBase: 15 }), { stats: [320, 100, 100, 100, 100, 150] });
  const eu = unidade(efDe([]), golpe("E", { forca: 5, forcaBase: 5 }), { statusIds: [idG("Recover")] });
  const r = duelo(eu, Object.assign({}, fraco, { stats: [2000, 100, 100, 100, 100, 150] }));
  assert.equal(r.planoEu, "Recover");
  assert.equal(r.venceu, true);
});

test("Taunt do mais rápido cancela o setup do outro", () => {
  const setup = unidade(efDe([]), golpe("F", { forca: 40, forcaBase: 40 }), { statusIds: [idG("Swords Dance")], stats: [320, 100, 100, 100, 100, 50] });
  const eu = (ids) => unidade(efDe([]), golpe("F", { forca: 40, forcaBase: 40 }), { statusIds: ids, stats: [320, 100, 100, 100, 100, 150] });
  const semTaunt = duelo(eu([]), setup), comTaunt = duelo(eu([idG("Taunt")]), setup);
  assert.equal(semTaunt.planoEle, "Swords Dance");
  assert.equal(comTaunt.planoEu, "Taunt");
  assert.ok(comTaunt.nota > semTaunt.nota, comTaunt.nota + " x " + semTaunt.nota);
  assert.equal(R.planoDoGolpeStatus(idG("Taunt")).tipo, "taunt");
});

// Bug achado no rank de 2026-09-29: "sustenta" exigia só dano < cura, mas quem
// alterna cura e ataque leva 2 golpes por cura (Umbreon com Moonlight segurava o
// Garchomp levando 0,38 do HP por turno).
test("cura só sustenta se dois golpes tiram menos que a cura", () => {
  const eu = unidade(efDe([]), golpe("E"));
  const base = (dY) => ({ dX: 10, dY, hpX: 320, hpY: 320, golpeX: eu.golpesProntos[0], golpeY: golpe("F") });
  const alvo = unidade(efDe([]), golpe("F"));
  assert.ok(R.efeitoDoPlanoDuelo(eu, alvo, idG("Recover"), base(70), 50), "70 x 2 = 140 < 160: sustenta");
  assert.equal(R.efeitoDoPlanoDuelo(eu, alvo, idG("Recover"), base(100), 50), null, "100 x 2 = 200 > 160: não sustenta");
});
