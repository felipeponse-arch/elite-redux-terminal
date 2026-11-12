// Lupa (11/11/2026): o texto do balão é o mesmo da ficha da Dex (descricaoDoGolpe / descricaoDaHabilidade), sem texto novo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();

test("golpe: tradução PT, senão o texto do dado, senão 'Sem descrição.'", () => {
  const ids = Object.keys(R.MOVES).filter((i) => R.MOVES[i] && R.MOVES[i][0]);
  assert.ok(ids.length > 500);
  for (const i of ids.slice(0, 400)) assert.equal(R.descricaoDoGolpe(i), R.MOVE_PT[String(i)] || R.MOVES[i][6] || "Sem descrição.");
  assert.equal(R.descricaoDoGolpe(999999), "Sem descrição.");
});

test("habilidade: tradução PT, senão ABILITIES[id][1]; nome acha o id", () => {
  const ids = Object.keys(R.ABILITIES).filter((i) => R.ABILITIES[i] && R.ABILITIES[i][0]);
  for (const i of ids.slice(0, 400)) assert.equal(R.descricaoDaHabilidade(i), R.ABILITY_PT[String(i)] || R.ABILITIES[i][1]);
  const i0 = ids[0];
  assert.equal(R.ABILITIES[R.ABILITY_ID_BY_NAME[R.ABILITIES[i0][0]]][0], R.ABILITIES[i0][0]);
  assert.equal(R.descricaoDaHabilidade(999999), "");
});
