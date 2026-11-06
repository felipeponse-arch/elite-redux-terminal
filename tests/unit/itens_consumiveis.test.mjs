// Berries na IA e habilidades que dependem de gastar o item (2026-09-26).
// Fixtures achadas no dado real, nunca nomes supostos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const nomeDe = (id) => (R.ABILITIES[id] ? R.ABILITIES[id][0] : "");
const inn = (s) => (s.inn || []).map(nomeDe);
const ab = (s) => (s.ab || []).map(nomeDe);
const naoMega = (s) => !R.isMegaForm(s);

test("a IA tem berries de pânico e de resistência pra escolher, todas existentes no jogo", () => {
  for (const b of ["Liechi Berry", "Salac Berry", "Occa Berry", "Yache Berry", "Sitrus Berry", "Lum Berry"]) {
    assert.ok(R.AI_ITEM_POOL.includes(b), b + " na lista da IA");
  }
  assert.ok(R.AI_ITEM_POOL.every((n) => R.ITEMS.includes(n)), "nenhum item inventado");
  assert.equal(new Set(R.AI_ITEM_POOL).size, R.AI_ITEM_POOL.length, "sem repetição");
  assert.ok(!R.AI_ITEM_POOL.includes("Leppa Berry"), "PP é sempre o máximo neste hack");
});

test("gemas, reforço de tipo e utilidade entram na lista da IA, com o tipo certo", () => {
  assert.equal(R.ITENS_IA_GEMAS.length, 18, "uma gema por tipo");
  const tipos = Object.values(R.ITENS_IA_TIPO);
  assert.equal(new Set(tipos).size, 18, "um item de reforço por tipo");
  for (const [item, tipo] of Object.entries(R.ITENS_IA_TIPO)) {
    assert.ok(R.ITEMS.includes(item), item + " existe no jogo (grafia do jogo)");
    assert.match(R.ITEM_DESC[item], new RegExp(tipo, "i"), item + " reforça " + tipo + " segundo o próprio jogo");
  }
  for (const n of ["Flying Gem", "Charcoal", "Scope Lens", "Swirly Glasses", "Frost Orb", "Light Clay"]) {
    assert.ok(R.AI_ITEM_POOL.includes(n), n + " na lista da IA");
  }
  assert.ok(R.ITENS_IA_UTILIDADE.every((n) => R.ITEM_DESC[n]), "todo item de utilidade vai com a descrição do jogo");
});

test("validação rejeita Gluttony sem berry e aceita com berry", () => {
  R.state.settings.milestone = 9;
  const sp = R.SPECIES.find((s) => naoMega(s) && inn(s).includes("Gluttony") && R.availableMovesFor(s).names.length >= 8);
  assert.ok(sp, "fixture: Gluttony innate com movepool");
  const livres = R.availableMovesFor(sp).names.filter((g) => R.moveRoleOf(g) !== "dupla" && R.moveRoleOf(g) !== "cura");
  const sinergia = R.sinergiasDaEspecie(sp).filter((h) => h.kind === "inn" || h.name === ab(sp)[0])
    .flatMap((h) => h.golpes).find((g) => livres.includes(g));
  const golpes = [...new Set([sinergia, ...livres.filter((g) => R.moveRoleOf(g) === "dano")].filter(Boolean))].slice(0, 4);
  assert.equal(golpes.length, 4, "fixture: 4 golpes válidos");
  const base = { ability: ab(sp)[0], nature: "Adamant", moves: golpes, evs: [252, 252, 0, 0, 4, 0] };
  const motivo = {};
  assert.equal(R.validateAiBuild(sp, { ...base, item: "Leftovers" }, motivo), null, "Leftovers não serve pra Gluttony");
  assert.match(motivo.txt, /Gluttony .* precisa de uma Berry/);
  const ok = R.validateAiBuild(sp, { ...base, item: "Salac Berry" }, {});
  assert.ok(ok, "com berry a build passa");
  assert.equal(ok.item, "Salac Berry");
  R.state.settings.milestone = 0;
});
