// Prioridade no duelo (14/10/2026): golpe com prioridade (de base OU condicional: Coil Up, Sidewinder, Cutthroat, Edgelord,
// On the Prowl, "HP cheio" de Gale Wings e parecidas, Opportunist) contra Queenly Majesty/Dazzling/Armor Tail ou Psychic
// Terrain com o alvo no chão FALHA inteiro (abilities.cc Impl<ABILITY_QUEENLY_MAJESTY> onImmune: GetMovePriority > 0;
// battle_util.c CANCELLER_PSYCHIC_TERRAIN: GetChosenMovePriority > 0). A prioridade condicional entra em GetMovePriority
// (battle_main.c), então vale o mesmo. Coil Up gasta o estado no fim do turno (ENDTURN_COILED_UP): o 1º golpe falho é um
// turno perdido. Opportunist (abilities.cc: +1 com o alvo em HP <= metade) dá +1 a QUALQUER golpe depois da metade: todo
// golpe falha, e só derruba o alvo quem o faz com UM golpe dado acima da metade. A prioridade do Opportunist só vale no
// turno em que o alvo já está na metade (não na luta inteira). Surprise! continua aproximação (zera a prioridade).
// Decisões em docs/decisoes_mecanicas.md. Luta completa sempre com dado real (Etapa da Meteor Falls, nível 55).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const NIVEL = 55;
const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" });
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const courtney = R.BOSSES.find((b) => b.name === "Courtney Meteor Falls");
const comEf = (u, extra) => Object.assign({}, u, { ef: Object.assign({}, u.ef, extra) });
// O golpe de prioridade do chefão (Flame Burst) deixaria o chefão na frente por conta própria; fora dele só conta a ordem do atacante.
const semPrioridade = (f) => Object.assign({}, f, { golpesProntos: f.golpesProntos.filter((g) => !(g.prio > 0)) });
const ninetales = semPrioridade(R.foeDeDuelo(courtney.party[0], NIVEL, null)); // Queenly Majesty, mais rápido que o Centiskorch
const ninetalesSemQueenly = comEf(ninetales, { bloqueiaPrioLado: false }); // o mesmo Ninetales sem a habilidade (controle)
const alakazam = semPrioridade(R.foeDeDuelo(courtney.party[1], NIVEL, null)); // sem habilidade de bloqueio
const alakazamQueenly = comEf(alakazam, { bloqueiaPrioLado: true }); // Alakazam com a Queenly Majesty (cópia só para a luta)
const unidade = (n, hab, moves, evs, clima, nat) => R.unidadeDaBuild(sp(n),
  { ability: hab, nature: nat || "Adamant", evs: evs || [0, 252, 0, 0, 0, 252], item: "", moves }, NIVEL, clima || null);
const lutar = (eu, foe, fracFoe, fracEu) => R.resultadoDoDuelo(eu, foe, NIVEL, { detalhe: true, fracFoe, fracEu });
const forma = (r) => JSON.stringify(r); // compara a luta inteira (os objetos vêm de outro contexto)
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

test("Surprise! na névoa zera a prioridade condicional (aproximação); sem névoa ela não faz nada", () => {
  const u = { ef: efDe([]) };
  assert.equal(R.temPrioridadeNoDuelo(u, danoSemPrio, 1, { ef: efDe(["Surprise!"], "nevoa") }), false);
  assert.equal(R.temPrioridadeNoDuelo(u, danoSemPrio, 1, { ef: efDe(["Surprise!"]) }), true);
});

test("Opportunist: a prioridade só vale no turno em que o alvo já está na metade do HP", () => {
  const u = { ef: efDe(["Opportunist"]) };
  const dano = { melhor: { prio: 0, golpe: { nome: "T", prio: 0, prioCheio: false } } };
  assert.equal(R.temPrioridadeNoDuelo(u, dano, 2, { ef: efDe([]) }), true, "regra antiga (sem informar o turno): o golpe que decide, 2 ou mais");
  assert.equal(R.temPrioridadeNoDuelo(u, dano, 3, { ef: efDe([]) }, { turno: 1, ateMetade: 1 }), false, "turno 1: o alvo ainda está com HP cheio");
  assert.equal(R.temPrioridadeNoDuelo(u, dano, 3, { ef: efDe([]) }, { turno: 2, ateMetade: 1 }), true, "turno 2: o 1º golpe já levou o alvo à metade");
  assert.equal(R.temPrioridadeNoDuelo(u, dano, 3, { ef: efDe([]) }, { turno: 2, ateMetade: 2 }), false, "ainda faltava um golpe para a metade");
  assert.equal(R.temPrioridadeNoDuelo(u, dano, 1, { ef: efDe([]) }, { turno: 1, ateMetade: 0 }), true, "alvo que já começa na metade: prioridade já no turno 1");
  assert.equal(R.temPrioridadeNoDuelo(u, dano, 2, { ef: efDe(["Queenly Majesty"]) }, { turno: 2, ateMetade: 1 }), false, "Queenly Majesty barra");
  assert.equal(R.temPrioridadeNoDuelo(u, dano, 2, { ef: efDe(["Surprise!"], "nevoa") }, { turno: 2, ateMetade: 1 }), false, "Surprise! zera");
});

test("golpe com prioridade de base continua valendo na função (o filtro do danoNoDuelo é quem o remove contra o bloqueio)", () => {
  const dano = { melhor: { prio: 1, golpe: { nome: "Mach Punch", prio: 1 } } };
  assert.equal(R.temPrioridadeNoDuelo({ ef: efDe([]) }, dano, 1, { ef: efDe(["Queenly Majesty"]) }), true);
});

// ---------- Coil Up e as outras do 1º golpe: o golpe falha, é um turno perdido ----------
test("Coil Up: o Bite do Centiskorch age antes do Alakazam, mas contra a Queenly Majesty do Ninetales ele FALHA (turno perdido) e o Centiskorch cai sem acertar", () => {
  const cent = unidade("Centiskorch", "Coil Up", ["Bite"]);
  assert.equal(cent.golpesProntos[0].prioPrimeiro, true, "premissa: o Bite leva a prioridade do 1º uso");
  assert.ok(cent.stats[5] < ninetales.stats[5] && cent.stats[5] < alakazam.stats[5], "premissa: o Centiskorch é mais lento que os dois");
  const contraAlakazam = lutar(cent, alakazam, 0.8), contraNinetales = lutar(cent, ninetales, 0.8);
  assert.equal(contraAlakazam.venceu, true);
  assert.equal(contraAlakazam.fracEu, 1, "com a prioridade o Bite derruba o Alakazam antes de ele agir");
  assert.equal(contraAlakazam.turnos, 1);
  assert.equal(contraNinetales.venceu, false, "o Ninetales (mais rápido) derruba o Centiskorch em 2 golpes e o Bite do 1º turno falhou");
  assert.ok(Math.abs(contraNinetales.fracFoe - 0.8) < 1e-9, "o 1º Bite falhou: o Ninetales não perdeu HP nenhum");
});

test("Coil Up gasta um turno, não a luta: quem aguenta ainda vence, depois de levar um golpe a mais (Steelix x Alakazam com Queenly Majesty)", () => {
  const steelix = unidade("Steelix", "Coil Up", ["Thunder Fang"], [252, 252, 0, 0, 0, 0]);
  assert.equal(steelix.golpesProntos[0].prioPrimeiro, true);
  const com = lutar(steelix, alakazamQueenly, 0.5), sem = lutar(steelix, alakazam, 0.5);
  assert.equal(sem.venceu, true);
  assert.equal(sem.fracEu, 1, "sem Queenly Majesty o Thunder Fang age antes e derruba");
  assert.equal(sem.turnos, 1);
  assert.equal(com.venceu, true, "o Steelix aguenta o golpe a mais");
  assert.equal(com.turnos, 2, "o 1º Thunder Fang falhou: são dois turnos");
  assert.ok(com.fracEu < 1, "o Alakazam bate no turno perdido, fracEu " + com.fracEu);
});

test("Coil Up contra Queenly Majesty com Mold Breaker (habilidade ignorada): o Bite não falha e a prioridade volta", () => {
  const cent = comEf(unidade("Centiskorch", "Coil Up", ["Bite"]), { quebraHabilidade: true });
  const r = lutar(cent, ninetales, 0.8);
  assert.equal(r.fracEu, 1);
  assert.equal(r.turnos, 1);
});

test("o golpe de HP cheio (Gale Wings) falha contra a Queenly Majesty quando sai com o HP cheio, e funciona com o HP já gasto", () => {
  // O Bite do Centiskorch marcado como "HP cheio" (prioCheio sem prioPrimeiro), como o golpe Flying da Gale Wings.
  const cent = unidade("Centiskorch", "Coil Up", ["Bite"]);
  const cheio = Object.assign({}, cent, { golpesProntos: cent.golpesProntos.map((g) => Object.assign({}, g, { prioPrimeiro: false, prioCheio: true })) });
  const comHpCheio = lutar(cheio, alakazamQueenly, 0.8, 1), comHpGasto = lutar(cheio, alakazamQueenly, 0.8, 0.9);
  assert.equal(comHpCheio.venceu, false, "HP cheio: o Bite sai com +1 e falha (turno perdido); o Alakazam mais rápido derruba");
  assert.equal(comHpGasto.venceu, true, "com o HP já gasto o Bite sai sem a prioridade e sem falhar: um golpe derruba");
});

// ---------- Psychic Terrain: o golpe com prioridade falha ----------
test("Psychic Terrain (Indeedee com Psychic Surge): o Bite com prioridade do Centiskorch falha; sem o terreno ele age antes e derruba", () => {
  const cent = unidade("Centiskorch", "Coil Up", ["Bite"]);
  const indeedee = (hab) => unidade("Indeedee Female", hab, ["Psychic"], [0, 0, 0, 252, 0, 252], null, "Modest");
  assert.ok(cent.stats[5] < indeedee("Psychic Surge").stats[5], "premissa: a Indeedee é mais rápida");
  const sem = lutar(cent, indeedee("Own Tempo"), 0.4), com = lutar(cent, indeedee("Psychic Surge"), 0.4);
  assert.equal(sem.venceu, true);
  assert.equal(sem.fracEu, 1, "sem terreno o Bite tem prioridade e derruba antes de ela agir");
  assert.equal(com.venceu, false, "no Psychic Terrain o 1º Bite falha e a Indeedee mais rápida derruba o Centiskorch");
  assert.ok(Math.abs(com.fracFoe - 0.4) < 1e-9, "o Bite que falhou não tirou HP");
});

test("Psychic Terrain: o golpe de prioridade de BASE (Mach Punch) também falha inteiro, não só perde a prioridade", () => {
  const machamp = unidade("Machamp", "No Guard", ["Mach Punch"]);
  assert.ok(machamp.golpesProntos[0].prio > 0, "premissa: o Mach Punch tem prioridade");
  const indeedee = (hab) => unidade("Indeedee Female", hab, ["Psychic"], [0, 0, 0, 252, 0, 252], null, "Modest");
  assert.ok(lutar(machamp, indeedee("Own Tempo")).fracFoe < 1, "controle: sem o terreno o Mach Punch acerta");
  assert.equal(lutar(machamp, indeedee("Psychic Surge")).fracFoe, 1, "no Psychic Terrain o Mach Punch falha: nenhum dano");
});

test("Psychic Terrain só protege quem está no chão: o mesmo alvo voando (tipo Flying) não barra o golpe com prioridade", () => {
  const cent = unidade("Centiskorch", "Coil Up", ["Bite"]);
  const indeedee = unidade("Indeedee Female", "Psychic Surge", ["Psychic"], [0, 0, 0, 252, 0, 252], null, "Modest");
  const noAr = Object.assign({}, indeedee, { tipos: ["Flying", "Psychic"] });
  assert.equal(lutar(cent, indeedee, 0.4).venceu, false, "premissa: no chão o terreno faz o Bite falhar");
  const r = lutar(cent, noAr, 0.4);
  assert.equal(r.venceu, true);
  assert.equal(r.fracEu, 1, "voando, o Bite do Centiskorch mantém a prioridade e derruba antes de a Indeedee agir");
});

// ---------- Surprise!: aproximação que fica ----------
test("Surprise! (Mismagius na névoa) zera a prioridade condicional do Centiskorch (sem turno perdido); sem a habilidade a prioridade vale", () => {
  const cent = (clima) => unidade("Centiskorch", "Coil Up", ["Bite"], null, clima);
  const mismagius = (hab, clima) => unidade("Mismagius", hab, ["Shadow Ball"], [0, 0, 0, 252, 0, 252], clima, "Modest");
  assert.equal(mismagius("Surprise!", "nevoa").ef.barraPrioridade, true, "premissa: a Surprise! está ativa na névoa");
  assert.ok(cent("nevoa").stats[5] < mismagius("Levitate", "nevoa").stats[5], "premissa: a Mismagius é mais rápida");
  const sem = lutar(cent("nevoa"), mismagius("Levitate", "nevoa"), 0.4), com = lutar(cent("nevoa"), mismagius("Surprise!", "nevoa"), 0.4);
  assert.equal(sem.fracEu, 1, "na névoa sem Surprise! o Bite age primeiro");
  assert.ok(com.fracEu < 1, "com Surprise! a Mismagius age primeiro, fracEu " + com.fracEu);
});

// ---------- chefão ----------
test("o chefão com prioridade condicional (Coil Up, Bite) também falha contra a Queenly Majesty de quem ele enfrenta", () => {
  const ninetalesMeu = unidade("Ninetales", "Queenly Majesty", ["Heat Wave"], [0, 0, 0, 252, 0, 252], null, "Modest");
  const sem = comEf(ninetalesMeu, { bloqueiaPrioLado: false });
  const chefao = unidade("Centiskorch", "Coil Up", ["Bite"]);
  assert.equal(ninetalesMeu.ef.bloqueiaPrioLado, true, "premissa: o meu Ninetales tem Queenly Majesty");
  assert.ok(chefao.stats[5] < ninetalesMeu.stats[5], "premissa: o Ninetales é mais rápido");
  const luta = (eu) => R.resultadoDoDuelo(eu, chefao, NIVEL, { detalhe: true, fracEu: 0.3 });
  assert.equal(luta(sem).fracFoe, 1, "controle: sem a Queenly Majesty o Bite do chefão passa na frente e o Ninetales nem ataca");
  assert.ok(luta(ninetalesMeu).fracFoe < 1, "com Queenly Majesty o Ninetales (mais rápido) ataca primeiro, fracFoe " + luta(ninetalesMeu).fracFoe);
});

// ---------- Opportunist ----------
// Drapion: Opportunist (habilidade), mais lento que o Ninetales (Spe 161 x 166), que o derruba em 2 golpes.
const drapion = (golpe) => unidade("Drapion", "Opportunist", [golpe]);
const metade = (u, foe) => R.danoNoDuelo(u, foe, NIVEL).melhor.dano / foe.stats[0];

test("Opportunist contra Queenly Majesty: com o alvo na metade do HP ou menos todo golpe falha (nenhum dano), sem a Queenly Majesty ele derruba", () => {
  const u = drapion("Crunch");
  assert.equal(u.ef.prioNoFinal, true, "premissa: o dado do jogo liga o Opportunist");
  const com = lutar(u, ninetales, 0.4), sem = lutar(u, ninetalesSemQueenly, 0.4);
  assert.equal(sem.venceu, true, "controle: sem a Queenly Majesty o Crunch derruba");
  assert.equal(com.venceu, false, "alvo já na metade: o +1 do Opportunist faz o Crunch falhar");
  assert.ok(Math.abs(com.fracFoe - 0.4) < 1e-9, "nenhum dano");
});

test("Opportunist contra Queenly Majesty: um único golpe dado acima da metade ainda derruba (o +1 só vale depois)", () => {
  const u = drapion("Crunch");
  assert.ok(metade(u, ninetales) > 1, "premissa: o Crunch derruba o Ninetales de cheio em 1 golpe");
  const r = lutar(u, ninetales, 0.8);
  assert.equal(r.venceu, true);
  assert.equal(forma(r), forma(lutar(u, ninetalesSemQueenly, 0.8)), "mesma luta que sem a Queenly Majesty");
});

test("Opportunist contra Queenly Majesty: se precisa de 2 golpes, o 1º leva o alvo à metade e o 2º falha - não derruba nunca", () => {
  const u = drapion("Earthquake");
  const com = lutar(u, ninetales, 1), sem = lutar(u, ninetalesSemQueenly, 1);
  assert.equal(sem.venceu, true, "controle: sem a Queenly Majesty os 2 golpes derrubam");
  assert.equal(com.venceu, false, "com a Queenly Majesty o 2º golpe falha");
  assert.ok(com.fracFoe > 0 && com.fracFoe < 1, "só o 1º golpe acertou, fracFoe " + com.fracFoe);
  assert.ok(com.fracFoe <= 0.5, "o 1º golpe levou o alvo à metade ou menos: é por isso que o 2º falha, fracFoe " + com.fracFoe);
});

test("Opportunist do chefão contra a Queenly Majesty de quem o enfrenta: com o meu HP na metade ou menos os golpes dele falham; com HP acima da metade o 1º golpe ainda derruba", () => {
  const meu = unidade("Ninetales", "Queenly Majesty", ["Heat Wave"], [252, 0, 0, 252, 0, 0], null, "Modest"); // mais lento que o Drapion
  const meuSem = comEf(meu, { bloqueiaPrioLado: false });
  const chefao = drapion("Crunch");
  assert.equal(meu.ef.bloqueiaPrioLado, true, "premissa: o meu Ninetales tem Queenly Majesty");
  assert.ok(meu.stats[5] < chefao.stats[5], "premissa: o Drapion é mais rápido");
  const luta = (eu, fracEu) => R.resultadoDoDuelo(eu, chefao, NIVEL, { detalhe: true, fracEu });
  assert.equal(luta(meuSem, 0.4).venceu, false, "controle: sem a Queenly Majesty o Crunch derruba o Ninetales");
  const com = luta(meu, 0.4);
  assert.equal(com.venceu, true, "meu HP já na metade: o +1 do Opportunist faz todo golpe dele falhar");
  assert.ok(Math.abs(com.fracEu - 0.4) < 1e-9, "não levei dano nenhum");
  assert.equal(luta(meu, 0.8).venceu, false, "meu HP acima da metade: o Crunch derruba em um golpe");
});

test("Opportunist: a prioridade vale no golpe que decide (Drapion de Shadow Ball x Ninetales sem Queenly Majesty: empate de golpes e o Drapion age primeiro no 2º turno)", () => {
  const u = drapion("Shadow Ball");
  const semOpportunist = comEf(u, { prioNoFinal: false });
  const com = lutar(u, ninetalesSemQueenly, 0.6), sem = lutar(semOpportunist, ninetalesSemQueenly, 0.6);
  assert.equal(com.venceu, true, "com Opportunist o Drapion vence a corrida de 2 golpes");
  assert.equal(sem.venceu, false, "sem Opportunist o Ninetales (mais rápido) vence");
});

test("Opportunist em luta PERDIDA: o motor não dá a prioridade do golpe que decide à corrida inteira (Golbat x Ninetales, o Ninetales mata em 1 golpe)", () => {
  const golbat = unidade("Golbat", "Opportunist", ["Crunch"]);
  assert.equal(golbat.ef.prioNoFinal, true);
  assert.ok(golbat.stats[5] < ninetales.stats[5], "premissa: o Golbat é mais lento");
  const r = lutar(golbat, ninetalesSemQueenly, 1);
  assert.equal(r.venceu, false);
  assert.equal(r.turnos, 1, "o Ninetales derruba o Golbat no 1º turno");
  assert.equal(r.fracFoe, 1, "o Golbat não ganha um golpe a mais: no turno 1 o alvo está com HP cheio e não há prioridade");
  assert.equal(forma(r), forma(lutar(comEf(golbat, { prioNoFinal: false }), ninetalesSemQueenly, 1)), "luta perdida igual à de quem não tem Opportunist");
});
