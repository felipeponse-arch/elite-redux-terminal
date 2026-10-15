// Sprite pelo nome da espécie (15/10/2026): a versão nova do jogo deslocou os números e o Beedrill Mega mostrava o Blastoise Mega.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { indicePorNumero } from "../../scripts/remapear_sprite_index.mjs";

const ler = (a) => JSON.parse(readFileSync(new URL("../../data/" + a, import.meta.url), "utf8"));
const dex = ler("dex_compact.json");
const porNome = ler("sprite_index_por_nome.json");
const idx = ler("sprite_index.json");

test("cada espécie do dado aponta para a casa do atlas da PRÓPRIA espécie", () => {
  let erradas = [];
  for (const sp of dex.species) {
    if (!sp || porNome.index[sp.sname] === undefined) continue;
    if (idx.index[sp.x] !== porNome.index[sp.sname]) erradas.push(sp.n);
  }
  assert.deepEqual(erradas.slice(0, 5), [], erradas.length + " espécies com sprite de outra");
});

test("o índice gravado é o que o remapeador gera do dado atual", () => {
  assert.deepEqual(idx, indicePorNumero(dex, porNome));
});
