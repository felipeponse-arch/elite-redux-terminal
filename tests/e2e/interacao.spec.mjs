// Interações com cliques e teclado de verdade (Playwright), onde a suíte de
// dentro da página não chega: tempo real entre digitar e clicar, tamanho de
// tela, foco.
import { test, expect, abrirApp, abrirAba, adicionarAoTimePelaDex } from "./apoio.mjs";

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

// Fase 7 (2026-09-24): a busca dos Chefões ficou sem estilo nenhum porque a
// pele dos campos era repetida por id e ninguém repetiu pra ela; e nenhum
// campo herdava a fonte do app. Todo campo visível, em todas as abas, usa a
// classe .campo e a fonte do app.
test("todo campo de formulário usa a pele .campo e a fonte do app", async ({ page }) => {
  // Campos com visual próprio de propósito (e o motivo).
  const EXCECOES = {
    "mybuild-num": "grade compacta de IV/EV, raio menor",
    "stc-rename-input": "modo de edição do nome, borda de destaque",
  };
  await abrirApp(page);
  const fora = [];
  const conferir = async (onde) => {
    const achados = await page.evaluate((excecoes) => {
      const fonteDoApp = getComputedStyle(document.body).fontFamily;
      return [...document.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea")]
        .filter((el) => el.offsetParent !== null)
        .filter((el) => ![...el.classList].some((c) => c in excecoes) && !(el.id in excecoes))
        .filter((el) => !el.classList.contains("campo") || (!el.classList.contains("mono") && getComputedStyle(el).fontFamily !== fonteDoApp))
        .map((el) => el.id || el.className || el.outerHTML.slice(0, 60));
    }, EXCECOES);
    for (const a of achados) fora.push(`${onde}: ${a}`);
  };
  for (const aba of ["dex", "team", "box", "bosses", "progress", "types"]) {
    await abrirAba(page, aba);
    await conferir(aba);
  }
  await abrirAba(page, "dex");
  await page.locator("#species-list .species-row").first().click();
  await page.locator("#species-detail details").evaluateAll((ds) => ds.forEach((d) => { d.open = true; }));
  await conferir("ficha");
  await abrirAba(page, "bosses");
  await page.locator("#boss-list .species-row").first().click();
  await conferir("chefão");
  expect(fora, "campos sem .campo ou sem a fonte do app").toEqual([]);
});

// Primeira espécie com DUAS curadas no dado real (Lepastry, builds da
// comunidade de 24/09/2026): o card do time mostra a do estilo que o Ritmo
// pede, e troca quando o Ritmo muda.
test("espécie com duas curadas mostra a do estilo do Ritmo", async ({ page }) => {
  await abrirApp(page);
  await adicionarAoTimePelaDex(page, "Lepastry");
  await abrirAba(page, "team");
  const card = page.locator(".team-slot").first();
  await expect(card).toContainText("Gooey");
  await page.locator('.arch-chip[data-axis="pace"][data-value="Hyper Offense"]').click();
  await expect(card).toContainText("ofensivo", { ignoreCase: true });
  await expect(card).toContainText("Gladiator");
  await page.locator('.arch-chip[data-axis="pace"][data-value="Stall"]').click();
  await expect(card).toContainText("defensivo", { ignoreCase: true });
  await expect(card).toContainText("Gooey");
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
