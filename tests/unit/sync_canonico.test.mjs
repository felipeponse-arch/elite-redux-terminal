// TK-02 (S12-2, S12-4, S12-5): comparação canônica no sync, campo v usado, team/box sem duplicata.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });
const zerar = () => { R.state.team = []; R.state.box = []; R.state.autoLog = []; R.state.orphans = { team: [], box: [] }; };

test("syncContentDiffers: mesmo conteúdo com chaves aninhadas em outra ordem não é diferença", () => {
  const a = { notes: { A: "1", B: "2" }, settings: { milestone: 3, difficulty: "ace" } };
  const b = { settings: { difficulty: "ace", milestone: 3 }, notes: { B: "2", A: "1" } };
  assert.equal(R.syncContentDiffers(a, b), false);
  assert.equal(R.syncContentDiffers(a, { ...b, notes: { B: "2", A: "9" } }), true, "valor diferente continua contando");
});

test("applySave: sname repetido em team/box entra uma vez só", () => {
  zerar();
  R.applySave({ team: ["SPECIES_PIKACHU", "SPECIES_PIKACHU", "SPECIES_EEVEE"], box: ["SPECIES_ODDISH", "SPECIES_ODDISH", "SPECIES_EEVEE"] });
  assert.equal(R.state.team.length, 2);
  assert.equal(new Set(R.state.box).size, R.state.box.length, "caixa sem repetido");
  assert.equal(R.state.box.length, 1, "o que já está no time não repete na caixa");
});

test("applySave: save de formato mais novo que o app é carregado e avisado no log (campo v)", () => {
  zerar();
  R.applySave({ v: 999, team: ["SPECIES_PIKACHU"], box: [] });
  assert.equal(R.state.team.length, 1, "carrega mesmo assim");
  assert.ok(R.state.autoLog.some((e) => /vers[aã]o mais nova/i.test(e.text)), "avisa");
  zerar();
  R.applySave({ v: 2, team: ["SPECIES_PIKACHU"], box: [] });
  assert.equal(R.state.autoLog.length, 0, "v igual ao do app não avisa");
});
