// Imunidades escritas como "absorve"/"redireciona"/"em vez de ser atingido"
// (2026-09-28): achado ao montar o time contra a Flannery 1 - o motor não via
// o Sap Sipper do Azumarill (imune ao Extreme Speed Grass do Arcanine Redux,
// via Fertilize) nem o Well Baked Body (imune a Fire).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const id = (nome) => R.ABILITIES.findIndex((a) => a && a[0] === nome);

test("Sap Sipper anula golpe Grass; Well Baked Body anula Fire", () => {
  assert.equal(R.abilityTypeModFor("Grass", ["Water", "Fairy"], [id("Sap Sipper")]).mult, 0);
  assert.equal(R.abilityTypeModFor("Fire", ["Fairy"], [id("Well Baked Body")]).mult, 0);
  assert.match(R.abilityTypeModFor("Grass", ["Water", "Fairy"], [id("Sap Sipper")]).reasons[0], /Sap Sipper \(imune\)/);
});

test("absorve e cura: Water Absorb e Volt Absorb anulam o tipo e dizem que curam", () => {
  const w = R.abilityTypeModFor("Water", ["Fire"], [id("Water Absorb")]);
  assert.equal(w.mult, 0);
  assert.match(w.reasons[0], /cura 25%/);
  assert.equal(R.abilityTypeModFor("Electric", ["Water"], [id("Volt Absorb")]).mult, 0);
});

test("combinadas herdam a imunidade da parte (Reservoir, Desolate Sun)", () => {
  assert.equal(R.abilityTypeModFor("Water", ["Rock"], [id("Reservoir")]).mult, 0);
  assert.equal(R.abilityTypeModFor("Ground", ["Fire"], [id("Desolate Sun")]).mult, 0);
});

// Revisto em 15/10/2026 (regra do usuário: vale o código do jogo; ticket calibracao-04). Em 28/09 a Flash Fire ficou de fora porque o
// texto curto não diz que é imune, mas o código a absorve (abilities.cc:696-706, ABSORB_RESULT_FLASH_FIRE) e a er-config diz
// "complete immunity to Fire-type moves". O Dry Skin também absorve Water (abilities.cc:1471).
test("Flash Fire e Dry Skin são imunidades (o código do jogo absorve o golpe, mesmo o texto curto não dizendo)", () => {
  assert.equal(R.abilityTypeModFor("Fire", ["Grass"], [id("Flash Fire")]).mult, 0);
  assert.equal(R.abilityTypeModFor("Water", ["Fire"], [id("Dry Skin")]).mult, 0);
});

test("toda imunidade nova da tabela bate com o texto da própria habilidade", () => {
  const novas = [10, 11, 31, 78, 114, 154, 157, 282, 344, 379, 446, 665, 746, 749, 865, 868, 869, 872];
  for (const n of novas) {
    // Sem tradução PT (efeito mudou na 2.65.4, o app cai no inglês): vale a descrição inglesa do dado do jogo.
    const texto = R.ABILITY_PT[String(n)] || R.ABILITIES[n][1] || "";
    for (const tipo of R.TYPE_MOD_ABILITIES[n].immune) {
      assert.ok(texto.includes(tipo), R.ABILITIES[n][0] + " (" + n + ") não cita " + tipo + " no texto: " + texto);
    }
  }
});
