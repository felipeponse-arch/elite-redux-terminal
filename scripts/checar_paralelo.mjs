// Checagens estáticas em paralelo (ticket 04 do fluxo 14/10/2026).
// Todas as etapas do `npm run check` são independentes: só leem o checkout e
// não geram arquivos consumidos por outra etapa. Rodam ao mesmo tempo, mas os
// resultados saem na ordem antiga e TODA falha aparece antes do código 1.
//
// A cadeia antiga com && continua em `npm run check:serie` (comparação e
// fallback). O teste tests/unit/checar_paralelo.test.mjs garante que as duas
// listas de etapas são iguais.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const BIN = (nome) => fileURLToPath(new URL(`../node_modules/${nome}`, import.meta.url));

// Comando de cada etapa, escrito exatamente como no `check:serie` do package.json.
// A ordem preserva a ordem de execução anterior.
export const ETAPAS = [
  "node scripts/checar_encoding.mjs",
  "node scripts/checar_sintaxe.mjs",
  "eslint . artifact_template.html",
  'stylelint "src/css/*.css"',
  "node scripts/checar_css.mjs",
  "node scripts/checar_fronteira.mjs",
  "tsc -p tsconfig.json",
];

const BINARIOS = {
  eslint: BIN("eslint/bin/eslint.js"),
  stylelint: BIN("stylelint/bin/stylelint.mjs"),
  tsc: BIN("typescript/bin/tsc"),
};

// Separa o comando em argumentos respeitando aspas duplas (o glob do stylelint
// chega SEM aspas, como o shell do npm entrega, e o stylelint expande sozinho).
export function separarArgumentos(comando) {
  return [...comando.matchAll(/"([^"]*)"|(\S+)/g)].map((m) => m[1] ?? m[2]);
}

// Traduz "eslint . x" em [node, [caminho do eslint.js, ".", "x"]]; sem shell,
// então funciona igual no Windows e no Linux.
export function resolverComando(comando) {
  const [programa, ...args] = separarArgumentos(comando);
  if (programa === "node") return [process.execPath, args];
  if (BINARIOS[programa]) return [process.execPath, [BINARIOS[programa], ...args]];
  return [programa, args];
}

const filhos = new Set();

function lancar(comando, resolver_ = resolverComando, cwd = RAIZ) {
  return new Promise((resolver) => {
    const [executavel, args] = resolver_(comando);
    const pedacos = [];
    let p;
    try {
      p = spawn(executavel, args, { cwd, shell: false });
    } catch (erro) {
      resolver({ comando, ok: false, saida: `Não foi possível iniciar ${executavel}: ${erro.message}` });
      return;
    }
    filhos.add(p);
    p.stdout.on("data", (d) => pedacos.push(d));
    p.stderr.on("data", (d) => pedacos.push(d));
    let acabou = false;
    const fim = (ok, extra = "") => {
      if (acabou) return;
      acabou = true;
      filhos.delete(p);
      const saida = (Buffer.concat(pedacos).toString("utf8") + extra).trimEnd();
      resolver({ comando, ok, saida });
    };
    p.on("error", (erro) => fim(false, `\nNão foi possível iniciar ${executavel}: ${erro.message}`));
    // código null = morto por sinal: conta como falha.
    p.on("close", (codigo, sinal) =>
      fim(codigo === 0, sinal ? `\nEncerrado pelo sinal ${sinal}.` : ""));
  });
}

// Função pura testável: lista de etapas injetável. Devolve o código de saída e
// escreve só pelos callbacks (saída e erro), sem tocar em process.
export async function executarChecagens(etapas, opcoes = {}) {
  const { saida = () => {}, erro = () => {}, silencioso = false, resolver: res, cwd } = opcoes;
  const inicio = Date.now();
  const resultados = await Promise.all(etapas.map((e) => lancar(e, res, cwd)));
  let falhou = false;
  for (const r of resultados) {
    if (r.saida) saida(r.saida);
    if (!r.ok) falhou = true;
  }
  const duracaoS = ((Date.now() - inicio) / 1000).toFixed(1);
  if (falhou) {
    const nomes = resultados.filter((r) => !r.ok).map((r) => r.comando).join("; ");
    erro(`\nchecar_paralelo: falharam ${resultados.filter((r) => !r.ok).length} de ${resultados.length} checagens (${duracaoS}s): ${nomes}`);
    return { codigo: 1, resultados };
  }
  if (!silencioso) saida(`checar_paralelo: ${resultados.length} checagens passaram em ${duracaoS}s.`);
  return { codigo: 0, resultados };
}

function encerrarFilhos() {
  for (const p of filhos) {
    try { p.kill(); } catch { /* já morreu */ }
  }
}

const ehPrincipal = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (ehPrincipal) {
  for (const sinal of ["SIGINT", "SIGTERM"]) {
    process.on(sinal, () => { encerrarFilhos(); process.exit(130); });
  }
  const silencioso = process.argv.includes("--silent") || process.env.npm_config_loglevel === "silent";
  const { codigo } = await executarChecagens(ETAPAS, {
    saida: (t) => console.log(t),
    erro: (t) => console.error(t),
    silencioso,
  });
  // exitCode (e não exit) deixa a saída em pipe esvaziar antes de encerrar.
  process.exitCode = codigo;
}
