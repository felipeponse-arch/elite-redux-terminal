// TK-33b item 11 (TK-28): o véu atrás do texto do cabeçalho do chefão (Aqua/Magma) tem de garantir contraste AA
// em TODOS os temas, qualquer que seja o pixel da arte. Calcula o contraste a partir dos tokens e do alfa do véu
// que está no CSS; sem a regra (ou com véu fraco) o pior caso fica abaixo de 4,5:1.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lerComMutacao } from "./carregar_regras.mjs";

const css = lerComMutacao("src/css/time_caixa.css", "time_caixa.css");
const tokens = lerComMutacao("src/css/tokens.css", "tokens.css");

// Corpo do bloco que começa em `seletor {` (sem chaves aninhadas nos tokens).
function bloco(seletor) {
  const i = tokens.indexOf(seletor + " {");
  assert.ok(i >= 0, "seletor de tema não achado: " + seletor);
  return tokens.slice(i, tokens.indexOf("}", i));
}
const cor = (b, nome) => {
  const m = b.match(new RegExp("--" + nome + ":\\s*#([0-9a-fA-F]{6})\\b"));
  assert.ok(m, "token --" + nome);
  return [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16));
};
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const misturar = (frente, fundo, alfa) => frente.map((v, i) => v * alfa + fundo[i] * (1 - alfa));

const TEMAS = {
  claro: ":root",
  "escuro (sistema)": "  :root:not([data-theme=\"light\"])",
  "escuro (escolhido)": ":root[data-theme=\"dark\"]",
  "alto contraste": ":root[data-high-contrast=\"true\"]",
};

test("o véu existe no .detail-titles do cabeçalho com arte e o alfa sai do CSS", () => {
  const m = css.match(/\.chefao-heroi \.detail-titles\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--surface\) (\d+)%, transparent\)/);
  assert.ok(m, "regra do véu (.chefao-heroi .detail-titles com fundo --surface) sumiu");
  assert.ok(Number(m[1]) >= 80, "véu de " + m[1] + "% é fraco demais");
});

test("com o véu, texto e texto-fraco passam de 4,5:1 sobre qualquer pixel da arte, nos 4 temas", () => {
  const m = css.match(/\.chefao-heroi \.detail-titles\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--surface\) (\d+)%, transparent\)/);
  assert.ok(m, "regra do véu sumiu");
  const alfa = Number(m[1]) / 100;
  Object.entries(TEMAS).forEach(([tema, seletor]) => {
    const b = bloco(seletor);
    const surface = cor(b, "surface");
    ["text", "text-dim"].forEach((t) => {
      // O pior pixel da arte é preto ou branco: o contraste é monótono entre os dois, então os extremos limitam qualquer pixel.
      const pior = Math.min(...[[0, 0, 0], [255, 255, 255]].map((arte) => contraste(cor(b, t), misturar(surface, arte, alfa))));
      assert.ok(pior >= 4.5, tema + " --" + t + ": " + pior.toFixed(2) + ":1 com véu de " + alfa * 100 + "%");
    });
  });
});

test("sem o véu (arte crua atrás do texto) o pior caso reprova em algum tema: o teste enxerga a diferença", () => {
  const reprovados = Object.entries(TEMAS).filter(([, seletor]) => {
    const b = bloco(seletor);
    return ["text", "text-dim"].some((t) => Math.min(...[[0, 0, 0], [255, 255, 255]].map((arte) => contraste(cor(b, t), arte))) < 4.5);
  });
  assert.ok(reprovados.length > 0, "se isso passar a falhar, o cálculo não distingue com e sem véu");
});
