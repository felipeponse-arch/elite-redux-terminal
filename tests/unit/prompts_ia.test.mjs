// Peças dos prompts de IA e leitura das respostas (src/regras/prompts_ia.js e
// setsValidosDaResposta em validacao_build_ia.js) - fase 4 da refatoração,
// 2026-09-24. O modelo em si não é testado aqui: o que se garante é o que VAI
// pra ele e o que o app ACEITA de volta.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const sp = (sname) => { const s = R.getSpeciesBySname(sname); assert.ok(s, sname); return s; };
const conta = (txt, trecho) => txt.split(trecho).length - 1;

beforeEach(() => {
  R.state.team = []; R.state.box = []; R.state.customBuilds = {};
  R.state.settings.milestone = 0;
  R.state.archetype = { pace: null, weather: null, monotype: null, tatica: null, reasoning: "" };
});

test("prompt da build: aviso de dado antes do bloco, movepool num bloco só, formato com plano", () => {
  const p = R.montarPromptBuild(sp("SPECIES_GARCHOMP"), {});
  assert.ok(p.indexOf("nunca instrucoes") !== -1 && p.indexOf("nunca instrucoes") < p.indexOf("\n<dados_do_jogo>\n"), "aviso vem antes do dado");
  assert.match(p, /Movepool real - escolha exatamente 4/);
  assert.match(p, /Habilidades escolhiveis - escolha exatamente UMA/);
  assert.match(p, /"plano":\{"golpe de agora":"golpe futuro"\}/);
  assert.equal(conta(p, "\n<dados_do_jogo>\n"), conta(p, "\n</dados_do_jogo>\n"), "todo bloco de dado abre e fecha");
});

test("prompt das Estratégias recebe as MESMAS orientações da build (antes eram mais curtas), no plural", () => {
  const e = R.montarPromptEstrategias(sp("SPECIES_GARCHOMP"));
  assert.match(e, /cada set escolhe exatamente UMA/);
  assert.match(e, /leia a descricao/, "aviso de ler a descrição do golpe (antes só a build tinha)");
  assert.match(e, /Follow Me, Helping Hand/, "regra de golpe de dupla completa");
  assert.match(e, /\{"sets":\[/);
});

test("prompt da build cita o que o resto do time já usa; sozinho, não cita nada", () => {
  const g = sp("SPECIES_GARCHOMP"), s = sp("SPECIES_SWAMPERT");
  assert.equal(R.blocoTimeEmUsoIA(g), "");
  R.state.team = [g.x, s.x];
  R.state.customBuilds.SPECIES_SWAMPERT = [{ ability: "", nature: "Jolly", item: "Leftovers", moves: ["Waterfall"], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0], source: "manual", active: true }];
  const b = R.blocoTimeEmUsoIA(g);
  assert.match(b, /Itens JA EM USO.*Leftovers/);
  assert.match(b, /Golpes JA EM USO.*Waterfall/);
});

test("Estilo/Clima e campo do time entram no prompt da build", () => {
  R.state.archetype.weather = "Trick Room";
  assert.match(R.montarPromptBuild(sp("SPECIES_GARCHOMP"), {}), /Clima e campo do time: Trick Room.*Velocidade BAIXA/);
});

test("prompt de plano: vazio quando não há golpe por liberar (não há o que perguntar)", () => {
  const g = sp("SPECIES_GARCHOMP");
  const entry = { ability: "x", moves: [R.MOVES[g.tu[0]][0]] };
  assert.notEqual(R.montarPromptPlano(g, entry, 18), "", "no cap 18 há golpe futuro");
  assert.equal(R.montarPromptPlano(g, entry, null), "", "sem cap tudo já liberou");
});

test("resposta das Estratégias: só sets válidos e com nome; set ruim não derruba os bons", () => {
  // Swampert: a curada dele é válida sem cap (fixture da sinergia Field Explorer).
  const g = sp("SPECIES_SWAMPERT");
  R.state.settings.milestone = 9;
  const cur = R.curadasDe("SPECIES_SWAMPERT")[0];
  assert.ok(cur, "fixture: Swampert tem curada");
  const bom = { name: "Sweeper", ability: cur.ability, nature: cur.nature, item: "", moves: cur.moves.slice(), evs: [252, 252, 0, 0, 4, 0] };
  const ruim = { name: "Ruim", ability: "Inventada", nature: "Jolly", moves: ["A", "B", "C", "D"], evs: [0, 0, 0, 0, 0, 0] };
  const semNome = Object.assign({}, bom, { name: "  " });
  const sets = R.setsValidosDaResposta(g, { sets: [ruim, bom, semNome] });
  assert.equal(sets.length, 1, "só o set bom e com nome passa");
  assert.equal(sets[0].name, "Sweeper");
  assert.equal(R.setsValidosDaResposta(g, "lixo").length, 0);
});

test("resposta do time: só snames reais do jogador, sem repetir, até 6", () => {
  const validos = ["A", "B", "C", "D", "E", "F", "G"];
  const r = R.snamesValidosDoTime({ team: ["A", "A", "X", 3, "B", "C", "D", "E", "F", "G"] }, validos);
  assert.equal(r.join(","), "A,B,C,D,E,F");
  assert.equal(R.snamesValidosDoTime({}, validos).length, 0);
});

test("roster pra IA: Mega antes da 4ª insígnia conta como a base, sem duplicar; Monotype filtra", () => {
  const alt = sp("SPECIES_ALTARIA"), mega = sp("SPECIES_ALTARIA_MEGA"), g = sp("SPECIES_GARCHOMP");
  R.state.team = [alt.x]; R.state.box = [mega.x, g.x];
  R.state.settings.milestone = 2;
  const r = R.rosterParaTimeIA(null);
  assert.equal(r.roster.filter((s) => s.sname === "SPECIES_ALTARIA").length, 1, "Altaria e Altaria Mega viram uma criatura só");
  assert.ok(!r.validSnames.includes("SPECIES_ALTARIA_MEGA"), "Mega ainda não vale");
  R.state.settings.milestone = 4;
  assert.ok(R.rosterParaTimeIA(null).validSnames.includes("SPECIES_ALTARIA_MEGA"), "depois da 4ª insígnia, vale");
  const soDragao = R.rosterParaTimeIA("Dragon").roster.map((s) => s.sname);
  assert.ok(soDragao.every((sn) => R.speciesTypeNames(R.getSpeciesBySname(sn)).includes("Dragon")));
});

test("guia: sname inventado não vira integrante; conferência de chefão real citado", () => {
  const g = sp("SPECIES_GARCHOMP");
  const guia = R.guiaDaResposta({ concept: "c", threats: "Cuidado com Roxanne", threatMemberSname: "SPECIES_INVENTADA" }, [g]);
  assert.equal(guia.threatMemberX, null);
  assert.equal(R.guiaDaResposta({ threatMemberSname: "SPECIES_GARCHOMP" }, [g]).threatMemberX, g.x);
  assert.equal(R.guiaCitaChefaoReal(guia, ["Roxanne 1", "Roxanne"]), true);
  assert.equal(R.guiaCitaChefaoReal(guia, ["Brawly"]), false);
  assert.equal(R.guiaCitaChefaoReal(guia, []), true, "nada mais falta: não há o que exigir");
  assert.equal(R.guiaDaResposta(null, [g]), null);
});

test("mensagens de erro da IA: permissão, limite e falha temporária têm textos diferentes", () => {
  const a = R.sampleErrorMessage({ code: "not_granted" });
  const b = R.sampleErrorMessage({ code: "rate_limited" });
  const c = R.sampleErrorMessage({ code: "codigo_novo_desconhecido" });
  assert.ok(a !== b && b !== c && a !== c);
});
