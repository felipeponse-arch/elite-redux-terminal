// Chamadas entre arquivos do app (src/regras + src/ui) pela API do TypeScript.
// Os arquivos são scripts sem import que dividem o escopo global (o build cola tudo no mesmo <script>),
// e o TypeScript os enxerga assim. Conta só referência a função de nível superior de OUTRO arquivo do app.
// Usa o TypeScript 5.9 de teste/ferramentas/typescript-api (fora do repo, como o Graphify): o "typescript" 7 do projeto é
// nativo e não tem API em JS. Sem ele (CI, outra máquina): ts = null e quem chama mantém os arquivos de chamadas como estão.
import { createRequire } from "node:module";
import { readdirSync, existsSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
function carregarTs() {
  let d = process.env.TS_API_DIR || dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 12 && !process.env.TS_API_DIR; i++) {
    if (existsSync(join(d, "ferramentas", "typescript-api", "node_modules", "typescript"))) { d = join(d, "ferramentas", "typescript-api"); break; }
    d = dirname(d);
  }
  try { return createRequire(join(d, "package.json"))("typescript"); } catch { return null; }
}
const ts = carregarTs();
export const temTs = !!(ts && ts.createProgram);

const TOP_N = 5;

// Chave de função: "regras/duelo.js:nome". Devolve { chama, chamadoPor, linha }:
// chama/chamadoPor: Map<chave, Map<chave, linhaDoUso>>; linha: Map<chave, linhaDaDeclaração>.
export function grafoDeChamadas(raiz, pastas = ["src/regras", "src/ui"]) {
  const arquivos = pastas.flatMap((p) => readdirSync(join(raiz, p)).filter((n) => n.endsWith(".js")).sort().map((n) => join(raiz, p, n)));
  const nomes = new Set(arquivos.map((a) => ts.sys.resolvePath(a)));
  const ehDoApp = (sf) => nomes.has(ts.sys.resolvePath(sf.fileName));
  const prog = ts.createProgram(arquivos, { allowJs: true, checkJs: false, noEmit: true, target: ts.ScriptTarget.ES2022, lib: ["lib.es2022.d.ts", "lib.dom.d.ts"], skipLibCheck: true, noResolve: true, types: [] });
  const chk = prog.getTypeChecker();
  const arq = (sf) => { const p = sf.fileName.split("/"); return `${p[p.length - 2]}/${basename(sf.fileName)}`; };
  const chama = new Map(), chamadoPor = new Map(), linha = new Map();
  const add = (m, a, b, l) => { if (!m.has(a)) m.set(a, new Map()); if (!m.get(a).has(b)) m.get(a).set(b, l); };
  const nivelSup = (dec, sf) => ts.isFunctionDeclaration(dec) ? dec.parent === sf : ts.isVariableDeclaration(dec) && dec.parent.parent.parent === sf;
  for (const sf of prog.getSourceFiles().filter(ehDoApp)) {
    for (const st of sf.statements) {
      let id = null;
      if (ts.isFunctionDeclaration(st) && st.name && st.body) id = st.name.text;
      else if (ts.isVariableStatement(st)) {
        const d = st.declarationList.declarations[0];
        if (d && ts.isIdentifier(d.name) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) id = d.name.text;
      }
      if (!id) continue;
      const de = `${arq(sf)}:${id}`;
      linha.set(de, sf.getLineAndCharacterOfPosition(st.getStart()).line + 1);
      const visita = (n) => {
        if (ts.isIdentifier(n)) {
          const s = chk.getSymbolAtLocation(n);
          const dec = s && s.declarations && s.declarations[0];
          const dsf = dec && dec.getSourceFile();
          if (dsf && dsf !== sf && ehDoApp(dsf) && nivelSup(dec, dsf)) {
            const para = `${arq(dsf)}:${s.name}`;
            const l = sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
            if (!linha.has(para)) linha.set(para, dsf.getLineAndCharacterOfPosition(dec.getStart()).line + 1);
            add(chama, de, para, l); add(chamadoPor, para, de, l);
          }
        }
        ts.forEachChild(n, visita);
      };
      visita(st);
    }
  }
  return { chama, chamadoPor, linha };
}

// Texto "a (arq:linha), b (arq:linha), +N" com as TOP_N primeiras em ordem alfabética (determinístico).
function lista(mapa, linha) {
  const ks = [...mapa.keys()].sort();
  const mostra = ks.slice(0, TOP_N).map((k) => { const [a, f] = k.split(":"); return `${f} (${a.split("/")[1]}:${linha.get(k) ?? "?"})`; });
  return mostra.join(", ") + (ks.length > TOP_N ? `, +${ks.length - TOP_N}` : "");
}

// Um arquivo por pasta: { "regras": texto, "ui": texto }. Só funções com ligação entre arquivos.
export function gerarChamadas(raiz) {
  const { chama, chamadoPor, linha } = grafoDeChamadas(raiz);
  const saida = {};
  for (const pasta of ["regras", "ui"]) {
    const out = [
      `# Chamadas entre arquivos - src/${pasta}/`,
      "",
      "Gerado por `npm run mapa` (scripts/mapa_chamadas.mjs, API do TypeScript); não edite à mão.",
      "Por função de nível superior: `chama:` e `chamado por:` funções de OUTROS arquivos de src/regras e src/ui, como `nome (arquivo:linha)`;",
      "no máximo 5 por lista, o resto vira `+N`. Referência vale também como callback. Chamada pelo template/HTML não aparece. Mapa geral: [mapa-do-codigo.md](../mapa-do-codigo.md).",
    ];
    const chaves = [...new Set([...chama.keys(), ...chamadoPor.keys()])].filter((k) => k.startsWith(pasta + "/")).sort();
    let atual = "";
    for (const k of chaves) {
      const [a, f] = k.split(":");
      if (a !== atual) { out.push("", `## ${a}`); atual = a; }
      const partes = [];
      if (chama.has(k)) partes.push(`chama: ${lista(chama.get(k), linha)}`);
      if (chamadoPor.has(k)) partes.push(`chamado por: ${lista(chamadoPor.get(k), linha)}`);
      out.push(`- ${f}:${linha.get(k) ?? "?"} - ${partes.join(" | ")}`);
    }
    saida[pasta] = out.join("\n") + "\n";
  }
  return saida;
}
