// Ticket 13 (07/10): texto de tela usa o caractere … (U+2026), nunca três pontos.
// Vale para src/ui/*.js e artifact_template.html. Fora do alcance de propósito:
// comentários de código e os prompts da IA (src/regras/prompts_ia.js), onde "..." é
// formato de exemplo mandado ao modelo, não texto que o jogador lê.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ler = (rel) => fs.readFileSync(path.join(RAIZ, rel), "utf8");

// Literais de string "..." / '...' (com escapes) de uma linha; comentários de linha ficam de fora.
function literaisComTresPontos(codigo) {
  const achados = [];
  codigo.split("\n").forEach((linha, i) => {
    const semComentario = linha.replace(/^\s*(\/\/|\*|\/\*).*$/, "");
    for (const m of semComentario.matchAll(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g)) {
      if (m[0].includes("...")) achados.push((i + 1) + ": " + m[0].slice(0, 90));
    }
  });
  return achados;
}

test("nenhum texto de tela em src/ui tem três pontos", () => {
  const dir = path.join(RAIZ, "src", "ui");
  const sobras = [];
  for (const arq of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) {
    for (const s of literaisComTresPontos(ler("src/ui/" + arq))) sobras.push(arq + ":" + s);
  }
  assert.deepEqual(sobras, []);
});

test("nenhum placeholder/texto do artifact_template.html tem três pontos", () => {
  const sobras = [];
  ler("artifact_template.html").split("\n").forEach((linha, i) => {
    for (const m of linha.matchAll(/(placeholder|title|aria-label|alt)="[^"]*\.\.\.[^"]*"/g)) sobras.push((i + 1) + ": " + m[0]);
    if (/>[^<>]*\.\.\.[^<>]*</.test(linha)) sobras.push((i + 1) + ": " + linha.trim().slice(0, 90));
  });
  assert.deepEqual(sobras, []);
});

test("a regex que tira as reticências do rótulo da IA aceita … e ... (ia.js)", () => {
  const fonte = ler("src/ui/ia.js");
  const m = fonte.match(/rotulo\.replace\((\/[^\n]*?\/), ""\)/);
  assert.ok(m, "achou a regex do rótulo em chamarModelo");
  const re = new RegExp(m[1].slice(1, -1)); // corpo do literal de regex copiado do próprio código
  assert.equal("Consultando o Claude…".replace(re, ""), "Consultando o Claude");
  assert.equal("Consultando o Claude...".replace(re, ""), "Consultando o Claude");
  assert.equal("Gerando as builds…".replace(re, ""), "Gerando as builds");
  assert.equal("sem reticências".replace(re, ""), "sem reticências");
});
