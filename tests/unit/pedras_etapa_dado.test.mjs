// TK-11 (decisão 3): nenhuma pedra libera ANTES do dado (onde_achar_itens), salvo as que o código do jogo trava mais cedo
// ou que ficam travadas por falta de fonte. Gerado da lista toda, não de amostra.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras();
const T = R.MEGA_PEDRAS_TARDIAS;
const ler = (f) => JSON.parse(readFileSync(new URL("../../data/" + f, import.meta.url), "utf8"));
const ONDE = ler("onde_achar_itens.json");
const MEGA = ler("mega_forms.json");
// Divergências aceitas, cada uma com fonte: código do jogo (er-repo upcoming) ou decisão 27/10 de travar sem fonte.
const EXCECAO = {
  Haxorusite: 7, // MeteorFalls_1F_1R/scripts.pory:17 (BADGE07), dado errado
  "Dragoninite X": 6, // SkyPillar_Outside/scripts.pory:185 (BADGE06)
  "Blue Orb": 7, "Red Orb": 7, Bruxishite: 7, Jellicentite: 7, "Skarmorite X": 7, // MeteorFalls_HaxorusRoom
  "Abomasite S": 8, Dracovishite: 10, "Chien-Paoite": 8, "Galactic Orb": 8, "Dream Orb": 10, "Lucky Orb": 10, // sem fonte: travada
};

test("nenhuma pedra libera antes do dado, exceto as 7 que o código do jogo trava antes (4 do mono-champ no dado 8; Dream/Lucky Orb travadas em 10)", () => {
  const antes = Object.keys(MEGA).filter((p) => ONDE[p] && (T[p] || 4) < Math.min(...ONDE[p].map((x) => x.etapa)));
  assert.deepEqual(antes.sort(), ["Blue Orb", "Bruxishite", "Dragoninite X", "Haxorusite", "Jellicentite", "Red Orb", "Skarmorite X"]);
});

test("cada pedra da lista tem a etapa travada", () => {
  for (const [p, et] of Object.entries(EXCECAO)) assert.equal(T[p] || 4, et, p);
});

