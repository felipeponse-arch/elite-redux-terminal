// Teste de sabotagem (item Q5 da pauta técnica, 2026-09-16): aplica cada
// defeito de tests/unit/mutacoes.mjs, um por vez e só na memória, e exige que
// os testes unitários FALHEM. Sabotagem que "sobrevive" = regra sem proteção.
//   npm run test:sabotage
//   node tests/run_sabotage.mjs lote- clima-   (só as que começam com esses nomes)
//   node tests/run_sabotage.mjs --completo     (ignora o cache: suíte inteira em cada uma)
//   node tests/run_sabotage.mjs --mudados      (só as ligadas ao que mudou desde o master)
//
// Mais rápido (Fase 3 da reunião de 30/09 - o usuário achou a rodada inteira
// demorada, ~9 min pra 118): basta UM teste falhar pra sabotagem ser pega, então
// o script lembra (tests/.sabotagem_cache.json, fora do git) qual arquivo de
// teste pegou cada uma e roda SÓ ele primeiro. Se ele não pegar (o teste mudou),
// cai na suíte inteira - "pega" continua querendo dizer "um teste falhou de
// verdade". E roda várias sabotagens ao mesmo tempo (processos separados: cada
// uma sabota só a própria memória, nunca o arquivo).
import { spawn, spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { cpus } from "node:os";
import { MUTACOES as TODAS } from "./unit/mutacoes.mjs";

const ARGS = process.argv.slice(2);
const COMPLETO = ARGS.includes("--completo");
const MUDADOS = ARGS.includes("--mudados");
const FILTROS = ARGS.filter((a) => !a.startsWith("--"));
let MUTACOES = FILTROS.length ? TODAS.filter((m) => FILTROS.some((f) => m.id.startsWith(f))) : TODAS;

// Todo arquivo *.test.mjs da pasta, igual ao npm run test:unit - antes era uma
// lista fixa, e um arquivo de teste novo ficava fora da sabotagem sem aviso.
const ARQUIVOS_DE_TESTE = readdirSync("tests/unit").filter((f) => f.endsWith(".test.mjs")).map((f) => "tests/unit/" + f);
const CACHE = "tests/.sabotagem_cache.json";
let cache = {};
try { if (!COMPLETO && existsSync(CACHE)) cache = JSON.parse(readFileSync(CACHE, "utf8")); } catch { cache = {}; }

// --mudados (regra do QA, 08/10/2026 - dois agentes rodando a suíte inteira ao mesmo
// tempo levaram 90+ min): no branch de um ticket roda só as sabotagens ligadas ao que
// mudou desde o master - a regra sabotada, o arquivo de teste que costuma pegá-la, ou
// sabotagem nova do catálogo. A suíte inteira continua rodando no master (merge e publicar).
if (MUDADOS) {
  const git = (args) => spawnSync("git", args, { encoding: "utf8" }).stdout || "";
  // worktree novo nasce sem cache: empresta o do checkout principal (senão tudo conta como "nova")
  if (!Object.keys(cache).length) {
    try { cache = JSON.parse(readFileSync(git(["rev-parse", "--path-format=absolute", "--git-common-dir"]).trim() + "/../" + CACHE, "utf8")); } catch { /* sem cache: roda todas */ }
  }
  const base = git(["merge-base", "HEAD", "master"]).trim();
  const mudados = new Set([
    ...git(["diff", "--name-only", base || "master"]).split("\n"),
    ...git(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ].filter(Boolean).map((f) => f.replace(/\\/g, "/")));
  const nomes = new Set([...mudados].map((f) => f.split("/").pop()));
  MUTACOES = MUTACOES.filter((m) => nomes.has(m.arquivo) || mudados.has(cache[m.id]) || !cache[m.id]);
  console.log(`--mudados: ${mudados.size} arquivo(s) mudado(s) desde o master -> ${MUTACOES.length} sabotagem(ns)`);
}
const AO_MESMO_TEMPO = Math.max(2, Math.floor(cpus().length / 2));

function rodar(m, arquivos) {
  return new Promise((pronto) => {
    const filho = spawn(process.execPath, ["--test", ...arquivos], {
      env: { ...process.env, MUTACAO_ARQUIVO: m.arquivo, MUTACAO_DE: m.de, MUTACAO_PARA: m.para },
    });
    let saida = "";
    filho.stdout.on("data", (d) => { saida += d; });
    filho.stderr.on("data", (d) => { saida += d; });
    filho.on("close", (status) => pronto({ status, saida }));
  });
}
// Qual arquivo pegou: o relatório do node --test cita "test at tests\unit\x.test.mjs:L:C".
function arquivoQuePegou(saida) {
  const m = saida.match(/test at (tests[\\/]unit[\\/][\w.-]+\.test\.mjs)/);
  return m ? m[1].replace(/\\/g, "/") : null;
}
function contarFalhas(saida) {
  // o node --test repete cada falha no resumo final - conta só antes dele
  const antesDoResumo = saida.split("✖ failing tests:")[0];
  return (antesDoResumo.match(/^✖ .+? \(/gm) || []).length;
}

async function avaliar(m) {
  const lembrado = cache[m.id];
  if (lembrado && ARQUIVOS_DE_TESTE.includes(lembrado)) {
    const r = await rodar(m, [lembrado]);
    if (r.saida.includes("trecho da sabotagem não encontrado")) return { m, tipo: "quebrada" };
    if (r.status !== 0) return { m, tipo: "pega", falhas: contarFalhas(r.saida), rapido: true };
  }
  const r = await rodar(m, ARQUIVOS_DE_TESTE);
  if (r.saida.includes("trecho da sabotagem não encontrado")) return { m, tipo: "quebrada" };
  if (r.status === 0) return { m, tipo: "sobreviveu" };
  const arq = arquivoQuePegou(r.saida);
  if (arq) cache[m.id] = arq;
  return { m, tipo: "pega", falhas: contarFalhas(r.saida), rapido: false };
}

const inicio = Date.now();
const resultados = new Array(MUTACOES.length);
let proxima = 0;
async function trabalhador() {
  while (proxima < MUTACOES.length) {
    const i = proxima++;
    resultados[i] = await avaliar(MUTACOES[i]);
  }
}
await Promise.all(Array.from({ length: Math.min(AO_MESMO_TEMPO, MUTACOES.length) }, trabalhador));

let sobreviveram = 0;
let quebradas = 0;
for (const r of resultados) {
  const m = r.m;
  if (r.tipo === "quebrada") {
    quebradas++;
    console.log(`ERRO      ${m.id}: o trecho sabotado não existe mais em src/regras/${m.arquivo} - atualize tests/unit/mutacoes.mjs`);
  } else if (r.tipo === "sobreviveu") {
    sobreviveram++;
    console.log(`SOBREVIVEU ${m.id}: ${m.descricao} - nenhum teste unitário percebeu`);
  } else {
    console.log(`pega      ${m.id}: ${m.descricao} (${r.falhas} teste(s) falharam${r.rapido ? ", no arquivo lembrado" : ""})`);
  }
}
try { writeFileSync(CACHE, JSON.stringify(cache, null, 1)); } catch { /* cache é só atalho */ }
console.log(`\n=== sabotagem: ${MUTACOES.length - sobreviveram - quebradas}/${MUTACOES.length} pegas em ${Math.round((Date.now() - inicio) / 1000)} s ===`);
if (sobreviveram || quebradas) process.exitCode = 1;
