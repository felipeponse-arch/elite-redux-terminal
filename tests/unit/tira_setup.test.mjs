// Ticket 18 (07/10/2026): golpes que tiram setup, pelo código oficial (er-repo 217dd0f,
// battle_scripts_1.s). Troca forçada (Dragon Tail, Circle Throw, Roar of Time, Whirlwind...): quem
// sai perde os estágios; Clear Smog zera os do alvo; Spectral Thief rouba os positivos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const unid = (nome, stats, golpes, status = [], extra = {}) => {
  const u = Object.assign({ nome, ef: R.efeitoDasHabilidadesNoDuelo((extra.habs || []).map(idHab), "TS_" + (extra.habs || []).join("+"), null), tipos: ["Normal"], stats, ids: [], item: "", sp: { n: nome } }, extra.u || {});
  u.golpesProntos = R.prepararGolpesDuelo(golpes.map((n) => R.MOVE_ID_BY_NAME[n]), u, null);
  u.statusIds = status.map((n) => R.MOVE_ID_BY_NAME[n]);
  return u;
};
// stats: [hp, atk, def, spa, spd, spe] - mesmos números do teste do ticket 05
const comSD = () => unid("Com Swords Dance", [300, 150, 120, 50, 120, 120], ["Body Slam"], ["Swords Dance"]);
const parrudo = (golpes = ["Tackle"]) => unid("Parrudo", [700, 70, 220, 40, 120, 50], golpes);
const forte = (golpes = ["Body Slam"]) => unid("Forte", [260, 140, 130, 40, 130, 100], golpes);

test("dado: Dragon Tail/Circle Throw/Roar of Time/Whirlwind forçam troca; Clear Smog e Absorb zeram; Spectral Thief rouba", () => {
  const alvo = unid("Alvo", [300, 100, 100, 100, 100, 100], ["Tackle"]);
  const modo = (n, y = alvo) => (R.golpeQueTiraSetupDuelo(unid("X", [300, 100, 100, 100, 100, 100], [n]), y) || {}).modo;
  ["Dragon Tail", "Circle Throw", "Roar of Time", "Whirlwind"].forEach((n) => assert.equal(modo(n), "troca", n));
  assert.equal(modo("Clear Smog"), "zera");
  assert.equal(modo("Absorb"), "zera");
  assert.equal(modo("Freezy Frost"), "zera");
  assert.equal(modo("Spectral Thief", unid("Lutador", [300, 100, 100, 100, 100, 100], ["Tackle"], [], { u: { tipos: ["Fighting"] } })), "rouba");
  assert.equal(modo("Body Slam"), undefined);
});

test("precisa acertar: Circle Throw não pega Ghost; troca forçada não tira quem não pode ser forçado a sair", () => {
  const fantasma = unid("Fantasma", [300, 100, 100, 100, 100, 100], ["Tackle"], [], { u: { tipos: ["Ghost"] } });
  assert.equal(R.golpeQueTiraSetupDuelo(unid("X", [300, 100, 100, 100, 100, 100], ["Circle Throw"]), fantasma), null);
  const ventosa = unid("Ventosa", [300, 100, 100, 100, 100, 100], ["Tackle"], [], { habs: ["Suction Cups"] });
  assert.equal(ventosa.ef.naoSaiForcado, true);
  assert.equal(R.golpeQueTiraSetupDuelo(unid("X", [300, 100, 100, 100, 100, 100], ["Dragon Tail"]), ventosa), null);
});

test("no duelo: contra quem tem Clear Smog o Swords Dance não fica (o setup se perde)", () => {
  const sem = R.resultadoDoDuelo(comSD(), parrudo(), 50, { detalhe: true });
  assert.deepEqual({ ...sem.setupEu }, { atk: 2 }, "pré-condição: sem Clear Smog o +2 fica");
  const com = R.resultadoDoDuelo(comSD(), parrudo(["Tackle", "Clear Smog"]), 50, { detalhe: true });
  assert.equal(com.setupEu, null);
});

test("luta contra o chefão: o +2 levado some contra Clear Smog; Dragon Tail só tira com outro vivo no meu time", () => {
  const base = R.simularLutaContraChefao([comSD()], [parrudo(), forte()], 50);
  assert.equal(base.log[1].venceu, true, "pré-condição: com o +2 levado vence o Forte");
  const smog = R.simularLutaContraChefao([comSD()], [parrudo(), forte(["Body Slam", "Clear Smog"])], 50);
  assert.equal(smog.log[1].venceu, false, "Clear Smog zera o +2");
  const caudaSozinho = R.simularLutaContraChefao([comSD()], [parrudo(), forte(["Body Slam", "Dragon Tail"])], 50);
  assert.equal(caudaSozinho.log[1].venceu, true, "sem ninguém para entrar no lugar, a troca não acontece");
  const reserva = unid("Reserva", [100, 30, 30, 30, 30, 30], ["Tackle"]);
  const caudaComReserva = R.simularLutaContraChefao([comSD(), reserva], [parrudo(), forte(["Body Slam", "Dragon Tail"])], 50);
  const segundo = caudaComReserva.log.find((l) => l.meu === "Com Swords Dance" && l.contra === "Forte");
  assert.equal(segundo.venceu, false, "com reserva, a troca forçada tira o +2");
});

test("Spectral Thief rouba o +2 levado: quem rouba sai mais inteiro que com Clear Smog (que só zera)", () => {
  const lutador = () => unid("Com Swords Dance", [300, 150, 120, 50, 120, 120], ["Body Slam"], ["Swords Dance"], { u: { tipos: ["Fighting"] } });
  const fim = (golpes) => R.simularLutaContraChefao([lutador()], [parrudo(), forte(golpes)], 50).log.find((l) => l.contra === "Forte");
  const smog = fim(["Body Slam", "Clear Smog"]), ladrao = fim(["Body Slam", "Spectral Thief"]);
  assert.equal(smog.venceu, false);
  assert.ok(ladrao.fracFoe > smog.fracFoe + 0.05, ladrao.fracFoe + " x " + smog.fracFoe);
});

test("no duelo, do outro lado: o setup do chefão também se perde contra o meu Clear Smog", () => {
  const sem = R.resultadoDoDuelo(parrudo(), comSD(), 50, { detalhe: true });
  assert.deepEqual({ ...sem.setupEle }, { atk: 2 }, "pré-condição: sem Clear Smog o +2 dele fica");
  assert.equal(R.resultadoDoDuelo(parrudo(["Tackle", "Clear Smog"]), comSD(), 50, { detalhe: true }).setupEle, null);
});

test("revisão 07/10: Dragon Tail contra o último do time (sem reserva) não tira o setup; Clear Smog tira mesmo assim", () => {
  const rem = (g) => unid("Rem", [400, 110, 120, 50, 120, 80], g);
  const d = (g, semReservaFoe) => R.resultadoDoDuelo(rem(g), comSD(), 50, { detalhe: true, semReservaFoe });
  assert.equal(d(["Body Slam", "Dragon Tail"], false).setupEle, null, "com reserva: a troca forçada tira");
  assert.deepEqual({ ...d(["Body Slam", "Dragon Tail"], true).setupEle }, { atk: 2 }, "sem reserva: o setup fica");
  assert.equal(d(["Body Slam", "Clear Smog"], true).setupEle, null, "Clear Smog não depende de troca");
});
