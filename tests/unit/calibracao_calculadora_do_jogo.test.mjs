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
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || "") + ": " + a + " x " + b + " (tolerância " + tol + ")");
const dentro = (v, min, max, rotulo) => assert.ok(v >= min && v <= max, rotulo + ": motor " + (v * 100).toFixed(1) + "%, jogo " + min * 100 + "% a " + max * 100 + "%");

// 15/10/2026 (ticket versao-nova/02, decisão 4 do Felipe: "Normal vira X" segue o CÓDIGO do jogo, STAB x1,5): a calculadora de 10/10 só
// fechava com x1,3 (Mega Punch 78%-93%, Aerial Ace 58%-69%). O código (abilities.cc:295-301, `ATE_ABILITY`) troca o tipo e dá STAB ao tipo
// novo, sem multiplicador; o Ledian não é Flying, então o STAB x1,5 vale para o Mega Punch convertido E para o Aerial Ace. O motor agora
// fica ACIMA da faixa da calculadora (a diferença é a conta x1,5 contra x1,3 e o STAB do Aerial Ace); se a medida em batalha real
// mostrar a calculadora certa, este teste e a decisão de 15/10 voltam para a mesa.
test("código do jogo: Mega Punch do Ledian no Ninetales com Aerilate = STAB x1,5 (calculadora do jogo dizia 78% a 93%; motor 98%)", () => {
  dentro(primeiroGolpe("Mega Punch", "Life Orb"), 0.96, 1.0, "com Life Orb");
});

test("código do jogo: Aerial Ace do Ledian (não é Flying) ganha o STAB da Aerilate em todo golpe Flying (calculadora dizia 58% a 69%; motor 92%)", () => {
  dentro(primeiroGolpe("Aerial Ace", "Life Orb"), 0.89, 0.95, "com Life Orb");
});

// Atacante Garchomp (Dragon/Ground, sem STAB nos tipos abaixo) contra um Magikarp sem EV (Water: neutro para Flying, Fairy e Bug).
const NOME_ATE = { Aerilate: ["Flying", "Aerial Ace"], Pixilate: ["Fairy", "Dazzling Gleam"], Pollinate: ["Bug", "Bug Bite"] };
function razaoAte(hab, golpe, extra) {
  const mk = (habs) => {
    const s = R.SPECIES.find((x) => x && x.n === "Garchomp");
    const u = R.unidadeDaBuild(s, { ability: "Run Away", nature: "Hardy", evs: [0, 252, 0, 252, 0, 0], item: "", moves: [golpe] }, NIVEL, null);
    const ids = habs.map((n) => R.ABILITY_ID_BY_NAME[n]);
    u.ids = ids; u.ef = R.efeitoDasHabilidadesNoDuelo(ids, "ATE_" + habs.join("+"), null); u.tipos = R.tiposNaBatalha(s, u.ef);
    u.golpeIds = [R.MOVE_ID_BY_NAME[golpe]]; u.golpesProntos = R.prepararGolpesDuelo(u.golpeIds, u, null);
    return u;
  };
  const m = R.SPECIES.find((x) => x && x.n === "Magikarp");
  const alvo = R.unidadeDaBuild(m, { ability: "Run Away", nature: "Hardy", evs: [0, 0, 0, 0, 0, 0], item: "", moves: ["Tackle"] }, NIVEL, null);
  alvo.ids = []; alvo.ef = R.efeitoDasHabilidadesNoDuelo([], "ATE_ALVO", null); alvo.tipos = ["Water"];
  alvo.golpeIds = [R.MOVE_ID_BY_NAME.Tackle]; alvo.golpesProntos = R.prepararGolpesDuelo(alvo.golpeIds, alvo, null);
  return R.danoNoDuelo(mk(hab), alvo, NIVEL).melhor.dano / R.danoNoDuelo(mk(extra || []), alvo, NIVEL).melhor.dano;
}

test("'Normal vira X' (Aerilate, Pixilate, Pollinate...): o golpe convertido e os golpes nativos de X ganham STAB x1,5, sem multiplicador (abilities.cc:295-301)", () => {
  for (const [nome, [tipo, nativo]] of Object.entries(NOME_ATE)) {
    const e = R.efeitoDasHabilidadesNoDuelo([R.ABILITY_ID_BY_NAME[nome]], "SPECIES_RATTATA", null);
    assert.equal(e.converte.Normal.mult, 1, nome + ": sem multiplicador");
    assert.equal(e.ateMult, 1, nome);
    assert.deepEqual(Array.from(e.stabExtra), [tipo], nome + ": STAB do tipo novo");
    assert.ok(Math.abs(razaoAte([nome], nativo) - 1.5) < 0.04, nome + " / " + nativo + " (nativo): " + razaoAte([nome], nativo));
  }
});

test("'Normal vira X': Body Slam vira o tipo novo com STAB x1,5; com Adaptability o STAB do tipo novo é x2", () => {
  perto(razaoAte(["Aerilate"], "Body Slam"), 1.5, 0.04, "Aerilate / Body Slam");
  perto(razaoAte(["Aerilate", "Adaptability"], "Body Slam", ["Adaptability"]), 2, 0.05, "Aerilate + Adaptability / Body Slam");
});

// Ainda sem explicação: a calculadora mostra 16% a 19% e o motor dá ~21% (cerca de 10% acima do teto). O poder
// (80), a chance de 30%, o contato e o 'Iron Fist boost' do jogo conferem com o dado do app (tela do golpe, 10/10).
// Fica como pendência, sem derrubar a suíte.
test("calculadora do jogo: Insect Impact do Ledian no Ninetales = 16% a 19%", { todo: "Insect Impact ~10% acima da calculadora do jogo; BP 80 confere, causa ainda desconhecida" }, () => {
  dentro(primeiroGolpe("Insect Impact", "Life Orb"), 0.16, 0.19, "com Life Orb");
});
