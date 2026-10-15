// Ticket calibracao-2026-10-15/05 (15/10/2026):
// A6) Multiscale, Brain Mass e Shadow Shield cortam pela metade só o 1º golpe com o HP cheio (abilities.cc:1947, 11518, 3171:
//     `if (BATTLER_MAX_HP(battler)) MUL(.5)`), não 25% da luta toda (antes: reducao.todos = 0,75 fixo).
// A5) Booster Energy liga Protosynthesis e Quark Drive na entrada: o maior atributo sobe x1,3 (Speed x1,5) e fica até o Pokémon sair
//     (abilities.cc:6917-6970). Antes só o sol armava o bônus e o item só era lido na validação da build.
// Chefões reais do app: Slither Wing do Steven, Flutter Mane do Crobatite Dewford Manor, os cinco Iron do Monochamp, Scream Tail do Blunder.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b + " (tolerância " + tol + ")");
const alvoNeutro = (extra) => Object.assign({ sp: { n: "Alvo", sname: "SPECIES_ALVO", inn: [] }, tipos: ["Normal"], ids: [], ef: R.efeitoDasHabilidadesNoDuelo([], "ALVO05", null),
  item: "", it: R.itemDoDuelo("", null), stats: [400, 100, 100, 100, 100, 100], golpesProntos: [], statusIds: [] }, extra || {});
const membro = (chefao, mon) => {
  const b = R.BOSSES.find((x) => x.name === chefao);
  const p = b && b.party.find((x) => x.n === mon);
  assert.ok(p, chefao + " / " + mon + " não existe em bosses.json");
  return p;
};
const golpe = (tipo, cat, extra) => Object.assign({ nome: "T" + tipo, tipo, cat: cat || "F", contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
const sintetica = (habs, golpes, extra) => {
  const ids = habs.map(idHab);
  return Object.assign({ sp: { n: "Teste", sname: "SPECIES_TESTE05", inn: [] }, tipos: ["Normal"], ids, ef: R.efeitoDasHabilidadesNoDuelo(ids, "AB05_" + habs.join("+"), null), item: "", it: R.itemDoDuelo("", null),
    stats: [320, 100, 100, 100, 100, 100], golpesProntos: golpes || [golpe("Normal")], statusIds: [] }, extra || {});
};
const comItem = (u, item) => Object.assign({}, u, { item, it: R.itemDoDuelo(item, u.sp) });

// ---------- A6: Multiscale, Brain Mass, Shadow Shield ----------
test("Multiscale, Shadow Shield e Brain Mass: golpeCheio = 0,5 (só o 1º golpe com HP cheio) e nenhum corte fixo de 25% na luta toda", () => {
  for (const n of ["Multiscale", "Shadow Shield", "Brain Mass"]) {
    const ef = R.efeitoDasHabilidadesNoDuelo([idHab(n)], "MS_" + n, null);
    assert.equal(ef.golpeCheio, 0.5, n);
    assert.equal(ef.reducao.todos, 1, n + ": antes era 0,75 em todo golpe");
  }
  // as que somam a Multiscale herdam: Blight Scale (Multiscale + Poison Point), Ominous Shroud (Phantom + Shadow Shield)
  for (const n of ["Blight Scale", "Ominous Shroud"]) assert.equal(R.efeitoDasHabilidadesNoDuelo([idHab(n)], "MS_" + n, null).golpeCheio, 0.5, n);
  assert.equal(R.efeitoDasHabilidadesNoDuelo([idHab("Sturdy")], "MS_Sturdy", null).golpeCheio, 1, "controle: Sturdy não é Multiscale");
});

test("Multiscale no duelo: o 1º golpe sai pela metade e os seguintes inteiros; em n turnos o dano médio vale (0,5 + n-1)/n do normal", () => {
  const eu = sintetica([], [golpe("Fire")]);
  const com = sintetica(["Multiscale"], [golpe("Normal")], { tipos: ["Water"] });
  const sem = sintetica([], [golpe("Normal")], { tipos: ["Water"] });
  const meu = (rival, turnos) => R.danoComStatusNoDuelo(eu, rival, R.danoNoDuelo(eu, rival, NIVEL), R.danoNoDuelo(rival, eu, NIVEL), turnos, true).meu;
  for (const n of [1, 2, 3, 6]) perto(meu(com, n) / meu(sem, n), (0.5 + n - 1) / n, 1e-9, n + " turno(s)");
});

test("Multiscale numa luta inteira (sem golpe de status, só dano): o dano causado no alvo cai a (0,5 + n-1)/n em n turnos", () => {
  const eu = sintetica([], [golpe("Fire", "F", { forca: 80, forcaBase: 80, poder: 80 })], { stats: [320, 100, 100, 100, 100, 50] });
  const fraco = (habs) => sintetica(habs, [golpe("Normal", "F", { forca: 120, forcaBase: 120, poder: 120 })], { tipos: ["Water"] });
  const a = R.resultadoDoDuelo(eu, fraco(["Multiscale"]), NIVEL, { detalhe: true }), b = R.resultadoDoDuelo(eu, fraco([]), NIVEL, { detalhe: true });
  assert.equal(a.turnos, 6);
  assert.equal(b.turnos, 6);
  assert.equal(a.venceu, false);
  perto((1 - a.fracFoe) / (1 - b.fracFoe), (0.5 + 5) / 6, 0.005, "razão do dano causado em 6 turnos");
});

test("o Mold Breaker do atacante atravessa a Multiscale (ela é breakable no código)", () => {
  const molde = sintetica(["Mold Breaker"], [golpe("Fire")]);
  const com = sintetica(["Multiscale"], [golpe("Normal")], { tipos: ["Water"] });
  const sem = sintetica([], [golpe("Normal")], { tipos: ["Water"] });
  const meu = (rival) => R.danoComStatusNoDuelo(molde, rival, R.danoNoDuelo(molde, rival, NIVEL), R.danoNoDuelo(rival, molde, NIVEL), 3, true).meu;
  perto(meu(com) / meu(sem), 1, 1e-9, "Mold Breaker");
});

test("Multiscale junto da Chuckster (metade no 1º golpe): os dois cortes se multiplicam no 1º golpe (x0,25)", () => {
  const eu = sintetica([], [golpe("Fire")]);
  const dois = sintetica(["Multiscale", "Chuckster"], [golpe("Normal")], { tipos: ["Water"] });
  const sem = sintetica([], [golpe("Normal")], { tipos: ["Water"] });
  const meu = (rival, turnos) => R.danoComStatusNoDuelo(eu, rival, R.danoNoDuelo(eu, rival, NIVEL), R.danoNoDuelo(rival, eu, NIVEL), turnos, true).meu;
  perto(meu(dois, 1) / meu(sem, 1), 0.25, 1e-9, "1 turno");
});

test("Dragonite de chefão (Multiscale de innate): o corte some a partir do 2º golpe", () => {
  const dragonite = R.BOSSES.flatMap((b) => b.party).find((p) => p.n === "Dragonite");
  assert.ok(dragonite, "há um Dragonite entre os chefões");
  const foe = R.foeDeDuelo(dragonite, NIVEL, null);
  assert.ok(foe.ids.includes(idHab("Multiscale")), "o Dragonite tem Multiscale");
  assert.equal(foe.ef.golpeCheio, 0.5);
  assert.equal(foe.ef.reducao.todos, 1);
});

// O pipeline de build: a linha de cada golpe conta quantos golpes derrubam o alvo.
test("pipeline: contra um alvo com Multiscale o 1º golpe vale metade; o que derrubava em 1 golpe passa a precisar de 2", () => {
  const atq = sintetica([], [golpe("Fire")]);
  const g = atq.golpesProntos[0];
  const dano = R.danoNoDuelo(atq, alvoNeutro(), NIVEL).melhor.dano;
  const linha = (hp, habs) => R.pipelineLinhaDoGolpe(Object.assign({}, atq, { golpesProntos: [g] }), g, alvoNeutro({ stats: [hp, 100, 100, 100, 100, 100], ef: R.efeitoDasHabilidadesNoDuelo(habs.map(idHab), "ALVOP_" + habs.join("+"), null) }), NIVEL, []);
  assert.equal(linha(dano * 0.9, []).n, 1, "sem Multiscale o golpe derruba de uma vez");
  assert.equal(linha(dano * 0.9, ["Multiscale"]).n, 2, "com Multiscale (dano x0,5 no 1º) já não derruba");
  assert.equal(linha(dano * 0.4, ["Multiscale"]).n, 1, "se o meio golpe ainda derruba, segue em 1");
  assert.equal(linha(dano * 1.4, []).n, 2);
  assert.equal(linha(dano * 1.4, ["Multiscale"]).n, 2, "0,5 + 1 = 1,5 já derruba 1,4");
  assert.equal(linha(dano * 1.6, ["Multiscale"]).n, 3, "0,5 + 1 = 1,5 não derruba 1,6");
  assert.equal(linha(dano * 0.9, ["Multiscale"]).primeiroMult, 0.5);
  const molde = Object.assign({}, atq, { ef: R.efeitoDasHabilidadesNoDuelo([idHab("Mold Breaker")], "MB05", null) });
  assert.equal(R.pipelineLinhaDoGolpe(molde, g, alvoNeutro({ stats: [dano * 0.9, 100, 100, 100, 100, 100], ef: R.efeitoDasHabilidadesNoDuelo([idHab("Multiscale")], "ALVOP_M", null) }), NIVEL, []).n, 1, "Mold Breaker atravessa");
});

// ---------- A5: Booster Energy ----------
test("o texto \"Boosts highest stat in Sun or with Booster Energy\" liga o item (Protosynthesis) e o de Quark Drive também", () => {
  for (const n of ["Protosynthesis", "Quark Drive"]) assert.equal(R.efeitoDasHabilidadesNoDuelo([idHab(n)], "PX_" + n, null).paradoxoItem, true, n);
  assert.equal(R.efeitoDasHabilidadesNoDuelo([idHab("Sun Worship")], "PX_SW", null).paradoxoItem, false, "controle");
  assert.equal(R.itemDoDuelo("Booster Energy", null).boosterEnergy, true);
  assert.equal(R.itemDoDuelo("Leftovers", null).boosterEnergy, false);
});

test("Slither Wing do Steven (Atk é o maior): o Flying Press sai x1,3 com o Booster Energy", () => {
  const p = membro("Steven", "Slither Wing");
  assert.equal(p.item, "Booster Energy");
  const com = R.foeDeDuelo(p, NIVEL, null), sem = R.foeDeDuelo(Object.assign({}, p, { item: "" }), NIVEL, null);
  assert.equal(R.maiorAtributoDuelo(com).atributo, 1, "o Atk é o maior atributo");
  const a = R.danoNoDuelo(com, alvoNeutro(), NIVEL).melhor, b = R.danoNoDuelo(sem, alvoNeutro(), NIVEL).melhor;
  assert.equal(a.golpe.nome, b.golpe.nome);
  assert.equal(a.golpe.cat, "F");
  perto(a.dano / b.dano, 1.3, 0.013, "Slither Wing");
});

test("Flutter Mane do Crobatite Dewford Manor (SpA é o maior): o Moonblast sai x1,3 com o Booster Energy", () => {
  const p = membro("Crobatite Dewford Manor", "Flutter Mane");
  assert.equal(p.item, "Booster Energy");
  const com = R.foeDeDuelo(p, NIVEL, null), sem = R.foeDeDuelo(Object.assign({}, p, { item: "" }), NIVEL, null);
  assert.equal(R.maiorAtributoDuelo(com).atributo, 3, "o SpA é o maior atributo");
  const a = R.danoNoDuelo(com, alvoNeutro(), NIVEL).melhor, b = R.danoNoDuelo(sem, alvoNeutro(), NIVEL).melhor;
  assert.equal(a.golpe.cat, "E");
  perto(a.dano / b.dano, 1.3, 0.013, "Flutter Mane");
});

test("Iron Valiant (Speed é o maior): a Velocidade sobe x1,5 e o dano não muda", () => {
  const p = membro("Monochamp Fighting", "Iron Valiant");
  const com = R.foeDeDuelo(p, NIVEL, null), sem = R.foeDeDuelo(Object.assign({}, p, { item: "" }), NIVEL, null);
  assert.equal(R.maiorAtributoDuelo(com).atributo, 5, "a Speed é o maior atributo");
  const vel = (u) => R.velocidadeNoDuelo(u, 1, alvoNeutro(), u.golpesProntos[0], null);
  perto(vel(com) / vel(sem), 1.5, 1e-9, "Velocidade");
  perto(R.danoNoDuelo(com, alvoNeutro(), NIVEL).melhor.dano / R.danoNoDuelo(sem, alvoNeutro(), NIVEL).melhor.dano, 1, 1e-9, "dano");
});

test("Scream Tail do Blunder (Sp. Def é o maior): defendendo de golpe especial leva 1/1,3; o ataque dele (físico) não muda", () => {
  const p = membro("Blunder", "Scream Tail");
  const com = R.foeDeDuelo(p, NIVEL, null), sem = R.foeDeDuelo(Object.assign({}, p, { item: "" }), NIVEL, null);
  assert.equal(R.maiorAtributoDuelo(com).atributo, 4, "a Sp. Def é o maior atributo");
  const especial = sintetica([], [golpe("Fire", "E")]);
  const fisico = sintetica([], [golpe("Fire", "F")]);
  const levado = (atq, def) => R.danoNoDuelo(atq, def, NIVEL).melhor.dano;
  perto(levado(especial, com) / levado(especial, sem), 1 / 1.3, 0.02, "golpe especial recebido");
  perto(levado(fisico, com) / levado(fisico, sem), 1, 1e-9, "golpe físico recebido");
  perto(R.danoNoDuelo(com, alvoNeutro(), NIVEL).melhor.dano / R.danoNoDuelo(sem, alvoNeutro(), NIVEL).melhor.dano, 1, 1e-9, "o ataque físico dele");
});

test("Booster Energy só liga Protosynthesis e Quark Drive; Klutz desliga; sem o item nada muda", () => {
  const atq = (habs, item) => comItem(sintetica(habs, [golpe("Fire")], { stats: [320, 200, 100, 100, 100, 100] }), item);
  const dano = (u) => R.danoNoDuelo(u, alvoNeutro(), NIVEL).melhor.dano;
  const base = dano(atq([], ""));
  perto(dano(atq(["Protosynthesis"], "Booster Energy")) / base, 1.3, 0.013, "Protosynthesis");
  perto(dano(atq(["Quark Drive"], "Booster Energy")) / base, 1.3, 0.013, "Quark Drive");
  perto(dano(atq(["Protosynthesis"], "")) / base, 1, 1e-9, "sem o item (e sem sol)");
  perto(dano(atq(["Intimidate"], "Booster Energy")) / base, 1, 1e-9, "outra habilidade com o item");
  perto(dano(atq(["Protosynthesis", "Klutz"], "Booster Energy")) / base, 1, 1e-9, "Klutz desliga o item");
});

test("o maior atributo desempata na ordem do jogo (Atk, Def, Speed, SpA, SpD): com Atk e Speed iguais só o Atk sobe", () => {
  const u = (stats) => comItem(sintetica(["Protosynthesis"], [golpe("Fire")], { stats }), "Booster Energy");
  assert.equal(R.maiorAtributoDuelo(u([320, 150, 100, 100, 100, 150])).atributo, 1, "Atk = Speed: Atk");
  assert.equal(R.maiorAtributoDuelo(u([320, 100, 100, 150, 100, 150])).atributo, 5, "SpA = Speed: Speed vem antes do SpA");
  assert.equal(R.maiorAtributoDuelo(u([320, 100, 150, 100, 100, 150])).atributo, 2, "Def = Speed: Def");
  assert.equal(R.maiorAtributoDuelo(u([320, 100, 100, 100, 150, 100])).atributo, 4);
  // a Speed igual ao Atk não sobe x1,5
  const rapido = u([320, 150, 100, 100, 100, 150]), sem = comItem(rapido, "");
  perto(R.velocidadeNoDuelo(rapido, 1, alvoNeutro(), rapido.golpesProntos[0], null) / R.velocidadeNoDuelo(sem, 1, alvoNeutro(), sem.golpesProntos[0], null), 1, 1e-9, "Speed empatada com o Atk");
});

test("Protosynthesis no sol também ganha a Speed x1,5 quando ela é o maior atributo (antes só o x1,3 do ataque e da defesa)", () => {
  const solar = (stats) => Object.assign(sintetica(["Protosynthesis"], [golpe("Fire")], { stats }), { ef: R.efeitoDasHabilidadesNoDuelo([idHab("Protosynthesis")], "PX_SOL05", "sol") });
  const u = solar([320, 100, 100, 100, 100, 180]);
  assert.equal(u.ef.maiorMult, 1.3);
  perto(R.velocidadeNoDuelo(u, 1, alvoNeutro(), u.golpesProntos[0], null), 180 * 1.5, 1e-9, "Velocidade");
});
