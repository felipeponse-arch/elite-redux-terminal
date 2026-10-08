// Ferramentas que a IA consulta (src/regras/ferramentas_ia.js), testadas no Node sem navegador
// (ticket 06 da dívida técnica, 2026-10-08). Duas frentes:
//  1. cada ferramenta devolve o que o app já calcula em outro lugar (nada inventado);
//  2. os nomes e formatos que o prompt e as descrições citam batem com as ferramentas reais.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const plain = (x) => JSON.parse(JSON.stringify(x)); // objetos criados no vm não passam em deepEqual
const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const base = () => R.SPECIES.filter((s) => !s.mega);
function cenario({ milestone = 0, time = [], caixa = [] } = {}) {
  R.state.settings.milestone = milestone;
  R.state.team = time.map((s) => s.x);
  R.state.box = caixa.map((s) => s.x);
}
const ferramentas = () => Object.fromEntries(R.buildStandardAiTools().map((t) => [t.name, t]));

test("fábrica: 10 ferramentas, cada uma com nome, descrição e execute; esquema pede só o que a função lê", () => {
  const lista = R.buildStandardAiTools();
  assert.equal(lista.length, 10);
  assert.equal(new Set(lista.map((t) => t.name)).size, 10, "nomes repetidos");
  for (const t of lista) {
    assert.ok(t.description && t.description.length > 40, t.name + ": descrição");
    assert.equal(typeof t.execute, "function", t.name);
    if (t.inputSchema) {
      assert.equal(t.inputSchema.type, "object");
      for (const campo of t.inputSchema.required) assert.ok(t.inputSchema.properties[campo], t.name + ": " + campo + " sem propriedade");
    }
  }
  // as que recebem a espécie pedem o sname; getItemInfo pede o nome do item
  const t = ferramentas();
  for (const n of ["getSpeciesRank", "getPriorityMoveOptions", "getAbilityMovepoolSynergy", "getConditionMoveSynergy", "getSpeedBenchmark"]) {
    assert.deepEqual(plain(t[n].inputSchema.required), ["sname"], n);
  }
  assert.deepEqual(plain(t.getItemInfo.inputSchema.required), ["name"]);
  for (const n of ["getTeamWeaknesses", "getRemainingBosses", "getNextBossRoster", "getBoxCandidatesForBoss"]) assert.equal(t[n].inputSchema, undefined, n);
});

test("toda ferramenta responde sem exceção e em JSON puro, com e sem entrada (o que vai ao modelo)", () => {
  const sp = base()[10];
  cenario({ milestone: 2, time: [sp, base()[40]], caixa: base().slice(60, 70) });
  for (const t of R.buildStandardAiTools()) {
    for (const entrada of [undefined, {}, { sname: sp.sname, name: "Leftovers" }, { sname: "SPECIES_NAO_EXISTE", name: "Item Que Nao Existe" }]) {
      const saida = t.execute(entrada);
      assert.deepEqual(plain(saida), JSON.parse(JSON.stringify(saida)), t.name);
    }
  }
});

test("getTeamWeaknesses: tamanho, nomes e fraquezas compartilhadas vêm de computeSharedRisks", () => {
  const time = base().slice(10, 13);
  cenario({ time });
  const r = R.aiTool_getTeamWeaknesses();
  assert.equal(r.teamSize, 3);
  assert.deepEqual(plain(r.teamSpecies), time.map((s) => s.n));
  assert.deepEqual(plain(r.sharedWeaknesses), plain(R.computeSharedRisks(time).map((x) => ({ type: x.t, weakCount: x.n }))));
  r.sharedWeaknesses.forEach((w) => assert.ok(w.weakCount >= 2, "só tipo que derruba 2 ou mais"));
  cenario({ time: [] });
  assert.deepEqual(plain(R.aiTool_getTeamWeaknesses()), { teamSize: 0, teamSpecies: [], sharedWeaknesses: [] });
});

test("getSpeciesRank: tier e nota são os de rankDe; papel e divisão vêm de SPECIES_ROLE, em português", () => {
  const sp = base().find((s) => R.SPECIES_ROLE[s.sname] && R.rankDe(s.sname));
  const r = R.aiTool_getSpeciesRank({ sname: sp.sname });
  assert.equal(r.tier, R.rankDe(sp.sname).tier);
  assert.equal(r.score, R.rankDe(sp.sname).score);
  const role = R.SPECIES_ROLE[sp.sname];
  assert.deepEqual(plain(r.roles), role.roles.map((x) => R.ROLE_LABEL_PT[x] || x));
  assert.equal(r.split, R.SPLIT_LABEL_PT[role.split] || role.split);
  // em toda espécie o papel sai em português (Pivo -> Pivô, Fisico -> Físico), nunca a chave interna
  const pivo = Object.keys(R.SPECIES_ROLE).find((s) => R.SPECIES_ROLE[s].roles.includes("Pivo"));
  assert.ok(R.aiTool_getSpeciesRank({ sname: pivo }).roles.includes("Pivô"));
  const fisico = Object.keys(R.SPECIES_ROLE).find((s) => R.SPECIES_ROLE[s].split === "Fisico");
  assert.equal(R.aiTool_getSpeciesRank({ sname: fisico }).split, "Físico");
  const vazio = { tier: null, score: null, roles: [], split: null };
  assert.deepEqual(plain(R.aiTool_getSpeciesRank({ sname: "SPECIES_NAO_EXISTE" })), vazio);
  assert.deepEqual(plain(R.aiTool_getSpeciesRank()), vazio);
});

test("getRemainingBosses: só quem falta no marco atual; tipos mais comuns em ordem, no máximo 6", () => {
  cenario({ milestone: 0 });
  const r = R.aiTool_getRemainingBosses();
  assert.deepEqual(plain(r.remainingBossNames), plain(R.getRemainingBossEntries().map((b) => b.name)));
  assert.ok(r.remainingBossNames.length > 5);
  assert.ok(r.mostCommonTypesAhead.length <= 6 && r.mostCommonTypesAhead.length > 0);
  const contagem = {};
  R.getRemainingBossEntries().forEach((b) => b.party.forEach((m) => {
    const sp = R.getSpeciesByX(m.x);
    if (sp) R.speciesTypeNames(sp).forEach((t) => { contagem[t] = (contagem[t] || 0) + 1; });
  }));
  const quantidades = r.mostCommonTypesAhead.map((t) => contagem[t]);
  assert.deepEqual(quantidades, quantidades.slice().sort((a, b) => b - a), "ordem decrescente");
  cenario({ milestone: 3 });
  const depois = R.aiTool_getRemainingBosses().remainingBossNames;
  assert.ok(depois.length < r.remainingBossNames.length, "avançar na run tira lutas da lista");
  assert.ok(!depois.includes(r.remainingBossNames[0]));
});

test("getPriorityMoveOptions: só golpe de prioridade > 0 que a espécie aprende até o level cap", () => {
  const sp = base().find((s) => R.availableMovesFor(s).ids.some((id) => R.MOVES[id] && R.MOVES[id][7] > 0));
  assert.ok(sp, "algum Pokémon aprende golpe de prioridade");
  cenario({ milestone: 4 });
  const r = R.aiTool_getPriorityMoveOptions({ sname: sp.sname });
  assert.ok(r.priorityMoves.length > 0);
  const liberados = R.availableMovesFor(sp).names;
  r.priorityMoves.forEach((m) => {
    assert.ok(m.priority > 0, m.name);
    assert.ok(liberados.includes(m.name), m.name + " fora do movepool liberado");
    assert.equal(m.power, R.MOVE_BY_NAME[m.name][3] || 0);
  });
  // o level cap trava: no começo da run a lista nunca é maior que a de depois
  cenario({ milestone: 0 });
  assert.ok(R.aiTool_getPriorityMoveOptions({ sname: sp.sname }).priorityMoves.length <= r.priorityMoves.length);
  assert.deepEqual(plain(R.aiTool_getPriorityMoveOptions({ sname: "SPECIES_NAO_EXISTE" })), { priorityMoves: [] });
  assert.deepEqual(plain(R.aiTool_getPriorityMoveOptions()), { priorityMoves: [] });
});

test("getAbilityMovepoolSynergy: repassa sinergiasDaEspecie, rotulando innate e escolhível", () => {
  const sp = base().find((s) => (R.sinergiasDaEspecie(s) || []).some((h) => h.kind === "inn") && R.sinergiasDaEspecie(s).some((h) => h.kind !== "inn"))
    || base().find((s) => (R.sinergiasDaEspecie(s) || []).length);
  const hits = R.sinergiasDaEspecie(sp);
  const r = R.aiTool_getAbilityMovepoolSynergy({ sname: sp.sname });
  assert.equal(r.synergies.length, hits.length);
  r.synergies.forEach((s, i) => {
    assert.equal(s.ability, hits[i].name);
    assert.equal(s.kind, hits[i].kind === "inn" ? "innate (sempre ativa)" : "escolhivel");
    assert.equal(s.categoria, hits[i].categoria);
    assert.deepEqual(plain(s.golpesReaisQueSeBeneficiam), plain(hits[i].golpes));
    assert.ok(s.golpesReaisQueSeBeneficiam.length > 0);
  });
  assert.deepEqual(plain(R.aiTool_getAbilityMovepoolSynergy({ sname: "SPECIES_NAO_EXISTE" })), { synergies: [] });
});

test("getConditionMoveSynergy: combos de clima e de HP baixo com o texto da condição", () => {
  const snames = Object.keys(R.CONDITION_MOVE_SYNERGY);
  const clima = snames.find((s) => R.CONDITION_MOVE_SYNERGY[s].some((h) => h.tipo === "clima"));
  const hp = snames.find((s) => R.CONDITION_MOVE_SYNERGY[s].some((h) => h.tipo === "hp_baixo"));
  for (const [sname, tipo] of [[clima, "clima"], [hp, "hp_baixo"]]) {
    const hits = R.CONDITION_MOVE_SYNERGY[sname];
    const r = R.aiTool_getConditionMoveSynergy({ sname });
    assert.equal(r.combos.length, hits.length);
    r.combos.forEach((c, i) => {
      assert.equal(c.ability, hits[i].habilidade);
      assert.equal(c.kind, hits[i].kind === "inn" ? "innate (sempre ativa)" : "escolhivel");
      assert.deepEqual(plain(c.golpesReaisQueAtivamSozinho), plain(hits[i].golpes));
      assert.equal(c.condicao, hits[i].tipo === "clima" ? "clima: " + hits[i].clima : "HP baixo (via recuo do proprio golpe)");
    });
    assert.ok(r.combos.some((c) => (tipo === "clima") === c.condicao.startsWith("clima: ")));
  }
  assert.deepEqual(plain(R.aiTool_getConditionMoveSynergy({ sname: "SPECIES_NAO_EXISTE" })), { combos: [] });
  assert.deepEqual(plain(R.aiTool_getConditionMoveSynergy()), { combos: [] });
});

test("getNextBossRoster: o elenco real da próxima luta, igual ao que a ficha do chefão mostra", () => {
  cenario({ milestone: 0, time: base().slice(10, 12) });
  const boss = R.getRemainingBossEntries()[0];
  const r = R.aiTool_getNextBossRoster();
  assert.equal(r.nextBossName, boss.name);
  assert.equal(r.categoria, boss.cat);
  assert.equal(r.batalhaEmDupla, !!boss.db);
  const foes = R.confrontoFoesDe(R.bossPartyPorDificuldade(boss));
  assert.equal(r.timeDoChefao.length, foes.length);
  r.timeDoChefao.forEach((f, i) => {
    assert.equal(f.nome, foes[i].name);
    assert.deepEqual(plain(f.tipos), plain(R.speciesTypeNames(foes[i].sp)));
    assert.equal(f.habilidade, foes[i].ability || "(forma transformada - escolhivel desconhecida)");
    assert.equal(f.item, foes[i].item || "nenhum");
    assert.deepEqual(plain(f.golpes), plain(foes[i].moves));
  });
  const cx = R.confrontoParaParty(R.bossPartyPorDificuldade(boss), false);
  assert.deepEqual(plain(r.buracosDoTime), plain(cx.c.buracos.map((f) => f.name)));
  assert.deepEqual(plain(r.ameacasAoTime), plain(cx.c.ameacas.map((f) => f.name)));
  assert.ok(Array.isArray(r.golpesQueFechariamBuracos));
  // time vazio: não há o que comparar
  cenario({ milestone: 0, time: [] });
  const vazio = R.aiTool_getNextBossRoster();
  assert.equal(vazio.buracosDoTime, "time vazio - nada a comparar");
  assert.deepEqual(plain(vazio.ameacasAoTime), []);
  assert.deepEqual(plain(vazio.golpesQueFechariamBuracos), []);
  // nada mais falta
  cenario({ milestone: 9 });
  assert.deepEqual(plain(R.aiTool_getNextBossRoster()), { nextBossName: null });
});

test("getBoxCandidatesForBoss: sugestão da caixa só para a próxima luta, com o motivo em texto", () => {
  cenario({ milestone: 0, time: [base()[0]], caixa: [] });
  const semCaixa = R.aiTool_getBoxCandidatesForBoss();
  assert.equal(semCaixa.nextBossName, R.getRemainingBossEntries()[0].name);
  assert.equal(semCaixa.suggestion, null);
  let achou = null;
  for (let i = 0; i < 60 && !achou; i++) {
    cenario({ milestone: 0, time: [base()[i]], caixa: base().slice(100, 400) });
    const r = R.aiTool_getBoxCandidatesForBoss();
    if (r.suggestion) achou = { r, dono: R.bestBoxCandidateForBoss(R.getRemainingBossEntries()[0]) };
  }
  assert.ok(achou, "algum time fraco ganha sugestão da caixa");
  const { r, dono } = achou;
  assert.equal(r.suggestion.sname, dono.sp.sname);
  assert.equal(r.suggestion.name, dono.sp.n);
  assert.equal(r.suggestion.megaDe, dono.owned.x !== dono.sp.x ? dono.owned.n : null);
  assert.match(r.suggestion.motivo, new RegExp("^(imune a|resiste bem a) " + dono.reasonType + "$"));
  assert.equal(r.suggestion.motivo.startsWith("imune a "), dono.reasonMult === 0);
  cenario({ milestone: 9 });
  assert.deepEqual(plain(R.aiTool_getBoxCandidatesForBoss()), { nextBossName: null, suggestion: null });
});

test("getItemInfo: descrição do jogo (em dado externo), nome com nota, e aviso quando não há", () => {
  const nome = Object.keys(R.ITEM_DESC)[0];
  const r = R.aiTool_getItemInfo({ name: nome });
  assert.equal(r.name, nome);
  assert.equal(r.description, R.dadoExterno(R.ITEM_PT[nome] || R.ITEM_DESC[nome]));
  assert.match(r.fonte, /nunca instrucao/);
  // a nota entre parênteses do builds.json não atrapalha
  assert.equal(R.aiTool_getItemInfo({ name: nome + " (nota qualquer)" }).name, nome);
  const sem = R.aiTool_getItemInfo({ name: "Item Que Nao Existe" });
  assert.equal(sem.description, null);
  assert.match(sem.aviso, /nao invente|não invente/);
  assert.deepEqual(plain(R.aiTool_getItemInfo()), { name: null, description: null, aviso: sem.aviso });
});

test("getSpeedBenchmark: Velocidade sem EV <= investida <= com Scarf, e a posição bate com a tabela de Speed Tiers", () => {
  cenario({ milestone: 4 });
  const sp = base()[25];
  const r = R.aiTool_getSpeedBenchmark({ sname: sp.sname });
  const st = R.computeSpeedTiers("");
  const i = st.rows.findIndex((x) => x.sp.sname === sp.sname);
  assert.equal(r.nivel, st.level);
  assert.equal(r.velocidadeBase, st.rows[i].base);
  assert.ok(r.velocidadeSemInvestimento <= r.velocidadeComInvestimento && r.velocidadeComInvestimento < r.velocidadeComChoiceScarf);
  assert.equal(r.posicaoNoRankingInvestido, i + 1);
  assert.equal(r.totalDeEspecies, st.rows.length);
  assert.equal(r.especiesQueUltrapassaInvestindo, st.rows.length - i - 1);
  assert.deepEqual(plain(R.aiTool_getSpeedBenchmark({ sname: "SPECIES_NAO_EXISTE" })), { erro: "sname nao encontrado" });
});

// ---------- nomes e formatos citados no prompt e nas descrições x ferramentas reais ----------

test("todo nome de ferramenta citado nos prompts existe em buildStandardAiTools", () => {
  const nomes = new Set(R.buildStandardAiTools().map((t) => t.name));
  const arquivos = ["src/regras/prompts_ia.js", ...readdirSync(join(RAIZ, "src/ui")).filter((f) => f.endsWith(".js")).map((f) => "src/ui/" + f)];
  const citados = new Set();
  for (const a of arquivos) {
    const texto = readFileSync(join(RAIZ, a), "utf8");
    // só texto entre aspas (o que o modelo lê), nunca comentário de código
    for (const lit of texto.match(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g) || []) {
      for (const m of lit.matchAll(/\bget(?:TeamWeaknesses|SpeciesRank|RemainingBosses|PriorityMoveOptions|AbilityMovepoolSynergy|ConditionMoveSynergy|NextBossRoster|BoxCandidatesForBoss|ItemInfo|SpeedBenchmark|[A-Z][A-Za-z]*(?:Boss|Synergy|Rank|Weaknesses|Roster|Benchmark|Options|Info|Candidates)[A-Za-z]*)\b/g)) citados.add(m[0]);
    }
  }
  assert.ok(citados.size >= 4, "o prompt do guia cita ferramentas pelo nome");
  for (const c of citados) assert.ok(nomes.has(c), "o prompt cita " + c + ", que não existe entre as ferramentas");
});

test("os campos de saída que as descrições citam existem na resposta real", () => {
  cenario({ milestone: 0, time: base().slice(10, 12) });
  const t = ferramentas();
  const roster = R.aiTool_getNextBossRoster();
  assert.ok("buracosDoTime" in roster && t.getNextBossRoster.description.includes("buracosDoTime"));
  assert.ok(t.getItemInfo.description.includes("description=null"));
  assert.ok("description" in R.aiTool_getItemInfo({ name: "x" }));
  // a lista de nomes que o guia manda a IA copiar (getRemainingBosses) é a que a ferramenta devolve
  assert.ok(Array.isArray(R.aiTool_getRemainingBosses().remainingBossNames));
  // exemplos de item da descrição têm descrição de verdade (a IA é mandada consultá-los)
  for (const exemplo of ["Swirly Glasses", "Tactical Vest", "Iron Pill"]) {
    assert.ok(R.aiTool_getItemInfo({ name: exemplo }).description, exemplo);
  }
  // o sname de exemplo existe e responde
  assert.ok(R.getSpeciesBySname("SPECIES_CHARIZARD"));
  assert.ok(t.getSpeciesRank.description.includes("SPECIES_CHARIZARD"));
  assert.ok(R.aiTool_getSpeciesRank({ sname: "SPECIES_CHARIZARD" }).tier);
});

test("getSpeciesRank: tiers e papéis que a descrição promete são os que a ferramenta devolve", () => {
  const prometido = R.buildStandardAiTools().find((t) => t.name === "getSpeciesRank").description;
  const tiers = new Set(prometido.match(/\(([SABCD/]+)\)/)[1].split("/"));
  const papeis = new Set(prometido.match(/\((Pivo\/[^)]+)\)/)[1].split("/").map(semAcento));
  const vistos = new Set();
  const papeisVistos = new Set();
  for (const s of R.SPECIES) {
    const r = R.aiTool_getSpeciesRank({ sname: s.sname });
    if (r.tier) vistos.add(r.tier);
    r.roles.forEach((x) => papeisVistos.add(semAcento(x)));
  }
  for (const v of vistos) assert.ok(tiers.has(v), "tier " + v + " fora do prometido");
  for (const v of papeisVistos) assert.ok(papeis.has(v), "papel " + v + " fora do prometido");
  assert.ok(vistos.size >= 5 && papeisVistos.size >= 3);
});

test("getSpeedBenchmark: o total de espécies da descrição é o que a resposta usa", () => {
  cenario({ milestone: 4 });
  const desc = R.buildStandardAiTools().find((t) => t.name === "getSpeedBenchmark").description;
  const total = R.aiTool_getSpeedBenchmark({ sname: base()[3].sname }).totalDeEspecies;
  assert.ok(desc.includes("entre as " + total + " especies"), "descrição diz outro total que a resposta");
});
