// Completa data/mega_forms.json (pedra -> forma Mega/Primal) com as evoluções do dado bruto 2.65beta.
// O arquivo nasceu à mão (commit 03bfa7f) e ficou para trás: faltavam 36 pedras (Lucarionite,
// Gyaradeathite, Arcanite... que chefes seguram, então eles não viravam Mega nas simulações).
// Regras: o que já está no arquivo manda (não muda); só entram pedras que são itens de verdade, com
// destino conhecido (índice >= 0) e espécie real; golpe que faz Mega (Dragon Ascent) não é pedra.
// Uso: node scripts/gerar_mega_forms.mjs [--gravar]   (sem --gravar só lista o que faltaria)
import { readFileSync, writeFileSync } from "node:fs";
const g = JSON.parse(readFileSync("data/gameData_2654.json", "utf8"));
const atual = JSON.parse(readFileSync("data/mega_forms.json", "utf8"));
const itens = Object.fromEntries(g.items.map((i) => [i.NAME, i.name]));
const KIND = g.evoKindT;
const quais = new Set(["EVO_MEGA_EVOLUTION", "EVO_PRIMAL_REVERSION", "EVO_MOVE_MEGA_EVOLUTION"].map((k) => KIND.indexOf(k)));
const novos = {};
for (const s of g.species) {
  for (const e of s.evolutions || []) {
    if (!quais.has(e.kd)) continue;
    const pedra = itens[e.rs];
    const alvo = g.species[e["in"]];
    if (!pedra || !alvo || e["in"] < 0 || !alvo.NAME) continue;
    if (!(pedra in atual) && !(pedra in novos)) novos[pedra] = alvo.NAME;
  }
}
const faltam = Object.keys(novos);
console.log("já no arquivo:", Object.keys(atual).length, "| a acrescentar:", faltam.length);
faltam.forEach((p) => console.log("  " + p + " -> " + novos[p]));
if (process.argv.includes("--gravar")) {
  writeFileSync("data/mega_forms.json", JSON.stringify(Object.assign({}, atual, novos)));
  console.log("gravado: data/mega_forms.json (" + (Object.keys(atual).length + faltam.length) + " pedras)");
}
