// Varredura "habilidades da config sem código" (21/10/2026; relatorios/sem_codigo_varredura_2026-10-21.md).
// Regra do usuário: com código no er-repo `upcoming` (217dd0f) vale o código; sem código vale a DESCRIÇÃO oficial (data/gameData_2654.json).
// Várias dessas habilidades não têm dono na Dex do app (Hemolysis, Cold Plasma, Packed Ice...): o teste usa uma espécie real com a habilidade ISOLADA.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b + " (tolerância " + tol + ")");
const efDe = (habs, clima) => R.efeitoDasHabilidadesNoDuelo(habs.map(idHab), "LSC_" + habs.join("+") + "_" + (clima || ""), clima || null);
// Unidade real da Dex com as habilidades ISOLADAS (sem as innates da espécie).
function iso(especie, habs, golpes, clima) {
  const s = sp(especie);
  const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Hardy", evs: [0, 252, 0, 252, 0, 0], item: "", moves: golpes }, NIVEL, clima || null);
  const ids = habs.map(idHab);
  u.ids = ids; u.ab = habs[0] || ""; u.abId = ids.length ? ids[0] : null;
  u.ef = R.efeitoDasHabilidadesNoDuelo(ids, s.sname + "|" + habs.join("+") + "|LSC|" + (clima || ""), clima || null);
  u.tipos = R.tiposNaBatalha(s, u.ef);
  u.golpeIds = golpes.map((n) => R.MOVE_ID_BY_NAME[n]);
  u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, clima || null);
  return u;
}
const luta = (eu, foe, turnos) => R.danoComStatusNoDuelo(eu, foe, R.danoNoDuelo(eu, foe, NIVEL), R.danoNoDuelo(foe, eu, NIVEL), turnos, true);

// ---------- Hemolysis (782): battle_util.c:9010-9023 ----------
test("Hemolysis: o rival ENVENENADO perde as subidas (BenefitsFromStatBuffs) e não cura (CanBattlerHeal); rival que não envenena, nada muda", () => {
  assert.equal(R.habilidadeSemRegraNoDuelo(idHab("Hemolysis")), false, "não pode mais ficar como sem regra");
  const foe = (hab) => iso("Garchomp", [hab], ["Crunch"]);
  const roda = (golpeDoDono, hab) => luta(iso("Dragonite", ["Hemolysis"], [golpeDoDono]), foe(hab), 4);
  // Intrepid Sword: +1 Atk na entrada do rival. Poison Jab (50% de veneno por golpe) corta a subida na parte da luta em que ele está envenenado.
  const com = roda("Poison Jab", "Intrepid Sword"), semVeneno = roda("Wing Attack", "Intrepid Sword");
  assert.ok(com.dele < semVeneno.dele * 0.97, "o Atk +1 do rival some quando envenenado: " + com.dele + " x " + semVeneno.dele);
  // Controle: a mesma luta SEM a Hemolysis no dono não tira a subida do rival.
  const semHab = luta(iso("Dragonite", [], ["Poison Jab"]), foe("Intrepid Sword"), 4);
  assert.ok(semHab.dele > com.dele * 1.03, "sem a Hemolysis o rival envenenado mantém o +1: " + semHab.dele + " x " + com.dele);
  // Cura: Self Sufficient (1/16 por turno) do rival envenenado é cortada.
  // (.meu é o dano que EU causo já descontado do que o rival recupera.)
  const cura = (hab) => luta(iso("Dragonite", [hab], ["Poison Jab"]), foe("Self Sufficient"), 4).meu;
  assert.ok(cura("Hemolysis") > cura("Run Away") * 1.005, "o rival envenenado cura menos: " + cura("Hemolysis") + " x " + cura("Run Away"));
});

// ---------- Cold Plasma (471): sem código no upcoming 217dd0f; pela descrição ----------
test("Cold Plasma: golpe Electric queima em vez de paralisar; Fire é imune à queimadura, Electric deixa de ser imune ao status", () => {
  assert.equal(R.habilidadeSemRegraNoDuelo(idHab("Cold Plasma")), false);
  const eu = iso("Garchomp", ["Cold Plasma"], ["Thunderbolt", "Thunder Fang"]);
  const normal = iso("Magikarp", [], ["Tackle"]), fogo = iso("Charmander", [], ["Tackle"]);
  const chance = (atq, alvo, nome) => R.chancesDeStatusNoDuelo(atq, alvo, atq.golpesProntos.find((g) => g.nome === nome), alvo.golpesProntos[0]);
  const tb = chance(eu, normal, "Thunderbolt");
  perto(tb.queimar, 0.1, 1e-9, "Thunderbolt (10% de paralisia) passa a queimar");
  assert.equal(tb.paralisar, undefined, "e deixa de paralisar");
  assert.equal(chance(eu, fogo, "Thunderbolt").queimar, undefined, "Fire não queima");
  const sem = iso("Garchomp", [], ["Thunderbolt"]);
  perto(chance(sem, normal, "Thunderbolt").paralisar, 0.1, 1e-9, "controle: sem a habilidade o Thunderbolt paralisa");
});

// ---------- Overzealous (828): Impl existe e está vazia ----------
test("Overzealous: o Impl<ABILITY_OVERZEALOUS> do upcoming (abilities.cc:10004) só tem randomizerBanned, sem onPriority: o motor segue sem efeito (decisão do Felipe, 22/10/2026: o código vence)", () => {
  assert.equal(R.habilidadeSemRegraNoDuelo(idHab("Overzealous (N)")), true);
});

// ---------- Rest in Peace (653): sem código; descrição "1/8 por turno na névoa" ----------
test("Rest in Peace (Yamask, innate real): cura 1/8 do HP por turno só na névoa", () => {
  const nome = sp("Yamask").inn.map((id) => R.ABILITIES[id][0]);
  assert.ok(nome.includes("Rest in Peace"), "Yamask tem a habilidade: " + nome);
  assert.equal(efDe(["Rest in Peace"], "nevoa").curaPorTurno, 0.125);
  assert.equal(efDe(["Rest in Peace"], null).curaPorTurno, 0);
  assert.equal(efDe(["Rest in Peace"], "chuva").curaPorTurno, 0);
  // A cura entra no saldo da luta (o dono perde menos HP por turno na névoa).
  const perdido = (clima) => {
    const eu = iso("Yamask", ["Rest in Peace"], ["Shadow Ball"], clima), foe = iso("Garchomp", [], ["Earthquake"], clima);
    return luta(eu, foe, 5).dele; // dano que o rival causa, já descontada a cura do dono
  };
  assert.ok(perdido("nevoa") < perdido(null), "na névoa o dono se cura: " + perdido("nevoa") + " x " + perdido(null));
});

// ---------- Packed Ice (1057): sem código no upcoming 217dd0f; pela descrição ----------
test("Packed Ice: imune a Ice e ganha +2 de Defesa ao ser 'atingido' por Ice (descrição); Mold Breaker atravessa", () => {
  const ef = efDe(["Packed Ice"]);
  assert.deepEqual(JSON.parse(JSON.stringify(ef.aoApanhar)), [{ stat: "def", n: 2, tipos: ["Ice"] }]);
  assert.equal(R.abilityTypeModFor("Ice", ["Normal"], [idHab("Packed Ice")]).mult, 0, "a imunidade segue");
  // Rival que só tem golpe Ice: o dono sobe Def e o golpe físico seguinte que ele leva rende menos (a absorção é a única coisa que o rival faz).
  const dono = iso("Glaceon", ["Packed Ice"], ["Ice Beam"]), gelo = iso("Garchomp", [], ["Ice Fang"]);
  const e = R.estagiosMediosDuelo(dono, gelo, dono.golpesProntos[0], gelo.golpesProntos[0], 3);
  assert.ok(e.def >= 2, "+2 de Defesa por absorção: " + e.def);
  const eSem = R.estagiosMediosDuelo(iso("Glaceon", [], ["Ice Beam"]), gelo, dono.golpesProntos[0], gelo.golpesProntos[0], 3);
  assert.equal(eSem.def, 0, "controle: sem a habilidade não sobe");
});

// ---------- Malediction (927): sem código no upcoming; descrição 20% sangramento + 10% maldição ----------
test("Malediction (Hydreigon Mega, dono real): todo golpe tem 20% de sangrar e 10% de Maldição", () => {
  assert.ok(R.SPECIES.some((s) => s && s.n === "Hydreigon Mega" && [].concat(s.ab, s.inn).includes(idHab("Malediction"))));
  const ef = efDe(["Malediction"]);
  const por = (st) => ef.statusAtaque.filter((a) => a.st.includes(st)).map((a) => a.pOutro);
  assert.equal(por("sangrar").join(), "0.2");
  assert.equal(por("maldicao").join(), "0.1");
  const eu = iso("Hydreigon Mega", ["Malediction"], ["Dark Pulse"]), alvo = iso("Magikarp", [], ["Tackle"]);
  const c = R.chancesDeStatusNoDuelo(eu, alvo, eu.golpesProntos[0], alvo.golpesProntos[0]);
  perto(c.sangrar, 0.2, 1e-9); perto(c.maldicao, 0.1, 1e-9);
});

// ---------- Lightsaber (908): Impl<ABILITY_LIGHT_SABER> abilities.cc:10991-11011 ----------
test("Lightsaber (Iron Saber, dono real): golpe Keen Edge tem 12,5% de queimar e 12,5% de paralisar (50% de disparo x 1/4 cada; abilities.cc:10995-11008)", () => {
  assert.ok(sp("Iron Saber").inn.includes(idHab("Lightsaber")));
  const eu = iso("Iron Saber", ["Lightsaber"], ["Leaf Blade", "Earthquake"]), alvo = iso("Magikarp", [], ["Tackle"]);
  const chance = (nome) => R.chancesDeStatusNoDuelo(eu, alvo, eu.golpesProntos.find((g) => g.nome === nome), alvo.golpesProntos[0]);
  perto(chance("Leaf Blade").queimar, 0.125, 1e-9, "queimadura no golpe de corte");
  perto(chance("Leaf Blade").paralisar, 0.125, 1e-9, "paralisia no golpe de corte");
  assert.equal(chance("Earthquake").queimar, undefined, "golpe que não é de corte não dispara");
  assert.ok(eu.ef.stabExtra.includes("Fire"), "o tipo Fire que a habilidade soma segue");
});

// ---------- Poison Upsurge, Frosty, We Will Rock You: família do Blaze ----------
test("Poison Upsurge, Frosty e We Will Rock You: o motor lê só o multiplicador cheio de HP (1,2 / 1,2 / 1,3), como Blaze, Hellblaze e as outras 19 do mesmo texto", () => {
  assert.equal(efDe(["Poison Upsurge"]).bonusTipo.Poison, 1.2);
  assert.equal(efDe(["Frosty"]).bonusTipo.Ice, 1.2);
  assert.equal(efDe(["We Will Rock You"]).bonusTipo.Rock, 1.3);
  assert.equal(efDe(["Blaze"]).bonusTipo.Fire, 1.2);
});
