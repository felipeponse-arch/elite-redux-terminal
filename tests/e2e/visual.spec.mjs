// Regressão visual: compara prints das telas principais com as imagens de
// referência em tests/visual_baselines/ (comparador do próprio Playwright,
// mesma tolerância do script antigo: 0,5% dos pixels, limiar de cor 0,15).
//
// Mudança visual de propósito: `npm run test:visual -- --update-snapshots`
// regrava as referências - conferir as imagens novas antes de versionar.
import { test, expect, abrirApp, abrirAba } from "./apoio.mjs";

const TOLERANCIA = { maxDiffPixelRatio: 0.005, threshold: 0.15 };

test.beforeEach(async ({ page }) => {
  await abrirApp(page);
  // O aviso de configurar a run aparece numa instalação nova e empurraria a
  // tela - não é o que estes prints conferem.
  await page.evaluate(() => { const b = document.getElementById("run-setup-banner"); if (b) b.hidden = true; });
});

async function abrirFicha(page, nome) {
  await abrirAba(page, "dex");
  await page.locator("#search-input").fill(nome);
  await expect(page.locator("#species-list .species-row").first()).toContainText(nome);
  await page.locator("#species-list .species-row").first().click();
  await expect(page.locator("#species-detail h2")).toHaveText(nome);
}

test("ficha do Charizard na Dex", async ({ page }) => {
  await abrirFicha(page, "Charizard");
  await expect(page).toHaveScreenshot("dex-charizard-detail.png", TOLERANCIA);
});

test("aba Meu Time com um membro", async ({ page }) => {
  await abrirFicha(page, "Pikachu");
  await page.locator("#add-team-btn").click();
  await abrirAba(page, "team");
  await expect(page).toHaveScreenshot("team-tab-seeded.png", TOLERANCIA);
});

test("aba PC Box com um Pokémon", async ({ page }) => {
  await abrirFicha(page, "Eevee");
  await page.locator("#add-box-btn").click();
  await abrirAba(page, "box");
  await expect(page).toHaveScreenshot("pcbox-tab-seeded.png", TOLERANCIA);
});

test("lista de chefões", async ({ page }) => {
  await abrirAba(page, "bosses");
  await expect(page).toHaveScreenshot("bosses-tab-list.png", TOLERANCIA);
});
