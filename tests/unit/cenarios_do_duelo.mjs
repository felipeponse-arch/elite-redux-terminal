// Cenários de duelo pela interface pública (ticket 07 da dívida técnica, 08/10/2026).
// Monta os dois lados como o app monta - a build do jogador (R.unidadeDaBuild) e o Pokémon do
// chefão a partir de uma linha de bosses.json (R.foeDeDuelo) - e luta pela entrada pública
// R.resultadoDoDuelo. Espécie, habilidade, golpe e item são os REAIS do dado 2.65beta; nenhum
// cenário toca em ef, stats ou golpesProntos à mão, então uma refatoração interna do motor não
// quebra estes testes - só uma mudança de comportamento quebra.
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

export const R = carregarRegras({ milestone: 9 });
export const NIVEL = 50;
// EVs por papel (HP, Atk, Def, SpA, SpD, Spe).
export const EV = { fisico: [0, 252, 0, 0, 0, 252], especial: [0, 0, 0, 252, 0, 252], tanqueF: [252, 0, 252, 0, 0, 4], tanqueE: [252, 0, 4, 0, 252, 0], nenhum: [0, 0, 0, 0, 0, 0] };

export function especie(nome) {
  const s = R.SPECIES.find((x) => x && x.n === nome);
  assert.ok(s, "espécie inexistente no dado: " + nome);
  return s;
}
// Build do jogador. `golpes` são os 4 (ou menos) da build: sem golpe de status na lista, o motor
// não inventa plano de status - o cenário mede só o efeito que o teste quer medir.
export function eu(nome, { hab = "", golpes, item = "", evs = EV.fisico, nat = "Adamant", clima = null } = {}) {
  if (hab) assert.notEqual(R.ABILITY_ID_BY_NAME[hab], undefined, "habilidade inexistente: " + hab);
  golpes.forEach((g) => assert.notEqual(R.MOVE_ID_BY_NAME[g], undefined, "golpe inexistente: " + g));
  return R.unidadeDaBuild(especie(nome), { ability: hab, nature: nat, evs, item, moves: golpes }, NIVEL, clima);
}
// Pokémon do chefão (mesma linha que o bosses.json guarda).
export function chefao(nome, { hab = "", golpes, item = "", nat = "Hardy", evs = EV.nenhum, clima = null } = {}) {
  const sp = especie(nome);
  if (hab) assert.notEqual(R.ABILITY_ID_BY_NAME[hab], undefined, "habilidade inexistente: " + hab);
  golpes.forEach((g) => assert.notEqual(R.MOVE_ID_BY_NAME[g], undefined, "golpe inexistente: " + g));
  return R.foeDeDuelo({ x: sp.x, n: nome, abi: hab, abiId: hab ? R.ABILITY_ID_BY_NAME[hab] : -1, item, nat, evsRaw: evs, ivsRaw: [31, 31, 31, 31, 31, 31], mv: golpes, hpt: "" }, NIVEL, clima);
}
// A luta, com o detalhe: { nota, venceu (true/false/null=empate), fracEu, fracFoe, turnos, planoEu, planoEle, setupEu, setupEle }.
export const lutar = (a, b, ini = {}) => R.resultadoDoDuelo(a, b, NIVEL, Object.assign({ detalhe: true }, ini));

// O que cada lado tirou do outro, em fração do HP. Quem perde deixa o outro vivo (mede o que ele
// causou, de forma contínua); quem vence deixa a própria fração (mede o que ele sofreu).
export function causado(r) {
  assert.equal(r.venceu, false, "cenário de ataque: o jogador precisa perder pra medir o dano que causou (venceu=" + r.venceu + ")");
  return 1 - r.fracFoe;
}
export function sofrido(r) {
  assert.equal(r.venceu, true, "cenário de defesa: o jogador precisa vencer pra medir o dano que sofreu (venceu=" + r.venceu + ")");
  return 1 - r.fracEu;
}
// Razão entre duas medidas, com a mesma duração de luta (mesmo número de turnos) nas duas.
export function razao(a, b, medida) {
  assert.equal(a.turnos, b.turnos, "as duas lutas precisam durar o mesmo número de turnos (" + a.turnos + " x " + b.turnos + ")");
  return medida(a) / medida(b);
}
export const entre = (valor, min, max, rotulo) => assert.ok(valor >= min && valor <= max, (rotulo || "valor") + " = " + valor.toFixed(3) + ", esperado entre " + min + " e " + max);

// O efeito de um multiplicador `mult` (1,3 = +30%; 0,5 = metade) medido numa luta inteira nunca sai
// exato: o motor tira a média da luta (acerto, HP que sobra, golpes fracionados). Por isso a razão
// entre as duas lutas precisa cair numa faixa em volta do multiplicador - da metade do efeito ao
// dobro dele (1,3 -> de 1,15 a 1,6; 0,5 -> de 0,25 a 0,75). Efeito sumido (razão 1) ou exagerado
// fica fora da faixa.
export function dentroDoEfeito(razaoMedida, mult, rotulo) {
  const a = 1 + (mult - 1) * 0.5, b = 1 + (mult - 1) * 2;
  entre(razaoMedida, Math.min(a, b), Math.max(a, b), (rotulo || "razão") + " (efeito esperado x" + mult + ")");
}
export const semEfeito = (razaoMedida, rotulo) => entre(razaoMedida, 0.97, 1.03, (rotulo || "razão") + " (sem efeito esperado)");
