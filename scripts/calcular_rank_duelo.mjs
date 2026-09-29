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
//    Sem item (compara a espécie, não o item).
//  - Golpes: nível + tutor, sem os de carga/recarga ou que desmaiam o usuário.
//    Precisão entra como fator; "2 a 5 vezes" conta 3.
//  - Dano pela fórmula padrão com rolagem média (0,925), sem crítico.
//    Multi-Headed ("tantos acertos quantas cabeças") conta 1,5 - o dado não
//    diz quantas cabeças cada espécie tem.
//  - Duelo: quantos golpes cada lado precisa pra nocautear; quem é mais rápido
//    (ou usa prioridade) bate primeiro. Vitória = 1; derrota = metade da
//    fração de HP que tirou antes de cair.
//
// Uso: node scripts/calcular_rank_duelo.mjs [--gravar]
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarRegras } from "../tests/unit/carregar_regras.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const R = carregarRegras({ milestone: 9 });
const NIVEL_DO_DUELO = 50;
const ROLAGEM_MEDIA = 0.925;
const TIERS_DOS_CHEFOES = ["party", "insane", "hell"];
const MOVES = R.MOVES, MOVE_PT = R.MOVE_PT, TYPES = R.TYPES;
const nomeHab = (id) => (R.ABILITIES[id] ? R.ABILITIES[id][0] : "");
const textoHab = (id) => R.descricaoDeHabilidade(nomeHab(id)); // já junta as partes de "A + B"

// ---------- golpes ----------
const SPLIT = (m) => R.DATA.splits[m[2]];
function acertosDoGolpe(id) {
  const d = MOVE_PT[id] || "";
  if (/2 a 5 vezes|de 2 a 5/i.test(d) && !/turnos/i.test(d)) return 3;
  if (/10 vezes/i.test(d)) return 6;
  if (/tr[eê]s vezes|3 vezes/i.test(d)) return 3;
  if (/duas vezes|2 vezes/i.test(d)) return 2;
  return 1;
}
function golpeUtil(id) {
  const m = MOVES[id];
  if (!m || !(m[3] > 0) || SPLIT(m) === "STATUS") return false;
  return !/no primeiro turno|turno seguinte|desmaia|descansa no turno/i.test(MOVE_PT[id] || "");
}
function categoriaDoGolpe(m, atk, spa) {
  const s = SPLIT(m);
  if (s === "PHYSICAL" || s === "HITS_DEF") return "F";
  if (s === "SPECIAL" || s === "HITS_SPDEF") return "E";
  return atk >= spa ? "F" : "E";
}
const temContato = (m) => (m[8] || []).some((i) => R.DATA.flags[i] === "Makes Contact");

// ---------- habilidades (texto do jogo) ----------
const CLIMA_DO_TEXTO = { rain: "chuva", sun: "sol", sand: "areia", sandstorm: "areia", hail: "granizo", fog: "nevoa" };
const cacheEfeito = new Map();
function efeitoDasHabilidades(ids, sname) {
  const chave = sname + "|" + ids.join(",");
  if (cacheEfeito.has(chave)) return cacheEfeito.get(chave);
  const ef = { ate: null, ateMult: 1, stabMult: 1.5, stabExtra: [], atkMult: 1, spaMult: 1, speMult: 1,
    reducao: { F: 1, E: 1, todos: 1, superEf: 1, contato: 1 }, intimida: false, prioridadeNoPrimeiro: false,
    bonusTipo: {}, bonusGolpes: {}, golpeExtra: 1, seguimento: null };
  // Clima que o próprio Pokémon arma (innate ou a escolhida) - só esse conta.
  const nomes = ids.map(nomeHab);
  const climaProprio = {};
  ["chuva", "sol", "areia", "granizo", "nevoa"].forEach((c) => { if (nomes.some((n) => R.habilidadeArma(n, c))) climaProprio[c] = true; });
  const climaOk = (palavra) => climaProprio[CLIMA_DO_TEXTO[palavra.toLowerCase()]];
  ids.forEach((id) => {
    const n = nomeHab(id), t = textoHab(id);
    let x;
    if ((x = t.match(/Normal(?:-type)? moves become (\w+)/i)) && TYPES.indexOf(x[1]) !== -1) { ef.ate = x[1]; ef.ateMult = 1.1; }
    if (/Increases STAB from 1\.5x to 2x/i.test(t)) ef.stabMult = 2;
    if ((x = t.match(/gains? (\w+)-type STAB|Adds (\w+)-type/i))) ef.stabExtra.push(x[1] || x[2]);
    if (/Doubles own Attack/i.test(t)) ef.atkMult *= 2;
    if (/Doubles own Sp\.?\s?Atk/i.test(t)) ef.spaMult *= 2;
    if (/Lowers foes'? Atk by one stage on entry|^Intimidate/i.test(t)) ef.intimida = true;
    if (/\+1 priority for the first turn/i.test(t)) ef.prioridadeNoPrimeiro = true;
    // Bônus a tipo, sem condição ("Boosts the power of Dragon-type moves by 1.5x", "Ups own Flying moves by 1.25x").
    for (const m of t.matchAll(/Boosts (?:the power of )?(\w+)-type moves by ([\d.]+)x|Ups own (\w+) moves by ([\d.]+)x/gi)) {
      const tipo = m[1] || m[3], mult = parseFloat(m[2] || m[4]);
      if (TYPES.indexOf(tipo) !== -1) ef.bonusTipo[tipo] = Math.max(ef.bonusTipo[tipo] || 1, mult);
    }
    // Status/Velocidade com clima que ELE MESMO arma.
    if ((x = t.match(/Ups highest attacking stat by ([\d.]+)x in (rain|sun|sand|hail|fog)/i)) && climaOk(x[2])) {
      ef.atkMult *= parseFloat(x[1]); ef.spaMult *= parseFloat(x[1]);
    }
    if ((x = t.match(/Speed gets a ([\d.]+)x boost (?:if|in) (?:a )?(rain|sun|sandstorm|hail|fog)/i)) && climaOk(x[2])) ef.speMult *= parseFloat(x[1]);
    // Golpe extra.
    if ((x = t.match(/hit twice\. (?:1st hit at 100% power, )?2nd hit (?:at|does) (\d+)%/i)) || (x = t.match(/Second hit does (\d+)% damage/i))) {
      ef.golpeExtra = Math.max(ef.golpeExtra, 1 + parseInt(x[1], 10) / 100);
    }
    if (/Hits as many times, as it has heads/i.test(t)) ef.golpeExtra = Math.max(ef.golpeExtra, 1.5);
    if ((x = t.match(/After using a (\w+) move, follow up with a (\d+)\s?BP/i))) ef.seguimento = { tipo: x[1], poder: parseInt(x[2], 10) };
    // Redução de dano sem condição.
    if (!/\bif\b|\bwhen\b|\bwhile\b|\bin (rain|sun|sand|hail|fog)\b/i.test(t)) {
      if (/Halves damage taken by Physical/i.test(t)) ef.reducao.F *= 0.5;
      if (/Halves damage taken by Special/i.test(t)) ef.reducao.E *= 0.5;
      if ((x = t.match(/Takes (\d+)% less damage from Super-?effective/i))) ef.reducao.superEf *= 1 - parseInt(x[1], 10) / 100;
      if (/1\/2 dmg from contact/i.test(t)) ef.reducao.contato *= 0.5;
      if ((x = t.match(/Weakens incoming physical and special moves by (\d+)%/i))) ef.reducao.todos *= 1 - parseInt(x[1], 10) / 100;
      if (/deal min damage/i.test(t)) ef.reducao.todos *= 0.85 / ROLAGEM_MEDIA; // rolagem mínima em vez da média
    }
    // Multiscale/Shadow Shield: só com HP cheio (o 1º golpe) - meia redução.
    if (/At full HP, halves damage/i.test(t)) ef.reducao.todos *= 0.75;
    void n;
  });
  // Bônus a categorias de golpe já confirmados no movepool real (ABILITY_SYNERGY), com o multiplicador do texto.
  (R.ABILITY_SYNERGY[sname] || []).forEach((h) => {
    const id = ids.find((i) => nomeHab(i) === h.name);
    if (id === undefined) return;
    const t = textoHab(id);
    const x = t.match(/(\d+(?:\.\d+)?)x/) || t.match(/(\d+)%/);
    const mult = x ? (x[0].endsWith("%") ? 1 + parseInt(x[1], 10) / 100 : parseFloat(x[1])) : 1.3;
    (h.golpes || []).forEach((g) => { ef.bonusGolpes[g] = Math.max(ef.bonusGolpes[g] || 1, Math.min(mult, 2)); });
  });
  cacheEfeito.set(chave, ef);
  return ef;
}

// ---------- status ----------
const SETS = [
  { nome: "fisico", evs: [4, 252, 0, 0, 0, 252], nature: "Adamant" },
  { nome: "especial", evs: [4, 0, 0, 252, 0, 252], nature: "Modest" },
  { nome: "tanque", evs: [252, 0, 128, 0, 128, 0], nature: "Hardy" }
];
const statsDoSet = (sp, set) => [0, 1, 2, 3, 4, 5].map((i) => R.calcFinalStat(sp.b[i], 31, set.evs[i], NIVEL_DO_DUELO, i, set.nature, null, sp.n));

// ---------- dano ----------
// Golpe já "preparado" pro atacante: tipo final, categoria, poder efetivo.
function prepararGolpes(ids, unidade) {
  const lista = [];
  for (const id of ids) {
    const m = MOVES[id];
    let tipo = TYPES[m[1]], mult = 1;
    if (tipo === "Normal" && unidade.ef.ate) { tipo = unidade.ef.ate; mult *= unidade.ef.ateMult; }
    const cat = categoriaDoGolpe(m, unidade.stats[1], unidade.stats[3]);
    if (unidade.tipos.indexOf(tipo) !== -1 || unidade.ef.stabExtra.indexOf(tipo) !== -1) mult *= unidade.ef.stabMult;
    mult *= unidade.ef.bonusTipo[tipo] || 1;
    mult *= unidade.ef.bonusGolpes[m[0]] || 1;
    mult *= unidade.ef.golpeExtra;
    let poder = m[3];
    if (unidade.ef.seguimento && unidade.ef.seguimento.tipo === tipo) poder += unidade.ef.seguimento.poder;
    const precisao = m[4] > 0 && m[4] <= 100 ? m[4] / 100 : 1;
    lista.push({ tipo, cat, contato: temContato(m), prio: m[7] || 0, forca: poder * mult * precisao * acertosDoGolpe(id) * (unidade.itemMult || 1) });
  }
  // Poda: por (tipo, categoria, contato) fica só o mais forte - e o melhor de prioridade.
  const melhores = new Map();
  let prio = null;
  for (const g of lista) {
    const k = g.tipo + g.cat + g.contato;
    if (!melhores.has(k) || melhores.get(k).forca < g.forca) melhores.set(k, g);
    if (g.prio > 0 && (!prio || prio.forca < g.forca)) prio = g;
  }
  const out = [...melhores.values()];
  if (prio && out.indexOf(prio) === -1) out.push(prio);
  return out;
}
function danoContra(atq, def, intimidado) {
  let melhor = { dano: 0, prio: 0 }, melhorPrio = { dano: 0 };
  for (const g of atq.golpesProntos) {
    const efTipo = R.abilityTypeModFor(g.tipo, def.tipos, def.ids).mult;
    if (efTipo === 0) continue;
    const A = g.cat === "F" ? atq.stats[1] * atq.ef.atkMult * (intimidado ? 2 / 3 : 1) : atq.stats[3] * atq.ef.spaMult;
    const D = g.cat === "F" ? def.stats[2] : def.stats[4];
    let red = def.ef.reducao.todos * (g.cat === "F" ? def.ef.reducao.F : def.ef.reducao.E);
    if (efTipo >= 2) red *= def.ef.reducao.superEf;
    if (g.contato) red *= def.ef.reducao.contato;
    const dano = ((((2 * NIVEL_DO_DUELO) / 5 + 2) * g.forca * A / D) / 50 + 2) * efTipo * red * ROLAGEM_MEDIA;
    if (dano > melhor.dano) melhor = { dano, prio: g.prio };
    if (g.prio > 0 && dano > melhorPrio.dano) melhorPrio = { dano };
  }
  return { melhor, melhorPrio };
}
const golpesNec = (hp, d) => (d > 0 ? Math.ceil(hp / d) : Infinity);

// Um duelo, do ponto de vista de "eu" (0..1).
function duelo(eu, foe) {
  const meu = danoContra(eu, foe, foe.ef.intimida);
  const dele = danoContra(foe, eu, eu.ef.intimida);
  const euPreciso = golpesNec(foe.stats[0], meu.melhor.dano);
  const elePrecisa = golpesNec(eu.stats[0], dele.melhor.dano);
  if (euPreciso === Infinity && elePrecisa === Infinity) return 0.5;
  const comPrio = golpesNec(foe.stats[0], meu.melhorPrio.dano);
  const prioDele = dele.melhor.prio > 0;
  let nec = euPreciso, euPrimeiro;
  if (comPrio <= elePrecisa && !prioDele) { nec = Math.min(euPreciso, comPrio); euPrimeiro = true; }
  else if (eu.ef.prioridadeNoPrimeiro && euPreciso === 1 && !prioDele) euPrimeiro = true;
  else if (prioDele && !(meu.melhor.prio > 0)) euPrimeiro = false;
  else {
    const v1 = eu.stats[5] * eu.ef.speMult, v2 = foe.stats[5] * foe.ef.speMult;
    euPrimeiro = v1 > v2 ? true : v1 < v2 ? false : null;
  }
  if (nec < elePrecisa) return 1;
  if (nec === elePrecisa && euPrimeiro) return 1;
  if (nec === elePrecisa && euPrimeiro === null) return 0.5;
  const turnos = euPrimeiro ? elePrecisa : elePrecisa - 1;
  return 0.5 * Math.min(1, (turnos * meu.melhor.dano) / foe.stats[0]);
}

// ---------- campo: Pokémon reais dos chefões ----------
const ITEM_DANO = { "Life Orb": 1.3, "Choice Band": 1.5, "Choice Specs": 1.5, "Expert Belt": 1.1 };
const cacheFoe = new Map();
function montarFoe(m) {
  const chave = JSON.stringify([m.x, m.abi, m.item, m.nat, m.evsRaw, m.ivsRaw, m.mv]);
  if (cacheFoe.has(chave)) return cacheFoe.get(chave);
  const megaSname = R.MEGA_FORMS[m.item];
  const sp = (megaSname && R.getSpeciesBySname(megaSname)) || R.getSpeciesByX(m.x);
  let foe = null;
  if (sp) {
    const abiId = R.ABILITY_ID_BY_NAME[m.abi];
    const ids = R.uniqueIds((sp.inn || []).concat(abiId !== undefined && !megaSname ? [abiId] : []));
    const ev = m.evsRaw || [0, 0, 0, 0, 0, 0], iv = m.ivsRaw || [31, 31, 31, 31, 31, 31];
    foe = { sp, nome: m.n, tipos: R.speciesTypeNames(sp), ids, itemMult: ITEM_DANO[m.item] || 1,
      stats: [0, 1, 2, 3, 4, 5].map((i) => R.calcFinalStat(sp.b[i], iv[i], ev[i], NIVEL_DO_DUELO, i, m.nat, m.item, sp.n)) };
    foe.ef = efeitoDasHabilidades(ids, sp.sname);
    foe.golpesProntos = prepararGolpes((m.mv || []).map((n) => R.MOVE_ID_BY_NAME[n]).filter((id) => id !== undefined && golpeUtil(id)), foe);
  }
  cacheFoe.set(chave, foe);
  return foe;
}
const encontros = [];
for (const b of R.BOSSES) {
  for (const tier of TIERS_DOS_CHEFOES) {
    const party = b[tier];
    if (!party || !party.length) continue;
    const foes = party.map(montarFoe).filter(Boolean);
    if (foes.length) encontros.push({ nome: b.name + " (" + tier + ")", foes });
  }
}

// ---------- cada espécie ----------
function notaDaEspecie(sp) {
  const golpeIds = R.uniqueIds(sp.lm.map((p) => p[1]).concat(sp.tu)).filter(golpeUtil);
  const tipos = R.speciesTypeNames(sp);
  const inn = R.uniqueIds(sp.inn || []);
  const escolhas = R.uniqueIds(sp.ab || []);
  let melhor = null;
  for (const set of SETS) {
    const stats = statsDoSet(sp, set);
    for (const ab of escolhas.length ? escolhas : [null]) {
      const ids = ab === null ? inn : R.uniqueIds(inn.concat([ab]));
      const u = { sp, tipos, stats, ids, ef: efeitoDasHabilidades(ids, sp.sname) };
      u.golpesProntos = prepararGolpes(golpeIds, u);
      let soma = 0;
      for (const e of encontros) {
        let s = 0;
        for (const f of e.foes) s += duelo(u, f);
        soma += s / e.foes.length;
      }
      const nota = soma / encontros.length;
      if (!melhor || nota > melhor.nota) melhor = { nota, set: set.nome, ab: ab === null ? "" : nomeHab(ab) };
    }
  }
  return melhor;
}

const inicio = Date.now();
const resultado = {};
for (const sp of R.SPECIES) if (sp && sp.sname) resultado[sp.sname] = notaDaEspecie(sp);
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
  console.log(`${String(i + 1).padStart(2)}. ${sp.n.padEnd(24)} ${(resultado[s].nota * 100).toFixed(1)}% dos duelos  (${resultado[s].set} / ${resultado[s].ab || "-"})`);
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
    e.duelo = { vitorias: Math.round(resultado[s].nota * 1000) / 10, set: resultado[s].set, habilidade: resultado[s].ab };
    novo[s] = e;
  });
  writeFileSync(join(RAIZ, "data", "species_rank.json"), JSON.stringify(novo));
  console.log("gravado: data/species_rank.json (tier, estágio e Monotype pelo duelo)");
}
