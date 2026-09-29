// Rank por DUELO SIMULADO contra os chefões reais (reunião de 2026-09-28,
// usuário: "tem poke muito bons com uma classificação muito ruim"; depois de
// ver 3 vídeos da comunidade: "vamos seguir o novo modelo de rank com base
// neles"). O rank anterior (compute_species_rank.ps1) tirava 70% da nota só
// de "a tipagem resiste aos tipos de ataque dos chefões" - Garchomp saía C,
// Tyranitar e Weavile D, Mega Vanilluxe D, Bulbasaur e Luvdisc A.
//
// Aqui cada espécie enfrenta, 1x1, cada Pokémon REAL dos chefões
// (data/bosses.json: habilidade, item, nature, EVs, IVs e os 4 golpes do
// jogo) com um set genérico otimizado, e a nota é quantos duelos ela vence.
// Mesmo método da PvPoke (simular contra o campo real), com a vantagem de
// aqui o campo não ser hipotético.
//
// O que os vídeos da comunidade ensinaram e entrou no modelo (MegaFidough,
// v2.65: vencedores/perdedores, 10 melhores habilidades novas, tier list das
// formas novas): neste jogo cada Pokémon tem 4 habilidades ativas e são elas,
// mais que o status base, que decidem quem é forte. Então o duelo lê do
// TEXTO DO JOGO: habilidade composta ("A + B" herda as partes), golpe extra
// (Hyper Aggressive, Parental Bond, Multi-Headed, Lunar Wrath), redução de
// dano (Fur Coat, Ice Scales, Arctic Fur, Filter/Solid Rock/Primal Armor,
// Multiscale/Shadow Shield, Fluffy, Bad Luck), bônus a tipo e a categoria de
// golpe, -ate, Adaptability, Huge/Pure Power, Intimidate, prioridade (On the
// Prowl) e bônus de clima QUANDO O PRÓPRIO POKÉMON ARMA O CLIMA (Primal
// Kyogre: Primordial Sea + Raging Storm). Clima de outro membro não conta -
// rank é da espécie, não do time.
//
// Simplificações, ditas às claras:
//  - Nível igual dos dois lados (NIVEL_DO_DUELO): o nível real de cada chefão
//    não está no dado; com nível igual o resultado depende da razão entre os
//    status, que é o que importa pra comparar espécies.
//  - Três sets por espécie, vale o melhor: físico (252 Atk / 252 Spe, +Atk),
//    especial (252 SpA / 252 Spe, +SpA) e tanque (252 HP / 128 Def / 128 SpD).
//    Com item (2026-09-29, decisão do usuário): o que a habilidade pede (Guts
//    com Flame Orb...) ou o do set (Life Orb, Leftovers, Eviolite) - itemDoSetDuelo.
//  - Golpes: nível + tutor, sem os de carga/recarga ou que desmaiam o usuário.
//    Precisão entra como fator; "2 a 5 vezes" conta 3.
//  - Dano pela fórmula padrão com rolagem média (0,925), crítico como valor
//    esperado, status por chance, estágios, campo, cura e recuo (duelo.js).
//    Multi-Headed ("tantos acertos quantas cabeças") conta 1,5 - o dado não
//    diz quantas cabeças cada espécie tem.
//  - Duelo: quantos golpes cada lado precisa pra nocautear; quem é mais rápido
//    (ou usa prioridade) bate primeiro. Vitória = 1; derrota = metade da
//    fração de HP que tirou antes de cair.
//  - Duas notas (2026-09-29, decisão do usuário): simples (todos os encontros)
//    e dupla (só os chefões em dupla do dado, `db`): o mesmo duelo com o golpe
//    de área valendo 1,5x e o suporte ao parceiro somado (unidadeParaDupla,
//    suporteEmDupla). A luta 2x2 completa fica pro botão da aba Chefões.
//
// Uso: node scripts/calcular_rank_duelo.mjs [--gravar] [--um-nucleo]
// Roda em paralelo (2026-09-29): as espécies são divididas entre workers, um por
// núcleo livre - cada worker carrega o mesmo motor e calcula a sua parte; o
// principal junta e grava. A conta é a mesma; só o tempo cai (o duelo ficou
// bem mais pesado com status, itens, campo e golpes de status).
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cpus } from "node:os";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { carregarRegras } from "../tests/unit/carregar_regras.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const R = carregarRegras({ milestone: 9 });
const NIVEL_DO_DUELO = 50;
const TIERS_DOS_CHEFOES = ["party", "insane", "hell"];
// --sem-planos: duelo sem golpes de status (só pra comparar o peso deles).
const OPCOES_DUELO = process.argv.includes("--sem-planos") ? { semPlanos: true } : undefined;

// ---------- motor: src/regras/duelo.js (o mesmo do botão da aba Chefões) ----------
// O simulador morava aqui; foi pro app em 2026-09-28 pra rank e botão
// "Montar time contra este chefão" usarem um motor só.
const cacheFoe = new Map();
function montarFoe(m) {
  const chave = JSON.stringify([m.x, m.abi, m.item, m.nat, m.evsRaw, m.ivsRaw, m.mv]);
  if (!cacheFoe.has(chave)) cacheFoe.set(chave, R.foeDeDuelo(m, NIVEL_DO_DUELO, null));
  return cacheFoe.get(chave);
}
const encontros = [];
for (const b of R.BOSSES) {
  for (const tier of TIERS_DOS_CHEFOES) {
    const party = b[tier];
    if (!party || !party.length) continue;
    const foes = party.map(montarFoe).filter(Boolean);
    if (foes.length) encontros.push({ nome: b.name + " (" + tier + ")", foes, dupla: !!b.db });
  }
}

// ---------- cada espécie ----------
// Nota = média, por encontro, da fração de duelos vencidos; vale o melhor set
// e a melhor habilidade escolhível. Sem clima (rank é da espécie, não da luta).
function notaDaEspecie(sp) {
  const golpeIds = R.golpesDeDueloAte(sp, null);
  const escolhas = R.uniqueIds(sp.ab || []);
  let melhor = null;
  for (const set of R.SETS_DE_DUELO) {
    for (const ab of escolhas.length ? escolhas : [null]) {
      const u = R.unidadeDeDuelo(sp, set, ab, NIVEL_DO_DUELO, golpeIds, null);
      const ud = R.unidadeParaDupla(u), suporte = R.suporteEmDupla(u.ef);
      let soma = 0, somaDupla = 0, nDupla = 0;
      for (const e of encontros) {
        let s = 0;
        for (const f of e.foes) s += R.resultadoDoDuelo(u, f, NIVEL_DO_DUELO, OPCOES_DUELO);
        soma += s / e.foes.length;
        if (e.dupla) {
          let d = 0;
          for (const f of e.foes) d += Math.min(1, R.resultadoDoDuelo(ud, f, NIVEL_DO_DUELO, OPCOES_DUELO) + suporte);
          somaDupla += d / e.foes.length; nDupla++;
        }
      }
      const nota = soma / encontros.length, notaDupla = nDupla ? somaDupla / nDupla : 0;
      if (!melhor || nota > melhor.nota) melhor = Object.assign(melhor || {}, { nota, set: set.nome, ab: u.ab, item: u.item });
      if (!melhor.dupla || notaDupla > melhor.dupla.nota) melhor.dupla = { nota: notaDupla, set: set.nome, ab: u.ab, item: u.item };
    }
  }
  return melhor;
}

// Worker: calcula só a sua parte e devolve.
if (!isMainThread) {
  const parte = {};
  for (const sname of workerData.snames) parte[sname] = notaDaEspecie(R.getSpeciesBySname(sname));
  parentPort.postMessage(parte);
  process.exit(0);
}
const inicio = Date.now();
const resultado = {};
// --amostra=N: uma espécie a cada N (só pra conferir o script rápido; não grava nada útil).
const amostra = parseInt((process.argv.find((x) => x.startsWith("--amostra=")) || "").split("=")[1], 10) || 1;
const todas = R.SPECIES.filter((sp) => sp && sp.sname).map((sp) => sp.sname).filter((_, i) => i % amostra === 0);
const nucleos = process.argv.includes("--um-nucleo") ? 1 : Math.max(1, Math.min(cpus().length - 2, 10));
if (nucleos === 1) {
  for (const sname of todas) resultado[sname] = notaDaEspecie(R.getSpeciesBySname(sname));
} else {
  // Espécies intercaladas (não em blocos): as pesadas ficam espalhadas entre os workers.
  const partes = Array.from({ length: nucleos }, (_, i) => todas.filter((_, j) => j % nucleos === i));
  const respostas = await Promise.all(partes.map((snames) => new Promise((ok, erro) => {
    const w = new Worker(new URL(import.meta.url), { workerData: { snames }, argv: process.argv.slice(2).filter((a) => a !== "--gravar") });
    w.once("message", ok);
    w.once("error", erro);
    w.once("exit", (c) => { if (c !== 0) erro(new Error("worker saiu com " + c)); });
  })));
  respostas.forEach((p) => Object.assign(resultado, p));
}
const segundos = ((Date.now() - inicio) / 1000).toFixed(1);

// ---------- percentil -> tier (mesmos cortes do rank atual) ----------
function percentis(valores) {
  const ord = valores.slice().sort((a, b) => a - b), n = ord.length, pos = new Map();
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && ord[j + 1] === ord[i]) j++;
    pos.set(ord[i], Math.round((((i + 1) + (j + 1)) / 2 / n) * 10000) / 100);
    i = j + 1;
  }
  return pos;
}
const tierDe = (p) => (p >= 97 ? "SS" : p >= 90 ? "S" : p >= 75 ? "A" : p >= 50 ? "B" : p >= 20 ? "C" : "D");
const snames = Object.keys(resultado);
const pct = percentis(snames.map((s) => resultado[s].nota));
const pctDupla = percentis(snames.map((s) => resultado[s].dupla.nota));
const antigo = JSON.parse(readFileSync(join(RAIZ, "data", "species_rank.json"), "utf8"));

// ---------- relatório ----------
// Gabarito da comunidade (3 vídeos de 2026-09, MegaFidough): "forte" e "fraco"
// ditos por quem joga. Não entra na conta - só mede se o rank concorda.
const FORTES = ["Goodra Hisuian Mega", "Vanilluxe Mega", "Vanilluxe Redux Mega", "Articuno Mega", "Moltres Mega", "Selenumbra", "Beniccino",
  "Storming", "Skeledirge Mega", "Froslass", "Zangoose", "Kyogre Primal", "Groudon Primal", "Rayquaza Mega", "Dragapult Mega",
  "Garchomp", "Tyranitar", "Weavile", "Metagross", "Dragonite", "Salamence"];
const FRACOS = ["Wispywaspy Hivemind", "Iron Spirals", "Malamar Mega", "Sawk Redux", "Beartic", "Cherrim", "Luvdisc", "Magikarp", "Caterpie", "Bulbasaur"];
const linha = (n) => {
  const sp = R.SPECIES.find((s) => s && s.n === n);
  if (!sp) return null;
  const a = antigo[sp.sname], r = resultado[sp.sname], p = pct.get(r.nota);
  return { n, antes: a ? a.tier + " " + a.score : "-", depois: tierDe(p) + " " + Math.round(p), p, pa: a ? a.score : 0, detalhe: r.set + " / " + (r.ab || "-") };
};
console.log(`núcleos: ${nucleos}`);
console.log(`duelos: ${encontros.length} encontros, ${cacheFoe.size} Pokémon de chefão distintos, ${snames.length} espécies, ${segundos} s`);
for (const [rotulo, lista] of [["FORTES segundo a comunidade", FORTES], ["FRACOS segundo a comunidade", FRACOS]]) {
  console.log("\n" + rotulo + "\nespécie                 antes     depois   (melhor set / habilidade)");
  const ls = lista.map(linha).filter(Boolean);
  ls.forEach((l) => console.log(`${l.n.padEnd(23)} ${l.antes.padEnd(9)} ${l.depois.padEnd(8)} (${l.detalhe})`));
  const media = (k) => (ls.reduce((s, l) => s + l[k], 0) / ls.length).toFixed(1);
  console.log(`percentil médio: antes ${media("pa")} | depois ${media("p")}`);
}
const curadas = Object.keys(R.BUILDS).filter((s) => resultado[s]);
const med = (arr) => (arr.reduce((a, v) => a + v, 0) / arr.length).toFixed(1);
console.log(`\ncom build curada do Discord (${curadas.length}): percentil médio antes ${med(curadas.map((s) => (antigo[s] ? antigo[s].score : 0)))} | depois ${med(curadas.map((s) => pct.get(resultado[s].nota)))}`);
console.log("\ntop 25 depois:");
snames.slice().sort((a, b) => resultado[b].nota - resultado[a].nota).slice(0, 25).forEach((s, i) => {
  const sp = R.getSpeciesBySname(s);
  console.log(`${String(i + 1).padStart(2)}. ${sp.n.padEnd(24)} ${(resultado[s].nota * 100).toFixed(1)}% dos duelos  (${resultado[s].set} / ${resultado[s].ab || "-"} / ${resultado[s].item || "-"})`);
});
console.log("\ntop 15 em dupla:");
snames.slice().sort((a, b) => resultado[b].dupla.nota - resultado[a].dupla.nota).slice(0, 15).forEach((s, i) => {
  const sp = R.getSpeciesBySname(s);
  console.log(`${String(i + 1).padStart(2)}. ${sp.n.padEnd(24)} ${(resultado[s].dupla.nota * 100).toFixed(1)}%  (${resultado[s].dupla.set} / ${resultado[s].dupla.ab || "-"})`);
});

// Grava no MESMO data/species_rank.json que o app já lê (roda depois de
// compute_species_rank.ps1 no build.ps1): tier/score, o rank por estágio
// (percentil dentro do mesmo estágio, só pra quem tem linha evolutiva - a
// mesma regra de antes) e o rank no Monotype (percentil dentro de cada tipo)
// passam a vir do duelo. Os percentis antigos (bstPct, bossDefPct...) ficam
// como detalhe.
if (process.argv.includes("--gravar")) {
  const grupoPct = (lista) => {
    const p = percentis(lista.map((s) => resultado[s].nota));
    return (s) => p.get(resultado[s].nota);
  };
  const porEstagio = {};
  snames.forEach((s) => { const a = antigo[s]; if (a && a.stageTier) (porEstagio[a.stage] = porEstagio[a.stage] || []).push(s); });
  const pctEstagio = {};
  Object.values(porEstagio).forEach((lista) => { const f = grupoPct(lista); lista.forEach((s) => { pctEstagio[s] = f(s); }); });
  const porTipo = {};
  snames.forEach((s) => R.speciesTypeNames(R.getSpeciesBySname(s)).forEach((t) => (porTipo[t] = porTipo[t] || []).push(s)));
  const pctTipo = {};
  Object.entries(porTipo).forEach(([t, lista]) => { const f = grupoPct(lista); lista.forEach((s) => { (pctTipo[s] = pctTipo[s] || {})[t] = f(s); }); });
  const novo = {};
  snames.forEach((s) => {
    const a = antigo[s] || {}, p = pct.get(resultado[s].nota);
    const e = Object.assign({}, a, { tier: tierDe(p), score: Math.round(p) });
    if (a.stageTier) { e.stageTier = tierDe(pctEstagio[s]); e.stageScore = Math.round(pctEstagio[s]); }
    e.monoRanks = Object.fromEntries(Object.entries(pctTipo[s] || {}).map(([t, v]) => [t, { score: Math.round(v), tier: tierDe(v) }]));
    e.duelo = { vitorias: Math.round(resultado[s].nota * 1000) / 10, set: resultado[s].set, habilidade: resultado[s].ab, item: resultado[s].item };
    const pd = pctDupla.get(resultado[s].dupla.nota);
    e.dupla = { tier: tierDe(pd), score: Math.round(pd), vitorias: Math.round(resultado[s].dupla.nota * 1000) / 10, set: resultado[s].dupla.set, habilidade: resultado[s].dupla.ab, item: resultado[s].dupla.item };
    novo[s] = e;
  });
  writeFileSync(join(RAIZ, "data", "species_rank.json"), JSON.stringify(novo));
  console.log("gravado: data/species_rank.json (tier, estágio e Monotype pelo duelo)");
}
