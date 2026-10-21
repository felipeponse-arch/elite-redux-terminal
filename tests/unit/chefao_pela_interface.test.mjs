// Ticket 07 da dívida técnica (08/10/2026), 2ª metade: a luta inteira contra o time do chefão e a
// dupla 2x2, pela entrada pública (R.simularLutaContraChefao, R.simularDuplaContraChefao e o botão
// "Montar time contra este chefão", R.montarTimeContraChefao), com Pokémon, golpes, itens e buffs
// REAIS do 2.65beta. Nenhum cenário toca em ef, stats ou golpesProntos: uma refatoração interna
// do motor não quebra nada aqui, só mudança de comportamento. Montagem dos lados:
// cenarios_do_duelo.mjs (linha, meu, lutaInteira, lutaEmDupla, candidato, montar).
import { test } from "node:test";
import assert from "node:assert/strict";
import { R, EV, NIVEL, linha, meu, lutaInteira, lutaEmDupla, candidato, montar } from "./cenarios_do_duelo.mjs";

const machamp = (o = {}) => linha("Machamp", { hab: "No Guard", golpes: ["Knock Off"], evs: EV.fisico, nat: "Adamant", ...o });
const snorlax = (o = {}) => linha("Snorlax", { hab: "Thick Fat", golpes: ["Body Slam"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant", ...o });
const garchomp = (o = {}) => linha("Garchomp", { hab: "Rough Skin", golpes: ["Outrage"], evs: EV.fisico, nat: "Jolly", ...o });
const flamejante = (nome, o = {}) => linha(nome, { golpes: ["Fire Blast"], evs: EV.especial, nat: "Modest", ...o });
const fracs = (s) => s.log.filter((l) => l.meu).map((l) => l.fracEu);
const bossPorNome = (nome) => R.BOSSES.find((b) => b.name === nome);
const nomesDe = (r) => r.escolhidos.map((e) => e.sp.n);
const OITO = ["Garchomp", "Blissey", "Dragonite", "Corviknight", "Gengar", "Rhyperior", "Starmie", "Machamp"].map((n) => candidato(n));

// ---------- sequência, HP entre lutas e troca ----------
test("sequência: o HP passa de uma luta pra outra e um Pokémon só não varre três iguais a ele", () => {
  const igual = () => garchomp({ golpes: ["Earthquake"] });
  const sozinho = lutaInteira([meu("Garchomp", ["Outrage"])], [igual(), igual(), igual()]);
  assert.equal(sozinho.venceu, false);
  assert.ok(sozinho.derrubados >= 1 && sozinho.derrubados < 3, "derrubados=" + sozinho.derrubados);
  // com reserva, quem fica em campo carrega o HP: cada vitória do mesmo Pokémon termina com menos vida que a anterior
  const reserva = lutaInteira([meu("Garchomp", ["Outrage"]), meu("Dragonite", ["Outrage"])], [igual(), igual(), igual()]);
  assert.equal(reserva.venceu, true);
  const hp = fracs(reserva);
  assert.equal(hp.length, 3);
  assert.ok(hp[0] > hp[1] && hp[1] > hp[2] && hp[2] > 0, "HP em cada nocaute: " + hp.map((v) => v.toFixed(2)));
});

test("troca: quem perde o duelo é trocado por um da reserva que vence; o log mostra quem sai e quem entra", () => {
  // Dragonite (Outrage) leva Rock Slide em cheio do Rhyperior; Starmie (Surf) derruba o Rhyperior antes de apanhar
  const rhyperior = linha("Rhyperior", { hab: "Solid Rock", golpes: ["Rock Slide"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant" });
  const s = lutaInteira([meu("Dragonite", ["Outrage"]), meu("Starmie", ["Surf"], { evs: EV.especial, nat: "Timid" })], [rhyperior]);
  assert.equal(s.venceu, true, "a reserva resolve");
  assert.ok(s.log.some((l) => l.meu === "Starmie" && l.venceu === true), JSON.stringify(s.log));
  assert.ok(!s.log.some((l) => l.meu === "Dragonite" && l.venceu === false), "Dragonite não é largado pra morrer: " + JSON.stringify(s.log));
});

// ---------- hazards ----------
test("hazard de habilidade do chefão (Loose Rocks): quem entra depois fere na entrada; Heavy-Duty Boots protege", () => {
  const rochas = (item = "") => linha("Rhyperior", { hab: "Loose Rocks", golpes: ["Rock Slide"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant", item });
  const dragonite = () => linha("Dragonite", { hab: "Inner Focus", golpes: ["Outrage"], evs: EV.fisico, nat: "Adamant" });
  const minhas = [meu("Dragonite", ["Outrage"]), meu("Dragonite", ["Outrage"]), meu("Dragonite", ["Outrage"])];
  const com = lutaInteira(minhas, [rochas(), dragonite(), dragonite()]);
  const sem = lutaInteira(minhas, [linha("Rhyperior", { hab: "Solid Rock", golpes: ["Rock Slide"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant" }), dragonite(), dragonite()]);
  // o 2º Dragonite entra depois do Rock Slide: com pedras no chão perde 1/4 do HP (Rock x Flying), sem elas não perde nada
  assert.equal(fracs(sem)[1], 1, "controle: sem Loose Rocks o 2º entra inteiro");
  assert.ok(fracs(com)[1] <= 0.78 && fracs(com)[1] >= 0.72, "Loose Rocks: Rock x Flying tira 1/4 (" + fracs(com)[1] + ")");
  const botas = lutaInteira(minhas.map((m) => ({ ...m, build: { ...m.build, item: "Heavy-Duty Boots" } })), [rochas(), dragonite(), dragonite()]);
  assert.equal(fracs(botas)[1], 1, "Heavy-Duty Boots ignora o hazard");
});

test("hazard posto por golpe meu (Stealth Rock): o chefão que entra depois leva a tabela de Rock; Boots dele ignora", () => {
  const moltres = (item = "") => linha("Moltres", { golpes: ["Flamethrower"], evs: EV.especial, nat: "Modest", item });
  // Life Orb no Moltres: sem o x1,5 sempre ligado da sinergia do Flash Fire (B4, 21/10) ele não mata o Tyranitar antes de levar dano; o item dá a força que a fixture precisa.
  const luta = (golpes, item = "Life Orb") => lutaInteira([meu("Tyranitar", golpes, { evs: EV.tanqueF })], [flamejante("Charizard"), moltres(item), flamejante("Charizard")]);
  const com = luta(["Stealth Rock", "Crunch"]), sem = luta(["Crunch"]), botas = luta(["Stealth Rock", "Crunch"], "Heavy-Duty Boots");
  const vsMoltres = (s) => s.log.find((l) => l.contra === "Moltres").fracFoe;
  assert.equal(vsMoltres(sem), 1, "controle: sem Stealth Rock o Moltres entra com a vida toda");
  assert.ok(vsMoltres(com) <= 0.55 && vsMoltres(com) >= 0.45, "Rock x Fire/Flying = 1/2 do HP (" + vsMoltres(com) + ")");
  assert.equal(vsMoltres(botas), 1, "Heavy-Duty Boots do chefão ignora");
});

// ---------- buffs de ginásio (sem tocar nas contas: ids reais de gym_skills) ----------
test("buff Spikes (Brawly/Norman): quem entra perde 1/6 do HP, mas Flying não é tocado", () => {
  const meus = (nome) => [meu(nome, nome === "Garchomp" ? ["Outrage"] : ["Brave Bird"])];
  const base = fracs(lutaInteira(meus("Garchomp"), [machamp()]))[0];
  const com = fracs(lutaInteira(meus("Garchomp"), [machamp()], { ids: ["brawly_spikes"] }))[0];
  assert.ok(base - com >= 0.14 && base - com <= 0.19, "2 camadas = 1/6 (diferença " + (base - com).toFixed(3) + ")");
  const aereo = (ids) => fracs(lutaInteira(meus("Corviknight"), [machamp()], { ids }))[0];
  assert.equal(aereo(["brawly_spikes"]), aereo([]), "Spikes não fere quem voa");
});

test("buff Reflect corta o dano físico e Light Screen não: o atacante físico apanha mais só com Reflect", () => {
  const minhas = [meu("Garchomp", ["Outrage"]), meu("Dragonite", ["Outrage"])];
  const hp = (ids) => fracs(lutaInteira(minhas, [machamp(), snorlax()], { ids }))[1];
  const base = hp([]);
  assert.equal(hp(["tateliza_lightscreen"]), base, "Light Screen não mexe em golpe físico");
  assert.ok(hp(["tateliza_reflect"]) < base - 0.1, "Reflect: " + hp(["tateliza_reflect"]) + " x " + base);
});

test("buff Heal Block (Flannery): Leftovers e cura deixam de segurar a luta contra o time", () => {
  const minhas = [meu("Blissey", ["Seismic Toss"], { evs: EV.tanqueE, item: "Leftovers" }), meu("Corviknight", ["Brave Bird"], { item: "Leftovers" })];
  const party = [snorlax(), machamp()];
  assert.equal(lutaInteira(minhas, party).venceu, true);
  assert.equal(lutaInteira(minhas, party, { ids: ["flannery_healblock"] }).venceu, false);
});

test("buff Last Stand (Roxanne): o último do time dele entra com o dobro e derruba quem varria os cinco primeiros", () => {
  const meus = ["Garchomp", "Rhyperior", "Dragonite", "Salamence", "Tyranitar", "Machamp"].map((n, i) => meu(n, [["Outrage"], ["Rock Slide"], ["Outrage"], ["Outrage"], ["Crunch"], ["Close Combat"]][i]));
  const party = [machamp(), machamp(), machamp(), machamp(), machamp(), machamp()];
  const base = lutaInteira(meus, party), com = lutaInteira(meus, party, { ids: ["roxanne_laststand"] });
  assert.equal(base.venceu, true);
  assert.ok(base.hpRestante - com.hpRestante > 1, "o último passa a custar bem mais HP: " + base.hpRestante.toFixed(2) + " -> " + com.hpRestante.toFixed(2));
});

test("botão com os buffs reais do chefão (Norman 1): a mesma caixa que vencia o time passa a perder", () => {
  const boss = bossPorNome("Norman 1");
  const sem = montar(OITO, boss.party), com = montar(OITO, boss.party, { buffs: R.buffsAtivosDoChefao("Norman 1") });
  assert.equal(sem.simulacao.venceu, true);
  assert.equal(com.simulacao.venceu, false, "com os 7 buffs a luta simulada não fecha mais");
  assert.ok(com.simulacao.derrubados < sem.simulacao.derrubados);
});

// ---------- regra de campo ----------
test("Trick Room permanente (Tate & Liza 2): o mais lento bate primeiro e inverte quem vence", () => {
  const rhyperior = linha("Rhyperior", { hab: "Solid Rock", golpes: ["Rock Slide"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant" });
  const minhas = [meu("Starmie", ["Surf"])];
  assert.equal(lutaInteira(minhas, [rhyperior]).venceu, true, "controle: Starmie mais rápido derruba o Rhyperior primeiro");
  assert.equal(lutaInteira(minhas, [rhyperior], { campo: R.regraDeCampoDoChefao("Tate And Liza 2") }).venceu, false);
});

test("batalha invertida (Tate & Liza 1): Fire passa a ser super efetivo em Water", () => {
  const minhas = [meu("Charizard", ["Flamethrower"], { evs: EV.especial, nat: "Modest" })];
  const blastoise = linha("Blastoise", { hab: "Torrent", golpes: ["Hydro Pump"], evs: EV.especial, nat: "Modest" });
  assert.equal(lutaInteira(minhas, [blastoise]).venceu, false);
  assert.equal(lutaInteira(minhas, [blastoise], { campo: R.regraDeCampoDoChefao("Tate And Liza 1") }).venceu, true);
});

test("Gravity (Steven Doubles): Earthquake acerta o Flying", () => {
  const skarmory = linha("Skarmory", { hab: "Mirror Armor", golpes: ["Iron Head"], evs: [252, 0, 252, 0, 0, 0] });
  const minhas = [meu("Garchomp", ["Earthquake"])];
  assert.equal(lutaInteira(minhas, [skarmory]).venceu, false);
  assert.equal(lutaInteira(minhas, [skarmory], { campo: R.regraDeCampoDoChefao("Steven Doubles") }).venceu, true);
});

// ---------- o botão "Montar time contra este chefão" com chefão real ----------
test("botão: contra o time real do Sidney 1 monta 6 diferentes, vence e dá um plano por Pokémon dele", () => {
  const boss = bossPorNome("Sidney 1") || R.BOSSES.find((b) => !b.db && b.party.length === 6);
  const r = montar(OITO, boss.party);
  assert.equal(r.escolhidos.length, 6);
  assert.equal(new Set(nomesDe(r)).size, 6, "sem repetir Pokémon");
  assert.equal(r.simulacao.venceu, true);
  assert.equal(r.simulacao.total, boss.party.length);
  assert.equal(r.plano.length, boss.party.length);
  assert.ok(r.plano.every((p) => p.respostas.length > 0 && p.respostas[0].golpe), "cada Pokémon do chefão tem resposta com golpe");
});

test("botão: contra um time só de Fire escolhe quem resiste e bate de volta e só põe no time quem ajuda na luta completa", () => {
  const fogo = [flamejante("Charizard"), flamejante("Houndoom"), flamejante("Arcanine"), flamejante("Ninetales")];
  const r = montar(["Blastoise", "Rhyperior", "Garchomp", "Starmie", "Dragonite", "Venusaur", "Gengar", "Machamp"].map((n) => candidato(n)), fogo);
  const nomes = nomesDe(r);
  assert.ok(nomes.includes("Rhyperior"), "quem resiste Fire e bate com Rock entra: " + nomes);
  assert.ok(nomes.includes("Blastoise"), "quem resiste Fire com Water entra: " + nomes);
  // B4 (21/10): sem o x1,5 sempre ligado do Flash Fire do Ninetales o Machamp (Fighting) entra no time. Antes era "não ajuda" e ficava de fora;
  // medido no juiz da luta completa ele ajuda: tirar o Machamp custa 1,00 ponto, igual ao Blastoise e ao Rhyperior (Houndoom é Dark/Fire: Fighting é super efetivo).
  // Quem entra tem de render na luta completa; o Machamp, se entra, tem de contribuir.
  const juiz = R.avaliarTimePelaLutaCompleta(r.escolhidos.map((e) => e.unidade), fogo, NIVEL, {});
  juiz.membros.forEach((m) => assert.ok(m.contribuicao > 0.5, m.nome + " entra no time sem contribuir: " + m.contribuicao));
  if (nomes.includes("Machamp")) assert.ok(juiz.membros.find((m) => m.nome === "Machamp").contribuicao >= 0.99, "Machamp contribui ~1,00 ponto");
  assert.equal(r.simulacao.venceu, true);
});

test("botão com build salva: o simulador luta com a build do jogador, não com um set que ele inventa", () => {
  const boss = { party: [machamp(), snorlax()] };
  const cands = [candidato("Garchomp", { ability: "Rough Skin", nature: "Adamant", evs: EV.fisico, item: "", moves: ["Earthquake"] }), candidato("Dragonite")];
  const r = montar(cands, boss.party);
  const g = r.avaliados.find((a) => a.sp.n === "Garchomp");
  assert.equal(g.set, "build");
  assert.equal(g.ab, "Rough Skin");
  assert.notEqual(r.avaliados.find((a) => a.sp.n === "Dragonite").set, "build");
});

// ---------- dupla 2x2 ----------
test("botão em dupla (Sidney 2, chefão db): luta 2 contra 2, vence e registra quem derruba quem", () => {
  const boss = bossPorNome("Sidney 2");
  assert.ok(boss && boss.db, "fixture: chefão em dupla no dado");
  const r = montar(OITO, boss.party, { dupla: true });
  assert.equal(r.simulacao.dupla, true);
  assert.equal(r.simulacao.venceu, true);
  assert.equal(r.escolhidos.length, 6);
  const derrubas = r.simulacao.log.filter((l) => l.derruba);
  assert.ok(derrubas.length >= boss.party.length, "um registro por nocaute do chefão ou meu");
  assert.ok(derrubas.every((l) => l.quem && l.golpe));
});

test("dupla: golpe de área (Rock Slide) derruba mais que o de alvo único mesmo com menos poder (Stone Edge)", () => {
  const alvo = [snorlax(), snorlax(), machamp(), machamp()];
  const meus = (g) => [meu("Garchomp", [g]), meu("Dragonite", [g])];
  const area = lutaEmDupla(meus("Rock Slide"), alvo), um = lutaEmDupla(meus("Stone Edge"), alvo);
  assert.equal(area.dupla, true);
  assert.ok(area.derrubados > um.derrubados, area.derrubados + " x " + um.derrubados);
});

test("dupla: Earthquake fere o parceiro (Solid Rock leva), Telepathy protege e Friend Guard amortece", () => {
  const alvo = [snorlax(), snorlax(), machamp(), machamp()];
  // Blissey no lugar do Rhyperior (versao-nova/05): a Friend Guard da versão nova corta 25% (battle_util.c:7664; eram 50% na 2.65beta) e com o Rhyperior a luta
  // dava o mesmo placar com qualquer habilidade. A Blissey (Friend Guard no parceiro Garchomp) ainda muda a luta.
  const parceiro = (hab) => meu("Blissey", ["Seismic Toss"], { hab, evs: EV.tanqueF });
  const pontos = (hab) => lutaEmDupla([meu("Garchomp", ["Earthquake"]), parceiro(hab)], alvo).pontos;
  assert.ok(pontos("Telepathy") > pontos("Solid Rock") + 0.5, "Telepathy: " + pontos("Telepathy") + " x " + pontos("Solid Rock"));
  assert.ok(pontos("Friend Guard") > pontos("Solid Rock") + 0.5, "Friend Guard muda a luta: " + pontos("Friend Guard") + " x " + pontos("Solid Rock"));
});
