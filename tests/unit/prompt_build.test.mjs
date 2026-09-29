// Revisão do prompt de build (2026-09-27, pedido do usuário): habilidade com
// descrição, papel conduzindo a build, prioridade sempre que der, item que
// reforça e travas de item. Fixtures achadas no dado real.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const porNome = (n) => { const s = R.SPECIES.find((x) => x.n === n); assert.ok(s, n); return s; };
const status = (m) => { const mv = R.MOVE_BY_NAME[m]; return mv && R.DATA.splits[mv[2]] === "STATUS"; };

beforeEach(() => {
  R.state.settings.milestone = 6;
  R.state.team = []; R.state.box = []; R.state.customBuilds = {};
  R.state.archetype = { pace: null, weather: null, monotype: null, tatica: null, reasoning: "" };
});

// Build válida de base: espécie sem sinergia obrigatória, 4 golpes de dano.
function baseDe(sp, extra) {
  const dano = R.availableMovesFor(sp).names.filter((m) => R.moveRoleOf(m) === "dano" && !R.ehGolpeDePivo(m));
  assert.ok(dano.length >= 4, "fixture: 4 golpes de dano em " + sp.n);
  const ab = R.ABILITIES[R.uniqueIds(sp.ab)[0]][0];
  return Object.assign({ ability: ab, nature: "Adamant", item: "", moves: dano.slice(0, 4), evs: [252, 252, 0, 0, 4, 0], rationale: "teste" }, extra);
}
const semSinergia = () => R.SPECIES.find((s) => !R.isMegaForm(s) && !R.sinergiasDaEspecie(s).length &&
  R.availableMovesFor(s).names.filter((m) => R.moveRoleOf(m) === "dano").length >= 8 && !R.evoluiAinda(s));

test("o prompt leva a descrição de cada habilidade escolhível e innate", () => {
  const sp = porNome("Garchomp");
  const p = R.montarPromptBuild(sp, {});
  for (const id of [...R.uniqueIds(sp.ab), ...R.uniqueIds(sp.inn)]) {
    const [nome] = R.ABILITIES[id];
    assert.match(p, new RegExp("\\n- " + nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ": \\S"), nome + " com descrição");
  }
  assert.match(p, /Innates SEMPRE ativas/);
});

test("o prompt leva papel natural, tabela de papéis, prioridade, pivô e ordem de decisão", () => {
  const gengar = porNome("Gengar");
  const p = R.montarPromptBuild(gengar, {});
  assert.match(p, /Papel natural desta especie .*Wallbreaker/);
  for (const papel of ["Tanque", "Pivô", "Wallbreaker", "Sweeper"]) assert.match(p, new RegExp("\\n- " + papel + ": "));
  assert.match(p, /Golpes de PRIORIDADE que esta forma usa agora: .*Shadow Sneak/);
  assert.match(p, /ORDEM DE DECISAO[\s\S]*1\. PAPEL[\s\S]*6\. TIME/);
  assert.match(p, /"papel":"Tanque\|Pivô\|Wallbreaker\|Sweeper"/);
  const comPivo = R.SPECIES.find((s) => R.availableMovesFor(s).names.includes("U-turn"));
  assert.match(R.montarPromptBuild(comPivo, {}), /Golpes de PIVÔ que esta forma usa agora: .*U-turn/);
  assert.match(R.montarPromptEstrategias(gengar), /"papel":"Tanque\|Pivô\|Wallbreaker\|Sweeper"/);
});

test("forma que ainda evolui recebe a dica do Eviolite; forma final não", () => {
  assert.match(R.montarPromptBuild(porNome("Kirlia"), {}), /AINDA EVOLUI: Eviolite/);
  assert.doesNotMatch(R.montarPromptBuild(porNome("Gardevoir"), {}), /AINDA EVOLUI/);
});

test("golpe de pivô e de prioridade vêm do dado do jogo", () => {
  for (const g of ["U-turn", "Volt Switch", "Flip Turn", "Parting Shot"]) assert.ok(R.ehGolpeDePivo(g), g);
  for (const g of ["Earthquake", "Stealth Rock", "Recover"]) assert.ok(!R.ehGolpeDePivo(g), g);
  assert.ok(R.ehPrioridadeDeDano("Shadow Sneak"));
  assert.ok(!R.ehPrioridadeDeDano("Protect"), "prioridade sem dano não conta");
});

test("papel declarado: contradição clara reprova, coerência passa com o papel na justificativa", () => {
  const sp = semSinergia();
  assert.ok(sp, "fixture: espécie sem sinergia obrigatória");
  const m = {};
  assert.equal(R.validateAiBuild(sp, baseDe(sp, { papel: "Tanque", evs: [252, 0, 0, 0, 4, 252] }), m), null);
  assert.match(m.txt, /Tanque .*Velocidade/);
  assert.equal(R.validateAiBuild(sp, baseDe(sp, { papel: "Sweeper", evs: [252, 252, 0, 0, 4, 0] }), m), null);
  assert.match(m.txt, /Sweeper/);
  assert.equal(R.validateAiBuild(sp, baseDe(sp, { papel: "Wallbreaker", evs: [252, 0, 252, 0, 4, 0] }), m), null);
  const ok = R.validateAiBuild(sp, baseDe(sp, { papel: "Tanque", evs: [252, 0, 252, 0, 4, 0], rationale: "segura golpe fisico" }), {});
  assert.ok(ok, "tanque com bulk e sem Velocidade passa");
  assert.match(ok.rationale, /^Papel: Tanque\. /);
  R.state.archetype.weather = "Trick Room";
  assert.ok(R.validateAiBuild(sp, baseDe(sp, { papel: "Sweeper", evs: [252, 252, 0, 0, 4, 0] }), {}), "sweeper lento vale no Trick Room");
  assert.ok(R.validateAiBuild(sp, baseDe(sp, {}), {}), "sem papel declarado não há o que conferir");
});

test("pivô sem golpe de troca reprova quando a forma tem um", () => {
  const sp = R.SPECIES.find((s) => !R.isMegaForm(s) && !R.sinergiasDaEspecie(s).length && R.availableMovesFor(s).names.includes("U-turn") &&
    R.availableMovesFor(s).names.filter((m) => R.moveRoleOf(m) === "dano" && !R.ehGolpeDePivo(m)).length >= 4);
  assert.ok(sp, "fixture: espécie com U-turn");
  const m = {};
  assert.equal(R.validateAiBuild(sp, baseDe(sp, { papel: "Pivô" }), m), null);
  assert.match(m.txt, /Pivô sem golpe de troca.*U-turn/);
  const b = baseDe(sp, { papel: "Pivô" }); b.moves[3] = "U-turn";
  assert.ok(R.validateAiBuild(sp, b, {}));
});

test("travas de item: Choice/Vest com status e Eviolite em quem não evolui", () => {
  const sp = semSinergia();
  const comStatus = baseDe(sp);
  const st = R.availableMovesFor(sp).names.find((g) => status(g) && !["Trick", "Switcheroo"].includes(g) && R.moveRoleOf(g) !== "dupla" && R.moveRoleOf(g) !== "cura");
  assert.ok(st, "fixture: golpe de status");
  comStatus.moves[3] = st;
  const m = {};
  assert.equal(R.validateAiBuild(sp, { ...comStatus, item: "Choice Band" }, m), null);
  assert.match(m.txt, /Choice Band trava/);
  assert.equal(R.validateAiBuild(sp, { ...comStatus, item: "Assault Vest" }, m), null);
  assert.match(m.txt, /Assault Vest impede golpe de status/);
  assert.equal(R.validateAiBuild(sp, baseDe(sp, { item: "Eviolite" }), m), null);
  assert.match(m.txt, /Eviolite só funciona em quem ainda evolui/);
  assert.ok(R.validateAiBuild(sp, baseDe(sp, { item: "Choice Band" }), {}), "Choice só com golpes de dano passa");
  assert.equal(R.conflitoDeItem("Eviolite", [], porNome("Gible")), null, "Gible ainda evolui");
});
