// TK-35c: habilidades novas da NextDex 2.65.5, lidas no código do jogo (ferramentas/er-repo, 4a2f6cfc).
// - Static Bloom: Electric x1,5 no Electric Terrain para quem está no chão (abilities.cc:12967-12972, IsBattlerTerrainAffected).
// - Waterborne = Hydrate + Adaptability; o encharcar do Hydrate vem junto (abilities.cc:11794-11800, .onAttacker = Hydrate).
// - Basking (ex-Sun Basking): o er-config renomeou (AbilityList.textproto:3507); o motor lê pelo texto.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const golpe = (tipo) => ({ nome: "T" + tipo, tipo, cat: "F", contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 });
const sintetica = (habs, tipos, golpes) => {
  const ids = habs.map(idHab);
  return { sp: { n: "Teste", sname: "SPECIES_TESTE55", inn: [] }, tipos, ids, ef: R.efeitoDasHabilidadesNoDuelo(ids, "T55_" + habs.join("+"), null), item: "", it: R.itemDoDuelo("", null),
    stats: [320, 100, 100, 100, 100, 100], golpesProntos: golpes, statusIds: [], clima: null };
};
const comTerreno = (terreno, fn) => { R.CAMPO_DUELO = terreno ? { terreno } : null; try { return fn(); } finally { R.CAMPO_DUELO = null; } };
const dano = (a, d) => { const r = R.danoNoDuelo(a, d, NIVEL).melhor.dano; if (process.env.DBG) console.log("dano", r); return r; };

test("Static Bloom: Electric sai x1,5 no Electric Terrain para quem está no chão; sem terreno, em outro terreno, voando ou em golpe de outro tipo, nada", () => {
  const alvo = Object.assign(sintetica([], ["Normal"], [golpe("Normal")]), { stats: [9000, 300, 300, 300, 300, 100] });
  const com = (tipos, g) => sintetica(["Static Bloom"], tipos, [golpe(g)]);
  const sem = (tipos, g) => sintetica([], tipos, [golpe(g)]);
  const razao = (terreno, tipos, g) => comTerreno(terreno, () => dano(com(tipos, g), alvo) / dano(sem(tipos, g), alvo));
  assert.ok(Math.abs(razao("eletrico", ["Normal"], "Electric") - 1.5) < 0.02, "no Electric Terrain: x1,5");
  assert.ok(Math.abs(razao(null, ["Normal"], "Electric") - 1) < 0.001, "sem terreno");
  assert.ok(Math.abs(razao("grama", ["Normal"], "Electric") - 1) < 0.001, "em outro terreno");
  assert.ok(Math.abs(razao("eletrico", ["Normal"], "Fire") - 1) < 0.001, "golpe de outro tipo");
  assert.ok(Math.abs(razao("eletrico", ["Flying"], "Electric") - 1) < 0.001, "voando não pega o terreno");
});

test("Waterborne (Hydrate + Adaptability): encharca como o Hydrate", () => {
  const ef = (n) => R.efeitoDasHabilidadesNoDuelo([idHab(n)], "WB55_" + n, null);
  assert.equal(ef("Hydrate").encharcaAgua, 0.1);
  assert.equal(ef("Waterborne").encharcaAgua, 0.1);
});

test("Basking (ex-Sun Basking, er-config AbilityList.textproto:3507): bloqueia prioridade no sol e fica na condição de sol", () => {
  assert.equal(idHab("Sun Basking"), undefined, "o nome antigo não existe mais no dado");
  assert.equal(R.efeitoDasHabilidadesNoDuelo([idHab("Basking")], "BK55", "sol").bloqueiaPrioClima, "sol");
});
