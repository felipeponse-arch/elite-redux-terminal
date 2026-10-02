// Lote A da força-tarefa (2026-10-02): correções do motor provadas na auditoria, cada uma
// com a fonte (dado bruto 2.65beta, código oficial do jogo ou NextDex).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 4, difficulty: "ace", levelCapMode: "more" });
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "LA_" + nomes.join("+"), null);
const sp = (s) => R.getSpeciesBySname(s);
const unidade = (tipos, extra) => Object.assign({ ef: efDe([]), tipos, stats: [300, 100, 100, 100, 100, 100], ids: [] }, extra || {});
const prep = (nome, u) => R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME[nome]], u, null)[0];

test("golpe de dois tipos: Muddy Water é Ground/Water - Flying fica imune, STAB vale pra Water", () => {
  const atqAgua = unidade(["Water"]);
  const mw = prep("Muddy Water", atqAgua);
  assert.equal(mw.tipo, "Ground");
  assert.equal(mw.tipo2, "Water");
  atqAgua.golpesProntos = [mw];
  assert.equal(R.danoNoDuelo(atqAgua, unidade(["Fire"]), 50).melhor.efTipo, 4, "Ground 2x * Water 2x no Fire");
  assert.equal(R.danoNoDuelo(atqAgua, unidade(["Flying"]), 50).melhor.dano, 0, "Ground não acerta Flying");
  const semStab = prep("Muddy Water", unidade(["Normal"]));
  assert.ok(mw.forca > semStab.forca * 1.4, "STAB pelo 2º tipo");
});

test("Hidden Power do chefão usa o hpType do dado (Serperior do Drake 3: Fire)", () => {
  const drake = R.BOSSES.find((b) => b.name === "Drake 3");
  const m = drake.party.find((p) => p.n === "Serperior");
  assert.equal(m.hpt, "Fire");
  const foe = R.foeDeDuelo(m, 60, null);
  const hp = foe.golpesProntos.find((g) => g.nome === "Hidden Power");
  assert.ok(hp, "o Serperior tem Hidden Power");
  assert.equal(hp.tipo, "Fire");
});

test("chefão usa o id da habilidade do dado (As One do Calyrex Shadow não vira o de Ataque)", () => {
  const m = R.BOSSES.flatMap((b) => [].concat(b.party, b.insane || [], b.hell || [])).find((p) => p.abi === "As One" && /Shadow/.test(p.n));
  assert.ok(m, "fixture: Calyrex Shadow com As One num chefão");
  assert.ok(m.abiId >= 0);
  assert.notEqual(m.abiId, R.ABILITY_ID_BY_NAME["As One"], "o nome resolvia pro primeiro id");
  assert.ok(R.foeDeDuelo(m, 60, null).ids.indexOf(m.abiId) !== -1);
});

test("Multi-Headed pelo número de cabeças do dado: 2 cabeças 1,25x, 3 cabeças 1,35x (código oficial)", () => {
  const multi = idHab("Multi-Headed");
  const ef = (s) => R.efeitoDasHabilidadesNoDuelo([multi], s, null).golpeExtra;
  assert.equal(sp("SPECIES_DODRIO").cab, 3);
  assert.equal(ef("SPECIES_DODRIO"), 1.35);
  const duas = R.SPECIES.find((s) => s && s.cab === 2);
  assert.equal(ef(duas.sname), 1.25);
});

test("acertos pelo efeito oficial: Gigaton Hammer 1 (não 2), Bullet Seed 3, Double Kick 2, Twineedle 2", () => {
  const ac = (n) => R.acertosDoGolpeDuelo(R.MOVE_ID_BY_NAME[n]);
  assert.equal(ac("Gigaton Hammer"), 1);
  assert.equal(ac("Tsunami Hammer"), 1);
  assert.equal(ac("Wrap"), 1);
  assert.equal(ac("Bullet Seed"), 3);
  assert.equal(ac("Double Kick"), 2);
  assert.equal(ac("Twineedle"), 2);
  assert.equal(ac("Surging Strikes"), 3);
});

test("Fossilized/Raw Wood: resistência uma vez só (0,5, não 0,25)", () => {
  const fos = idHab("Fossilized");
  const def = { ef: R.efeitoDasHabilidadesNoDuelo([fos], "LA_FOS", null), tipos: ["Normal"], ids: [fos] };
  assert.equal(R.efetividadeNoDuelo({ ef: efDe([]) }, "Rock", def), 0.5);
});

test("luta inteira: o recuo/Life Orb do golpe que nocauteia sai do HP que passa adiante", () => {
  const atq = unidade(["Water"], { stats: [200, 150, 100, 100, 100, 150], item: "Life Orb", it: R.itemDoDuelo("Life Orb", null) });
  atq.golpesProntos = [prep("Wave Crash", atq)];
  const alvo = unidade(["Normal"], { stats: [100, 50, 80, 50, 80, 50] });
  alvo.golpesProntos = [];
  const custo = R.custoDoGolpeFinalDuelo(atq, alvo, 1, 50);
  assert.ok(custo > 0.1, "recuo de 33% + Life Orb no golpe final: " + custo);
});

test("regra de campo: Tate&Liza 1 com Trick Room + invertida; Steven Doubles com Gravity", () => {
  assert.deepEqual([R.regraDeCampoDoChefao("Tate And Liza 1").sala, R.regraDeCampoDoChefao("Tate And Liza 1").inversa], [true, true]);
  assert.equal(R.regraDeCampoDoChefao("Tate And Liza 2").inversa, undefined, "revanche: só Trick Room");
  assert.equal(R.regraDeCampoDoChefao("Steven Doubles").gravidade, true);
  const foes = [unidade(["Psychic"])];
  const com = R.foesComRegraDeCampo(foes, R.regraDeCampoDoChefao("Tate And Liza 1"));
  assert.equal(com[0].ef.sala, 99);
  assert.equal(com[0].ef.inversa, 99);
  assert.equal(foes[0].ef.sala, 0, "não mexe no original");
  const tl = R.BOSSES.find((b) => b.name === "Tate And Liza 1");
  assert.match(R.linhasProximaLutaIA(null, { boss: tl, party: R.bossPartyPorDificuldade(tl) }).join("\n"), /INVERTIDA/);
});
