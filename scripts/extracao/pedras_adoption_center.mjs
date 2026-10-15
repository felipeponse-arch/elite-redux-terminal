// Gera data/pedras_adoption_center.json: as pedras Mega vendidas por BP no Adoption Center (itens com `adoption_center: true` na MegaStonesList da er-config).
// Ticket versao-nova/05 (15/10/2026): regerado contra a er-config d1a9a4c (a Arbokite saiu; entram as pedras novas). Uso:
//   node scripts/extracao/pedras_adoption_center.mjs <MegaStonesList.textproto> <commit da er-config>
import { readFileSync, writeFileSync } from "node:fs";

export function lerPedrasDoAdoptionCenter(texto) {
  const pedras = [];
  let atual = null, prof = 0;
  for (const bruta of texto.split(/\r?\n/)) {
    const l = bruta.trim();
    if (!atual) { if (l === "item {") { atual = {}; prof = 1; } continue; }
    if (l.endsWith("{")) { prof++; continue; }
    if (l === "}") { prof--; if (prof === 0) { if (atual.adoption_center === "true" && atual.name) pedras.push(atual.name); atual = null; } continue; }
    const m = l.match(/^(\w+): (.*)$/);
    if (m && prof === 1) atual[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return pedras;
}

if ((process.argv[1] || "").endsWith("pedras_adoption_center.mjs")) {
  const [arq, commit] = process.argv.slice(2);
  if (!arq || !commit) { console.error("uso: node scripts/extracao/pedras_adoption_center.mjs <MegaStonesList.textproto> <commit>"); process.exit(2); }
  const atual = JSON.parse(readFileSync("data/pedras_adoption_center.json", "utf8"));
  const pedras = lerPedrasDoAdoptionCenter(readFileSync(arq, "utf8"));
  const antes = new Set(atual.pedras), depois = new Set(pedras);
  console.log("saem:", [...antes].filter((p) => !depois.has(p)).join(", ") || "-", "| entram:", [...depois].filter((p) => !antes.has(p)).join(", ") || "-");
  atual.fonte = atual.fonte.replace(/commit \w+/, "commit " + commit);
  atual.pedras = pedras;
  writeFileSync("data/pedras_adoption_center.json", JSON.stringify(atual, null, 2) + "\n");
}
