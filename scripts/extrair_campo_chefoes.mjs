// Grava em data/bosses.json o campo `campo` (efeito de campo da luta) de cada chefão, lido dos
// scripts de mapa do jogo (er-repo data/maps/**/scripts.pory). TK-20 D9.5b (28/10/2026).
// No jogo o efeito vem do script, antes do trainerbattle: setvar VAR_BATTLE_FIELD_EFFECT_TYPE
// (include/constants/battle.h: 3=ROOM, 4=MONOCHAMP) e VAR_BATTLE_FIELD_ID (STATUS_FIELD_* ou tipo);
// setflag FLAG_SYS_INVERSE_BATTLE liga a batalha invertida. src/battle_util.c TryToSetFieldEffect lê.
// Uso: node scripts/extrair_campo_chefoes.mjs <pasta-er-repo> [--aplicar]   (sem --aplicar só lista)
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

function arquivos(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) arquivos(p, acc); else if (n === "scripts.pory") acc.push(p);
  }
  return acc;
}
const nomeDoChefao = (c) => c.replace(/^TRAINER_/, "").split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");

// Olha para trás a partir de cada trainerbattle*, dentro do mesmo script, parando num `break`
// (fim de um case: o que veio antes não vale para o case seguinte).
export function extrairCampos(texto, arquivo = "scripts.pory") {
  const linhas = texto.split(/\r?\n/), out = [];
  linhas.forEach((l, i) => {
    const m = l.match(/^\s*trainerbattle\w*\s*\(?\s*(TRAINER_\w+)/);
    if (!m || l.trim().startsWith("//")) return;
    let tipo = null, id = null, inversa = null, linhaTipo = null;
    for (let j = i - 1; j >= 0; j--) {
      const s = linhas[j];
      if (/^\s*break\b/.test(s) || /^(script\s|\w+::)/.test(s)) break;
      if (/^\s*\/\//.test(s) || /^\s*@/.test(s)) continue;
      let k;
      if (tipo === null && (k = s.match(/setvar\s*\(?\s*VAR_BATTLE_FIELD_EFFECT_TYPE\s*,\s*(\w+)/))) { tipo = k[1]; linhaTipo = j + 1; }
      else if (id === null && (k = s.match(/setvar\s*\(?\s*VAR_BATTLE_FIELD_ID\s*,\s*(\w+)/))) id = k[1];
      else if (inversa === null && (k = s.match(/(setflag|clearflag)\s*\(?\s*FLAG_SYS_INVERSE_BATTLE/))) inversa = k[1] === "setflag";
    }
    // O type pode ter sido setado antes de um if/switch (Steven): um STATUS_FIELD_* sozinho já é sala (ROOM).
    if (!tipo && id && id.startsWith("STATUS_FIELD_")) tipo = "BATTLE_FIELD_EFFECT_ROOM";
    const temEfeito = tipo && tipo !== "BATTLE_FIELD_EFFECT_NONE" && id && id !== "0";
    if (!temEfeito && !inversa) return;
    out.push({ constante: m[1], nome: nomeDoChefao(m[1]), campo: { efeito: temEfeito ? tipo.replace("BATTLE_FIELD_EFFECT_", "") : null, id: temEfeito ? id : null, inversa: !!inversa }, linha: linhaTipo || i + 1, arquivo });
  });
  return out;
}

if (process.argv[1]?.endsWith("extrair_campo_chefoes.mjs")) {
  const repo = process.argv[2];
  if (!repo) { console.error("uso: node scripts/extrair_campo_chefoes.mjs <pasta-er-repo> [--aplicar]"); process.exit(1); }
  const commit = execFileSync("git", ["-C", repo, "rev-parse", "--short", "HEAD"]).toString().trim();
  const achados = {};
  for (const f of arquivos(join(repo, "data", "maps"))) {
    const rel = f.slice(repo.length + 1).split("\\").join("/");
    for (const r of extrairCampos(readFileSync(f, "utf8"), rel)) achados[r.nome] = { ...r.campo, fonte: `er-repo ${commit} ${r.arquivo}:${r.linha}` };
  }
  const caminho = new URL("../data/bosses.json", import.meta.url);
  const bosses = JSON.parse(readFileSync(caminho, "utf8"));
  const nomes = new Set(bosses.map((b) => b.name));
  for (const n of Object.keys(achados)) if (!nomes.has(n)) console.log("sem chefão no bosses.json:", n);
  for (const b of bosses) { delete b.campo; if (achados[b.name]) b.campo = achados[b.name]; }
  for (const b of bosses) if (b.campo) console.log(b.name, "->", b.campo.efeito, b.campo.id, b.campo.inversa ? "INVERSA" : "");
  if (process.argv.includes("--aplicar")) writeFileSync(caminho, JSON.stringify(bosses));
}
