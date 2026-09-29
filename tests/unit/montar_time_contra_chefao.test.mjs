// Botão "Montar time contra este chefão" (2026-09-29): o simulador de duelo
// (src/regras/duelo.js) escolhe os 6 que cobrem o time do chefão. Fixture real:
// a derrota do usuário para a Flannery 1 numa run Monotype Fairy, level cap 50.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "more" });
const porNome = (n) => { const s = R.SPECIES.find((x) => x && x.n === n); assert.ok(s, n); return s; };
const flannery = R.BOSSES.find((b) => b.name === "Flannery 1");
const party = R.bossPartyPorDificuldade(flannery);
const FADAS = ["Tinkaton", "Mawile", "Grimmsnarl", "Klefki", "Rapidash Galarian", "Tsareena Redux", "Alcremie", "Whimsicott",
  "Lilligant", "Ninetales Alolan", "Lycanroc Twilight", "Carbink", "Luvdisc", "Togekiss", "Florges White", "Gardevoir",
  "Granbull", "Wigglytuff", "Dachsbun", "Weezing Galarian", "Azumarill", "Clefable"];
const candidatos = () => FADAS.map((n) => ({ sp: porNome(n), owned: porNome(n).x }));

test("o time da Flannery 1 arma sol (Drought de innate)", () => {
  assert.equal(R.climaDoTimeDoChefao(party), "sol");
});

// Desde a luta inteira (2026-09-29) o time é conferido na sequência: com o HP
// passando de uma luta pra outra, a Florges White (Harvest + Sitrus) pode tomar a
// vaga do Azumarill - os dois times varrem a Flannery; decide o HP que sobra.
test("monta 6, sem repetir criatura, e vence a luta inteira simulada", () => {
  const r = R.montarTimeContraChefao(candidatos(), party, 50);
  assert.equal(r.escolhidos.length, 6);
  assert.equal(new Set(r.escolhidos.map((e) => e.owned)).size, 6);
  assert.ok(r.simulacao && r.simulacao.venceu, JSON.stringify(r.simulacao && r.simulacao.log));
  assert.equal(r.simulacao.derrubados, party.length);
  const az = r.escolhidos.find((e) => e.sp.n === "Azumarill");
  if (az) assert.equal(az.ab, "Sap Sipper");
});

test("o plano cobre os 6 Pokémon dela, na ordem em que ela manda", () => {
  const r = R.montarTimeContraChefao(candidatos(), party, 50);
  assert.deepEqual([...r.plano.map((p) => p.foe.nome)], party.map((m) => m.n));
  // O Arcanine Redux (Extreme Speed vira Grass com Fertilize) tem resposta: o Azumarill é imune.
  const arcanine = r.plano.find((p) => p.foe.nome === "Arcanine Redux");
  assert.ok(arcanine.coberto, JSON.stringify(arcanine.respostas.map((a) => a.sp.n + ":" + a.nota)));
});

test("sem candidatos suficientes, monta com o que tem", () => {
  const r = R.montarTimeContraChefao(candidatos().slice(0, 2), party, 50);
  assert.equal(r.escolhidos.length, 2);
});

test("Focus Sash: quem nocautearia de um golpe precisa de dois", () => {
  const nivel = 50;
  const foe = R.foeDeDuelo(party.find((m) => m.item === "Focus Sash"), nivel, "sol");
  const semSash = Object.assign({}, foe, { item: "" });
  const az = R.unidadeDeDuelo(porNome("Azumarill"), R.SETS_DE_DUELO[0], R.ABILITY_ID_BY_NAME["Sap Sipper"], nivel, R.golpesDeDueloAte(porNome("Azumarill"), nivel), "sol");
  assert.ok(R.resultadoDoDuelo(az, foe, nivel) <= R.resultadoDoDuelo(az, semSash, nivel));
});

test("Focus Sash decide o duelo: quem é mais rápido e nocautearia de um golpe passa a perder", () => {
  // Duelo montado à mão: os dois se nocauteiam com 1 golpe; "eu" é mais rápido.
  const ef = R.efeitoDasHabilidadesNoDuelo([], "SEM_HABILIDADE");
  const golpe = [{ nome: "Teste", tipo: "Normal", cat: "F", contato: false, prio: 0, precisao: 1, forcaBase: 5000, forca: 5000 }];
  const eu = { tipos: ["Normal"], ids: [], ef, stats: [100, 100, 100, 100, 100, 120], golpesProntos: golpe };
  const foe = { tipos: ["Normal"], ids: [], ef, stats: [100, 100, 100, 100, 100, 80], golpesProntos: golpe, item: "" };
  assert.equal(R.resultadoDoDuelo(eu, foe, 50), 1);
  assert.ok(R.resultadoDoDuelo(eu, Object.assign({}, foe, { item: "Focus Sash" }), 50) < 1);
});

test("Molten Down do atacante: Fire vira super efetivo contra Rock (Carbink)", () => {
  const mag = R.foeDeDuelo(party.find((m) => m.n === "Magcargo"), 50, "sol");
  const carb = porNome("Carbink");
  const semEf = R.efeitoDasHabilidadesNoDuelo([], "SEM_HABILIDADE");
  const carbink = { tipos: R.speciesTypeNames(carb), ids: R.uniqueIds(carb.inn), ef: semEf };
  assert.equal(R.efetividadeNoDuelo(mag, "Fire", carbink), 2);
  // Sem a habilidade, Fire contra Rock/Fairy é resistido.
  const semMolten = Object.assign({}, mag, { ef: semEf });
  assert.equal(R.efetividadeNoDuelo(semMolten, "Fire", Object.assign({}, carbink, { ids: [] })), 0.5);
});

test("clima do campo liga habilidade de quem está em campo (Chlorophyll no sol, venha de onde vier)", () => {
  const id = R.ABILITY_ID_BY_NAME["Chlorophyll"];
  assert.equal(R.efeitoDasHabilidadesNoDuelo([id], "TESTE_CLORO", null).speMult, 1);
  assert.equal(R.efeitoDasHabilidadesNoDuelo([id], "TESTE_CLORO", "sol").speMult, 1.5);
});

test("Solar Beam só entra no duelo sem carga: no sol, ou com Chloroplast", () => {
  const sp = R.SPECIES.find((s) => s && R.golpesDeDueloAte(s, null).some((i) => R.MOVES[i][0] === "Solar Beam"));
  assert.ok(sp, "fixture: espécie que aprende Solar Beam");
  const ids = R.golpesDeDueloAte(sp, null);
  const ab = R.uniqueIds(sp.ab).find((i) => !/Chloroplast|Solar Flare|Big Leaves/.test(R.ABILITIES[i][0]));
  const nomes = (clima) => R.unidadeDeDuelo(sp, R.SETS_DE_DUELO[1], ab, 50, ids, clima).golpesProntos.map((g) => g.nome);
  const temInnateChloroplast = R.uniqueIds(sp.inn).some((i) => /Chloroplast/.test(R.descricaoDeHabilidade(R.ABILITIES[i][0])));
  if (!temInnateChloroplast) assert.ok(!nomes(null).includes("Solar Beam"), "sem sol, Solar Beam precisa de carga");
  // No sol ele pode entrar (a poda guarda só o mais forte por tipo/categoria, então confere a força disponível).
  const noSol = R.unidadeDeDuelo(sp, R.SETS_DE_DUELO[1], ab, 50, ids.filter((i) => R.MOVES[i][0] === "Solar Beam"), "sol");
  assert.equal(noSol.golpesProntos.length, 1);
});

test("armadores de clima: só quem arma AO ENTRAR (Snow Warning sim, Sand Spit não)", () => {
  const arm = R.armadoresDeClima([{ sp: porNome("Ninetales Alolan"), owned: 1 }]);
  assert.ok(arm.some((a) => a.clima === "granizo" && a.habilidade === "Snow Warning"), JSON.stringify(arm.map((a) => a.habilidade)));
  const comSandSpit = R.SPECIES.find((s) => s && R.uniqueIds((s.ab || []).concat(s.inn || [])).some((i) => R.ABILITIES[i][0] === "Sand Spit") &&
    !R.uniqueIds((s.ab || []).concat(s.inn || [])).some((i) => /on entry|until switched out/i.test(R.descricaoDeHabilidade(R.ABILITIES[i][0])) && R.habilidadeArma(R.ABILITIES[i][0], "areia")));
  if (comSandSpit) assert.ok(!R.armadoresDeClima([{ sp: comSandSpit, owned: 2 }]).some((a) => a.habilidade === "Sand Spit"));
});

test("habilidade que acrescenta tipo muda o STAB e as fraquezas (Phantom/Half Drake)", () => {
  const tipoAcrescentado = (s) => {
    for (const i of R.uniqueIds(s.inn || [])) {
      const m = R.descricaoDeHabilidade(R.ABILITIES[i][0]).match(/Adds (\w+)[- ]type/i);
      if (m && !R.speciesTypeNames(s).includes(m[1])) return m[1];
    }
    return null;
  };
  const sp = R.SPECIES.find((s) => s && tipoAcrescentado(s));
  assert.ok(sp, "fixture: espécie com innate que acrescenta um tipo que ela não tem");
  const novo = tipoAcrescentado(sp);
  const u = R.unidadeDeDuelo(sp, R.SETS_DE_DUELO[0], R.uniqueIds(sp.ab)[0], 50, R.golpesDeDueloAte(sp, 50), null);
  assert.ok(u.tipos.includes(novo), sp.n + ": " + u.tipos.join("/") + " sem " + novo);
  assert.ok(u.ef.stabExtra.includes(novo));
});

test("a build pedida pelo botão mira o chefão escolhido, não o próximo", () => {
  const sp = porNome("Azumarill");
  const p = R.montarPromptBuild(sp, { chefao: { boss: flannery, party, responde: ["Arcanine Redux", "Sunflora"], clima: "sol" } });
  assert.match(p, /Luta alvo desta build: Flannery 1/);
  assert.match(p, /OBJETIVO DESTA BUILD: vencer Flannery 1/);
  assert.match(p, /resposta do time para: Arcanine Redux, Sunflora/);
  assert.match(p, /arma sol/);
  assert.doesNotMatch(R.montarPromptBuild(sp, {}), /OBJETIVO DESTA BUILD/);
});
