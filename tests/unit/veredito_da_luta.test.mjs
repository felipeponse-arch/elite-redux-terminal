// TK-28: a decisão do veredito da luta e do plano contra o chefão mora em src/regras (chefoes.js), não na tela.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });

test("vereditoDaLuta: luta vencida, derrubada parcial e sem luta (só cobertura)", () => {
  const plano = [{}, {}];
  assert.deepEqual({ ...R.vereditoDaLuta({ plano, luta: { venceu: true, vivos: 3, derrubados: 2, total: 2, dupla: false } }, 4, 1) },
    { ok: true, titulo: "Vence:", chip: "3 de 4 de pé", luta: true, dupla: false });
  assert.deepEqual({ ...R.vereditoDaLuta({ plano, luta: { venceu: false, vivos: 0, derrubados: 1, total: 2, dupla: true } }, 4, 1) },
    { ok: false, titulo: "Derruba:", chip: "1 de 2", luta: true, dupla: true });
  assert.deepEqual({ ...R.vereditoDaLuta({ plano, luta: null }, 4, 2) },
    { ok: true, titulo: "Respostas claras:", chip: "2 de 2", luta: false, dupla: false });
});

test("faixaDeHpDaLuta e quemRespondeNoPlano", () => {
  assert.deepEqual([80, 50, 49, 25, 24, 0].map(R.faixaDeHpDaLuta), ["alto", "alto", "medio", "medio", "baixo", "baixo"]);
  const r = R.quemRespondeNoPlano([
    { foe: { nome: "A" }, respostas: [{ sp: { sname: "S1" }, nota: 0.6 }] },
    { foe: { nome: "B" }, respostas: [{ sp: { sname: "S1" }, nota: 0.4 }] },
    { foe: { nome: "C" }, respostas: [] }]);
  assert.deepEqual(JSON.parse(JSON.stringify(r)), { S1: ["A"] });
});
