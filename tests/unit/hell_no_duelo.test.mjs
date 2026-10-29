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

// Depende de dado: espécie real (a regra, com fixture inventada, está em regras_com_fixture.test.mjs)
test("H1 Hell: Water x Charizard-like 2x vira 1,5x e Ground x Magnezone 4x vira 2,5x; Ace/Elite intactos", () => {
  const casos = [["Vaporeon", "Surf", "Charizard", 2, 1.5], ["Garchomp", "Earthquake", "Magnezone", 4, 2.5]];
  casos.forEach(([a, g, d, tab, hell]) => {
    const x = unid(a, g), y = unid(d, g === "Surf" ? "Flamethrower" : "Thunderbolt");
    const ace = noModo("ace", () => dano(x, y)), h = noModo("hell", () => dano(x, y));
    assert.equal(ace.efTipo, tab, "tabela fica como está (limiares >=2)");
    assert.ok(Math.abs(h.dano / ace.dano - 0.75 * hell / tab) < 1e-9, a + " x " + d + ": " + h.dano / ace.dano);
    assert.equal(noModo("elite", () => dano(x, y).dano), ace.dano);
  });
});

// Depende de dado: espécie real (a regra, com fixture inventada, está em regras_com_fixture.test.mjs)
test("H1 Hell vale para os dois lados e não mexe em neutro/resistido", () => {
  const x = unid("Vaporeon", "Surf"), y = unid("Charizard", "Flamethrower"); // y bate em x só neutro/resistido? Fire x Water = 0,5
  const a = noModo("ace", () => dano(y, x)), h = noModo("hell", () => dano(y, x));
  assert.ok(Math.abs(h.dano / a.dano - 0.75) < 1e-9, "neutro/resistido só leva o x0,75 global");
  const z = unid("Jolteon", "Thunderbolt"), w = unid("Vaporeon", "Surf");
  const lado = (p, q) => noModo("hell", () => dano(p, q)).dano / noModo("ace", () => dano(p, q)).dano;
  assert.ok(Math.abs(lado(z, w) - 0.5625) < 1e-9, "jogador bate super efetivo");
  assert.ok(Math.abs(lado(unid("Garchomp", "Earthquake"), z) - 0.5625) < 1e-9, "inimigo bate super efetivo (foe usa a mesma conta)");
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
    const f = noModo("hell", () => R.foeDeDuelo(b.party[0], NIVEL, null));
    const g5 = noModo("ace", () => R.foeDeDuelo(b.party[0], NIVEL + 5, null));
    assert.deepEqual(f.stats, g5.stats, "inimigo sempre com o IV do dado (nível +5 do R7 em Hell com 8 badges)");
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

const comItem = (nome, golpe, item) => R.unidadeDeDuelo(sp(nome), R.SETS_DE_DUELO[0], null, NIVEL, [R.MOVE_ID_BY_NAME[golpe]], null, item);
// Expert Belt: o jogo compara o modificador já reduzido (battle_util.c:7677): em Hell o 2x (1,5) não ativa, só o 4x (2,5).
// Depende de dado: espécie real (a regra, com fixture inventada, está em regras_com_fixture.test.mjs)
test("Expert Belt em Hell: 2x não ativa, 4x ativa; no Ace ativa nos dois", () => {
  const razao = (a, g, d, dg, dif) => noModo(dif, () => dano(comItem(a, g, "Expert Belt"), unid(d, dg)).dano / dano(comItem(a, g, "Leftovers"), unid(d, dg)).dano);
  assert.ok(Math.abs(razao("Vaporeon", "Surf", "Charizard", "Flamethrower", "ace") - 1.2) < 1e-9);
  assert.ok(Math.abs(razao("Vaporeon", "Surf", "Charizard", "Flamethrower", "hell") - 1) < 1e-9, "2x em Hell: sem cinto");
  assert.ok(Math.abs(razao("Garchomp", "Earthquake", "Magnezone", "Thunderbolt", "hell") - 1.2) < 1e-9, "4x em Hell: cinto ativa");
});

// R14 (battle_util.c:7544-7551): Hell reduz todo dano a x0,75 e x0,9 a mais quando o defensor é inimigo com o 2º badge.
test("R14 Hell: dano x0,75 global e x0,9 extra no inimigo só com milestone >= 2; Ace intacto", () => {
  const marco = R.state.settings.milestone;
  try {
    const foe = R.foeDeDuelo(R.BOSSES.find((x) => x.name === "Brawly 1").party[0], NIVEL, null), eu = unid("Vaporeon", "Surf");
    const razao = (a, d, m) => { R.state.settings.milestone = m; return noModo("hell", () => dano(a, d).dano) / noModo("ace", () => dano(a, d).dano); };
    const t = (v, e, msg) => assert.ok(Math.abs(v - e) < 1e-9, msg + ": " + v);
    assert.equal(noModo("ace", () => dano(eu, foe).efTipo), 1, "caso precisa ser neutro");
    t(razao(eu, foe, 1), 0.75, "jogador no inimigo, 1 badge");
    t(razao(eu, foe, 2), 0.675, "jogador no inimigo, 2 badges");
    t(razao(foe, eu, 8), 0.75, "inimigo no jogador nunca leva o x0,9");
  } finally { R.state.settings.milestone = marco; }
});

// R7 (battle_main.c:1807): Hell com o 3º badge dá +5 níveis ao inimigo, máximo 100.
test("R7 Hell: inimigo +5 níveis com milestone >= 3 (teto 100); antes disso e no Ace/Elite fica igual", () => {
  const marco = R.state.settings.milestone, m = R.BOSSES.find((x) => x.name === "Brawly 1").party[0];
  const st = (dif, mk, n) => { R.state.settings.milestone = mk; return noModo(dif, () => R.foeDeDuelo(m, n, null).stats); };
  try {
    assert.deepEqual(st("hell", 3, NIVEL), st("ace", 3, NIVEL + 5));
    assert.deepEqual(st("hell", 2, NIVEL), st("ace", 2, NIVEL));
    assert.deepEqual(st("elite", 8, NIVEL), st("ace", 8, NIVEL));
    assert.deepEqual(st("hell", 8, 98), st("ace", 8, 100), "teto 100");
  } finally { R.state.settings.milestone = marco; }
});

// R7 (revisão do supervisor): o +5 vale também no dano do inimigo (termo 2L/5+2 e Night Shade), não só nos stats.
test("R7 Hell: dano do inimigo usa o nível +5 (50 -> 55: termo 24, não 22); fora do Hell igual", () => {
  const marco = R.state.settings.milestone, base = R.BOSSES.find((x) => x.name === "Brawly 1").party[0];
  const eu = unid("Vaporeon", "Surf");
  const dele = (dif, mv) => { R.state.settings.milestone = 3; return noModo(dif, () => { const f = R.foeDeDuelo(Object.assign({}, base, { mv: [mv] }), NIVEL, null); return { f, d: dano(f, eu).dano }; }); };
  try {
    const h = dele("hell", "Night Shade"), a = dele("ace", "Night Shade");
    assert.equal(h.f.nivelDuelo, NIVEL + 5);
    assert.ok(Math.abs(h.d - (NIVEL + 5)) < 1e-9, "Night Shade = nível efetivo, deu " + h.d);
    assert.ok(Math.abs(a.d - NIVEL) < 1e-9, "Ace: nível sem +5, deu " + a.d);
    const x = dele("hell", "Tackle"), y = dele("hell", "Tackle");
    y.f.nivelDuelo = NIVEL; // sem o +5 no termo de nível, o dano cai
    const dd = (f) => noModo("hell", () => dano(f, eu).dano);
    assert.ok(dd(x.f) > dd(y.f), "termo de nível 24 > 22");
  } finally { R.state.settings.milestone = marco; }
});
