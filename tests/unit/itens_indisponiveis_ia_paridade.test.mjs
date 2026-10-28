// TK-14: o aviso "ainda nao disponiveis" da IA usa a lista unica (itensDoTime) e da o mesmo resultado da regra antiga.
import test from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

for (const milestone of [0, 1, 3, 5, 7, 9]) {
  test("paridade itensAindaIndisponiveisParaIA, Etapa " + milestone, () => {
    const R = carregarRegras({ milestone, difficulty: "ace", levelCapMode: "more" });
    const antigo = R.AI_ITEM_POOL.map((n) => ({ n, p: R.primeiroLugarDoItem(n) }))
      .filter((x) => x.p && !R.liberadoNaRun(milestone, R.getCurrentCap(), { item: x.n }))
      .sort((a, b) => a.p.etapa - b.p.etapa);
    const novo = R.itensAindaIndisponiveisParaIA();
    assert.deepEqual(novo.map((x) => x.n), antigo.map((x) => x.n));
    const liberados = new Set(R.itensDoTime(milestone, R.getCurrentCap()));
    assert.ok(novo.every((x) => !liberados.has(x.n) && R.AI_ITEM_POOL.includes(x.n)));
  });
}
