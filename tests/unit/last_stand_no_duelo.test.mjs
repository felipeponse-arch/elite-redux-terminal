// Last Stand (abilities.cc:7959-7965): Def/SpDef x(1 + 0,6 x fração de PV perdido).
// O motor usa a fração média da luta: vence cedo ganha menos; luta até cair ~ x1,3.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const ef = R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME["Last Stand"]], "LS", null);
const u = { ef };
const perto = (a, b) => Math.abs(a - b) < 1e-9;

test("Last Stand lê o teto x1,6 do texto do jogo", () => {
  assert.ok(perto(ef.lastStand, 0.6));
  assert.equal(ef.defMult, 1, "o fator não é mais fixo no defMult");
});

test("luta até cair ~ x1,3; vence em 1 golpe ~ x1,0; vence na metade ~ x1,15", () => {
  // PV 300, dano levado 100/golpe: cai em 3 golpes.
  assert.ok(perto(R.ultimaResistenciaDuelo(u, 3, 100, 300), 1.3));
  assert.ok(R.ultimaResistenciaDuelo(u, 1, 1, 300) < 1.01);
  assert.ok(R.ultimaResistenciaDuelo(u, 1, 100, 300) < 1.3);
  assert.ok(perto(R.ultimaResistenciaDuelo(u, 3, 50, 300), 1.15));
  assert.equal(R.ultimaResistenciaDuelo({ ef: { lastStand: 0 } }, 3, 100, 300), 1);
});
