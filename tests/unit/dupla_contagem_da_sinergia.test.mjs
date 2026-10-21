// Ticket versao-nova/01 (15/10/2026): o código do jogo multiplica o bônus de golpe de uma habilidade UMA vez (abilities.cc, onModifyDamage).
// O motor lia o texto da habilidade (bonusTipo/bonusCategoria/flagMult/contatoMult) E somava por cima a "sinergia por golpe" da espécie
// (data/species_ability_synergy.json -> bonusGolpes): Nocturnal x1,25 virava x1,54. A sinergia agora só vale para a habilidade cujo texto
// o motor NÃO lê. Medido sobre o dado real: espécies do species_ability_synergy.json e chefões do bosses.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "./carregar_regras.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b + " (tolerância " + tol + ")");
const sinergia = JSON.parse(readFileSync(join(RAIZ, "data", "species_ability_synergy.json"), "utf8"));

// A espécie REAL (com a sinergia dela) atacando um Magikarp sem EV: com a habilidade e sem ela, o mesmo golpe.
function monta(especie, hab, golpe) {
  const s = sp(especie);
  const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Hardy", evs: [0, 252, 0, 252, 0, 0], item: "", moves: [golpe] }, NIVEL, null);
  const ids = hab ? [idHab(hab)] : [];
  u.ids = ids; u.ab = hab || ""; u.abId = ids.length ? ids[0] : null;
  u.ef = R.efeitoDasHabilidadesNoDuelo(ids, s.sname, null);
  u.tipos = R.tiposNaBatalha(s, u.ef);
  u.golpeIds = [R.MOVE_ID_BY_NAME[golpe]]; u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
  return u;
}
const alvo = () => {
  const s = sp("Magikarp");
  const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Hardy", evs: [0, 0, 0, 0, 0, 0], item: "", moves: ["Tackle"] }, NIVEL, null);
  u.ids = []; u.ef = R.efeitoDasHabilidadesNoDuelo([], s.sname, null); u.tipos = ["Normal"];
  u.golpeIds = [R.MOVE_ID_BY_NAME["Tackle"]]; u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
  return u;
};
const razao = (especie, hab, golpe) => R.danoNoDuelo(monta(especie, hab, golpe), alvo(), NIVEL).melhor.dano / R.danoNoDuelo(monta(especie, "", golpe), alvo(), NIVEL).melhor.dano;

test("espécie real: o bônus do texto rende UMA vez (Nocturnal, Levitate, Electrocytes x1,25; Overgrow x1,2 fixo; antes x1,44 a x1,55)", () => {
  perto(razao("Zubat", "Nocturnal", "Feint Attack"), 1.25, 0.03, "Zubat / Nocturnal / Feint Attack (era x1,54)");
  perto(razao("Butterfree", "Levitate", "Gust"), 1.25, 0.03, "Butterfree / Levitate / Gust (era x1,55)");
  perto(razao("Pikachu", "Electrocytes", "Electro Ball"), 1.25, 0.03, "Pikachu / Electrocytes / Electro Ball (era x1,55)");
  perto(razao("Bulbasaur", "Overgrow", "Vine Whip"), 1.2, 0.03, "Bulbasaur / Overgrow / Vine Whip (era x1,44)");
});

test("espécie real: Dragon's Maw (Dragonite) e Transistor (Raikou) valem x1,5 uma vez, não x2,25", () => {
  perto(razao("Dragonite", "Dragon's Maw", "Dragon Breath"), 1.5, 0.04, "Dragonite / Dragon's Maw / Dragon Breath");
  perto(razao("Raikou", "Transistor", "Thunder Fang"), 1.5, 0.04, "Raikou / Transistor / Thunder Fang");
});

test("em todas as entradas do species_ability_synergy.json: habilidade com texto lido não deixa bonusGolpes; habilidade sem leitura mantém", () => {
  let lidas = 0, mantidas = 0;
  for (const sname of Object.keys(sinergia)) for (const h of sinergia[sname]) {
    const id = idHab(h.name);
    if (id === undefined) continue;
    const solo = R.efeitoDasHabilidadesNoDuelo([id], "solo#" + id, null);
    const leu = Object.keys(solo.bonusTipo).length > 0 || Object.keys(solo.bonusCategoria).length > 0 || Object.keys(solo.flagMult).length > 0 || solo.contatoMult !== 1;
    const ef = R.efeitoDasHabilidadesNoDuelo([id], sname, null);
    if (leu) { assert.deepEqual(Object.keys(ef.bonusGolpes), [], sname + " / " + h.name + ": o texto já deu o bônus"); lidas++; }
    // 21/10/2026 (calibracao-simulador/01): estas cinco só absorvem/reagem no código do jogo, sem bônus de dano (abilities.cc); a sinergia saiu.
    else if (["Aerodynamics", "Motor Drive", "Well Baked Body", "Justified", "Inflatable"].includes(h.name)) assert.deepEqual(Object.keys(ef.bonusGolpes), [], sname + " / " + h.name + ": o jogo não dá bônus de dano");
    else { assert.ok(Object.keys(ef.bonusGolpes).length > 0, sname + " / " + h.name + ": sem leitura do texto, a sinergia segue"); mantidas++; }
  }
  assert.ok(lidas >= 1000, "entradas com texto lido: " + lidas);
  assert.ok(mantidas >= 100, "entradas que mantêm a sinergia: " + mantidas);
});

test("a lista fixa de 15 habilidades do ticket calibracao-03 acabou: a regra geral cobre as 15 e mais", () => {
  const quinze = ["Tough Claws", "Big Pecks", "Giant Wings", "Steely Spirit", "Airborne", "Warmonger", "Deep Freeze", "Devious Present",
    "Imposing Wings", "Lucky Wings", "Apex Predator", "Lead Claws", "Ice Picks", "Bird of Prey", "Reaper's Embarce"];
  for (const n of quinze) assert.equal(R.bonusDeGolpeLidoDoTextoDuelo(R.efeitoDasHabilidadesNoDuelo([idHab(n)], "solo#" + idHab(n), null)), true, n);
  for (const n of ["Nocturnal", "Levitate", "Electrocytes", "Overgrow", "Dragon's Maw", "Transistor"]) assert.equal(R.bonusDeGolpeLidoDoTextoDuelo(R.efeitoDasHabilidadesNoDuelo([idHab(n)], "solo#" + idHab(n), null)), true, n);
  assert.equal(R.bonusDeGolpeLidoDoTextoDuelo(R.efeitoDasHabilidadesNoDuelo([], "solo#vazio", null)), false, "sem habilidade");
});

test("chefões reais com dupla contagem (docs/calibracao/dupla_contagem_impacto.md): Reshiram do Drake 4, Zekrom do Wattson 3 e Braviary de Norman 5 não carregam sinergia por cima do texto", () => {
  const fator = (boss, mon, golpe) => {
    const b = R.BOSSES.find((x) => x.name === boss);
    const p = b && b.party.find((x) => x.n === mon);
    assert.ok(p, boss + " / " + mon);
    const foe = R.foeDeDuelo(p, NIVEL, null);
    assert.deepEqual(Object.keys(foe.ef.bonusGolpes), [], boss + " / " + mon + ": a sinergia não soma por cima do texto");
    return foe;
  };
  fator("Drake 4", "Reshiram");
  fator("Wattson 3", "Zekrom");
  fator("Norman 5", "Braviary");
});
