// Nota do rank (scripts/rank_fatia.mjs): sem fatia, todas as lutas no mesmo saco. A fatia 60/40 e as lutas comuns saíram em 06/11/2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";
import { notasComFatia } from "../../scripts/rank_fatia.mjs";

const R = carregarRegras({ milestone: 0 });

test("o rank mede as 29 lutas de chefão, todas no mesmo saco", () => {
  assert.equal(R.LUTAS_DA_RUN.length, 29);
  const n = R.LUTAS_DA_RUN.length, todas = Array.from({ length: n }, (_, i) => i);
  // "forte" gabarita todas; "fraco" só a metade final: as duas notas ficam em [0,1] e forte > fraco.
  const lista = (s) => todas.filter((i) => s === "forte" || i >= n / 2).map((i) => [i, s === "forte" ? 0.9 : 0.4]);
  const r = notasComFatia(n, ["forte", "fraco"], lista);
  assert.ok(Math.abs(r.nota.forte - 0.9) < 1e-9 && Math.abs(r.nota.fraco - 0.4) < 1e-9, JSON.stringify(r.nota));
  assert.equal(r.pesoLuta.length, n);
});

test("luta que derruba mais espécies pesa mais, e espécie sem luta coberta fica com 0", () => {
  const lista = (s) => (s === "nada" ? [] : [[0, s === "a" ? 0 : 1], [1, 1]]);
  const r = notasComFatia(2, ["a", "b", "nada"], lista, 1);
  assert.ok(r.pesoLuta[0] > r.pesoLuta[1], JSON.stringify(r.pesoLuta));
  assert.equal(r.nota.nada, 0);
});
