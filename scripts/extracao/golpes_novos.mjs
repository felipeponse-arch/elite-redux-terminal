// Derivados dos golpes novos da config (ticket versao-nova/09, 15/10/2026): o patch data/config_nova.json põe os golpes no dex_compact.json;
// este script acerta o que o app guarda por id de golpe (categorias/efeito em move_categorias.json, papel em move_roles.json, texto em move_translations_pt.json).
// Idempotente. Uso: node scripts/extracao/golpes_novos.mjs        (depois de transform.mjs --config-nova e de scripts/categorias_pela_config.mjs)
import { readFileSync, writeFileSync } from "node:fs";
import { categoriasDasFlags } from "../categorias_pela_config.mjs";

const PT = {
  "Eerie Laugh": "Uma risada tão assustadora que paralisa o alvo de medo, ignorando o tipo. Som.",
  "Baneful Kick": "Um chute envenenado que atinge um ponto fraco. 10% de chance de envenenar. Chute.",
  "Cheap Stab": "Um golpe baixo contra um alvo desprevenido, com um chifre ou uma broca. Chifre.",
  "Arc Blast": "Luz condensada que atinge o oponente com força excessiva. 20% de chance de reduzir a Defesa Especial. Luz.",
  "Ghoulish Gore": "Um chifre envolto em energia fantasmagórica golpeia com toda a força. Chifre.",
  "Glitter Beam": "Um feixe brilhante que irrita os olhos do oponente. 20% de chance de reduzir a precisão. Luz.",
  "Luster Glow": "Uma luz carregada com a mente de quem a empunha. 40% de chance de reduzir o Ataque. Luz.",
  "Sparkling Blast": "Água cintilante que, ao tocar, explode em luz pura. Luz.",
  "Scorching Ray": "Um raio de luz que pode queimar o oponente (20% de chance). Luz.",
};
const ler = (a) => JSON.parse(readFileSync(a, "utf8"));
const dex = ler("data/dex_compact.json"), patch = ler("data/config_nova.json");
const cat = ler("data/move_categorias.json"), papeis = ler("data/move_roles.json"), pt = ler("data/move_translations_pt.json"), flagsConfig = ler("data/golpes_flags_config.json").golpes;
let n = 0;
for (const g of patch.golpes || []) {
  const id = dex.moves.findIndex((m) => m && m[0] === g.nome);
  if (id < 0) throw new Error("golpe do patch fora do dex: " + g.nome);
  const e = {};
  if (g.split === "STATUS") e.se = g.efeito;
  else {
    const c = categoriasDasFlags(flagsConfig[g.nome]);
    if (c.length) e.c = c;
    if (g.chance) e.ch = g.chance;
    if (g.efeito !== "Hit") e.ef = g.efeito;
  }
  cat[String(id)] = e;
  if (g.split === "STATUS") papeis[String(id)] = "suporte";
  if (!PT[g.nome]) throw new Error("sem tradução: " + g.nome);
  pt[String(id)] = PT[g.nome];
  n++;
}
const ordena = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => +a[0] - +b[0]));
writeFileSync("data/move_categorias.json", JSON.stringify(ordena(cat)) + "\n");
writeFileSync("data/move_roles.json", JSON.stringify(ordena(papeis)));
writeFileSync("data/move_translations_pt.json", JSON.stringify(ordena(pt), null, 2) + "\n");
console.log("golpes_novos.mjs: OK (" + n + " golpes)");
