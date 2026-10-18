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
  // Itens em uso de volta (2026-09-29, decisão do usuário: no máximo 2 iguais).
  assert.match(b, /Itens JA EM USO por outros membros do time: Leftovers \(Swampert\)/);
  assert.doesNotMatch(b, /JA ESGOTADOS/);
  assert.match(R.montarPromptBuild(g, {}), /no MAXIMO 2 membros com o mesmo item/);
  assert.match(b, /Golpes JA EM USO.*Waterfall/);
});

test("no máximo 2 membros com o mesmo item: o 3º é recusado, o 2º passa", () => {
  const g = sp("SPECIES_GARCHOMP"), s = sp("SPECIES_SWAMPERT"), t = sp("SPECIES_TYRANITAR");
  const comItem = (item) => [{ ability: "", nature: "Jolly", item, moves: ["Waterfall"], ivs: [31, 31, 31, 31, 31, 31], evs: [0, 0, 0, 0, 0, 0], source: "manual", active: true }];
  R.state.team = [g.x, s.x, t.x];
  R.state.customBuilds.SPECIES_SWAMPERT = comItem("Life Orb");
  R.state.customBuilds.SPECIES_TYRANITAR = comItem("Life Orb");
  assert.match(R.blocoTimeEmUsoIA(g), /JA ESGOTADOS \(2 no time[^)]*\): Life Orb/);
  // Build válida qualquer do Garchomp, com o item em questão.
  const golpes = R.availableMovesFor(g).names.filter((m) => R.moveRoleOf(m) === "dano");
  // Habilidade que ATIVA a sinergia (desde as categorias do NextDex o Garchomp tem Keen Edge).
  const hit = R.sinergiasDaEspecie(g).find((h) => (h.golpes || []).some((m) => golpes.includes(m)));
  const sinergia = hit ? hit.golpes.filter((m) => golpes.includes(m)) : [];
  const moves = [...new Set([...sinergia.slice(0, 1), ...golpes])].slice(0, 4);
  const ab = hit && hit.kind !== "inn" ? hit.name : R.ABILITIES[R.uniqueIds(g.ab)[0]][0];
  const build = (item) => ({ ability: ab, nature: "Jolly", item, moves, evs: [0, 252, 0, 0, 4, 252], rationale: "t" });
  const m = {};
  assert.equal(R.validateAiBuild(g, build("Life Orb"), m), null);
  assert.match(m.txt, /Life Orb já está com Swampert e Tyranitar - no time vale no máximo 2/);
  R.state.customBuilds.SPECIES_TYRANITAR = comItem("Leftovers");
  const m2 = {};
  assert.ok(R.validateAiBuild(g, build("Life Orb"), m2), m2.txt);
  // Fora do time, os itens do time não barram a build (feita na Dex, pra caixa).
  R.state.customBuilds.SPECIES_TYRANITAR = comItem("Life Orb");
  R.state.team = [s.x, t.x];
  const m3 = {};
  assert.ok(R.validateAiBuild(g, build("Life Orb"), m3), m3.txt);
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
  // Salamence: a curada dele é válida sem cap (fixture da sinergia Field Explorer).
  const g = sp("SPECIES_SALAMENCE");
  R.state.settings.milestone = 9;
  const cur = R.curadasDe("SPECIES_SALAMENCE")[0];
  assert.ok(cur, "fixture: Salamence tem curada");
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
  const alt = sp("SPECIES_ABSOL"), mega = sp("SPECIES_ABSOL_MEGA"), g = sp("SPECIES_GARCHOMP");
  R.state.team = [alt.x]; R.state.box = [mega.x, g.x];
  R.state.settings.milestone = 2;
  const r = R.rosterParaTimeIA(null);
  assert.equal(r.roster.filter((s) => s.sname === "SPECIES_ABSOL").length, 1, "Absol e Absol Mega viram uma criatura só");
  assert.ok(!r.validSnames.includes("SPECIES_ABSOL_MEGA"), "Mega ainda não vale");
  R.state.settings.milestone = 4;
  assert.ok(R.rosterParaTimeIA(null).validSnames.includes("SPECIES_ABSOL_MEGA"), "depois da 4ª insígnia, vale");
  const soDragao = R.rosterParaTimeIA("Dragon").roster.map((s) => s.sname);
  assert.ok(soDragao.every((sn) => R.speciesTypeNames(R.getSpeciesBySname(sn)).includes("Dragon")));
});

test("guia: sname inventado não vira integrante; Meu Time sem exigência de chefão no guia", () => {
  const g = sp("SPECIES_GARCHOMP");
  const guia = R.guiaDaResposta({ concept: "c", threats: "Cuidado com Roxanne", threatMemberSname: "SPECIES_INVENTADA" }, [g]);
  assert.equal(guia.threatMemberX, null);
  assert.equal(R.guiaDaResposta({ threatMemberSname: "SPECIES_GARCHOMP" }, [g]).threatMemberX, g.x);
  assert.equal(typeof R.guiaCitaChefaoReal, "undefined", "a exigência de citar chefão saiu (17/10/2026)");
  assert.equal(R.guiaDaResposta(null, [g]), null);
});

test("mensagens de erro da IA: permissão, limite e falha temporária têm textos diferentes", () => {
  const a = R.sampleErrorMessage({ code: "not_granted" });
  const b = R.sampleErrorMessage({ code: "rate_limited" });
  const c = R.sampleErrorMessage({ code: "codigo_novo_desconhecido" });
  assert.ok(a !== b && b !== c && a !== c);
});
