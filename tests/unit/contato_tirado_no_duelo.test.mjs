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

// Ticket mecanica-2026-10-22/04: o Protective Pads vale só no ATACANTE (IsMoveMakingContact checa battlerAtk); o item do alvo não muda nada.
test("Protective Pads no atacante: golpe de contato sai sem contato, sem Rough Skin/Rocky Helmet e sem Tough Claws", () => {
  const pads = iso("Garchomp", ["Tough Claws"], ["Body Slam"], "Protective Pads");
  const sem = iso("Garchomp", ["Tough Claws"], ["Body Slam"]);
  assert.equal(pads.golpesProntos[0].contato, false);
  assert.equal(sem.golpesProntos[0].contato, true);
  const rough = iso("Magikarp", ["Rough Skin"], ["Tackle"]), capacete = iso("Magikarp", [], ["Tackle"], "Rocky Helmet");
  for (const alvo of [rough, capacete]) {
    igual(duelo(pads, alvo), duelo(semContatoForcado(pads), alvo));
    assert.notDeepEqual(duelo(pads, alvo), duelo(forcar(pads, true), alvo), "com contato a reação cobraria");
  }
  assert.ok(R.danoNoDuelo(sem, rough, NIVEL).melhor.dano > R.danoNoDuelo(pads, rough, NIVEL).melhor.dano, "Tough Claws x1,3 some com Pads");
});

test("Protective Pads no alvo não muda nada: o atacante segue com contato e leva a reação", () => {
  const rough = iso("Magikarp", ["Rough Skin"], ["Tackle"]), roughPads = iso("Magikarp", ["Rough Skin"], ["Tackle"], "Protective Pads");
  const atq = iso("Garchomp", [], ["Body Slam"]);
  igual(duelo(atq, roughPads), duelo(atq, rough));
});

test("Protective Pads + Juggernaut: o bônus lê o contato cru e fica (contatoBruto), mas as reações não pegam", () => {
  const rough = iso("Magikarp", ["Rough Skin"], ["Tackle"]);
  const pj = iso("Conkeldurr", ["Juggernaut"], ["Mach Punch"], "Protective Pads");
  const j = iso("Conkeldurr", ["Juggernaut"], ["Mach Punch"]);
  assert.equal(pj.golpesProntos[0].contato, false);
  assert.equal(pj.golpesProntos[0].contatoBruto, true);
  assert.equal(R.danoNoDuelo(pj, rough, NIVEL).melhor.dano, R.danoNoDuelo(j, rough, NIVEL).melhor.dano, "mesmo dano: Juggernaut mantido");
  igual(duelo(pj, rough), duelo(semContatoForcado(pj), rough));
});

test("Klutz anula Protective Pads e Punching Glove: o contato volta e a reação cobra", () => {
  const rough = iso("Magikarp", ["Rough Skin"], ["Tackle"]), estatica = iso("Magikarp", ["Static"], ["Tackle"]);
  const pads = iso("Garchomp", ["Klutz"], ["Body Slam"], "Protective Pads");
  const luva = iso("Garchomp", ["Klutz"], ["Mach Punch"], "Punching Glove");
  for (const u of [pads, luva]) {
    assert.equal(u.golpesProntos[0].contato, true, "Klutz: item sem efeito");
    for (const alvo of [rough, estatica]) {
      igual(duelo(u, alvo), duelo(forcar(u, true), alvo));
      assert.notDeepEqual(duelo(u, alvo), duelo(semContatoForcado(u), alvo));
    }
  }
});
