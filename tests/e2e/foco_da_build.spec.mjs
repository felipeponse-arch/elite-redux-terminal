// Chips de papel/dano do cartão do Meu Time ligados a buildFocadaDoMotor (fatia 2c, 07/11/2026):
// clicar mostra a SUGESTÃO sem aplicar nada; "Usar esta build" aplica; build própria ativa pede confirmação.
import { test, expect, abrirApp, abrirAba, adicionarAoTimePelaDex } from "./apoio.mjs";

const cartao = (page) => page.locator("#team-slots .team-slot").first();
const rotuloDoCartao = (page) => cartao(page).locator(".ts-build").first().locator(".ts-build-label");

async function timeComBlastoise(page) {
  await abrirApp(page);
  await adicionarAoTimePelaDex(page, "Blastoise");
  await abrirAba(page, "team");
  await expect(cartao(page).locator(".cm-foco").first()).toBeVisible();
}

test("clicar no chip mostra a sugestão, marca o chip e não aplica nada", async ({ page }) => {
  await timeComBlastoise(page);
  const antes = await rotuloDoCartao(page).textContent();
  const chip = cartao(page).locator('.cm-foco[data-foco="Misto"]');
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await expect(cartao(page).locator(".build-sugerida")).toBeHidden();
  await chip.click();
  const sug = cartao(page).locator(".build-sugerida");
  await expect(sug).toBeVisible();
  await expect(sug.locator(".bs-foco")).toHaveText("Misto");
  await expect(sug.locator(".bs-usar")).toBeVisible();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(rotuloDoCartao(page)).toHaveText(antes); // a build do cartão continua a mesma
  // clicar de novo fecha
  await chip.click();
  await expect(sug).toBeHidden();
  await expect(chip).toHaveAttribute("aria-pressed", "false");
});

test("trocar de chip troca a sugestão; Fechar esconde", async ({ page }) => {
  await timeComBlastoise(page);
  await cartao(page).locator('.cm-foco[data-foco="Misto"]').click();
  await cartao(page).locator('.cm-foco[data-foco="Pivo"]').click();
  await expect(cartao(page).locator(".build-sugerida")).toBeVisible();
  await expect(cartao(page).locator('.cm-foco[data-foco="Misto"]')).toHaveAttribute("aria-pressed", "false");
  await expect(cartao(page).locator('.cm-foco[data-foco="Pivo"]')).toHaveAttribute("aria-pressed", "true");
  await cartao(page).locator(".bs-fechar").click();
  await expect(cartao(page).locator(".build-sugerida")).toBeHidden();
});

test("Usar esta build aplica como build do cartão (sem build própria, sem confirmação)", async ({ page }) => {
  await timeComBlastoise(page);
  await cartao(page).locator('.cm-foco[data-foco="Misto"]').click();
  await cartao(page).locator(".bs-usar").click();
  await expect(page.locator("#confirm-modal")).not.toBeVisible();
  await expect(rotuloDoCartao(page)).toHaveText("Sugestão do app");
  await expect(cartao(page).locator(".build-sugerida")).toBeHidden();
});

test("build própria ativa pede confirmação antes de ser passada por cima", async ({ page }) => {
  await abrirApp(page);
  await abrirAba(page, "dex");
  await page.locator("#search-input").fill("Blastoise");
  await page.locator("#species-list .species-row", { hasText: "Blastoise" }).first().click();
  await page.locator("#mybuild-nature").selectOption("Modest");
  await page.locator("#mybuild-item").fill("Life Orb");
  await page.locator("#mybuild-save").click();
  await page.locator("#add-team-btn").click();
  await abrirAba(page, "team");
  await expect(rotuloDoCartao(page)).toHaveText("Meu build");
  await cartao(page).locator('.cm-foco[data-foco="Misto"]').click();
  await cartao(page).locator(".bs-usar").click();
  const modal = page.locator("#confirm-modal");
  await expect(modal).toBeVisible();
  await expect(rotuloDoCartao(page)).toHaveText("Meu build"); // nada mudou ainda
  await page.locator("#confirm-modal-cancel").click();
  await expect(rotuloDoCartao(page)).toHaveText("Meu build");
  await cartao(page).locator(".bs-usar").click();
  await page.locator("#confirm-modal-ok").click();
  await expect(rotuloDoCartao(page)).toHaveText("Sugestão do app");
});
