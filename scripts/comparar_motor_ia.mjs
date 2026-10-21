// Comparação Motor x IA (ticket time-pelo-motor/01, Fase E).
// A IA do app roda por `claude.use` dentro do artifact e não roda no Node. Então o lado IA é REPRODUZIDO:
//   --preparar : monta 12 casos, grava o prompt EXATO que o botão de IA do Meu Time mandaria
//                (montarPromptTimeArquetipo, o mesmo de generateTeamForArchetype) e roda o Motor;
//   (fora do script) um agente separado responde cada prompt e grava <caso>.ia.txt;
//   --comparar : lê as respostas, passa pela MESMA validação do app (snamesValidosDoTime), julga IA e Motor com o MESMO juiz
//                (as 29 lutas da run) e escreve docs/tickets/time-pelo-motor/comparacao.md.
// Nada de claude.use aqui.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { carregarRegras } from "../tests/unit/carregar_regras.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
export const PASTA = join(RAIZ, "docs", "tickets", "time-pelo-motor", "comparacao_ia");
export const RELATORIO = join(RAIZ, "docs", "tickets", "time-pelo-motor", "comparacao.md");

// ---- os 12 casos (elenco = time + caixa; os 6 primeiros vão para o time) ----
const GERAL = ["Centiskorch", "Scizor", "Garchomp", "Metagross", "Grimmsnarl", "Togekiss", "Klefki", "Gardevoir", "Ledian", "Gyarados",
  "Tyranitar", "Excadrill", "Pelipper", "Ferrothorn", "Blissey", "Hydreigon", "Salamence", "Lucario", "Arcanine", "Gengar", "Politoed"];
const fatia = (ini, n) => Array.from({ length: n }, (_, i) => GERAL[(ini + i) % GERAL.length]);
const FOGO = ["Charizard", "Arcanine", "Ninetales", "Typhlosion", "Blaziken", "Houndoom", "Heatran", "Infernape", "Volcarona", "Flareon", "Centiskorch", "Rapidash",
  "Scizor", "Garchomp", "Gyarados"];
const ACO = ["Scizor", "Metagross", "Skarmory", "Excadrill", "Lucario", "Aggron", "Ferrothorn", "Klefki", "Magnezone", "Bronzong", "Registeel", "Garchomp", "Togekiss"];
export const CASOS = [
  { id: "c01", etapa: 0, pace: "Balance", elenco: fatia(0, 8) },
  { id: "c02", etapa: 1, pace: "Hyper Offense", elenco: fatia(3, 9) },
  { id: "c03", etapa: 2, pace: "Bulky Offense", elenco: fatia(5, 10) },
  { id: "c04", etapa: 2, pace: "Stall", elenco: fatia(8, 10) },
  { id: "c05", etapa: 3, pace: "Hyper Offense", weather: "Rain", elenco: fatia(10, 12) },
  { id: "c06", etapa: 3, pace: "Balance", elenco: fatia(1, 12), favoritos: ["Scizor"] },
  { id: "c07", etapa: 4, pace: "Bulky Offense", elenco: fatia(6, 12) },
  { id: "c08", etapa: 5, pace: "Stall", tatica: "Telas", elenco: fatia(2, 13) },
  { id: "c09", etapa: 6, pace: "Balance", elenco: fatia(7, 14) },
  { id: "c10", etapa: 7, pace: "Hyper Offense", elenco: fatia(12, 14) },
  { id: "c11", etapa: 2, monotype: "Fire", elenco: FOGO },
  { id: "c12", etapa: 5, pace: "Bulky Offense", monotype: "Steel", elenco: ACO }
];
// Estilo pedido -> variante do Motor que persegue o mesmo objetivo (clima/tática = sinergia; o resto = ofensivo ou seguro).
export const ESTILO_VARIANTE = { "Hyper Offense": "ofensivo", "Bulky Offense": "seguro", Balance: "seguro", Stall: "seguro" };
export const varianteCasada = (caso) => (caso.weather || caso.tatica ? "sinergia" : ESTILO_VARIANTE[caso.pace] || "seguro");

// Monta a run do caso (o state do app) e devolve as regras carregadas.
export function montarRun(caso) {
  const R = carregarRegras({ milestone: caso.etapa, difficulty: caso.dificuldade || "ace", levelCapMode: caso.levelCapMode || "more", megaMode: "temporaria" });
  const sp = (n) => { const s = R.SPECIES.find((x) => x && x.n === n); if (!s) throw new Error("espécie inexistente: " + n); return s; };
  R.state.team = caso.elenco.slice(0, 6).map((n) => sp(n).x);
  R.state.box = caso.elenco.slice(6).map((n) => sp(n).x);
  Object.assign(R.state.archetype, { pace: caso.pace || null, weather: caso.weather || null, tatica: caso.tatica || null, monotype: caso.monotype || null });
  const ctx = R.contextoDoMotor();
  ctx.cache = R.criarCacheDoMotor();
  return { R, ctx };
}
// O prompt EXATO de generateTeamForArchetype (src/ui/arquetipo.js): rosterParaTimeIA + montarPromptTimeArquetipo, sem tocar no texto.
export function gerarPrompt(R, caso) {
  const r = R.rosterParaTimeIA(caso.monotype || null);
  return { prompt: R.montarPromptTimeArquetipo(r.roster, caso.pace || null, caso.weather || null, caso.monotype || null), validSnames: r.validSnames, roster: r.roster.map((s) => s.sname) };
}

// ---- a resposta da IA: o app recebe o objeto já parseado (cliente.json) e valida com snamesValidosDoTime ----
// Tolera cerca de código e texto ao redor (o agente é um chat, não a API de JSON); o resto é a validação do app.
export function lerRespostaIA(R, texto, validSnames) {
  let bruto = null;
  const t = String(texto || "").replace(/```(?:json)?/gi, "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { bruto = JSON.parse(t.slice(a, b + 1)); } catch { bruto = null; } }
  if (!bruto) return { ok: false, motivo: "a resposta não é um objeto JSON" };
  const snames = Array.from(R.snamesValidosDoTime(bruto, validSnames));
  const pedidos = Array.isArray(bruto.team) ? bruto.team.length : 0;
  if (!snames.length) return { ok: false, motivo: "A resposta não trouxe nenhuma espécie real da sua caixa/time" }; // mesma mensagem do validar do app
  return { ok: true, snames, descartados: pedidos - snames.length, reasoning: typeof bruto.reasoning === "string" ? bruto.reasoning.slice(0, 600) : "" };
}

// ---- o juiz comum: a luta completa nas 29 lutas da run, mesma etapa e mesmos buffs (motorSimular = mesma montagem do avaliarTimePelaLutaCompleta) ----
export function timeDeMembros(R, cands, membros) {
  return membros.map((m) => {
    const ch = m.build ? m.sname + "|" + R.motorChaveDaBuild(m.build) : null;
    const c = cands.find((x) => x.sname === m.sname && (!ch || x.chaveBuild === ch)) || cands.find((x) => x.sname === m.sname);
    if (c && (!m.build || c.chaveBuild === ch)) return c;
    if (!m.build) return null; // IA escolheu espécie sem build avaliável
    const sp = R.SPECIES.find((s) => s && s.sname === m.sname);
    return Object.assign({}, c || { x: m.x, linha: m.x, travado: false, suporte: false, origem: "motor" }, { sp, sname: m.sname, nome: sp.n, build: m.build, chaveBuild: ch });
  }).filter(Boolean);
}
const media = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
export const desvio = (v) => { const m = media(v); return v.length ? Math.sqrt(media(v.map((x) => (x - m) ** 2))) : 0; };
export function metricasDoTime(R, ctx, time) {
  const rs = R.motorAvaliar(ctx, time, ctx.lutas.todas);
  const porLuta = ctx.lutas.todas.map((l, i) => ({ luta: l.nome, etapa: l.etapa, p: rs[i].p, v: !!rs[i].v }));
  const rest = porLuta.filter((l) => l.etapa >= ctx.etapa);
  return { membros: time.map((c) => c.nome), porLuta,
    completo: { lutas: porLuta.length, vence: porLuta.filter((l) => l.v).length, pontosMedios: media(porLuta.map((l) => l.p)), desvio: desvio(porLuta.map((l) => l.p)) },
    restantes: { lutas: rest.length, vence: rest.filter((l) => l.v).length, pontosMedios: media(rest.map((l) => l.p)), desvio: desvio(rest.map((l) => l.p)) },
    perdidas: porLuta.filter((l) => !l.v).map((l) => l.luta) };
}

// ---- --preparar ----
function preparar() {
  mkdirSync(PASTA, { recursive: true });
  const resumo = [];
  CASOS.forEach((caso) => {
    const { R, ctx } = montarRun(caso);
    const { prompt, validSnames, roster } = gerarPrompt(R, caso);
    const favSname = (caso.favoritos || []).map((n) => R.SPECIES.find((x) => x && x.n === n).sname);
    const contexto = { id: caso.id, etapa: caso.etapa, cap: ctx.cap, nivelDoCap: R.motorNivelDaEtapa(caso.etapa), dificuldade: R.state.settings.difficulty, levelCapMode: R.state.settings.levelCapMode,
      megaMode: "temporaria", megaLiberada: R.megaEvolutionUnlocked(), estilo: { pace: caso.pace || null, weather: caso.weather || null, tatica: caso.tatica || null, monotype: caso.monotype || null },
      favoritos: favSname, favoritoNaIA: false, elenco: { time: caso.elenco.slice(0, 6), caixa: caso.elenco.slice(6) }, rosterDoPrompt: roster, validSnames,
      lutas: ctx.lutas.todas.map((l) => ({ luta: l.nome, etapa: l.etapa, nivel: l.nivel, dupla: l.dupla, buffs: l.buffs })) };
    writeFileSync(join(PASTA, caso.id + ".prompt.txt"), prompt, "utf8");
    writeFileSync(join(PASTA, caso.id + ".json"), JSON.stringify(contexto, null, 1), "utf8");
    const t0 = Date.now();
    const res = R.montarTimePeloMotor(ctx, { favoritos: favSname });
    const tempoMs = Date.now() - t0;
    writeFileSync(join(PASTA, caso.id + ".motor.json"), JSON.stringify({ tempoMs, variantes: res.variantes, avisos: res.avisos, candidatos: res.candidatos }, null, 1), "utf8");
    resumo.push({ id: caso.id, chars: prompt.length, tempoMs, roster: roster.length });
    console.log(caso.id, "etapa", caso.etapa, "prompt", prompt.length, "chars; elenco", roster.length, "; Motor", tempoMs, "ms");
  });
  console.log("prompt médio:", Math.round(media(resumo.map((r) => r.chars))), "chars; pasta:", PASTA);
}

// ---- --comparar ----
const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
function comparar() {
  const casosOk = [];
  CASOS.forEach((caso) => {
    const ctxJson = JSON.parse(readFileSync(join(PASTA, caso.id + ".json"), "utf8"));
    const motorSalvo = JSON.parse(readFileSync(join(PASTA, caso.id + ".motor.json"), "utf8"));
    const arqIA = join(PASTA, caso.id + ".ia.txt");
    const { R, ctx } = montarRun(caso);
    const { validSnames } = gerarPrompt(R, caso);
    const favs = ctxJson.favoritos;
    // reprodutibilidade: o Motor roda de novo do zero (cache novo) e tem que dar os mesmos Pokémon e builds
    const t0 = Date.now();
    const res2 = R.montarTimePeloMotor(ctx, { favoritos: favs });
    const tempo2 = Date.now() - t0;
    const chave = (v) => v.membros.map((m) => m.sname + "|" + R.motorChaveDaBuild(m.build)).join(",");
    const igual = res2.variantes.every((v, i) => chave(v) === chave(motorSalvo.variantes[i]));
    const cands = R.motorCandidatos(ctx, favs, []);
    const motor = {};
    res2.variantes.forEach((v) => { motor[v.chave] = Object.assign(metricasDoTime(R, ctx, timeDeMembros(R, cands, v.membros)), { tempoMs: v.tempoMs, planoB: v.planoB, estilo: v.estilo }); });
    let ia = null;
    if (existsSync(arqIA)) {
      const lida = lerRespostaIA(R, readFileSync(arqIA, "utf8"), validSnames);
      if (!lida.ok) ia = { falha: lida.motivo };
      else {
        const time = timeDeMembros(R, cands, lida.snames.map((s) => ({ sname: s })));
        ia = Object.assign(metricasDoTime(R, ctx, time), { snames: lida.snames, descartados: lida.descartados, semBuild: lida.snames.length - time.length, reasoning: lida.reasoning });
      }
    }
    const casada = varianteCasada(caso);
    const melhor = Object.keys(motor).sort((a, b) => motor[b].restantes.pontosMedios - motor[a].restantes.pontosMedios)[0];
    casosOk.push({ caso, ctxJson, motor, ia, casada, melhor, igual, tempoMotor: motorSalvo.tempoMs, tempo2 });
    console.log(caso.id, ia ? (ia.falha ? "IA INVÁLIDA" : "IA ok") : "sem .ia.txt", "reprodutível:", igual);
  });
  const comIA = casosOk.filter((c) => c.ia && !c.ia.falha), falhas = casosOk.filter((c) => c.ia && c.ia.falha), pend = casosOk.filter((c) => !c.ia);
  const L = [];
  L.push("# Comparação Motor x IA (time-pelo-motor/01, Fase E)", "",
    "Gerado por `node scripts/comparar_motor_ia.mjs --comparar`. A IA foi reproduzida: o mesmo prompt do botão de IA do Meu Time, respondido por um agente separado, validado pela mesma `snamesValidosDoTime` do app. Motor e IA são julgados pelo mesmo juiz (luta completa nas 29 lutas da run, mesma Etapa, level cap e buffs).", "",
    "## Amostra", "", `${CASOS.length} casos; ${comIA.length} com resposta válida da IA, ${falhas.length} respostas inválidas (falha registrada), ${pend.length} sem resposta ainda.`, "",
    "| Caso | Etapa | Estilo | Clima/Tática | Mono | Favorito | Elenco |", "|---|---|---|---|---|---|---|");
  casosOk.forEach(({ caso, ctxJson }) => L.push(`| ${caso.id} | ${caso.etapa} | ${caso.pace || "-"} | ${[caso.weather, caso.tatica].filter(Boolean).join(" + ") || "-"} | ${caso.monotype || "-"} | ${ctxJson.favoritos.join(",") || "-"} | ${caso.elenco.length} |`));
  L.push("", "Favorito: só o Motor recebe (o prompt da IA do app não tem favoritos). Ferramentas: a IA do app consulta `buildStandardAiTools`; o agente reproduzido responde só pelo prompt.", "",
    "## Resultado por caso (vitórias nas 29 lutas, pontos médios por luta; entre parênteses, só as lutas que ainda faltam na Etapa)", "",
    "| Caso | IA | Motor (variante do estilo) | Motor (melhor variante) |", "|---|---|---|---|");
  const cel = (m) => (m ? `${m.completo.vence}/29, ${f1(m.completo.pontosMedios)} pts (${m.restantes.vence}/${m.restantes.lutas}, ${f1(m.restantes.pontosMedios)})` : "-");
  casosOk.forEach((c) => L.push(`| ${c.caso.id} | ${c.ia ? (c.ia.falha ? "INVÁLIDA: " + c.ia.falha : cel(c.ia)) : "sem resposta"} | ${c.casada}: ${cel(c.motor[c.casada])} | ${c.melhor}: ${cel(c.motor[c.melhor])} |`));
  L.push("", "## Agregado (média ± desvio entre os casos com resposta válida da IA)", "");
  if (comIA.length) {
    const lado = { IA: (c) => c.ia, "Motor (estilo)": (c) => c.motor[c.casada], "Motor (melhor)": (c) => c.motor[c.melhor] };
    const medidas = { "vitórias nas 29": (m) => m.completo.vence, "pontos médios por luta (29)": (m) => m.completo.pontosMedios,
      "dispersão dos pontos entre as lutas (29)": (m) => m.completo.desvio, "cobertura nas lutas que faltam (%)": (m) => 100 * m.restantes.vence / Math.max(1, m.restantes.lutas) };
    L.push("| Medida | " + Object.keys(lado).join(" | ") + " |", "|---|---|---|---|");
    Object.entries(medidas).forEach(([nome, g]) => L.push(`| ${nome} | ${Object.values(lado).map((p) => { const v = comIA.map((c) => g(p(c))); return `${f1(media(v))} ± ${f1(desvio(v))}`; }).join(" | ")} |`));
    const zero = media(casosOk.filter((c) => c.ia).map((c) => (c.ia.falha ? 0 : c.ia.completo.vence)));
    const dif = comIA.map((c) => c.motor[c.casada].completo.pontosMedios - c.ia.completo.pontosMedios);
    L.push("", `Contando resposta inválida como zero vitória: IA ${f1(zero)} vitórias médias nas 29 (só os ${casosOk.filter((c) => c.ia).length} casos com resposta).`, "",
      `Diferença Motor(estilo) - IA em pontos médios: média ${f1(media(dif))}, desvio ${f1(desvio(dif))} entre casos (o ruído da comparação). Motor melhor em ${dif.filter((d) => d > 0).length}, igual em ${dif.filter((d) => d === 0).length}, pior em ${dif.filter((d) => d < 0).length}.`, "",
      "## Cobertura de ameaças (lutas perdidas e em quantos casos)", "");
    const cont = (g) => { const o = {}; comIA.forEach((c) => g(c).perdidas.forEach((l) => { o[l] = (o[l] || 0) + 1; })); return Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([l, n]) => `${l} (${n})`).join(", ") || "nenhuma"; };
    L.push(`- IA: ${cont(lado.IA)}`, `- Motor (estilo): ${cont(lado["Motor (estilo)"])}`, "");
  } else L.push("Nenhuma resposta válida da IA ainda: só o lado Motor foi medido.", "");
  L.push("## Plano B", "", "A IA do app não oferece plano B. O Motor oferece (troca medida na luta mais difícil):", "");
  casosOk.forEach((c) => { const pb = c.motor[c.casada].planoB; L.push(`- ${c.caso.id}: ${pb && pb.trocas && pb.trocas.length ? pb.trocas.map((t) => `${t.sai} -> ${t.entra} (+${t.deltaPontos} pts em ${pb.luta})`).join("; ") : (pb && pb.motivo) || "sem troca"}`); });
  L.push("", "## Reprodutibilidade (Motor rodado 2x, cache novo)", "", `${casosOk.filter((c) => c.igual).length}/${casosOk.length} casos deram os mesmos Pokémon e builds nas três variantes.`, "",
    "## Tempo", "", "| Caso | Motor, 1ª rodada (ms) | Motor, 2ª rodada (ms) |", "|---|---|---|");
  casosOk.forEach((c) => L.push(`| ${c.caso.id} | ${c.tempoMotor} | ${c.tempo2} |`));
  L.push("", "Tempo da IA: não medido pelo script (vem do agente, fora do Node).", "", "## Falhas conhecidas", "",
    ...falhas.map((c) => `- ${c.caso.id}: resposta da IA inválida (${c.ia.falha}).`),
    ...comIA.filter((c) => c.ia.semBuild || c.ia.descartados).map((c) => `- ${c.caso.id}: IA com ${c.ia.descartados} espécie(s) descartadas pela validação e ${c.ia.semBuild} sem build avaliável.`));
  writeFileSync(RELATORIO, L.join("\n") + "\n", "utf8");
  console.log("escrito", RELATORIO);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--preparar")) preparar();
  else if (process.argv.includes("--comparar")) comparar();
  else console.log("uso: node scripts/comparar_motor_ia.mjs --preparar | --comparar");
}
