// TK-13b: imunidade a status por HABILIDADE numa fonte só (duelo.js IMUNE_STATUS_POR_HABILIDADE + texto),
// usada pelo motor e por podeTerStatus. Código do jogo = verdade (er-repo f34fc2b, CHECK_STATUS1 em include/abilities.hh:103-110).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const efDe = (nome) => R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME[nome]], "T13B_" + nome, null);
const STATUS1 = ["sono", "envenenar", "envenenarForte", "queimar", "paralisar", "congelar", "sangrar"];
const FORA = ["confundir", "paixao", "recuar", "medo", "semente", "preso", "maldicao", "presoForte"];
const porNome = (n) => R.SPECIES.find((s) => s.n === n);

// abilities.cc: Purifying Salt :6921, Comatose :2948, Hyper Cleanse :10337, Petroleum Jelly :12694, Blood Stigma :8409, Blood Stain :8395
for (const nome of ["Purifying Salt", "Comatose", "Hyper Cleanse", "Petroleum Jelly", "Blood Stigma", "Blood Stain"]) {
  test(nome + ": bloqueia os 6 status do CHECK_STATUS1 e NÃO bloqueia confusão, paixão etc.", () => {
    const im = efDe(nome).imuneStatus;
    for (const s of STATUS1) assert.equal(!!im[s], true, nome + " deve bloquear " + s);
    for (const s of FORA) assert.equal(!!im[s], false, nome + " não bloqueia " + s + " no jogo");
  });
}

test("Immunity (abilities.cc:682-686): CHECK_STATUS1 menos sono - queimadura, paralisia, congelar e sangrar também", () => {
  const im = efDe("Immunity").imuneStatus;
  for (const s of ["envenenar", "envenenarForte", "queimar", "paralisar", "congelar", "sangrar"]) assert.equal(!!im[s], true, s);
  assert.equal(!!im.sono, false);
  assert.equal(!!im.confundir, false);
});

test("podeTerStatus lê a mesma fonte do duelo, para os 6 status do CHECK_STATUS1", () => {
  const goodra = porNome("Goodra");
  for (const c of ["veneno", "queimadura", "paralisia", "congelar", "sangrar", "sono"]) {
    assert.equal(R.podeTerStatus(goodra, c, []), true, c + " sem habilidade");
    assert.equal(R.podeTerStatus(goodra, c, ["Purifying Salt"]), false, c + " com Purifying Salt");
  }
  assert.equal(R.podeTerStatus(goodra, "queimadura", ["Immunity"]), false); // Immunity bloqueia queimadura no jogo
  assert.equal(R.podeTerStatus(goodra, "sono", ["Immunity"]), true); // e não o sono
  assert.equal(R.podeTerStatus(goodra, "paralisia", ["Limber"]), false); // habilidade só de texto (Limber)
  assert.equal(R.podeTerStatus(goodra, "sangrar", ["Blood Bath"]), false);
});

test("Mycelium Might (battle_util.c:5090) ignora habilidade e tipo em podeTerStatus, mas não o status que já existe", () => {
  const fogo = porNome("Charizard");
  assert.equal(R.podeTerStatus(fogo, "queimadura", []), false); // tipo Fire
  assert.equal(R.podeTerStatus(fogo, "queimadura", ["Mycelium Might"]), true);
  assert.equal(R.podeTerStatus(porNome("Goodra"), "queimadura", ["Mycelium Might", "Water Veil"]), true);
  assert.equal(R.podeTerStatus(fogo, "queimadura", ["Mycelium Might"], { status1: true }), false); // CanBe*: status1 vem antes (:5085)
});

test("IsStatusImmune (battle_util.c:5051-5058): status1, Misty Terrain e Safeguard bloqueiam", () => {
  const goodra = porNome("Goodra");
  assert.equal(R.podeTerStatus(goodra, "veneno", [], { status1: true }), false);
  assert.equal(R.podeTerStatus(goodra, "veneno", [], { misty: true }), false);
  assert.equal(R.podeTerStatus(goodra, "veneno", [], { safeguard: true }), false);
  assert.equal(R.podeTerStatus(goodra, "veneno", [], {}), true);
});
