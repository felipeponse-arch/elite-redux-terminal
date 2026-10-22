// Gera docs/mapa-do-codigo.md: por arquivo de src/regras, src/ui e scripts/*.mjs, a responsabilidade
// (1ª linha do comentário de topo) e as funções de nível superior com número de linha.
// Determinístico (ordem alfabética, sem data) para não gerar diff à toa.
// Uso: npm run mapa            (também roda o Graphify incremental, se o exe existir; falha dele não derruba)
//      node scripts/mapa_do_codigo.mjs --rapido   (só o mapa; é o que o pré-commit usa)
// Limite: análise por regex, sem chamadas entre arquivos (o Graphify também não as vê: o app junta os
// arquivos sem import). Em conflito de junção em docs/mapa-do-codigo.md: regenerar (npm run mapa -- --rapido).
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const MAX_FUNCOES = 30;
const PASTAS = [["src/regras", "Regras (lógica pura)"], ["src/ui", "Interface"], ["scripts", "Scripts (.mjs)"]];

// Responsabilidade: 1ª linha de comentário com texto, ignorando o marcador "===== arquivo =====".
export function responsabilidade(linhas) {
  for (const l of linhas.slice(0, 15)) {
    const m = l.match(/^\s*\/\/\s?(.*\S)/);
    if (!m || /^=+\s.*=+$/.test(m[1]) || /^!\/usr|^eslint|^@ts-/.test(m[1])) continue;
    return m[1].length > 140 ? m[1].slice(0, 137) + "..." : m[1];
  }
  return "(sem comentário de topo)";
}

// Funções de nível superior: mesma indentação da primeira linha de código (os arquivos de src/ são
// colados indentados no template). shortcut: regex, não parser; arrow assigned a var/const/let conta.
export function funcoes(texto) {
  const linhas = texto.split("\n");
  const primeira = linhas.find((l) => l.trim() && !l.trim().startsWith("//"));
  const base = primeira ? primeira.match(/^\s*/)[0] : "";
  const re = new RegExp(String.raw`^${base}(?:export\s+)?(?:async\s+)?(?:function\*?\s+([A-Za-z_$][\w$]*)|(?:var|const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>))`);
  const achadas = [];
  linhas.forEach((l, i) => { const m = l.match(re); if (m) achadas.push([m[1] || m[2], i + 1]); });
  return achadas;
}

export function gerarMapa(raiz = RAIZ) {
  const saida = [
    "# Mapa do código",
    "",
    "Gerado por `npm run mapa` (scripts/mapa_do_codigo.mjs); o pré-commit regenera quando há `src/` ou `scripts/` em staging.",
    "Não edite à mão. Conflito de junção neste arquivo: regenere (`npm run mapa -- --rapido`) e adicione.",
    "Uso: ache o arquivo aqui, depois abra só o trecho (`arquivo:linha`, offset/limit). Chamadas entre arquivos não aparecem.",
  ];
  for (const [pasta, titulo] of PASTAS) {
    saida.push("", `## ${titulo} - ${pasta}/`);
    const nomes = readdirSync(join(raiz, pasta)).filter((n) => n.endsWith(pasta === "scripts" ? ".mjs" : ".js")).sort();
    for (const n of nomes) {
      const texto = readFileSync(join(raiz, pasta, n), "utf8").replace(/\r\n/g, "\n");
      const fs = funcoes(texto);
      const lista = fs.slice(0, MAX_FUNCOES).map(([f, l]) => `${f}:${l}`).join(", ");
      const resto = fs.length > MAX_FUNCOES ? ` (+${fs.length - MAX_FUNCOES})` : "";
      saida.push(`- **${n}** - ${responsabilidade(texto.split("\n"))}${fs.length ? `\n  ${lista}${resto}` : ""}`);
    }
  }
  return saida.join("\n") + "\n";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rapido = process.argv.includes("--rapido");
  if (!rapido) {
    // sobe as pastas até achar teste/ferramentas/graphify (vale no repositório e nos worktrees)
    let gx = process.env.GRAPHIFY_EXE;
    for (let d = RAIZ, i = 0; !gx && i < 6; d = join(d, ".."), i++) {
      const c = join(d, "ferramentas", "graphify", "Scripts", "graphify.exe");
      if (existsSync(c)) gx = c;
    }
    if (gx && existsSync(gx)) {
      const r = spawnSync(gx, ["extract", ".", "--code-only", "--no-cluster"], { cwd: RAIZ, stdio: "inherit", env: { ...process.env, GRAPHIFY_NO_AUTO_REFRESH: "1" } });
      if (r.status !== 0) console.warn("Graphify falhou; o mapa sai igual (ele não depende do grafo).");
    } else console.warn("Graphify não encontrado; seguindo só com o mapa.");
  }
  const novo = gerarMapa();
  writeFileSync(join(RAIZ, "docs", "mapa-do-codigo.md"), novo);
  console.log(`docs/mapa-do-codigo.md: ${novo.split("\n").length - 1} linhas`);
}
