// Condições da luta no duelo (2026-09-29): status no próprio Pokémon (Guts com
// Flame Orb), ordem do turno (Analytic), alvo abaixo da metade (Opportunist),
// HP cheio (Tera Shell), cura do próprio status (Shed Skin) e reviver.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes, clima) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "CD_" + nomes.join("+") + clima, clima || null);
const perto = (a, b) => Math.abs(a - b) < 1e-9;
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, status: [], crit: { estagio: 0, sempre: false } }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ tipos: ["Water"], ids: [], ef, item: "", stats: [300, 100, 100, 100, 100, 100], golpesProntos: [g] }, extra || {});
const combinar = (eu, ele, turnos, euAntes) => R.danoComStatusNoDuelo(eu, ele, R.danoNoDuelo(eu, ele, 50), R.danoNoDuelo(ele, eu, 50), turnos, euAntes);

test("Guts com Flame Orb: queimado desde o fim do 1º turno, bate 1,5x no resto da luta", () => {
  const ele = unidade(efDe([]), golpe("F"));
  const guts = unidade(efDe(["Guts"]), golpe("F"), { item: "Flame Orb" });
  const semOrbe = unidade(efDe(["Guts"]), golpe("F"));
  const com = combinar(guts, ele, 4, true), sem = combinar(semOrbe, ele, 4, true);
  // 3 de 4 turnos queimado: 1 + 0,75 x 0,5 no ataque; a queimadura corta o próprio golpe físico pela metade.
  assert.ok(perto(com.meu / sem.meu, (1 + 0.75 * 0.5) * (1 - 0.5 * 0.75)), com.meu + " / " + sem.meu);
  assert.ok(com.dele > sem.dele, "o resíduo da queimadura conta no dano que ele leva de volta a mim");
});

test("Flame Orb não queima tipo Fire (imunidade de tipo vale pro orbe também)", () => {
  const ele = unidade(efDe([]), golpe("F"));
  const fogo = unidade(efDe(["Guts"]), golpe("F"), { item: "Flame Orb", tipos: ["Fire"] });
  const semOrbe = unidade(efDe(["Guts"]), golpe("F"), { tipos: ["Fire"] });
  assert.ok(perto(combinar(fogo, ele, 4, true).meu, combinar(semOrbe, ele, 4, true).meu));
});

test("Analytic: 1,3x quando bate por último; nada quando bate antes", () => {
  const ele = unidade(efDe([]), golpe("F"));
  const an = unidade(efDe(["Analytic"]), golpe("F"));
  const nada = unidade(efDe([]), golpe("F"));
  assert.ok(perto(combinar(an, ele, 2, false).meu / combinar(nada, ele, 2, false).meu, 1.3));
  assert.ok(perto(combinar(an, ele, 2, true).meu, combinar(nada, ele, 2, true).meu));
});

test("Opportunist: prioridade no golpe que decide quando precisa de 2 ou mais", () => {
  const u = { ef: efDe(["Opportunist"]) };
  const dano = { melhor: { prio: 0, golpe: golpe("F") } };
  assert.equal(R.temPrioridadeNoDuelo(u, dano, 2), true);
  assert.equal(R.temPrioridadeNoDuelo(u, dano, 1), false, "de um golpe só o alvo ainda está com HP cheio");
});

test("Tera Shell: o super efetivo rende menos (1º golpe pouco efetivo)", () => {
  const atq = unidade(efDe([]), golpe("F", { tipo: "Grass" }));
  const alvo = (ab) => unidade(efDe(ab), golpe("F"));
  const comShell = R.danoNoDuelo(atq, alvo(["Tera Shell"]), 50).melhor.dano;
  const sem = R.danoNoDuelo(atq, alvo([]), 50).melhor.dano;
  assert.ok(perto(comShell / sem, (1 + 0.5 / 2) / 2), "Grass contra Water: 2x vira 0,5x no 1º de 2 golpes");
});

test("Shed Skin encurta a queimadura (30% de cura por turno)", () => {
  const queima = unidade(efDe([]), golpe("E", { status: [{ st: "queimar", p: 1, doGolpe: true }] }));
  const alvo = (ab) => unidade(efDe(ab), golpe("F"));
  const comCura = combinar(queima, alvo(["Shed Skin"]), 3, true).dele;
  const sem = combinar(queima, alvo([]), 3, true).dele;
  const semQueimar = combinar(unidade(efDe([]), golpe("E")), alvo(["Shed Skin"]), 3, true).dele;
  assert.ok(perto(sem, semQueimar / 2), "queimado desde o 1º golpe (eu bato antes): metade");
  assert.ok(perto(comCura, semQueimar * (1 - 0.5 * 0.7)), comCura + " x " + sem);
});

test("Shallow Grave na névoa: volta uma vez com 25% do HP (só no clima)", () => {
  assert.equal(efDe(["Shallow Grave"], "nevoa").reviveHP, 0.25);
  assert.equal(efDe(["Shallow Grave"]).reviveHP, 0);
});
