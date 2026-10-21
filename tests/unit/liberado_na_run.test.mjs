// Ticket 05 (divida-tecnica): liberadoNaRun é a única régua de pedra, item e golpe;
// aviso de build, prompt da IA e pipeline concordam com ela no mesmo caso.
import test from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "more" });
const sp = (n) => R.SPECIES.find((s) => s.n === n);

test("pedra: 4ª insígnia por padrão, tardia pela tabela", () => {
  assert.equal(R.liberadoNaRun(3, 40, { pedra: "Gardevoirite" }), false); // etapa 7
  assert.equal(R.liberadoNaRun(7, 40, { pedra: "Gardevoirite" }), true);
  const comum = Object.keys(R.MEGA_FORMS).find((p) => !R.MEGA_PEDRAS_TARDIAS[p]);
  assert.equal(R.liberadoNaRun(3, 40, { pedra: comum }), false);
  assert.equal(R.liberadoNaRun(4, 40, { pedra: comum }), true);
});

test("item: usa o local do código do jogo; sem local com etapa conta liberado", () => {
  const nome = Object.keys(R.ONDE_ACHAR_ITENS).find((n) => R.primeiroLugarDoItem(n) && R.primeiroLugarDoItem(n).etapa > 3 && !R.MEGA_FORMS[n]);
  const e = R.primeiroLugarDoItem(nome).etapa;
  assert.equal(R.liberadoNaRun(e - 1, 40, { item: nome }), false);
  assert.equal(R.liberadoNaRun(e, 40, { item: nome }), true);
  assert.equal(R.liberadoNaRun(0, 40, { item: "Item que nao existe" }), true);
  assert.equal(R.liberadoNaRun(5, 40, { item: "Gardevoirite" }), false); // item que é pedra cai na regra da pedra
});

test("golpe: nível <= cap; tutor (null) e sem cap sempre livres", () => {
  assert.equal(R.liberadoNaRun(0, 20, { golpe: 21 }), false);
  assert.equal(R.liberadoNaRun(0, 20, { golpe: 20 }), true);
  assert.equal(R.liberadoNaRun(0, 20, { golpe: null }), true);
  assert.equal(R.liberadoNaRun(9, null, { golpe: 99 }), true);
});

test("concordância: aviso de build e prompt dão o mesmo veredito da função", () => {
  const item = Object.keys(R.ONDE_ACHAR_ITENS).find((n) => R.primeiroLugarDoItem(n) && R.primeiroLugarDoItem(n).etapa > 3 && !R.MEGA_FORMS[n]);
  const s = sp("Charizard") || R.SPECIES[0];
  const avisou = R.avisosDaBuild(s, { moves: [], item }).some((a) => a.tipo === "item-tardio");
  assert.equal(avisou, !R.liberadoNaRun(3, R.getCurrentCap(), { item }));
  const noPrompt = R.itensAindaIndisponiveisParaIA().some((x) => x.n === item);
  assert.equal(noPrompt, R.AI_ITEM_POOL.includes(item) ? !R.liberadoNaRun(3, R.getCurrentCap(), { item }) : false);
  const pedra = "Gardevoirite";
  const a2 = R.avisosDaBuild(s, { moves: [], item: pedra }).some((a) => a.tipo === "item-tardio");
  assert.equal(a2, !R.liberadoNaRun(3, R.getCurrentCap(), { pedra }));
});

test("lista do jogador: time + caixa, sem repetir, time primeiro", () => {
  const R2 = carregarRegras({ milestone: 3 });
  R2.state.team = [1, 2];
  R2.state.box = [2, 3];
  assert.deepEqual(R2.xsDoJogador(), [1, 2, 3]);
});
