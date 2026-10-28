// TK-01 (decisão 2 do usuário, 27/10/2026): save com soma errada nunca é regravado nem enviado à nuvem.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "./carregar_regras.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const R = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });
const lerUi = (n) => readFileSync(join(raiz, "src", "ui", n), "utf8").replace(/\r\n/g, "\n");

test("saveEnviavel: soma ok e save antigo (sem soma) sobem; soma errada e lixo não", () => {
  const bom = R.buildSave();
  assert.equal(R.saveEnviavel(bom), true);
  assert.equal(R.saveEnviavel({ team: [], box: [] }), true);
  assert.equal(R.saveEnviavel({ ...bom, team: ["SPECIES_X"] }), false);
  assert.equal(R.saveEnviavel(null), false);
});

test("sync.js: todo syncRef.set(local) passa por saveEnviavel; remoto aplicado é regravado saneado", () => {
  const src = lerUi("sync.js");
  const sets = src.match(/syncRef\.set\((local3?|seed)\)/g) || [];
  assert.equal(sets.length, 4, "4 envios do save local");
  assert.equal((src.match(/saveEnviavel\(/g) || []).length >= 4, true, "cada envio é guardado por saveEnviavel");
  assert.doesNotMatch(src, /lsSet\(STORE_KEY, JSON\.stringify\(remote\)\)/, "remoto não vai cru para o localStorage");
  assert.doesNotMatch(src, /JSON\.parse\(localRaw/, "leitura do local passa pelo leitor seguro");
});

test("nucleo.js: soma errada na carga não dispara regravação", () => {
  assert.doesNotMatch(lerUi("nucleo.js"), /reconciliouAoAplicar \|\| somaErrada/);
});
