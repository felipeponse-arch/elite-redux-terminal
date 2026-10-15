// Itens no duelo (2026-09-29, decisão do usuário: "item nos sets do duelo").
// Valores da série e, desde 15/10/2026, os da config do jogo nos itens que leem hold_effect_strength (tests/unit/itens_da_config.test.mjs).
// O texto do item no jogo não traz número. Também o bug
// achado no caminho: Choice Band/Specs do chefão contavam duas vezes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "IT_" + nomes.join("+"), null);
const perto = (a, b) => Math.abs(a - b) < 1e-6;
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const unidade = (ef, g, item, extra) => Object.assign({ tipos: ["Water"], ids: [], ef, item: item || "", it: R.itemDoDuelo(item || "", null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: [g] }, extra || {});
const dano = (a, d) => R.danoNoDuelo(a, d, 50).melhor.dano;
const combinar = (eu, ele, n) => R.danoComStatusNoDuelo(eu, ele, R.danoNoDuelo(eu, ele, 50), R.danoNoDuelo(ele, eu, 50), n || 3, true);

test("Choice Band do chefão: 1,5x só no atributo (antes contava também no dano)", () => {
  const party = R.BOSSES.flatMap((b) => b.party || []);
  const m = party.find((p) => p.item === "Choice Band");
  assert.ok(m, "fixture: Pokémon de chefão com Choice Band");
  const foe = R.foeDeDuelo(m, 50, null);
  assert.equal(foe.itemMult, undefined);
  assert.equal(foe.it.danoMult, 1);
});

test("Life Orb: 1,3x no dano e 10% do HP por ataque; Magic Guard não paga", () => {
  const alvo = unidade(efDe([]), golpe("F"));
  assert.ok(perto(dano(unidade(efDe([]), golpe("F"), "Life Orb"), alvo) / dano(unidade(efDe([]), golpe("F")), alvo), 1.3));
  const custo = combinar(unidade(efDe([]), golpe("F"), "Life Orb"), alvo).dele - combinar(unidade(efDe([]), golpe("F")), alvo).dele;
  // 10% de 320 por ataque, só nos golpes antes do que derruba.
  const ataque = dano(unidade(efDe([]), golpe("F"), "Life Orb"), alvo), n = Math.ceil(320 / ataque);
  assert.ok(perto(custo, 32 * (n - 1) / n), custo + " x " + 32 * (n - 1) / n);
  const mg = combinar(unidade(efDe(["Magic Guard"]), golpe("F"), "Life Orb"), alvo).dele;
  assert.ok(perto(mg, combinar(unidade(efDe(["Magic Guard"]), golpe("F")), alvo).dele));
});

test("Expert Belt só no super efetivo; item de tipo 1,3x no tipo (força 30 da config, 15/10/2026; antes 1,2x)", () => {
  const alvo = unidade(efDe([]), golpe("F"));
  const r = (item, tipo) => dano(unidade(efDe([]), golpe("F", { tipo }), item), alvo) / dano(unidade(efDe([]), golpe("F", { tipo })), alvo);
  assert.ok(perto(r("Expert Belt", "Grass"), 1.2));
  assert.ok(perto(r("Expert Belt", "Normal"), 1));
  // Item de tipo entra no poder: pela fórmula (+2 no fim), um pouco abaixo de 1,3x no dano.
  assert.ok(r("Charcoal", "Fire") > 1.25 && r("Charcoal", "Fire") < 1.3, String(r("Charcoal", "Fire")));
});

test("Leftovers cura 1/16 por turno; Klutz desliga o item", () => {
  const ele = unidade(efDe([]), golpe("F"));
  const sem = combinar(unidade(efDe([]), golpe("F")), ele).dele;
  assert.ok(perto(sem - combinar(unidade(efDe([]), golpe("F"), "Leftovers"), ele).dele, 20));
  assert.ok(perto(combinar(unidade(efDe(["Klutz"]), golpe("F"), "Leftovers"), ele).dele, combinar(unidade(efDe(["Klutz"]), golpe("F")), ele).dele));
});

test("Sitrus vira HP a mais; Gluttony garante 1/3, Ripen dobra, Unnerve do rival barra", () => {
  const u = (ab, item) => unidade(efDe(ab), golpe("F"), item);
  const neutro = u([], "");
  assert.ok(perto(R.curaDeBagaDuelo(u([], "Sitrus Berry"), neutro), 0.25));
  assert.ok(perto(R.curaDeBagaDuelo(u(["Gluttony"], "Sitrus Berry"), neutro), 1 / 3));
  assert.ok(perto(R.curaDeBagaDuelo(u(["Ripen"], "Sitrus Berry"), neutro), 0.5));
  assert.equal(R.curaDeBagaDuelo(u([], "Sitrus Berry"), u(["Unnerve"], "")), 0);
});

test("Frisk do rival: o item vale metade da luta; Pickpocket rouba no contato, Sticky Hold segura", () => {
  const eu = (ab) => unidade(efDe(ab), golpe("F"), "Life Orb");
  assert.equal(R.itemAtivoDuelo(eu([]), unidade(efDe(["Frisk"]), golpe("F")), false), 0.5);
  assert.equal(R.itemAtivoDuelo(eu([]), unidade(efDe(["Pickpocket"]), golpe("F")), true), 0.5);
  assert.equal(R.itemAtivoDuelo(eu(["Sticky Hold"]), unidade(efDe(["Pickpocket"]), golpe("F")), true), 1);
});

test("Unburden: item gasto dobra a velocidade no turno que decide", () => {
  const u = unidade(efDe(["Unburden"]), golpe("F"), "Sitrus Berry");
  const o = unidade(efDe([]), golpe("F"));
  assert.equal(R.velocidadeNoDuelo(u, 2, o, u.golpesProntos[0], o.golpesProntos[0]), 200);
  assert.equal(R.velocidadeNoDuelo(u, 1, o, u.golpesProntos[0], o.golpesProntos[0]), 100);
});

test("item do set: a habilidade pede o item (Guts -> Flame Orb, Poison Heal -> Toxic Orb, Gluttony -> Sitrus)", () => {
  const sp = R.SPECIES.find((s) => s && s.n === "Garchomp");
  const setF = R.SETS_DE_DUELO[0], setT = R.SETS_DE_DUELO[2];
  assert.equal(R.itemDoSetDuelo(setF, sp, efDe(["Guts"])), "Flame Orb");
  assert.equal(R.itemDoSetDuelo(setF, sp, efDe(["Poison Heal"])), "Toxic Orb");
  assert.equal(R.itemDoSetDuelo(setF, sp, efDe(["Gluttony"])), "Sitrus Berry");
  assert.equal(R.itemDoSetDuelo(setF, sp, efDe([])), "Life Orb");
  assert.equal(R.itemDoSetDuelo(setT, sp, efDe([])), "Leftovers");
  const nfe = R.SPECIES.find((s) => s && s.n === "Gabite");
  assert.equal(R.itemDoSetDuelo(setF, nfe, efDe([])), "Eviolite");
});

test("a unidade do duelo (rank e botão) sai com o item do set", () => {
  const sp = R.SPECIES.find((s) => s && s.n === "Garchomp");
  const golpes = R.golpesDeDueloAte(sp, 50);
  const u = R.unidadeDeDuelo(sp, R.SETS_DE_DUELO[0], null, 50, golpes, null);
  assert.equal(u.item, "Life Orb");
  assert.equal(u.it.danoMult, 1.3);
  assert.equal(R.unidadeDeDuelo(sp, R.SETS_DE_DUELO[2], null, 50, golpes, null).item, "Leftovers");
  assert.equal(R.unidadeDeDuelo(sp, R.SETS_DE_DUELO[0], null, 50, golpes, null, "Choice Scarf").item, "Choice Scarf", "item da build manda");
});
