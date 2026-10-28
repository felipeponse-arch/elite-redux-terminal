// Gera docs/mapa-do-codigo.md: por arquivo de src/regras, src/ui e scripts/*.mjs, a responsabilidade
// (1ª linha do comentário de topo) e as funções de nível superior com número de linha.
// Determinístico (ordem alfabética, sem data) para não gerar diff à toa.
// Graphify (não versionado): npm run mapa também gera graphify-in/app_colado.js e atualiza graphify-out/graph.json
//   (servidor MCP: graphify-mcp.exe <graph.json>).
// Uso: npm run mapa            (também roda o Graphify incremental, se o exe existir; falha dele não derruba)
//      node scripts/mapa_do_codigo.mjs --rapido   (só o mapa; é o que o pré-commit usa)
// Índice por regex (arquivo, responsabilidade, funções com linha) + docs/mapa/chamadas-*.md (quem chama quem entre
// arquivos, pela API do TypeScript, ~1,5 s; o pré-commit roda tudo isso, então o mapa versionado fica sempre consistente).
// Em conflito de junção em docs/mapa*: regenerar (npm run mapa -- --rapido).
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";
import { gerarChamadas, temTs } from "./mapa_chamadas.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const MAX_FUNCOES = 30;
// [pasta, título, filtro do nome, modo]: "f" = responsabilidade + funções; "t" = só responsabilidade (testes).
const PASTAS = [["src/regras", "Regras (lógica pura)", /\.js$/, "f"], ["src/ui", "Interface", /\.js$/, "f"], ["scripts", "Scripts (.mjs)", /\.mjs$/, "f"],
  ["scripts", "Scripts (.ps1)", /\.ps1$/, "f"], ["tests/unit", "Testes unitários (o que cobrem)", /\.test\.mjs$/, "t"]];

// Responsabilidade: 1ª linha de comentário com texto, ignorando o marcador "===== arquivo =====".
export function responsabilidade(linhas) {
  for (const l of linhas.slice(0, 15)) {
    const m = l.replace(/^\uFEFF/, "").match(/^\s*(?:\/\/|#)\s?(.*\S)/);
    if (!m || /^=+\s.*=+$/.test(m[1]) || /^!\/usr|^eslint|^@ts-/.test(m[1])) continue;
    return m[1].length > 140 ? m[1].slice(0, 137) + "..." : m[1];
  }
  return "(sem comentário de topo)";
}

// Funções de nível superior: mesma indentação da primeira linha de código (os arquivos de src/ são
// colados indentados no template). shortcut: regex, não parser; arrow assigned a var/const/let conta.
export function funcoes(texto, ehPs1 = false) {
  const linhas = texto.split("\n");
  const primeira = linhas.find((l) => l.trim() && !l.trim().startsWith("//"));
  const base = primeira ? primeira.match(/^\s*/)[0] : "";
  if (ehPs1) return linhas.flatMap((l, i) => { const m = l.match(/^\s*function\s+([A-Za-z_][\w-]*)/i); return m ? [[m[1], i + 1]] : []; });
  const re = new RegExp(String.raw`^${base}(?:export\s+)?\(?(?:async\s+)?(?:function\*?\s+([A-Za-z_$][\w$]*)|(?:var|const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>))`);
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
    "Uso: ache o arquivo aqui, depois abra só o trecho (`arquivo:linha`, offset/limit). Quem chama quem entre arquivos: [chamadas-regras](mapa/chamadas-regras.md), [chamadas-ui](mapa/chamadas-ui.md).",
  ];
  for (const [pasta, titulo, filtro, modo] of PASTAS) {
    saida.push("", `## ${titulo} - ${pasta}/`);
    const nomes = readdirSync(join(raiz, pasta)).filter((n) => filtro.test(n)).sort();
    for (const n of nomes) {
      const texto = readFileSync(join(raiz, pasta, n), "utf8").replace(/\r\n/g, "\n");
      const fs = modo === "t" ? [] : funcoes(texto, n.endsWith(".ps1"));
      const lista = fs.slice(0, MAX_FUNCOES).map(([f, l]) => `${f}:${l}`).join(", ");
      const resto = fs.length > MAX_FUNCOES ? ` (+${fs.length - MAX_FUNCOES})` : "";
      saida.push(`- **${n}** - ${responsabilidade(texto.split("\n"))}${fs.length ? `\n  ${lista}${resto}` : ""}`);
    }
  }
  return saida.join("\n") + "\n";
}

// Escreve o índice e os arquivos de chamadas; devolve os caminhos (relativos à raiz) para o git add.
export function escreverMapa(raiz = RAIZ) {
  mkdirSync(join(raiz, "docs", "mapa"), { recursive: true });
  const arqs = { "docs/mapa-do-codigo.md": gerarMapa(raiz) };
  if (temTs) { const ch = gerarChamadas(raiz); arqs["docs/mapa/chamadas-regras.md"] = ch.regras; arqs["docs/mapa/chamadas-ui.md"] = ch.ui; }
  else console.warn("mapa: TypeScript 5.9 não achado em teste/ferramentas/typescript-api; chamadas entre arquivos mantidas como estão.");
  for (const [p, txt] of Object.entries(arqs)) writeFileSync(join(raiz, p), txt);
  return Object.keys(arqs);
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
      // O app não usa import: para o Graphify ver chamada entre arquivos, src/regras + src/ui vão COLADOS num arquivo só
      // (como o build faz); .graphifyignore tira os originais. Cada arquivo começa com seu banner "// ===== src/... =====".
      mkdirSync(join(RAIZ, "graphify-in"), { recursive: true });
      const colado = ["src/regras", "src/ui"].flatMap((p) => readdirSync(join(RAIZ, p)).filter((n) => n.endsWith(".js")).sort().map((n) => readFileSync(join(RAIZ, p, n), "utf8"))).join("\n");
      writeFileSync(join(RAIZ, "graphify-in", "app_colado.js"), colado);
      const r = spawnSync(gx, ["extract", ".", "--code-only", "--no-cluster"], { cwd: RAIZ, stdio: "inherit", env: { ...process.env, GRAPHIFY_NO_AUTO_REFRESH: "1" } });
      if (r.status !== 0) console.warn("Graphify falhou; o mapa sai igual (ele não depende do grafo).");
    } else console.warn("Graphify não encontrado; seguindo só com o mapa.");
  }
  const feitos = escreverMapa();
  console.log(feitos.map((p) => `${p}: ${readFileSync(join(RAIZ, p), "utf8").split("\n").length - 1} linhas`).join("\n"));
}
