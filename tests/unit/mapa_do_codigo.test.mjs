// Gerador do mapa do código: determinístico e acha função conhecida com a linha certa.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gerarMapa, funcoes, responsabilidade } from "../../scripts/mapa_do_codigo.mjs";

test("mapa é determinístico", () => assert.equal(gerarMapa(), gerarMapa()));

test("função conhecida aparece com a linha certa", () => {
  const linhas = readFileSync(new URL("../../src/regras/tipos.js", import.meta.url), "utf8").split("\n");
  const n = linhas.findIndex((l) => /^\s*function abilityTypeMod\(/.test(l)) + 1;
  assert.ok(n > 0);
  assert.match(gerarMapa(), new RegExp(`abilityTypeMod:${n}[,\n]`));
});

test("funcoes e responsabilidade em texto mínimo", () => {
  assert.deepEqual(funcoes("// x\nfunction a(){}\nconst b = (x) => 1;\n  function interna(){}\n"), [["a", 2], ["b", 3]]);
  assert.equal(responsabilidade(["// ===== f.js =====", "// Faz coisa."]), "Faz coisa.");
});
