// Ticket versao-nova/05 (15/10/2026), pergunta P2 respondida pelo Felipe: Best Offense e Magus Blades valem pelo CÓDIGO da versão mais nova
// (abilities.cc de 486026e, linhas 10208-10214 e 10230-10237): golpes Keen Edge/Sharpness (corte) viram especiais e o ataque soma +20% da Defesa FÍSICA
// (`secondaryAtkStatToUse[STAT_DEF] += 20`; o texto novo diz "Sp. Def", o código manda). Sem o x1,3 do Keen Edge (a 2.65beta tinha). Magus Blades
// acrescenta o golpe duplo a 60% (PARENTAL_BOND_MAGUS_BLADES, battle_util.c:7508). Antes o motor lia só "+20% da Sp. Def" em TODO golpe.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const ef = (nome) => R.efeitoDasHabilidadesNoDuelo([idHab(nome)], "BO_" + nome, null);
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b + " (tolerância " + tol + ")");

function unidade(habs, golpe) {
  const s = sp("Garchomp");
  const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Hardy", evs: [0, 252, 252, 0, 0, 0], item: "", moves: [golpe] }, NIVEL, null);
  const ids = habs.map(idHab);
  u.ids = ids; u.ab = habs[0] || ""; u.abId = ids.length ? ids[0] : null;
  u.ef = R.efeitoDasHabilidadesNoDuelo(ids, "BO_U_" + habs.join("+"), null);
  u.tipos = ["Dragon"]; // sem STAB nos golpes testados
  u.golpeIds = [R.MOVE_ID_BY_NAME[golpe]]; u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
  return u;
}
const alvo = () => {
  const u = R.unidadeDaBuild(sp("Magikarp"), { ability: "Run Away", nature: "Hardy", evs: [0, 0, 0, 0, 0, 0], item: "", moves: ["Tackle"] }, NIVEL, null);
  u.ids = []; u.ef = R.efeitoDasHabilidadesNoDuelo([], "BO_ALVO", null); u.tipos = ["Normal"];
  u.golpeIds = [R.MOVE_ID_BY_NAME.Tackle]; u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
  return u;
};
const dano = (habs, golpe) => R.danoNoDuelo(unidade(habs, golpe), alvo(), NIVEL).melhor.dano;

test("Best Offense: golpe de corte vira especial, soma +20% da Defesa FÍSICA ao ataque, sem x1,3; só nos golpes de corte", () => {
  const e = ef("Best Offense");
  assert.equal(e.categoriaEspecial.corte, true);
  assert.equal(e.bonusCategoria.corte, undefined, "o x1,3 do Keen Edge saiu do código novo");
  assert.deepEqual(JSON.parse(JSON.stringify(e.ataqueExtra)), [{ fonte: "def", pct: 0.2, categoria: "corte" }]);
});

test("Best Offense no dano: Night Slash rende (SpAtk + 20% da Def) / SpAtk contra o mesmo golpe como especial sem a soma; golpe sem corte não muda", () => {
  const u = unidade([], "Night Slash");
  const A = u.stats[3], D = u.stats[2];
  const comBO = dano(["Best Offense"], "Night Slash");
  const soEspecial = R.danoNoDuelo(Object.assign(unidade(["Best Offense"], "Night Slash"), { ef: Object.assign({}, ef("Best Offense"), { ataqueExtra: [] }) }), alvo(), NIVEL).melhor.dano;
  perto(comBO / soEspecial, (A + 0.2 * D) / A, 0.02, "a soma de 20% da Def");
  perto(dano(["Best Offense"], "Body Slam") / dano([], "Body Slam"), 1, 1e-9, "Body Slam não é corte");
});

test("Magus Blades: Best Offense + golpe de corte duplo a 60% (total x1,6), sem o x1,4 do Dual Wield da 2.65beta", () => {
  const e = ef("Magus Blades");
  assert.equal(e.categoriaEspecial.corte, true);
  assert.equal(e.categoriaExtra.corte, 1.6);
  assert.equal(e.categoriaExtra.pulso, undefined, "Mega Launcher não faz parte da Magus Blades nova");
  assert.deepEqual(JSON.parse(JSON.stringify(e.ataqueExtra)), [{ fonte: "def", pct: 0.2, categoria: "corte" }]);
});
