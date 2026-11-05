// Ticket time-pelo-motor/01, Fase B2 (21/10/2026): juiz do time pela LUTA COMPLETA (avaliarTimePelaLutaCompleta), ao lado do
// `pontos` (que não muda). Mede a contribuição de cada membro refazendo a luta inteira contra o time do chefão, com os
// efeitos de lado da B1 (tela, Tailwind, Trick Room). Dado real: espécies e golpes do 2.65beta contra chefões de verdade,
// no nível de level cap Elite do marco (Dynamo Badge = 45, Mind Badge = 70; levelcaps.json). Nada de ef/stats à mão.
import { test } from "node:test";
import assert from "node:assert/strict";
import { R, EV, especie } from "./cenarios_do_duelo.mjs";

const boss = (nome) => {
  const b = R.BOSSES.find((x) => x.name === nome);
  assert.ok(b, "chefão inexistente: " + nome);
  return b;
};
const meu = (nivel, nome, golpes, { evs = EV.especial, nat = "Modest" } = {}) => {
  golpes.forEach((g) => assert.notEqual(R.MOVE_ID_BY_NAME[g], undefined, "golpe inexistente: " + g));
  return R.unidadeDaBuild(especie(nome), { ability: "", nature: nat, evs, item: "", moves: golpes }, nivel, null);
};
const juiz = (time, chefao, nivel, opcoes = {}) => R.avaliarTimePelaLutaCompleta(time, boss(chefao).party, nivel, opcoes);
const membro = (r, nome) => r.membros.find((m) => m.nome === nome);
const ladoComTela = () => Object.assign(R.novoLadoDuelo(), { reflect: 5 });

// ---------------------------------------------------------------- a régua distingue suporte útil de inútil
const NV = 45;
const lentos = () => [meu(NV, "Metagross", ["Meteor Mash", "Earthquake"], { evs: EV.fisico, nat: "Adamant" }), meu(NV, "Conkeldurr", ["Mach Punch", "Drain Punch"], { evs: EV.fisico, nat: "Adamant" })];
const pidgeot = () => meu(NV, "Pidgeot", ["Tailwind", "Hurricane"], { evs: EV.tanqueE });

test("suporte útil: o Tailwind que vira a luta recebe contribuição positiva clara (Archie de Slateport)", () => {
  const base = juiz(lentos(), "Archie Slateport", NV);
  assert.equal(base.venceu, false, "fixture: os dois atacantes lentos NÃO vencem sozinhos");
  const time = juiz([pidgeot(), ...lentos()], "Archie Slateport", NV);
  assert.equal(time.venceu, true, "com o Tailwind do Pidgeot os lentos passam na frente e a luta vira");
  const p = membro(time, "Pidgeot");
  assert.ok(p.contribuicaoSuporte > 5, "o efeito do Tailwind vale a luta: " + p.contribuicaoSuporte);
  assert.ok(p.contribuicao > 5, "tirar o Pidgeot do time custa a luta: " + p.contribuicao);
});

// 04/11/2026 (TK-35f): nos dados 2.65.5 o Sidney ganhou Beedrill (stats maiores) e Absol (tipo e habilidades novos) e a dupla
// Metagross+Conkeldurr deixou de render nocaute com as telas; a mesma regra (telas seguram um nocaute a mais) é medida com o
// Garchomp na base contra o Sidney 4 (mesmo nível 70).
test("suporte útil: Reflect e Light Screen do Klefki seguram um nocaute a mais contra o Sidney 4", () => {
  const atk = () => [meu(70, "Metagross", ["Meteor Mash", "Earthquake"], { evs: EV.fisico, nat: "Adamant" }), meu(70, "Conkeldurr", ["Mach Punch", "Drain Punch"], { evs: EV.fisico, nat: "Adamant" }), meu(70, "Garchomp", ["Earthquake", "Dragon Claw"], { evs: EV.fisico, nat: "Jolly" })];
  const klefki = () => meu(70, "Klefki", ["Reflect", "Light Screen", "Dazzling Gleam"], { evs: EV.tanqueF });
  assert.equal(juiz(atk(), "Sidney 4", 70).venceu, false, "fixture: a base não vence sozinha");
  const k = membro(juiz([klefki(), ...atk()], "Sidney 4", 70), "Klefki");
  assert.ok(k.contribuicaoSuporte >= 1, "as telas valem pelo menos um nocaute: " + k.contribuicaoSuporte);
});

// B4 (decisão do Felipe, 21/10): tela, Aurora Veil e Tailwind só entram quando a luta NÃO é vencida sem eles, como o Trick Room.
// Antes, as telas do Klefki gastavam o turno e o time perdia uma luta que ele vencia atacando (contribuição de suporte -9,2).
test("suporte que atrapalha não é usado: as telas do Klefki contra o Brawly 1 (nível 55) deixam de fazer o time perder", () => {
  const atk = () => [meu(55, "Metagross", ["Meteor Mash", "Earthquake"], { evs: EV.fisico, nat: "Adamant" }), meu(55, "Conkeldurr", ["Mach Punch", "Drain Punch"], { evs: EV.fisico, nat: "Adamant" })];
  const klefki = () => meu(55, "Klefki", ["Reflect", "Light Screen", "Dazzling Gleam"], { evs: EV.tanqueF });
  assert.equal(juiz(atk(), "Brawly 1", 55).venceu, false, "fixture: a base sozinha não vence");
  const r = juiz([klefki(), ...atk()], "Brawly 1", 55);
  assert.equal(r.venceu, true, "com o Klefki atacando a luta é vencida");
  assert.ok(membro(r, "Klefki").contribuicaoSuporte >= 0, "as telas não podem custar a luta: " + membro(r, "Klefki").contribuicaoSuporte);
});

// Cenário migrado (04/11/2026, dado 2.65.5): o líder do Tabitha Mt Chimney ganhou Taunt (Whimsicott Prankster), que barra o Tailwind. Fixture: er-config TrainerList.textproto:79686 (SPECIES_WHIMSICOTT) e :79696 (MOVE_TAUNT) do TRAINER_TABITHA_MT_CHIMNEY (data/bosses.json igual); a regra e a asserção são as mesmas, contra o Sidney 2.
test("suporte inútil: o Tailwind que não muda a ordem (atacantes já mais rápidos que o chefão) fica em ~0", () => {
  const rapidos = () => [meu(NV, "Garchomp", ["Earthquake", "Dragon Claw"], { evs: EV.fisico, nat: "Jolly" }), meu(NV, "Dragonite", ["Extreme Speed", "Dragon Claw"], { evs: EV.fisico, nat: "Adamant" })];
  const time = [pidgeot(), ...rapidos()];
  const foes = boss("Sidney 2").party.map((m) => R.foeDeDuelo(m, NV, null));
  const aplicou = R.simularLutaContraChefao(time, foes, NV, { statusNoFim: [] }).log.some((l) => l.lados && l.lados.meu.vento > 0);
  assert.ok(aplicou, "fixture: o motor de fato põe o Tailwind (senão o ~0 seria vazio)");
  const r = juiz(time, "Sidney 2", NV);
  assert.ok(Math.abs(membro(r, "Pidgeot").contribuicaoSuporte) < 0.05, "Tailwind sem efeito na ordem: " + membro(r, "Pidgeot").contribuicaoSuporte);
});

test("quem não tem golpe de lado não tem contribuição de suporte (null), só a do membro", () => {
  const r = juiz([pidgeot(), ...lentos()], "Archie Slateport", NV);
  assert.equal(membro(r, "Metagross").contribuicaoSuporte, null);
  assert.equal(typeof membro(r, "Metagross").contribuicao, "number");
});

test("atacante que vence sozinho continua bem avaliado (Dragonite contra o Archie de Slateport)", () => {
  const dragonite = () => meu(NV, "Dragonite", ["Extreme Speed", "Dragon Claw"], { evs: EV.fisico, nat: "Adamant" });
  assert.equal(juiz([dragonite()], "Archie Slateport", NV).venceu, true, "fixture: a Dragonite vence sozinha");
  const r = juiz(lentos().slice(0, 1).concat(dragonite()), "Archie Slateport", NV);
  assert.equal(r.venceu, true);
  assert.ok(membro(r, "Dragonite").contribuicao > 6, "tirar a Dragonite custa a vitória: " + membro(r, "Dragonite").contribuicao);
  assert.ok(membro(r, "Dragonite").contribuicao > membro(r, "Metagross").contribuicao);
});

test("a nota do juiz é a do duelo completo do time (mesma conta do simulador); sozinho, sem o membro o time é vazio (0)", () => {
  const time = [pidgeot(), ...lentos()];
  const party = boss("Archie Slateport").party;
  const foes = party.map((m) => R.foeDeDuelo(m, NV, R.climaDoTimeDoChefao(party)));
  assert.equal(juiz(time, "Archie Slateport", NV).nota, R.simularLutaContraChefao(time, foes, NV, null).pontos);
  const sozinho = juiz([lentos()[0]], "Archie Slateport", NV);
  assert.equal(sozinho.membros[0].contribuicao, sozinho.nota);
});

// ---------------------------------------------------------------- buffs do líder entram na luta medida
test("os buffs ativos do líder (buffsAtivosDoChefao) entram na luta que o juiz mede (Brawly 1)", () => {
  const buffs = R.buffsAtivosDoChefao("Brawly 1");
  assert.ok(buffs.includes("brawly_attack") && buffs.includes("brawly_spikes"), "fixture: Brawly 1 tem buffs ativos: " + buffs);
  const time = () => [meu(40, "Metagross", ["Meteor Mash", "Earthquake"], { evs: EV.fisico, nat: "Adamant" }), meu(40, "Mewtwo", ["Psychic"])];
  const sem = juiz(time(), "Brawly 1", 40);
  const com = juiz(time(), "Brawly 1", 40, { buffs });
  assert.notEqual(com.nota, sem.nota, "se o juiz ignorasse opcoes.buffs as duas notas seriam iguais");
});

// ---------------------------------------------------------------- correção B1: Brick Break só derruba a tela quando acerta
test("Brick Break derruba a tela do rival ao acertar, gastando o turno (battle_script_commands.c:12428-12431)", () => {
  const breloom = () => meu(NV, "Breloom", ["Brick Break"], { evs: EV.fisico, nat: "Adamant" });
  const foes = boss("Sidney 2").party.map((m) => R.foeDeDuelo(m, NV, null));
  const com = R.simularLutaContraChefao([breloom()], foes, NV, { statusNoFim: [], ladoDele: ladoComTela() }).log[0];
  const sem = R.simularLutaContraChefao([breloom()], foes, NV, { statusNoFim: [] }).log[0];
  assert.equal(com.lados.dele.reflect, 0, "a tela caiu antes da luta");
  assert.ok(com.fracEu < sem.fracEu, "o turno do Brick Break custou HP: " + com.fracEu + " < " + sem.fracEu);
});

test("Brick Break não derruba a tela de chefão Fantasma: Fighting não acerta Ghost", () => {
  const breloom = meu(NV, "Breloom", ["Brick Break"], { evs: EV.fisico, nat: "Adamant" });
  // Courtney deixou de abrir com Ghost: o líder dela é o Ninetales, que no Rework é Fire puro. Fixture: er-config TrainerList.textproto:9460 (TRAINER_COURTNEY_METEOR_FALLS, SPECIES_NINETALES) e 30f0f5a SpeciesList.textproto:5736. A Phoebe abre com Ghost.
  const foes = boss("Phoebe").party.map((m) => R.foeDeDuelo(m, NV, null));
  assert.ok(foes[0].tipos.includes("Ghost"), "fixture: o primeiro da Phoebe é Ghost");
  const l = R.simularLutaContraChefao([breloom], foes, NV, { statusNoFim: [], ladoDele: ladoComTela() }).log[0];
  assert.equal(l.lados.dele.reflect, 5, "imune: o golpe não acerta e a tela fica");
});
