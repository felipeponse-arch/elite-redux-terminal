// Ticket 05 (divida-tecnica): liberadoNaRun é a única régua de pedra, item e golpe;
// aviso de build, prompt da IA e pipeline concordam com ela no mesmo caso.
import test from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "more" });

test("pedra: 4ª insígnia por padrão, tardia pela tabela", () => {
  assert.equal(R.liberadoNaRun(3, 40, { pedra: "Gardevoirite" }), false); // etapa 7
  assert.equal(R.liberadoNaRun(7, 40, { pedra: "Gardevoirite" }), true);
  const comum = Object.keys(R.MEGA_FORMS).find((p) => !R.MEGA_PEDRAS_TARDIAS[p]);
  assert.equal(R.liberadoNaRun(3, 40, { pedra: comum }), false);
  assert.equal(R.liberadoNaRun(4, 40, { pedra: comum }), true);
});

test("item: usa o local do código do jogo; sem Etapa fica travado", () => {
  const nome = Object.keys(R.ONDE_ACHAR_ITENS).find((n) => R.primeiroLugarDoItem(n) && R.primeiroLugarDoItem(n).etapa > 3 && !R.MEGA_FORMS[n]);
  const e = R.primeiroLugarDoItem(nome).etapa;
  assert.equal(R.liberadoNaRun(e - 1, 40, { item: nome }), false);
  assert.equal(R.liberadoNaRun(e, 40, { item: nome }), true);
  assert.equal(R.liberadoNaRun(9, 40, { item: "Item que nao existe" }), false);
  assert.equal(R.liberadoNaRun(5, 40, { item: "Gardevoirite" }), false); // item que é pedra cai na regra da pedra
});

test("golpe: nível <= cap; tutor (null) e sem cap sempre livres", () => {
  assert.equal(R.liberadoNaRun(0, 20, { golpe: 21 }), false);
  assert.equal(R.liberadoNaRun(0, 20, { golpe: 20 }), true);
  assert.equal(R.liberadoNaRun(0, 20, { golpe: null }), true);
  assert.equal(R.liberadoNaRun(9, null, { golpe: 99 }), true);
});

test("lista do jogador: time + caixa, sem repetir, time primeiro", () => {
  const R2 = carregarRegras({ milestone: 3 });
  R2.state.team = [1, 2];
  R2.state.box = [2, 3];
  assert.deepEqual(R2.xsDoJogador(), [1, 2, 3]);
});

test("entradas do jogador: duas iguais (time + caixa) aparecem as duas; uma só aparece uma", () => {
  const R2 = carregarRegras({ milestone: 3 });
  R2.state.team = [1, 2];
  R2.state.box = [2, 3];
  assert.deepEqual(R2.entradasDoJogador(), [1, 2, 2, 3]);
  R2.state.box = [3];
  assert.deepEqual(R2.entradasDoJogador(), [1, 2, 3]);
});

// TK-00 (28/10): Salamencite R e Metagrossite R não têm fonte de obtenção no código do jogo.
// Decisão do usuário (27/10): sem Etapa conhecida = travado, em qualquer Etapa (inclusive a última).
test("pedras R sem fonte (Salamencite R, Metagrossite R) ficam travadas em todas as Etapas", () => {
  for (const pedra of ["Salamencite R", "Metagrossite R"]) {
    for (let etapa = 0; etapa <= 9; etapa++) {
      assert.equal(R.liberadoNaRun(etapa, 100, { pedra }), false, pedra + " liberada na Etapa " + etapa);
      assert.equal(R.liberadoNaRun(etapa, 100, { item: pedra }), false, pedra + " (item) liberada na Etapa " + etapa);
    }
  }
});

// Decisão 8 do usuário (28/10, TK-05): item sem Etapa conhecida = travado; pedra sem dado segue na 4ª.
test("item sem Etapa travado em toda Etapa; Lum Berry na 5; pedra sem dado na 4ª", () => {
  for (const item of ["Metronome", "Grip Claw", "Utility Umbrella", "Room Service", "Blunder Policy", "Absorb Bulb", "Cell Battery", "Luminous Moss", "Snowball", "Jaboca Berry", "Rowap Berry"]) {
    assert.equal(R.liberadoNaRun(9, 100, { item }), false, item);
  }
  assert.equal(R.liberadoNaRun(4, 40, { item: "Lum Berry" }), false);
  assert.equal(R.liberadoNaRun(5, 40, { item: "Lum Berry" }), true);
  const comum = Object.keys(R.MEGA_FORMS).find((p) => !R.MEGA_PEDRAS_TARDIAS[p] && R.primeiroLugarDoItem(p) === null);
  if (comum) assert.equal(R.liberadoNaRun(4, 40, { item: comum }), true);
});
