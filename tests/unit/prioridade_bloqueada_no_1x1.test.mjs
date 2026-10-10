// Queenly Majesty, Dazzling e Armor Tail ("Protects itself and ally from priority moves") no duelo 1x1 (10/10/2026).
// O motor só aplicava o bloqueio na simulação em dupla; no 1x1 sugeria golpe de prioridade contra quem é imune a ele
// (o Beatdown do Accelgor, Sombrio com +1 de prioridade, acertava o Ninetales da Meteor Falls).
// Atenção: o Mach Punch NÃO serve de prova - é Lutador e o Ninetales é Fantasma (imune pelo tipo).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const NIVEL = 55;
const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" });
const chefao = (i) => R.foeDeDuelo(R.BOSSES.find((b) => b.name === "Courtney Meteor Falls").party[i], NIVEL, null);
const accelgor = (moves, ability = "Momentum") => R.unidadeDaBuild(R.SPECIES.find((s) => s && s.n === "Accelgor"),
  { ability, nature: "Jolly", evs: [0, 252, 0, 0, 0, 252], item: "", moves }, NIVEL, null);

test("o Beatdown tem prioridade (premissa do teste)", () => {
  assert.ok(accelgor(["Beatdown"]).golpesProntos[0].prio > 0);
});

test("golpe de prioridade não acerta quem tem Queenly Majesty (o Ninetales da Meteor Falls)", () => {
  const d = R.danoNoDuelo(accelgor(["Beatdown"]), chefao(0), NIVEL);
  assert.equal(d.melhor.dano, 0, "Beatdown no Ninetales");
  assert.equal(d.melhor.golpe, null);
});

test("contra a Queenly Majesty sobra o golpe sem prioridade", () => {
  const d = R.danoNoDuelo(accelgor(["Beatdown", "Dark Pulse"]), chefao(0), NIVEL);
  assert.equal(d.melhor.golpe.nome, "Dark Pulse");
  assert.ok(d.melhor.dano > 0);
});

test("o mesmo Beatdown acerta quem não tem a habilidade (Alakazam da mesma luta)", () => {
  const d = R.danoNoDuelo(accelgor(["Beatdown"]), chefao(1), NIVEL);
  assert.ok(d.melhor.dano > 0, "dano no Alakazam: " + d.melhor.dano);
  assert.equal(d.melhor.golpe.nome, "Beatdown");
});

test("Mold Breaker ignora a habilidade: o Beatdown volta a acertar", () => {
  const d = R.danoNoDuelo(accelgor(["Beatdown"], "Mold Breaker"), chefao(0), NIVEL);
  assert.ok(d.melhor.dano > 0, "dano com Mold Breaker: " + d.melhor.dano);
});

test("a luta inteira: só com Beatdown o Accelgor não tira nada do Ninetales", () => {
  const r = R.resultadoDoDuelo(accelgor(["Beatdown"]), chefao(0), NIVEL, { detalhe: true });
  assert.equal(r.fracFoe, 1, "HP do Ninetales depois da luta");
});
