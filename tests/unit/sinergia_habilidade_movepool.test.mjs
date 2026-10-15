// Gerador da sinergia habilidade x movepool (porte Node, lê o INGLÊS do dex). Trava: arquivo gravado == gerador, ids batem com o dex,
// e a regra nova de tipo (só conta tipo citado como alvo do golpe: "Dark/Fairy" de defesa e "Burn or Poison" de status não contam).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gerarSinergia } from "../../scripts/gerar_sinergia_habilidade_movepool.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ler = (a) => readFileSync(join(RAIZ, a), "utf8");
const dex = JSON.parse(ler("data/dex_compact.json"));

test("species_ability_synergy.json gravado == gerador lendo o inglês do dex", () => {
  assert.equal(JSON.stringify(gerarSinergia(dex).resultado), ler("data/species_ability_synergy.json"));
});

test("todo id citado na sinergia é a habilidade de mesmo nome no dex (Mighty Horn = 390)", () => {
  const sin = JSON.parse(ler("data/species_ability_synergy.json"));
  for (const hs of Object.values(sin)) for (const h of hs) assert.equal(dex.abilities[h.id][0], h.name);
  const horn = Object.values(sin).flat().filter((h) => h.name === "Mighty Horn");
  assert.ok(horn.length > 0 && horn.every((h) => h.id === dex.abilities.findIndex((a) => a[0] === "Mighty Horn")));
  assert.ok(sin.SPECIES_NIDOKING.some((h) => h.name === "Mighty Horn"));
});

test("regra de tipo: só o tipo-alvo do golpe conta", () => {
  const mini = { types: ["Normal", "Fire", "Poison", "Dark", "Fairy"], flags: [], abilities: [["-", ""], ["Boost", "Boosts Fire-type moves by 1.3x."], ["Guarda", "Boosts Defense. Takes -25% dmg from Dark/Fairy."], ["Status", "1.2x boost to physical moves and 20% chance to Burn or Poison."]],
    moves: [["Ember", 1, 0, 40, 100, 25, "", 0, [], -1, 0, "x"]], species: [{ sname: "SPECIES_T", ab: [1, 2, 3], inn: [], lm: [[1, 0]], tu: [] }] };
  const r = gerarSinergia(mini);
  assert.deepEqual([...r.aumentos.keys()], [1]);
  assert.equal(r.resultado.SPECIES_T[0].categoria, "Fire");
});
