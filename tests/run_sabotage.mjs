// Teste de sabotagem (item Q5 da pauta técnica, 2026-09-16): aplica cada
// defeito de tests/unit/mutacoes.mjs, um por vez e só na memória, e exige que
// os testes unitários FALHEM. Sabotagem que "sobrevive" = regra sem proteção.
//   npm run test:sabotage
import { spawnSync } from "node:child_process";
import { MUTACOES } from "./unit/mutacoes.mjs";

let sobreviveram = 0;
let quebradas = 0;
for (const m of MUTACOES) {
  const r = spawnSync(process.execPath, ["--test", "tests/unit/regras.test.mjs", "tests/unit/confronto.test.mjs"], {
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
