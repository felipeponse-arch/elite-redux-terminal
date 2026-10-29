// Ticket mecanica-2026-10-22/02: Long Reach e Punching Glove (num soco) tiram o contato INTEIRO (IsMoveMakingContact, battle_util.c:6579-6592),
// não só o bônus da Tough Claws: o atacante também não sofre Rough Skin/Rocky Helmet/Static/Flame Body.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const NIVEL = 55;
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);

function iso(especie, habs, golpes, item = "") {
  const s = sp(especie);
  const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Hardy", evs: [0, 252, 0, 252, 0, 0], item, moves: golpes }, NIVEL, null);
  const ids = habs.map((n) => R.ABILITY_ID_BY_NAME[n]);
  u.ids = ids; u.ab = habs[0] || ""; u.abId = ids.length ? ids[0] : null;
  u.ef = R.efeitoDasHabilidadesNoDuelo(ids, s.sname + "|" + habs.join("+"), null);
  u.tipos = R.tiposNaBatalha(s, u.ef);
  u.golpeIds = golpes.map((n) => R.MOVE_ID_BY_NAME[n]); u.clima = null;
  u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
  return u;
}
const duelo = (eu, ele) => R.danoComStatusNoDuelo(eu, ele, R.danoNoDuelo(eu, ele, NIVEL), R.danoNoDuelo(ele, eu, NIVEL), 3, true);
// O mesmo atacante com o contato do golpe forçado (a Long Reach tem outros efeitos, então a comparação é com ELA mesma).
const forcar = (u, c) => Object.assign({}, u, { golpesProntos: u.golpesProntos.map((g) => Object.assign({}, g, { contato: c })) });
const semContatoForcado = (u) => forcar(u, false);
const igual = (a, b) => assert.deepEqual(a, b);

// Depende de dado: espécie real (a regra, com fixture inventada, está em regras_com_fixture.test.mjs)
test("Long Reach: o golpe de contato sai sem contato (g.contato falso)", () => {
  assert.equal(iso("Garchomp", [], ["Body Slam"]).golpesProntos[0].contato, true);
  assert.equal(iso("Garchomp", ["Long Reach"], ["Body Slam"]).golpesProntos[0].contato, false);
});

test("Long Reach: não sofre Rough Skin nem Rocky Helmet, e o contato volta sem ela", () => {
  const rough = iso("Magikarp", ["Rough Skin"], ["Tackle"]);
  const comLR = iso("Garchomp", ["Long Reach"], ["Body Slam"]);
  igual(duelo(comLR, rough), duelo(forcar(comLR, false), rough));
  assert.notDeepEqual(duelo(forcar(comLR, true), rough), duelo(comLR, rough), "sem Long Reach o Rough Skin cobra");
  const capacete = iso("Magikarp", [], ["Tackle"], "Rocky Helmet");
  igual(duelo(comLR, capacete), duelo(forcar(comLR, false), capacete));
  assert.notDeepEqual(duelo(forcar(comLR, true), capacete), duelo(comLR, capacete), "sem Long Reach o Rocky Helmet cobra");
});

test("Long Reach: Static e Flame Body não pegam o atacante por contato", () => {
  const comLR = iso("Garchomp", ["Long Reach"], ["Body Slam"]);
  for (const hab of ["Static", "Flame Body", "Poison Point"]) {
    const alvo = iso("Magikarp", [hab], ["Tackle"]);
    igual(duelo(comLR, alvo), duelo(forcar(comLR, false), alvo));
    assert.notDeepEqual(duelo(forcar(comLR, true), alvo), duelo(comLR, alvo), hab);
  }
});

test("Punching Glove: soco sai sem contato e não sofre as reações; golpe que não é soco segue com contato", () => {
  const luva = (golpe) => iso("Garchomp", [], [golpe], "Punching Glove");
  assert.equal(luva("Mach Punch").golpesProntos[0].contato, false);
  assert.equal(luva("Body Slam").golpesProntos[0].contato, true);
  const rough = iso("Magikarp", ["Rough Skin"], ["Tackle"]), estatica = iso("Magikarp", ["Static"], ["Tackle"]);
  for (const alvo of [rough, estatica]) {
    igual(duelo(luva("Mach Punch"), alvo), duelo(semContatoForcado(luva("Mach Punch")), alvo));
    assert.notDeepEqual(duelo(luva("Body Slam"), alvo), duelo(semContatoForcado(luva("Body Slam")), alvo));
  }
  assert.equal(iso("Garchomp", [], ["Mach Punch"]).golpesProntos[0].contato, true, "o mesmo soco sem a luva faz contato");
});

// Juggernaut lê o campo cru do golpe (abilities.cc:4144, gBattleMoves[move].contact), não IsMoveMakingContact: Long Reach não tira o bônus.
test("Long Reach + Juggernaut: mantém o +20% Def em Mach Punch, mas não sofre Rough Skin", () => {
  const rough = iso("Magikarp", ["Rough Skin"], ["Tackle"]);
  const lrJ = iso("Conkeldurr", ["Long Reach", "Juggernaut"], ["Mach Punch"]);
  const lr = iso("Conkeldurr", ["Long Reach"], ["Mach Punch"]);
  const g = lrJ.golpesProntos[0];
  assert.equal(g.contato, false, "reações: sem contato");
  assert.equal(g.contatoBruto, true, "campo cru do golpe segue verdadeiro");
  assert.ok(R.danoNoDuelo(lrJ, rough, NIVEL).melhor.dano > R.danoNoDuelo(lr, rough, NIVEL).melhor.dano, "Juggernaut soma Def mesmo com Long Reach");
  assert.notDeepEqual(duelo(forcar(lrJ, true), rough), duelo(lrJ, rough), "sem Long Reach o Rough Skin cobraria");
});
