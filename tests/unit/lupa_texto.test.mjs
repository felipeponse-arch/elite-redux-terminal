// Lupa (11/11/2026): o texto do balão sai das mesmas funções que a ficha da Dex usa. O esperado é lido direto dos JSON de tradução e dos dados, sem repetir a regra de fallback.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras, lerComMutacao } from "./carregar_regras.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const lerData = (nome) => JSON.parse(readFileSync(join(raiz, "data", nome), "utf8"));
const R = carregarRegras();
const MOVE_PT = lerData("move_translations_pt.json");
const ABILITY_PT = lerData("ability_translations_pt.json");

test("golpe com tradução: o balão mostra exatamente a tradução do arquivo (amostra grande)", () => {
  const ids = Object.keys(MOVE_PT).filter((k) => R.MOVES[k] && R.MOVES[k][0]);
  assert.ok(ids.length >= 100, "amostra menor que 100: " + ids.length);
  for (const k of ids) assert.equal(R.descricaoDoGolpe(k), MOVE_PT[k], "golpe " + k);
});

test("golpe sem tradução: mostra o texto do próprio dado, nunca vazio", () => {
  const semPt = Object.keys(R.MOVES).filter((k) => R.MOVES[k] && R.MOVES[k][0] && !(k in MOVE_PT));
  assert.ok(semPt.length >= 1);
  for (const k of semPt) assert.equal(R.descricaoDoGolpe(k), R.MOVES[k][6] || "Sem descrição.", "golpe " + k);
});

test("habilidade com tradução: o balão mostra a tradução do arquivo (amostra grande)", () => {
  const ids = Object.keys(ABILITY_PT).filter((k) => R.ABILITIES[k] && R.ABILITIES[k][0]);
  assert.ok(ids.length >= 100, "amostra menor que 100: " + ids.length);
  for (const k of ids) assert.equal(R.descricaoDaHabilidade(k), ABILITY_PT[k], "habilidade " + k);
});

test("habilidade sem tradução: mostra o texto do próprio dado", () => {
  const semPt = Object.keys(R.ABILITIES).filter((k) => R.ABILITIES[k] && R.ABILITIES[k][0] && !(k in ABILITY_PT));
  // Hoje todas têm tradução (lista vazia); o caso fica coberto se um dia faltar uma.
  for (const k of semPt) assert.equal(R.descricaoDaHabilidade(k), R.ABILITIES[k][1], "habilidade " + k);
});

test("a ficha da Dex chama as mesmas funções (golpe e habilidade)", () => {
  const ficha = lerComMutacao("src/ui/dex_ficha.js", "dex_ficha.js");
  assert.ok(ficha.includes("var mvDesc = descricaoDoGolpe(moveId);"), "golpe da Dex não usa descricaoDoGolpe");
  assert.ok(ficha.includes("var desc = descricaoDaHabilidade(id);"), "habilidade da Dex não usa descricaoDaHabilidade");
});
