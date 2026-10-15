// Ticket versao-nova/03 (15/10/2026): o selo do pipeline de build. Antes só 2 casos (Ledian + Mega Punch/Aerial Ace contra o Ninetales)
// saíam "calibrada" e o resto "estimada". Decisão do Felipe (15/10/2026): o motor é calibrado pelo código do jogo (tickets 01 a 06 da
// calibração e v01/v02); TODA build sai com o selo "Calculado pelo código do jogo". Só fica "estimada" o que o motor não simula:
// habilidade em jogo SEM regra no motor (lista de tests/unit/auditoria_do_motor.test.mjs), do atacante ou do alvo, a fuga no
// Intimidate (o motor devolve empate) e a consulta sem alvo (nada foi simulado).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" });
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const courtney = R.BOSSES.find((b) => b.name === "Courtney Meteor Falls");
const ninetales = { chefao: courtney, indice: 0 };
const alakazam = { chefao: courtney, indice: 1 };
const foeSemPrioridade = () => R.foeDeDuelo(Object.assign({}, courtney.party[0], { mv: ["Dazzling Gleam", "Heat Wave", "Ominous Wind", "Shadow Ball"], nat: "Mild" }), 55, null);
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];

test("habilidadeSemRegraNoDuelo: as registradas na auditoria do motor, e não as que o motor lê", () => {
  for (const n of ["Angel's Wrath", "Temporal Rupture", "Hollow Ice Zone", "Flammable Coat", "Spiteful", "Symbiosis", "Honey Gather", "Tag", "Multitype"]) assert.equal(R.habilidadeSemRegraNoDuelo(idHab(n)), true, n);
  for (const n of ["Drought", "Intimidate", "Aerilate", "Flash Fire", "Multiscale", "Tough Claws", "Feathercoat", "Levitate", "Iron Fist"]) assert.equal(R.habilidadeSemRegraNoDuelo(idHab(n)), false, n);
});

test("toda build sai 'calibrada' (Calculado pelo código do jogo), mesmo fora dos casos antigos: outro atacante, outra habilidade, outro alvo, golpe que não derruba", () => {
  const alvos = [ninetales, alakazam, { foe: foeSemPrioridade() }];
  for (const nome of ["Ledian", "Scyther Mega", "Typhlosion", "Accelgor", "Fearow", "Vanilluxe Mega"]) {
    for (const alvo of alvos) {
      const r = R.candidatosDeBuild(sp(nome), { alvo });
      assert.ok(r.candidatos.length > 0, nome);
      r.candidatos.forEach((c) => {
        assert.equal(c.rotulo, "calibrada", nome + " / " + c.habilidade + " / " + c.golpes.join("/") + ": " + c.avisos.join(" | "));
        assert.equal(c.selo, "Calculado pelo código do jogo");
        assert.doesNotMatch(c.avisos.join(" "), /ainda não conferido na calculadora/);
      });
    }
  }
});

test("hit-kill garantido: o motivo diz 'derruba no turno 1' em qualquer build calibrada, não só nos casos da calculadora", () => {
  const c = R.candidatosDeBuild(sp("Ledian"), { alvo: { foe: foeSemPrioridade() } }).candidatos.find((x) => x.hitKill === 1 && x.garantido && x.golpes.includes("Seismic Fist"));
  assert.ok(c, "Ledian com Seismic Fist garantido contra o Ninetales");
  assert.equal(c.rotulo, "calibrada");
  assert.match(c.motivos.join(" | "), /derruba no turno 1 o Ninetales/);
  const naoGarantido = R.candidatosDeBuild(sp("Charmeleon"), { alvo: ninetales }).candidatos.find((x) => x.hitKill === 1 && !x.garantido);
  assert.ok(naoGarantido);
  assert.equal(naoGarantido.rotulo, "calibrada");
  assert.match(naoGarantido.motivos.join(" | "), /Provável derrubar/, "sem a rolagem mínima derrubando, o texto continua 'Provável'");
});

test("habilidade sem regra no atacante deixa a build 'estimada' e o aviso nomeia a habilidade (inata: Runerigus/Spiteful; escolhida: conferida na função)", () => {
  const R8 = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
  const foe = () => R8.foeDeDuelo(Object.assign({}, R8.BOSSES.find((b) => b.name === "Courtney Meteor Falls").party[0], { mv: ["Dazzling Gleam", "Heat Wave", "Ominous Wind", "Shadow Ball"], nat: "Mild" }), 55, null);
  const runerigus = R8.candidatosDeBuild(R8.SPECIES.find((x) => x && x.n === "Runerigus"), { alvo: { foe: foe() } });
  assert.ok(runerigus.candidatos.length > 0);
  assert.ok(runerigus.candidatos[0].inatas.includes("Spiteful"), "Spiteful é inata do Runerigus no milestone 8");
  runerigus.candidatos.forEach((c) => {
    assert.equal(c.rotulo, "estimada", c.habilidade + " / " + c.golpes.join("/"));
    assert.match(c.selo, /^Estimado: /);
    assert.match(c.avisos.join(" | "), /Spiteful \(inata\)/);
  });
  // A habilidade ESCOLHIDA sem regra nunca vence o ranking (o motor não lhe dá valor), então o ramo é conferido direto na função:
  assert.deepEqual(Array.from(R.pipelineHabilidadesSemRegra("Temporal Rupture", [], [])), ["Temporal Rupture (habilidade escolhida)"]);
  assert.deepEqual(Array.from(R.pipelineHabilidadesSemRegra("Stamina", [], [])), []);
  assert.deepEqual(Array.from(R.pipelineHabilidadesSemRegra("Stamina", [idHab("Spiteful")], [{ nome: "Alvo", ids: [idHab("Symbiosis")] }])), ["Spiteful (inata)", "Symbiosis (do alvo Alvo)"]);
  // Dialga: o Temporal Rupture é habilidade (não inata) e não é escolhido; as inatas dele o motor lê: calibrada
  R.candidatosDeBuild(sp("Dialga"), { alvo: { foe: foeSemPrioridade() } }).candidatos.forEach((c) => assert.equal(c.rotulo, "calibrada", c.habilidade));
});

test("habilidade sem regra no ALVO deixa a build 'estimada': o motor não conta o efeito dela contra o atacante", () => {
  const foe = R.foeDeDuelo(Object.assign({}, courtney.party[0], { abi: "Symbiosis", abiId: idHab("Symbiosis") }), 55, null);
  assert.ok(foe.ids.includes(idHab("Symbiosis")));
  const r = R.candidatosDeBuild(sp("Ledian"), { alvo: { foe } });
  assert.ok(r.candidatos.length > 0);
  r.candidatos.forEach((c) => {
    assert.equal(c.rotulo, "estimada");
    assert.match(c.selo, /Symbiosis \(do alvo Ninetales\)/);
    assert.match(c.avisos.join(" | "), /Symbiosis \(do alvo Ninetales\)/);
  });
});

test("o selo é o mesmo no caso A (alvo qualquer: sem alvo nada foi simulado, 'estimada') e no caso B (alvo fixo)", () => {
  const R8 = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
  const semAlvo = R8.candidatosDeBuild(R8.SPECIES.find((s) => s && s.n === "Centiskorch"), {});
  assert.equal(semAlvo.alvo, null);
  semAlvo.candidatos.forEach((c) => { assert.equal(c.rotulo, "estimada"); assert.match(c.selo, /^Estimado: sem alvo/); });
});

test("a prioridade do alvo NÃO tira o selo (o motor a simula e o aviso 'O alvo age antes' continua)", () => {
  const c = R.candidatosDeBuild(sp("Ledian"), { alvo: ninetales }).candidatos.find((x) => x.alvoAgeAntes);
  assert.ok(c, "algum candidato do Ledian é derrubado antes pelo Flame Burst do Ninetales");
  assert.equal(c.rotulo, "calibrada");
  assert.match(c.avisos.join(" | "), /O alvo age antes com Flame Burst/);
});

test("fuga no Intimidate (o motor devolve empate) continua 'estimada'", () => {
  const R1 = carregarRegras({ milestone: 1, difficulty: "ace", levelCapMode: "more" });
  const r = R1.candidatosDeBuild(R1.SPECIES.find((x) => x && x.n === "Deoxys Speed"), {});
  const comAviso = r.candidatos.filter((c) => /foge no Intimidate/.test(c.avisos.join(" ")));
  assert.ok(comAviso.length > 0);
  comAviso.forEach((c) => { assert.equal(c.rotulo, "estimada"); assert.match(c.selo, /fuga no Intimidate/); });
});
