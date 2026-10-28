// Gera data/rank_disponibilidade.json: em que etapa (índice de levelcaps.json) cada
// espécie fica obtível na run. null = não obtível antes do fim do jogo -> fora do rank.
//
// Fontes, na ordem (docs/decisoes_mecanicas.md, "Rank v2 - disponibilidade"):
//  1. data/mono_disponibilidade.json (planilha "Mono earliest locations", índice oficial);
//  2. código oficial do jogo (er-repo): src/data/wild_encounters.json, mapa -> etapa
//     tirada dos próprios locais da planilha; hidden_mons (DexNav) = etapa 9 como na planilha;
//  3. presentes do jogo (GetMysteryGiftSpecies em src/field_specials.c): FLAG_BADGEn_GET = etapa n,
//     FLAG_SYS_GAME_CLEAR = pós-jogo (null);
//  4. evolução propaga a etapa (nível pelo cap "more"); Mega/Primal pela pedra (etapaDaMega).
//
// Regras com fonte citada: data/disponibilidade_regras.json.
// Uso: node scripts/gerar_rank_disponibilidade.mjs <caminho do er-repo> [--estrito]
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { carregarRegras } from "../tests/unit/carregar_regras.mjs";

import { criarEtapaDoMapa } from "./etapa_do_mapa.mjs";
const repo = process.argv[2];
if (!repo || !existsSync(repo)) { console.error("uso: node scripts/gerar_rank_disponibilidade.mjs <er-repo>"); process.exit(2); }
const R = carregarRegras();
const mono = JSON.parse(readFileSync("data/mono_disponibilidade.json", "utf8"));
const caps = JSON.parse(readFileSync("data/levelcaps.json", "utf8")).rows;
const POS_JOGO = caps.length - 1; // última etapa: depois da Liga, nenhuma luta da run cobre

const etapa = {};
const origem = {};
// todas as evidências diretas de cada espécie (auditoria; conflito = fontes que discordam)
const evidencias = {};
const naPlanilha = new Set(Object.values(mono.porTipo).flatMap((l) => l.map((e) => e.s)));
const marcar = (sname, e, de) => {
  if (e === null || e === undefined) return false;
  if (!/^evolui/.test(de)) (evidencias[sname] = evidencias[sname] || []).push({ e, de });
  // Espécie que a planilha cita: vale a etapa dela. O código trata o mapa inteiro e não vê
  // barreira de área (deserto da Route 111 pede Go-Goggles, leste da 118 pede Surf, fóssil
  // por script); a planilha é por espécie. O código só preenche quem a planilha não tem.
  if (naPlanilha.has(sname) && !/^(planilha|evolui)/.test(de)) return false;
  if (etapa[sname] === undefined || e < etapa[sname]) { etapa[sname] = e; origem[sname] = de; return true; }
  return false;
};

// 1. planilha + tabela local -> etapa (sem as entradas DexNav, que são sempre a última etapa)
for (const lista of Object.values(mono.porTipo)) {
  for (const e of lista) marcar(e.s, e.e, "planilha: " + e.l);
}

// Regras com fonte citada (equipamento, vara por vaga, mapas pela história): data/disponibilidade_regras.json
const REGRAS = JSON.parse(readFileSync("data/disponibilidade_regras.json", "utf8"));
const EQUIP = Object.fromEntries(Object.entries(REGRAS.equipamento).map(([k, v]) => [k, v.etapa]));
const varaDaVaga = (vaga) => ["oldRod", "goodRod", "superRod"].find((v) => REGRAS.varaDaVaga[v].includes(vaga)) || "superRod";

// Resolvedor único de mapa -> etapa (planilha, prefixo, história): scripts/etapa_do_mapa.mjs.
const etapaDoMapa = criarEtapaDoMapa(mono, REGRAS, POS_JOGO);
// equipamento que o tipo de encontro exige (Surf na água, Rock Smash na pedra, vara na pesca)
function exigencia(campo, vaga) {
  if (campo === "water_mons") return { e: EQUIP.surf, como: " (Surf)" };
  if (campo === "rock_smash_mons") return { e: EQUIP.rockSmash, como: " (Rock Smash)" };
  if (campo === "fishing_mons") { const v = varaDaVaga(vaga); return { e: EQUIP[v], como: " (" + v + ")" }; }
  return { e: 0, como: "" };
}

// 2. encontros do código oficial
const enc = JSON.parse(readFileSync(join(repo, "src/data/wild_encounters.json"), "utf8")).wild_encounter_groups[0].encounters;
const mapasSemEtapa = new Set();
for (const m of enc) {
  const em = etapaDoMapa(m.map);
  for (const campo of ["land_mons", "water_mons", "rock_smash_mons", "fishing_mons", "honey_mons", "hidden_mons"]) {
    ((m[campo] && m[campo].mons) || []).forEach((mon, vaga) => {
      const sp = R.getSpeciesBySname(mon.species);
      if (!sp) return;
      if (campo === "hidden_mons") { marcar(sp.sname, POS_JOGO, "DexNav " + m.map); return; }
      if (em === undefined) { mapasSemEtapa.add(m.map); return; }
      const req = exigencia(campo, vaga);
      marcar(sp.sname, Math.max(em, req.e), "encontro " + m.map + req.como);
    });
  }
}

// 2b. batalhas fixas e presentes dos scripts de mapa (lendários, ovos, presentes de NPC)
const scriptsSemEtapa = new Set();
for (const pasta of readdirSync(join(repo, "data/maps"))) {
  let txt;
  try { txt = readFileSync(join(repo, "data/maps", pasta, "scripts.pory"), "utf8"); } catch { continue; }
  for (const [, sname] of txt.matchAll(/(?:setwildbattle\w*|givemon|giveegg)\s*\(?\s*(SPECIES_\w+)/g)) {
    const em = etapaDoMapa(pasta);
    if (em === undefined) { scriptsSemEtapa.add(pasta + ":" + sname); continue; }
    marcar(sname, em, "script " + pasta);
  }
}

// 3. presentes
const fs = readFileSync(join(repo, "src/field_specials.c"), "utf8");
const bloco = fs.slice(fs.indexOf("mysteryGiftData[][4]"), fs.indexOf("numMysteryGifts"));
const posJogo = [];
// A flag do presente é exata por espécie: ela MANDA sobre o "Mystery Gift" da planilha (feita
// pra 2.5; ex.: Terapagos na etapa 8 pela planilha, FLAG_SYS_GAME_CLEAR no código).
const soPresenteNaPlanilha = (sp) => (evidencias[sp] || []).filter((x) => /^planilha/.test(x.de)).every((x) => /Mystery Gift/i.test(x.de));
for (const [, sp, flag] of bloco.matchAll(/\{(SPECIES_\w+),.*?(FLAG_\w+)\}/g)) {
  const b = /FLAG_BADGE0(\d)_GET/.exec(flag);
  const e = b ? Number(b[1]) : POS_JOGO;
  (evidencias[sp] = evidencias[sp] || []).push({ e, de: "presente " + flag });
  if (!b) posJogo.push(sp);
  if (etapa[sp] === undefined || soPresenteNaPlanilha(sp)) { etapa[sp] = e; origem[sp] = "presente " + flag; }
}

// 4. evolução e Mega
const etapaDoNivel = (lv) => { for (let i = 0; i < caps.length; i++) if ((caps[i].more ?? 999) >= lv) return i; return POS_JOGO; };
const kinds = R.DATA.evoKinds;
let mudou = true;
while (mudou) {
  mudou = false;
  for (const sp of R.SPECIES) {
    if (!sp || etapa[sp.sname] === undefined) continue;
    for (const ev of sp.ev || []) {
      const alvo = R.getSpeciesByX(ev[2]); if (!alvo) continue;
      const k = kinds[ev[0]] || "";
      let e = etapa[sp.sname];
      if (/MEGA|PRIMAL/.test(k)) e = Math.max(e, R.etapaDaMega(alvo));
      else if (/LEVEL/.test(k)) { const lv = Number(ev[1]); if (!isNaN(lv)) e = Math.max(e, etapaDoNivel(lv)); }
      if (marcar(alvo.sname, e, "evolui de " + sp.n)) mudou = true;
    }
  }
}

// Por que ficou fora: "dexnav" (só no DexNav, liberado no fim), "pos-jogo" (presente/local
// depois da Liga) ou "sem-fonte" (nenhuma evidência: forma só de batalha, de teste ou não achada).
const saida = {}, motivoFora = {};
let dentro = 0;
const posJogoSet = new Set(posJogo);
for (const sp of R.SPECIES) {
  if (!sp) continue;
  const e = etapa[sp.sname];
  saida[sp.sname] = e === undefined || e >= POS_JOGO ? null : e;
  if (saida[sp.sname] !== null) { dentro++; continue; }
  const ev = evidencias[sp.sname] || [];
  motivoFora[sp.sname] = posJogoSet.has(sp.sname) ? "pos-jogo" : ev.length && ev.every((x) => /DexNav/i.test(x.de)) ? "dexnav"
    : e !== undefined ? "pos-jogo" : "sem-fonte";
}
// Conflito: a etapa MAIS CEDO pela planilha e a mais cedo pelo código do jogo diferem em 2+
// (aparecer em vários mapas é normal). A menor vence; o conflito fica registrado para revisão.
const conflitos = [];
for (const [s, ev] of Object.entries(evidencias)) {
  const daPlanilha = ev.filter((x) => /^planilha/.test(x.de) && x.e < POS_JOGO).map((x) => x.e);
  const doCodigo = ev.filter((x) => !/^planilha/.test(x.de) && x.e < POS_JOGO).map((x) => x.e);
  if (!daPlanilha.length || !doCodigo.length) continue;
  const p = Math.min(...daPlanilha), c = Math.min(...doCodigo);
  if (Math.abs(p - c) >= 2) conflitos.push({ especie: s, planilha: p, codigo: c, evidencias: ev });
}
const versaoDasFontes = {
  erRepo: (() => { try { return execSync("git rev-parse HEAD", { cwd: repo }).toString().trim(); } catch { return "desconhecida"; } })(),
  planilha: mono.importadoEm || null,
  wildEncounters: createHash("sha256").update(readFileSync(join(repo, "src/data/wild_encounters.json"))).digest("hex").slice(0, 16)
};
writeFileSync("data/rank_disponibilidade.json", JSON.stringify({
  fonte: "planilha Mono earliest locations + er-repo (wild_encounters.json, field_specials.c, scripts de mapa); ver scripts/gerar_rank_disponibilidade.mjs",
  nota: "etapa = índice de levelcaps.json; null = fora do rank, motivo em motivoFora",
  versaoDasFontes,
  etapa: saida,
  motivoFora
}) + "\n");
// auditoria dentro do repositório, em tmp/ (ignorada pelo git; grande, só para depurar)
mkdirSync("tmp", { recursive: true });
writeFileSync(join("tmp", "rank_disponibilidade_auditoria.json"), JSON.stringify({ versaoDasFontes, origem, evidencias, conflitos }, null, 1));
const contagem = {};
for (const m of Object.values(motivoFora)) contagem[m] = (contagem[m] || 0) + 1;
console.log("fora por motivo:", JSON.stringify(contagem), "| conflitos entre fontes:", conflitos.length);
if (process.argv.includes("--estrito") && (mapasSemEtapa.size || scriptsSemEtapa.size)) { console.error("--estrito: há mapa sem etapa"); process.exitCode = 1; }
console.log("obtíveis na run:", dentro, "| fora:", Object.keys(saida).length - dentro);
console.log("mapas do código sem etapa na planilha:", [...mapasSemEtapa].join(", ") || "nenhum");
console.log("scripts de mapa sem etapa:", [...scriptsSemEtapa].join(", ") || "nenhum");
console.log("presentes de pós-jogo:", posJogo.join(", "));
