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
//  6. todas as lutas (todas-as-lutas/02, 21/10/2026): além dos 29 chefões entram os treinadores comuns da run (scripts/estudo/lutas_comuns.mjs),
//     com FATIA FIXA de peso: chefões 60% e comuns 40% (scripts/rank_fatia.mjs); dentro de cada fatia vale o peso por ameaça.
// Fontes de cada decisão: docs/decisoes_mecanicas.md (seção Rank).
//
// Uso: node scripts/calcular_rank_v2.mjs [--especies=A,B] [--amostra=N] [--gravar] [--so-chefoes] [--fatia=0.6] [--saida=arq] [--relatorio=arq] [--gravar-lutas=arq]
//  --gravar grava data/species_rank.json E data/lutas_comuns_run.json (as comuns mais perigosas de cada etapa, para o Meu Time);
//  --gravar-lutas=arq grava só a lista das comuns (aceita --amostra, serve de prova); --so-chefoes é o rank antigo (29 lutas).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cpus, setPriority, constants as osConst } from "node:os";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { carregarRegras } from "../tests/unit/carregar_regras.mjs";
import { melhoresPelaSoma, notaDosEixos, escolherPelaNotaFinal } from "./rank_escolha.mjs";
import { lutasComunsDaRun } from "./estudo/lutas_comuns.mjs";
import { percentis, tierDe, unidadeComItemLiberado, camposHerdados, chavesDoRankNovo } from "./rank_comum.mjs";
import { carimbarDerivado } from "./carimbo_derivado.mjs";
import { notasComFatia, comunsMaisPerigosas, COMUNS_POR_ETAPA } from "./rank_fatia.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const R = carregarRegras({ milestone: 9 });
const CAPS = JSON.parse(readFileSync(join(RAIZ, "data", "levelcaps.json"), "utf8")).rows;

// Lutas da run e a etapa em que acontecem: a lista mora em src/regras/chefoes.js (LUTAS_DA_RUN), a mesma régua do
// "melhor time no geral" da tela do time (16/10/2026).
const LUTAS_DA_RUN = R.LUTAS_DA_RUN;
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
// Todas as lutas (todas-as-lutas/02): os treinadores comuns da run entram com o MESMO método, na fatia fixa de peso.
// --lutas-extra=<arquivo> troca a lista (estudo); --so-chefoes tira as comuns (rank antigo, só as 29 lutas de chefão).
const ARG = (k) => (process.argv.find((x) => x.startsWith(k + "=")) || "").slice(k.length + 1) || null;
const LUTAS_EXTRA = ARG("--lutas-extra");
const SO_CHEFOES = process.argv.includes("--so-chefoes");
const FATIA = ARG("--fatia") ? Number(ARG("--fatia")) : R.FATIA_DOS_CHEFOES;
// A fatia 60/40 é decisão do usuário (16/10/2026): o rank GRAVADO não aceita outra fatia nem outra lista de lutas.
if (process.argv.includes("--gravar") && (FATIA !== R.FATIA_DOS_CHEFOES || LUTAS_EXTRA || SO_CHEFOES)) throw new Error("--gravar exige a fatia " + R.FATIA_DOS_CHEFOES + " e a lista oficial de lutas (sem --fatia diferente, --lutas-extra ou --so-chefoes)");
if (!SO_CHEFOES) {
  const extra = LUTAS_EXTRA ? JSON.parse(readFileSync(LUTAS_EXTRA, "utf8")).lutas : lutasComunsDaRun(RAIZ).lutas;
  for (const d of DIFICULDADES) {
    for (const l of extra) {
      const party = (l[d.chave] && l[d.chave].length ? l[d.chave] : l.party) || [];
      const nivel = capDe(l.etapa, d.caps);
      const foes = party.map((m) => foe(m, nivel)).filter(Boolean);
      if (foes.length) lutas[d.chave].push({ nome: l.nome, etapa: l.etapa, nivel, foes, comum: true });
    }
  }
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
    const lutaRef = cobertas[Math.floor(cobertas.length / 2)], nivelRef = lutaRef.nivel;
    const todosFoes = cobertas.flatMap((l) => l.foes);
    const golpes = R.golpesDeDueloAte(sp, nivelRef);
    const candidatos = [];
    for (const set of R.SETS_DE_DUELO) {
      for (const ab of R.uniqueIds(sp.ab || []).length ? R.uniqueIds(sp.ab) : [null]) {
        const u0 = R.unidadeDeDuelo(sp, set, ab, nivelRef, golpes, null);
        const u = unidadeComItemLiberado(R, u0, lutaRef.etapa, nivelRef, (it) => R.unidadeDeDuelo(sp, set, ab, nivelRef, golpes, null, it));
        let s = 0;
        for (const f of todosFoes) s += R.resultadoDoDuelo(u, f, nivelRef);
        candidatos.push({ s, set, ab, u });
      }
    }
    // Os melhores pela soma rápida são avaliados por inteiro (rank_escolha.mjs).
    const avaliados = melhoresPelaSoma(candidatos).map((melhor) => {
      // Potencial: o 4º espaço pode virar golpe de status (mesma escolha do montador de time).
      // Viabilidade: só os 4 golpes de dano, sem planos de status/setup.
      const dano = R.quatroGolpesDeDano(melhor.u, todosFoes, nivelRef);
      const comStatus = R.comQuatroGolpes({ set: melhor.set.nome, unidade: melhor.u }, sp, todosFoes, nivelRef, null, cobertas.map((l) => l.foes));
      const receita = (comStatus && comStatus.unidade.receita) || { golpes: dano, status: [] };
      const montar = (l, golpes, status) => {
        const u0 = R.unidadeDeDuelo(sp, melhor.set, melhor.ab, l.nivel, golpes, null);
        // Item do set só vale se já existe na Etapa da luta (TK-21 / D5.2).
        const u = unidadeComItemLiberado(R, u0, l.etapa, l.nivel, (it) => R.unidadeDeDuelo(sp, melhor.set, melhor.ab, l.nivel, golpes, null, it));
        u.statusIds = (u.statusIds || []).filter((id) => status.indexOf(id) !== -1);
        return u;
      };
      // TK-32: o hazard escolhido no 4º espaço vale também na viabilidade (o jogador põe hazard na run real); outro status não.
      const hazards = receita.status.filter((id) => R.idHazardDoDuelo({ statusIds: [id] }) !== undefined);
      const eixos = {};
      for (const [eixo, golpes, status, opc] of [
        ["potencial", receita.golpes, receita.status, { detalhe: true }],
        ["viabilidade", hazards.length ? receita.golpes : dano, hazards, { detalhe: true, semPlanos: true }]
      ]) {
        eixos[eixo] = cobertas.map((l) => {
          const u = montar(l, golpes, status);
          return { luta: l.nome, brs: R.resultadosDaLutaComHazard(u, l.foes, l.nivel, opc).map(br) };
        });
      }
      const quatro = receita.golpes, statusEscolhido = receita.status;
      return { nota: notaDosEixos(eixos), r: { set: melhor.set.nome, ab: melhor.u.ab, golpes: quatro.concat(statusEscolhido).map((id) => R.MOVES[id][0]), eixos } };
    });
    out[d.chave] = escolherPelaNotaFinal(avaliados).r;
  }
  return out;
}

if (!isMainThread) {
  const parte = {};
  for (const s of workerData.snames) parte[s] = avaliar(R.getSpeciesBySname(s));
  parentPort.postMessage(parte);
  process.exit(0);
}

// Prioridade abaixo do normal (16/10/2026): o cálculo usa todos os núcleos e travava o PC; assim o resto da máquina vem primeiro.
try { setPriority(osConst.priority.PRIORITY_BELOW_NORMAL); } catch (e) { /* sem permissão: segue na prioridade normal */ }
// --especies=A,B: acrescenta a data/species_rank.json SÓ essas espécies (as demais entradas ficam como estão), pelo mesmo avaliar().
// Sem Etapa o avaliar devolve null e vale a regra do --gravar (foraDoRank: motivo da disponibilidade ou "sem-fonte"). Espécie com
// Etapa precisa do rank completo (a nota é percentil da população inteira): aí aborta em vez de inventar.
if (ARG("--especies")) {
  const arq = join(RAIZ, "data", "species_rank.json"), rank = JSON.parse(readFileSync(arq, "utf8"));
  for (const s of ARG("--especies").split(",")) {
    if (!R.getSpeciesBySname(s)) throw new Error("espécie fora do dex: " + s);
    if (rank[s]) throw new Error("já está no rank: " + s);
    if (avaliar(R.getSpeciesBySname(s))) throw new Error(s + " tem Etapa: rode o rank completo (--gravar)");
    rank[s] = { foraDoRank: (DISP && DISP.motivoFora[s]) || "sem-fonte" };
  }
  writeFileSync(arq, JSON.stringify(rank));
  console.log("acrescentado ao data/species_rank.json: " + ARG("--especies"));
  process.exit(0);
}
const t0 = Date.now();
const amostra = parseInt((process.argv.find((x) => x.startsWith("--amostra=")) || "").split("=")[1], 10) || 1;
const todas = R.SPECIES.filter((sp) => sp && sp.sname).map((sp) => sp.sname).filter((_, i) => i % amostra === 0);
const nucleos = Math.max(1, Math.min(cpus().length - 2, 10));
const partes = Array.from({ length: nucleos }, (_, i) => todas.filter((_, j) => j % nucleos === i));
const res = {};
const respostas = await Promise.all(partes.map((snames) => new Promise((ok, erro) => {
  const w = new Worker(new URL(import.meta.url), { workerData: { snames }, argv: process.argv.slice(2).filter((x) => x !== "--gravar") }) // os núcleos precisam das opções (--lutas-extra);
  w.once("message", ok); w.once("error", erro);
})));
respostas.forEach((p) => Object.assign(res, p));
// --por-luta=<arquivo> (estudo todas-as-lutas/02): a média do Battle Rating de cada espécie em cada luta, nos 2 eixos e nas 2
// dificuldades, para testar divisões de peso sem refazer a simulação (scripts/estudo/fatias_de_peso.mjs).
if (ARG("--por-luta")) {
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const indice = Object.fromEntries(DIFICULDADES.map((d) => [d.chave, Object.fromEntries(lutas[d.chave].map((l, i) => [l.nome, i]))]));
  const porEsp = {};
  for (const s of Object.keys(res)) {
    if (!res[s]) continue;
    porEsp[s] = { etapa: res[s].etapa };
    for (const d of DIFICULDADES) {
      const r = res[s][d.chave];
      if (!r) { porEsp[s][d.chave] = null; continue; }
      porEsp[s][d.chave] = { set: r.set, ab: r.ab, golpes: r.golpes };
      for (const eixo of ["potencial", "viabilidade"]) porEsp[s][d.chave][eixo] = r.eixos[eixo].map((e) => [indice[d.chave][e.luta], r3(e.brs.reduce((a, v) => a + v, 0) / e.brs.length)]);
    }
  }
  writeFileSync(ARG("--por-luta"), JSON.stringify({ lutas: Object.fromEntries(DIFICULDADES.map((d) => [d.chave, lutas[d.chave].map((l) => ({ nome: l.nome, comum: !!l.comum, etapa: l.etapa }))])), res: porEsp }));
}
const validos = Object.keys(res).filter((s) => res[s]);

// Peso por ameaça (PvPoke): a luta que mais derruba as espécies pesa mais; iterado com as
// espécies ponderadas pela própria nota (vencer quem os fortes também perdem vale mais).
// Média só das lutas cobertas (desde que a espécie existe na run). Contar a luta não coberta como 0 misturava "aparece cedo" com
// "é forte" (02/10: fortes da comunidade caíram de 73 para 65); a etapa fica à mostra ao lado da nota.
// A fatia fixa (chefões x comuns) e a iteração moram em rank_fatia.mjs (notasComFatia).
function notas(dif, eixo) {
  const L = lutas[dif];
  const indice = Object.fromEntries(L.map((l, i) => [l.nome, i]));
  const mediaDe = (e) => e.brs.reduce((a, v) => a + v, 0) / e.brs.length;
  const lista = (s) => ((res[s][dif] && res[s][dif].eixos[eixo]) || []).map((e) => [indice[e.luta], mediaDe(e)]);
  const r = notasComFatia(L.map((l) => ({ comum: !!l.comum })), validos, lista, FATIA);
  return { nota: r.nota, pesoLuta: Object.fromEntries(L.map((l, i) => [l.nome, r.pesoLuta[i]])) };
}
const final = {};
const relatorio = {};
for (const d of DIFICULDADES) {
  const pot = notas(d.chave, "potencial"), via = notas(d.chave, "viabilidade");
  const geo = Object.fromEntries(validos.map((s) => [s, Math.sqrt(Math.max(0, pot.nota[s]) * Math.max(0, via.nota[s]))]));
  const pp = percentis(pot.nota), pv = percentis(via.nota), pg = percentis(geo);
  relatorio[d.chave] = { pesoLuta: pot.pesoLuta, geo, pg, pot: pot.nota, via: via.nota };
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
writeFileSync(ARG("--saida") || join(RAIZ, "..", "rank_v2_saida.json"), JSON.stringify(final));
// Lista das comuns mais perigosas de cada etapa, com a ameaça medida (potencial): o Meu Time lê daqui (src/regras/time_pelo_motor.js),
// sem simular as 500+ lutas ao vivo. Formato: lutas[dificuldade] = [{ nome, etapa, db, peso }]; times[nome] = { party, insane? } (insane só
// quando difere do party: o dado é um arquivo só para as duas dificuldades).
function lutasComunsParaOMeuTime(extraPorNome) {
  const out = { fatia: FATIA, porEtapa: COMUNS_POR_ETAPA, amostra: amostra, lutas: {}, times: {} };
  for (const d of DIFICULDADES) {
    const L = lutas[d.chave], peso = L.map((l) => relatorio[d.chave].pesoLuta[l.nome]);
    out.lutas[d.chave] = comunsMaisPerigosas(L, peso).map((s) => {
      const e = extraPorNome[s.nome];
      const t = (out.times[s.nome] = out.times[s.nome] || { party: e.party || [] });
      if (d.chave === "insane" && e.insane && e.insane.length && JSON.stringify(e.insane) !== JSON.stringify(e.party)) t.insane = e.insane;
      return { nome: s.nome, etapa: s.etapa, db: !!e.db, peso: Math.round(s.peso * 1000) / 1000 };
    });
  }
  return out;
}
const extraPorNome = SO_CHEFOES ? {} : Object.fromEntries((LUTAS_EXTRA ? JSON.parse(readFileSync(LUTAS_EXTRA, "utf8")).lutas : lutasComunsDaRun(RAIZ).lutas).map((l) => [l.nome, l]));
if (ARG("--gravar-lutas")) writeFileSync(ARG("--gravar-lutas"), JSON.stringify(lutasComunsParaOMeuTime(extraPorNome)));
if (ARG("--relatorio")) writeFileSync(ARG("--relatorio"), JSON.stringify(Object.fromEntries(DIFICULDADES.map((x) => [x.chave, { pesoLuta: relatorio[x.chave].pesoLuta, comuns: lutas[x.chave].filter((l) => l.comum).map((l) => l.nome) }]))));
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
    // Concorrência no tipo (ponto 6): quantas do mesmo tipo a dominam, pelas notas brutas
    // dos dois eixos (o percentil arredondado empataria demais) e pela etapa.
    const dominado = R.dominantesNoTipo(validos.filter((s) => final[s][d.chave]).map((s) => ({ s,
      familia: R.formFamilyOf(R.getSpeciesBySname(s))[0].sname, tipos: R.speciesTypeNames(R.getSpeciesBySname(s)), pot: relatorio[d.chave].pot[s], via: relatorio[d.chave].via[s], etapa: final[s].etapa })));
    blocos[d.chave] = { mono, estagio, dominado };
  }
  const novo = {};
  for (const s of chavesDoRankNovo(antigo, final, new Set(R.SPECIES.filter((sp) => sp && sp.sname).map((sp) => sp.sname)))) {
    if (!final[s]) { novo[s] = { foraDoRank: (DISP && DISP.motivoFora[s]) || "sem-fonte" }; continue; }
    const e = Object.assign({}, camposHerdados(antigo[s]), { etapa: final[s].etapa, porDificuldade: {} });
    for (const d of DIFICULDADES) {
      const f = final[s][d.chave];
      if (!f) continue;
      e.porDificuldade[d.chave] = { tier: f.tier, score: f.score, potencial: f.potencial, viabilidade: f.viabilidade,
        monoRanks: blocos[d.chave].mono[s] || {}, dominadoPor: blocos[d.chave].dominado[s] || {}, set: f.set, habilidade: f.habilidade, golpes: f.golpes };
    }
    const base = e.porDificuldade.party || e.porDificuldade.insane;
    Object.assign(e, { tier: base.tier, score: base.score, potencial: base.potencial, viabilidade: base.viabilidade, monoRanks: base.monoRanks });
    if (e.stageTier && blocos.party.estagio[s] !== undefined) { e.stageTier = tierDe(blocos.party.estagio[s]); e.stageScore = Math.round(blocos.party.estagio[s]); }
    novo[s] = e;
  }
  writeFileSync(join(RAIZ, "data", "species_rank.json"), JSON.stringify(novo));
  carimbarDerivado("species_rank.json");
  if (!SO_CHEFOES) writeFileSync(join(RAIZ, "data", "lutas_comuns_run.json"), JSON.stringify(lutasComunsParaOMeuTime(extraPorNome)));
  if (!SO_CHEFOES) carimbarDerivado("lutas_comuns_run.json");
  console.log("gravado: data/species_rank.json (rank v2 por dificuldade; fora do rank: " + Object.values(novo).filter((x) => x.foraDoRank).length + ")");
}
