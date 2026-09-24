// A trava de codificação (scripts/checar_encoding.mjs) precisa pegar exatamente
// os dois incidentes reais de 2026-09-24 - e não reclamar de texto correto.
import { test } from "node:test";
import assert from "node:assert/strict";
import { problemasDeEncoding } from "../../scripts/checar_encoding.mjs";

const utf8 = (s) => Buffer.from(s, "utf8");
// O que o PowerShell 5.1 faz: lê UTF-8 como cp1252 e grava de volta em UTF-8.
const corromper = (s) => Buffer.from(s, "utf8").toString("latin1");
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

test("texto correto em português passa", () => {
  assert.deepEqual(problemasDeEncoding("a.js", utf8("// evolução, ação, você, Pokémon\n")), []);
});

test("acento corrompido pelo PowerShell é pego, com a linha", () => {
  const p = problemasDeEncoding("a.js", utf8("ok\n// " + corromper("evolução") + "\n"));
  assert.equal(p.length, 1);
  assert.match(p[0], /^a\.js:2: texto corrompido/);
});

test("linha que documenta o problema de propósito (cita mojibake) fica de fora", () => {
  assert.deepEqual(problemasDeEncoding("a.ps1", Buffer.concat([BOM, utf8("# virou " + corromper("confusão") + " - mojibake\n")])), []);
});

test("caractere de substituição (U+FFFD) é pego", () => {
  assert.equal(problemasDeEncoding("a.md", utf8("perdeu o acento: a" + String.fromCharCode(0xfffd) + "o\n")).length, 1);
});

test(".ps1 com acento precisa de BOM; sem acento, não", () => {
  assert.equal(problemasDeEncoding("x.ps1", utf8("# ação\n")).length, 1, "sem BOM: pego");
  assert.deepEqual(problemasDeEncoding("x.ps1", Buffer.concat([BOM, utf8("# ação\n")])), [], "com BOM: ok");
  assert.deepEqual(problemasDeEncoding("x.ps1", utf8("# acao\n")), [], "só ASCII: ok sem BOM");
  assert.deepEqual(problemasDeEncoding("x.js", utf8("// ação\n")), [], "BOM só é exigido em .ps1");
});
