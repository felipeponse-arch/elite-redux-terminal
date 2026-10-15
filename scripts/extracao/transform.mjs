// Porte para Node de scripts/transform.ps1 + scripts/slim_dex.ps1 (ticket versao-nova/05, 15/10/2026).
// Motivo: os .ps1 usam System.Web.Script.Serialization.JavaScriptSerializer, que só existe no Windows PowerShell 5.1; a troca do dado
// (NextDex 2.65.4) precisa rodar em qualquer lugar. Gera data/dex_compact.json a partir do dado bruto da NextDex (já com o corte do slim_dex:
// sem `hw` e `tm` por espécie e sem a descrição em inglês dos golpes quando todos têm tradução). Equivalência com os .ps1 provada por
// tests/unit/extracao_transform.test.mjs (o dex_compact.json atual sai igual do dado atual).
//
// Uso: node scripts/extracao/transform.mjs <gameData.json> <saida dex_compact.json> [--versao=2.65.4] [--gerado=AAAA-MM-DD] [--config-nova=data/config_nova.json] [--traducoes=data/move_translations_pt.json]
import { aplicarPatch } from "./config_nova.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

// Ordem do Sort-Object -Unique do PowerShell (cultura invariante, sem diferenciar maiúscula): usado nos itens.
// .NET (cultura invariante, "word sort") ignora hífen e apóstrofo na comparação, mas não o espaço.
const colador = new Intl.Collator("en", { sensitivity: "accent", ignorePunctuation: false });
const chaveOrdem = (s) => s.replace(/['\u2019-]/g, "");
export function ordenarUnicoComoPowerShell(lista) {
  const ordenada = lista.slice().sort((a, b) => colador.compare(chaveOrdem(a), chaveOrdem(b)) || (a < b ? -1 : a > b ? 1 : 0));
  return ordenada.filter((v, i) => i === 0 || colador.compare(chaveOrdem(ordenada[i - 1]), chaveOrdem(v)) !== 0);
}

// Quirk do PowerShell (atribuição de if/else): lista vazia vira null e lista de 1 elemento vira o próprio elemento.
const desembrulhar = (l) => (l.length === 0 ? null : l.length === 1 ? l[0] : l);
const sem0 = (l) => (l || []).filter((v) => v !== 0);

export function extrairDex(data, opcoes = {}) {
  const { versao = "2.65beta", gerado = new Date().toISOString().slice(0, 10), traducoesDeGolpe = null } = opcoes;
  // --- mapas de encontro selvagem por espécie (locations.maps) ---
  const metodos = ["land", "water", "fish", "rock", "hidden", "honey"];
  const selvagem = new Map();
  for (const lm of (data.locations && data.locations.maps) || []) {
    if (!lm) continue;
    const mapId = lm.id;
    if (mapId === undefined || mapId === null) continue;
    for (const m of metodos) {
      if (!(m in lm)) continue;
      for (const e of lm[m] || []) {
        if (!e || e.length < 3) continue;
        const sp = e[2] | 0;
        if (!selvagem.has(sp)) selvagem.set(sp, []);
        if (!selvagem.get(sp).includes(mapId)) selvagem.get(sp).push(mapId);
      }
    }
  }
  const abilities = data.abilities.map((a) => [a.name, a.desc]);
  const moves = data.moves.map((m) => {
    const types = m.types || [];
    const t0 = types.length > 0 ? types[0] : 0;
    const t1 = types.length > 1 ? types[1] : -1;
    const usaHp = m.usesHpType ? 1 : 0;
    const efeito = data.effT[m.eff] ? data.effT[m.eff] : "";
    return [m.name, t0, m.split, m.pwr, m.acc, m.pp, m.desc, m.prio, (m.flags || []).slice(), t1, usaHp, efeito];
  });
  const itens = ordenarUnicoComoPowerShell(data.items.map((i) => i.name).filter((n) => n && n !== "????????"));
  const species = data.species.map((s, idx) => {
    const name = s.name;
    if (!name || name === "??????????") return null;
    const st = s.stats;
    const evos = (s.evolutions || []).map((e) => [e.kd, e.rs, e.in]);
    const lm = (s.levelUpMoves || []).filter((mv) => mv.id !== 0).map((mv) => [mv.lv, mv.id]);
    const visto = new Set(), senc = [];
    for (const e of s.SEnc || []) {
      if (!e) continue;
      if (e.how === undefined || e.how === null || e.map === undefined || e.map === null) continue;
      const k = e.how + "|" + e.map;
      if (visto.has(k)) continue;
      visto.add(k); senc.push([e.how, e.map]);
    }
    const dexInfo = s.dex;
    const flags = st.flags || [];
    return {
      x: idx, i: dexInfo ? dexInfo.id : 0, n: name, sname: s.NAME, t: st.types, b: st.base,
      ab: sem0(st.abis), inn: sem0(st.inns), ev: evos, lm, tu: sem0(s.tutor), tm: sem0(s.TMHMMoves),
      d: dexInfo ? dexInfo.desc : "", hw: dexInfo && dexInfo.hw ? dexInfo.hw : [],
      senc, wenc: desembrulhar(selvagem.get(idx) || []), // o if/else do PowerShell devolve $null para @() e o escalar para lista de 1
      frm: (s.forms || []).filter((f) => f && f !== 0 && f !== idx),
      cab: flags.includes("F_THREE_HEADED") ? 3 : flags.includes("F_TWO_HEADED") ? 2 : 1,
    };
  });
  const dex = {
    meta: { source: "Elite Redux NextDex (https://forwardfeed.github.io/ER-nextdex/static/)", repo: "https://github.com/ForwardFeed/ER-nextdex", version: versao, generated: gerado },
    types: data.typeT, splits: data.splitT, evoKinds: data.evoKindT, flags: data.flagsT, sencHow: data.scriptedEncoutersHowT, maps: data.mapsT,
    abilities, moves, items: itens, species,
  };
  return fatiar(dex, traducoesDeGolpe);
}

// slim_dex.ps1: tira `hw` e `tm` das espécies e, se TODO golpe com texto tem tradução, a descrição inglesa dos golpes (índice 6 vira "").
export function fatiar(dex, traducoesDeGolpe) {
  let soltaDescricao = false;
  if (traducoesDeGolpe) {
    let faltam = 0;
    for (let i = 1; i < dex.moves.length; i++) if (dex.moves[i][6] && !traducoesDeGolpe[String(i)]) faltam++;
    soltaDescricao = faltam === 0;
    if (!soltaDescricao) console.log("  aviso: " + faltam + " golpes sem traducao - mantendo o texto em ingles como fallback");
  }
  const out = {};
  for (const k of Object.keys(dex)) {
    if (k === "species") out[k] = dex.species.map((s) => { if (!s) return null; const e = {}; for (const c of Object.keys(s)) if (c !== "hw" && c !== "tm") e[c] = s[c]; return e; });
    else if (k === "moves") out[k] = dex.moves.map((m) => { if (soltaDescricao && m.length >= 7) { const c = m.slice(); c[6] = ""; return c; } return m; });
    else out[k] = dex[k];
  }
  return out;
}

if ((process.argv[1] || "").endsWith("transform.mjs")) {
  const [entrada, saida] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!entrada || !saida) { console.error("uso: node scripts/extracao/transform.mjs <gameData.json> <saida>"); process.exit(2); }
  const arg = (n, padrao) => { const a = process.argv.find((x) => x.startsWith("--" + n + "=")); return a ? a.slice(n.length + 3) : padrao; };
  const trad = arg("traducoes", "data/move_translations_pt.json");
  const dex = extrairDex(JSON.parse(readFileSync(entrada, "utf8")), { versao: arg("versao", "2.65beta"), gerado: arg("gerado", undefined), traducoesDeGolpe: existsSync(trad) ? JSON.parse(readFileSync(trad, "utf8")) : null });
  const patch = arg("config-nova", null);
  if (patch) { const r = aplicarPatch(dex, JSON.parse(readFileSync(patch, "utf8"))); console.log("  config nova: " + JSON.stringify(r)); }
  writeFileSync(saida, JSON.stringify(dex));
  console.log("transform.mjs: OK (" + dex.species.length + " espécies, " + dex.abilities.length + " habilidades, " + dex.moves.length + " golpes) -> " + saida);
}
