// --so junto com --gravar gravaria rank parcial por cima do completo: o script tem que recusar sem gravar nada.
// Depende de dado: rank (só compara o arquivo antes e depois; não depende do valor).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

test("calcular_rank_v2: --so com --gravar dá erro claro e não grava", () => {
  const alvo = "data/species_rank.json";
  const antes = readFileSync(alvo, "utf8");
  const r = spawnSync(process.execPath, ["scripts/calcular_rank_v2.mjs", "--so=pikachu", "--gravar"], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--so não pode ser usado com --gravar/);
  assert.equal(readFileSync(alvo, "utf8"), antes);
});
