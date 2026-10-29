// TK-16 (campo, fase 1): caracterização ANTES da refatoração. Fixa o veredito do motor (R.resultadoDoDuelo) em lutas com
// sol, chuva, areia, neve (granizo), névoa e os cinco terrenos, para a troca de fonte (src/regras/campo.js) não mexer em
// comportamento. Espécie, golpe e habilidade reais; o clima vem pela habilidade que arma ao entrar (Drought, Drizzle...).
import { test } from "node:test";
import assert from "node:assert/strict";
import { eu, chefao, lutar, EV } from "./cenarios_do_duelo.mjs";

const medida = (r) => [r.venceu ? 1 : 0, +r.fracEu.toFixed(4), +r.fracFoe.toFixed(4), r.turnos].join("|");
const alvo = () => chefao("Snorlax", { hab: "Thick Fat", golpes: ["Body Slam"], evs: [252, 252, 4, 0, 0, 0], nat: "Adamant" });
// [rótulo, espécie, habilidade armadora, golpe do dono]
const CASOS = [
  ["sol", "Torkoal", "Drought", "Flamethrower"],
  ["chuva", "Pelipper", "Drizzle", "Surf"],
  ["areia", "Tyranitar", "Sand Stream", "Rock Slide"],
  ["neve", "Abomasnow", "Snow Warning", "Blizzard"],
  ["nevoa", "Gengar", "Low Visibility", "Sludge Bomb"],
  ["terreno eletrico", "Raichu", "Electro Surge", "Thunderbolt"],
  ["terreno de grama", "Rillaboom", "Grassy Surge", "Wood Hammer"],
  ["terreno psiquico", "Indeedee", "Psychic Surge", "Psychic"],
  ["terreno nevoento", "Tapu Fini", "Misty Surge", "Moonblast"],
  ["terreno toxico", "Toxtricity", "Toxic Surge", "Sludge Bomb"]
];
// Valores medidos no motor ANTES do TK-16 (base 7acf16a).
const ESPERADO = {
  sol: "0|0|0.6414|5", chuva: "0|0|0.4008|3", areia: "1|0.3196|0|5", neve: "0|0|0.4401|4", nevoa: "1|1|0|3",
  "terreno eletrico": "0|0|0.3201|2", "terreno de grama": "1|0.436|0|2", "terreno psiquico": "1|0.0547|0|2",
  "terreno nevoento": "0|0|0.1453|3", "terreno toxico": "0|0|0.1157|2"
};

test("caracterização TK-16: cada clima/terreno dá o mesmo veredito do motor", () => {
  const medidas = {};
  CASOS.forEach(([rot, sp, hab, golpe]) => {
    medidas[rot] = medida(lutar(eu(sp, { hab, golpes: [golpe], evs: EV.especial, nat: "Modest" }), alvo()));
  });
  if (process.env.TK16_IMPRIMIR) console.log(JSON.stringify(medidas, null, 1));
  assert.deepEqual(medidas, ESPERADO);
});

test("caracterização TK-16: clima passado de fora (unidade com clima) também fixa o veredito", () => {
  const medidas = {};
  ["sol", "chuva", "areia", "granizo", "nevoa"].forEach((clima) => {
    medidas[clima] = medida(lutar(eu("Torkoal", { golpes: ["Flamethrower", "Surf"], clima, evs: EV.especial, nat: "Modest" }), alvo()));
  });
  if (process.env.TK16_IMPRIMIR) console.log(JSON.stringify(medidas, null, 1));
  assert.deepEqual(medidas, ESPERADO_CLIMA);
});
const ESPERADO_CLIMA = {
  sol: "0|0|0.3553|5", chuva: "0|0|0.1346|5", areia: "0|0|0.5161|5", granizo: "0|0|0.5161|5", nevoa: "0|0|0.5161|5"
};
