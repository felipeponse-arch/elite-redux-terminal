// Rank v2 (modelo aprovado pelo usuário em 2026-10-02, depois da pesquisa de método):
//  1. rank POR DIFICULDADE: time padrão dos chefões (Easy/Ace, caps "More") e Insane
//     (Elite, caps "Elite") - antes os 3 níveis eram somados numa nota só;
//  2. Battle Rating com MARGEM (quanto de HP sobra / quanto tirou) em vez de vitória 0/1,
//     e PESO POR AMEAÇA de cada luta, medido pelo próprio simulador e iterado (PvPoke);
//  3. só as lutas da RUN (1º encontro de cada ginásio, chefões Aqua/Magma do caminho,
//     Elite Four e Campeão), no level cap da etapa de cada uma, e só as que acontecem
//     depois de o Pokémon estar disponível (rank_disponibilidade.json);
//  4. 4 golpes fixos por espécie (comQuatroGolpes do simulador), não o movepool inteiro;
//  5. dois eixos: POTENCIAL (com golpes de status/setup) e VIABILIDADE (sem eles);
//     nota final = média geométrica dos dois.
// Revanches, Frontier, Cynthia/Leaf e o campeão monotype ficam de fora (pós-jogo/opcional).
// Fontes de cada decisão: docs/decisoes_mecanicas.md (seção Rank).
//
// Uso: node scripts/calcular_rank_v2.mjs [--amostra=N] [--gravar]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cpus } from "node:os";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { carregarRegras } from "../tests/unit/carregar_regras.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const R = carregarRegras({ milestone: 9 });
const CAPS = JSON.parse(readFileSync(join(RAIZ, "data", "levelcaps.json"), "utf8")).rows;

// Lutas da run e a etapa (índice de levelcaps.json) em que acontecem. Ginásios: ordem do
// Emerald confirmada no dado (chefoes.js). Equipes: ordem da história do Emerald, pelos
// nomes dos locais no dado. "Courtney Sunhollow" (região nova) fica de fora: sem etapa.
const LUTAS_DA_RUN = [
  ["Roxanne 1", 0], ["Brawly 1", 1], ["Archie Slateport", 2], ["Wattson 1", 2],
  ["Courtney Meteor Falls", 3], ["Tabitha Mt Chimney", 3], ["Maxie Mt Chimney", 3], ["Flannery 1", 3],
  ["Norman 1", 4], ["Shelly Weather Institute", 5], ["Winona 1", 5],
  ["Matt Mt Pyre", 6], ["Archie Mt Pyre", 6], ["Tabitha Magma Hideout", 6], ["Courtney Magma Hideout", 6], ["Maxie Magma Hideout", 6],
  ["Tabitha Mossdeep", 6], ["Courtney Mossdeep", 6], ["Maxie Mossdeep", 6], ["Tate And Liza 1", 6],
  ["Matt", 7], ["Shelly Seafloor Cavern", 7], ["Archie", 7], ["Juan 1", 7],
  ["Sidney", 8], ["Phoebe", 8], ["Glacia", 8], ["Drake", 8], ["Steven", 8]
];
const DIFICULDADES = [{ chave: "party", caps: "more" }, { chave: "insane", caps: "elite" }];
const capDe = (etapa, modo) => CAPS[etapa][modo] || CAPS[etapa].more || 100;

const porNome = Object.fromEntries(R.BOSSES.map((b) => [b.name, b]));
const cacheFoe = new Map();
function foe(m, nivel) {
  const k = nivel + "|" + JSON.stringify([m.x, m.abi, m.abiId, m.item, m.nat, m.evsRaw, m.mv, m.hpt]);
  if (!cacheFoe.has(k)) cacheFoe.set(k, R.foeDeDuelo(m, nivel, null));
  return cacheFoe.get(k);
}
// lutas[dif] = [{ nome, etapa, nivel, foes }]
const lutas = {};
for (const d of DIFICULDADES) {
  lutas[d.chave] = LUTAS_DA_RUN.map(([nome, etapa]) => {
    const b = porNome[nome];
    if (!b) return null;
    const party = (b[d.chave] && b[d.chave].length ? b[d.chave] : b.party) || [];
    const nivel = capDe(etapa, d.caps);
    return { nome, etapa, nivel, foes: party.map((m) => foe(m, nivel)).filter(Boolean) };
  }).filter((l) => l && l.foes.length);
}
const dispPath = join(RAIZ, "data", "rank_disponibilidade.json");
const DISP = existsSync(dispPath) ? JSON.parse(readFileSync(dispPath, "utf8")) : null;
const etapaDe = (sname) => (DISP ? DISP.etapa[sname] : 0);

// Battle Rating: vitória vale 0,5 + metade do HP que sobra; derrota, metade do que tirou.
function br(r) {
  if (r.venceu === true) return 0.5 + 0.5 * Math.max(0, r.fracEu);
  if (r.venceu === false) return 0.5 * Math.max(0, 1 - r.fracFoe);
  return 0.5;
}
// Por espécie e dificuldade: melhor set/habilidade (movepool inteiro), depois 4 golpes fixos
// contra todas as lutas cobertas, e o BR de cada Pokémon de chefão nos dois eixos.
function avaliar(sp) {
  const etapa = etapaDe(sp.sname);
  if (etapa === undefined || etapa === null) return null; // inobtível: fora do rank
  const out = { etapa };
  for (const d of DIFICULDADES) {
    const cobertas = lutas[d.chave].filter((l) => l.etapa >= etapa);
    if (!cobertas.length) { out[d.chave] = null; continue; }
    const nivelRef = cobertas[Math.floor(cobertas.length / 2)].nivel;
    const todosFoes = cobertas.flatMap((l) => l.foes);
    const golpes = R.golpesDeDueloAte(sp, nivelRef);
    let melhor = null;
    for (const set of R.SETS_DE_DUELO) {
      for (const ab of R.uniqueIds(sp.ab || []).length ? R.uniqueIds(sp.ab) : [null]) {
        const u = R.unidadeDeDuelo(sp, set, ab, nivelRef, golpes, null);
        let s = 0;
        for (const f of todosFoes) s += R.resultadoDoDuelo(u, f, nivelRef);
        if (!melhor || s > melhor.s) melhor = { s, set, ab, u };
      }
    }
    // Potencial: o 4º espaço pode virar golpe de status (mesma escolha do montador de time).
    // Viabilidade: só os 4 golpes de dano, sem planos de status/setup.
    const dano = R.quatroGolpesDeDano(melhor.u, todosFoes, nivelRef);
    const comStatus = R.comQuatroGolpes({ set: melhor.set.nome, unidade: melhor.u }, sp, todosFoes, nivelRef, null);
    const receita = (comStatus && comStatus.unidade.receita) || { golpes: dano, status: [] };
    const montar = (l, golpes, status) => {
      const u = R.unidadeDeDuelo(sp, melhor.set, melhor.ab, l.nivel, golpes, null);
      u.statusIds = (u.statusIds || []).filter((id) => status.indexOf(id) !== -1);
      return u;
    };
    const eixos = {};
    for (const [eixo, golpes, status, opc] of [
      ["potencial", receita.golpes, receita.status, { detalhe: true }],
      ["viabilidade", dano, [], { detalhe: true, semPlanos: true }]
    ]) {
      eixos[eixo] = cobertas.map((l) => {
        const u = montar(l, golpes, status);
        return { luta: l.nome, brs: l.foes.map((f) => br(R.resultadoDoDuelo(u, f, l.nivel, opc))) };
      });
    }
    const quatro = receita.golpes, statusEscolhido = receita.status;
    out[d.chave] = { set: melhor.set.nome, ab: melhor.u.ab, golpes: quatro.concat(statusEscolhido).map((id) => R.MOVES[id][0]), eixos };
  }
  return out;
}

if (!isMainThread) {
  const parte = {};
  for (const s of workerData.snames) parte[s] = avaliar(R.getSpeciesBySname(s));
  parentPort.postMessage(parte);
  process.exit(0);
}

const t0 = Date.now();
const amostra = parseInt((process.argv.find((x) => x.startsWith("--amostra=")) || "").split("=")[1], 10) || 1;
const todas = R.SPECIES.filter((sp) => sp && sp.sname).map((sp) => sp.sname).filter((_, i) => i % amostra === 0);
const nucleos = Math.max(1, Math.min(cpus().length - 2, 10));
const partes = Array.from({ length: nucleos }, (_, i) => todas.filter((_, j) => j % nucleos === i));
const res = {};
const respostas = await Promise.all(partes.map((snames) => new Promise((ok, erro) => {
  const w = new Worker(new URL(import.meta.url), { workerData: { snames } });
  w.once("message", ok); w.once("error", erro);
})));
respostas.forEach((p) => Object.assign(res, p));
const validos = Object.keys(res).filter((s) => res[s]);

// Peso por ameaça (PvPoke): a luta que mais derruba as espécies pesa mais; iterado com as
// espécies ponderadas pela própria nota (vencer quem os fortes também perdem vale mais).
function notas(dif, eixo) {
  const nomes = lutas[dif].map((l) => l.nome);
  let pesoEsp = Object.fromEntries(validos.map((s) => [s, 1]));
  let pesoLuta = {};
  let nota = {};
  for (let it = 0; it < 4; it++) {
    for (const n of nomes) {
      let soma = 0, peso = 0;
      for (const s of validos) {
        const e = res[s][dif] && res[s][dif].eixos[eixo].find((x) => x.luta === n);
        if (!e) continue;
        const m = e.brs.reduce((a, v) => a + v, 0) / e.brs.length;
        soma += pesoEsp[s] * (1 - m); peso += pesoEsp[s];
      }
      pesoLuta[n] = peso ? soma / peso : 0;
    }
    for (const s of validos) {
      const lista = (res[s][dif] && res[s][dif].eixos[eixo]) || [];
      // Média só das lutas cobertas (desde que a espécie existe na run). Contar a luta não
      // coberta como 0 misturava "aparece cedo" com "é forte" (02/10: fortes da comunidade
      // caíram de 73 para 65); a etapa fica à mostra ao lado da nota.
      const pesoCoberto = lista.reduce((a, e) => a + pesoLuta[e.luta], 0);
      nota[s] = pesoCoberto ? lista.reduce((a, e) => a + pesoLuta[e.luta] * e.brs.reduce((x, v) => x + v, 0) / e.brs.length, 0) / pesoCoberto : 0;
    }
    const media = validos.reduce((a, s) => a + nota[s], 0) / validos.length;
    pesoEsp = Object.fromEntries(validos.map((s) => [s, 0.5 + nota[s] / (2 * media)]));
  }
  return { nota, pesoLuta };
}
function percentis(obj) {
  const ks = Object.keys(obj).sort((a, b) => obj[a] - obj[b]), n = ks.length, p = {};
  ks.forEach((k, i) => { p[k] = Math.round(((i + 1) / n) * 10000) / 100; });
  return p;
}
const tierDe = (p) => (p >= 97 ? "SS" : p >= 90 ? "S" : p >= 75 ? "A" : p >= 50 ? "B" : p >= 20 ? "C" : "D");
const final = {};
const relatorio = {};
for (const d of DIFICULDADES) {
  const pot = notas(d.chave, "potencial"), via = notas(d.chave, "viabilidade");
  const geo = Object.fromEntries(validos.map((s) => [s, Math.sqrt(Math.max(0, pot.nota[s]) * Math.max(0, via.nota[s]))]));
  const pp = percentis(pot.nota), pv = percentis(via.nota), pg = percentis(geo);
  relatorio[d.chave] = { pesoLuta: pot.pesoLuta, geo, pg };
  for (const s of validos) {
    final[s] = final[s] || { etapa: res[s].etapa };
    const r = res[s][d.chave];
    final[s][d.chave] = r ? { tier: tierDe(pg[s]), score: Math.round(pg[s]), potencial: { tier: tierDe(pp[s]), score: Math.round(pp[s]) },
      viabilidade: { tier: tierDe(pv[s]), score: Math.round(pv[s]) }, set: r.set, habilidade: r.ab, golpes: r.golpes } : null;
  }
}
console.log(`espécies avaliadas: ${validos.length} (fora do rank: ${todas.length - validos.length}) em ${((Date.now() - t0) / 1000).toFixed(0)} s`);
for (const d of DIFICULDADES) {
  console.log(`\n== ${d.chave}: peso das lutas (ameaça) ==`);
  console.log(Object.entries(relatorio[d.chave].pesoLuta).map(([n, w]) => n + " " + w.toFixed(2)).join(" | "));
  console.log(`top 30 (${d.chave}):`);
  validos.slice().sort((a, b) => relatorio[d.chave].geo[b] - relatorio[d.chave].geo[a]).slice(0, 30).forEach((s, i) => {
    const f = final[s][d.chave];
    console.log(`${String(i + 1).padStart(2)}. ${R.getSpeciesBySname(s).n.padEnd(24)} ${f.tier} pot ${f.potencial.tier} via ${f.viabilidade.tier} (etapa ${final[s].etapa}, ${f.set}/${f.habilidade})`);
  });
}
writeFileSync(join(RAIZ, "..", "rank_v2_saida.json"), JSON.stringify(final));
// --gravar (só com o rank completo, sem --amostra): data/species_rank.json no formato que o app
// lê. tier/score/monoRanks do topo = Fácil/Ace (party); src/regras/rank_da_run.js troca pela
// dificuldade da run. Fora do rank vira { foraDoRank: motivo }. Validação aprovada em 02/10
// (scripts/validar_rank_v2.mjs: fortes 76 vs 73, fracos 28 vs 33, builds curadas 67 vs 65).
if (process.argv.includes("--gravar")) {
  if (amostra !== 1) throw new Error("--gravar exige o rank completo (sem --amostra)");
  const antigo = JSON.parse(readFileSync(join(RAIZ, "data", "species_rank.json"), "utf8"));
  const pctDentro = (grupo, nota) => {
    const p = percentis(Object.fromEntries(grupo.map((s) => [s, nota[s]])));
    return (s) => p[s];
  };
  const blocos = {};
  for (const d of DIFICULDADES) {
    const geo = relatorio[d.chave].geo;
    const porTipo = {};
    validos.forEach((s) => R.speciesTypeNames(R.getSpeciesBySname(s)).forEach((t) => (porTipo[t] = porTipo[t] || []).push(s)));
    const mono = {};
    Object.entries(porTipo).forEach(([t, lista]) => { const f = pctDentro(lista, geo); lista.forEach((s) => { (mono[s] = mono[s] || {})[t] = { score: Math.round(f(s)), tier: tierDe(f(s)) }; }); });
    const porEstagio = {};
    validos.forEach((s) => { const a = antigo[s]; if (a && a.stageTier) (porEstagio[a.stage] = porEstagio[a.stage] || []).push(s); });
    const estagio = {};
    Object.values(porEstagio).forEach((lista) => { const f = pctDentro(lista, geo); lista.forEach((s) => { estagio[s] = f(s); }); });
    blocos[d.chave] = { mono, estagio };
  }
  const novo = {};
  for (const s of Object.keys(antigo)) {
    if (!final[s]) { novo[s] = { foraDoRank: (DISP && DISP.motivoFora[s]) || "sem-fonte" }; continue; }
    const e = Object.assign({}, antigo[s], { etapa: final[s].etapa, porDificuldade: {} });
    for (const d of DIFICULDADES) {
      const f = final[s][d.chave];
      if (!f) continue;
      e.porDificuldade[d.chave] = { tier: f.tier, score: f.score, potencial: f.potencial, viabilidade: f.viabilidade,
        monoRanks: blocos[d.chave].mono[s] || {}, set: f.set, habilidade: f.habilidade, golpes: f.golpes };
    }
    const base = e.porDificuldade.party || e.porDificuldade.insane;
    Object.assign(e, { tier: base.tier, score: base.score, potencial: base.potencial, viabilidade: base.viabilidade, monoRanks: base.monoRanks });
    if (e.stageTier && blocos.party.estagio[s] !== undefined) { e.stageTier = tierDe(blocos.party.estagio[s]); e.stageScore = Math.round(blocos.party.estagio[s]); }
    novo[s] = e;
  }
  writeFileSync(join(RAIZ, "data", "species_rank.json"), JSON.stringify(novo));
  console.log("gravado: data/species_rank.json (rank v2 por dificuldade; fora do rank: " + Object.values(novo).filter((x) => x.foraDoRank).length + ")");
}
