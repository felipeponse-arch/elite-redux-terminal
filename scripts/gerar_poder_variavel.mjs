// Gera data/poder_variavel.json (ticket 16, 07/10/2026): o que o motor precisa para os golpes de poder 1 no dado,
// cujo poder vem de outra coisa (código oficial src/script_conditions.cc e battle_script_commands.c):
//  - golpes: id do golpe -> efeito (Low Kick, Heat Crash, Gyro Ball, Electro Ball, Sky Drop = Seismic Toss,
//    Level Damage = Night Shade);
//  - pesos: número da Pokédex nacional -> peso em hectogramas (o jogo lê o peso pela Pokédex:
//    GetPokedexHeightWeight(SpeciesToNationalPokedexNum), então formas e Megas usam o peso da base).
// Fonte: data/gameData.json (NextDex: effT do golpe e dex.hw da espécie).
// Uso: node scripts/gerar_poder_variavel.mjs
import { readFileSync, writeFileSync } from "node:fs";

const EFEITOS = ["Low Kick", "Heat Crash", "Gyro Ball", "Electro Ball", "Sky Drop", "Level Damage"];
const gd = JSON.parse(readFileSync("data/gameData.json", "utf8"));
const golpes = {};
// Só golpe de dano com poder 1 no dado (o Sky Drop de verdade tem poder próprio e divide o efeito com o
// Seismic Toss). No Elite Redux o Splash é golpe físico com o efeito Heat Crash (dano pelo peso) e entra.
for (const m of gd.moves) if (m && m.pwr === 1 && gd.splitT[m.split] !== "STATUS" && EFEITOS.includes(gd.effT[m.eff])) golpes[m.id] = gd.effT[m.eff];
const pesos = {};
for (const s of gd.species) {
  const id = s && s.dex && s.dex.id, hw = s && s.dex && s.dex.hw;
  if (id && hw && hw[1] > 0 && pesos[id] === undefined) pesos[id] = hw[1]; // a primeira entrada do número = a base
}
writeFileSync("data/poder_variavel.json", JSON.stringify({ golpes, pesos }));
console.log("poder_variavel.json: " + Object.keys(golpes).length + " golpes, " + Object.keys(pesos).length + " pesos");
