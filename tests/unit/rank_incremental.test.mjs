// Rank incremental (06/11/2026): impressão digital por espécie + global, e a decisão do que recalcular.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";
import { digitalDaEspecie, digitalGlobal, decidir, reduzirMedicao, expandirMedicao, RANK_REGRA_VERSAO } from "../../scripts/rank_incremental.mjs";
import { unidadeComItemLiberado, camposHerdados } from "../../scripts/rank_comum.mjs";

const R = carregarRegras({ milestone: 0 });
const bulba = R.getSpeciesBySname("SPECIES_BULBASAUR");
const dig = (sp, etapa = 3, dados = R) => digitalDaEspecie(sp, etapa, dados);

test("a digital da espécie é estável e reage só aos insumos dela", () => {
  const base = dig(bulba);
  assert.equal(dig(JSON.parse(JSON.stringify(bulba))), base, "mesma espécie, mesma digital");
  assert.equal(dig(Object.assign({}, bulba, { d: "outro texto da Dex" })), base, "texto da Dex não conta");
  assert.notEqual(dig(Object.assign({}, bulba, { b: [47, 49, 49, 65, 65, 46] })), base, "stat mudou");
  assert.notEqual(dig(Object.assign({}, bulba, { inn: [65, 47, 345] })), base, "inata mudou");
  assert.notEqual(dig(Object.assign({}, bulba, { tu: bulba.tu.slice(1) })), base, "golpe de tutor saiu");
  assert.notEqual(dig(Object.assign({}, bulba, { lm: bulba.lm.concat([[50, 33]]) })), base, "golpe novo no learnset");
  assert.notEqual(dig(bulba, 4), base, "Etapa mudou");
});

test("mudar o dado de UM golpe só muda a digital de quem aprende esse golpe", () => {
  const idDoGolpe = bulba.lm[0][1];
  const outro = R.getSpeciesBySname(R.SPECIES.find((s) => s && s.sname && !(s.lm || []).some((p) => p[1] === idDoGolpe) && !(s.tu || []).includes(idDoGolpe)).sname);
  const moves = R.MOVES.slice();
  moves[idDoGolpe] = moves[idDoGolpe].slice();
  moves[idDoGolpe][3] += 10; // poder do golpe
  const dados = { MOVES: moves, ABILITIES: R.ABILITIES };
  assert.notEqual(dig(bulba, 3, dados), dig(bulba));
  assert.equal(dig(outro, 3, dados), dig(outro), "quem não aprende o golpe fica igual");
});

test("a digital global muda com a regra, com as lutas e com os dados comuns", () => {
  const partes = { lutas: [{ nome: "Roxanne", foes: [1] }], caps: [10, 20] };
  const g = digitalGlobal(partes);
  assert.equal(digitalGlobal(JSON.parse(JSON.stringify(partes))), g);
  assert.notEqual(digitalGlobal(partes, RANK_REGRA_VERSAO + 1), g, "RANK_REGRA_VERSAO sobe à mão");
  assert.notEqual(digitalGlobal(Object.assign({}, partes, { caps: [10, 21] })), g, "level cap mudou");
  assert.notEqual(digitalGlobal(Object.assign({}, partes, { lutas: [{ nome: "Roxanne", foes: [2] }] })), g, "time do chefão mudou");
});

const cache = (global, mapa) => ({ global, especies: Object.fromEntries(Object.entries(mapa).map(([s, d]) => [s, { digital: d, res: null }])) });

test("decidir: mesma global recalcula só a espécie mudada; global mudou recalcula tudo; espécie nova só ela", () => {
  const c = cache("G", { A: "1", B: "2", C: "3" });
  assert.deepEqual(decidir(c, "G", { A: "1", B: "2", C: "3" }), { recalcular: [], manter: ["A", "B", "C"], motivo: "nada mudou" });
  const um = decidir(c, "G", { A: "1", B: "9", C: "3" });
  assert.deepEqual([um.recalcular, um.manter], [["B"], ["A", "C"]]);
  const nova = decidir(c, "G", { A: "1", B: "2", C: "3", D: "4" });
  assert.deepEqual([nova.recalcular, nova.manter], [["D"], ["A", "B", "C"]]);
  const glob = decidir(c, "OUTRA", { A: "1", B: "2", C: "3" });
  assert.deepEqual(glob.recalcular, ["A", "B", "C"]);
  assert.equal(glob.motivo, "digital global mudou");
});

test("decidir: --tudo e cache ausente recalculam tudo", () => {
  const c = cache("G", { A: "1" });
  assert.deepEqual(decidir(c, "G", { A: "1" }, { tudo: true }).recalcular, ["A"]);
  assert.deepEqual(decidir(null, "G", { A: "1" }).recalcular, ["A"]);
});

test("a medição enxuta do cache dá a mesma média por luta que a medição completa", () => {
  const lutas = { party: [{ nome: "L1", etapa: 1 }, { nome: "L2", etapa: 2 }, { nome: "L3", etapa: 3 }], insane: [] };
  const completa = { etapa: 2, party: { set: "s", ab: 5, golpes: ["g"], eixos: {
    potencial: [{ luta: "L2", brs: [0.5, 0.9] }, { luta: "L3", brs: [1] }], viabilidade: [{ luta: "L2", brs: [0.25] }, { luta: "L3", brs: [0.75, 0.25] }] } }, insane: null };
  const red = reduzirMedicao(completa, ["party", "insane"]);
  assert.deepEqual(red.party.eixos.potencial, [0.7, 1]);
  assert.equal(red.insane, null);
  const volta = expandirMedicao(JSON.parse(JSON.stringify(red)), lutas);
  assert.deepEqual(volta.party.eixos.viabilidade, [{ luta: "L2", brs: [0.25] }, { luta: "L3", brs: [0.5] }]);
  assert.equal(volta.party.set, "s");
  assert.equal(reduzirMedicao(null, ["party"]), null);
});

// Dívida de sabotagem antiga (rank-item-sem-checar-liberacao, rank-herda-campos-do-rank-antigo): agora com asserção.
test("o item do set só vale se existe na Etapa da luta; sem item liberado volta a unidade sem item", () => {
  const Rfalso = { liberadoNaRun: (etapa, cap, { item }) => item === "Leftovers" };
  const refaz = (it) => ({ item: it, refeita: true });
  assert.equal(unidadeComItemLiberado(Rfalso, { item: "Leftovers" }, 1, 20, refaz).refeita, undefined);
  const sem = unidadeComItemLiberado(Rfalso, { item: "Choice Band" }, 1, 20, refaz);
  assert.deepEqual(sem, { item: "", refeita: true });
});

test("o rank novo herda só estágio da linha antiga, nunca bst/duelo", () => {
  const h = camposHerdados({ stage: 2, stageTier: "A", stageScore: 70, bst: 500, duelo: { x: 1 }, tier: "S" });
  assert.deepEqual(h, { stage: 2, stageTier: "A", stageScore: 70 });
});

test("--so recalcula só a lista e mantém o resto do cache; sem cache válido, erro", () => {
  const cache = { global: "g", especies: { A: { digital: "x" }, B: { digital: "y" }, C: { digital: "z" } } };
  const atuais = { A: "x2", B: "y", C: "z" }; // A mudou, mas o --so manda recalcular só C
  const d = decidir(cache, "g", atuais, { so: ["C"] });
  assert.deepEqual([d.recalcular, d.manter, d.motivo], [["C"], ["A", "B"], "--so"]);
  assert.throws(() => decidir(cache, "outra", atuais, { so: ["C"] }), /cache válido/);
  assert.throws(() => decidir(null, "g", atuais, { so: ["C"] }), /cache válido/);
  assert.throws(() => decidir(cache, "g", { A: "x", D: "w" }, { so: ["A"] }), /sem medição/);
});
