// Ticket 13 (07/10): texto de tela usa o caractere … (U+2026), nunca três pontos.
// Vale para src/ui/*.js, src/regras/*.js, artifact_template.html e data/changelog.json
// (aparece na aba Progresso). Fora do alcance de propósito: comentários de código e os
// prompts da IA (src/regras/prompts_ia.js - EXCEÇÃO explícita), onde "..." é formato de
// exemplo mandado ao modelo, não texto que o jogador lê.
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
  codigo.split(/\r?\n/).forEach((linha, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(linha)) return; // linha inteira de comentário
    // Varre a linha: literais de string valem; um // fora de string abre comentário até o fim.
    const re = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/.*$/g;
    for (const m of linha.matchAll(re)) {
      if (m[0].startsWith("//")) break;
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

test("nenhuma mensagem de tela em src/regras tem três pontos (exceto prompts_ia.js)", () => {
  const dir = path.join(RAIZ, "src", "regras");
  const sobras = [];
  for (const arq of fs.readdirSync(dir).filter((f) => f.endsWith(".js") && f !== "prompts_ia.js")) {
    for (const s of literaisComTresPontos(ler("src/regras/" + arq))) sobras.push(arq + ":" + s);
  }
  assert.deepEqual(sobras, []);
});

test("data/changelog.json (aba Progresso) não tem três pontos", () => {
  const sobras = [];
  for (const dia of JSON.parse(ler("data/changelog.json"))) {
    for (const item of dia.items) if (item.includes("...")) sobras.push(dia.date + ": " + item.slice(0, 90));
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
