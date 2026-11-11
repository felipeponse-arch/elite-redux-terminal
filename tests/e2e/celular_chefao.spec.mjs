// Celular (390 px): "Time do chefão" fechado mostra os sprites do time e a contagem; a legenda do rank some com a ficha aberta.
import { test, expect, abrirApp, abrirAba } from "./apoio.mjs";

test.use({ viewport: { width: 390, height: 844 } });

test("Time do chefão fechado: faixa de sprites com a contagem certa", async ({ page }) => {
  await abrirApp(page);
  await abrirAba(page, "bosses");
  await page.locator("#boss-list .species-row").first().click();
  const bloco = page.locator("#boss-detail details.sanfona-time");
  await expect(bloco).toHaveCount(1);
  expect(await bloco.evaluate((d) => d.open)).toBe(false);
  // Contagem esperada = cartões do time dentro do bloco (mesmos dados que o desktop mostra).
  const n = await bloco.locator(".boss-mon-card").count();
  expect(n).toBeGreaterThan(0);
  await expect(bloco.locator(".sanfona-faixa .spr")).toHaveCount(n);
  await expect(bloco.locator("summary .sanfona-info")).toContainText(n + " Pokémon · nível ");
  await expect(bloco.locator(".sanfona-faixa")).toBeVisible();
  await bloco.locator("> summary").click();
  await expect(bloco.locator(".sanfona-faixa")).toBeHidden();
});

test("legenda do rank some com a ficha aberta e volta na lista", async ({ page }) => {
  await abrirApp(page);
  await abrirAba(page, "dex");
  await expect(page.locator(".rank-legenda")).toBeVisible();
  await page.locator("#species-list .species-row").first().click();
  await expect(page.locator("#species-detail h2")).toBeVisible();
  await expect(page.locator(".rank-legenda")).toBeHidden();
  await page.locator("#dex-shell .back-btn, #back-to-list").first().click();
  await expect(page.locator(".rank-legenda")).toBeVisible();
});
