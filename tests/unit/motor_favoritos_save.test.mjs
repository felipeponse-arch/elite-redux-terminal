// TK-02b (28/10/2026): favoritos do Modo Motor fazem parte do save (ida e volta, save antigo, saneamento).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });

test("ida e volta: favoritos gravados voltam iguais e a soma confere", () => {
  R.state.motorFavoritos = ["SPECIES_PIKACHU", "SPECIES_EEVEE"];
  const s = R.buildSave();
  assert.deepEqual([...s.motorFavoritos], ["SPECIES_PIKACHU", "SPECIES_EEVEE"]);
  assert.equal(R.conferirSomaDoSave(s), "ok");
  R.state.motorFavoritos = [];
  R.applySave(JSON.parse(JSON.stringify(s)));
  assert.deepEqual([...R.state.motorFavoritos], ["SPECIES_PIKACHU", "SPECIES_EEVEE"]);
});

test("save antigo sem o campo: carrega vazio, soma antiga continua ok, sem campo novo ao gravar vazio", () => {
  R.state.motorFavoritos = ["SPECIES_PIKACHU"];
  const velho = R.buildSave(); delete velho.motorFavoritos; velho.soma = R.somaDoSave(velho);
  assert.equal(R.conferirSomaDoSave(velho), "ok");
  R.applySave(velho);
  assert.deepEqual([...R.state.motorFavoritos], []);
  const novo = R.buildSave();
  assert.equal("motorFavoritos" in novo, false);
  assert.equal(R.syncContentDiffers(velho, novo), false, "sem favorito, nenhuma diferença falsa no sync");
});

test("saneamento: desconhecida, repetida e não-texto saem", () => {
  R.applySave({ team: [], box: [], motorFavoritos: ["SPECIES_PIKACHU", "SPECIES_NAO_EXISTE", "SPECIES_PIKACHU", 7, null, "SPECIES_EEVEE"] });
  assert.deepEqual([...R.state.motorFavoritos], ["SPECIES_PIKACHU", "SPECIES_EEVEE"]);
  R.applySave({ team: [], box: [], motorFavoritos: "x" });
  assert.deepEqual([...R.state.motorFavoritos], []);
});
