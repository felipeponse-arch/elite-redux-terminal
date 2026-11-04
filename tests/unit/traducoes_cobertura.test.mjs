// Toda habilidade do dex tem descrição PT (a 2.65.5 acrescentou ids sem tradução e ninguém notou).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ler = (a) => JSON.parse(readFileSync(join(RAIZ, a), "utf8"));

test("toda habilidade do dex_compact tem tradução PT não vazia", () => {
  const dex = ler("data/dex_compact.json"), pt = ler("data/ability_translations_pt.json");
  const faltam = dex.abilities.map((a, i) => [i, a[0]]).filter(([i]) => !pt[i] || !String(pt[i]).trim());
  assert.deepEqual(faltam, [], "sem tradução PT: " + faltam.map((f) => f.join(":")).join(", "));
});
