// Pipeline: espécie com 2 papéis (um é Pivô) tem uma build para cada papel; 1 papel segue com as 2 melhores.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const cands = (sname) => R.candidatosDeBuild(R.getSpeciesBySname(sname), {}).candidatos;
const temPivo = (c) => c.golpes.some((g) => R.ehGolpeDePivo(g));

test("Mega Blastoise (Pivô + Tanque): 1 build de cada papel; Pivô tem golpe de pivô e vem estimada; Tanque tem EVs de bulk", () => {
  const c = cands("SPECIES_BLASTOISE_MEGA");
  assert.equal(c.length, 2);
  const pivo = c.find((x) => x.papel === "Pivo"), tanque = c.find((x) => x.papel === "Tanque");
  assert.ok(pivo && tanque);
  assert.ok(temPivo(pivo) && !temPivo(tanque));
  assert.equal(pivo.rotulo, "estimada");
  assert.match(pivo.selo, /pivô estimado, o simulador não executa troca/);
  const e = tanque.build.evs;
  assert.ok(e[0] + e[2] + e[4] >= 252 && e[5] <= 100);
});

test("Blastoise base (1 papel): até 2 builds, sem papel marcado", () => {
  const c = cands("SPECIES_BLASTOISE");
  assert.ok(c.length >= 1 && c.length <= 2);
  c.forEach((x) => assert.equal(x.papel, null));
});
