// TK-33b item 7: scripts/estudo/fatias_de_peso.mjs usa tierDe e percentis de scripts/rank_comum.mjs (nada de cópia).
import { test } from "node:test";
import assert from "node:assert/strict";
import { lerComMutacao } from "./carregar_regras.mjs";
import { tierDe, percentis } from "../../scripts/rank_comum.mjs";

const fonte = lerComMutacao("scripts/estudo/fatias_de_peso.mjs", "fatias_de_peso.mjs");

test("fatias_de_peso importa tierDe e percentis do rank_comum e não define cópia", () => {
  assert.match(fonte, /import \{[^}]*\btierDe\b[^}]*\} from "\.\.\/rank_comum\.mjs"/);
  assert.match(fonte, /import \{[^}]*\bpercentis\b[^}]*\} from "\.\.\/rank_comum\.mjs"/);
  assert.ok(!/(const|function)\s+tierDe\b/.test(fonte), "sem cópia de tierDe");
  assert.ok(!/(const|function)\s+percentis\b/.test(fonte), "sem cópia de percentis");
});

test("o rank_comum que ela passa a usar tem os cortes e o percentil do rank v2", () => {
  const cortes = [[100, "SS"], [97, "SS"], [96.99, "S"], [90, "S"], [89.99, "A"], [75, "A"], [74.99, "B"], [50, "B"], [49.99, "C"], [20, "C"], [19.99, "D"], [0, "D"]];
  cortes.forEach(([p, t]) => assert.equal(tierDe(p), t, String(p)));
  assert.deepEqual(percentis({ a: 3, b: 1, c: 2 }), { b: 33.33, c: 66.67, a: 100 });
});
