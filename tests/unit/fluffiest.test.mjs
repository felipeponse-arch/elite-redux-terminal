// Fluffiest (678): a descrição (NextDex e er-config) diz "contato x0,25, fogo x4", mas o código do jogo
// (abilities.cc Impl<ABILITY_FLUFFIEST>, igual à Fluffy; chamado uma vez em CalculateAbilityMultipliers)
// faz contato x0,5 e fogo x2. Decisão do usuário em 07/10: vale o código. Ver docs/decisoes_mecanicas.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });

test("Fluffiest reduz o dano de contato à metade (não a 1/4)", () => {
  assert.equal(R.efeitoDasHabilidadesNoDuelo([678], "teste-fluffiest", null).reducao.contato, 0.5);
});

test("Fluffiest dá fraqueza 2x a Fire, igual à Fluffy (não 4x)", () => {
  const comFluffiest = R.abilityTypeModFor("Fire", ["Normal"], [678]);
  const comFluffy = R.abilityTypeModFor("Fire", ["Normal"], [218]);
  assert.equal(comFluffiest.mult, 2);
  assert.equal(comFluffiest.mult, comFluffy.mult);
});
