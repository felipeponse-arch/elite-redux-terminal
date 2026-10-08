// Revisão de 07/10 (ticket 03 x Inverse Room): com a sala invertida cobrindo a luta, o chefão usa o golpe que a
// IA escolhe pela tabela invertida, não o de maior dano entre a escolha normal e a invertida.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const unid = (tipos, golpes, ef) => {
  const u = { nome: "x", ef: Object.assign({}, R.efeitoDasHabilidadesNoDuelo([], "INV", null), ef || {}), tipos, stats: [400, 100, 100, 100, 100, 100], ids: [], item: "", sp: { n: "x" } };
  u.golpesProntos = R.prepararGolpesDuelo(golpes.map((n) => R.MOVE_ID_BY_NAME[n]), u, null);
  u.statusIds = [];
  return u;
};

test("Inverse Room a luta toda: contra Water o chefão troca Thunderbolt (0,5x invertido) por Ember (2x invertido)", () => {
  const eu = unid(["Water"], ["Tackle"]);
  const normal = R.resultadoDoDuelo(eu, unid(["Normal"], ["Thunderbolt", "Ember"]), 50, { soPar: true });
  assert.equal(normal.dele.melhor.golpe.nome, "Thunderbolt", "pré-condição: sem sala, Thunderbolt");
  const inv = R.resultadoDoDuelo(eu, unid(["Normal"], ["Thunderbolt", "Ember"], { inversa: 99 }), 50, { soPar: true });
  assert.equal(inv.dele.melhor.golpe.nome, "Ember");
});
