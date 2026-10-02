// Ponto 7 do rank v2: conferir o rank novo contra referências de fora, sem ajustar peso.
// - percentil médio dos FORTES / FRACOS da comunidade (mesmas listas do calcular_rank_duelo.mjs)
//   e das espécies com build curada do Discord;
// - Spearman contra o placar dos vídeos (forte - fraco por espécie), com validação cruzada
//   em 5 partes (a correlação tem que se manter em cada parte, não só no total);
// - o mesmo para o rank atual (species_rank.json), para comparar os dois.
// Divergência grande = investigar o motor (docs/decisoes_mecanicas.md), não mexer em peso.
//
// Uso: node scripts/validar_rank_v2.mjs [placar_videos.json]
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { carregarRegras } from "../tests/unit/carregar_regras.mjs";

const RAIZ = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const R = carregarRegras();
const v2 = JSON.parse(readFileSync(join(RAIZ, "..", "rank_v2_saida.json"), "utf8"));
const v1 = JSON.parse(readFileSync(join(RAIZ, "data", "species_rank.json"), "utf8"));
const placarPath = process.argv[2];
const placar = placarPath && existsSync(placarPath) ? JSON.parse(readFileSync(placarPath, "utf8")) : null;

const FORTES = ["Goodra Hisuian Mega", "Vanilluxe Mega", "Vanilluxe Redux Mega", "Articuno Mega", "Moltres Mega", "Selenumbra", "Beniccino",
  "Storming", "Skeledirge Mega", "Froslass", "Zangoose", "Kyogre Primal", "Groudon Primal", "Rayquaza Mega", "Dragapult Mega",
  "Garchomp", "Tyranitar", "Weavile", "Metagross", "Dragonite", "Salamence"];
const FRACOS = ["Wispywaspy Hivemind", "Iron Spirals", "Malamar Mega", "Sawk Redux", "Beartic", "Cherrim", "Luvdisc", "Magikarp", "Caterpie", "Bulbasaur"];

const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
const porNome = new Map();
for (const sp of R.SPECIES) if (sp) porNome.set(norm(sp.n), sp);
// o placar escreve "Mega Meganium"; a dex, "Meganium Mega"
const achar = (n) => porNome.get(norm(n)) || porNome.get(norm(n.replace(/^(Mega|Primal|Galarian|Alolan|Hisuian|Paldean) (.+)$/, "$2 $1")));

function postos(v) {
  const idx = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = new Array(v.length);
  for (let i = 0; i < idx.length;) {
    let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2;
    i = j + 1;
  }
  return r;
}
function spearman(a, b) {
  if (a.length < 3) return NaN;
  const ra = postos(a), rb = postos(b), n = a.length;
  const ma = ra.reduce((x, y) => x + y, 0) / n, mb = rb.reduce((x, y) => x + y, 0) / n;
  let c = 0, va = 0, vb = 0;
  for (let i = 0; i < n; i++) { c += (ra[i] - ma) * (rb[i] - mb); va += (ra[i] - ma) ** 2; vb += (rb[i] - mb) ** 2; }
  return va && vb ? c / Math.sqrt(va * vb) : NaN;
}
const f2 = (x) => (isNaN(x) ? "-" : x.toFixed(2));
const media = (xs) => (xs.length ? xs.reduce((a, v) => a + v, 0) / xs.length : NaN);

const notaV1 = (s) => (v1[s] ? v1[s].score : null);
for (const dif of ["party", "insane"]) {
  const notaV2 = (s) => (v2[s] && v2[s][dif] ? v2[s][dif].score : null);
  console.log(`\n== ${dif} ==`);
  for (const [rot, lista] of [["fortes da comunidade", FORTES], ["fracos da comunidade", FRACOS]]) {
    const sps = lista.map(achar).filter(Boolean);
    const fora = sps.filter((sp) => notaV2(sp.sname) === null).map((sp) => sp.n);
    console.log(`${rot}: v2 ${f2(media(sps.map((sp) => notaV2(sp.sname)).filter((x) => x !== null)))} | v1 ${f2(media(sps.map((sp) => notaV1(sp.sname)).filter((x) => x !== null)))}` +
      (fora.length ? ` | fora do v2: ${fora.join(", ")}` : ""));
  }
  const curadas = Object.keys(R.BUILDS).filter((s) => notaV2(s) !== null);
  console.log(`build curada (${curadas.length}): v2 ${f2(media(curadas.map(notaV2)))} | v1 ${f2(media(curadas.map(notaV1).filter((x) => x !== null)))}`);
  if (!placar) continue;
  const pares = [];
  for (const p of Object.values(placar)) {
    const sp = achar(p.especie);
    if (!sp || notaV2(sp.sname) === null || p.so_como_inimigo_na_265) continue;
    pares.push({ n: sp.n, alvo: p.forte - p.fraco, a: notaV2(sp.sname), b: notaV1(sp.sname) ?? 0 });
  }
  const rho = (xs, k) => spearman(xs.map((x) => x[k]), xs.map((x) => x.alvo));
  console.log(`placar dos vídeos (${pares.length} espécies): Spearman v2 ${f2(rho(pares, "a"))} | v1 ${f2(rho(pares, "b"))}`);
  const partes = [0, 1, 2, 3, 4].map((k) => pares.filter((_, i) => i % 5 === k));
  console.log("  por parte (v2/v1): " + partes.map((p) => f2(rho(p, "a")) + "/" + f2(rho(p, "b"))).join("  "));
  const div = pares.filter((p) => p.alvo >= 2 && p.a < 50).map((p) => `${p.n} ${p.a}`);
  if (div.length) console.log("  fortes nos vídeos e abaixo de 50 no v2: " + div.join(", "));
}
