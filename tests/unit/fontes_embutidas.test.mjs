// Fontes embutidas (05/11/2026): o app não pode depender do Google Fonts.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const raiz = new URL("../../", import.meta.url);
const ler = (p) => readFileSync(new URL(p, raiz), "utf8");

test("artifact_final.html não referencia o Google Fonts", () => {
  const html = ler("artifact_final.html");
  assert.ok(!html.includes("fonts.googleapis.com"));
  assert.ok(!html.includes("fonts.gstatic.com"));
});

test("artifact_final.html tem @font-face em base64 das 4 famílias (Big Shoulders no lugar da Potta One)", () => {
  const html = ler("artifact_final.html");
  for (const familia of ["Bricolage Grotesque", "Figtree", "IBM Plex Mono", "Big Shoulders Display"]) {
    const re = new RegExp(String.raw`@font-face\s*\{[^}]*font-family:\s*"${familia}"[^}]*url\(data:font/woff2;base64,[A-Za-z0-9+/=]{1000,}\)`);
    assert.match(html, re, `falta @font-face embutido de ${familia}`);
  }
  assert.ok(!/__FONTE_[A-Z0-9_]+_DATAURI__/.test(html), "placeholder de fonte sobrou no arquivo");
});

test("os pesos declarados de cada família continuam no CSS", () => {
  const css = ler("src/css/fontes.css");
  const esperado = [["Bricolage Grotesque", "500 800"], ["Figtree", "400 700"], ["IBM Plex Mono", "400"], ["IBM Plex Mono", "500"], ["IBM Plex Mono", "600"], ["Big Shoulders Display", "700 900"]];
  for (const [familia, peso] of esperado) {
    const re = new RegExp(String.raw`font-family:\s*"${familia}";[^}]*font-weight:\s*${peso}\s*;`);
    assert.match(css, re, `falta o peso ${peso} de ${familia}`);
  }
});

test("o template não cola base64 (fica legível)", () => {
  assert.ok(!ler("artifact_template.html").includes("base64,"));
});
