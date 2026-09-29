// Status por chance no duelo (2026-09-29, grupo 1 do estudo de habilidades):
// antes nenhum status entrava - queimar com Scald, Flame Body, Toxic Chain,
// Static... não valiam nada no rank nem no botão contra o chefão. Regras
// oficiais do FAQ/Full Changelog (Bleed, Frostbite, Fear, Confusion,
// Infatuation); Burn/paralisia/veneno como na série.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (nomes) => R.efeitoDasHabilidadesNoDuelo(nomes.map(idHab), "ST_" + nomes.join("+"), null);
const perto = (a, b) => Math.abs(a - b) < 1e-9;

test("presença média do status: com certeza no 1º golpe vale a luta toda (resíduo), nada antes do golpe", () => {
  assert.equal(R.presencaDoStatus(1, 1, 1), 1);
  assert.equal(R.presencaDoStatus(1, 1, 0), 0);
  assert.equal(R.presencaDoStatus(0, 5, 1), 0);
  // 30% em 2 turnos: 1º turno 0,3; 2º turno 0,51 -> média 0,405.
  assert.ok(perto(R.presencaDoStatus(0.3, 2, 1), 0.405));
});

test("texto do jogo: Flame Body queima na defesa E no ataque (contato 30%, sem contato 20%)", () => {
  const ef = efDe(["Flame Body"]);
  assert.equal(ef.statusDefesa.length, 1);
  assert.equal(ef.statusAtaque.length, 1, "Also works on offense");
  assert.deepEqual([...ef.statusDefesa[0].st], ["queimar"]);
  assert.ok(perto(ef.statusDefesa[0].pContato, 0.3) && perto(ef.statusDefesa[0].pOutro, 0.2));
});

test("texto do jogo: filtro de categoria, divisão de chance e partes (Arc Flash)", () => {
  assert.equal(efDe(["Solenoglyphs"]).statusAtaque[0].filtro.cat, "mordida");
  const stun = efDe(["Stun Shock"]).statusAtaque[0];
  assert.deepEqual([...stun.st], ["paralisar", "envenenar"]);
  assert.ok(perto(stun.pContato, 0.3), "60% dividido entre os dois");
  const arc = efDe(["Arc Flash"]);
  assert.deepEqual([...arc.statusDefesa[0].st], ["queimar"]);
  assert.deepEqual([...arc.statusAtaque[0].st], ["paralisar"]);
});

test("imunidade: status inteiro (Limber, Purifying Salt) x só o dano por turno (Heatproof)", () => {
  assert.ok(efDe(["Limber"]).imuneStatus.paralisar);
  assert.ok(efDe(["Purifying Salt"]).imuneStatus.sangrar);
  const hp = efDe(["Heatproof"]);
  assert.ok(!hp.imuneStatus.queimar, "a queimadura ainda corta o Ataque");
  assert.ok(hp.semResiduoDe.queimar);
});

test("golpe: Fire Punch 10% de queimar; Serene Grace dobra; Sheer Force troca o efeito por 1.3x", () => {
  const sp = R.SPECIES.find((s) => s && R.golpesDeDueloAte(s, null).includes(R.MOVE_ID_BY_NAME["Fire Punch"]));
  const golpe = (ab) => {
    const u = R.unidadeDeDuelo(sp, R.SETS_DE_DUELO[0], null, 50, [R.MOVE_ID_BY_NAME["Fire Punch"]], null);
    const u2 = Object.assign({}, u, { ef: efDe(ab), tipos: ["Normal"] });
    return R.prepararGolpesDuelo([R.MOVE_ID_BY_NAME["Fire Punch"]], u2, null)[0];
  };
  const base = golpe([]);
  assert.equal(JSON.stringify(base.status.map((s) => [s.st, s.p])), JSON.stringify([["queimar", 0.1]]));
  assert.ok(perto(golpe(["Serene Grace"]).status[0].p, 0.2));
  const sf = golpe(["Sheer Force"]);
  assert.equal(sf.status.length, 0);
  assert.ok(perto(sf.forca / base.forca, 1.3));
});

// Duelo sintético: só o que importa pro status.
function lado(ef, tipos, golpe, dano) {
  return { u: { ef, tipos, stats: [300, 100, 100, 100, 100, 100] }, d: { melhor: { golpe, dano, prio: 0 }, melhorPrio: { dano: 0 } } };
}

test("duelo: queimar corta o dano físico de quem sofre e soma dano por turno a quem causa", () => {
  const nada = efDe([]);
  const eu = lado(nada, ["Water"], { cat: "E", contato: false, status: [{ st: "queimar", p: 1, doGolpe: true }] }, 100);
  const ele = lado(nada, ["Normal"], { cat: "F", contato: true, status: [] }, 100);
  const st = R.danoComStatusNoDuelo(eu.u, ele.u, eu.d, ele.d, 3, true);
  assert.ok(perto(st.meu, 100 + 300 / 16), "1/16 do HP dele por turno");
  assert.ok(perto(st.dele, 50), "eu bato antes: a queimadura já vale no golpe dele");
  // Tipo Fire é imune.
  const fogo = lado(nada, ["Fire"], ele.d.melhor.golpe, 100);
  assert.equal(R.danoComStatusNoDuelo(eu.u, fogo.u, eu.d, fogo.d, 3, true).dele, 100);
});

test("duelo simétrico: a Flame Body do defensor queima o atacante que faz contato", () => {
  const eu = lado(efDe(["Flame Body"]), ["Water"], { cat: "E", contato: false, status: [] }, 100);
  const ele = lado(efDe([]), ["Normal"], { cat: "F", contato: true, status: [] }, 100);
  const st = R.danoComStatusNoDuelo(eu.u, ele.u, eu.d, ele.d, 3, false);
  assert.ok(st.sobreEle.queimar > 0.29, JSON.stringify(st.sobreEle));
  assert.ok(st.dele < 100 && st.meu > 100);
  // Shield Dust barra o efeito do GOLPE, não o da habilidade do outro lado.
  const sd = lado(efDe(["Shield Dust"]), ["Normal"], ele.d.melhor.golpe, 100);
  assert.ok(R.danoComStatusNoDuelo(eu.u, sd.u, eu.d, sd.d, 3, false).sobreEle.queimar > 0);
});

test("duelo: Fear aumenta o dano recebido em 50%; confusão devolve 33% do dano causado", () => {
  const nada = efDe([]);
  const medo = lado(nada, ["Dark"], { cat: "F", contato: true, status: [{ st: "medo", p: 1, doGolpe: true }] }, 100);
  const alvo = lado(nada, ["Normal"], { cat: "F", contato: true, status: [] }, 60);
  assert.ok(perto(R.danoComStatusNoDuelo(medo.u, alvo.u, medo.d, alvo.d, 2, true).meu, 150));
  const conf = lado(nada, ["Psychic"], { cat: "E", contato: false, status: [{ st: "confundir", p: 1, doGolpe: true }] }, 100);
  assert.ok(perto(R.danoComStatusNoDuelo(conf.u, alvo.u, conf.d, alvo.d, 2, true).meu, 100 + 0.33 * 60));
});

test("sinergia pra IA: Serene Grace aponta golpes com efeito por chance; Solenoglyphs, as mordidas", () => {
  const achar = (hab) => R.SPECIES.find((s) => s && R.uniqueIds((s.ab || []).concat(s.inn || [])).includes(idHab(hab)) && R.sinergiasDaEspecie(s).some((h) => h.name === hab));
  const sg = achar("Serene Grace");
  assert.ok(sg, "fixture: espécie com Serene Grace e golpe com efeito");
  const h = R.sinergiasDaEspecie(sg).find((x) => x.name === "Serene Grace");
  assert.ok(h.golpes.every((g) => { const e = R.MOVE_CATEGORIAS[R.MOVE_ID_BY_NAME[g]]; return e && e.ch > 0 && e.ch < 100; }), JSON.stringify(h.golpes));
  const so = achar("Solenoglyphs");
  assert.ok(so, "fixture: espécie com Solenoglyphs que morde");
  assert.ok(R.sinergiasDaEspecie(so).find((x) => x.name === "Solenoglyphs").golpes.every((g) => R.categoriasDoGolpeDuelo(R.MOVE_ID_BY_NAME[g]).includes("mordida")));
});
