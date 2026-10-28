// Shedinja HP 1 (decisão 5 do usuário, TK-09): o jogo fixa maxHP em 1 (pokemon.c:1000-1001);
// residual e Leech Seed têm piso 1 (battle_util.c:2484,2542): morre no 1º fim de turno.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map((n) => R.ABILITY_ID_BY_NAME[n]), "SH_" + nomes.join("+"), null);
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unidade = (ef, g, extra) => Object.assign({ sp: { n: "Teste", sname: "T" }, tipos: ["Water"], ids: [], ef, item: "", it: R.itemDoDuelo("", null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g], statusIds: [] }, extra || {});

test("calc_stat: Shedinja e Shedinja Mega têm HP 1, qualquer nível/EV/IV; outro Pokémon segue a fórmula", () => {
  const hp = (n, lv, ev) => R.calcFinalStat(1, 31, ev, lv, 0, null, null, n);
  assert.equal(hp("Shedinja", 50, 0), 1);
  assert.equal(hp("Shedinja", 100, 252), 1);
  assert.equal(hp("Shedinja Mega", 50, 0), 1);
  assert.ok(hp("Ninjask", 50, 0) > 40);
});

test("residual: HP 1 perde pelo menos 1 por turno (piso do jogo), HP alto segue a fração", () => {
  const veneno = unidade(efDe([]), golpe("E", { status: [{ st: "envenenar", p: 1, doGolpe: true }] }));
  const alvo = (hp) => unidade(efDe([]), golpe("F"), { stats: [hp, 100, 100, 100, 100, 100] });
  const dano = (hp) => R.danoComStatusNoDuelo(veneno, alvo(hp), R.danoNoDuelo(veneno, alvo(hp), 50), R.danoNoDuelo(alvo(hp), veneno, 50), 3, true);
  const a = dano(1), b = dano(320);
  const perto = (x, y) => Math.abs(x - y) < 1e-6;
  assert.ok(perto(a.meu - a.dele, 1), "HP 1: residual vale 1, não 1/8");
  assert.ok(perto(b.meu - b.dele, 40), "HP 320: 1/8 = 40");
});
