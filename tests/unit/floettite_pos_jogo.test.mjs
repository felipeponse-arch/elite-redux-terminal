// Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
// Ticket 08 (07/10/2026): a Floettite só sai depois de vencer a Elite 4 (NPC da primeira cidade,
// confirmado pelo usuário; nenhum script público a dá). A Floette Eternal Flower continua na 6ª
// insígnia (Mystery Gift), mas a Mega dela é pós-jogo: fora do rank e da sugestão de Mega na run.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const DISP = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "rank_disponibilidade.json"), "utf8"));

test("Floettite libera só no pós-jogo (etapa 9, como a Purple Orb)", () => {
  assert.equal(R.etapaDaMega(R.getSpeciesBySname("SPECIES_FLOETTE_ETERNAL_FLOWER_MEGA")), 9);
});

test("rank: Floette Mega fora (pós-jogo); a Floette Eternal Flower segue na 6ª", () => {
  assert.equal(DISP.etapa.SPECIES_FLOETTE_ETERNAL_FLOWER_MEGA, null);
  assert.equal(DISP.motivoFora.SPECIES_FLOETTE_ETERNAL_FLOWER_MEGA, "pos-jogo");
  assert.equal(DISP.etapa.SPECIES_FLOETTE_ETERNAL_FLOWER, 6);
});
