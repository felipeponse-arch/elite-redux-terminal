// TK-30 (28/10/2026, decisão do usuário): a REGRA é testada aqui com espécie INVENTADA (montada no teste, sem depender do dado);
// a asserção com espécie real ficou no teste original, marcada "// Depende de dado: espécie real" (hell_no_duelo, contato_tirado_no_duelo,
// habilidades_novas_2654). Os dois pares cobrem: a regra não quebra com mudança de dado; o caso real não some.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 50;
const tipo = (n) => R.TYPES.indexOf(n);
// Fixture: espécie que não existe no jogo. Fonte: inventada neste teste (stats 100 em tudo, sem habilidade nem item de evolução).
const fixa = (nome, tipos) => ({ x: 90001, i: 90001, n: nome, sname: "SPECIES_FIXA_" + nome.toUpperCase(), t: tipos.map(tipo), b: [100, 100, 100, 100, 100, 100], ab: [], inn: [], ev: [], lm: [], tu: [] });
const unid = (s, golpe, item) => R.unidadeDeDuelo(s, R.SETS_DE_DUELO[0], null, NIVEL, [R.MOVE_ID_BY_NAME[golpe]], null, item);
const dano = (a, d) => R.danoNoDuelo(a, d, NIVEL).melhor;
const noModo = (dif, f) => { R.state.settings.difficulty = dif; try { return f(); } finally { R.state.settings.difficulty = "ace"; } };
const perto = (a, b) => Math.abs(a - b) < 1e-9;

test("Hell: super efetivo 2x vira 1,5x e 4x vira 2,5x (fixture); Ace e Elite intactos", () => {
  [[fixa("Aqua", ["Water"]), "Surf", fixa("Brasa", ["Fire"]), 2, 1.5], [fixa("Terra", ["Ground"]), "Earthquake", fixa("Volt", ["Electric", "Steel"]), 4, 2.5]].forEach(([a, g, d, tab, hell]) => {
    const x = unid(a, g), y = unid(d, "Tackle");
    const ace = noModo("ace", () => dano(x, y)), h = noModo("hell", () => dano(x, y));
    assert.equal(ace.efTipo, tab);
    assert.ok(perto(h.dano / ace.dano, 0.75 * hell / tab), a.n + ": " + h.dano / ace.dano);
    assert.equal(noModo("elite", () => dano(x, y).dano), ace.dano);
  });
});

test("Hell vale para os dois lados e neutro/resistido leva só o x0,75 (fixture)", () => {
  const agua = fixa("Aqua", ["Water"]), fogo = fixa("Brasa", ["Fire"]), raio = fixa("Raio", ["Electric"]), terra = fixa("Terra", ["Ground"]);
  const lado = (p, q) => noModo("hell", () => dano(p, q)).dano / noModo("ace", () => dano(p, q)).dano;
  assert.ok(perto(lado(unid(fogo, "Flamethrower"), unid(agua, "Surf")), 0.75), "Fire x Water resistido");
  assert.ok(perto(lado(unid(raio, "Thunderbolt"), unid(agua, "Surf")), 0.5625), "jogador bate super efetivo");
  assert.ok(perto(lado(unid(terra, "Earthquake"), unid(raio, "Thunderbolt")), 0.5625), "inimigo bate super efetivo");
});

test("Expert Belt em Hell: 2x não ativa, 4x ativa; no Ace ativa nos dois (fixture)", () => {
  const razao = (a, g, d, dif) => noModo(dif, () => dano(unid(a, g, "Expert Belt"), unid(d, "Tackle")).dano / dano(unid(a, g, "Leftovers"), unid(d, "Tackle")).dano);
  const aqua = fixa("Aqua", ["Water"]), brasa = fixa("Brasa", ["Fire"]), terra = fixa("Terra", ["Ground"]), volt = fixa("Volt", ["Electric", "Steel"]);
  assert.ok(perto(razao(aqua, "Surf", brasa, "ace"), 1.2));
  assert.ok(perto(razao(aqua, "Surf", brasa, "hell"), 1), "2x em Hell: sem cinto");
  assert.ok(perto(razao(terra, "Earthquake", volt, "hell"), 1.2), "4x em Hell: cinto ativa");
});

// ---- contato / som: o atacante é uma fixture; o golpe e a habilidade são os da regra ----
function iso(s, habs, golpes) {
  const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Hardy", evs: [0, 252, 0, 252, 0, 0], item: "", moves: golpes }, NIVEL, null);
  const ids = habs.map((n) => R.ABILITY_ID_BY_NAME[n]);
  u.ids = ids; u.ab = habs[0] || ""; u.abId = ids.length ? ids[0] : null;
  u.ef = R.efeitoDasHabilidadesNoDuelo(ids, s.sname + "|" + habs.join("+"), null);
  u.tipos = R.tiposNaBatalha(s, u.ef);
  u.golpeIds = golpes.map((n) => R.MOVE_ID_BY_NAME[n]); u.clima = null;
  u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
  return u;
}

test("Long Reach: o golpe de contato sai sem contato (fixture)", () => {
  const f = fixa("Alcance", ["Normal"]);
  assert.equal(iso(f, [], ["Body Slam"]).golpesProntos[0].contato, true);
  assert.equal(iso(f, ["Long Reach"], ["Body Slam"]).golpesProntos[0].contato, false);
  assert.equal(iso(f, [], ["Mach Punch"]).golpesProntos[0].contato, true, "soco sem a luva faz contato");
});

test("Rippling Punch: soco também é som, o Soundproof do alvo barra; golpe que não é soco passa (fixture)", () => {
  const f = fixa("Soco", ["Normal"]), alvo = iso(fixa("Surdo", ["Normal"]), ["Soundproof"], ["Tackle"]);
  assert.ok(dano(iso(f, [], ["Mach Punch"]), alvo).dano > 0, "sem a habilidade o soco passa pelo Soundproof");
  assert.equal(dano(iso(f, ["Rippling Punch"], ["Mach Punch"]), alvo).dano, 0, "com Rippling Punch o soco é som");
  assert.ok(dano(iso(f, ["Rippling Punch"], ["Earthquake"]), alvo).dano > 0, "golpe que não é soco segue passando");
});
