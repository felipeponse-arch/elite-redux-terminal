// Estágios de atributo no duelo (2026-09-29): entrada (Intrepid Sword), ao
// apanhar (Stamina, Weak Armor), ao golpear (Whiplash), queda por chance do
// golpe (Crunch), queda no próprio usuário (Overheat), Competitive contra
// Intimidate, imunidade a quedas (Clear Body), Unaware, Ruin e Speed Boost.
// Regra da série: +n = (2+n)/2, -n = 2/(2+n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "EST_" + nomes.join("+"), null);
const perto = (a, b) => Math.abs(a - b) < 1e-9;
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, status: [], cats: [], crit: { estagio: 0, sempre: false } }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ tipos: ["Water"], ids: [], ef, item: "", stats: [300, 100, 100, 100, 100, 100], golpesProntos: [g] }, extra || {});
const est = (u, o, n) => R.estagiosMediosDuelo(u, o, u.golpesProntos[0], o.golpesProntos[0], n);

test("regra da série: +1 = 1,5x; -1 = 2/3; limite ±6", () => {
  assert.equal(R.multDoEstagio(1), 1.5);
  assert.ok(perto(R.multDoEstagio(-1), 2 / 3));
  assert.equal(R.multDoEstagio(9), 4);
});

test("entrada vale inteira; ao apanhar acumula (n-1)/2 em média", () => {
  const ele = unidade(efDe([]), golpe("F", { contato: true }));
  assert.equal(est(unidade(efDe(["Intrepid Sword"]), golpe("F")), ele, 3).atk, 1);
  assert.equal(est(unidade(efDe(["Stamina"]), golpe("F")), ele, 3).def, 1, "3 turnos: 0, 1 e 2 golpes levados -> média 1");
  const wa = est(unidade(efDe(["Weak Armor"]), golpe("F")), ele, 3);
  assert.ok(wa.def === -1 && wa.spe === 2);
});

test("Whiplash baixa a Defesa do alvo a cada golpe físico; Clear Body barra", () => {
  const whip = unidade(efDe(["Whiplash"]), golpe("F"));
  assert.equal(est(unidade(efDe([]), golpe("F")), whip, 3).def, -1);
  assert.equal(est(unidade(efDe(["Clear Body"]), golpe("F")), whip, 3).def, 0);
});

test("queda por chance do golpe e queda no próprio usuário (dado do NextDex)", () => {
  const crunch = R.MOVE_ID_BY_NAME["Crunch"], overheat = R.MOVE_ID_BY_NAME["Overheat"];
  const u = { ef: efDe([]) };
  const c = R.estagiosDoGolpeDuelo(crunch, u);
  assert.ok(c && c.alvo.def === -1 && perto(c.p, 0.2), JSON.stringify(c));
  const o = R.estagiosDoGolpeDuelo(overheat, u);
  assert.ok(o && o.proprio.spa === -2 && o.p === 1, JSON.stringify(o));
  assert.equal(R.estagiosDoGolpeDuelo(crunch, { ef: efDe(["Sheer Force"]) }), null, "Sheer Force troca o efeito no alvo por força");
});

test("Competitive contra Intimidate: +2 SpAtk; Unaware ignora os estágios do outro", () => {
  const intim = unidade(efDe(["Intimidate"]), golpe("F"));
  assert.equal(est(unidade(efDe(["Competitive"]), golpe("E")), intim, 2).spa, 2);
  const eu = unidade(efDe(["Intrepid Sword"]), golpe("F"));
  const alvo = (ab) => unidade(efDe(ab), golpe("F"));
  const st = (a) => R.danoComStatusNoDuelo(eu, a, R.danoNoDuelo(eu, a, 50), R.danoNoDuelo(a, eu, 50), 2, true);
  const normal = st(alvo([])), unaware = st(alvo(["Unaware"]));
  assert.ok(perto(normal.meu / unaware.meu, 1.5), normal.meu + " / " + unaware.meu);
});

test("Ruin: Sword Of Ruin tira 25% da Defesa do rival (mais dano físico de quem tem)", () => {
  const eu = (ab) => unidade(efDe(ab), golpe("F"));
  const alvo = unidade(efDe([]), golpe("F"));
  const st = (u) => R.danoComStatusNoDuelo(u, alvo, R.danoNoDuelo(u, alvo, 50), R.danoNoDuelo(alvo, u, 50), 2, true).meu;
  assert.ok(perto(st(eu(["Sword Of Ruin"])) / st(eu([])), 1 / 0.75));
});

test("Speed Boost: mais rápido no turno que decide", () => {
  const sb = unidade(efDe(["Speed Boost"]), golpe("F"), { stats: [300, 100, 100, 100, 100, 90] });
  const ele = unidade(efDe([]), golpe("F"));
  assert.ok(R.velocidadeNoDuelo(sb, 1, ele, sb.golpesProntos[0], ele.golpesProntos[0]) < 100, "no 1º turno ainda não subiu");
  assert.ok(perto(R.velocidadeNoDuelo(sb, 3, ele, sb.golpesProntos[0], ele.golpesProntos[0]), 90 * 2), "no 3º turno: +2");
});
