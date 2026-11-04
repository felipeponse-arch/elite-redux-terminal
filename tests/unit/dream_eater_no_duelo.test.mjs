// TK-40: Dream Eater só age em alvo dormindo ou Comatose e cura metade do dano.
// Fonte: er-repo data/battle_scripts_1.s:3564-3573 (BattleScript_EffectDreamEater: sem sono nem ABILITY_COMATOSE -> BattleScript_WasntAffected;
// senão BattleScript_EffectAbsorb = metade do dano). "Comatose" é a flag alwaysSleeping (abilities.cc:2954 Comatose, :10439 Dreamscape).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const unidade = (habs, golpe) => {
  const ids = habs.map(idHab);
  const u = { sp: { n: "Teste", sname: "SPECIES_TESTE40", inn: [] }, tipos: ["Normal"], ids, ef: R.efeitoDasHabilidadesNoDuelo(ids, "T40_" + habs.join("+"), null), item: "", it: R.itemDoDuelo("", null),
    stats: [9000, 300, 300, 300, 300, 100], golpesProntos: [], statusIds: [], clima: null };
  u.golpeIds = [R.MOVE_ID_BY_NAME[golpe]];
  u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
  return u;
};
const dano = (a, d) => R.danoNoDuelo(a, d, NIVEL).melhor.dano;

test("Dream Eater: dano 0 em alvo acordado; dano normal em Comatose e em Dreamscape", () => {
  const atq = unidade([], "Dream Eater");
  assert.equal(dano(atq, unidade([], "Tackle")), 0, "alvo acordado");
  assert.ok(dano(atq, unidade(["Comatose"], "Tackle")) > 0, "Comatose");
  assert.ok(dano(atq, unidade(["Dreamscape"], "Tackle")) > 0, "Dreamscape (alwaysSleeping)");
});

test("Dream Eater: cura metade do dano (golpe.dreno 0,5); outros golpes não curam", () => {
  assert.equal(unidade([], "Dream Eater").golpesProntos[0].dreno, 0.5);
  assert.equal(unidade([], "Tackle").golpesProntos[0].dreno, 0);
});
