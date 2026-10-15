// Ticket calibracao-2026-10-15/03 (15/10/2026): multiplicadores de habilidade que o texto da NextDex traz, mas que o motor não lia
// (ou lia errado), conferidos contra o código do jogo (abilities.cc / battle_util.c) pela medição da varredura de calibração:
// a MESMA unidade com e sem a habilidade, isolada das innates da espécie (o ataque é de um Garchomp, o alvo é um Magikarp sem EV).
// Tolerância de 2% (a fórmula de dano soma +2 no fim, então um x2 mede ~1,97).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "./carregar_regras.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
function lerComMutacao(caminho, nome) {
  let t = readFileSync(join(RAIZ, caminho), "utf8").replace(/\r\n/g, "\n");
  if (process.env.MUTACAO_ARQUIVO === nome) {
    if (t.split(process.env.MUTACAO_DE).length !== 2) throw new Error("trecho da sabotagem não encontrado (ou repetido) em " + nome + ": " + process.env.MUTACAO_DE);
    t = t.replace(process.env.MUTACAO_DE, () => process.env.MUTACAO_PARA || "");
  }
  return t;
}
const categorias = JSON.parse(lerComMutacao("data/move_categorias.json", "move_categorias.json"));
const flagsDaConfig = JSON.parse(readFileSync(join(RAIZ, "data", "golpes_flags_config.json"), "utf8"));

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b + " (tolerância " + tol + ")");

// Unidade com as habilidades ISOLADAS (sem as innates da espécie).
function iso(especie, habs, golpes, item = "", clima = null, evs = [0, 252, 0, 252, 0, 0]) {
  const s = sp(especie);
  const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Hardy", evs, item, moves: golpes }, NIVEL, clima);
  const ids = habs.map(idHab);
  u.ids = ids; u.ab = habs[0] || ""; u.abId = ids.length ? ids[0] : null;
  u.ef = R.efeitoDasHabilidadesNoDuelo(ids, s.sname + "|" + habs.join("+"), clima);
  u.tipos = R.tiposNaBatalha(s, u.ef);
  u.golpeIds = golpes.map((n) => R.MOVE_ID_BY_NAME[n]); u.clima = clima;
  u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, clima);
  return u;
}
const dano = (a, d) => R.danoNoDuelo(a, d, NIVEL).melhor.dano;
const alvoFraco = (habs = []) => iso("Magikarp", habs, ["Tackle"], "", null, [0, 0, 0, 0, 0, 0]);
// Razão do dano do atacante com a(s) habilidade(s) sobre o mesmo atacante sem ela(s).
const razaoAtaque = (habs, golpe, item = "") => dano(iso("Garchomp", habs, [golpe], item), alvoFraco()) / dano(iso("Garchomp", [], [golpe], item), alvoFraco());
// Razão do dano que o defensor com a habilidade leva sobre o dano que levaria sem ela.
const razaoDefesa = (hab, golpe) => { const a = iso("Garchomp", [], [golpe]); return dano(a, alvoFraco([hab])) / dano(a, alvoFraco()); };

// ---------- ataque ----------
const ATAQUE = [
  // [habilidades, golpe, esperado, o que prova]
  [["Tough Claws"], "Body Slam", 1.3, "A2: golpe de contato x1,3"], [["Tough Claws"], "Gust", 1, "sem contato não ganha"],
  [["Big Pecks"], "Body Slam", 1.3, "A2: Big Pecks é igual à Tough Claws"], [["Big Pecks"], "Gust", 1, "sem contato não ganha"],
  [["Giant Wings"], "Gust", 1.3, "A3: golpe com a flag air x1,3"], [["Giant Wings"], "Air Slash", 1.3, "A3"], [["Giant Wings"], "Tackle", 1, "A3: sem a flag não ganha"],
  [["Giant Wings"], "Aerial Ace", 1, "A3: o Aerial Ace NÃO tem a flag air na config (35 golpes air no dado 2.65beta, 36 hoje)"],
  [["Steely Spirit"], "Metal Claw", 1.3, "M1: Steel x1,3"], [["Steely Spirit"], "Tackle", 1, "M1"],
  [["Airborne"], "Gust", 1.3, "M1: Flying x1,3"], [["Airborne"], "Tackle", 1, "M1"],
  [["Water Bubble"], "Water Gun", 2, "M6: Water x2"], [["Water Bubble"], "Tackle", 1, "M6"],
  [["Nosferatu"], "Body Slam", 1, "N1: sem o +20% de contato (só a cura)"], [["Nosferatu"], "Gust", 1, "N1"],
  [["Warmonger"], "Rock Throw", 1.3, "B3: Rock x1,3"], [["Warmonger"], "Metal Claw", 1.3, "B3: Steel"], [["Warmonger"], "Karate Chop", 1.3, "B3: Fighting"], [["Warmonger"], "Tackle", 1, "B3"],
  [["Hammer Fist"], "Mach Punch", 1.25, "B3: soco x1,25"], [["Hammer Fist"], "Hammer Arm", 1.25, "B3: soco e martelo (um fator só)"], [["Hammer Fist"], "Wood Hammer", 1.25, "B3: martelo x1,25"], [["Hammer Fist"], "Tackle", 1, "B3"],
  [["Plasma Lamp"], "Ember", 1.2, "B3: Fire x1,2"], [["Plasma Lamp"], "Thunder Shock", 1.2, "B3: Electric"], [["Plasma Lamp"], "Tackle", 1, "B3"],
  [["Deep Freeze"], "Water Gun", 1.25, "B3: Water x1,25"], [["Deep Freeze"], "Powder Snow", 1.25, "B3: Ice"], [["Deep Freeze"], "Tackle", 1, "B3"],
  [["Devious Present"], "Powder Snow", 1.5, "B3: Ice x1,5"], [["Devious Present"], "Shot Put", 1.5, "B3: arremesso x1,5"], [["Devious Present"], "Tackle", 1, "B3"],
  [["Punk Rock"], "Hyper Voice", 1.3, "o ataque do Punk Rock já estava certo (som x1,3)"]
];
for (const [habs, golpe, esperado, prova] of ATAQUE) {
  test(`${habs.join("+")} / ${golpe}: x${esperado} (${prova})`, () => {
    perto(razaoAtaque(habs, golpe), esperado, 0.02 * esperado);
  });
}

// ---------- defesa ----------
const DEFESA = [
  ["Magma Armor", "Water Gun", 0.7, "A1: Water x0,7 uma vez só (antes 0,49)"], ["Magma Armor", "Powder Snow", 0.7, "A1: Ice"],
  ["Magma Armor", "Tackle", 1, "A1: Normal não é cortado (antes 0,7)"], ["Magma Armor", "Ember", 1, "A1: Fire não é cortado (antes 0,7)"],
  ["Punk Rock", "Hyper Voice", 0.5, "M5: som recebido x0,5"], ["Punk Rock", "Tackle", 1, "M5: golpe sem som não é cortado"],
  ["Hyper Cleanse", "Poison Sting", 0.5, "B2: Poison x0,5"], ["Hyper Cleanse", "Tackle", 1, "B2"],
  ["Thick Blubber", "Ember", 0.25, "N2: segue Fire x0,25"], ["Thick Blubber", "Powder Snow", 0.25, "N2: segue Ice x0,25"], ["Thick Blubber", "Tackle", 1, "N2"],
  ["Water Bubble", "Ember", 0.5, "M6: segue Fire x0,5"]
];
for (const [hab, golpe, esperado, prova] of DEFESA) {
  test(`defesa: ${hab} recebendo ${golpe}: x${esperado} (${prova})`, () => {
    perto(razaoDefesa(hab, golpe), esperado, 0.02 * esperado);
  });
}

// ---------- o que o texto fixa, direto no efeito ----------
test("Nosferatu (N1): só cura metade do dano de contato; o x1,2 não existe no código (battle_util.c:4748-4756)", () => {
  const ef = R.efeitoDasHabilidadesNoDuelo([idHab("Nosferatu")], "NOSF", null);
  assert.equal(ef.contatoMult, 1);
  assert.equal(ef.drenoContato, 0.5);
});

test("Thick Blubber (N2): Speed x0,5; o Fire/Ice x0,25 continua vindo da tabela de tipos", () => {
  const ef = R.efeitoDasHabilidadesNoDuelo([idHab("Thick Blubber")], "TB", null);
  assert.equal(ef.speMult, 0.5);
  const base = iso("Garchomp", [], ["Tackle"]), com = iso("Garchomp", ["Thick Blubber"], ["Tackle"]);
  perto(R.velocidadeNoDuelo(com, 1, alvoFraco(), com.golpesProntos[0], alvoFraco().golpesProntos[0]) / R.velocidadeNoDuelo(base, 1, alvoFraco(), base.golpesProntos[0], alvoFraco().golpesProntos[0]), 0.5, 0.001, "velocidade");
});

test("Long Reach, Protective Pads e Punching Glove (num soco) tiram o contato: a Tough Claws não rende x1,3 (battle_util.c:6578-6590)", () => {
  perto(razaoAtaque(["Tough Claws"], "Body Slam"), 1.3, 0.03, "Body Slam");
  perto(razaoAtaque(["Tough Claws", "Long Reach"], "Body Slam") / razaoAtaque(["Long Reach"], "Body Slam"), 1, 0.001, "com Long Reach");
  perto(razaoAtaque(["Tough Claws"], "Body Slam", "Protective Pads"), 1, 0.001, "com Protective Pads");
  perto(razaoAtaque(["Tough Claws"], "Mach Punch", "Punching Glove"), 1, 0.001, "soco com Punching Glove");
  perto(razaoAtaque(["Tough Claws"], "Body Slam", "Punching Glove"), 1.3, 0.03, "golpe que não é soco com Punching Glove segue com contato");
  perto(razaoAtaque(["Tough Claws"], "Mach Punch"), 1.3, 0.03, "o mesmo soco sem a luva faz contato");
});

test("habilidades que são a soma de outras herdam o número: Flame Bubble (Water Bubble), Lucky Wings e Imposing Wings (Giant Wings), Apex Predator, Lead Claws, Ice Picks, Bird of Prey e Reaper's Embarce (Tough Claws/Big Pecks)", () => {
  const ef = (n) => R.efeitoDasHabilidadesNoDuelo([idHab(n)], "COMBO" + n, null);
  assert.equal(ef("Flame Bubble").bonusTipo.Water, 2);
  for (const n of ["Lucky Wings", "Imposing Wings"]) assert.equal(ef(n).flagMult["Air/Wing Based"].mult, 1.3, n);
  for (const n of ["Apex Predator", "Lead Claws", "Ice Picks", "Bird of Prey", "Reaper's Embarce"]) assert.equal(ef(n).contatoMult, 1.3, n);
});

// ---------- golpes: recuo e acertos pelo effect/hit_count da config (B5) ----------
test("Atomic Fire: o effect do jogo é EFFECT_RECOIL_33, não os 50% que a descrição da NextDex diz", () => {
  const id = R.MOVE_ID_BY_NAME["Atomic Fire"];
  assert.equal(flagsDaConfig.recuos["Atomic Fire"], 33);
  assert.equal(categorias[id].rc, 33);
  assert.equal(R.MOVE_CATEGORIAS[id].rc, 33);
  const u = iso("Garchomp", [], ["Atomic Fire"]);
  perto(u.golpesProntos[0].recuo, 0.33, 1e-9, "recuo do golpe pronto");
});

test("todo golpe de recuo fixo da config (EFFECT_RECOIL_25/33/50) tem o recuo do jogo em move_categorias.json", () => {
  const nomes = Object.keys(flagsDaConfig.recuos);
  assert.equal(nomes.length, 15);
  for (const nome of nomes) assert.equal(categorias[R.MOVE_ID_BY_NAME[nome]].rc, flagsDaConfig.recuos[nome], nome);
});

test("Double Shock bate 2 vezes (hit_count: 2); todo golpe com hit_count da config tem o mesmo número de acertos no motor", () => {
  assert.equal(R.acertosDoGolpeDuelo(R.MOVE_ID_BY_NAME["Double Shock"]), 2);
  const nomes = Object.keys(flagsDaConfig.acertos);
  assert.equal(nomes.length, 6);
  for (const nome of nomes) assert.equal(R.acertosDoGolpeDuelo(R.MOVE_ID_BY_NAME[nome]), flagsDaConfig.acertos[nome], nome);
});

// ---------- sem contar duas vezes (a sinergia por golpe da espécie era a aproximação de antes) ----------
const sinergia = JSON.parse(readFileSync(join(RAIZ, "data", "species_ability_synergy.json"), "utf8"));
const LIDAS_DO_TEXTO = ["Tough Claws", "Big Pecks", "Giant Wings", "Steely Spirit", "Airborne", "Warmonger", "Deep Freeze", "Devious Present",
  "Imposing Wings", "Lucky Wings", "Apex Predator", "Lead Claws", "Ice Picks", "Bird of Prey", "Reaper's Embarce"];

test("a sinergia por golpe da espécie não soma de novo o bônus que o texto agora ensina (Tough Claws no Charizard rende x1,3, não x1,69)", () => {
  let conferidas = 0;
  for (const sname of Object.keys(sinergia)) for (const h of sinergia[sname]) {
    if (!LIDAS_DO_TEXTO.includes(h.name) || idHab(h.name) === undefined) continue;
    const ef = R.efeitoDasHabilidadesNoDuelo([idHab(h.name)], sname, null);
    assert.deepEqual(Object.keys(ef.bonusGolpes), [], sname + " / " + h.name + ": bonusGolpes");
    conferidas++;
  }
  assert.ok(conferidas >= 150, "entradas de sinergia conferidas: " + conferidas);
  // o mesmo, no dano de uma espécie real: Charizard com Tough Claws (innate/habilidade dele) e um golpe de contato do movepool dele
  const charizard = sp("Charizard"), golpe = "Fire Fang";
  const monta = (hab) => {
    const u = R.unidadeDaBuild(charizard, { ability: "Run Away", nature: "Hardy", evs: [0, 252, 0, 252, 0, 0], item: "", moves: [golpe] }, NIVEL, null);
    const ids = hab ? [idHab(hab)] : [];
    u.ids = ids; u.ef = R.efeitoDasHabilidadesNoDuelo(ids, charizard.sname, null); u.tipos = R.tiposNaBatalha(charizard, u.ef);
    u.golpeIds = [R.MOVE_ID_BY_NAME[golpe]]; u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
    return u;
  };
  perto(dano(monta("Tough Claws"), alvoFraco()) / dano(monta(""), alvoFraco()), 1.3, 0.03, "Charizard / Fire Fang / Tough Claws");
});
