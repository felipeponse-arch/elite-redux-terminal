import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mesclarCache, gravarCacheMesclando } from "../../scripts/cache_sabotagem.mjs";

test("mesclarCache preserva entradas que a rodada não tocou", () => {
  const r = mesclarCache({ a: "tests/unit/x.test.mjs", b: "tests/unit/y.test.mjs" }, new Map([["c", "tests/unit/z.test.mjs"]]));
  assert.deepEqual(r, { a: "tests/unit/x.test.mjs", b: "tests/unit/y.test.mjs", c: "tests/unit/z.test.mjs" });
});

test("mesclarCache troca o arquivo lembrado pelo que pegou e remove quando nenhum pegou", () => {
  const r = mesclarCache({ a: "velho", b: "outro", c: "fica" }, new Map([["a", "novo"], ["b", null]]));
  assert.deepEqual(r, { a: "novo", c: "fica" });
});

test("mesclarCache aguenta base vazia ou inválida", () => {
  assert.deepEqual(mesclarCache(null, new Map([["a", "x"]])), { a: "x" });
  assert.deepEqual(mesclarCache(undefined, new Map()), {});
});

test("gravarCacheMesclando lê o disco na hora de gravar (rodada parcial não apaga o resto)", () => {
  const f = join(mkdtempSync(join(tmpdir(), "cache-sab-")), "c.json");
  writeFileSync(f, JSON.stringify({ a: "1", b: "2" }));
  gravarCacheMesclando(f, new Map([["c", "3"]]));
  // outra rodada grava no meio
  writeFileSync(f, JSON.stringify({ a: "1", b: "2", d: "4" }));
  gravarCacheMesclando(f, new Map([["a", null]]));
  assert.deepEqual(JSON.parse(readFileSync(f, "utf8")), { b: "2", d: "4" });
});

test("gravarCacheMesclando cria o arquivo e usa o cache emprestado como base", () => {
  const f = join(mkdtempSync(join(tmpdir(), "cache-sab-")), "novo.json");
  gravarCacheMesclando(f, new Map([["x", "1"]]), { e: "9" });
  assert.deepEqual(JSON.parse(readFileSync(f, "utf8")), { e: "9", x: "1" });
});

test("gravarCacheMesclando trata arquivo corrompido como vazio sem quebrar", () => {
  const f = join(mkdtempSync(join(tmpdir(), "cache-sab-")), "ruim.json");
  writeFileSync(f, "{ não é json");
  gravarCacheMesclando(f, new Map([["x", "1"]]));
  assert.deepEqual(JSON.parse(readFileSync(f, "utf8")), { x: "1" });
});
