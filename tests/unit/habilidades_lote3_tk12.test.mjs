// TK-12 (28/10/2026): divergências do lote 3 (pacote onda0_P2_lote3) contra o código do jogo (er-repo f34fc2b), com dado real.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 8, difficulty: "ace", levelCapMode: "more" });
const NIVEL = 55;
const idHab = (n) => R.ABILITY_ID_BY_NAME[n];
const efDe = (habs, clima) => R.efeitoDasHabilidadesNoDuelo(habs.map(idHab), "TK12_" + habs.join("+") + "_" + (clima || ""), clima || null);
const golpe = (cat, extra) => Object.assign({ nome: "T", tipo: "Normal", cat, contato: false, prio: 0, precisao: 1, forcaBase: 80, forca: 80, poder: 80, status: [], cats: [], flags: [], crit: { estagio: 0, sempre: false }, recuo: 0, custoHP: 0, dreno: 0 }, extra || {});
// Unidade sintética completa (serve de atacante, de alvo e para comHabilidadesDuelo).
const unid = (habs, tipos, golpes, extra) => {
  const ids = habs.map(idHab);
  return Object.assign({ sp: { n: "Teste", sname: "SPECIES_TESTE", inn: [], t: [0, 0] }, tipos, ids, abId: ids.length ? ids[0] : null, ab: habs[0] || "", ef: efDe(habs), item: "", it: R.itemDoDuelo("", null),
    stats: [320, 100, 100, 100, 100, 100], golpesProntos: golpes, statusIds: [] }, extra || {});
};
const dano = (a, d) => R.danoNoDuelo(a, d, NIVEL).melhor.dano;

const duelo = (a, d, turnos) => R.danoComStatusNoDuelo(a, d, R.danoNoDuelo(a, d, NIVEL), R.danoNoDuelo(d, a, NIVEL), turnos, true).meu;

// Cosmic Daze (abilities.cc:6758-6763): x2 se o alvo está confuso OU enfurecido (um MUL(2) só).
test("Cosmic Daze: alvo enfurecido leva x2 (antes só o confuso contava)", () => {
  const dono = unid(["Cosmic Daze"], ["Normal"], [golpe("F")]);
  const normal = unid([], ["Normal"], [golpe("F")]);
  const furioso = unid([], ["Normal"], [golpe("F")], { ef: Object.assign({}, efDe([]), { enfurecido: true }) });
  assert.equal(efDe(["Cosmic Daze"]).bonusVsEnfurecido, 2);
  const razao = duelo(dono, furioso, 3) / duelo(dono, normal, 3);
  assert.ok(Math.abs(razao - 2) < 0.02, "razão " + razao);
  // sem a habilidade, enfurecido não muda o dano que o dono causa
  const sem = unid([], ["Normal"], [golpe("F")]);
  assert.ok(Math.abs(duelo(sem, furioso, 3) / duelo(sem, normal, 3) - 1) < 0.02);
});

// Sniper (abilities.cc:1567-1572): crítico x1,5 em cima do x1,5 do crítico = 2,25 (o texto da habilidade já diz isso; meta-D4.1).
test("Sniper: crítico sai 2,25x no motor (não só no texto do prompt da IA)", () => {
  assert.equal(efDe(["Sniper"]).critMult, 2.25);
  assert.equal(efDe([]).critMult, 1.5);
});

// Lote 3: "Brain" contém "rain" - Brain Freeze, Bluescreen e Brain Mass não podem ligar condição de clima (chuva).
test("Brain Freeze, Bluescreen e Brain Mass: o clima chuva não muda o efeito nem arma clima", () => {
  ["Brain Freeze", "Bluescreen", "Brain Mass"].forEach((n) => {
    assert.equal(JSON.stringify(efDe([n], "chuva")), JSON.stringify(efDe([n], null)), n);
    assert.equal(efDe([n]).climasProprios.length, 0, n);
  });
});

// Cackling (abilities.cc:12877-12887): Eerie Laugh só 2 vezes por batalha por Pokémon; a luta do motor entra uma vez por unidade, então a entrada única é exata.
test("Cackling: uma entrada paralisa certo (a luta do motor não reentra; o limite de 2 não chega a valer)", () => {
  assert.equal(efDe(["Cackling"]).statusNaEntrada.paralisar, 1);
});

// Illuminate expandido traz "remove Ghost"; Bioluminescent no jogo só dá o tipo Electric + precisão (abilities.cc:911-915, 12912-12916).
test("Bioluminescent: golpe Normal continua sem efeito em Ghost (a expansão do Illuminate não vira regra)", () => {
  const dono = unid(["Bioluminescent"], ["Electric"], [golpe("F")]);
  assert.equal(dano(dono, unid([], ["Ghost"], [golpe("F")])), 0);
});
