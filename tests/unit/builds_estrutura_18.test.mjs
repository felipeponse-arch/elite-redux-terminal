// TK-18 (estrutura-2026-10-22): builds. Código de motivo na recusa, IA recusa item não liberado (decisão 10),
// item esgotado e "ainda evolui" em função única, habilidadesEscolhiveis, cap do Motor == cap do pipeline.
import test from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "more" });
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);

// ---- caracterização (valia antes da refatoração, tem que continuar valendo) ----
test("evoluiAinda: mesma resposta que a regra antiga (3 literais) para TODAS as espécies, e que !isMegaEvoKind", () => {
  let evolvem = 0;
  R.SPECIES.filter(Boolean).forEach((s) => {
    const antigo = (s.ev || []).some((e) => { const k = R.DATA.evoKinds[e[0]]; return k !== "EVO_MEGA_EVOLUTION" && k !== "EVO_PRIMAL_REVERSION" && k !== "EVO_MOVE_MEGA_EVOLUTION"; });
    assert.equal(R.evoluiAinda(s), antigo, s.n);
    if (antigo) evolvem++;
  });
  assert.ok(evolvem > 500, "contagem esperada de espécies que ainda evoluem: " + evolvem);
});

test("habilidadesEscolhiveis: igual à expressão antiga uniqueIds(ab).map(nome) em TODAS as espécies", () => {
  let n = 0;
  R.SPECIES.filter(Boolean).forEach((s) => {
    const antigo = R.uniqueIds(s.ab).map((id) => R.ABILITIES[id][0]);
    assert.deepEqual(R.habilidadesEscolhiveis(s), antigo, s.n);
    n++;
  });
  assert.ok(n > 1000);
});

// ---- item esgotado ----
test("itemEsgotadoNoTime: esgotado quando já tem MAX_MESMO_ITEM_NO_TIME donos", () => {
  assert.equal(R.MAX_MESMO_ITEM_NO_TIME, 2);
  assert.equal(R.itemEsgotadoNoTime([]), false);
  assert.equal(R.itemEsgotadoNoTime(undefined), false);
  assert.equal(R.itemEsgotadoNoTime(["A"]), false);
  assert.equal(R.itemEsgotadoNoTime(["A", "B"]), true);
});

// ---- código de motivo ----
const ledian = sp("Ledian");
const base = () => ({ ability: R.habilidadesEscolhiveis(ledian)[0], nature: "Adamant", item: "", evs: [252, 4, 0, 0, 0, 252],
  moves: R.candidatosDeBuild(ledian, {}).candidatos[0].build.moves });

test("recusa traz motivo.codigo: habilidade inexistente, item que se gasta, pedra", () => {
  const m1 = {}; assert.equal(R.validateAiBuild(ledian, Object.assign(base(), { ability: "Nada" }), m1, {}), null);
  assert.equal(m1.codigo, "habilidade-invalida");
  const m2 = {}; assert.equal(R.validateAiBuild(ledian, Object.assign(base(), { nature: "Xyz" }), m2, {}), null);
  assert.equal(m2.codigo, "natureza-invalida");
});

test("o pipeline decide o item de rascunho pelo codigo, não pelo texto: reescrever a redação não muda os candidatos", () => {
  const A = carregarRegras({ milestone: 6, difficulty: "ace", levelCapMode: "more" });
  const B = carregarRegras({ milestone: 6, difficulty: "ace", levelCapMode: "more" });
  const orig = B.validateAiBuild;
  B.validateAiBuild = function (s, raw, motivo, ctx) { const r = orig(s, raw, motivo, ctx); if (motivo && motivo.txt) motivo.txt = "mensagem reescrita"; return r; };
  const alvos = A.SPECIES.filter((s) => s && A.regraItemConsumivelPara(s, A.habilidadesEscolhiveis(s)[0])).slice(0, 40);
  let comItemDeRascunho = 0;
  alvos.forEach((s) => {
    const ca = JSON.stringify(A.candidatosDeBuild(s, {}).candidatos), cb = JSON.stringify(B.candidatosDeBuild(B.SPECIES.find((x) => x && x.x === s.x), {}).candidatos);
    assert.equal(cb, ca, s.n);
    if (ca.includes('"item":"Sitrus Berry"')) comItemDeRascunho++;
  });
  assert.ok(comItemDeRascunho > 0, "algum candidato usa o item de rascunho");
});

// ---- item não liberado (decisão 10) ----
function itemNaoLiberado() {
  return R.AI_ITEM_POOL.find((n) => !R.MEGA_FORMS[n] && R.ITEMS.includes(n) && !R.liberadoNaRun(3, R.getCurrentCap(), { item: n }));
}
test("IA recusa item não liberado na Etapa (como o Motor), com codigo item-nao-liberado", () => {
  const item = itemNaoLiberado();
  assert.ok(item, "precisa existir item do pool ainda não liberado na Etapa 3");
  const m = {};
  assert.equal(R.validateAiBuild(ledian, Object.assign(base(), { item }), m, {}), null);
  assert.equal(m.codigo, "item-nao-liberado");
  assert.match(m.txt, new RegExp(item));
  const livre = R.AI_ITEM_POOL.find((n) => !R.MEGA_FORMS[n] && R.liberadoNaRun(3, R.getCurrentCap(), { item: n }) && R.ITEMS.includes(n) && n !== "Eviolite");
  assert.ok(R.validateAiBuild(ledian, Object.assign(base(), { item: livre }), {}, {}), "item liberado continua valendo");
});

// ---- cap: Motor x pipeline ----
test("cap do ctx do Motor == cap que o pipeline lê (getCurrentCap), em toda Etapa e modo", () => {
  for (const modo of ["easy", "more", "elite"]) {
    for (let etapa = 0; etapa <= 13; etapa++) {
      const r = carregarRegras({ milestone: etapa, difficulty: "ace", levelCapMode: modo });
      const cap = r.getCurrentCap();
      assert.equal(r.contextoDoMotor().cap, cap === null ? 0 : cap, modo + " etapa " + etapa);
    }
  }
});
