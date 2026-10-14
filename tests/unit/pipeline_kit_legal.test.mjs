// Fase 1 do pipeline: contrato determinístico do kit legal.
// O teste usa o mesmo carregador e os mesmos dados do Artifact.
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const nomes = (R, ids) => ids.map((id) => R.ABILITIES[id][0]);
const kit = (R, sname, nivel) => {
  const sp = R.getSpeciesBySname(sname);
  const movepool = R.availableMovesFor(sp);
  const innates = R.innatesAtivasNoNivel(sp, nivel);
  return {
    sname,
    nivel,
    cap: movepool.cap,
    habilidades: nomes(R, sp.ab),
    innates: nomes(R, innates),
    movepool: movepool.names,
    formasMega: R.megaFormsOf(sp).map((f) => ({
      sname: f.sname,
      nome: f.n,
      liberada: R.megaFormLiberada(f),
      pedras: R.stonesOf(f),
    })),
    itens: R.AI_ITEM_POOL.filter((item) => R.ITEMS.includes(item)),
  };
};

test("kit legal no cap 18: Centiskorch mantém Fire Fang e bloqueia Fire Lash", () => {
  const R = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });
  const k = kit(R, "SPECIES_CENTISKORCH", 18);
  assert.equal(k.cap, 18);
  assert.deepEqual(k.habilidades, ["Coil Up", "Flash Fire", "Molten Down"]);
  assert.deepEqual(k.innates, ["Flaming Jaws", "Let's Roll", "Hyper Aggressive"]);
  assert.ok(k.movepool.includes("Fire Fang"));
  assert.ok(!k.movepool.includes("Fire Lash"));
});

test("kit legal no cap 55: Centiskorch libera Fire Fang e Fire Lash", () => {
  const R = carregarRegras({ milestone: 4, difficulty: "ace", levelCapMode: "more" });
  const k = kit(R, "SPECIES_CENTISKORCH", 55);
  assert.equal(k.cap, 55);
  assert.ok(k.movepool.includes("Fire Fang"));
  assert.ok(k.movepool.includes("Fire Lash"));
});

test("kit legal do Ledian inclui as três habilidades e Mega Punch", () => {
  const R = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });
  const k = kit(R, "SPECIES_LEDIAN", 18);
  assert.deepEqual(k.habilidades, ["Justified", "Mixed Martial Arts", "Aerodynamics"]);
  assert.deepEqual(k.innates, ["Raging Boxer", "Iron Fist", "Aerilate"]);
  assert.ok(k.movepool.includes("Mega Punch"));
});

test("kit legal do Ninetales registra habilidades, innates e movepool reais", () => {
  const R = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });
  const k = kit(R, "SPECIES_NINETALES", 18);
  assert.deepEqual(k.habilidades, ["Flaming Soul", "Vengeance", "Drought"]);
  assert.deepEqual(k.innates, ["Pyromancy", "Flash Fire", "Queenly Majesty"]);
  assert.ok(k.movepool.length > 0);
});

test("no Elite, innates respeitam o nível; habilidade escolhível permanece disponível", () => {
  const R = carregarRegras({ milestone: 0, difficulty: "elite", levelCapMode: "more" });
  const sp = R.getSpeciesBySname("SPECIES_CENTISKORCH");
  assert.deepEqual(nomes(R, sp.ab), ["Coil Up", "Flash Fire", "Molten Down"]);
  assert.deepEqual(nomes(R, R.innatesAtivasNoNivel(sp, 1)), ["Flaming Jaws"]);
  assert.deepEqual(nomes(R, R.innatesAtivasNoNivel(sp, 17)), ["Flaming Jaws", "Let's Roll"]);
  assert.deepEqual(nomes(R, R.innatesAtivasNoNivel(sp, 24)), ["Flaming Jaws", "Let's Roll", "Hyper Aggressive"]);
});

test("kit não inventa itens: pool vem dos itens presentes no dado local", () => {
  const R = carregarRegras({ milestone: 0, difficulty: "ace", levelCapMode: "more" });
  const k = kit(R, "SPECIES_LEDIAN", 18);
  assert.ok(k.itens.length > 0);
  assert.ok(k.itens.every((item) => R.ITEMS.includes(item)));
});
