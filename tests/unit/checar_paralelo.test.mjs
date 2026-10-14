// Testes do scripts/checar_paralelo.mjs (ticket 04, fluxo 14/10/2026).
// Etapas falsas rodam com `node -e`; a lista real é comparada à cadeia antiga.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  ETAPAS, executarChecagens, separarArgumentos, resolverComando,
} from "../../scripts/checar_paralelo_lib.mjs";

// O comando fake É o código JS: o resolvedor injetado o passa para `node -e`.
const falso = (codigo) => [process.execPath, ["-e", codigo]];
async function rodar(etapas, extra = {}) {
  const saidas = [];
  const erros = [];
  const r = await executarChecagens(etapas, {
    resolver: falso, saida: (t) => saidas.push(t), erro: (t) => erros.push(t), ...extra,
  });
  return { ...r, saidas, erros };
}

test("tudo passa: código 0 e uma linha de resumo", async () => {
  const r = await rodar(["process.exit(0)", "console.log('a')"]);
  assert.equal(r.codigo, 0);
  assert.deepEqual(r.erros, []);
  assert.equal(r.saidas[0], "a");
  assert.match(r.saidas[1], /2 checagens passaram/);
});

test("modo silencioso não escreve o resumo", async () => {
  const r = await rodar(["process.exit(0)"], { silencioso: true });
  assert.deepEqual(r.saidas, []);
});

test("falha única: código 1, diagnóstico e nome da etapa no erro", async () => {
  const r = await rodar(["process.exit(0)", "console.log('quebrou');process.exit(3)"]);
  assert.equal(r.codigo, 1);
  assert.deepEqual(r.saidas, ["quebrou"]);
  assert.match(r.erros[0], /falharam 1 de 2/);
});

test("falha dupla: as duas aparecem, na ordem da lista", async () => {
  const r = await rodar([
    "setTimeout(()=>{console.log('lenta');process.exit(1)},400)",
    "console.log('rapida');process.exit(2)",
  ]);
  assert.equal(r.codigo, 1);
  assert.deepEqual(r.saidas, ["lenta", "rapida"]);
  assert.match(r.erros[0], /falharam 2 de 2/);
});

test("ordem de saída segue a lista, não quem termina primeiro", async () => {
  const r = await rodar([
    "setTimeout(()=>console.log('1-lenta'),300)",
    "console.log('2-rapida')",
  ], { silencioso: true });
  assert.deepEqual(r.saidas, ["1-lenta", "2-rapida"]);
});

test("etapas rodam de fato em paralelo", async () => {
  const t0 = Date.now();
  await rodar(Array(4).fill("setTimeout(()=>{},500)"));
  assert.ok(Date.now() - t0 < 1500, "4 etapas de 500 ms deveriam levar bem menos que 2 s");
});

test("stderr é preservado e a falha com stderr vira código 1", async () => {
  const r = await rodar(["console.error('erro-x');process.exit(1)"]);
  assert.equal(r.codigo, 1);
  assert.equal(r.saidas[0], "erro-x");
});

test("executável inexistente conta como falha, nunca como sucesso", async () => {
  const r = await executarChecagens(["x"], {
    resolver: () => ["programa-que-nao-existe-xyz", []], saida: () => {}, erro: () => {},
  });
  assert.equal(r.codigo, 1);
  assert.match(r.resultados[0].saida, /Não foi possível iniciar/);
});

test("processo morto por sinal conta como falha", async () => {
  const r = await rodar(["process.kill(process.pid,'SIGKILL')"]);
  assert.equal(r.codigo, 1);
});

test("separarArgumentos respeita aspas e resolverComando monta node + bin", () => {
  assert.deepEqual(separarArgumentos('stylelint "src/css/*.css"'), ["stylelint", "src/css/*.css"]);
  const [exe, args] = resolverComando("eslint . artifact_template.html");
  assert.equal(exe, process.execPath);
  assert.match(args[0], /eslint[\\/]bin[\\/]eslint\.js$/);
  assert.deepEqual(args.slice(1), [".", "artifact_template.html"]);
});


const RAIZ = fileURLToPath(new URL("../..", import.meta.url));
const pkg = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8"));
const LIB = new URL("../../scripts/checar_paralelo_lib.mjs", import.meta.url).href;

test("ETAPAS é IGUAL (comandos e argumentos) ao check:serie do package.json", () => {
  assert.deepEqual(ETAPAS, pkg.scripts["check:serie"].split(" && "));
  assert.equal(ETAPAS.length, 7);
  assert.equal(pkg.scripts.check, "node scripts/checar_paralelo.mjs");
});

test("entrada real chamada por JUNÇÃO executa o main (não falha aberta)", () => {
  const dir = mkdtempSync(join(tmpdir(), "paralelo-"));
  const juncao = join(dir, "juncao");
  try {
    symlinkSync(RAIZ, juncao, "junction");
    const r = spawnSync(process.execPath, [join(juncao, "scripts", "checar_paralelo.mjs"), "--listar"],
      { encoding: "utf8" });
    assert.equal(r.status, 0);
    assert.deepEqual(r.stdout.trim().split(/\r?\n/), pkg.scripts["check:serie"].split(" && "));
  } finally {
    rmSync(juncao, { force: true, recursive: false });
    rmSync(dir, { recursive: true, force: true });
  }
});

// Roda o main REAL como processo, com etapas falsas (node -e).
function mainComoProcesso(etapas) {
  const prog = `import(${JSON.stringify(LIB)}).then(m=>m.main(${JSON.stringify(etapas)},["--silent"]))`;
  return spawnSync(process.execPath, ["-e", prog], { encoding: "utf8" });
}
// main usa resolverComando: "node -e codigo" vira node + args.
const E = (js) => `node -e "${js}"`;

test("main real: código != 0 numa falha e a ordem da saída segue a lista", () => {
  const r = mainComoProcesso([
    E("setTimeout(()=>console.log('A-lenta'),300)"),
    E("console.log('B');process.exit(3)"),
  ]);
  assert.notEqual(r.status, 0);
  assert.ok(r.stdout.indexOf("A-lenta") < r.stdout.indexOf("B"));
});

test("main real: falha dupla mostra as duas e sai com 1", () => {
  const r = mainComoProcesso([E("console.log('X');process.exit(3)"), E("console.log('Y');process.exit(4)")]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /X/);
  assert.match(r.stdout, /Y/);
  assert.match(r.stderr, /falharam 2 de 2/);
});

test("main real: etapa que não inicia derruba com código != 0", () => {
  const r = mainComoProcesso(["programa-que-nao-existe-xyz --x"]);
  assert.notEqual(r.status, 0);
});

test("main real: tudo passando sai com 0", () => {
  assert.equal(mainComoProcesso([E("process.exit(0)")]).status, 0);
});
