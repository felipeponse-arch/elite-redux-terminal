// Interações com cliques e teclado de verdade (Playwright), onde a suíte de
// dentro da página não chega: tempo real entre digitar e clicar, tamanho de
// tela, foco.
import { test, expect, abrirApp, abrirAba } from "./apoio.mjs";

// Bug achado na fase 6 (2026-09-24): no computador, digitar na busca com uma
// ficha aberta deixava a ficha congelada - "+ Time" continuava ativo depois
// de adicionar, porque o redesenho conferia uma classe que a busca tira.
test("ficha aberta continua atualizando depois de digitar na busca (computador)", async ({ page }) => {
  await abrirApp(page);
  await abrirAba(page, "dex");
  await page.locator("#search-input").fill("Charizard");
  await page.locator("#species-list .species-row", { hasText: "Charizard" }).first().click();
  await expect(page.locator("#species-detail h2")).toHaveText("Charizard");
  // Procura outro Pokémon sem fechar a ficha (no computador ela segue na tela).
  await page.locator("#search-input").fill("Pikachu");
  await expect(page.locator("#species-list .species-row").first()).toContainText("Pikachu");
  await expect(page.locator("#species-detail h2")).toBeVisible();
  await page.locator("#add-team-btn").click();
  await expect(page.locator("#add-team-btn"), "a ficha mostra que já está no time").toBeDisabled();
  await expect(page.locator("#add-team-btn")).toHaveText("No time");
});

test("no celular, digitar na busca volta pra lista e a ficha some", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await abrirApp(page);
  await abrirAba(page, "dex");
  await page.locator("#species-list .species-row", { hasText: "Charizard" }).first().click();
  await expect(page.locator("#species-detail")).toBeVisible();
  await expect(page.locator("#species-list")).toBeHidden();
  await page.locator("#search-input").fill("Pika");
  await expect(page.locator("#species-list")).toBeVisible();
  await expect(page.locator("#species-detail")).toBeHidden();
});
