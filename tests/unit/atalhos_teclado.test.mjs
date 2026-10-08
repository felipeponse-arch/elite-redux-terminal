// Ticket 14 da dívida técnica (2026-10-08): atalhos que não são botão de verdade
// (.goto-species, .goto-species-strategies) só funcionam no teclado se o elemento
// nascer com tabindex="0" e role="button" - o ouvinte de Enter/Espaço é global, mas
// o Tab só chega em quem tem tabindex. Esta varredura pega um ponto novo esquecido.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "../..");
const arquivos = fs.readdirSync(path.join(RAIZ, "src/ui")).filter((f) => f.endsWith(".js"))
  .map((f) => ["src/ui/" + f, fs.readFileSync(path.join(RAIZ, "src/ui", f), "utf8")]);

test("todo markup de atalho para espécie nasce com tabindex=0 e role=button", () => {
  const furos = [];
  for (const [nome, texto] of arquivos) {
    // Pega cada abertura de tag que traz a classe do atalho dentro de uma string de HTML.
    const reTag = /<[a-z]+\b[^<>]*class=\\?"[^"]*\bgoto-species(?:-strategies)?\b[^"]*"[^<>]*>/g;
    for (const m of texto.matchAll(reTag)) {
      // Atributos podem vir depois de um fecha-e-reabre de string ('..." + x + "...'), então
      // olha a linha inteira em volta da tag.
      const ini = texto.lastIndexOf("\n", m.index) + 1;
      const fim = texto.indexOf("\n", m.index);
      const linha = texto.slice(ini, fim === -1 ? undefined : fim);
      if (!/tabindex="0"/.test(linha) || !/role="button"/.test(linha)) furos.push(nome + ": " + m[0].slice(0, 90));
    }
  }
  assert.deepEqual(furos, []);
});

test("os dois ouvintes globais (clique e Enter/Espaço) cobrem os dois atalhos", () => {
  const ficha = fs.readFileSync(path.join(RAIZ, "src/ui/dex_ficha.js"), "utf8");
  for (const classe of [".goto-species", ".goto-species-strategies"]) {
    const usos = ficha.split('closest(".' + classe.slice(1) + '")').length - 1;
    assert.equal(usos, 2, classe + ": um ouvinte de clique e um de teclado");
  }
  assert.match(ficha, /e\.key !== "Enter" && e\.key !== " "/, "teclado: Enter e Espaço");
});

test("a linha de golpe da tabela tem botão de verdade com aria-expanded e aria-controls", () => {
  const ficha = fs.readFileSync(path.join(RAIZ, "src/ui/dex_ficha.js"), "utf8");
  assert.match(ficha, /<button type="button" class="move-toggle" aria-expanded="false" aria-controls=/);
});
