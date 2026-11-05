// Ticket design-2026-11-04/01 (TK-60): a sigla de 3 letras sobre a cor de cada tipo exige contraste >= 4,5:1 (WCAG AA).
// A cor do tipo nunca muda; só a tinta (tintaDoTipo). Lê TYPE_META e tintaDoTipo direto do artifact_template.html.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../../artifact_template.html", import.meta.url), "utf8").replace(/\r\n/g, "\n"); // checkout Windows vem com CRLF
const meta = html.match(/var TYPE_META = \{[\s\S]*?\n {2}\};/)[0];
const fn = html.match(/function tintaDoTipo\(hex\) \{[\s\S]*?\n {2}\}\n/)[0];
const { TYPE_META, tintaDoTipo } = new Function(meta + "\n" + fn + "\nreturn { TYPE_META, tintaDoTipo };")();

const lum = (h) => [1, 3, 5].map((i) => {
  const v = parseInt(h.slice(i, i + 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const razao = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

test("TYPE_META tem os 18 tipos", () => assert.equal(Object.keys(TYPE_META).length, 18));

test("sigla de cada tipo tem contraste >= 4,5:1 com a cor do tipo", () => {
  const falhas = Object.entries(TYPE_META)
    .map(([n, m]) => [n, m.hex, tintaDoTipo(m.hex), razao(m.hex, tintaDoTipo(m.hex))])
    .filter((x) => x[3] < 4.5)
    .map((x) => x[0] + " " + x[1] + " tinta " + x[2] + " = " + x[3].toFixed(2));
  assert.deepEqual(falhas, []);
});
