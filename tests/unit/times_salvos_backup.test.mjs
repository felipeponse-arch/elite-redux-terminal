// TK-28: backup do time por CAMPO (backup: true), não pelo prefixo "Antes de " do nome; cabeçalho do chefão por função.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });

test("ehBackupDeTime: o campo manda; renomear não muda nada", () => {
  assert.equal(R.ehBackupDeTime({ name: "meu time", team: [], backup: true }), true);
  assert.equal(R.ehBackupDeTime({ name: "Antes de Roxanne", team: [], backup: false }), false);
});

// Fixture: backup antigo (gravado antes do campo existir) - o nome "Antes de ..." ainda vale.
test("Fixture: save antigo com 'Antes de X' sem campo abre e vira backup; nome comum não", () => {
  R.applySave({ team: [], box: [], savedTeams: [
    { name: "Antes de Roxanne", team: ["Pikachu"], depois: ["Eevee"] },
    { name: "Meu time", team: ["Eevee"] },
  ] });
  const [a, b] = R.state.savedTeams;
  assert.equal(R.ehBackupDeTime(a), true);
  assert.equal(R.ehBackupDeTime(b), false);
  assert.deepEqual([...a.depois], ["Eevee"]);
});

test("ida e volta: campo backup é gravado e relido; time comum não ganha o campo", () => {
  R.state.savedTeams = [{ name: "x", team: ["Pikachu"], backup: true }, { name: "y", team: [] }];
  const s = JSON.parse(JSON.stringify(R.buildSave()));
  R.applySave(s);
  assert.equal(R.state.savedTeams[0].backup, true);
  assert.equal("backup" in R.state.savedTeams[1], false);
});

test("classeDoCabecalhoDoChefao: só Aqua e Magma têm arte", () => {
  assert.equal(R.classeDoCabecalhoDoChefao("Aqua Admin"), " chefao-heroi chefao-aqua");
  assert.equal(R.classeDoCabecalhoDoChefao("Magma Leader"), " chefao-heroi chefao-magma");
  assert.equal(R.classeDoCabecalhoDoChefao("Lider de Ginasio"), "");
});
