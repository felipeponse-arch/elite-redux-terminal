// Cenários de duelo pela interface pública (ticket 07 da dívida técnica, 08/10/2026).
// Monta os dois lados como o app monta - a build do jogador (R.unidadeDaBuild) e o Pokémon do
// chefão a partir de uma linha de bosses.json (R.foeDeDuelo) - e luta pela entrada pública
// R.resultadoDoDuelo. Espécie, habilidade, golpe e item são os REAIS do dado 2.65beta; nenhum
// cenário toca em ef, stats ou golpesProntos à mão, então uma refatoração interna do motor não
// quebra estes testes - só uma mudança de comportamento quebra.
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";
import { ninetales2653b } from "./fixture_ninetales_2653b.mjs";

export const R = ninetales2653b(carregarRegras({ milestone: 9 }));
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

// O efeito de um multiplicador `mult` (1,3 = +30%; 0,5 = metade) medido numa luta inteira: a razão entre
// as duas lutas precisa cair a 10% do multiplicador (1,3 -> de 1,17 a 1,43; 0,65 -> de 0,585 a 0,715).
// Sol 1,3 no lugar de 1,5, Life Orb 1,5 no lugar de 1,3 e Solid Rock 0,75 no lugar de 0,65 saem da faixa.
// Os cenários usam chefão e jogador SEM cura nem dano passivo (Snorlax e Blissey têm Self Sufficient,
// que soma uma constante por turno e entorta a razão: sol media 1,6 e chuva 0,4 com o Snorlax).
export function dentroDoEfeito(razaoMedida, mult, rotulo, tolerancia = 0.1) {
  entre(razaoMedida, mult * (1 - tolerancia), mult * (1 + tolerancia), (rotulo || "razão") + " (efeito esperado x" + mult.toFixed(3) + ", +-" + tolerancia * 100 + "%)");
}
export const semEfeito = (razaoMedida, rotulo) => entre(razaoMedida, 0.97, 1.03, (rotulo || "razão") + " (sem efeito esperado)");

// ---------- luta inteira contra o time do chefão (2ª metade do ticket 07) ----------
// A linha de bosses.json de um Pokémon do chefão (a mesma que o app guarda na party).
export function linha(nome, { hab = "", golpes, item = "", nat = "Hardy", evs = EV.nenhum } = {}) {
  const sp = especie(nome);
  if (hab) assert.notEqual(R.ABILITY_ID_BY_NAME[hab], undefined, "habilidade inexistente: " + hab);
  golpes.forEach((g) => assert.notEqual(R.MOVE_ID_BY_NAME[g], undefined, "golpe inexistente: " + g));
  return { x: sp.x, n: nome, abi: hab, abiId: hab ? R.ABILITY_ID_BY_NAME[hab] : -1, item, nat, evsRaw: evs, ivsRaw: [31, 31, 31, 31, 31, 31], mv: golpes, hpt: "" };
}
// Candidato do jogador como o app entrega ao botão (com ou sem build salva).
export function candidato(nome, build = null) {
  const sp = especie(nome);
  return build ? { sp, owned: sp.x, build } : { sp, owned: sp.x };
}
export const build = (golpes, { hab = "", item = "", evs = EV.fisico, nat = "Adamant" } = {}) => ({ ability: hab, nature: nat, evs, item, moves: golpes });
// O botão "Montar time contra este chefão": party do chefão + candidatos + opções (dupla, buffs, campo).
export const montar = (cands, party, opcoes = {}) => R.montarTimeContraChefao(cands, party, NIVEL, opcoes);
// A luta inteira com os meus (builds) contra a party (linhas), pelo mesmo caminho do app. `ids` = buffs do
// ginásio (os ids de buffsAtivosDoChefao); `campo` = regra de campo (regraDeCampoDoChefao).
function lutaPelaEntrada(simular, quantosAbrem, minhas, party, { ids = [], campo = null } = {}) {
  const foes = R.foesComRegraDeCampo(R.foesComBuffsDoGinasio(party.map((l) => R.foeDeDuelo(l, NIVEL, null)), ids, quantosAbrem), campo);
  const meus = minhas.map((m) => R.meuComBuffsDoGinasio(R.unidadeDaBuild(especie(m.nome), m.build, NIVEL, null), ids));
  return simular(meus, foes, NIVEL, ids.length ? R.inicioDaLutaComBuffs(ids) : undefined);
}
export const lutaInteira = (minhas, party, o) => lutaPelaEntrada(R.simularLutaContraChefao, 1, minhas, party, o);
// A luta 2x2 (chefão em dupla): os dois da frente recebem os buffs de abertura.
export const lutaEmDupla = (minhas, party, o) => lutaPelaEntrada(R.simularDuplaContraChefao, 2, minhas, party, o);
export const meu = (nome, golpes, o = {}) => ({ nome, build: build(golpes, o) });
