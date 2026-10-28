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

test("fatia 60/40: constante única FATIA_DOS_CHEFOES; Meu Time e pipeline caem nela sem fatia no dado", () => {
  const R = carregarRegras({ milestone: 2 });
  assert.equal(R.FATIA_DOS_CHEFOES, 0.6);
  const { fatia: _f, ...semFatia } = R.LUTAS_COMUNS_RUN;
  R.LUTAS_COMUNS_RUN = semFatia;
  assert.equal(R.motorLutasComunsDoContexto(2).fatia, R.FATIA_DOS_CHEFOES);
  const script = readFileSync(new URL("../../scripts/rank_fatia.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(script, /FATIA_DOS_CHEFOES\s*=\s*0\.6/);
  assert.doesNotMatch(readFileSync(new URL("../../src/regras/time_pelo_motor.js", import.meta.url), "utf8"), /0\.6/);
  assert.doesNotMatch(readFileSync(new URL("../../src/regras/pipeline_build.js", import.meta.url), "utf8"), /: 0\.6/);
});
