// TK-27: texto da UI usa "Etapa" (GLOSSARY.md), não "marco".
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ler = (p) => readFileSync(new URL("../../" + p, import.meta.url), "utf8");

test("banner de conflito de sync diz Etapa, não marco", () => {
  const s = ler("src/ui/sync.js");
  assert.ok(!/\(marco "/.test(s));
  assert.ok(s.includes('(Etapa "'));
});
test("cabeçalho da tabela de level cap diz Etapa", () => {
  assert.ok(ler("src/ui/tipos.js").includes('rowhead">Etapa<'));
});
test("rótulo do lugar do item usa Etapa", () => {
  const s = ler("src/regras/avisos_build.js");
  assert.ok(s.includes('"Etapa " + e'));
  assert.ok(!s.includes('"ª insígnia"'));
});
