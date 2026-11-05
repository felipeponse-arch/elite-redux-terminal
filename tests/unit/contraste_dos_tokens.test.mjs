// Ticket design-2026-11-04/01 (TK-60): razões WCAG dos pares principais de tokens nos 3 temas (claro, escuro, alto contraste).
// Piso: 4,5:1 para texto; 3:1 para componentes de UI (borda, foco). Lê src/css/tokens.css; não muda cor de tipo (TYPE_META).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../../src/css/tokens.css", import.meta.url), "utf8");
function bloco(inicio) {
  const i = css.indexOf(inicio);
  assert.ok(i >= 0, "bloco não achado: " + inicio);
  const fim = css.indexOf("\n}", i);
  const v = {};
  for (const m of css.slice(i, fim).matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)) v[m[1]] = m[2];
  return v;
}
const claro = bloco(":root {");
const temas = {
  claro,
  escuro: { ...claro, ...bloco(':root[data-theme="dark"] {') },
  "alto contraste": { ...claro, ...bloco(':root[data-high-contrast="true"] {') },
};

const lum = (h) => [1, 3, 5].map((i) => {
  const v = parseInt(h.slice(i, i + 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const razao = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

const fundos = ["--bg", "--surface", "--surface-2", "--surface-3"];
const textos = ["--text", "--text-dim", "--badge-text-dim", "--badge-accent", "--badge-accent2", "--badge-resist", "--aviso",
  "--sem-weak", "--sem-resist", "--sem-immune", "--cat-aqua", "--cat-magma", "--cat-frontier", "--cat-elite", "--cat-super"];
// [texto, fundo, piso, nome]  (--text-dim sobre os 4 fundos também cobre o aviso .sem-sprite da ficha e da lista)
const pares = [];
for (const t of textos) for (const f of fundos) pares.push([t, f, 4.5, "texto"]);
for (const f of ["--accent", "--accent-strong", "--badge-accent2"]) pares.push(["--accent-ink", f, 4.5, "botão/chip/banner"]);
for (const f of fundos) pares.push(["--focus", f, 3, "foco"]);
// EXCEÇÃO documentada: --border (claro #a9a38a, escuro #585c4a) fica entre 1,77 e 2,84:1 sobre os fundos. É a identidade visual
// dos cartões e muda o app inteiro; decisão do usuário (05/11): fica, exceção decorativa (ticket design-2026-11-04/01). Por isso não entra nos pares.

for (const [tema, v] of Object.entries(temas)) {
  test("contraste dos tokens no tema " + tema, () => {
    const falhas = [];
    for (const [t, f, piso, tipo] of pares) {
      assert.ok(v[t] && v[f], "token inexistente no tema " + tema + ": " + t + " / " + f);
      const r = razao(v[t], v[f]);
      if (r < piso) falhas.push(tipo + " " + t + " " + v[t] + " sobre " + f + " " + v[f] + " = " + r.toFixed(2) + " (piso " + piso + ")");
    }
    assert.deepEqual(falhas, []);
  });
}
