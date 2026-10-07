// Diff entre versões do gameData: detecta o que mudou e o que do app cita isso
// (scripts/diff_versoes.mjs, lote 2 de 2026-10-06).
import test from "node:test";
import assert from "node:assert/strict";
import { compararVersoes, impacto, formatarRelatorio } from "../../scripts/diff_versoes.mjs";

const base = () => ({
  moves: [{ id: 1, name: "Tackle", pwr: 40, types: [0] }, { id: 2, name: "Surf", pwr: 90, types: [11] }],
  abilities: [{ id: 1, name: "Sturdy", desc: "a" }],
  species: [
    { id: 1, name: "Foo", NAME: "SPECIES_FOO", stats: { base: [1, 2, 3, 4, 5, 6], types: [0, 0], abis: [1], inns: [] } },
    { id: 2, name: "Bar", NAME: "SPECIES_BAR", stats: { base: [1, 1, 1, 1, 1, 1], types: [0, 0], abis: [1], inns: [] } },
  ],
  items: [{ id: 1, name: "Potion" }],
  trainers: [{ name: "Chefe", party: [], insane: [], hell: [], map: 1 }],
});
const dados = {
  builds: { SPECIES_FOO: { ability: "Sturdy", moves: ["Surf"] }, SPECIES_BAR: { ability: "Sturdy", moves: ["Tackle"] } },
  bosses: [{ name: "Chefe", party: [{ x: 1, n: "Foo", abi: "Sturdy", mv: ["Tackle"] }] }],
  rank: { SPECIES_FOO: {}, SPECIES_BAR: {} },
};

test("versões idênticas: nenhum diff e nenhum impacto", () => {
  const dif = compararVersoes(base(), base());
  const imp = impacto(dif, base(), base(), dados);
  assert.equal(dif.golpes.alterados.length + dif.especies.alterados.length + dif.habilidades.alterados.length, 0);
  assert.deepEqual([imp.buildsAfetadas, imp.chefesAfetados, imp.rankAfetado], [[], [], []]);
});

test("golpe nerfado aponta a build e o chefão que o usam, e só eles", () => {
  const nov = base(); nov.moves[1].pwr = 70;
  const dif = compararVersoes(base(), nov);
  assert.deepEqual(dif.golpes.alterados.map((g) => [g.chave, g.campos]), [[2, ["pwr"]]]);
  const imp = impacto(dif, nov, base(), dados);
  assert.deepEqual(imp.buildsAfetadas.map((b) => b.especie), ["SPECIES_FOO"]);
  assert.deepEqual(imp.chefesAfetados, []);
});

test("espécie com stat alterado afeta build, chefão e rank dela", () => {
  const nov = base(); nov.species[0].stats.base[0] = 99;
  const dif = compararVersoes(base(), nov);
  assert.deepEqual(dif.especies.alterados[0].campos, ["stats base"]);
  const imp = impacto(dif, nov, base(), dados);
  assert.deepEqual(imp.buildsAfetadas.map((b) => b.especie), ["SPECIES_FOO"]);
  assert.deepEqual(imp.chefesAfetados.map((c) => c.chefe), ["Chefe"]);
  assert.deepEqual(imp.rankAfetado, ["SPECIES_FOO"]);
});

test("habilidade alterada pega as builds que a citam; removida e nova aparecem com nome", () => {
  const nov = base(); nov.abilities[0].desc = "b"; nov.moves.push({ id: 3, name: "Novo", pwr: 1, types: [0] }); nov.species.pop();
  const dif = compararVersoes(base(), nov);
  assert.deepEqual(dif.golpes.adicionados, ["Novo"]);
  assert.deepEqual(dif.especies.removidos, ["Bar"]);
  const imp = impacto(dif, nov, base(), dados);
  assert.equal(imp.buildsAfetadas.length, 2);
  assert.ok(imp.rankAfetado.includes("SPECIES_BAR"));
  assert.match(formatarRelatorio(dif, imp), /Builds a revisar \(2\)/);
});
