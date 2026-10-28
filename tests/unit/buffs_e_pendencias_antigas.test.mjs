// Lote de 2026-10-01: buffs do ginásio no simulador (números do código do jogo,
// src/battle_events.c) e as pendências antigas de 16/09 - trava de habilidades no
// Elite (Full Features oficial) e iniciais por BP (página oficial dos iniciais).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "more" });
const porNome = (n) => { const s = R.SPECIES.find((x) => x && x.n === n); assert.ok(s, n); return s; };
const flannery = R.BOSSES.find((b) => b.name === "Flannery 1");
const party = R.bossPartyPorDificuldade(flannery);
const FADAS = ["Tinkaton", "Mawile", "Grimmsnarl", "Klefki", "Rapidash Galarian", "Tsareena Redux", "Alcremie", "Whimsicott",
  "Lilligant", "Ninetales Alolan", "Lycanroc Twilight", "Carbink", "Luvdisc", "Togekiss", "Florges White", "Gardevoir",
  "Granbull", "Wigglytuff", "Dachsbun", "Weezing Galarian", "Azumarill", "Clefable"];
const candidatos = () => FADAS.map((n) => ({ sp: porNome(n), owned: porNome(n).x }));
const foes = () => party.map((m) => R.foeDeDuelo(m, 50, null)).filter(Boolean);

// ---------------- buffs do ginásio ----------------
test("buff 'reforçado' (Posture): x1,8 só no que abre a luta; 'aos poucos' (Steady): +1 por turno em todos", () => {
  const base = foes();
  const com = R.foesComBuffsDoGinasio(base, ["flannery_defense", "flannery_spatk_steady"], 1);
  assert.equal(com[0].stats[2], Math.floor(base[0].stats[2] * 1.8));
  assert.equal(com[1].stats[2], base[1].stats[2], "o 2º não recebe o Posture");
  com.forEach((f) => assert.equal(f.ef.porTurno.spa, (R.foeDeDuelo(party[com.indexOf(f)], 50, null).ef.porTurno.spa || 0) + 1));
  assert.equal(base[0].ef.porTurno.spa || 0, R.foeDeDuelo(party[0], 50, null).ef.porTurno.spa || 0, "não mexe no objeto original");
  const dupla = R.foesComBuffsDoGinasio(base, ["flannery_defense"], 2);
  assert.equal(dupla[1].stats[2], Math.floor(base[1].stats[2] * 1.8), "em dupla, os dois da frente");
});

test("Reflect do ginásio corta só golpe físico; Light Screen só especial", () => {
  const base = foes();
  const reflect = R.foesComBuffsDoGinasio(base, ["tateliza_reflect"], 1)[0];
  const tela = R.foesComBuffsDoGinasio(base, ["tateliza_lightscreen"], 1)[0];
  assert.equal(reflect.ef.telaReflect, 5); assert.ok(!reflect.ef.telaLuz);
  assert.equal(tela.ef.telaLuz, 5); assert.ok(!tela.ef.telaReflect);
});

test("status 'nos últimos N': do fim pro começo, sem o 1º, só em quem está sem status", () => {
  const inicio = R.inicioDaLutaComBuffs(["flannery_burn", "roxanne_hazard_bleed"]);
  assert.equal(inicio.lado.rocha, true);
  const time = [0, 1, 2, 3].map(() => ({ status: {}, u: {} }));
  R.aplicarStatusNoFimDuelo(time, inicio.statusNoFim);
  assert.deepEqual(time.map((c) => Object.keys(c.status).join("")), ["", "sangrar", "queimar", "queimar"]);
  const curto = [{ status: {}, u: {} }];
  R.aplicarStatusNoFimDuelo(curto, [["sono", 1]]);
  assert.deepEqual(curto[0].status, {}, "o 1º do time nunca recebe");
});

test("Last Stand só existe com 6 dele; Sem Protect tira o Protect dos meus", () => {
  assert.equal(R.inicioDaLutaComBuffs(["roxanne_laststand"]).ultimo.x, 2);
  assert.equal(R.inicioDaLutaComBuffs(["roxanne_defense"]).ultimo, null);
  const protect = R.MOVE_ID_BY_NAME["Protect"];
  const u = { statusIds: [protect], ef: {} };
  assert.equal(R.meuComBuffsDoGinasio(u, ["tateliza_noprotect"]).statusIds.length, 0);
  assert.equal(R.meuComBuffsDoGinasio(u, ["tateliza_sleep"]), u);
  // Só o Protect: o jogo zera o PP de MOVE_PROTECT (battle_events.c), Detect/King's Shield/Spiky Shield seguem valendo.
  const outros = ["Detect", "King's Shield", "Spiky Shield", "Baneful Bunker"].map((n) => R.MOVE_ID_BY_NAME[n]).filter((x) => x !== undefined);
  assert.ok(outros.length >= 3, "fixture: golpes de proteção no dado");
  const u2 = { statusIds: [protect].concat(outros), ef: {} };
  const depois = R.meuComBuffsDoGinasio(u2, ["tateliza_noprotect"]);
  assert.equal(JSON.stringify(depois.statusIds), JSON.stringify(outros), "só o Protect sai");
});

test("com todos os buffs da Flannery ativos, a mesma luta rende menos que sem nenhum", () => {
  const todos = R.GYM_SKILLS.leaders.Flannery.buffs.map((b) => b.id);
  const sem = R.montarTimeContraChefao(candidatos(), party, 50);
  // Os 3 primeiros do time escolhido: com o time inteiro (ou os 3 piores) os pontos empatam no teto, e o time muda com a sinergia da habilidade (21/10/2026: Aerodynamics, Flash Fire).
  const time = sem.escolhidos.slice(0, 3).map((e) => e.unidade);
  const fs = foes();
  const semBuff = R.simularLutaContraChefao(time, fs, 50);
  const comBuff = R.simularLutaContraChefao(time.map((u) => R.meuComBuffsDoGinasio(u, todos)),
    R.foesComBuffsDoGinasio(fs, todos, 1), 50, R.inicioDaLutaComBuffs(todos));
  assert.ok(comBuff.pontos < semBuff.pontos, comBuff.pontos + " x " + semBuff.pontos);
  // O botão (montarTimeContraChefao com opcoes.buffs) luta contra o chefão buffado: o
  // que abre a luta vem com a Defesa x1,8. (Comparar os pontos dos dois botões não serve:
  // o otimizador pode achar outro time que rende mais, e este time de Fadas atropela a
  // Flannery 1 - a queimadura nos 2 últimos nem chega a pesar.)
  const r = R.montarTimeContraChefao(candidatos(), party, 50, { buffs: todos });
  assert.equal(r.escolhidos.length, 6, "o botão continua montando o time com os buffs");
  assert.equal(r.foes[0].stats[2], Math.floor(sem.foes[0].stats[2] * 1.8));
});

test("buffsAtivosDoChefao: só os que o jogador não marcou, pelo nome base do líder", () => {
  R.state.gymSkillsCleared = { Flannery: ["flannery_burn"] };
  const ativos = R.buffsAtivosDoChefao("Flannery 1");
  assert.ok(ativos.length > 0 && ativos.indexOf("flannery_burn") === -1 && ativos.indexOf("flannery_toxic") !== -1);
  assert.equal(R.buffsAtivosDoChefao("Juan 1").length, 0, "Juan é só trava de entrada");
  const linhas = R.linhasProximaLutaIA(null, { boss: flannery, party }).join("\n");
  assert.match(linhas, /Buffs do ginasio AINDA ATIVOS/);
  assert.doesNotMatch(linhas, /Queimadura nos últimos 2/);
  R.state.gymSkillsCleared = {};
});

// ---------------- Elite: innates liberadas pelo nível (código oficial) ----------------
// pokemon_config.h: INNATE_1_LEVEL_ELITE 1, INNATE_2 17, INNATE_3 24; só o jogador. Corrige a v158,
// que travava tudo até a 2ª insígnia (o vídeo Mono Fairy mostra habilidades antes do 1º ginásio).
test("Elite: escolhida e 1ª innate sempre; 2ª innate no nível 17, 3ª no 24; Ace sem trava", () => {
  const E = carregarRegras({ milestone: 0, difficulty: "elite", levelCapMode: "elite" });
  const sp = E.getSpeciesBySname("SPECIES_GARCHOMP");
  assert.equal(sp.inn.length, 3, "fixture: Garchomp tem 3 innates");
  const ab = sp.ab[0];
  const set = { nome: "x", evs: [0, 252, 0, 0, 4, 252], nature: "Jolly" };
  const golpes = E.golpesDeDueloAte(sp, 50);
  const ids = (nivel) => E.unidadeDeDuelo(sp, set, ab, nivel, golpes, null).ids.join(",");
  assert.equal(ids(10), [sp.inn[0], ab].join(","), "nível 10: 1ª innate + escolhida");
  assert.equal(ids(17), [sp.inn[0], sp.inn[1], ab].join(","), "nível 17: libera a 2ª");
  assert.equal(ids(24), [sp.inn[0], sp.inn[1], sp.inn[2], ab].join(","), "nível 24: todas");
  assert.match(E.linhasContextoComumIA(null, null).join("\n"), /INNATES NO ELITE/);
  assert.equal(R.unidadeDeDuelo(sp, set, ab, 10, golpes, null).ids.length, 4, "Ace: tudo desde o início");
  assert.doesNotMatch(R.linhasContextoComumIA(null, null).join("\n"), /INNATES NO ELITE/);
});

// ---------------- iniciais por BP ----------------
test("iniciais por BP: a base diz a loja, a evolução manda comprar a base; Mega e não-inicial ficam de fora", () => {
  const t = (s) => R.compraDeInicialTexto(R.getSpeciesBySname(s));
  assert.match(t("SPECIES_TREECKO"), /^Loja de iniciais: depois de vencer a Flannery, por 15 BP na floricultura da Rota 104/);
  assert.match(t("SPECIES_SWAMPERT"), /compre o Mudkip .*mercado de Slateport/);
  assert.match(t("SPECIES_SKELEDIRGE"), /compre o Fuecoco .*Lavaridge/);
  assert.equal(t("SPECIES_SCEPTILE_MEGA"), "");
  assert.equal(t("SPECIES_GARCHOMP"), "");
});

// ---------------- habilidades que o código oficial do jogo destravou ----------------
const efDe = (nomes, clima) => R.efeitoDasHabilidadesNoDuelo(nomes.map((n) => R.ABILITY_ID_BY_NAME[n]), "LT_" + nomes.join("+") + "_" + clima, clima || null);
test("Madness Enhancement: enfurece na névoa e leva x0,8 do dano (versão nova, abilities.cc:9939-9947; era x0,5 na 2.65beta); fora dela, nada", () => {
  const naNevoa = efDe(["Madness Enhancement"], "nevoa");
  assert.equal(naNevoa.reducao.todos, 0.8);
  assert.equal(naNevoa.enfurecido, true);
  assert.equal(efDe(["Madness Enhancement"], null).reducao.todos, 1);
});
test("Mental Pollution: enfurecido (névoa ou Berserk DNA), suprime as habilidades do outro", () => {
  assert.equal(efDe(["Mental Pollution", "Madness Enhancement"], "nevoa").gasNeutro, true);
  assert.equal(efDe(["Mental Pollution", "Madness Enhancement"], null).gasNeutro, false);
  assert.equal(efDe(["Mental Pollution", "Berserk DNA"], null).gasNeutro, true);
  assert.equal(efDe(["Mental Pollution"], "nevoa").gasNeutro, false, "sem o que enfurece, nada");
});
test("Power of Alchemy: a baga do outro vira Black Sludge na entrada", () => {
  assert.equal(efDe(["Power of Alchemy"], null).alquimia, true);
  const sp = R.getSpeciesBySname("SPECIES_GARCHOMP");
  const u = { sp, item: "Sitrus Berry", it: R.itemDoDuelo("Sitrus Berry", sp) };
  const depois = R.bagaViraLodoDuelo(u);
  assert.equal(depois.item, "Black Sludge");
  assert.equal(depois.it.perdaTurno, 1 / 8, "Black Sludge fere quem não é Poison");
  const comLeftovers = { sp, item: "Leftovers", it: R.itemDoDuelo("Leftovers", sp) };
  assert.equal(R.bagaViraLodoDuelo(comLeftovers), comLeftovers);
});
