// TK-14 (estrutura-2026-10-22): itens. Expert Belt 1,2x do código (não o f:30 da config), Knock Off pela regra real do jogo
// (CanBattlerGetOrLoseItem, battle_util.c:8282), Heavy-Duty Boots e Light Clay pelo item ATIVO (Klutz).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const sp = (sname) => ({ sname });
const efKlutz = (k) => ({ klutz: !!k, seguraItem: false, semResiduo: false });
const un = (item, extra) => Object.assign({ tipos: ["Normal"], ids: [], ef: efKlutz(false), item, it: R.itemDoDuelo(item, null) }, extra || {});
const knock = { golpesProntos: [{ efeito: "Knock Off" }], ef: {} };

test("Expert Belt: 1,2x do código; a config traz f:30 e não pode virar 1,3x", () => {
  assert.equal(R.ITENS_CONFIG.itens["Expert Belt"].f, 30, "fixture: a armadilha existe na config");
  assert.equal(R.itemDoDuelo("Expert Belt", null).seMult, 1.2);
});

test("Knock Off: Eviolite e Meteorite saem (metade da luta); pedra de Mega e Orbe Primal não", () => {
  for (const [item, esperado] of [["Eviolite", 0.5], ["Meteorite", 0.5], ["Charizardite X", 1], ["Red Orb", 1]]) {
    assert.equal(R.itemAtivoDuelo(un(item), knock, true), esperado, item);
  }
});

test("Knock Off: Drive no Genesect, Memory no Silvally e Plate no Arceus ficam; em outra espécie saem", () => {
  assert.equal(R.itemNaoSaiDoPokemon(un("Burn Drive", { sp: sp("SPECIES_GENESECT") })), true);
  assert.equal(R.itemNaoSaiDoPokemon(un("Fire Memory", { sp: sp("SPECIES_SILVALLY_FIRE") })), true);
  assert.equal(R.itemNaoSaiDoPokemon(un("Flame Plate", { sp: sp("SPECIES_ARCEUS") })), true);
  assert.equal(R.itemNaoSaiDoPokemon(un("Flame Plate", { sp: sp("SPECIES_MAGMORTAR") })), false);
});

test("Heavy-Duty Boots: protege do Stealth Rock; com Klutz ou item tirado, não", () => {
  const entra = (u) => { const c = { u, frac: 1 }; R.entrarNoLadoDuelo(c, Object.assign(R.novoLadoDuelo(), { rocha: true }), false); return c.frac; };
  assert.equal(entra(un("Heavy-Duty Boots")), 1);
  assert.ok(entra(un("Heavy-Duty Boots", { ef: efKlutz(true) })) < 1, "Klutz");
  assert.ok(entra(un("Heavy-Duty Boots", { it: R.itemDoDuelo("", null) })) < 1, "item tirado (u.item velho, u.it vazio)");
});

test("Light Clay: tela longa só com o item ativo", () => {
  assert.equal(R.duracaoTelaDuelo(un("Light Clay")), 8);
  assert.equal(R.duracaoTelaDuelo(un("Light Clay", { ef: efKlutz(true) })), 5, "Klutz");
  assert.equal(R.duracaoTelaDuelo(un("Light Clay", { it: R.itemDoDuelo("", null) })), 5, "item tirado");
});
