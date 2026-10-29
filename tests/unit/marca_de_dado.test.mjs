// Gate de processo (TK-30): testes que dependem de dado que muda com a versão/rank/lutas levam marca,
// e fixture de teste tem gerador com fonte declarada (nada de trocar fixture à mão sem origem).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("./", import.meta.url);
const LE_RANK_OU_LUTAS = /(rank|lutas|bosses)[a-z_]*\.json/;

test("todo teste que lê JSON de rank/lutas/chefões tem a marca 'Depende de dado:' no topo", () => {
  const sem = readdirSync(dir).filter((f) => f.endsWith(".test.mjs") && f !== "marca_de_dado.test.mjs")
    .filter((f) => { const t = readFileSync(new URL(f, dir), "utf8"); return LE_RANK_OU_LUTAS.test(t) && !/^\/\/ Depende de dado:/m.test(t.split("\n").slice(0, 12).join("\n")); });
  assert.deepEqual(sem, [], "falta a linha '// Depende de dado: rank/lutas (muda quando o rank é recalculado)'");
});

test("toda fixture .json de tests/unit/fixtures tem gerador gerar_<nome>.mjs com linha 'Fonte:'", () => {
  const fx = new URL("./fixtures/", import.meta.url);
  const sem = readdirSync(fx).filter((f) => f.endsWith(".json")).filter((f) => {
    try { return !/Fonte:/.test(readFileSync(new URL("gerar_" + f.replace(/\.json$/, ".mjs"), fx), "utf8")); } catch { return true; }
  });
  assert.deepEqual(sem, [], "fixture sem gerador com 'Fonte:'");
});
