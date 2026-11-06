// Lista os arquivos de teste unitário em rápidos e pesados (tests/pesados.json) e roda um dos grupos.
//   node scripts/testes_unit.mjs rapido|pesado   (sem argumento = todos)
// Motivo (06/11/2026): 15 de 210 arquivos eram 92% do tempo (~12 min de 14), e cada sabotagem rodava todos.
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const PESADOS = JSON.parse(readFileSync(new URL("../tests/pesados.json", import.meta.url), "utf8")).arquivos;
const TODOS = readdirSync("tests/unit").filter((f) => f.endsWith(".test.mjs")).map((f) => "tests/unit/" + f);

export const arquivosPesados = () => TODOS.filter((f) => PESADOS.includes(f));
export const arquivosTodos = () => TODOS;
export const arquivosRapidos = () => TODOS.filter((f) => !PESADOS.includes(f));

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const grupo = process.argv[2];
  const arquivos = grupo === "pesado" ? arquivosPesados() : grupo === "rapido" ? arquivosRapidos() : TODOS;
  const r = spawnSync(process.execPath, ["--test", ...arquivos], { stdio: "inherit" });
  process.exit(r.status ?? 1);
}
