// Completa data/mega_forms.json (pedra -> forma Mega/Primal) com as evoluções do dado bruto 2.65.4.1.
// O arquivo nasceu à mão (commit 03bfa7f) e ficou para trás: faltavam 36 pedras (Lucarionite,
// Gyaradeathite, Arcanite... que chefes seguram, então eles não viravam Mega nas simulações).
// Regras: o que já está no arquivo manda (não muda); só entram pedras que são itens de verdade, com
// destino conhecido (índice >= 0) e espécie real; golpe que faz Mega (Dragon Ascent) não é pedra.
// --conferir: lista também as pedras que o arquivo mapeia DIFERENTE do dado do jogo (rs -> in) e as que só existem no arquivo
// (TK-22, dados-P15-5: o arquivo nasceu à mão; a divergência é decisão do usuário, o script nunca troca sozinho).
// Uso: node scripts/gerar_mega_forms.mjs [--gravar] [--conferir]   (sem --gravar só lista o que faltaria)
import { readFileSync, writeFileSync } from "node:fs";
const g = JSON.parse(readFileSync("data/gameData.json", "utf8"));
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
// pedra -> conjunto de alvos do jogo. Evolução com in<0 (a fonte não traz o destino; o NextDex tem essa lacuna) NÃO é descartada:
// a pedra entra com conjunto vazio, e fica "sem alvo no dado bruto" em vez de "só no arquivo" (Bruxishite e Jellicentite existem no jogo:
// sala do totem MeteorFalls_HaxorusRoom/scripts.pory:380-382 e 415-417; o alvo vem da SpeciesList: BRUXISH_MEGA, JELLICENT_MEGA).
// Pedra com 2 alvos (Aegislashite R, Toxtricitite R) = conjunto de 2; o arquivo guarda uma lista.
const doJogo = {};
for (const sp of g.species) for (const e of sp.evolutions || []) {
  if (!quais.has(e.kd)) continue;
  const pedra = itens[e.rs], alvo = g.species[e["in"]];
  if (!pedra) continue;
  const s = (doJogo[pedra] = doJogo[pedra] || new Set());
  if (alvo && e["in"] >= 0 && alvo.NAME) s.add(alvo.NAME);
}
if (process.argv.includes("--conferir")) {
  Object.keys(atual).forEach((p) => {
    const arq = [].concat(atual[p]), jogo = doJogo[p];
    // Excadrillite-R: nenhuma espécie do jogo faz Mega com ela (SPECIES_EXCADRILL_REDUX evolui a REXCADRILL no nível 50, sem Mega);
    // fica no arquivo, travada na Etapa 10 (pedras_etapa.json). Aparece aqui como "só no arquivo" de propósito.
    if (!jogo) console.log("só no arquivo (jogo não tem): " + p + " -> " + arq);
    else if (jogo.size === 0) console.log("sem alvo no dado bruto (conferir na SpeciesList): " + p + " -> " + arq);
    else if (arq.length !== jogo.size || arq.some((a) => !jogo.has(a))) console.log("diverge: " + p + " arquivo=" + arq + " jogo=" + [...jogo]);
  });
}
const faltam = Object.keys(novos);
console.log("já no arquivo:", Object.keys(atual).length, "| a acrescentar:", faltam.length);
faltam.forEach((p) => console.log("  " + p + " -> " + novos[p]));
if (process.argv.includes("--gravar")) {
  writeFileSync("data/mega_forms.json", JSON.stringify(Object.assign({}, atual, novos)));
  console.log("gravado: data/mega_forms.json (" + (Object.keys(atual).length + faltam.length) + " pedras)");
}
