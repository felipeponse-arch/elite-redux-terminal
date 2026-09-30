// Teste de sabotagem (item Q5 da pauta técnica, 2026-09-16): aplica cada
// defeito de tests/unit/mutacoes.mjs, um por vez e só na memória, e exige que
// os testes unitários FALHEM. Sabotagem que "sobrevive" = regra sem proteção.
//   npm run test:sabotage
//   node tests/run_sabotage.mjs lote- clima-   (só as que começam com esses nomes)
// O filtro (2026-09-30) é pra conferir sabotagem nova sem rodar as 118 - o
// usuário achou a rodada inteira demorada; a revisão completa fica pra depois.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { MUTACOES as TODAS } from "./unit/mutacoes.mjs";

const FILTROS = process.argv.slice(2);
const MUTACOES = FILTROS.length ? TODAS.filter((m) => FILTROS.some((f) => m.id.startsWith(f))) : TODAS;

// Todo arquivo *.test.mjs da pasta, igual ao npm run test:unit - antes era uma
// lista fixa, e um arquivo de teste novo ficava fora da sabotagem sem aviso.
const ARQUIVOS_DE_TESTE = readdirSync("tests/unit").filter((f) => f.endsWith(".test.mjs")).map((f) => "tests/unit/" + f);

let sobreviveram = 0;
let quebradas = 0;
for (const m of MUTACOES) {
  const r = spawnSync(process.execPath, ["--test", ...ARQUIVOS_DE_TESTE], {
    env: { ...process.env, MUTACAO_ARQUIVO: m.arquivo, MUTACAO_DE: m.de, MUTACAO_PARA: m.para },
    encoding: "utf8",
  });
  const saida = (r.stdout || "") + (r.stderr || "");
  if (saida.includes("trecho da sabotagem não encontrado")) {
    quebradas++;
    console.log(`ERRO      ${m.id}: o trecho sabotado não existe mais em src/regras/${m.arquivo} - atualize tests/unit/mutacoes.mjs`);
  } else if (r.status === 0) {
    sobreviveram++;
    console.log(`SOBREVIVEU ${m.id}: ${m.descricao} - nenhum teste unitário percebeu`);
  } else {
    // o node --test repete cada falha no resumo final - conta só antes dele
    const antesDoResumo = saida.split("✖ failing tests:")[0];
    const falhas = (antesDoResumo.match(/^✖ .+? \(/gm) || []).length;
    console.log(`pega      ${m.id}: ${m.descricao} (${falhas} teste(s) falharam)`);
  }
}
console.log(`\n=== sabotagem: ${MUTACOES.length - sobreviveram - quebradas}/${MUTACOES.length} pegas ===`);
if (sobreviveram || quebradas) process.exitCode = 1;
