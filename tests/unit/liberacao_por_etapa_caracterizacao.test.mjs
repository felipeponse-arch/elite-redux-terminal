// TK-22: refatoração do registro da Etapa não pode mudar NENHUM resultado (pedras e itens x Etapas 0-10).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { instantaneo } from "./fixtures/gerar_liberacao_por_etapa.mjs";

test("liberação por Etapa de toda pedra e item igual ao instantâneo anterior ao TK-22", () => {
  const antes = JSON.parse(readFileSync(new URL("./fixtures/liberacao_por_etapa.json", import.meta.url), "utf8"));
  const agora = instantaneo();
  assert.deepEqual(Object.keys(agora), Object.keys(antes));
  for (const n of Object.keys(antes)) assert.deepEqual(agora[n], antes[n], n);
});
