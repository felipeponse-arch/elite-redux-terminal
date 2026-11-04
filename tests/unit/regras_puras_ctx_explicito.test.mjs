// TK-19: prompts e validação da IA recebem ctx explícito ({ archetype, team, settings, cap }) e não leem o state global.
// Prova: com o state do mundo B e o ctx do mundo A, a saída é a do mundo A (e a do mundo B, sem ctx, é outra).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

function mundo(milestone, difficulty, weather, nomesDoTime) {
  const R = carregarRegras({ milestone, difficulty });
  R.state.settings.milestone = milestone; R.state.settings.difficulty = difficulty;
  R.state.archetype.weather = weather; R.state.archetype.pace = weather ? "Balance" : null;
  R.state.team = nomesDoTime.map((n) => R.SPECIES.find((s) => s.n === n).x);
  return R;
}
const sp = (R, n) => R.SPECIES.find((s) => s.n === n);

test("o ctx do mundo A vence o state do mundo B nos prompts (build, lote, estratégias, arquétipo)", () => {
  const RA = mundo(3, "elite", "Trick Room", ["Garchomp", "Gengar"]);
  const RB = mundo(3, "elite", "Hail", ["Garchomp", "Gengar"]);
  const ctxA = JSON.parse(JSON.stringify(RA.ctxDoState()));
  for (const n of ["Garchomp", "Gengar", "Kirlia"]) {
    const esperado = RA.montarPromptBuild(sp(RA, n), {});
    assert.equal(RB.montarPromptBuild(sp(RB, n), { ctx: ctxA }), esperado, "build " + n);
    assert.notEqual(RB.montarPromptBuild(sp(RB, n), {}), esperado, "mundos diferentes de verdade: " + n);
    assert.equal(RB.montarPromptEstrategias(sp(RB, n), ctxA), RA.montarPromptEstrategias(sp(RA, n)), "estratégias " + n);
  }
  const membrosA = ["Garchomp", "Gengar"].map((n) => sp(RA, n)), membrosB = ["Garchomp", "Gengar"].map((n) => sp(RB, n));
  assert.equal(RB.montarPromptBuildsDoTime(membrosB, { ctx: ctxA }), RA.montarPromptBuildsDoTime(membrosA, {}), "lote");
  assert.equal(RB.montarPromptTimeArquetipo(membrosB, "Balance", "Trick Room", null, ctxA), RA.montarPromptTimeArquetipo(membrosA, "Balance", "Trick Room", null));
  assert.match(RB.avisoInnatesEliteIA(ctxA), /INNATES NO ELITE/);
  assert.equal(RB.avisoInnatesEliteIA(Object.assign({}, ctxA, { settings: Object.assign({}, ctxA.settings, { difficulty: "ace" }) })), "", "state elite, ctx ace: sem aviso");
});

test("o ctx.team vem do ctx, não do state (Fraquezas que o resto do time divide)", () => {
  const RA = mundo(3, "ace", null, ["Garchomp", "Gengar", "Kirlia"]);
  const RB = mundo(3, "ace", null, []);
  const g = sp(RB, "Garchomp");
  const comTime = RB.blocoPapelIA(g, false, true, RA.ctxDoState());
  assert.equal(comTime, RA.blocoPapelIA(sp(RA, "Garchomp"), false, true));
  assert.notEqual(comTime, RB.blocoPapelIA(g, false, true));
});

test("a validação usa só o ctx: Sweeper lento passa no Trick Room do ctx e cai fora dele", () => {
  const RB = mundo(3, "ace", null, []);
  const s = RB.SPECIES.find((x) => !RB.isMegaForm(x) && !RB.sinergiasDaEspecie(x).length &&
    RB.availableMovesFor(x).names.filter((m) => RB.moveRoleOf(m) === "dano" && !RB.ehGolpeDePivo(m)).length >= 4);
  const dano = RB.availableMovesFor(s).names.filter((m) => RB.moveRoleOf(m) === "dano" && !RB.ehGolpeDePivo(m)).slice(0, 4);
  const build = { ability: RB.ABILITIES[RB.uniqueIds(s.ab)[0]][0], nature: "Adamant", item: "", moves: dano, evs: [252, 252, 0, 0, 4, 0], papel: "Sweeper", rationale: "x" };
  const base = RB.ctxDoState();
  const comTR = Object.assign({}, base, { archetype: Object.assign({}, base.archetype, { weather: "Trick Room" }) });
  const m1 = {}, m2 = {};
  RB.validateAiBuild(s, build, m1, comTR);
  RB.validateAiBuild(s, build, m2, base);
  assert.doesNotMatch(m1.txt || "", /Sweeper com só/);
  assert.match(m2.txt || "", /Sweeper com só/);
});

test("as regras puras da IA não citam state.* fora de ctxDoState", () => {
  for (const f of ["prompts_ia.js", "validacao_build_ia.js", "escolha_ia_candidatos.js", "pipeline_build.js"]) {
    const src = readFileSync(new URL("../../src/regras/" + f, import.meta.url), "utf8")
      .replace(/function ctxDoState\(\) \{[^}]*\}/, "");
    const achados = src.split("\n").filter((l) => /\bstate\./.test(l) && !/^\s*\/\//.test(l));
    assert.deepEqual(achados, [], f);
  }
});

const J = (x) => JSON.stringify(x);
// objetos de contextos vm diferentes: compara pela forma serializada
const igual = (a, b, m) => assert.equal(J(a), J(b), m), diferente = (a, b, m) => assert.notEqual(J(a), J(b), m);
test("pipeline e helpers seguem o ctx do mundo A mesmo com Etapa e time diferentes no state do mundo B", () => {
  const RA = mundo(0, "ace", null, ["Goodra"]);
  const RB = mundo(7, "ace", null, ["Garchomp"]); // Etapa e time diferentes; mesma dificuldade (bossPartyPorDificuldade ainda lê o state, fora deste ticket)
  RB.state.box = [sp(RB, "Kirlia").x];
  const ctxA = JSON.parse(JSON.stringify(RA.ctxDoState()));
  assert.notEqual(RB.getCurrentCap(), ctxA.cap, "caps diferentes de verdade");
  // helpers
  igual(RB.availableMovesFor(sp(RB, "Garchomp"), ctxA), RA.availableMovesFor(sp(RA, "Garchomp")));
  diferente(RB.availableMovesFor(sp(RB, "Garchomp")), RA.availableMovesFor(sp(RA, "Garchomp")));
  igual(RB.getRemainingBossEntries(ctxA).map((b) => b.name), RA.getRemainingBossEntries().map((b) => b.name));
  diferente(RB.getRemainingBossEntries().map((b) => b.name), RA.getRemainingBossEntries().map((b) => b.name));
  igual(RB.itensEmUsoComQuem(sp(RB, "Kirlia").x, ctxA), RA.itensEmUsoComQuem(sp(RA, "Kirlia").x));
  igual(RB.itensEmUsoComQuem(-1, ctxA), RA.itensEmUsoComQuem(-1), "só o time do ctx conta");
  // pipeline (caso A e B): alvo, kit liberado, Eviolite e time/caixa vêm do ctx
  const kA = RA.candidatosDeBuild(sp(RA, "Kirlia"), {});
  assert.ok(kA.candidatos.length, "mundo A monta candidatos");
  igual(RB.candidatosDeBuild(sp(RB, "Kirlia"), { ctx: ctxA }), kA);
  diferente(RB.candidatosDeBuild(sp(RB, "Kirlia"), {}), kA, "o mundo B sozinho é outro");
  const bA = RA.especiesQueResolvem(undefined, {});
  assert.ok(bA.length, "mundo A tem quem resolva");
  // Caso B: time e caixa vêm do ctx. Mesma Etapa no mundo B porque battleUnitsOf (formas Mega por Etapa) ainda lê o state (fora deste ticket).
  const RC = mundo(0, "ace", null, ["Garchomp"]);
  RC.state.box = [sp(RC, "Kirlia").x];
  igual(RC.especiesQueResolvem(undefined, { ctx: ctxA }), bA);
  diferente(RC.especiesQueResolvem(undefined, {}), bA, "o time do mundo C sozinho é outro");
});
