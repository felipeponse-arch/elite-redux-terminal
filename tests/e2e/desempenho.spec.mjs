// Desempenho da carga (fase 8 da refatoração, 2026-09-24).
//
// Medido antes da correção: a folha do Google Fonts travava a primeira pintura
// - a tela esperava a resposta do Google (232 ms com rede boa, 1.728 ms com a
// resposta levando 1,5 s). O JS da carga custa pouco (JSON.parse de todos os
// dados ~45 ms com CPU 4x mais lenta); o gargalo era a rede das fontes.
import { test, expect } from "./apoio.mjs";

const ATRASO_FONTES_MS = 3000;

test("a primeira pintura não espera as fontes do Google", async ({ page }) => {
  await page.route(/fonts\.googleapis\.com/, async (rota) => {
    await new Promise((ok) => setTimeout(ok, ATRASO_FONTES_MS));
    await rota.continue();
  });
  await page.goto("/artifact_final.html", { waitUntil: "domcontentloaded" });
  const primeiraPintura = await page.evaluate(() => new Promise((ok) => {
    const achar = () => performance.getEntriesByType("paint").find((e) => e.name === "first-contentful-paint");
    const e = achar();
    if (e) return ok(e.startTime);
    new PerformanceObserver(() => { const x = achar(); if (x) ok(x.startTime); }).observe({ type: "paint", buffered: true });
  }));
  expect(primeiraPintura, `primeira pintura em ${Math.round(primeiraPintura)} ms com as fontes levando ${ATRASO_FONTES_MS} ms`).toBeLessThan(ATRASO_FONTES_MS / 2);
  // E as fontes do app entram quando chegam.
  await page.waitForFunction(() => window.__fontesProntas === true, null, { timeout: ATRASO_FONTES_MS + 10_000 });
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('15px "Figtree"'))).toBe(true);
});
