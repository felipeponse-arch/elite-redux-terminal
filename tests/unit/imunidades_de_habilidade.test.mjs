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

test("Flash Fire não vira imunidade: o texto deste jogo não diz que é imune", () => {
  assert.equal(R.abilityTypeModFor("Fire", ["Grass"], [id("Flash Fire")]).mult, 2);
});

test("toda imunidade nova da tabela bate com o texto da própria habilidade", () => {
  const novas = [10, 11, 31, 78, 114, 154, 157, 282, 344, 379, 446, 665, 746, 749, 865, 868, 869, 872];
  for (const n of novas) {
    const texto = R.ABILITY_PT[String(n)] || "";
    for (const tipo of R.TYPE_MOD_ABILITIES[n].immune) {
      assert.ok(texto.includes(tipo), R.ABILITIES[n][0] + " (" + n + ") não cita " + tipo + " no texto: " + texto);
    }
  }
});
