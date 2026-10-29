// Ticket versao-nova/07 (15/10/2026): as 29 habilidades novas da NextDex 2.65.4 + as 9 do delta da er-config d1a9a4c (upcoming) funcionam no duelo,
// cada uma pelo CÓDIGO do jogo (abilities.cc de 486026e; linhas no docs/tickets/versao-nova/07-habilidades-novas.md), ou ficam como "sem regra" com motivo.
// Dado real: data/dex_compact.json (2.65.4 + data/config_nova.json). Unidades sintéticas quando o que importa é a regra, não a espécie.
import { N_HABILIDADES } from "./contagens_versao.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b + " (tolerância " + tol + ")");
const efDe = (habs, clima) => R.efeitoDasHabilidadesNoDuelo(habs.map(idHab), "AB07_" + habs.join("+") + "_" + (clima || ""), clima || null);
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
// Unidade sintética completa (serve de atacante, de alvo e para comHabilidadesDuelo).
const unid = (habs, tipos, golpes, extra) => {
  const ids = habs.map(idHab);
  return Object.assign({ sp: { n: "Teste", sname: "SPECIES_TESTE", inn: [], t: [0, 0] }, tipos, ids, abId: ids.length ? ids[0] : null, ab: habs[0] || "", ef: efDe(habs), item: "", it: R.itemDoDuelo("", null),
    stats: [320, 100, 100, 100, 100, 100], golpesProntos: golpes, statusIds: [] }, extra || {});
};
const dano = (a, d) => R.danoNoDuelo(a, d, NIVEL).melhor.dano;
// Unidade real da Dex com as habilidades ISOLADAS (sem as innates da espécie).
function iso(especie, habs, golpes) {
  const s = sp(especie);
  const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Hardy", evs: [0, 252, 0, 252, 0, 0], item: "", moves: golpes }, NIVEL, null);
  const ids = habs.map(idHab);
  u.ids = ids; u.ab = habs[0] || ""; u.abId = ids.length ? ids[0] : null;
  u.ef = R.efeitoDasHabilidadesNoDuelo(ids, s.sname + "|" + habs.join("+") + "|07", null);
  u.tipos = R.tiposNaBatalha(s, u.ef);
  u.golpeIds = golpes.map((n) => R.MOVE_ID_BY_NAME[n]);
  u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
  return u;
}

// ---------- conferência final: nenhuma das 38 esquecida ----------
const SEM_REGRA_NOVAS = {
  "Grimace": "Mean Look na entrada (abilities.cc:10720): impede a troca do alvo; o duelo não modela troca (como Tag e Arena Trap)",
  "Blinking Flash": "golpe de luz tem 10% de chance de -1 de precisão do alvo (abilities.cc:12907): o motor não modela estágio de precisão",
};
const NOVAS_DO_DELTA = ["Photokinesis", "Photon Burst", "Rippling Punch", "Cackling", "Fresh Snowfall", "Sticky Situation", "Bioluminescent", "Blinking Flash", "Brain Freeze"];

test("as 38 habilidades novas (29 da NextDex 2.65.4, ids 1034-1062, + 9 da config d1a9a4c, ids 1063-1071): cada uma é lida pelo motor ou está registrada como sem regra, com o motivo", () => {
  assert.equal(R.ABILITIES.length, N_HABILIDADES); // v2.65.4.1 (28/10): 1072 + 3 habilidades novas da er-config 486a964
  const novas = [];
  for (let id = 1034; id <= 1071; id++) novas.push(R.ABILITIES[id][0]);
  assert.equal(novas.length, 38);
  assert.deepEqual(novas.slice(29), NOVAS_DO_DELTA);
  const semRegra = novas.filter((n) => R.habilidadeSemRegraNoDuelo(idHab(n)));
  assert.deepEqual(semRegra.sort(), Object.keys(SEM_REGRA_NOVAS).sort(), "sem regra: só as registradas (com o motivo)");
  for (const [n, motivo] of Object.entries(SEM_REGRA_NOVAS)) assert.ok(motivo.length > 30, n + " precisa de motivo");
});

test("dado da config nova no app: Keen Edge virou Sharpness (mesmo id), as 9 habilidades entram, e as espécies do delta têm as habilidades da config", () => {
  assert.equal(idHab("Keen Edge"), undefined);
  assert.equal(idHab("Sharpness"), 271);
  assert.equal(R.ABILITIES[271][1], "Boosts the power of slashing moves by 1.3x.");
  const nome = (id) => R.ABILITIES[id][0];
  assert.deepEqual(sp("Chinchou").ab.map(nome), ["Swift Swim", "Dazzling", "Photokinesis"]);
  assert.deepEqual(sp("Lanturn").ab.map(nome), ["Swift Swim", "Dazzling", "Photon Burst"]);
  assert.equal(nome(sp("Lumineon").inn[2]), "Photon Burst");
  assert.equal(nome(sp("Heliolisk").inn[0]), "Photokinesis");
  assert.deepEqual(sp("Kirlia Redux").ab.map(nome), ["Run Away", "Water Absorb", "Hydration"]);
  assert.deepEqual(sp("Raichu Mega Y").inn.map(nome), ["Generator", "No Guard", "Ground Shock"]);
  assert.deepEqual(sp("Morpekyll Hangry").b, [97, 104, 78, 62, 74, 121]);
});

test("Sharpness (ex-Keen Edge): o texto novo 'Slashing/Sharpness moves ...' segue lido; Blademaster e Molten Blades ganham o x1,3 da parte Sharpness; Chestnut Axe segue dando corte ao Grass", () => {
  assert.equal(efDe(["Sharpness"]).bonusCategoria.corte, 1.3);
  assert.equal(efDe(["Blademaster"]).bonusCategoria.corte, 1.3);
  assert.equal(efDe(["Molten Blades"]).bonusCategoria.corte, 1.3);
  assert.deepEqual([...efDe(["Chestnut Axe"]).categoriaPorTipo.Grass], ["corte"]);
  assert.equal(efDe(["Mystic Blades"]).categoriaEspecial.corte, true);
  assert.equal(efDe(["Chainsaw"]).aoGolpear[0].categoria, "corte");
  assert.equal(efDe(["Dual Wield"]).categoriaExtra.corte, 1.4);
  assert.equal(efDe(["Power Edge"]).categoriaNaSpDef.corte, true);
  assert.equal(efDe(["Cutthroat"]).prioPrimeiroCategoria.corte, true);
});

// ---------- luz: Photokinesis, Photon Burst ----------
test("Photokinesis: golpe de luz sai x1,3 (abilities.cc:12837); golpe sem a marcação não muda", () => {
  const atq = (hab, golpeNome) => iso("Garchomp", hab ? [hab] : [], [golpeNome]);
  const alvo = iso("Magikarp", [], ["Tackle"]);
  const razao = (golpeNome) => dano(atq("Photokinesis", golpeNome), alvo) / dano(atq(null, golpeNome), alvo);
  assert.ok(atq(null, "Dazzling Gleam").golpesProntos[0].cats.includes("luz"), "Dazzling Gleam é luz na er-config");
  perto(razao("Dazzling Gleam"), 1.3, 0.02 * 1.3, "Dazzling Gleam");
  perto(razao("Ember"), 1, 1e-9, "Ember (não é luz)");
});

test("Photon Burst: luz x1,3 e o golpe, mesmo especial, é calculado contra a Defesa física (abilities.cc:12845-12852)", () => {
  const alvo = unid([], ["Normal"], [golpe("F")], { stats: [320, 100, 200, 100, 50, 100] }); // Def 200, SpDef 50
  const atq = (hab) => iso("Garchomp", hab ? [hab] : [], ["Dazzling Gleam"]);
  perto(dano(atq("Photon Burst"), alvo) / dano(atq(null), alvo), 1.3 * 50 / 200, 0.03, "x1,3 e Def 200 no lugar de SpDef 50");
  const alvoInverso = unid([], ["Normal"], [golpe("F")], { stats: [320, 100, 50, 100, 200, 100] });
  perto(dano(atq("Photon Burst"), alvoInverso) / dano(atq(null), alvoInverso), 1.3 * 200 / 50, 0.4, "Def 50 no lugar de SpDef 200");
  assert.equal(efDe(["Photon Burst"]).categoriaNaDef.luz, true);
  assert.equal(efDe(["Photokinesis"]).categoriaNaDef.luz, undefined);
});

// ---------- som: Rippling Punch ----------
// Depende de dado: espécie real (a regra, com fixture inventada, está em regras_com_fixture.test.mjs)
test("Rippling Punch: golpe de soco também é de som (abilities.cc:12854): o Soundproof do alvo barra o soco; sem a habilidade o soco passa", () => {
  const alvo = iso("Magikarp", ["Soundproof"], ["Tackle"]);
  assert.ok(dano(iso("Garchomp", [], ["Mach Punch"]), alvo) > 0, "sem a habilidade, o soco passa pelo Soundproof");
  assert.equal(dano(iso("Garchomp", ["Rippling Punch"], ["Mach Punch"]), alvo), 0, "com Rippling Punch o soco é som");
  assert.ok(dano(iso("Garchomp", ["Rippling Punch"], ["Earthquake"]), alvo) > 0, "golpe que não é soco segue passando");
});

// ---------- status: Spicy Spray, Third-Degree Burn, Cackling, Brain Freeze ----------
test("Spicy Spray: levar dano de qualquer golpe queima o atacante, com ou sem contato (abilities.cc:12687); Fire é imune", () => {
  const spray = unid(["Spicy Spray"], ["Water"], [golpe("F")]);
  const chance = (def, gDef) => R.chancesDeStatusNoDuelo(spray, def, spray.golpesProntos[0], gDef).queimar;
  assert.equal(chance(unid([], ["Normal"], [golpe("F")]), golpe("F")), 1, "golpe sem contato");
  assert.equal(chance(unid([], ["Normal"], [golpe("E")]), golpe("E", { contato: true })), 1, "golpe com contato");
  assert.equal(chance(unid([], ["Fire"], [golpe("F")]), golpe("F")), undefined, "Fire não queima");
  assert.equal(chance(unid(["Water Veil"], ["Normal"], [golpe("F")]), golpe("F")), undefined, "Water Veil barra");
});

test("Third-Degree Burn: queima qualquer tipo (Fire também) e o golpe Fire atravessa as habilidades do alvo (abilities.cc:12735)", () => {
  const queima = golpe("E", { status: [{ st: "queimar", p: 0.3 }] });
  const alvoFire = unid([], ["Fire"], [golpe("F")]);
  const com = unid(["Third-Degree Burn"], ["Normal"], [queima]), sem = unid([], ["Normal"], [queima]);
  perto(R.chancesDeStatusNoDuelo(com, alvoFire, queima, golpe("F")).queimar, 0.3, 1e-9, "Fire queima com a habilidade");
  assert.equal(R.chancesDeStatusNoDuelo(sem, alvoFire, queima, golpe("F")).queimar, undefined, "sem a habilidade, Fire não queima");
  const fogo = golpe("E", { tipo: "Fire" }), agua = golpe("E", { tipo: "Water" });
  const flashFire = unid(["Flash Fire"], ["Normal"], [golpe("F")]), waterAbsorb = unid(["Water Absorb"], ["Normal"], [golpe("F")]);
  assert.equal(dano(unid([], ["Normal"], [fogo]), flashFire), 0, "controle: Flash Fire absorve o Fire");
  assert.ok(dano(unid(["Third-Degree Burn"], ["Normal"], [fogo]), flashFire) > 0, "Fire atravessa o Flash Fire");
  assert.equal(dano(unid(["Third-Degree Burn"], ["Normal"], [agua]), waterAbsorb), 0, "só o Fire atravessa: Water Absorb segue absorvendo Water");
  const guarda = unid(["Wonder Guard"], ["Normal"], [golpe("F")]); // só leva golpe super efetivo
  assert.equal(dano(unid([], ["Normal"], [fogo]), guarda), 0, "controle: Wonder Guard barra o Fire neutro");
  assert.ok(dano(unid(["Third-Degree Burn"], ["Normal"], [fogo]), guarda) > 0, "o Fire do Third-Degree Burn atravessa o Wonder Guard");
  assert.equal(dano(unid(["Third-Degree Burn"], ["Normal"], [agua]), guarda), 0, "o Water não atravessa");
});

test("Cackling: Eerie Laugh na entrada paralisa o alvo (ignora o tipo: Electric também); Brain Freeze 30% de frostbite nos golpes Psychic e uma entrada só (sem contar em dobro)", () => {
  const cack = unid(["Cackling"], ["Dark"], [golpe("F")]);
  assert.equal(efDe(["Cackling"]).statusNaEntrada.paralisar, 1);
  assert.equal(R.chancesDeStatusNoDuelo(cack, unid([], ["Normal"], [golpe("F")]), cack.golpesProntos[0], golpe("F")).paralisar, 1);
  assert.equal(R.chancesDeStatusNoDuelo(cack, unid([], ["Electric"], [golpe("F")]), cack.golpesProntos[0], golpe("F")).paralisar, 1, "Eerie Laugh ignora o tipo");
  const bf = efDe(["Brain Freeze"]);
  assert.equal(bf.statusAtaque.length, 1, "a frase 'chance to cause' era lida duas vezes (a chance de 30% virava 51%)");
  assert.deepEqual(JSON.parse(JSON.stringify(bf.statusAtaque[0])), { st: ["congelar"], pContato: 0.3, pOutro: 0.3, filtro: { tipo: "Psychic" }, porTipo: false, ignoraGenero: false });
  assert.equal(efDe(["Resonance"]).statusAtaque.length, 1, "Resonance (Sound moves ... chance to cause bleeding) tinha o mesmo problema");
  const eu = iso("Garchomp", ["Brain Freeze"], ["Psychic", "Ember"]), alvo = unid([], ["Normal"], [golpe("F")]);
  const chance = (nome) => R.chancesDeStatusNoDuelo(eu, alvo, eu.golpesProntos.find((g) => g.nome === nome), golpe("F")).congelar;
  perto(chance("Psychic"), 0.3, 1e-9, "golpe Psychic");
  assert.equal(chance("Ember"), undefined, "golpe que não é Psychic não congela");
});

// ---------- hemorragia: Hemorrhage ----------
test("Hemorrhage: o alvo que sangra perde as habilidades (abilities.cc:12714, como o Hemotoxin com veneno); sem chance de sangrar no golpe, nada muda", () => {
  const alvo = iso("Magikarp", ["Battle Armor"], ["Tackle"]); // -20% de dano de qualquer golpe: some quando a habilidade é suprimida
  const roda = (hab, golpeNome) => {
    const eu = iso("Garchomp", hab ? [hab] : [], [golpeNome]);
    assert.equal(golpeNome === "Slash", eu.golpesProntos[0].status.some((s) => s.st === "sangrar" && s.p > 0), "Slash (Bleed Hit) sangra, Ember não");
    const meu = R.danoNoDuelo(eu, alvo, NIVEL), dele = R.danoNoDuelo(alvo, eu, NIVEL);
    return { antes: meu.melhor.dano, depois: R.comHabilidadeTrocada(eu, alvo, meu, dele, NIVEL).meu.melhor.dano };
  };
  const com = roda("Hemorrhage", "Slash");
  assert.ok(com.depois > com.antes * 1.01, "o Battle Armor some depois do primeiro sangramento: " + com.antes + " -> " + com.depois);
  const semHabilidade = roda(null, "Slash");
  assert.equal(semHabilidade.depois, semHabilidade.antes);
  const semSangrar = roda("Hemorrhage", "Ember");
  assert.equal(semSangrar.depois, semSangrar.antes, "golpe que não faz sangrar não suprime nada");
});

// ---------- campo e telas: Mana Coat, Light Wield; clima: Sea Guardian, Sun Worship ----------
test("Mana Coat: golpe físico x1,3 com Psychic Terrain no campo; o especial e o campo sem terreno não mudam (abilities.cc:12705)", () => {
  const alvo = unid([], ["Normal"], [golpe("F")]);
  const fis = (hab) => unid(hab ? [hab] : [], ["Normal"], [golpe("F")]), esp = (hab) => unid(hab ? [hab] : [], ["Normal"], [golpe("E")]);
  const base = { fisico: dano(fis(null), alvo), especial: dano(esp(null), alvo) };
  try {
    R.CAMPO_DUELO = { terreno: "psiquico" };
    perto(dano(fis("Mana Coat"), alvo) / base.fisico, 1.3, 0.03, "físico no Psychic Terrain");
    perto(dano(esp("Mana Coat"), alvo) / base.especial, 1, 1e-6, "especial");
    R.CAMPO_DUELO = { terreno: "eletrico" };
    perto(dano(fis("Mana Coat"), alvo) / base.fisico, 1, 1e-6, "outro terreno");
  } finally { R.CAMPO_DUELO = null; }
  perto(dano(fis("Mana Coat"), alvo) / base.fisico, 1, 1e-6, "sem terreno");
});

test("Light Wield: Light Screen de 3 turnos do lado do dono na entrada: o golpe especial que o enfrenta rende menos; o físico não; Infiltrator atravessa", () => {
  const wield = unid(["Light Wield"], ["Normal"], [golpe("F")]);
  assert.equal(efDe(["Light Wield"]).telaLuz, 3);
  const luta = (atq) => R.danoComStatusNoDuelo(atq, wield, R.danoNoDuelo(atq, wield, NIVEL), R.danoNoDuelo(wield, atq, NIVEL), 3, true).meu;
  const semTela = unid([], ["Normal"], [golpe("F")]);
  const luta0 = (atq) => R.danoComStatusNoDuelo(atq, semTela, R.danoNoDuelo(atq, semTela, NIVEL), R.danoNoDuelo(semTela, atq, NIVEL), 3, true).meu;
  const especial = unid([], ["Normal"], [golpe("E")]), fisico = unid([], ["Normal"], [golpe("F")]);
  assert.ok(luta(especial) < luta0(especial) * 0.9, "especial: " + luta(especial) + " x " + luta0(especial));
  perto(luta(fisico), luta0(fisico), 1e-6, "físico");
  assert.ok(luta(unid(["Infiltrator"], ["Normal"], [golpe("E")])) > luta(especial), "Infiltrator atravessa a tela");
});

test("Sea Guardian e Sun Worship: o maior atributo sobe +1 na entrada, só com chuva / sol (abilities.cc:4553 e 4809)", () => {
  assert.equal(efDe(["Sea Guardian"], "chuva").maiorNaEntrada, 1);
  assert.equal(efDe(["Sea Guardian"], "sol").maiorNaEntrada, 0);
  assert.equal(efDe(["Sea Guardian"]).maiorNaEntrada, 0);
  assert.equal(efDe(["Sun Worship"], "sol").maiorNaEntrada, 1);
  assert.equal(efDe(["Sun Worship"], "chuva").maiorNaEntrada, 0);
  assert.equal(R.habilidadeSemRegraNoDuelo(idHab("Sea Guardian")), false);
  assert.equal(R.habilidadeSemRegraNoDuelo(idHab("Sun Worship")), false);
});

// ---------- tipo: Insect Eater, Packed Ice; golpe que reage: Fresh Snowfall; velocidade: Sticky Situation ----------
test("Insect Eater: x1,5 contra alvo Bug e x0,5 contra atacante Bug, pelo TIPO DO POKÉMON (abilities.cc:4086: IS_BATTLER_OF_TYPE), não pelo tipo do golpe; Dragonslayer idem", () => {
  const golpeNormal = golpe("F"), golpeBug = golpe("F", { tipo: "Bug" });
  const ie = unid(["Insect Eater"], ["Normal"], [golpeNormal]), plano = unid([], ["Normal"], [golpeNormal]);
  perto(dano(ie, unid([], ["Bug"], [golpeNormal])) / dano(plano, unid([], ["Bug"], [golpeNormal])), 1.5, 1e-6, "contra alvo Bug");
  perto(dano(ie, unid([], ["Normal"], [golpeNormal])) / dano(plano, unid([], ["Normal"], [golpeNormal])), 1, 1e-6, "contra alvo comum");
  const recebe = (atqTipos, g) => dano(unid([], atqTipos, [g]), ie) / dano(unid([], atqTipos, [g]), plano);
  perto(recebe(["Bug"], golpeNormal), 0.5, 1e-6, "atacante Bug com golpe Normal");
  perto(recebe(["Normal"], golpeBug), 1, 1e-6, "atacante Normal com golpe Bug");
  const ds = unid(["Dragonslayer"], ["Normal"], [golpeNormal]);
  perto(dano(unid([], ["Dragon"], [golpeNormal]), ds) / dano(unid([], ["Dragon"], [golpeNormal]), plano), 0.5, 1e-6, "atacante Dragon com golpe Normal");
  perto(dano(unid([], ["Normal"], [golpe("F", { tipo: "Dragon" })]), ds) / dano(unid([], ["Normal"], [golpe("F", { tipo: "Dragon" })]), plano), 1, 1e-6, "golpe Dragon de atacante Normal");
});

test("Packed Ice: imune a golpe Ice (sem código no upcoming 217dd0f; o +2 de Defesa está em lacunas_sem_codigo.test.mjs); Mold Breaker atravessa", () => {
  assert.equal(R.abilityTypeModFor("Ice", ["Normal"], [idHab("Packed Ice")]).mult, 0);
  assert.equal(R.abilityTypeModFor("Water", ["Normal"], [idHab("Packed Ice")]).mult, 1);
  const alvo = unid(["Packed Ice"], ["Normal"], [golpe("F")]);
  assert.equal(dano(unid([], ["Normal"], [golpe("E", { tipo: "Ice" })]), alvo), 0);
  assert.ok(dano(unid(["Mold Breaker"], ["Normal"], [golpe("E", { tipo: "Ice" })]), alvo) > 0);
});

test("Fresh Snowfall: ao levar golpe ESPECIAL, devolve um Powder Snow de 30 de poder (abilities.cc:12877); golpe físico não dispara", () => {
  const neve = unid(["Fresh Snowfall"], ["Normal"], [golpe("E")]), plano = unid([], ["Normal"], [golpe("E")]);
  const luta = (eu, golpeDele) => { const rival = unid([], ["Normal"], [golpeDele]); return R.danoComStatusNoDuelo(eu, rival, R.danoNoDuelo(eu, rival, NIVEL), R.danoNoDuelo(rival, eu, NIVEL), 3, true).meu; };
  assert.ok(luta(neve, golpe("E")) > luta(plano, golpe("E")) * 1.1, "especial dispara");
  perto(luta(neve, golpe("F")), luta(plano, golpe("F")), 1e-6, "físico não dispara");
  assert.deepEqual(JSON.parse(JSON.stringify(efDe(["Fresh Snowfall"]).contraAtaque)), { poder: 30, soEspecial: true });
});

test("Sticky Situation: golpe Bug derruba a Speed do alvo (-1 por acerto, sem chance; abilities.cc:12888); golpe de outro tipo não", () => {
  const dono = unid(["Sticky Situation"], ["Normal"], [golpe("F")]), vitima = unid([], ["Normal"], [golpe("F")]);
  const spe = (g) => R.estagiosMediosDuelo(vitima, dono, vitima.golpesProntos[0], g, 5).spe;
  assert.ok(spe(golpe("F", { tipo: "Bug" })) < -1, "Bug: " + spe(golpe("F", { tipo: "Bug" })));
  assert.equal(spe(golpe("F", { tipo: "Fire" })), 0);
  assert.equal(R.estagiosMediosDuelo(vitima, unid([], ["Normal"], [golpe("F")]), vitima.golpesProntos[0], golpe("F", { tipo: "Bug" }), 5).spe, 0, "sem a habilidade, nada");
});

// ---------- Fort Knox x golpe múltiplo: Familia Bond ----------
test("Fort Knox / Wonder Skin: o golpe duplo de Parental Bond, Familia Bond, Multi-Headed (+ Hydra, Hand Barnacles, 3 > 1) atravessa (resistsFortKnox); o de Hyper Aggressive não", () => {
  const alvoFK = iso("Magikarp", ["Fort Knox"], ["Tackle"]), alvoLivre = iso("Magikarp", [], ["Tackle"]);
  const atq = (hab) => iso("Garchomp", hab ? [hab] : [], ["Tackle"]);
  const razao = (hab, alvo) => dano(atq(hab), alvo) / dano(atq(null), alvo);
  perto(razao("Familia Bond", alvoLivre), 1.5, 0.04, "Familia Bond sem Fort Knox: 100% + 50%");
  perto(razao("Familia Bond", alvoFK), 1.5, 0.04, "Familia Bond atravessa o Fort Knox");
  perto(razao("Parental Bond", alvoFK), 1.25, 0.04, "Parental Bond atravessa");
  perto(razao("Hyper Aggressive", alvoLivre), 1.25, 0.04, "Hyper Aggressive sem Fort Knox");
  perto(razao("Hyper Aggressive", alvoFK), 1, 0.04, "Hyper Aggressive é barrado pelo Fort Knox");
  assert.equal(efDe(["Familia Bond"]).resisteFortKnox, true);
  assert.equal(efDe(["Hyper Aggressive"]).resisteFortKnox, false);
  for (const n of ["Parental Bond", "Multi-Headed", "Hydra", "Hand Barnacles", "3 > 1"]) assert.equal(efDe([n]).resisteFortKnox, true, n);
});

// ---------- as que já eram lidas e agora têm conferência pelo código ----------
test("confirmadas pelo código (já estavam certas): Butterfly Wings, Sand Titan, Mega Sol, Bad Guy/Ignition/Smarty Pants/Bird Type/Creepy Crawlie, Bush Rush, Guerilla Fighter, Bioluminescent", () => {
  assert.equal(efDe(["Butterfly Wings"]).ate, "Bug");
  assert.equal(efDe(["Mega Sol"]).armaTerreno, "grama");
  assert.equal(efDe(["Mega Sol"]).chloroplast, true);
  assert.deepEqual([...efDe(["Bad Guy"]).tipoExtra], ["Dark"]);
  assert.deepEqual([...efDe(["Ignition"]).tipoExtra], ["Fire"]);
  assert.deepEqual([...efDe(["Smarty Pants"]).tipoExtra], ["Psychic"]);
  assert.deepEqual([...efDe(["Bird Type"]).tipoExtra], ["Flying"]);
  assert.deepEqual([...efDe(["Creepy Crawlie"]).tipoExtra], ["Bug"]);
  assert.deepEqual([...efDe(["Bioluminescent"]).tipoExtra], ["Electric"]);
  assert.deepEqual([...efDe(["Bush Rush"]).prioTipoCheio], ["Grass"]);
  assert.deepEqual([...efDe(["Guerilla Fighter"]).prioTipoCheio], ["Grass"]);
  assert.equal(efDe(["Guerilla Fighter"]).ate, "Fighting");
});
