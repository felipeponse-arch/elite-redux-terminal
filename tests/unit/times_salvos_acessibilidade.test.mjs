// TK-28 (achados de acessibilidade): o cartão do time salvo gera HTML acessível.
// Fatia a função do src/ui/time.js e roda num contexto mínimo (mesmo método de telas_efetividade_real).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { lerComMutacao } from "./carregar_regras.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fonte = lerComMutacao("src/ui/time.js", "time.js"); // sabotagem controlada (tests/unit/mutacoes.mjs)
const ini = fonte.indexOf("function htmlDoCartaoDoTimeSalvo(");
const fim = fonte.indexOf("\n  }\n", ini);
assert.ok(ini > 0 && fim > ini, "função htmlDoCartaoDoTimeSalvo não encontrada em time.js");

const ctx = vm.createContext({
  escapeHtml: (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"),
  spriteImgHtml: (x, n) => '<img alt="" data-n="' + n + '">',
});
vm.runInContext(fonte.slice(ini, fim + 4), ctx);
const sp = (x, n) => ({ x, n });
const html = (editando) => ctx.htmlDoCartaoDoTimeSalvo({ name: 'Time "A"' }, 0, [sp(1, "Pikachu"), sp(2, "Eevee")], false, editando);

test("sprites do time salvo são <button> com nome acessível, não span role=button", () => {
  const h = html(false);
  assert.doesNotMatch(h, /<span[^>]*role="button"/);
  assert.match(h, /<button[^>]*class="goto-species[^"]*"[^>]*data-x="1"[^>]*aria-label="Ver Pikachu na Dex"/);
  assert.match(h, /aria-label="Ver Eevee na Dex"/);
});

test("input de renomear tem rótulo acessível", () => {
  const h = html(true);
  assert.match(h, /<input[^>]*id="stc-rename-input"[^>]*aria-label="Nome do time"/);
  assert.match(h, /value="Time &quot;A&quot;"/);
});

test("fora da edição não há input; Excluir continua passando pela confirmação", () => {
  assert.doesNotMatch(html(false), /<input/);
  assert.match(fonte, /openConfirmModal\(\s*"Excluir time salvo\?"/);
});

// Contraste do texto sobre a arte Aqua/Magma: medido em 28/10/2026 (pior pixel da arte x 3 temas): sem véu 2,6:1; com véu de 88% >= 5,7:1.
test("cabeçalho do chefão com arte tem véu atrás do texto (contraste AA medido)", () => {
  const css = readFileSync(join(raiz, "src", "css", "time_caixa.css"), "utf8");
  assert.match(css, /\.chefao-heroi \.detail-titles\s*\{[^}]*color-mix\(in srgb, var\(--surface\) 88%, transparent\)/);
});
