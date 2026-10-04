// Achados de 03/10 na revisão das lutas: mega_forms.json (feito à mão em 09/2026) estava 36 pedras
// atrás do dado do jogo - chefes com Lucarionite, Gyaradeathite e Arcanite lutavam sem a Mega - e o
// Floette Eternal Flower (Mystery Gift) não tinha "Como conseguir".
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 9 });
const lerJson = (n) => JSON.parse(readFileSync(new URL("../../data/" + n, import.meta.url), "utf8"));
const jogo = lerJson("gameData_265beta.json");

function pedrasDoJogo() {
  const itens = Object.fromEntries(jogo.items.map((i) => [i.NAME, i.name]));
  const tipos = new Set(["EVO_MEGA_EVOLUTION", "EVO_PRIMAL_REVERSION", "EVO_MOVE_MEGA_EVOLUTION"].map((k) => jogo.evoKindT.indexOf(k)));
  const out = {};
  for (const s of jogo.species) for (const e of s.evolutions || []) {
    const alvo = jogo.species[e["in"]];
    if (tipos.has(e.kd) && itens[e.rs] && e["in"] >= 0 && alvo && alvo.NAME) out[itens[e.rs]] = alvo.NAME;
  }
  return out;
}

test("mega_forms.json tem toda pedra de Mega/Primal do dado do jogo (rode scripts/gerar_mega_forms.mjs se falhar)", () => {
  const faltando = Object.keys(pedrasDoJogo()).filter((p) => !(p in R.MEGA_FORMS));
  assert.deepEqual(faltando, []);
});

test("chefe com pedra que faltava agora luta de Mega (Gyaradeath da Phoebe, Lucario da Cynthia, Arcanine da Courtney)", () => {
  const acha = (nome, tier, esp) => R.BOSSES.find((b) => b.name === nome)[tier].find((m) => m.n === esp);
  assert.equal(R.foeDeDuelo(acha("Phoebe", "insane", "Gyaradeath"), 60, null).sp.sname, "SPECIES_GYARADEATH_MEGA_X");
  assert.equal(R.foeDeDuelo(acha("Cynthia 2", "party", "Lucario"), 60, null).sp.sname, "SPECIES_LUCARIO_MEGA");
  assert.equal(R.foeDeDuelo(acha("Courtney Sunhollow", "insane", "Arcanine"), 60, null).sp.sname, "SPECIES_ARCANINE_MEGA");
});

test("nenhum item de chefe é pedra do jogo sem forma no mega_forms", () => {
  const pedras = new Set(Object.keys(pedrasDoJogo()));
  const sem = new Set();
  for (const b of R.BOSSES) for (const t of ["party", "insane", "hell"]) for (const m of b[t] || []) if (m.item && pedras.has(m.item) && !R.MEGA_FORMS[m.item]) sem.add(m.item);
  assert.deepEqual([...sem], []);
});

test("Floette Eternal Flower: Mystery Gift depois do 6º ginásio, com a fonte no código oficial", () => {
  const h = lerJson("how_to_obtain.json").SPECIES_FLOETTE_ETERNAL_FLOWER;
  assert.ok(h, "tem 'Como conseguir'");
  assert.match(h.note, /6º ginásio/);
  assert.match(h.source, /GetMysteryGiftSpecies/);
});
