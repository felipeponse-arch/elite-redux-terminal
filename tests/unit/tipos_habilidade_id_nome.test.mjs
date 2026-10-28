// TK-00: trava id x nome de TYPE_MOD_ABILITIES. O id é do dex_compact do app (NextDex), NÃO o do enum do jogo
// (na 2.65.4 os dois divergem: Fire Aspect é 869 no app e 871 no jogo). Por isso a config só é comparada por NOME.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
// Sobe as pastas até achar teste/ferramentas (o app roda na raiz ou num worktree de profundidade diferente).
let raizFerr = dirname(fileURLToPath(import.meta.url));
while (!existsSync(join(raizFerr, "ferramentas")) && dirname(raizFerr) !== raizFerr) raizFerr = dirname(raizFerr);
raizFerr = join(raizFerr, "ferramentas");
const arqHab = join(raizFerr, "er-config", "AbilityList.textproto");

// Nome esperado de cada id de TYPE_MOD_ABILITIES (o comentário do tipos.js virou dado aqui).
const NOMES = {
  26: "Levitate", 444: "Evaporate", 450: "Earth Eater", 314: "Mountaineer", 116: "Solid Rock", 318: "Primal Armor",
  303: "Fossilized", 17: "Immunity", 40: "Magma Armor", 47: "Thick Fat", 85: "Heatproof", 134: "Heavy Metal",
  195: "Water Compaction", 199: "Water Bubble", 218: "Fluffy", 678: "Fluffiest", 306: "Nocturnal", 311: "Liquified",
  337: "Raw Wood", 342: "Seaweed", 547: "Purifying Salt", 754: "Puffy", 764: "Deep Freeze", 889: "Thick Blubber",
  855: "Hyper Cleanse", 904: "Strong Foundation", 995: "Elemental Aegis", 996: "Aegis Ward", 606: "Aerialist",
  688: "Imposing Wings", 664: "Flame Bubble", 682: "Iron Giant", 936: "Sumo Guard", 946: "Massive Pelt",
  1010: "Thermal Entropy", 1015: "Droideka", 10: "Volt Absorb", 18: "Flash Fire", 87: "Dry Skin", 11: "Water Absorb",
  31: "Lightning Rod", 78: "Motor Drive", 114: "Storm Drain", 154: "Justified", 157: "Sap Sipper", 282: "Aerodynamics",
  344: "Poison Absorb", 379: "Ice Dew", 446: "Well Baked Body", 665: "Elemental Vortex", 746: "Desolate Sun",
  749: "Reservoir", 865: "Heat Sink", 868: "Lightning Aspect", 869: "Fire Aspect", 872: "Molten Core", 1057: "Packed Ice"
};

test("TYPE_MOD_ABILITIES: toda entrada tem nome esperado e o id bate com o dado do app", () => {
  const ids = Object.keys(R.TYPE_MOD_ABILITIES).map(Number);
  assert.deepEqual(ids.filter((id) => !NOMES[id]), [], "id novo na tabela sem nome em NOMES");
  ids.forEach((id) => assert.equal(R.ABILITIES[id] && R.ABILITIES[id][0], NOMES[id], "id " + id));
});

test("TYPE_MOD_ABILITIES: o nome esperado de cada id existe na AbilityList da config do jogo (por nome)", { skip: !existsSync(arqHab) }, () => {
  const nomes = new Set([...readFileSync(arqHab, "utf8").matchAll(/name: "([^"]*)"/g)].map((m) => m[1]));
  Object.keys(R.TYPE_MOD_ABILITIES).map(Number).forEach((id) => assert.ok(nomes.has(NOMES[id]), "config sem " + NOMES[id]));
});
