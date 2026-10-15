// Habilidades de golpe duplo (10/10/2026). O usuário testou no jogo: o Mega Punch do Ledian (Raging Boxer, Iron
// Fist, Aerilate) mostra 78% a 93% do HP do Ninetales no primeiro golpe, e o motor dava 201% porque a Raging
// Boxer entrava duas vezes (x1,4 em todos os golpes e mais x2 nos socos). Texto do jogo: "1st hit at 100% power,
// 2nd hit at 40%" = x1,4 no total, só nos socos. Aqui cada habilidade de golpe duplo confere com o texto.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "more" });
const ef = (nome, clima = null) => R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME[nome]], "SPECIES_RATTATA", clima);
const perto = (a, b, rotulo) => assert.ok(Math.abs(a - b) < 1e-9, rotulo + ": " + a + " (esperado " + b + ")");

test("Raging Boxer: só soco, x1,4 no total (1º golpe 100%, 2º 40%) - nunca x2 nem em todos os golpes", () => {
  const e = ef("Raging Boxer");
  perto(e.categoriaExtra.soco, 1.4, "soco");
  assert.equal(e.golpeExtra, 1, "golpe que não é soco não ganha nada");
});

test("Raging Moth: golpe de Fogo bate duas vezes a 70% cada = x1,4", () => {
  perto(ef("Raging Moth").bonusTipo.Fire, 1.4, "Fogo");
});

test("Parental Bond e Hyper Aggressive: todos os golpes, 2º golpe a 25% = x1,25", () => {
  perto(ef("Parental Bond").golpeExtra, 1.25, "Parental Bond");
  perto(ef("Hyper Aggressive").golpeExtra, 1.25, "Hyper Aggressive");
});

test("Primal Maw, Dual Wield e Jackhammer: x1,4 só na categoria do texto", () => {
  const maw = ef("Primal Maw");
  perto(maw.categoriaExtra.mordida, 1.4, "mordida");
  assert.equal(maw.golpeExtra, 1);
  const dual = ef("Dual Wield");
  perto(dual.categoriaExtra.corte, 1.4, "corte");
  perto(dual.categoriaExtra.pulso, 1.4, "pulso");
  perto(ef("Jackhammer").categoriaExtra.martelo, 1.4, "martelo");
});

test("Ice Cold Hunter: golpe de Gelo bate duas vezes (x2) só no granizo", () => {
  perto(ef("Ice Cold Hunter", "granizo").bonusTipo.Ice, 2, "granizo");
  assert.equal(ef("Ice Cold Hunter").bonusTipo.Ice, undefined, "sem granizo não vale");
});

test("Ledian: o poder do Mega Punch carrega a Raging Boxer uma vez só (x1,4 sobre Aerilate, STAB e Iron Fist)", () => {
  const sp = R.SPECIES.find((s) => s && s.n === "Ledian");
  const eu = R.unidadeDaBuild(sp, { ability: "Aerodynamics", nature: "Jolly", evs: [84, 172, 0, 0, 0, 252], item: "", moves: ["Mega Punch"] }, 55, null);
  const g = eu.golpesProntos[0];
  assert.equal(g.tipo, "Flying", "Aerilate vira o Mega Punch em Voador");
  const semBoxer = g.forcaBase * eu.ef.converte.Normal.mult * eu.ef.bonusCategoria.soco * eu.ef.stabMult; // STAB x1,5 do tipo novo (Ledian não é Flying; versao-nova/02)
  assert.ok(Math.abs(g.forca / semBoxer - 1.4) < 0.01, "razão da Raging Boxer = " + (g.forca / semBoxer).toFixed(3) + " (esperado 1,4)");
});
