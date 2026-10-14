// Prioridade CONDICIONAL no duelo (14/10/2026): Coil Up/Sidewinder/Cutthroat (1º golpe da categoria), +1 no 1º turno e
// Opportunist (alvo abaixo da metade) entram na prioridade do golpe no jogo (battle_main.c GetMovePriority), então
// Queenly Majesty/Dazzling/Armor Tail (abilities.cc: imune a golpe de prioridade > 0), o Psychic Terrain (battle_util.c
// CANCELLER_PSYCHIC_TERRAIN) e a Surprise! (abilities.cc onPreemptAction) valem para ela como para a prioridade de base.
// Antes só a de base era barrada em danoNoDuelo; a condicional ainda dava "age primeiro" ao Centiskorch contra o Ninetales.
// Decisões em docs/decisoes_mecanicas.md. Luta completa sempre com dado real (Etapa da Meteor Falls, nível 55).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const NIVEL = 55;
const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" });
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const courtney = R.BOSSES.find((b) => b.name === "Courtney Meteor Falls");
// O golpe de prioridade do chefão (Flame Burst) deixaria o chefão na frente por conta própria; fora dele só conta a ordem do atacante.
const semPrioridade = (f) => Object.assign({}, f, { golpesProntos: f.golpesProntos.filter((g) => !(g.prio > 0)) });
const ninetales = semPrioridade(R.foeDeDuelo(courtney.party[0], NIVEL, null)); // Queenly Majesty, mais rápido que o Centiskorch
const alakazam = semPrioridade(R.foeDeDuelo(courtney.party[1], NIVEL, null)); // sem habilidade de bloqueio
const unidade = (n, hab, moves, evs, clima, nat) => R.unidadeDaBuild(sp(n),
  { ability: hab, nature: nat || "Adamant", evs: evs || [0, 252, 0, 0, 0, 252], item: "", moves }, NIVEL, clima || null);
// Um golpe só derruba o alvo com 80% do HP; o Centiskorch (Spe 128) é mais lento que todos os alvos abaixo.
const lutar = (eu, foe, fracFoe) => R.resultadoDoDuelo(eu, foe, NIVEL, { detalhe: true, fracFoe });
const comEf = (u, extra) => Object.assign({}, u, { ef: Object.assign({}, u.ef, extra) });
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes, clima) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "PC_" + nomes.join("+") + (clima || ""), clima || null);

// ---------- a função, sem luta ----------
const golpeCoil = { nome: "Bite", prio: 0, prioCheio: true };
const danoSemPrio = { melhor: { prio: 0, golpe: golpeCoil } };

test("sem o alvo na chamada, a prioridade condicional vale como antes (compatibilidade)", () => {
  assert.equal(R.temPrioridadeNoDuelo({ ef: efDe([]) }, danoSemPrio, 1), true);
});

test("Queenly Majesty, Dazzling e Armor Tail barram a prioridade do 1º golpe (Coil Up e parecidas)", () => {
  const u = { ef: efDe([]) };
  ["Queenly Majesty", "Dazzling", "Armor Tail"].forEach((h) => {
    assert.equal(R.temPrioridadeNoDuelo(u, danoSemPrio, 1, { ef: efDe([h]) }), false, h);
  });
  assert.equal(R.temPrioridadeNoDuelo(u, danoSemPrio, 1, { ef: efDe([]) }), true, "alvo sem a habilidade");
});

test("Mold Breaker e parecidos atravessam o bloqueio da prioridade condicional", () => {
  const u = { ef: comEf({ ef: efDe([]) }, { quebraHabilidade: true }).ef };
  assert.equal(R.temPrioridadeNoDuelo(u, danoSemPrio, 1, { ef: efDe(["Queenly Majesty"]) }), true);
});

test("Surprise! na névoa barra a prioridade condicional; sem névoa ela não faz nada", () => {
  const u = { ef: efDe([]) };
  assert.equal(R.temPrioridadeNoDuelo(u, danoSemPrio, 1, { ef: efDe(["Surprise!"], "nevoa") }), false);
  assert.equal(R.temPrioridadeNoDuelo(u, danoSemPrio, 1, { ef: efDe(["Surprise!"]) }), true);
});

test("Opportunist (golpe que decide, 2 ou mais golpes) também é barrado por Queenly Majesty e Surprise!", () => {
  const u = { ef: efDe(["Opportunist"]) };
  const dano = { melhor: { prio: 0, golpe: { nome: "T", prio: 0, prioCheio: false } } };
  assert.equal(R.temPrioridadeNoDuelo(u, dano, 2, { ef: efDe([]) }), true, "premissa: sem bloqueio a prioridade existe");
  assert.equal(R.temPrioridadeNoDuelo(u, dano, 2, { ef: efDe(["Queenly Majesty"]) }), false);
  assert.equal(R.temPrioridadeNoDuelo(u, dano, 2, { ef: efDe(["Surprise!"], "nevoa") }), false);
});

test("golpe com prioridade de base continua valendo (o filtro do danoNoDuelo é quem o remove contra o bloqueio)", () => {
  const dano = { melhor: { prio: 1, golpe: { nome: "Mach Punch", prio: 1 } } };
  assert.equal(R.temPrioridadeNoDuelo({ ef: efDe([]) }, dano, 1, { ef: efDe(["Queenly Majesty"]) }), true);
});

// ---------- a luta inteira, com dado real ----------
test("Coil Up: o Centiskorch (Bite, 1º golpe com +1) age antes do Alakazam, mas NÃO antes do Ninetales de Queenly Majesty", () => {
  const cent = unidade("Centiskorch", "Coil Up", ["Bite"]);
  assert.equal(cent.golpesProntos[0].prioCheio, true, "premissa: o Bite leva a prioridade condicional");
  assert.ok(cent.stats[5] < ninetales.stats[5] && cent.stats[5] < alakazam.stats[5], "premissa: o Centiskorch é mais lento que os dois");
  const contraAlakazam = lutar(cent, alakazam, 0.8), contraNinetales = lutar(cent, ninetales, 0.8);
  assert.equal(contraAlakazam.venceu, true);
  assert.equal(contraAlakazam.fracEu, 1, "com a prioridade o Bite derruba o Alakazam antes de ele agir");
  assert.equal(contraNinetales.venceu, true, "premissa: um Bite ainda derruba o Ninetales");
  assert.ok(contraNinetales.fracEu < 1, "contra Queenly Majesty o Bite não tem prioridade: o Ninetales (mais rápido) bate primeiro, fracEu " + contraNinetales.fracEu);
});

test("Coil Up contra Queenly Majesty com Mold Breaker (habilidade ignorada): a prioridade volta", () => {
  const cent = comEf(unidade("Centiskorch", "Coil Up", ["Bite"]), { quebraHabilidade: true });
  assert.equal(lutar(cent, ninetales, 0.8).fracEu, 1);
});

test("Psychic Terrain (Indeedee com Psychic Surge) zera a prioridade condicional do Centiskorch; sem o terreno ela vale", () => {
  const cent = unidade("Centiskorch", "Coil Up", ["Bite"]);
  const indeedee = (hab) => unidade("Indeedee Female", hab, ["Psychic"], [0, 0, 0, 252, 0, 252], null, "Modest");
  assert.ok(cent.stats[5] < indeedee("Psychic Surge").stats[5], "premissa: a Indeedee é mais rápida");
  const sem = lutar(cent, indeedee("Own Tempo"), 0.4), com = lutar(cent, indeedee("Psychic Surge"), 0.4);
  assert.equal(sem.venceu, true);
  assert.equal(sem.fracEu, 1, "sem terreno o Bite tem prioridade e derruba antes de ela agir");
  assert.equal(com.venceu, true, "premissa: o Bite ainda derruba");
  assert.ok(com.fracEu < 1, "no Psychic Terrain a Indeedee bate primeiro, fracEu " + com.fracEu);
});

test("Psychic Terrain só protege quem está no chão: o mesmo alvo voando (tipo Flying) não barra a prioridade condicional", () => {
  const cent = unidade("Centiskorch", "Coil Up", ["Bite"]);
  const indeedee = unidade("Indeedee Female", "Psychic Surge", ["Psychic"], [0, 0, 0, 252, 0, 252], null, "Modest");
  const noAr = Object.assign({}, indeedee, { tipos: ["Flying", "Psychic"] });
  assert.ok(lutar(cent, indeedee, 0.4).fracEu < 1, "premissa: no chão o terreno barra a prioridade");
  const r = lutar(cent, noAr, 0.4);
  assert.equal(r.venceu, true);
  assert.equal(r.fracEu, 1, "voando, o Bite do Centiskorch mantém a prioridade e derruba antes de a Indeedee agir");
});

test("Surprise! (Mismagius na névoa) zera a prioridade condicional do Centiskorch; a mesma luta sem a habilidade deixa a prioridade valer", () => {
  const cent = (clima) => unidade("Centiskorch", "Coil Up", ["Bite"], null, clima);
  const mismagius = (hab, clima) => unidade("Mismagius", hab, ["Shadow Ball"], [0, 0, 0, 252, 0, 252], clima, "Modest");
  assert.equal(mismagius("Surprise!", "nevoa").ef.barraPrioridade, true, "premissa: a Surprise! está ativa na névoa");
  assert.ok(cent("nevoa").stats[5] < mismagius("Levitate", "nevoa").stats[5], "premissa: a Mismagius é mais rápida");
  const sem = lutar(cent("nevoa"), mismagius("Levitate", "nevoa"), 0.4), com = lutar(cent("nevoa"), mismagius("Surprise!", "nevoa"), 0.4);
  assert.equal(sem.fracEu, 1, "na névoa sem Surprise! o Bite age primeiro");
  assert.ok(com.fracEu < 1, "com Surprise! a Mismagius age primeiro, fracEu " + com.fracEu);
});

test("o chefão com prioridade condicional (Coil Up, Bite) também é barrado pela Queenly Majesty de quem ele enfrenta", () => {
  const ninetalesMeu = unidade("Ninetales", "Queenly Majesty", ["Heat Wave"], [0, 0, 0, 252, 0, 252], null, "Modest");
  const sem = comEf(ninetalesMeu, { bloqueiaPrioLado: false });
  const chefao = unidade("Centiskorch", "Coil Up", ["Bite"]);
  assert.equal(ninetalesMeu.ef.bloqueiaPrioLado, true, "premissa: o meu Ninetales tem Queenly Majesty");
  assert.ok(chefao.stats[5] < ninetalesMeu.stats[5], "premissa: o Ninetales é mais rápido");
  const luta = (eu) => R.resultadoDoDuelo(eu, chefao, NIVEL, { detalhe: true, fracEu: 0.3 });
  assert.equal(luta(sem).fracFoe, 1, "controle: sem a Queenly Majesty o Bite do chefão passa na frente e o Ninetales nem ataca");
  assert.ok(luta(ninetalesMeu).fracFoe < 1, "com Queenly Majesty o Ninetales (mais rápido) ataca primeiro, fracFoe " + luta(ninetalesMeu).fracFoe);
});

test("Opportunist contra Queenly Majesty: a prioridade do golpe que decide some (a luta fica igual à de quem não tem Opportunist)", () => {
  const golbat = unidade("Golbat", "Opportunist", ["Crunch"]);
  const semOpportunist = comEf(golbat, { prioNoFinal: false });
  assert.equal(golbat.ef.prioNoFinal, true, "premissa: o dado do jogo liga o Opportunist");
  const sem = comEf(ninetales, { bloqueiaPrioLado: false }); // o mesmo Ninetales sem a Queenly Majesty
  const igual = (a, b) => JSON.stringify(lutar(a, ninetales, 1)) === JSON.stringify(lutar(b, ninetales, 1));
  assert.ok(igual(golbat, semOpportunist), "contra Queenly Majesty o Opportunist não muda a luta");
  assert.notEqual(JSON.stringify(lutar(golbat, sem, 1)), JSON.stringify(lutar(semOpportunist, sem, 1)), "controle: sem Queenly Majesty o Opportunist muda a luta");
});
