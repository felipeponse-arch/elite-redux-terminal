// Porte de scripts/extract_bosses.ps1 e scripts/extract_boss_builds.ps1 (ticket versao-nova/05). Gera data/bosses.json e data/boss_reference_builds.json.
// Uso: node scripts/extracao/chefoes.mjs <gameData.json> <dex_compact.json> <bosses.json saída> <boss_reference_builds.json saída>
import { readFileSync, writeFileSync } from "node:fs";

const CATEGORIAS = { 34: "Lider de Ginasio", 33: "Alto Comando", 38: "Campeao", 11: "Equipe Aqua", 9: "Equipe Aqua (Admin)", 57: "Equipe Magma", 16: "Equipe Magma (Admin)",
  62: "Superchefao (Monotype)", 49: "Superchefao", 46: "Superchefao", 26: "Frontier Brain" };
// Lutas opcionais (ticket 04 de 07/10/2026): entram pelo nome, ficam fora do rank. "Steven Mossdeep" é parceiro, não adversário.
const OPCIONAIS = ["Dragonitenite Sage 1", "Dragonitenite Sage 2", "Dragonitenite Sage 3", "Steven Granite Cave", "Steven Route118", "Calvin 1", "Calvin 2", "Calvin 3", "Calvin 4",
  "Calvin E4", "Mega Fidough", "Blunder", "Shedinjite Abandoned Ship", "Crobatite Dewford Manor", "Granbullite Route123", "Sinnoh Megas Mauville Game Corner"];
const ROTULO_EV = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
export const formatarEvs = (arr) => (arr || []).slice(0, 6).map((v, i) => (v > 0 ? v + " " + ROTULO_EV[i] : "")).filter(Boolean).join(" / ");
// Quirk do PowerShell (função que devolve array): vazio vira null e de 1 elemento vira o próprio elemento.
const desembrulhar = (l) => (l.length === 0 ? null : l.length === 1 ? l[0] : l);

export function extrairChefoes(data) {
  // O item 0 da lista é um item real na 2.65.4 (Eviolite); no dado antigo era o espaço vazio. O PowerShell tratava 0 como "sem item".
  const itemValido = (i) => i !== undefined && i !== null && data.items[i] && (i !== 0 || (data.items[0].name && data.items[0].name !== "????????"));
  const resolverAbilidade = (sp, idx) => {
    if (!sp || !sp.stats || !sp.stats.abis) return { nome: "", id: -1 };
    const abis = sp.stats.abis;
    if (idx >= 0 && idx < abis.length) { const aid = abis[idx]; return { nome: data.abilities[aid] ? data.abilities[aid].name : "", id: aid }; }
    return { nome: "", id: -1 };
  };
  const time = (bruto) => desembrulhar((bruto || []).map((mon) => {
    const sp = data.species[mon.spc];
    const h = resolverAbilidade(sp, mon.abi);
    const golpes = (mon.moves || []).filter((m) => m !== 0 && data.moves[m]).map((m) => data.moves[m].name);
    const usaHp = (mon.moves || []).some((m) => m !== 0 && data.moves[m] && data.moves[m].usesHpType);
    return { x: mon.spc, n: sp ? sp.name : "?", abi: h.nome, item: itemValido(mon.item) && mon.item !== undefined && mon.item !== null ? data.items[mon.item].name : "",
      nat: data.natureT[mon.nature] ? data.natureT[mon.nature] : "", evs: formatarEvs(mon.evs), evsRaw: mon.evs, ivsRaw: mon.ivs, mv: golpes, abiId: h.id,
      hpt: usaHp ? data.typeT[mon.hpType] : "" };
  }));
  const bosses = [];
  for (const t of data.trainers) {
    const opcional = OPCIONAIS.includes(t.name);
    if (!opcional && !(String(t.tclass) in CATEGORIAS)) continue;
    bosses.push({ name: t.name, cat: opcional ? "Treinador opcional" : CATEGORIAS[String(t.tclass)], db: !!t.db, party: time(t.party), insane: time(t.insane), hell: time(t.hell) });
  }
  return bosses;
}

export function extrairBuildsDeReferencia(bosses, dex) {
  const snamePorX = new Map(); dex.species.forEach((s) => { if (s) snamePorX.set(String(s.x), s.sname); });
  const rankDe = { party: 0, insane: 1, hell: 2 };
  const melhor = new Map(), ocorrencias = [];
  const lista = (v) => (v === null || v === undefined ? [] : Array.isArray(v) ? v : [v]);
  for (const b of bosses) for (const tier of ["party", "insane", "hell"]) for (const m of lista(b[tier])) {
    if (!m || !m.n || m.n === "?") continue;
    const x = String(m.x), rank = rankDe[tier];
    if (!melhor.has(x) || rank > melhor.get(x)) melhor.set(x, rank);
    ocorrencias.push({ x, rank, tier, boss: b.name, cat: b.cat, db: b.db, m });
  }
  const saida = {};
  for (const o of ocorrencias) {
    if (o.rank !== melhor.get(o.x)) continue;
    const sname = snamePorX.get(o.x);
    if (!sname) continue;
    (saida[sname] = saida[sname] || []).push({ boss: o.boss, cat: o.cat, db: !!o.db, tier: o.tier, ability: o.m.abi, nature: o.m.nat, evs: o.m.evs, item: o.m.item, moves: o.m.mv, ivsRaw: o.m.ivsRaw, evsRaw: o.m.evsRaw });
  }
  return saida;
}

if ((process.argv[1] || "").endsWith("chefoes.mjs")) {
  const [gd, dexArq, saidaBosses, saidaBuilds] = process.argv.slice(2);
  if (!saidaBuilds) { console.error("uso: node scripts/extracao/chefoes.mjs <gameData.json> <dex_compact.json> <bosses.json> <boss_reference_builds.json>"); process.exit(2); }
  const bosses = extrairChefoes(JSON.parse(readFileSync(gd, "utf8")));
  writeFileSync(saidaBosses, JSON.stringify(bosses));
  const refs = extrairBuildsDeReferencia(bosses, JSON.parse(readFileSync(dexArq, "utf8")));
  writeFileSync(saidaBuilds, JSON.stringify(refs));
  console.log("chefoes.mjs: OK (" + bosses.length + " chefões, " + Object.keys(refs).length + " espécies com build de referência)");
}
