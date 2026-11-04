// Ticket versao-nova/09 (15/10/2026): os 9 golpes novos do upcoming (er-config d1a9a4c, MoveList.textproto) entram no app, com as espécies que os aprendem
// e as categorias de flag (luz, chifre, chute). O resto da MoveList (poder, precisão, prioridade, tipo) é igual ao da NextDex 2.65.4: a conferência
// golpe a golpe contra a config não achou diferença; as flags já vinham da config (golpes_flags_config.json).
import { N_GOLPES } from "./contagens_versao.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const id = (n) => R.MOVE_ID_BY_NAME[n];
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const patch = JSON.parse(readFileSync(new URL("../../data/config_nova.json", import.meta.url), "utf8"));
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b);

// [nome, tipo, split, poder, precisão, prioridade, efeito, categorias, chance]
const ESPERADO = [
  ["Eerie Laugh", "Dark", "STATUS", 0, 100, 0, "Paralyze Ignore Type", [], 0],
  ["Baneful Kick", "Poison", "PHYSICAL", 85, 100, 0, "Poison Hit", ["chute"], 10],
  ["Cheap Stab", "Dark", "PHYSICAL", 85, 100, 0, "Hit", ["chifre"], 0],
  ["Arc Blast", "Electric", "SPECIAL", 95, 95, 0, "Special Defense Down Hit", ["luz"], 20],
  ["Ghoulish Gore", "Ghost", "PHYSICAL", 85, 100, 0, "Hit", ["chifre"], 0],
  ["Glitter Beam", "Fairy", "SPECIAL", 85, 100, 0, "Accuracy Down Hit", ["luz"], 20],
  ["Luster Glow", "Psychic", "SPECIAL", 85, 90, 0, "Attack Down Hit", ["luz"], 40],
  ["Sparkling Blast", "Water", "SPECIAL", 90, 90, 0, "Accuracy Down Hit", ["luz"], 30], // NextDex 2.65.5 e MoveList b58ea4d: precisão 90, baixa a precisão, 30% (na 2.65.4 era Hit 100, sem chance),
  ["Scorching Ray", "Fire", "SPECIAL", 85, 100, 0, "Burn Hit", ["luz"], 20],
];

test("os 9 golpes novos estão no dex, em seguida aos 1032 da NextDex, com tipo, split, poder, precisão, efeito, categoria de flag e chance da config", () => {
  assert.equal(R.MOVES.length, N_GOLPES);
  // 2.65.5: a NextDex já traz os 9 (posições 1032-1040); a config b58ea4d acrescenta só o Meteoropath Ball (1041)
  assert.deepEqual(patch.golpes.map((g) => g.nome), ["Meteoropath Ball"]);
  assert.equal(R.MOVES[1041][0], "Meteoropath Ball");
  ESPERADO.forEach(([nome, tipo, split, poder, prec, prio, efeito, cats, chance], i) => {
    const m = R.MOVES[1032 + i];
    assert.equal(m[0], nome); assert.equal(R.TYPES[m[1]], tipo, nome + " tipo"); assert.equal(R.DATA.splits[m[2]], split, nome + " split");
    assert.equal(m[3], poder, nome + " poder"); assert.equal(m[4], prec, nome + " precisão"); assert.equal(m[7], prio, nome + " prioridade"); assert.equal(m[11], efeito, nome + " efeito");
    const c = R.MOVE_CATEGORIAS[String(1032 + i)];
    assert.deepEqual([...(c.c || [])], cats, nome + " categorias");
    assert.equal(c.ch || 0, chance, nome + " chance");
    assert.ok(R.MOVE_PT[String(1032 + i)], nome + " tem tradução");
  });
  const flags = (n) => R.MOVES[id(n)][8].map((i) => R.DATA.flags[i]);
  assert.deepEqual(flags("Baneful Kick"), ["Makes Contact", "Kick Based"]);
  assert.deepEqual(flags("Eerie Laugh"), ["Sound Based"]);
  assert.deepEqual(flags("Cheap Stab"), ["Makes Contact", "Horn Based"]);
  assert.deepEqual(flags("Arc Blast"), ["Light Based"]); // 2.65.5: a NextDex passou a trazer a flag Light Based no Arc Blast
  assert.equal(R.MOVE_CATEGORIAS[String(id("Eerie Laugh"))].se, "Paralyze Ignore Type");
});

test("quem aprende os golpes novos: level-up e tutor da config (Alakazam: Luster Glow 51; Electrode: Arc Blast 56; Hitmonlee: Baneful Kick 46; Rhyhorn: Cheap Stab por tutor)", () => {
  const aprende = (esp, golpeNome) => sp(esp).lm.some((e) => e[1] === id(golpeNome));
  assert.ok(sp("Alakazam").lm.some((e) => e[0] === 51 && e[1] === id("Luster Glow")));
  assert.ok(sp("Electrode").lm.some((e) => e[0] === 56 && e[1] === id("Arc Blast")));
  assert.ok(sp("Hitmonlee").lm.some((e) => e[0] === 46 && e[1] === id("Baneful Kick")));
  assert.ok(sp("Rhyhorn").tu.includes(id("Cheap Stab")));
  assert.ok(aprende("Chinchou", "Sparkling Blast") && aprende("Chinchou", "Arc Blast"));
  assert.ok(!aprende("Magikarp", "Arc Blast"));
  const lvs = sp("Alakazam").lm.map((e) => e[0]); // a entrada nova entra no lugar do nível, sem quebrar a ordem que a espécie já tinha
  assert.deepEqual(lvs, [...lvs].sort((x, y) => x - y));
  const IDS_NOVOS = ESPERADO.map((e) => id(e[0])); // 2.65.5: a NextDex já traz o aprendizado dos 9; a config deixou de carregá-lo (patch.aprende só tem o delta restante)
  const comNovos = R.SPECIES.filter((e) => e && (e.lm.some((x) => IDS_NOVOS.includes(x[1])) || e.tu.some((m) => IDS_NOVOS.includes(m))));
  assert.equal(comNovos.length, 134, "espécies do dex que aprendem algum dos 9 golpes novos (NextDex 2.65.5; eram 97 na config 486a964 e 56 na d1a9a4c)");
});

test("os golpes de luz novos rendem com Photokinesis (x1,3); Baneful Kick é chute (Striker conta) e Cheap Stab é chifre (Mighty Horn conta)", () => {
  const unid = (esp, hab, golpes) => {
    const s = sp(esp);
    const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Hardy", evs: [0, 252, 0, 252, 0, 0], item: "", moves: golpes }, NIVEL, null);
    const ids = hab ? [R.ABILITY_ID_BY_NAME[hab]] : [];
    u.ids = ids; u.ef = R.efeitoDasHabilidadesNoDuelo(ids, "G09_" + esp + hab + golpes, null); u.tipos = R.tiposNaBatalha(s, u.ef);
    u.golpeIds = golpes.map(id); u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
    return u;
  };
  const alvo = unid("Magikarp", null, ["Tackle"]);
  const razao = (golpeNome, hab) => R.danoNoDuelo(unid("Garchomp", hab, [golpeNome]), alvo, NIVEL).melhor.dano / R.danoNoDuelo(unid("Garchomp", null, [golpeNome]), alvo, NIVEL).melhor.dano;
  perto(razao("Arc Blast", "Photokinesis"), 1.3, 0.05, "Arc Blast + Photokinesis");
  perto(razao("Scorching Ray", "Photokinesis"), 1.3, 0.05, "Scorching Ray + Photokinesis");
  perto(razao("Baneful Kick", "Photokinesis"), 1, 1e-9, "Baneful Kick não é luz");
  assert.ok(razao("Baneful Kick", "Striker") > 1.1, "Striker reforça o chute novo");
  assert.ok(razao("Cheap Stab", "Mighty Horn") > 1.1, "Mighty Horn reforça o chifre novo");
});

test("Eerie Laugh: golpe de status que paraliza ignorando o tipo; entra como som e como plano de paralisia", () => {
  const p = R.planoDoGolpeStatus(id("Eerie Laugh"));
  assert.equal(p.status, "paralisar");
  assert.equal(p.ignoraTipo, true);
  assert.equal(R.MOVE_ROLES[String(id("Eerie Laugh"))], "suporte");
});
