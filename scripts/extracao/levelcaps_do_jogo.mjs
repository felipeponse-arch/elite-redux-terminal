// Confere/regrava os níveis de data/levelcaps.json a partir do código do jogo (TK-22, achado dados-P15-5).
// Fonte: er-repo src/pokemon.c, GetLevelCap(): levelCapsStandard (Easy), levelCapsMore (More), levelCapsStrict (Elite),
// indexados pela insígnia (0-9). Os nomes das linhas (milestone) e as notas são do app e ficam como estão.
// Uso: node scripts/extracao/levelcaps_do_jogo.mjs <er-repo> [--gravar]   (sem --gravar só confere; sai 1 se divergir)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const repo = process.argv[2];
if (!repo) { console.error("uso: node scripts/extracao/levelcaps_do_jogo.mjs <er-repo> [--gravar]"); process.exit(2); }
const c = readFileSync(join(repo, "src", "pokemon.c"), "utf8");
const lista = (nome) => {
  const i = c.indexOf(nome + "[] = {");
  if (i < 0) throw new Error("tabela não encontrada em pokemon.c: " + nome);
  return c.slice(c.indexOf("{", i) + 1, c.indexOf("}", i)).split(",").map((x) => parseInt(x, 10)).filter((n) => !isNaN(n));
};
const jogo = { easy: lista("levelCapsStandard"), more: lista("levelCapsMore"), elite: lista("levelCapsStrict") };
const arq = JSON.parse(readFileSync("data/levelcaps.json", "utf8"));
const carimbo = JSON.parse(readFileSync("data/carimbo_dados.json", "utf8"));
let diverge = 0;
arq.rows.forEach((r, i) => ["easy", "more", "elite"].forEach((k) => {
  if (jogo[k][i] !== r[k]) { diverge++; console.log("diverge: etapa " + i + " " + k + " app=" + r[k] + " jogo=" + jogo[k][i]); if (process.argv.includes("--gravar")) r[k] = jogo[k][i]; }
}));
if (jogo.easy.length !== arq.rows.length) { diverge++; console.log("tamanho: app=" + arq.rows.length + " jogo=" + jogo.easy.length); }
console.log(diverge ? diverge + " divergência(s)" : "levelcaps.json igual ao código do jogo (er-repo " + carimbo["er-repo"] + ")");
if (process.argv.includes("--gravar")) {
  arq.fonteCodigo = "er-repo src/pokemon.c GetLevelCap (levelCapsStandard/More/Strict), carimbo " + carimbo["er-repo"] + " (scripts/extracao/levelcaps_do_jogo.mjs); 100 = nível máximo, sem limite";
  writeFileSync("data/levelcaps.json", JSON.stringify(arq));
} else if (diverge) process.exitCode = 1;
