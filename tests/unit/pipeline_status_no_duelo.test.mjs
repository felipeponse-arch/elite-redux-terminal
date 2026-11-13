// Golpe de status no conjunto do pipeline (pacote 13, decisão do usuário 13/11/2026): o motor compara no duelo
// (a) 4 golpes de dano, (b) 3 de dano + 1 buff, (c) 3 de dano + 1 status útil, e fica a de maior nota. Dado real, Etapa 5.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";
import { ninetales2653b } from "./fixture_ninetales_2653b.mjs";

const R = ninetales2653b(carregarRegras({ milestone: 5, difficulty: "ace", levelCapMode: "easy" }));
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const candidatos = (n) => R.candidatosDeBuild(sp(n), {}).candidatos;
const ehDano = (n) => R.moveRoleOf(n) === "dano";
const semDano = (c) => Array.from(c.golpes).filter((n) => !ehDano(n));

test("buff vence: Tyranitar Mega leva Dragon Dance no lugar de um golpe de dano, medido no duelo", () => {
  const c = candidatos("Tyranitar Mega").find((x) => x.golpes.includes("Dragon Dance"));
  assert.ok(c, "esperava um candidato com Dragon Dance");
  assert.deepEqual(semDano(c), ["Dragon Dance"]); // no máximo 1 golpe de status
  assert.match(c.motivos.join(" | "), /Dragon Dance \(buff\) no lugar de .*: o duelo completo pontua/);
});

test("4 golpes de dano vencem: Dragonite aprende Dragon Dance, mas o duelo prefere os 4 de dano", () => {
  const lib = R.availableMovesFor(sp("Dragonite"), R.ctxDoState()).names;
  assert.ok(R.pipelineGolpesDeStatusUteis(lib, { F: true, E: false }).buffs.includes("Dragon Dance"), "o buff está liberado");
  candidatos("Dragonite").forEach((c) => assert.deepEqual(semDano(c), [], c.golpes.join("/")));
});

test("status útil: Walking Wake leva Glare (paralisar) quando o duelo pontua mais", () => {
  const c = candidatos("Walking Wake").find((x) => x.golpes.includes("Glare"));
  assert.ok(c, "esperava um candidato com Glare");
  assert.deepEqual(semDano(c), ["Glare"]);
  assert.match(c.motivos.join(" | "), /Glare \(status\) no lugar de/);
});

test("sem buff aprendível: só dano na lista, nada a medir; e o buff especial não serve a set físico", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(R.pipelineGolpesDeStatusUteis(["Tackle", "Surf"], { F: true, E: true }))), { buffs: [], outros: [] });
  const u = R.pipelineGolpesDeStatusUteis(["Swords Dance", "Nasty Plot", "Recover", "Trick Room"], { F: true, E: false });
  assert.deepEqual(Array.from(u.buffs), ["Swords Dance"]);
  assert.deepEqual(Array.from(u.outros), ["Recover", "Trick Room"]);
});

test("sem alvo simulado não há comparação: o conjunto segue só de dano", () => {
  assert.equal(R.pipelineComStatus(sp("Dragonite"), { v: { moves: ["a", "b", "c", "d"] } }, [], { foes: [] }, {}, []), null);
});

const notas = (c) => { const m = c.motivos.join(" | ").match(/pontua (\d+\.\d+) contra (\d+\.\d+) com 4 golpes de dano/); assert.ok(m, "esperava o motivo com as duas notas"); return { com: Number(m[1]), sem: Number(m[2]) }; };

test("a nota do duelo com o buff/status é maior que a dos 4 golpes de dano (Tyranitar Mega e Walking Wake)", () => {
  [["Tyranitar Mega", "Dragon Dance"], ["Walking Wake", "Glare"]].forEach(([n, g]) => {
    const { com, sem } = notas(candidatos(n).find((x) => x.golpes.includes(g)));
    assert.ok(com > sem, n + ": " + com + " deveria ser maior que " + sem);
  });
});

test("borda: conjunto que já tem golpe de status não é tocado (máximo 1)", () => {
  const c = { v: { moves: ["Earthquake", "Rock Slide", "Crunch", "Dragon Dance"] } };
  assert.equal(R.pipelineComStatus(sp("Tyranitar Mega"), c, [], { foes: [{}] }, {}, ["Swords Dance"]), null);
});

test("borda: candidato com papel (Pivô/Tanque) não leva troca de status", () => {
  ["Beedrill", "Clefable"].forEach((n) => candidatos(n).filter((c) => c.papel).forEach((c) => {
    assert.doesNotMatch(c.motivos.join(" | "), /\((buff|status)\) no lugar de/, n + " " + c.papel);
    assert.deepEqual(semDano(c).filter((g) => !R.ehGolpeDePivo(g)), [], n + " " + c.papel);
  }));
});

test("pivô livre: a troca por buff/status nunca tira o golpe de pivô", () => {
  R.SPECIES.filter((s) => s && R.rankDe(s.sname) && R.rankDe(s.sname).etapa <= 5).slice(0, 40).forEach((s) => candidatos(s.n).forEach((c) => {
    const pivo = c.golpes.find(R.ehGolpeDePivo);
    if (pivo) assert.doesNotMatch(c.motivos.join(" | "), new RegExp("no lugar de " + pivo + ":"), s.n);
  }));
});
