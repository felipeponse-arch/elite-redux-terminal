// TK-08 (28/10/2026): itens que mexem num atributo da espécie, iguais ao código do jogo (er-repo f34fc2b,
// battle_util.c:7286-7321 e 7441-7450). Light Ball e Thick Club olham a espécie-BASE (form_of na er-config):
// toda forma de Pikachu dá x2 (as linhas x1,6 do jogo são código morto), Raichu Alolan dá x1,5, Pichu e Pichu Spiky-Eared x2.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const sp = (n) => R.SPECIES.find((s) => s.n === n);
// atributo final (nível 50, IV 31, 252 EV, Modest/Adamant) com e sem o item: devolve a razão
const razao = (nome, idx, item, nat = "Hardy") => {
  const s = sp(nome);
  const f = (it) => R.calcFinalStat(s.b[idx], 31, 252, 50, idx, nat, it, s.n);
  return { sem: f(null), com: f(item), r: f(item) / f(null) };
};

test("Light Ball: toda forma de Pikachu e Pichu x2 (Atk e SpA), Raichu e Raichu Alolan x1,5", () => {
  for (const n of ["Pikachu", "Pikachu Partner", "Pikachu Belle", "Pikachu Libre", "Pikachu Ph D", "Pikachu Mega", "Pichu", "Pichu Spiky"])
    for (const idx of [1, 3]) assert.ok(Math.abs(razao(n, idx, "Light Ball").r - 2) < 0.02, n + " idx " + idx);
  for (const n of ["Raichu", "Raichu Alolan"])
    for (const idx of [1, 3]) assert.ok(Math.abs(razao(n, idx, "Light Ball").r - 1.5) < 0.02, n + " idx " + idx);
  assert.equal(razao("Pikachu", 2, "Light Ball").r, 1, "Defesa não muda");
});

test("Light Ball: Raichu Alolan, Modest, 252 SpA, nível 50 dá 241 (calibração Wattson 1)", () => {
  const s = sp("Raichu Alolan");
  assert.equal(R.calcFinalStat(s.b[3], 31, 252, 50, 3, "Modest", "Light Ball", s.n), 241);
});

test("Thick Club: Cubone, Marowak e Marowak Alolan x2 no Atk; outra espécie nada", () => {
  for (const n of ["Cubone", "Marowak", "Marowak Alolan"]) assert.ok(Math.abs(razao(n, 1, "Thick Club").r - 2) < 0.02, n);
  assert.equal(razao("Pikachu", 1, "Thick Club").r, 1);
  assert.equal(razao("Marowak", 3, "Thick Club").r, 1, "SpA não muda");
});

test("Deep Sea Tooth/Scale (Clamperl), Metal Powder e Quick Powder (Ditto) x2 só no atributo certo", () => {
  assert.ok(Math.abs(razao("Clamperl", 3, "Deep Sea Tooth").r - 2) < 0.02);
  assert.equal(razao("Clamperl", 1, "Deep Sea Tooth").r, 1);
  assert.ok(Math.abs(razao("Clamperl", 4, "Deep Sea Scale").r - 2) < 0.02);
  assert.ok(Math.abs(razao("Ditto", 2, "Metal Powder").r - 2) < 0.02);
  assert.ok(Math.abs(razao("Ditto", 5, "Quick Powder").r - 2) < 0.02);
  assert.equal(razao("Pikachu", 2, "Metal Powder").r, 1, "só Ditto");
});

test("Eviolite: uma regra só (ITEM_STAT_MODS); evolui x1,5 em Def/SpD, forma final e Necrozma nada; calcFinalStat não duplica", () => {
  assert.equal(R.itemRuleFor("Eviolite", 2, sp("Chansey"), true).mult, 1.5);
  assert.equal(R.itemRuleFor("Eviolite", 4, sp("Chansey"), true).mult, 1.5);
  assert.equal(R.itemRuleFor("Eviolite", 2, sp("Corviknight"), true), null);
  assert.equal(R.itemRuleFor("Eviolite", 2, sp("Necrozma"), true), null, "exclusão Necrozma (battle_util.c:7449)");
  assert.equal(razao("Chansey", 2, "Eviolite").r, 1, "o duelo aplica no golpe (Klutz/Knock Off tiram o item), não no atributo");
});
