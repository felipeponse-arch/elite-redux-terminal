// Ticket 07 da dívida técnica (08/10/2026), 2ª metade, bloco 2: efeitos do duelo que só tinham teste
// interno (crítico, recuo e cura, estágios, poder variável, nocaute e IA do chefão), agora pela entrada
// pública (R.resultadoDoDuelo e R.simularLutaContraChefao) com Pokémon e golpes REAIS do 2.65beta.
// Cada cenário muda UMA coisa entre duas lutas (a habilidade, o golpe ou o alvo) e confere o efeito na
// luta inteira, sem tocar em ef, stats ou golpesProntos. Medidas em cenarios_do_duelo.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EV, eu, chefao, linha, meu, lutar, lutaInteira, causado, razao, dentroDoEfeito, entre } from "./cenarios_do_duelo.mjs";

const blissey = () => chefao("Blissey", { hab: "Natural Cure", golpes: ["Seismic Toss"], evs: EV.tanqueE });
const snorlax = () => chefao("Snorlax", { hab: "Thick Fat", golpes: ["Body Slam"], evs: [252, 252, 4, 0, 0, 0] });
const corviknight = () => chefao("Corviknight", { golpes: ["Iron Head"], evs: [252, 0, 252, 0, 0, 0] });

// ---------- crítico ----------
test("Sniper reforça o crítico: em golpe que sempre crita (Frost Breath) rende ~x1,45; em golpe comum quase nada", () => {
  const weavile = (hab, golpe) => lutar(eu("Weavile", { hab, golpes: [golpe], evs: EV.especial, nat: "Modest" }), corviknight());
  dentroDoEfeito(razao(weavile("Sniper", "Frost Breath"), weavile("", "Frost Breath"), causado), 1.45, "Sniper em Frost Breath", 0.1);
  entre(razao(weavile("Sniper", "Ice Beam"), weavile("", "Ice Beam"), causado), 1, 1.08, "Sniper em Ice Beam (crítico raro)");
});

test("Super Luck soma ao crítico de golpe comum (~+4%) e não muda golpe que já sempre crita", () => {
  const weavile = (hab, golpe) => lutar(eu("Weavile", { hab, golpes: [golpe], evs: EV.especial, nat: "Modest" }), corviknight());
  entre(razao(weavile("Super Luck", "Ice Beam"), weavile("", "Ice Beam"), causado), 1.02, 1.08, "Super Luck em Ice Beam");
  assert.equal(razao(weavile("Super Luck", "Frost Breath"), weavile("", "Frost Breath"), causado), 1, "Frost Breath já crita sempre");
});

test("Lucky Chant do ginásio (Tate & Liza) é imune a crítico: Frost Breath do jogador perde o bônus no 1º do time", () => {
  const minhas = [meu("Weavile", ["Frost Breath"], { evs: EV.especial, nat: "Modest" })];
  const party = [linha("Corviknight", { golpes: ["Iron Head"], evs: [252, 0, 252, 0, 0, 0] })];
  const com = lutaInteira(minhas, party, { ids: ["tateliza_luckychant"] }).log[0].fracFoe;
  const sem = lutaInteira(minhas, party).log[0].fracFoe;
  assert.ok(com > sem + 0.15, "sem crítico o Corviknight sobra com mais vida: " + com.toFixed(3) + " x " + sem.toFixed(3));
});

// ---------- recuo, dreno e estágios ----------
test("Rock Head anula o recuo de Brave Bird: o mesmo golpe termina a luta com bem mais HP", () => {
  const luta = (hab) => lutar(eu("Corviknight", { hab, golpes: ["Brave Bird"] }), blissey());
  const com = luta("Rock Head"), sem = luta("");
  assert.ok(com.venceu && sem.venceu, "o jogador vence nas duas");
  assert.equal(com.turnos, sem.turnos);
  assert.ok(com.fracEu - sem.fracEu > 0.1, "Rock Head: " + com.fracEu.toFixed(3) + " x " + sem.fracEu.toFixed(3));
});

test("dreno: Giga Drain cura o que causa e vence o Snorlax; o Energy Ball (mais forte) não cura e perde", () => {
  const luta = (golpe) => lutar(eu("Venusaur", { golpes: [golpe], evs: EV.especial, nat: "Modest" }), snorlax());
  assert.equal(luta("Giga Drain").venceu, true);
  assert.equal(luta("Energy Ball").venceu, false);
});

test("Competitive contra o Intimidate do chefão: o +2 de Sp. Atk compensa e a luta termina com muito mais HP", () => {
  const gyarados = () => chefao("Gyarados", { hab: "Intimidate", golpes: ["Waterfall"], evs: EV.fisico });
  const luta = (hab) => lutar(eu("Milotic", { hab, golpes: ["Surf"], evs: EV.especial, nat: "Modest" }), gyarados());
  const com = luta("Competitive"), sem = luta("");
  assert.ok(com.venceu && sem.venceu);
  assert.ok(com.turnos < sem.turnos, "luta mais curta: " + com.turnos + " x " + sem.turnos);
  assert.ok(com.fracEu > sem.fracEu + 0.3, com.fracEu.toFixed(3) + " x " + sem.fracEu.toFixed(3));
});

test("Moxie: cada nocaute dá +1 de Ataque, então o 3º do chefão cai bem mais fundo do que sem a habilidade", () => {
  const rochas = () => linha("Machamp", { hab: "No Guard", golpes: ["Rock Slide"], evs: EV.fisico, nat: "Adamant" });
  const sna = () => linha("Snorlax", { hab: "Thick Fat", golpes: ["Body Slam"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant" });
  const terceiro = (hab) => lutaInteira([meu("Gyarados", ["Waterfall"], { hab })], [rochas(), rochas(), sna()]).log[2].fracFoe;
  assert.ok(terceiro("") - terceiro("Moxie") > 0.3, "vida que sobra no Snorlax: " + terceiro("Moxie").toFixed(3) + " (Moxie) x " + terceiro("").toFixed(3));
});

// ---------- poder variável ----------
test("Low Kick pelo peso do alvo: leve (Shuckle) rende pouco, médio (Ferrothorn) fica entre o Karate Chop e o Close Combat", () => {
  const shuckle = () => chefao("Shuckle", { hab: "Sturdy", golpes: ["Rock Slide"], evs: EV.tanqueF });
  const ferrothorn = () => chefao("Ferrothorn", { hab: "Iron Barbs", golpes: ["Power Whip"], evs: EV.tanqueF });
  const machamp = (golpe, alvo) => lutar(eu("Machamp", { golpes: [golpe] }), alvo());
  // Shuckle (20,5 kg) = 40 de poder, contra 75 do Brick Break: a luta dura ~75/40 vezes mais
  const turnos = (g) => machamp(g, shuckle).turnos;
  // Desde 15/10/2026 (ticket calibracao-01) o Brick Break é soco pela flag iron_fist do jogo e o Machamp tem Iron Fist de innate: o Brick Break
  // sai x1,3 (85 de poder x 1,3 = 110,5 contra 40: 2,76 vezes, 2,75 medido). Antes dava 85/40, entre 1,6 e 2,1.
  entre(turnos("Low Kick") / turnos("Brick Break"), 2.2, 3, "turnos Low Kick / Brick Break no Shuckle");
  // Ferrothorn (110 kg) = 100 de poder: entre o Karate Chop (90) e o Close Combat (120)
  const dano = (g) => 1 - machamp(g, ferrothorn).fracFoe;
  // (o Karate Chop, 90 de poder e sem bônus de innate do Machamp, no lugar do Brick Break, que agora é soco com Iron Fist e passa dos 100 do Low Kick)
  assert.ok(dano("Karate Chop") < dano("Low Kick") && dano("Low Kick") < dano("Close Combat"), [dano("Karate Chop"), dano("Low Kick"), dano("Close Combat")].map((v) => v.toFixed(3)).join(" < "));
});

// ---------- IA do chefão ----------
test("IA do chefão: com Return (mais forte) e Mach Punch (super efetivo), luta como se só tivesse o Mach Punch", () => {
  const luta = (golpes) => lutar(eu("Ursaring", { golpes: ["Facade"], evs: EV.tanqueF }), chefao("Snorlax", { hab: "Thick Fat", golpes, evs: [252, 252, 4, 0, 0, 0], nat: "Adamant" }));
  const dois = luta(["Return", "Mach Punch"]), soSuper = luta(["Mach Punch"]), soForte = luta(["Return"]);
  assert.ok(dois.venceu && soSuper.venceu && soForte.venceu, "o jogador vence nas três (compara o HP que sobra)");
  assert.equal(dois.fracEu, soSuper.fracEu, "a IA escolhe o super efetivo");
  assert.ok(soForte.fracEu < dois.fracEu - 0.1, "e não o de maior dano: " + soForte.fracEu.toFixed(3) + " x " + dois.fracEu.toFixed(3));
});

test("depois de um nocaute o chefão manda quem tem golpe super efetivo no meu Pokémon, não o próximo da lista", () => {
  const machamp = linha("Machamp", { hab: "No Guard", golpes: ["Rock Slide"], evs: EV.fisico, nat: "Adamant" });
  const snorlax2 = linha("Snorlax", { hab: "Thick Fat", golpes: ["Body Slam"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant" });
  const gelo = linha("Articuno", { golpes: ["Ice Beam"], evs: EV.especial, nat: "Modest" });
  const s = lutaInteira([meu("Garchomp", ["Earthquake"])], [machamp, snorlax2, gelo]);
  assert.equal(s.log[0].contra, "Machamp", "o 1º da lista abre a luta");
  assert.equal(s.log[1].contra, "Articuno", "o Ice Beam (4x no Garchomp) passa na frente do Snorlax: " + s.log.map((l) => l.contra).join(", "));
});
