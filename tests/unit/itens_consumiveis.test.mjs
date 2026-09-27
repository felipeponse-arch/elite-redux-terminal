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

test("item exclusivo de espécie só aparece e só vale pra espécie certa", () => {
  const pikachu = R.SPECIES.find((s) => s.n === "Pikachu");
  const charizard = R.SPECIES.find((s) => s.n === "Charizard");
  assert.deepEqual([...R.itensDeEspeciePara(pikachu)], ["Light Ball"]);
  assert.equal(R.itensDeEspeciePara(charizard).length, 0);
  const marowak = R.SPECIES.find((s) => s.n.startsWith("Marowak "));
  if (marowak) assert.ok(R.itensDeEspeciePara(marowak).includes("Thick Club"), "forma regional conta");
  assert.match(R.montarPromptBuild(pikachu, {}), /Exclusivo desta especie:[\s\S]*Light Ball/);
  assert.doesNotMatch(R.montarPromptBuild(charizard, {}), /Light Ball/);
});

test("innate que come berry exige berry, na regra e no prompt", () => {
  const sp = R.SPECIES.find((s) => naoMega(s) && inn(s).includes("Gluttony"));
  assert.ok(sp, "fixture: espécie com Gluttony innate");
  const regra = R.regraItemConsumivelPara(sp, ab(sp)[0]);
  assert.equal(regra.habilidade, "Gluttony");
  assert.equal(regra.precisa, "berry");
  assert.match(R.regraItemConsumivelPrompt(sp), /innate Gluttony .*TEM que ser uma Berry/);
});

test("Unburden escolhível só exige item gasto na luta quando é a escolhida", () => {
  const sp = R.SPECIES.find((s) => naoMega(s) && ab(s).includes("Unburden") && !inn(s).some((n) => ["Gluttony", "Ripen", "Harvest", "Cud Chew", "Unburden"].includes(n)));
  assert.ok(sp, "fixture: espécie com Unburden só como escolhível");
  assert.equal(R.regraItemConsumivelPara(sp, "Unburden").precisa, "consumivel");
  const outra = ab(sp).find((n) => n !== "Unburden");
  if (outra) assert.equal(R.regraItemConsumivelPara(sp, outra), null, "outra habilidade escolhida: sem exigência");
  assert.match(R.regraItemConsumivelPrompt(sp), /se escolher Unburden/);
  assert.ok(R.itemSeGastaNaLuta("Focus Sash") && R.itemSeGastaNaLuta("Flying Gem") && R.itemSeGastaNaLuta("Salac Berry"));
  assert.ok(!R.itemSeGastaNaLuta("King's Rock") && !R.itemSeGastaNaLuta("Leftovers"));
});

test("espécie sem essas habilidades não recebe exigência nem linha no prompt", () => {
  const todas = ["Gluttony", "Ripen", "Harvest", "Cud Chew", "Unburden"];
  const sp = R.SPECIES.find((s) => naoMega(s) && ![...inn(s), ...ab(s)].some((n) => todas.includes(n)));
  assert.equal(R.regraItemConsumivelPara(sp, ab(sp)[0]), null);
  assert.equal(R.regraItemConsumivelPrompt(sp), "");
});

test("validação rejeita Gluttony sem berry e aceita com berry", () => {
  R.state.settings.milestone = 9;
  const sp = R.SPECIES.find((s) => naoMega(s) && inn(s).includes("Gluttony") && R.availableMovesFor(s).names.length >= 8);
  assert.ok(sp, "fixture: Gluttony innate com movepool");
  const livres = R.availableMovesFor(sp).names.filter((g) => R.moveRoleOf(g) !== "dupla" && R.moveRoleOf(g) !== "cura");
  const sinergia = (R.ABILITY_SYNERGY[sp.sname] || []).filter((h) => h.kind === "inn" || h.name === ab(sp)[0])
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

test("o prompt da build leva a exigência do item", () => {
  const sp = R.SPECIES.find((s) => naoMega(s) && inn(s).includes("Gluttony"));
  const p = R.montarPromptBuild(sp, {});
  assert.match(p, /ITEM OBRIGATORIO: a innate Gluttony/);
  assert.match(p, /Occa=Fire/);
});
