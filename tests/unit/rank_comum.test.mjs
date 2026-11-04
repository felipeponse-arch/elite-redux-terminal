// Depende de dado: rank/lutas (muda quando o rank é recalculado; não é regra de jogo fixa).
// TK-21 (rank): percentil e tier num lugar só; item do set só vale liberado na Etapa da luta; o rank v2 não herda campos do rank antigo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";
import { percentis, tierDe, unidadeComItemLiberado, camposHerdados, chavesDoRankNovo } from "../../scripts/rank_comum.mjs";

const R = carregarRegras({ milestone: 9 });

test("percentis: posição ordinal em %, tierDe nos cortes do rank", () => {
  const p = percentis({ a: 0.1, b: 0.9, c: 0.5, d: 0.7 });
  assert.deepEqual(p, { a: 25, c: 50, d: 75, b: 100 });
  assert.deepEqual([100, 97, 96.99, 90, 75, 50, 20, 19.99].map(tierDe), ["SS", "SS", "S", "S", "A", "B", "C", "D"]);
});

test("unidadeComItemLiberado: item não liberado na Etapa da luta cai para sem item; liberado fica", () => {
  const sp = R.SPECIES.find((s) => s && s.n === "Garchomp"), set = R.SETS_DE_DUELO[0];
  const golpes = R.golpesDeDueloAte(sp, 50);
  // Big Pearl: item real que só existe para o jogador numa Etapa posterior à 0.
  assert.equal(R.liberadoNaRun(0, 50, { item: "Big Pearl" }), false);
  assert.equal(R.liberadoNaRun(8, 50, { item: "Big Pearl" }), true);
  const montar = (it) => R.unidadeDeDuelo(sp, set, null, 50, golpes, null, it);
  const com = montar("Big Pearl");
  assert.equal(unidadeComItemLiberado(R, com, 0, 50, montar).item, "", "Etapa 0: Big Pearl ainda não existe");
  assert.equal(unidadeComItemLiberado(R, com, 8, 50, montar).item, "Big Pearl", "Etapa 8: liberado, fica");
});

test("camposHerdados: só o estágio passa (dupla saiu da tela); bst/duelo/habilidade do rank antigo não", () => {
  const antigo = { tier: "S", score: 90, bst: 600, bstPct: 80, abilityScore: 1, duelo: { vitorias: 50 }, dupla: { tier: "A" }, stage: 3, stageTier: "A", stageScore: 80 };
  assert.deepEqual(camposHerdados(antigo), { stage: 3, stageTier: "A", stageScore: 80 });
  assert.deepEqual(camposHerdados(undefined), {});
});

test("um script só grava species_rank.json: o rank antigo de nível 50 saiu", () => {
  const raiz = new URL("../../scripts/", import.meta.url);
  const gravadores = ["calcular_rank_v2.mjs"].filter((n) => /writeFileSync\([^)]*species_rank\.json/.test(readFileSync(new URL(n, raiz), "utf8")));
  assert.deepEqual(gravadores, ["calcular_rank_v2.mjs"]);
  assert.throws(() => readFileSync(new URL("calcular_rank_duelo.mjs", raiz)), /ENOENT/);
  assert.doesNotMatch(readFileSync(new URL("build.ps1", raiz), "utf8"), /calcular_rank_duelo\.mjs"\)/);
});

test("chavesDoRankNovo: espécie nova avaliada entra no rank gravado, a antiga fica", () => {
  const k = chavesDoRankNovo({ A: {}, B: {} }, { B: {}, NOVA: {} });
  assert.deepEqual(k.sort(), ["A", "B", "NOVA"]);
});

test("chavesDoRankNovo: espécie que saiu do dex deixa de ser citada no rank gravado (Granbull Mega, 2.65.5)", () => {
  const k = chavesDoRankNovo({ A: {}, SAIU: {} }, { A: {}, NOVA: {} }, new Set(["A", "NOVA"]));
  assert.deepEqual(k.sort(), ["A", "NOVA"]);
});
