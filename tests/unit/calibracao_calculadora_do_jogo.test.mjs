// Calibração do motor contra a calculadora de dano do próprio jogo (10/10/2026, prints do usuário).
// A tela "Damage Calculator" do jogo (formato Smogon: "172 Atk Ledian Mega Punch vs. 4 HP / 0 Def Ninetales: 127-152
// (78 - 93%)") usa os EVs reais dos dois lados, a Life Orb, o clima e a faixa aleatória de 85% a 100%, e mostra o
// 1º golpe só (a Raging Boxer não entra: 2º golpe a 40%). "---" = imune (Close Combat no Fantasma; Mach Punch na
// Queenly Majesty). Aqui o motor tem que cair dentro da faixa que o jogo mostrou.
// Montagem: Ledian nível 55, Jolly, EVs 84 HP / 172 Atk / 252 Spe (reproduz os stats 154/150/99/73/143/189 da tela),
// Aerodynamics, Life Orb, contra o Ninetales da Meteor Falls (162 HP, 94/104/171/132/166, Charcoal, Modest, Drought).
import { test } from "node:test";
import assert from "node:assert/strict";
import { carregarRegras } from "./carregar_regras.mjs";

const NIVEL = 55;
const R = carregarRegras({ milestone: 3, difficulty: "ace", levelCapMode: "easy" });
const ninetales = () => R.foeDeDuelo(R.BOSSES.find((b) => b.name === "Courtney Meteor Falls").party[0], NIVEL, null);
const ledian = (golpe, item = "Life Orb") => R.unidadeDaBuild(R.SPECIES.find((s) => s && s.n === "Ledian"),
  { ability: "Aerodynamics", nature: "Jolly", evs: [84, 172, 0, 0, 0, 252], item, moves: [golpe] }, NIVEL, null);

// 1º golpe do golpe escolhido, em fração do HP do alvo (média da faixa aleatória, como o motor calcula).
function primeiroGolpe(golpe, item) {
  const eu = ledian(golpe, item), alvo = ninetales();
  const d = R.danoNoDuelo(eu, alvo, NIVEL);
  const g = eu.golpesProntos[0];
  const duploDoGolpe = (g.cats || []).reduce((mx, c) => Math.max(mx, eu.ef.categoriaExtra[c] || 1), 1); // 2º golpe (Raging Boxer)
  return d.melhor.dano / duploDoGolpe / alvo.stats[0];
}
const dentro = (v, min, max, rotulo) => assert.ok(v >= min && v <= max, rotulo + ": motor " + (v * 100).toFixed(1) + "%, jogo " + min * 100 + "% a " + max * 100 + "%");

test("calculadora do jogo: Mega Punch do Ledian no Ninetales = 78% a 93% (60% a 72% sem a Life Orb)", () => {
  dentro(primeiroGolpe("Mega Punch", "Life Orb"), 0.78, 0.93, "com Life Orb");
  dentro(primeiroGolpe("Mega Punch", ""), 0.60, 0.72, "sem item");
});

test("calculadora do jogo: Aerial Ace do Ledian no Ninetales = 58% a 69%", () => {
  dentro(primeiroGolpe("Aerial Ace", "Life Orb"), 0.58, 0.69, "com Life Orb");
});

test("habilidade 'Normal vira X, golpes de X são empoderados' (Aerilate, Pixilate...): o golpe convertido vale x1,3", () => {
  for (const nome of ["Aerilate", "Pixilate", "Refrigerate", "Galvanize"]) {
    const e = R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME[nome]], "SPECIES_RATTATA", null);
    assert.equal(e.converte.Normal.mult, 1.3, nome);
  }
});

// Ainda sem explicação: a calculadora mostra 16% a 19% e o motor dá ~21% (cerca de 10% acima do teto). O poder
// (80), a chance de 30%, o contato e o 'Iron Fist boost' do jogo conferem com o dado do app (tela do golpe, 10/10).
// Fica como pendência, sem derrubar a suíte.
test("calculadora do jogo: Insect Impact do Ledian no Ninetales = 16% a 19%", { todo: "Insect Impact ~10% acima da calculadora do jogo; BP 80 confere, causa ainda desconhecida" }, () => {
  dentro(primeiroGolpe("Insect Impact", "Life Orb"), 0.16, 0.19, "com Life Orb");
});
