// Aba Progresso: cartões "O que o app fez sozinho" e "Novidades" compactos (desktop 1280 e celular 390).
import { test, expect, abrirApp, abrirAba } from "./apoio.mjs";
import { readFileSync } from "node:fs";

const CHANGELOG = JSON.parse(readFileSync(new URL("../../data/changelog.json", import.meta.url), "utf8"));
const TOTAL = CHANGELOG.reduce((n, e) => n + e.items.length, 0);
const PRINTS = process.env.PRINTS_NOVIDADES || "";

for (const [nome, vp, alvo] of [["desktop", { width: 1280, height: 800 }, 80], ["celular", { width: 390, height: 844 }, 140]]) {
  test.describe(nome, () => {
    test.use({ viewport: vp });
    test(`Novidades fechado <= ${alvo}px, só a última data aberta, abrir mostra todos os itens`, async ({ page }) => {
      await abrirApp(page);
      await abrirAba(page, "progress");
      const card = page.locator("#novidades-card");
      await card.scrollIntoViewIfNeeded();
      const h = (await card.boundingBox()).height;
      if (PRINTS) await page.locator("#view-progress").screenshot({ path: `${PRINTS}/${nome}_fechado.png` });
      expect(h).toBeLessThanOrEqual(alvo);
      expect(await card.evaluate((d) => d.open)).toBe(false);
      await expect(card.locator("summary.nov-resumo")).toContainText(CHANGELOG[0].date);
      // O auto-log vazio é uma linha só.
      const fez = page.locator(".card-fezsozinho");
      await expect(fez.locator("li")).toHaveCount(1);
      expect((await fez.boundingBox()).height).toBeLessThanOrEqual(alvo);
      await card.locator("summary.nov-resumo").click();
      const abertas = await card.locator("details.changelog-entry").evaluateAll((l) => l.map((d) => d.open));
      expect(abertas.length).toBe(CHANGELOG.length);
      expect(abertas.filter(Boolean).length).toBe(1);
      expect(abertas[0]).toBe(true);
      await expect(card.locator("li")).toHaveCount(TOTAL);
      const alvoToque = await card.locator("summary.nov-resumo").boundingBox();
      if (nome === "celular") expect(alvoToque.height).toBeGreaterThanOrEqual(44);
      if (PRINTS) await page.locator("#view-progress").screenshot({ path: `${PRINTS}/${nome}_aberto.png` });
      // Item: 2 linhas fechado, inteiro depois de clicar.
      const item = card.locator("details.changelog-entry[open] .nov-item").first();
      const antes = (await item.boundingBox()).height;
      await item.locator("summary").click();
      expect((await item.boundingBox()).height).toBeGreaterThanOrEqual(antes);
    });
  });
}
