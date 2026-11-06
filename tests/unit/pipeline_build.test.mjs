// Pipeline de build com intenção (ticket 20 da dívida, 14/10/2026): src/regras/pipeline_build.js, só pela interface
// pública (candidatosDeBuild, especiesQueResolvem, fecharBuild), com as regras carregadas como no app.
// Caso A: a sinergia do kit (Centiskorch: Coil Up + Flaming Jaws => Fire Fang, não Fire Lash).
// Caso B: matar o alvo no turno 1 (Ledian contra o Ninetales da Meteor Falls; a prioridade não vale contra Queenly Majesty).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";
import { ninetales2653b } from "./fixture_ninetales_2653b.mjs";

// Etapa da luta da Meteor Falls: milestone 3, cap 55 no modo fácil (o mesmo da calibração com a calculadora do jogo).
const R = ninetales2653b(carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" }));
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const courtney = R.BOSSES.find((b) => b.name === "Courtney Meteor Falls");
const ninetales = { chefao: courtney, indice: 0 };
const alakazam = { chefao: courtney, indice: 1 };
// Os objetos vêm de outro contexto (vm): compara pela forma, não pelo protótipo.
const plain = (v) => JSON.parse(JSON.stringify(v));
const deepEqual = (a, b, msg) => assert.deepEqual(plain(a), plain(b), msg);
const tier = (c) => (c.hitKill === 1 && c.baterPrimeiro ? 3 : c.hitKill === 2 && c.baterPrimeiro ? 2 : 1);

// ---------- caso A: Centiskorch ----------
function centiskorch(milestone) {
  const Rm = ninetales2653b(carregarRegras({ milestone, difficulty: "ace", levelCapMode: "more" }));
  return { Rm, r: Rm.candidatosDeBuild(Rm.SPECIES.find((s) => s && s.n === "Centiskorch"), {}) };
}

test("caso A: Brawly (milestone 1) - o 1º candidato é Coil Up com a Flaming Jaws nos motivos, e o Fire Fang (mordida + Fire) aparece entre os 2 primeiros", () => {
  // versao-nova/05: o Fire Lash subiu de 80 para 90 de poder no dado 2.65.4 e passa à frente do Fire Fang no 1º lugar; o que o caso A prova (a Flaming Jaws
  // vê os golpes de mordida pela flag do jogo e o ranking cita Coil Up) continua valendo.
  const { r } = centiskorch(1);
  const c = r.candidatos[0];
  assert.equal(c.habilidade, "Coil Up");
  const motivos = c.motivos.join(" | ");
  assert.match(motivos, /Coil Up/);
  assert.match(motivos, /Flaming Jaws/);
  assert.ok(r.candidatos.slice(0, 2).some((x) => x.golpes.includes("Fire Fang") && x.habilidade === "Coil Up"), r.candidatos.map((x) => x.golpes.join("/")).join(" ; "));
});

test("caso A: Tate e Liza (milestone 6) - Coil Up + Fire Fang de novo, com Flaming Jaws nos motivos", () => {
  const { r } = centiskorch(6);
  const c = r.candidatos[0];
  assert.equal(c.habilidade, "Coil Up");
  assert.ok(c.golpes.includes("Fire Fang") && !c.golpes.includes("Fire Lash"), c.golpes.join("/"));
  assert.match(c.motivos.join(" | "), /Flaming Jaws/);
});

test("caso A: sem chefão adiante, os candidatos saem só por sinergia (hit-kill 0) e Coil Up + Fire Fang lidera", () => {
  const { r } = centiskorch(8);
  assert.equal(r.alvo, null);
  assert.match(r.aviso, /sem chefão adiante/);
  assert.ok(r.candidatos.length >= 3);
  r.candidatos.forEach((c) => {
    assert.equal(c.hitKill, 0);
    assert.equal(c.baterPrimeiro, false);
    assert.equal(c.porQue, null);
    deepEqual(c.dano, { min: 0, max: 0 });
    assert.equal(c.rotulo, "estimada");
  });
  assert.equal(r.candidatos[0].habilidade, "Coil Up");
  assert.ok(r.candidatos[0].golpes.includes("Fire Fang"));
  assert.ok(!r.avisos.includes("Simulação 1x1: luta em dupla e Fake Out não são simulados."), "sem alvo não há simulação para avisar");
});

// ---------- caso B: Ninetales da Meteor Falls ----------
// 15/10/2026 (calibracao-2026-10-15/01): o MoveList da er-config marca o Seismic Fist (Ground, poder 85) como golpe de soco, então
// Iron Fist e Raging Boxer o reforçam; com isso ele passa a ser o melhor golpe do Ledian contra o Ninetales (138% a 162% do HP) e
// o KO é garantido. O Mega Punch segue no kit (ver a lista de casos conferidos mais abaixo).
// B4 (21/10/2026): o Flame Burst do Ninetales (+1) tira ~92% do HP do Ledian mas NÃO o derruba; antes "derrubava" porque a sinergia somava o x1,5 do
// Flash Fire sempre ligado (o gatilho só liga depois de absorver um golpe Fire, abilities.cc:695-706). O simulador 2.65.3b confirma: Flame Burst no Ledian 58% a 70% no sol, sem item.
// Com isso o Ledian bate primeiro por velocidade (172 x 166) e a prioridade do alvo vira só aviso.
// Contas: o motor já inclui o Charcoal (o Ninetales da Meteor Falls o segura; x1,3 em Fire na config). O aviso diz 92% do HP do Ledian na rolagem média,
// que já traz o crítico esperado (x1,0208 = 1 + 1/24 x 0,5): sem crítico a média é 90%, o máximo da rolagem (média/0,925) é 97% e só o crítico (1 em 24) passaria de 100%.
// Margem: ~3% sobre o DANO MÁXIMO sem crítico (estável: não depende do crítico esperado nem da rolagem média). Simulador 2.65.3b, mesmo Ledian de 154 HP, sol, sem item
// (o Charcoal não pegou na calculadora): 90-108 = 58% a 70%; com o Charcoal x1,2 seria 70% a 84% e x1,3 75% a 91%; o motor dá 118-138 = 77% a 90% (com o Charcoal x1,3).
// Nos dois o Flame Burst não derruba o Ledian de 154 HP. Se uma mudança futura passar o máximo de 100% o teste volta a falhar.
test("caso B: Ledian derruba o Ninetales (Seismic Fist, soco pela flag do jogo) e bate primeiro por velocidade: o Flame Burst do alvo (+1) o deixa vivo (B4, 21/10)", () => {
  const r = R.candidatosDeBuild(sp("Ledian"), { alvo: ninetales });
  const c = r.candidatos.find((x) => x.golpes.includes("Mega Punch") && x.habilidade === "Aerodynamics");
  assert.ok(c, "nenhum candidato com Mega Punch: " + r.candidatos.map((x) => x.golpes.join("/")).join(" ; "));
  assert.equal(c.hitKill, 1);
  // "Bate primeiro" = dá o KO primeiro na ordem real: o Flame Burst (+1) passa na frente, mas não derruba o Ledian, que então faz o KO.
  assert.equal(c.baterPrimeiro, true);
  assert.equal(c.porQue, "velocidade");
  assert.equal(tier(c), 3, "1 golpe e bate primeiro");
  assert.equal(c.alvoAgeAntes, true);
  assert.equal(c.rotulo, "calibrada", "versao-nova/03: a prioridade do alvo vira aviso, não tira o selo");
  assert.match(c.avisos.join(" | "), /O alvo age antes com Flame Burst \(\+1 de prioridade\) e tira \d+% do HP de Ledian/);
  assert.equal(c.garantido, true, "o Seismic Fist tira no mínimo 138%: o KO em 1 golpe é garantido, só a ordem não");
  assert.doesNotMatch(c.motivos.join(" | "), /derruba no turno 1/);
  assert.match(c.motivos.join(" | "), /Provável derrubar o Ninetales em 1 golpe \(Seismic Fist\)/);
  assert.match(c.motivos.join(" | "), /Tira 138% a 162% do HP dele por golpe/);
  deepEqual(r.alvo, { chefao: "Courtney Meteor Falls", indice: 0, pokemon: ["Ninetales"], origem: "informado" });
  assert.ok(r.avisos.includes("Simulação 1x1: luta em dupla e Fake Out não são simulados."));
  // Todo candidato do Ledian com hit-kill bate primeiro: o Flame Burst do alvo não o derruba.
  r.candidatos.filter((x) => x.hitKill > 0 && x.alvoAgeAntes).forEach((x) => assert.equal(x.baterPrimeiro, true, x.golpes.join("/")));
});

test("a prioridade do alvo só tira o 'bate primeiro' se o golpe dele DERRUBA o atacante: Quick Attack (+2) que não derruba não muda a ordem do KO", () => {
  // Ninetales do jogo trocado por um com Quick Attack no lugar do Flame Burst: tira HP do Ledian, mas não o derruba.
  const foe = R.foeDeDuelo(Object.assign({}, courtney.party[0], { mv: ["Dazzling Gleam", "Heat Wave", "Ominous Wind", "Quick Attack"], nat: "Mild" }), 55, null);
  assert.ok(foe.golpesProntos.some((g) => g.nome === "Quick Attack" && g.prio > 0), "premissa: Quick Attack tem prioridade");
  const r = R.candidatosDeBuild(sp("Ledian"), { alvo: { foe } });
  const c = r.candidatos.find((x) => x.golpes.includes("Mega Punch") && x.habilidade === "Aerodynamics" && x.hitKill === 1);
  assert.ok(c, r.candidatos.map((x) => x.habilidade + ":" + x.golpes.join("/")).join(" ; "));
  assert.equal(c.baterPrimeiro, true);
  assert.equal(c.porQue, "velocidade");
  assert.equal(c.alvoAgeAntes, true, "o aviso segue: ele age antes, só não derruba");
  assert.match(c.avisos.join(" | "), /O alvo age antes com Quick Attack \(\+2 de prioridade\) e tira \d+% do HP de Ledian/);
});

test("hit-kill de 2 golpes x Ninetales: o alvo age antes com o Flame Burst (+1) e o nível segue a ordem real (Raticate/Pidgeotto, mais lentos, não batem primeiro)", () => {
  // B4 (21/10): sem o x1,5 sempre ligado do Flash Fire o Flame Burst não derruba mais o atacante; só a Velocidade decide (o Pidgeot de Dust Cloud sobe a nível 2).
  // Pidgeotto e Pidgeot saíram da premissa em 15/10/2026 (ticket calibracao-03): a Giant Wings, innate deles, passou a valer x1,3
  // nos golpes de ar (Air Cutter, Air Slash...), os sets mais fortes viram hit-kill de 1 golpe e já não sobra candidato de 2.
  // A propriedade segue valendo para o que sobrar de hit-kill de 2 neles (nenhum, hoje).
  // O Nidorino saiu da premissa em 15/10/2026 (ticket pipeline-build/05): os hit-kill de 2 dele eram sets MISTOS (Sludge Bomb + Drill Run +
  // Earthquake + Thunderbolt) com Modest num bicho de Atk 72 x SpA 55; com a natureza seguindo o split dos golpes sobram os Adamant (hit-kill de 1).
  ["Raticate", "Nidorino", "Pidgeotto", "Pidgeot"].forEach((nome) => {
    const r = R.candidatosDeBuild(sp(nome), { alvo: ninetales });
    const dois = r.candidatos.filter((x) => x.hitKill === 2);
    if (nome === "Raticate") assert.ok(dois.length > 0, nome + ": premissa, algum candidato com hit-kill de 2 golpes");
    dois.forEach((x) => {
      assert.equal(x.alvoAgeAntes, true, nome);
      assert.equal(tier(x), x.baterPrimeiro ? 2 : 1, nome);
      if (nome === "Raticate" || nome === "Pidgeotto") assert.equal(x.baterPrimeiro, false, nome + " " + x.golpes.join("/"));
    });
  });
});

// Alvo sintético: o Ninetales da Meteor Falls só com Flame Burst (prioridade +2 aqui), 1 de HP e sem Queenly Majesty; `vel` é a Velocidade dele.
const foeComPrioridadeIgual = (vel) => {
  const base = R.foeDeDuelo(Object.assign({}, courtney.party[0], { mv: ["Flame Burst"] }), 55, null);
  const foe = Object.assign({}, base, { stats: [1].concat(base.stats.slice(1, 5), [vel]), golpesProntos: base.golpesProntos.map((g) => Object.assign({}, g, { prio: 2 })) });
  foe.ef = Object.assign({}, foe.ef, { bloqueiaPrioLado: false, barraPrioridade: false });
  return foe;
};
test("prioridade IGUAL à do golpe do alvo que o derruba: quem tem mais Velocidade bate primeiro (Scizor com Feint +2 x Flame Burst +2)", () => {
  const scizor = sp("Scizor");
  // alvo mais rápido: a prioridade empata e a Velocidade do alvo decide - o Scizor NÃO bate primeiro
  const lento = R.candidatosDeBuild(scizor, { alvo: { foe: foeComPrioridadeIgual(1000) } }).candidatos.filter((c) => c.golpes.includes("Feint"));
  assert.ok(lento.length > 0, "premissa: candidato com Feint (+2)");
  lento.forEach((c) => { assert.equal(c.baterPrimeiro, false, c.golpes.join("/")); assert.equal(c.porQue, null); });
  // alvo mais lento: prioridade igual, o Scizor tem mais Velocidade e bate primeiro por velocidade
  const rapido = R.candidatosDeBuild(scizor, { alvo: { foe: foeComPrioridadeIgual(1) } }).candidatos.filter((c) => c.golpes.includes("Feint") && c.hitKill === 1);
  assert.ok(rapido.length > 0);
  rapido.forEach((c) => { assert.equal(c.baterPrimeiro, true, c.golpes.join("/")); assert.equal(c.porQue, "velocidade"); });
});

test("Sturdy do atacante (Glalie, inato) x Ninetales: o Flame Burst o derrubaria em 1 golpe, mas o Sturdy o leva a 2 e ele segue batendo primeiro (nível 3)", () => {
  const glalie = sp("Glalie");
  const r = R.candidatosDeBuild(glalie, { alvo: ninetales });
  const c = r.candidatos.find((x) => x.hitKill === 1 && x.golpes.includes("Head Smash") && x.golpes.includes("Seismic Slam"));
  assert.ok(c, r.candidatos.map((x) => x.habilidade + ":" + x.golpes.join("/")).join(" ; "));
  assert.equal(c.baterPrimeiro, true);
  assert.equal(c.porQue, "velocidade");
  assert.equal(tier(c), 3);
  assert.equal(c.alvoAgeAntes, true, "o aviso segue: o alvo age antes com prioridade");
});

test("ranking do caso B: contra o Flame Burst do Ninetales (que não derruba) todo candidato do Ledian é nível 3 (B4, 21/10)", () => {
  const r = R.candidatosDeBuild(sp("Ledian"), { alvo: ninetales });
  assert.ok(r.candidatos.every((x) => tier(x) === 3), "o Flame Burst não derruba o Ledian: ele bate primeiro por velocidade");
});

// Ninetales da Meteor Falls sem o Flame Burst e com Def menor (Mild): o caso conferido na calculadora, sem prioridade do alvo.
const foeSemPrioridade = () => R.foeDeDuelo(Object.assign({}, courtney.party[0], { mv: ["Dazzling Gleam", "Heat Wave", "Ominous Wind", "Shadow Ball"], nat: "Mild" }), 55, null);

test("sem prioridade do alvo, o melhor golpe do Ledian é o Seismic Fist (soco pela flag do jogo): garantido e bate primeiro por velocidade; selo 'calibrada' (versao-nova/03)", () => {
  const r = R.candidatosDeBuild(sp("Ledian"), { alvo: { foe: foeSemPrioridade() } });
  // com o STAB x1,5 da Aerilate (versao-nova/02) o Mega Punch passa a ser o melhor golpe de alguns kits: procura o kit em que o melhor é o Seismic Fist
  const c = r.candidatos.find((x) => x.golpes.includes("Seismic Fist") && x.habilidade === "Aerodynamics" && x.hitKill === 1 && /Seismic Fist derruba no turno 1 o Ninetales/.test(x.motivos.join(" | ")));
  assert.ok(c, r.candidatos.map((x) => x.habilidade + ":" + x.golpes.join("/")).join(" ; "));
  assert.equal(c.alvoAgeAntes, false);
  assert.equal(c.garantido, true);
  assert.equal(c.rotulo, "calibrada");
  assert.match(c.motivos.join(" | "), /Seismic Fist derruba no turno 1 o Ninetales; bate primeiro por velocidade/, "calibrada e garantido: o texto diz 'derruba no turno 1'");
});

test("Typhlosion x Ninetales: o Earthquake derruba, o Aerial Ace é só acessório e o selo é 'calibrada' do mesmo jeito (versao-nova/03)", () => {
  const r = R.candidatosDeBuild(sp("Typhlosion"), { alvo: { foe: foeSemPrioridade() } });
  const comAce = r.candidatos.filter((x) => x.golpes.includes("Aerial Ace") && x.golpes.includes("Earthquake") && x.hitKill === 1);
  assert.ok(comAce.length > 0, r.candidatos.map((x) => x.golpes.join("/")).join(" ; "));
  comAce.forEach((x) => assert.equal(x.rotulo, "calibrada"));
});

test("garantido vale pela rolagem MÍNIMA: Charmeleon x Ninetales derruba em 1 golpe na média (94% a 110%), mas não é garantido", () => {
  const r = R.candidatosDeBuild(sp("Charmeleon"), { alvo: ninetales });
  const ambiguos = r.candidatos.filter((x) => x.hitKill === 1 && x.dano.min < 100 && x.dano.max >= 100);
  assert.ok(ambiguos.length > 0, r.candidatos.map((x) => x.hitKill + ":" + x.dano.min + "-" + x.dano.max).join(" ; "));
  ambiguos.forEach((x) => assert.equal(x.garantido, false, x.golpes.join("/") + " (" + x.dano.min + "% a " + x.dano.max + "%)"));
});

test("prioridade NEGATIVA nunca 'bate primeiro por velocidade' (Avalanche do Vanilluxe Mega) e Focus Punch fica fora do kit", () => {
  const r = R.candidatosDeBuild(sp("Vanilluxe Mega"), { alvo: alakazam });
  assert.ok(r.candidatos.length > 0);
  r.candidatos.forEach((x) => { if (x.golpes[0] === "Avalanche") assert.equal(x.baterPrimeiro, false, x.golpes.join("/")); });
  R.candidatosDeBuild(sp("Ledian"), { alvo: alakazam }).candidatos.forEach((x) => assert.ok(!x.golpes.includes("Focus Punch")));
});

test("lista vazia inesperada: golpe de sinergia que bate em pelo menos um alvo vale (Aerodactyl, Pinsir Mega, Diancie)", () => {
  const Ra = ninetales2653b(carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" }));
  assert.ok(Ra.candidatosDeBuild(Ra.SPECIES.find((x) => x && x.n === "Aerodactyl"), {}).candidatos.length > 0);
  const R6 = ninetales2653b(carregarRegras({ milestone: 6, difficulty: "ace", levelCapMode: "easy" }));
  const pinsir = R6.candidatosDeBuild(R6.SPECIES.find((x) => x && x.n === "Pinsir Mega"), {});
  assert.ok(pinsir.candidatos.length > 0, pinsir.aviso);
  // a única sinergia de Pinsir Mega é Aerodynamics + Tailwind (golpe de status do movepool)
  pinsir.candidatos.forEach((x) => { assert.equal(x.habilidade, "Aerodynamics"); assert.ok(x.golpes.includes("Tailwind")); });
  const diancie = R6.candidatosDeBuild(R6.SPECIES.find((x) => x && x.n === "Diancie"), {});
  assert.ok(diancie.candidatos.length > 0, diancie.aviso);
  diancie.candidatos.forEach((x) => assert.ok(R6.validateAiBuild(R6.SPECIES.find((y) => y && y.n === "Diancie"), x.build, {}, {})));
});

test("golpe de sinergia que bate em só UM dos dois alvos (Omastar x Flannery: Wring Out) continua entre os 3 primeiros candidatos", () => {
  const omastar = R.candidatosDeBuild(sp("Omastar"), {});
  assert.equal(omastar.alvo.chefao, "Flannery 1");
  assert.ok(omastar.candidatos.slice(0, 2).some((c) => c.golpes.includes("Wring Out")), omastar.candidatos.map((c) => c.golpes.join("/")).join(" ; "));
});

test("alvo com prioridade que o atacante não supera: aviso com o golpe e a parte do HP; desligável pela constante", () => {
  // Typhlosion (rápido) x Ninetales do jogo: o Flame Burst (+1) tira uma parte do HP dele.
  const c = R.candidatosDeBuild(sp("Typhlosion"), { alvo: ninetales }).candidatos[0];
  assert.equal(c.alvoAgeAntes, true);
  assert.match(c.avisos.join(" | "), /O alvo age antes com Flame Burst \(\+1 de prioridade\) e tira \d+% do HP de Typhlosion/);
  // sem golpe de prioridade no alvo, nada de aviso nem rebaixa
  const limpo = R.candidatosDeBuild(sp("Typhlosion"), { alvo: { foe: foeSemPrioridade() } }).candidatos[0];
  assert.equal(limpo.alvoAgeAntes, false);
  assert.doesNotMatch(limpo.avisos.join(" | "), /O alvo age antes/);
});

test("todos os golpes de prioridade do alvo contam, não só o melhor (Bullet Punch do Metang, Aqua Jet do Gabite Redux, Extreme Speed do Genesect)", () => {
  const casos = [["Steven Granite Cave", 3, "Bullet Punch"], ["Archie Slateport", 1, "Aqua Jet"], ["Steven Route118", 0, "Extreme Speed"]];
  casos.forEach(([chefao, indice, golpe]) => {
    const boss = R.BOSSES.find((b) => b.name === chefao);
    const foe = R.foeDeDuelo(R.bossPartyPorDificuldade(boss)[indice], 55, null);
    assert.ok(foe.golpesProntos.some((g) => g.nome === golpe && g.prio > 0), chefao + ": a premissa (golpe de prioridade no dado)");
    const r = R.candidatosDeBuild(sp("Ledian"), { alvo: { chefao: boss, indice } });
    assert.ok(r.candidatos.length > 0, chefao);
    assert.match(r.candidatos.map((x) => x.avisos.join(" ")).join(" "), new RegExp("O alvo age antes com " + golpe + " \\(\\+\\d de prioridade\\)"), chefao);
  });
});

test("caso B: a faixa de dano do candidato está em % do HP do alvo e min < max", () => {
  const c = R.candidatosDeBuild(sp("Ledian"), { alvo: ninetales }).candidatos[0];
  // 15/10/2026: o melhor golpe é o Seismic Fist (soco pela flag do jogo), 138% a 162%. Antes, com o Mega Punch, 99% a 117%.
  assert.ok(c.dano.min > 130 && c.dano.max > c.dano.min && c.dano.max < 170, JSON.stringify(c.dano) + " (referência sem item)");
});

test("caso B: a prioridade não vale contra Queenly Majesty - o Accelgor não 'bate primeiro por prioridade'", () => {
  const r = R.candidatosDeBuild(sp("Accelgor"), { alvo: ninetales });
  assert.ok(r.candidatos.length >= 3);
  r.candidatos.forEach((c) => {
    assert.notEqual(c.porQue, "prioridade", c.golpes.join("/"));
    assert.ok(!c.golpes.includes("Beatdown"), "o Beatdown (+1) não derruba o Ninetales");
  });
});

test("caso B: a prioridade condicional (Coil Up) também não vale contra Queenly Majesty", () => {
  // Steelix com Coil Up derruba o Ninetales em 1 golpe, mas é lento: sem a prioridade ele NÃO bate primeiro.
  const c = R.candidatosDeBuild(sp("Steelix"), { alvo: ninetales }).candidatos[0];
  assert.equal(c.habilidade, "Coil Up");
  assert.equal(c.hitKill, 1);
  assert.equal(c.baterPrimeiro, false);
  assert.equal(c.porQue, null);
  // O mesmo Steelix contra o Alakazam (sem a habilidade) segue sem prioridade porque lá o golpe leva 2 hits (Focus Sash).
  const k = R.candidatosDeBuild(sp("Steelix"), { alvo: alakazam }).candidatos;
  assert.ok(k.every((x) => x.hitKill === 2));
  assert.ok(k.every((x) => !x.baterPrimeiro), "a prioridade condicional vale só no golpe que derruba de uma vez");
});

test("o texto só promete 'turno 1' quando o dano MÍNIMO já derruba (garantido) e o alvo não age antes, em qualquer build calibrada", () => {
  const todos = ["Accelgor", "Ledian", "Charmeleon", "Typhlosion"].flatMap((n) => R.candidatosDeBuild(sp(n), { alvo: ninetales }).candidatos).filter((x) => x.hitKill === 1);
  assert.ok(todos.some((x) => x.garantido) && todos.some((x) => !x.garantido), "a amostra tem os dois casos");
  todos.forEach((x) => {
    assert.equal(x.rotulo, "calibrada");
    const texto = x.motivos.join(" | ");
    if (x.garantido && !x.alvoAgeAntes) assert.match(texto, /derruba no turno 1/, x.golpes.join("/"));
    else { // sem garantia, ou com o alvo agindo antes (Flame Burst do Ninetales): nunca 'turno 1'
 assert.match(texto, /Provável derrubar/, x.golpes.join("/")); assert.doesNotMatch(texto, /derruba no turno 1/, x.golpes.join("/")); }
  });
});

test("Focus Sash do alvo (Alakazam): o hit-kill de 1 golpe vira 2 e o candidato avisa", () => {
  const r = R.candidatosDeBuild(sp("Ledian"), { alvo: alakazam });
  deepEqual(r.alvo.pokemon, ["Alakazam"]);
  r.candidatos.forEach((c) => assert.notEqual(c.hitKill, 1));
  assert.ok(r.candidatos.some((c) => /Focus Sash/.test(c.avisos.join(" "))));
});

test("chefão sem índice: mede o primeiro e o ás (o último) e vale o pior dos dois", () => {
  const r = R.candidatosDeBuild(sp("Ledian"), { alvo: { chefao: courtney } });
  deepEqual(r.alvo.pokemon, ["Ninetales", "Charizard"]);
  const c = r.candidatos[0];
  assert.match(c.motivos.join(" | "), /Medido contra o primeiro \(Ninetales\) e o ás \(Charizard\); vale o pior/);
});

test("alvo { foe } já montado pelo motor vale como alvo", () => {
  const foe = R.foeDeDuelo(courtney.party[0], 55, null);
  const r = R.candidatosDeBuild(sp("Ledian"), { alvo: { foe } });
  deepEqual(r.alvo.pokemon, ["Ninetales"]);
  assert.ok(r.candidatos.some((c) => c.golpes.includes("Mega Punch") && c.hitKill === 1));
});

// ---------- invariantes ----------
// Ninetales fora da amostra: o dado novo da er-config 30f0f5a tirou Vengeance e Flash Fire das sinergias dele (species_ability_synergy.json) e ele gera só 2 candidatos; a amostra cobre espécies com 3+.
const AMOSTRA = ["Ledian", "Accelgor", "Steelix", "Centiskorch", "Scizor", "Diglett", "Vaporeon", "Gulpin", "Lickilicky", "Gigalith", "Fearow"];

test("todo candidato passa em validateAiBuild, tem de 1 a 2 conjuntos distintos e vem na ordem do ranking", () => {
  AMOSTRA.forEach((nome) => {
    const r = R.candidatosDeBuild(sp(nome), { alvo: ninetales });
    const rico = !["Vaporeon", "Gigalith", "Lickilicky", "Diglett", "Gulpin"].includes(nome); // poucos golpes de dano contra o alvo
    assert.ok(r.candidatos.length >= (rico ? 2 : 1) && r.candidatos.length <= 2, nome + ": " + r.candidatos.length + " (" + r.aviso + ")");
    const conjuntos = r.candidatos.map((c) => c.golpes.slice().sort().join(","));
    assert.equal(new Set(conjuntos).size, conjuntos.length, nome + ": conjunto repetido");
    r.candidatos.forEach((c, i) => {
      assert.equal(c.golpes.length, 4);
      assert.ok(R.validateAiBuild(sp(nome), c.build, {}, {}), nome + " " + c.golpes.join("/"));
      deepEqual(c.build.moves, c.golpes);
      assert.equal(c.build.ability, c.habilidade);
      if (i > 0) assert.ok(tier(r.candidatos[i - 1]) >= tier(c), nome + ": hit-kill de 1 e bate primeiro > hit-kill de 2 e bate primeiro > resto");
      assert.ok(["calibrada", "estimada"].includes(c.rotulo));
      assert.ok(Array.isArray(c.motivos) && c.motivos.length > 0 && Array.isArray(c.avisos));
    });
  });
});

test("a prioridade vence a Velocidade só quando o golpe é de prioridade e não é bloqueado (Fearow, Gale Wings)", () => {
  // contra o Alakazam (sem Queenly Majesty) um golpe de prioridade vale; o rótulo do porquê é coerente com o flag
  R.candidatosDeBuild(sp("Fearow"), { alvo: alakazam }).candidatos.forEach((c) => {
    assert.equal(c.porQue === null, !c.baterPrimeiro);
    if (c.porQue === "prioridade") assert.equal(c.baterPrimeiro, true);
  });
});

test("rótulo 'estimada' só com habilidade sem regra no motor (atacante ou alvo) ou fuga no Intimidate: na amostra, nenhuma estimada sem motivo", () => {
  AMOSTRA.forEach((nome) => {
    R.candidatosDeBuild(sp(nome), { alvo: ninetales }).candidatos.forEach((c) => {
      if (c.rotulo === "estimada") assert.match(c.selo, /não lê|fuga no Intimidate/, nome + " " + c.golpes.join("/") + ": " + c.selo);
      else assert.equal(c.selo, "Calculado pelo código do jogo");
    });
  });
});

test("determinismo: duas chamadas iguais dão o mesmo resultado", () => {
  AMOSTRA.slice(0, 5).forEach((nome) => {
    const a = R.candidatosDeBuild(sp(nome), { alvo: ninetales }), b = R.candidatosDeBuild(sp(nome), { alvo: ninetales });
    deepEqual(a, b, nome);
  });
});

test("não muta o state", () => {
  const Rx = ninetales2653b(carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" }));
  Rx.state.team = [Rx.getSpeciesBySname("SPECIES_LEDIAN").x];
  Rx.state.box = [Rx.getSpeciesBySname("SPECIES_ACCELGOR").x];
  const foto = () => JSON.stringify(Rx.state, (k, v) => (v instanceof Set ? [...v] : v));
  const antes = foto();
  const alvo = { chefao: Rx.BOSSES.find((b) => b.name === "Courtney Meteor Falls"), indice: 0 };
  const c = Rx.candidatosDeBuild(Rx.getSpeciesBySname("SPECIES_LEDIAN"), {});
  Rx.candidatosDeBuild(Rx.getSpeciesBySname("SPECIES_LEDIAN"), { alvo });
  Rx.especiesQueResolvem(alvo, {});
  Rx.fecharBuild(c.candidatos[0], { evs: [0, 252, 0, 0, 0, 252], item: "", natureza: "Adamant" });
  assert.equal(foto(), antes);
});

test("sem alvo: o próximo líder de ginásio da Etapa (e o aviso quando não há mais nenhum)", () => {
  const R0 = ninetales2653b(carregarRegras({ milestone: 0 }));
  assert.equal(R0.candidatosDeBuild(R0.getSpeciesBySname("SPECIES_LEDIAN"), {}).alvo.chefao, "Roxanne 1");
  assert.equal(R0.candidatosDeBuild(R0.getSpeciesBySname("SPECIES_LEDIAN"), {}).alvo.origem, "proximo-lider");
  const R2 = ninetales2653b(carregarRegras({ milestone: 2 }));
  assert.match(R2.candidatosDeBuild(R2.getSpeciesBySname("SPECIES_LEDIAN")).alvo.chefao, /^Wattson/);
  const R8 = ninetales2653b(carregarRegras({ milestone: 8 }));
  const r = R8.candidatosDeBuild(R8.getSpeciesBySname("SPECIES_LEDIAN"));
  assert.equal(r.alvo, null);
  assert.match(r.aviso, /sem chefão adiante/);
});

test("falta de dado nunca lança: espécie sem golpe, espécie inexistente e alvo inválido", () => {
  const semGolpes = Object.assign({}, sp("Magikarp"), { lm: [], tu: [] });
  const r = R.candidatosDeBuild(semGolpes, { alvo: ninetales });
  deepEqual(r.candidatos, []);
  assert.match(r.aviso, /não tem golpe de dano/);
  deepEqual(R.candidatosDeBuild(null).candidatos, []);
  deepEqual(R.candidatosDeBuild("SPECIES_NAO_EXISTE").candidatos, []);
  const ruim = R.candidatosDeBuild(sp("Ledian"), { alvo: { chefao: "Ninguém" } });
  deepEqual(ruim.candidatos, []);
  assert.match(ruim.aviso, /chefão não encontrado/);
  assert.match(R.candidatosDeBuild(sp("Ledian"), { alvo: { qualquer: 1 } }).aviso, /alvo inválido/);
});

test("golpe que depende do item (Fling) fica fora: a referência é sem item", () => {
  AMOSTRA.forEach((nome) => R.candidatosDeBuild(sp(nome), { alvo: ninetales }).candidatos.forEach((c) => assert.ok(!c.golpes.includes("Fling"), nome)));
});

test("habilidade que só funciona gastando o item: o rascunho leva a Berry e o candidato avisa", () => {
  const r = R.candidatosDeBuild(sp("Gulpin"), { alvo: ninetales });
  assert.ok(r.candidatos.length > 0);
  r.candidatos.forEach((c) => {
    assert.equal(c.build.item, "Sitrus Berry");
    assert.match(c.avisos.join(" "), /Sitrus Berry/);
  });
});

// Orçamento relativo (15/10/2026): milissegundo absoluto falhava sob carga da máquina (sabotagem roda vários processos).
// Agora cada espécie é medida no mesmo processo (melhor de 2 corridas, para descartar um tropeço do agendador) e
// nenhuma pode passar de 8x a mediana da amostra (piso de 50 ms para a mediana não zerar o limite). Pega uma
// regressão grande numa espécie (ex.: x10); carga uniforme da máquina escala todas juntas e não dispara.
test("tempo: nenhuma espécie passa de 8x a mediana da amostra", () => {
  const medir = (nome) => {
    const t = performance.now();
    R.candidatosDeBuild(sp(nome), { alvo: { chefao: courtney } });
    return performance.now() - t;
  };
  const tempos = AMOSTRA.map((nome) => ({ nome, ms: Math.min(medir(nome), medir(nome)) }));
  const ordenado = tempos.map((x) => x.ms).sort((a, b) => a - b);
  const mediana = ordenado[Math.floor(ordenado.length / 2)];
  const limite = 8 * Math.max(mediana, 50);
  tempos.forEach(({ nome, ms }) => assert.ok(ms <= limite, nome + ": " + Math.round(ms) + " ms (limite " + Math.round(limite) + " ms, mediana " + Math.round(mediana) + " ms)"));
});

// ---------- rodada 2 do supervisor ----------
test("Psychic Terrain zera a prioridade do alvo no motor: com Tapu Lele (Psychic Surge) o aviso 'O alvo age antes' não aparece", () => {
  const r = R.candidatosDeBuild(sp("Tapu Lele"), { alvo: ninetales });
  assert.ok(r.candidatos.length > 0);
  r.candidatos.forEach((c) => {
    assert.equal(c.alvoAgeAntes, false, c.habilidade + " " + c.golpes.join("/"));
    assert.doesNotMatch(c.avisos.join(" "), /O alvo age antes/);
  });
});

test("Indeedee: só quem arma o Psychic Terrain (habilidade Psychic Surge) escapa da prioridade do alvo", () => {
  // "Indeedee Female" é a forma que tem a habilidade Psychic Surge (o macho não tem: o filtro ficaria vazio e o teste não provaria nada).
  const r = R.candidatosDeBuild(sp("Indeedee Female"), { alvo: ninetales });
  assert.ok(r.candidatos.some((c) => c.habilidade === "Psychic Surge"), "premissa: a Indeedee Female tem candidato com Psychic Surge");
  r.candidatos.filter((c) => c.habilidade === "Psychic Surge").forEach((c) => assert.equal(c.alvoAgeAntes, false));
  // A mesma conta pelo motor: o Flame Burst do Ninetales tem prioridade efetiva 0 contra um atacante com Psychic Surge.
  const indeedee = sp("Indeedee Female");
  const u = R.unidadeDaBuild(indeedee, { ability: "Psychic Surge", nature: "Modest", evs: [0, 0, 0, 252, 0, 252], item: "", moves: ["Psychic"] }, 55, "sol");
  const foe = R.foeDeDuelo(courtney.party[0], 55, "sol");
  const burst = foe.golpesProntos.find((g) => g.nome === "Flame Burst");
  assert.ok(burst && burst.prio > 0, "premissa: o dado dá +1 ao Flame Burst");
  const d = R.resultadoDoDuelo(Object.assign({}, foe, { golpesProntos: [burst] }), u, 55, { soPar: true });
  assert.equal(d.meu.melhor.prio, 0);
});

// Prioridade CONDICIONAL do alvo (prioCheio: Coil Up e cia. no primeiro golpe; o dado não dá +1): o motor a conta e o aviso aparece.
// Alvo sintético: o Ninetales com só o Flame Burst, prioridade 0 no dado, Velocidade 1000 (nunca perde na Velocidade).
test("prioridade condicional do alvo (prioCheio) conta como ameaça: o Ledian recebe o aviso 'O alvo age antes' e sem a condicional não recebe", () => {
  const foeCom = (cheio) => {
    const base = R.foeDeDuelo(Object.assign({}, courtney.party[0], { mv: ["Flame Burst"] }), 55, null);
    const foe = Object.assign({}, base, { stats: base.stats.slice(0, 5).concat([1000]), golpesProntos: base.golpesProntos.map((g) => Object.assign({}, g, { prio: 0, prioCheio: cheio })) });
    foe.ef = Object.assign({}, foe.ef, { bloqueiaPrioLado: false, barraPrioridade: false });
    return foe;
  };
  const com = R.candidatosDeBuild(sp("Ledian"), { alvo: { foe: foeCom(true) } }).candidatos;
  const sem = R.candidatosDeBuild(sp("Ledian"), { alvo: { foe: foeCom(false) } }).candidatos;
  assert.ok(com.length > 0 && sem.length > 0);
  com.forEach((c) => assert.equal(c.alvoAgeAntes, true, c.golpes.join("/")));
  assert.match(com[0].avisos.join(" "), /O alvo age antes com Flame Burst \(\+1 de prioridade\)/);
  sem.forEach((c) => assert.equal(c.alvoAgeAntes, false, c.golpes.join("/")));
});

// Crítica 1 do supervisor (rodada 2 de 3, 14/10): a prioridade condicional (Coil Up) é barrada pelo Psychic Terrain do ALVO no chão. O motor lê o
// terreno de CAMPO_DUELO, que só existe dentro de resultadoDoDuelo; o pipeline chama temPrioridadeNoCampoDuelo (monta o campo do confronto).
// Dado real: Centiskorch (Coil Up) x Indeedee Female no milestone 1 (cap de nível 20). Controle: com Synchronize no lugar do Psychic Surge o
// mesmo kit bate primeiro por prioridade; com o terreno, o Fire Fang não bate primeiro por prioridade (falharia inteiro no motor).
test("Coil Up x Indeedee Female (Psychic Surge, alvo no chão): nenhum candidato com Coil Up diz 'bate primeiro por prioridade'; sem o terreno diz", () => {
  const R1 = ninetales2653b(carregarRegras({ milestone: 1, difficulty: "ace", levelCapMode: "more" }));
  const base = R1.BOSSES.find((b) => b.name === "Courtney Meteor Falls").party[0];
  const idDe = (nome) => Number(Object.keys(R1.ABILITIES).find((k) => R1.ABILITIES[k][0] === nome));
  const foeCom = (abi) => R1.foeDeDuelo(Object.assign({}, base, { x: 1418, n: "Indeedee Female", abi, abiId: idDe(abi), item: "", nat: "Modest", mv: ["Psychic"] }), 20, null);
  const coilUp = (abi) => R1.candidatosDeBuild(R1.SPECIES.find((x) => x && x.n === "Centiskorch"), { alvo: { foe: foeCom(abi) } }).candidatos.filter((c) => c.habilidade === "Coil Up" && c.golpes.includes("Fire Fang"));
  const controle = coilUp("Synchronize");
  assert.ok(controle.some((c) => c.hitKill === 1 && c.baterPrimeiro && c.porQue === "prioridade"), "premissa: sem o terreno o Coil Up + Fire Fang bate primeiro por prioridade");
  const terreno = coilUp("Psychic Surge");
  assert.ok(terreno.length > 0, "premissa: há candidato com Coil Up + Fire Fang");
  terreno.forEach((c) => assert.notEqual(c.porQue, "prioridade", c.golpes.join("/")));
});

// Crítica 3 (mesma rodada): a Surprise! (Misdreavus, Shuppet, Banette, Mismagius, Gimmighoul, Wispywaspy, Ash-Greninja, Houndoom Mega Redux...) só zera a
// prioridade na Eerie Fog e a validação exige Eerie Fog na build ou no time. O módulo nunca monta kit com Eerie Fog, então nenhum candidato a carrega
// e o ramo "Surprise! zera a prioridade do alvo" em pipelineAmeacasDePrioridade é inalcançável pela interface pública.
test("Surprise! nunca chega a candidata: a validação a recusa sem Eerie Fog e nenhum candidato das espécies que a têm a usa", () => {
  [1, 3, 6].forEach((ms) => {
    const Rm = ninetales2653b(carregarRegras({ milestone: ms, difficulty: "ace", levelCapMode: "easy" }));
    const comSurprise = Rm.SPECIES.filter((x) => x && (x.ab || []).concat(x.inn || []).some((a) => Rm.ABILITIES[a] && Rm.ABILITIES[a][0] === "Surprise!"));
    assert.ok(comSurprise.length >= 10, "premissa: ao menos 10 espécies têm Surprise! (" + comSurprise.length + ")");
    comSurprise.forEach((esp) => {
      const r = Rm.candidatosDeBuild(esp, {});
      r.candidatos.forEach((c) => {
        assert.notEqual(c.habilidade, "Surprise!", esp.n + " milestone " + ms);
        assert.ok(!(c.inatas || []).includes("Surprise!"), esp.n);
        assert.ok(!c.golpes.includes("Eerie Fog"), esp.n);
      });
      if (r.candidatos.length) {
        const rec = {};
        const v = Rm.validateAiBuild(esp, Object.assign({}, r.candidatos[0].build, { ability: "Surprise!" }), rec, {});
        assert.equal(v, null, esp.n + ": a Surprise! sem Eerie Fog passou na validação");
        assert.match(rec.txt, /Eerie Fog/, esp.n);
      }
    });
  });
});

test("fuga no Intimidate (Tactical Retreat): o motor devolve só uma nota e o módulo não lança - Tatsugiri, Deoxys Speed, Chansey e Blissey Redux", () => {
  const nomes = /^(Tatsugiri|Deoxys Speed|Chansey Redux|Blissey Redux)/;
  [1, 4, 6].forEach((ms) => {
    const Rm = ninetales2653b(carregarRegras({ milestone: ms, difficulty: "ace", levelCapMode: "more" }));
    const lista = Rm.SPECIES.filter((x) => x && nomes.test(x.n));
    assert.equal(lista.length, 8);
    lista.forEach((x) => {
      const r = Rm.candidatosDeBuild(x, {});
      assert.ok(r.candidatos.length > 0, "milestone " + ms + " " + x.n + ": " + r.aviso);
      assert.doesNotMatch(String(r.aviso) + r.avisos.join(" "), /Cannot read|não consegui montar/);
    });
  });
  // Deoxys Speed no milestone 1 (Brawly): um lado foge; o candidato avisa e é estimada, nunca calibrada.
  const R1 = ninetales2653b(carregarRegras({ milestone: 1, difficulty: "ace", levelCapMode: "more" }));
  const r = R1.candidatosDeBuild(R1.SPECIES.find((x) => x && x.n === "Deoxys Speed"), {});
  const comAviso = r.candidatos.filter((c) => /foge no Intimidate/.test(c.avisos.join(" ")));
  assert.ok(comAviso.length > 0);
  comAviso.forEach((c) => assert.equal(c.rotulo, "estimada"));
});

test("Mega no modo de mega temporária (milestone 6): o rascunho leva a pedra e o candidato avisa (Abomasnow, Dragalge, Excadrill, Meowstic; o Skarmory saiu da lista no dado 2.65.4: Skarmorite virou X e Y e ficou uma pedra por forma)", () => {
  const R6 = ninetales2653b(carregarRegras({ milestone: 6, difficulty: "ace", levelCapMode: "more" }));
  ["Abomasnow Mega", "Dragalge Mega", "Excadrill Mega", "Meowstic Mega"].forEach((nome) => {
    const mega = R6.SPECIES.find((x) => x && x.n === nome);
    assert.ok(mega, nome);
    const r = R6.candidatosDeBuild(mega, {});
    assert.ok(r.candidatos.length > 0, nome + ": " + r.aviso);
    const pedras = R6.megaStoneRuleFor(mega).stones;
    r.candidatos.forEach((c) => {
      assert.ok(pedras.includes(c.build.item), nome + " item " + c.build.item);
      // Pedra única já liberada (4ª insígnia, TK-22): o validador põe a pedra sozinho e não há o que avisar.
      // Com duas pedras (Excadrill) a escolha é da IA, e o rascunho avisa.
      if (pedras.length > 1) assert.match(c.avisos.join(" "), /precisa segurar a pedra/);
      assert.ok(R6.validateAiBuild(mega, c.build, {}, {}));
    });
  });
});

test("lista vazia sempre vem com motivo (varredura por amostra nos milestones 1 e 6)", () => {
  [1, 6].forEach((ms) => {
    const Rm = ninetales2653b(carregarRegras({ milestone: ms, difficulty: "ace", levelCapMode: "more" }));
    const todas = Rm.SPECIES.filter(Boolean);
    const amostra = todas.filter((_, i) => i % 9 === 0);
    // espécies que já voltaram vazias antes (com motivo): Alcremie, Pyukumuku, Budew, Castform Sandy
    ["Alcremie", "Pyukumuku", "Budew", "Castform Sandy"].forEach((n) => { const x = todas.find((y) => y.n === n); if (x && amostra.indexOf(x) === -1) amostra.push(x); });
    amostra.forEach((x) => {
      const r = Rm.candidatosDeBuild(x, {});
      if (r.candidatos.length) return;
      assert.ok(typeof r.aviso === "string" && r.aviso.length > 10, "milestone " + ms + " " + x.n + ": lista vazia sem motivo");
      assert.ok(r.avisos.includes(r.aviso), x.n);
      assert.doesNotMatch(r.aviso, /Cannot read|undefined/, x.n);
    });
  });
});

// ---------- 2. do alvo para os Pokémon ----------
test("especiesQueResolvem: time e caixa, só quem derruba (hitKill > 0), 1 golpe antes de 2 e quem bate primeiro antes", () => {
  const Rx = ninetales2653b(carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" }));
  const x = (s) => Rx.getSpeciesBySname(s).x;
  Rx.state.team = [x("SPECIES_LEDIAN"), x("SPECIES_ACCELGOR")];
  Rx.state.box = [x("SPECIES_STEELIX"), x("SPECIES_SCIZOR")];
  const alvo = { chefao: Rx.BOSSES.find((b) => b.name === "Courtney Meteor Falls"), indice: 0 };
  const lista = Rx.especiesQueResolvem(alvo, {});
  assert.ok(lista.length >= 3);
  lista.forEach((e) => { assert.ok(e.sp && e.sp.sname); assert.ok(e.candidato.hitKill > 0); });
  deepEqual(lista.map((e) => e.sp.sname).filter((s, i, a) => a.indexOf(s) === i), lista.map((e) => e.sp.sname));
  for (let i = 1; i < lista.length; i++) {
    const a = lista[i - 1].candidato, b = lista[i].candidato;
    const ta = tier(a), tb = tier(b);
    assert.ok(ta > tb || (ta === tb && (a.hitKill <= b.hitKill || a.hitKill === 0 || b.hitKill === 0)), "os 3 níveis do usuário: 1 golpe e bate primeiro > 2 golpes e bate primeiro > resto");
    if (ta === tb && a.hitKill === b.hitKill) assert.ok(a.dano.max >= b.dano.max, "dentro do nível, mais dano antes");
  }
  // Contra o Ninetales do jogo (Flame Burst +1, que não derruba o Ledian) o Ledian bate primeiro por velocidade e sobe acima do Steelix (B4, 21/10).
  const nomes = lista.map((e) => e.sp.n);
  assert.ok(nomes.indexOf("Ledian") !== -1 && nomes.indexOf("Steelix") !== -1);
  assert.equal(tier(lista.find((e) => e.sp.n === "Ledian").candidato), 3, "Ledian: 1 golpe e bate primeiro");
  assert.ok(nomes.indexOf("Ledian") < nomes.indexOf("Steelix"), "quem bate primeiro vem antes");
  // Sem o Flame Burst (Ninetales sem prioridade), o Ledian volta a bater primeiro por velocidade e sobe acima do Steelix.
  const semBurst = Rx.foeDeDuelo(Object.assign({}, Rx.BOSSES.find((b) => b.name === "Courtney Meteor Falls").party[0], { mv: ["Dazzling Gleam", "Heat Wave", "Ominous Wind", "Shadow Ball"], nat: "Mild" }), 55, null);
  const lista2 = Rx.especiesQueResolvem({ foe: semBurst }, {}).map((e) => e.sp.n);
  assert.ok(lista2.indexOf("Ledian") !== -1 && lista2.indexOf("Ledian") < lista2.indexOf("Steelix"), lista2.join(","));
  // quem não está no time nem na caixa não entra
  assert.ok(!nomes.includes("Fearow"));
});

test("especiesQueResolvem: opts.especies substitui a lista e opts.max corta", () => {
  const lista = R.especiesQueResolvem(ninetales, { especies: ["SPECIES_LEDIAN", sp("Accelgor"), "SPECIES_SCIZOR"] });
  deepEqual(lista.map((e) => e.sp.sname).sort(), ["SPECIES_ACCELGOR", "SPECIES_LEDIAN", "SPECIES_SCIZOR"]);
  assert.equal(R.especiesQueResolvem(ninetales, { especies: ["SPECIES_LEDIAN", "SPECIES_ACCELGOR", "SPECIES_SCIZOR"], max: 2 }).length, 2);
  deepEqual(R.especiesQueResolvem({ chefao: "Ninguém" }, { especies: ["SPECIES_LEDIAN"] }), []);
  deepEqual(R.especiesQueResolvem(ninetales, { especies: [] }).length, 0);
});

test("especiesQueResolvem: opts.demais soma as melhores do rank da Etapa, depois do time e da caixa, com a origem de cada uma", () => {
  const Rx = ninetales2653b(carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" }));
  const x = (s) => Rx.getSpeciesBySname(s).x;
  const alvo = { chefao: Rx.BOSSES.find((b) => b.name === "Courtney Meteor Falls"), indice: 0 };
  Rx.state.team = [x("SPECIES_LEDIAN")];
  Rx.state.box = [x("SPECIES_STEELIX")];
  const sem = Rx.especiesQueResolvem(alvo, {});
  assert.ok(sem.length >= 1);
  sem.forEach((e) => assert.ok(e.origem === "time" || e.origem === "caixa", "sem demais só time e caixa: " + e.origem));
  const com = Rx.especiesQueResolvem(alvo, { demais: 12, max: 5, maxDemais: 3 });
  const origens = com.map((e) => e.origem);
  assert.ok(origens.indexOf("outros") !== -1, "ao menos um dos demais derruba: " + origens.join(","));
  assert.ok(origens.filter((o) => o === "outros").length <= 3, "maxDemais corta só os demais");
  assert.equal(origens.indexOf("time") !== -1 && origens.indexOf("time") < origens.indexOf("outros"), true, "time antes dos demais");
  assert.equal(origens.lastIndexOf("caixa") < origens.indexOf("outros") || origens.indexOf("caixa") === -1, true, "caixa antes dos demais");
  com.filter((e) => e.origem === "outros").forEach((e) => {
    assert.notEqual(e.sp.sname, "SPECIES_LEDIAN");
    assert.notEqual(e.sp.sname, "SPECIES_STEELIX");
    assert.ok(Rx.rankDe(e.sp.sname).etapa <= 3, e.sp.n + " ainda não dá para pegar na Etapa 3");
    assert.ok(e.candidato.hitKill > 0);
  });
  // os demais vêm do topo do rank: nenhum fica abaixo da 12ª melhor da Etapa
  const topo = Rx.SPECIES.filter((s) => s && !["SPECIES_LEDIAN", "SPECIES_STEELIX"].includes(s.sname) && Rx.rankDe(s.sname) && Rx.rankDe(s.sname).etapa <= 3)
    .sort((a, b) => Rx.rankDe(b.sname).score - Rx.rankDe(a.sname).score || (a.sname < b.sname ? -1 : 1)).slice(0, 12).map((s) => s.sname);
  com.filter((e) => e.origem === "outros").forEach((e) => assert.ok(topo.includes(e.sp.sname), e.sp.n));
  // Monotype: os demais respeitam o tipo
  Rx.state.archetype.monotype = "Bug";
  Rx.especiesQueResolvem(alvo, { demais: 12 }).forEach((e) => assert.ok(Rx.speciesTypeNames(e.sp).includes("Bug"), e.sp.n));
  // opts.especies marca "informada"
  assert.equal(R.especiesQueResolvem(ninetales, { especies: ["SPECIES_LEDIAN"] })[0].origem, "informada");
});

// ---------- 3. fechar a build ----------
test("fecharBuild: com a escolha da IA devolve a build validada com os golpes e a habilidade do candidato", () => {
  const c = R.candidatosDeBuild(sp("Ledian"), { alvo: ninetales }).candidatos[0];
  const f = R.fecharBuild(c, { evs: [0, 252, 0, 0, 0, 252], item: "Life Orb", natureza: "Adamant" });
  assert.equal(f.ok, true, f.erros.join(" "));
  deepEqual(f.erros, []);
  deepEqual(f.build.moves, c.golpes);
  assert.equal(f.build.ability, c.habilidade);
  assert.equal(f.build.nature, "Adamant");
  assert.equal(f.build.item, "Life Orb");
  assert.ok(R.validateAiBuild(sp("Ledian"), f.build, {}, {}));
});

test("fecharBuild: EVs, item, natureza e candidato inválidos viram { ok: false, erros } sem exceção", () => {
  const c = R.candidatosDeBuild(sp("Ledian"), { alvo: ninetales }).candidatos[0];
  const base = { evs: [0, 252, 0, 0, 0, 252], item: "", natureza: "Adamant" };
  const ruins = [
    Object.assign({}, base, { evs: [0, 300, 0, 0, 0, 252] }), Object.assign({}, base, { evs: [0, 252, 0, 0, 0] }),
    Object.assign({}, base, { evs: [252, 252, 252, 0, 0, 0] }), Object.assign({}, base, { evs: "muito" }), Object.assign({}, base, { evs: [0, 1.5, 0, 0, 0, 0] }),
    Object.assign({}, base, { item: "Item Que Nao Existe" }), Object.assign({}, base, { item: 7 }),
    Object.assign({}, base, { natureza: "Nope" }), Object.assign({}, base, { natureza: undefined }), null, undefined, {}
  ];
  ruins.forEach((e) => {
    const f = R.fecharBuild(c, e);
    assert.equal(f.ok, false, JSON.stringify(e));
    assert.equal(f.build, null);
    assert.ok(f.erros.length > 0 && typeof f.erros[0] === "string");
  });
  [null, undefined, {}, { sname: "SPECIES_LEDIAN" }, { sname: "SPECIES_NAO_EXISTE", build: { moves: [] } }].forEach((cand) => {
    const f = R.fecharBuild(cand, base);
    assert.equal(f.ok, false);
    assert.ok(f.erros.length > 0);
  });
});
