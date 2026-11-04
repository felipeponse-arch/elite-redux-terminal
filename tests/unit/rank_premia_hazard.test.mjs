// TK-32 (decisão do usuário de 29/10/2026): o rank premia suporte, só hazard. Dado real: Forretress no nível 40
// contra o time do Wattson (6 Pokémon), com Spikes/Toxic Spikes/Stealth Rock/Sticky Web no 4º espaço.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const NIVEL = 40;
const wattson = R.BOSSES.find((b) => b.name === R.LUTAS_DA_RUN[3][0]);
function wattsonFoes() { return foesDe(); }
const foesDe = (mexe) => wattson.party.map((m, i) => R.foeDeDuelo(mexe ? mexe(m, i) : m, NIVEL, null)).filter(Boolean);
const sp = R.SPECIES.find((s) => s && s.n === "Forretress");
const set = R.SETS_DE_DUELO[0];
const golpes = R.golpesDeDueloAte(sp, NIVEL);
const dano3 = R.quatroGolpesDeDano(R.unidadeDeDuelo(sp, set, null, NIVEL, golpes, null), wattsonFoes(), NIVEL).slice(0, 3);
const u0 = R.unidadeDeDuelo(sp, set, null, NIVEL, golpes, null);
const idDo = (nome) => R.MOVE_ID_BY_NAME[nome];
const comHazard = (nome) => {
  const u = R.unidadeDeDuelo(sp, set, null, NIVEL, dano3, null);
  u.statusIds = [idDo(nome)];
  return u;
};
const semHazard = (u) => Object.assign({}, u, { statusIds: [] });
const plano = (u, foes) => foes.map((f) => R.resultadoDoDuelo(semHazard(u), f, NIVEL, { detalhe: true }));

test("hazard: o 1º rival custa o turno do hazard (plano), os seguintes entram feridos", () => {
  const u = comHazard("Spikes"), foes = foesDe();
  const r = R.resultadosDaLutaComHazard(u, foes, NIVEL), p = plano(u, foes);
  assert.equal(r[0].planoEu, "Spikes");
  assert.ok(r[0].nota < p[0].nota, "o turno gasto custa nota contra o 1º: " + r[0].nota + " x " + p[0].nota);
  assert.equal(p[2].venceu, false);
  assert.equal(r[2].venceu, true, "o 3º entra com 1/8 a menos e passa a perder para Forretress");
});

test("Toxic Spikes e Sticky Web também pesam (status e velocidade de quem entra)", () => {
  const foes = foesDe(), p = plano(u0, foes);
  const web = R.resultadosDaLutaComHazard(comHazard("Sticky Web"), foes, NIVEL);
  assert.ok(web[3].nota > p[3].nota, "Sticky Web: " + web[3].nota + " x " + p[3].nota);
  const tox = R.resultadosDaLutaComHazard(comHazard("Toxic Spikes"), foes, NIVEL);
  assert.ok(tox[4].nota > p[4].nota, "Toxic Spikes: " + tox[4].nota + " x " + p[4].nota);
});

test("Heavy-Duty Boots no rival: o hazard não o fere", () => {
  const u = comHazard("Spikes");
  const foes = foesDe((m, i) => (i === 2 ? Object.assign({}, m, { item: "Heavy-Duty Boots" }) : m));
  // com Boots o resultado é o de sem hazard; sem Boots (Life Orb de origem) o hazard mexe.
  assert.equal(R.resultadosDaLutaComHazard(u, foes, NIVEL)[2].nota, plano(u, foes)[2].nota);
  assert.notEqual(R.resultadosDaLutaComHazard(u, foesDe(), NIVEL)[2].nota, plano(u, foesDe())[2].nota, "sem Boots o mesmo rival é ferido");
});

test("removedor no time do rival (Rapid Spin) limpa o hazard para quem vem depois", () => {
  const u = comHazard("Spikes");
  const foes = foesDe((m, i) => (i === 1 ? Object.assign({}, m, { mv: ["Rapid Spin"].concat((m.mv || []).slice(0, 3)) }) : m));
  assert.equal(R.resultadosDaLutaComHazard(u, foes, NIVEL)[2].venceu, false);
});

test("o 4º espaço do potencial: com a estrutura das lutas o hazard vence o Pain Split", () => {
  const foes = foesDe();
  const nome = (q) => q.unidade.receita.status.map((id) => R.MOVES[id][0]).join();
  assert.equal(nome(R.comQuatroGolpes({ set: set.nome, unidade: u0 }, sp, foes, NIVEL, null)), "Pain Split", "sem a estrutura, como antes");
  assert.equal(nome(R.comQuatroGolpes({ set: set.nome, unidade: u0 }, sp, foes, NIVEL, null, [foes])), "Toxic Spikes");
});

// TK-42: Court Change TROCA os efeitos de campo (swapsideeffects, er-repo battle_scripts_1.s:24-32), não remove hazard;
// Rapid Spin/Mortal Spin/Tidy Up (Cmd_rapidspinfree, battle_script_commands.c:11404) e Defog (defogclear) removem.
test("TK-42: Court Change no time do rival NÃO limpa o hazard; Mortal Spin e Defog limpam", () => {
  const u = comHazard("Spikes");
  const com = (golpe) => foesDe((m, i) => (i === 1 ? Object.assign({}, m, { mv: [golpe].concat((m.mv || []).slice(0, 3)) }) : m));
  assert.equal(R.resultadosDaLutaComHazard(u, com("Court Change"), NIVEL)[2].venceu, true, "Court Change não limpa: o 3º entra ferido como sem removedor");
  ["Mortal Spin", "Defog"].forEach((g) => assert.equal(R.resultadosDaLutaComHazard(u, com(g), NIVEL)[2].venceu, false, g + " limpa"));
});

test("TK-42: Court Change é plano de troca e troca os hazards dos dois lados (swapsideeffects)", () => {
  assert.equal(R.planoDoGolpeStatus(idDo("Court Change")).tipo, "troca");
  const a = R.novoLadoDuelo(), b = R.novoLadoDuelo();
  a.espinho = 2; a.rocha = true; b.teia = true;
  assert.equal(R.temHazardDuelo(a), true);
  R.trocaHazardsDosLadosDuelo(a, b);
  assert.deepEqual([b.espinho, b.rocha, a.teia, a.espinho, a.rocha], [2, true, true, 0, false]);
});
