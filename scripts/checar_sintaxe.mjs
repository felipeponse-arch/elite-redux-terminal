// Checagem de sintaxe sem dependências (fase 1 da refatoração, 2026-09-24):
// todo .js/.mjs versionado passa por `node --check`, e o JS inline do
// artifact_template.html (o <script> principal e as regras coladas nele) é
// compilado com vm.Script - com a linha real do template na mensagem de erro.
// Pega erro de sintaxe em segundos, antes do build e dos minutos de navegador.
//   node scripts/checar_sintaxe.mjs
import { execSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const problemas = [];
const arquivos = execSync("git ls-files", { encoding: "utf8" }).split("\n").map((f) => f.trim())
  .filter((f) => /\.(m?js)$/.test(f));
for (const f of arquivos) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) problemas.push(f + "\n" + (r.stderr || "").split("\n").slice(0, 5).join("\n"));
}

// JS inline do template: cada <script> sem type (os de dados são JSON e já são
// validados no build). As linhas antes do bloco viram linhas em branco, então o
// número da linha do erro é o do template.
const tpl = readFileSync("artifact_template.html", "utf8");
let blocos = 0;
// Com id também (o que liga as fontes no <head>, fase 8); com type não.
for (const m of tpl.matchAll(/<script(?: id="[\w-]+")?>([\s\S]*?)<\/script>/g)) {
  blocos++;
  const antes = tpl.slice(0, m.index + m[0].length - m[1].length - "</script>".length).split("\n").length - 1;
  try {
    new vm.Script("\n".repeat(antes) + m[1], { filename: "artifact_template.html" });
  } catch (e) {
    const onde = (e.stack || "").split("\n")[0];
    problemas.push("artifact_template.html (<script> nº " + blocos + "): " + e.message + " - " + onde);
  }
}

if (problemas.length) {
  console.error(problemas.join("\n\n"));
  console.error(`\nchecar_sintaxe: ${problemas.length} arquivo(s) com erro de sintaxe.`);
  process.exit(1);
}
console.log(`checar_sintaxe: OK (${arquivos.length} arquivos .js/.mjs + ${blocos} bloco(s) <script> do template)`);
