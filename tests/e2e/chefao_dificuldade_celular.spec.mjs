// Celular (390x844): trocar a Dificuldade do chefão (Padrão, Insane, Hell) atualiza a faixa de sprites do "Time do chefão".
import { test, expect, abrirApp, abrirAba } from "./apoio.mjs";

test.use({ viewport: { width: 390, height: 844 } });

test("trocar Padrão, Insane e Hell atualiza a faixa de sprites do Time do chefão", async ({ page }, testInfo) => {
  await abrirApp(page);
  await abrirAba(page, "bosses");
  await page.locator("#boss-list .species-row").first().click();
  const faixas = new Set();
  for (const chave of ["party", "insane", "hell"]) {
    const chip = page.locator('#boss-detail [data-diff="' + chave + '"]');
    if (await chip.count() === 0) continue; // chefão sem esse time
    await chip.click();
    await expect(page.locator('#boss-detail [data-diff="' + chave + '"]')).toHaveAttribute("aria-pressed", "true");
    const bloco = page.locator("#boss-detail details.sanfona-time");
    const n = await bloco.locator(".boss-mon-card").count();
    expect(n).toBeGreaterThan(0);
    await expect(bloco.locator(".sanfona-faixa .spr")).toHaveCount(n);
    await expect(bloco.locator("summary .sanfona-info")).toContainText(n + " Pokémon");
    faixas.add(await bloco.locator(".sanfona-faixa").innerHTML());
    await page.screenshot({ path: testInfo.outputPath("chefao-" + chave + ".png") });
  }
  // O primeiro chefão tem que oferecer mais de uma Dificuldade, e a faixa muda de verdade entre elas.
  expect(await page.locator("#boss-detail [data-diff]").count()).toBeGreaterThan(1);
  expect(faixas.size).toBeGreaterThan(1);
});
