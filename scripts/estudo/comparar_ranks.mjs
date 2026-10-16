// Estudo "todas as lutas" (ticket todas-as-lutas/01): compara o rank v2 só com chefões (base) e com chefões + treinadores comuns.
// Mesmas listas de fortes/fracos da comunidade de scripts/validar_rank_v2.mjs (lidas de lá, para não divergir).
// Uso: node scripts/estudo/comparar_ranks.mjs <base.json> <todas.json> <pesos.json>
import { readFileSync } from "node:fs";
import { carregarRegras } from "../../tests/unit/carregar_regras.mjs";

const [baseArq, todasArq, pesosArq] = process.argv.slice(2);
const R = carregarRegras();
const base = JSON.parse(readFileSync(baseArq, "utf8")), todas = JSON.parse(readFileSync(todasArq, "utf8"));
const pesos = JSON.parse(readFileSync(pesosArq, "utf8"));
const fonteValidar = readFileSync("scripts/validar_rank_v2.mjs", "utf8");
const lista = (nome) => JSON.parse(new RegExp("const " + nome + " = (\\[[\\s\\S]*?\\]);").exec(fonteValidar)[1]);
const FORTES = lista("FORTES"), FRACOS = lista("FRACOS");
const nome = (s) => (R.getSpeciesBySname(s) || { n: s }).n;
const porNome = Object.fromEntries(Object.keys(base).map((s) => [nome(s), s]));
const ORDEM = ["D", "C", "B", "A", "S", "SS"];

for (const dif of ["party", "insane"]) {
  const ss = Object.keys(base).filter((s) => base[s] && base[s][dif] && todas[s] && todas[s][dif]);
  const dif1 = ss.map((s) => ({ s, a: base[s][dif].score, b: todas[s][dif].score, ta: base[s][dif].tier, tb: todas[s][dif].tier }));
  const mudouTier = dif1.filter((d) => d.ta !== d.tb);
  const media = (k) => (dif1.reduce((x, d) => x + Math.abs(d.b - d.a), 0) / dif1.length).toFixed(1);
  console.log("\n==== " + (dif === "party" ? "Fácil/Ace" : "Elite") + " ====");
  console.log("espécies comparadas: " + ss.length + " | mudaram de tier: " + mudouTier.length + " (" + Math.round(100 * mudouTier.length / ss.length) + "%) | variação média: " + media() + " pontos");
  const subiram2 = mudouTier.filter((d) => ORDEM.indexOf(d.tb) - ORDEM.indexOf(d.ta) >= 2).length, cairam2 = mudouTier.filter((d) => ORDEM.indexOf(d.ta) - ORDEM.indexOf(d.tb) >= 2).length;
  console.log("pularam 2+ tiers: subiram " + subiram2 + ", caíram " + cairam2);
  const ord = dif1.slice().sort((x, y) => (y.b - y.a) - (x.b - x.a));
  console.log("SOBEM mais: " + ord.slice(0, 15).map((d) => nome(d.s) + " " + d.ta + d.a + "->" + d.tb + d.b).join(", "));
  console.log("CAEM mais: " + ord.slice(-15).reverse().map((d) => nome(d.s) + " " + d.ta + d.a + "->" + d.tb + d.b).join(", "));
  const pct = (grupo, rk) => { const v = grupo.map((n) => porNome[n]).filter((s) => s && rk[s] && rk[s][dif]).map((s) => rk[s][dif].score); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) + " (" + v.length + ")" : "-"; };
  console.log("comunidade FORTES (média do percentil, maior = melhor): só chefões " + pct(FORTES, base) + " | todas " + pct(FORTES, todas));
  console.log("comunidade FRACOS (menor = melhor): só chefões " + pct(FRACOS, base) + " | todas " + pct(FRACOS, todas));
  const pl = pesos[dif].pesoLuta, comuns = new Set(pesos[dif].comuns);
  const somaC = Object.entries(pl).filter(([n]) => comuns.has(n)).reduce((a, [, w]) => a + w, 0), somaT = Object.values(pl).reduce((a, w) => a + w, 0);
  const nC = comuns.size, nB = Object.keys(pl).length - nC;
  console.log("peso: " + nC + " lutas comuns somam " + Math.round(100 * somaC / somaT) + "% do peso total (" + nB + " de chefão somam " + Math.round(100 * (somaT - somaC) / somaT) + "%); peso médio comum " + (somaC / nC).toFixed(2) + " x chefão " + ((somaT - somaC) / nB).toFixed(2));
  console.log("comuns mais perigosas: " + Object.entries(pl).filter(([n]) => comuns.has(n)).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, w]) => n.replace(/ #\d+$/, "") + " " + w.toFixed(2)).join(", "));
}
