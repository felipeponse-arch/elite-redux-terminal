// Estudo todas-as-lutas/02 (16/10/2026): divisões de peso entre chefões e lutas comuns, sem refazer a simulação.
// Lê o arquivo de calcular_rank_v2.mjs --por-luta e repete o cálculo de nota do rank v2 (peso por ameaça iterado, PvPoke),
// com uma diferença: a nota é fatia x (média ponderada nas lutas de chefão) + (1 - fatia) x (média ponderada nas comuns).
// Sem fatia ("igual") é o cálculo original, com todas as lutas no mesmo saco. Grava, para cada divisão, um arquivo no formato
// do rank v2 (para scripts/estudo/comparar_ranks.mjs) e o peso das lutas.
// Uso: node scripts/estudo/fatias_de_peso.mjs <por_luta.json> <pasta de saída> [fatias, ex.: igual,0.5,0.6,0.7]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [arq, pasta, listaFatias = "igual,0.5,0.6,0.7"] = process.argv.slice(2);
const { lutas, res } = JSON.parse(readFileSync(arq, "utf8"));
const DIFS = ["party", "insane"];
const validos = Object.keys(res);
const tierDe = (p) => (p >= 97 ? "SS" : p >= 90 ? "S" : p >= 75 ? "A" : p >= 50 ? "B" : p >= 20 ? "C" : "D"); // igual ao rank v2
function percentis(obj) {
  const ks = Object.keys(obj).sort((a, b) => obj[a] - obj[b]), n = ks.length, p = {};
  ks.forEach((k, i) => { p[k] = Math.round(((i + 1) / n) * 10000) / 100; });
  return p;
}

function notas(dif, eixo, fatia) {
  const L = lutas[dif];
  const lista = (s) => (res[s][dif] && res[s][dif][eixo]) || [];
  let pesoEsp = Object.fromEntries(validos.map((s) => [s, 1]));
  let pesoLuta = new Array(L.length).fill(0), nota = {};
  for (let it = 0; it < 4; it++) {
    const soma = new Array(L.length).fill(0), peso = new Array(L.length).fill(0);
    for (const s of validos) for (const [i, m] of lista(s)) { soma[i] += pesoEsp[s] * (1 - m); peso[i] += pesoEsp[s]; }
    pesoLuta = soma.map((v, i) => (peso[i] ? v / peso[i] : 0));
    for (const s of validos) {
      const media = (filtro) => {
        let num = 0, den = 0;
        for (const [i, m] of lista(s)) if (filtro(i)) { num += pesoLuta[i] * m; den += pesoLuta[i]; }
        return den ? num / den : null;
      };
      if (fatia === null) nota[s] = media(() => true) || 0;
      else {
        const nb = media((i) => !L[i].comum), nc = media((i) => L[i].comum);
        nota[s] = nb === null ? (nc || 0) : nc === null ? nb : fatia * nb + (1 - fatia) * nc;
      }
    }
    const med = validos.reduce((a, s) => a + nota[s], 0) / validos.length;
    pesoEsp = Object.fromEntries(validos.map((s) => [s, 0.5 + nota[s] / (2 * med)]));
  }
  return { nota, pesoLuta };
}

for (const f of listaFatias.split(",")) {
  const fatia = f === "igual" ? null : Number(f);
  const final = {}, pesos = {};
  for (const dif of DIFS) {
    const pot = notas(dif, "potencial", fatia), via = notas(dif, "viabilidade", fatia);
    const geo = Object.fromEntries(validos.map((s) => [s, Math.sqrt(Math.max(0, pot.nota[s]) * Math.max(0, via.nota[s]))]));
    const pg = percentis(geo), pp = percentis(pot.nota), pv = percentis(via.nota);
    for (const s of validos) {
      final[s] = final[s] || { etapa: res[s].etapa };
      const r = res[s][dif];
      final[s][dif] = r ? { tier: tierDe(pg[s]), score: Math.round(pg[s]), potencial: { tier: tierDe(pp[s]), score: Math.round(pp[s]) },
        viabilidade: { tier: tierDe(pv[s]), score: Math.round(pv[s]) }, set: r.set, habilidade: r.ab, golpes: r.golpes } : null;
    }
    pesos[dif] = { pesoLuta: Object.fromEntries(lutas[dif].map((l, i) => [l.nome, pot.pesoLuta[i]])), comuns: lutas[dif].filter((l) => l.comum).map((l) => l.nome) };
  }
  writeFileSync(join(pasta, "fatia_" + f + ".json"), JSON.stringify(final));
  writeFileSync(join(pasta, "fatia_" + f + "_pesos.json"), JSON.stringify(pesos));
  console.log("fatia " + f + ": " + validos.length + " espécies -> " + join(pasta, "fatia_" + f + ".json"));
}
