// Ticket 05 (07/10/2026): os estágios de atributo só zeram para quem entra em campo
// (battle_main.c SwitchInClearSetData) ou desmaia (FaintClearSetData). Quem vence um duelo e
// continua em campo leva o setup (Swords Dance...) para o duelo seguinte - dos dois lados.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const unid = (nome, stats, golpes, status = []) => {
  const u = { nome, ef: R.efeitoDasHabilidadesNoDuelo([], "x", null), tipos: ["Normal"], stats, ids: [], item: "", sp: { n: nome } };
  u.golpesProntos = R.prepararGolpesDuelo(golpes.map((n) => R.MOVE_ID_BY_NAME[n]), u, null);
  u.statusIds = status.map((n) => R.MOVE_ID_BY_NAME[n]);
  return u;
};
// stats: [hp, atk, def, spa, spd, spe]
const comSD = () => unid("Com Swords Dance", [300, 150, 120, 50, 120, 120], ["Body Slam"], ["Swords Dance"]);
const parrudo = () => unid("Parrudo", [700, 70, 220, 40, 120, 50], ["Tackle"]); // pede setup e quase não machuca
const forte = () => unid("Forte", [260, 140, 130, 40, 130, 100], ["Body Slam"]);

test("o duelo detalhado devolve o setup que ficou com quem o fez", () => {
  const d = R.resultadoDoDuelo(comSD(), parrudo(), 50, { detalhe: true });
  assert.equal(d.planoEu, "Swords Dance");
  assert.deepEqual({ ...d.setupEu }, { atk: 2 });
});

test("meu Pokémon que vence com Swords Dance leva o +2 para o próximo duelo e vira a luta", () => {
  const s = R.simularLutaContraChefao([comSD()], [parrudo(), forte()], 50);
  assert.equal(s.log[0].venceu, true);
  const semLevar = R.resultadoDoDuelo(comSD(), forte(), 50, { detalhe: true, fracEu: s.log[0].fracEu });
  assert.equal(semLevar.venceu, false, "sem o +2 o segundo duelo é derrota");
  assert.equal(s.log[1].venceu, true, "com o +2 levado, vence");
});

test("o setup do chefão também continua contra o meu próximo Pokémon", () => {
  // O chefão faz Swords Dance contra o meu parrudo (que entra primeiro por ser o melhor duelo), vence e
  // enfrenta o meu segundo já com +2: acaba mais rápido e sobra mais HP para ele.
  const chefao = unid("Chefão", [300, 150, 120, 50, 120, 120], ["Body Slam"], ["Swords Dance"]);
  const meuParrudo = unid("Meu parrudo", [700, 70, 220, 40, 120, 50], ["Tackle"]);
  const meuFraco = unid("Meu fraco", [200, 90, 90, 40, 90, 60], ["Body Slam"]);
  const s = R.simularLutaContraChefao([meuParrudo, meuFraco], [chefao], 50);
  assert.equal(s.log[0].meu, "Meu parrudo");
  const segundo = s.log.find((l) => l.meu === "Meu fraco");
  const semLevar = R.resultadoDoDuelo(meuFraco, chefao, 50, { detalhe: true, fracFoe: s.log[0].fracFoe });
  assert.ok(segundo.fracFoe > semLevar.fracFoe + 0.05, segundo.fracFoe + " vs " + semLevar.fracFoe);
});

// Revisão de 07/10: as QUEDAS também ficam com quem continua em campo (Close Combat, Intimidate de quem saiu).
test("quedas que ficam: Close Combat baixa Def/SpD por uso; Intimidate do rival baixa o Atk; Clear Amulet segura", () => {
  const cc = unid("CC", [300, 150, 100, 50, 100, 120], ["Close Combat"]);
  const q = R.quedasQueFicamDuelo(cc, parrudo(), cc.golpesProntos[0], null, 2);
  assert.ok(q.def <= -2 && q.spd <= -2, JSON.stringify(q));
  const intim = unid("Intim", [300, 100, 100, 50, 100, 50], ["Tackle"]);
  intim.ef = R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME["Intimidate"]], "QI", null);
  assert.equal(R.quedasQueFicamDuelo(forte(), intim, null, null, 1).atk, -1);
  const amuleto = Object.assign(forte(), { item: "Clear Amulet", it: R.itemDoDuelo("Clear Amulet", null) });
  assert.equal(R.quedasQueFicamDuelo(amuleto, intim, null, null, 1), null);
});

test("luta contra o chefão: quem venceu com Close Combat entra no próximo duelo com a defesa baixa", () => {
  const cc = () => unid("CC", [300, 150, 100, 50, 100, 120], ["Close Combat"]);
  const fraco = unid("Fraco", [150, 60, 70, 40, 70, 50], ["Body Slam"]);
  const s = R.simularLutaContraChefao([cc()], [fraco, forte()], 50);
  assert.equal(s.log[0].venceu, true);
  const doZero = R.resultadoDoDuelo(cc(), forte(), 50, { detalhe: true, fracEu: s.log[0].fracEu });
  const segundo = s.log.find((l) => l.contra === "Forte");
  assert.ok(segundo.fracEu < doZero.fracEu - 0.02 || (doZero.venceu && !segundo.venceu), segundo.fracEu + " x " + doZero.fracEu);
});
