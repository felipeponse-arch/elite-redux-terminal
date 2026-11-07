// Papéis, estilo e tags do Modo Motor (corte 06/11/2026): o papel vem do rank (SPECIES_ROLE), o estilo é a contagem desses papéis
// e a tag de clima exige armador + DOIS beneficiários. Nada é provado por simulação.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const POOL = ["Politoed", "Ludicolo", "Kingdra", "Swampert", "Floatzel", "Gyarados", "Scizor", "Garchomp", "Metagross", "Togekiss", "Pelipper", "Torkoal", "Charizard", "Venusaur", "Lilligant"];
function run(nomes, milestone = 3, builds = {}) {
  const R = carregarRegras({ milestone });
  const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
  R.state.team = nomes.slice(0, 6).map((n) => sp(n).x);
  R.state.box = nomes.slice(6).map((n) => sp(n).x);
  Object.keys(builds).forEach((n) => { const [ability, moves, nature, evs] = builds[n]; R.state.customBuilds[sp(n).sname] = [{ active: true, ability, moves, item: "", nature, evs }]; });
  const ctx = R.contextoDoMotor();
  ctx.cache = R.criarCacheDoMotor();
  ctx.fecharItens = false;
  const base = R.motorCandidatos(ctx, [], []).filter((c) => c.sp.x === c.base.x);
  return { R, ctx, time: (...ns) => ns.map((n) => base.find((c) => c.nome === n)) };
}

let comum = null; // um só carregamento para os testes de papel e estilo (carregar as regras é o custo)
test("papel do membro = papel da espécie no rank (SPECIES_ROLE), com rótulo em português", () => {
  const { R, ctx, time } = comum || (comum = run(POOL));
  const t = time("Togekiss", "Scizor", "Swampert", "Garchomp", "Metagross", "Gyarados");
  const cl = R.motorClassificar(ctx, t);
  cl.membros.forEach((m, i) => assert.deepEqual(m.papeis, (R.SPECIES_ROLE[t[i].base.sname].roles || []).map((x) => R.ROLE_LABEL_PT[x] || x), m.nome));
  assert.ok(cl.membros.some((m) => m.papeis.length), "o caso precisa ter ao menos um papel no rank");
});

// Papéis fixados à mão em cima de espécies reais para ficar na fronteira da regra do estilo.
function estiloCom(papeis) {
  const { R, ctx, time } = comum || (comum = run(POOL));
  const t = time("Togekiss", "Scizor", "Swampert", "Garchomp", "Metagross", "Gyarados");
  t.forEach((c, i) => { R.SPECIES_ROLE[c.base.sname] = { roles: papeis[i] }; });
  return R.motorClassificar(ctx, t);
}
test("estilo: Hyper Offense pede 4 ofensivos sem tanque (com 3 é Balance)", () => {
  assert.equal(estiloCom([["Sweeper"], ["Wallbreaker"], ["Sweeper"], ["Wallbreaker"], [], []]).estilo, "Hyper Offense");
  assert.equal(estiloCom([["Sweeper"], ["Wallbreaker"], ["Sweeper"], [], ["Pivo"], []]).estilo, "Balance");
});
test("estilo: Bulky Offense = 3+ ofensivos e 1+ tanque; Stall = até 1 ofensivo e 3+ de tanque/pivô (com 2 ofensivos é Balance)", () => {
  assert.equal(estiloCom([["Sweeper"], ["Wallbreaker"], ["Sweeper"], ["Tanque"], [], []]).estilo, "Bulky Offense");
  assert.equal(estiloCom([["Sweeper"], ["Tanque"], ["Tanque"], ["Pivo"], [], []]).estilo, "Stall");
  assert.equal(estiloCom([["Sweeper"], ["Wallbreaker"], ["Tanque"], ["Tanque"], ["Pivo"], []]).estilo, "Balance");
  assert.equal(estiloCom([[], [], [], [], [], []]).estilo, null);
});

test("tag de clima: armador com UM beneficiário não ganha a tag; com dois ganha", () => {
  const sem = { Metagross: ["Clear Body", ["Splash", "Protect", "Rest", "Sleep Talk"], "Bold", [252, 0, 252, 0, 4, 0]], Garchomp: ["Rough Skin", ["Splash", "Protect", "Rest", "Sleep Talk"], "Bold", [252, 0, 252, 0, 4, 0]] };
  const { R, ctx, time } = run(POOL, 3, sem);
  const um = time("Torkoal", "Lilligant", "Kingdra", "Pelipper", "Metagross", "Garchomp");
  const itens = R.motorSinergia(ctx, um).itens.filter((i) => i.cond.id === "clima:sol");
  assert.equal(itens.length, 1);
  assert.equal(itens[0].beneficiarios.length, 1);
  assert.equal(R.motorClassificar(ctx, um).tags.filter((t) => t.armador).length, 0);
  const dois = time("Torkoal", "Lilligant", "Venusaur", "Charizard", "Togekiss", "Scizor");
  const tag = R.motorClassificar(ctx, dois).tags.find((t) => t.tag === "clima: sol");
  assert.ok(tag && tag.armador === "Torkoal" && tag.beneficiarios.length >= 2, JSON.stringify(tag));
});
