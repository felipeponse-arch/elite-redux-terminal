// TK-28: a decisão "quais Pokémon do time ainda estão sem build" mora em src/regras (computeTeamGenerationValidation), não na tela.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });

test("computeTeamGenerationValidation: lista quem não tem build efetiva e diz se todos têm", () => {
  const sp = R.getSpeciesBySname("SPECIES_PIKACHU");
  const v = R.computeTeamGenerationValidation([sp]);
  const tem = !!R.effectiveBuild(sp);
  assert.equal(v.total, 1);
  assert.equal(v.allBuilt, tem);
  assert.deepEqual([...v.withoutBuild], tem ? [] : [sp.n]);
  assert.ok(v.sharedRisks !== undefined);
});

test("time vazio: tudo construído, sem pendência", () => {
  const v = R.computeTeamGenerationValidation([]);
  assert.equal(v.total, 0);
  assert.equal(v.allBuilt, true);
  assert.deepEqual([...v.withoutBuild], []);
});
