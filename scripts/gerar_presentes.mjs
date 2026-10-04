// Completa data/how_to_obtain.json com os presentes (Mystery Gift) da tabela oficial do jogo:
// GetMysteryGiftSpecies em src/field_specials.c (er-repo). O que já está no arquivo manda (tem a fonte
// da comunidade); só entra espécie que falta. Achado de 03/10: o Floette Eternal Flower não estava lá.
// Uso: node scripts/gerar_presentes.mjs <caminho do field_specials.c> [--gravar]
import { readFileSync, writeFileSync } from "node:fs";
const caminho = process.argv[2];
if (!caminho) { console.error("uso: node scripts/gerar_presentes.mjs <field_specials.c> [--gravar]"); process.exit(2); }
const codigo = readFileSync(caminho, "utf8");
const dex = JSON.parse(readFileSync("data/dex_compact.json", "utf8"));
const snames = new Set((dex.species || []).filter(Boolean).map((s) => s.sname));
const atual = JSON.parse(readFileSync("data/how_to_obtain.json", "utf8"));
const bloco = codigo.slice(codigo.indexOf("mysteryGiftData[][4]"), codigo.indexOf("int i;", codigo.indexOf("mysteryGiftData[][4]")));
const nomeDoItem = (c) => c.replace(/^ITEM_/, "").toLowerCase().split("_").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");
const novos = {};
for (const m of bloco.matchAll(/[{]\s*(SPECIES_[A-Z0-9_]+),\s*(ITEM_[A-Z0-9_]+),\s*(FLAG_[A-Z0-9_]+),\s*(FLAG_[A-Z0-9_]+)\s*[}]/g)) {
  const [, sp, item, , exige] = m;
  if (atual[sp]) continue;
  const insignia = exige.match(/BADGE0([0-9])/);
  const quando = insignia ? "Depois de vencer o " + insignia[1] + "º ginásio" : "No pós-jogo (depois de ser Campeão)";
  novos[sp] = {
    method: "Presente (Mystery Gift)",
    note: quando + ", fale com o senhor de qualquer Centro Pokémon e escolha \"Mystery Gift\". Vem segurando " + nomeDoItem(item) + ".",
    source: "Código oficial do Elite Redux: GetMysteryGiftSpecies em src/field_specials.c (" + exige + ")"
  };
}
const lista = Object.keys(novos);
console.log("a acrescentar:", lista.length, "| espécie fora do dex:", lista.filter((s) => snames.size && !snames.has(s)).join(", ") || "nenhuma");
lista.forEach((s) => console.log("  " + s + " -> " + novos[s].note));
if (process.argv.includes("--gravar")) { writeFileSync("data/how_to_obtain.json", JSON.stringify(Object.assign({}, atual, novos), null, 2)); console.log("gravado"); }
