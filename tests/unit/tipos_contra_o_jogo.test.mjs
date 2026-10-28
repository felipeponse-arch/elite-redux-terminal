// TK-04 (motor-D1.1, D1.2): a tabela de tipos e TYPE_MOD_ABILITIES travadas contra o código do jogo.
// Fonte: er-repo battle_util.c (sTypeEffectivenessTable / sInverseTypeEffectivenessTable) e er-config AbilityList.
// Sem as ferramentas locais (ferramentas/er-repo, er-config) os testes são pulados, não falham.
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
const arqTabela = join(raizFerr, "er-repo", "src", "battle_util.c");
const arqHab = join(raizFerr, "er-config", "AbilityList.textproto");

// Ordem das colunas/linhas no jogo (cabeçalho do battle_util.c).
const ORDEM = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Mystery",
  "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy", "Stellar"];

function lerTabelaDoJogo(nome) {
  const src = readFileSync(arqTabela, "utf8");
  const ini = src.indexOf(nome + "[NUMBER_OF_MON_TYPES]");
  const fim = src.indexOf("};", ini);
  const nums = [...src.slice(ini, fim).matchAll(/X\(([\d.]+)\)/g)].map((m) => parseFloat(m[1]));
  assert.equal(nums.length, 400, "tabela " + nome + " deve ter 20x20 células");
  return nums;
}

test("TYPE_CHART do app = sTypeEffectivenessTable do jogo (18 tipos, célula a célula)", { skip: !existsSync(arqTabela) }, () => {
  const jogo = lerTabelaDoJogo("sTypeEffectivenessTable");
  ORDEM.forEach((atq, i) => ORDEM.forEach((def, j) => {
    if (atq === "Mystery" || def === "Mystery" || atq === "Stellar" || def === "Stellar") return; // Stellar fora de propósito: TK-04, pendente de decisão (ver ticket)
    assert.equal(R.typeMultiplier(atq, [def]), jogo[i * 20 + j], atq + " -> " + def);
  }));
});

test("inversa: a tabela invertida do jogo = a regra do duelo aplicada à tabela normal", { skip: !existsSync(arqTabela) }, () => {
  const inv = lerTabelaDoJogo("sInverseTypeEffectivenessTable");
  // mesma regra de duelo.js (Inverse Room): imune ou resiste vira x2, super efetivo vira x0,5.
  const inverte = (v) => (v === 0 || v < 1 ? 2 : v > 1 ? 0.5 : 1);
  ORDEM.forEach((atq, i) => ORDEM.forEach((def, j) => {
    if (atq === "Mystery" || def === "Mystery" || atq === "Stellar" || def === "Stellar") return;
    assert.equal(inverte(R.typeMultiplier(atq, [def])), inv[i * 20 + j], "inversa " + atq + " -> " + def);
  }));
});

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

// A er-config (486a964) já é a 2.65.4; o app segue em 2.65.3b (dex_compact.json). Estes 3 ids mudaram de lugar lá:
// quando o dado migrar para a 2.65.4, trocar a chave em TYPE_MOD_ABILITIES pelo id novo e esvaziar esta lista.
const DESLOCADOS_2654 = { 869: 871, 872: 870, 946: 948 };

test("TYPE_MOD_ABILITIES: o id bate com o nome na AbilityList da config do jogo", { skip: !existsSync(arqHab) }, () => {
  const txt = readFileSync(arqHab, "utf8");
  const enumTxt = readFileSync(join(raizFerr, "er-config", "AbilityEnum.proto"), "utf8");
  const nomePorId = {};
  for (const m of txt.matchAll(/id: (ABILITY_\w+)\s+name: "([^"]*)"/g)) {
    const e = enumTxt.match(new RegExp("\\b" + m[1] + " = (\\d+);"));
    if (e) nomePorId[Number(e[1])] = m[2];
  }
  Object.keys(R.TYPE_MOD_ABILITIES).map(Number).forEach((id) => {
    if (DESLOCADOS_2654[id]) return assert.equal(nomePorId[DESLOCADOS_2654[id]], NOMES[id], "id novo de " + NOMES[id]);
    assert.equal(nomePorId[id], NOMES[id], "config id " + id);
  });
});
