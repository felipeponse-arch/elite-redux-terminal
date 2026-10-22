// Gerador do mapa do código: determinístico e acha função conhecida com a linha certa.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gerarMapa, funcoes, responsabilidade } from "../../scripts/mapa_do_codigo.mjs";
import { temTs } from "../../scripts/mapa_chamadas.mjs";

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

// Sem o TS 5.9 de teste/ferramentas (CI, outra máquina) as chamadas não são geradas: o teste é pulado, não falha.
test("chamada real entre arquivos aparece em 'chamado por' (ui chama regras)", { skip: !temTs }, async () => {
  const { gerarChamadas } = await import("../../scripts/mapa_chamadas.mjs");
  const raiz = new URL("../../", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
  const { regras, ui } = gerarChamadas(raiz);
  // renderTeamAnalysis (src/ui/arquetipo.js) usa abilityTypeMod (src/regras/tipos.js)
  assert.match(regras, /^- abilityTypeMod:\d+ - .*chamado por: .*renderTeamAnalysis \(arquetipo\.js:\d+\)/m);
  assert.match(ui, /^- renderTeamAnalysis:\d+ - .*chama: .*abilityTypeMod \(tipos\.js:\d+\)/m);
});

test("índice cobre .ps1 e testes", () => {
  const m = gerarMapa();
  assert.match(m, /## Scripts \(\.ps1\)/);
  assert.match(m, /\*\*mapa_do_codigo\.test\.mjs\*\* - /);
});
