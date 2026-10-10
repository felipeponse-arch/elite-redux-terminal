// Sincronização não apaga run adiantada com run zerada (relato do usuário, 10/10/2026):
// a run do celular, avançada, foi trocada pela run nova do PC porque o sync só olhava a data
// do último salvamento. Agora, save que chega com MENOS progresso que o local pede confirmação.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });
const save = (milestone, confirmada) => ({
  team: ["SPECIES_CHARMANDER"], box: [],
  settings: { difficulty: "ace", levelCapMode: "more", milestone, runConfirmedAt: confirmada ? "2026-10-01T10:00:00.000Z" : null },
});

test("run zerada que chega por cima de run adiantada é conflito de progresso", () => {
  const celular = save(5, true), pc = save(0, false);
  assert.equal(R.saveChegandoTemMenosProgresso(celular, pc), true);
});

test("run adiantada chegando por cima de run zerada não é conflito", () => {
  assert.equal(R.saveChegandoTemMenosProgresso(save(0, false), save(5, true)), false);
});

test("mesmo marco e mesma situação não é conflito", () => {
  assert.equal(R.saveChegandoTemMenosProgresso(save(3, true), save(3, true)), false);
});

test("mesmo marco: run não confirmada chegando por cima de run confirmada é conflito", () => {
  assert.equal(R.saveChegandoTemMenosProgresso(save(2, true), save(2, false)), true);
});

test("sem save local não há o que proteger", () => {
  assert.equal(R.saveChegandoTemMenosProgresso(null, save(0, false)), false);
});

test("save sem settings (formato antigo) conta como progresso zero", () => {
  assert.equal(R.saveChegandoTemMenosProgresso(save(1, false), { team: [], box: [] }), true);
  assert.equal(R.saveChegandoTemMenosProgresso({ team: [], box: [] }, save(1, false)), false);
});
