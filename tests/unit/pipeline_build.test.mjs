// Pipeline de build com intenção (ticket 20 da dívida, 14/10/2026): src/regras/pipeline_build.js, só pela interface
// pública (candidatosDeBuild, especiesQueResolvem, fecharBuild), com as regras carregadas como no app.
// Caso A: a sinergia do kit (Centiskorch: Coil Up + Flaming Jaws => Fire Fang, não Fire Lash).
// Caso B: matar o alvo no turno 1 (Ledian contra o Ninetales da Meteor Falls; a prioridade não vale contra Queenly Majesty).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

// Etapa da luta da Meteor Falls: milestone 3, cap 55 no modo fácil (o mesmo da calibração com a calculadora do jogo).
const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" });
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const courtney = R.BOSSES.find((b) => b.name === "Courtney Meteor Falls");
const ninetales = { chefao: courtney, indice: 0 };
const alakazam = { chefao: courtney, indice: 1 };
// Os objetos vêm de outro contexto (vm): compara pela forma, não pelo protótipo.
const plain = (v) => JSON.parse(JSON.stringify(v));
const deepEqual = (a, b, msg) => assert.deepEqual(plain(a), plain(b), msg);
const tier = (c) => (c.hitKill === 1 && c.baterPrimeiro ? 3 : c.hitKill === 2 && c.baterPrimeiro ? 2 : 1);

// ---------- caso A: Centiskorch ----------
function centiskorch(milestone) {
  const Rm = carregarRegras({ milestone, difficulty: "ace", levelCapMode: "more" });
  return { Rm, r: Rm.candidatosDeBuild(Rm.SPECIES.find((s) => s && s.n === "Centiskorch"), {}) };
}

test("caso A: Brawly (milestone 1) - o 1º candidato é Coil Up + Fire Fang, nunca Fire Lash no lugar", () => {
  const { r } = centiskorch(1);
  const c = r.candidatos[0];
  assert.equal(c.habilidade, "Coil Up");
  assert.ok(c.golpes.includes("Fire Fang"), c.golpes.join("/"));
  assert.ok(!c.golpes.includes("Fire Lash"));
  const motivos = c.motivos.join(" | ");
  assert.match(motivos, /Coil Up/);
  assert.match(motivos, /Flaming Jaws/);
  // nenhum candidato acima de um com Fire Lash fica sem o Fire Fang
  r.candidatos.forEach((x) => { if (x.golpes.includes("Fire Lash")) assert.ok(x.golpes.includes("Fire Fang") || r.candidatos.indexOf(x) > 0); });
});

test("caso A: Tate e Liza (milestone 6) - Coil Up + Fire Fang de novo, com Flaming Jaws nos motivos", () => {
  const { r } = centiskorch(6);
  const c = r.candidatos[0];
  assert.equal(c.habilidade, "Coil Up");
  assert.ok(c.golpes.includes("Fire Fang") && !c.golpes.includes("Fire Lash"), c.golpes.join("/"));
  assert.match(c.motivos.join(" | "), /Flaming Jaws/);
});

test("caso A: sem chefão adiante, os candidatos saem só por sinergia (hit-kill 0) e Coil Up + Fire Fang lidera", () => {
  const { r } = centiskorch(8);
  assert.equal(r.alvo, null);
  assert.match(r.aviso, /sem chefão adiante/);
  assert.ok(r.candidatos.length >= 3);
  r.candidatos.forEach((c) => {
    assert.equal(c.hitKill, 0);
    assert.equal(c.baterPrimeiro, false);
    assert.equal(c.porQue, null);
    deepEqual(c.dano, { min: 0, max: 0 });
    assert.equal(c.rotulo, "estimada");
  });
  assert.equal(r.candidatos[0].habilidade, "Coil Up");
  assert.ok(r.candidatos[0].golpes.includes("Fire Fang"));
  assert.ok(!r.avisos.includes("Simulação 1x1: luta em dupla e Fake Out não são simulados."), "sem alvo não há simulação para avisar");
});

// ---------- caso B: Ninetales da Meteor Falls ----------
test("caso B: Ledian derruba o Ninetales com Mega Punch, bate primeiro por velocidade, calibrada", () => {
  const r = R.candidatosDeBuild(sp("Ledian"), { alvo: ninetales });
  const c = r.candidatos.find((x) => x.golpes.includes("Mega Punch"));
  assert.ok(c, "nenhum candidato com Mega Punch: " + r.candidatos.map((x) => x.golpes.join("/")).join(" ; "));
  assert.equal(c.hitKill, 1);
  assert.equal(c.baterPrimeiro, true);
  assert.equal(c.porQue, "velocidade");
  assert.equal(c.rotulo, "calibrada");
  assert.match(c.motivos.join(" | "), /derruba no turno 1/);
  assert.match(c.motivos.join(" | "), /Velocidade contra 166/);
  deepEqual(r.alvo, { chefao: "Courtney Meteor Falls", indice: 0, pokemon: ["Ninetales"], origem: "informado" });
  assert.ok(r.avisos.includes("Simulação 1x1: luta em dupla e Fake Out não são simulados."));
  // O motor vê o Flame Burst (+1) do Ninetales: o candidato avisa, em vez de prometer mais do que sabe.
  assert.match(c.avisos.join(" | "), /Flame Burst/);
});

test("caso B: a faixa de dano do candidato está em % do HP do alvo e min < max", () => {
  const c = R.candidatosDeBuild(sp("Ledian"), { alvo: ninetales }).candidatos[0];
  assert.ok(c.dano.min > 90 && c.dano.max > c.dano.min && c.dano.max < 125, JSON.stringify(c.dano) + " (referência sem item: com Life Orb passaria de 130%)");
});

test("caso B: a prioridade não vale contra Queenly Majesty - o Accelgor não 'bate primeiro por prioridade'", () => {
  const r = R.candidatosDeBuild(sp("Accelgor"), { alvo: ninetales });
  assert.ok(r.candidatos.length >= 3);
  r.candidatos.forEach((c) => {
    assert.notEqual(c.porQue, "prioridade", c.golpes.join("/"));
    assert.ok(!c.golpes.includes("Beatdown"), "o Beatdown (+1) não derruba o Ninetales");
  });
});

test("caso B: a prioridade condicional (Coil Up) também não vale contra Queenly Majesty", () => {
  // Steelix com Coil Up derruba o Ninetales em 1 golpe, mas é lento: sem a prioridade ele NÃO bate primeiro.
  const c = R.candidatosDeBuild(sp("Steelix"), { alvo: ninetales }).candidatos[0];
  assert.equal(c.habilidade, "Coil Up");
  assert.equal(c.hitKill, 1);
  assert.equal(c.baterPrimeiro, false);
  assert.equal(c.porQue, null);
  // O mesmo Steelix contra o Alakazam (sem a habilidade) segue sem prioridade porque lá o golpe leva 2 hits (Focus Sash).
  const k = R.candidatosDeBuild(sp("Steelix"), { alvo: alakazam }).candidatos;
  assert.ok(k.every((x) => x.hitKill === 2));
  assert.ok(k.every((x) => !x.baterPrimeiro), "a prioridade condicional vale só no golpe que derruba de uma vez");
});

test("rótulo 'estimada' para golpe fora da lista calibrada, e o texto não promete 'turno 1'", () => {
  const c = R.candidatosDeBuild(sp("Accelgor"), { alvo: ninetales }).candidatos.find((x) => x.hitKill === 1);
  assert.ok(c);
  assert.equal(c.rotulo, "estimada");
  const texto = c.motivos.join(" | ");
  assert.match(texto, /Provável derrubar/);
  assert.doesNotMatch(texto, /derruba no turno 1/);
  assert.match(c.avisos.join(" | "), /ainda não conferido na calculadora/);
});

test("Focus Sash do alvo (Alakazam): o hit-kill de 1 golpe vira 2 e o candidato avisa", () => {
  const r = R.candidatosDeBuild(sp("Ledian"), { alvo: alakazam });
  deepEqual(r.alvo.pokemon, ["Alakazam"]);
  r.candidatos.forEach((c) => assert.notEqual(c.hitKill, 1));
  assert.ok(r.candidatos.some((c) => /Focus Sash/.test(c.avisos.join(" "))));
});

test("chefão sem índice: mede o primeiro e o ás (o último) e vale o pior dos dois", () => {
  const r = R.candidatosDeBuild(sp("Ledian"), { alvo: { chefao: courtney } });
  deepEqual(r.alvo.pokemon, ["Ninetales", "Charizard"]);
  const c = r.candidatos[0];
  assert.match(c.motivos.join(" | "), /Medido contra o primeiro \(Ninetales\) e o ás \(Charizard\); vale o pior/);
});

test("alvo { foe } já montado pelo motor vale como alvo", () => {
  const foe = R.foeDeDuelo(courtney.party[0], 55, null);
  const r = R.candidatosDeBuild(sp("Ledian"), { alvo: { foe } });
  deepEqual(r.alvo.pokemon, ["Ninetales"]);
  assert.ok(r.candidatos.some((c) => c.golpes.includes("Mega Punch") && c.hitKill === 1));
});

// ---------- invariantes ----------
const AMOSTRA = ["Ledian", "Accelgor", "Steelix", "Centiskorch", "Scizor", "Diglett", "Vaporeon", "Gulpin", "Lickilicky", "Gigalith", "Fearow", "Ninetales"];

test("todo candidato passa em validateAiBuild, tem de 3 a 5 conjuntos distintos e vem na ordem do ranking", () => {
  AMOSTRA.forEach((nome) => {
    const r = R.candidatosDeBuild(sp(nome), { alvo: ninetales });
    const rico = !["Vaporeon", "Gigalith", "Lickilicky", "Diglett", "Gulpin"].includes(nome); // poucos golpes de dano contra o alvo
    assert.ok(r.candidatos.length >= (rico ? 3 : 1) && r.candidatos.length <= 5, nome + ": " + r.candidatos.length + " (" + r.aviso + ")");
    const conjuntos = r.candidatos.map((c) => c.golpes.slice().sort().join(","));
    assert.equal(new Set(conjuntos).size, conjuntos.length, nome + ": conjunto repetido");
    r.candidatos.forEach((c, i) => {
      assert.equal(c.golpes.length, 4);
      assert.ok(R.validateAiBuild(sp(nome), c.build, {}, {}), nome + " " + c.golpes.join("/"));
      deepEqual(c.build.moves, c.golpes);
      assert.equal(c.build.ability, c.habilidade);
      if (i > 0) assert.ok(tier(r.candidatos[i - 1]) >= tier(c), nome + ": hit-kill de 1 e bate primeiro > hit-kill de 2 e bate primeiro > resto");
      assert.ok(["calibrada", "estimada"].includes(c.rotulo));
      assert.ok(Array.isArray(c.motivos) && c.motivos.length > 0 && Array.isArray(c.avisos));
    });
  });
});

test("a prioridade vence a Velocidade só quando o golpe é de prioridade e não é bloqueado (Fearow, Gale Wings)", () => {
  // contra o Alakazam (sem Queenly Majesty) um golpe de prioridade vale; o rótulo do porquê é coerente com o flag
  R.candidatosDeBuild(sp("Fearow"), { alvo: alakazam }).candidatos.forEach((c) => {
    assert.equal(c.porQue === null, !c.baterPrimeiro);
    if (c.porQue === "prioridade") assert.equal(c.baterPrimeiro, true);
  });
});

test("rótulo 'calibrada' só quando o hit-kill é sustentado por golpe da lista", () => {
  AMOSTRA.forEach((nome) => {
    R.candidatosDeBuild(sp(nome), { alvo: ninetales }).candidatos.forEach((c) => {
      if (c.rotulo === "calibrada") {
        assert.ok(c.hitKill > 0 && c.golpes.some((g) => ["Mega Punch", "Aerial Ace"].includes(g)), nome + " " + c.golpes.join("/"));
        assert.match(c.motivos.join(" "), /Mega Punch|Aerial Ace/);
      } else assert.doesNotMatch(c.motivos.join(" "), /derruba no turno 1/);
    });
  });
});

test("determinismo: duas chamadas iguais dão o mesmo resultado", () => {
  AMOSTRA.slice(0, 5).forEach((nome) => {
    const a = R.candidatosDeBuild(sp(nome), { alvo: ninetales }), b = R.candidatosDeBuild(sp(nome), { alvo: ninetales });
    deepEqual(a, b, nome);
  });
});

test("não muta o state", () => {
  const Rx = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" });
  Rx.state.team = [Rx.getSpeciesBySname("SPECIES_LEDIAN").x];
  Rx.state.box = [Rx.getSpeciesBySname("SPECIES_ACCELGOR").x];
  const foto = () => JSON.stringify(Rx.state, (k, v) => (v instanceof Set ? [...v] : v));
  const antes = foto();
  const alvo = { chefao: Rx.BOSSES.find((b) => b.name === "Courtney Meteor Falls"), indice: 0 };
  const c = Rx.candidatosDeBuild(Rx.getSpeciesBySname("SPECIES_LEDIAN"), {});
  Rx.candidatosDeBuild(Rx.getSpeciesBySname("SPECIES_LEDIAN"), { alvo });
  Rx.especiesQueResolvem(alvo, {});
  Rx.fecharBuild(c.candidatos[0], { evs: [0, 252, 0, 0, 0, 252], item: "", natureza: "Adamant" });
  assert.equal(foto(), antes);
});

test("sem alvo: o próximo líder de ginásio da Etapa (e o aviso quando não há mais nenhum)", () => {
  const R0 = carregarRegras({ milestone: 0 });
  assert.equal(R0.candidatosDeBuild(R0.getSpeciesBySname("SPECIES_LEDIAN"), {}).alvo.chefao, "Roxanne 1");
  assert.equal(R0.candidatosDeBuild(R0.getSpeciesBySname("SPECIES_LEDIAN"), {}).alvo.origem, "proximo-lider");
  const R2 = carregarRegras({ milestone: 2 });
  assert.match(R2.candidatosDeBuild(R2.getSpeciesBySname("SPECIES_LEDIAN")).alvo.chefao, /^Wattson/);
  const R8 = carregarRegras({ milestone: 8 });
  const r = R8.candidatosDeBuild(R8.getSpeciesBySname("SPECIES_LEDIAN"));
  assert.equal(r.alvo, null);
  assert.match(r.aviso, /sem chefão adiante/);
});

test("falta de dado nunca lança: espécie sem golpe, espécie inexistente e alvo inválido", () => {
  const semGolpes = Object.assign({}, sp("Magikarp"), { lm: [], tu: [] });
  const r = R.candidatosDeBuild(semGolpes, { alvo: ninetales });
  deepEqual(r.candidatos, []);
  assert.match(r.aviso, /não tem golpe de dano/);
  deepEqual(R.candidatosDeBuild(null).candidatos, []);
  deepEqual(R.candidatosDeBuild("SPECIES_NAO_EXISTE").candidatos, []);
  const ruim = R.candidatosDeBuild(sp("Ledian"), { alvo: { chefao: "Ninguém" } });
  deepEqual(ruim.candidatos, []);
  assert.match(ruim.aviso, /chefão não encontrado/);
  assert.match(R.candidatosDeBuild(sp("Ledian"), { alvo: { qualquer: 1 } }).aviso, /alvo inválido/);
});

test("golpe que depende do item (Fling) fica fora: a referência é sem item", () => {
  AMOSTRA.forEach((nome) => R.candidatosDeBuild(sp(nome), { alvo: ninetales }).candidatos.forEach((c) => assert.ok(!c.golpes.includes("Fling"), nome)));
});

test("habilidade que só funciona gastando o item: o rascunho leva a Berry e o candidato avisa", () => {
  const r = R.candidatosDeBuild(sp("Gulpin"), { alvo: ninetales });
  assert.ok(r.candidatos.length > 0);
  r.candidatos.forEach((c) => {
    assert.equal(c.build.item, "Sitrus Berry");
    assert.match(c.avisos.join(" "), /Sitrus Berry/);
  });
});

test("tempo: cada espécie leva bem menos de 2 s", () => {
  AMOSTRA.forEach((nome) => {
    const t = Date.now();
    R.candidatosDeBuild(sp(nome), { alvo: { chefao: courtney } });
    const ms = Date.now() - t;
    assert.ok(ms < 2000, nome + ": " + ms + " ms");
  });
});

// ---------- 2. do alvo para os Pokémon ----------
test("especiesQueResolvem: time e caixa, só quem derruba (hitKill > 0), 1 golpe antes de 2 e quem bate primeiro antes", () => {
  const Rx = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" });
  const x = (s) => Rx.getSpeciesBySname(s).x;
  Rx.state.team = [x("SPECIES_LEDIAN"), x("SPECIES_ACCELGOR")];
  Rx.state.box = [x("SPECIES_STEELIX"), x("SPECIES_SCIZOR")];
  const alvo = { chefao: Rx.BOSSES.find((b) => b.name === "Courtney Meteor Falls"), indice: 0 };
  const lista = Rx.especiesQueResolvem(alvo, {});
  assert.ok(lista.length >= 3);
  lista.forEach((e) => { assert.ok(e.sp && e.sp.sname); assert.ok(e.candidato.hitKill > 0); });
  deepEqual(lista.map((e) => e.sp.sname).filter((s, i, a) => a.indexOf(s) === i), lista.map((e) => e.sp.sname));
  for (let i = 1; i < lista.length; i++) {
    const a = lista[i - 1].candidato, b = lista[i].candidato;
    assert.ok(a.hitKill < b.hitKill || (a.hitKill === b.hitKill && (a.baterPrimeiro || !b.baterPrimeiro)), "ordem do caso B");
  }
  // quem bate primeiro e derruba em 1 golpe vem antes do Steelix (que derruba, mas não bate primeiro)
  const nomes = lista.map((e) => e.sp.n);
  assert.ok(nomes.indexOf("Ledian") !== -1 && nomes.indexOf("Steelix") !== -1);
  assert.ok(nomes.indexOf("Ledian") < nomes.indexOf("Steelix"));
  // quem não está no time nem na caixa não entra
  assert.ok(!nomes.includes("Fearow"));
});

test("especiesQueResolvem: opts.especies substitui a lista e opts.max corta", () => {
  const lista = R.especiesQueResolvem(ninetales, { especies: ["SPECIES_LEDIAN", sp("Accelgor"), "SPECIES_SCIZOR"] });
  deepEqual(lista.map((e) => e.sp.sname).sort(), ["SPECIES_ACCELGOR", "SPECIES_LEDIAN", "SPECIES_SCIZOR"]);
  assert.equal(R.especiesQueResolvem(ninetales, { especies: ["SPECIES_LEDIAN", "SPECIES_ACCELGOR", "SPECIES_SCIZOR"], max: 2 }).length, 2);
  deepEqual(R.especiesQueResolvem({ chefao: "Ninguém" }, { especies: ["SPECIES_LEDIAN"] }), []);
  deepEqual(R.especiesQueResolvem(ninetales, { especies: [] }).length, 0);
});

// ---------- 3. fechar a build ----------
test("fecharBuild: com a escolha da IA devolve a build validada com os golpes e a habilidade do candidato", () => {
  const c = R.candidatosDeBuild(sp("Ledian"), { alvo: ninetales }).candidatos[0];
  const f = R.fecharBuild(c, { evs: [0, 252, 0, 0, 0, 252], item: "Life Orb", natureza: "Adamant" });
  assert.equal(f.ok, true, f.erros.join(" "));
  deepEqual(f.erros, []);
  deepEqual(f.build.moves, c.golpes);
  assert.equal(f.build.ability, c.habilidade);
  assert.equal(f.build.nature, "Adamant");
  assert.equal(f.build.item, "Life Orb");
  assert.ok(R.validateAiBuild(sp("Ledian"), f.build, {}, {}));
});

test("fecharBuild: EVs, item, natureza e candidato inválidos viram { ok: false, erros } sem exceção", () => {
  const c = R.candidatosDeBuild(sp("Ledian"), { alvo: ninetales }).candidatos[0];
  const base = { evs: [0, 252, 0, 0, 0, 252], item: "", natureza: "Adamant" };
  const ruins = [
    Object.assign({}, base, { evs: [0, 300, 0, 0, 0, 252] }), Object.assign({}, base, { evs: [0, 252, 0, 0, 0] }),
    Object.assign({}, base, { evs: [252, 252, 252, 0, 0, 0] }), Object.assign({}, base, { evs: "muito" }), Object.assign({}, base, { evs: [0, 1.5, 0, 0, 0, 0] }),
    Object.assign({}, base, { item: "Item Que Nao Existe" }), Object.assign({}, base, { item: 7 }),
    Object.assign({}, base, { natureza: "Nope" }), Object.assign({}, base, { natureza: undefined }), null, undefined, {}
  ];
  ruins.forEach((e) => {
    const f = R.fecharBuild(c, e);
    assert.equal(f.ok, false, JSON.stringify(e));
    assert.equal(f.build, null);
    assert.ok(f.erros.length > 0 && typeof f.erros[0] === "string");
  });
  [null, undefined, {}, { sname: "SPECIES_LEDIAN" }, { sname: "SPECIES_NAO_EXISTE", build: { moves: [] } }].forEach((cand) => {
    const f = R.fecharBuild(cand, base);
    assert.equal(f.ok, false);
    assert.ok(f.erros.length > 0);
  });
});
