// Ticket time-pelo-motor/01, Fase B1 (20/10/2026): Reflect, Light Screen, Aurora Veil, Tailwind e Trick Room são
// estado do LADO (do campo, no caso do Trick Room), com turnos restantes, e passam de um membro para o próximo como
// os hazards e o clima. Regras e arquivo:linha do er-repo (ramo upcoming, commit 217dd0f) em
// docs/tickets/time-pelo-motor/fase-b-evidencia.md e docs/decisoes_mecanicas.md.
// Dado real: espécies e golpes do 2.65beta contra o time de chefões de verdade (Archie nível 70, Wattson 5 e Phoebe 2
// nível 80); o nível é o do Elite no marco da luta (levelcaps.json). Nada de ef/stats à mão.
import { test } from "node:test";
import assert from "node:assert/strict";
import { R, EV, especie } from "./cenarios_do_duelo.mjs";

const bossNomeado = (nome) => R.BOSSES.find((b) => b.name === nome);
const foesDe = (nome, nivel) => bossNomeado(nome).party.map((m) => R.foeDeDuelo(m, nivel, null));
const foeDe = (nome, especieNome, nivel) => R.foeDeDuelo(bossNomeado(nome).party.find((m) => m.n === especieNome), nivel, null);
const meu = (nivel, nome, golpes, { hab = "", item = "", evs = EV.especial, nat = "Modest", clima = null } = {}) => {
  golpes.forEach((g) => assert.notEqual(R.MOVE_ID_BY_NAME[g], undefined, "golpe inexistente: " + g));
  if (hab) assert.notEqual(R.ABILITY_ID_BY_NAME[hab], undefined, "habilidade inexistente: " + hab);
  return R.unidadeDaBuild(especie(nome), { ability: hab, nature: nat, evs, item, moves: golpes }, nivel, clima);
};
const SEM_INICIO = { statusNoFim: [] };
const lado = (parcial = {}) => Object.assign(R.novoLadoDuelo(), parcial);

// ---------------------------------------------------------------- duração, Light Clay, turno do uso, persistência
const archie = (item) => [
  meu(70, "Lugia", ["Light Screen", "Reflect", "Aeroblast"], { evs: EV.tanqueE, item }),
  meu(70, "Metagross", ["Meteor Mash"], { evs: EV.fisico, nat: "Adamant" }),
  meu(70, "Mewtwo", ["Psychic"]),
];
const luta = (time, foes, nivel, inicio = SEM_INICIO) => R.simularLutaContraChefao(time, foes, nivel, inicio);

test("Reflect e Light Screen postos por golpe: 5 turnos, sem contar o turno do uso (battle_util.h:63; battle_util.c:1799)", () => {
  const s = luta(archie(""), foesDe("Archie", 70), 70);
  const primeiro = s.log[0];
  assert.equal(primeiro.meu, "Lugia", "fixture: a Lugia abre contra a Phione");
  // 5 e não 4: o turno do uso (started) não decrementa, então a luta seguinte vê os 5 inteiros.
  assert.equal(primeiro.lados.meu.reflect, 5);
  assert.equal(primeiro.lados.meu.luz, 5);
});

test("Light Clay estende a tela de 5 para 8 turnos (battle_script_commands.c:9353, 10286)", () => {
  const sem = luta(archie(""), foesDe("Archie", 70), 70).log[0].lados.meu;
  const com = luta(archie("Light Clay"), foesDe("Archie", 70), 70).log[0].lados.meu;
  assert.deepEqual([sem.reflect, sem.luz], [5, 5]);
  assert.deepEqual([com.reflect, com.luz], [8, 8]);
});

test("a tela passa para o próximo Pokémon do time e cai pelos turnos de cada duelo", () => {
  const s = luta(archie(""), foesDe("Archie", 70), 70);
  const [a, b, c] = s.log;
  assert.equal(a.meu, "Lugia");
  assert.equal(b.meu, "Lugia");
  assert.equal(b.lados.meu.reflect, 5 - a.turnos, "o 2º duelo do mesmo Pokémon vê os turnos que sobraram");
  // A Lugia cai no 2º duelo; quem entra depois (Mewtwo) herda o que sobrou, sem pôr nada de novo.
  assert.equal(c.meu, "Mewtwo");
  assert.ok(c.lados.meu.reflect > 0, "a tela sobrevive à troca/desmaio de quem a pôs");
  assert.equal(c.lados.meu.reflect, 5 - a.turnos - b.turnos);
  assert.equal(c.lados.meu.luz, c.lados.meu.reflect);
});

test("sem o golpe de tela o lado fica vazio (o teste acima não é efeito colateral do resto)", () => {
  const time = [meu(70, "Lugia", ["Aeroblast"], { evs: EV.tanqueE }), meu(70, "Mewtwo", ["Psychic"])];
  luta(time, foesDe("Archie", 70), 70).log.forEach((l) => assert.deepEqual([l.lados.meu.reflect, l.lados.meu.luz, l.lados.meu.veu], [0, 0, 0]));
});

// ---------------------------------------------------------------- dano das telas no 1x1
const NV = 70;
const duelo = (a, f, ladoFoe, ladoEu = {}) => R.resultadoDoDuelo(a, f, NV, { detalhe: true, lados: { eu: lado(ladoEu), foe: lado(ladoFoe) }, sala: 0 });
const causado = (r) => 1 - r.fracFoe;

test("tela corta o dano pela metade em 1x1: Reflect só o físico, Light Screen só o especial, Aurora Veil os dois (battle_util.c:7648-7655)", () => {
  const dread = foeDe("Archie", "Dreadnaut", NV);
  const fis = () => meu(NV, "Metagross", ["Meteor Mash"], { evs: EV.fisico, nat: "Adamant" });
  const esp = () => meu(NV, "Mewtwo", ["Psychic"]);
  const base = causado(duelo(fis(), dread, {}));
  assert.ok(causado(duelo(fis(), dread, { reflect: 5 })) < base * 0.4, "Reflect segura o golpe físico");
  assert.equal(causado(duelo(fis(), dread, { luz: 5 })), base, "Light Screen não mexe no físico");
  assert.ok(causado(duelo(fis(), dread, { veu: 5 })) < base * 0.4, "Aurora Veil segura o físico");
  const baseE = causado(duelo(esp(), dread, {}));
  assert.equal(causado(duelo(esp(), dread, { reflect: 5 })), baseE, "Reflect não mexe no especial");
  assert.ok(causado(duelo(esp(), dread, { luz: 5 })) < baseE * 0.45, "Light Screen segura o especial");
});

test("a tela não vale com Infiltrator, e não vale em crítico (golpe que sempre acerta crítico passa direto)", () => {
  const dread = foeDe("Archie", "Dreadnaut", NV);
  const infiltra = () => meu(NV, "Mewtwo", ["Psychic"], { hab: "Infiltrator" });
  assert.equal(causado(duelo(infiltra(), dread, { luz: 5 })), causado(duelo(infiltra(), dread, {})), "Infiltrator ignora a tela");
  const garchomp = foeDe("Archie", "Garchomp Redux", NV);
  const gelo = () => meu(NV, "Articuno", ["Frost Breath"]); // Frost Breath: sempre crítico
  assert.equal(causado(duelo(gelo(), garchomp, { luz: 5 })), causado(duelo(gelo(), garchomp, {})), "crítico garantido passa pela tela");
  // O mesmo Pokémon com golpe sem crítico garantido leva o corte (um pouco acima de 0,5: a chance de crítico não corta).
  const psy = () => meu(NV, "Mewtwo", ["Psychic"]);
  const f1 = causado(duelo(psy(), garchomp, { luz: 5 })), f0 = causado(duelo(psy(), garchomp, {}));
  assert.ok(f1 / f0 > 0.5 && f1 / f0 < 0.6, "razão " + (f1 / f0).toFixed(3));
});

test("a tela só cobre os turnos que restam: 1 turno de tela num duelo de 2 não corta o dano todo", () => {
  const dread = foeDe("Archie", "Dreadnaut", NV);
  const esp = () => meu(NV, "Mewtwo", ["Psychic"]);
  const cheio = duelo(esp(), dread, { luz: 5 }), umTurno = duelo(esp(), dread, { luz: 1 }), sem = duelo(esp(), dread, {});
  assert.equal(cheio.turnos, 2);
  assert.ok(causado(umTurno) > causado(cheio) && causado(umTurno) < causado(sem));
});

// ---------------------------------------------------------------- Aurora Veil só no granizo
test("Aurora Veil por golpe só entra no granizo ou com Aurora Borealis, e Light Clay vale 8 (battle_script_commands.c:7776-7788)", () => {
  // Darkrai do Sidney 4: a Regice só vence com o Aurora Veil (B4, 21/10: sem precisar, o golpe de tela não é usado); o Rotom Wash do Wattson 5 ela vence atacando.
  const foes = () => [foeDe("Sidney 4", "Darkrai", 80)];
  const regice = (clima, hab = "") => [meu(80, "Regice", ["Aurora Veil", "Surf"], { evs: EV.tanqueE, item: "Light Clay", clima, hab })];
  assert.equal(luta(regice("granizo"), foes(), 80).log[0].lados.meu.veu, 8, "no granizo, com Light Clay");
  assert.equal(luta(regice(null), foes(), 80).log[0].lados.meu.veu, 0, "sem granizo o golpe falha");
  assert.equal(luta(regice(null, "Aurora Borealis"), foes(), 80).log[0].lados.meu.veu, 8, "Aurora Borealis vale como granizo");
});

// ---------------------------------------------------------------- Tailwind
test("Tailwind (Air Blower, 3 turnos) passa a quem vem depois, dos dois lados do campo, e cai a cada turno (battle_util.c:1930)", () => {
  const time = [meu(70, "Lugia", ["Aeroblast"], { evs: EV.tanqueE }), meu(70, "Metagross", ["Meteor Mash"], { evs: EV.fisico, nat: "Adamant" }), meu(70, "Mewtwo", ["Psychic"])];
  const s = luta(time, foesDe("Archie", 70), 70);
  const comVento = s.log.filter((l) => l.lados.dele.vento > 0);
  assert.ok(comVento.length >= 3, "fixture: a Kilowattrel (Air Blower) entra e o vento dura mais de um duelo");
  assert.equal(comVento[0].contra, "Kilowattrel");
  assert.equal(comVento[0].lados.dele.vento, 3);
  assert.equal(comVento[1].lados.dele.vento, 3 - comVento[0].turnos);
  assert.notEqual(comVento[1].meu, comVento[0].meu, "outro membro do meu time enfrenta o vento que sobrou");
  // O vento é do lado, não da Kilowattrel: o próximo do chefão (Garchomp Redux) entra com ele.
  assert.ok(comVento.some((l) => l.contra === "Garchomp Redux"));
});

test("Tailwind dobra a Speed na ordem do turno e só enquanto dura", () => {
  const meuMewtwo = () => meu(70, "Mewtwo", ["Psychic"]);
  const kilo = foeDe("Archie", "Kilowattrel", 70);
  const par = (ventoEu, ventoFoe) => R.resultadoDoDuelo(meuMewtwo(), kilo, 70, { soPar: true, lados: { eu: lado({ vento: ventoEu }), foe: lado({ vento: ventoFoe }) }, sala: 0 });
  const base = par(0, 0);
  assert.ok(base.turnos >= 1 && base.turnos <= 3, "pré-condição: duelo curto");
  assert.equal(par(3, 0).v1, base.v1 * 2, "meu vento dobra a minha Speed");
  assert.equal(par(0, 3).v2, base.v2 * 2, "o vento do chefão dobra a dele");
  assert.equal(par(base.turnos - 1, 0).v1, base.v1, "vento que acaba antes do turno que decide não conta");
});

// ---------------------------------------------------------------- Trick Room
test("Trick Room: novo uso desliga, turno do uso fora da conta, 5 turnos, permanente (> 10) não alterna", () => {
  assert.equal(R.alternaSalaDuelo(0, false), 5, "liga com os 5 turnos (battle_util.h:56)");
  assert.equal(R.alternaSalaDuelo(5, false), 0, "usar de novo desliga (HandleRoomMove, battle_script_commands.c:11891)");
  assert.equal(R.alternaSalaDuelo(2, false), 0);
  assert.equal(R.alternaSalaDuelo(255, true), 255, "permanente: o golpe nem alterna (battle_script_commands.c:11908)");
});

test("Trick Room do chefão (Cofagrigus da Phoebe 2) vira estado do campo e atravessa os membros do meu time", () => {
  const time = [meu(80, "Lugia", ["Aeroblast"], { evs: EV.tanqueE }), meu(80, "Mewtwo", ["Psychic"]), meu(80, "Metagross", ["Meteor Mash"], { evs: EV.fisico, nat: "Adamant" })];
  const s = luta(time, foesDe("Phoebe 2", 80), 80);
  assert.equal(s.log[0].contra, "Cofagrigus");
  assert.equal(s.log[0].lados.sala, 5, "Trick Room de 5 turnos, sem o turno do uso");
  assert.equal(s.log[1].lados.sala, 5 - s.log[0].turnos, "o 2º membro vê o que sobrou");
  assert.notEqual(s.log[1].meu, s.log[0].meu);
});

test("Trick Room de habilidade de entrada (Twist. Dimension): 3 turnos, no campo, passa ao membro seguinte", () => {
  const time = [meu(80, "Mewtwo", ["Psychic"], { hab: "Twist. Dimension" }), meu(80, "Metagross", ["Meteor Mash"], { evs: EV.fisico, nat: "Adamant" })];
  const s = luta(time, foesDe("Wattson 5", 80), 80);
  assert.equal(s.log[0].lados.sala, 3);
  assert.equal(s.log[1].lados.sala, Math.max(0, 3 - s.log[0].turnos));
});

test("Trick Room permanente do chefão (Tate & Liza) segue valendo mesmo sem estado de campo: inverte a ordem sempre", () => {
  const regra = R.regraDeCampoDoChefao("Tate And Liza 3");
  assert.ok(regra && regra.sala, "fixture: a revanche da Tate & Liza tem Trick Room permanente");
  const foe = R.foesComRegraDeCampo([foeDe("Tate And Liza 3", "Cresselia", 70)], regra)[0];
  const outro = foeDe("Tate And Liza 3", "Cresselia", 70);
  const par = (f) => R.resultadoDoDuelo(meu(70, "Mewtwo", ["Psychic"]), f, 70, { soPar: true, lados: { eu: lado(), foe: lado() }, sala: 0 });
  assert.ok(par(foe).v1 < 0 && par(foe).v2 < 0, "Speed invertida (Trick Room ativo)");
  assert.ok(par(outro).v1 > 0 && par(outro).v2 > 0, "sem a regra, ordem normal");
});

// ---------------------------------------------------------------- remoção: Brick Break, Defog, Screen Cleaner
const comTelaDoChefao = { statusNoFim: [], ladoDele: { reflect: 8, luz: 8 } }; // as 8 voltas de Reflect/Light Screen do Tapu Koko (Wattson 5, Light Clay)

// Brick Break: desde a B2 (21/10) só derruba a tela quando acerta e gasta o turno; testes em juiz_do_time.test.mjs.

test("Defog tira as telas do rival (battle_script_commands.c:6534-6537), gastando o turno", () => {
  const rotom = () => [foeDe("Wattson 5", "Rotom Wash", 80)];
  const comDefog = luta([meu(80, "Giratina", ["Defog", "Shadow Ball"], { evs: EV.tanqueE })], rotom(), 80, comTelaDoChefao).log[0];
  const semDefog = luta([meu(80, "Giratina", ["Shadow Ball"], { evs: EV.tanqueE })], rotom(), 80, comTelaDoChefao).log[0];
  assert.equal(comDefog.venceu, true, "fixture: a Giratina vence mesmo gastando o turno");
  assert.deepEqual([comDefog.lados.dele.reflect, comDefog.lados.dele.luz], [0, 0]);
  assert.deepEqual([semDefog.lados.dele.reflect, semDefog.lados.dele.luz], [8, 8]);
});

test("Screen Cleaner limpa as telas dos dois lados ao entrar (battle_util.c:8390-8413) e pode pôr de novo (telaRepete)", () => {
  const zekrom = () => [foeDe("Wattson 5", "Zekrom", 80)];
  const limpa = luta([meu(80, "Mewtwo", ["Psychic"], { hab: "Screen Cleaner" })], zekrom(), 80, comTelaDoChefao).log[0].lados.dele;
  assert.deepEqual([limpa.reflect, limpa.luz], [0, 0]);
  const efDe = (nome) => meu(80, "Mewtwo", ["Psychic"], { hab: nome }).ef;
  assert.equal(efDe("Screen Cleaner").telaRepete, true);
  assert.equal(efDe("Infiltrator").telaRepete, false);
});

// ---------------------------------------------------------------- habilidade de entrada com duração curta
test("North Wind: Aurora Veil de 3 turnos na entrada, 5 com Light Clay (abilities.cc:4462-4464)", () => {
  const foes = () => foesDe("Wattson 5", 80);
  const com = luta([meu(80, "Mewtwo", ["Psychic"], { hab: "North Wind", item: "Light Clay" })], foes(), 80).log[0].lados.meu.veu;
  const sem = luta([meu(80, "Mewtwo", ["Psychic"], { hab: "North Wind" })], foes(), 80).log[0].lados.meu.veu;
  assert.deepEqual([sem, com], [3, 5]);
});

test("Air Blower do meu lado: Tailwind de 3 turnos na entrada (abilities.cc:1367) segue para o membro seguinte", () => {
  const time = [meu(80, "Mewtwo", ["Psychic"], { hab: "Air Blower" }), meu(80, "Metagross", ["Meteor Mash"], { evs: EV.fisico, nat: "Adamant" })];
  const s = luta(time, foesDe("Wattson 5", 80), 80);
  assert.equal(s.log[0].lados.meu.vento, 3);
  assert.equal(s.log[1].lados.meu.vento, 3 - s.log[0].turnos);
});

// Clueless (id 426, "Negates Weather, Rooms and Terrains"): ROOM_HAS_EFFECT e IsTrickRoomActive/IsInverseRoomActive/
// IsGravityActive dão FALSE com ela em campo (er-repo include/battle_util.h:48, src/battle_util.c:8704-8740).
test("Clueless no meu lado anula o Trick Room de 5 turnos do chefão (Cofagrigus da Phoebe 2)", () => {
  const duelo = (hab, sala) => R.resultadoDoDuelo(meu(80, "Lugia", ["Aeroblast"], { hab }), foeDe("Phoebe 2", "Cofagrigus", 80), 80,
    { sala, lados: { eu: lado(), foe: lado() }, detalhe: true });
  assert.notEqual(duelo("", 5).fracFoe, duelo("", 0).fracFoe, "pré-condição: sem Clueless a sala muda a luta");
  assert.deepEqual(duelo("Clueless", 5), duelo("Clueless", 0), "com Clueless a sala não pesa");
});
