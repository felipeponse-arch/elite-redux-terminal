// Roda cada seção da suíte (scripts/smoke_tests/NN_*.js) SOZINHA, num contexto
// de navegador novo, com armazenamento limpo (item Q1 da pauta técnica,
// 2026-09-16). Mostra quais seções só passam por causa do estado deixado pelas
// anteriores - dependência escondida que já derrubou testes em cascata.
//
// Uso: npm run test:isolated   (dev server rodando em http://localhost:8100)
import { chromium } from "playwright";

const BASE_URL = process.env.CI_SMOKE_BASE_URL || "http://localhost:8100";

async function main() {
  const resp = await fetch(`${BASE_URL}/artifact_final.html`);
  await resp.arrayBuffer();
  const manifest = await (await fetch(`${BASE_URL}/scripts/smoke_tests/manifest.json`)).json();
  const secoes = manifest
    .map((f) => f.match(/^(\d\d)_/))
    .filter((m) => m && m[1] !== "00" && m[1] !== "99")
    .map((m) => "section" + m[1]);

  const browser = await chromium.launch();
  let totalFalhas = 0;
  const resumo = [];
  try {
    for (const secao of secoes) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const erros = [];
      page.on("pageerror", (err) => erros.push(err.message));
      await page.goto(`${BASE_URL}/artifact_final.html?mock_db=1`, { waitUntil: "load" });
      const results = await page.evaluate(async ({ secao }) => {
        const base = "/scripts/smoke_tests/";
        const manifest = await (await fetch(base + "manifest.json")).json();
        let combined = "";
        for (const file of manifest) {
          if (file.startsWith("99_")) continue;
          combined += (await (await fetch(base + file)).text()) + "\n";
        }
        combined += `\nwindow.__rodarSecao = async function () { results.length = 0; try { await ${secao}(); } catch (e) { results.push({ name: "EXCEÇÃO na seção: " + e.message, pass: false, detail: "" }); } return results.slice(); };\n`;
        // eslint-disable-next-line no-eval -- carregador da suíte: roda os arquivos de scripts/smoke_tests na página
        (0, eval)(combined);
        return await window.__rodarSecao();
      }, { secao });
      await context.close();
      const falhas = results.filter((r) => !r.pass);
      totalFalhas += falhas.length + erros.length;
      resumo.push({ secao, total: results.length, falhas, erros });
      console.log(`${falhas.length || erros.length ? "FALHA" : "ok   "}  ${secao}: ${results.length - falhas.length}/${results.length}${erros.length ? "  (pageerror: " + erros[0] + ")" : ""}`);
      for (const f of falhas) console.log(`         - ${f.name}${f.detail ? "  (" + JSON.stringify(f.detail).slice(0, 160) + ")" : ""}`);
    }
  } finally {
    await browser.close();
  }
  const secoesComFalha = resumo.filter((r) => r.falhas.length || r.erros.length).length;
  console.log(`\n=== seções isoladas: ${resumo.length - secoesComFalha}/${resumo.length} passaram sozinhas ===`);
  if (totalFalhas) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Falha ao rodar as seções isoladas:", err);
  process.exitCode = 1;
});
