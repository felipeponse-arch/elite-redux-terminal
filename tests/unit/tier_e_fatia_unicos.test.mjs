// TK-20: dificuldade -> tier e a fatia 60/40 têm UMA fonte (src/regras/chefoes.js), lida por chefões, rank, Meu Time,
// pipeline de build e pelo script do rank. A caracterização vale para as 4 dificuldades e uma desconhecida.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const TIER_DO_CHEFAO = { easy: "party", ace: "party", elite: "insane", hell: "hell" }; // jogo: só Elite e Hell trocam de time
const CHAVE_DO_RANK = { easy: "party", ace: "party", elite: "insane", hell: "insane" }; // Hell usa a visão insane até existir rank Hell

test("tier do chefão e chave do rank por dificuldade (valores de antes do TK-20)", () => {
  const R = carregarRegras({});
  assert.deepEqual({ ...R.DIFF_TO_BOSSKEY }, TIER_DO_CHEFAO);
  for (const [dif, chave] of Object.entries(CHAVE_DO_RANK)) assert.equal(R.chaveDoRankDaDificuldade(dif), chave, dif);
  assert.equal(R.chaveDoRankDaDificuldade("xyz"), "party");
  assert.equal(R.chaveDoRankDaDificuldade(undefined), "party");
});

test("chefoes.js e rank_da_run.js não repetem o mapa: os dois leem TIER_DA_DIFICULDADE", () => {
  const raiz = new URL("../../src/regras/", import.meta.url);
  const rank = readFileSync(new URL("rank_da_run.js", raiz), "utf8");
  assert.doesNotMatch(rank, /dif === "elite"/);
  assert.match(rank, /TIER_DA_DIFICULDADE/);
  assert.match(readFileSync(new URL("chefoes.js", raiz), "utf8"), /TIER_DA_DIFICULDADE/);
});
