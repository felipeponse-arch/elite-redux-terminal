// TK-10b (28/10/2026): regras do modo Hell no motor. Fonte: relatorios/tk10b_evidencia.md (er-repo f34fc2b).
//   H1 super efetivo 2x -> 1,5x e 4x -> 2,5x nos dois lados (battle_util.c:7961-7969).
//   H6 paralisia: todo inimigo (todo foe sai de foeDeDuelo, com .chefao) age sempre (battle_util.c:3403-3409).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 50;
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const unid = (nome, golpe) => R.unidadeDeDuelo(sp(nome), R.SETS_DE_DUELO[0], null, NIVEL, [R.MOVE_ID_BY_NAME[golpe]], null);
const dano = (a, d) => R.danoNoDuelo(a, d, NIVEL).melhor;
const noModo = (dif, f) => { R.state.settings.difficulty = dif; try { return f(); } finally { R.state.settings.difficulty = "ace"; } };

test("H1 Hell: Water x Charizard-like 2x vira 1,5x e Ground x Magnezone 4x vira 2,5x; Ace/Elite intactos", () => {
  const casos = [["Vaporeon", "Surf", "Charizard", 2, 1.5], ["Garchomp", "Earthquake", "Magnezone", 4, 2.5]];
  casos.forEach(([a, g, d, tab, hell]) => {
    const x = unid(a, g), y = unid(d, g === "Surf" ? "Flamethrower" : "Thunderbolt");
    const ace = noModo("ace", () => dano(x, y)), h = noModo("hell", () => dano(x, y));
    assert.equal(ace.efTipo, tab, "tabela fica como está (limiares >=2)");
    assert.ok(Math.abs(h.dano / ace.dano - hell / tab) < 1e-9, a + " x " + d + ": " + h.dano / ace.dano);
    assert.equal(noModo("elite", () => dano(x, y).dano), ace.dano);
  });
});

test("H1 Hell vale para os dois lados e não mexe em neutro/resistido", () => {
  const x = unid("Vaporeon", "Surf"), y = unid("Charizard", "Flamethrower"); // y bate em x só neutro/resistido? Fire x Water = 0,5
  const a = noModo("ace", () => dano(y, x)), h = noModo("hell", () => dano(y, x));
  assert.equal(h.dano, a.dano);
  const z = unid("Jolteon", "Thunderbolt"), w = unid("Vaporeon", "Surf");
  const lado = (p, q) => noModo("hell", () => dano(p, q)).dano / noModo("ace", () => dano(p, q)).dano;
  assert.ok(Math.abs(lado(z, w) - 0.75) < 1e-9, "jogador bate super efetivo");
  assert.ok(Math.abs(lado(unid("Garchomp", "Earthquake"), z) - 0.75) < 1e-9, "inimigo bate super efetivo (foe usa a mesma conta)");
});

test("H6 Hell: todo inimigo de todo chefão sai marcado (o jogador não), então a paralisia nunca o faz perder o turno", () => {
  let n = 0;
  R.BOSSES.forEach((b) => (b.party || []).forEach((m) => { const f = R.foeDeDuelo(m, NIVEL, null); if (f) { n++; assert.equal(f.chefao, true, b.name + " " + m.n); } }));
  assert.ok(n > 100);
  assert.equal(unid("Garchomp", "Earthquake").chefao, undefined);
});

// H4: IV 0 do jogador em Hell depois da 5ª insígnia (milestone >= 5); inimigo e fora do Hell seguem em 31.
test("H4 Hell: o jogador tem IV 0 do 5º badge em diante; antes disso, no Ace e no inimigo fica 31", () => {
  const stats = (dif, marco) => { R.state.settings.milestone = marco; return noModo(dif, () => unid("Garchomp", "Earthquake").stats); };
  const antes = R.state.settings.milestone;
  try {
    const ace5 = stats("ace", 5);
    assert.deepEqual(stats("hell", 4), stats("ace", 4), "Hell com 4 badges = igual ao Ace");
    assert.deepEqual(stats("ace", 8), ace5);
    assert.ok(stats("hell", 5).every((v, i) => v < ace5[i]), "todos os stats caem com IV 0");
    const b = R.BOSSES.find((x) => x.name === "Brawly 1");
    R.state.settings.milestone = 8;
    const f = noModo("hell", () => R.foeDeDuelo(b.party[0], NIVEL, null)), g = noModo("ace", () => R.foeDeDuelo(b.party[0], NIVEL, null));
    assert.deepEqual(f.stats, g.stats, "inimigo sempre com o IV do dado");
  } finally { R.state.settings.milestone = antes; }
});

// H5: item repetido no time do jogador em Hell só vale para o primeiro (a luta usa o time com o item tirado).
test("H5 Hell: o 2º Pokémon com o mesmo item perde o item; fora do Hell fica igual", () => {
  const a = unid("Garchomp", "Earthquake"), b = unid("Magnezone", "Thunderbolt");
  const ai = Object.assign({}, a, { item: "Life Orb", it: R.itemDoDuelo("Life Orb", a.sp) }), bi = Object.assign({}, b, { item: "Life Orb", it: R.itemDoDuelo("Life Orb", b.sp) });
  const hell = noModo("hell", () => R.semItemDuplicadoNoHell([ai, bi])), ace = noModo("ace", () => R.semItemDuplicadoNoHell([ai, bi]));
  assert.equal(hell[0].item, "Life Orb");
  assert.equal(hell[1].item, "");
  assert.equal(hell[1].it.danoMult, 1);
  assert.equal(ace[1].item, "Life Orb");
});

// H2: o motor não modela Evasion Up/Minimize (nenhum plano): a cláusula de evasão do Hell (só jogador, só treinador) já fica coerente.
test("H2: Double Team e Minimize não têm plano no motor (nada a vetar no Hell)", () => {
  ["Double Team", "Minimize"].forEach((n) => assert.ok(!R.planoDoGolpeStatus(R.MOVE_ID_BY_NAME[n]), n));
});
