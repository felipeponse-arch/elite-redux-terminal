// Porte para Node de scripts/compute_ability_movepool_synergy.ps1 (15/10/2026). Gera data/species_ability_synergy.json: cruza cada habilidade que
// aumenta o poder de golpes de uma CATEGORIA (flag) ou de um TIPO com o movepool REAL (nível + tutor) de cada espécie.
// Diferença deliberada do .ps1: lê a descrição em INGLÊS do dado do jogo (dex_compact.json), nunca a tradução PT. Os ids da tradução ficam
// desalinhados quando a versão do jogo desloca ids (Mighty Horn 391 -> 390 na 2.65.4) e a tradução não é fonte. Habilidade composta ("A + B")
// é expandida nas partes, como o expansor de compostas faz com o texto PT.
// Limite documentado: golpes "de soco", "de mordida/presa" e "cortantes" não têm flag no jogo (as 18 categorias de flagsT não incluem as três),
// então Iron Fist, Strong Jaw, Keen Edge e as combos delas ficam FORA da verificação por movepool; viram aviso, nunca sinergia confirmada.
// Uso: node scripts/gerar_sinergia_habilidade_movepool.mjs [dex_compact.json] [species_ability_synergy.json]
import { readFileSync, writeFileSync } from "node:fs";

// Frase real (inglês do jogo) -> categoria(s) de flagsT. Cada entrada conferida contra as descrições de data/dex_compact.json.
const FRASES_DE_FLAG = [
  [/horn and drill/i, ["Horn Based", "Drill Based"]],
  [/wing, wind or air/i, ["Air/Wing Based"]],
  [/hammer and slamming/i, ["Hammer Based"]],
  [/punching and kicking/i, ["Kick Based"]],
  [/punch and hammer/i, ["Hammer Based"]],
  [/field moves/i, ["Field Based"]],
  [/contact moves/i, ["Makes Contact"]],
  [/kicking moves/i, ["Kick Based"]],
  [/arrow moves/i, ["Arrow Based"]],
  [/sound moves/i, ["Sound Based"]],
  [/Beam\/Pump\/Cannon/i, ["Bullet Move"]],
  [/throwing moves/i, ["Throw Based"]],
];
const FRASES_SEM_FLAG = [/punch(ing)? moves|punch and/i, /bite\/fang|biting moves/i, /slashing moves/i];
// Frase que afirma aumento de poder de golpes: o verbo de aumento vem ANTES do golpe/tipo/categoria, na mesma frase (equivale ao filtro
// "Aumenta ... golpes|do tipo" do .ps1 sobre o texto PT). "Raises" fica de fora de propósito: é estágio de atributo, não poder do golpe.
const AUMENTA = /\b(boosts?|ups|powers? up|increases?|amplif\w*|empower\w*|strengthens?)\b[^.\n]*(?:\b(?:moves?|based)\b|-types?\b)/i;

// Texto inglês da habilidade; composta pura ("A + B") vira uma linha por parte (mesma lógica do expansor de compostas).
export function textosDasHabilidades(dex) {
  const porNome = new Map();
  dex.abilities.forEach((a, i) => { if (a[0] && !porNome.has(a[0])) porNome.set(a[0], i); });
  const partes = (id) => {
    const desc = dex.abilities[id][1];
    if (!desc || !/\+/.test(desc)) return null;
    const ps = desc.trim().replace(/\.+$/, "").trim().split(/\s*\+\s*/);
    if (ps.length < 2) return null;
    const ids = [];
    for (const p of ps) { if (!porNome.has(p.trim())) return null; ids.push(porNome.get(p.trim())); }
    return ids;
  };
  const achatar = (id, vistos) => {
    const ps = partes(id);
    if (!ps) return [id];
    const out = [];
    for (const p of ps) {
      if (vistos.includes(p)) continue;
      for (const f of achatar(p, vistos.concat([p]))) if (!out.includes(f)) out.push(f);
    }
    return out;
  };
  return dex.abilities.map((a, i) => {
    if (!partes(i)) return a[1] || "";
    return achatar(i, [i]).map((x) => "- " + dex.abilities[x][0] + ": " + (dex.abilities[x][1] || "")).join("\n");
  });
}

// Abreviações que o dado do jogo usa em texto ("Fight.-type") e o "etc." que corta a frase no meio.
function normalizar(t) { return String(t || "").replace(/\bFight\./g, "Fighting").replace(/\bElec\./g, "Electric").replace(/,?\s*etc\./gi, ""); }

// Tipos citados como alvo de golpe: "Grass-type", "Water and Ice moves", "rock, steel, and fighting moves". Um nome de tipo solto
// ("20% chance to Burn or Poison", "loses Electric type") é status ou outra coisa e não conta.
function tiposCitados(desc, tipos) {
  const nome = tipos.join("|");
  const re = new RegExp(String.raw`((?:\b(?:${nome})\b(?:\s*(?:,|/|&|\band\b|\bor\b)\s*)*)+)(?:-types?\b|\s+(?:type\s+)?(?:moves?|attacks?)\b)`, "gi");
  const achados = new Set();
  for (const m of desc.matchAll(re)) for (const t of tipos) if (new RegExp(String.raw`\b${t}\b`, "i").test(m[1])) achados.add(t);
  return tipos.filter((t) => achados.has(t));
}

export function gerarSinergia(dex) {
  const textos = textosDasHabilidades(dex);
  const tipos = dex.types.filter((t) => !["Mystery", "None", "Stellar"].includes(t));
  const aumentos = new Map();
  const semFlag = [];
  dex.abilities.forEach((a, id) => {
    const desc = normalizar(textos[id]);
    if (!desc || !AUMENTA.test(desc)) return;
    const flags = [];
    for (const [re, cats] of FRASES_DE_FLAG) if (re.test(desc)) for (const c of cats) if (!flags.includes(c)) flags.push(c);
    const tiposAch = tiposCitados(desc, tipos);
    const semMapa = FRASES_SEM_FLAG.some((re) => re.test(desc));
    if (!flags.length && !tiposAch.length && !semMapa) return;
    aumentos.set(id, { name: a[0], flags, types: tiposAch });
    if (semMapa && !flags.length && !tiposAch.length) semFlag.push(a[0]);
  });
  const golpes = dex.moves.map((m) => (m ? { name: m[0], flags: (m[8] || []).map((f) => dex.flags[f]), type: dex.types[m[1]] } : null));
  const resultado = {};
  for (const s of dex.species) {
    if (!s || !s.sname) continue;
    const ids = [];
    for (const par of s.lm || []) ids.push(Number(par[1]));
    for (const m of s.tu || []) ids.push(Number(m));
    const unicos = [...new Set(ids)];
    const slots = [...(s.ab || []).map((id) => ({ id: Number(id), kind: "abi" })), ...(s.inn || []).map((id) => ({ id: Number(id), kind: "inn" }))];
    const acertos = [];
    for (const slot of slots) {
      const b = aumentos.get(slot.id);
      if (!b) continue;
      const nomes = [], cats = [];
      for (const mid of unicos) {
        const mv = golpes[mid];
        if (!mv) continue;
        const achou = [];
        for (const c of b.flags) if (mv.flags.includes(c)) achou.push(c);
        if (b.types.includes(mv.type)) achou.push(mv.type);
        if (achou.length) { nomes.push(mv.name); cats.push(...achou); }
      }
      if (nomes.length) acertos.push({ id: slot.id, name: b.name, kind: slot.kind, categoria: [...new Set(cats)].join(", "), golpes: [...new Set(nomes)] });
    }
    if (acertos.length) resultado[s.sname] = acertos;
  }
  return { resultado, aumentos, semFlag };
}

if ((process.argv[1] || "").endsWith("gerar_sinergia_habilidade_movepool.mjs")) {
  const [dexArq = "data/dex_compact.json", saida = "data/species_ability_synergy.json"] = process.argv.slice(2);
  const { resultado, aumentos, semFlag } = gerarSinergia(JSON.parse(readFileSync(dexArq, "utf8")));
  writeFileSync(saida, JSON.stringify(resultado));
  console.log("gerar_sinergia_habilidade_movepool.mjs: " + aumentos.size + " habilidades com bônus de golpe mapeado");
  if (semFlag.length) console.log("  aviso: " + semFlag.length + " habilidades citam categoria SEM flag no jogo (soco/mordida/cortante), fora da verificação: " + semFlag.join(", "));
  console.log("  OK (" + Object.keys(resultado).length + " espécies com sinergia real) -> " + saida);
}
