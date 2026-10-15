// Sprites pelo NOME da espécie (15/10/2026). O atlas (data/sprite_atlas.png) foi montado com o índice pelo número da espécie (x) do
// dado daquela época; a versão nova do jogo deslocou os números (Beedrill Mega 1123 -> 1122) e o app passou a mostrar o sprite do vizinho.
// data/sprite_index_por_nome.json guarda espécie (sname) -> casa do atlas, que não muda com o número; este script gera o
// data/sprite_index.json (número -> casa) que o app lê, a partir do dado atual.
// Uso: node scripts/remapear_sprite_index.mjs [dex_compact.json] [sprite_index_por_nome.json] [sprite_index.json]
import { readFileSync, writeFileSync } from "node:fs";

export function indicePorNumero(dex, porNome) {
  const index = {};
  for (const sp of dex.species) {
    if (!sp) continue;
    const casa = porNome.index[sp.sname];
    if (casa !== undefined) index[sp.x] = casa;
  }
  return { cell: porNome.cell, cols: porNome.cols, rows: porNome.rows, index };
}

if ((process.argv[1] || "").endsWith("remapear_sprite_index.mjs")) {
  const [dexArq = "data/dex_compact.json", nomeArq = "data/sprite_index_por_nome.json", saida = "data/sprite_index.json"] = process.argv.slice(2);
  const r = indicePorNumero(JSON.parse(readFileSync(dexArq, "utf8")), JSON.parse(readFileSync(nomeArq, "utf8")));
  writeFileSync(saida, JSON.stringify(r));
  console.log("  OK (" + Object.keys(r.index).length + " espécies com sprite) -> " + saida);
}
