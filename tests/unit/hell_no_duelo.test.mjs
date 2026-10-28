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
