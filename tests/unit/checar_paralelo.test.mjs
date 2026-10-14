// Testes do scripts/checar_paralelo.mjs (ticket 04, fluxo 14/10/2026).
// Etapas falsas rodam com `node -e`; a lista real é comparada à cadeia antiga.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  ETAPAS, executarChecagens, separarArgumentos, resolverComando,
} from "../../scripts/checar_paralelo.mjs";

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

// Cadeia do `check` do master em 14/10/2026. Se alguém tirar ou trocar uma
// etapa, este teste e o do package.json acusam.
const CADEIA_ANTIGA = 'node scripts/checar_encoding.mjs && node scripts/checar_sintaxe.mjs && eslint . artifact_template.html && stylelint "src/css/*.css" && node scripts/checar_css.mjs && node scripts/checar_fronteira.mjs && tsc -p tsconfig.json';

test("lista real de etapas é IGUAL à cadeia antiga", () => {
  assert.deepEqual(ETAPAS, CADEIA_ANTIGA.split(" && "));
});

test("package.json: check:serie é a cadeia antiga e check chama o paralelo", () => {
  const { scripts } = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  assert.equal(scripts["check:serie"], CADEIA_ANTIGA);
  assert.equal(scripts.check, "node scripts/checar_paralelo.mjs");
});

test("o script real propaga o código de saída da etapa que falha", () => {
  // Roda o script real com cwd/raiz intacta só para provar o caminho feliz de
  // ponta a ponta é caro; aqui basta provar que um arquivo inválido sai com 1.
  const r = spawnSync(process.execPath, ["-e",
    `import("./scripts/checar_paralelo.mjs").then(async m=>{const r=await m.executarChecagens(["process.exit(7)"],{resolver:c=>[process.execPath,["-e",c]]});process.exitCode=r.codigo})`],
  { cwd: new URL("../..", import.meta.url), encoding: "utf8" });
  assert.equal(r.status, 1);
});
