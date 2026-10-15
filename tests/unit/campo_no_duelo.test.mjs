// Campo no duelo (2026-09-29): terreno das habilidades (Grassy/Electric/Psychic/
// Misty Surge), habilidade que depende do terreno (Grass Pelt), Trick Room
// (Twist. Dimension), Tailwind (Air Blower), gravidade e Infiltrator.
// Dado do NextDex: terreno "fortalece" o tipo por 8 turnos - 1,3x (valor da série).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "CP_" + nomes.join("+"), null);
const perto = (a, b) => Math.abs(a - b) < 1e-6;
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ tipos: ["Water"], ids: [], ef, item: "", stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g] }, extra || {});

test("texto do jogo: Surge arma terreno; Grass Pelt depende da grama; Twist. Dimension e Air Blower", () => {
  assert.equal(efDe(["Electro Surge"]).armaTerreno, "eletrico");
  assert.equal(efDe(["Grassy Surge"]).armaTerreno, "grama");
  assert.equal(efDe(["Grass Pelt"]).noTerreno[0].terreno, "grama");
  assert.equal(efDe(["Twist. Dimension"]).sala, 3);
  assert.equal(efDe(["Air Blower"]).vento, 3);
});

test("terreno elétrico: golpe Electric de quem está no chão rende 1,3x; quem voa não ganha", () => {
  const alvo = unidade(efDe([]), golpe("F"), { tipos: ["Normal"] });
  const eletrico = (ab, tipos) => unidade(efDe(ab), golpe("E", { tipo: "Electric" }), { tipos: tipos || ["Electric"] });
  const sem = R.danoNoDuelo(eletrico([]), alvo, 50).melhor.dano;
  R.CAMPO_DUELO = { terreno: "eletrico" };
  try {
    assert.ok(perto(R.danoNoDuelo(eletrico([]), alvo, 50).melhor.dano / sem, 1.3));
    const voando = eletrico([], ["Flying"]);
    R.CAMPO_DUELO = null;
    const voandoSem = R.danoNoDuelo(voando, alvo, 50).melhor.dano;
    R.CAMPO_DUELO = { terreno: "eletrico" };
    assert.ok(perto(R.danoNoDuelo(voando, alvo, 50).melhor.dano, voandoSem), "quem voa não pega o reforço do chão");
  } finally { R.CAMPO_DUELO = null; }
  const campo = R.campoDoDuelo(eletrico(["Electro Surge"]), alvo);
  assert.equal(campo.terreno, "eletrico");
  assert.equal(R.aterradoDuelo(eletrico([], ["Flying"])), false);
  assert.equal(R.aterradoDuelo(unidade(efDe(["Levitate"]), golpe("F"), { ids: [idHab("Levitate")] })), false);
});

// O teste de Trick Room (o mais lento age primeiro) virou cenário de luta inteira em
// chefao_pela_interface.test.mjs (Tate & Liza 2, Starmie x Rhyperior); ticket 07, 08/10/2026.

test("Tailwind (Air Blower) dobra a velocidade nos turnos em que dura", () => {
  const u = unidade(efDe(["Air Blower"]), golpe("F"));
  const o = unidade(efDe([]), golpe("F"));
  assert.equal(R.velocidadeNoDuelo(u, 2, o, u.golpesProntos[0], o.golpesProntos[0]), 200);
  assert.equal(R.velocidadeNoDuelo(u, 5, o, u.golpesProntos[0], o.golpesProntos[0]), 100, "no 5º turno o vento já acabou");
});

test("Infiltrator atravessa a Aurora Veil do North Wind", () => {
  const veil = unidade(efDe(["North Wind"]), golpe("F"));
  const atq = (ab) => unidade(efDe(ab), golpe("F"));
  const st = (u) => R.danoComStatusNoDuelo(u, veil, R.danoNoDuelo(u, veil, 50), R.danoNoDuelo(veil, u, 50), 3, true).meu;
  assert.ok(st(atq(["Infiltrator"])) > st(atq([])));
});
