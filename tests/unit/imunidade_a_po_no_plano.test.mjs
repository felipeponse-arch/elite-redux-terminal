// Pendência de 04/11: Spore e Sleep Powder (golpes com FLAG_POWDER) no plano comum do duelo respeitam IsPowderImmune
// (er-repo battle_util.c:3197 + canceller CANCELLER_POWDER_MOVE :3467-3470; MoveList.textproto: powder_affected).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const idG = (n) => R.MOVE_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "IP_" + nomes.join("+"), null);
const golpe = (cat) => ({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false } });
const unidade = (habs, tipos = ["Water"], item = "", ef = {}) => Object.assign({ sp: { n: "Teste", sname: "T" }, tipos, ids: habs.map(idHab), ef: efDe(habs), item, it: R.itemDoDuelo(item, null), stats: [320, 100, 100, 100, 100, 100], golpesProntos: [golpe("F")], statusIds: [], clima: null }, ef);
const eu = unidade([]);
const base = { dX: 10, dY: 10, hpX: 320, hpY: 320, golpeX: eu.golpesProntos[0], golpeY: golpe("F") };
const plano = (alvo, g, atq = eu) => R.efeitoDoPlanoDuelo(atq, alvo, idG(g), base, 50);

test("pó de sono: Grass, Overcoat, Shield Dust, Effect Spore, Guardian Coat e Safety Goggles barram; água dorme", () => {
  for (const g of ["Spore", "Sleep Powder"]) {
    assert.ok(plano(unidade([]), g), g + " dorme quem não tem imunidade");
    assert.equal(plano(unidade([], ["Grass"]), g), null, g + " x Grass");
    for (const h of ["Overcoat", "Shield Dust", "Effect Spore", "Guardian Coat"]) assert.equal(plano(unidade([h]), g), null, g + " x " + h);
    assert.equal(plano(unidade([], ["Water"], "Safety Goggles"), g), null, g + " x Safety Goggles");
  }
});

test("pó não é sono em geral: Hypnosis passa por Overcoat; Mycelium Might ignora a imunidade", () => {
  assert.ok(plano(unidade(["Overcoat"]), "Hypnosis"));
  assert.ok(plano(unidade(["Overcoat"]), "Spore", unidade(["Mycelium Might"])));
});

test("os outros pós com plano (Stun Spore, Poison Powder, Cotton Spore) respeitam a mesma imunidade", () => {
  for (const g of ["Stun Spore", "Poison Powder", "Cotton Spore"]) {
    assert.ok(plano(unidade([]), g), g + " pega quem não tem imunidade");
    assert.equal(plano(unidade([], ["Grass"]), g), null, g + " x Grass");
    assert.equal(plano(unidade(["Overcoat"]), g), null, g + " x Overcoat");
    assert.equal(plano(unidade([], ["Water"], "Safety Goggles"), g), null, g + " x Safety Goggles");
  }
  assert.ok(plano(unidade(["Overcoat"]), "Thunder Wave"), "golpe sem a flag de pó passa por Overcoat");
});
