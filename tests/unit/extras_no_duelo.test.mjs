// Golpes extras, bloqueio e entrada no duelo (2026-09-29): Readied Action,
// Truant, Disguise, Accelerate, seguimento por categoria (Chunky Bass Line),
// Guard Dog, Pressure, status encadeado (Poison Puppeteer) e Leech Seed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes, clima) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "EX_" + nomes.join("+") + (clima || ""), clima || null);
const perto = (a, b) => Math.abs(a - b) < 1e-9;
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], crit: { estagio: 0, sempre: false } }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ tipos: ["Water"], ids: [], ef, item: "", stats: [300, 100, 100, 100, 100, 100], golpesProntos: [g] }, extra || {});
const combinar = (eu, ele, turnos, euAntes) => R.danoComStatusNoDuelo(eu, ele, R.danoNoDuelo(eu, ele, 50), R.danoNoDuelo(ele, eu, 50), turnos, euAntes);

test("Readied Action dobra só o 1º turno; Truant ataca metade dos turnos", () => {
  const ele = unidade(efDe([]), golpe("F"));
  const base = combinar(unidade(efDe([]), golpe("F")), ele, 2, true).meu;
  assert.ok(perto(combinar(unidade(efDe(["Readied Action"]), golpe("F")), ele, 2, true).meu / base, 1.5), "(2 + 1) / 2");
  assert.ok(perto(combinar(unidade(efDe(["Truant"]), golpe("F")), ele, 2, true).meu / base, 0.5));
});

test("Disguise: o rival precisa de um golpe a mais", () => {
  const forte = golpe("F", { forca: 5000, forcaBase: 5000 });
  const eu = (ab) => unidade(efDe(ab), golpe("F"), { stats: [300, 100, 100, 100, 100, 50] });
  const ele = unidade(efDe([]), forte, { stats: [300, 100, 100, 100, 100, 100] });
  assert.equal(R.resultadoDoDuelo(eu([]), ele, 50) < R.resultadoDoDuelo(eu(["Disguise"]), ele, 50), true);
});

test("Accelerate libera golpe de carga (sem ele, só Solar Beam no sol entra)", () => {
  const carga = R.MOVES.findIndex((m, i) => m && m[3] > 0 && /no primeiro turno|turno seguinte/i.test(R.MOVE_PT[i] || "") && !/^Solar/.test(m[0]));
  assert.ok(carga > 0, "fixture: golpe de carga");
  const u = (ab) => ({ ef: efDe(ab), tipos: ["Normal"], stats: [100, 100, 100, 100, 100, 100] });
  assert.equal(R.prepararGolpesDuelo([carga], u([]), null).length, 0);
  assert.equal(R.prepararGolpesDuelo([carga], u(["Accelerate"]), null).length, 1);
});

test("Chunky Bass Line: golpe de som ganha o seguimento de 40 de poder", () => {
  const som = R.MOVES.findIndex((m) => m && m[3] > 0 && (m[8] || []).some((i) => R.DATA.flags[i] === "Sound Based"));
  const u = (ab) => ({ ef: efDe(ab), tipos: ["Normal"], stats: [100, 100, 100, 100, 100, 100] });
  const com = R.prepararGolpesDuelo([som], u(["Chunky Bass Line"]), null)[0], sem = R.prepararGolpesDuelo([som], u([]), null)[0];
  assert.ok(perto(com.forca / sem.forca, (R.MOVES[som][3] + 40) / R.MOVES[som][3]));
});

test("Guard Dog: Intimidate vira +1 de Ataque; Pressure limpa a subida da entrada", () => {
  const intim = unidade(efDe(["Intimidate"]), golpe("F"));
  const gd = unidade(efDe(["Guard Dog"]), golpe("F"));
  assert.equal(R.estagiosMediosDuelo(gd, intim, gd.golpesProntos[0], intim.golpesProntos[0], 2).atk, 1);
  const is = unidade(efDe(["Intrepid Sword"]), golpe("F"));
  const pr = unidade(efDe(["Pressure"]), golpe("F"));
  assert.equal(R.estagiosMediosDuelo(is, pr, is.golpesProntos[0], pr.golpesProntos[0], 2).atk, 0);
});

test("Poison Puppeteer: o veneno também confunde; Leech Seed não pega em Grass", () => {
  const veneno = golpe("E", { status: [{ st: "envenenar", p: 0.5, doGolpe: true }] });
  const pp = unidade(efDe(["Poison Puppeteer"]), veneno);
  const alvo = unidade(efDe([]), golpe("F"));
  const ch = R.chancesDeStatusNoDuelo(pp, alvo, veneno, alvo.golpesProntos[0]);
  assert.ok(perto(ch.confundir, 0.5), JSON.stringify(ch));
  const fi = efDe(["Fungal Infection"]);
  const contato = golpe("F", { contato: true, status: [{ st: "semente", p: 1, doGolpe: false }] });
  const planta = unidade(efDe([]), golpe("F"), { tipos: ["Grass"] });
  assert.equal(R.chancesDeStatusNoDuelo(unidade(fi, contato), planta, contato, planta.golpesProntos[0]).semente, undefined);
});

// Achado na revisão do rank (2026-09-29): golpe de vários acertos gasta um bloqueio por
// acerto - Rock Blast (3 acertos) quebra os 2 bloqueios do Cheating Death num golpe só.
test("golpe de vários acertos atravessa Disguise/Cheating Death no mesmo golpe", () => {
  const cd = unidade(efDe(["Cheating Death"]), golpe("F"));
  const dano = (acertos) => ({ melhor: { golpe: golpe("F", { acertos }), efTipo: 1 } });
  const atq = unidade(efDe([]), golpe("F"));
  assert.equal(R.bloqueiosNoDuelo(cd, atq, dano(1)), 2);
  assert.equal(R.bloqueiosNoDuelo(cd, atq, dano(3)), 0);
  assert.equal(R.bloqueiosNoDuelo(cd, atq, dano(2)), 1);
});
