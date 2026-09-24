// Suíte de comportamento (scripts/smoke_tests) no runner do Playwright.
//
// Cada seção roda SOZINHA, numa página nova com armazenamento limpo (o antigo
// test:isolated): pega teste que só passa por herdar estado da anterior, e uma
// exceção numa seção não derruba as outras - antes, um erro na seção 20
// abortava a suíte inteira sem dizer o que tinha passado.
//
// "sequência completa" roda todas em ordem na mesma página (o antigo test:ci):
// pega o contrário - uma seção que deixa o app num estado que quebra a seguinte.
import { readFileSync } from "node:fs";
import { test, abrirApp, carregarSuite, conferirChecagens } from "./apoio.mjs";

const manifest = JSON.parse(readFileSync(new URL("../../scripts/smoke_tests/manifest.json", import.meta.url), "utf8"));
const secoes = manifest
  .map((arquivo) => arquivo.match(/^(\d\d)_(.+)\.js$/))
  .filter((m) => m && m[1] !== "00" && m[1] !== "99");

// Primeiro no arquivo de propósito: é o teste mais longo, e começando antes ele
// roda em paralelo com as seções em vez de sobrar sozinho no fim.
test("sequência completa (todas as seções na mesma página)", async ({ page }) => {
  test.setTimeout(600_000);
  await abrirApp(page, { mockDb: true });
  await carregarSuite(page, { comOrquestrador: true });
  const checagens = await page.evaluate(() => window.__rodarTudo());
  conferirChecagens(checagens, "sequência completa");
});

for (const [, numero, nome] of secoes) {
  test(`seção ${numero} - ${nome.replace(/_/g, " ")}`, async ({ page }) => {
    await abrirApp(page, { mockDb: true });
    await carregarSuite(page);
    const checagens = await page.evaluate((fn) => window.__rodarSecao(fn), "section" + numero);
    conferirChecagens(checagens, "seção " + numero);
  });
}
