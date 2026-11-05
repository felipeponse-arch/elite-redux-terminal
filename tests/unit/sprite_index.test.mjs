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
  assert.deepEqual(idx, indicePorNumero(dex, porNome, ler("sprites_provisorios.json").provisorios));
});

// TK-51 (04/11/2026): sprites das 18 espécies novas da 2.65.5 entraram no atlas (fonte: NextDex static/sprites).
// Estas 2 NÃO existem no repositório oficial (árvore git do ForwardFeed/ER-nextdex, 04/11/2026); ficam sem sprite
// até aparecer (placeholder = sprite da base, data/sprites_provisorios.json, decisão de 05/11). Se uma ganhar arte oficial, tirar daqui e rodar o acrescentar.
const SEM_SPRITE_OFICIAL = ["SPECIES_BRUXISH_MEGA", "SPECIES_JELLICENT_MEGA"];

test("toda espécie do dado tem casa no atlas, exceto as sem sprite oficial listadas", () => {
  const sem = dex.species.filter((sp) => sp && porNome.index[sp.sname] === undefined).map((sp) => sp.sname).sort();
  assert.deepEqual(sem, SEM_SPRITE_OFICIAL);
});

test("as casas do índice cabem no atlas (linhas x colunas)", () => {
  const max = Math.max(...Object.values(porNome.index));
  assert.ok(max < porNome.rows * porNome.cols, "casa " + max + " fora do atlas de " + porNome.rows + " linhas");
});
