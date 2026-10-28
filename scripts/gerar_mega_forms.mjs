// Completa data/mega_forms.json (pedra -> forma Mega/Primal) com as evoluções do dado bruto 2.65beta.
// O arquivo nasceu à mão (commit 03bfa7f) e ficou para trás: faltavam 36 pedras (Lucarionite,
// Gyaradeathite, Arcanite... que chefes seguram, então eles não viravam Mega nas simulações).
// Regras: o que já está no arquivo manda (não muda); só entram pedras que são itens de verdade, com
// destino conhecido (índice >= 0) e espécie real; golpe que faz Mega (Dragon Ascent) não é pedra.
// --conferir: lista também as pedras que o arquivo mapeia DIFERENTE do dado do jogo (rs -> in) e as que só existem no arquivo
// (TK-22, dados-P15-5: o arquivo nasceu à mão; a divergência é decisão do usuário, o script nunca troca sozinho).
// Uso: node scripts/gerar_mega_forms.mjs [--gravar] [--conferir]   (sem --gravar só lista o que faltaria)
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
const doJogo = {};
for (const sp of g.species) for (const e of sp.evolutions || []) {
  if (!quais.has(e.kd)) continue;
  const pedra = itens[e.rs], alvo = g.species[e["in"]];
  if (pedra && alvo && e["in"] >= 0 && alvo.NAME && !(pedra in doJogo)) doJogo[pedra] = alvo.NAME;
}
if (process.argv.includes("--conferir")) {
  Object.keys(atual).forEach((p) => {
    if (!(p in doJogo)) console.log("só no arquivo (jogo não tem): " + p + " -> " + atual[p]);
    else if (doJogo[p] !== atual[p]) console.log("diverge: " + p + " arquivo=" + atual[p] + " jogo=" + doJogo[p]);
  });
}
const faltam = Object.keys(novos);
console.log("já no arquivo:", Object.keys(atual).length, "| a acrescentar:", faltam.length);
faltam.forEach((p) => console.log("  " + p + " -> " + novos[p]));
if (process.argv.includes("--gravar")) {
  writeFileSync("data/mega_forms.json", JSON.stringify(Object.assign({}, atual, novos)));
  console.log("gravado: data/mega_forms.json (" + (Object.keys(atual).length + faltam.length) + " pedras)");
}
