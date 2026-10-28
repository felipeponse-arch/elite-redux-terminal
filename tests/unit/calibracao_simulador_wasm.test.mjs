// Calibração do motor contra o simulador do jogo compilado (WebAssembly, Elite Redux 2.65.3b), 21/10/2026
// (ticket calibracao-simulador/01; registro completo em docs/tickets/calibracao-simulador/comparacao.md).
// Só valores OBSERVADOS na aba Calculator do simulador de terceiro (fan-made); nada do site foi copiado. Cada caso: mesmo
// atacante, alvo, nível, natureza, EVs (IVs 31), item, habilidade, clima e campo nos dois lados; o simulador dá o dano de UM
// acerto na faixa de rolagem (mínimo-máximo). O motor devolve a média esperada (rolagem média, chance de crítico, precisão,
// acertos e o 2º soco da Raging Boxer); aqui tira-se tudo isso para comparar com UM acerto, sem crítico, sem erro. O golpe que
// "sempre acerta crítico" (Aerial Ace) o simulador mostra com o crítico, então a conta devolve o x1,5.
// "imune" = o simulador mostrou "No effect". Tolerância: média do motor a 4% (ou 2,5 de dano, nos golpes fracos) da média da faixa do simulador (o jogo arredonda a cada etapa).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" });
const CLIMA = { sun: "sol", rain: "chuva", sand: "areia", hail: "granizo" };
const sp = (n) => R.SPECIES.find((s) => s && s.n === n);
const P = (nome, ab, na, it, ev, lv) => ({ nome, ab, na, it, ev, lv });
const montar = (o, golpes, clima) => R.unidadeDaBuild(sp(o.nome), { ability: o.ab, nature: o.na, evs: o.ev, item: o.it, moves: golpes }, o.lv, clima);

// Dano de um acerto, média da rolagem, sem crítico e sem erro, como o motor calcula; null = o motor não acha dano (imune/filtrado).
function umAcerto(c, golpe) {
  const clima = CLIMA[c.w] || null, A = montar(c.A, [golpe], clima), B = montar(c.B, ["Tackle"], clima);
  const r = R.danoNoDuelo(A, B, c.A.lv).melhor, g = r.golpe;
  if (!g) return null;
  const duplo = (g.cats || []).reduce((mx, k) => Math.max(mx, A.ef.categoriaExtra[k] || 1), 1); // Raging Boxer: soco bate de novo
  const pr = Math.min(1, g.precisao * A.ef.precisaoMult);
  let mid = r.dano / r.crit.fator / pr / ((g.acertos || 1) * duplo);
  const f = c.f || [];
  if (g.crit.sempre || f.includes("crit-A")) mid *= r.crit.certo; // crítico garantido: o simulador mostra o dano com ele
  else if ((f.includes("reflect-B") && g.cat === "F") || (f.includes("lightscreen-B") && g.cat === "E") || f.includes("auroraveil-B")) mid *= 0.5;
  return mid;
}

const led = (it) => P("Ledian", "Aerodynamics", "Jolly", it, [84, 172, 0, 0, 0, 252], 55);
const nine = () => P("Ninetales", "Flaming Soul", "Modest", "Charcoal", [0, 0, 0, 0, 0, 0], 55);
const exc = () => P("Excadrill", "Tough Claws", "Adamant", "", [0, 252, 0, 0, 0, 252], 50);
const alak = (it) => P("Alakazam", "Trace", "Timid", it, [0, 0, 0, 252, 0, 252], 50);
const chan = (it) => P("Chansey", "Healer", "Bold", it || "", [252, 0, 252, 0, 0, 0], 50);

// golpe: [min, max] do simulador, ou "imune".
const CASOS = [
  { id: "S1 Ledian Life Orb x Ninetales", A: led("Life Orb"), B: nine(), g: { "Mega Punch": [142, 170], "Aerial Ace": [106, 127], "Insect Impact": [30, 36], "Dual Wingbeat": [53, 64] } },
  { id: "S2 Ledian sem item x Ninetales", A: led(""), B: nine(), g: { "Mega Punch": [110, 131], "Insect Impact": [23, 28], "Aerial Ace": [82, 98], "Dual Wingbeat": [42, 50] } },
  { id: "S3 Ledian Choice Band x Ninetales", A: led("Choice Band"), B: nine(), g: { "Mega Punch": [163, 195], "Insect Impact": [35, 42], "Aerial Ace": [120, 144], "Dual Wingbeat": [60, 72] } },
  { id: "S4 Excadrill x Chansey Eviolite", A: exc(), B: chan("Eviolite"), g: { Earthquake: [147, 176], "Rock Slide": [62, 74], "Iron Head": [129, 154], "Drill Run": [164, 196] } },
  { id: "S5 Excadrill x Chansey", A: exc(), B: chan(), g: { Earthquake: [221, 264], "Rock Slide": [93, 111], "Iron Head": [193, 230], "Drill Run": [245, 292] } },
  { id: "S6 Alakazam Choice Specs x Chansey", A: alak("Choice Specs"), B: chan(), g: { Psychic: [137, 164], "Shadow Ball": "imune", "Focus Blast": [201, 240], "Energy Ball": [76, 91] } },
  { id: "S7 Alakazam Life Orb x Chansey", A: alak("Life Orb"), B: chan(), g: { Psychic: [120, 143], "Shadow Ball": "imune", "Focus Blast": [174, 208], "Energy Ball": [66, 79] } },
  // Divergência conhecida do simulador 2.65.3b (28/10): o Air Slash saiu do S8 porque o Charizard tem Giant Wings inata (x1,3 em golpes de vento) e o simulador antigo não a aplica.
  { id: "S8 Charizard no Sol x Chansey", w: "sun", A: P("Charizard", "Molten Down", "Timid", "", [0, 0, 0, 252, 0, 252], 50), B: chan(), g: { Flamethrower: [120, 144], "Fire Blast": [145, 173], "Solar Beam": [58, 70] } }, // Air Slash [59, 71] saiu (v2.65.4.1, 28/10): no jogo novo o Charizard tem Giant Wings como inata (x1,3 em golpe de ar) e o simulador 2.65.3b ainda a tem no slot da habilidade; motor 83,6 = 65 x 1,29
  { id: "S9 Kingdra na Chuva x Chansey", w: "rain", A: P("Kingdra", "Swift Swim", "Modest", "", [0, 0, 0, 252, 0, 252], 50), B: chan(), g: { Surf: [100, 120], "Hydro Pump": [157, 187], "Ice Beam": [57, 69], "Dragon Pulse": [86, 103] } },
  { id: "S10 Excadrill x Chansey com Reflect", f: ["reflect-B"], A: exc(), B: chan(), g: { Earthquake: [110, 132], "Rock Slide": [47, 56], "Iron Head": [96, 115], "Drill Run": [122, 146] } },
  { id: "S11 Alakazam x Chansey com Light Screen", f: ["lightscreen-B"], A: alak(""), B: chan(), g: { Psychic: [46, 55], "Shadow Ball": "imune", "Focus Blast": [67, 80], "Energy Ball": [26, 31] } },
  { id: "S12 Excadrill x Chansey com Aurora Veil", f: ["auroraveil-B"], A: exc(), B: chan(), g: { Earthquake: [110, 132], "Rock Slide": [47, 56], "Iron Head": [96, 115], "Drill Run": [122, 146] } },
  { id: "S13 Excadrill crítico x Chansey com Reflect (tela não vale no crítico)", f: ["reflect-B", "crit-A"], A: exc(), B: chan(), g: { Earthquake: [334, 398], "Rock Slide": [140, 167], "Iron Head": [289, 345], "Drill Run": [369, 440] } },
  { id: "S14 Excadrill crítico x Chansey sem tela", f: ["crit-A"], A: exc(), B: chan(), g: { Earthquake: [334, 398], "Rock Slide": [140, 167], "Iron Head": [289, 345], "Drill Run": [369, 440] } },
  { id: "S15 Ledian x Ninetales (Queenly Majesty barra prioridade)", A: led(""), B: nine(), g: { "Mach Punch": "imune", "Quick Attack": "imune", "Bullet Punch": "imune", "Aqua Jet": "imune" } },
  { id: "S16 Scizor x Chansey", A: P("Scizor", "Light Metal", "Adamant", "", [0, 252, 0, 0, 0, 252], 50), B: chan(), g: { "Bullet Punch": [110, 131], "X-Scissor": [162, 194], "U-turn": [127, 152], "Bug Bite": [164, 196] } },
  { id: "S17 Alakazam Expert Belt x Chansey", A: alak("Expert Belt"), B: chan(), g: { Psychic: [92, 110], "Focus Blast": [161, 192], "Energy Ball": [51, 61], "Shadow Ball": "imune" } },
  { id: "S18 Kingdra x Rhydon na Areia", w: "sand", A: P("Kingdra", "Swift Swim", "Modest", "", [0, 0, 0, 252, 0, 252], 50), B: P("Rhydon", "Lightning Rod", "Impish", "", [252, 0, 252, 0, 0, 0], 50), g: { Surf: [219, 261], "Hydro Pump": [348, 415], "Ice Beam": [94, 113], "Dragon Pulse": [110, 131] } },
  { id: "S19 Excadrill x Glalie no Granizo", w: "hail", A: exc(), B: P("Glalie", "Refrigerate", "Impish", "", [252, 0, 252, 0, 0, 0], 50), g: { Earthquake: [69, 83], "Rock Slide": [58, 70], "Iron Head": [120, 144], "Drill Run": [78, 94] } },
  { id: "S20 Excadrill x Chansey no Granizo", w: "hail", A: exc(), B: chan(), g: { Earthquake: [221, 264], "Rock Slide": [93, 111], "Iron Head": [193, 230], "Drill Run": [245, 292] } },
];

for (const c of CASOS) {
  test("simulador 2.65.3b: " + c.id, () => {
    for (const [golpe, sim] of Object.entries(c.g)) {
      const m = umAcerto(c, golpe);
      if (sim === "imune") { assert.equal(m, null, golpe + ": o simulador mostrou 'No effect' e o motor achou dano " + m); continue; }
      assert.ok(m !== null, golpe + ": o motor não achou dano; o simulador deu " + sim.join("-"));
      const meio = (sim[0] + sim[1]) / 2;
      assert.ok(Math.abs(m - meio) <= Math.max(meio * 0.04, 2.5), golpe + ": motor (média) " + m.toFixed(1) + " x simulador " + sim.join("-") + " (média " + meio + ")");
    }
  });
}
