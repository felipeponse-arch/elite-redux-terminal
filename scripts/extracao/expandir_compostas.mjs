// Porte de scripts/expand_combo_abilities.ps1 (ticket versao-nova/05). Reescreve em data/ability_translations_pt.json as habilidades que o dado define
// só como soma de outras ("Rock Head + Reckless"), soletrando o que cada parte faz. Idempotente. Equivalência: tests/unit/extracao_transform.test.mjs.
// Uso: node scripts/extracao/expandir_compostas.mjs [dex_compact.json] [ability_translations_pt.json]
import { readFileSync, writeFileSync } from "node:fs";

export function expandirCompostas(dex, pt) {
  const porNome = new Map();
  dex.abilities.forEach((a, i) => { const n = a[0]; if (n && !porNome.has(n)) porNome.set(n, i); });
  const partes = (id) => {
    const desc = dex.abilities[id][1];
    if (!desc || !/\+/.test(desc)) return null;
    const ps = desc.trim().replace(/\.+$/, "").trim().split(/\s*\+\s*/);
    if (ps.length < 2) return null;
    const ids = [];
    for (const p of ps) { const k = p.trim(); if (!porNome.has(k)) return null; ids.push(porNome.get(k)); }
    return ids;
  };
  const achatar = (id, vistos) => {
    const out = [], ps = partes(id);
    if (!ps) return [id];
    for (const p of ps) {
      if (vistos.includes(p)) continue;
      for (const f of achatar(p, vistos.concat([p]))) if (!out.includes(f)) out.push(f);
    }
    return out;
  };
  let expandidas = 0;
  const puladas = [];
  for (let i = 1; i < dex.abilities.length; i++) {
    const ps = partes(i);
    if (!ps) continue;
    const atomos = achatar(i, [i]);
    if (!atomos.length) { puladas.push(dex.abilities[i][0]); continue; }
    const linhas = [ps.map((p) => dex.abilities[p][0]).join(" + ")];
    for (const a of atomos) {
      const desc = pt[String(a)] || dex.abilities[a][1];
      if (!desc) continue;
      linhas.push("- " + dex.abilities[a][0] + ": " + desc);
    }
    if (linhas.length < 2) { puladas.push(dex.abilities[i][0]); continue; }
    pt[String(i)] = linhas.join("\n");
    expandidas++;
  }
  return { expandidas, puladas };
}

if ((process.argv[1] || "").endsWith("expandir_compostas.mjs")) {
  const [dexArq = "data/dex_compact.json", ptArq = "data/ability_translations_pt.json"] = process.argv.slice(2);
  const dex = JSON.parse(readFileSync(dexArq, "utf8")), pt = JSON.parse(readFileSync(ptArq, "utf8"));
  const r = expandirCompostas(dex, pt);
  writeFileSync(ptArq, JSON.stringify(pt));
  console.log("expandir_compostas.mjs: OK (" + r.expandidas + " compostas expandidas)" + (r.puladas.length ? "\n  não expandiu " + r.puladas.length + ": " + r.puladas.join(", ") : ""));
}
