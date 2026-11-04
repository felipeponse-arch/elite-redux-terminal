// TK-35: segundo ajuste do instantâneo - Arcanite H Etapa 4 -> 7 (er-config MegaStonesList.textproto:2215-2226, mega_badge_requirement 7; decisão do comitê).
// TK-35c: único ajuste do instantâneo - Granbullite (item sem espécie desde que a Granbull Mega saiu da NextDex 2.65.5): etapaItem 7 -> null; a pedra segue na Etapa 7 (data/pedras_etapa.json, decisão do comitê).
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
